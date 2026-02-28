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
- "courses" -> "/courses"
- "login" -> "/login"
- "logout" -> "/api/auth/signout"
- "next_question" -> "ACTION_EVENT:next_question"
- "prev_question" -> "ACTION_EVENT:prev_question"
- "submit_assessment" -> "ACTION_EVENT:submit_assessment"
- "simplify_content" -> "ACTION_EVENT:simplify_content"
- "go_to_lesson" -> "ACTION_EVENT:go_to_lesson"
- "go_to_video" -> "ACTION_EVENT:go_to_video"
- "go_to_quiz" -> "ACTION_EVENT:go_to_quiz"
- "go_to_practice" -> "ACTION_EVENT:go_to_practice"
- "go_to_reflection" -> "ACTION_EVENT:go_to_reflection"
- "select_option_a" -> "ACTION_EVENT:select_option_a"
- "select_option_b" -> "ACTION_EVENT:select_option_b"
- "select_option_c" -> "ACTION_EVENT:select_option_c"
- "select_option_d" -> "ACTION_EVENT:select_option_d"

If they want to browse or see courses (e.g., "show me courses", "open course catalogue"):
Set intent to "courses", and action to "/courses"

If they want to take a specific assessment (e.g., "take assignment of operating systems"):
Set intent to "take_assessment", and extract the subject/topic as a search query.
Since we don't know the exact ID, map the action to: "/dashboard"

If they want to take a specific course (e.g., "I want to learn social confidence", "take the computer science course"):
Set intent to "take_course", and extract the course name as a search query.
Map the action to: "/courses"

If they want to simplify the current lesson (e.g., "simplify this", "make it easier", "lower difficulty"):
Set intent to "simplify_content", and action to "ACTION_EVENT:simplify_content"

If they want to go to a specific module section (e.g., "go to the video", "show me the quiz", "move to practice"):
Map the intent to "go_to_[section]" and action to "ACTION_EVENT:go_to_[section]"

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
