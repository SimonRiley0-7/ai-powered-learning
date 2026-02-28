"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Critical System Error:", error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 [.high-contrast_&]:!bg-black">
            <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 [.high-contrast_&]:!bg-gray-900 [.high-contrast_&]:!border-gray-700">
                <div className="bg-red-50 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center [.high-contrast_&]:!bg-red-900/50">
                    <svg className="w-10 h-10 text-red-500 [.high-contrast_&]:!text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight [.high-contrast_&]:!text-white">Something went wrong</h2>
                    <p className="mt-2 text-sm text-slate-500 [.high-contrast_&]:!text-gray-400">
                        The AI Engine or Database encountered an unexpected error.
                    </p>
                </div>
                <div className="pt-2">
                    <Button onClick={() => reset()} className="w-full bg-slate-900 text-white rounded-xl hover:bg-slate-800 [.high-contrast_&]:!bg-white [.high-contrast_&]:!text-black">
                        Try Again
                    </Button>
                </div>
            </div>
        </div>
    );
}
