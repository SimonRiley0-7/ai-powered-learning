"use client";

import { useEffect } from "react";
import { useVoice } from "@/context/VoiceContext";
export function GlobalVoiceListener() {
    const { transcript, isListening } = useVoice();

    useEffect(() => {
        // No global command parsing - simplified for stabilization
    }, [transcript, isListening]);

    return null; // This is a purely logical component, no UI
}
