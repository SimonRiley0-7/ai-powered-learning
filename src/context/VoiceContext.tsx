"use client";

import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from "react";

export type VoiceEngine = "WEB_SPEECH" | "AI_CLOUD";

export type VoiceState = {
    isListening: boolean;
    transcript: string;
    isProcessing: boolean;
    startListening: () => void;
    stopListening: () => void;
    clearTranscript: () => void;
    error: string | null;
    interimTranscript: string;
    engine: VoiceEngine;
};

const VoiceContext = createContext<VoiceState | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [engine, setEngine] = useState<VoiceEngine>("WEB_SPEECH");

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null); // For Web Speech fallback

    // Check if Web Speech API is supported
    const isWebSpeechSupported = typeof window !== "undefined" && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    const useGroq = process.env.NEXT_PUBLIC_USE_GROQ_WHISPER === 'true';

    // Set initial engine
    useEffect(() => {
        if (useGroq) setEngine("AI_CLOUD");
    }, [useGroq]);

    useEffect(() => {
        // Initialize Web Speech API as fallback or primary if Groq is disabled
        if (isWebSpeechSupported) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const SpeechRecognition = ('SpeechRecognition' in window ? (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition : (window as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition) as new () => any;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true; // Keep listening until stopped
            recognitionRef.current.interimResults = true; // Show live words

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognitionRef.current.onresult = (event: any) => {
                let finalStr = "";
                let interimStr = "";

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalStr += event.results[i][0].transcript;
                    } else {
                        interimStr += event.results[i][0].transcript;
                    }
                }

                if (finalStr) setTranscript(prev => prev + " " + finalStr.trim());
                setInterimTranscript(interimStr);
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech Recognition Error:", event.error);

                if (event.error === 'network') {
                    console.warn("Network error detected. Switching to AI Cloud engine.");
                    setEngine("AI_CLOUD");
                    setError("Browser engine failed. Switching to AI Cloud for stability...");
                    setIsListening(false);
                    return;
                }

                if (event.error !== 'no-speech') {
                    setError(event.error);
                    setIsListening(false);
                }
            };

            const lastRestartRef = { current: 0 };
            recognitionRef.current.onend = () => {
                // Auto-restart logic for timeout prevention
                // ONLY restart if we are still in WEB_SPEECH mode
                if (isListening && engine === "WEB_SPEECH") {
                    const now = Date.now();
                    if (now - lastRestartRef.current < 1000) {
                        setEngine("AI_CLOUD");
                        setIsListening(false);
                        return;
                    }

                    lastRestartRef.current = now;
                    try { recognitionRef.current?.start(); } catch { }
                }
            };
        }
    }, [isWebSpeechSupported, isListening, engine]);

    // PREVENT AUDIO FEEDBACK LOOP: Stop listening when TTS is playing
    useEffect(() => {
        const handleTtsStart = () => {
            if (isListening) {
                if (engine === "WEB_SPEECH" && recognitionRef.current) {
                    try { recognitionRef.current.stop(); } catch { }
                } else if (engine === "AI_CLOUD" && mediaRecorderRef.current?.state === "recording") {
                    try { mediaRecorderRef.current.pause(); } catch { }
                }
            }
        };

        const handleTtsEnd = () => {
            if (isListening) {
                if (engine === "WEB_SPEECH" && recognitionRef.current) {
                    try { recognitionRef.current.start(); } catch { }
                } else if (engine === "AI_CLOUD" && mediaRecorderRef.current?.state === "paused") {
                    try { mediaRecorderRef.current.resume(); } catch { }
                }
            }
        };

        window.addEventListener("tts_start", handleTtsStart);
        window.addEventListener("tts_end", handleTtsEnd);

        return () => {
            window.removeEventListener("tts_start", handleTtsStart);
            window.removeEventListener("tts_end", handleTtsEnd);
        };
    }, [isListening, engine]);

    const startGroqRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.start();
            setIsListening(true);
            setError(null);
        } catch (err: unknown) {
            console.error("Microphone access denied or error:", err);
            setError("Microphone access denied. Please allow permissions.");
        }
    };

    const stopGroqRecording = async () => {
        if (mediaRecorderRef.current && isListening) {
            setIsListening(false);
            setIsProcessing(true);

            const stoppedPromise = new Promise<Blob>((resolve) => {
                mediaRecorderRef.current!.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                    resolve(audioBlob);
                };
            });

            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop()); // Release Mic

            const audioBlob = await stoppedPromise;

            // Send Blob to Backend Route
            try {
                const formData = new FormData();
                formData.append("file", audioBlob, "recording.webm");

                const response = await fetch("/api/voice/transcribe", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || "Failed to transcribe audio");
                }

                const data = await response.json();
                if (data.transcript) {
                    setTranscript((prev) => prev + " " + data.transcript.trim());
                }
            } catch (err: unknown) {
                console.error("Groq Whisper API Error:", err);
                setError(err instanceof Error ? err.message : "Failed to transcribe audio.");
                // If Groq fails completely, we append an error notice to the state.
            } finally {
                setIsProcessing(false);
            }
        }
    };


    const startListening = () => {
        setInterimTranscript("");
        setTranscript(""); // Clear previous session
        setError(null);

        if (engine === "AI_CLOUD") {
            startGroqRecording();
        } else {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                    setIsListening(true);
                } catch {
                    setEngine("AI_CLOUD");
                    startGroqRecording();
                }
            } else {
                setEngine("AI_CLOUD");
                startGroqRecording();
            }
        }
    };

    const stopListening = () => {
        if (engine === "AI_CLOUD") {
            stopGroqRecording();
        } else {
            if (recognitionRef.current && isListening) {
                recognitionRef.current.stop();
                setIsListening(false);
            }
        }
        setInterimTranscript("");
    };

    const clearTranscript = () => {
        setTranscript("");
        setInterimTranscript("");
    };

    return (
        <VoiceContext.Provider
            value={{
                isListening,
                transcript,
                isProcessing,
                startListening,
                stopListening,
                clearTranscript,
                error,
                interimTranscript,
                engine
            }}
        >
            {children}
        </VoiceContext.Provider>
    );
}

export function useVoice() {
    const context = useContext(VoiceContext);
    if (context === undefined) {
        throw new Error("useVoice must be used within a VoiceProvider");
    }
    return context;
}
