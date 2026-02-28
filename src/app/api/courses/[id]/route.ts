// GET /api/courses/[id] — course detail with modules + user progress
// POST /api/courses/[id]/enroll — enroll the current user
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    const [course, enrollment, moduleProgressList] = await Promise.all([
        prisma.course.findUnique({
            where: { id, isPublished: true },
            include: {
                modules: {
                    orderBy: { order: "asc" },
                    include: {
                        questions: { select: { id: true } },
                        _count: { select: { questions: true } },
                    },
                },
            },
        }),
        prisma.courseEnrollment.findUnique({ where: { userId_courseId: { userId, courseId: id } } }),
        prisma.userModuleProgress.findMany({ where: { userId, module: { courseId: id } } }),
    ]);

    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const progressMap = new Map(moduleProgressList.map((p) => [p.moduleId, p]));

    const modules = course.modules.map((m, idx) => {
        const progress = progressMap.get(m.id);
        // Module 1 always unlocked for enrolled users; others unlock when previous is 100%
        const prevProgress = idx === 0 ? null : progressMap.get(course.modules[idx - 1].id);
        const unlocked = idx === 0 || (prevProgress?.totalProgress ?? 0) >= 100;

        return {
            id: m.id,
            order: m.order,
            title: m.title,
            questionCount: m._count.questions,
            unlocked,
            totalProgress: progress?.totalProgress ?? 0,
            lessonRead: progress?.lessonRead ?? false,
            videoWatched: progress?.videoWatched ?? false,
            quizPassed: progress?.quizPassed ?? false,
            reflectionSubmitted: progress?.reflectionSubmitted ?? false,
            practiceSubmitted: progress?.practiceSubmitted ?? false,
            simplifiedMode: progress?.simplifiedMode ?? false,
        };
    });

    // Overall course progress = average of module progresses
    const overallProgress =
        modules.length > 0
            ? modules.reduce((sum, m) => sum + m.totalProgress, 0) / modules.length
            : 0;

    return NextResponse.json({
        id: course.id,
        title: course.title,
        description: course.description,
        objectives: course.objectives,
        outcomes: course.outcomes,
        subject: course.subject,
        skillLevel: course.skillLevel,
        durationHours: course.durationHours,
        courseType: course.courseType,
        thumbnailUrl: course.thumbnailUrl,
        enrolled: !!enrollment,
        completedAt: enrollment?.completedAt ?? null,
        certificateId: enrollment?.certificateId ?? null,
        overallProgress: Math.round(overallProgress),
        modules,
    });
}

export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const course = await prisma.course.findUnique({ where: { id, isPublished: true } });
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const enrollment = await prisma.courseEnrollment.upsert({
        where: { userId_courseId: { userId: session.user.id, courseId: id } },
        create: { userId: session.user.id, courseId: id },
        update: {},
    });

    return NextResponse.json({ enrolled: true, enrollmentId: enrollment.id });
}
