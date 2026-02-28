import Link from "next/link"
import { LoginForm } from "@/components/auth/LoginForm"
import { ShieldCheck } from "lucide-react"

export const metadata = {
    title: "Sign In – AI Assessment Platform",
    description: "Secure, passwordless sign-in for the AI-Powered Accessible Assessment Platform.",
}

export default function LoginPage() {
    return (
        <>
            {/* Skip-to-content */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-neutral-900 focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:shadow focus:outline-none"
            >
                Skip to main content
            </a>

            <div className="min-h-screen bg-neutral-50 flex [.high-contrast_&]:!bg-black">
                {/* ── Left Panel — Branding ── */}
                <div className="hidden lg:flex flex-col justify-between w-[44%] bg-neutral-900 p-12 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-r [.high-contrast_&]:!border-white">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="text-white font-semibold text-sm tracking-tight hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-white rounded"
                    >
                        AI Assessment
                    </Link>

                    {/* Center copy */}
                    <div className="space-y-6">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-semibold tracking-tight text-white leading-snug">
                                Built for every learner.<br />No exceptions.
                            </h2>
                            <p className="mt-4 text-neutral-400 text-base leading-relaxed">
                                An accessibility-first assessment platform designed to adapt to your cognitive, visual, motor, and hearing needs.
                            </p>
                        </div>

                        {/* Trust badges */}
                        <ul className="space-y-3 text-sm text-neutral-400">
                            {[
                                "Passwordless — no credentials to forget",
                                "WCAG 2.1 AA compliant",
                                "Voice navigation available",
                                "PwD accommodations built-in",
                            ].map((item) => (
                                <li key={item} className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Footer */}
                    <p className="text-xs text-neutral-600">
                        © {new Date().getFullYear()} AI Assessment Platform
                    </p>
                </div>

                {/* ── Right Panel — Form ── */}
                <div className="flex-1 flex items-center justify-center px-6 py-16">
                    <main
                        id="main-content"
                        className="w-full max-w-sm"
                        aria-label="Sign in"
                    >
                        {/* Mobile brand */}
                        <Link
                            href="/"
                            className="lg:hidden block mb-8 text-sm font-semibold text-neutral-900 hover:opacity-70 transition-opacity [.high-contrast_&]:!text-white"
                        >
                            AI Assessment
                        </Link>

                        {/* Heading */}
                        <div className="mb-8">
                            <h1
                                className="text-2xl font-semibold tracking-tight text-neutral-900 [.high-contrast_&]:!text-white"
                                tabIndex={-1}
                                id="login-heading"
                            >
                                Sign in
                            </h1>
                            <p className="mt-1.5 text-sm text-neutral-500 [.high-contrast_&]:!text-gray-300">
                                Enter your email — we&apos;ll send you a one-time code.
                            </p>
                        </div>

                        {/* Form */}
                        <LoginForm />

                        {/* Register link */}
                        <p className="mt-8 text-sm text-center text-neutral-500 [.high-contrast_&]:!text-gray-400">
                            No account yet?{" "}
                            <Link
                                href="/register"
                                className="font-semibold text-neutral-900 hover:underline underline-offset-4 transition-all focus:outline-none focus:ring-2 focus:ring-neutral-900 rounded [.high-contrast_&]:!text-white"
                            >
                                Register here
                            </Link>
                        </p>
                    </main>
                </div>
            </div>
        </>
    )
}
