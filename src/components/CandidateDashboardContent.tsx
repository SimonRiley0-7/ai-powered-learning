"use client"

import { useAccessibility } from "@/context/AccessibilityContext"
import Link from "next/link"
import React, { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { startAttempt } from "@/app/actions/assessment"
import { BookOpen, Clock, Hash, ArrowRight, ShieldCheck, BarChart3, Settings } from "lucide-react"

interface DashboardContentProps {
    user: { name?: string | null }
    availableAssessments: Array<{
        id: string;
        title: string;
        subject: string;
        duration: number;
        _count: { questions: number };
    }>
    verification: {
        verificationStatus: string;
        disabilityType?: string | null;
    } | null
}

export function CandidateDashboardContent({ user, availableAssessments, verification }: DashboardContentProps) {
    const { largeInteractionMode, simplifiedMode } = useAccessibility()
    const [isStarting, setIsStarting] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Auto-start assessment if navigated via Voice search
    useEffect(() => {
        const searchQuery = searchParams.get("search");
        if (searchQuery && availableAssessments.length > 0 && !isStarting) {
            const query = searchQuery.toLowerCase();
            const matchedAssessment = availableAssessments.find(a =>
                a.title.toLowerCase().includes(query) ||
                a.subject.toLowerCase().includes(query) ||
                query.includes(a.subject.toLowerCase()) ||
                query.includes(a.title.toLowerCase())
            );
            if (matchedAssessment) {
                if (typeof window !== "undefined" && "speechSynthesis" in window) {
                    const utterance = new SpeechSynthesisUtterance(`Starting ${matchedAssessment.title}`);
                    window.speechSynthesis.speak(utterance);
                }
                handleStartAssessment(matchedAssessment.id);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, availableAssessments]);

    const handleStartAssessment = async (assessmentId: string) => {
        setIsStarting(assessmentId);
        try {
            const attemptId = await startAttempt(assessmentId);
            router.push(`/dashboard/assessment/${attemptId}`);
        } catch (error) {
            console.error("Failed to start assessment:", error);
            setIsStarting(null);
        }
    };

    return (
        <div className={`min-h-screen bg-neutral-50 pt-6 pb-16 px-6 font-sans [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white ${largeInteractionMode ? "text-lg" : ""}`}>
            <div className="max-w-6xl mx-auto space-y-10">

                {/* ── Page Header ── */}
                <div className="pt-6">
                    <p className="text-xs font-semibold tracking-widest uppercase text-neutral-400 mb-2 [.high-contrast_&]:!text-gray-400">
                        Candidate Portal
                    </p>
                    <h1 className={`font-semibold tracking-tight text-neutral-900 [.high-contrast_&]:!text-white ${largeInteractionMode ? "text-5xl" : "text-3xl"}`}>
                        Welcome back, {user.name?.split(" ")[0] || "Candidate"}
                    </h1>
                    <p className={`mt-2 text-neutral-500 [.high-contrast_&]:!text-gray-300 ${largeInteractionMode ? "text-xl" : "text-base"}`}>
                        {simplifiedMode ? "Your test hub." : "Your assessments are ready. Good luck."}
                    </p>
                </div>

                {/* ── Main Grid ── */}
                <div className={`grid gap-6 ${simplifiedMode ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"}`}>

                    {/* ── Assessments Card ── */}
                    <div className={`bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white ${simplifiedMode ? "" : "lg:col-span-2"}`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center [.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black">
                                <BookOpen className="w-4 h-4 text-neutral-600" />
                            </div>
                            <h2 className={`font-semibold tracking-tight text-neutral-900 [.high-contrast_&]:!text-white ${largeInteractionMode ? "text-3xl" : "text-xl"}`}>
                                Available Assessments
                            </h2>
                        </div>

                        {availableAssessments.length === 0 ? (
                            <div className="py-12 text-center border border-dashed border-neutral-200 rounded-xl [.high-contrast_&]:!border-neutral-600">
                                <BookOpen className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
                                <p className="text-base font-medium text-neutral-400 [.high-contrast_&]:!text-gray-400">
                                    No assessments available right now.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {availableAssessments.map((test) => (
                                    <div
                                        key={test.id}
                                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border border-neutral-100 rounded-xl hover:border-neutral-300 hover:shadow-sm transition-all bg-neutral-50/50 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`font-semibold text-neutral-900 truncate [.high-contrast_&]:!text-white ${largeInteractionMode ? "text-2xl" : "text-base"}`}>
                                                {test.title}
                                            </h3>
                                            <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 ${largeInteractionMode ? "text-lg" : "text-sm"} text-neutral-500 [.high-contrast_&]:!text-gray-300`}>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" />{test.duration} mins
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Hash className="w-3.5 h-3.5" />{test._count.questions} questions
                                                </span>
                                                <span className="font-medium text-neutral-600 [.high-contrast_&]:!text-gray-200">{test.subject}</span>
                                            </div>
                                        </div>
                                        <Button
                                            role="link"
                                            aria-label={`Take assessment: ${test.title}`}
                                            onClick={() => handleStartAssessment(test.id)}
                                            disabled={isStarting === test.id}
                                            className={`shrink-0 bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl border-0 shadow-none transition-all focus:outline focus:outline-2 focus:outline-neutral-900 [.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black [.high-contrast_&]:!border-white ${largeInteractionMode ? "h-14 px-8 text-xl" : "h-10 px-5 text-sm"}`}
                                        >
                                            {isStarting === test.id ? "Starting…" : (
                                                <span className="flex items-center gap-2">
                                                    Begin <ArrowRight className="w-4 h-4" />
                                                </span>
                                            )}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Sidebar (standard mode) ── */}
                    {!simplifiedMode && (
                        <div className="space-y-5">
                            {/* PwD Verification */}
                            {verification && (
                                <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white">
                                    <div className="flex items-center gap-2 mb-4">
                                        <ShieldCheck className="w-4 h-4 text-neutral-500" />
                                        <h3 className={`font-semibold text-neutral-900 [.high-contrast_&]:!text-white ${largeInteractionMode ? "text-2xl" : "text-base"}`}>
                                            PwD Verification
                                        </h3>
                                    </div>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className={`text-neutral-500 [.high-contrast_&]:!text-gray-300 ${largeInteractionMode ? "text-lg" : "text-sm"} font-medium`}>
                                            {verification.disabilityType || "Awaiting details"}
                                        </p>
                                        <Badge
                                            className={`${largeInteractionMode ? "text-base px-3 py-1" : "text-xs"} font-semibold rounded-lg`}
                                            variant={verification.verificationStatus === "VERIFIED" ? "default" : verification.verificationStatus === "FAILED" ? "destructive" : "secondary"}
                                        >
                                            {verification.verificationStatus}
                                        </Badge>
                                    </div>
                                    {verification.verificationStatus === "FAILED" && (
                                        <Link href="/dashboard/verify-pwd">
                                            <Button variant="outline" size={largeInteractionMode ? "lg" : "default"} className={`w-full mt-2 rounded-xl border-neutral-200 font-medium text-neutral-700 hover:bg-neutral-50 [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white ${largeInteractionMode ? "h-12 text-lg" : ""}`}>
                                                Retry Verification
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            )}

                            {/* Past Results */}
                            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white">
                                <div className="flex items-center gap-2 mb-1">
                                    <BarChart3 className="w-4 h-4 text-neutral-500" />
                                    <h3 className={`font-semibold text-neutral-900 [.high-contrast_&]:!text-white ${largeInteractionMode ? "text-2xl" : "text-base"}`}>
                                        Past Results
                                    </h3>
                                </div>
                                <p className={`text-neutral-400 mb-5 [.high-contrast_&]:!text-gray-400 ${largeInteractionMode ? "text-lg" : "text-sm"}`}>
                                    Review your completed assessment scores.
                                </p>
                                <Link href="/dashboard/results">
                                    <Button variant="outline" className={`w-full rounded-xl border-neutral-200 font-medium text-neutral-700 hover:bg-neutral-50 [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white ${largeInteractionMode ? "h-12 text-lg" : "h-10"}`}>
                                        View History
                                    </Button>
                                </Link>
                            </div>

                            {/* Accessibility Settings */}
                            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white">
                                <div className="flex items-center gap-2 mb-1">
                                    <Settings className="w-4 h-4 text-neutral-500" />
                                    <h3 className={`font-semibold text-neutral-900 [.high-contrast_&]:!text-white ${largeInteractionMode ? "text-2xl" : "text-base"}`}>
                                        Accessibility Profile
                                    </h3>
                                </div>
                                <p className={`text-neutral-400 mb-5 [.high-contrast_&]:!text-gray-400 ${largeInteractionMode ? "text-lg" : "text-sm"}`}>
                                    Update your UI preferences and needs.
                                </p>
                                <Link href="/dashboard/settings">
                                    <Button variant="outline" className={`w-full rounded-xl border-neutral-200 font-medium text-neutral-700 hover:bg-neutral-50 [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white ${largeInteractionMode ? "h-12 text-lg" : "h-10"}`}>
                                        Accessibility Controls
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* ── Simplified mode stack ── */}
                    {simplifiedMode && (
                        <div className="space-y-4">
                            <Link href="/dashboard/results">
                                <Button variant="outline" className={`w-full rounded-xl border-neutral-200 font-medium [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white ${largeInteractionMode ? "h-14 text-xl" : "h-12"}`}>
                                    View Past Results
                                </Button>
                            </Link>
                            <Link href="/dashboard/settings">
                                <Button variant="outline" className={`w-full rounded-xl border-neutral-200 font-medium [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white ${largeInteractionMode ? "h-14 text-xl" : "h-12"}`}>
                                    Accessibility Controls
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
