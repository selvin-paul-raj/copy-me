import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

// --- SEO Metadata for Copy-ME ---
// Please replace YOUR_NAME, YOUR_WEBSITE_OR_PORTFOLIO_URL, and YOUR_TWITTER_HANDLE with your actual details.
export const metadata: Metadata = {
  metadataBase: new URL("https://spr-copy-me.vercel.app"), // Replace with your deployed URL
  title: {
    default: "Copy-ME: Real-time Shared Clipboard by YOUR_NAME", // Primary title for search results
    template: "%s | Copy-ME by YOUR_NAME", // Template for pages with dynamic titles
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
  authors: [{ name: "YOUR_NAME", url: "YOUR_WEBSITE_OR_PORTFOLIO_URL" }], // Replace with your name and URL
  creator: "YOUR_NAME", // Replace with your name
  publisher: "YOUR_NAME", // Replace with your name
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
  },
  openGraph: {
    title: "Copy-ME: Real-time Shared Clipboard by YOUR_NAME", // Title for social media shares
    description:
      "Copy-ME is a minimalistic, real-time web application for instant text sharing and collaboration. Share and sync text across multiple devices, draft privately, and publish to update everyone. No registration, no permanent storage.",
    url: "https://spr-copy-me.vercel.app", // Replace with your deployed URL
    siteName: "Copy-ME",
    images: [
      {
        url: "/placeholder.svg", // Consider creating a custom image for better branding
        width: 1200,
        height: 630,
        alt: "Copy-ME: Real-time Shared Clipboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Copy-ME: Real-time Shared Clipboard by YOUR_NAME",
    description:
      "Copy-ME is a minimalistic, real-time web application for instant text sharing and collaboration. Share and sync text across multiple devices, draft privately, and publish to update everyone. No registration, no permanent storage.",
    creator: "@YOUR_TWITTER_HANDLE", // Replace with your Twitter handle
    images: ["/placeholder.svg"], // Consider creating a custom image for better branding
  },,
  // You can add more specific metadata here if needed, e.g., for specific pages.
    generator: 'v0.dev'
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
      </body>
    </html>
  )
}
