import { NextRequest, NextResponse } from "next/server";
import { synthesizeSpeech, type LanguageCode } from "@/lib/ai/sarvam-voice";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text, language } = body;

        if (!text) {
            return NextResponse.json({ error: "No text provided" }, { status: 400 });
        }

        const result = await synthesizeSpeech(text, (language || "en-IN") as LanguageCode);
        return NextResponse.json(result);
    } catch (err) {
        console.error("❌ [TTS Route] Error:", err);
        return NextResponse.json(
            { error: "Text-to-speech failed", details: String(err) },
            { status: 500 }
        );
    }
}
