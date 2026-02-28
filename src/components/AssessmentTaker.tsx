"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccessibility } from "@/context/AccessibilityContext";
import { explainSimply } from "@/lib/ai/groq";
import AccessibilityControls from "@/components/AccessibilityControls";
import SpeakButton from "@/components/voice/SpeakButton";
import { Mic, Brain, Hash, ArrowRight, ArrowLeft, Send, Eye, CheckCircle2 } from "lucide-react";
import { DiagramAnswerInput } from "@/components/DiagramAnswerInput";

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
  questions: initialQuestions,
  isSubmitting
}) => {
  const {
    largeInteractionMode,
    simplifiedMode,
    voiceGuidanceEnabled,
    highContrast,
    disabilityType,
  } = useAccessibility();

  const isVisuallyImpaired = disabilityType === "VISUAL" || highContrast;
  const isCognitive = disabilityType === "COGNITIVE";
  const isMotor = disabilityType === "MOTOR";
  const isHearing = disabilityType === "HEARING" || disabilityType === "SPEECH";
  // Standard users and hearing/speech users don't need voice guidance
  const shouldUseTTS = voiceGuidanceEnabled && !isHearing;
  const questions = useMemo(() => {
    if (!disabilityType || disabilityType === "NONE") return initialQuestions;
    return initialQuestions.filter(q => (q.type as string).toUpperCase() !== "DIAGRAM");
  }, [initialQuestions, disabilityType]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining);
  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [simplifiedTexts, setSimplifiedTexts] = useState<Record<string, string>>({});

  // Voice Dictation State
  const [isDictating, setIsDictating] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Ref for focus management — helps VI users jump straight to question content
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  // ARIA live region ref for announcing state changes to screen readers
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const announce = (message: string) => {
    // Always update ARIA live region
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = "";
      setTimeout(() => {
        if (liveRegionRef.current) liveRegionRef.current.textContent = message;
      }, 50);
    }
    // For HEARING users suppress TTS — they rely on visual/ARIA feedback only
    if (shouldUseTTS && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(message));
    }
  };

  // Focus the question heading whenever the question changes
  useEffect(() => {
    if (questionHeadingRef.current) {
      questionHeadingRef.current.focus();
    }
  }, [currentQuestionIndex]);

  // Auto-read the prompt if voice guidance is enabled
  useEffect(() => {
    if (voiceGuidanceEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const currentQuestion = questions[currentQuestionIndex];
      let readText = `Question ${currentQuestionIndex + 1} of ${questions.length}. ${currentQuestion.prompt}. `;
      if (currentQuestion.type === "MCQ" && Array.isArray(currentQuestion.options)) {
        readText += "Options are: " + currentQuestion.options.join(". ") + ".";
      }
      const utterance = new SpeechSynthesisUtterance(readText);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, questions]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        // Announce time warnings for VI users
        if (prev === 300) announce("Warning: 5 minutes remaining.");
        if (prev === 60) announce("Warning: 1 minute remaining.");
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, isSubmitting]);

  // Global voice commands
  useEffect(() => {
    const handleVoiceCommand = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const intent = customEvent.detail;
      if (intent === "next_question") {
        if (currentQuestionIndex < questions.length - 1) {
          handleNext();
        } else {
          announce("This is the last question.");
          window.speechSynthesis.speak(new SpeechSynthesisUtterance("This is the last question."));
        }
      } else if (intent === "prev_question") {
        if (currentQuestionIndex > 0) {
          handlePrevious();
        } else {
          announce("This is the first question.");
          window.speechSynthesis.speak(new SpeechSynthesisUtterance("This is the first question."));
        }
      } else if (intent === "submit_assessment") {
        handleSubmit();
      }
    };
    window.addEventListener("voice_command", handleVoiceCommand);
    return () => window.removeEventListener("voice_command", handleVoiceCommand);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, questions.length]);

  const startDictation = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        await processDictationAudio();
      };
      mediaRecorder.start();
      setIsDictating(true);
      announce("Listening to your answer. Click stop when you are done.");
      window.speechSynthesis.speak(new SpeechSynthesisUtterance("Listening. Click stop when done."));
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
      }, 60000);
    } catch (err) {
      console.error("Mic access denied:", err);
    }
  };

  const stopDictation = () => {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
  };

  const processDictationAudio = async () => {
    setIsDictating(false);
    try {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1] || "");
        };
        reader.readAsDataURL(blob);
      });
      const res = await fetch("/api/voice/stt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64, language: "en-IN" }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.transcript || "";
        if (text) {
          const question = questions[currentQuestionIndex];
          setAnswers((prev) => {
            const current = prev[question.id] || "";
            return { ...prev, [question.id]: current ? `${current.trim()} ${text.trim()}` : text.trim() };
          });
          announce("Answer captured.");
          window.speechSynthesis.speak(new SpeechSynthesisUtterance("Answer captured."));
        } else {
          announce("Could not capture speech. Please try again.");
          window.speechSynthesis.speak(new SpeechSynthesisUtterance("Could not capture speech. Try again."));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOptionSelect = (option: string) => {
    const question = questions[currentQuestionIndex];
    setAnswers({ ...answers, [question.id]: option });
    announce(`Selected: ${option}`);
    if (autoAdvanceQuestions || largeInteractionMode) {
      setTimeout(handleNext, 600);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const question = questions[currentQuestionIndex];
    setAnswers({ ...answers, [question.id]: e.target.value });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      announce(`Question ${currentQuestionIndex + 2} of ${questions.length}`);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      announce(`Question ${currentQuestionIndex} of ${questions.length}`);
    }
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    onComplete(Object.entries(answers).map(([questionId, userAnswer]) => ({ questionId, userAnswer })));
  };

  const handleExplainSimply = async (question: Question) => {
    if (simplifiedTexts[question.id]) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(simplifiedTexts[question.id]));
      return;
    }
    setExplainingId(question.id);
    try {
      const text = await explainSimply(question.prompt);
      setSimplifiedTexts((prev) => ({ ...prev, [question.id]: text }));
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    } catch {
      setSimplifiedTexts((prev) => ({ ...prev, [question.id]: "Unable to simplify at this time." }));
    } finally {
      setExplainingId(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (questions.length === 0) return (
    <div className="p-8 text-center text-neutral-500 [.high-contrast_&]:!text-white" role="status">
      Loading assessment…
    </div>
  );

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const answeredCount = Object.keys(answers).length;

  return (
    <div
      className={`relative min-h-[80vh] flex flex-col items-center w-full max-w-4xl mx-auto space-y-6 p-4
        [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white font-sans`}
    >
      {/* ── ARIA Live Region (invisible, screen-reader only) ── */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* ── Skip to content link (VI keyboard users) ── */}
      <a
        href="#question-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-neutral-900 focus:text-white focus:rounded-xl focus:font-semibold"
      >
        Skip to question
      </a>

      {/* ── VI Banner ── */}
      {isVisuallyImpaired && (
        <div
          role="region"
          aria-label="Visual accessibility active"
          className="w-full flex items-center gap-3 px-5 py-3 rounded-xl bg-neutral-900 text-white border border-neutral-800 [.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black [.high-contrast_&]:!border-black"
        >
          <Eye className="w-4 h-4 shrink-0" aria-hidden="true" />
          <p className={`font-medium ${largeInteractionMode ? "text-lg" : "text-sm"}`}>
            Visual accessibility mode active — questions are read aloud automatically. Use arrow keys or voice commands to navigate.
          </p>
        </div>
      )}

      {/* ── Banner / Timer ── */}
      <div
        role="banner"
        className={`w-full flex flex-wrap justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-neutral-200
          [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white ${simplifiedMode ? "flex-col text-center" : ""}`}
      >
        {/* Left — title */}
        <div className="min-w-0 flex-1">
          <h1
            className={`font-semibold tracking-tight text-neutral-900 [.high-contrast_&]:!text-white ${largeInteractionMode ? "text-3xl" : "text-xl"}`}
            id="assessment-title"
          >
            {assessmentTitle}
          </h1>
          {!simplifiedMode && (
            <p className="text-neutral-500 mt-1 text-sm [.high-contrast_&]:!text-gray-300">
              {subject} · {extraTimeMultiplier}x time multiplier
            </p>
          )}
        </div>

        {/* Right — controls (wraps below title on narrow screens) */}
        <div className={`flex items-center gap-3 shrink-0 ${simplifiedMode ? "w-full justify-center" : ""}`}>
          {/* Progress pill — hidden on very small screens */}
          {!simplifiedMode && (
            <span
              aria-label={`${answeredCount} of ${questions.length} questions answered`}
              className="hidden sm:inline text-xs font-semibold text-neutral-500 [.high-contrast_&]:!text-gray-300 whitespace-nowrap"
            >
              {answeredCount}/{questions.length} answered
            </span>
          )}
          {/* Timer */}
          <div
            role="timer"
            aria-label={`Time remaining: ${formatTime(timeRemaining)}`}
            className={`px-3 py-1.5 rounded-xl font-mono font-semibold tracking-wide whitespace-nowrap
              ${timeRemaining < 300
                ? "bg-red-50 text-red-600 border border-red-200 animate-pulse [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-red-400 [.high-contrast_&]:!border-red-400"
                : "bg-neutral-50 text-neutral-700 border border-neutral-200 [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white"}
              ${largeInteractionMode ? "text-xl" : "text-base"}`}
          >
            {formatTime(timeRemaining)}
          </div>
          {!simplifiedMode && (
            <AccessibilityControls features={[]} lockedBySupervisor={lockedBySupervisor} className="shrink-0" />
          )}
        </div>
      </div>


      {/* ── Question Card ── */}
      <div id="question-content" className="w-full flex-1">
        <Card
          className={`h-full shadow-sm border-neutral-200 bg-white transition-all duration-300 rounded-2xl overflow-hidden
            [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white
            ${isVisuallyImpaired ? "border-2 border-neutral-900 [.high-contrast_&]:!border-white" : "border"}
            ${largeInteractionMode ? "border-2" : ""}`}
        >
          {/* Progress bar */}
          <div
            role="progressbar"
            aria-valuenow={currentQuestionIndex + 1}
            aria-valuemin={1}
            aria-valuemax={questions.length}
            aria-label={`Question ${currentQuestionIndex + 1} of ${questions.length}`}
            className="w-full h-1.5 bg-neutral-100 [.high-contrast_&]:!bg-neutral-800"
          >
            <div
              className="h-full bg-neutral-900 transition-all duration-500 ease-out [.high-contrast_&]:!bg-white"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          <CardHeader className="border-b border-neutral-100 pb-6 pt-8 px-8 [.high-contrast_&]:!border-neutral-700">
            {/* Question meta row */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <span
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 text-neutral-600 [.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black"
                  aria-hidden="true"
                >
                  <Hash className="w-4 h-4" />
                </span>
                <span
                  className={`font-medium tracking-wide text-neutral-600 [.high-contrast_&]:!text-white ${largeInteractionMode ? "text-lg" : "text-sm uppercase"}`}
                  aria-label={`Question ${currentQuestionIndex + 1} of ${questions.length}`}
                >
                  Question {currentQuestionIndex + 1} <span className="text-neutral-400 [.high-contrast_&]:!text-gray-400">of {questions.length}</span>
                </span>
              </div>
              {!simplifiedMode && (
                <span className="text-xs font-medium px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full [.high-contrast_&]:!text-black [.high-contrast_&]:!bg-white">
                  {currentQuestion.difficulty}
                </span>
              )}
            </div>

            {/* Question prompt — tabIndex so focus() lands here after navigation */}
            <CardTitle
              ref={questionHeadingRef}
              tabIndex={-1}
              id={`question-prompt-${currentQuestion.id}`}
              className={`flex-1 font-semibold leading-relaxed text-neutral-900 [.high-contrast_&]:!text-white outline-none
                ${largeInteractionMode ? "text-3xl" : isVisuallyImpaired ? "text-2xl" : "text-xl"}`}
            >
              {currentQuestion.prompt}
            </CardTitle>

            {/* AI Toolbar — per-profile adaptive */}
            <div
              className="flex items-center gap-3 mt-6 text-sm text-neutral-500 [.high-contrast_&]:!text-white flex-wrap"
              role="toolbar"
              aria-label="Question accessibility tools"
            >
              {/* Speak button — always shown for VISUAL; hidden for HEARING (no audio benefit) */}
              {!isHearing && (
                <SpeakButton
                  text={currentQuestion.prompt}
                  size={largeInteractionMode ? "lg" : "sm"}
                  className="shrink-0"
                />
              )}

              {/* Explain Simply — shown for COGNITIVE, VISUAL, and simplified mode */}
              {(simplifiedMode || isVisuallyImpaired || isCognitive) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExplainSimply(currentQuestion)}
                  disabled={explainingId === currentQuestion.id}
                  aria-label="Get a simplified explanation of this question"
                  className="flex text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 font-medium rounded-xl gap-2
                    [.high-contrast_&]:!text-white [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white [.high-contrast_&]:!border"
                >
                  <Brain className="w-4 h-4" aria-hidden="true" />
                  {explainingId === currentQuestion.id ? "Working…" : "Explain Simply"}
                </Button>
              )}

              {/* MOTOR: Voice dictation button in toolbar for ALL question types */}
              {isMotor && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={isDictating ? stopDictation : startDictation}
                  aria-label={isDictating ? "Stop voice dictation" : "Dictate your answer by voice"}
                  aria-pressed={isDictating}
                  className={`flex items-center gap-2 rounded-xl border-2 transition-all
                    ${isDictating
                      ? "bg-red-50 text-red-600 border-red-300 [.high-contrast_&]:!text-red-400 [.high-contrast_&]:!border-red-400"
                      : "text-neutral-600 border-neutral-200 hover:border-neutral-400 [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white"}
                    ${largeInteractionMode ? "h-14 px-6 text-xl" : "h-10 px-4 text-sm"}`}
                >
                  <Mic className={`w-4 h-4 ${isDictating ? "animate-pulse" : ""}`} aria-hidden="true" />
                  {isDictating ? "Stop" : "Voice Answer"}
                </Button>
              )}

              {/* COGNITIVE: friendly reminder chip */}
              {isCognitive && (
                <span
                  aria-label="Take your time reminder"
                  className="ml-auto text-xs font-medium text-neutral-400 [.high-contrast_&]:!text-gray-400"
                >
                  Take your time — no rush.
                </span>
              )}
            </div>

            {/* Explanation result */}
            {simplifiedTexts[currentQuestion.id] && (
              <div
                role="note"
                aria-label="Simplified explanation"
                className="mt-6 p-5 bg-neutral-50 rounded-xl border border-neutral-200 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white"
              >
                <p className="text-base text-neutral-700 [.high-contrast_&]:!text-white leading-relaxed">
                  <span className="font-semibold text-neutral-900 [.high-contrast_&]:!text-white mr-2">Explanation:</span>
                  {simplifiedTexts[currentQuestion.id]}
                </p>
              </div>
            )}
          </CardHeader>

          {/* ── Answer area ── */}
          <CardContent className="pt-8 px-8 pb-2" role="main" aria-labelledby={`question-prompt-${currentQuestion.id}`}>

            {/* HEARING: visual-only confirmation banner */}
            {isHearing && answers[currentQuestion.id] && (
              <div
                role="status"
                aria-label="Answer recorded"
                className="mb-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-white text-sm font-medium [.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                Answer recorded
              </div>
            )}

            {currentQuestion.type === "MCQ" ? (
              <fieldset>
                <legend className="sr-only">
                  Choose your answer for: {currentQuestion.prompt}
                </legend>
                {/* MCQ layout: single-col for MOTOR/COGNITIVE (easier tap/read), 2-col for standard */}
                <div
                  className={`grid gap-4 ${largeInteractionMode || isMotor || isCognitive
                    ? "grid-cols-1"
                    : "grid-cols-1 sm:grid-cols-2"
                    }`}
                  role="radiogroup"
                  aria-label="Answer options"
                >
                  {Array.isArray(currentQuestion.options) && currentQuestion.options.map((option, idx) => {
                    const isSelected = answers[currentQuestion.id] === option;
                    const letter = String.fromCharCode(65 + idx);
                    return (
                      <button
                        key={idx}
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => handleOptionSelect(option)}
                        className={`relative w-full text-left py-5 px-5 rounded-xl border-2 transition-all duration-150
                          focus:outline-none focus:ring-4 focus:ring-offset-2
                          ${isSelected
                            ? `border-neutral-900 bg-neutral-50 ring-4 ring-neutral-900/20 focus:ring-neutral-900
                               [.high-contrast_&]:!border-white [.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black`
                            : `border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50/50 focus:ring-neutral-300
                               [.high-contrast_&]:!border-neutral-600 [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:hover:!border-white`}
                          ${largeInteractionMode ? "text-xl min-h-[100px]" : "text-base"} font-medium`}
                      >
                        <div className="flex items-center gap-4">
                          {/* Letter badge */}
                          <span
                            aria-hidden="true"
                            className={`flex-shrink-0 flex items-center justify-center rounded-lg font-bold
                              ${isSelected
                                ? "bg-neutral-900 text-white [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white"
                                : "bg-neutral-100 text-neutral-500 [.high-contrast_&]:!bg-neutral-800 [.high-contrast_&]:!text-white"}
                              ${largeInteractionMode ? "w-12 h-12 text-xl" : "w-9 h-9 text-sm"}`}
                          >
                            {letter}
                          </span>
                          <span className="flex-1 leading-snug">{option}</span>
                          {/* Visible checkmark for selected (helps VI users + screen readers) */}
                          {isSelected && (
                            <CheckCircle2
                              className={`shrink-0 text-neutral-900 [.high-contrast_&]:!text-black ${largeInteractionMode ? "w-7 h-7" : "w-5 h-5"}`}
                              aria-hidden="true"
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ) : currentQuestion.type === "DIAGRAM" ? (
              /* ── DIAGRAM: canvas + image upload + description ── */
              <DiagramAnswerInput
                questionId={currentQuestion.id}
                questionPrompt={currentQuestion.prompt}
                value={answers[currentQuestion.id] || ""}
                onChange={(val) =>
                  setAnswers((prev) => ({ ...prev, [currentQuestion.id]: val }))
                }
              />
            ) : (
              <div className="w-full space-y-4">
                <label htmlFor={`answer-${currentQuestion.id}`} className="sr-only">
                  Your answer for: {currentQuestion.prompt}
                </label>
                <textarea
                  id={`answer-${currentQuestion.id}`}
                  className={`w-full p-5 rounded-xl border-2 focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/20
                    transition-all resize-y outline-none
                    [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white
                    [.high-contrast_&]:focus:!ring-white/30
                    ${largeInteractionMode ? "text-xl min-h-[300px] leading-loose" : "text-base min-h-[200px]"}
                    ${isVisuallyImpaired ? "border-neutral-400 min-h-[260px] text-lg leading-relaxed" : "border-neutral-200"}`}
                  placeholder="Type your answer here…"
                  value={answers[currentQuestion.id] || ""}
                  onChange={handleTextChange}
                  spellCheck={!simplifiedMode}
                  aria-label={`Answer for question ${currentQuestionIndex + 1}`}
                  aria-required="false"
                  aria-describedby={simplifiedTexts[currentQuestion.id] ? `explanation-${currentQuestion.id}` : undefined}
                />

                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    onClick={isDictating ? stopDictation : startDictation}
                    variant="outline"
                    aria-label={isDictating ? "Stop voice dictation" : "Start voice dictation for your answer"}
                    aria-pressed={isDictating}
                    className={`flex items-center gap-2 rounded-xl border-2 transition-all
                      ${isDictating
                        ? "bg-red-50 text-red-600 border-red-300 hover:bg-red-100 [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-red-400 [.high-contrast_&]:!border-red-400"
                        : "text-neutral-600 hover:bg-neutral-50 border-neutral-200 [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white"}
                      ${largeInteractionMode ? "h-14 px-6 text-xl" : "h-11 px-4 text-sm"}
                      ${isVisuallyImpaired ? "h-12 px-5 text-base font-medium" : ""}`}
                  >
                    <Mic className={`w-4 h-4 ${isDictating ? "animate-pulse" : ""}`} aria-hidden="true" />
                    {isDictating ? "Stop Dictation" : "Dictate Answer"}
                  </Button>

                  {isDictating && (
                    <span
                      role="status"
                      className={`flex items-center gap-2 text-red-600 font-medium animate-pulse [.high-contrast_&]:!text-red-400 ${largeInteractionMode ? "text-lg" : "text-sm"}`}
                    >
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500 [.high-contrast_&]:!bg-red-400" aria-hidden="true" />
                      Recording…
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>

          {/* ── Navigation Footer ── */}
          <CardFooter
            className="border-t border-neutral-100 pt-6 px-8 pb-8 flex justify-between items-center [.high-contrast_&]:!border-neutral-700"
            role="navigation"
            aria-label="Question navigation"
          >
            <Button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0 || isSubmitting}
              variant="outline"
              aria-label={`Go to previous question: question ${currentQuestionIndex}`}
              className={`font-medium rounded-xl border-2 border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900
                [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white [.high-contrast_&]:!text-white
                focus:outline-none focus:ring-4 focus:ring-neutral-900/30 [.high-contrast_&]:focus:!ring-white/40
                disabled:opacity-40
                ${largeInteractionMode ? "h-14 px-8 text-lg" : isVisuallyImpaired ? "h-12 px-6 text-base" : "h-12 px-6"}`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Previous
            </Button>

            {/* Answered dots — visual progress indicator (hidden in simplified mode) */}
            {!simplifiedMode && (
              <div className="hidden sm:flex items-center gap-1.5" role="list" aria-label="Question progress">
                {questions.map((q, i) => (
                  <div
                    key={q.id}
                    role="listitem"
                    aria-label={`Question ${i + 1}: ${answers[q.id] ? "answered" : "not answered"}${i === currentQuestionIndex ? ", current" : ""}`}
                    className={`rounded-full transition-all
                      ${i === currentQuestionIndex
                        ? "w-5 h-3 bg-neutral-900 [.high-contrast_&]:!bg-white"
                        : answers[q.id]
                          ? "w-3 h-3 bg-neutral-400 [.high-contrast_&]:!bg-gray-400"
                          : "w-3 h-3 bg-neutral-200 [.high-contrast_&]:!bg-neutral-700"}`}
                  />
                ))}
              </div>
            )}

            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                aria-label="Submit your assessment"
                className={`font-medium rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white border-0
                  [.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black [.high-contrast_&]:!border-black
                  focus:outline-none focus:ring-4 focus:ring-neutral-900/30 [.high-contrast_&]:focus:!ring-black/40
                  ${largeInteractionMode ? "h-14 px-8 text-lg" : isVisuallyImpaired ? "h-12 px-6 text-base" : "h-12 px-6"}`}
              >
                {isSubmitting ? "Submitting…" : (
                  <>Submit Attempt <Send className="w-4 h-4 ml-2" aria-hidden="true" /></>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={isSubmitting}
                aria-label={`Go to next question: question ${currentQuestionIndex + 2}`}
                className={`font-medium rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white border-0
                  [.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black [.high-contrast_&]:!border-black
                  focus:outline-none focus:ring-4 focus:ring-neutral-900/30 [.high-contrast_&]:focus:!ring-black/40
                  ${largeInteractionMode ? "h-14 px-8 text-lg" : isVisuallyImpaired ? "h-12 px-6 text-base" : "h-12 px-6"}`}
              >
                Next <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};