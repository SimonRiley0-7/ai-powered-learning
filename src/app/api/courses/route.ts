// GET /api/courses — list all published courses with user enrollment status
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [courses, enrollments] = await Promise.all([
        prisma.course.findMany({
            where: { isPublished: true },
            include: {
                modules: { select: { id: true }, orderBy: { order: "asc" } },
                _count: { select: { enrollments: true } },
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.courseEnrollment.findMany({
            where: { userId },
            select: { courseId: true, completedAt: true, certificateId: true },
        }),
    ]);

    const enrolledMap = new Map(enrollments.map((e) => [e.courseId, e]));

    const result = courses.map((c) => {
        const enrollment = enrolledMap.get(c.id);
        return {
            id: c.id,
            title: c.title,
            description: c.description,
            subject: c.subject,
            skillLevel: c.skillLevel,
            durationHours: c.durationHours,
            courseType: c.courseType,
            thumbnailUrl: c.thumbnailUrl,
            moduleCount: c.modules.length,
            enrollmentCount: c._count.enrollments,
            enrolled: !!enrollment,
            completed: !!enrollment?.completedAt,
            certificateId: enrollment?.certificateId ?? null,
        };
    });

    return NextResponse.json(result);
}
