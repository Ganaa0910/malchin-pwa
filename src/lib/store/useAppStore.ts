"use client";

import { create } from "zustand";

interface AppState {
  /** Alert id of an active breach overlay — null when nothing showing. */
  activeBreachId: string | null;
  showBreach: (alertId: string) => void;
  dismissBreach: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeBreachId: null,
  showBreach: (id) => set({ activeBreachId: id }),
  dismissBreach: () => set({ activeBreachId: null }),
}));
