"use client";

import { useVoice } from "@/context/VoiceContext";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";

export function GlobalVoiceToggle() {
    const { isListening, startListening, stopListening, isProcessing } = useVoice();

    const toggleVoice = () => {
        if (isListening) stopListening();
        else startListening();
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <Button
                variant={isListening ? "destructive" : "secondary"}
                size="icon"
                className={`h-14 w-14 rounded-full shadow-lg border-2 border-primary/20 hover:scale-105 transition-transform ${isListening ? "animate-pulse shadow-red-500/50" : ""}`}
                onClick={toggleVoice}
                disabled={isProcessing}
                title={isListening ? "Stop Voice Mode" : "Start Voice Mode"}
                aria-label={isListening ? "Stop Voice Mode" : "Start Voice Mode"}
            >
                {isProcessing ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                ) : isListening ? (
                    <Mic className="h-6 w-6 text-white" />
                ) : (
                    <MicOff className="h-6 w-6" />
                )}
            </Button>
        </div>
    );
}
