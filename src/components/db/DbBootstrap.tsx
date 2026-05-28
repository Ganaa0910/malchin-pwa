"use client";

import { useEffect } from "react";
import { seedDb } from "@/lib/db";

/**
 * Mounts once at the herder layout. Idempotent.
 * Side-effect only — renders nothing.
 */
export function DbBootstrap() {
  useEffect(() => {
    void seedDb().catch((err) => {
      console.error("[malchin] seedDb failed", err);
    });
  }, []);
  return null;
}
