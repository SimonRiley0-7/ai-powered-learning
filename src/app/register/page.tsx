"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { loginWithMagicLink } from "@/app/actions/auth"

export default function RegisterPage() {
    const [pwdVisible, setPwdVisible] = useState(false)

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md my-8">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
                    <CardDescription>
                        Register for a passwordless, inclusive assessment account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={loginWithMagicLink} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-base font-semibold">
                                Full Name
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="John Doe"
                                required
                                className="h-12 text-lg"
                                aria-label="Enter your full name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-base font-semibold">
                                Email Address
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                className="h-12 text-lg"
                                aria-label="Enter your email address"
                            />
                        </div>

                        <div className="pt-2">
                            <div
                                className="flex items-center space-x-2 p-4 border rounded-lg bg-secondary/20"
                            >
                                <Checkbox
                                    id="pwd-toggle"
                                    checked={pwdVisible}
                                    onCheckedChange={(c) => setPwdVisible(c as boolean)}
                                />
                                <div className="space-y-1">
                                    <Label htmlFor="pwd-toggle" className="font-semibold text-base cursor-pointer">
                                        I have accessibility requirements
                                    </Label>
                                    <p className="text-sm text-muted-foreground">Select this to configure specific needs like screen readers, extended time, or high contrast mode.</p>
                                </div>
                            </div>

                            {pwdVisible && (
                                <div className="mt-4 p-4 border rounded-lg space-y-4 bg-muted/30">
                                    <h3 className="font-semibold">Select all that apply:</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="req-visual" />
                                            <Label htmlFor="req-visual" className="cursor-pointer">Visually Impaired (Needs Screen Reader / High Contrast)</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="req-hearing" />
                                            <Label htmlFor="req-hearing" className="cursor-pointer">Hearing Impaired (Needs Transcripts / Subtitles)</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="req-motor" />
                                            <Label htmlFor="req-motor" className="cursor-pointer">Motor Impaired (Needs Extended Time / Keyboard Only)</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="req-cognitive" />
                                            <Label htmlFor="req-cognitive" className="cursor-pointer">Cognitive Impaired (Needs Simple Language / No Timers)</Label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <Button type="submit" className="w-full h-12 text-lg font-medium mt-4">
                            Register via Magic Link
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-muted-foreground mr-1">Already have an account?</span>
                        <Link href="/login" className="text-primary hover:underline font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded">
                            Log in here
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
