import { MapPinned, Layers, Bell, CloudSun, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { mn } from "@/lib/i18n/mn";

export type NavTab = {
  href: string;
  label: string;
  Icon: LucideIcon;
  match: (path: string) => boolean;
};

/** Single source of truth for the herder app's primary navigation. */
export const NAV_TABS: NavTab[] = [
  { href: "/", label: mn.nav.home, Icon: MapPinned, match: (p) => p === "/" },
  {
    href: "/herd",
    label: mn.nav.herd,
    Icon: Layers,
    match: (p) => p.startsWith("/herd"),
  },
  {
    href: "/alerts",
    label: mn.nav.alerts,
    Icon: Bell,
    match: (p) => p.startsWith("/alerts"),
  },
  {
    href: "/weather",
    label: mn.nav.weather,
    Icon: CloudSun,
    match: (p) => p.startsWith("/weather"),
  },
  {
    href: "/profile",
    label: mn.nav.profile,
    Icon: UserRound,
    match: (p) => p.startsWith("/profile"),
  },
];
