// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
}

export function calculateDuration(startTime: Date, endTime: Date): string {
  const durationMs = endTime.getTime() - startTime.getTime();
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  
  return `${minutes}m ${seconds}s`;
}

// Function to determine the most appropriate accessibility features
export function suggestAccessibilityFeatures(
  pwdRequirements: {
    isVisuallyImpaired?: boolean;
    isHearingImpaired?: boolean;
    isMotorImpaired?: boolean;
    isCognitiveImpaired?: boolean;
    requiresAssistiveTech?: boolean;
  } | null
): string[] {
  if (!pwdRequirements) return [];
  
  const features: string[] = [];
  
  if (pwdRequirements.isVisuallyImpaired) {
    features.push("SCREEN_READER", "TEXT_TO_SPEECH", "HIGH_CONTRAST", "LARGE_TEXT");
  }
  
  if (pwdRequirements.isHearingImpaired) {
    features.push("SIGN_LANGUAGE");
  }
  
  if (pwdRequirements.isMotorImpaired) {
    features.push("VOICE_TO_TEXT", "KEYBOARD_NAVIGATION");
  }
  
  if (pwdRequirements.isCognitiveImpaired) {
    features.push("EXTENDED_TIME", "TEXT_TO_SPEECH");
  }
  
  return [...new Set(features)]; // Remove duplicates
}

// Function to calculate proficiency level based on score
export function calculateProficiencyLevel(score: number): string {
  if (score >= 90) return "Expert";
  if (score >= 75) return "Advanced";
  if (score >= 60) return "Intermediate";
  if (score >= 40) return "Basic";
  return "Beginner";
}

// Function to generate personalized feedback based on score
export function generatePersonalizedFeedback(
  score: number, 
  subject: string,
  strengths: string[],
  weaknesses: string[]
): string {
  let feedback = "";
  
  if (score >= 90) {
    feedback = `Excellent work on your ${subject} assessment! You've demonstrated expert-level understanding.`;
  } else if (score >= 75) {
    feedback = `Great job on your ${subject} assessment! You've shown advanced proficiency with room for some improvement.`;
  } else if (score >= 60) {
    feedback = `Good effort on your ${subject} assessment. You've demonstrated intermediate knowledge with several areas to develop further.`;
  } else if (score >= 40) {
    feedback = `You've shown basic understanding of ${subject}. Focus on strengthening your knowledge in key areas.`;
  } else {
    feedback = `You're at the beginning of your ${subject} journey. With dedicated practice, you'll improve significantly.`;
  }
  
  if (strengths.length > 0) {
    feedback += ` Your strengths include: ${strengths.join(", ")}.`;
  }
  
  if (weaknesses.length > 0) {
    feedback += ` Areas to focus on: ${weaknesses.join(", ")}.`;
  }
  
  return feedback;
}