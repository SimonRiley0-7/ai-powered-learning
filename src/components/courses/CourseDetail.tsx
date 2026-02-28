"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccessibility } from "@/context/AccessibilityContext";
import { Button } from "@/components/ui/button";
import {
    CheckCircle2, Lock, ArrowLeft, Loader2, Trophy,
    BookOpen, Clock, Zap, ChevronRight, Target
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleSummary {
    id: string;
    order: number;
    title: string;
    questionCount: number;
    unlocked: boolean;
    totalProgress: number;
    lessonRead: boolean;
    videoWatched: boolean;
    quizPassed: boolean;
    reflectionSubmitted: boolean;
    practiceSubmitted: boolean;
}

interface CourseDetail {
    id: string;
    title: string;
    description: string;
    objectives: string[];
    outcomes: string[];
    subject: string;
    skillLevel: string;
    durationHours: number;
    courseType: string;
    enrolled: boolean;
    completedAt: string | null;
    certificateId: string | null;
    overallProgress: number;
    modules: ModuleSummary[];
}

export default function CourseDetailPage({ courseId }: { courseId: string }) {
    const router = useRouter();
    const { largeInteractionMode } = useAccessibility();

    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);

    useEffect(() => {
        fetch(`/api/courses/${courseId}`)
            .then((r) => r.json())
            .then((data: CourseDetail) => { setCourse(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [courseId]);

    const handleEnroll = useCallback(async () => {
        setEnrolling(true);
        try {
            const res = await fetch(`/api/courses/${courseId}`, { method: "POST" });
            if (res.ok) setCourse((prev) => prev ? { ...prev, enrolled: true } : prev);
        } finally {
            setEnrolling(false);
        }
    }, [courseId]);

    const nextModule = course?.modules?.find((m) => m.unlocked && m.totalProgress < 100);

    const cardCls = cn(
        "bg-white rounded-2xl border border-neutral-200 p-6",
        "[.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white"
    );

    // ── Voice Navigation Listener ──────────────────────────────────────────
    useEffect(() => {
        const handleVoiceCommand = (e: CustomEvent<string>) => {
            const intent = e.detail;
            if (intent === "start_course" || intent === "enroll" || intent === "continue") {
                if (!course) return;

                if (course.completedAt) {
                    router.push(`/certificates/${course.certificateId}`);
                } else if (course.enrolled && nextModule) {
                    router.push(`/courses/${courseId}/modules/${nextModule.id}`);
                } else if (!course.enrolled) {
                    handleEnroll();
                }
            }
        };

        window.addEventListener("voice_command", handleVoiceCommand as EventListener);
        return () => window.removeEventListener("voice_command", handleVoiceCommand as EventListener);
    }, [course, nextModule, courseId, router, handleEnroll]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-400">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (!course) return null;

    return (
        <div className="min-h-screen bg-neutral-50 [.high-contrast_&]:!bg-neutral-950">
            {/* Header */}
            <div className="bg-white border-b border-neutral-200 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-neutral-800">
                <div className="max-w-5xl mx-auto px-6 py-6">
                    <button
                        onClick={() => router.push("/courses")}
                        className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 mb-4 transition-colors [.high-contrast_&]:!text-neutral-400 [.high-contrast_&]:hover:!text-white"
                    >
                        <ArrowLeft className="w-4 h-4" /> All Courses
                    </button>
                    <div className="flex flex-wrap gap-4 items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wide">{course.subject}</span>
                                {course.courseType === "SOCIAL_CONFIDENCE" && (
                                    <span className="text-xs bg-rose-50 text-rose-600 border border-rose-200 rounded-full px-2 py-0.5 font-medium [.high-contrast_&]:!bg-rose-950 [.high-contrast_&]:!text-rose-400">
                                        Social Confidence
                                    </span>
                                )}
                            </div>
                            <h1 className={cn(
                                "font-bold text-neutral-900 [.high-contrast_&]:!text-white",
                                largeInteractionMode ? "text-4xl" : "text-2xl"
                            )}>
                                {course.title}
                            </h1>
                            <p className="text-neutral-500 mt-2 [.high-contrast_&]:!text-neutral-400 max-w-2xl">
                                {course.description}
                            </p>
                            <div className="flex items-center gap-5 mt-3 text-sm text-neutral-400 [.high-contrast_&]:!text-neutral-500">
                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {course.durationHours}h</span>
                                <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> {course.modules.length} modules</span>
                                <span className="capitalize">{course.skillLevel.toLowerCase()}</span>
                            </div>
                        </div>

                        {/* Progress circle + action */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative w-24 h-24" role="img" aria-label={`${course.overallProgress}% complete`}>
                                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                                    <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor"
                                        className="text-neutral-100 [.high-contrast_&]:!text-neutral-800" strokeWidth="8" />
                                    <circle cx="48" cy="48" r="40" fill="none" strokeWidth="8"
                                        className="text-neutral-900 [.high-contrast_&]:!text-white"
                                        stroke="currentColor"
                                        strokeDasharray={`${2 * Math.PI * 40}`}
                                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - course.overallProgress / 100)}`}
                                        strokeLinecap="round"
                                        style={{ transition: "stroke-dashoffset 0.5s ease" }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xl font-bold text-neutral-900 [.high-contrast_&]:!text-white">
                                        {course.overallProgress}%
                                    </span>
                                </div>
                            </div>

                            {course.completedAt ? (
                                <Button asChild size="sm" className="bg-yellow-500 hover:bg-yellow-400 text-white rounded-xl font-semibold">
                                    <Link href={`/certificates/${course.certificateId}`}>
                                        <Trophy className="w-4 h-4 mr-1.5" /> View Certificate
                                    </Link>
                                </Button>
                            ) : course.enrolled && nextModule ? (
                                <Button asChild className={cn(
                                    "bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-semibold",
                                    "[.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black",
                                    largeInteractionMode ? "h-12 px-6 text-base" : "h-10 px-5 text-sm"
                                )}>
                                    <Link href={`/courses/${courseId}/modules/${nextModule.id}`}>
                                        <Zap className="w-4 h-4 mr-1.5" /> Continue
                                    </Link>
                                </Button>
                            ) : !course.enrolled ? (
                                <Button
                                    onClick={handleEnroll}
                                    disabled={enrolling}
                                    className={cn(
                                        "bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-semibold",
                                        "[.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black",
                                        largeInteractionMode ? "h-12 px-6 text-base" : "h-10 px-5 text-sm"
                                    )}
                                >
                                    {enrolling ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Zap className="w-4 h-4 mr-1.5" />}
                                    Enroll Now
                                </Button>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Module list */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className={cn(
                        "font-bold text-neutral-900 [.high-contrast_&]:!text-white",
                        largeInteractionMode ? "text-2xl" : "text-xl"
                    )}>
                        Modules
                    </h2>
                    <div className="space-y-3" role="list">
                        {course.modules.map((m) => {
                            const locked = !m.unlocked;
                            return (
                                <div
                                    key={m.id}
                                    role="listitem"
                                    className={cn(
                                        "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all",
                                        locked
                                            ? "border-neutral-100 bg-neutral-50 opacity-60 cursor-not-allowed [.high-contrast_&]:!border-neutral-800 [.high-contrast_&]:!bg-neutral-900"
                                            : m.totalProgress >= 100
                                                ? "border-green-200 bg-green-50 [.high-contrast_&]:!border-green-800 [.high-contrast_&]:!bg-green-950"
                                                : "border-neutral-200 bg-white hover:border-neutral-300 [.high-contrast_&]:!border-neutral-700 [.high-contrast_&]:!bg-black"
                                    )}
                                >
                                    {/* Status icon */}
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm",
                                        m.totalProgress >= 100
                                            ? "bg-green-100 text-green-700 [.high-contrast_&]:!bg-green-900 [.high-contrast_&]:!text-green-400"
                                            : locked
                                                ? "bg-neutral-100 text-neutral-300 [.high-contrast_&]:!bg-neutral-800 [.high-contrast_&]:!text-neutral-600"
                                                : "bg-neutral-900 text-white [.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black"
                                    )}>
                                        {m.totalProgress >= 100
                                            ? <CheckCircle2 className="w-5 h-5" />
                                            : locked
                                                ? <Lock className="w-4 h-4" />
                                                : m.order}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "font-semibold text-neutral-900 [.high-contrast_&]:!text-white",
                                            largeInteractionMode ? "text-lg" : "text-sm"
                                        )}>
                                            {m.title}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <div className="w-24 h-1.5 bg-neutral-100 rounded-full overflow-hidden [.high-contrast_&]:!bg-neutral-800">
                                                <div
                                                    className="h-full bg-neutral-900 rounded-full [.high-contrast_&]:!bg-white"
                                                    style={{ width: `${m.totalProgress}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-neutral-400 [.high-contrast_&]:!text-neutral-500">
                                                {Math.round(m.totalProgress)}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    {!locked && course.enrolled && (
                                        <Button
                                            asChild
                                            size="sm"
                                            className="shrink-0 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl [.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black"
                                        >
                                            <Link href={`/courses/${courseId}/modules/${m.id}`}>
                                                {m.totalProgress >= 100 ? "Review" : m.totalProgress > 0 ? "Continue" : "Start"}
                                                <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Objectives */}
                    {course.objectives.length > 0 && (
                        <div className={cardCls}>
                            <h3 className="font-semibold text-neutral-900 [.high-contrast_&]:!text-white mb-3 flex items-center gap-2">
                                <Target className="w-4 h-4" /> Learning Objectives
                            </h3>
                            <ul className="space-y-2">
                                {course.objectives.map((obj, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-neutral-600 [.high-contrast_&]:!text-neutral-300">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                        {obj}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Outcomes */}
                    {course.outcomes.length > 0 && (
                        <div className={cardCls}>
                            <h3 className="font-semibold text-neutral-900 [.high-contrast_&]:!text-white mb-3">
                                What You&apos;ll Achieve
                            </h3>
                            <ul className="space-y-2">
                                {course.outcomes.map((out, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-neutral-600 [.high-contrast_&]:!text-neutral-300">
                                        <Trophy className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                                        {out}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
