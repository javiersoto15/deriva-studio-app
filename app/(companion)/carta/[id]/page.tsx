import type { Metadata } from "next";
import { Suspense } from "react";

import { getTranslations } from "next-intl/server";

import { getMenuItem } from "../../../../src/api/server";
import { getActiveBackendLocale } from "../../../../src/i18n/server";
import { colors } from "../../../../src/design/tokens";
import { Chip } from "../../../../src/ui/Chip";
import { Eyebrow } from "../../../../src/ui/Eyebrow";
import {
  ItemBackLink,
  ItemBodyFallback,
  ItemSaveButton,
  ItemUsualCta
} from "./_components/ItemActions";
import { ItemPriceRow, OriginPriceList } from "./_components/OriginPriceList";

// Item detail (non-origin) — matches Paper artboard 26X-0. Zero green moments.
// Phase 2B.5 — Converted to RSC. Spec sheet, allergens, barista note are all
// server-rendered HTML. The favorite/usual buttons are the only client island.
// Phase 2B.6 — generateMetadata sets <title> to the item name for SEO + share.
//
// Locale: the localized item copy (name/description/spec/allergens/barista
// note) comes from the backend via ?locale. getActiveBackendLocale() reads the
// NEXT_LOCALE cookie, so the body fetch lives inside a <Suspense> boundary
// (cacheComponents requires cookie reads to be wrapped).

const FALLBACK_SPEC = [
  { label: "TUESTE", value: "Medio · house blend" },
  { label: "ORIGEN", value: "House Blend · DACH" },
  { label: "LECHE", value: "Entera Colún" },
  { label: "EXTRACCIÓN", value: "18g · 30s · 36g" },
  { label: "VOLUMEN", value: "170 ml" }
];

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const locale = await getActiveBackendLocale();
  const item = await getMenuItem(id, locale);
  return { title: item?.name ?? "Carta" };
}

const labelStyle = {
  fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
  fontWeight: 600,
  fontSize: 10,
  letterSpacing: "0.22em",
  textTransform: "uppercase" as const,
  color: colors.inkMuted
};

export default async function ItemDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main
      style={{
        flex: 1,
        padding: "24px 24px 32px",
        display: "flex",
        flexDirection: "column",
        gap: 24
      }}
    >
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <ItemBackLink />
        <ItemSaveButton itemId={id} />
      </header>

      <Suspense fallback={<ItemBodyFallback />}>
        <ItemBody id={id} />
      </Suspense>
    </main>
  );
}

// Locale-dependent body. Isolated so the getActiveBackendLocale() cookie read
// sits behind <Suspense> (PPR / cacheComponents requirement). `getMenuItem`
// returns null on failure so the page still renders for crawlers + shared links.
async function ItemBody({ id }: { id: string }) {
  const locale = await getActiveBackendLocale();
  const [data, t] = await Promise.all([
    getMenuItem(id, locale),
    getTranslations("menu")
  ]);

  const spec = data?.spec ?? FALLBACK_SPEC;
  const allergens = data?.allergens ?? [];
  const originOptions = data?.origin_options ?? [];

  return (
    <>
      <Eyebrow>{data?.section_eyebrow ?? "Espresso · Con leche"}</Eyebrow>

      <div>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display), serif",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 44,
            lineHeight: "50px",
            letterSpacing: "-0.01em",
            color: colors.ink900
          }}
        >
          {data?.name ?? "Flat White"}
        </h1>
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            color: colors.inkMuted,
            letterSpacing: "0.1em"
          }}
        >
          {data?.size_note ?? "6 OZ · MICROESPUMA SEDOSA"}
        </span>
      </div>

      {/* Price row — always the backend price_clp. Prefixed with the localized
          "Desde" only when the available origins carry more than one price. */}
      <ItemPriceRow
        priceClp={data?.price_clp}
        origins={originOptions}
        label={t("price")}
        fromPrefix={t("price_from")}
      />

      <OriginPriceList
        origins={originOptions}
        label={t("origins")}
        defaultMarker={t("default_origin")}
      />

      {/* Spec sheet */}
      <section style={{ display: "flex", flexDirection: "column" }}>
        {spec.map((row) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 0",
              borderTop: `1px solid ${colors.hairline}`
            }}
          >
            <span style={labelStyle}>{row.label}</span>
            <span
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 13,
                color: colors.ink900,
                textAlign: "right"
              }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </section>

      {/* Allergens */}
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <span style={labelStyle}>{t("contains")}</span>
        {allergens.length > 0 ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {allergens.map((a) => (
              <Chip key={a} selected={false}>
                {a}
              </Chip>
            ))}
          </div>
        ) : (
          <span
            style={{
              fontFamily: "var(--font-display), serif",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: 15,
              color: colors.inkMuted
            }}
          >
            {t("no_allergens")}
          </span>
        )}
      </section>

      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-display), serif",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: 15,
          lineHeight: "23px",
          color: colors.ink900
        }}
      >
        {data?.barista_note ?? "Pídelo más caliente si vienes de la calle — la microespuma aguanta."}
      </p>

      <ItemUsualCta itemId={id} />
    </>
  );
}
