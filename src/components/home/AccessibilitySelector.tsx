"use client"

import React from "react"
import { DisabilityType } from "@prisma/client"
import { useAccessibility } from "@/context/AccessibilityContext"
import { cn } from "@/lib/utils"
import { Check, Eye, Ear, Brain, Hand, Mic, Circle } from "lucide-react"

const PROFILES: { id: DisabilityType; title: string; desc: string; icon: React.ElementType }[] = [
    { id: "NONE", title: "Standard", desc: "Default optimized experience.", icon: Circle },
    { id: "VISUAL", title: "Visual", desc: "High contrast & screen reader support.", icon: Eye },
    { id: "HEARING", title: "Hearing", desc: "Visual cues & transcriptions.", icon: Ear },
    { id: "MOTOR", title: "Motor", desc: "Large targets & keyboard navigation.", icon: Hand },
    { id: "COGNITIVE", title: "Cognitive", desc: "Simplified text & reduced motion.", icon: Brain },
    { id: "SPEECH", title: "Speech", desc: "Alternative input methods.", icon: Mic },
]

export function AccessibilitySelector() {
    const { disabilityType, setDisabilityProfile, voiceGuidanceEnabled, toggleVoiceGuidance } = useAccessibility()

    return (
        <div className="w-full max-w-4xl mx-auto mb-12">
            <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-neutral-900 [.high-contrast_&]:!text-white mb-2">
                    Personalize Your Experience
                </h3>
                <p className="text-sm text-neutral-500 [.high-contrast_&]:!text-gray-300">
                    Select an accessibility profile to tailor the platform interface to your needs.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {PROFILES.map((profile) => {
                    const isActive = disabilityType === profile.id;
                    const Icon = profile.icon;

                    return (
                        <button
                            key={profile.id}
                            onClick={() => setDisabilityProfile(profile.id)}
                            className={cn(
                                "relative text-left flex flex-col p-5 rounded-2xl border transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                                isActive
                                    ? "bg-blue-50/50 border-blue-200 shadow-sm [.high-contrast_&]:!bg-white [.high-contrast_&]:!border-white [.high-contrast_&]:!text-black"
                                    : "bg-white border-neutral-200 shadow-sm hover:shadow-md hover:border-neutral-300 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-neutral-700"
                            )}
                            aria-pressed={isActive}
                            aria-label={`Select ${profile.title} profile`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className={cn(
                                    "p-2 rounded-xl",
                                    isActive ? "bg-blue-100 text-blue-700 [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white" : "bg-neutral-100 text-neutral-600 [.high-contrast_&]:!bg-neutral-800 [.high-contrast_&]:!text-white"
                                )}>
                                    <Icon className="w-5 h-5" strokeWidth={2} />
                                </span>
                                {isActive && (
                                    <Check className="w-5 h-5 text-blue-600 [.high-contrast_&]:!text-black" strokeWidth={2.5} />
                                )}
                            </div>
                            <h4 className={cn(
                                "font-semibold mb-1 text-base",
                                isActive ? "text-blue-900 [.high-contrast_&]:!text-black" : "text-neutral-900 [.high-contrast_&]:!text-white"
                            )}>
                                {profile.title}
                            </h4>
                            <p className={cn(
                                "text-sm",
                                isActive ? "text-blue-700/80 [.high-contrast_&]:!text-neutral-800" : "text-neutral-500 [.high-contrast_&]:!text-neutral-400"
                            )}>
                                {profile.desc}
                            </p>
                        </button>
                    )
                })}
            </div>

            <div className="mt-8 flex justify-center">
                <button
                    onClick={toggleVoiceGuidance}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                        voiceGuidanceEnabled
                            ? "bg-blue-600 text-white shadow-md hover:bg-blue-700 [.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black"
                            : "bg-white text-neutral-600 border border-neutral-200 shadow-sm hover:bg-neutral-50 hover:text-neutral-900 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white [.high-contrast_&]:!text-white"
                    )}
                    aria-pressed={voiceGuidanceEnabled}
                >
                    <Mic className="w-5 h-5" />
                    {voiceGuidanceEnabled ? "Voice Guidance Active" : "Enable Voice Guidance"}
                </button>
            </div>
        </div>
    )
}
