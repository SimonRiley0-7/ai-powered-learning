import { NextRequest, NextResponse } from "next/server";

const SARVAM_BASE_URL = "https://api.sarvam.ai/v1/chat/completions";

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.SARVAM_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
        }

        const body = await req.json();
        const { transcript } = body;

        if (!transcript) {
            return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
        }

        const systemPrompt = `You are a voice navigation assistant for an AI assessment platform. 
Map the user's spoken command to the correct navigation intent and target URL.
You must return your response in strict JSON format.

Available Intents and URLs:
- "dashboard" -> "/dashboard"
- "settings" -> "/dashboard/settings"
- "results" -> "/dashboard/results"
- "login" -> "/login"
- "logout" -> "/api/auth/signout"
- "next_question" -> "ACTION_EVENT:next_question"
- "prev_question" -> "ACTION_EVENT:prev_question"
- "submit_assessment" -> "ACTION_EVENT:submit_assessment"

If they want to take a specific assessment (e.g., "take assignment of operating systems"):
Set intent to "take_assessment", and extract the subject/topic as a search query.
Since we don't know the exact ID, map the action to: "/dashboard"

If you cannot confidently map to any intent, set intent to "unknown" and action to "".

JSON Format:
{
  "intent": "string",
  "action": "string",
  "confidence": number(0-100)
}`;

        const response = await fetch(SARVAM_BASE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "sarvam-m",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `User command: "${transcript}"` },
                ],
                temperature: 0.1,
                max_tokens: 100,
                response_format: { type: "json_object" },
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Sarvam Intent API Error:", errText);
            return NextResponse.json({ error: "Failed to parse intent" }, { status: 500 });
        }

        const data = await response.json();
        let content = data.choices[0]?.message?.content || "{}";

        // Remove markdown formatting if the model wrapped it
        content = content.replace(/```json/g, "").replace(/```/g, "").trim();

        const result = JSON.parse(content);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Intent parsing error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
