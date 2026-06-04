import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { RegisterPWA } from "@/components/pwa/RegisterPWA";
import { OfflineBadge } from "@/components/pwa/OfflineBadge";
import { BreachOverlay } from "@/components/alerts/BreachOverlay";
import { BreachDevTrigger } from "@/components/alerts/BreachDevTrigger";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-jetbrains",
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
    { media: "(prefers-color-scheme: light)", color: "#0F6E56" },
    { media: "(prefers-color-scheme: dark)", color: "#17130e" },
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
        inter.variable,
        jetbrainsMono.variable,
        "h-full antialiased",
      )}
    >
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>
          <RegisterPWA />
          <OfflineBadge />
          {children}
          <BreachOverlay />
          <BreachDevTrigger />
        </ThemeProvider>
      </body>
    </html>
  );
}
