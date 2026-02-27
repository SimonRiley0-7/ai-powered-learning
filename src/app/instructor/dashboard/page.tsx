import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function InstructorDashboard() {
    const session = await auth()

    if (!session?.user || (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN")) {
        redirect("/dashboard")
    }

    // Check if onboarding is needed
    if (!session.user.name) {
        const { prisma } = await import("@/lib/prisma");
        const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!dbUser?.name) {
            redirect("/onboarding");
        }
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Instructor Panel</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your assessments and review candidate scores.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <h3 className="font-semibold leading-none tracking-tight mb-2">Create Assessment</h3>
                    <p className="text-sm text-muted-foreground">Draft and publish a new test with AI-generated questions.</p>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <h3 className="font-semibold leading-none tracking-tight mb-2">Active Sessions</h3>
                    <p className="text-sm text-muted-foreground">Monitor ongoing candidate assessments.</p>
                </div>
            </div>
        </div>
    )
}
