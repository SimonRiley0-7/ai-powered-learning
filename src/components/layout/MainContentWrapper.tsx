"use client";

import { useAccessibility } from "@/context/AccessibilityContext";
import { cn } from "@/lib/utils";

export function MainContentWrapper({ children }: { children: React.ReactNode }) {
    const { aacEnabled } = useAccessibility();

    return (
        <div className={cn("min-h-screen", aacEnabled ? "pb-32 sm:pb-36" : "")}>
            {children}
        </div>
    );
}
