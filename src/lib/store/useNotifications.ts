"use client";

import { create } from "zustand";

/** warn = approaching a danger zone, deter = collar buzzer fired / turned back. */
export type NoticeKind = "warn" | "deter" | "info";

export interface Notice {
  id: string;
  kind: NoticeKind;
  title: string;
  body?: string;
  createdAt: number;
}

interface NotifyState {
  notices: Notice[];
  /** Push a notice. Pass a stable `id` to de-dupe/replace an existing one. */
  push: (n: Omit<Notice, "id" | "createdAt"> & { id?: string }) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

let seq = 0;
const MAX_VISIBLE = 4;

export const useNotifications = create<NotifyState>((set) => ({
  notices: [],
  push: (n) =>
    set((s) => {
      const id = n.id ?? `ntc-${Date.now()}-${seq++}`;
      const rest = s.notices.filter((x) => x.id !== id);
      const next = [...rest, { ...n, id, createdAt: Date.now() }];
      return { notices: next.slice(-MAX_VISIBLE) };
    }),
  dismiss: (id) =>
    set((s) => ({ notices: s.notices.filter((x) => x.id !== id) })),
  clear: () => set({ notices: [] }),
}));
