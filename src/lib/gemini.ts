// lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API client
export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Function to evaluate answers using Gemini
export async function evaluateAnswer(
  question: string,
  correctAnswer: string,
  userAnswer: string
): Promise<{
  score: number;
  feedback: string;
  detailedAnalysis: string;
}> {
  try {
    // Updated to use Gemini 2.0 Flash model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `
    Task: Evaluate a student's answer to an assessment question.
    
    Question: ${question}
    
    Correct Answer: ${correctAnswer}
    
    Student's Answer: ${userAnswer}
    
    Please evaluate the student's answer and provide:
    1. A score from 0 to 100 based on correctness and completeness
    2. Brief feedback (1-2 sentences)
    3. A detailed analysis of strengths and areas for improvement
    
    Format your response as JSON with the following structure:
    {
      "score": [score as number],
      "feedback": "[brief feedback]",
      "detailedAnalysis": "[detailed analysis]"
    }
    `;

    const result = await model.generateContent(prompt);
    const textResult = result.response.text();
    
    // Extract JSON from the response
    const jsonMatch = textResult.match(/```json\n([\s\S]*?)\n```/) || 
                      textResult.match(/{[\s\S]*?}/);
                      
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
    
    // Fallback parsing if JSON isn't properly formatted
    return {
      score: extractScore(textResult),
      feedback: extractFeedback(textResult),
      detailedAnalysis: extractAnalysis(textResult)
    };
  } catch (error) {
    console.error("Error evaluating answer:", error);
    return {
      score: 0,
      feedback: "An error occurred during evaluation. Please try again.",
      detailedAnalysis: "The system encountered an error while processing your answer."
    };
  }
}

// Helper functions for fallback parsing
function extractScore(text: string): number {
  const scoreMatch = text.match(/score[:\s]+(\d+)/i);
  return scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
}

function extractFeedback(text: string): string {
  const feedbackMatch = text.match(/feedback[:\s]+(.*?)(?=detailed|$)/is);
  return feedbackMatch ? feedbackMatch[1].trim() : "No feedback available.";
}

function extractAnalysis(text: string): string {
  const analysisMatch = text.match(/detailed[^:]*:[^\n]+([\s\S]*?)(?=\}|$)/i);
  return analysisMatch ? analysisMatch[1].trim() : "No detailed analysis available.";
}

// Function for adaptive question selection based on performance
export async function getAdaptiveQuestion(
  subject: string,
  difficulty: 'easy' | 'medium' | 'hard',
  previousPerformance: number
): Promise<{
  question: string;
  options?: string[];
  correctAnswer: string;
  type: 'mcq' | 'descriptive' | 'practical';
}> {
  try {
    // Updated to use Gemini 2.0 Flash model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    let recommendedDifficulty = difficulty;
    
    // Adjust difficulty based on previous performance
    if (previousPerformance > 85) {
      recommendedDifficulty = 'hard';
    } else if (previousPerformance > 60) {
      recommendedDifficulty = 'medium';
    } else {
      recommendedDifficulty = 'easy';
    }
    
    const prompt = `
    Generate a ${recommendedDifficulty} ${subject} question for assessment purposes.
    
    Create one of the following question types (randomly select):
    1. Multiple choice question with 4 options
    2. Descriptive question requiring a paragraph answer
    3. Practical application question
    
    Format your response as JSON with the following structure:
    {
      "question": "[question text]",
      "type": "[mcq or descriptive or practical]",
      "options": ["option1", "option2", "option3", "option4"] (only for MCQ),
      "correctAnswer": "[correct answer or solution]"
    }
    `;

    const result = await model.generateContent(prompt);
    const textResult = result.response.text();
    
    // Extract JSON from the response
    const jsonMatch = textResult.match(/```json\n([\s\S]*?)\n```/) || 
                      textResult.match(/{[\s\S]*?}/);
                      
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
    
    // Fallback with a default question
    return {
      question: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correctAnswer: "Paris",
      type: "mcq"
    };
  } catch (error) {
    console.error("Error generating adaptive question:", error);
    return {
      question: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correctAnswer: "Paris",
      type: "mcq"
    };
  }
}