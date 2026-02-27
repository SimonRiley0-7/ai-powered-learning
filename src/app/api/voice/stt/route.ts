import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/ai/sarvam-voice";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { audio, language } = body;

        if (!audio) {
            return NextResponse.json({ error: "No audio provided" }, { status: 400 });
        }

        const result = await transcribeAudio(audio, language);
        return NextResponse.json(result);
    } catch (err) {
        console.error("❌ [STT Route] Error:", err);
        return NextResponse.json(
            { error: "Speech-to-text failed", details: String(err) },
            { status: 500 }
        );
    }
}
