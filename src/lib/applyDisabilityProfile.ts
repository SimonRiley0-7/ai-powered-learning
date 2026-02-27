// src/lib/applyDisabilityProfile.ts
"use server"

import { prisma } from "@/lib/prisma"
import { DisabilityType } from "@prisma/client"

/**
 * Accommodation presets per disability type.
 * Each preset covers only the relevant fields.
 */
type SettingsPatch = {
    highContrast?: boolean
    textToSpeech?: boolean
    speechToText?: boolean
    voiceNavigationEnabled?: boolean
    largeInteractionMode?: boolean
    autoAdvanceQuestions?: boolean
    extraTimeMultiplier?: number
    simplifiedMode?: boolean
    preferredInputMethod?: "KEYBOARD" | "VOICE" | "MIXED"
}

const DISABILITY_PRESETS: Record<DisabilityType, SettingsPatch> = {
    NONE: {
        highContrast: false,
        textToSpeech: false,
        speechToText: false,
        voiceNavigationEnabled: false,
        largeInteractionMode: false,
        autoAdvanceQuestions: false,
        extraTimeMultiplier: 1.0,
        simplifiedMode: false,
        preferredInputMethod: "KEYBOARD",
    },
    VISUAL: {
        highContrast: true,
        textToSpeech: true,
        largeInteractionMode: true,
        speechToText: false,
        voiceNavigationEnabled: false,
        autoAdvanceQuestions: false,
        extraTimeMultiplier: 1.5,
        simplifiedMode: false,
    },
    MOTOR: {
        voiceNavigationEnabled: true,
        speechToText: true,
        largeInteractionMode: true,
        autoAdvanceQuestions: true,
        extraTimeMultiplier: 1.5,
        highContrast: false,
        textToSpeech: false,
        simplifiedMode: false,
        preferredInputMethod: "VOICE",
    },
    HEARING: {
        simplifiedMode: true,
        highContrast: false,
        textToSpeech: false,
        speechToText: false,
        voiceNavigationEnabled: false,
        autoAdvanceQuestions: false,
        extraTimeMultiplier: 1.0,
        largeInteractionMode: false,
    },
    COGNITIVE: {
        simplifiedMode: true,
        extraTimeMultiplier: 1.5,
        autoAdvanceQuestions: false,
        largeInteractionMode: true,
        highContrast: false,
        textToSpeech: true,
        speechToText: false,
        voiceNavigationEnabled: false,
    },
    SPEECH: {
        voiceNavigationEnabled: false,
        speechToText: false,
        highContrast: false,
        textToSpeech: false,
        largeInteractionMode: false,
        autoAdvanceQuestions: false,
        extraTimeMultiplier: 1.0,
        simplifiedMode: false,
        preferredInputMethod: "KEYBOARD",
    },
}

interface ApplyProfileResult {
    success: boolean
    settings?: object
    error?: string
}

/**
 * Applies accessibility accommodations for a candidate based on their disability type.
 * @param userId     - Candidate's user ID
 * @param disability - DisabilityType enum value
 * @param lock       - If true, sets lockedBySupervisor=true and sets lockedAt
 */
export async function applyDisabilityProfile(
    userId: string,
    disability: DisabilityType,
    lock: boolean
): Promise<ApplyProfileResult> {
    try {
        const patch = DISABILITY_PRESETS[disability]

        const lockPayload = lock
            ? { lockedBySupervisor: true, lockedAt: new Date() }
            : { lockedBySupervisor: false, lockedAt: null }

        const settings = await prisma.accessibilitySettings.upsert({
            where: { userId },
            create: {
                userId,
                ...patch,
                ...lockPayload,
            },
            update: {
                ...patch,
                ...lockPayload,
            },
        })

        // Also update the user's disability type
        await prisma.user.update({
            where: { id: userId },
            data: { disabilityType: disability },
        })

        return { success: true, settings }
    } catch (error) {
        console.error("[applyDisabilityProfile] Error:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

/**
 * Reads the current accessibility settings for a user.
 */
export async function getAccessibilitySettings(userId: string) {
    return prisma.accessibilitySettings.findUnique({ where: { userId } })
}
