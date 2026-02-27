import { GoogleGenerativeAI } from "@google/generative-ai";

const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is missing from environment variables.");
    }
    return new GoogleGenerativeAI(apiKey);
};

export interface AIGradingResult {
    score: number;
    feedback: string;
}

/**
 * Grades a descriptive answer using Gemini.
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
): Promise<AIGradingResult> {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1, // Low temperature for deterministic grading
        }
    });

    const systemInstruction = `You are a strict, objective academic evaluator. 
Grade the user's answer based on correctness, completeness, and clarity. 
Provide a score between 0 and ${maxPoints}.
You must respond strictly with valid JSON in this exact structure:
{
  "score": <number>,
  "feedback": "<string: concise feedback explaining the deduction or praising the accuracy>"
}`;

    const promptText = `
${systemInstruction}

QUESTION PROMPT:
${prompt}

EXPECTED ANSWER / KEY:
${expectedAnswer || "None explicitly provided. Use general academic knowledge."}

USER'S ANSWER:
${userAnswer}
`;

    try {
        const result = await model.generateContent(promptText);
        const textResponse = result.response.text();

        const parsed = JSON.parse(textResponse);

        let score = Number(parsed.score);
        if (isNaN(score)) score = 0;
        // Clamp score
        if (score < 0) score = 0;
        if (score > maxPoints) score = maxPoints;

        return {
            score,
            feedback: parsed.feedback || "Evaluated by AI."
        };
    } catch (error) {
        console.error("AI Grading failed:", error);
        return {
            score: 0,
            feedback: "AI Grading Engine encountered an error and could not evaluate this response."
        };
    }
}

/**
 * Simplifies a question prompt for Cognitive Accessibility modes.
 * Targets a 6th-grade reading level.
 * @param prompt The original complex question prompt
 */
export async function explainSimply(prompt: string): Promise<string> {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash"
    });

    const promptText = `Rewrite the following question in simpler language suitable for a grade 6 reading level. 
Do NOT answer the question. Only simplify the phrasing. Keep the core meaning exactly the same.

ORIGINAL QUESTION:
${prompt}
`;

    try {
        const result = await model.generateContent(promptText);
        return result.response.text().trim();
    } catch (error) {
        console.error("AI Simplification failed:", error);
        return prompt; // Fallback to original text if AI fails
    }
}
