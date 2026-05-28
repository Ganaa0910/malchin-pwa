import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";
import { mn } from "@/lib/i18n/mn";

export default function ManagerStub() {
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
          className="size-16 rounded-md border bg-card flex items-center justify-center"
          
        >
          <Construction className="size-8 text-primary" />
        </div>
        <h1 className="text-2xl">{mn.manager.title}</h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          {mn.manager.description}
        </p>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {mn.manager.comingSoon}
        </p>
      </div>
    </main>
  );
}
