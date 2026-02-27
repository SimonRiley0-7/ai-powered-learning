// components/AccessibilityControls.tsx
import React, { useState, useEffect } from "react";
import { useVoice } from "@/context/VoiceContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AccessibilityControlsProps {
  features: string[];
  className?: string;
  /** If true, all controls are hidden and a supervisor banner is shown */
  lockedBySupervisor?: boolean;
}

const AccessibilityControls: React.FC<AccessibilityControlsProps> = ({
  features,
  className,
  lockedBySupervisor = false,
}) => {
  const [fontSize, setFontSize] = useState(16);
  const [highContrast, setHighContrast] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const { isListening, startListening, stopListening, isProcessing } = useVoice();

  // Apply accessibility settings to document
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;

    if (highContrast) {
      document.body.classList.add("high-contrast");
    } else {
      document.body.classList.remove("high-contrast");
    }

    // Cleanup
    return () => {
      document.documentElement.style.fontSize = "";
      document.body.classList.remove("high-contrast");
    };
  }, [fontSize, highContrast]);

  const handleTextToSpeech = () => {
    if (!features.includes("TEXT_TO_SPEECH")) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      // Get all visible text on the page
      const textToRead = document.querySelector(".assessment-content")?.textContent ||
        "No content found to read.";

      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleVoiceToText = () => {
    if (!features.includes("VOICE_TO_TEXT")) return;

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <Card className={cn("p-4", className)}>
      <h3 className="text-lg font-medium w-full mb-2">Accessibility Options</h3>
      <div className={cn("flex flex-wrap gap-2", lockedBySupervisor && "opacity-50 pointer-events-none")}>
        {features.includes("SCREEN_READER") && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setFontSize(Math.max(12, fontSize - 2))}
              disabled={fontSize <= 12 || lockedBySupervisor}
            >
              A-
            </Button>
            <span className="text-sm font-medium w-8 text-center">{fontSize}px</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setFontSize(Math.min(24, fontSize + 2))}
              disabled={fontSize >= 24 || lockedBySupervisor}
            >
              A+
            </Button>
          </div>
        )}

        {features.includes("HIGH_CONTRAST") && (
          <Button
            size="sm"
            variant={highContrast ? "default" : "outline"}
            onClick={() => setHighContrast(!highContrast)}
            disabled={lockedBySupervisor}
          >
            High Contrast
          </Button>
        )}

        {features.includes("TEXT_TO_SPEECH") && (
          <Button
            size="sm"
            variant={isSpeaking ? "default" : "outline"}
            onClick={handleTextToSpeech}
            className="flex items-center gap-1"
            disabled={lockedBySupervisor}
          >
            <span role="img" aria-label="Speaker">🔊</span>
            {isSpeaking ? "Stop Reading" : "Read Aloud"}
          </Button>
        )}

        {features.includes("VOICE_TO_TEXT") && (
          <Button
            size="sm"
            variant={isListening ? "default" : "outline"}
            onClick={handleVoiceToText}
            className={cn("flex items-center gap-1", isProcessing && "animate-pulse border-blue-500")}
            disabled={isProcessing || lockedBySupervisor}
          >
            <span role="img" aria-label="Microphone">🎤</span>
            {isProcessing ? "Processing..." : isListening ? "Stop Voice Mode" : "Start Voice Mode"}
          </Button>
        )}

        {features.includes("KEYBOARD_NAVIGATION") && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => alert("Keyboard navigation guide would appear here.")}
            className="flex items-center gap-1"
            disabled={lockedBySupervisor}
          >
            <span role="img" aria-label="Keyboard">⌨️</span>
            Keyboard Guide
          </Button>
        )}
      </div>

      {lockedBySupervisor && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-2 text-blue-800 text-sm">
          <span role="img" aria-label="Lock">🔒</span>
          <span>Accessibility settings configured by your Supervisor.</span>
        </div>
      )}

      {features.includes("EXTENDED_TIME") && (
        <div className="text-sm text-gray-600 mt-2">
          <span role="img" aria-label="Clock">⏱️</span> Extended time enabled (+50%)
        </div>
      )}
    </Card>
  );
};

export default AccessibilityControls;