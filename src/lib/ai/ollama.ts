/**
 * Ollama Module — Deterministic Grading Layer (REAL LOCAL LLM)
 * Uses Ollama running locally at http://localhost:11434
 * Model: llama3.2
 * Handles: Keyword detection, marks calculation, numerical validation, format enforcement.
 */

// ──────────────────────────────────────────────
// OLLAMA API CLIENT
// ──────────────────────────────────────────────

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

async function callOllama(prompt: string): Promise<string> {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt,
                stream: false,
                format: "json",
                options: {
                    temperature: 0.1,  // Deterministic
                    num_predict: 2048,
                },
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`❌ [Ollama] API error (${response.status}):`, errText);
            throw new Error(`Ollama returned ${response.status}`);
        }

        const data = await response.json();
        return data.response || "{}";
    } catch (err) {
        console.error("⚠️ [Ollama] Connection failed — is Ollama running? (`ollama serve`):", err);
        throw err;
    }
}

// ──────────────────────────────────────────────
// INTERFACES
// ──────────────────────────────────────────────

export interface MarksDistribution {
    concept_accuracy: { max: number; awarded: number };
    logical_reasoning: { max: number; awarded: number };
    required_points_coverage: { max: number; awarded: number };
    keyword_accuracy: { max: number; awarded: number };
    structure_coherence: { max: number; awarded: number };
    length_compliance: { max: number; awarded: number };
    original_thought: { max: number; awarded: number };
    total: { max: number; awarded: number };
}

export interface PointValidation {
    point: string;
    covered: boolean;
    depth: "LOW" | "MEDIUM" | "HIGH";
}

export interface KeywordAnalysis {
    mandatory_matches: { keyword: string; found: boolean }[];
    supporting_matches: { keyword: string; found: boolean }[];
    keyword_match_percentage: number;
    keyword_density: number;
    keyword_penalty: boolean;
}

export interface NumericalValidation {
    formula_correct: boolean;
    step_sequence_valid: boolean;
    final_value_correct: boolean;
    partial_marks: number;
    steps_analysis: { step: string; correct: boolean; marks: number }[];
}

// ──────────────────────────────────────────────
// TABLE 1: MARKS DISTRIBUTION (via Ollama)
// ──────────────────────────────────────────────

export async function calculateMarksDistribution(
    question: string,
    answer: string,
    maxPoints: number,
    expectedStructure?: string | null
): Promise<MarksDistribution> {
    const prompt = `You are a deterministic academic grading engine. Grade with STRICT consistency.
Return ONLY valid JSON, no other text.

QUESTION: ${question}
ANSWER: ${answer}
MAX TOTAL MARKS: ${maxPoints}
EXPECTED STRUCTURE: ${expectedStructure || "standard academic answer"}

Distribute marks across 7 criteria. Sum of max values MUST equal ${maxPoints}.
Proportions: Concept Accuracy ~25%, Logical Reasoning ~20%, Points Coverage ~15%, Keyword Accuracy ~10%, Structure ~10%, Length ~10%, Original Thought ~10%.

Return this exact JSON structure:
{"concept_accuracy":{"max":0,"awarded":0},"logical_reasoning":{"max":0,"awarded":0},"required_points_coverage":{"max":0,"awarded":0},"keyword_accuracy":{"max":0,"awarded":0},"structure_coherence":{"max":0,"awarded":0},"length_compliance":{"max":0,"awarded":0},"original_thought":{"max":0,"awarded":0},"total":{"max":${maxPoints},"awarded":0}}`;

    try {
        console.log("🔧 [Ollama] Calculating marks distribution...");
        const raw = await callOllama(prompt);
        const result = JSON.parse(raw);
        console.log("✅ [Ollama] Marks distribution complete:", result.total?.awarded, "/", maxPoints);
        return result;
    } catch {
        console.warn("⚠️ [Ollama] Marks calculation failed, using fallback");
        const base = Math.round(maxPoints / 7);
        const empty = { max: base, awarded: 0 };
        return {
            concept_accuracy: empty, logical_reasoning: empty,
            required_points_coverage: empty, keyword_accuracy: empty,
            structure_coherence: empty, length_compliance: empty,
            original_thought: empty, total: { max: maxPoints, awarded: 0 }
        };
    }
}

// ──────────────────────────────────────────────
// TABLE 2: REQUIRED POINTS VALIDATION (via Ollama)
// ──────────────────────────────────────────────

export async function validateRequiredPoints(
    question: string,
    answer: string,
    minPointsRequired: number
): Promise<PointValidation[]> {
    const prompt = `You are a deterministic content validation engine.
Return ONLY a valid JSON array, no other text.

QUESTION: ${question}
ANSWER: ${answer}
MINIMUM REQUIRED POINTS: ${minPointsRequired}

Identify the key conceptual points that should be covered. For each, check if the answer covers it and assess depth.
Generate at least ${minPointsRequired} points.

Return JSON array:
[{"point":"description","covered":true,"depth":"HIGH"},{"point":"description","covered":false,"depth":"LOW"}]`;

    try {
        console.log("🔧 [Ollama] Validating required points...");
        const raw = await callOllama(prompt);
        const result = JSON.parse(raw);
        // Ollama might return {points: [...]} or just [...]
        const points = Array.isArray(result) ? result : (result.points || result.items || []);
        console.log("✅ [Ollama] Points validation:", points.filter((p: PointValidation) => p.covered).length, "covered");
        return points;
    } catch {
        console.warn("⚠️ [Ollama] Points validation failed");
        return [];
    }
}

// ──────────────────────────────────────────────
// KEYWORD DETECTION & STUFFING (Pure logic, no LLM)
// ──────────────────────────────────────────────

export function analyzeKeywords(
    answer: string,
    mandatoryKeywords: string[],
    supportingKeywords: string[]
): KeywordAnalysis {
    const lowerAnswer = answer.toLowerCase();
    const totalWords = answer.split(/\s+/).length;

    const mandatory_matches = mandatoryKeywords.map(kw => ({
        keyword: kw,
        found: lowerAnswer.includes(kw.toLowerCase())
    }));

    const supporting_matches = supportingKeywords.map(kw => ({
        keyword: kw,
        found: lowerAnswer.includes(kw.toLowerCase())
    }));

    const allKeywords = [...mandatoryKeywords, ...supportingKeywords];
    const totalFound = [...mandatory_matches, ...supporting_matches].filter(m => m.found).length;
    const keyword_match_percentage = allKeywords.length > 0
        ? Math.round((totalFound / allKeywords.length) * 100)
        : 0;

    let keywordOccurrences = 0;
    for (const kw of allKeywords) {
        const regex = new RegExp(kw.toLowerCase(), "gi");
        const matches = lowerAnswer.match(regex);
        if (matches) keywordOccurrences += matches.length;
    }
    const keyword_density = totalWords > 0
        ? Math.round((keywordOccurrences / totalWords) * 100 * 100) / 100
        : 0;

    const keyword_penalty = keyword_density > 8;

    console.log(`🔧 [Ollama/Local] Keyword analysis: ${totalFound}/${allKeywords.length} matched, density=${keyword_density}%`);

    return { mandatory_matches, supporting_matches, keyword_match_percentage, keyword_density, keyword_penalty };
}

// ──────────────────────────────────────────────
// NUMERICAL STEP VALIDATION (via Ollama)
// ──────────────────────────────────────────────

export async function validateNumerical(
    question: string,
    answer: string,
    correctAnswer: string | null,
    maxPoints: number
): Promise<NumericalValidation> {
    const prompt = `You are a deterministic numerical grading engine.
Return ONLY valid JSON, no other text.

QUESTION: ${question}
STUDENT'S ANSWER: ${answer}
CORRECT ANSWER: ${correctAnswer || "Use domain knowledge"}
MAX MARKS: ${maxPoints}

Evaluate:
1. Is the formula correct?
2. Are computation steps in valid sequence?
3. Is the final value correct?
4. Award partial marks ONLY for correct steps.
CRITICAL: If the answer is completely wrong, irrelevant, or nonsense, you MUST award 0 partial_marks and set all booleans to false.

Return JSON EXACTLY matching this schema:
{"formula_correct":false,"step_sequence_valid":false,"final_value_correct":false,"partial_marks":0,"steps_analysis":[{"step":"desc","correct":false,"marks":0}]}`;

    try {
        console.log("🔧 [Ollama] Validating numerical answer...");
        const raw = await callOllama(prompt);
        const result = JSON.parse(raw);
        console.log("✅ [Ollama] Numerical validation:", result.partial_marks, "/", maxPoints);
        return result;
    } catch {
        console.warn("⚠️ [Ollama] Numerical validation failed");
        return {
            formula_correct: false, step_sequence_valid: false,
            final_value_correct: false, partial_marks: 0, steps_analysis: []
        };
    }
}

// ──────────────────────────────────────────────
// STRICT RELEVANCE CHECK (Pre-Grading Gate)
// ──────────────────────────────────────────────

export interface RelevanceResult {
    relevance_score: number;  // 0-100
    question_topic: string;
    answer_topic: string;
    is_relevant: boolean;
}

export async function checkRelevance(
    question: string,
    answer: string
): Promise<RelevanceResult> {
    const prompt = `You are a strict academic relevance checker. 
Return ONLY valid JSON, no other text.

QUESTION: ${question}
ANSWER: ${answer}

Your job: Determine if the answer is about the SAME TOPIC as the question.

Rules:
- If the answer discusses the question topic = relevant (score 60-100)
- If the answer is vaguely related but off-topic = partially relevant (score 40-59)
- If the answer is about a completely different subject = irrelevant (score 0-39)
- Random text, gibberish, or unrelated content = 0

Return JSON:
{"relevance_score":0,"question_topic":"extracted topic of question","answer_topic":"what the answer is actually about","is_relevant":true}`;

    try {
        console.log("🔍 [Ollama] Checking answer relevance...");
        const raw = await callOllama(prompt);
        const result = JSON.parse(raw);
        const score = Number(result.relevance_score) || 0;
        const relevant = score >= 40;
        console.log(`${relevant ? "✅" : "❌"} [Ollama] Relevance: ${score}/100 | Q: "${result.question_topic}" → A: "${result.answer_topic}"`);
        return {
            relevance_score: score,
            question_topic: result.question_topic || "unknown",
            answer_topic: result.answer_topic || "unknown",
            is_relevant: relevant,
        };
    } catch {
        console.warn("⚠️ [Ollama] Relevance check failed — defaulting to relevant");
        return { relevance_score: 70, question_topic: "unknown", answer_topic: "unknown", is_relevant: true };
    }
}

// ──────────────────────────────────────────────
// DIAGRAM EVALUATION (Text Description + Canvas JSON)
// ──────────────────────────────────────────────

export interface DiagramEvaluation {
    component_presence: { max: number; awarded: number };
    label_accuracy: { max: number; awarded: number };
    logical_flow: { max: number; awarded: number };
    explanation_alignment: { max: number; awarded: number };
    total: { max: number; awarded: number };
    detected_components: string[];
    missing_components: string[];
}

export async function evaluateDiagram(
    question: string,
    answer: string,
    maxPoints: number,
    requiredComponents?: string[]
): Promise<DiagramEvaluation> {
    const componentsList = requiredComponents?.length
        ? `\nREQUIRED COMPONENTS: ${requiredComponents.join(", ")}`
        : "";

    // Scoring: Component (37.5%), Label (25%), Flow (25%), Alignment (12.5%)
    const compMax = Math.round(maxPoints * 0.375);
    const labelMax = Math.round(maxPoints * 0.25);
    const flowMax = Math.round(maxPoints * 0.25);
    const alignMax = maxPoints - compMax - labelMax - flowMax;

    const prompt = `You are a strict diagram evaluation engine.
Return ONLY valid JSON, no other text.

QUESTION: ${question}
STUDENT'S DESCRIPTION/EXPLANATION: ${answer}${componentsList}
MAX MARKS: ${maxPoints}

Evaluate the student's diagram description on 4 criteria:
1. Component Presence (max ${compMax}): Are required diagram elements mentioned?
2. Label Accuracy (max ${labelMax}): Are labels/names correct?
3. Logical Flow (max ${flowMax}): Do connections/relationships make logical sense?
4. Explanation Alignment (max ${alignMax}): Does the written explanation match the diagram structure?

Also list which components were detected and which are missing.

Return JSON:
{"component_presence":{"max":${compMax},"awarded":0},"label_accuracy":{"max":${labelMax},"awarded":0},"logical_flow":{"max":${flowMax},"awarded":0},"explanation_alignment":{"max":${alignMax},"awarded":0},"total":{"max":${maxPoints},"awarded":0},"detected_components":["comp1"],"missing_components":["comp2"]}`;

    try {
        console.log("📐 [Ollama] Evaluating diagram...");
        const raw = await callOllama(prompt);
        const result = JSON.parse(raw);
        const totalAwarded = (Number(result.component_presence?.awarded) || 0) +
            (Number(result.label_accuracy?.awarded) || 0) +
            (Number(result.logical_flow?.awarded) || 0) +
            (Number(result.explanation_alignment?.awarded) || 0);
        console.log(`✅ [Ollama] Diagram evaluation: ${totalAwarded}/${maxPoints}`);
        return {
            component_presence: { max: compMax, awarded: Math.min(Number(result.component_presence?.awarded) || 0, compMax) },
            label_accuracy: { max: labelMax, awarded: Math.min(Number(result.label_accuracy?.awarded) || 0, labelMax) },
            logical_flow: { max: flowMax, awarded: Math.min(Number(result.logical_flow?.awarded) || 0, flowMax) },
            explanation_alignment: { max: alignMax, awarded: Math.min(Number(result.explanation_alignment?.awarded) || 0, alignMax) },
            total: { max: maxPoints, awarded: Math.min(totalAwarded, maxPoints) },
            detected_components: Array.isArray(result.detected_components) ? result.detected_components : [],
            missing_components: Array.isArray(result.missing_components) ? result.missing_components : [],
        };
    } catch {
        console.warn("⚠️ [Ollama] Diagram evaluation failed");
        return {
            component_presence: { max: compMax, awarded: 0 },
            label_accuracy: { max: labelMax, awarded: 0 },
            logical_flow: { max: flowMax, awarded: 0 },
            explanation_alignment: { max: alignMax, awarded: 0 },
            total: { max: maxPoints, awarded: 0 },
            detected_components: [],
            missing_components: requiredComponents || [],
        };
    }
}

