import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-spacemono",
});

export const metadata: Metadata = {
  title: "Global Macro Quiz",
  description:
    "Apprends la macroéconomie et les marchés financiers avec des questions interactives, des corrections détaillées et un suivi de progression.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${grotesk.variable} ${spaceMono.variable}`}>
      <body className="bg-ink font-sans text-fg antialiased">{children}</body>
    </html>
  );
}
