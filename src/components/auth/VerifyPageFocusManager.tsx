"use client";

import { useEffect, useRef } from "react";

/**
 * Mounts invisibly on the verify-pwd page.
 * Moves focus to the h1 so screen readers announce the new page content.
 */
export function VerifyPageFocusManager() {
    const mounted = useRef(false);

    useEffect(() => {
        if (mounted.current) return;
        mounted.current = true;

        const heading = document.getElementById("verify-heading") as HTMLElement | null;
        heading?.focus();
    }, []);

    return null;
}
