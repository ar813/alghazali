import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Provider } from "@/components/ui/provider";
import AppDownloadPromo from "@/components/AppDownloadPromo/AppDownloadPromo";
import GoogleAnalytics from "@/components/SEO/GoogleAnalytics";

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
  keywords: ["Al Ghazali High School", "School in Landhi", "Best school in Karachi", "Islamic Education", "Academic Excellence", "Mahad Usman Bin Affan", "Al Razi Educational Society"],
  authors: [{ name: "Al Ghazali High School" }],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <GoogleAnalytics ga_id="G-75E96W9EMG" />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Provider>
          {children}
          <AppDownloadPromo />
          <Toaster position="top-right" richColors closeButton />
        </Provider>
      </body>
    </html>
  );
}
