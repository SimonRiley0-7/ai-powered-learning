"use client";

import React, { useState, useEffect } from "react";
import { useAccessibility } from "@/context/AccessibilityContext";
import { Loader2, Trophy, Calendar, Star, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CertData {
    id: string;
    candidateName: string;
    courseName: string;
    finalScore: number;
    modeUsed: string;
    issuedAt: string;
    growthSummary?: string;
}

export default function CertificateView({ certId }: { certId: string }) {
    const { largeInteractionMode } = useAccessibility();
    const [cert, setCert] = useState<CertData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/courses/certificate?id=${certId}`)
            .then((r) => r.json())
            .then((d: CertData) => { setCert(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [certId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
            </div>
        );
    }
    if (!cert) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50 [.high-contrast_&]:!bg-neutral-950">
                <p className="text-neutral-500">Certificate not found.</p>
            </div>
        );
    }

    const issuedDate = new Date(cert.issuedAt).toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric"
    });

    return (
        <div className="min-h-screen bg-neutral-50 [.high-contrast_&]:!bg-neutral-950 py-12 px-6">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Back link */}
                <Button asChild variant="ghost" size="sm" className="text-neutral-500 rounded-xl [.high-contrast_&]:!text-neutral-400">
                    <Link href="/courses"><ArrowLeft className="w-4 h-4 mr-1" /> Courses</Link>
                </Button>

                {/* Certificate card — printable */}
                <div
                    id="certificate-card"
                    className={cn(
                        "bg-white rounded-3xl border-4 border-neutral-900 p-10 text-center relative overflow-hidden",
                        "[.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white"
                    )}
                >
                    {/* Decorative corner stars */}
                    <Star className="absolute top-4 left-4 w-6 h-6 text-yellow-300 fill-yellow-300 opacity-60" aria-hidden="true" />
                    <Star className="absolute top-4 right-4 w-6 h-6 text-yellow-300 fill-yellow-300 opacity-60" aria-hidden="true" />
                    <Star className="absolute bottom-4 left-4 w-6 h-6 text-yellow-300 fill-yellow-300 opacity-60" aria-hidden="true" />
                    <Star className="absolute bottom-4 right-4 w-6 h-6 text-yellow-300 fill-yellow-300 opacity-60" aria-hidden="true" />

                    {/* Header */}
                    <div className="mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neutral-900 mb-4 [.high-contrast_&]:!bg-white">
                            <Trophy className="w-8 h-8 text-yellow-400 [.high-contrast_&]:!text-yellow-600" />
                        </div>
                        <p className="text-xs uppercase tracking-[0.25em] font-semibold text-neutral-400 mb-2 [.high-contrast_&]:!text-neutral-500">
                            Certificate of Completion
                        </p>
                        <p className="text-sm text-neutral-400 [.high-contrast_&]:!text-neutral-500">
                            AI-Powered Adaptive Learning Platform
                        </p>
                    </div>

                    {/* Name */}
                    <div className="mb-6">
                        <p className="text-sm text-neutral-400 mb-1 [.high-contrast_&]:!text-neutral-500">This certifies that</p>
                        <h1 className={cn(
                            "font-bold text-neutral-900 [.high-contrast_&]:!text-white",
                            largeInteractionMode ? "text-5xl" : "text-4xl"
                        )}>
                            {cert.candidateName}
                        </h1>
                    </div>

                    {/* Course */}
                    <div className="mb-6">
                        <p className="text-sm text-neutral-400 mb-1 [.high-contrast_&]:!text-neutral-500">has successfully completed</p>
                        <h2 className={cn(
                            "font-bold text-neutral-900 [.high-contrast_&]:!text-white",
                            largeInteractionMode ? "text-3xl" : "text-2xl"
                        )}>
                            {cert.courseName}
                        </h2>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center justify-center gap-10 my-8">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-neutral-900 [.high-contrast_&]:!text-white">{cert.finalScore}%</p>
                            <p className="text-xs text-neutral-400 mt-0.5 [.high-contrast_&]:!text-neutral-500">Final Score</p>
                        </div>
                        <div className="w-px h-10 bg-neutral-200 [.high-contrast_&]:!bg-neutral-700" />
                        <div className="text-center">
                            <p className="text-sm font-semibold text-neutral-700 [.high-contrast_&]:!text-neutral-300 capitalize">
                                {cert.modeUsed.replace("_", " ").toLowerCase() === "none" ? "Standard" : cert.modeUsed}
                            </p>
                            <p className="text-xs text-neutral-400 mt-0.5 [.high-contrast_&]:!text-neutral-500">Mode Used</p>
                        </div>
                        <div className="w-px h-10 bg-neutral-200 [.high-contrast_&]:!bg-neutral-700" />
                        <div className="text-center">
                            <p className="text-sm font-semibold text-neutral-700 [.high-contrast_&]:!text-neutral-300 flex items-center gap-1.5 justify-center">
                                <Calendar className="w-3.5 h-3.5" />
                                {issuedDate}
                            </p>
                            <p className="text-xs text-neutral-400 mt-0.5 [.high-contrast_&]:!text-neutral-500">Issued</p>
                        </div>
                    </div>

                    {/* Growth summary */}
                    {cert.growthSummary && (
                        <div className="mt-6 bg-neutral-50 rounded-xl p-5 text-left border border-neutral-200 [.high-contrast_&]:!bg-neutral-900 [.high-contrast_&]:!border-neutral-700">
                            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2 [.high-contrast_&]:!text-neutral-500">
                                Growth Summary
                            </p>
                            <p className="text-sm text-neutral-600 [.high-contrast_&]:!text-neutral-300 leading-relaxed italic">
                                &ldquo;{cert.growthSummary}&rdquo;
                            </p>
                        </div>
                    )}

                    {/* Certificate ID */}
                    <p className="mt-8 text-xs text-neutral-300 [.high-contrast_&]:!text-neutral-700 font-mono">
                        Certificate ID: {cert.id}
                    </p>
                </div>

                {/* Print button */}
                <div className="flex justify-center">
                    <Button
                        onClick={() => window.print()}
                        className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-semibold px-8 [.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Print / Save as PDF
                    </Button>
                </div>
            </div>
        </div>
    );
}
