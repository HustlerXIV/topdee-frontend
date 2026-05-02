import type { Metadata } from "next";
import "./globals.css";
import {
  PreferencesProvider,
  themeBootScript,
} from "@/components/PreferencesProvider";
import { Kanit } from "next/font/google";

// ✅ Load Kanit font
const kanit = Kanit({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-kanit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Topdee — AI Chatbot Platform for SME",
  description:
    "Unified inbox + AI chatbot for LINE, Facebook, Instagram and Webchat. Built for Thai SMEs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" suppressHydrationWarning className={kanit.variable}>
      <head>
        {/* Prevent theme flash */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className={`${kanit.className} min-h-screen bg-page text-ink`}>
        <PreferencesProvider>{children}</PreferencesProvider>
      </body>
    </html>
  );
}
