import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "@vercel/analytics/next"
const inter = Inter({ subsets: ["latin"] })

// --- SEO Metadata for Copy-ME ---
// Please replace Selvin PaulRaj K, YOUR_WEBSITE_OR_PORTFOLIO_URL, and YOUR_TWITTER_HANDLE with your actual details.
export const metadata: Metadata = {
  metadataBase: new URL("https://spr-copy-me.vercel.app"), // Replace with your deployed URL
  title: {
    default: "Copy-ME: Real-time Shared Clipboard by Selvin PaulRaj K", // Primary title for search results
    template: "%s | Copy-ME by Selvin PaulRaj K", // Template for pages with dynamic titles
  },
  description:
    "Copy-ME is a minimalistic, real-time web application for instant text sharing and collaboration. Share and sync text across multiple devices, draft privately, and publish to update everyone. No registration, no permanent storage.",
  keywords: [
    "real-time text sharing",
    "shared clipboard",
    "collaborative text editor",
    "live notes",
    "instant text sync",
    "online notepad",
    "temporary text storage",
    "no registration",
    "open source",
    "Next.js",
    "Selvin Paul Raj", // Replace with your name
  ],
  authors: [{ name: "Selvin PaulRaj K", url: "https://selvinpaulraj.tech" }], // Updated with provided details
  creator: "Selvin PaulRaj K", // Updated with provided details
  publisher: "Selvin PaulRaj K", // Updated with provided details
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
        <Analytics/>
      </body>
    </html>
  )
}
