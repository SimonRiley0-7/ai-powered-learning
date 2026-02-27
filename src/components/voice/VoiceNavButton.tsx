"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * VoiceNavButton — Floating microphone for voice commands
 * Records audio → sends to Sarvam STT → parses intent → navigates
 */

// Command intents with multilingual triggers
const COMMAND_MAP: { intent: string; triggers: string[]; action: string }[] = [
    {
        intent: "dashboard",
        triggers: ["dashboard", "home", "डैशबोर्ड", "होम", "டாஷ்போர்டு", "ড্যাশবোর্ড", "హోమ్"],
        action: "/dashboard",
    },
    {
        intent: "settings",
        triggers: ["settings", "सेटिंग्स", "அமைப்புகள்", "সেটিংস", "సెట్టింగ్స్"],
        action: "/dashboard/settings",
    },
    {
        intent: "results",
        triggers: ["results", "scores", "marks", "नतीजे", "अंक", "मार्क्स", "ফলাফল", "முடிவுகள்", "ఫలితాలు"],
        action: "/dashboard/results",
    },
    {
        intent: "login",
        triggers: ["login", "sign in", "लॉगिन", "লগইন", "உள்நுழை", "లాగిన్"],
        action: "/login",
    },
    {
        intent: "logout",
        triggers: ["logout", "sign out", "लॉगआउट", "লগআউট", "வெளியேறு", "లాగ్ అవుట్"],
        action: "/api/auth/signout",
    },
    {
        intent: "next_question",
        triggers: ["next", "agla", "agle", "aage", "adutha", "porer", "taarpor", "next question", "agla sawal", "agle question pe", "அடுத்த", "perugu", "ಮುಂದಿನ"],
        action: "ACTION_EVENT",
    },
    {
        intent: "prev_question",
        triggers: ["previous", "back", "pichla", "pichhe", "peeche", "munthaiya", "ager", "previous question", "pichla sawal", "முந்தைய", "వెనుకకు", "ಹಿಂದಿನ"],
        action: "ACTION_EVENT",
    },
    {
        intent: "submit_assessment",
        triggers: ["submit", "finish", "jama", "samarppi", "joma", "submit assessment", "jama karo", "test khatam", "சமர்ப்பி", "సమర్పించండి", "ಸಲ್ಲಿಸು"],
        action: "ACTION_EVENT",
    },
];

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

            // Parse command
            const lowerText = text.toLowerCase();
            const matched = COMMAND_MAP.find(cmd =>
                cmd.triggers.some(trigger => lowerText.includes(trigger.toLowerCase()))
            );

            if (matched) {
                setStatus("success");
                setTranscript(`${getFeedback("navigating", lang)}: ${matched.intent}`);
                // Action dispatch or navigation after brief delay
                setTimeout(() => {
                    if (matched.action === "ACTION_EVENT") {
                        window.dispatchEvent(new CustomEvent("voice_command", { detail: matched.intent }));
                    } else {
                        router.push(matched.action);
                    }
                    setShowPanel(false);
                }, 800);
            } else {
                setStatus("error");
                setTranscript(`"${text}" — ${getFeedback("not_understood", lang)}`);
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
