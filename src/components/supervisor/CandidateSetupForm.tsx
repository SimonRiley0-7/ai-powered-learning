"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

type DisabilityType = "NONE" | "VISUAL" | "MOTOR" | "HEARING" | "COGNITIVE" | "SPEECH"

interface CandidateSetupFormProps {
    candidateId: string
    candidateName: string
    currentDisability: DisabilityType
}

const DISABILITY_PREVIEWS: Record<DisabilityType, { label: string; color: string; accommodations: string[] }> = {
    NONE: {
        label: "No Disability",
        color: "bg-gray-50 border-gray-200",
        accommodations: ["Default platform settings", "Candidate controls their own preferences"],
    },
    VISUAL: {
        label: "Visual Impairment",
        color: "bg-purple-50 border-purple-200",
        accommodations: [
            "✅ High Contrast Mode",
            "✅ Text-to-Speech on questions",
            "✅ Large interaction mode",
            "✅ 1.5× extra time",
        ],
    },
    MOTOR: {
        label: "Motor Impairment",
        color: "bg-blue-50 border-blue-200",
        accommodations: [
            "✅ Voice Navigation enabled",
            "✅ Speech-to-Text for answers",
            "✅ Large buttons & inputs",
            "✅ Auto-advance after answering",
            "✅ 1.5× extra time",
        ],
    },
    HEARING: {
        label: "Hearing Impairment",
        color: "bg-green-50 border-green-200",
        accommodations: [
            "✅ Simplified mode (no audio alerts)",
            "✅ Visual-only notifications",
        ],
    },
    COGNITIVE: {
        label: "Cognitive Impairment",
        color: "bg-yellow-50 border-yellow-200",
        accommodations: [
            "✅ Simplified single-column layout",
            "✅ Text-to-Speech on questions",
            "✅ Large interaction mode",
            "✅ 1.5× extra time",
        ],
    },
    SPEECH: {
        label: "Speech Impairment",
        color: "bg-orange-50 border-orange-200",
        accommodations: [
            "✅ Voice navigation disabled",
            "✅ Keyboard-only input mode",
        ],
    },
}

export function CandidateSetupForm({ candidateId, candidateName, currentDisability }: CandidateSetupFormProps) {
    const [selected, setSelected] = useState<DisabilityType>(currentDisability)
    const [isLoading, setIsLoading] = useState<"lock" | "unlock" | null>(null)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
    const router = useRouter()

    const preview = DISABILITY_PREVIEWS[selected]

    const apply = async (lock: boolean) => {
        setIsLoading(lock ? "lock" : "unlock")
        setMessage(null)
        try {
            const res = await fetch("/api/supervisor/setup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ candidateId, disabilityType: selected, lock }),
            })
            if (!res.ok) {
                const err = await res.json() as { error?: string }
                throw new Error(err.error ?? "Request failed")
            }
            setMessage({
                type: "success",
                text: lock
                    ? `✅ Accommodations applied and locked for ${candidateName}. You may now exit.`
                    : `✅ Accommodations applied for ${candidateName}. Candidate may still adjust settings.`,
            })
            setTimeout(() => router.push("/dashboard/supervisor"), 2500)
        } catch (err) {
            setMessage({ type: "error", text: err instanceof Error ? err.message : "Something went wrong." })
        } finally {
            setIsLoading(null)
        }
    }

    return (
        <div className="space-y-8">
            {/* Disability Type Selector */}
            <div className="space-y-2">
                <Label htmlFor="disability-select" className="text-base font-semibold">
                    Disability Type
                </Label>
                <select
                    id="disability-select"
                    value={selected}
                    onChange={(e) => setSelected(e.target.value as DisabilityType)}
                    className="w-full rounded-md border bg-background px-3 py-2.5 text-sm focus:outline focus:outline-2 focus:outline-blue-500"
                    aria-label="Select candidate disability type"
                >
                    {(Object.keys(DISABILITY_PREVIEWS) as DisabilityType[]).map((dt) => (
                        <option key={dt} value={dt}>
                            {DISABILITY_PREVIEWS[dt].label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Preview card */}
            <Card className={`border-2 ${preview.color}`}>
                <CardHeader className="pb-2">
                    <h2 className="text-base font-semibold">
                        Accommodations for <span className="font-bold">{preview.label}</span>
                    </h2>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-1.5 text-sm" aria-label="Accommodation preview">
                        {preview.accommodations.map((item) => (
                            <li key={item} className="text-muted-foreground">{item}</li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            {/* Status message / confirmation */}
            {message && (
                <div
                    role="status"
                    aria-live="assertive"
                    className={`rounded-md px-4 py-3 text-sm font-medium border ${message.type === "success"
                            ? "bg-green-50 border-green-300 text-green-800"
                            : "bg-red-50 border-red-300 text-red-800"
                        }`}
                >
                    {message.text}
                </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
                <Button
                    className="flex-1 focus:outline focus:outline-2 focus:outline-blue-500"
                    onClick={() => apply(true)}
                    disabled={!!isLoading}
                    aria-label={`Apply accommodations and lock settings for ${candidateName}`}
                >
                    {isLoading === "lock" ? "Applying…" : "Apply & Lock 🔒"}
                </Button>
                <Button
                    variant="outline"
                    className="flex-1 focus:outline focus:outline-2 focus:outline-blue-500"
                    onClick={() => apply(false)}
                    disabled={!!isLoading}
                    aria-label={`Apply accommodations without locking for ${candidateName}`}
                >
                    {isLoading === "unlock" ? "Applying…" : "Apply Without Lock"}
                </Button>
            </div>

            <p className="text-xs text-muted-foreground">
                <strong>Apply &amp; Lock</strong> prevents the candidate from changing these settings during the exam.
                <strong> Apply Without Lock</strong> allows the candidate to further adjust their preferences.
            </p>
        </div>
    )
}
