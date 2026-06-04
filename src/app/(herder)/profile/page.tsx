import Link from "next/link";
import {
  PencilRuler,
  Sparkles,
  LogIn,
  UsersRound,
  ShieldCheck,
  LifeBuoy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";
import { mn } from "@/lib/i18n/mn";
import owner from "@/data/owner.json";

type MenuLink = {
  href: string;
  label: string;
  sub: string;
  Icon: LucideIcon;
  mobileOnly?: boolean;
};

const LINKS: MenuLink[] = [
  { href: "/help", label: mn.help.title, sub: mn.help.contact.title, Icon: LifeBuoy, mobileOnly: true },
  { href: "/geofence", label: mn.geofence.title, sub: "8 бүс", Icon: PencilRuler },
  { href: "/onboarding", label: "Дахин үзэх", sub: "3 алхам", Icon: Sparkles },
  { href: "/login", label: "Нэвтрэх", sub: "Жишээ", Icon: LogIn },
  { href: "/manager", label: mn.manager.title, sub: mn.manager.comingSoon, Icon: UsersRound },
  { href: "/admin", label: mn.admin.title, sub: mn.admin.comingSoon, Icon: ShieldCheck },
];

const INFO: { label: string; value: string }[] = [
  { label: mn.profile.phone, value: owner.phone },
  { label: mn.profile.aimag, value: owner.aimag },
  { label: mn.profile.sum, value: owner.sum },
  { label: mn.profile.bagh, value: owner.bagh },
  { label: mn.profile.baseCamp, value: owner.baseName },
];

export default function ProfilePage() {
  return (
    <div className="px-4 pb-nav pt-4 md:px-6 md:pt-5">
      {/* Hero / personal info */}
      <section className="mb-3.5 rounded-xl border border-line bg-surface p-5">
        <p className="font-mono text-[11px] uppercase tracking-wide text-mut">
          {mn.profile.owner}
        </p>
        <h1 className="mb-4 mt-1 text-[26px] font-bold leading-none">
          {owner.name}
        </h1>
        <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          {INFO.map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between border-b border-dashed border-line py-2.5 font-mono text-xs"
            >
              <dt className="text-mut">{label}</dt>
              <dd className="font-bold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Theme */}
      <section className="mb-3.5 rounded-xl border border-line bg-surface p-4">
        <h3 className="mb-3 font-mono text-xs font-bold uppercase tracking-wide text-mut">
          // {mn.theme.label}
        </h3>
        <ThemeToggle className="w-full" />
      </section>

      {/* Menu */}
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        {LINKS.map(({ href, label, sub, Icon, mobileOnly }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 border-b border-line px-4 py-3.5 text-sm font-semibold transition-colors last:border-0 hover:bg-bg-2",
              mobileOnly && "md:hidden",
            )}
          >
            <Icon className="size-[18px] shrink-0 text-mut-2" aria-hidden />
            <span className="min-w-0 flex-1">{label}</span>
            <span className="font-mono text-[11px] text-mut">{sub}</span>
            <span aria-hidden className="text-mut-2">
              ›
            </span>
          </Link>
        ))}
      </div>

      <p className="pt-5 text-center font-mono text-[11px] text-mut-2">
        Belchee v0.0.1
      </p>
    </div>
  );
}
