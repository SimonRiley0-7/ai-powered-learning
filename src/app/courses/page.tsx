"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccessibility } from "@/context/AccessibilityContext";
import { Button } from "@/components/ui/button";
import {
    BookOpen, Clock, Users, ChevronRight, CheckCircle2,
    Loader2, Trophy, Zap, Search, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Course {
    id: string;
    title: string;
    description: string;
    subject: string;
    skillLevel: string;
    durationHours: number;
    courseType: string;
    thumbnailUrl?: string;
    moduleCount: number;
    enrollmentCount: number;
    enrolled: boolean;
    completed: boolean;
    certificateId?: string | null;
}

function CourseCatalogueContent() {
    const router = useRouter();
    const { largeInteractionMode } = useAccessibility();

    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "enrolled" | "available">("all");

    const searchParams = useSearchParams();

    useEffect(() => {
        const query = searchParams.get("search");
        if (query) setSearch(query);

        fetch("/api/courses")
            .then((r) => r.json())
            .then((data: Course[]) => { setCourses(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [searchParams]);

    const handleEnroll = async (courseId: string) => {
        setEnrollingId(courseId);
        try {
            const res = await fetch(`/api/courses/${courseId}`, { method: "POST" });
            if (res.ok) {
                setCourses((prev) =>
                    prev.map((c) => c.id === courseId ? { ...c, enrolled: true } : c)
                );
                router.push(`/courses/${courseId}`);
            }
        } finally {
            setEnrollingId(null);
        }
    };

    const filtered = courses.filter((c) => {
        const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
            c.subject.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === "all" || (filter === "enrolled" ? c.enrolled : !c.enrolled);
        return matchSearch && matchFilter;
    });

    const enrolled = courses.filter((c) => c.enrolled);

    const cardCls = cn(
        "bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:border-neutral-300 hover:shadow-sm transition-all group",
        "[.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white"
    );

    const btnPrimary = cn(
        "bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-semibold transition-all",
        "[.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black",
        largeInteractionMode ? "h-14 px-6 text-lg" : "h-10 px-4 text-sm"
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 [.high-contrast_&]:!bg-neutral-950">
            {/* Header */}
            <div className="bg-white border-b border-neutral-200 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-neutral-800">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <h1 className={cn(
                        "font-bold text-neutral-900 [.high-contrast_&]:!text-white",
                        largeInteractionMode ? "text-4xl" : "text-3xl"
                    )}>
                        Course Catalogue
                    </h1>
                    <p className="text-neutral-500 mt-1 [.high-contrast_&]:!text-neutral-400">
                        AI-powered adaptive learning — personalized for you
                    </p>

                    {/* Search + filter */}
                    <div className="flex flex-wrap gap-3 mt-5">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" aria-hidden="true" />
                            <input
                                type="search"
                                placeholder="Search courses…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                aria-label="Search courses"
                                className={cn(
                                    "w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-neutral-200 focus:border-neutral-900 outline-none transition-all bg-white text-neutral-900",
                                    "[.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white",
                                    largeInteractionMode && "py-4 text-lg"
                                )}
                            />
                        </div>
                        <div className="flex gap-2" role="group" aria-label="Filter courses">
                            {(["all", "enrolled", "available"] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    aria-pressed={filter === f}
                                    className={cn(
                                        "px-4 py-2.5 rounded-xl border-2 text-sm font-medium capitalize transition-all",
                                        filter === f
                                            ? "bg-neutral-900 text-white border-neutral-900 [.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black [.high-contrast_&]:!border-white"
                                            : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-neutral-400 [.high-contrast_&]:!border-neutral-700",
                                        largeInteractionMode && "py-4 text-base"
                                    )}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
                {/* In-progress courses */}
                {enrolled.length > 0 && filter !== "available" && (
                    <section aria-labelledby="inprogress-heading">
                        <h2 id="inprogress-heading" className={cn(
                            "font-bold text-neutral-900 [.high-contrast_&]:!text-white mb-4",
                            largeInteractionMode ? "text-2xl" : "text-xl"
                        )}>
                            Continue Learning
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {enrolled.map((c) => (
                                <Link
                                    key={c.id}
                                    href={`/courses/${c.id}`}
                                    className={cn(cardCls, "flex flex-col no-underline")}
                                    aria-label={`Continue ${c.title}`}
                                >
                                    <div className="p-6 flex-1">
                                        <div className="flex items-start justify-between mb-3">
                                            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide [.high-contrast_&]:!text-neutral-500">
                                                {c.subject}
                                            </span>
                                            {c.completed && (
                                                <Trophy className="w-4 h-4 text-yellow-500" aria-label="Completed" />
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-neutral-900 [.high-contrast_&]:!text-white group-hover:text-neutral-600 transition-colors">
                                            {c.title}
                                        </h3>
                                        <p className="text-sm text-neutral-400 mt-1 line-clamp-2 [.high-contrast_&]:!text-neutral-500">
                                            {c.description}
                                        </p>
                                    </div>
                                    <div className="border-t border-neutral-100 px-6 py-4 flex items-center justify-between [.high-contrast_&]:!border-neutral-800">
                                        <span className="text-sm font-medium text-neutral-500 [.high-contrast_&]:!text-neutral-400 flex items-center gap-1.5">
                                            <BookOpen className="w-3.5 h-3.5" />
                                            {c.moduleCount} modules
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 transition-colors [.high-contrast_&]:!text-neutral-500 [.high-contrast_&]:group-hover:!text-white" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* All courses */}
                <section aria-labelledby="catalogue-heading">
                    <h2 id="catalogue-heading" className={cn(
                        "font-bold text-neutral-900 [.high-contrast_&]:!text-white mb-4",
                        largeInteractionMode ? "text-2xl" : "text-xl"
                    )}>
                        {filter === "enrolled" ? "Your Enrolled Courses" : filter === "available" ? "Available Courses" : "All Courses"}
                        <span className="ml-2 text-neutral-400 font-normal text-base">({filtered.length})</span>
                    </h2>

                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
                            <Filter className="w-10 h-10 mb-3" />
                            <p className="text-sm">No courses match your search or filter.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filtered.map((c) => (
                                <div key={c.id} className={cardCls}>
                                    {/* Card top */}
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide [.high-contrast_&]:!text-neutral-500">
                                                {c.subject}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {c.courseType === "SOCIAL_CONFIDENCE" && (
                                                    <span className="text-xs bg-rose-50 text-rose-600 border border-rose-200 rounded-full px-2 py-0.5 font-medium [.high-contrast_&]:!bg-rose-950 [.high-contrast_&]:!text-rose-400 [.high-contrast_&]:!border-rose-700">
                                                        Social
                                                    </span>
                                                )}
                                                <span className={cn(
                                                    "text-xs rounded-full px-2 py-0.5 font-medium border",
                                                    c.skillLevel === "BEGINNER"
                                                        ? "bg-green-50 text-green-700 border-green-200 [.high-contrast_&]:!bg-green-950 [.high-contrast_&]:!text-green-400"
                                                        : c.skillLevel === "INTERMEDIATE"
                                                            ? "bg-amber-50 text-amber-700 border-amber-200 [.high-contrast_&]:!bg-amber-950 [.high-contrast_&]:!text-amber-400"
                                                            : "bg-red-50 text-red-700 border-red-200 [.high-contrast_&]:!bg-red-950 [.high-contrast_&]:!text-red-400"
                                                )}>
                                                    {c.skillLevel.charAt(0) + c.skillLevel.slice(1).toLowerCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <h3 className="font-semibold text-neutral-900 [.high-contrast_&]:!text-white text-base mb-1">
                                            {c.title}
                                        </h3>
                                        <p className="text-sm text-neutral-400 [.high-contrast_&]:!text-neutral-500 line-clamp-3 flex-1">
                                            {c.description}
                                        </p>

                                        <div className="flex items-center gap-4 mt-4 text-xs text-neutral-400 [.high-contrast_&]:!text-neutral-500">
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {c.durationHours}h</span>
                                            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {c.moduleCount} modules</span>
                                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {c.enrollmentCount}</span>
                                        </div>
                                    </div>

                                    {/* Card actions */}
                                    <div className="border-t border-neutral-100 px-6 py-4 [.high-contrast_&]:!border-neutral-800">
                                        {c.enrolled ? (
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-green-600 font-medium flex items-center gap-1.5 [.high-contrast_&]:!text-green-400">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
                                                </span>
                                                <Button asChild size="sm" className="rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 [.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black">
                                                    <Link href={`/courses/${c.id}`}>Continue</Link>
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                onClick={() => handleEnroll(c.id)}
                                                disabled={enrollingId === c.id}
                                                className={cn(btnPrimary, "w-full")}
                                            >
                                                {enrollingId === c.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                                                Enroll Now
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

export default function CourseCataloguePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
            </div>
        }>
            <CourseCatalogueContent />
        </Suspense>
    );
}
