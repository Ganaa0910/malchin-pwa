import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { mn } from "@/lib/i18n/mn";

export default function AdminStub() {
  return (
    <main className="mx-auto w-full max-w-[420px] min-h-dvh px-5 pt-safe pb-safe flex flex-col">
      <div className="pt-4">
        <Link
          href="/"
          aria-label="Буцах"
          className="tap inline-flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ArrowLeft className="size-4" /> Буцах
        </Link>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
        <div
          className="size-16 rounded-md border-card bg-card flex items-center justify-center"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <ShieldCheck className="size-8 text-primary" />
        </div>
        <h1 className="font-display text-2xl">{mn.admin.title}</h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          {mn.admin.description}
        </p>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {mn.admin.comingSoon}
        </p>
      </div>
    </main>
  );
}
