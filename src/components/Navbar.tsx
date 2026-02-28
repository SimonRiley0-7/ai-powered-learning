import { auth, signOut } from "@/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export async function Navbar() {
    const session = await auth()

    return (
        <nav
            className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur border-b border-neutral-100 supports-[backdrop-filter]:bg-white/80 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white"
            aria-label="Main navigation"
        >
            <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
                {/* Brand */}
                <Link
                    href="/"
                    className="font-semibold text-sm tracking-tight text-neutral-900 hover:opacity-70 transition-opacity focus:outline focus:outline-2 focus:outline-neutral-900 rounded [.high-contrast_&]:!text-white"
                    aria-label="AI Assessment Platform – go to homepage"
                >
                    AI Assessment
                </Link>

                {/* Right-side actions */}
                <div className="flex items-center gap-3">
                    {session?.user && (
                        <>
                            <span
                                className="hidden sm:block text-sm text-neutral-400 truncate max-w-[200px] [.high-contrast_&]:!text-gray-300"
                                aria-label={`Signed in as ${session.user.email ?? session.user.name}`}
                            >
                                {session.user.email ?? session.user.name}
                            </span>

                            <Link
                                href="/dashboard"
                                className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors focus:outline focus:outline-2 focus:outline-neutral-900 rounded px-1 [.high-contrast_&]:!text-white"
                                aria-label="Go to your dashboard"
                            >
                                Dashboard
                            </Link>

                            <Link
                                href="/courses"
                                className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors focus:outline focus:outline-2 focus:outline-neutral-900 rounded px-1 [.high-contrast_&]:!text-white"
                                aria-label="Browse courses"
                            >
                                Courses
                            </Link>

                            {(session.user.role === "ADMIN" || session.user.role === "INSTRUCTOR") && (
                                <Link
                                    href="/dashboard/supervisor"
                                    className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors focus:outline focus:outline-2 focus:outline-neutral-900 rounded px-1 [.high-contrast_&]:!text-white"
                                    aria-label="Open Supervisor Panel"
                                >
                                    Supervisor Panel
                                </Link>
                            )}

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
                                    className="rounded-lg border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 focus:outline focus:outline-2 focus:outline-neutral-900 [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white"
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
