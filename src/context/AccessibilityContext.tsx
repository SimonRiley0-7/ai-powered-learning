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
                // If user manually changed the type recently, don't let the slow DB fetch override it.
                // Otherwise apply DB settings.
                setState(prev => {
                    if (prev.disabilityType !== "NONE" && prev.disabilityType !== settings.disabilityType) {
                        return prev; // Prioritize the local active selection over the slow DB fetch
                    }

                    const newType = settings.disabilityType || "NONE";
                    const preset = DISABILITY_MAP[newType as DisabilityType];

                    const nextState = {
                        ...DEFAULT_STATE,
                        ...preset,
                        disabilityType: newType,
                        highContrast: settings.highContrast !== undefined ? settings.highContrast : preset.highContrast,
                        largeText: settings.largeText !== undefined ? settings.largeText : preset.largeText,
                        largeInteractionMode: settings.largeInteractionMode !== undefined ? settings.largeInteractionMode : preset.largeInteractionMode,
                        simplifiedMode: settings.simplifiedMode !== undefined ? settings.simplifiedMode : preset.simplifiedMode,
                        voiceGuidanceEnabled: settings.voiceGuidanceEnabled !== undefined ? settings.voiceGuidanceEnabled : preset.voiceGuidanceEnabled,
                    };

                    if (typeof document !== "undefined") {
                        const body = document.body
                        body.classList.toggle("high-contrast", nextState.highContrast)
                        body.classList.toggle("large-text", nextState.largeText)
                        body.classList.toggle("large-interaction", nextState.largeInteractionMode)
                        body.classList.toggle("simplified-mode", nextState.simplifiedMode)
                        body.classList.toggle("aac-mode-active", nextState.aacEnabled)
                    }
                    return nextState;
                });
            }
        } catch (error) {
            console.error("Failed to fetch accessibility settings:", error)
        }
    }, [session])

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
