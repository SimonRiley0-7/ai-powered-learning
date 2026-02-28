// POST /api/courses/progress — update a specific module progress component
// Body: { moduleId, component, value, courseId }
// Components: lesson | video | practice | theory | task
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const WEIGHTS = {
    lesson: 0.20,
    video: 0.15,
    practice: 0.20,
    theory: 0.25,
    task: 0.20,
} as const;

type Component = keyof typeof WEIGHTS;

function recalcTotal(scores: Record<Component, number>): number {
    return Math.round(
        scores.lesson * WEIGHTS.lesson * 100 +
        scores.video * WEIGHTS.video * 100 +
        scores.practice * WEIGHTS.practice * 100 +
        scores.theory * WEIGHTS.theory * 100 +
        scores.task * WEIGHTS.task * 100
    );
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { moduleId, component, value, courseId } = body as {
        moduleId: string;
        component: Component;
        value: number; // 0–1
        courseId: string;
    };

    if (!moduleId || !component || value === undefined) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (!Object.keys(WEIGHTS).includes(component)) {
        return NextResponse.json({ error: "Invalid component" }, { status: 400 });
    }

    const userId = session.user.id;

    // Upsert the progress record
    const existing = await prisma.userModuleProgress.findUnique({
        where: { userId_moduleId: { userId, moduleId } },
    });

    const scores: Record<Component, number> = {
        lesson: existing?.lessonScore ?? 0,
        video: existing?.videoScore ?? 0,
        practice: existing?.practiceScore ?? 0,
        theory: existing?.theoryScore ?? 0,
        task: existing?.taskScore ?? 0,
    };
    scores[component] = Math.max(0, Math.min(1, value));

    const totalProgress = recalcTotal(scores);

    // State flags
    const flags: Record<string, boolean> = {};
    if (component === "lesson" && value >= 1) flags.lessonRead = true;
    if (component === "video" && value >= 1) flags.videoWatched = true;
    if (component === "theory" && value >= 1) flags.quizPassed = true;
    if (component === "practice" && value >= 1) flags.practiceSubmitted = true;
    if (component === "task" && value >= 1) flags.reflectionSubmitted = true;

    await prisma.userModuleProgress.upsert({
        where: { userId_moduleId: { userId, moduleId } },
        create: {
            userId,
            moduleId,
            lessonScore: scores.lesson,
            videoScore: scores.video,
            practiceScore: scores.practice,
            theoryScore: scores.theory,
            taskScore: scores.task,
            totalProgress,
            ...flags,
        },
        update: {
            lessonScore: scores.lesson,
            videoScore: scores.video,
            practiceScore: scores.practice,
            theoryScore: scores.theory,
            taskScore: scores.task,
            totalProgress,
            ...flags,
        },
    });

    // Check if entire course is now 100% and auto-generate certificate
    if (totalProgress >= 100 && courseId) {
        await maybeCertify(userId, courseId);
    }

    return NextResponse.json({ totalProgress, scores });
}

async function maybeCertify(userId: string, courseId: string) {
    const [course, moduleProgressList, enrollment, user] = await Promise.all([
        prisma.course.findUnique({ where: { id: courseId }, include: { modules: { select: { id: true } } } }),
        prisma.userModuleProgress.findMany({ where: { userId, module: { courseId } } }),
        prisma.courseEnrollment.findUnique({ where: { userId_courseId: { userId, courseId } } }),
        prisma.user.findUnique({ where: { id: userId }, select: { name: true, disabilityType: true } }),
    ]);

    if (!course || !enrollment || enrollment.completedAt) return;

    const allDone = course.modules.every((m) => {
        const p = moduleProgressList.find((p) => p.moduleId === m.id);
        return (p?.totalProgress ?? 0) >= 100;
    });

    if (!allDone) return;

    const avgScore =
        moduleProgressList.reduce((s, p) => s + p.totalProgress, 0) / moduleProgressList.length;

    const cert = await prisma.certificate.create({
        data: {
            userId,
            courseId,
            candidateName: user?.name ?? "Candidate",
            courseName: course.title,
            finalScore: Math.round(avgScore),
            modeUsed: user?.disabilityType ?? "NONE",
        },
    });

    await prisma.courseEnrollment.update({
        where: { id: enrollment.id },
        data: { completedAt: new Date(), certificateId: cert.id },
    });
}
