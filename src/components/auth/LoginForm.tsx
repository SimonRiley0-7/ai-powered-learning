"use client";

import { useRef, useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccessibility } from "@/context/AccessibilityContext";
import { cn } from "@/lib/utils";

interface LoginFormProps {
    // The server action to call on submit
    action: (formData: FormData) => Promise<void>;
}

type FormState = { error?: string } | null;

export function LoginForm({ action }: LoginFormProps) {
    const {
        largeInteractionMode,
        voiceGuidanceEnabled,
        disabilityType,
        aacEnabled,
        simplifiedMode
    } = useAccessibility();

    const [state, formAction, isPending] = useActionState<FormState, FormData>(
        async (_prev: FormState, formData: FormData) => {
            try {
                await action(formData);
                return null;
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
                if (voiceGuidanceEnabled) {
                    const utterance = new SpeechSynthesisUtterance(`Login error: ${message}`);
                    window.speechSynthesis.speak(utterance);
                }
                return { error: message };
            }
        },
        null
    );

    const errorRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const emailInputRef = useRef<HTMLInputElement>(null);

    // Profile Adaptation: Auto-focus email field on load for MOTOR
    useEffect(() => {
        if (disabilityType === "MOTOR" && emailInputRef.current) {
            emailInputRef.current.focus();
        }
    }, [disabilityType]);

    useEffect(() => {
        if (state?.error) errorRef.current?.focus();
    }, [state?.error]);


    const domainTiles = ["@gmail.com", "@outlook.com", "@yahoo.com"];

    return (
        <div className="space-y-6">
            {/* 8️⃣ ACCESSIBILITY BADGE */}
            {disabilityType !== "NONE" && (
                <div className="flex justify-center animate-in fade-in zoom-in-95 duration-500">
                    <div className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase border flex items-center gap-2 shadow-sm backdrop-blur-sm",
                        disabilityType === "MOTOR" && "bg-blue-100/80 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-300",
                        disabilityType === "VISUAL" && "bg-orange-100/80 border-orange-300 text-orange-700 dark:bg-orange-900/40 dark:border-orange-700 dark:text-orange-300",
                        disabilityType === "COGNITIVE" && "bg-purple-100/80 border-purple-300 text-purple-700 dark:bg-purple-900/40 dark:border-purple-700 dark:text-purple-300",
                        disabilityType === "HEARING" && "bg-green-100/80 border-green-300 text-green-700 dark:bg-green-900/40 dark:border-green-700 dark:text-green-300",
                        disabilityType === "SPEECH" && "bg-amber-100/80 border-amber-300 text-amber-700 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-300",
                    )}>
                        <span className="h-2 w-2 rounded-full animate-pulse bg-current" />
                        {disabilityType} MODE ACTIVE
                    </div>
                </div>
            )}

            <form
                ref={formRef}
                action={formAction}
                className={cn("space-y-6", simplifiedMode && "max-w-md mx-auto")}
                aria-label="Magic link login form"
                noValidate
            >
                <div
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                    ref={errorRef}
                    tabIndex={-1}
                    className="focus:outline-none"
                >
                    {state?.error && (
                        <div
                            role="alert"
                            className="rounded-md bg-destructive/10 border border-destructive text-destructive text-sm px-4 py-3"
                        >
                            <span className="sr-only">Error: </span>
                            {state.error}
                        </div>
                    )}
                </div>

                <div className="space-y-4 text-left">
                    <div className="space-y-2">
                        <Label
                            htmlFor="email"
                            className={cn(
                                "font-bold",
                                largeInteractionMode ? "text-xl" : "text-base"
                            )}
                        >
                            Email Address
                            <span className="text-destructive ml-1" aria-hidden="true">*</span>
                        </Label>

                        {/* 1️⃣ Standard Accessible Email Input */}
                        <Input
                            id="email"
                            ref={emailInputRef}
                            name="email"
                            type="email"
                            placeholder="name@example.com"
                            required
                            aria-required="true"
                            aria-describedby="email-hint"
                            autoComplete="email"
                            className={cn(
                                "focus:outline focus:outline-2 focus:outline-blue-500 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 shadow-inner rounded-xl transition-all hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 [.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white [.high-contrast_&]:placeholder:!text-white/70",
                                (largeInteractionMode || disabilityType === "MOTOR") ? "h-16 text-xl p-4" : "h-14 text-lg p-4"
                            )}
                        />

                        {!simplifiedMode && (
                            <p id="email-hint" className={largeInteractionMode ? "text-base text-muted-foreground" : "text-sm text-muted-foreground"}>
                                We&apos;ll send a magic link to this address.
                            </p>
                        )}
                    </div>

                    {/* 2️⃣ MOTOR PROFILE ADAPTATION: Domain Buttons */}
                    {(disabilityType === "MOTOR" || aacEnabled) && (
                        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top duration-300">
                            {domainTiles.map((domain) => (
                                <Button
                                    key={domain}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-10 px-4 font-bold border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all rounded-lg shadow-sm"
                                    onClick={() => {
                                        const input = document.getElementById("email") as HTMLInputElement;
                                        if (input) {
                                            if (input.value && !input.value.includes("@")) {
                                                input.value = input.value + domain;
                                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                            }
                                        }
                                    }}
                                >
                                    {domain}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 4️⃣ COGNITIVE PROFILE ADAPTATION: Explain Simply */}
                {disabilityType === "COGNITIVE" && (
                    <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                        <p className="text-sm font-medium text-purple-900 mb-3">
                            Click below if you need help understanding this form.
                        </p>
                        <Button
                            type="button"
                            variant="secondary"
                            className="bg-white hover:bg-purple-100 text-purple-700 font-bold border-2 border-purple-200"
                            size="sm"
                            onClick={() => {
                                const utterance = new SpeechSynthesisUtterance("This form asks for your email address. After you type it and click the button, we will send you a special link to your inbox. You just click that link to sign in. No password needed.");
                                window.speechSynthesis.cancel();
                                window.speechSynthesis.speak(utterance);
                            }}
                        >
                            💡 Explain Simply
                        </Button>
                    </div>
                )}

                <Button
                    type="submit"
                    className={cn(
                        "w-full font-bold focus:outline focus:outline-2 focus:outline-blue-500 transition-all border-0 shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:scale-[1.01] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white",
                        (largeInteractionMode || disabilityType === "MOTOR") ? "h-16 text-xl rounded-xl" : "h-14 text-lg rounded-xl"
                    )}
                    disabled={isPending}
                    aria-disabled={isPending}
                >
                    {isPending ? (
                        <>
                            <span className="sr-only">Sending magic link, please wait…</span>
                            <span aria-hidden="true">Sending…</span>
                        </>
                    ) : (
                        "Send Magic Link"
                    )}
                </Button>

                {simplifiedMode && (
                    <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold">
                        Step 1: Enter Email &bull; Step 2: Check Inbox
                    </p>
                )}
            </form>
        </div>
    );
}
