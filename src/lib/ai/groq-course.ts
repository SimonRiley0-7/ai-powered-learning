/**
 * Groq Course AI Engine
 * Handles all LLM-powered learning operations:
 * - Personalized concept explanations
 * - Simplified mode content rewriting
 * - AI recommendation generation
 * - Reflection grading
 * - Social task breakdown + safety planning
 */

import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "llama-3.3-70b-versatile";

// ── TYPES ────────────────────────────────────────────────────────

export interface LearningProfile {
    disabilityType: string;
    weakTopics: string[];
    strongTopics: string[];
    avgQuizAccuracy: number;
    avgReflectionQuality: number;
    learningSpeed: string;
    emotionalTone: string;
    preferSimplified: boolean;
    socialConfidenceScore?: number | null;
}

export interface PersonalizedContent {
    explanation: string;
    keyPoints: string[];
    analogy?: string;
    example?: string;
}

export interface AIRecommendation {
    title: string;
    reason: string;
    actionLabel: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
}

export interface ReflectionGrade {
    score: number;       // 0–100
    feedback: string;
    depthRating: "SHALLOW" | "DEVELOPING" | "DEEP";
    approved: boolean;
}

export interface SocialTaskBreakdown {
    steps: string[];
    safetyGuidance: string;
    backupPlan: string;
    reflectionTemplate: string;
    encouragement: string;
}

// ── HELPERS ──────────────────────────────────────────────────────

function profileContext(profile: LearningProfile): string {
    const tone = profile.emotionalTone.toLowerCase();
    const speed = profile.learningSpeed.toLowerCase();
    const accessibility = profile.disabilityType !== "NONE"
        ? `The learner has ${profile.disabilityType.toLowerCase()} impairment.`
        : "The learner has no declared disability.";

    return `
Learner profile:
- Disability: ${accessibility}
- Learning speed: ${speed}
- Emotional tone: ${tone}
- Quiz accuracy: ${Math.round(profile.avgQuizAccuracy)}%
- Prefers simplified explanations: ${profile.preferSimplified}
- Weak topics: ${profile.weakTopics.join(", ") || "none identified"}
- Strong topics: ${profile.strongTopics.join(", ") || "none identified"}
`.trim();
}

function safeJSON<T>(text: string, fallback: T): T {
    try {
        const match = text.match(/```(?:json)?\s*([\s\S]+?)```/);
        return JSON.parse(match ? match[1] : text) as T;
    } catch {
        return fallback;
    }
}

// ── 1. PERSONALIZED CONCEPT EXPLANATION ──────────────────────────

export async function generatePersonalizedExplanation(
    profile: LearningProfile,
    conceptText: string,
    moduleTitle: string,
): Promise<PersonalizedContent> {
    const toneInstruction = profile.emotionalTone === "NERVOUS"
        ? "Use a warm, encouraging, patient tone. Reassure the learner frequently."
        : profile.emotionalTone === "CONFIDENT"
            ? "Use a direct, efficient tone. Skip over-explanation."
            : "Use a calm, clear, neutral tone.";

    const depthInstruction = profile.avgQuizAccuracy < 40
        ? "Explain in small steps. Assume minimal prior knowledge."
        : profile.avgQuizAccuracy > 75
            ? "Keep the explanation concise — the learner grasps concepts quickly."
            : "Balance depth and brevity.";

    const a11yInstruction = profile.disabilityType === "VISUAL"
        ? "Avoid references to visual elements. Use audio descriptions and metaphors instead."
        : profile.disabilityType === "COGNITIVE"
            ? "Use very simple words. Short sentences only. One idea per sentence."
            : profile.disabilityType === "MOTOR"
                ? "Use flowing narrative. Avoid lists requiring clicks."
                : "";

    const prompt = `
You are an expert adaptive learning engine. Rewrite the concept below for this specific learner.

${profileContext(profile)}

Module: ${moduleTitle}

Original Concept:
${conceptText}

INSTRUCTIONS:
- ${toneInstruction}
- ${depthInstruction}
${a11yInstruction ? `- ${a11yInstruction}` : ""}
- Keep the core academic content identical.
- Extract 3–5 key points as bullet strings.
- If helpful, provide one short analogy (optional).
- If helpful, provide one concrete real-world example (optional).

Respond ONLY with valid JSON in this format:
\`\`\`json
{
  "explanation": "...",
  "keyPoints": ["...", "..."],
  "analogy": "...",
  "example": "..."
}
\`\`\`
`;

    try {
        const res = await groq.chat.completions.create({
            model: MODEL,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.6,
            max_tokens: 1200,
        });
        const text = res.choices[0]?.message?.content || "";
        return safeJSON<PersonalizedContent>(text, {
            explanation: conceptText,
            keyPoints: [],
        });
    } catch {
        return { explanation: conceptText, keyPoints: [] };
    }
}

// ── 2. SIMPLIFIED MODE CONTENT REWRITING ────────────────────────

export async function generateSimplifiedContent(
    conceptText: string,
    moduleTitle: string,
): Promise<PersonalizedContent> {
    const prompt = `
You are an expert at breaking down complex concepts into simple, accessible language.

Module: ${moduleTitle}

Original Concept:
${conceptText}

Rewrite this concept in SIMPLIFIED MODE:
- Use bullet points for every key idea
- Maximum sentence length: 15 words
- Add 1 real-world analogy
- Add 1 concrete everyday example
- End with a "Quick Recap" section (3 bullet points)
- Use encouraging language

Respond ONLY with valid JSON:
\`\`\`json
{
  "explanation": "... (full simplified text with bullets, analogy, example, recap)",
  "keyPoints": ["...", "...", "..."],
  "analogy": "...",
  "example": "..."
}
\`\`\`
`;

    try {
        const res = await groq.chat.completions.create({
            model: MODEL,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
            max_tokens: 1000,
        });
        const text = res.choices[0]?.message?.content || "";
        return safeJSON<PersonalizedContent>(text, {
            explanation: conceptText,
            keyPoints: [],
        });
    } catch {
        return { explanation: conceptText, keyPoints: [] };
    }
}

// ── 3. AI RECOMMENDATIONS ────────────────────────────────────────

export async function generateAIRecommendations(
    profile: LearningProfile,
    enrolledCourseTitles: string[],
    availableCourseTitles: string[],
): Promise<AIRecommendation[]> {
    const prompt = `
You are a personalized learning advisor for an accessibility-first platform.

${profileContext(profile)}

Enrolled courses: ${enrolledCourseTitles.join(", ") || "none"}
Available courses: ${availableCourseTitles.join(", ") || "none listed"}

Generate exactly 3 personalized recommendations. Each should feel unique and specific to this learner.
Recommendations can be:
- A course to enroll in
- A topic to revisit
- A learning habit suggestion
- A practice activity
- An encouragement for a specific weakness

Respond ONLY with valid JSON:
\`\`\`json
[
  {
    "title": "...",
    "reason": "...",
    "actionLabel": "...",
    "priority": "HIGH"
  },
  ...
]
\`\`\`
`;

    try {
        const res = await groq.chat.completions.create({
            model: MODEL,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.75,
            max_tokens: 800,
        });
        const text = res.choices[0]?.message?.content || "";
        return safeJSON<AIRecommendation[]>(text, []);
    } catch {
        return [];
    }
}

// ── 4. REFLECTION GRADING ────────────────────────────────────────

export async function gradeReflection(
    reflectionPrompt: string,
    reflectionText: string,
    moduleTitle: string,
    minWords: number,
): Promise<ReflectionGrade> {
    const wordCount = reflectionText.trim().split(/\s+/).length;

    if (wordCount < minWords) {
        return {
            score: 0,
            feedback: `Your reflection is too short (${wordCount} words). Please write at least ${minWords} words.`,
            depthRating: "SHALLOW",
            approved: false,
        };
    }

    const prompt = `
You are grading a course reflection submission.

Module: ${moduleTitle}
Reflection prompt: "${reflectionPrompt}"
Student reflection: "${reflectionText}"
Word count: ${wordCount}

Grade on these criteria:
1. Relevance to prompt (0–30): Does it actually address the question?
2. Depth of insight (0–40): Does it show genuine thinking, not just summary?
3. Personal connection (0-20): Does the learner connect to their own experience?
4. Clarity (0–10): Is it clearly written?

Provide:
- A total score from 0–100
- Whether it is APPROVED (score >= 50)
- Depth rating: SHALLOW (0–40), DEVELOPING (41–70), DEEP (71–100)
- Short, constructive feedback (2–3 sentences)

Respond ONLY with valid JSON:
\`\`\`json
{
  "score": 75,
  "feedback": "...",
  "depthRating": "DEVELOPING",
  "approved": true
}
\`\`\`
`;

    try {
        const res = await groq.chat.completions.create({
            model: MODEL,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 400,
        });
        const text = res.choices[0]?.message?.content || "";
        const result = safeJSON<ReflectionGrade>(text, {
            score: 0,
            feedback: "Unable to grade reflection. Please try again.",
            depthRating: "SHALLOW",
            approved: false,
        });
        result.approved = result.score >= 50;
        return result;
    } catch {
        return {
            score: 50,
            feedback: "Reflection accepted. Our grading system encountered an issue — your response has been recorded.",
            depthRating: "DEVELOPING",
            approved: true,
        };
    }
}

// ── 5. QUIZ FAILURE RE-EXPLANATION ───────────────────────────────

export async function regenerateConceptAfterFailure(
    conceptText: string,
    moduleTitle: string,
    wrongAnswers: string[],
): Promise<string> {
    const prompt = `
A learner just failed a quiz on: "${moduleTitle}".
They answered incorrectly on: ${wrongAnswers.join("; ")}

Rewrite the concept below with EXTRA clarity to help them understand the areas they missed:
${conceptText}

Rules:
- Use very simple language
- Focus on correcting misconceptions from their wrong answers
- Use a short numbered step format
- Add an encouraging closing line

Output only the rewritten explanation text (no JSON needed).
`;

    try {
        const res = await groq.chat.completions.create({
            model: MODEL,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
            max_tokens: 700,
        });
        return res.choices[0]?.message?.content || conceptText;
    } catch {
        return conceptText;
    }
}

// ── 6. SOCIAL CONFIDENCE TASK BREAKDOWN ──────────────────────────

export async function generateSocialTaskBreakdown(
    taskDescription: string,
    fearRating: number,
    whyDifficult: string,
): Promise<SocialTaskBreakdown> {
    const prompt = `
You are a compassionate social confidence coach on an accessible learning platform.

A learner has submitted a personal challenge they want to work on:

Task: "${taskDescription}"
Fear rating: ${fearRating}/10
Why this is difficult: "${whyDifficult}"

Generate a safe, supportive breakdown:

SAFETY RULES (these are absolute):
- No task should involve confronting strangers without safety measures
- No task should involve any form of harassment or boundary violations
- Always include an "opt-out" or backup plan
- Tasks should be gradual, not sudden

Provide:
1. step-by-step breakdown (5–7 manageable steps, each ≤ 2 sentences)
2. Safety guidance (2–3 sentences)
3. Backup plan (what to do if they feel overwhelmed)
4. Reflection template (3 fill-in-the-blank sentences they can answer after)
5. An encouraging closing message (2–3 sentences, warm tone)

Respond ONLY with valid JSON:
\`\`\`json
{
  "steps": ["Step 1: ...", "Step 2: ...", ...],
  "safetyGuidance": "...",
  "backupPlan": "...",
  "reflectionTemplate": "After attempting this task, I felt... The hardest part was... Next time I would...",
  "encouragement": "..."
}
\`\`\`
`;

    try {
        const res = await groq.chat.completions.create({
            model: MODEL,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.6,
            max_tokens: 1000,
        });
        const text = res.choices[0]?.message?.content || "";
        return safeJSON<SocialTaskBreakdown>(text, {
            steps: ["Start with something small and safe."],
            safetyGuidance: "Always prioritize your wellbeing. Stop if uncomfortable.",
            backupPlan: "It's okay to step back. Try again when ready.",
            reflectionTemplate: "After attempting this task, I felt... The hardest part was... Next time I would...",
            encouragement: "Every small step counts. You're doing great.",
        });
    } catch {
        return {
            steps: ["Start with something small and safe."],
            safetyGuidance: "Always prioritize your wellbeing.",
            backupPlan: "It's okay to step back and try again when ready.",
            reflectionTemplate: "After attempting this task, I felt... The hardest part was... Next time I would...",
            encouragement: "Every small step forward matters. You've got this.",
        };
    }
}

// ── 7. GROWTH SUMMARY (for Certificate) ─────────────────────────

export async function generateGrowthSummary(
    courseTitle: string,
    reflections: string[],
    taskCount: number,
    finalScore: number,
): Promise<string> {
    const prompt = `
Write a short, warm Growth Summary (3–4 sentences) for a learner who completed: "${courseTitle}".

Their journey:
- Completed ${taskCount} tasks
- Final score: ${finalScore}%
- Key reflection themes: ${reflections.slice(0, 3).join(" | ")}

The summary should:
- Acknowledge specific growth (not generic praise)
- Reference what they worked through
- Be encouraging and forward-looking
- Sound personal, not corporate

Output only the summary text.
`;

    try {
        const res = await groq.chat.completions.create({
            model: MODEL,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 300,
        });
        return res.choices[0]?.message?.content?.trim() || "Congratulations on completing this course.";
    } catch {
        return "You have successfully completed this course and demonstrated real commitment to your learning journey.";
    }
}
