// POST /api/courses/reflect — grade a reflection submission with Groq
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gradeReflection } from "@/lib/ai/groq-course";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { moduleId, content, courseId } = await req.json() as {
        moduleId: string;
        content: string;
        courseId: string;
    };

    if (!moduleId || !content?.trim()) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const module_ = await prisma.module.findUnique({
        where: { id: moduleId },
        select: { title: true, reflectionPrompt: true, minReflectionWords: true, reflectionRequired: true },
    });
    if (!module_) return NextResponse.json({ error: "Module not found" }, { status: 404 });

    const wordCount = content.trim().split(/\s+/).length;

    const grade = await gradeReflection(
        module_.reflectionPrompt,
        content,
        module_.title,
        module_.minReflectionWords,
    );

    // Store the reflection
    if (grade.approved) {
        await prisma.reflection.upsert({
            where: { id: `${session.user.id}-${moduleId}` },
            create: {
                id: `${session.user.id}-${moduleId}`,
                userId: session.user.id,
                moduleId,
                content,
                wordCount,
                aiScore: grade.score,
                aiFeedback: grade.feedback,
            },
            update: {
                content,
                wordCount,
                aiScore: grade.score,
                aiFeedback: grade.feedback,
                submittedAt: new Date(),
            },
        });

        // Update task/reflection progress component (task = 20%)
        if (grade.approved) {
            await fetch(`${process.env.NEXTAUTH_URL}/api/courses/progress`, {
                method: "POST",
                headers: { "Content-Type": "application/json", cookie: req.headers.get("cookie") ?? "" },
                body: JSON.stringify({ moduleId, component: "task", value: grade.score / 100, courseId }),
            });
        }
    }

    return NextResponse.json(grade);
}
