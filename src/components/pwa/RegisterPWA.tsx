"use client";

import { useEffect } from "react";
import type { Serwist } from "@serwist/window";

declare global {
  interface Window {
    serwist?: Serwist;
  }
}

export function RegisterPWA() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (window.serwist === undefined) return;
    void window.serwist.register();
  }, []);
  return null;
}
