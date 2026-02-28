// POST /api/courses/recommendations — generate AI course recommendations
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateAIRecommendations } from "@/lib/ai/groq-course";
import type { LearningProfile } from "@/lib/ai/groq-course";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [user, learningProfile, enrollments, allCourses] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { disabilityType: true } }),
        prisma.userLearningProfile.findUnique({ where: { userId } }),
        prisma.courseEnrollment.findMany({
            where: { userId },
            include: { course: { select: { title: true } } },
        }),
        prisma.course.findMany({ where: { isPublished: true }, select: { title: true } }),
    ]);

    const profile: LearningProfile = {
        disabilityType: user?.disabilityType ?? "NONE",
        weakTopics: learningProfile?.weakTopics ?? [],
        strongTopics: learningProfile?.strongTopics ?? [],
        avgQuizAccuracy: learningProfile?.avgQuizAccuracy ?? 50,
        avgReflectionQuality: learningProfile?.avgReflectionQuality ?? 50,
        learningSpeed: learningProfile?.learningSpeed ?? "NORMAL",
        emotionalTone: learningProfile?.emotionalTone ?? "NEUTRAL",
        preferSimplified: learningProfile?.preferSimplified ?? false,
        socialConfidenceScore: learningProfile?.socialConfidenceScore ?? null,
    };

    const enrolledTitles = enrollments.map((e) => e.course.title);
    const availableTitles = allCourses.map((c) => c.title).filter((t) => !enrolledTitles.includes(t));

    const recommendations = await generateAIRecommendations(profile, enrolledTitles, availableTitles);

    return NextResponse.json(recommendations);
}
