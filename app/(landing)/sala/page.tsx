import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { DerivaImage } from "../../../src/components/landing/DerivaImage";
import type { PhotoSlug } from "../../../src/data/photos";
import { LogoLockup } from "../../../src/ui/LogoLockup";
import { CrossfadeRotator } from "../../../src/components/landing/CrossfadeRotator";
import { SalaKiosk } from "./SalaKiosk";
import { getEditionMarkUppercase, getEditionParts } from "../../../src/lib/edition";
import {
  getPublicMenuView,
  getPublicExecutiveMenu,
  type ExecutiveMenu,
  type PublicMenuView,
  type PublicMenuSection,
  type PublicMenuItem
} from "../../../src/api/server";
import "./sala.css";

export const metadata: Metadata = {
  // `absolute` stops the root template appending SITE_NAME — this is not a
  // paid landing destination, so it carries the brand and nothing else.
  title: { absolute: "Sala · Deriva Coffee Studio" },
  description: "Pantalla horizontal de sala — la edición viva de Deriva.",
  robots: { index: false, follow: false }
};

export const viewport: Viewport = { themeColor: "#FAF5EC" };

// ---- Live → Sala shapes ----------------------------------------------------
// Signage renders the backend's PublicMenuView verbatim (names, meta,
// price_label, signature) — the same contract /menu obeys — and degrades to a
// curated fallback only when the backend is unreachable (e.g. build-time
// prerender). Prices are never invented here.
type SalaItem = { name: string; price?: string; meta?: string; signature?: boolean };
type SalaColumn = { title: string; items: SalaItem[] };
type SalaEjecutivo = {
  priceLabel: string;
  courses: { tag: string; name: string; note?: string }[];
};

const FALLBACK_COLUMNS: SalaColumn[] = [
  {
    title: "Cafetería",
    items: [
      { name: "Espresso", price: "$3.000", meta: "60 ML · CACAO Y PANELA" },
      { name: "Flat White", price: "$4.200", meta: "200 ML · LECHE SEDOSA" },
      { name: "Cappuccino", price: "$4.000", meta: "200 ML · ESPUMA DENSA" },
      { name: "Pour Over", price: "$3.800", meta: "ORIGEN ROTATIVO", signature: true },
      { name: "Cortado", price: "$3.200", meta: "90 ML · RATIO 1:1" }
    ]
  },
  {
    title: "Cocina",
    items: [
      { name: "Huevos Pochados", price: "$9.900", meta: "MASA MADRE · PALTA · YEMA" },
      { name: "Croissant Kasler", price: "$6.900", meta: "CERDO AHUMADO", signature: true },
      { name: "Tostada Italiana", price: "$7.500", meta: "JAMÓN SERRANO · TOMATE" },
      { name: "Avocado Toast", price: "$7.900", meta: "PALTA · HUEVO · LIMONETA" },
      { name: "Empanada de Pino", price: "$2.800", meta: "HORNEADA AL MOMENTO" }
    ]
  }
];

// Price source mirrors the carta (src/ui/MenuRow.tsx + src/components/menu/
// MenuItem.tsx): price_label is an optional override; the real value lives in
// the price_clp number, formatted es-CL ("$ 3.000").
function formatPrice(i: PublicMenuItem): string | undefined {
  if (i.price_label) return i.price_label;
  if (typeof i.price_clp === "number") return `$ ${i.price_clp.toLocaleString("es-CL")}`;
  return undefined;
}

function toSalaItem(i: PublicMenuItem): SalaItem {
  return {
    name: i.name,
    price: formatPrice(i),
    meta: i.meta,
    signature: i.signature
  };
}

// Resolve a single live item by matching on NAME (not id) — the backend's Mate
// carries a stale id ("capuccino"), so name is the only reliable key. Searches
// every section + subgroup. Returns undefined when the item isn't in the live
// payload (e.g. the Bagel, created in SumUp but not yet surfaced by /public/menu).
function findItemByName(
  view: PublicMenuView | null,
  matcher: RegExp
): PublicMenuItem | undefined {
  if (!view) return undefined;
  for (const s of view.sections) {
    for (const grp of [s, ...(s.subgroups ?? [])]) {
      for (const i of grp.items ?? []) {
        if (i.available !== false && matcher.test(i.name)) return i;
      }
    }
  }
  return undefined;
}

// Hero price for the feature cards + Destacado: live price wins (price_label or
// "$4.900" from price_clp — no space, to match the plate's display), curated
// fallback when the item is absent. Mate resolves live; Espresso Tropical (a
// signature item) and the Bagel use fallbacks today and auto-upgrade the moment
// the backend lists them.
function heroPrice(view: PublicMenuView | null, matcher: RegExp, fallback: string): string {
  const i = findItemByName(view, matcher);
  if (!i) return fallback;
  if (i.price_label) return i.price_label;
  if (typeof i.price_clp === "number") return `$${i.price_clp.toLocaleString("es-CL")}`;
  return fallback;
}

// The two live drink cards in the Barra rail (portrait, full-bleed photo).
type SalaFeature = {
  slug: PhotoSlug;
  alt: string;
  objectPosition: string;
  kicker: string;
  name: string;
  price: string;
  priceMeta: string;
};

function flattenItems(s: PublicMenuSection): PublicMenuItem[] {
  const direct = s.items ?? [];
  const sub = (s.subgroups ?? []).flatMap((g) => g.items ?? []);
  return [...direct, ...sub].filter((i) => i.available !== false);
}

// Retail "Café para llevar" sections (whole-bean bags) read poorly as a
// now-serving column — detect them by title OR by bag-like item names
// ("Bolsa…", "250 g") so they're skipped even if the title is generic.
const COFFEE_RE = /cafeter|espresso|barra/i;
function isRetailSection(s: PublicMenuSection, items: PublicMenuItem[]): boolean {
  if (/llevar|bolsa|grano|retail|tienda/i.test(`${s.id} ${s.title}`)) return true;
  if (items.length === 0) return false;
  const bagish = items.filter((i) => /bolsa|grano|\b\d+\s?(g|kg)\b/i.test(i.name)).length;
  return bagish / items.length >= 0.5;
}

// The two list columns are chosen from the live view (executive_menu section
// excluded — it owns the strip): the coffee/barra section leads, paired with
// the richest non-retail (food) section, ranked by emphasis then item count.
// Their own titles become the column heads (rendered verbatim). Falls back to
// the curated set when the backend is unreachable (e.g. build-time prerender).
function salaColumns(view: PublicMenuView | null): SalaColumn[] {
  if (!view) return FALLBACK_COLUMNS;
  const emph = (e: PublicMenuSection["emphasis"]) =>
    e === "hero" ? 2 : e === "primary" ? 1 : 0;

  const cand = view.sections
    .filter((s) => !s.executive_menu)
    .map((s) => ({ s, items: flattenItems(s) }))
    .filter((x) => x.items.length > 0);
  if (cand.length === 0) return FALLBACK_COLUMNS;

  const nonRetail = cand.filter((x) => !isRetailSection(x.s, x.items));
  const ranked = [...(nonRetail.length ? nonRetail : cand)].sort(
    (a, b) => emph(b.s.emphasis) - emph(a.s.emphasis) || b.items.length - a.items.length
  );

  const coffee = ranked.find((x) => COFFEE_RE.test(`${x.s.id} ${x.s.title}`));
  const lead = coffee ?? ranked[0];
  const second = ranked.find((x) => x.s.id !== lead.s.id);
  const picks = second ? [lead, second] : [lead];

  const cols = picks.map((x) => ({
    title: x.s.title,
    items: x.items.slice(0, 5).map(toSalaItem)
  }));
  const total = cols.reduce((n, c) => n + c.items.length, 0);
  return total >= 2 ? cols : FALLBACK_COLUMNS;
}

function salaEjecutivo(ex: ExecutiveMenu | null): SalaEjecutivo | null {
  if (!ex?.courses?.length) return null;
  return {
    priceLabel: ex.price_label,
    courses: ex.courses.map((c) => ({
      tag: c.tag.toUpperCase(),
      name: c.name,
      note: c.note
    }))
  };
}

function santiagoHour(now: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/Santiago",
      hour: "2-digit",
      hour12: false
    }).format(now)
  );
}

// Menu Ejecutivo runs Lunes a viernes (Fri included — NOT the carta's
// getCurrentSchedule, which treats Friday as weekend).
function isWeekday(now: Date): boolean {
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Santiago",
    weekday: "short"
  }).format(now);
  return wd !== "Sat" && wd !== "Sun";
}

const PAGE_DOTS = ["sala-1", "sala-2", "sala-3", "sala-4"];

function Dots({ active, dark }: { active: number; dark?: boolean }) {
  return (
    <div className={`sala-dots${dark ? " sala-dots--dark" : ""}`} aria-hidden="true">
      {PAGE_DOTS.map((k, i) => (
        <i key={k} className={i === active ? "on" : ""} />
      ))}
    </div>
  );
}

// ---- Plate 01 · Portada (split cover) --------------------------------------
function SalaPortada({ edition }: { edition: { season: string; week: string } }) {
  return (
    <main className="sala-plate sala-portada" aria-label="Portada — la edición de hoy">
      <div className="sala-portada__col">
        <div className="sala-runhead">
          <span>VOL. 001 · SALA — EN VIVO</span>
          <span>PROVIDENCIA — CHILE · MMXXVI</span>
        </div>

        <div className="sala-portada__lockup">
          <LogoLockup
            isotipo={56}
            wordmarkSize={44}
            wordmarkLine={40}
            subSize={12}
            gap={16}
            isotipoColor="#1A1410"
            wordmarkColor="#1A1410"
          />
        </div>

        <div className="sala-portada__claimwrap">
          <span className="sala-kicker">§ 01 · LA FRASE DE LA CASA</span>
          <div className="sala-portada__claim">
            <b>Un coffee,</b>
            <b>
              a la <span className="green">Deriva.</span>
            </b>
          </div>
          <p className="sala-portada__lede">
            Café de especialidad, cocina lenta y mesa larga. Una ronda a la vez — y la
            siguiente, cuando la pidas.
          </p>
        </div>

        <div className="sala-portada__foot">
          <div className="sala-portada__foot-l">
            <span className="sala-microlabel">EDICIÓN DE TEMPORADA</span>
            <span className="sala-portada__season">{edition.season} · MMXXVI</span>
          </div>
          <div className="sala-portada__num">
            <small>№</small>
            <strong>{edition.week}</strong>
          </div>
        </div>
      </div>

      <div className="sala-portada__photo">
        <DerivaImage slug="bar" alt="La barra de Deriva" sizes="806px" priority fill />
        <div className="sala-photo-cap">
          <span className="sala-photo-cap__scrim" aria-hidden="true" />
          <span className="sala-photo-cap__k">LA BARRA · MAGNERE 1570</span>
          <span className="sala-photo-cap__t">Donde empieza la ronda.</span>
        </div>
      </div>
    </main>
  );
}

// ---- Plate 02 · Oficio (full-bleed craft) ----------------------------------
function SalaOficio({ editionMark }: { editionMark: string }) {
  return (
    <main className="sala-plate sala-oficio" aria-label="El oficio — método manual">
      <div className="sala-oficio__img" aria-hidden="true">
        <DerivaImage slug="pour-over" alt="Pour Over en Chemex" sizes="1920px" fill />
      </div>
      <span className="sala-scrim-top" aria-hidden="true" />
      <span className="sala-scrim-bot" aria-hidden="true" />

      <header className="sala-mast-over">
        <LogoLockup
          isotipo={40}
          wordmarkSize={30}
          wordmarkLine={28}
          subSize={9}
          gap={12}
          isotipoColor="#FAF5EC"
          wordmarkColor="#FAF5EC"
        />
        <span className="sala-mast-over__ed">{editionMark}</span>
      </header>

      <div className="sala-deckle">
        <div className="sala-deckle__body">
          <span className="sala-deckle__k">§ 02 · EL OFICIO — MÉTODO MANUAL</span>
          <span className="sala-deckle__t">El Filtrado</span>
          <span className="sala-deckle__sub">
            V60 o Chemex, según el grano del día. Taza limpia y dulce — pregunta por el
            origen de la semana.
          </span>
        </div>
        <Dots active={1} dark />
      </div>
    </main>
  );
}

// ---- Plate 03 · Destacado (split, editor's pick) ---------------------------
function SalaDestacado({ editionMark, price }: { editionMark: string; price: string }) {
  return (
    <main className="sala-plate sala-destacado" aria-label="El destacado de la carta">
      <div className="sala-destacado__photo">
        <DerivaImage
          slug="bagel-churrasco"
          alt="Bagel Churrasco Italiano"
          sizes="1114px"
          fill
          style={{ objectPosition: "center 55%" }}
        />
        <div className="sala-livetag">
          <i aria-hidden="true" />
          <span>EL DESTACADO · DE LA CARTA</span>
        </div>
      </div>

      <div className="sala-destacado__panel">
        <div className="sala-panelhead">
          <LogoLockup
            isotipo={32}
            wordmarkSize={24}
            wordmarkLine={22}
            subSize={8}
            gap={10}
            isotipoColor="#1A1410"
            wordmarkColor="#1A1410"
          />
          <span className="sala-panelhead__ed">{editionMark}</span>
        </div>

        <div className="sala-destacado__body">
          <span className="sala-kicker sala-kicker--brown">HOY · EL DESTACADO</span>
          <div>
            <div className="sala-destacado__name">Bagel</div>
            <div className="sala-destacado__name">Churrasco Italiano</div>
          </div>
          <p className="sala-destacado__desc">
            Churrasco de lomo, tomate, palta y mayo de la casa sobre bagel de sésamo.
          </p>
          <div className="sala-destacado__price">
            <small>DESDE</small>
            <strong>{price}</strong>
          </div>
        </div>

        <div className="sala-destacado__foot">
          <div className="sala-destacado__pair">
            <span className="sala-microlabel">VA BIEN CON</span>
            <em>un Cortado o un Espresso Tropical.</em>
          </div>
          <Dots active={2} />
        </div>
      </div>
    </main>
  );
}

// ---- Plate 04 · Ahora en la barra (live list) ------------------------------
function SalaBarra({
  columns,
  ejecutivo,
  showEjecutivo,
  features
}: {
  columns: SalaColumn[];
  ejecutivo: SalaEjecutivo | null;
  showEjecutivo: boolean;
  features: SalaFeature[];
}) {
  return (
    <main className="sala-plate sala-barra" aria-label="Ahora en la barra">
      <div className="sala-runhead">
        <span>VOL. 001 · SALA — EN VIVO</span>
        <span className="sala-runhead__live">
          <i className="sala-dot" aria-hidden="true" />
          ACTUALIZADO · CLP
        </span>
      </div>

      <div className="sala-barra__head">
        <div className="sala-barra__head-l">
          <span className="sala-kicker">§ 04 · AHORA EN LA BARRA</span>
          <div className="sala-barra__title">
            <em>Lo que está&nbsp;</em>
            <em className="green">saliendo.</em>
          </div>
        </div>
        <p className="sala-barra__note">La carta cambia con la cosecha. Esto es lo de hoy.</p>
      </div>

      <div className="sala-main">
        <div className="sala-lists">
          {columns.map((col) => (
            <div className="sala-col" key={col.title}>
              <div className="sala-col__head">— {col.title.toUpperCase()}</div>
              {col.items.map((it) => (
                <div
                  className={`sala-item${it.signature ? " sala-item--firma" : ""}`}
                  key={`${col.title}-${it.name}`}
                >
                  <div className="sala-item__row">
                    <span className="sala-item__name">{it.name}</span>
                    {it.price ? <span className="sala-item__price">{it.price}</span> : null}
                  </div>
                  {it.meta ? (
                    <span className="sala-item__meta">
                      {it.signature ? `DE FIRMA · ${it.meta}` : it.meta}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="sala-features">
          {features.map((f) => (
            <div className="sala-feat" key={f.slug}>
              <DerivaImage
                slug={f.slug}
                alt={f.alt}
                sizes="340px"
                fill
                style={{ objectPosition: f.objectPosition }}
              />
              <span className="sala-feat__scrim" aria-hidden="true" />
              <div className="sala-feat__cap">
                <span className="sala-feat__k">{f.kicker}</span>
                <span className="sala-feat__name">{f.name}</span>
                <div className="sala-feat__price">
                  <strong>{f.price}</strong>
                  <small>{f.priceMeta}</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showEjecutivo && ejecutivo ? (
        <div className="sala-ejec" aria-label="Menu Ejecutivo de hoy">
          <div className="sala-ejec__l">
            <span className="sala-ejec__k">MENÚ EJECUTIVO · LUN–VIE 13–16H</span>
            <span className="sala-ejec__hero">Una ronda completa.</span>
          </div>
          <div className="sala-ejec__courses">
            {ejecutivo.courses.map((c) => (
              <div className="sala-ejec__course" key={c.tag}>
                <small>{c.tag}</small>
                <em>{c.name}</em>
                {c.note ? <span className="sala-ejec__note">{c.note}</span> : null}
              </div>
            ))}
          </div>
          <span className="sala-ejec__price">{ejecutivo.priceLabel}</span>
        </div>
      ) : null}
    </main>
  );
}

// ---- Rotator (dynamic: reads time + live menu) -----------------------------
async function SalaRotator({
  searchParams
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await connection();
  const now = new Date();
  const editionMark = getEditionMarkUppercase(now);
  const parts = getEditionParts(now);
  const edition = {
    season: parts.seasonAndCampaign.split(" ")[0], // "Otoño"
    week: String(parts.isoWeek).padStart(2, "0")
  };

  const view = await getPublicMenuView({ locale: "es-CL" });
  const columns = salaColumns(view);
  const ejecutivo = salaEjecutivo(await getPublicExecutiveMenu("es-CL"));
  const showEjecutivo = isWeekday(now) && santiagoHour(now) < 16 && ejecutivo !== null;

  // Prices resolve from the live menu (name-matched); curated fallbacks cover
  // the build-time prerender and the Bagel (created in SumUp, not yet in the
  // public menu payload).
  const bagelPrice = heroPrice(view, /bagel/i, "$10.490");
  const features: SalaFeature[] = [
    {
      slug: "espresso-tropical",
      alt: "Espresso Tropical servido en vaso tallado",
      objectPosition: "center 44%",
      kicker: "DE FIRMA · FRÍA",
      name: "Espresso Tropical",
      price: heroPrice(view, /espresso\s*tropical/i, "$4.900"),
      priceMeta: "· 300 ML"
    },
    {
      slug: "mate",
      alt: "Mate de la casa, gourd grabado Deriva",
      objectPosition: "center 36%",
      kicker: "DE LA CASA · PARA COMPARTIR",
      name: "Mate",
      price: heroPrice(view, /^mate$/i, "$4.290"),
      priceMeta: "· TERMO INCLUIDO"
    }
  ];

  const plates = {
    portada: <SalaPortada edition={edition} />,
    oficio: <SalaOficio editionMark={editionMark} />,
    destacado: <SalaDestacado editionMark={editionMark} price={bagelPrice} />,
    barra: (
      <SalaBarra
        columns={columns}
        ejecutivo={ejecutivo}
        showEjecutivo={showEjecutivo}
        features={features}
      />
    )
  } as const;

  // QA hook: ?view=portada|oficio|destacado|barra renders one plate
  // solid (no rotation) so a panel can be checked any time. Read inside the
  // Suspense boundary so the dynamic access doesn't block the static shell.
  const { view: preview } = await searchParams;
  if (preview && preview in plates) {
    const node = plates[preview as keyof typeof plates];
    return <CrossfadeRotator className="sala-rotator" views={[{ key: preview, node }]} />;
  }

  // Dwell/lounge pacing: longer holds, the live list longest (most to read).
  const views = [
    { key: "portada", node: plates.portada, hold: 16 },
    { key: "oficio", node: plates.oficio, hold: 14 },
    { key: "destacado", node: plates.destacado, hold: 14 },
    { key: "barra", node: plates.barra, hold: 24 }
  ];

  return <CrossfadeRotator className="sala-rotator" views={views} />;
}

export default function SalaPage({
  searchParams
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  return (
    <div className="sala-fit">
      {/* Soft refresh (no hard reload) so the Fire TV Silk toolbar stays hidden;
          also best-effort fullscreen on first remote press. */}
      <SalaKiosk />
      {/* 16:9 fluid stage (see sala.css). */}
      <div className="sala-scale">
        <Suspense fallback={<div className="sala-rotator" />}>
          <SalaRotator searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
