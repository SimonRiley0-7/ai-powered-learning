"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { VoiceVerifyButton } from "@/components/voice/VoiceVerifyButton"
import { VerifyPageFocusManager } from "@/components/auth/VerifyPageFocusManager"
import { useAccessibility } from "@/context/AccessibilityContext"

const STATUS_MESSAGES: Record<string, string> = {
    PENDING: "Your verification is pending. Click the button below to verify via DigiLocker.",
    FAILED: "Your previous verification attempt failed. Please try again.",
    VERIFIED: "Successfully verified."
}

export default function VerifyPWDPage() {
    const { largeInteractionMode, simplifiedMode, voiceGuidanceEnabled } = useAccessibility()
    const [status, setStatus] = useState("PENDING")
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch("/api/user/verification-status")
                if (res.ok) {
                    const data = await res.json()
                    setStatus(data.status)
                }
            } catch (err) {
                console.error("Failed to fetch verification status:", err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchStatus()
    }, [])

    useEffect(() => {
        if (voiceGuidanceEnabled && !isLoading) {
            const msg = status === "PENDING"
                ? "Please verify your disability certificate via DigiLocker to enable accommodations."
                : "Verification check in progress."
            const utterance = new SpeechSynthesisUtterance(msg)
            window.speechSynthesis.speak(utterance)
        }
    }, [voiceGuidanceEnabled, status, isLoading])

    if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>

    const statusMessage = STATUS_MESSAGES[status] ?? "Please verify your disability certificate."

    return (
        <>
            <a
                href="#verify-main"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded focus:shadow focus:outline focus:outline-2 focus:outline-blue-500"
            >
                Skip to main content
            </a>

            <div className={`flex min-h-[80vh] items-center justify-center p-4 ${largeInteractionMode ? "pt-12" : ""}`}>
                <main id="verify-main" className={`w-full ${simplifiedMode ? "max-w-md" : "max-w-lg"}`} aria-label="Disability verification">
                    <VerifyPageFocusManager />

                    <Card className={`shadow-lg ${largeInteractionMode ? "p-4" : ""}`}>
                        <CardHeader className="text-center space-y-2">
                            <div
                                className={`mx-auto flex ${largeInteractionMode ? "h-20 w-20" : "h-16 w-16"} items-center justify-center rounded-full bg-blue-100`}
                                aria-hidden="true"
                            >
                                <span className={largeInteractionMode ? "text-4xl" : "text-3xl"}>🛡️</span>
                            </div>
                            <h1
                                id="verify-heading"
                                tabIndex={-1}
                                className={`${largeInteractionMode ? "text-3xl" : "text-2xl"} font-bold pt-4 focus:outline-none`}
                            >
                                {simplifiedMode ? "Step 2: Verification" : "Disability Verification"}
                            </h1>
                            <p id="verify-subtitle" className={`${largeInteractionMode ? "text-lg" : "text-base"} text-muted-foreground`}>
                                {simplifiedMode
                                    ? "Securely verify your certificate using DigiLocker."
                                    : "Verify your PwD certificate via India's DigiLocker (APISetu) to enable tailored accessibility accommodations automatically."}
                            </p>
                        </CardHeader>

                        <CardContent className="space-y-6 pt-4">
                            <div
                                role="status"
                                aria-live="assertive"
                                aria-atomic="true"
                                className="rounded-lg border bg-muted/30 p-4"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`font-medium ${largeInteractionMode ? "text-lg" : ""}`} id="status-label">Current Status:</span>
                                    <Badge
                                        variant={status === "FAILED" ? "destructive" : "secondary"}
                                        className={largeInteractionMode ? "text-base px-4 py-2" : "text-sm px-3 py-1"}
                                        aria-label={`Verification status: ${status}`}
                                    >
                                        {status}
                                    </Badge>
                                </div>
                                <p className={`${largeInteractionMode ? "text-base" : "text-sm"} text-muted-foreground mt-1`}>{statusMessage}</p>
                            </div>

                            {!simplifiedMode && (
                                <div className="space-y-4">
                                    <p className="font-semibold text-sm">Why DigiLocker?</p>
                                    <ul
                                        id="verify-description"
                                        className="list-disc pl-5 space-y-2 text-sm text-muted-foreground"
                                        aria-label="Benefits of DigiLocker verification"
                                    >
                                        <li>Instant & Secure — no manual document uploads.</li>
                                        <li>Privacy-first: only disability type/percentage are saved.</li>
                                        <li>Profiles are automatically configured for your needs.</li>
                                    </ul>
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="flex flex-col space-y-3">
                            <VoiceVerifyButton status={status} />

                            <Link
                                href="/dashboard"
                                className="w-full rounded focus:outline focus:outline-2 focus:outline-blue-500"
                            >
                                <button
                                    type="button"
                                    className={`w-full px-4 ${largeInteractionMode ? "py-4 text-lg" : "py-2 text-sm"} text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors`}
                                    aria-label="Skip verification and continue to dashboard"
                                >
                                    Skip for now
                                </button>
                            </Link>
                        </CardFooter>
                    </Card>
                </main>
            </div>
        </>
    )
}
