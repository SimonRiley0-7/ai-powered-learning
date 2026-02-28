// POST /api/courses/personalize — returns Groq-personalized lesson content
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generatePersonalizedExplanation, generateSimplifiedContent } from "@/lib/ai/groq-course";
import type { LearningProfile } from "@/lib/ai/groq-course";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { moduleId, simplified } = await req.json() as {
        moduleId: string;
        simplified?: boolean;
    };

    const [module_, user, learningProfile] = await Promise.all([
        prisma.module.findUnique({
            where: { id: moduleId },
            select: { conceptText: true, simplifiedText: true, title: true },
        }),
        prisma.user.findUnique({
            where: { id: session.user.id },
            select: { disabilityType: true },
        }),
        prisma.userLearningProfile.findUnique({ where: { userId: session.user.id } }),
    ]);

    if (!module_) return NextResponse.json({ error: "Module not found" }, { status: 404 });

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

    if (simplified) {
        const content = await generateSimplifiedContent(module_.conceptText, module_.title);
        return NextResponse.json(content);
    }

    const content = await generatePersonalizedExplanation(profile, module_.conceptText, module_.title);
    return NextResponse.json(content);
}
