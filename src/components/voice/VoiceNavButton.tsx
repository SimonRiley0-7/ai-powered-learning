"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * VoiceNavButton — Floating microphone for voice commands
 * Records audio → sends to Sarvam STT → parses intent via Sarvam LLM → navigates
 */

// TTS feedback messages
const FEEDBACK: Record<string, Record<string, string>> = {
    listening: {
        "en-IN": "Listening...",
        "hi-IN": "सुन रहा हूँ...",
        "bn-IN": "শুনছি...",
        "ta-IN": "கேட்கிறேன்...",
    },
    navigating: {
        "en-IN": "Navigating",
        "hi-IN": "जा रहा हूँ",
        "bn-IN": "যাচ্ছি",
        "ta-IN": "செல்கிறேன்",
    },
    not_understood: {
        "en-IN": "Sorry, I didn't understand. Try: dashboard, settings, results",
        "hi-IN": "समझ नहीं आया। कहें: डैशबोर्ड, सेटिंग्स, नतीजे",
    },
};

function getFeedback(key: string, lang: string): string {
    return FEEDBACK[key]?.[lang] || FEEDBACK[key]?.["en-IN"] || key;
}

export default function VoiceNavButton() {
    const router = useRouter();
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [status, setStatus] = useState<"idle" | "recording" | "processing" | "success" | "error">("idle");
    const [detectedLang, setDetectedLang] = useState("en-IN");
    const [showPanel, setShowPanel] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (mediaRecorderRef.current?.state === "recording") {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(t => t.stop());
                await processAudio();
            };

            mediaRecorder.start();
            setIsRecording(true);
            setStatus("recording");
            setTranscript("");
            setShowPanel(true);

            // Auto-stop after 5 seconds
            timeoutRef.current = setTimeout(() => {
                if (mediaRecorderRef.current?.state === "recording") {
                    mediaRecorderRef.current.stop();
                }
            }, 5000);

        } catch (err) {
            console.error("🎙️ Mic access denied:", err);
            setStatus("error");
            setTranscript("Mic access denied. Please allow microphone access.");
            setShowPanel(true);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    }, []);

    const processAudio = async () => {
        setStatus("processing");
        setIsRecording(false);

        try {
            const blob = new Blob(chunksRef.current, { type: "audio/webm" });

            // Convert blob to base64
            const reader = new FileReader();
            const base64 = await new Promise<string>((resolve) => {
                reader.onloadend = () => {
                    const result = reader.result as string;
                    resolve(result.split(",")[1] || "");
                };
                reader.readAsDataURL(blob);
            });

            // Send to Sarvam STT
            const res = await fetch("/api/voice/stt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ audio: base64 }),
            });

            if (!res.ok) throw new Error("STT failed");

            const data = await res.json();
            const text = data.transcript || "";
            const lang = data.language_code || "en-IN";

            setTranscript(text);
            setDetectedLang(lang);

            if (!text.trim()) {
                setStatus("error");
                setTranscript("No speech detected. Try again.");
                return;
            }

            // Call the LLM Intent Parser
            setStatus("processing");
            const intentRes = await fetch("/api/voice/intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transcript: text }),
            });

            if (intentRes.ok) {
                const intentData = await intentRes.json();
                const { intent, action } = intentData;

                if (intent && intent !== "unknown" && action) {
                    setStatus("success");
                    setTranscript(`${getFeedback("navigating", lang)}: ${intent}`);
                    // Action dispatch or navigation after brief delay
                    setTimeout(() => {
                        if (action.startsWith("ACTION_EVENT:")) {
                            const eventName = action.split(":")[1];
                            window.dispatchEvent(new CustomEvent("voice_command", { detail: eventName }));
                        } else {
                            // If it's a specific assessment request, we can append the query
                            const targetPath = intent === "take_assessment" ? `${action}?search=${encodeURIComponent(text)}` : action;
                            router.push(targetPath);
                        }
                        setShowPanel(false);
                    }, 800);
                } else {
                    setStatus("error");
                    setTranscript(`"${text}" — ${getFeedback("not_understood", lang)}`);
                }
            } else {
                setStatus("error");
                setTranscript(`"${text}" — Error contacting AI Router.`);
            }
        } catch (err) {
            console.error("🎙️ Processing error:", err);
            setStatus("error");
            setTranscript("Voice processing failed. Check your connection.");
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <>
            {/* Floating Mic Button */}
            <button
                onClick={toggleRecording}
                className={`
                    fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full
                    flex items-center justify-center text-2xl
                    shadow-xl transition-all duration-300 cursor-pointer
                    ${isRecording
                        ? "bg-red-500 text-white shadow-red-500/40 scale-110 animate-pulse"
                        : status === "processing"
                            ? "bg-amber-500 text-white shadow-amber-500/30 animate-spin"
                            : "bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-blue-500/30 hover:scale-110 hover:shadow-2xl"
                    }
                    [.high-contrast_&]:!shadow-none [.high-contrast_&]:!border-2 [.high-contrast_&]:!border-white
                `}
                title="Voice Command"
            >
                {isRecording ? "⏹" : status === "processing" ? "⏳" : "🎙️"}
            </button>

            {/* Status Panel */}
            {showPanel && (
                <div className={`
                    fixed bottom-24 right-6 z-50 w-72 rounded-2xl shadow-2xl
                    border p-4 transition-all duration-300 animate-in slide-in-from-bottom-4
                    ${status === "success"
                        ? "bg-emerald-50 border-emerald-200"
                        : status === "error"
                            ? "bg-red-50 border-red-200"
                            : "bg-white border-slate-200"
                    }
                    [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white [.high-contrast_&]:!text-white
                `}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 [.high-contrast_&]:!text-gray-400">
                            {status === "recording" ? "🔴 Listening" :
                                status === "processing" ? "⏳ Processing" :
                                    status === "success" ? "✅ Command" :
                                        status === "error" ? "❌ Error" : "Voice"}
                        </span>
                        <button
                            onClick={() => setShowPanel(false)}
                            className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer [.high-contrast_&]:!text-white"
                        >
                            ✕
                        </button>
                    </div>

                    {status === "recording" && (
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="w-1 bg-red-500 rounded-full animate-pulse" style={{
                                        height: `${8 + Math.random() * 16}px`,
                                        animationDelay: `${i * 0.1}s`
                                    }} />
                                ))}
                            </div>
                            <span className="text-sm text-slate-600 [.high-contrast_&]:!text-gray-300">
                                Speak a command...
                            </span>
                        </div>
                    )}

                    <p className="text-sm font-medium text-slate-700 [.high-contrast_&]:!text-white">
                        {transcript || "Tap the mic and speak"}
                    </p>

                    {detectedLang !== "en-IN" && transcript && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-600 font-bold [.high-contrast_&]:!bg-blue-900 [.high-contrast_&]:!text-blue-200">
                            {detectedLang}
                        </span>
                    )}

                    <div className="mt-3 text-xs text-slate-400 [.high-contrast_&]:!text-gray-500">
                        Try: &quot;dashboard&quot; &quot;settings&quot; &quot;results&quot;
                    </div>
                </div>
            )}
        </>
    );
}
