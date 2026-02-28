// GET /api/courses/[id]/modules/[moduleId] — module detail + user progress
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: courseId, moduleId } = await params;
    const userId = session.user.id;

    // Verify enrollment
    const enrollment = await prisma.courseEnrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) {
        return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
    }

    const [module_, progress, reflection, existingTasks] = await Promise.all([
        prisma.module.findUnique({
            where: { id: moduleId, courseId },
            include: {
                questions: {
                    select: { id: true, prompt: true, options: true, type: true, points: true, explanation: true },
                    orderBy: { id: "asc" },
                },
                course: { select: { courseType: true, title: true } },
            },
        }),
        prisma.userModuleProgress.findUnique({
            where: { userId_moduleId: { userId, moduleId } },
        }),
        prisma.reflection.findFirst({
            where: { userId, moduleId },
            orderBy: { submittedAt: "desc" },
        }),
        prisma.taskSubmission.findMany({
            where: { userId, moduleId },
            orderBy: { submittedAt: "desc" },
            take: 10,
        }),
    ]);

    if (!module_) return NextResponse.json({ error: "Module not found" }, { status: 404 });

    return NextResponse.json({
        id: module_.id,
        courseId,
        courseTitle: module_.course.title,
        courseType: module_.course.courseType,
        order: module_.order,
        title: module_.title,
        conceptText: module_.conceptText,
        simplifiedText: module_.simplifiedText,
        videoUrl1: module_.videoUrl1,
        videoUrl2: module_.videoUrl2,
        practicePrompt: module_.practicePrompt,
        reflectionPrompt: module_.reflectionPrompt,
        reflectionRequired: module_.reflectionRequired,
        minReflectionWords: module_.minReflectionWords,
        questions: module_.questions,
        // Progress
        progress: progress
            ? {
                totalProgress: progress.totalProgress,
                lessonRead: progress.lessonRead,
                videoWatched: progress.videoWatched,
                quizPassed: progress.quizPassed,
                reflectionSubmitted: progress.reflectionSubmitted,
                practiceSubmitted: progress.practiceSubmitted,
                simplifiedMode: progress.simplifiedMode,
                quizFailCount: progress.quizFailCount,
                lessonScore: progress.lessonScore,
                videoScore: progress.videoScore,
                practiceScore: progress.practiceScore,
                theoryScore: progress.theoryScore,
                taskScore: progress.taskScore,
            }
            : null,
        existingReflection: reflection
            ? { content: reflection.content, wordCount: reflection.wordCount, aiScore: reflection.aiScore, aiFeedback: reflection.aiFeedback }
            : null,
        taskSubmissions: existingTasks.map((t) => ({
            id: t.id,
            taskType: t.taskType,
            description: t.description,
            fearRating: t.fearRating,
            aiBreakdown: t.aiBreakdown,
            aiFeedback: t.aiFeedback,
            submittedAt: t.submittedAt,
        })),
    });
}
