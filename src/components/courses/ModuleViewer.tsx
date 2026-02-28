"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAccessibility } from "@/context/AccessibilityContext";
import { Button } from "@/components/ui/button";
import SpeakButton from "@/components/voice/SpeakButton";
import {
    BookOpen, Video, Brain, PenLine, ScrollText,
    CheckCircle2, ChevronRight, Loader2, Mic, MicOff,
    RefreshCw, AlertCircle, Zap, Heart, ArrowLeft, Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── TYPES ──────────────────────────────────────────────────────────────────
interface ModuleQuestion {
    id: string;
    prompt: string;
    options: string[] | null;
    type: string;
    points: number;
    explanation?: string;
    correctAnswer?: string;
}

interface ModuleData {
    id: string;
    courseId: string;
    courseTitle: string;
    courseType: string;
    order: number;
    title: string;
    conceptText: string;
    videoUrl1?: string;
    videoUrl2?: string;
    practicePrompt?: string;
    reflectionPrompt: string;
    reflectionRequired: boolean;
    minReflectionWords: number;
    questions: ModuleQuestion[];
    progress: {
        totalProgress: number;
        lessonRead: boolean;
        videoWatched: boolean;
        quizPassed: boolean;
        reflectionSubmitted: boolean;
        practiceSubmitted: boolean;
        simplifiedMode: boolean;
        quizFailCount: number;
        lessonScore: number;
        videoScore: number;
        practiceScore: number;
        theoryScore: number;
        taskScore: number;
    } | null;
    existingReflection: { content: string; wordCount: number; aiScore: number | null; aiFeedback: string | null } | null;
    taskSubmissions: Array<{
        id: string;
        taskType: string;
        description: string;
        fearRating?: number;
        aiBreakdown?: string;
        aiFeedback?: string;
    }>;
}

interface PersonalizedContent {
    explanation: string;
    keyPoints: string[];
    analogy?: string;
    example?: string;
}

// ── YOUTUBE helper ─────────────────────────────────────────────────────────
function extractVideoId(url?: string): string | null {
    if (!url) return null;
    const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return match?.[1] ?? null;
}

// ── SECTION STEP CONFIG ────────────────────────────────────────────────────
const SECTIONS = [
    { id: "lesson", label: "Lesson", icon: BookOpen },
    { id: "video", label: "Video", icon: Video },
    { id: "quiz", label: "Quiz", icon: Brain },
    { id: "practice", label: "Practice", icon: PenLine },
    { id: "reflection", label: "Reflection", icon: ScrollText },
] as const;

type SectionId = typeof SECTIONS[number]["id"];

// ── COMPONENT ──────────────────────────────────────────────────────────────
interface Props {
    courseId: string;
    moduleId: string;
}

export default function ModuleViewer({ courseId, moduleId }: Props) {
    const router = useRouter();
    const { disabilityType, largeInteractionMode, simplifiedMode } = useAccessibility();

    const isVisual = disabilityType === "VISUAL";
    const isCognitive = disabilityType === "COGNITIVE";
    const isMotor = disabilityType === "MOTOR";
    const isHearing = disabilityType === "HEARING" || disabilityType === "SPEECH";

    // ── State ──────────────────────────────────────────────────────────────
    const [moduleData, setModuleData] = useState<ModuleData | null>(null);
    const [loading, setLoading] = useState(true);
    const [section, setSection] = useState<SectionId>("lesson");

    // Lesson
    const [personalizedContent, setPersonalizedContent] = useState<PersonalizedContent | null>(null);
    const [isPersonalizing, setIsPersonalizing] = useState(false);
    const [isSimplified, setIsSimplified] = useState(false);

    // Video
    const [videoProgress, setVideoProgress] = useState(0);
    const iframeRef1 = useRef<HTMLIFrameElement>(null);
    const iframeRef2 = useRef<HTMLIFrameElement>(null);

    // Quiz
    const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizScore, setQuizScore] = useState<number | null>(null);
    const [quizFails, setQuizFails] = useState(0);
    const [failExplanation, setFailExplanation] = useState<string | null>(null);

    // Practice
    const [practiceText, setPracticeText] = useState("");
    const [practiceSubmitted, setPracticeSubmitted] = useState(false);
    const [isDictating, setIsDictating] = useState(false);
    const mediaRef = useRef<MediaRecorder | null>(null);

    // Reflection
    const [reflectionText, setReflectionText] = useState("");
    const [reflectionResult, setReflectionResult] = useState<{ score: number; feedback: string; approved: boolean; depthRating: string } | null>(null);
    const [reflectionLoading, setReflectionLoading] = useState(false);

    // Social task (social confidence course)
    const [taskDescription, setTaskDescription] = useState("");
    const [fearRating, setFearRating] = useState(5);
    const [whyDifficult, setWhyDifficult] = useState("");
    const [taskBreakdown, setTaskBreakdown] = useState<{ steps: string[]; safetyGuidance: string; backupPlan: string; reflectionTemplate: string; encouragement: string } | null>(null);
    const [taskLoading, setTaskLoading] = useState(false);

    const progressRef = useRef<Record<string, number>>({});
    // ── Filtered Questions (Hide Diagram for Accessibility Modes) ──────────
    const filteredQuestions = useMemo(() => {
        if (!moduleData) return [];
        if (!disabilityType || disabilityType === "NONE") return moduleData.questions;
        return moduleData.questions.filter(q => (q.type as string).toUpperCase() !== "DIAGRAM");
    }, [moduleData, disabilityType]);

    // ── Load module ────────────────────────────────────────────────────────
    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/courses/${courseId}/modules/${moduleId}`);
                if (!res.ok) { router.push(`/courses/${courseId}`); return; }
                const data: ModuleData = await res.json();
                setModuleData(data);
                // Restore state from saved progress
                if (data.progress) {
                    setQuizFails(data.progress.quizFailCount);
                    setQuizSubmitted(data.progress.quizPassed);
                    setPracticeSubmitted(data.progress.practiceSubmitted);
                    if (data.progress.simplifiedMode || isCognitive || simplifiedMode) {
                        setIsSimplified(true);
                    }
                }
                if (data.existingReflection) {
                    setReflectionText(data.existingReflection.content);
                    setReflectionResult({
                        score: data.existingReflection.aiScore ?? 0,
                        feedback: data.existingReflection.aiFeedback ?? "",
                        approved: (data.existingReflection.aiScore ?? 0) >= 50,
                        depthRating: "DEVELOPING",
                    });
                }
            } finally {
                setLoading(false);
            }
        }
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId, moduleId]);

    // ── Auto-personalize lesson on mount ──────────────────────────────────
    useEffect(() => {
        if (!moduleData || personalizedContent) return;
        personalizeConcept(isSimplified || isCognitive || simplifiedMode);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [moduleData]);

    const personalizeConcept = useCallback(async (simplified = false) => {
        if (!moduleData) return;
        setIsPersonalizing(true);
        try {
            const res = await fetch("/api/courses/personalize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ moduleId: moduleData.id, simplified }),
            });
            if (res.ok) setPersonalizedContent(await res.json());
        } finally {
            setIsPersonalizing(false);
        }
    }, [moduleData]);

    // ── Progress update ────────────────────────────────────────────────────
    const updateProgress = useCallback(async (component: string, value: number) => {
        if (!moduleData) return;
        // Debounce — don't call if value hasn't changed
        if (progressRef.current[component] === value) return;
        progressRef.current[component] = value;

        await fetch("/api/courses/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ moduleId: moduleData.id, component, value, courseId }),
        });
    }, [moduleData, courseId]);

    // ── YouTube 60% tracking via postMessage ──────────────────────────────
    useEffect(() => {
        const handler = (e: MessageEvent) => {
            if (!e.data || typeof e.data !== "string") return;
            try {
                const msg = JSON.parse(e.data);
                if (msg.event === "onStateChange" && msg.info === 1) return; // playing
                if (msg.event === "infoDelivery" && msg.info?.currentTime && msg.info?.duration) {
                    const pct = msg.info.currentTime / msg.info.duration;
                    if (pct >= 0.6 && videoProgress < 1) {
                        setVideoProgress(1);
                        updateProgress("video", 1);
                    }
                }
            } catch { /* ignore */ }
        };
        window.addEventListener("message", handler);
        return () => window.removeEventListener("message", handler);
    }, [videoProgress, updateProgress]);

    // ── Mark lesson read ───────────────────────────────────────────────────
    const handleLessonRead = async () => {
        await updateProgress("lesson", 1);
        setSection("video");
    };

    // ── Quiz submit ────────────────────────────────────────────────────────
    const handleQuizSubmit = useCallback(async () => {
        if (!moduleData) return;
        const questions = filteredQuestions;
        let correct = 0;
        questions.forEach((q) => {
            if (quizAnswers[q.id] === q.correctAnswer) correct++;
        });
        const score = questions.length > 0 ? correct / questions.length : 1;
        setQuizScore(Math.round(score * 100));
        setQuizSubmitted(true);

        const passed = score >= 0.6;
        if (passed) {
            await updateProgress("theory", score);
        } else {
            const newFails = quizFails + 1;
            setQuizFails(newFails);
            // After 2 fails → auto simplified mode
            if (newFails >= 2 && !isSimplified) {
                setIsSimplified(true);
                setFailExplanation("Simplified mode has been activated to help you understand this material better.");
                await personalizeConcept(true);
            }
        }
    }, [moduleData, quizAnswers, quizFails, isSimplified, updateProgress, personalizeConcept]);

    const handleRetakeQuiz = () => {
        setQuizAnswers({});
        setQuizSubmitted(false);
        setQuizScore(null);
    };

    // ── Practice submit ────────────────────────────────────────────────────
    const handlePracticeSubmit = useCallback(async () => {
        if (!practiceText.trim() || practiceText.trim().split(/\s+/).length < 10) return;
        await updateProgress("practice", 1);
        setPracticeSubmitted(true);
        await updateProgress("theory", 1);
    }, [practiceText, updateProgress]);

    // ── Reflection submit ──────────────────────────────────────────────────
    const handleReflectionSubmit = useCallback(async () => {
        if (!moduleData || !reflectionText.trim()) return;
        setReflectionLoading(true);
        try {
            const res = await fetch("/api/courses/reflect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ moduleId: moduleData.id, content: reflectionText, courseId }),
            });
            const result = await res.json();
            setReflectionResult(result);
        } finally {
            setReflectionLoading(false);
        }
    }, [moduleData, reflectionText, courseId]);

    // ── Social task submit ─────────────────────────────────────────────────
    const handleTaskSubmit = useCallback(async () => {
        if (!moduleData || !taskDescription.trim()) return;
        setTaskLoading(true);
        try {
            const res = await fetch("/api/courses/social-task", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    moduleId: moduleData.id,
                    taskType: "SAFE_TASK",
                    description: taskDescription,
                    fearRating,
                    whyDifficult,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setTaskBreakdown(data);
                await updateProgress("task", 1);
            }
        } finally {
            setTaskLoading(false);
        }
    }, [moduleData, taskDescription, fearRating, whyDifficult, updateProgress]);
    // ── Stable refs for voice commands ──────────────────────────────────────
    const voiceRefs = useRef({
        section,
        isSimplified,
        moduleData,
        handleQuizSubmit,
        handleReflectionSubmit,
        handleTaskSubmit,
        handlePracticeSubmit,
        personalizeConcept,
        quizAnswers,
        quizSubmitted,
        filteredQuestions,
    });

    useEffect(() => {
        voiceRefs.current = {
            section,
            isSimplified,
            moduleData,
            handleQuizSubmit,
            handleReflectionSubmit,
            handleTaskSubmit,
            handlePracticeSubmit,
            personalizeConcept,
            quizAnswers,
            quizSubmitted,
            filteredQuestions,
        };
    });

    useEffect(() => {
        const handleVoiceCommand = (e: Event) => {
            const intent = (e as CustomEvent<string>).detail;
            const {
                section: curSection,
                moduleData: curModule,
                handleQuizSubmit: doQuiz,
                handleReflectionSubmit: doReflect,
                handleTaskSubmit: doTask,
                handlePracticeSubmit: doPractice,
                personalizeConcept: doPers,
            } = voiceRefs.current;

            const sectionIds: SectionId[] = ["lesson", "video", "quiz", "practice", "reflection"];
            const currentIndex = sectionIds.indexOf(curSection);

            if (intent === "next_question") {
                if (currentIndex < sectionIds.length - 1) {
                    setSection(sectionIds[currentIndex + 1]);
                    const nextLabel = SECTIONS[currentIndex + 1].label;
                    const msg = new SpeechSynthesisUtterance(`Moved to ${nextLabel} section`);
                    window.speechSynthesis.speak(msg);
                }
            } else if (intent === "prev_question") {
                if (currentIndex > 0) {
                    setSection(sectionIds[currentIndex - 1]);
                    const prevLabel = SECTIONS[currentIndex - 1].label;
                    const msg = new SpeechSynthesisUtterance(`Moved to ${prevLabel} section`);
                    window.speechSynthesis.speak(msg);
                }
            } else if (intent === "simplify_content") {
                if (curSection === "lesson") {
                    setIsSimplified(true);
                    doPers(true);
                    const msg = new SpeechSynthesisUtterance("Simplifying lesson content");
                    window.speechSynthesis.speak(msg);
                } else {
                    const msg = new SpeechSynthesisUtterance("Simplified mode is only available in the lesson section");
                    window.speechSynthesis.speak(msg);
                }
            } else if (intent.startsWith("select_option_")) {
                if (curSection !== "quiz") {
                    const msg = new SpeechSynthesisUtterance("Please go to the quiz section first");
                    window.speechSynthesis.speak(msg);
                    return;
                }
                if (voiceRefs.current.quizSubmitted) {
                    const msg = new SpeechSynthesisUtterance("Quiz already submitted");
                    window.speechSynthesis.speak(msg);
                    return;
                }

                const optionChar = intent.split("_").pop()?.toUpperCase(); // "A", "B", "C", "D"
                if (!optionChar) return;

                const questions = voiceRefs.current.filteredQuestions || [];
                // Find first question that doesn't have an answer in curQuizAnswers
                const targetQuestion = questions.find((q: any) => !voiceRefs.current.quizAnswers[q.id]);

                if (targetQuestion) {
                    const optionIndex = optionChar.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
                    const options = targetQuestion.options || [];
                    if (optionIndex >= 0 && optionIndex < options.length) {
                        const selectedOption = options[optionIndex];
                        setQuizAnswers(prev => ({ ...prev, [targetQuestion.id]: selectedOption }));
                        const msg = new SpeechSynthesisUtterance(`Selected ${optionChar} for the current question`);
                        window.speechSynthesis.speak(msg);
                    } else {
                        const msg = new SpeechSynthesisUtterance(`Option ${optionChar} not found`);
                        window.speechSynthesis.speak(msg);
                    }
                } else {
                    const msg = new SpeechSynthesisUtterance("All questions are answered. Say submit quiz to finish.");
                    window.speechSynthesis.speak(msg);
                }
            } else if (intent === "submit_assessment") {
                if (curSection === "quiz") {
                    doQuiz();
                    const msg = new SpeechSynthesisUtterance("Submitting quiz");
                    window.speechSynthesis.speak(msg);
                } else if (curSection === "practice") {
                    if (curModule?.courseType === "SOCIAL_CONFIDENCE") {
                        doTask();
                        const msg = new SpeechSynthesisUtterance("Submitting practice task");
                        window.speechSynthesis.speak(msg);
                    } else {
                        doPractice();
                        const msg = new SpeechSynthesisUtterance("Submitting practice work");
                        window.speechSynthesis.speak(msg);
                    }
                } else if (curSection === "reflection") {
                    doReflect();
                    const msg = new SpeechSynthesisUtterance("Submitting reflection");
                    window.speechSynthesis.speak(msg);
                } else {
                    const msg = new SpeechSynthesisUtterance("There is nothing to submit in this section");
                    window.speechSynthesis.speak(msg);
                }
            } else if (intent.startsWith("go_to_")) {
                const targetId = intent.replace("go_to_", "") as SectionId;
                if (sectionIds.includes(targetId)) {
                    setSection(targetId);
                    const label = SECTIONS.find(s => s.id === targetId)?.label || targetId;
                    const msg = new SpeechSynthesisUtterance(`Moved to ${label} section`);
                    window.speechSynthesis.speak(msg);
                }
            }
        };

        window.addEventListener("voice_command", handleVoiceCommand);
        return () => window.removeEventListener("voice_command", handleVoiceCommand);
    }, []);

    // ── Voice dictation for practice ───────────────────────────────────────
    const startDictation = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: Blob[] = [];
            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: "audio/webm" });
                const form = new FormData();
                form.append("audio", blob, "audio.webm");
                try {
                    const res = await fetch("/api/voice/stt", { method: "POST", body: form });
                    if (res.ok) {
                        const { text } = await res.json();
                        setPracticeText((prev) => prev + (prev ? " " : "") + text);
                    }
                } catch { /* ignore */ }
            };
            mediaRef.current = recorder;
            recorder.start();
            setIsDictating(true);
        } catch { /* microphone not allowed */ }
    };

    const stopDictation = () => {
        mediaRef.current?.stop();
        setIsDictating(false);
    };

    // ── Loading & empty states ────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <div className="flex flex-col items-center gap-3 text-neutral-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-sm font-medium">Loading module…</p>
                </div>
            </div>
        );
    }

    if (!moduleData) return null;

    const progress = moduleData.progress;
    const wordCount = reflectionText.trim().split(/\s+/).filter(Boolean).length;
    const videoId1 = extractVideoId(moduleData.videoUrl1);
    const videoId2 = extractVideoId(moduleData.videoUrl2);
    const isSocialCourse = moduleData.courseType === "SOCIAL_CONFIDENCE";

    const sectionDone: Record<SectionId, boolean> = {
        lesson: progress?.lessonRead ?? false,
        video: progress?.videoWatched ?? false,
        quiz: progress?.quizPassed ?? false,
        practice: progress?.practiceSubmitted ?? false,
        reflection: progress?.reflectionSubmitted ?? false,
    };

    const totalPct = progress?.totalProgress ?? 0;

    // ── Base classes ─────────────────────────────────────────────────────
    const cardCls = cn(
        "bg-white rounded-2xl border border-neutral-200 p-8",
        "[.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white",
        largeInteractionMode && "p-10"
    );

    const btnPrimary = cn(
        "bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-semibold transition-all",
        "[.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black",
        largeInteractionMode ? "h-14 px-8 text-xl" : "h-11 px-6 text-sm"
    );

    const sectionTabCls = (id: SectionId) =>
        cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border",
            section === id
                ? "bg-neutral-900 text-white border-neutral-900 [.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black"
                : sectionDone[id]
                    ? "bg-neutral-50 text-neutral-600 border-neutral-200 [.high-contrast_&]:!bg-neutral-900 [.high-contrast_&]:!text-neutral-400 [.high-contrast_&]:!border-neutral-700"
                    : "bg-white text-neutral-400 border-neutral-100 [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-neutral-500 [.high-contrast_&]:!border-neutral-800",
            largeInteractionMode && "px-5 py-3 text-base"
        );

    return (
        <div className={cn(
            "min-h-screen bg-neutral-50 [.high-contrast_&]:!bg-neutral-950",
            largeInteractionMode && "text-xl"
        )}>
            {/* ── Header ────────────────────────────────────────────────────── */}
            <header className="bg-white border-b border-neutral-200 px-6 py-4 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-neutral-800">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/courses/${courseId}`)}
                            className="text-neutral-500 hover:text-neutral-900 [.high-contrast_&]:!text-white rounded-xl"
                            aria-label="Back to course"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">{moduleData.courseTitle}</span>
                        </Button>
                        <span className="text-neutral-300 [.high-contrast_&]:!text-neutral-700">|</span>
                        <h1 className={cn(
                            "font-semibold text-neutral-900 [.high-contrast_&]:!text-white",
                            largeInteractionMode ? "text-2xl" : "text-base"
                        )}>
                            Module {moduleData.order}: {moduleData.title}
                        </h1>
                    </div>

                    {/* Progress ring */}
                    <div className="flex items-center gap-2 text-sm font-medium text-neutral-600 [.high-contrast_&]:!text-white">
                        <span>{Math.round(totalPct)}% complete</span>
                        <div className="w-32 h-2 bg-neutral-100 rounded-full overflow-hidden [.high-contrast_&]:!bg-neutral-800">
                            <div
                                className="h-full bg-neutral-900 rounded-full transition-all [.high-contrast_&]:!bg-white"
                                style={{ width: `${totalPct}%` }}
                                role="progressbar"
                                aria-valuenow={Math.round(totalPct)}
                                aria-valuemin={0}
                                aria-valuemax={100}
                            />
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                {/* ── Accessibility mode banner ─────────────────────────────── */}
                {(isSimplified || isCognitive) && (
                    <div
                        role="status"
                        className="flex items-center gap-3 px-5 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium [.high-contrast_&]:!bg-yellow-950 [.high-contrast_&]:!border-yellow-700 [.high-contrast_&]:!text-yellow-300"
                    >
                        <Zap className="w-4 h-4 shrink-0" />
                        Simplified Mode is active — content has been broken down for easier understanding.
                    </div>
                )}

                {failExplanation && (
                    <div
                        role="alert"
                        className="flex items-start gap-3 px-5 py-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm [.high-contrast_&]:!bg-blue-950 [.high-contrast_&]:!border-blue-700 [.high-contrast_&]:!text-blue-300"
                    >
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        {failExplanation}
                    </div>
                )}

                {/* ── Section navigation tabs ───────────────────────────────── */}
                <nav
                    className="flex gap-2 flex-wrap"
                    role="tablist"
                    aria-label="Module sections"
                >
                    {SECTIONS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            role="tab"
                            aria-selected={section === id}
                            aria-controls={`section-${id}`}
                            onClick={() => setSection(id)}
                            className={sectionTabCls(id)}
                        >
                            {sectionDone[id] ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500 [.high-contrast_&]:!text-green-400" aria-hidden="true" />
                            ) : (
                                <Icon className="w-4 h-4" aria-hidden="true" />
                            )}
                            {label}
                        </button>
                    ))}
                </nav>

                {/* ══════════════════════════════════════════════════════════════
            SECTION 1 — LESSON
        ══════════════════════════════════════════════════════════════ */}
                {section === "lesson" && (
                    <div id="section-lesson" role="tabpanel" className="space-y-6">
                        <div className={cardCls}>
                            <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
                                <div>
                                    <h2 className={cn(
                                        "font-bold text-neutral-900 [.high-contrast_&]:!text-white",
                                        largeInteractionMode ? "text-3xl" : "text-2xl"
                                    )}>
                                        {moduleData.title}
                                    </h2>
                                    <p className="text-sm text-neutral-400 mt-1 [.high-contrast_&]:!text-neutral-500">
                                        {isSimplified ? "Simplified mode" : "Personalized for you"}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    {!isHearing && (
                                        <SpeakButton
                                            text={personalizedContent?.explanation ?? moduleData.conceptText}
                                            size={largeInteractionMode ? "lg" : "sm"}
                                        />
                                    )}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const next = !isSimplified;
                                            setIsSimplified(next);
                                            personalizeConcept(next);
                                        }}
                                        disabled={isPersonalizing}
                                        className="rounded-xl border-neutral-200 text-neutral-600 hover:border-neutral-400 [.high-contrast_&]:!border-white [.high-contrast_&]:!text-white"
                                        aria-label={isSimplified ? "Switch to standard explanation" : "Simplify this explanation"}
                                    >
                                        {isPersonalizing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Brain className="w-3 h-3 mr-1" />}
                                        {isSimplified ? "Standard" : "Simplify"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => personalizeConcept(isSimplified)}
                                        disabled={isPersonalizing}
                                        className="rounded-xl text-neutral-400 [.high-contrast_&]:!text-neutral-500"
                                        aria-label="Regenerate personalized content"
                                    >
                                        <RefreshCw className={cn("w-3 h-3", isPersonalizing && "animate-spin")} />
                                    </Button>
                                </div>
                            </div>

                            {isPersonalizing ? (
                                <div className="flex items-center gap-3 py-8 text-neutral-400">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span className="text-sm">Personalizing content for you…</span>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Main explanation */}
                                    <div
                                        className={cn(
                                            "prose prose-neutral max-w-none leading-relaxed text-neutral-700 [.high-contrast_&]:!text-white whitespace-pre-wrap",
                                            largeInteractionMode ? "text-xl leading-loose" : isVisual ? "text-lg leading-relaxed" : "text-base"
                                        )}
                                    >
                                        {personalizedContent?.explanation ?? moduleData.conceptText}
                                    </div>

                                    {/* Key points */}
                                    {personalizedContent?.keyPoints && personalizedContent.keyPoints.length > 0 && (
                                        <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-200 [.high-contrast_&]:!bg-neutral-900 [.high-contrast_&]:!border-neutral-700">
                                            <h3 className="text-sm font-semibold text-neutral-500 mb-3 uppercase tracking-wide [.high-contrast_&]:!text-neutral-400">
                                                Key Points
                                            </h3>
                                            <ul className="space-y-2">
                                                {personalizedContent.keyPoints.map((pt, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-neutral-700 [.high-contrast_&]:!text-white">
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" aria-hidden="true" />
                                                        {pt}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Analogy */}
                                    {personalizedContent?.analogy && (
                                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 [.high-contrast_&]:!bg-amber-950 [.high-contrast_&]:!border-amber-700">
                                            <p className="text-sm font-semibold text-amber-700 mb-1 [.high-contrast_&]:!text-amber-400">💡 Analogy</p>
                                            <p className="text-sm text-amber-900 [.high-contrast_&]:!text-amber-300">{personalizedContent.analogy}</p>
                                        </div>
                                    )}

                                    {/* Example */}
                                    {personalizedContent?.example && (
                                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 [.high-contrast_&]:!bg-blue-950 [.high-contrast_&]:!border-blue-700">
                                            <p className="text-sm font-semibold text-blue-700 mb-1 [.high-contrast_&]:!text-blue-400">🌍 Real-world Example</p>
                                            <p className="text-sm text-blue-900 [.high-contrast_&]:!text-blue-300">{personalizedContent.example}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-8 flex justify-end">
                                <Button onClick={handleLessonRead} className={btnPrimary}>
                                    {sectionDone.lesson ? "Continue to Video" : "Mark as Read & Continue"}
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════
            SECTION 2 — VIDEO
        ══════════════════════════════════════════════════════════════ */}
                {section === "video" && (
                    <div id="section-video" role="tabpanel" className="space-y-6">
                        <div className={cardCls}>
                            <h2 className={cn(
                                "font-bold text-neutral-900 [.high-contrast_&]:!text-white mb-2",
                                largeInteractionMode ? "text-2xl" : "text-xl"
                            )}>
                                Watch the Videos
                            </h2>
                            <p className="text-sm text-neutral-400 mb-6 [.high-contrast_&]:!text-neutral-500">
                                Watch at least 60% of each video — or pass the quiz to unlock progress.
                            </p>

                            <div className="space-y-8">
                                {videoId1 ? (
                                    <div>
                                        <p className="text-sm font-semibold text-neutral-600 mb-2 [.high-contrast_&]:!text-neutral-300">
                                            🎥 Concept Video
                                        </p>
                                        <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-900">
                                            <iframe
                                                ref={iframeRef1}
                                                src={`https://www.youtube.com/embed/${videoId1}?enablejsapi=1&origin=${typeof window !== "undefined" ? window.location.origin : ""}`}
                                                title="Concept video"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                className="w-full h-full"
                                            />
                                        </div>
                                        {videoProgress >= 1 && (
                                            <p className="flex items-center gap-1.5 text-xs text-green-600 mt-2 [.high-contrast_&]:!text-green-400">
                                                <CheckCircle2 className="w-3 h-3" /> Video progress recorded
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 rounded-xl bg-neutral-50 border-2 border-dashed border-neutral-200 [.high-contrast_&]:!bg-neutral-900 [.high-contrast_&]:!border-neutral-700">
                                        <Video className="w-8 h-8 text-neutral-300 mb-2" />
                                        <p className="text-sm text-neutral-400">No concept video assigned to this module.</p>
                                    </div>
                                )}

                                {videoId2 && (
                                    <div>
                                        <p className="text-sm font-semibold text-neutral-600 mb-2 [.high-contrast_&]:!text-neutral-300">
                                            🎬 Case Example Video
                                        </p>
                                        <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-900">
                                            <iframe
                                                ref={iframeRef2}
                                                src={`https://www.youtube.com/embed/${videoId2}?enablejsapi=1&origin=${typeof window !== "undefined" ? window.location.origin : ""}`}
                                                title="Case example video"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                className="w-full h-full"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 flex justify-between items-center">
                                <Button variant="ghost" onClick={() => setSection("lesson")} className="text-neutral-500 rounded-xl [.high-contrast_&]:!text-neutral-400">
                                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                                </Button>
                                <Button onClick={() => { updateProgress("video", Math.max(videoProgress, 0.6)); setSection("quiz"); }} className={btnPrimary}>
                                    Continue to Quiz
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════
            SECTION 3 — QUIZ
        ══════════════════════════════════════════════════════════════ */}
                {section === "quiz" && (
                    <div id="section-quiz" role="tabpanel" className="space-y-6">
                        <div className={cardCls}>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className={cn("font-bold text-neutral-900 [.high-contrast_&]:!text-white", largeInteractionMode ? "text-2xl" : "text-xl")}>
                                        Micro Quiz
                                    </h2>
                                    <p className="text-sm text-neutral-400 mt-1 [.high-contrast_&]:!text-neutral-500">
                                        {filteredQuestions.length} question{filteredQuestions.length !== 1 ? "s" : ""} — need 60% to pass
                                    </p>
                                </div>
                                {quizFails > 0 && (
                                    <span className="text-xs font-medium text-amber-600 bg-amber-50 rounded-lg px-3 py-1 border border-amber-200 [.high-contrast_&]:!bg-amber-950 [.high-contrast_&]:!text-amber-400 [.high-contrast_&]:!border-amber-700">
                                        Attempt {quizFails + (quizSubmitted ? 0 : 1)}/{quizFails >= 2 ? "∞" : "2"}
                                    </span>
                                )}
                            </div>

                            {filteredQuestions.length === 0 ? (
                                <div className="py-8 text-center text-neutral-400">
                                    <Brain className="w-8 h-8 mx-auto mb-2" />
                                    <p className="text-sm">No quiz questions for this module.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {filteredQuestions.map((q, idx) => {
                                        const opts = (q.options as string[] | null) ?? [];
                                        const selected = quizAnswers[q.id];
                                        const isCorrect = quizSubmitted && selected === q.correctAnswer;
                                        const isWrong = quizSubmitted && selected && selected !== q.correctAnswer;
                                        return (
                                            <fieldset key={q.id} className={cn(
                                                "p-5 rounded-xl border-2 transition-all",
                                                quizSubmitted
                                                    ? isCorrect ? "border-green-300 bg-green-50 [.high-contrast_&]:!bg-green-950 [.high-contrast_&]:!border-green-600"
                                                        : "border-red-200 bg-red-50 [.high-contrast_&]:!bg-red-950 [.high-contrast_&]:!border-red-700"
                                                    : "border-neutral-200 [.high-contrast_&]:!border-neutral-700"
                                            )}>
                                                <legend className={cn(
                                                    "font-semibold text-neutral-800 mb-4 [.high-contrast_&]:!text-white",
                                                    largeInteractionMode ? "text-xl" : "text-base"
                                                )}>
                                                    {idx + 1}. {q.prompt}
                                                </legend>
                                                <div className={cn(
                                                    "grid gap-3",
                                                    isMotor || isCognitive ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
                                                )}>
                                                    {opts.map((opt, oi) => {
                                                        const letter = String.fromCharCode(65 + oi);
                                                        const isSelected = selected === opt;
                                                        return (
                                                            <button
                                                                key={oi}
                                                                type="button"
                                                                disabled={quizSubmitted}
                                                                onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                                                                aria-pressed={isSelected}
                                                                className={cn(
                                                                    "flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all font-medium text-sm focus:outline-none focus:ring-4 focus:ring-neutral-900/20",
                                                                    isSelected
                                                                        ? "border-neutral-900 bg-neutral-50 [.high-contrast_&]:!border-white [.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black"
                                                                        : "border-neutral-200 hover:border-neutral-400 [.high-contrast_&]:!border-neutral-700 [.high-contrast_&]:!text-white",
                                                                    largeInteractionMode && "py-5 text-base"
                                                                )}
                                                            >
                                                                <span className={cn(
                                                                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                                                                    isSelected
                                                                        ? "bg-neutral-900 text-white [.high-contrast_&]:!bg-black"
                                                                        : "bg-neutral-100 text-neutral-500 [.high-contrast_&]:!bg-neutral-800 [.high-contrast_&]:!text-white"
                                                                )}>
                                                                    {letter}
                                                                </span>
                                                                <span className="flex-1">{opt}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {/* Explanation after wrong answer */}
                                                {quizSubmitted && isWrong && q.explanation && (
                                                    <p className="mt-3 text-sm text-red-700 [.high-contrast_&]:!text-red-400 flex items-start gap-2">
                                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                                        {q.explanation}
                                                    </p>
                                                )}
                                            </fieldset>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Quiz result banner */}
                            {quizSubmitted && quizScore !== null && (
                                <div className={cn(
                                    "mt-6 px-5 py-4 rounded-xl border flex items-center gap-3",
                                    quizScore >= 60
                                        ? "bg-green-50 border-green-200 text-green-800 [.high-contrast_&]:!bg-green-950 [.high-contrast_&]:!border-green-700 [.high-contrast_&]:!text-green-300"
                                        : "bg-red-50 border-red-200 text-red-800 [.high-contrast_&]:!bg-red-950 [.high-contrast_&]:!border-red-700 [.high-contrast_&]:!text-red-300"
                                )}>
                                    {quizScore >= 60
                                        ? <CheckCircle2 className="w-5 h-5 shrink-0" />
                                        : <AlertCircle className="w-5 h-5 shrink-0" />}
                                    <div>
                                        <p className="font-semibold">{quizScore >= 60 ? `Passed — ${quizScore}%` : `Not yet — ${quizScore}%`}</p>
                                        <p className="text-sm opacity-80">
                                            {quizScore >= 60 ? "Great work! Continue to the practice activity." : `${quizFails >= 2 ? "Simplified mode activated. " : ""}Try again to improve your score.`}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-8 flex justify-between items-center">
                                <Button variant="ghost" onClick={() => setSection("video")} className="text-neutral-500 rounded-xl [.high-contrast_&]:!text-neutral-400">
                                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                                </Button>
                                <div className="flex gap-3">
                                    {quizSubmitted && quizScore !== null && quizScore < 60 && (
                                        <Button variant="outline" onClick={handleRetakeQuiz} className="rounded-xl border-neutral-200 [.high-contrast_&]:!border-neutral-700 [.high-contrast_&]:!text-white">
                                            <RefreshCw className="w-4 h-4 mr-1" /> Retry
                                        </Button>
                                    )}
                                    {!quizSubmitted ? (
                                        <Button
                                            onClick={handleQuizSubmit}
                                            disabled={filteredQuestions.length > 0 && Object.keys(quizAnswers).length < filteredQuestions.length}
                                            className={btnPrimary}
                                        >
                                            Submit Quiz
                                        </Button>
                                    ) : quizScore !== null && quizScore >= 60 ? (
                                        <Button onClick={() => setSection("practice")} className={btnPrimary}>
                                            Continue <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════
            SECTION 4 — PRACTICE
        ══════════════════════════════════════════════════════════════ */}
                {section === "practice" && (
                    <div id="section-practice" role="tabpanel" className="space-y-6">
                        <div className={cardCls}>
                            <h2 className={cn("font-bold text-neutral-900 [.high-contrast_&]:!text-white mb-2", largeInteractionMode ? "text-2xl" : "text-xl")}>
                                Practice Activity
                            </h2>
                            {moduleData.practicePrompt && (
                                <p className={cn("text-neutral-600 mb-6 [.high-contrast_&]:!text-neutral-300", largeInteractionMode ? "text-lg" : "text-base")}>
                                    {moduleData.practicePrompt}
                                </p>
                            )}

                            {practiceSubmitted ? (
                                <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-green-50 border border-green-200 text-green-800 [.high-contrast_&]:!bg-green-950 [.high-contrast_&]:!border-green-700 [.high-contrast_&]:!text-green-300">
                                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                                    <span className="font-medium">Practice submitted! Your response has been recorded.</span>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 justify-end">
                                            {!isHearing && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={isDictating ? stopDictation : startDictation}
                                                    aria-pressed={isDictating}
                                                    className={cn(
                                                        "flex items-center gap-2 rounded-xl border-2",
                                                        isDictating
                                                            ? "bg-red-50 text-red-600 border-red-300 [.high-contrast_&]:!text-red-400 [.high-contrast_&]:!border-red-500"
                                                            : "border-neutral-200 [.high-contrast_&]:!border-neutral-700 [.high-contrast_&]:!text-white"
                                                    )}
                                                >
                                                    {isDictating ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                                    {isDictating ? "Stop" : "Voice Dictation"}
                                                </Button>
                                            )}
                                        </div>
                                        <textarea
                                            value={practiceText}
                                            onChange={(e) => setPracticeText(e.target.value)}
                                            placeholder="Write your answer here… (minimum 10 words)"
                                            aria-label="Practice activity answer"
                                            className={cn(
                                                "w-full p-5 rounded-xl border-2 focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/15 outline-none resize-y transition-all",
                                                "[.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white",
                                                largeInteractionMode ? "min-h-[200px] text-xl" : "min-h-[160px] text-base",
                                                "border-neutral-200"
                                            )}
                                        />
                                        <p className="text-xs text-neutral-400 [.high-contrast_&]:!text-neutral-500">
                                            {practiceText.trim().split(/\s+/).filter(Boolean).length} words
                                        </p>
                                    </div>

                                    <div className="mt-6 flex justify-between items-center">
                                        <Button variant="ghost" onClick={() => setSection("quiz")} className="text-neutral-500 rounded-xl [.high-contrast_&]:!text-neutral-400">
                                            <ArrowLeft className="w-4 h-4 mr-1" /> Back
                                        </Button>
                                        <Button
                                            onClick={handlePracticeSubmit}
                                            disabled={practiceText.trim().split(/\s+/).filter(Boolean).length < 10}
                                            className={btnPrimary}
                                        >
                                            Submit Practice
                                        </Button>
                                    </div>
                                </>
                            )}

                            {practiceSubmitted && (
                                <div className="mt-6 flex justify-end">
                                    <Button onClick={() => setSection("reflection")} className={btnPrimary}>
                                        Continue to Reflection <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Social Task (Social Confidence course) */}
                        {isSocialCourse && section === "practice" && (
                            <div className={cardCls}>
                                <div className="flex items-center gap-2 mb-4">
                                    <Heart className="w-5 h-5 text-rose-500" />
                                    <h3 className={cn("font-bold text-neutral-900 [.high-contrast_&]:!text-white", largeInteractionMode ? "text-xl" : "text-lg")}>
                                        Personal Challenge Task
                                    </h3>
                                </div>
                                <p className="text-sm text-neutral-500 mb-5 [.high-contrast_&]:!text-neutral-400">
                                    Submit a real social challenge you want to work on. Our AI will create a safe, step-by-step plan.
                                </p>

                                {taskBreakdown ? (
                                    <div className="space-y-4">
                                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 [.high-contrast_&]:!bg-green-950 [.high-contrast_&]:!border-green-700">
                                            <p className="text-sm font-semibold text-green-700 mb-3 [.high-contrast_&]:!text-green-400">Your Step-by-Step Plan</p>
                                            <ol className="space-y-2">
                                                {taskBreakdown.steps.map((step, i) => (
                                                    <li key={i} className="text-sm text-green-900 [.high-contrast_&]:!text-green-300 flex gap-2">
                                                        <span className="font-bold shrink-0">{i + 1}.</span>
                                                        {step}
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>
                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 [.high-contrast_&]:!bg-blue-950 [.high-contrast_&]:!border-blue-700">
                                            <p className="text-sm font-semibold text-blue-700 mb-1 [.high-contrast_&]:!text-blue-400">Safety Guidance</p>
                                            <p className="text-sm text-blue-900 [.high-contrast_&]:!text-blue-300">{taskBreakdown.safetyGuidance}</p>
                                        </div>
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 [.high-contrast_&]:!bg-amber-950 [.high-contrast_&]:!border-amber-700">
                                            <p className="text-sm font-semibold text-amber-700 mb-1 [.high-contrast_&]:!text-amber-400">Backup Plan</p>
                                            <p className="text-sm text-amber-900 [.high-contrast_&]:!text-amber-300">{taskBreakdown.backupPlan}</p>
                                        </div>
                                        <p className="text-sm text-neutral-600 [.high-contrast_&]:!text-neutral-400 italic">{taskBreakdown.encouragement}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-700 mb-2 [.high-contrast_&]:!text-white">
                                                Describe your challenge
                                            </label>
                                            <textarea
                                                value={taskDescription}
                                                onChange={(e) => setTaskDescription(e.target.value)}
                                                placeholder="E.g. 'I want to practice introducing myself to new people at events…'"
                                                className="w-full p-4 rounded-xl border-2 border-neutral-200 focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/15 outline-none resize-none min-h-[100px] text-base [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-700 mb-2 [.high-contrast_&]:!text-white">
                                                Fear rating: {fearRating}/10
                                            </label>
                                            <input
                                                type="range" min={1} max={10} value={fearRating}
                                                onChange={(e) => setFearRating(Number(e.target.value))}
                                                className="w-full accent-neutral-900"
                                                aria-label="Fear rating 1 to 10"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-700 mb-2 [.high-contrast_&]:!text-white">
                                                Why is this difficult?
                                            </label>
                                            <textarea
                                                value={whyDifficult}
                                                onChange={(e) => setWhyDifficult(e.target.value)}
                                                placeholder="E.g. 'I worry about being judged or rejected…'"
                                                className="w-full p-4 rounded-xl border-2 border-neutral-200 focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/15 outline-none resize-none min-h-[80px] text-base [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white"
                                            />
                                        </div>
                                        <Button
                                            onClick={handleTaskSubmit}
                                            disabled={!taskDescription.trim() || taskLoading}
                                            className={btnPrimary}
                                        >
                                            {taskLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Heart className="w-4 h-4 mr-2" />}
                                            Generate My Plan
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════
            SECTION 5 — REFLECTION
        ══════════════════════════════════════════════════════════════ */}
                {section === "reflection" && (
                    <div id="section-reflection" role="tabpanel" className="space-y-6">
                        <div className={cardCls}>
                            <h2 className={cn("font-bold text-neutral-900 [.high-contrast_&]:!text-white mb-2", largeInteractionMode ? "text-2xl" : "text-xl")}>
                                Reflection
                            </h2>
                            <p className={cn("text-neutral-600 mb-6 [.high-contrast_&]:!text-neutral-300", largeInteractionMode ? "text-lg" : "text-base")}>
                                {moduleData.reflectionPrompt}
                            </p>

                            {reflectionResult?.approved ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-green-50 border border-green-200 text-green-800 [.high-contrast_&]:!bg-green-950 [.high-contrast_&]:!border-green-700 [.high-contrast_&]:!text-green-300">
                                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                                        <div>
                                            <p className="font-semibold">Reflection accepted — {reflectionResult.score}%</p>
                                            <p className="text-sm opacity-80">{reflectionResult.feedback}</p>
                                        </div>
                                    </div>

                                    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 [.high-contrast_&]:!bg-neutral-900 [.high-contrast_&]:!border-neutral-700">
                                        <p className="text-sm text-neutral-500 mb-1 [.high-contrast_&]:!text-neutral-400">Your reflection:</p>
                                        <p className="text-sm text-neutral-700 [.high-contrast_&]:!text-white whitespace-pre-wrap">{reflectionText}</p>
                                    </div>

                                    {/* Module completion celebration */}
                                    {progress && progress.totalProgress >= 80 && (
                                        <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-neutral-900 text-white [.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black">
                                            <Trophy className="w-5 h-5 text-yellow-400 shrink-0 [.high-contrast_&]:!text-yellow-600" />
                                            <div>
                                                <p className="font-semibold">Module nearly complete!</p>
                                                <p className="text-sm opacity-80">Progress: {Math.round(progress.totalProgress)}%</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {reflectionResult && !reflectionResult.approved && (
                                        <div className="mb-4 flex items-start gap-3 px-5 py-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm [.high-contrast_&]:!bg-red-950 [.high-contrast_&]:!border-red-700 [.high-contrast_&]:!text-red-300">
                                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                            {reflectionResult.feedback}
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <textarea
                                            value={reflectionText}
                                            onChange={(e) => setReflectionText(e.target.value)}
                                            placeholder={`Write your reflection here… (minimum ${moduleData.minReflectionWords} words)`}
                                            aria-label="Reflection textarea"
                                            className={cn(
                                                "w-full p-5 rounded-xl border-2 focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/15 outline-none resize-y transition-all",
                                                "[.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white",
                                                largeInteractionMode ? "min-h-[240px] text-xl" : "min-h-[180px] text-base",
                                                "border-neutral-200"
                                            )}
                                        />
                                        <div className="flex items-center justify-between text-xs text-neutral-400 [.high-contrast_&]:!text-neutral-500">
                                            <span>{wordCount} / {moduleData.minReflectionWords} words minimum</span>
                                            {wordCount >= moduleData.minReflectionWords && (
                                                <span className="text-green-500 [.high-contrast_&]:!text-green-400 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> Word count met
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-between items-center">
                                        <Button variant="ghost" onClick={() => setSection("practice")} className="text-neutral-500 rounded-xl [.high-contrast_&]:!text-neutral-400">
                                            <ArrowLeft className="w-4 h-4 mr-1" /> Back
                                        </Button>
                                        <Button
                                            onClick={handleReflectionSubmit}
                                            disabled={wordCount < moduleData.minReflectionWords || reflectionLoading}
                                            className={btnPrimary}
                                        >
                                            {reflectionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ScrollText className="w-4 h-4 mr-2" />}
                                            Submit Reflection
                                        </Button>
                                    </div>
                                </>
                            )}

                            {reflectionResult?.approved && (
                                <div className="mt-6 flex justify-between items-center">
                                    <Button variant="ghost" onClick={() => router.push(`/courses/${courseId}`)} className="text-neutral-500 rounded-xl [.high-contrast_&]:!text-neutral-400">
                                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Course
                                    </Button>
                                    <Button onClick={() => router.push(`/courses/${courseId}`)} className={btnPrimary}>
                                        <Trophy className="w-4 h-4 mr-1" /> View Course Progress
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
