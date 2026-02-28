import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import SpeakButton from "@/components/voice/SpeakButton";
import { CheckCircle2, ShieldAlert, Target, Lightbulb, Map, FileText } from "lucide-react";

// ──────────────────────────────────────────────
// TYPE HELPERS
// ──────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
type MarksPair = { max: number; awarded: number };
type MarksDistribution = {
    concept_accuracy?: MarksPair; logical_reasoning?: MarksPair;
    required_points_coverage?: MarksPair; keyword_accuracy?: MarksPair;
    structure_coherence?: MarksPair; length_compliance?: MarksPair;
    original_thought?: MarksPair; total?: MarksPair;
};
type PointValidation = { point: string; covered: boolean; depth: string };
type KeywordMatch = { keyword: string; found: boolean };
type KeywordAnalysis = { mandatory_matches?: KeywordMatch[]; supporting_matches?: KeywordMatch[]; keyword_match_percentage?: number; keyword_density?: number; keyword_penalty?: boolean };
type IntegrityFlags = { irrelevant_answer_flag?: boolean; ai_usage_suspected?: boolean; style_inconsistency_flag?: boolean; keyword_penalty?: boolean; low_pov_flag?: boolean; time_anomaly_flag?: boolean };
type OriginalityMetrics = { ai_generated_probability?: number; pov_presence_score?: number; originality_score?: number; style_inconsistency_flag?: boolean };
type CareerMapping = { ai_aptitude_score?: number; recommended_roles?: string[]; confidence_levels?: Record<string, number>; reasoning_strengths?: string[]; improvement_areas?: string[]; skill_gap_analysis?: string[]; learning_path_recommendation?: string[] };
type DiagramEval = { component_presence?: MarksPair; label_accuracy?: MarksPair; logical_flow?: MarksPair; explanation_alignment?: MarksPair; total?: MarksPair; detected_components?: string[]; missing_components?: string[] };
type NumericalVal = { formula_correct?: boolean; step_sequence_valid?: boolean; final_value_correct?: boolean; partial_marks?: number; steps_analysis?: { step: string; correct: boolean; marks: number }[] };

// ──────────────────────────────────────────────
// SMALL COMPONENTS
// ──────────────────────────────────────────────

function ProgressBar({ value, max, color = "blue" }: { value: number; max: number; color?: string }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    const colors: Record<string, string> = {
        blue: "bg-blue-500", green: "bg-emerald-500", amber: "bg-amber-500",
        red: "bg-red-500", purple: "bg-purple-500", cyan: "bg-cyan-500",
    };
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden [.high-contrast_&]:!bg-gray-700">
                <div className={`h-full rounded-full transition-all ${colors[color] || colors.blue}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-bold text-slate-500 w-14 text-right [.high-contrast_&]:!text-white">{value}/{max}</span>
        </div>
    );
}

function Flag({ label, active, icon: Icon = ShieldAlert }: { label: string; active: boolean; icon?: any }) {
    if (!active) return null; // Only show active flags in premium UI
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-semibold [.high-contrast_&]:!bg-red-900 [.high-contrast_&]:!text-red-200 [.high-contrast_&]:!border-red-500">
            <Icon className="w-4 h-4" />
            {label}
        </span>
    );
}

function Badge({ children, variant = "neutral" }: { children: React.ReactNode; variant?: string }) {
    const styles: Record<string, string> = {
        blue: "bg-blue-50 text-blue-700 border-blue-200",
        green: "bg-emerald-50 text-emerald-700 border-emerald-200",
        red: "bg-red-50 text-red-700 border-red-200",
        amber: "bg-amber-50 text-amber-700 border-amber-200",
        purple: "bg-purple-50 text-purple-700 border-purple-200",
        neutral: "bg-neutral-50 text-neutral-700 border-neutral-200",
    };
    return <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${styles[variant] || styles.neutral} [.high-contrast_&]:!bg-neutral-800 [.high-contrast_&]:!border-white [.high-contrast_&]:!text-white`}>{children}</span>;
}

// ──────────────────────────────────────────────
// SUB-SECTIONS
// ──────────────────────────────────────────────

function Table1Section({ marks }: { marks: MarksDistribution }) {
    if (!marks) return null;
    const criteria = [
        { key: "concept_accuracy", label: "Concept Accuracy", color: "blue" },
        { key: "logical_reasoning", label: "Logical Reasoning", color: "purple" },
        { key: "required_points_coverage", label: "Points Coverage", color: "cyan" },
        { key: "keyword_accuracy", label: "Keyword Accuracy", color: "green" },
        { key: "structure_coherence", label: "Structure & Coherence", color: "amber" },
        { key: "length_compliance", label: "Length Compliance", color: "blue" },
        { key: "original_thought", label: "Original Thought", color: "purple" },
    ];
    return (
        <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest [.high-contrast_&]:!text-gray-300">Table 1 — Marks Distribution</h5>
            <div className="grid gap-2">
                {criteria.map(c => {
                    const val = (marks as any)[c.key] as MarksPair | undefined;
                    if (!val || val.max === 0) return null;
                    return (
                        <div key={c.key} className="flex items-center gap-3">
                            <span className="w-40 text-xs font-medium text-slate-600 [.high-contrast_&]:!text-gray-300">{c.label}</span>
                            <div className="flex-1"><ProgressBar value={val.awarded} max={val.max} color={c.color} /></div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function StrictRubricSection({ rubric }: { rubric: any[] }) {
    if (!rubric || !rubric.length) return null;
    return (
        <div className="space-y-3 mt-4">
            <h5 className="flex items-center gap-2 text-sm font-semibold text-neutral-900 [.high-contrast_&]:!text-white">
                <Target className="w-4 h-4 text-neutral-500" />
                Evaluation Rubric
            </h5>
            <div className="grid gap-3">
                {rubric.map((item, idx) => (
                    <div key={idx} className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-neutral-700">
                        <div className="flex justify-between items-start mb-3">
                            <span className="font-semibold text-sm text-neutral-800 [.high-contrast_&]:!text-white">{item.criteria}</span>
                            <span className="text-sm font-semibold text-neutral-700 whitespace-nowrap ml-4 bg-white border border-neutral-200 px-2.5 py-1 rounded-md shadow-sm [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white">{item.awarded} / {item.maxMarks}</span>
                        </div>
                        <ProgressBar value={item.awarded} max={item.maxMarks} color="blue" />
                        {item.reason && <p className="mt-3 text-sm text-neutral-600 leading-relaxed [.high-contrast_&]:!text-gray-300">{item.reason}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}

function ImprovementSuggestionsSection({ text }: { text: string }) {
    if (!text) return null;
    return (
        <div className="space-y-3 mt-6">
            <h5 className="flex items-center gap-2 text-sm font-semibold text-neutral-900 [.high-contrast_&]:!text-white">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Targeted Improvements
            </h5>
            <div className="p-5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-700 leading-relaxed shadow-sm [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white [.high-contrast_&]:!text-white">
                {text}
            </div>
        </div>
    );
}

function Table2Section({ points }: { points: PointValidation[] }) {
    if (!points?.length) return null;
    return (
        <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest [.high-contrast_&]:!text-gray-300">Table 2 — Concept Fulfillment</h5>
            <div className="rounded-lg border border-slate-200 overflow-hidden [.high-contrast_&]:!border-gray-600">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 [.high-contrast_&]:!bg-gray-800">
                        <tr>
                            <th className="text-left px-3 py-2 text-xs font-bold text-slate-500 [.high-contrast_&]:!text-gray-300">Concept Point</th>
                            <th className="px-3 py-2 text-xs font-bold text-slate-500 w-20 [.high-contrast_&]:!text-gray-300">Covered</th>
                            <th className="px-3 py-2 text-xs font-bold text-slate-500 w-20 [.high-contrast_&]:!text-gray-300">Depth</th>
                        </tr>
                    </thead>
                    <tbody>
                        {points.map((p, i) => (
                            <tr key={i} className="border-t border-slate-100 [.high-contrast_&]:!border-gray-700">
                                <td className="px-3 py-2 text-slate-700 [.high-contrast_&]:!text-gray-300">{p.point}</td>
                                <td className="px-3 py-2 text-center">
                                    {p.covered ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-red-500 font-bold">✗</span>}
                                </td>
                                <td className="px-3 py-2 text-center">
                                    <Badge variant={p.depth === "HIGH" ? "green" : p.depth === "MEDIUM" ? "amber" : "red"}>
                                        {p.depth}
                                    </Badge>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function KeywordSection({ kw }: { kw: KeywordAnalysis }) {
    if (!kw) return null;
    return (
        <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest [.high-contrast_&]:!text-gray-300">Keyword Analysis</h5>
            <div className="flex flex-wrap gap-1.5">
                {kw.mandatory_matches?.map((m, i) => (
                    <span key={`m-${i}`} className={`px-2 py-0.5 rounded text-xs font-bold ${m.found ? "bg-emerald-100 text-emerald-700 [.high-contrast_&]:!bg-emerald-900 [.high-contrast_&]:!text-emerald-200" : "bg-red-100 text-red-600 line-through [.high-contrast_&]:!bg-red-900 [.high-contrast_&]:!text-red-200"}`}>
                        {m.keyword} {m.found ? "✓" : "✗"}
                    </span>
                ))}
                {kw.supporting_matches?.map((m, i) => (
                    <span key={`s-${i}`} className={`px-2 py-0.5 rounded text-xs ${m.found ? "bg-blue-50 text-blue-600 [.high-contrast_&]:!bg-blue-900 [.high-contrast_&]:!text-blue-200" : "bg-slate-100 text-slate-400 [.high-contrast_&]:!bg-gray-800 [.high-contrast_&]:!text-gray-400"}`}>
                        {m.keyword}
                    </span>
                ))}
            </div>
            {kw.keyword_penalty && (
                <p className="text-xs text-red-500 font-bold mt-1">⚠ Keyword stuffing detected (density: {kw.keyword_density}%)</p>
            )}
        </div>
    );
}

function DiagramSection({ diag }: { diag: DiagramEval }) {
    if (!diag) return null;
    const criteria = [
        { label: "Component Presence", val: diag.component_presence, color: "blue" },
        { label: "Label Accuracy", val: diag.label_accuracy, color: "green" },
        { label: "Logical Flow", val: diag.logical_flow, color: "purple" },
        { label: "Explanation Alignment", val: diag.explanation_alignment, color: "amber" },
    ];
    return (
        <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest [.high-contrast_&]:!text-gray-300">Diagram Evaluation</h5>
            <div className="grid gap-2">
                {criteria.map(c => c.val && c.val.max > 0 ? (
                    <div key={c.label} className="flex items-center gap-3">
                        <span className="w-44 text-xs font-medium text-slate-600 [.high-contrast_&]:!text-gray-300">{c.label}</span>
                        <div className="flex-1"><ProgressBar value={c.val.awarded} max={c.val.max} color={c.color} /></div>
                    </div>
                ) : null)}
            </div>
            {diag.missing_components && diag.missing_components.length > 0 && (
                <p className="text-xs text-amber-600 mt-1">Missing: {diag.missing_components.join(", ")}</p>
            )}
        </div>
    );
}

function NumericalSection({ num }: { num: NumericalVal }) {
    if (!num) return null;
    return (
        <div className="space-y-2">
            <h5 className="flex items-center gap-2 text-sm font-semibold text-neutral-900 [.high-contrast_&]:!text-white mt-4 mb-3">
                <FileText className="w-4 h-4 text-neutral-500" />
                Numerical Validation
            </h5>
            <div className="flex gap-2 flex-wrap mb-4">
                <Badge variant={num.formula_correct ? "green" : "red"}>Formula {num.formula_correct ? <CheckCircle2 className="w-3 h-3 inline ml-1" /> : "✗"}</Badge>
                <Badge variant={num.step_sequence_valid ? "green" : "red"}>Steps {num.step_sequence_valid ? <CheckCircle2 className="w-3 h-3 inline ml-1" /> : "✗"}</Badge>
                <Badge variant={num.final_value_correct ? "green" : "red"}>Final Value {num.final_value_correct ? <CheckCircle2 className="w-3 h-3 inline ml-1" /> : "✗"}</Badge>
            </div>
            {num.steps_analysis && num.steps_analysis.length > 0 && (
                <div className="text-sm bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-neutral-600 space-y-2 [.high-contrast_&]:!text-gray-300 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-neutral-700">
                    {num.steps_analysis.map((s, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <span className={`mt-0.5 ${s.correct ? "text-emerald-600" : "text-red-500"}`}>{s.correct ? <CheckCircle2 className="w-4 h-4" /> : "✗"}</span>
                            <span className="flex-1 leading-relaxed">{s.step}</span>
                            <span className="text-neutral-500 font-medium whitespace-nowrap bg-white px-2 py-0.5 rounded border border-neutral-200 shadow-sm [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white">{s.marks} pts</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ──────────────────────────────────────────────
// MAIN PAGE
// ──────────────────────────────────────────────

export default async function AssessmentResultPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const { id } = await params;
    const attempt = await prisma.attempt.findUnique({
        where: { id },
        include: { assessment: true, answers: { include: { question: true } } }
    });

    if (!attempt) return <div className="p-8 text-center mt-20">Result not found.</div>;
    if (attempt.userId !== session.user.id && session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN") {
        return <div className="p-8 text-center text-red-500 mt-20">Unauthorized.</div>;
    }

    const maxPoints = attempt.answers.reduce((acc: number, ans: any) => acc + (ans.question?.points || 1), 0);
    const scorePercentage = maxPoints > 0 ? ((attempt.totalScore || 0) / maxPoints) * 100 : 0;
    const startTime = new Date(attempt.startedAt).getTime();
    const endTime = attempt.submittedAt ? new Date(attempt.submittedAt).getTime() : Date.now();
    const elapsedMinutes = Math.floor((endTime - startTime) / 60000);

    // Find career mapping & originality from answer records
    let careerData: CareerMapping | null = null;
    let origData: OriginalityMetrics | null = null;
    let aggregatedFlags: IntegrityFlags | null = null;

    for (const ans of attempt.answers as any[]) {
        if (ans.careerMapping) careerData = ans.careerMapping as CareerMapping;
        if (ans.originalityMetrics) origData = ans.originalityMetrics as OriginalityMetrics;
        if (ans.integrityFlags) aggregatedFlags = ans.integrityFlags as IntegrityFlags;
    }



    return (
        <div className="container mx-auto py-12 px-8 max-w-4xl font-sans">
            {/* ── Header ── */}
            <div className="mb-10 p-8 bg-white rounded-2xl shadow-sm border border-neutral-200 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-neutral-700">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 [.high-contrast_&]:!text-white mb-2">
                            {attempt.assessment.title}
                        </h1>
                        <p className="text-sm font-medium tracking-wide text-neutral-500 uppercase [.high-contrast_&]:!text-gray-400">
                            {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "Unknown"} • {elapsedMinutes} mins
                        </p>
                    </div>
                    <div className="text-right">
                        <div className={`text-4xl font-black ${scorePercentage >= 80 ? "text-emerald-600" : scorePercentage >= 50 ? "text-amber-500" : "text-neutral-900"} tracking-tight [.high-contrast_&]:!text-white`}>
                            {attempt.totalScore}<span className="text-xl text-neutral-400 font-semibold ml-1">/{maxPoints}</span>
                        </div>
                        <div className="text-sm font-semibold text-neutral-400 mt-1">{scorePercentage.toFixed(1)}%</div>
                    </div>
                </div>

                {/* ── Integrity Flags ── */}
                {aggregatedFlags && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Flag label="Irrelevant Content" active={!!aggregatedFlags.irrelevant_answer_flag} />
                        <Flag label="AI Suspected" active={!!aggregatedFlags.ai_usage_suspected} />
                        <Flag label="Style Inconsistency" active={!!aggregatedFlags.style_inconsistency_flag} />
                        <Flag label="Keyword Stuffing" active={!!aggregatedFlags.keyword_penalty} />
                        <Flag label="Low POV" active={!!aggregatedFlags.low_pov_flag} />
                    </div>
                )}

                {/* ── Originality Metrics ── */}
                {origData && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col items-center justify-center p-5 bg-neutral-50 rounded-xl border border-neutral-100 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-neutral-700">
                            <div className="text-3xl font-semibold tracking-tight text-neutral-800 [.high-contrast_&]:!text-white mb-1">{origData.originality_score ?? "–"}</div>
                            <div className="text-xs tracking-wider uppercase text-neutral-500 font-semibold [.high-contrast_&]:!text-gray-400">Originality</div>
                        </div>
                        <div className="flex flex-col items-center justify-center p-5 bg-neutral-50 rounded-xl border border-neutral-100 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-neutral-700">
                            <div className="text-3xl font-semibold tracking-tight text-neutral-800 [.high-contrast_&]:!text-white mb-1">{origData.pov_presence_score ?? "–"}</div>
                            <div className="text-xs tracking-wider uppercase text-neutral-500 font-semibold [.high-contrast_&]:!text-gray-400">POV Score</div>
                        </div>
                        <div className="flex flex-col items-center justify-center p-5 bg-neutral-50 rounded-xl border border-neutral-100 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-neutral-700">
                            <div className={`text-3xl font-semibold tracking-tight mb-1 ${(origData.ai_generated_probability ?? 0) > 70 ? "text-red-500" : "text-emerald-600"} [.high-contrast_&]:!text-white`}>
                                {origData.ai_generated_probability ?? "–"}%
                            </div>
                            <div className="text-xs tracking-wider uppercase text-neutral-500 font-semibold [.high-contrast_&]:!text-gray-400">AI Probability</div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Per-Question Results ── */}
            <div className="space-y-4">
                {(attempt.answers as any[]).map((answer: any, index: number) => {
                    const q = answer.question;
                    const marks = answer.marksDistribution as any | null; // using any to support both legacy and strict schemas
                    const points = answer.pointsValidation as PointValidation[] | null;
                    const kw = answer.keywordAnalysis as KeywordAnalysis | null;
                    const flags = answer.integrityFlags as IntegrityFlags | null;
                    const diag = answer.diagramEvaluation as DiagramEval | null;
                    const num = answer.numericalValidation as NumericalVal | null;
                    const isIrrelevant = flags?.irrelevant_answer_flag;
                    const isPerfect = answer.aiScore === q.points;

                    return (
                        <div key={answer.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white ${isIrrelevant ? "border-red-300" : "border-neutral-200"}`}>
                            {/* Header */}
                            <div className={`px-6 py-4 flex justify-between items-center ${isIrrelevant ? "bg-red-50" : "bg-neutral-50"} border-b border-neutral-100 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-neutral-700`}>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-semibold text-neutral-400 tracking-widest uppercase [.high-contrast_&]:!text-gray-400">Q{index + 1}</span>
                                    <Badge variant={q.type === "MCQ" ? "blue" : q.type === "NUMERICAL" ? "purple" : q.type === "DIAGRAM" ? "amber" : "neutral"}>
                                        {q.type}
                                    </Badge>
                                    {isIrrelevant && <Badge variant="red">IRRELEVANT</Badge>}
                                </div>
                                <span className={`font-semibold text-lg tracking-tight ${isPerfect ? "text-emerald-600" : answer.aiScore === 0 ? "text-neutral-500" : "text-neutral-900"} [.high-contrast_&]:!text-white`}>
                                    {answer.aiScore} <span className="text-neutral-400 text-sm">/ {q.points}</span>
                                </span>
                            </div>

                            <div className="p-8 space-y-6">
                                {/* Question & Answer */}
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 [.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black">
                                        <CheckCircle2 className={`w-4 h-4 ${isPerfect ? "text-emerald-600" : "text-neutral-400"}`} />
                                    </div>
                                    <p className="flex-1 font-semibold text-lg text-neutral-900 leading-relaxed [.high-contrast_&]:!text-white mt-1">{q.prompt}</p>
                                    <SpeakButton text={q.prompt} size="sm" className="shrink-0" />
                                </div>
                                <div className="bg-neutral-50 p-5 rounded-xl text-base text-neutral-700 leading-relaxed border border-neutral-100 shadow-inner [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-neutral-700 [.high-contrast_&]:!text-gray-300">
                                    {answer.response || <span className="text-neutral-400 italic">No answer provided</span>}
                                </div>

                                {/* AI Feedback */}
                                {answer.aiFeedback && (
                                    <div className={`p-6 mt-4 rounded-xl text-base font-serif leading-loose border ${isPerfect ? "bg-emerald-50/50 border-emerald-100 text-emerald-900" : isIrrelevant ? "bg-red-50/50 border-red-100 text-red-900" : "bg-white border-neutral-200 text-neutral-800 shadow-sm"} [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-gray-300 [.high-contrast_&]:!border-white`}>
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1 whitespace-pre-wrap">{answer.aiFeedback}</div>
                                            <SpeakButton text={answer.aiFeedback} size="sm" className="shrink-0 mt-1" />
                                        </div>
                                    </div>
                                )}

                                {/* Grading Breakdowns */}
                                {q.type !== "MCQ" && (
                                    <div className="grid gap-4 pt-4 mt-2 border-t border-slate-100 [.high-contrast_&]:!border-gray-700">
                                        {marks?.rubricBreakdown ? (
                                            <>
                                                <StrictRubricSection rubric={marks.rubricBreakdown} />
                                                <ImprovementSuggestionsSection text={marks.improvementSuggestions} />
                                            </>
                                        ) : (
                                            <>
                                                {marks && <Table1Section marks={marks} />}
                                                {points && <Table2Section points={points} />}
                                                {kw && <KeywordSection kw={kw} />}
                                                {diag && <DiagramSection diag={diag} />}
                                                {num && <NumericalSection num={num} />}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Career Mapping ── */}
            {careerData && (
                <div className="mt-10 bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-neutral-700">
                    <h2 className="flex items-center gap-3 text-xl font-semibold tracking-tight text-neutral-900 mb-6 [.high-contrast_&]:!text-white">
                        <Map className="w-5 h-5 text-neutral-500" />
                        Career Intelligence Mapping
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <div className="text-center p-6 bg-neutral-50 border border-neutral-100 rounded-2xl [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-neutral-700">
                                <div className="text-5xl font-black text-neutral-800 tracking-tight [.high-contrast_&]:!text-white">{careerData.ai_aptitude_score}</div>
                                <div className="text-sm font-semibold text-neutral-500 uppercase tracking-widest mt-2 [.high-contrast_&]:!text-gray-400">AI Aptitude Score</div>
                            </div>
                            {careerData.recommended_roles && (
                                <div className="mt-6 space-y-3">
                                    <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest [.high-contrast_&]:!text-gray-400">Recommended Roles</h4>
                                    {careerData.recommended_roles.map((role, i) => (
                                        <div key={i} className="flex justify-between items-center px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-neutral-700">
                                            <span className="font-semibold text-sm text-neutral-800 [.high-contrast_&]:!text-white">{role}</span>
                                            {careerData!.confidence_levels?.[role] && (
                                                <span className="text-xs font-bold text-neutral-600 bg-white border border-neutral-200 px-2 py-1 rounded-md shadow-sm [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-neutral-300 [.high-contrast_&]:!border-neutral-600">{careerData!.confidence_levels[role]}%</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="space-y-6">
                            {careerData.reasoning_strengths && careerData.reasoning_strengths.length > 0 && (
                                <div>
                                    <h4 className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3">
                                        <CheckCircle2 className="w-4 h-4" /> Selected Strengths
                                    </h4>
                                    <ul className="text-sm font-medium text-neutral-700 space-y-2.5 [.high-contrast_&]:!text-gray-300">
                                        {careerData.reasoning_strengths.map((s, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="text-emerald-500 mt-0.5">•</span>
                                                <span className="leading-relaxed">{s}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {careerData.skill_gap_analysis && careerData.skill_gap_analysis.length > 0 && (
                                <div className="pt-4 border-t border-neutral-100 [.high-contrast_&]:!border-neutral-800">
                                    <h4 className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-widest mb-3">
                                        <Target className="w-4 h-4" /> Key Skil Gaps
                                    </h4>
                                    <ul className="text-sm font-medium text-neutral-700 space-y-2.5 [.high-contrast_&]:!text-gray-300">
                                        {careerData.skill_gap_analysis.map((s, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="text-amber-500 mt-0.5">→</span>
                                                <span className="leading-relaxed">{s}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {careerData.learning_path_recommendation && careerData.learning_path_recommendation.length > 0 && (
                                <div className="pt-4 border-t border-neutral-100 [.high-contrast_&]:!border-neutral-800">
                                    <h4 className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">
                                        <Lightbulb className="w-4 h-4" /> Learning Path
                                    </h4>
                                    <ul className="text-sm font-medium text-neutral-700 space-y-2.5 [.high-contrast_&]:!text-gray-300">
                                        {careerData.learning_path_recommendation.map((s, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="text-blue-500 mt-0.5">→</span>
                                                <span className="leading-relaxed">{s}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-10 mb-20 text-center">
                <Link href="/dashboard">
                    <Button size="lg" className="font-bold text-lg px-12 rounded-xl shadow-lg bg-slate-900 hover:bg-slate-800 text-white [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white [.high-contrast_&]:!text-white border">
                        Return to Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    );
}
