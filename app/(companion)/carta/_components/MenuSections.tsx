"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import type {
  ExecutiveMenu,
  PublicMenuItem,
  PublicMenuSection,
  PublicMenuView
} from "../../../../src/api/hooks";
import { Chip } from "../../../../src/ui/Chip";
import { MenuRow } from "../../../../src/ui/MenuRow";
import { colors } from "../../../../src/design/tokens";

export function MenuSections({ menu }: { menu: PublicMenuView | null }) {
  const sections = menu?.sections ?? [];
  const [sectionId, setSectionId] = useState<string>(sections[0]?.id ?? "");
  const effectiveSectionId = sections.some((s) => s.id === sectionId)
    ? sectionId
    : sections[0]?.id ?? "";
  const activeSection = sections.find((s) => s.id === effectiveSectionId) ?? sections[0];
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
  }, [effectiveSectionId]);

  if (!menu) {
    return <MenuLoadingState />;
  }

  if (sections.length === 0) {
    return <MenuEmptyState />;
  }

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
      {menu.closed_today && menu.closed_label ? (
        <span
          style={{
            alignSelf: "flex-start",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: colors.inkMuted,
            border: `1px solid ${colors.hairline}`,
            borderRadius: 999,
            padding: "4px 10px"
          }}
        >
          {menu.closed_label}
        </span>
      ) : null}

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
        {sections.map((section) => (
          <Chip
            key={section.id}
            selected={section.id === activeSection?.id}
            onClick={() => setSectionId(section.id)}
          >
            {section.title}
          </Chip>
        ))}
      </div>

      <div
        ref={listRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorY: "contain",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 96px)"
        }}
      >
        {activeSection ? <SectionBody section={activeSection} /> : null}
      </div>
    </div>
  );
}

function SectionBody({ section }: { section: PublicMenuSection }) {
  const directItems = section.items ?? [];
  const subgroups = section.subgroups ?? [];
  const addons = section.addons ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionHeader section={section} />
      {section.executive_menu ? <ExecutiveMenuBlock menu={section.executive_menu} /> : null}
      {directItems.length > 0 ? <ItemList items={directItems} /> : null}
      {subgroups.map((subgroup) => (
        <div key={subgroup.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <SectionLabel>{subgroup.label}</SectionLabel>
          <ItemList items={subgroup.items ?? []} />
          {subgroup.addons ? <AddonBlock addons={[subgroup.addons]} /> : null}
        </div>
      ))}
      {addons.length > 0 ? <AddonBlock label={section.addons_before} addons={addons} /> : null}
    </div>
  );
}

function SectionHeader({ section }: { section: PublicMenuSection }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {section.service_window ? <SectionLabel>{section.service_window}</SectionLabel> : null}
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-display), serif",
          fontStyle: section.full_italic || section.italic_word ? "italic" : "normal",
          fontWeight: 400,
          fontSize: 28,
          lineHeight: 1.1,
          color: colors.ink900
        }}
      >
        {section.title}
        {section.italic_word ? ` ${section.italic_word}` : ""}
      </p>
      {section.lede ? (
        <p
          style={{
            margin: 0,
            fontFamily: "Poppins, sans-serif",
            fontStyle: section.lede_italic ? "italic" : "normal",
            fontWeight: 400,
            fontSize: 13,
            lineHeight: "19px",
            color: colors.inkMuted
          }}
        >
          {section.lede}
        </p>
      ) : null}
    </div>
  );
}

function ExecutiveMenuBlock({ menu }: { menu: ExecutiveMenu }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "14px 0",
        borderTop: `1px solid ${colors.hairline}`,
        borderBottom: `1px solid ${colors.hairline}`
      }}
    >
      <SectionLabel>{menu.hours}</SectionLabel>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <span
          style={{
            fontFamily: "var(--font-display), serif",
            fontSize: 22,
            lineHeight: 1.2,
            color: colors.ink900
          }}
        >
          {menu.hero}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 12,
            color: colors.ink900,
            whiteSpace: "nowrap",
            marginTop: 4
          }}
        >
          {menu.price_label}
        </span>
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: "Poppins, sans-serif",
          fontSize: 13,
          lineHeight: "19px",
          color: colors.inkMuted
        }}
      >
        {menu.subline}
      </p>
      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {menu.courses.map((course) => (
          <li
            key={course.id}
            style={{
              display: "grid",
              gridTemplateColumns: "28px 1fr",
              gap: 10,
              padding: "10px 0",
              borderTop: `1px solid ${colors.hairlineLight}`
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 11,
                color: colors.inkMuted
              }}
            >
              {course.numeral}
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: colors.inkMuted
                }}
              >
                {course.tag}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display), serif",
                  fontSize: 20,
                  lineHeight: 1.2,
                  color: colors.ink900
                }}
              >
                {course.name}
              </span>
              {course.note ? (
                <span
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: 12,
                    lineHeight: "17px",
                    color: colors.inkMuted
                  }}
                >
                  {course.note}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ItemList({ items }: { items: PublicMenuItem[] }) {
  const visibleItems = useMemo(() => items.filter(Boolean), [items]);
  if (visibleItems.length === 0) return null;

  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {visibleItems.map((item) => (
        <li key={item.id}>
          <MenuRow
            href={`/carta/${item.id}`}
            name={item.name}
            spec={item.description}
            priceClp={item.price_clp ?? 0}
            priceLabel={item.price_label}
            available={item.available}
          />
        </li>
      ))}
    </ul>
  );
}

function AddonBlock({
  label,
  addons
}: {
  label?: string;
  addons: NonNullable<PublicMenuSection["addons"]>;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
      {label ? <SectionLabel>{label}</SectionLabel> : null}
      {addons.map((addon) => (
        <div key={`${addon.label}-${addon.chips.join(",")}`} style={{ display: "grid", gap: 6 }}>
          <span
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 600,
              fontSize: 12,
              color: colors.ink900
            }}
          >
            {addon.label}
          </span>
          {addon.hint ? (
            <span
              style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: 12,
                lineHeight: "17px",
                color: colors.inkMuted
              }}
            >
              {addon.hint}
            </span>
          ) : null}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {addon.chips.map((chip) => (
              <span
                key={chip}
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 10,
                  color: colors.inkMuted,
                  border: `1px solid ${colors.hairline}`,
                  borderRadius: 999,
                  padding: "3px 8px"
                }}
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
        fontWeight: 600,
        fontSize: 10,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: colors.inkMuted
      }}
    >
      {children}
    </span>
  );
}

function MenuLoadingState() {
  const t = useTranslations("menu");
  return (
    <div style={{ flex: 1, paddingTop: 24 }}>
      <SectionLabel>{t("loading")}</SectionLabel>
    </div>
  );
}

function MenuEmptyState() {
  const t = useTranslations("menu");
  return (
    <div style={{ flex: 1, paddingTop: 24 }}>
      <SectionLabel>{t("unavailable")}</SectionLabel>
    </div>
  );
}
