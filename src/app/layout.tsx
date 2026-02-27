import type { Metadata } from "next";
import "./globals.css";
import { GlobalVoiceListener } from "@/components/voice/GlobalVoiceListener";
import { GlobalVoiceToggle } from "@/components/voice/GlobalVoiceToggle";
import { Providers } from "@/components/providers/Providers";
import { VoiceCommandOverlay } from "@/components/voice/VoiceCommandOverlay";
import { QuickActionTiles } from "@/components/accessibility/QuickActionTiles";
import { MainContentWrapper } from "@/components/layout/MainContentWrapper";

export const metadata: Metadata = {
  title: "AI-Powered Accessible Assessment Platform",
  description: "Comprehensive skill evaluation with inclusive accessibility features and adaptive assessment technology.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <Providers>
          <GlobalVoiceListener />
          <VoiceCommandOverlay />
          <MainContentWrapper>
            {children}
          </MainContentWrapper>
          <GlobalVoiceToggle />
          <QuickActionTiles />
        </Providers>
      </body>
    </html>
  );
}
