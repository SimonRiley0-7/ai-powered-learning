import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getAvailableAssessments } from "@/app/actions/assessment"
import { prisma } from "@/lib/prisma"
import { CandidateDashboardContent } from "@/components/CandidateDashboardContent"

export default async function CandidateDashboard() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    // Check if onboarding is needed
    if (!session.user.name) {
        const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!dbUser?.name) {
            redirect("/onboarding");
        }
    }

    const availableAssessments = await getAvailableAssessments()
    const verification = await prisma.pWDVerification.findUnique({
        where: { userId: session.user.id }
    })

    return (
        <CandidateDashboardContent
            user={session.user}
            availableAssessments={availableAssessments}
            verification={verification}
        />
    )
}
