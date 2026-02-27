"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { DisabilityType } from "@prisma/client"
import { useSession } from "next-auth/react"

interface AccessibilityState {
    disabilityType: DisabilityType
    highContrast: boolean
    largeText: boolean
    largeInteractionMode: boolean
    simplifiedMode: boolean
    voiceGuidanceEnabled: boolean
    aacEnabled: boolean
}

interface AccessibilityContextType extends AccessibilityState {
    setDisabilityProfile: (type: DisabilityType) => void
    toggleVoiceGuidance: () => void
    refreshSettings: () => Promise<void>
}

const DEFAULT_STATE: AccessibilityState = {
    disabilityType: "NONE",
    highContrast: false,
    largeText: false,
    largeInteractionMode: false,
    simplifiedMode: false,
    voiceGuidanceEnabled: false,
    aacEnabled: false,
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

const DISABILITY_MAP: Record<DisabilityType, Partial<AccessibilityState>> = {
    NONE: {
        highContrast: false,
        largeText: false,
        largeInteractionMode: false,
        simplifiedMode: false,
        voiceGuidanceEnabled: false,
        aacEnabled: false,
    },
    VISUAL: {
        highContrast: true,
        largeText: true,
        voiceGuidanceEnabled: true,
        largeInteractionMode: true,
        aacEnabled: false,
    },
    MOTOR: {
        largeInteractionMode: true,
        voiceGuidanceEnabled: true,
        aacEnabled: false,
    },
    COGNITIVE: {
        simplifiedMode: true,
        largeText: true,
        largeInteractionMode: true,
        aacEnabled: true,
    },
    HEARING: {
        simplifiedMode: true,
        voiceGuidanceEnabled: false,
        aacEnabled: false,
    },
    SPEECH: {
        voiceGuidanceEnabled: false,
        aacEnabled: true,
    },
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession()
    const [state, setState] = useState<AccessibilityState>(DEFAULT_STATE)

    const applyProfile = useCallback((type: DisabilityType, customSettings?: Partial<AccessibilityState>) => {
        const preset = DISABILITY_MAP[type]
        const newState = { ...DEFAULT_STATE, ...preset, ...customSettings, disabilityType: type }
        setState(newState)

        // Apply global CSS classes to body
        if (typeof document !== "undefined") {
            const body = document.body
            body.classList.toggle("high-contrast", newState.highContrast)
            body.classList.toggle("large-text", newState.largeText)
            body.classList.toggle("large-interaction", newState.largeInteractionMode)
            body.classList.toggle("simplified-mode", newState.simplifiedMode)
            body.classList.toggle("aac-mode-active", newState.aacEnabled)
        }
    }, [])

    const refreshSettings = useCallback(async () => {
        if (!session?.user) {
            // Priority 4: LocalStorage temporary selection
            const temp = localStorage.getItem("temporaryAccessibilityProfile") as DisabilityType
            if (temp && DISABILITY_MAP[temp]) {
                applyProfile(temp)
            }
            return
        }

        try {
            const res = await fetch("/api/accessibility/settings")
            if (res.ok) {
                const settings = await res.json()
                // Priority 1-3: Supervisor Lock > Verified Settings > DB Profile
                applyProfile(settings.disabilityType || "NONE", {
                    highContrast: settings.highContrast,
                    largeText: settings.largeText,
                    largeInteractionMode: settings.largeInteractionMode,
                    simplifiedMode: settings.simplifiedMode,
                    voiceGuidanceEnabled: settings.voiceGuidanceEnabled,
                })
            }
        } catch (error) {
            console.error("Failed to fetch accessibility settings:", error)
        }
    }, [session, applyProfile])

    useEffect(() => {
        refreshSettings()
    }, [refreshSettings])

    const setDisabilityProfile = (type: DisabilityType) => {
        applyProfile(type)
        if (!session?.user) {
            localStorage.setItem("temporaryAccessibilityProfile", type)
        }
    }

    const toggleVoiceGuidance = () => {
        setState(prev => ({ ...prev, voiceGuidanceEnabled: !prev.voiceGuidanceEnabled }))
    }

    return (
        <AccessibilityContext.Provider value={{ ...state, setDisabilityProfile, refreshSettings, toggleVoiceGuidance }}>
            {children}
        </AccessibilityContext.Provider>
    )
}

export function useAccessibility() {
    const context = useContext(AccessibilityContext)
    if (context === undefined) {
        throw new Error("useAccessibility must be used within an AccessibilityProvider")
    }
    return context
}
