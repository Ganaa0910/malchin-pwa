import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { RegisterPWA } from "@/components/pwa/RegisterPWA";
import { OfflineBadge } from "@/components/pwa/OfflineBadge";
import { BreachOverlay } from "@/components/alerts/BreachOverlay";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Малчин — GPS",
  description: "Малаа GPS-ээр хянана",
  applicationName: "Малчин",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Малчин",
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="mn"
      className={cn(
        geistSans.variable,
        geistMono.variable,
        "h-full antialiased",
      )}
    >
      <body className="min-h-full bg-background text-foreground">
        <RegisterPWA />
        <OfflineBadge />
        {children}
        <BreachOverlay />
      </body>
    </html>
  );
}
