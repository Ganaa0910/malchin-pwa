"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { mn } from "@/lib/i18n/mn";

const OPTIONS: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: "light", label: mn.theme.light, Icon: Sun },
  { value: "dark", label: mn.theme.dark, Icon: Moon },
  { value: "system", label: mn.theme.system, Icon: Monitor },
];

/** Segmented light / dark / system control. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Until mounted, theme is unknown (SSR) — render a stable, inert shell.
  const active = mounted ? theme : undefined;

  return (
    <div
      role="radiogroup"
      aria-label={mn.theme.label}
      className={cn(
        "inline-grid grid-cols-3 gap-1 rounded-lg border bg-card p-1",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const selected = active === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            onClick={() => setTheme(value)}
            className={cn(
              "tap flex flex-col items-center justify-center gap-1 rounded-md px-2 py-1.5",
              "text-[11px] font-medium transition-colors",
              selected
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent",
            )}
          >
            <Icon className={cn("size-4", selected && "text-primary")} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
