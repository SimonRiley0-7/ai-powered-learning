"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useVoice } from "@/context/VoiceContext";
import { cn } from "@/lib/utils";
import { useAccessibility } from "@/context/AccessibilityContext";

interface VoiceInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onValueChange?: (value: string) => void;
    // In case the parent controls the value
    value?: string;
}

export function VoiceInput({ className, onValueChange, value, ...props }: VoiceInputProps) {
    const [localValue, setLocalValue] = useState(value || "");
    const { isListening, startListening, stopListening, transcript, isProcessing, clearTranscript, engine } = useVoice();
    const [isActiveForThisInput, setIsActiveForThisInput] = useState(false);

    // Sync with parent value if provided
    useEffect(() => {
        if (value !== undefined) {
            setLocalValue(value);
        }
    }, [value]);

    // Simplified voice handling: directly apply transcript if this input is active
    useEffect(() => {
        if (isActiveForThisInput && transcript) {
            const finalValue = transcript.trim();
            setLocalValue(finalValue);
            if (onValueChange) onValueChange(finalValue);
        }
    }, [transcript, isActiveForThisInput, onValueChange]);


    const toggleVoice = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent form submission

        if (isActiveForThisInput && isListening) {
            stopListening();
            // We DON'T set isActiveForThisInput to false here anymore
            // because we need to wait for the transcript to come back from the server (isProcessing)
        } else {
            // If we are starting fresh for this input, clear the old transcript history
            clearTranscript();
            setIsActiveForThisInput(true);
            startListening();
        }
    };

    // Auto-disable active state after processing is done
    useEffect(() => {
        if (isActiveForThisInput && !isListening && !isProcessing) {
            const timer = setTimeout(() => setIsActiveForThisInput(false), 500);
            return () => clearTimeout(timer);
        }
    }, [isListening, isProcessing, isActiveForThisInput]);

    const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalValue(e.target.value);
        if (onValueChange) {
            onValueChange(e.target.value);
        }
    };

    const { disabilityType } = useAccessibility();

    return (
        <div className="relative flex items-center w-full">
            <Input
                {...props}
                value={localValue}
                onChange={handleManualChange}
                className={cn(className, "pr-12")} // Make room for mic button
            />
            {disabilityType !== "SPEECH" && (
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className={cn(
                        "absolute right-1 w-10 h-10 rounded-full transition-all duration-300",
                        isActiveForThisInput && isListening && "text-red-500 animate-pulse bg-red-100 dark:bg-red-900/30",
                        isActiveForThisInput && isProcessing && "text-blue-500 animate-pulse",
                        isActiveForThisInput && isListening && engine === "AI_CLOUD" && "ring-2 ring-purple-500 shadow-lg"
                    )}
                    onClick={toggleVoice}
                    disabled={isActiveForThisInput && isProcessing}
                    aria-label={isActiveForThisInput && isListening ? "Stop dictation" : "Start dictation"}
                    title={isActiveForThisInput && isListening ? "Stop dictation" : "Dictate"}
                >
                    <div className="flex items-center justify-center">
                        {(isActiveForThisInput && isListening && engine === "AI_CLOUD") ? (
                            <span className="text-[10px] font-bold absolute -top-1 -right-1 bg-purple-500 text-white rounded px-1">AI</span>
                        ) : null}
                        <span role="img" aria-hidden="true">
                            {isActiveForThisInput && isProcessing ? "⏳" : "🎤"}
                        </span>
                    </div>
                </Button>
            )}
        </div>
    );
}
