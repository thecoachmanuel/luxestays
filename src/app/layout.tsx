import { Providers } from "@/components/Providers";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { auth } from "@/auth";
import { getSettings } from "@/lib/db";
import { ThemeRegistry } from "@/components/ThemeRegistry";
import { ChatWidget } from "@/components/ChatWidget";

export const dynamic = 'force-dynamic';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const { seoSettings } = settings;

  return {
    title: {
      default: seoSettings?.metaTitle || "LuxeStays - Premium Apartment Booking",
      template: `%s | ${settings.siteName || "LuxeStays"}`
    },
    description: seoSettings?.metaDescription || "Book the finest apartments in Lagos.",
    keywords: seoSettings?.metaKeywords?.split(',').map(k => k.trim()) || ["apartments", "booking", "luxury", "lagos", "accommodation"],
    openGraph: {
      type: "website",
      locale: "en_US",
      url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      title: seoSettings?.metaTitle || "LuxeStays - Premium Apartment Booking",
      description: seoSettings?.metaDescription || "Book the finest apartments in Lagos.",
      siteName: settings.siteName || "LuxeStays",
      images: [
        {
          url: seoSettings?.ogImage || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2070&auto=format&fit=crop",
          width: 1200,
          height: 630,
          alt: settings.siteName || "LuxeStays",
        },
      ],
    },
    twitter: {
        card: 'summary_large_image',
        site: seoSettings?.twitterHandle,
        title: seoSettings?.metaTitle || "LuxeStays - Premium Apartment Booking",
        description: seoSettings?.metaDescription || "Book the finest apartments in Lagos.",
        images: [seoSettings?.ogImage || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2070&auto=format&fit=crop"],
    },
    icons: {
      icon: seoSettings?.favicon || '/favicon.ico',
    }
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const settings = await getSettings();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeRegistry palette={settings.colorPalette} />
        <Providers session={session}>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <ChatWidget />
        </Providers>
      </body>
    </html>
  );
}
