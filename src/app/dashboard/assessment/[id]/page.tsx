import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { submitAttempt } from "@/app/actions/assessment";
import AssessmentTakerWrapper from "@/components/AssessmentTakerWrapper";

export default async function TakeAssessmentPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const { id } = await params;
    const attemptId = id;

    // Fetch attempt with strict ownership security check
    const attempt = await prisma.attempt.findUnique({
        where: { id: attemptId, userId: session.user.id },
        include: {
            assessment: {
                include: {
                    questions: {
                        select: {
                            id: true,
                            type: true,
                            options: true,
                            prompt: true,
                            points: true,
                            difficulty: true
                        }
                    }
                }
            }
        }
    });

    if (!attempt) {
        return <div className="p-8 text-center text-red-500 mt-20">Attempt not found or unauthorized.</div>;
    }

    if (attempt.submittedAt || attempt.gradingStatus !== "PENDING") {
        redirect(`/dashboard/assessment/${attemptId}/result`);
    }

    // STRICT SERVER-SIDE TIMER VALIDATION
    const durationMins = attempt.assessment.duration || 60;
    const extraTime = attempt.extraTimeMultiplier || 1.0;
    const totalAllowedSeconds = durationMins * 60 * extraTime;

    const startedAtTime = new Date(attempt.startedAt).getTime();
    const serverCurrentTime = Date.now();
    const elapsedSeconds = Math.floor((serverCurrentTime - startedAtTime) / 1000);
    const initialTimeRemaining = Math.max(0, totalAllowedSeconds - elapsedSeconds);

    // Auto-submit securely on the server if time expired
    if (initialTimeRemaining <= 0) {
        if (!attempt.submittedAt && attempt.gradingStatus === "PENDING") {
            await submitAttempt(attemptId, {});
        }
        redirect(`/dashboard/assessment/${attemptId}/result`);
    }

    const settings = await prisma.accessibilitySettings.findUnique({
        where: { userId: session.user.id }
    });

    return (
        <div className="container mx-auto py-12 px-4">
            <AssessmentTakerWrapper
                attempt={attempt}
                settings={settings || {}}
                serverInitialTimeRemaining={initialTimeRemaining}
            />
        </div>
    );
}
