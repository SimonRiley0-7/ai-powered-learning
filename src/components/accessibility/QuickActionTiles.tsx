"use client"

import { useAccessibility } from "@/context/AccessibilityContext"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { LayoutDashboard, LogOut, CheckCircle2, HelpCircle } from "lucide-react"

export function QuickActionTiles() {
    const { aacEnabled } = useAccessibility()
    const router = useRouter()

    if (!aacEnabled) return null

    const actions = [
        { label: "Dashboard", icon: <LayoutDashboard className="h-6 w-6" />, route: "/dashboard" },
        {
            label: "Proceed", icon: <CheckCircle2 className="h-6 w-6" />, action: () => {
                const submitBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement
                if (submitBtn) submitBtn.click()
            }
        },
        {
            label: "Need Help", icon: <HelpCircle className="h-6 w-6" />, action: () => {
                if (typeof window !== "undefined" && "speechSynthesis" in window) {
                    const msg = new SpeechSynthesisUtterance("I need assistance with this page.")
                    window.speechSynthesis.speak(msg)
                }
            }
        },
        { label: "Logout", icon: <LogOut className="h-6 w-6" />, route: "/api/auth/signout" },
    ]

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 shadow-[0_-8px_30px_rgb(0,0,0,0.06)] p-4 z-50 flex justify-center gap-3 sm:gap-6 animate-in slide-in-from-bottom duration-500">
            {actions.map((item, idx) => (
                <Button
                    key={idx}
                    variant="outline"
                    className="h-20 w-24 sm:h-24 sm:w-32 flex flex-col items-center justify-center gap-2 border bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 hover:border-blue-500 hover:bg-blue-50/80 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:border-blue-400 dark:hover:text-blue-300 transition-all rounded-xl shadow-sm hover:shadow-md backdrop-blur-sm"
                    onClick={() => {
                        if (item.route) router.push(item.route)
                        if (item.action) item.action()
                    }}
                >
                    <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                        {item.icon}
                    </div>
                    <span className="font-bold text-xs sm:text-sm tracking-tight">{item.label}</span>
                </Button>
            ))}
        </div>
    )
}
