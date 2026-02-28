// app/assessments/demo/page.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssessmentTaker } from "@/components/AssessmentTaker";
import ResultsAnalytics from "@/components/ResultsAnalytics";

export default function DemoAssessmentPage() {
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<any>({
    answers: [],
    totalScore: 0,
  });

  // Accessibility features for demo
  const accessibilityFeatures = [
    "SCREEN_READER",
    "TEXT_TO_SPEECH",
    "VOICE_TO_TEXT",
    "HIGH_CONTRAST",
    "LARGE_TEXT",
    "KEYBOARD_NAVIGATION",
  ];

  // Demo assessment info
  const assessmentInfo = {
    id: "demo-assessment",
    title: "Full Stack Web Development Assessment",
    subject: "Web Development",
    isAdaptive: true,
    totalPoints: 100,
    passingScore: 70,
    description: "This assessment evaluates your knowledge and skills in modern web development, including frontend and backend technologies.",
  };

  // Sample questions for results page
  const sampleQuestions = [
    {
      id: "q1",
      text: "What is the capital of France?",
      type: "MCQ",
      difficulty: "EASY",
      points: 10,
    },
    {
      id: "q2",
      text: "Explain the concept of artificial intelligence and its impact on modern society.",
      type: "DESCRIPTIVE",
      difficulty: "MEDIUM",
      points: 20,
    },
    {
      id: "q3",
      text: "Design a simple algorithm to find the largest number in an array.",
      type: "PRACTICAL",
      difficulty: "MEDIUM",
      points: 15,
    },
  ];

  const handleAssessmentComplete = (answers: { questionId: string, userAnswer: string }[]) => {
    setResults({
      answers,
      totalScore: 0,
    });
    setCompleted(true);
  };

  const handleRestartDemo = () => {
    setStarted(false);
    setCompleted(false);
    setResults({
      answers: [],
      totalScore: 0,
    });
  };

  if (!started) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>{assessmentInfo.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">About this Assessment</h3>
              <p>{assessmentInfo.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded">
                <div className="text-sm text-gray-500">Subject</div>
                <div className="font-medium">{assessmentInfo.subject}</div>
              </div>
              <div className="p-4 border rounded">
                <div className="text-sm text-gray-500">Passing Score</div>
                <div className="font-medium">{assessmentInfo.passingScore}%</div>
              </div>
              <div className="p-4 border rounded">
                <div className="text-sm text-gray-500">Question Types</div>
                <div className="font-medium">MCQ, Descriptive, Practical</div>
              </div>
              <div className="p-4 border rounded">
                <div className="text-sm text-gray-500">Adaptive</div>
                <div className="font-medium">Yes</div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Accessibility Features</h3>
              <div className="flex flex-wrap gap-2">
                {accessibilityFeatures.map((feature, i) => (
                  <div key={i} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                    {feature.replace(/_/g, " ")}
                  </div>
                ))}
              </div>
            </div>

            {/*<div className="text-center pt-4">
              <Button size="lg" onClick={handleStartAssessment}>
                Start Demo Assessment
              </Button>
            </div>*/}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">{assessmentInfo.title} Results</h1>
          <Button onClick={handleRestartDemo}>Restart Demo</Button>
        </div>

        <ResultsAnalytics
          answers={results.answers}
          questions={sampleQuestions}
          assessmentTitle={assessmentInfo.title}
          subject={assessmentInfo.subject}
          totalPoints={assessmentInfo.totalPoints}
          passingScore={assessmentInfo.passingScore}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <AssessmentTaker
        assessmentTitle={assessmentInfo.title}
        subject={assessmentInfo.subject}
        onComplete={handleAssessmentComplete}
        extraTimeMultiplier={1.0}
        lockedBySupervisor={false}
        autoAdvanceQuestions={false}
        initialTimeRemaining={3600}
        questions={sampleQuestions as never}
        isSubmitting={false}
      />
    </div>
  );
}