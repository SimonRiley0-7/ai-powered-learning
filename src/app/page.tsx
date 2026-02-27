// app/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { AccessibilitySelector } from "@/components/home/AccessibilitySelector";

export const metadata = {
  title: "AI-Powered Accessible Assessment Platform",
  description: "Comprehensive skill evaluation with inclusive accessibility features and adaptive assessment technology.",
};

export default function HomePage() {
  return (
    <>
      {/* Skip to main content for keyboard / screen-reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded focus:shadow focus:outline focus:outline-2 focus:outline-blue-500"
      >
        Skip to main content
      </a>

      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 pb-36 [.high-contrast_&]:!bg-black [.high-contrast_&]:!bg-none">
        {/* Dynamic Background Elements - Hidden in High Contrast */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none [.high-contrast_&]:hidden">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-400/20 dark:bg-indigo-600/20 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-purple-400/20 dark:bg-purple-600/20 blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
          <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[40%] rounded-full bg-blue-400/20 dark:bg-blue-600/20 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
        </div>

        <div className="container relative z-10 mx-auto py-16 px-4">
          {/* ── Hero ─────────────────────────────────────────── */}
          <header className="text-center mb-16 animate-in slide-in-from-top-4 duration-700">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 drop-shadow-sm [.high-contrast_&]:!text-white">
              AI-Powered Assessment Platform
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-10 font-medium [.high-contrast_&]:!text-white">
              Comprehensive skill evaluation with inclusive accessibility features and adaptive assessment technology
            </p>
            <div className="flex justify-center">
              <AccessibilitySelector />
            </div>
          </header>

          {/* ── Main content ─────────────────────────────────── */}
          <main id="main-content" className="relative z-10">
            {/* Feature cards */}
            <section aria-labelledby="features-heading">
              <h2 id="features-heading" className="sr-only">Platform Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 animate-in fade-in zoom-in-95 duration-700 delay-150 fill-mode-both">
                <Card className="border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white [.high-contrast_&]:!shadow-none [.high-contrast_&]:!backdrop-blur-none">
                  <CardHeader>
                    <h3 className="font-semibold text-lg">Comprehensive Assessment</h3>
                    <CardDescription>Multiple formats to evaluate diverse skill sets</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>MCQs, descriptive questions, practical exams</li>
                      <li>Vocational and technical skill evaluation</li>
                      <li>Customizable assessment templates</li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Link href="/assessments" className="w-full" aria-label="View available assessments">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold border-0 shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] rounded-xl" aria-label="View Assessments">View Assessments</Button>
                    </Link>
                  </CardFooter>
                </Card>

                <Card className="border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white [.high-contrast_&]:!shadow-none [.high-contrast_&]:!backdrop-blur-none">
                  <CardHeader>
                    <h3 className="font-semibold text-lg">Inclusive Accessibility</h3>
                    <CardDescription>Features designed for all candidates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Screen reader compatibility</li>
                      <li>Text-to-speech &amp; voice-to-text</li>
                      <li>High contrast mode and keyboard navigation</li>
                      <li>Extended time accommodations</li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Link href="/accessibility" className="w-full" aria-label="Learn about accessibility features">
                      <Button variant="outline" className="w-full font-bold border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 rounded-xl [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white">Accessibility Features</Button>
                    </Link>
                  </CardFooter>
                </Card>

                <Card className="border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white [.high-contrast_&]:!shadow-none [.high-contrast_&]:!backdrop-blur-none">
                  <CardHeader>
                    <h3 className="font-semibold text-lg">AI-Driven Analytics</h3>
                    <CardDescription>Detailed insights and personalized feedback</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Performance analytics across skills</li>
                      <li>Adaptive learning recommendations</li>
                      <li>Gemini-powered response evaluation</li>
                      <li>Detailed feedback on each response</li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Link href="/analytics" className="w-full" aria-label="View analytics dashboard">
                      <Button variant="outline" className="w-full font-bold border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 rounded-xl [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white">View Analytics</Button>
                    </Link>
                  </CardFooter>
                </Card>
              </div>
            </section>

            {/* Demo CTA */}
            <section
              aria-labelledby="demo-heading"
              className="rounded-3xl p-10 mb-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl bg-gradient-to-br from-white/90 to-blue-50/90 dark:from-slate-900/90 dark:to-indigo-950/90 border border-white/50 dark:border-white/10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both [.high-contrast_&]:!bg-black [.high-contrast_&]:!bg-none [.high-contrast_&]:!border-white [.high-contrast_&]:!shadow-none [.high-contrast_&]:!backdrop-blur-none"
            >
              <div className="text-center mb-8">
                <h2 id="demo-heading" className="text-3xl font-extrabold mb-3 text-slate-900 dark:text-white [.high-contrast_&]:!text-white">Demo Assessment</h2>
                <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto [.high-contrast_&]:!text-white">
                  Try our demo assessment to experience the platform features
                </p>
              </div>
              <div className="text-center flex justify-center">
                <Link href="/assessments/demo" aria-label="Start the demo assessment">
                  <Button size="lg" className="h-14 px-8 text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:scale-[1.02] transition-all rounded-xl">Start Demo Assessment</Button>
                </Link>
              </div>
            </section>

            {/* ── Login portals ─────────────────────────────── */}
            <section aria-labelledby="portals-heading" className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 fill-mode-both">
              <h2 id="portals-heading" className="text-3xl font-extrabold mb-8 text-center text-slate-900 dark:text-white [.high-contrast_&]:!text-white">
                Sign In
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Candidate portal */}
                <Card className="border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white [.high-contrast_&]:!shadow-none [.high-contrast_&]:!backdrop-blur-none">
                  <CardHeader>
                    <h3 className="font-semibold text-lg">For Candidates</h3>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Take assessments in online, offline, or blended modes</li>
                      <li>Receive personalized feedback and improvement plans</li>
                      <li>Access accommodations for different abilities</li>
                      <li>Track your progress across multiple skill areas</li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {/*
                    aria-label="Candidate login" — gives VoiceOver a crisp, unique label.
                    It will announce: "Candidate login, link" / "Candidate login, button"
                    which also matches our voice command "candidate login" → NAVIGATE /login
                  */}
                    <Link
                      href="/login"
                      className="w-full focus:outline focus:outline-2 focus:outline-blue-500 rounded"
                      aria-label="Candidate login — sign in as a candidate"
                    >
                      <Button
                        variant="outline"
                        className="w-full font-bold border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 rounded-xl h-12 [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white"
                        aria-label="Candidate login"
                      >
                        Candidate Login
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>

                {/* Institution portal */}
                <Card className="border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white [.high-contrast_&]:!shadow-none [.high-contrast_&]:!backdrop-blur-none">
                  <CardHeader>
                    <h3 className="font-semibold text-lg">For Institutions</h3>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Create customized assessment programs</li>
                      <li>Monitor candidate performance with detailed analytics</li>
                      <li>Ensure standardized evaluation across locations</li>
                      <li>Support candidates with diverse needs and abilities</li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Link
                      href="/login"
                      className="w-full focus:outline focus:outline-2 focus:outline-blue-500 rounded"
                      aria-label="Institution login — sign in as an institution or instructor"
                    >
                      <Button
                        variant="outline"
                        className="w-full font-bold border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 rounded-xl h-12 [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white"
                        aria-label="Institution login"
                      >
                        Institution Login
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}