import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "INSTRUCTOR")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const candidates = await prisma.user.findMany({
        where: { role: "CANDIDATE" },
        select: {
            id: true,
            name: true,
            email: true,
            disabilityType: true,
            accessibilitySettings: {
                select: {
                    lockedBySupervisor: true,
                    lockedAt: true,
                    extraTimeMultiplier: true,
                    highContrast: true,
                    textToSpeech: true,
                    voiceNavigationEnabled: true,
                    largeInteractionMode: true,
                    simplifiedMode: true,
                }
            }
        },
        orderBy: { name: "asc" }
    })

    return NextResponse.json({ candidates })
}
