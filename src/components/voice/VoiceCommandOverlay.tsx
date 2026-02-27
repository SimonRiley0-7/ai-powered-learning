"use client"

import { useVoice } from "@/context/VoiceContext"
import { usePathname } from "next/navigation"
import { Command, Mic, ChevronRight } from "lucide-react"

export function VoiceCommandOverlay() {
    const { isListening } = useVoice()
    const pathname = usePathname()

    if (!isListening) return null

    // Context-aware commands based on current page
    const getCommands = () => {
        const base = ["Navigate to Dashboard", "Logout", "Stop Listening"]
        if (pathname === "/") return [...base, "Go to Login", "Register"]
        if (pathname === "/login") return [...base, "Submit Form", "Clear Email", "My email is [your email]"]
        if (pathname.includes("/dashboard/verify-pwd")) return [...base, "Verify DigiLocker", "Show Help"]
        if (pathname.includes("/assessment")) return [...base, "Next Question", "Submit Assessment", "Read Question"]
        return base
    }

    const commands = getCommands()

    return (
        <div className="fixed top-24 left-6 z-50 w-72 animate-in fade-in slide-in-from-left duration-300">
            <div className="bg-background/95 backdrop-blur-md border-2 border-primary/50 rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-primary/10 p-4 flex items-center gap-3 border-b border-primary/20">
                    <div className="bg-primary p-2 rounded-full">
                        <Mic className="h-4 w-4 text-primary-foreground animate-pulse" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm tracking-tight">Voice Command Mode</h4>
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Active & Listening</p>
                    </div>
                </div>

                <div className="p-4 space-y-3">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <Command className="h-3 w-3" />
                        Try saying:
                    </p>
                    <div className="space-y-2">
                        {commands.map((cmd, idx) => (
                            <div
                                key={idx}
                                className="group flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-transparent hover:border-primary/30 transition-all cursor-default"
                            >
                                <span className="text-xs font-semibold">&quot;{cmd}&quot;</span>
                                <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-muted/30 p-3 text-[10px] text-center text-muted-foreground italic border-t border-primary/10">
                    Commands adapt to your current screen.
                </div>
            </div>
        </div>
    )
}
