/**
 * Enterprise Grading Engine — Central Orchestrator
 * Routes grading tasks to the appropriate AI layer:
 * - Ollama (deterministic): relevance check, keyword detection, marks calculation, numerical & diagram validation
 * - Sarvam (deep reasoning): POV detection, style analysis, originality, career mapping
 */

import {
    calculateMarksDistribution,
    validateRequiredPoints,
    analyzeKeywords,
    validateNumerical,
    checkRelevance,
    evaluateDiagram,
    type MarksDistribution,
    type PointValidation,
    type KeywordAnalysis,
    type NumericalValidation,
    type DiagramEvaluation,
} from "./ollama";

import {
    detectPOV,
    analyzeOriginality,
    generateCareerMapping,
    type OriginalityMetrics,
    type CareerMapping,
} from "./sarvam";

// ──────────────────────────────────────────────
// INTERFACES
// ──────────────────────────────────────────────

export interface EnterpriseGradingResult {
    score: number;
    feedback: string;
    relevanceScore: number;
    marksDistribution: MarksDistribution;
    pointsValidation: PointValidation[];
    originalityMetrics: OriginalityMetrics | null;
    keywordAnalysis: KeywordAnalysis | null;
    integrityFlags: IntegrityFlags;
    careerMapping: CareerMapping | null;
    numericalValidation: NumericalValidation | null;
    diagramEvaluation: DiagramEvaluation | null;
}

export interface IntegrityFlags {
    irrelevant_answer_flag: boolean;
    ai_usage_suspected: boolean;
    style_inconsistency_flag: boolean;
    keyword_penalty: boolean;
    low_pov_flag: boolean;
    time_anomaly_flag: boolean;
}

interface QuestionMeta {
    id: string;
    prompt: string;
    type: string;
    correctAnswer: string | null;
    points: number;
    subject?: string | null;
    mandatoryKeywords?: string[];
    supportingKeywords?: string[];
    expectedStructure?: string | null;
    minWords?: number | null;
    optimalWords?: number | null;
    maxWords?: number | null;
    minPointsRequired?: number | null;
}

// ──────────────────────────────────────────────
// SINGLE ANSWER GRADING
// ──────────────────────────────────────────────

export async function gradeEnterpriseAnswer(
    question: QuestionMeta,
    answer: string,
): Promise<EnterpriseGradingResult> {

    // ── EMPTY ANSWER → instant 0 ──
    const trimmed = (answer || "").trim();
    if (trimmed.length < 3) {
        console.log("⛔ [Engine] Empty/blank answer — 0 marks");
        return zeroResult(question.points, "No answer provided. 0 marks awarded.");
    }

    // ── MCQ: Immediate deterministic ──
    if (question.type === "MCQ") {
        const correct = trimmed === question.correctAnswer;
        return {
            score: correct ? question.points : 0,
            feedback: correct ? "Correct" : `Incorrect. Expected: ${question.correctAnswer}`,
            relevanceScore: 100,
            marksDistribution: buildMCQDistribution(question.points, correct),
            pointsValidation: [],
            originalityMetrics: null,
            keywordAnalysis: null,
            integrityFlags: emptyFlags(),
            careerMapping: null,
            numericalValidation: null,
            diagramEvaluation: null,
        };
    }

    // ══════════════════════════════════════════════
    // STEP 0: STRICT RELEVANCE CHECK (Pre-Grading Gate)
    // If answer is irrelevant → 0 marks, skip everything
    // ══════════════════════════════════════════════
    let relevanceScore = 70; // default
    try {
        const relevance = await checkRelevance(question.prompt, trimmed);
        relevanceScore = relevance.relevance_score;

        if (!relevance.is_relevant) {
            console.log(`❌ [Engine] IRRELEVANT ANSWER — relevance ${relevanceScore}/100 — 0 marks`);
            return {
                score: 0,
                feedback: `0 marks — answer is irrelevant to the question. Relevance score: ${relevanceScore}/100. Question topic: "${relevance.question_topic}", but your answer is about: "${relevance.answer_topic}".`,
                relevanceScore,
                marksDistribution: zeroDistribution(question.points),
                pointsValidation: [],
                originalityMetrics: null,
                keywordAnalysis: null,
                integrityFlags: { ...emptyFlags(), irrelevant_answer_flag: true },
                careerMapping: null,
                numericalValidation: null,
                diagramEvaluation: null,
            };
        }
    } catch {
        console.warn("⚠️ [Engine] Relevance check failed — proceeding with grading");
    }

    // ── NUMERICAL: Step-by-step validation ──
    if (question.type === "NUMERICAL") {
        let numResult: NumericalValidation;
        try {
            const raw = await validateNumerical(
                question.prompt, trimmed, question.correctAnswer, question.points
            );
            numResult = {
                formula_correct: raw?.formula_correct ?? false,
                step_sequence_valid: raw?.step_sequence_valid ?? false,
                final_value_correct: raw?.final_value_correct ?? false,
                partial_marks: Math.min(Number(raw?.partial_marks) || 0, question.points),
                steps_analysis: Array.isArray(raw?.steps_analysis) ? raw.steps_analysis : [],
            };
        } catch {
            numResult = { formula_correct: false, step_sequence_valid: false, final_value_correct: false, partial_marks: 0, steps_analysis: [] };
        }

        return {
            score: numResult.partial_marks,
            feedback: numResult.final_value_correct
                ? "Correct computation with valid steps."
                : `Partial marks: ${numResult.partial_marks}/${question.points}. Formula: ${numResult.formula_correct ? "✓" : "✗"}, Steps: ${numResult.step_sequence_valid ? "✓" : "✗"}.`,
            relevanceScore,
            marksDistribution: buildNumericalDistribution(question.points, numResult),
            pointsValidation: [],
            originalityMetrics: null,
            keywordAnalysis: null,
            integrityFlags: emptyFlags(),
            careerMapping: null,
            numericalValidation: numResult,
            diagramEvaluation: null,
        };
    }

    // ── DIAGRAM: Special evaluation path ──
    if (question.type === "DIAGRAM") {
        const mandatoryKW = question.mandatoryKeywords || [];
        const supportingKW = question.supportingKeywords || [];
        const kwAnalysis = analyzeKeywords(trimmed, mandatoryKW, supportingKW);

        let diagramResult: DiagramEvaluation;
        try {
            diagramResult = await evaluateDiagram(
                question.prompt, trimmed, question.points, mandatoryKW
            );
        } catch {
            diagramResult = {
                component_presence: { max: 3, awarded: 0 },
                label_accuracy: { max: 2, awarded: 0 },
                logical_flow: { max: 2, awarded: 0 },
                explanation_alignment: { max: 1, awarded: 0 },
                total: { max: question.points, awarded: 0 },
                detected_components: [], missing_components: mandatoryKW,
            };
        }

        const score = Math.max(0, Math.min(diagramResult.total.awarded, question.points));
        let feedback = `Diagram Score: ${score}/${question.points}.`;
        if (diagramResult.missing_components.length > 0) {
            feedback += ` Missing components: ${diagramResult.missing_components.join(", ")}.`;
        }

        return {
            score,
            feedback,
            relevanceScore,
            marksDistribution: zeroDistribution(question.points),
            pointsValidation: [],
            originalityMetrics: null,
            keywordAnalysis: kwAnalysis,
            integrityFlags: emptyFlags(),
            careerMapping: null,
            numericalValidation: null,
            diagramEvaluation: diagramResult,
        };
    }

    // ══════════════════════════════════════════════
    // DESCRIPTIVE / SHORT_ANSWER: Full Pipeline
    // ══════════════════════════════════════════════

    // STEP 1: KEYWORD ANALYSIS (Deterministic, instant)
    const mandatoryKW = question.mandatoryKeywords || [];
    const supportingKW = question.supportingKeywords || [];
    const kwAnalysis = analyzeKeywords(trimmed, mandatoryKW, supportingKW);

    // Word count check
    const wordCount = trimmed.split(/\s+/).length;
    const minWords = question.minWords || 20;
    const tooShort = wordCount < Math.round(minWords * 0.5);

    // STEP 2-4: AI CALLS (parallel)
    let rawMarksDist: MarksDistribution | null = null;
    let rawPointsVal: PointValidation[] = [];
    let rawPov: Awaited<ReturnType<typeof detectPOV>> | null = null;

    try {
        const results = await Promise.allSettled([
            calculateMarksDistribution(question.prompt, trimmed, question.points, question.expectedStructure),
            question.minPointsRequired
                ? validateRequiredPoints(question.prompt, trimmed, question.minPointsRequired)
                : Promise.resolve([]),
            detectPOV(trimmed),
        ]);

        if (results[0].status === "fulfilled") rawMarksDist = results[0].value;
        if (results[1].status === "fulfilled") {
            const val = results[1].value;
            rawPointsVal = Array.isArray(val) ? val : [];
        }
        if (results[2].status === "fulfilled") rawPov = results[2].value;
    } catch (err) {
        console.error("⚠️ [Engine] Parallel AI calls failed:", err);
    }

    const marksDist = normalizeMarks(rawMarksDist, question.points);
    const povScore = Number(rawPov?.pov_score) || 50;

    // STEP 5: KEYWORD-DRIVEN SCORING (STRICT)
    const maxPts = question.points;

    // A) Mandatory Keyword Score (40% weight)
    const mandatoryFound = kwAnalysis.mandatory_matches.filter(m => m.found).length;
    const mandatoryTotal = kwAnalysis.mandatory_matches.length;
    // CRITICAL: If no keywords defined, set coverage to 0 (not 1!)
    // This forces the score to be AI-only, which gets capped
    const mandatoryCoverage = mandatoryTotal > 0 ? mandatoryFound / mandatoryTotal : 0;
    const mandatoryScore = Math.round(maxPts * 0.40 * mandatoryCoverage);

    // B) Supporting Keyword Score (15% weight)
    const supportingFound = kwAnalysis.supporting_matches.filter(m => m.found).length;
    const supportingTotal = kwAnalysis.supporting_matches.length;
    const supportingCoverage = supportingTotal > 0 ? supportingFound / supportingTotal : 0;
    const supportingScore = Math.round(maxPts * 0.15 * supportingCoverage);

    // C) Conceptual Points Score (25% weight)
    let pointsScore = 0;
    if (rawPointsVal.length > 0) {
        const covered = rawPointsVal.filter(p => p.covered).length;
        const highDepth = rawPointsVal.filter(p => p.covered && p.depth === "HIGH").length;
        const medDepth = rawPointsVal.filter(p => p.covered && p.depth === "MEDIUM").length;
        const depthWeighted = (highDepth * 1.0 + medDepth * 0.7 + (covered - highDepth - medDepth) * 0.4);
        const pointsCoverage = rawPointsVal.length > 0 ? depthWeighted / rawPointsVal.length : 0;
        pointsScore = Math.round(maxPts * 0.25 * Math.min(pointsCoverage, 1));
    }
    // NO fallback — if points validation fails, this stays 0

    // D) AI Quality Score (20% weight)
    // SCALED by keyword coverage: if keywords are 0%, AI can only give ~5% max
    const aiAwardedRatio = marksDist.total.max > 0 ? marksDist.total.awarded / marksDist.total.max : 0;
    const totalKwCoverage = (mandatoryTotal + supportingTotal) > 0
        ? (mandatoryFound + supportingFound) / (mandatoryTotal + supportingTotal)
        : 0;
    // AI weight scales: 20% when keywords fully matched → 5% when 0 keywords matched
    const aiWeight = 0.05 + (0.15 * totalKwCoverage);
    const aiQualityScore = Math.round(maxPts * aiWeight * Math.min(aiAwardedRatio, 1));

    // COMBINE
    let score = mandatoryScore + supportingScore + pointsScore + aiQualityScore;

    // STEP 6: STRICT PENALTIES & CAPS

    // NO keywords defined → score is purely AI, cap at 70%
    if (mandatoryTotal === 0 && supportingTotal === 0) {
        // When no keywords are defined, rely on AI + relevance
        // But cap so garbage can't score high
        score = Math.min(score, Math.round(maxPts * 0.7));
        console.log(`⚠️ [Engine] No keywords defined — AI-only mode, capping at 70%`);
    }

    // ZERO mandatory keywords matched → hard cap at 15%
    if (mandatoryTotal > 0 && mandatoryFound === 0) {
        score = Math.min(score, Math.round(maxPts * 0.15));
        console.log(`❌ [Engine] 0 mandatory keywords matched — capping at 15%`);
    }

    // <50% mandatory keywords → cap at 40%
    if (mandatoryTotal > 0 && mandatoryCoverage > 0 && mandatoryCoverage < 0.5) {
        score = Math.min(score, Math.round(maxPts * 0.4));
        console.log(`⚠️ [Engine] Mandatory keywords <50% — capping at 40%`);
    }

    // Too short answer → cap at 50%
    if (tooShort) {
        score = Math.min(score, Math.round(maxPts * 0.5));
        console.log(`⚠️ [Engine] Answer too short (${wordCount} words) — capping at 50%`);
    }

    // Minimum points requirement not met → cap at 60%
    if (question.minPointsRequired && rawPointsVal.length > 0) {
        const coveredCount = rawPointsVal.filter(p => p.covered).length;
        if (coveredCount < question.minPointsRequired) {
            score = Math.min(score, Math.round(maxPts * 0.6));
            console.log(`⚠️ [Engine] Only ${coveredCount}/${question.minPointsRequired} min points — capping at 60%`);
        }
    }

    // Keyword stuffing → 15% penalty
    if (kwAnalysis.keyword_penalty) {
        score = Math.max(0, score - Math.round(maxPts * 0.15));
        console.log(`⚠️ [Engine] Keyword stuffing — penalty applied`);
    }

    // Low relevance score penalty (additional multiplier)
    if (relevanceScore < 50 && relevanceScore >= 40) {
        score = Math.round(score * 0.5);
        console.log(`⚠️ [Engine] Low relevance (${relevanceScore}) — 50% multiplier`);
    }

    score = Math.max(0, Math.min(score, maxPts));

    // STEP 7: FLAGS & FEEDBACK
    const flags: IntegrityFlags = {
        irrelevant_answer_flag: false,
        ai_usage_suspected: false,
        style_inconsistency_flag: false,
        keyword_penalty: kwAnalysis.keyword_penalty,
        low_pov_flag: povScore < 40,
        time_anomaly_flag: false,
    };

    const mandatoryMissed = kwAnalysis.mandatory_matches.filter(m => !m.found);
    let feedback = `Score: ${score}/${maxPts}. Relevance: ${relevanceScore}/100.`;
    feedback += ` Keywords: ${mandatoryFound}/${mandatoryTotal} mandatory, ${supportingFound}/${supportingTotal} supporting.`;
    if (mandatoryMissed.length > 0) {
        feedback += ` Missing: ${mandatoryMissed.map(m => m.keyword).join(", ")}.`;
    }
    if (tooShort) feedback += ` Too short (${wordCount} words, min ${minWords}).`;
    if (flags.low_pov_flag) feedback += " Lacks personal analysis.";
    if (flags.keyword_penalty) feedback += " Keyword stuffing detected.";

    console.log(`📊 [Engine] FINAL: ${score}/${maxPts} | Mandatory=${mandatoryScore} Supporting=${supportingScore} Points=${pointsScore} AI=${aiQualityScore} | Relevance=${relevanceScore}`);

    return {
        score,
        feedback,
        relevanceScore,
        marksDistribution: marksDist,
        pointsValidation: rawPointsVal,
        originalityMetrics: null,
        keywordAnalysis: kwAnalysis,
        integrityFlags: flags,
        careerMapping: null,
        numericalValidation: null,
        diagramEvaluation: null,
    };
}

// ──────────────────────────────────────────────
// ATTEMPT-LEVEL AGGREGATION
// ──────────────────────────────────────────────

export async function runAttemptLevelAnalysis(
    questions: QuestionMeta[],
    answers: Record<string, string>,
    results: EnterpriseGradingResult[]
): Promise<{
    originalityMetrics: OriginalityMetrics;
    careerMapping: CareerMapping | null;
    aggregatedFlags: IntegrityFlags;
}> {
    const descriptiveAnswers = questions
        .filter(q => q.type === "DESCRIPTIVE" || q.type === "SHORT_ANSWER")
        .map(q => answers[q.id] || "")
        .filter(a => a.trim().length > 20);

    let originality: OriginalityMetrics = {
        ai_generated_probability: 0, pov_presence_score: 100,
        originality_score: 100, style_inconsistency_flag: false
    };

    if (descriptiveAnswers.length > 0) {
        try {
            originality = await analyzeOriginality(descriptiveAnswers);
        } catch (err) {
            console.error("⚠️ [Engine] Originality analysis failed:", err);
        }
    }

    const aiQuestions = questions.filter(q =>
        q.subject?.toLowerCase().includes("ai") ||
        q.subject?.toLowerCase().includes("career") ||
        q.subject?.toLowerCase().includes("industry")
    );
    let career: CareerMapping | null = null;
    if (aiQuestions.length > 0) {
        try {
            career = await generateCareerMapping(
                aiQuestions.map(q => q.prompt),
                aiQuestions.map(q => answers[q.id] || "")
            );
        } catch (err) {
            console.error("⚠️ [Engine] Career mapping failed:", err);
        }
    }

    const aggregated: IntegrityFlags = {
        irrelevant_answer_flag: results.some(r => r.integrityFlags.irrelevant_answer_flag),
        ai_usage_suspected: originality.ai_generated_probability > 70 && originality.pov_presence_score < 40,
        style_inconsistency_flag: originality.style_inconsistency_flag,
        keyword_penalty: results.some(r => r.integrityFlags.keyword_penalty),
        low_pov_flag: originality.pov_presence_score < 40,
        time_anomaly_flag: false,
    };

    return { originalityMetrics: originality, careerMapping: career, aggregatedFlags: aggregated };
}

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

function zeroResult(maxPoints: number, feedback: string): EnterpriseGradingResult {
    return {
        score: 0, feedback, relevanceScore: 0,
        marksDistribution: zeroDistribution(maxPoints),
        pointsValidation: [], originalityMetrics: null,
        keywordAnalysis: null, integrityFlags: emptyFlags(),
        careerMapping: null, numericalValidation: null, diagramEvaluation: null,
    };
}

function normalizeMarks(raw: MarksDistribution | null, maxPoints: number): MarksDistribution {
    if (!raw || typeof raw !== "object") return zeroDistribution(maxPoints);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = raw as any;
    const ca = safePair(r.concept_accuracy, Math.round(maxPoints * 0.25));
    const lr = safePair(r.logical_reasoning, Math.round(maxPoints * 0.20));
    const rp = safePair(r.required_points_coverage, Math.round(maxPoints * 0.15));
    const ka = safePair(r.keyword_accuracy, Math.round(maxPoints * 0.10));
    const sc = safePair(r.structure_coherence, Math.round(maxPoints * 0.10));
    const lc = safePair(r.length_compliance, Math.round(maxPoints * 0.10));
    const ot = safePair(r.original_thought, Math.round(maxPoints * 0.10));
    const sum = ca.awarded + lr.awarded + rp.awarded + ka.awarded + sc.awarded + lc.awarded + ot.awarded;
    const totalAwarded = r.total?.awarded !== undefined
        ? Math.max(0, Math.min(Number(r.total.awarded) || 0, maxPoints))
        : Math.max(0, Math.min(sum, maxPoints));
    return { concept_accuracy: ca, logical_reasoning: lr, required_points_coverage: rp, keyword_accuracy: ka, structure_coherence: sc, length_compliance: lc, original_thought: ot, total: { max: maxPoints, awarded: totalAwarded } };
}

function safePair(val: unknown, maxDefault: number): { max: number; awarded: number } {
    if (val && typeof val === "object") {
        const v = val as Record<string, unknown>;
        const max = Number(v.max) || maxDefault;
        return { max, awarded: Math.max(0, Math.min(Number(v.awarded) || 0, max)) };
    }
    return { max: maxDefault, awarded: 0 };
}

function zeroDistribution(maxPoints: number): MarksDistribution {
    return {
        concept_accuracy: { max: Math.round(maxPoints * 0.25), awarded: 0 },
        logical_reasoning: { max: Math.round(maxPoints * 0.20), awarded: 0 },
        required_points_coverage: { max: Math.round(maxPoints * 0.15), awarded: 0 },
        keyword_accuracy: { max: Math.round(maxPoints * 0.10), awarded: 0 },
        structure_coherence: { max: Math.round(maxPoints * 0.10), awarded: 0 },
        length_compliance: { max: Math.round(maxPoints * 0.10), awarded: 0 },
        original_thought: { max: Math.round(maxPoints * 0.10), awarded: 0 },
        total: { max: maxPoints, awarded: 0 },
    };
}

function emptyFlags(): IntegrityFlags {
    return {
        irrelevant_answer_flag: false,
        ai_usage_suspected: false,
        style_inconsistency_flag: false,
        keyword_penalty: false,
        low_pov_flag: false,
        time_anomaly_flag: false,
    };
}

function buildMCQDistribution(maxPoints: number, correct: boolean): MarksDistribution {
    const awarded = correct ? maxPoints : 0;
    return { concept_accuracy: { max: maxPoints, awarded }, logical_reasoning: { max: 0, awarded: 0 }, required_points_coverage: { max: 0, awarded: 0 }, keyword_accuracy: { max: 0, awarded: 0 }, structure_coherence: { max: 0, awarded: 0 }, length_compliance: { max: 0, awarded: 0 }, original_thought: { max: 0, awarded: 0 }, total: { max: maxPoints, awarded } };
}

function buildNumericalDistribution(maxPoints: number, numResult: NumericalValidation): MarksDistribution {
    return { concept_accuracy: { max: Math.round(maxPoints * 0.4), awarded: numResult.formula_correct ? Math.round(maxPoints * 0.4) : 0 }, logical_reasoning: { max: Math.round(maxPoints * 0.3), awarded: numResult.step_sequence_valid ? Math.round(maxPoints * 0.3) : 0 }, required_points_coverage: { max: Math.round(maxPoints * 0.3), awarded: numResult.final_value_correct ? Math.round(maxPoints * 0.3) : 0 }, keyword_accuracy: { max: 0, awarded: 0 }, structure_coherence: { max: 0, awarded: 0 }, length_compliance: { max: 0, awarded: 0 }, original_thought: { max: 0, awarded: 0 }, total: { max: maxPoints, awarded: numResult.partial_marks } };
}
