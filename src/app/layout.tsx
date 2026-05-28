import type { Metadata, Viewport } from "next";
import {
  Sora,
  Inter,
  Barlow_Condensed,
  JetBrains_Mono,
  Fraunces,
  Mulish,
} from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { RegisterPWA } from "@/components/pwa/RegisterPWA";
import { OfflineBadge } from "@/components/pwa/OfflineBadge";
import { BreachOverlay } from "@/components/alerts/BreachOverlay";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});
const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-jetbrains",
  display: "swap",
});
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});
const mulish = Mulish({
  subsets: ["latin", "cyrillic"],
  variable: "--font-mulish",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Малчин — GPS хяналт",
  description:
    "Малын GPS байршил, бэлчээр хяналт, зуданд бэлэн байх систем",
  applicationName: "Малчин",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Малчин",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1D9E75" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0c0e" },
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
      data-theme="modern"
      suppressHydrationWarning
      className={cn(
        sora.variable,
        inter.variable,
        barlow.variable,
        jetbrains.variable,
        fraunces.variable,
        mulish.variable,
        "h-full antialiased",
      )}
    >
      <body className="min-h-full bg-background text-foreground font-body">
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
