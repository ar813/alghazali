import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Provider } from "@/components/ui/provider";
import AppDownloadPromo from "@/components/AppDownloadPromo/AppDownloadPromo";

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
  title: "Al Ghazali High School",
  description: "Under the supervision of Al Razi Educational & Welfare Society",
};

import { Toaster } from "@/components/ui/sonner";

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
        <Provider>
          {children}
          <AppDownloadPromo />
          <Toaster position="top-right" richColors closeButton />
        </Provider>
      </body>
    </html>
  );
}
