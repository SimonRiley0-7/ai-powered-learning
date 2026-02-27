import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MailCheck } from "lucide-react"

export default function VerifyRequestPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <MailCheck className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
                    <CardDescription className="text-base pt-2">
                        A sign-in link has been sent to your email address.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        You can safely close this window or use the link in your email to automatically log in on this device.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
