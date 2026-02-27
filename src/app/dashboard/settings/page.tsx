"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { getUserProfile, updateAccessibilityProfile } from "@/app/actions/user"

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    const [preferences, setPreferences] = useState({
        isVisuallyImpaired: false,
        isHearingImpaired: false,
        isMotorImpaired: false,
        isCognitiveImpaired: false,
        requiresAssistiveTech: false
    })

    useEffect(() => {
        async function loadProfile() {
            try {
                const data = await getUserProfile()
                if (data && data.pwdRequirements) {
                    setPreferences({
                        isVisuallyImpaired: data.pwdRequirements.isVisuallyImpaired,
                        isHearingImpaired: data.pwdRequirements.isHearingImpaired,
                        isMotorImpaired: data.pwdRequirements.isMotorImpaired,
                        isCognitiveImpaired: data.pwdRequirements.isCognitiveImpaired,
                        requiresAssistiveTech: data.pwdRequirements.requiresAssistiveTech || false
                    })
                }
            } catch (error) {
                console.error("Failed to load profile", error)
            } finally {
                setIsLoading(false)
            }
        }
        loadProfile()
    }, [])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await updateAccessibilityProfile(preferences)
            alert("Settings saved successfully!")
        } catch (error) {
            console.error(error)
            alert("Failed to save settings.")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return <div className="p-8 max-w-2xl mx-auto">Loading settings...</div>
    }

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Accessibility Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Update your accessibility requirements for all assessments.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Needs & Preferences</CardTitle>
                    <CardDescription>Select all conditions that apply to your accommodation needs.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4">
                        <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <Checkbox
                                id="req-visual"
                                checked={preferences.isVisuallyImpaired}
                                onCheckedChange={(c) => setPreferences(p => ({ ...p, isVisuallyImpaired: c as boolean }))}
                            />
                            <Label htmlFor="req-visual" className="flex-1 cursor-pointer font-medium cursor-pointer">
                                Visually Impaired
                                <p className="text-sm font-normal text-muted-foreground mt-1">Enables screen reader optimizations, high contrast mode, and larger text.</p>
                            </Label>
                        </div>

                        <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <Checkbox
                                id="req-hearing"
                                checked={preferences.isHearingImpaired}
                                onCheckedChange={(c) => setPreferences(p => ({ ...p, isHearingImpaired: c as boolean }))}
                            />
                            <Label htmlFor="req-hearing" className="flex-1 cursor-pointer font-medium cursor-pointer">
                                Hearing Impaired
                                <p className="text-sm font-normal text-muted-foreground mt-1">Ensures transcripts and subtitles are available for audio-visual content.</p>
                            </Label>
                        </div>

                        <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <Checkbox
                                id="req-motor"
                                checked={preferences.isMotorImpaired}
                                onCheckedChange={(c) => setPreferences(p => ({ ...p, isMotorImpaired: c as boolean }))}
                            />
                            <Label htmlFor="req-motor" className="flex-1 cursor-pointer font-medium cursor-pointer">
                                Motor Impaired
                                <p className="text-sm font-normal text-muted-foreground mt-1">Provides extended time, fully keyboard navigable interfaces without fine motor targets.</p>
                            </Label>
                        </div>

                        <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <Checkbox
                                id="req-cognitive"
                                checked={preferences.isCognitiveImpaired}
                                onCheckedChange={(c) => setPreferences(p => ({ ...p, isCognitiveImpaired: c as boolean }))}
                            />
                            <Label htmlFor="req-cognitive" className="flex-1 cursor-pointer font-medium cursor-pointer">
                                Cognitive Impaired
                                <p className="text-sm font-normal text-muted-foreground mt-1">Removes distracting elements, disables timers where possible, and uses simple language.</p>
                            </Label>
                        </div>
                    </div>

                    <Button onClick={handleSave} disabled={isSaving} className="w-full">
                        {isSaving ? "Saving..." : "Save Preferences"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
