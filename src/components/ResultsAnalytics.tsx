// components/ResultsAnalytics.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateProficiencyLevel, generatePersonalizedFeedback } from "@/lib/utils";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut, Radar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement
);

interface Answer {
  questionId: string;
  userAnswer: string;
  score: number;
  feedback?: string;
  detailedAnalysis?: string;
}

interface Question {
  id: string;
  text: string;
  type: string;
  difficulty: string;
  points: number;
}

interface ResultsAnalyticsProps {
  answers: Answer[];
  questions: Question[];
  assessmentTitle: string;
  subject: string;
  totalPoints: number;
  passingScore: number;
}

const ResultsAnalytics: React.FC<ResultsAnalyticsProps> = ({
  answers,
  questions,
  assessmentTitle,
  subject,
  totalPoints,
  passingScore,
}) => {
  // Calculate overall score
  const totalScore = answers.reduce((acc, answer) => acc + answer.score, 0);
  const percentageScore = Math.round((totalScore / totalPoints) * 100);
  const passed = percentageScore >= passingScore;
  
  // Proficiency level
  const proficiencyLevel = calculateProficiencyLevel(percentageScore);
  
  // Analyze strengths and weaknesses
  const questionMap = new Map(questions.map(q => [q.id, q]));
  const strengthsMap = new Map<string, number>();
  const weaknessesMap = new Map<string, number>();
  
  answers.forEach(answer => {
    const question = questionMap.get(answer.questionId);
    if (!question) return;
    
    const percentageCorrect = (answer.score / question.points) * 100;
    
    if (percentageCorrect >= 70) {
      strengthsMap.set(question.type, (strengthsMap.get(question.type) || 0) + 1);
    } else {
      weaknessesMap.set(question.type, (weaknessesMap.get(question.type) || 0) + 1);
    }
  });
  
  const strengths = Array.from(strengthsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([type]) => type);
    
  const weaknesses = Array.from(weaknessesMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([type]) => type);
  
  // Personalized feedback
  const feedback = generatePersonalizedFeedback(
    percentageScore,
    subject,
    strengths,
    weaknesses
  );
  
  // Performance by question type
  const performanceByType = new Map<string, { total: number; scored: number }>();
  
  answers.forEach(answer => {
    const question = questionMap.get(answer.questionId);
    if (!question) return;
    
    const current = performanceByType.get(question.type) || { total: 0, scored: 0 };
    current.total += question.points;
    current.scored += answer.score;
    performanceByType.set(question.type, current);
  });
  
  // Performance by difficulty
  const performanceByDifficulty = new Map<string, { total: number; scored: number }>();
  
  answers.forEach(answer => {
    const question = questionMap.get(answer.questionId);
    if (!question) return;
    
    const current = performanceByDifficulty.get(question.difficulty) || { total: 0, scored: 0 };
    current.total += question.points;
    current.scored += answer.score;
    performanceByDifficulty.set(question.difficulty, current);
  });
  
  // Prepare chart data
  const typeLabels = Array.from(performanceByType.keys());
  const typePercentages = typeLabels.map(type => {
    const { total, scored } = performanceByType.get(type) || { total: 0, scored: 0 };
    return Math.round((scored / total) * 100);
  });
  
  const difficultyLabels = Array.from(performanceByDifficulty.keys());
  const difficultyPercentages = difficultyLabels.map(difficulty => {
    const { total, scored } = performanceByDifficulty.get(difficulty) || { total: 0, scored: 0 };
    return Math.round((scored / total) * 100);
  });
  
  // Bar chart data for question types
  const barData = {
    labels: typeLabels,
    datasets: [
      {
        label: 'Performance by Question Type (%)',
        data: typePercentages,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  // Doughnut chart for overall score
  const doughnutData = {
    labels: ['Correct', 'Incorrect'],
    datasets: [
      {
        data: [percentageScore, 100 - percentageScore],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Radar chart for performance by difficulty
  const radarData = {
    labels: difficultyLabels,
    datasets: [
      {
        label: 'Performance by Difficulty (%)',
        data: difficultyPercentages,
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assessment Results: {assessmentTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="text-center p-4 rounded-lg border bg-card">
                <div className="text-2xl font-bold mb-2">{percentageScore}%</div>
                <div className="text-lg">{passed ? "PASSED" : "FAILED"}</div>
                <div className="text-sm text-gray-500">Passing score: {passingScore}%</div>
              </div>
              
              <div className="p-4 rounded-lg border bg-card">
                <h3 className="font-medium mb-2">Proficiency Level</h3>
                <div className="text-xl font-bold">{proficiencyLevel}</div>
              </div>
              
              <div className="p-4 rounded-lg border bg-card">
                <h3 className="font-medium mb-2">Personalized Feedback</h3>
                <p>{feedback}</p>
              </div>
            </div>
            
            <div className="flex justify-center items-center">
              <div style={{ width: '100%', height: '200px' }}>
                <Doughnut 
                  data={doughnutData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    }
                  }} 
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance by Question Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: '250px' }}>
              <Bar 
                data={barData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                    }
                  }
                }} 
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Performance by Difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: '250px' }}>
              <Radar 
                data={radarData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  scales: {
                    r: {
                      beginAtZero: true,
                      max: 100,
                    }
                  }
                }} 
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Detailed Question Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {answers.map((answer, index) => {
              const question = questionMap.get(answer.questionId);
              if (!question) return null;
              
              const percentageCorrect = Math.round((answer.score / question.points) * 100);
              const colorClass = percentageCorrect >= 70 ? "text-green-600" : 
                               percentageCorrect >= 40 ? "text-yellow-600" : "text-red-600";
              
              return (
                <div key={index} className="p-4 border rounded">
                  <div className="flex justify-between mb-2">
                    <div className="font-medium">Question {index + 1}</div>
                    <div className={`font-bold ${colorClass}`}>{percentageCorrect}%</div>
                  </div>
                  <div className="mb-2">{question.text}</div>
                  <div className="mb-2">
                    <span className="font-medium">Your Answer:</span> 
                    <span className="text-gray-700"> {answer.userAnswer || "(No answer provided)"}</span>
                  </div>
                  {answer.feedback && (
                    <div className="mb-2">
                      <span className="font-medium">Feedback:</span> 
                      <span className="text-gray-700"> {answer.feedback}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsAnalytics;