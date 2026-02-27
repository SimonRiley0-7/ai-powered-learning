import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import SpeakButton from "@/components/voice/SpeakButton";

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

function Flag({ label, active }: { label: string; active: boolean }) {
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${active ? "bg-red-100 text-red-700 [.high-contrast_&]:!bg-red-900 [.high-contrast_&]:!text-red-200" : "bg-slate-100 text-slate-400 [.high-contrast_&]:!bg-gray-800 [.high-contrast_&]:!text-gray-400"}`}>
            <span className={`w-2 h-2 rounded-full ${active ? "bg-red-500" : "bg-slate-300"}`} />
            {label}
        </span>
    );
}

function Badge({ children, variant = "blue" }: { children: React.ReactNode; variant?: string }) {
    const styles: Record<string, string> = {
        blue: "bg-blue-100 text-blue-700", green: "bg-emerald-100 text-emerald-700",
        red: "bg-red-100 text-red-700", amber: "bg-amber-100 text-amber-700",
        purple: "bg-purple-100 text-purple-700",
    };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${styles[variant] || styles.blue} [.high-contrast_&]:!bg-gray-800 [.high-contrast_&]:!text-white`}>{children}</span>;
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
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest [.high-contrast_&]:!text-gray-300">Numerical Validation</h5>
            <div className="flex gap-3 flex-wrap">
                <Badge variant={num.formula_correct ? "green" : "red"}>Formula {num.formula_correct ? "✓" : "✗"}</Badge>
                <Badge variant={num.step_sequence_valid ? "green" : "red"}>Steps {num.step_sequence_valid ? "✓" : "✗"}</Badge>
                <Badge variant={num.final_value_correct ? "green" : "red"}>Final Value {num.final_value_correct ? "✓" : "✗"}</Badge>
            </div>
            {num.steps_analysis && num.steps_analysis.length > 0 && (
                <div className="text-xs text-slate-600 space-y-1 mt-1 [.high-contrast_&]:!text-gray-300">
                    {num.steps_analysis.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className={s.correct ? "text-emerald-600" : "text-red-500"}>{s.correct ? "✓" : "✗"}</span>
                            <span>{s.step}</span>
                            <span className="text-slate-400 ml-auto">{s.marks} marks</span>
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

    const gradeColor = scorePercentage >= 80 ? "text-emerald-600" : scorePercentage >= 50 ? "text-amber-500" : "text-red-500";

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            {/* ── Header ── */}
            <div className="mb-8 p-6 bg-white rounded-2xl shadow-sm border border-slate-200/60 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900 [.high-contrast_&]:!text-white">
                            {attempt.assessment.title}
                        </h1>
                        <p className="text-sm text-slate-500 mt-1 [.high-contrast_&]:!text-gray-300">
                            {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "Unknown"} • {elapsedMinutes} mins
                        </p>
                    </div>
                    <div className="text-right">
                        <div className={`text-4xl font-black ${gradeColor} [.high-contrast_&]:!text-white`}>
                            {attempt.totalScore}<span className="text-xl text-slate-400">/{maxPoints}</span>
                        </div>
                        <div className="text-sm font-bold text-slate-400 mt-0.5">{scorePercentage.toFixed(1)}%</div>
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
                    <div className="mt-4 grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-slate-50 rounded-xl [.high-contrast_&]:!bg-gray-900">
                            <div className="text-2xl font-black text-slate-800 [.high-contrast_&]:!text-white">{origData.originality_score ?? "–"}</div>
                            <div className="text-xs text-slate-500 font-bold [.high-contrast_&]:!text-gray-400">Originality</div>
                        </div>
                        <div className="text-center p-3 bg-slate-50 rounded-xl [.high-contrast_&]:!bg-gray-900">
                            <div className="text-2xl font-black text-slate-800 [.high-contrast_&]:!text-white">{origData.pov_presence_score ?? "–"}</div>
                            <div className="text-xs text-slate-500 font-bold [.high-contrast_&]:!text-gray-400">POV Score</div>
                        </div>
                        <div className="text-center p-3 bg-slate-50 rounded-xl [.high-contrast_&]:!bg-gray-900">
                            <div className={`text-2xl font-black ${(origData.ai_generated_probability ?? 0) > 70 ? "text-red-500" : "text-emerald-600"} [.high-contrast_&]:!text-white`}>
                                {origData.ai_generated_probability ?? "–"}%
                            </div>
                            <div className="text-xs text-slate-500 font-bold [.high-contrast_&]:!text-gray-400">AI Probability</div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Per-Question Results ── */}
            <div className="space-y-4">
                {(attempt.answers as any[]).map((answer: any, index: number) => {
                    const q = answer.question;
                    const marks = answer.marksDistribution as MarksDistribution | null;
                    const points = answer.pointsValidation as PointValidation[] | null;
                    const kw = answer.keywordAnalysis as KeywordAnalysis | null;
                    const flags = answer.integrityFlags as IntegrityFlags | null;
                    const diag = answer.diagramEvaluation as DiagramEval | null;
                    const num = answer.numericalValidation as NumericalVal | null;
                    const isIrrelevant = flags?.irrelevant_answer_flag;
                    const isPerfect = answer.aiScore === q.points;

                    return (
                        <div key={answer.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white ${isIrrelevant ? "border-red-300" : "border-slate-200/60"}`}>
                            {/* Header */}
                            <div className={`px-5 py-3 flex justify-between items-center ${isIrrelevant ? "bg-red-50" : "bg-slate-50/80"} [.high-contrast_&]:!bg-gray-900`}>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-400 uppercase [.high-contrast_&]:!text-gray-400">Q{index + 1}</span>
                                    <Badge variant={q.type === "MCQ" ? "blue" : q.type === "NUMERICAL" ? "purple" : q.type === "DIAGRAM" ? "amber" : "green"}>
                                        {q.type}
                                    </Badge>
                                    {isIrrelevant && <Badge variant="red">IRRELEVANT</Badge>}
                                </div>
                                <span className={`font-bold text-lg ${isPerfect ? "text-emerald-600" : answer.aiScore === 0 ? "text-red-500" : "text-amber-500"} [.high-contrast_&]:!text-white`}>
                                    {answer.aiScore}/{q.points}
                                </span>
                            </div>

                            <div className="px-5 py-4 space-y-4">
                                {/* Question & Answer */}
                                <div className="flex items-start gap-4">
                                    <p className="flex-1 font-semibold text-slate-800 [.high-contrast_&]:!text-white">{q.prompt}</p>
                                    <SpeakButton text={q.prompt} size="sm" className="shrink-0" />
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl text-sm text-slate-700 [.high-contrast_&]:!bg-gray-900 [.high-contrast_&]:!text-gray-300">
                                    {answer.response || <span className="text-slate-400 italic">No answer</span>}
                                </div>

                                {/* AI Feedback */}
                                {answer.aiFeedback && (
                                    <div className={`p-3 rounded-xl text-sm font-medium border-l-4 ${isPerfect ? "bg-emerald-50 border-emerald-500 text-emerald-800" : isIrrelevant ? "bg-red-50 border-red-500 text-red-800" : "bg-amber-50 border-amber-500 text-amber-800"} [.high-contrast_&]:!bg-gray-900 [.high-contrast_&]:!text-gray-300 [.high-contrast_&]:!border-white`}>
                                        <div className="flex items-start gap-3">
                                            <div className="flex-1">{answer.aiFeedback}</div>
                                            <SpeakButton text={answer.aiFeedback} size="sm" className="shrink-0 -mt-1" />
                                        </div>
                                    </div>
                                )}

                                {/* Grading Breakdowns */}
                                {q.type !== "MCQ" && (
                                    <div className="grid gap-4 pt-2 border-t border-slate-100 [.high-contrast_&]:!border-gray-700">
                                        {marks && <Table1Section marks={marks} />}
                                        {points && <Table2Section points={points} />}
                                        {kw && <KeywordSection kw={kw} />}
                                        {diag && <DiagramSection diag={diag} />}
                                        {num && <NumericalSection num={num} />}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Career Mapping ── */}
            {careerData && (
                <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white">
                    <h2 className="text-lg font-extrabold text-slate-900 mb-4 [.high-contrast_&]:!text-white">🎯 Career Intelligence Mapping</h2>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl [.high-contrast_&]:!bg-gray-900">
                                <div className="text-4xl font-black text-blue-600 [.high-contrast_&]:!text-white">{careerData.ai_aptitude_score}</div>
                                <div className="text-xs font-bold text-slate-500 mt-1 [.high-contrast_&]:!text-gray-400">AI Aptitude Score</div>
                            </div>
                            {careerData.recommended_roles && (
                                <div className="mt-4 space-y-2">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase [.high-contrast_&]:!text-gray-400">Recommended Roles</h4>
                                    {careerData.recommended_roles.map((role, i) => (
                                        <div key={i} className="flex justify-between items-center px-3 py-2 bg-slate-50 rounded-lg [.high-contrast_&]:!bg-gray-900 [.high-contrast_&]:!text-white">
                                            <span className="font-medium text-sm text-slate-700 [.high-contrast_&]:!text-white">{role}</span>
                                            {careerData!.confidence_levels?.[role] && (
                                                <span className="text-xs font-bold text-blue-600 [.high-contrast_&]:!text-blue-300">{careerData!.confidence_levels[role]}%</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="space-y-4">
                            {careerData.reasoning_strengths && careerData.reasoning_strengths.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-emerald-600 uppercase mb-1">Strengths</h4>
                                    <ul className="text-sm text-slate-600 space-y-1 [.high-contrast_&]:!text-gray-300">
                                        {careerData.reasoning_strengths.map((s, i) => <li key={i}>✓ {s}</li>)}
                                    </ul>
                                </div>
                            )}
                            {careerData.skill_gap_analysis && careerData.skill_gap_analysis.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-amber-600 uppercase mb-1">Skill Gaps</h4>
                                    <ul className="text-sm text-slate-600 space-y-1 [.high-contrast_&]:!text-gray-300">
                                        {careerData.skill_gap_analysis.map((s, i) => <li key={i}>→ {s}</li>)}
                                    </ul>
                                </div>
                            )}
                            {careerData.learning_path_recommendation && careerData.learning_path_recommendation.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-blue-600 uppercase mb-1">Learning Path</h4>
                                    <ul className="text-sm text-slate-600 space-y-1 [.high-contrast_&]:!text-gray-300">
                                        {careerData.learning_path_recommendation.map((s, i) => <li key={i}>📘 {s}</li>)}
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
