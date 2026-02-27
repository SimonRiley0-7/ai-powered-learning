/**
 * Sarvam Voice API Module
 * STT: Saaras v3 — Speech-to-Text (11 Indian languages + English)
 * TTS: Bulbul v3 — Text-to-Speech (30+ voices, 11 languages)
 */

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || "";
const SARVAM_BASE = "https://api.sarvam.ai";

// ──────────────────────────────────────────────
// LANGUAGE SUPPORT
// ──────────────────────────────────────────────

export const SUPPORTED_LANGUAGES = [
    { code: "hi-IN", name: "Hindi", native: "हिन्दी" },
    { code: "bn-IN", name: "Bengali", native: "বাংলা" },
    { code: "ta-IN", name: "Tamil", native: "தமிழ்" },
    { code: "te-IN", name: "Telugu", native: "తెలుగు" },
    { code: "gu-IN", name: "Gujarati", native: "ગુજરાતી" },
    { code: "kn-IN", name: "Kannada", native: "ಕನ್ನಡ" },
    { code: "ml-IN", name: "Malayalam", native: "മലയാളം" },
    { code: "mr-IN", name: "Marathi", native: "मराठी" },
    { code: "pa-IN", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
    { code: "od-IN", name: "Odia", native: "ଓଡ଼ିଆ" },
    { code: "en-IN", name: "English", native: "English" },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]["code"];

// ──────────────────────────────────────────────
// SPEECH-TO-TEXT (Saaras v3)
// ──────────────────────────────────────────────

export interface STTResult {
    transcript: string;
    language_code: string;
    confidence?: number;
}

export async function transcribeAudio(
    audioBase64: string,
    languageCode?: string
): Promise<STTResult> {
    if (!SARVAM_API_KEY) {
        throw new Error("SARVAM_API_KEY not configured");
    }

    console.log("🎙️ [Sarvam STT] Transcribing audio...");

    const buffer = Buffer.from(audioBase64, "base64");
    const blob = new Blob([buffer], { type: "audio/webm" });

    const formData = new FormData();
    formData.append("file", blob, "audio.webm");
    formData.append("model", "saaras:v3");
    if (languageCode) {
        formData.append("language_code", languageCode);
    }

    const response = await fetch(`${SARVAM_BASE}/speech-to-text`, {
        method: "POST",
        headers: {
            "api-subscription-key": SARVAM_API_KEY,
        },
        body: formData,
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error(`❌ [Sarvam STT] API error (${response.status}):`, errText);
        throw new Error(`Sarvam STT failed: ${response.status}`);
    }

    const data = await response.json();
    const transcript = data.transcript || data.text || "";
    const detectedLang = data.language_code || languageCode || "en-IN";

    console.log(`✅ [Sarvam STT] "${transcript.slice(0, 50)}..." (${detectedLang})`);

    return {
        transcript,
        language_code: detectedLang,
        confidence: data.confidence,
    };
}

// ──────────────────────────────────────────────
// TEXT-TO-SPEECH (Bulbul v3)
// ──────────────────────────────────────────────

export interface TTSResult {
    audioBase64: string;
    request_id: string;
}

// Speaker voices for Bulbul v3
const DEFAULT_SPEAKERS: Record<string, string> = {
    "hi-IN": "meera",
    "bn-IN": "meera",
    "ta-IN": "meera",
    "te-IN": "meera",
    "gu-IN": "meera",
    "kn-IN": "meera",
    "ml-IN": "meera",
    "mr-IN": "meera",
    "pa-IN": "meera",
    "od-IN": "meera",
    "en-IN": "meera",
};

export async function synthesizeSpeech(
    text: string,
    languageCode: LanguageCode = "en-IN",
    speaker?: string
): Promise<TTSResult> {
    if (!SARVAM_API_KEY) {
        throw new Error("SARVAM_API_KEY not configured");
    }

    // Truncate to Bulbul v3 limit (2500 chars)
    const truncated = text.length > 2500 ? text.slice(0, 2497) + "..." : text;

    console.log(`🔊 [Sarvam TTS] Generating audio (${languageCode}, ${truncated.length} chars)...`);

    const response = await fetch(`${SARVAM_BASE}/text-to-speech`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "api-subscription-key": SARVAM_API_KEY,
        },
        body: JSON.stringify({
            inputs: [truncated],
            target_language_code: languageCode,
            speaker: speaker || DEFAULT_SPEAKERS[languageCode] || "meera",
            model: "bulbul:v2",
            pace: 1.0,
            sample_rate: 24000,
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error(`❌ [Sarvam TTS] API error (${response.status}):`, errText);
        throw new Error(`Sarvam TTS failed: ${response.status}`);
    }

    const data = await response.json();
    const audioBase64 = data.audios?.[0] || "";

    console.log(`✅ [Sarvam TTS] Audio generated (${audioBase64.length} chars base64)`);

    return {
        audioBase64,
        request_id: data.request_id || "",
    };
}
