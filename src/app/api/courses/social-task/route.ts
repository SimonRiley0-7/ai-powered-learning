// POST /api/courses/social-task — generate Groq social task breakdown
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateSocialTaskBreakdown } from "@/lib/ai/groq-course";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { moduleId, taskType, description, fearRating, whyDifficult } = await req.json() as {
        moduleId: string;
        taskType: string;
        description: string;
        fearRating?: number;
        whyDifficult?: string;
    };

    if (!moduleId || !description?.trim()) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Safety validation: reject clearly inappropriate content
    const lower = description.toLowerCase();
    const unsafe = ["harm", "stalk", "harass", "threaten", "assault", "illegal"].some((w) =>
        lower.includes(w)
    );
    if (unsafe) {
        return NextResponse.json(
            {
                error: "This task description contains content that cannot be supported on this platform. Please describe a safe social goal.",
            },
            { status: 422 }
        );
    }

    const breakdown = await generateSocialTaskBreakdown(
        description,
        fearRating ?? 5,
        whyDifficult ?? "I'm not sure"
    );

    // Store submission
    const submission = await prisma.taskSubmission.create({
        data: {
            userId: session.user.id,
            moduleId,
            taskType: taskType ?? "SAFE_TASK",
            description,
            fearRating,
            whyDifficult,
            aiBreakdown: JSON.stringify(breakdown.steps),
            aiFeedback: breakdown.encouragement,
        },
    });

    return NextResponse.json({ ...breakdown, submissionId: submission.id });
}
