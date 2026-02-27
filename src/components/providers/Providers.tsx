"use client"

import { SessionProvider } from "next-auth/react"
import { VoiceProvider } from "@/context/VoiceContext"
import { AccessibilityProvider } from "@/context/AccessibilityContext"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <AccessibilityProvider>
                <VoiceProvider>
                    {children}
                </VoiceProvider>
            </AccessibilityProvider>
        </SessionProvider>
    )
}
