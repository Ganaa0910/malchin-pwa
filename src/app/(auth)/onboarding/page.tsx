"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPinned, CloudSnow, ShieldAlert, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mn } from "@/lib/i18n/mn";

type Step = {
  Icon: LucideIcon;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    Icon: MapPinned,
    title: mn.onboarding.step1Title,
    body: mn.onboarding.step1Body,
  },
  {
    Icon: CloudSnow,
    title: mn.onboarding.step2Title,
    body: mn.onboarding.step2Body,
  },
  {
    Icon: ShieldAlert,
    title: mn.onboarding.step3Title,
    body: mn.onboarding.step3Body,
  },
];

export default function OnboardingPage() {
  const [idx, setIdx] = useState(0);
  const router = useRouter();
  const step = STEPS[idx];
  const isLast = idx === STEPS.length - 1;

  function finish() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("malchin.onboarded", "1");
    }
    router.push("/login");
  }

  return (
    <main className="min-h-dvh pt-safe pb-safe flex flex-col px-5">
      <header className="flex items-center justify-between pt-3 pb-4">
        <span className="font-display text-base">{mn.app.name}</span>
        <button
          type="button"
          onClick={finish}
          className="tap text-sm text-muted-foreground px-2 -mr-2"
        >
          {mn.onboarding.skip}
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center text-center gap-5">
        <div
          className="size-24 rounded-full bg-primary/15 flex items-center justify-center"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <step.Icon className="size-12 text-primary" aria-hidden />
        </div>
        <div className="space-y-2 max-w-xs">
          <h1 className="font-display text-3xl leading-tight">{step.title}</h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            {step.body}
          </p>
        </div>
      </div>

      <div className="flex justify-center gap-1.5 pt-4 pb-4" aria-hidden>
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === idx ? "w-6 bg-primary" : "w-1.5 bg-muted",
            )}
          />
        ))}
      </div>

      <div className="pb-6">
        <Button
          size="lg"
          className="tap w-full"
          onClick={() => (isLast ? finish() : setIdx((i) => i + 1))}
        >
          {isLast ? mn.onboarding.start : mn.onboarding.next}
          <ChevronRight className="size-4 ml-1" aria-hidden />
        </Button>
      </div>
    </main>
  );
}
