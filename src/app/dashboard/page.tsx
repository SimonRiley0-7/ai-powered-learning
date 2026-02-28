import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getAvailableAssessments } from "@/app/actions/assessment"
import { prisma } from "@/lib/prisma"
import { CandidateDashboardContent } from "@/components/CandidateDashboardContent"
import { Suspense } from "react"

export default async function CandidateDashboard() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, role: true }
    });

    if (!dbUser?.name) {
        redirect("/onboarding")
    }

    if (dbUser.role === "INSTRUCTOR") {
        redirect("/instructor/dashboard")
    }

    if (dbUser.role === "ADMIN") {
        redirect("/dashboard/supervisor")
    }

    const availableAssessments = await getAvailableAssessments()
    const verification = await prisma.pWDVerification.findUnique({
        where: { userId: session.user.id }
    })

    return (
        // Suspense is required for useSearchParams() to work in Next.js 15 App Router.
        // Without it, searchParams are null on the server render and the voice
        // auto-start useEffect in CandidateDashboardContent never fires.
        <Suspense fallback={null}>
            <CandidateDashboardContent
                user={session.user}
                availableAssessments={availableAssessments}
                verification={verification}
            />
        </Suspense>
    )
}

