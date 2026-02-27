import { auth, signOut } from "@/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export async function Navbar() {
    const session = await auth()

    return (
        <nav
            className="sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            aria-label="Main navigation"
        >
            <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
                {/* Brand */}
                <Link
                    href="/"
                    className="font-bold text-base tracking-tight hover:opacity-80 transition-opacity focus:outline focus:outline-2 focus:outline-blue-500 rounded"
                    aria-label="AI Assessment Platform – go to homepage"
                >
                    AI Assessment
                </Link>

                {/* Right-side actions */}
                <div className="flex items-center gap-3">
                    {session?.user && (
                        <>
                            {/* User identifier */}
                            <span
                                className="hidden sm:block text-sm text-muted-foreground truncate max-w-[200px]"
                                aria-label={`Signed in as ${session.user.email ?? session.user.name}`}
                            >
                                {session.user.email ?? session.user.name}
                            </span>

                            {(session.user.role === "ADMIN" || session.user.role === "INSTRUCTOR") && (
                                <Link
                                    href="/dashboard/supervisor"
                                    className="text-sm font-medium hover:text-blue-600 transition-colors focus:outline focus:outline-2 focus:outline-blue-500 rounded px-1"
                                    aria-label="Open Supervisor Panel"
                                >
                                    Supervisor Panel
                                </Link>
                            )}

                            {/* Logout — uses a form + server action so it works without JS */}
                            <form
                                action={async () => {
                                    "use server"
                                    await signOut({ redirectTo: "/login" })
                                }}
                            >
                                <Button
                                    type="submit"
                                    variant="outline"
                                    size="sm"
                                    className="focus:outline focus:outline-2 focus:outline-blue-500"
                                    aria-label="Sign out of your account"
                                >
                                    Sign Out
                                </Button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}
