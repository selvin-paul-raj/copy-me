import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "@vercel/analytics/next"
const inter = Inter({ subsets: ["latin"] })

// --- SEO Metadata for Copy-ME ---
export const metadata: Metadata = {
  metadataBase: new URL("https://spr-copy-me.vercel.app"),
  title: {
    default: "Copy-ME: Real-time Shared Clipboard by Selvin PaulRaj K",
    template: "%s | Copy-ME by Selvin PaulRaj K",
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
    "Selvin Paul Raj",
    "copy-me",
    "text collaboration",
    "web clipboard",
    "sync notes",
  ],
  authors: [{ name: "Selvin PaulRaj K", url: "https://selvinpaulraj.tech" }],
  creator: "Selvin PaulRaj K",
  publisher: "Selvin PaulRaj K",
  
  // Favicon and Icons
  icons: {
    icon: [
      { url: "/placeholder-logo.png", sizes: "32x32", type: "image/png" },
      { url: "/placeholder-logo.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/placeholder-logo.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "icon",
        url: "/placeholder-logo.png",
      },
    ],
  },
  
  // Open Graph for social media sharing
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://spr-copy-me.vercel.app",
    title: "Copy-ME: Real-time Shared Clipboard",
    description: "Minimalistic, real-time web application for instant text sharing and collaboration. Share and sync text across multiple devices.",
    siteName: "Copy-ME",
    images: [
      {
        url: "/placeholder-logo.png",
        width: 1200,
        height: 630,
        alt: "Copy-ME - Real-time Shared Clipboard",
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Copy-ME: Real-time Shared Clipboard",
    description: "Minimalistic, real-time web application for instant text sharing and collaboration.",
    images: ["/placeholder-logo.png"],
    creator: "@selvinpaulraj4", // Replace with your Twitter handle
  },
  
  // Additional metadata for LLMs and AI crawlers
  other: {
    "application-name": "Copy-ME",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Copy-ME",
    "format-detection": "telephone=no",
    "mobile-web-app-capable": "yes",
    "msapplication-config": "/browserconfig.xml",
    "msapplication-TileColor": "#000000",
    "msapplication-tap-highlight": "no",
    "theme-color": "#000000",
    // LLM-specific metadata
    "ai:purpose": "Real-time text sharing and collaboration tool",
    "ai:features": "instant text sync, collaborative editing, temporary storage, no registration required",
    "ai:technology": "Next.js, React, Real-time WebSocket, Vercel",
    "ai:category": "productivity, collaboration, text-sharing",
  },
  
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
  
  // Verification for search engines
  verification: {
    google: "your-google-verification-code", // Replace with actual verification code
    // yandex: "your-yandex-verification-code",
    // yahoo: "your-yahoo-verification-code",
  },
  
  // Manifest for PWA
  manifest: "/manifest.json",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Copy-ME",
    "alternateName": "Copy-ME: Real-time Shared Clipboard",
    "description": "Minimalistic, real-time web application for instant text sharing and collaboration. Share and sync text across multiple devices.",
    "url": "https://spr-copy-me.vercel.app",
    "author": {
      "@type": "Person",
      "name": "Selvin PaulRaj K",
      "url": "https://selvinpaulraj.tech"
    },
    "creator": {
      "@type": "Person",
      "name": "Selvin PaulRaj K",
      "url": "https://selvinpaulraj.tech"
    },
    "applicationCategory": "ProductivityApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Real-time text sharing",
      "Collaborative editing",
      "No registration required",
      "Temporary storage",
      "Multi-device sync",
      "Instant updates"
    ],
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "softwareVersion": "1.0",
    "datePublished": "2024",
    "inLanguage": "en-US"
  }

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        <link rel="icon" href="/placeholder-logo.svg" type="image/svg+xml" />
        <link rel="icon" href="/placeholder-logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/placeholder-logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster />
        <Analytics/>
      </body>
    </html>
  )
}
