import { Button } from "@/components/ui/button";

interface VoiceVerifyButtonProps {
    status: string;
}

export function VoiceVerifyButton({ status }: VoiceVerifyButtonProps) {
    return (
        <a href="/api/digilocker" className="w-full" aria-label="Verify disability via DigiLocker">
            <Button
                className="w-full h-12 text-lg focus:outline focus:outline-2 focus:outline-blue-500"
                size="lg"
                aria-describedby="verify-description"
                aria-label={status === "FAILED" ? "Retry DigiLocker verification" : "Verify via DigiLocker"}
            >
                {status === "FAILED" ? "Retry DigiLocker Verification" : "Verify via DigiLocker"}
            </Button>
        </a>
    );
}
