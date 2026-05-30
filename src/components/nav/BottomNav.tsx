"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_TABS } from "./tabs";

/** Mobile primary nav. Hidden at md+, where SideNav takes over. */
export function BottomNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      aria-label="Цэс"
      className="fixed inset-x-0 bottom-0 z-40 bg-background/95 backdrop-blur border-t pb-safe md:hidden"
    >
      <ul className="mx-auto max-w-[420px] grid grid-cols-5">
        {NAV_TABS.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href} className="contents">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                className={cn(
                  "tap flex flex-col items-center justify-center gap-1 py-2",
                  "text-[11px] leading-none transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-5 transition-colors",
                    active ? "text-primary" : "",
                  )}
                  strokeWidth={active ? 2.25 : 1.75}
                />
                <span className={cn(active && "font-medium")}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
