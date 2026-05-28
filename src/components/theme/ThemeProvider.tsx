"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export const THEMES = ["modern", "utility", "nomadic"] as const;
export type ThemeName = (typeof THEMES)[number];

export const THEME_META: Record<
  ThemeName,
  { label: string; description: string; swatch: string }
> = {
  modern: {
    label: "Орчин үе",
    description: "Ногоон, бөөрөнхий",
    swatch: "#1d9e75",
  },
  utility: {
    label: "Хэрэгсэл",
    description: "Хар, шигүү, терминал",
    swatch: "#9be564",
  },
  nomadic: {
    label: "Нүүдэлчин",
    description: "Шороо, монгол хээ",
    swatch: "#c1502e",
  },
};

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="modern"
      themes={[...THEMES]}
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
