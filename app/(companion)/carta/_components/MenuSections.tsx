"use client";

import { useMemo, useRef, useState, useEffect } from "react";

import type { MenuView } from "../../../../src/api/hooks";
import { FRONTEND_REDIRECT_SECTIONS } from "../../../../src/api/menu-grouping";
import { Chip } from "../../../../src/ui/Chip";
import { MenuRow } from "../../../../src/ui/MenuRow";
import { colors } from "../../../../src/design/tokens";

// /carta is a fixed-chrome page: <main> doesn't scroll. MenuSections claims
// the remaining vertical space (flex: 1) and runs its own column layout —
// category strip + section strip at the top stay parked, the items <ul> below
// gets `overflow-y: auto` so only it scrolls. The result is the chrome stays
// pinned without `position: sticky` (which was fighting iOS Safari).
//
// Strips keep horizontal scrolling for sections that overflow; the native
// scrollbar is suppressed via the global `.scrollbar-hide` utility.
export function MenuSections({ menu }: { menu: MenuView }) {
  const [categoryId, setCategoryId] = useState<string>(menu.categories[0]?.id ?? "");
  const activeCategory =
    menu.categories.find((c) => c.id === categoryId) ?? menu.categories[0];

  const sectionIds = useMemo(
    () => (activeCategory?.sections ?? []).map((s) => s.id),
    [activeCategory]
  );
  const [sectionId, setSectionId] = useState<string>(sectionIds[0] ?? "");
  const effectiveSectionId = sectionIds.includes(sectionId) ? sectionId : sectionIds[0] ?? "";
  const activeSection =
    activeCategory?.sections.find((s) => s.id === effectiveSectionId) ??
    activeCategory?.sections[0];

  // Reset the items scroller to the top whenever the active section changes
  // so the user lands at the first item rather than mid-list.
  const listRef = useRef<HTMLUListElement | null>(null);
  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
  }, [effectiveSectionId, activeCategory?.id]);

  const showCategoryStrip = menu.categories.length > 1;
  const showSectionStrip = (activeCategory?.sections.length ?? 0) > 1;

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        gap: 12
      }}
    >
      {showCategoryStrip && (
        <div
          role="tablist"
          aria-label="Categorías"
          className="scrollbar-hide"
          style={{
            display: "flex",
            gap: 20,
            overflowX: "auto",
            flexShrink: 0,
            paddingBottom: 8,
            borderBottom: `1px solid ${colors.hairlineLight}`,
            touchAction: "pan-x"
          }}
        >
          {menu.categories.map((c) => {
            const active = c.id === (activeCategory?.id ?? "");
            return (
              <button
                key={c.id}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => {
                  setCategoryId(c.id);
                  setSectionId(c.sections[0]?.id ?? "");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "6px 0",
                  cursor: "pointer",
                  fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: active ? colors.brown700 : colors.inkMuted,
                  borderBottom: active
                    ? `1px solid ${colors.brown700}`
                    : "1px solid transparent",
                  marginBottom: -9,
                  whiteSpace: "nowrap",
                  flexShrink: 0
                }}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      )}

      {showSectionStrip && (
        <div
          className="scrollbar-hide"
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            flexShrink: 0,
            paddingBottom: 4,
            touchAction: "pan-x"
          }}
        >
          {activeCategory?.sections.map((s) => {
            const isRedirect = s.id in FRONTEND_REDIRECT_SECTIONS;
            const isActive = s.id === (activeSection?.id ?? "");
            return (
              <Chip
                key={s.id}
                selected={isActive}
                onClick={() => setSectionId(s.id)}
                style={isRedirect && !isActive ? { opacity: 0.45 } : undefined}
              >
                {s.name}
              </Chip>
            );
          })}
        </div>
      )}

      {activeSection && activeSection.id in FRONTEND_REDIRECT_SECTIONS ? (
        <SectionRedirectCard
          sectionName={activeSection.name}
          alternatives={(FRONTEND_REDIRECT_SECTIONS[activeSection.id] ?? [])
            .map((altId) => activeCategory?.sections.find((s) => s.id === altId))
            .filter((s): s is NonNullable<typeof s> => Boolean(s))}
          onPick={(id) => setSectionId(id)}
        />
      ) : (
        <ul
          ref={listRef}
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            paddingBottom: "calc(env(safe-area-inset-bottom) + 96px)",
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            overscrollBehaviorY: "contain"
          }}
        >
          {(activeSection?.items ?? []).map((item) => (
            <li key={item.id}>
              <MenuRow
                href={`/carta/${item.id}`}
                name={item.name}
                spec={item.description}
                priceClp={item.price_clp}
                available={item.available}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SectionRedirectCard({
  sectionName,
  alternatives,
  onPick
}: {
  sectionName: string;
  alternatives: ReadonlyArray<{ id: string; name: string }>;
  onPick: (id: string) => void;
}) {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        gap: 20,
        paddingTop: 32,
        paddingBottom: "calc(env(safe-area-inset-bottom) + 96px)"
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
          fontWeight: 600,
          fontSize: 10,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: colors.inkMuted
        }}
      >
        Vuelve pronto
      </span>
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-display), serif",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 28,
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          color: colors.ink900
        }}
      >
        {sectionName} llega más adelante.
      </p>
      {alternatives.length > 0 && (
        <>
          <p
            style={{
              margin: 0,
              fontFamily: "Poppins, sans-serif",
              fontWeight: 400,
              fontSize: 14,
              lineHeight: "20px",
              color: colors.inkMuted
            }}
          >
            Mientras tanto, prueba nuestras
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {alternatives.map((alt) => (
              <Chip key={alt.id} onClick={() => onPick(alt.id)}>
                {alt.name}
              </Chip>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
