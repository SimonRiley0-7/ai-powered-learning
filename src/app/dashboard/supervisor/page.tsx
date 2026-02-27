import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const DISABILITY_COLORS: Record<string, string> = {
    NONE: "secondary",
    VISUAL: "default",
    MOTOR: "default",
    HEARING: "default",
    COGNITIVE: "default",
    SPEECH: "default",
}

export const metadata = {
    title: "Supervisor Panel – AI Assessment Platform",
    description: "Configure accessibility accommodations for candidates before their assessment.",
}

export default async function SupervisorPanelPage() {
    const session = await auth()

    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "INSTRUCTOR")) {
        redirect("/dashboard")
    }

    const candidates = await prisma.user.findMany({
        where: { role: "CANDIDATE" },
        select: {
            id: true,
            name: true,
            email: true,
            disabilityType: true,
            accessibilitySettings: {
                select: {
                    lockedBySupervisor: true,
                    lockedAt: true,
                    extraTimeMultiplier: true,
                }
            }
        },
        orderBy: { name: "asc" },
    })

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Supervisor Panel</h1>
                <p className="text-muted-foreground mt-2">
                    Configure accessibility accommodations for candidates before their assessment.
                </p>
            </div>

            {candidates.length === 0 ? (
                <div className="rounded-xl border bg-muted/20 p-12 text-center">
                    <p className="text-muted-foreground">No candidates found.</p>
                </div>
            ) : (
                <div className="rounded-xl border overflow-hidden">
                    <table className="w-full text-sm" aria-label="Candidate list">
                        <thead className="bg-muted/40 border-b">
                            <tr>
                                <th className="text-left px-6 py-3 font-semibold">Candidate</th>
                                <th className="text-left px-6 py-3 font-semibold">Disability Profile</th>
                                <th className="text-left px-6 py-3 font-semibold">Status</th>
                                <th className="text-left px-6 py-3 font-semibold">Extra Time</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {candidates.map((c) => (
                                <tr key={c.id} className="hover:bg-muted/10 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-medium">{c.name ?? "—"}</p>
                                        <p className="text-muted-foreground text-xs">{c.email}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={DISABILITY_COLORS[c.disabilityType] as "default" | "secondary" | "destructive" | "outline"}>
                                            {c.disabilityType}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        {c.accessibilitySettings?.lockedBySupervisor ? (
                                            <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-full">
                                                🔒 Locked
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Unlocked</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {c.accessibilitySettings
                                            ? `${c.accessibilitySettings.extraTimeMultiplier}×`
                                            : "1.0×"}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link href={`/dashboard/supervisor/setup/${c.id}`}>
                                            <Button size="sm" variant="outline">Configure</Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
