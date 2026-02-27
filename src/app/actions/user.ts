"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { DisabilityType } from "@prisma/client"
import { applyDisabilityProfile } from "@/lib/applyDisabilityProfile"

export async function getUserProfile() {
    const session = await auth()
    if (!session?.user?.email) return null

    return await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { pwdRequirements: true }
    })
}

export async function updateAccessibilityProfile(data: {
    isVisuallyImpaired: boolean;
    isHearingImpaired: boolean;
    isMotorImpaired: boolean;
    isCognitiveImpaired: boolean;
    requiresAssistiveTech?: boolean;
}) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const result = await prisma.pWDRequirements.upsert({
        where: { userId: session.user.id },
        create: {
            userId: session.user.id,
            ...data
        },
        update: {
            ...data
        }
    })

    revalidatePath('/dashboard')
    revalidatePath('/settings')
    return result
}

export async function completeOnboarding(data: {
    name: string;
    role: "ADMIN" | "INSTRUCTOR" | "CANDIDATE";
    isPWD: boolean;
    disabilityType: DisabilityType;
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            name: data.name,
            role: data.role,
        }
    });

    // Apply the selected disability profile immediately
    await applyDisabilityProfile(session.user.id, data.disabilityType, false);

    if (data.isPWD) {
        await prisma.pWDRequirements.upsert({
            where: { userId: session.user.id },
            create: { userId: session.user.id },
            update: {}
        });
    }

    revalidatePath('/');
    return { success: true, redirectUrl: data.isPWD ? "/dashboard/verify-pwd" : "/dashboard" };
}
