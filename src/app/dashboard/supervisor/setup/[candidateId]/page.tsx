import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CandidateSetupForm } from "@/components/supervisor/CandidateSetupForm"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DisabilityType } from "@prisma/client"

export default async function CandidateSetupPage({
    params,
}: {
    params: Promise<{ candidateId: string }>
}) {
    const { candidateId } = await params
    const session = await auth()

    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "INSTRUCTOR")) {
        redirect("/dashboard")
    }

    const candidate = await prisma.user.findUnique({
        where: { id: candidateId, role: "CANDIDATE" },
        select: {
            id: true,
            name: true,
            email: true,
            disabilityType: true,
            accessibilitySettings: {
                select: {
                    lockedBySupervisor: true,
                    lockedAt: true,
                    highContrast: true,
                    textToSpeech: true,
                    speechToText: true,
                    voiceNavigationEnabled: true,
                    largeInteractionMode: true,
                    autoAdvanceQuestions: true,
                    extraTimeMultiplier: true,
                    simplifiedMode: true,
                }
            }
        }
    })

    if (!candidate) {
        redirect("/dashboard/supervisor")
    }

    return (
        <div className="p-8 max-w-3xl mx-auto space-y-8">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
                <Link href="/dashboard/supervisor" className="hover:underline focus:outline focus:outline-2 focus:outline-blue-500 rounded">
                    ← Back to Supervisor Panel
                </Link>
            </nav>

            {/* Candidate info */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configure Accommodations</h1>
                <p className="text-muted-foreground mt-1">
                    Setting up accessibility preferences for{" "}
                    <strong>{candidate.name ?? candidate.email}</strong>
                </p>
            </div>

            {/* Current status card */}
            {candidate.accessibilitySettings?.lockedBySupervisor && (
                <div
                    role="status"
                    className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-800"
                >
                    🔒 This candidate&apos;s accessibility settings are currently <strong>locked by a supervisor</strong>
                    {candidate.accessibilitySettings.lockedAt && (
                        <> (since {new Date(candidate.accessibilitySettings.lockedAt).toLocaleString()})</>
                    )}. Applying new settings will override the lock.
                </div>
            )}

            <Card>
                <CardHeader>
                    <h2 className="text-base font-semibold">Candidate Details</h2>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                    <p><span className="font-medium">Name:</span> {candidate.name ?? "—"}</p>
                    <p><span className="font-medium">Email:</span> {candidate.email}</p>
                    <p><span className="font-medium">Current disability profile:</span> {candidate.disabilityType}</p>
                    {candidate.accessibilitySettings && (
                        <p>
                            <span className="font-medium">Extra time multiplier:</span>{" "}
                            {candidate.accessibilitySettings.extraTimeMultiplier}×
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Setup form (client component) */}
            <CandidateSetupForm
                candidateId={candidate.id}
                candidateName={candidate.name ?? candidate.email}
                currentDisability={candidate.disabilityType as DisabilityType}
            />

            {/* Unlock button if currently locked */}
            {candidate.accessibilitySettings?.lockedBySupervisor && (
                <div className="border-t pt-6">
                    <p className="text-sm text-muted-foreground mb-3">
                        To unlock settings so the candidate can configure their own preferences, select &quot;NONE&quot; above and click <strong>Apply Without Lock</strong>.
                    </p>
                    <Link href="/dashboard/supervisor">
                        <Button variant="ghost" size="sm">Return to Supervisor Panel</Button>
                    </Link>
                </div>
            )}
        </div>
    )
}
