"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { VoiceInput } from "@/components/voice/VoiceInput"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { completeOnboarding } from "@/app/actions/user"
import { DisabilityType } from "@prisma/client"
import { useAccessibility } from "@/context/AccessibilityContext"

export default function OnboardingPage() {
    const router = useRouter()
    const { simplifiedMode, largeInteractionMode, setDisabilityProfile } = useAccessibility()
    const [name, setName] = useState("")
    const [role, setRole] = useState<"ADMIN" | "INSTRUCTOR" | "CANDIDATE">("CANDIDATE")
    const [isPWD, setIsPWD] = useState(false)
    const [disabilityType, setDisabilityType] = useState<DisabilityType>("NONE")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [step, setStep] = useState(1) // Only used in simplifiedMode

    // Pre-fill from localStorage on mount
    useEffect(() => {
        const temp = localStorage.getItem("temporaryAccessibilityProfile") as DisabilityType
        if (temp) {
            setDisabilityType(temp)
            if (temp !== "NONE") setIsPWD(true)
            // Sync the global context immediately so the onboarding UI adapts
            setDisabilityProfile(temp)
        }
    }, [setDisabilityProfile])

    // Focus heading on mount or step change
    const headingRef = useRef<HTMLHeadingElement>(null)
    useEffect(() => {
        headingRef.current?.focus()
    }, [step])

    // Focus error notice when it appears
    const errorRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (error) errorRef.current?.focus()
    }, [error])

    const handleNextStep = () => {
        if (step === 1 && !name.trim()) {
            setError("Full name is required.")
            return
        }
        setError(null)
        setStep(step + 1)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) {
            setError("Full name is required.")
            return
        }

        setError(null)
        setIsSubmitting(true)
        try {
            const res = await completeOnboarding({ name, role, isPWD, disabilityType })
            if (res.success) {
                // Clear temporary profile after successful permanent save
                localStorage.removeItem("temporaryAccessibilityProfile")
                router.push(res.redirectUrl)
            }
        } catch (err) {
            console.error("Failed to complete onboarding:", err)
            setError("Something went wrong. Please try again.")
            setIsSubmitting(false)
        }
    }

    return (
        <>
            {/* Skip-to-content */}
            <a
                href="#onboarding-main"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded focus:shadow focus:outline focus:outline-2 focus:outline-blue-500"
            >
                Skip to main content
            </a>

            <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
                <main id="onboarding-main" className="w-full max-w-md" aria-label="Profile setup">
                    <Card className={largeInteractionMode ? "p-4" : ""}>
                        <CardHeader>
                            <h1
                                ref={headingRef}
                                tabIndex={-1}
                                className={`${largeInteractionMode ? "text-3xl" : "text-2xl"} font-bold focus:outline-none`}
                                id="onboarding-heading"
                            >
                                {simplifiedMode ? `Step ${step} of 2` : "Complete Your Profile"}
                            </h1>
                            <p className={`${largeInteractionMode ? "text-lg" : "text-sm"} text-muted-foreground mt-1`}>
                                {simplifiedMode
                                    ? (step === 1 ? "Start with your basic info." : "Now tell us about your needs.")
                                    : "Please provide a few details to get started."}
                            </p>
                        </CardHeader>

                        <CardContent>
                            <div
                                role="status"
                                aria-live="polite"
                                aria-atomic="true"
                                ref={errorRef}
                                tabIndex={-1}
                                className="focus:outline-none"
                            >
                                {error && (
                                    <div
                                        role="alert"
                                        className="mb-4 rounded-md bg-destructive/10 border border-destructive text-destructive text-sm px-4 py-3"
                                    >
                                        <span className="sr-only">Error: </span>
                                        {error}
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8" noValidate aria-label="Complete profile form">
                                {/* Section 1: Personal Information */}
                                {(!simplifiedMode || step === 1) && (
                                    <section aria-labelledby="section-personal">
                                        <h2
                                            id="section-personal"
                                            className={`${largeInteractionMode ? "text-xl" : "text-base"} font-semibold mb-4 pb-1 border-b`}
                                        >
                                            Personal Information
                                        </h2>

                                        <div className="space-y-5">
                                            <div className="space-y-2">
                                                <Label htmlFor="name" className={largeInteractionMode ? "text-lg" : ""}>
                                                    Full Name
                                                    <span className="text-destructive ml-1" aria-hidden="true">*</span>
                                                </Label>
                                                <VoiceInput
                                                    id="name"
                                                    value={name}
                                                    onValueChange={(val) => setName(val)}
                                                    placeholder="John Doe"
                                                    required
                                                    aria-required="true"
                                                    aria-describedby="name-hint"
                                                    autoComplete="name"
                                                    className={largeInteractionMode ? "h-16 text-xl p-4" : "focus:outline focus:outline-2 focus:outline-blue-500"}
                                                />
                                                <p id="name-hint" className={`${largeInteractionMode ? "text-base" : "text-sm"} text-muted-foreground`}>
                                                    Enter your full legal name.
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="role-select" className={largeInteractionMode ? "text-lg" : ""}>
                                                    Role
                                                    <span className="text-destructive ml-1" aria-hidden="true">*</span>
                                                </Label>
                                                <Select
                                                    value={role}
                                                    onValueChange={(v) => setRole(v as "ADMIN" | "INSTRUCTOR" | "CANDIDATE")}
                                                    name="role"
                                                >
                                                    <SelectTrigger
                                                        id="role-select"
                                                        aria-required="true"
                                                        className={largeInteractionMode ? "h-16 text-xl" : "focus:outline focus:outline-2 focus:outline-blue-500"}
                                                    >
                                                        <SelectValue placeholder="Select your role" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="CANDIDATE">Candidate</SelectItem>
                                                        <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                                                        <SelectItem value="ADMIN">Administrator</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {simplifiedMode && (
                                            <Button
                                                type="button"
                                                onClick={handleNextStep}
                                                className="w-full mt-6 h-16 text-xl font-bold"
                                            >
                                                Next Step
                                            </Button>
                                        )}
                                    </section>
                                )}

                                {/* Section 2: Accessibility Preferences */}
                                {(!simplifiedMode || step === 2) && (
                                    <section aria-labelledby="section-accessibility">
                                        <h2
                                            id="section-accessibility"
                                            className={`${largeInteractionMode ? "text-xl" : "text-base"} font-semibold mb-4 pb-1 border-b`}
                                        >
                                            Accessibility Preferences
                                        </h2>

                                        <div className="rounded-lg border bg-background p-4 space-y-4">
                                            <label
                                                htmlFor="isPWD"
                                                className="flex items-start gap-3 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    id="isPWD"
                                                    name="isPwd"
                                                    checked={isPWD}
                                                    onChange={(e) => setIsPWD(e.target.checked)}
                                                    aria-expanded={isPWD}
                                                    aria-controls="pwd-section"
                                                    className={`${largeInteractionMode ? "h-6 w-6" : "h-4 w-4"} mt-1 cursor-pointer rounded border-gray-300 text-primary focus:outline focus:outline-2 focus:outline-blue-500`}
                                                />
                                                <span>
                                                    <span className={`${largeInteractionMode ? "text-xl" : "font-medium"} block`}>
                                                        I am a Person with Disability (PwD)
                                                    </span>
                                                    <span className={`${largeInteractionMode ? "text-base" : "text-sm"} text-muted-foreground mt-0.5 block`}>
                                                        Select this to verify via DigiLocker and enable tailored accessibility accommodations.
                                                    </span>
                                                </span>
                                            </label>

                                            <div className="space-y-2 pt-2 border-t text-left">
                                                <Label htmlFor="disability-type" className={largeInteractionMode ? "text-lg" : ""}>
                                                    Select Disability Type
                                                </Label>
                                                <Select
                                                    value={disabilityType}
                                                    onValueChange={(v) => {
                                                        setDisabilityType(v as DisabilityType)
                                                        setDisabilityProfile(v as DisabilityType) // Update global UI immediately
                                                    }}
                                                >
                                                    <SelectTrigger id="disability-type" className={largeInteractionMode ? "h-16 text-xl" : "focus:outline focus:outline-2 focus:outline-blue-500"}>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="NONE">None / General</SelectItem>
                                                        <SelectItem value="VISUAL">Visual Impairment</SelectItem>
                                                        <SelectItem value="MOTOR">Motor / Physical Impairment</SelectItem>
                                                        <SelectItem value="HEARING">Hearing Impairment</SelectItem>
                                                        <SelectItem value="COGNITIVE">Cognitive / Learning Impairment</SelectItem>
                                                        <SelectItem value="SPEECH">Speech Impairment</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div
                                            id="pwd-section"
                                            role="region"
                                            aria-label="Disability verification details"
                                            className={isPWD ? "mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm" : "sr-only"}
                                            aria-hidden={!isPWD}
                                        >
                                            <p className="text-blue-800 font-medium">
                                                After you continue, you&apos;ll be prompted to verify your disability certificate via DigiLocker.
                                            </p>
                                            <ul className="list-disc pl-5 mt-2 space-y-1 text-blue-700">
                                                <li>Your full certificate and Aadhaar details will never be stored.</li>
                                                <li>Only your disability type and percentage are saved.</li>
                                                <li>Accessibility tools will be automatically enabled based on your certificate.</li>
                                            </ul>
                                        </div>

                                        <div className="flex gap-4 mt-8">
                                            {simplifiedMode && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setStep(1)}
                                                    className="w-1/3 h-16 text-xl"
                                                >
                                                    Back
                                                </Button>
                                            )}
                                            <Button
                                                type="submit"
                                                className={`${simplifiedMode ? "w-2/3" : "w-full"} h-16 text-xl font-bold focus:outline focus:outline-2 focus:outline-blue-500`}
                                                disabled={isSubmitting || !name.trim()}
                                                aria-disabled={isSubmitting || !name.trim()}
                                            >
                                                {isSubmitting ? "Saving..." : "Complete Setup"}
                                            </Button>
                                        </div>
                                    </section>
                                )}
                            </form>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </>
    )
}
