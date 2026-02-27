"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { gradeDescriptiveAnswer } from "@/lib/ai/gemini"

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

    // Normally you'd filter this by enrollment or something, but we'll return all
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
            questions: true // Fetch questions so we can render them
        }
    })
}

// Start an Assessment Attempt
export async function startAttempt(assessmentId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Fetch assessment logic
    const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId }
    })
    if (!assessment) throw new Error("Assessment not found")

    // Retrieve accessibility multiplier
    const settings = await prisma.accessibilitySettings.findUnique({
        where: { userId: session.user.id }
    })
    const multiplier = settings?.extraTimeMultiplier || 1.0

    // Record attempt
    const attempt = await prisma.attempt.create({
        data: {
            userId: session.user.id,
            assessmentId: assessment.id,
            extraTimeMultiplier: multiplier,
        }
    })

    return attempt.id
}

// Submit and intelligently grade an Attempt
export async function submitAttempt(
    attemptId: string,
    userAnswers: Record<string, string> // questionId -> response
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
    const answerRecords = []

    // Grade each question individually
    for (const question of attempt.assessment.questions) {
        const response = userAnswers[question.id] || ""
        let score = 0
        let feedback = null

        if (question.type === "MCQ") {
            // Immediate Deterministic Evaluation
            if (response === question.correctAnswer) {
                score = question.points
                feedback = "Correct"
            } else {
                feedback = "Incorrect"
            }
        } else if (question.type === "DESCRIPTIVE" || question.type === "SHORT_ANSWER") {
            // AI-Powered Natural Language Grading
            const result = await gradeDescriptiveAnswer(
                question.prompt,
                question.correctAnswer,
                response,
                question.points
            )
            score = result.score
            feedback = result.feedback
        }

        totalScore += score
        answerRecords.push({
            attemptId: attempt.id,
            questionId: question.id,
            response,
            aiScore: score,
            aiFeedback: feedback
        })
    }

    // Persist scores and transition Attempt Status
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
