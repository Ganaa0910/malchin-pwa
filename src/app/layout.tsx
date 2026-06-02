import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
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
  title: "Belchee — GPS",
  description: "Малаа GPS-ээр хянана",
  applicationName: "Belchee",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Belchee",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#16a34a" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
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
      suppressHydrationWarning
      className={cn(
        geistSans.variable,
        geistMono.variable,
        "h-full antialiased",
      )}
    >
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>
          <RegisterPWA />
          <OfflineBadge />
          {children}
          <BreachOverlay />
        </ThemeProvider>
      </body>
    </html>
  );
}
