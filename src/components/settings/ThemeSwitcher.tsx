"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  THEMES,
  THEME_META,
  type ThemeName,
} from "@/components/theme/ThemeProvider";

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const current = (theme ?? "modern") as ThemeName;

  return (
    <div
      role="radiogroup"
      aria-label="Загвар сонгох"
      className={cn("grid grid-cols-1 gap-3", className)}
    >
      {THEMES.map((t) => {
        const meta = THEME_META[t];
        const active = mounted && current === t;
        return (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(t)}
            className={cn(
              "tap flex w-full items-center gap-3 rounded-md border-card bg-card text-card-foreground px-4 py-3 text-left",
              "transition-transform active:scale-[0.99]",
              active && "ring-2 ring-ring",
            )}
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <span
              aria-hidden
              className="inline-block size-8 shrink-0 rounded-full border border-border"
              style={{ background: meta.swatch }}
            />
            <span className="flex-1 min-w-0">
              <span className="block font-display text-base leading-tight">
                {meta.label}
              </span>
              <span className="block text-sm text-muted-foreground leading-tight mt-0.5">
                {meta.description}
              </span>
            </span>
            {active && (
              <Check className="size-5 text-primary shrink-0" aria-hidden />
            )}
          </button>
        );
      })}
    </div>
  );
}
