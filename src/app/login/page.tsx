import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import Link from "next/link"
import { loginWithMagicLink } from "@/app/actions/auth"
import { LoginForm } from "@/components/auth/LoginForm"

export const metadata = {
    title: "Login – AI Assessment Platform",
    description: "Secure, passwordless login for the AI-Powered Accessible Assessment Platform.",
}

export default function LoginPage() {
    return (
        <>
            {/* Skip-to-content for keyboard / screen-reader users */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded focus:shadow focus:outline focus:outline-2 focus:outline-blue-500"
            >
                Skip to main content
            </a>

            <div className="relative flex min-h-screen items-center justify-center p-4 pb-36 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 [.high-contrast_&]:!bg-black [.high-contrast_&]:!bg-none">
                {/* Dynamic Background Elements - Hidden in High Contrast */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none [.high-contrast_&]:hidden">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-400/20 dark:bg-indigo-600/20 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
                    <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-purple-400/20 dark:bg-purple-600/20 blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
                    <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[40%] rounded-full bg-blue-400/20 dark:bg-blue-600/20 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
                </div>

                <main id="main-content" className="relative w-full max-w-md z-10" aria-label="Login">
                    <Card className="border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 overflow-hidden rounded-2xl [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white [.high-contrast_&]:!shadow-none [.high-contrast_&]:!backdrop-blur-none">
                        <CardHeader className="text-center pb-8 pt-8">
                            {/* Visible page heading – tabIndex={-1} so JS can programmatically focus here */}
                            <h1
                                className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white [.high-contrast_&]:!text-white"
                                tabIndex={-1}
                                id="login-heading"
                            >
                                Welcome Back
                            </h1>
                            <CardDescription id="login-description" className="text-base mt-2 [.high-contrast_&]:!text-white">
                                Secure, passwordless login to your assessment dashboard.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-8 pb-8">
                            {/* Client component handles error state + ARIA live regions */}
                            <LoginForm action={loginWithMagicLink} />

                            <div className="mt-8 text-center text-sm">
                                <span className="text-slate-500 dark:text-slate-400 mr-1 [.high-contrast_&]:!text-white">Don&apos;t have an account?</span>
                                <Link
                                    href="/register"
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-bold rounded focus:outline focus:outline-2 focus:outline-blue-500 focus:outline-offset-2 [.high-contrast_&]:!text-white"
                                >
                                    Register here
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </>
    )
}
