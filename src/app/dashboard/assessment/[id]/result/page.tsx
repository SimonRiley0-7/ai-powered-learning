import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AssessmentResultPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const { id } = await params;
    const attemptId = id;

    const attempt = await prisma.attempt.findUnique({
        where: { id: attemptId },
        include: {
            assessment: true,
            answers: {
                include: {
                    question: true
                }
            }
        }
    });

    if (!attempt) {
        return <div className="p-8 text-center mt-20">Result not found.</div>;
    }

    // Security Check: Only the attempt owner or admin/instructor can view
    if (attempt.userId !== session.user.id && session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN") {
        return <div className="p-8 text-center text-red-500 mt-20">Unauthorized access to this result.</div>;
    }

    const maxPoints = attempt.answers.reduce((acc: number, ans: { question: { points: number } }) => acc + (ans.question?.points || 1), 0);
    const scorePercentage = maxPoints > 0 ? ((attempt.totalScore || 0) / maxPoints) * 100 : 0;

    // Time metrics
    const startTime = new Date(attempt.startedAt).getTime();
    const endTime = attempt.submittedAt ? new Date(attempt.submittedAt).getTime() : new Date().getTime();
    const elapsedMinutes = Math.floor((endTime - startTime) / 60000);

    return (
        <div className="container mx-auto py-12 px-4 max-w-5xl">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 [.high-contrast_&]:!text-white">
                        {attempt.assessment.title} - Results
                    </h1>
                    <p className="text-slate-500 font-medium mt-1 [.high-contrast_&]:!text-white">
                        Completed on {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString() : "Unknown"} • Time Taken: {elapsedMinutes} mins
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-5xl font-black text-blue-600 [.high-contrast_&]:!text-white">
                        {attempt.totalScore} <span className="text-2xl text-slate-400">/ {maxPoints}</span>
                    </div>
                    <div className="text-sm font-bold text-slate-500 mt-1 [.high-contrast_&]:!text-white">
                        {scorePercentage.toFixed(1)}% Score
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {attempt.answers.map((answer: { id: string, aiScore: number | null, response: string, aiFeedback: string | null, question: { points: number, prompt: string, type: string, correctAnswer: string | null } }, index: number) => (
                    <Card key={answer.id} className="border-slate-200/60 shadow-sm [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white">
                        <CardHeader className="pb-3 border-b border-slate-100/50 bg-slate-50/50 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white">
                            <div className="flex justify-between items-start">
                                <span className="font-semibold text-blue-600 [.high-contrast_&]:!text-white uppercase text-xs tracking-wider">
                                    Question {index + 1}
                                </span>
                                <span className="font-bold text-slate-700 [.high-contrast_&]:!text-white">
                                    {answer.aiScore} / {answer.question.points} Pts
                                </span>
                            </div>
                            <CardTitle className="text-xl font-bold text-slate-900 mt-2 [.high-contrast_&]:!text-white">
                                {answer.question.prompt}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div>
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1 [.high-contrast_&]:!text-white">Your Answer</h4>
                                <p className="text-lg font-medium text-slate-800 bg-slate-100 p-4 rounded-xl [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white border">
                                    {answer.response || <span className="text-slate-400 italic">No answer provided</span>}
                                </p>
                            </div>

                            {answer.question.type !== "MCQ" && answer.question.correctAnswer && (
                                <div>
                                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1 [.high-contrast_&]:!text-white">Expected Standard</h4>
                                    <p className="text-base text-slate-600 p-4 border border-slate-200 rounded-xl bg-white [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white">
                                        {answer.question.correctAnswer}
                                    </p>
                                </div>
                            )}

                            {answer.aiFeedback && (
                                <div className={`p-4 rounded-xl border-l-4 ${answer.aiScore === answer.question.points ? 'bg-green-50 border-green-500 text-green-900' : 'bg-amber-50 border-amber-500 text-amber-900'} [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white [.high-contrast_&]:!text-white border`}>
                                    <h4 className={`text-sm font-bold uppercase tracking-widest mb-1 ${answer.aiScore === answer.question.points ? 'text-green-700' : 'text-amber-700'} [.high-contrast_&]:!text-white`}>
                                        AI Evaluation Feedback
                                    </h4>
                                    <p className="font-medium text-base">
                                        {answer.aiFeedback}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="mt-10 mb-20 text-center">
                <Link href="/dashboard">
                    <Button size="lg" className="font-bold text-lg px-12 rounded-xl shadow-lg bg-slate-900 hover:bg-slate-800 text-white [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white [.high-contrast_&]:!text-white border">
                        Return to Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    );
}
