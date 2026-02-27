import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getUserResults } from "@/app/actions/result"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function ResultsPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const results = await getUserResults()

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Your Results</h1>
                    <p className="text-muted-foreground mt-2">
                        View past assessment scores and analytics.
                    </p>
                </div>
                <Link href="/dashboard">
                    <Button variant="outline">Back to Dashboard</Button>
                </Link>
            </div>

            {results.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                        You haven&apos;t taken any assessments yet.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {results.map((result) => (
                        <Card key={result.id}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xl font-bold">{result.assessment.title}</CardTitle>
                                <Badge variant={result.status === "PASSED" ? "default" : "destructive"}>
                                    {result.status}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Subject</p>
                                        <p className="font-semibold">{result.assessment.subject}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Score</p>
                                        <p className="font-semibold">{result.totalScore} pts ({result.percentage.toFixed(1)}%)</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Passing Score</p>
                                        <p className="font-semibold">{result.assessment.passingScore}%</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Date Taken</p>
                                        <p className="font-semibold">{result.startedAt.toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
