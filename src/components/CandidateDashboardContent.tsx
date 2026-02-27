"use client"

import { useAccessibility } from "@/context/AccessibilityContext"
import Link from "next/link"
import React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { startAttempt } from "@/app/actions/assessment"

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
    const [isStarting, setIsStarting] = React.useState<string | null>(null);
    const router = useRouter();

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
        <div className={
            // Apply the global premium background and ensure high-contrast flips to pure black
            `relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-8 pt-24 [.high-contrast_&]:!bg-black [.high-contrast_&]:!bg-none [.high-contrast_&]:!text-white ${largeInteractionMode ? "text-lg" : ""}`
        }>
            {/* Dynamic Background Blobs (Hidden in High Contrast) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none [.high-contrast_&]:hidden">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-400/20 dark:bg-indigo-600/20 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-purple-400/20 dark:bg-purple-600/20 blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
                <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[40%] rounded-full bg-blue-400/20 dark:bg-blue-600/20 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
            </div>

            <div className="max-w-6xl mx-auto space-y-8 relative z-10">
                <div>
                    <h1 className={`${largeInteractionMode ? "text-5xl" : "text-3xl"} font-extrabold tracking-tight [.high-contrast_&]:!text-white`}>
                        Welcome, {user.name || "Candidate"}
                    </h1>
                    <p className={`${largeInteractionMode ? "text-xl" : "text-muted-foreground"} mt-2 [.high-contrast_&]:!text-white`}>
                        {simplifiedMode ? "This is your test hub." : "Your accessible assessment portal."}
                    </p>
                </div>

                <div className={`grid gap-6 ${simplifiedMode ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"}`}>
                    <div className={
                        `rounded-3xl border border-white/50 bg-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl p-8 transition-all hover:bg-white/70 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white [.high-contrast_&]:!shadow-none [.high-contrast_&]:!backdrop-blur-none ${simplifiedMode ? "col-span-1" : "md:col-span-2 lg:col-span-2"} space-y-4`
                    }>
                        <h3 className={`font-bold leading-none tracking-tight mb-4 [.high-contrast_&]:!text-white ${largeInteractionMode ? "text-4xl" : "text-2xl"}`}>
                            Available Assessments
                        </h3>
                        {availableAssessments.length === 0 ? (
                            <p className={`${largeInteractionMode ? "text-lg" : "text-base text-muted-foreground"} [.high-contrast_&]:!text-white`}>
                                You have 0 pending tests.
                            </p>
                        ) : (
                            <div className="grid gap-4">
                                {availableAssessments.map((test) => (
                                    <div key={test.id} className={
                                        `p-5 border border-slate-200/60 rounded-2xl flex flex-col md:flex-row gap-6 md:gap-4 justify-between items-start md:items-center bg-white/40 shadow-sm transition-all hover:bg-white/80 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white`
                                    }>
                                        <div className="flex-1">
                                            <h4 className={`font-extrabold text-slate-800 ${largeInteractionMode ? "text-2xl" : "text-lg"} [.high-contrast_&]:!text-white break-words`}>{test.title}</h4>
                                            <p className={`${largeInteractionMode ? "text-lg" : "text-sm text-slate-600"} font-medium mt-1 [.high-contrast_&]:!text-white`}>
                                                {test.subject} • {test.duration} mins • {test._count.questions} questions
                                            </p>
                                        </div>
                                        <div className="w-full md:w-auto mt-2 md:mt-0 shrinkage-0">
                                            <Button
                                                role="link"
                                                aria-label={`Take assessment: ${test.title}`}
                                                onClick={() => handleStartAssessment(test.id)}
                                                disabled={isStarting === test.id}
                                                className={
                                                    `w-full md:w-auto font-bold focus:outline focus:outline-2 focus:outline-blue-500 transition-all shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 rounded-xl [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white [.high-contrast_&]:!shadow-none [.high-contrast_&]:!bg-none ${largeInteractionMode ? "h-16 px-8 text-xl" : "h-12 px-6"}`
                                                }>
                                                {isStarting === test.id ? "Starting..." : "Take Assessment"}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={`space-y-6 ${simplifiedMode ? "flex flex-col items-center" : ""}`}>
                        {verification && (
                            <div className={
                                `rounded-3xl border border-white/50 bg-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl p-6 transition-all hover:bg-white/70 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white [.high-contrast_&]:!shadow-none [.high-contrast_&]:!backdrop-blur-none ${simplifiedMode ? "w-full max-w-md" : "w-full"}`
                            }>
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className={`font-bold leading-none tracking-tight [.high-contrast_&]:!text-white ${largeInteractionMode ? "text-2xl" : "text-xl"}`}>
                                        PwD Verification
                                    </h3>
                                    <Badge
                                        className={`${largeInteractionMode ? "text-base px-3 py-1.5" : ""} font-bold rounded-lg shadow-sm`}
                                        variant={verification.verificationStatus === "VERIFIED" ? "default" : verification.verificationStatus === "FAILED" ? "destructive" : "secondary"}
                                    >
                                        {verification.verificationStatus}
                                    </Badge>
                                </div>
                                <p className={`${largeInteractionMode ? "text-lg" : "text-sm"} font-semibold mb-2 text-slate-600 [.high-contrast_&]:!text-white`}>
                                    Profile: <span className="text-slate-900 [.high-contrast_&]:!text-white">{verification.disabilityType || "Awaiting Details"}</span>
                                </p>
                                {verification.verificationStatus === "FAILED" && (
                                    <Link href="/dashboard/verify-pwd">
                                        <Button variant="outline" size={largeInteractionMode ? "lg" : "default"} className="w-full mt-4 font-bold border-slate-300 bg-white hover:bg-slate-50 rounded-xl shadow-sm [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white">
                                            Retry Verification
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        )}

                        {!simplifiedMode && (
                            <>
                                <div className="rounded-3xl border border-white/50 bg-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl p-6 transition-all hover:bg-white/70 w-full [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white [.high-contrast_&]:!shadow-none [.high-contrast_&]:!backdrop-blur-none">
                                    <h3 className={`font-bold leading-none tracking-tight mb-2 [.high-contrast_&]:!text-white ${largeInteractionMode ? "text-2xl" : "text-xl"}`}>
                                        Past Results
                                    </h3>
                                    <p className="text-sm font-medium text-slate-600 mb-5 [.high-contrast_&]:!text-white">View your completed assessment scores.</p>
                                    <Link href="/dashboard/results">
                                        <Button variant="outline" className={`w-full font-bold border-slate-300 bg-white hover:bg-slate-50 rounded-xl shadow-sm [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white ${largeInteractionMode ? "h-14 text-lg" : "h-12"}`}>
                                            View History
                                        </Button>
                                    </Link>
                                </div>
                                <div className="rounded-3xl border border-white/50 bg-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl p-6 transition-all hover:bg-white/70 w-full [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white [.high-contrast_&]:!shadow-none [.high-contrast_&]:!backdrop-blur-none">
                                    <h3 className={`font-bold leading-none tracking-tight mb-2 [.high-contrast_&]:!text-white ${largeInteractionMode ? "text-2xl" : "text-xl"}`}>
                                        Accessibility Profile
                                    </h3>
                                    <p className="text-sm font-medium text-slate-600 mb-5 [.high-contrast_&]:!text-white">Update your specific needs and UI preferences.</p>
                                    <Link href="/dashboard/settings">
                                        <Button variant="outline" className={`w-full font-bold border-slate-300 bg-white hover:bg-slate-50 rounded-xl shadow-sm [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white ${largeInteractionMode ? "h-14 text-lg" : "h-12"}`}>
                                            Accessibility Controls
                                        </Button>
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
