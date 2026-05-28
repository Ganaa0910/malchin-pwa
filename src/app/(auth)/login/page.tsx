"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, ShieldCheck, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mn } from "@/lib/i18n/mn";

type Stage = "phone" | "otp";

export default function LoginPage() {
  const [stage, setStage] = useState<Stage>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const router = useRouter();

  function sendCode(e: React.FormEvent) {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 8) return;
    setStage("otp");
  }

  function verify(e: React.FormEvent) {
    e.preventDefault();
    if (code.length < 4) return;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("malchin.authenticated", "1");
    }
    router.push("/");
  }

  return (
    <main className="min-h-dvh pt-safe pb-safe flex flex-col px-5">
      <header className="pt-4 pb-2">
        <span className="font-display text-base">{mn.app.name}</span>
      </header>

      <div className="flex-1 flex flex-col justify-center gap-6 max-w-sm w-full mx-auto">
        <div
          className="size-16 rounded-md border-card bg-card flex items-center justify-center mx-auto"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          {stage === "phone" ? (
            <Phone className="size-7 text-primary" aria-hidden />
          ) : (
            <ShieldCheck className="size-7 text-primary" aria-hidden />
          )}
        </div>

        <div className="text-center space-y-1">
          <h1 className="font-display text-2xl leading-tight">
            {mn.login.title}
          </h1>
          <p className="text-sm text-muted-foreground">{mn.login.helper}</p>
        </div>

        {stage === "phone" ? (
          <form onSubmit={sendCode} className="space-y-3">
            <label htmlFor="phone" className="block">
              <span className="block text-sm font-medium mb-1.5">
                {mn.login.phoneLabel}
              </span>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={mn.login.phonePlaceholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="tap text-lg font-mono tracking-wider"
              />
            </label>
            <Button
              type="submit"
              size="lg"
              className="tap w-full"
              disabled={phone.replace(/\D/g, "").length < 8}
            >
              {mn.login.sendCode}
              <ChevronRight className="size-4 ml-1" aria-hidden />
            </Button>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-3">
            <label htmlFor="code" className="block">
              <span className="block text-sm font-medium mb-1.5">
                {mn.login.codeLabel}
              </span>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d*"
                maxLength={4}
                placeholder={mn.login.codePlaceholder}
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                className="tap text-2xl font-mono tracking-[0.5em] text-center"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Туршилтын горим — ямар ч 4 оронтой код болно.
              </p>
            </label>
            <Button
              type="submit"
              size="lg"
              className="tap w-full"
              disabled={code.length < 4}
            >
              {mn.login.verify}
            </Button>
            <button
              type="button"
              onClick={() => setStage("phone")}
              className="tap w-full text-sm text-muted-foreground py-1"
            >
              {mn.login.resend}
            </button>
          </form>
        )}
      </div>

      <p className="text-[10px] uppercase tracking-wider text-muted-foreground text-center pb-4 font-mono">
        v0.0.1 · MVP
      </p>
    </main>
  );
}
