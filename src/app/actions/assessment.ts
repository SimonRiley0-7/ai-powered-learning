"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { gradeEnterpriseAnswer, runAttemptLevelAnalysis } from "@/lib/ai/grading-engine"

// For Instructors to fetch their created assessments
export async function getInstructorAssessments() {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'INSTRUCTOR') throw new Error("Unauthorized")

    return await prisma.assessment.findMany({
        where: {
            users: {
                some: { id: session.user.id }
            }
        },
        include: {
            _count: {
                select: { questions: true, results: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    })
}

// For Candidates to list available assessments
export async function getAvailableAssessments() {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    return await prisma.assessment.findMany({
        include: {
            _count: { select: { questions: true } }
        },
        orderBy: { createdAt: 'desc' }
    })
}

// For taking an assessment
export async function getAssessmentWithQuestions(assessmentId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    return await prisma.assessment.findUnique({
        where: { id: assessmentId },
        include: {
            questions: true
        }
    })
}

// Start an Assessment Attempt
export async function startAttempt(assessmentId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId }
    })
    if (!assessment) throw new Error("Assessment not found")

    // Retrieve accessibility multiplier
    const settings = await prisma.accessibilitySettings.findUnique({
        where: { userId: session.user.id }
    })
    const multiplier = settings?.extraTimeMultiplier || 1.0

    const attempt = await prisma.attempt.create({
        data: {
            userId: session.user.id,
            assessmentId: assessment.id,
            extraTimeMultiplier: multiplier,
        }
    })

    return attempt.id
}

// ──────────────────────────────────────────────
// ENTERPRISE GRADING PIPELINE
// ──────────────────────────────────────────────

export async function submitAttempt(
    attemptId: string,
    userAnswers: Record<string, string>
) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const attempt = await prisma.attempt.findUnique({
        where: { id: attemptId, userId: session.user.id },
        include: { assessment: { include: { questions: true } } }
    })

    if (!attempt || attempt.submittedAt) {
        throw new Error("Invalid or already submitted attempt")
    }

    let totalScore = 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const answerRecords: any[] = []
    const gradingResults = []

    // ── Grade each question via Enterprise Engine ──
    for (const question of attempt.assessment.questions) {
        const response = userAnswers[question.id] || ""

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const q = question as any
        const questionMeta = {
            id: question.id,
            prompt: question.prompt,
            type: question.type,
            correctAnswer: question.correctAnswer,
            points: question.points,
            subject: q.subject as string | null,
            mandatoryKeywords: (q.mandatoryKeywords as string[]) || [],
            supportingKeywords: (q.supportingKeywords as string[]) || [],
            expectedStructure: q.expectedStructure as string | null,
            minWords: q.minWords as number | null,
            optimalWords: q.optimalWords as number | null,
            maxWords: q.maxWords as number | null,
            minPointsRequired: q.minPointsRequired as number | null,
        }

        const result = await gradeEnterpriseAnswer(questionMeta, response)

        totalScore += result.score
        gradingResults.push(result)

        answerRecords.push({
            attemptId: attempt.id,
            questionId: question.id,
            response,
            aiScore: result.score,
            aiFeedback: result.feedback,
            marksDistribution: result.marksDistribution,
            pointsValidation: result.pointsValidation,
            keywordAnalysis: result.keywordAnalysis,
            integrityFlags: result.integrityFlags,
            numericalValidation: result.numericalValidation,
            diagramEvaluation: result.diagramEvaluation,
        })
    }

    // ── Attempt-level analysis (originality + career mapping) ──
    const questions = attempt.assessment.questions.map(q => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const qAny = q as any
        return {
            id: q.id,
            prompt: q.prompt,
            type: q.type,
            correctAnswer: q.correctAnswer,
            points: q.points,
            subject: qAny.subject as string | null,
            mandatoryKeywords: (qAny.mandatoryKeywords as string[]) || [],
            supportingKeywords: (qAny.supportingKeywords as string[]) || [],
            expectedStructure: qAny.expectedStructure as string | null,
            minWords: qAny.minWords as number | null,
            optimalWords: qAny.optimalWords as number | null,
            maxWords: qAny.maxWords as number | null,
            minPointsRequired: qAny.minPointsRequired as number | null,
        }
    })

    const attemptAnalysis = await runAttemptLevelAnalysis(
        questions, userAnswers, gradingResults
    )

    // Apply originality metrics to all descriptive answer records
    for (const record of answerRecords) {
        record.originalityMetrics = attemptAnalysis.originalityMetrics
    }

    // Apply career mapping to the last answer record (or first AI subject answer)
    const aiQuestionIds = questions
        .filter(q =>
            q.subject?.toLowerCase().includes("ai") ||
            q.subject?.toLowerCase().includes("career")
        )
        .map(q => q.id)

    if (attemptAnalysis.careerMapping) {
        const targetRecord = answerRecords.find(r => aiQuestionIds.includes(r.questionId))
            || answerRecords[answerRecords.length - 1]
        if (targetRecord) {
            targetRecord.careerMapping = attemptAnalysis.careerMapping
        }
    }

    // ── Persist everything ──
    await prisma.$transaction([
        prisma.answer.createMany({ data: answerRecords }),
        prisma.attempt.update({
            where: { id: attempt.id },
            data: {
                submittedAt: new Date(),
                totalScore,
                gradingStatus: "AI_EVALUATED"
            }
        })
    ])

    return attempt.id
}
