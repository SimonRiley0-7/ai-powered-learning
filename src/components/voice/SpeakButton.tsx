"use client";

import { useState, useCallback } from "react";

/**
 * SpeakButton — Reusable TTS button
 * Place next to any text content to read it aloud via Sarvam AI
 */
export default function SpeakButton({
    text,
    language = "en-IN",
    size = "sm",
    className = "",
}: {
    text: string;
    language?: string;
    size?: "sm" | "md" | "lg";
    className?: string;
}) {
    const [playing, setPlaying] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const speak = useCallback(async () => {
        if (playing || loading || !text.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/voice/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: text.slice(0, 2500), language }),
            });

            if (!res.ok) throw new Error("TTS failed");

            const data = await res.json();
            if (!data.audioBase64) throw new Error("No audio returned");

            // Decode base64 → audio
            const audioBytes = atob(data.audioBase64);
            const byteArray = new Uint8Array(audioBytes.length);
            for (let i = 0; i < audioBytes.length; i++) {
                byteArray[i] = audioBytes.charCodeAt(i);
            }
            const blob = new Blob([byteArray], { type: "audio/wav" });
            const url = URL.createObjectURL(blob);

            const audio = new Audio(url);
            setPlaying(true);

            audio.onended = () => {
                setPlaying(false);
                URL.revokeObjectURL(url);
            };
            audio.onerror = () => {
                setPlaying(false);
                setError("Playback failed");
                URL.revokeObjectURL(url);
            };

            await audio.play();
        } catch (err) {
            setError(String(err));
            setPlaying(false);
        } finally {
            setLoading(false);
        }
    }, [text, language, playing, loading]);

    const sizes = {
        sm: "w-7 h-7 text-sm",
        md: "w-9 h-9 text-base",
        lg: "w-11 h-11 text-lg",
    };

    return (
        <button
            onClick={speak}
            disabled={loading || !text.trim()}
            title={error || (playing ? "Playing..." : "Read aloud")}
            className={`
                inline-flex items-center justify-center rounded-full
                transition-all duration-200 cursor-pointer
                ${playing
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30 animate-pulse"
                    : loading
                        ? "bg-slate-200 text-slate-400"
                        : "bg-slate-100 text-slate-500 hover:bg-blue-100 hover:text-blue-600 hover:shadow-md"
                }
                [.high-contrast_&]:!bg-gray-800 [.high-contrast_&]:!text-white
                [.high-contrast_&]:hover:!bg-gray-700
                disabled:opacity-50 disabled:cursor-not-allowed
                ${sizes[size]}
                ${className}
            `}
        >
            {loading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
                </svg>
            ) : playing ? (
                <span>⏸</span>
            ) : (
                <span>🔊</span>
            )}
        </button>
    );
}
