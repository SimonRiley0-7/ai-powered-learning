"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mic, Loader2, Square, X } from "lucide-react";

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

// ── Local command map: resolves common phrases without LLM latency ──
const COMMAND_MAP: Array<{ keywords: string[]; action: string; intent: string }> = [
    { keywords: ["dashboard", "home", "main"], action: "/dashboard", intent: "dashboard" },
    { keywords: ["settings", "accessibility", "profile"], action: "/dashboard/settings", intent: "settings" },
    { keywords: ["results", "scores", "history", "past"], action: "/dashboard/results", intent: "results" },
    { keywords: ["courses", "course", "catalogue", "learn", "study"], action: "/courses", intent: "courses" },
    { keywords: ["enroll", "continue", "start", "join"], action: "ACTION_EVENT:start_course", intent: "start_course" },
    { keywords: ["simplify", "easier", "bullets", "analogies"], action: "ACTION_EVENT:simplify_content", intent: "simplify_content" },
    { keywords: ["video", "watch"], action: "ACTION_EVENT:go_to_video", intent: "go_to_video" },
    { keywords: ["quiz", "test", "questions"], action: "ACTION_EVENT:go_to_quiz", intent: "go_to_quiz" },
    { keywords: ["practice", "activity", "try"], action: "ACTION_EVENT:go_to_practice", intent: "go_to_practice" },
    { keywords: ["reflection", "feedback", "summary"], action: "ACTION_EVENT:go_to_reflection", intent: "go_to_reflection" },
    { keywords: ["login", "sign in", "signin"], action: "/login", intent: "login" },
    { keywords: ["next", "next question", "forward"], action: "ACTION_EVENT:next_question", intent: "next_question" },
    { keywords: ["previous", "prev", "back", "go back"], action: "ACTION_EVENT:prev_question", intent: "prev_question" },
    { keywords: ["submit", "finish", "done", "complete"], action: "ACTION_EVENT:submit_assessment", intent: "submit_assessment" },
    { keywords: ["a", "alpha", "option a", "select a", "choose a"], action: "ACTION_EVENT:select_option_a", intent: "select_option_a" },
    { keywords: ["b", "bravo", "option b", "select b", "choose b"], action: "ACTION_EVENT:select_option_b", intent: "select_option_b" },
    { keywords: ["c", "charlie", "option c", "select c", "choose c"], action: "ACTION_EVENT:select_option_c", intent: "select_option_c" },
    { keywords: ["d", "delta", "option d", "select d", "choose d"], action: "ACTION_EVENT:select_option_d", intent: "select_option_d" },
];

function tryLocalCommand(text: string): { action: string; intent: string } | null {
    const lower = text.toLowerCase().trim();
    for (const cmd of COMMAND_MAP) {
        if (cmd.keywords.some((kw) => lower === kw || lower.startsWith(kw + " ") || lower.endsWith(" " + kw) || lower.includes(` ${kw} `))) {
            return { action: cmd.action, intent: cmd.intent };
        }
    }
    return null;
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

    const startRecording = async () => {
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
    };

    const stopRecording = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    };

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

            // ── 1. Try local command map first (fast, no LLM needed) ──
            const local = tryLocalCommand(text);
            if (local) {
                setStatus("success");
                setTranscript(`${getFeedback("navigating", lang)}: ${local.intent}`);
                setTimeout(() => {
                    if (local.action.startsWith("ACTION_EVENT:")) {
                        window.dispatchEvent(new CustomEvent("voice_command", { detail: local.action.split(":")[1] }));
                    } else {
                        router.push(local.action);
                    }
                    setShowPanel(false);
                }, 800);
                return;
            }

            // ── 2. Fall through to LLM Intent Parser for complex commands ──
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
                            // Specialized handling for specific content requests
                            let targetPath = action;
                            if (intent === "take_assessment") {
                                targetPath = `${action}?search=${encodeURIComponent(text)}`;
                            } else if (intent === "take_course") {
                                // If they say "take social confidence course", navigate to /courses?search=social+confidence
                                targetPath = `/courses?search=${encodeURIComponent(text)}`;
                            }
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
                    flex items-center justify-center
                    shadow-md transition-all duration-300 cursor-pointer border border-transparent
                    ${isRecording
                        ? "bg-red-50 text-red-600 border-red-200 shadow-red-500/10 scale-105 animate-pulse"
                        : status === "processing"
                            ? "bg-neutral-100 text-neutral-600 shadow-neutral-500/10 border-neutral-200"
                            : "bg-neutral-900 text-white shadow-lg hover:bg-neutral-800 hover:scale-105 hover:shadow-xl ring-4 ring-neutral-900/5"
                    }
                    [.high-contrast_&]:!shadow-none [.high-contrast_&]:!border-2 [.high-contrast_&]:!border-white [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white
                `}
                title="Voice Command"
            >
                {isRecording ? <Square className="w-5 h-5 fill-current" /> : status === "processing" ? <Loader2 className="w-6 h-6 animate-spin" /> : <Mic className="w-6 h-6" />}
            </button>

            {/* Status Panel */}
            {showPanel && (
                <div className={`
                    fixed bottom-24 right-6 z-50 w-80 rounded-2xl shadow-xl
                    border p-5 transition-all duration-300 animate-in slide-in-from-bottom-4 backdrop-blur-md
                    ${status === "success"
                        ? "bg-emerald-50/90 border-emerald-200"
                        : status === "error"
                            ? "bg-red-50/90 border-red-200"
                            : "bg-white/90 border-neutral-200"
                    }
                    [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white [.high-contrast_&]:!text-white
                `}>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500 [.high-contrast_&]:!text-gray-400">
                            {status === "recording" ? "Listening" :
                                status === "processing" ? "Processing" :
                                    status === "success" ? "Command Received" :
                                        status === "error" ? "Error" : "Voice Navigation"}
                        </span>
                        <button
                            onClick={() => setShowPanel(false)}
                            className="p-1 rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors [.high-contrast_&]:!text-white [.high-contrast_&]:!hover:bg-neutral-800"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {status === "recording" && (
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex gap-1 items-center h-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-1.5 bg-red-500 rounded-full animate-pulse" style={{
                                        height: `${8 + Math.random() * 8}px`,
                                        animationDelay: `${i * 0.15}s`
                                    }} />
                                ))}
                            </div>
                            <span className="text-sm font-medium text-red-600 [.high-contrast_&]:!text-red-400">
                                Speak now...
                            </span>
                        </div>
                    )}

                    <p className="text-base font-semibold leading-relaxed text-neutral-800 [.high-contrast_&]:!text-white">
                        {transcript || "Tap the mic and speak a command."}
                    </p>

                    {detectedLang !== "en-IN" && transcript && (
                        <span className="inline-block mt-3 px-2 py-1 rounded text-xs bg-neutral-100 text-neutral-600 font-medium [.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black">
                            {detectedLang}
                        </span>
                    )}

                    <div className="mt-4 pt-3 border-t border-neutral-100 text-xs text-neutral-400 [.high-contrast_&]:!text-gray-400 [.high-contrast_&]:!border-neutral-800">
                        Try: &quot;dashboard&quot; &middot; &quot;settings&quot; &middot; &quot;results&quot;
                    </div>
                </div>
            )}
        </>
    );
}
