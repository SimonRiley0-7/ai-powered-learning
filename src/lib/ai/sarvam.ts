/**
 * Sarvam AI Module — Deep Reasoning Layer (REAL API)
 * Uses Sarvam AI's OpenAI-compatible API at api.sarvam.ai
 * Handles: POV detection, writing style analysis, originality scoring,
 * deep reasoning evaluation, and career aptitude clustering.
 */

// ──────────────────────────────────────────────
// SARVAM API CLIENT
// ──────────────────────────────────────────────

const SARVAM_BASE_URL = "https://api.sarvam.ai/v1/chat/completions";

async function callSarvam(systemPrompt: string, userPrompt: string): Promise<string> {
    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) throw new Error("SARVAM_API_KEY is missing from environment variables");

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
                { role: "user", content: userPrompt },
            ],
            temperature: 0.2,
            max_tokens: 2048,
            response_format: { type: "json_object" },
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error(`❌ Sarvam API error (${response.status}):`, errText);
        throw new Error(`Sarvam API returned ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "{}";
}

// ──────────────────────────────────────────────
// INTERFACES
// ──────────────────────────────────────────────

export interface OriginalityMetrics {
    ai_generated_probability: number;
    pov_presence_score: number;
    originality_score: number;
    style_inconsistency_flag: boolean;
}

export interface POVAnalysis {
    has_contextual_explanation: boolean;
    has_logical_flow: boolean;
    has_personal_framing: boolean;
    has_unique_structuring: boolean;
    has_example_reasoning: boolean;
    pov_score: number;
}

export interface DeepReasoningScore {
    analytical_depth: number;
    argument_structure: number;
    balanced_viewpoint: number;
    evidence_usage: number;
    overall: number;
}

export interface CareerMapping {
    ai_aptitude_score: number;
    recommended_roles: string[];
    confidence_levels: Record<string, number>;
    reasoning_strengths: string[];
    improvement_areas: string[];
    skill_gap_analysis: string[];
    learning_path_recommendation: string[];
}

// ──────────────────────────────────────────────
// POV DETECTION
// ──────────────────────────────────────────────

export async function detectPOV(answer: string): Promise<POVAnalysis> {
    const system = `You are a writing analysis expert. Analyze academic answers for personal point-of-view indicators. You must respond with strict JSON only.`;

    const user = `Analyze this answer for POV indicators:

ANSWER:
${answer}

Check for:
1. Contextual explanation (not just definitions)
2. Logical flow transitions between ideas
3. Personal framing phrases ("In my understanding…", "This indicates…")
4. Unique structuring patterns (not textbook copy)
5. Example-based reasoning with original examples

Return JSON:
{"has_contextual_explanation":bool,"has_logical_flow":bool,"has_personal_framing":bool,"has_unique_structuring":bool,"has_example_reasoning":bool,"pov_score":number(0-100)}`;

    try {
        console.log("🧠 [Sarvam AI] Analyzing POV...");
        const raw = await callSarvam(system, user);
        console.log("✅ [Sarvam AI] POV analysis complete");
        return JSON.parse(raw);
    } catch (err) {
        console.error("⚠️ [Sarvam AI] POV detection failed, using defaults:", err);
        return {
            has_contextual_explanation: false, has_logical_flow: false,
            has_personal_framing: false, has_unique_structuring: false,
            has_example_reasoning: false, pov_score: 50
        };
    }
}

// ──────────────────────────────────────────────
// AI-GENERATED CONTENT DETECTION
// ──────────────────────────────────────────────

export async function analyzeOriginality(answers: string[]): Promise<OriginalityMetrics> {
    const system = `You are an AI-generated content detection expert. You must respond with strict JSON only.`;

    const answersText = answers.map((a, i) => `ANSWER ${i + 1}:\n${a}`).join("\n\n---\n\n");

    const user = `Analyze these answers for signs of AI generation:

${answersText}

Check for:
- Overly generic, textbook-style answers
- Emotionless neutral tone lacking interpretive phrasing
- Repetitive AI transitions ("Furthermore", "Moreover")
- Uniform sentence lengths (AI pattern)
- Style consistency across answers (humans vary, AI stays uniform)

If drastic style changes between answers, set style_inconsistency_flag=true.

Return JSON:
{"ai_generated_probability":number(0-100),"pov_presence_score":number(0-100),"originality_score":number(0-100),"style_inconsistency_flag":bool}`;

    try {
        console.log("🧠 [Sarvam AI] Analyzing originality across", answers.length, "answers...");
        const raw = await callSarvam(system, user);
        console.log("✅ [Sarvam AI] Originality analysis complete");
        return JSON.parse(raw);
    } catch (err) {
        console.error("⚠️ [Sarvam AI] Originality analysis failed:", err);
        return { ai_generated_probability: 0, pov_presence_score: 50, originality_score: 50, style_inconsistency_flag: false };
    }
}

// ──────────────────────────────────────────────
// DEEP REASONING SCORING
// ──────────────────────────────────────────────

export async function scoreDeepReasoning(question: string, answer: string, maxPoints: number): Promise<DeepReasoningScore> {
    const system = `You are an academic evaluator specializing in analytical reasoning assessment. You must respond with strict JSON only.`;

    const user = `QUESTION: ${question}
ANSWER: ${answer}
MAX POINTS: ${maxPoints}

Evaluate on 4 dimensions (each 0–10):
1. Analytical Depth
2. Argument Structure
3. Balanced Viewpoint
4. Evidence Usage

Return JSON:
{"analytical_depth":number,"argument_structure":number,"balanced_viewpoint":number,"evidence_usage":number,"overall":number(sum, max 40)}`;

    try {
        console.log("🧠 [Sarvam AI] Scoring deep reasoning...");
        const raw = await callSarvam(system, user);
        console.log("✅ [Sarvam AI] Deep reasoning scored");
        return JSON.parse(raw);
    } catch (err) {
        console.error("⚠️ [Sarvam AI] Deep reasoning failed:", err);
        return { analytical_depth: 0, argument_structure: 0, balanced_viewpoint: 0, evidence_usage: 0, overall: 0 };
    }
}

// ──────────────────────────────────────────────
// CAREER INTELLIGENCE MAPPING
// ──────────────────────────────────────────────

export async function generateCareerMapping(questions: string[], answers: string[]): Promise<CareerMapping> {
    const system = `You are a Career Intelligence AI. Analyze assessment responses to map career aptitude. You must respond with strict JSON only.`;

    const qa = questions.map((q, i) => `Q${i + 1}: ${q}\nA${i + 1}: ${answers[i] || "(no answer)"}`).join("\n\n");

    const user = `Based on these AI-related assessment responses:

${qa}

Generate career mapping:
1. AI Aptitude Score (0-100)
2. Top 3 recommended AI/tech roles
3. Confidence level per role (0-100%)
4. Reasoning strengths demonstrated
5. Improvement areas
6. Skill gaps
7. Learning path recommendations

Return JSON:
{"ai_aptitude_score":number,"recommended_roles":["r1","r2","r3"],"confidence_levels":{"r1":num,"r2":num,"r3":num},"reasoning_strengths":["s1"],"improvement_areas":["a1"],"skill_gap_analysis":["g1"],"learning_path_recommendation":["l1"]}`;

    try {
        console.log("🧠 [Sarvam AI] Generating career mapping...");
        const raw = await callSarvam(system, user);
        console.log("✅ [Sarvam AI] Career mapping complete");
        return JSON.parse(raw);
    } catch (err) {
        console.error("⚠️ [Sarvam AI] Career mapping failed:", err);
        return {
            ai_aptitude_score: 0, recommended_roles: [], confidence_levels: {},
            reasoning_strengths: [], improvement_areas: [],
            skill_gap_analysis: [], learning_path_recommendation: []
        };
    }
}
