import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { applyDisabilityProfile } from "@/lib/applyDisabilityProfile"
import { DisabilityType } from "@prisma/client"

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "INSTRUCTOR")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json() as { candidateId?: string; disabilityType?: string; lock?: boolean }
    const { candidateId, disabilityType, lock = false } = body

    if (!candidateId || !disabilityType) {
        return NextResponse.json({ error: "candidateId and disabilityType are required" }, { status: 400 })
    }

    if (!Object.values(DisabilityType).includes(disabilityType as DisabilityType)) {
        return NextResponse.json({ error: "Invalid disabilityType" }, { status: 400 })
    }

    const result = await applyDisabilityProfile(candidateId, disabilityType as DisabilityType, lock)

    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, settings: result.settings })
}
