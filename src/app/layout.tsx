import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://lo-fi.study'),
  title: {
    default: "Lo-Fi.Study - Focus & Productivity App",
    template: "%s | Lo-Fi.Study"
  },
  description: "Boost your productivity with Lo-Fi.Study - the ultimate focus companion. Features Pomodoro timer, ambient sounds, background customization, and progress tracking for students and professionals.",
  keywords: [
    "pomodoro timer",
    "focus app",
    "productivity",
    "study app",
    "ambient sounds",
    "lo-fi music",
    "concentration",
    "time management",
    "work timer",
    "study timer"
  ],
  authors: [{ name: "Lo-Fi.Study Team" }],
  creator: "Lo-Fi.Study",
  publisher: "Lo-Fi.Study",
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
    type: "website",
    locale: "en_US",
    url: "https://lo-fi.study",
    siteName: "Lo-Fi.Study",
    title: "Lo-Fi.Study - Focus & Productivity App",
    description: "Boost your productivity with Lo-Fi.Study - the ultimate focus companion featuring Pomodoro timer, ambient sounds, and progress tracking.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Lo-Fi.Study - Focus & Productivity App",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lo-Fi.Study - Focus & Productivity App",
    description: "Boost your productivity with Lo-Fi.Study - the ultimate focus companion featuring Pomodoro timer, ambient sounds, and progress tracking.",
    images: ["/og-image.jpg"],
    creator: "@lofistudy",
  },
  category: "productivity",
  applicationName: "Lo-Fi.Study",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
