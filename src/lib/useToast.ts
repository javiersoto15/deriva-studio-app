"use client";

// Companion toast queue — Recipe Rule 11.
// Max 1 visible at a time. New pushes queue; queue auto-shifts on dismiss.
// `pendingRedirect` lets non-React error handlers (QueryCache/MutationCache)
// request a navigation; the Toaster component bridges the actual router call.

import { create } from "zustand";

export type ToastVariant = "success" | "info" | "warn" | "error" | "micro";

export type Toast = {
  id: string;
  variant: ToastVariant;
  line: string;            // Plex Mono fact / tracked label
  italic?: string;         // Optional Cormorant italic line
  durationMs?: number;     // Default 4000 for success/info/micro; 6000 for warn/error
};

type ToastStore = {
  toasts: Toast[];
  pendingRedirect: string | null;
  // Signature → epoch ms of last push. Used to enforce a cooldown so the same
  // toast can't re-fire repeatedly (e.g. on React Query retry storms).
  _lastPushAt: Record<string, number>;
  push: (toast: Omit<Toast, "id"> & { id?: string }) => string;
  dismiss: (id: string) => void;
  clear: () => void;
  setPendingRedirect: (path: string | null) => void;
};

const COOLDOWN_MS = 15_000;

function signature(t: { variant: ToastVariant; line: string; italic?: string }): string {
  return `${t.variant}::${t.line}::${t.italic ?? ""}`;
}

function defaultDuration(variant: ToastVariant): number {
  return variant === "warn" || variant === "error" ? 6000 : 4000;
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  pendingRedirect: null,
  _lastPushAt: {},
  push: (toast) => {
    const id = toast.id ?? makeId();
    const durationMs = toast.durationMs ?? defaultDuration(toast.variant);
    const next: Toast = { ...toast, id, durationMs };
    const sig = signature(next);
    const now = Date.now();
    let inserted = true;
    set((state) => {
      // Cooldown — drop if the same signature was pushed within the window.
      // Survives auto-dismiss between pushes (in-queue dedupe alone doesn't).
      const last = state._lastPushAt[sig] ?? 0;
      if (now - last < COOLDOWN_MS) {
        inserted = false;
        return state;
      }
      // In-queue dedupe (belt-and-suspenders for simultaneous pushes).
      if (state.toasts.some((t) => signature(t) === sig)) {
        inserted = false;
        return state;
      }
      return {
        toasts: [...state.toasts, next],
        _lastPushAt: { ...state._lastPushAt, [sig]: now }
      };
    });
    return inserted ? id : "";
  },
  dismiss: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
  clear: () => set({ toasts: [], _lastPushAt: {} }),
  setPendingRedirect: (path) => set({ pendingRedirect: path })
}));
