"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useRef,
  useState,
  useTransition
} from "react";
import { colors } from "../design/tokens";

export type TabKey = "carta" | "codigo" | "cartera" | "estudio";

export type TabBarProps = {
  active: TabKey;
};

const TABS: { key: TabKey; label: string; href: string }[] = [
  { key: "carta", label: "Carta", href: "/carta" },
  { key: "codigo", label: "Código", href: "/codigo" },
  { key: "cartera", label: "Cartera", href: "/cartera" },
  { key: "estudio", label: "Studio", href: "/estudio" }
];

// Rule 4 — Tab bar (text + tick underline). Phase 1D D2 — full keyboard semantics:
// role=tablist + tab, aria-selected, roving tabindex, arrow / Home / End navigation.
//
// Tier 4 — Optimistic active state. Tapping a tab kicks off a React transition
// + router.push and immediately flips the displayed active tab to the
// destination, so the tick underline travels with the tap rather than waiting
// for the new RSC to stream. While the transition is in flight we expose
// `aria-busy` on the nav for assistive tech.
export function TabBar({ active }: TabBarProps) {
  const router = useRouter();
  const refs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [isPending, startTransition] = useTransition();
  const [pendingTab, setPendingTab] = useState<TabKey | null>(null);

  // Clear the optimistic override once the URL has caught up (the parent
  // re-renders with `active` matching the destination).
  useEffect(() => {
    if (pendingTab && pendingTab === active) setPendingTab(null);
  }, [active, pendingTab]);

  const displayedActive: TabKey = pendingTab ?? active;

  function navigate(tab: TabKey, href: string) {
    if (tab === active) return;
    setPendingTab(tab);
    startTransition(() => router.push(href));
  }

  function focusTab(i: number) {
    const next = (i + TABS.length) % TABS.length;
    refs.current[next]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>, index: number) {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        focusTab(index + 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        focusTab(index - 1);
        break;
      case "Home":
        event.preventDefault();
        focusTab(0);
        break;
      case "End":
        event.preventDefault();
        focusTab(TABS.length - 1);
        break;
      case "Enter":
      case " ": {
        event.preventDefault();
        navigate(TABS[index].key, TABS[index].href);
        break;
      }
      default:
        break;
    }
  }

  function onClick(event: MouseEvent<HTMLAnchorElement>, tab: TabKey, href: string) {
    // Let modifier-clicks (cmd/ctrl/shift) and middle-clicks behave natively —
    // those open in new tab/window and shouldn't trigger our transition path.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    navigate(tab, href);
  }

  return (
    <nav
      role="tablist"
      aria-label="Navegación principal"
      aria-busy={isPending}
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        borderTop: `1px solid ${colors.hairline}`,
        display: "flex",
        justifyContent: "space-around",
        padding: "12px 0 max(12px, env(safe-area-inset-bottom))",
        backgroundColor: colors.beige100
      }}
    >
      {TABS.map((tab, index) => {
        const isActive = tab.key === displayedActive;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            ref={(el) => {
              refs.current[index] = el;
            }}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.key}`}
            id={`tab-${tab.key}`}
            tabIndex={isActive ? 0 : -1}
            onKeyDown={(e) => onKeyDown(e, index)}
            onClick={(e) => onClick(e, tab.key, tab.href)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              minHeight: 44,
              minWidth: 64,
              padding: "8px 12px",
              textDecoration: "none",
              color: isActive ? colors.brown700 : colors.inkMuted,
              fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
              fontWeight: 600,
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              // Color transition lets the active tick fade in/out smoothly when
              // the optimistic active flips on tap.
              transition: "color 140ms ease"
            }}
          >
            <span>{tab.label}</span>
            <span
              aria-hidden
              style={{
                width: 16,
                height: 1,
                backgroundColor: isActive ? colors.brown700 : "transparent",
                transition: "background-color 140ms ease"
              }}
            />
          </Link>
        );
      })}
    </nav>
  );
}
