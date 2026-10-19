import type { Metadata } from "next";
import { Poppins, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Providers from "./providers";
import "./globals.css";
const sans = Poppins({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-poppins", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono", display: "swap" });
export const metadata: Metadata = { title: "OpenPIL", description: "A public record of synthetic PIL filings and responses" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={`${sans.variable} ${mono.variable} h-full antialiased`}>
    <body className="min-h-full flex flex-col">
      <Providers>
        {children}
      </Providers>
      <Analytics />
      <SpeedInsights />
    </body>
  </html>;
}
