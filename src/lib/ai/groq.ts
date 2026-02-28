"use server";

import Groq from "groq-sdk";

const getGroqClient = () => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error("GROQ_API_KEY is missing from environment variables.");
    }
    return new Groq({ apiKey });
};

export interface GradingResponse {
    totalScore: number;
    maxScore: number;
    rubricBreakdown: {
        criteria: string;
        maxMarks: number;
        awarded: number;
        reason: string;
    }[];
    improvementSuggestions: string;
}

/**
 * Grades a descriptive answer using Groq (Llama 3.3).
 * @param prompt The original assessment question
 * @param expectedAnswer The expected or ideal answer (if available)
 * @param userAnswer The candidate's actual answer
 * @param maxPoints The maximum points possible for this question
 */
export async function gradeDescriptiveAnswer(
    prompt: string,
    expectedAnswer: string | null | undefined,
    userAnswer: string,
    maxPoints: number
): Promise<GradingResponse> {
    const groq = getGroqClient();

    const systemInstruction = `You are a strict academic evaluator. Return ONLY valid JSON matching this schema. Do not include extra text.
CRITICAL: If the user's answer is completely wrong, irrelevant, nonsense, or blank, you MUST award a totalScore of 0 and 0 marks in the rubric.
{
  "totalScore": number,
  "maxScore": ${maxPoints},
  "rubricBreakdown": [
    {
      "criteria": string,
      "maxMarks": number,
      "awarded": number,
      "reason": string
    }
  ],
  "improvementSuggestions": string
}`;

    const promptText = `
QUESTION PROMPT:
${prompt}

EXPECTED ANSWER / KEY:
${expectedAnswer || "None explicitly provided. Use general academic knowledge."}

USER'S ANSWER:
${userAnswer}
`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: promptText }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1, // Deterministic grading
            response_format: { type: "json_object" }
        });

        const textResponse = completion.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(textResponse);

        // STABILIZATION: Strict parsing and bounding
        let totalScore = Number(parsed.totalScore) || 0;
        if (totalScore < 0) totalScore = 0;
        if (totalScore > maxPoints) totalScore = maxPoints;

        const rubricBreakdown = Array.isArray(parsed.rubricBreakdown) ? parsed.rubricBreakdown.map((item: Record<string, unknown>) => {
            let awarded = Number(item.awarded) || 0;
            const maxMarks = Number(item.maxMarks) || 0;
            if (awarded < 0) awarded = 0;
            if (awarded > maxMarks) awarded = maxMarks;

            return {
                criteria: String(item.criteria || "General Evaluation"),
                maxMarks,
                awarded,
                reason: String(item.reason || "")
            };
        }) : [{ criteria: "Completeness", maxMarks: maxPoints, awarded: totalScore, reason: "Fallback evaluation." }];

        // Re-calculate total from bounds-checked breakdown if it mismatches heavily
        const calculatedTotal = rubricBreakdown.reduce((sum: number, item: { awarded: number }) => sum + item.awarded, 0);
        if (Math.abs(calculatedTotal - totalScore) > 0.5) {
            totalScore = calculatedTotal <= maxPoints ? calculatedTotal : maxPoints;
        }

        return {
            totalScore,
            maxScore: maxPoints,
            rubricBreakdown,
            improvementSuggestions: String(parsed.improvementSuggestions || "No suggestions provided.")
        };
    } catch (error) {
        console.error("AI Grading failed:", error);
        return {
            totalScore: 0,
            maxScore: maxPoints,
            rubricBreakdown: [
                { criteria: "Evaluation Error", maxMarks: maxPoints, awarded: 0, reason: "The AI evaluator returned an invalid response." }
            ],
            improvementSuggestions: "System encountered an error parsing the grading rubrics."
        };
    }
}

/**
 * Simplifies a question prompt for Cognitive Accessibility modes using Groq.
 * Targets a 6th-grade reading level.
 * @param prompt The original complex question prompt
 */
export async function explainSimply(prompt: string): Promise<string> {
    const groq = getGroqClient();

    const systemInstruction = `Rewrite the user's question in simpler language suitable for a grade 6 reading level. 
Do NOT answer the question. Only simplify the phrasing. Keep the core meaning exactly the same.`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: prompt }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.3,
        });

        return completion.choices[0]?.message?.content?.trim() || prompt;
    } catch (error) {
        console.error("AI Simplification failed:", error);
        return prompt; // Fallback to original text if AI fails
    }
}
