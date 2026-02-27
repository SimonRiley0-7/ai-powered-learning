"use client";

import React, { useState } from "react";
import { submitAttempt } from "@/app/actions/assessment";
import { useRouter } from "next/navigation";
import { AssessmentTaker } from "@/components/AssessmentTaker";
interface AssessmentData {
    id: string;
    title: string;
    subject: string;
    duration: number;
    isAdaptive: boolean;
    questions: { id: string, type: "MCQ" | "DESCRIPTIVE" | "SHORT_ANSWER", prompt: string, points: number, difficulty: string, options?: unknown, correctAnswer?: string }[];
}

export default function AssessmentTakerWrapper({ attempt, settings }: { attempt: { id: string, startedAt: Date, extraTimeMultiplier: number, assessment: AssessmentData }, settings: { lockedBySupervisor?: boolean, autoAdvanceQuestions?: boolean, textToSpeech?: boolean } }) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculate real remaining time from server startedAt
    const durationMins = attempt.assessment.duration || 60;
    const extraTime = attempt.extraTimeMultiplier || 1.0;
    const totalAllowedSeconds = durationMins * 60 * extraTime;

    const startedAtTime = new Date(attempt.startedAt).getTime();
    const currentTime = new Date().getTime();
    const elapsedSeconds = Math.floor((currentTime - startedAtTime) / 1000);
    const initialTimeRemaining = Math.max(0, totalAllowedSeconds - elapsedSeconds);

    const handleComplete = async (answers: { questionId: string, userAnswer: string }[]) => {
        setIsSubmitting(true);
        try {
            // Map array of { questionId, userAnswer } to Record<string, string>
            const answersRecord: Record<string, string> = {};
            answers.forEach(a => {
                answersRecord[a.questionId] = a.userAnswer;
            });

            const resultId = await submitAttempt(attempt.id, answersRecord);
            if (resultId) {
                router.push(`/dashboard/assessment/${attempt.id}/result`);
            }
        } catch (e) {
            console.error(e);
            alert("Error submitting assessment. It may have already been submitted or timed out.");
            router.push(`/dashboard`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (initialTimeRemaining <= 0) {
        return <div className="p-8 text-center text-red-500 mt-20 font-bold text-2xl">Assessment Time Expired.</div>;
    }

    return (
        <AssessmentTaker
            assessmentTitle={attempt.assessment.title}
            subject={attempt.assessment.subject || "General"}
            onComplete={handleComplete}
            extraTimeMultiplier={extraTime}
            lockedBySupervisor={Boolean(settings?.lockedBySupervisor)}
            autoAdvanceQuestions={Boolean(settings?.autoAdvanceQuestions)}
            initialTimeRemaining={initialTimeRemaining}
            questions={attempt.assessment.questions}
            isSubmitting={isSubmitting}
        />
    );
}
