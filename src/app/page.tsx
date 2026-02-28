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
import { BookOpen, Ear, BarChart3, ArrowRight } from "lucide-react";

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

      <div className="relative min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-36 [.high-contrast_&]:!bg-black [.high-contrast_&]:!bg-none font-sans">
        <div className="container relative z-10 mx-auto py-20 px-8">
          {/* ── Hero ─────────────────────────────────────────── */}
          <header className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-neutral-900 dark:text-white mb-6 [.high-contrast_&]:!text-white">
              AI-Powered Assessment Platform
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-12 [.high-contrast_&]:!text-white">
              Comprehensive skill evaluation with inclusive accessibility features and adaptive assessment technology.
            </p>
            <div className="flex justify-center">
              <AccessibilitySelector />
            </div>
          </header>

          {/* ── Main content ─────────────────────────────────── */}
          <main id="main-content" className="relative z-10">
            {/* Feature cards */}
            <section aria-labelledby="features-heading" className="mb-24">
              <h2 id="features-heading" className="sr-only">Platform Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">

                <Card className="border border-neutral-200 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl bg-white dark:bg-neutral-900/50 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white">
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 mb-4 dark:bg-neutral-800 dark:text-neutral-300 [.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white [.high-contrast_&]:!text-white">Comprehensive Assessment</h3>
                    <CardDescription className="text-base text-neutral-500">Multiple formats to evaluate diverse skill sets</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-6">
                    <ul className="space-y-3 text-neutral-600 dark:text-neutral-400 [.high-contrast_&]:!text-gray-300">
                      <li className="flex gap-2"><span aria-hidden="true">•</span> MCQs, descriptive questions, practical exams</li>
                      <li className="flex gap-2"><span aria-hidden="true">•</span> Vocational and technical skill evaluation</li>
                      <li className="flex gap-2"><span aria-hidden="true">•</span> Customizable assessment templates</li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Link href="/assessments" className="w-full group" aria-label="View available assessments">
                      <Button variant="outline" className="w-full justify-between rounded-xl h-12 border-neutral-200 text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:text-white dark:hover:bg-neutral-800 [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white transition-colors">
                        View Assessments
                        <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>

                <Card className="border border-neutral-200 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl bg-white dark:bg-neutral-900/50 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white">
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 mb-4 dark:bg-neutral-800 dark:text-neutral-300 [.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black">
                      <Ear className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white [.high-contrast_&]:!text-white">Inclusive Accessibility</h3>
                    <CardDescription className="text-base text-neutral-500">Features designed for all candidates</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-6">
                    <ul className="space-y-3 text-neutral-600 dark:text-neutral-400 [.high-contrast_&]:!text-gray-300">
                      <li className="flex gap-2"><span aria-hidden="true">•</span> Screen reader compatibility</li>
                      <li className="flex gap-2"><span aria-hidden="true">•</span> Text-to-speech & voice-to-text</li>
                      <li className="flex gap-2"><span aria-hidden="true">•</span> High contrast mode and keyboard priority</li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Link href="/accessibility" className="w-full group" aria-label="Learn about accessibility features">
                      <Button variant="outline" className="w-full justify-between rounded-xl h-12 border-neutral-200 text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:text-white dark:hover:bg-neutral-800 [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white transition-colors">
                        Accessibility Features
                        <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>

                <Card className="border border-neutral-200 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl bg-white dark:bg-neutral-900/50 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white">
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 mb-4 dark:bg-neutral-800 dark:text-neutral-300 [.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white [.high-contrast_&]:!text-white">AI-Driven Analytics</h3>
                    <CardDescription className="text-base text-neutral-500">Detailed insights and personalized feedback</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-6">
                    <ul className="space-y-3 text-neutral-600 dark:text-neutral-400 [.high-contrast_&]:!text-gray-300">
                      <li className="flex gap-2"><span aria-hidden="true">•</span> Performance analytics across skills</li>
                      <li className="flex gap-2"><span aria-hidden="true">•</span> Adaptive learning recommendations</li>
                      <li className="flex gap-2"><span aria-hidden="true">•</span> Detailed feedback on each response</li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Link href="/analytics" className="w-full group" aria-label="View analytics dashboard">
                      <Button variant="outline" className="w-full justify-between rounded-xl h-12 border-neutral-200 text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:text-white dark:hover:bg-neutral-800 [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white transition-colors">
                        View Analytics
                        <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </div>
            </section>

            {/* Demo CTA
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
              {/*<div className="text-center flex justify-center">
                <Link href="/assessments/demo" aria-label="Start the demo assessment">
                  <Button size="lg" className="h-14 px-8 text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:scale-[1.02] transition-all rounded-xl">Start Demo Assessment</Button>
                </Link>
              </div>
            </section>*/}

            {/* ── Login portals ─────────────────────────────── */}
            {/* ── Login portals ─────────────────────────────── */}
            <section aria-labelledby="portals-heading" className="max-w-4xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
              <h2 id="portals-heading" className="text-2xl font-semibold mb-8 text-center text-neutral-900 dark:text-white [.high-contrast_&]:!text-white">
                Sign In
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Candidate portal */}
                <Card className="border border-neutral-200 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl bg-white dark:bg-neutral-900/50 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white">
                  <CardHeader>
                    <h3 className="font-semibold text-xl text-neutral-900 dark:text-white [.high-contrast_&]:!text-white">For Candidates</h3>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-neutral-600 dark:text-neutral-400 [.high-contrast_&]:!text-gray-300">
                      <li className="flex gap-2"><span aria-hidden="true">•</span> Take assessments with accessibility aids</li>
                      <li className="flex gap-2"><span aria-hidden="true">•</span> Receive personalized feedback</li>
                      <li className="flex gap-2"><span aria-hidden="true">•</span> Track your progress</li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Link
                      href="/login"
                      className="w-full"
                      aria-label="Candidate login — sign in as a candidate"
                    >
                      <Button
                        className="w-full font-medium rounded-xl h-12 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 [.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black transition-colors"
                        aria-label="Candidate login"
                      >
                        Candidate Login
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>

                {/* Institution portal */}
                <Card className="border border-neutral-200 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl bg-white dark:bg-neutral-900/50 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white">
                  <CardHeader>
                    <h3 className="font-semibold text-xl text-neutral-900 dark:text-white [.high-contrast_&]:!text-white">For Institutions</h3>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-neutral-600 dark:text-neutral-400 [.high-contrast_&]:!text-gray-300">
                      <li className="flex gap-2"><span aria-hidden="true">•</span> Create accessible assessment programs</li>
                      <li className="flex gap-2"><span aria-hidden="true">•</span> Monitor candidate analytics</li>
                      <li className="flex gap-2"><span aria-hidden="true">•</span> Standardize evaluation</li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Link
                      href="/login"
                      className="w-full"
                      aria-label="Institution login — sign in as an institution or instructor"
                    >
                      <Button
                        variant="outline"
                        className="w-full font-medium rounded-xl h-12 border-neutral-200 text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:text-white dark:hover:bg-neutral-800 [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white transition-colors"
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