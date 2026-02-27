import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { QuickActionTiles } from "@/components/accessibility/QuickActionTiles";
import { MainContentWrapper } from "@/components/layout/MainContentWrapper";
import VoiceNavButton from "@/components/voice/VoiceNavButton";

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
          <MainContentWrapper>
            {children}
          </MainContentWrapper>
          <VoiceNavButton />
          <QuickActionTiles />
        </Providers>
      </body>
    </html>
  );
}
