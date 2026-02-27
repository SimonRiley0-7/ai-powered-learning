import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const transcription = await groq.audio.transcriptions.create({
            file: file,
            model: "whisper-large-v3-turbo",
        });

        return NextResponse.json({ transcript: transcription.text });
    } catch (error: unknown) {
        console.error("Transcription error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to transcribe audio" },
            { status: 500 }
        );
    }
}
