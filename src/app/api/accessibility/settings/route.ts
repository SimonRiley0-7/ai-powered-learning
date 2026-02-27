import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            accessibilitySettings: true,
        },
    })

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const settings = user.accessibilitySettings
    const disabilityType = user.disabilityType

    // Priority logic:
    // If lockedBySupervisor is true, we strictly use the settings.
    // Otherwise, we take the disabilityType and merge it with any custom settings.

    return NextResponse.json({
        disabilityType,
        highContrast: settings?.highContrast ?? false,
        largeText: settings?.largeText ?? false,
        largeInteractionMode: settings?.largeInteractionMode ?? false,
        simplifiedMode: settings?.simplifiedMode ?? false,
        voiceGuidanceEnabled: settings?.voiceGuidanceEnabled ?? false,
        lockedBySupervisor: settings?.lockedBySupervisor ?? false,
    })
}
