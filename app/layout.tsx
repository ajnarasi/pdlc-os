import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["opsz", "SOFT"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3502"),
  ),
  title: "PDLC-OS — One brain across Discovery to Support",
  description:
    "A compounding-memory PM operating system for Fiserv. Six PDLC stages, one merchant brain, every artifact signed and verified.",
  openGraph: {
    title: "PDLC-OS — Compounding PM brain for Fiserv",
    description:
      "Discovery → Prioritization → Design → Delivery → Launch → Support, run as one continuous evidence-anchored agent run.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${mono.variable}`}
    >
      <body className="relative">{children}</body>
    </html>
  );
}
