"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccessibility } from "@/context/AccessibilityContext";
import { explainSimply } from "@/lib/ai/gemini";
import AccessibilityControls from "@/components/AccessibilityControls";
import SpeakButton from "@/components/voice/SpeakButton";

type QuestionType = "MCQ" | "DESCRIPTIVE" | "SHORT_ANSWER" | "NUMERICAL" | "DIAGRAM";

interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: unknown;
  points: number;
  difficulty: string;
}

interface Answer {
  questionId: string;
  userAnswer: string;
}

interface AssessmentTakerProps {
  assessmentTitle: string;
  subject: string;
  onComplete: (answers: Answer[]) => void;
  extraTimeMultiplier: number;
  lockedBySupervisor: boolean;
  autoAdvanceQuestions: boolean;
  initialTimeRemaining: number;
  questions: Question[];
  isSubmitting: boolean;
}

export const AssessmentTaker: React.FC<AssessmentTakerProps> = ({
  assessmentTitle,
  subject,
  onComplete,
  extraTimeMultiplier,
  lockedBySupervisor,
  autoAdvanceQuestions,
  initialTimeRemaining,
  questions,
  isSubmitting
}) => {
  const { largeInteractionMode, simplifiedMode, voiceGuidanceEnabled } = useAccessibility();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining);
  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [simplifiedTexts, setSimplifiedTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    // Auto-read the prompt if voice guidance is enabled and Web Speech API is accessible
    if (voiceGuidanceEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Interrupt previous speech
      const utterance = new SpeechSynthesisUtterance();

      const currentQuestion = questions[currentQuestionIndex];
      let readText = `Question ${currentQuestionIndex + 1}. ${currentQuestion.prompt}. `;

      if (currentQuestion.type === 'MCQ' && Array.isArray(currentQuestion.options)) {
        readText += "Options are: " + currentQuestion.options.join(". ") + ".";
      }

      utterance.text = readText;
      utterance.rate = 0.9; // Slightly slower for clarity
      window.speechSynthesis.speak(utterance);
    }
  }, [currentQuestionIndex, questions]);

  useEffect(() => {
    // Hard submission timer loop
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [answers, isSubmitting]);

  const handleOptionSelect = (option: string) => {
    const question = questions[currentQuestionIndex];
    setAnswers({ ...answers, [question.id]: option });
    if (autoAdvanceQuestions || largeInteractionMode) {
      setTimeout(handleNext, 500); // Quick transition for motor profiles
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const question = questions[currentQuestionIndex];
    setAnswers({ ...answers, [question.id]: e.target.value });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    const formattedAnswers = Object.entries(answers).map(([questionId, userAnswer]) => ({
      questionId,
      userAnswer,
    }));
    onComplete(formattedAnswers);
  };

  // Handle global voice commands from VoiceNavButton
  useEffect(() => {
    const handleVoiceCommand = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const intent = customEvent.detail;

      console.log(`🎙️ [AssessmentTaker] Received voice command: ${intent}`);

      if (intent === "next_question") {
        if (currentQuestionIndex < questions.length - 1) {
          handleNext();
        } else {
          // Give audio feedback that this is the last question
          const utterance = new SpeechSynthesisUtterance("This is the last question.");
          window.speechSynthesis.speak(utterance);
        }
      } else if (intent === "prev_question") {
        if (currentQuestionIndex > 0) {
          handlePrevious();
        } else {
          const utterance = new SpeechSynthesisUtterance("This is the first question.");
          window.speechSynthesis.speak(utterance);
        }
      } else if (intent === "submit_assessment") {
        handleSubmit();
      }
    };

    window.addEventListener("voice_command", handleVoiceCommand);
    return () => window.removeEventListener("voice_command", handleVoiceCommand);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, questions.length]);

  const handleExplainSimply = async (question: Question) => {
    if (simplifiedTexts[question.id]) return;
    setExplainingId(question.id);
    try {
      const text = await explainSimply(question.prompt);
      setSimplifiedTexts(prev => ({ ...prev, [question.id]: text }));
    } catch {
      setSimplifiedTexts(prev => ({ ...prev, [question.id]: "Unable to simplify at this time." }));
    } finally {
      setExplainingId(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (questions.length === 0) return <div className="p-8 text-center [.high-contrast_&]:!text-white">Loading Assessment Intelligence...</div>;

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // VISUAL logic applies tailwind variants dynamically [.high-contrast_&]:!bg-black
  // COGNITIVE logic suppresses layout clutter
  // HEARING/SPEECH bypasses voice reliance by enforcing strong button boundaries and visual indicators

  return (
    <div className={`relative min-h-[80vh] flex flex-col items-center w-full max-w-5xl mx-auto space-y-6 [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white ${largeInteractionMode ? "p-4" : "p-0"}`}>

      {/* Banner area */}
      <div className={`w-full flex justify-between items-center bg-white/60 p-6 rounded-2xl shadow-sm border border-slate-200 backdrop-blur-md [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white ${simplifiedMode ? "flex-col gap-4 text-center" : ""}`}>
        <div>
          <h1 className={`font-black text-slate-900 [.high-contrast_&]:!text-white ${largeInteractionMode ? "text-4xl" : "text-3xl"}`}>{assessmentTitle}</h1>
          {!simplifiedMode && <p className="text-slate-500 font-medium mt-1 [.high-contrast_&]:!text-white">{subject} | Multiplier: {extraTimeMultiplier}x</p>}
        </div>
        <div className={`flex items-center gap-4 ${simplifiedMode ? "w-full justify-center" : ""}`}>
          <div className={`px-6 py-3 rounded-xl shadow-inner font-mono font-bold tracking-widest ${timeRemaining < 300 ? "bg-red-100 text-red-700 animate-pulse border border-red-300" : "bg-slate-100 text-slate-800 border border-slate-200"} [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white ${largeInteractionMode ? "text-3xl" : "text-xl"}`}>
            {formatTime(timeRemaining)}
          </div>
          {!simplifiedMode && <AccessibilityControls features={[]} lockedBySupervisor={lockedBySupervisor} className="shrink-0" />}
        </div>
      </div>

      {/* Assessment Card Grid */}
      <div className="w-full flex-1">
        <Card className={`h-full shadow-lg border-slate-200/60 bg-white/80 backdrop-blur-xl transition-all duration-300 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white ${largeInteractionMode ? "p-4 border-4" : "border"}`}>
          <CardHeader className="border-b border-slate-100/50 pb-6 [.high-contrast_&]:!border-white">
            <div className="flex justify-between items-start mb-2">
              <span className={`font-semibold tracking-wide text-blue-600 [.high-contrast_&]:!text-white ${largeInteractionMode ? "text-xl" : "text-sm uppercase"}`}>
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              {!simplifiedMode && <span className="font-bold text-slate-400 [.high-contrast_&]:!text-white">{currentQuestion.difficulty}</span>}
            </div>

            <div className="flex items-start gap-4 mt-4">
              <CardTitle className={`flex-1 font-bold leading-snug text-slate-900 [.high-contrast_&]:!text-white ${largeInteractionMode ? "text-4xl" : "text-2xl"}`}>
                {currentQuestion.prompt}
              </CardTitle>
              <SpeakButton text={currentQuestion.prompt} size={largeInteractionMode ? "lg" : "md"} className="shrink-0 mt-1" />
            </div>

            {/* COGNITIVE: Explain Simply Feature */}
            {simplifiedMode && (
              <div className="mt-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white">
                {simplifiedTexts[currentQuestion.id] ? (
                  <p className="text-lg font-medium text-indigo-900 [.high-contrast_&]:!text-white leading-relaxed">
                    💡 {simplifiedTexts[currentQuestion.id]}
                  </p>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => handleExplainSimply(currentQuestion)}
                    disabled={explainingId === currentQuestion.id}
                    className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 font-bold [.high-contrast_&]:!text-white [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white border"
                  >
                    {explainingId === currentQuestion.id ? "Simplifying with AI..." : "Explain This Simply"}
                  </Button>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="pt-8">
            {currentQuestion.type === "MCQ" ? (
              <div className={`grid gap-4 ${largeInteractionMode ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
                {Array.isArray(currentQuestion.options) && currentQuestion.options.map((option, idx) => {
                  const isSelected = answers[currentQuestion.id] === option;
                  return (
                    <Button
                      key={idx}
                      onClick={() => handleOptionSelect(option)}
                      variant="outline"
                      className={`justify-start text-left whitespace-normal h-auto py-4 transition-all
                                            ${isSelected
                          ? "ring-2 ring-blue-600 bg-blue-50/50 border-blue-300 [.high-contrast_&]:!ring-white [.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black"
                          : "hover:bg-slate-50 border-slate-200 [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white"} 
                                            ${largeInteractionMode ? "text-2xl p-6 min-h-[100px] border-2" : "text-lg"} font-semibold text-slate-700`}
                    >
                      <div className="w-full flex items-center">
                        <span className={`flex items-center justify-center rounded-full mr-4 shrinkage-0 font-bold border 
                                                ${isSelected ? "bg-blue-600 border-blue-600 text-white [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-black [.high-contrast_&]:!text-white" : "border-slate-300 text-slate-500 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white [.high-contrast_&]:!text-white"} 
                                                ${largeInteractionMode ? "w-10 h-10 text-xl" : "w-8 h-8 text-sm"}`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        {option}
                      </div>
                    </Button>
                  );
                })}
              </div>
            ) : (
              <div className="w-full">
                <textarea
                  className={`w-full min-h-[200px] p-6 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all resize-y outline-none [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white ${largeInteractionMode ? "text-2xl min-h-[300px]" : "text-lg"}`}
                  placeholder="Type your descriptive answer here..."
                  value={answers[currentQuestion.id] || ""}
                  onChange={handleTextChange}
                  spellCheck={!simplifiedMode}
                />
              </div>
            )}
          </CardContent>

          <CardFooter className="border-t border-slate-100/50 pt-6 flex justify-between items-center [.high-contrast_&]:!border-white">
            <Button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0 || isSubmitting}
              variant="secondary"
              className={`font-bold [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white [.high-contrast_&]:!text-white border ${largeInteractionMode ? "h-16 px-8 text-xl" : "h-12 px-6"}`}
            >
              Previous
            </Button>

            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white [.high-contrast_&]:!text-white border ${largeInteractionMode ? "h-16 px-10 text-2xl" : "h-12 px-8"}`}
              >
                {isSubmitting ? "Finalizing AI Evaluation..." : "Submit Attempt"}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={isSubmitting}
                className={`font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white [.high-contrast_&]:!text-white border ${largeInteractionMode ? "h-16 px-10 text-xl" : "h-12 px-8"}`}
              >
                Next Question
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};