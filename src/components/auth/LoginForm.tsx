"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccessibility } from "@/context/AccessibilityContext";
import { cn } from "@/lib/utils";
import { signIn } from "next-auth/react";
import { Mic, MicOff, Brain, ArrowRight, Loader2 } from "lucide-react";

export function LoginForm() {
    const {
        largeInteractionMode,
        voiceGuidanceEnabled,
        disabilityType,
        aacEnabled,
        simplifiedMode,
    } = useAccessibility();

    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    const errorRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const emailInputRef = useRef<HTMLInputElement>(null);

    const [listeningStep, setListeningStep] = useState<"IDLE" | "EMAIL" | "OTP">("IDLE");
    const [loginStep, setLoginStep] = useState<"EMAIL" | "OTP">("EMAIL");
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const tokenInputRef = useRef<HTMLInputElement>(null);

    const isListening = listeningStep !== "IDLE";

    const startListening = async () => {
        try {
            const isOtp = loginStep === "OTP";
            const promptText = isOtp
                ? "Please say your 6 digit code."
                : "Please spell your email address letter by letter. Say 'at' for the @ symbol, and 'dot' for the period.";

            window.speechSynthesis.speak(new SpeechSynthesisUtterance(promptText));

            setTimeout(async () => {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
                mediaRecorderRef.current = mediaRecorder;
                chunksRef.current = [];

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) chunksRef.current.push(e.data);
                };
                mediaRecorder.onstop = async () => {
                    stream.getTracks().forEach((t) => t.stop());
                    await processAudio(isOtp);
                };
                mediaRecorder.start();
                setListeningStep(isOtp ? "OTP" : "EMAIL");

                setTimeout(() => {
                    if (mediaRecorderRef.current?.state === "recording") {
                        mediaRecorderRef.current.stop();
                    }
                }, 6000);
            }, isOtp ? 2500 : 5000);
        } catch (err) {
            console.error("Mic access denied:", err);
        }
    };

    const stopListening = () => {
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
        }
    };

    const processAudio = async (isOtp: boolean) => {
        setListeningStep("IDLE");
        try {
            const blob = new Blob(chunksRef.current, { type: "audio/webm" });
            const reader = new FileReader();
            const base64 = await new Promise<string>((resolve) => {
                reader.onloadend = () => {
                    const result = reader.result as string;
                    resolve(result.split(",")[1] || "");
                };
                reader.readAsDataURL(blob);
            });

            const res = await fetch("/api/voice/stt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ audio: base64, language: "en-IN" }),
            });

            if (res.ok) {
                const data = await res.json();
                let text = data.transcript || "";

                if (isOtp) {
                    const digits = text.replace(/\D/g, "");
                    if (digits.length >= 6) {
                        const otp = digits.substring(0, 6);
                        if (tokenInputRef.current) {
                            tokenInputRef.current.value = otp;
                            tokenInputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
                            window.speechSynthesis.speak(new SpeechSynthesisUtterance("Code captured. Verifying now."));
                            setTimeout(() => formRef.current?.requestSubmit(), 1000);
                        }
                    } else {
                        window.speechSynthesis.speak(new SpeechSynthesisUtterance("Could not hear 6 digits. Please try again."));
                    }
                    return;
                }

                text = text.toLowerCase()
                    .replace(/\bat\b/g, "@").replace(/ऐट/g, "@").replace(/அட்/g, "@")
                    .replace(/\bdot\b/g, ".").replace(/डॉट/g, ".").replace(/டாட்/g, ".")
                    .replace(/dash/g, "-").replace(/underscore/g, "_")
                    .replace(/\s+/g, "").replace(/[.,!?]+$/, "");

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (emailRegex.test(text)) {
                    if (emailInputRef.current) {
                        emailInputRef.current.value = text;
                        emailInputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
                        window.speechSynthesis.speak(new SpeechSynthesisUtterance(`Email captured. Sending OTP now.`));
                        setTimeout(() => formRef.current?.requestSubmit(), 1500);
                    }
                } else {
                    window.speechSynthesis.speak(new SpeechSynthesisUtterance("Could not understand email address. Please try spelling it again."));
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (disabilityType === "MOTOR" && emailInputRef.current) {
            emailInputRef.current.focus();
        }
    }, [disabilityType]);

    useEffect(() => {
        if (errorMsg) errorRef.current?.focus();
    }, [errorMsg]);

    const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
        if (e) e.preventDefault();
        setErrorMsg(null);
        setIsPending(true);

        const email = emailInputRef.current?.value;
        const token = tokenInputRef.current?.value;

        if (!email) {
            setErrorMsg("Please enter an email address.");
            setIsPending(false);
            return;
        }

        try {
            if (loginStep === "EMAIL") {
                const res = await signIn("nodemailer", { email, redirect: false });
                if (res?.error) throw new Error(res.error);
                setLoginStep("OTP");
                if (voiceGuidanceEnabled || typeof window !== "undefined") {
                    window.speechSynthesis.speak(
                        new SpeechSynthesisUtterance("An OTP has been sent to your email. Check it, then click the voice button again to read out your code.")
                    );
                }
            } else {
                if (!token || token.length < 6) {
                    setErrorMsg("Please enter the 6-digit code.");
                    setIsPending(false);
                    return;
                }
                window.speechSynthesis.speak(new SpeechSynthesisUtterance("Code submitted. Verifying now."));
                setTimeout(() => {
                    const callbackUrl = encodeURIComponent("/dashboard");
                    const encodedEmail = encodeURIComponent(email);
                    window.location.href = `/api/auth/callback/nodemailer?email=${encodedEmail}&token=${token}&callbackUrl=${callbackUrl}`;
                }, 1000);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Check your email and code, then try again.";
            setErrorMsg(message);
            if (voiceGuidanceEnabled || typeof window !== "undefined") {
                window.speechSynthesis.speak(new SpeechSynthesisUtterance(`Login error. ${message}`));
            }
        } finally {
            setIsPending(false);
        }
    };

    const domainTiles = ["@gmail.com", "@outlook.com", "@yahoo.com"];

    const inputCls = cn(
        "rounded-xl border-2 border-neutral-200 bg-white focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/10 outline-none transition-all",
        "placeholder:text-neutral-400",
        "[.high-contrast_&]:!bg-black [.high-contrast_&]:!text-white [.high-contrast_&]:!border-white [.high-contrast_&]:placeholder:!text-gray-500",
        (largeInteractionMode || disabilityType === "MOTOR") ? "h-14 text-xl px-4" : "h-12 text-base px-4"
    );

    return (
        <div className="space-y-5">
            {/* Accessibility mode badge */}
            {disabilityType !== "NONE" && (
                <div
                    role="status"
                    aria-label={`${disabilityType} accessibility mode active`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-100 border border-neutral-200 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-pulse [.high-contrast_&]:!bg-white shrink-0" />
                    <span className="text-xs font-semibold tracking-widest uppercase text-neutral-500 [.high-contrast_&]:!text-white">
                        {disabilityType} mode active
                    </span>
                </div>
            )}

            <form
                ref={formRef}
                onSubmit={handleSubmit}
                className="space-y-4"
                aria-label="Sign-in form"
                noValidate
            >
                {/* Error region */}
                <div
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                    ref={errorRef}
                    tabIndex={-1}
                    className="focus:outline-none"
                >
                    {errorMsg && (
                        <div
                            role="alert"
                            className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-red-400 [.high-contrast_&]:!text-red-400"
                        >
                            <span className="sr-only">Error: </span>
                            {errorMsg}
                        </div>
                    )}
                </div>

                {/* Email field */}
                <div className="space-y-1.5">
                    <Label
                        htmlFor="email"
                        className={cn(
                            "font-semibold text-neutral-900 [.high-contrast_&]:!text-white",
                            largeInteractionMode ? "text-xl" : "text-sm"
                        )}
                    >
                        Email address
                        <span className="text-red-500 ml-1" aria-hidden="true">*</span>
                    </Label>

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
                        className={inputCls}
                    />

                    {loginStep === "EMAIL" && !simplifiedMode && (
                        <p id="email-hint" className="text-xs text-neutral-500 [.high-contrast_&]:!text-gray-400">
                            We&apos;ll send a one-time code to this address.
                        </p>
                    )}

                    {/* Voice button */}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={isListening ? stopListening : startListening}
                        aria-pressed={isListening}
                        aria-label={isListening ? `Stop listening for ${loginStep === "OTP" ? "code" : "email"}` : `Use voice to enter ${loginStep === "OTP" ? "code" : "email"}`}
                        className={cn(
                            "w-full flex items-center gap-2 justify-center rounded-xl border-2 transition-all",
                            isListening
                                ? "border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800 [.high-contrast_&]:!border-white [.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black"
                                : "border-neutral-200 text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50 [.high-contrast_&]:!border-white [.high-contrast_&]:!text-white [.high-contrast_&]:!bg-black",
                            (largeInteractionMode || disabilityType === "MOTOR") ? "h-14 text-xl" : "h-11 text-sm"
                        )}
                    >
                        {isListening ? (
                            <>
                                <MicOff className="w-4 h-4" aria-hidden="true" />
                                <span className="font-semibold">Listening for {loginStep === "OTP" ? "Code" : "Email"}…</span>
                            </>
                        ) : (
                            <>
                                <Mic className="w-4 h-4" aria-hidden="true" />
                                <span className="font-semibold">Voice {loginStep === "OTP" ? "Code" : "Email"}</span>
                            </>
                        )}
                    </Button>
                </div>

                {/* OTP field */}
                {loginStep === "OTP" && (
                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Label
                            htmlFor="token"
                            className={cn(
                                "font-semibold text-neutral-900 [.high-contrast_&]:!text-white",
                                largeInteractionMode ? "text-xl" : "text-sm"
                            )}
                        >
                            6-digit code
                            <span className="text-red-500 ml-1" aria-hidden="true">*</span>
                        </Label>
                        <Input
                            id="token"
                            ref={tokenInputRef}
                            name="token"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="123456"
                            autoFocus
                            aria-required="true"
                            className={cn(
                                inputCls,
                                "text-center tracking-[0.5em] font-mono font-bold",
                                (largeInteractionMode || disabilityType === "MOTOR") ? "text-2xl" : "text-xl"
                            )}
                        />
                        <p className="text-xs text-neutral-500 [.high-contrast_&]:!text-gray-400">
                            Check your inbox and paste or type the code above.
                        </p>
                    </div>
                )}

                {/* Motor profile: domain quick-fill */}
                {(disabilityType === "MOTOR" || aacEnabled) && (
                    <div className="flex flex-wrap gap-2 animate-in fade-in duration-300">
                        {domainTiles.map((domain) => (
                            <Button
                                key={domain}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-9 px-3 text-xs font-semibold rounded-lg border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-neutral-600 [.high-contrast_&]:!border-white [.high-contrast_&]:!text-white [.high-contrast_&]:!bg-black"
                                onClick={() => {
                                    const input = document.getElementById("email") as HTMLInputElement;
                                    if (input && input.value && !input.value.includes("@")) {
                                        input.value = input.value + domain;
                                        input.dispatchEvent(new Event("input", { bubbles: true }));
                                    }
                                }}
                            >
                                {domain}
                            </Button>
                        ))}
                    </div>
                )}

                {/* Cognitive: explain simply */}
                {disabilityType === "COGNITIVE" && (
                    <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 [.high-contrast_&]:!bg-black [.high-contrast_&]:!border-white">
                        <p className="text-sm text-neutral-600 mb-3 [.high-contrast_&]:!text-gray-300">
                            Need help with this form?
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 rounded-lg border-neutral-200 text-neutral-700 hover:bg-neutral-100 font-semibold [.high-contrast_&]:!border-white [.high-contrast_&]:!text-white [.high-contrast_&]:!bg-black"
                            onClick={() => {
                                window.speechSynthesis.cancel();
                                window.speechSynthesis.speak(
                                    new SpeechSynthesisUtterance("This form asks for your email address. After you type it and click the button, we will send you a special code. You type that code here to sign in. No password needed.")
                                );
                            }}
                        >
                            <Brain className="w-4 h-4" aria-hidden="true" />
                            Explain Simply
                        </Button>
                    </div>
                )}

                {/* Submit */}
                <Button
                    type="submit"
                    className={cn(
                        "w-full font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl border-0 shadow-none transition-all",
                        "focus:outline-none focus:ring-4 focus:ring-neutral-900/30",
                        "[.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black [.high-contrast_&]:!border [.high-contrast_&]:!border-black",
                        (largeInteractionMode || disabilityType === "MOTOR") ? "h-14 text-xl" : "h-12 text-base"
                    )}
                    disabled={isPending}
                    aria-disabled={isPending}
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                            <span className="sr-only">Sending, please wait…</span>
                            <span aria-hidden="true">Sending…</span>
                        </>
                    ) : (
                        <>
                            {loginStep === "EMAIL" ? "Send Code" : "Verify & Sign In"}
                            <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                        </>
                    )}
                </Button>

                {simplifiedMode && (
                    <p className="text-xs text-center text-neutral-400 uppercase tracking-widest font-semibold [.high-contrast_&]:!text-gray-500">
                        Step 1: Enter Email · Step 2: Check Inbox
                    </p>
                )}
            </form>
        </div>
    );
}
