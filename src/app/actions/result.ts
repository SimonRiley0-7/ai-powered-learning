"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"


export async function getUserResults() {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    return await prisma.result.findMany({
        where: { userId: session.user.id },
        include: {
            assessment: {
                select: {
                    title: true,
                    subject: true,
                    passingScore: true,
                    _count: { select: { questions: true } }
                }
            }
        },
        orderBy: { startedAt: 'desc' }
    })
}
