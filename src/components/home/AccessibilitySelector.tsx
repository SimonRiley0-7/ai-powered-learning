"use client"

import React from "react"
import { DisabilityType } from "@prisma/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { useAccessibility } from "@/context/AccessibilityContext"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function AccessibilitySelector() {
    const { disabilityType, setDisabilityProfile, voiceGuidanceEnabled, toggleVoiceGuidance } = useAccessibility()

    const handleSelection = (type: DisabilityType) => {
        setDisabilityProfile(type)
    }

    return (
        <Card className="w-full max-w-lg mx-auto mb-12 p-6 border-2 border-blue-200 bg-blue-50/50 shadow-lg [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white [.high-contrast_&]:!shadow-none">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label htmlFor="global-disability-selector" className="text-lg font-semibold text-blue-900 [.high-contrast_&]:!text-white">
                        Accessibility Personalization
                    </Label>
                    <span role="img" aria-label="Accessibility Icon" className="text-2xl">♿</span>
                </div>

                <p className="text-sm text-blue-800 [.high-contrast_&]:!text-white">
                    Select a profile to instantly optimize the platform for your needs.
                    This will enable features like high contrast, large buttons, or voice assistance.
                </p>

                <Select value={disabilityType} onValueChange={(v) => handleSelection(v as DisabilityType)}>
                    <SelectTrigger
                        id="global-disability-selector"
                        className="bg-white border-blue-300 focus:ring-blue-500 text-base py-6 [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white"
                        aria-label="Select disability type for accessibility"
                    >
                        <SelectValue placeholder="Select disability type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="NONE">Standard / None</SelectItem>
                        <SelectItem value="VISUAL">Visual Impairment</SelectItem>
                        <SelectItem value="MOTOR">Motor / Physical Impairment</SelectItem>
                        <SelectItem value="HEARING">Hearing Impairment</SelectItem>
                        <SelectItem value="COGNITIVE">Cognitive / Learning Impairment</SelectItem>
                        <SelectItem value="SPEECH">Speech Impairment</SelectItem>
                    </SelectContent>
                </Select>

                <div className="pt-2 border-t border-blue-100 mt-4 flex flex-col gap-3">
                    <p className="text-xs text-blue-700 font-medium [.high-contrast_&]:!text-white">
                        🔊 Voice guidance is optional and will read screen content aloud.
                    </p>
                    <Button
                        variant={voiceGuidanceEnabled ? "default" : "outline"}
                        className={cn(
                            "w-full h-12 font-bold transition-all",
                            voiceGuidanceEnabled ? "bg-blue-600 hover:bg-blue-700" : "border-2 border-blue-200"
                        )}
                        onClick={toggleVoiceGuidance}
                    >
                        {voiceGuidanceEnabled ? "🔊 Voice Guidance Enabled" : "🔈 Enable Voice Guidance"}
                    </Button>
                </div>
            </div>
        </Card>
    )
}
