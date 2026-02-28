import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function InstructorDashboard() {
    const session = await auth()

    if (!session?.user) {
        redirect("/dashboard")
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, role: true }
    });

    if (dbUser?.role !== "INSTRUCTOR" && dbUser?.role !== "ADMIN") {
        redirect("/dashboard")
    }

    // Check if onboarding is needed
    if (!dbUser?.name) {
        redirect("/onboarding");
    }

    const studentResults = await prisma.result.findMany({
        include: {
            user: { select: { name: true, email: true } },
            assessment: { select: { title: true } }
        },
        orderBy: { completedAt: "desc" }
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Instructor Panel</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your assessments and review candidate scores across all tests.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" className="rounded-xl border-neutral-300">
                        Create Assessment
                    </Button>
                </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white">
                {studentResults.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        No candidate results found yet.
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-neutral-50/50 border-b border-neutral-200 [.high-contrast_&]:!bg-zinc-900 [.high-contrast_&]:!border-white">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-neutral-600 [.high-contrast_&]:!text-white">Candidate</th>
                                <th className="px-6 py-4 font-semibold text-neutral-600 [.high-contrast_&]:!text-white">Assessment</th>
                                <th className="px-6 py-4 font-semibold text-neutral-600 [.high-contrast_&]:!text-white">Score</th>
                                <th className="px-6 py-4 font-semibold text-neutral-600 [.high-contrast_&]:!text-white">Status</th>
                                <th className="px-6 py-4 font-semibold text-neutral-600 [.high-contrast_&]:!text-white">Submitted</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 [.high-contrast_&]:!divide-zinc-800">
                            {studentResults.map((result) => (
                                <tr key={result.id} className="hover:bg-neutral-50/50 transition-colors [.high-contrast_&]:hover:!bg-zinc-900/50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-neutral-900 [.high-contrast_&]:!text-white">{result.user.name || "Unknown Candidate"}</div>
                                        <div className="text-xs text-neutral-500 [.high-contrast_&]:!text-gray-400">{result.user.email}</div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-neutral-700 [.high-contrast_&]:!text-gray-300">
                                        {result.assessment.title}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-neutral-900 [.high-contrast_&]:!text-white">{result.percentage.toFixed(1)}%</span>
                                            <span className="text-xs text-neutral-500">({result.totalScore} pts)</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={result.status === "PASSED" ? "default" : result.status === "FAILED" ? "destructive" : "secondary"}>
                                            {result.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-neutral-500 text-xs [.high-contrast_&]:!text-gray-400">
                                        {result.completedAt ? new Date(result.completedAt).toLocaleDateString() : "Pending"}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link href={`/dashboard/assessment/${result.assessmentId}/result`}>
                                            <Button size="sm" variant="outline" className="rounded-xl border-neutral-300">
                                                View Details
                                            </Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
