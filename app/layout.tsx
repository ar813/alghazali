import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Provider } from "@/components/ui/provider";
import AppDownloadPromo from "@/components/AppDownloadPromo/AppDownloadPromo";
import GoogleAnalytics from "@/components/SEO/GoogleAnalytics";
import LordIconInitializer from "@/components/LordIconInitializer";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "Al Ghazali High School | Nurturing Minds, Building Character",
    template: "%s | Al Ghazali High School",
  },
  description: "Established in 1993, Al Ghazali High School provides quality education combining modern pedagogy with Islamic values in Landhi, Karachi. Under the supervision of Al Razi Educational & Welfare Society.",
  keywords: [
    "Al Ghazali High School",
    "Al Ghazali School Landhi",
    "36-B school Landhi",
    "Top Islamic School in Landhi",
    "Best school in Landhi Karachi",
    "Islamic Education Karachi",
    "Academic Excellence",
    "Mahad Usman Bin Affan",
    "Mahad Usman bin Affan Karachi",
    "Al Razi Educational & Welfare Society",
    "Al Razi Society School Karachi",
    "Islamic Studies Curriculum",
    "Religious Education Karachi",
    "Quranic Studies for Kids",
    "High School in Area 36-B",
    "Quality Education Landhi",
    "Modern School Islamic Values",
    "Al Razi Society School",
    "Korangi schools list",
    "Matric school Landhi",
    "Primary school Landhi",
    "Private school in Landhi 36-B",
    "Al Ghazali High School Karachi",
    "Islamic School Landhi Korangi",
    "Society based education Karachi"
  ],
  authors: [{ name: "Al Ghazali High School" }],
  metadataBase: new URL("https://alghazali.vercel.app"),
  alternates: {
    canonical: "/",
  },
  creator: "Al Ghazali High School",
  publisher: "Al Razi Educational & Welfare Society",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Al Ghazali High School | Academic Excellence in Karachi",
    description: "Nurturing young minds with academic excellence, Islamic values, and modern education since 1993.",
    url: "https://alghazali.vercel.app",
    siteName: "Al Ghazali High School",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "Al Ghazali High School Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Al Ghazali High School | Academic Excellence in Karachi",
    description: "Nurturing young minds with academic excellence, Islamic values, and modern education since 1993.",
    images: ["/logo.png"],
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
};

import { Toaster } from "@/components/ui/sonner";

import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <GoogleAnalytics ga_id="G-75E96W9EMG" />
      <LordIconInitializer />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Provider>
          <AuthProvider>
            {children}
            <AppDownloadPromo />
            <Toaster position="top-right" richColors closeButton />
          </AuthProvider>
        </Provider>
      </body>
    </html>
  );
}
