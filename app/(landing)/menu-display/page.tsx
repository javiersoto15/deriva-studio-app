import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Image from "next/image";
import {
  menuSections,
  PRICING_OPEN_AT,
  type MenuItem,
  type MenuSection as MenuSectionType,
  type MenuSubgroup,
  type MenuAddons,
  type Schedule
} from "../../../src/data/menu";
import { getTemporarilyUnavailableItemIds } from "../../../src/data/apertura-windows";
import {
  getCurrentSchedule,
  isClosedToday,
  matchesSchedule
} from "../../../src/data/menu-schedule";
import {
  MENU_EJECUTIVO_FIXED,
  MENU_EJECUTIVO_TODAY,
  getMenuEjecutivoDateLabel
} from "../../../src/data/menu-ejecutivo";
import { getPublicMenuView, type ExecutiveMenu } from "../../../src/api/server";
import { LogoLockup } from "../../../src/ui/LogoLockup";
import { getEditionMark } from "../../../src/lib/edition";
import "./menu-display.css";

export const metadata: Metadata = {
  title: "Carta · Display",
  description: "Carta del día — pantalla de barra.",
  robots: { index: false, follow: false }
};

export const viewport: Viewport = { themeColor: "#F4EFE6" };

// LiveMenuDisplay calls connection() to render per request, so the page
// always reflects the current schedule + Menu Ejecutivo date. The shop
// browser keeps the tab open; rendering happens server-side each load.

// Section layout for signage: left/right columns mirror Paper artboards
// 74K-0 (weekend) and 7D0-0 (weekday). New sections added to menu.ts will
// fall through to the right column unless explicitly listed here.
const LEFT_SECTIONS = ["cafeteria", "croissants", "baguettes", "tostadas", "focaccias"] as const;

// Dense Pastelería renders as a 2-col inner grid; everything else uses the
// standard name·meta·price row treatment.
const DENSE_PASTRY_ID = "pasteleria";

function chileNow(): Date {
  return new Date();
}

function filterItems(
  items: readonly MenuItem[] | undefined,
  current: Schedule,
  unavailable: ReadonlySet<string>
): MenuItem[] {
  if (!items) return [];
  return items.filter(
    (it) =>
      matchesSchedule(current, it.schedule) &&
      !it.unavailable &&
      !unavailable.has(it.id)
  );
}

function filterSubgroups(
  subgroups: readonly MenuSubgroup[] | undefined,
  current: Schedule,
  unavailable: ReadonlySet<string>
): MenuSubgroup[] {
  if (!subgroups) return [];
  return subgroups
    .filter((g) => matchesSchedule(current, g.schedule))
    .map((g) => ({ ...g, items: filterItems(g.items, current, unavailable) }))
    .filter((g) => g.items.length > 0);
}

function formatPrice(item: MenuItem, showPrices: boolean): string | null {
  if (!showPrices) return null;
  if (item.priceLabel) return item.priceLabel;
  if (typeof item.priceClp === "number") {
    return `$${item.priceClp.toLocaleString("es-CL")}`;
  }
  return null;
}

function Row({ item, showPrices }: { item: MenuItem; showPrices: boolean }) {
  const price = formatPrice(item, showPrices);
  // Description doubles as meta when there's no `meta` field — keeps the row
  // single-line, which is what the signage needs at this density.
  const subline = item.meta ?? item.description.split(".")[0];
  const isMeta = !!item.meta;
  return (
    <div className="md-row">
      <span className="md-row__name">{item.name}</span>
      <span className={isMeta ? "md-row__meta" : "md-row__desc"}>{subline}</span>
      {price ? <span className="md-row__price">{price}</span> : null}
    </div>
  );
}

function PastryRow({ item, showPrices }: { item: MenuItem; showPrices: boolean }) {
  const price = formatPrice(item, showPrices);
  return (
    <div className="md-pastry__row">
      <span className="md-pastry__name">{item.name}</span>
      {price ? <span className="md-pastry__price">{price}</span> : null}
    </div>
  );
}

function Addons({ addons }: { addons: MenuAddons | MenuAddons[] }) {
  const list = Array.isArray(addons) ? addons : [addons];
  return (
    <>
      {list.map((a, i) => (
        <div className="md-addon" key={`${a.label}-${i}`}>
          <span className="md-addon__label">{a.label}</span>
          <span className="md-addon__chips">{a.chips.join(" · ")}</span>
        </div>
      ))}
    </>
  );
}

function SectionBlock({
  section,
  showPrices,
  current,
  unavailable
}: {
  section: MenuSectionType;
  showPrices: boolean;
  current: Schedule;
  unavailable: ReadonlySet<string>;
}) {
  const subgroups = filterSubgroups(section.subgroups, current, unavailable);
  const items = filterItems(section.items, current, unavailable);
  // Addons-only doesn't justify a section block on signage — drop entirely.
  if (items.length === 0 && subgroups.length === 0) return null;

  // Pastelería dense list: flatten all subgroups into a 2-col grid per
  // subgroup label. Cap each subgroup to a handful of items and tell the
  // customer to ask at the vitrina for the full selection — signage was
  // overflowing the 1920px stage with the full list.
  if (section.id === DENSE_PASTRY_ID) {
    return (
      <div className="md-sec">
        <SectionHead section={section} />
        {subgroups.map((g) => (
          <PastryGroup key={g.id} group={g} showPrices={showPrices} />
        ))}
        <span className="md-pastry__more">
          — pregunta en vitrina por la selección completa —
        </span>
      </div>
    );
  }

  return (
    <div className="md-sec">
      <SectionHead section={section} />
      {items.length > 0 ? (
        <div className="md-sub" style={{ paddingTop: 4 }}>
          {items.map((it) => (
            <Row key={it.id} item={it} showPrices={showPrices} />
          ))}
        </div>
      ) : null}
      {subgroups.map((g) => (
        <div className="md-sub" key={g.id}>
          <span className="md-sub__label">{g.label}</span>
          {g.items.map((it) => (
            <Row key={it.id} item={it} showPrices={showPrices} />
          ))}
          {g.addons ? <Addons addons={g.addons} /> : null}
        </div>
      ))}
      {section.addons ? <Addons addons={section.addons} /> : null}
    </div>
  );
}

function SectionHead({ section }: { section: MenuSectionType }) {
  const titleClass =
    section.emphasis === "utility" ? "md-sec__title md-sec__title--utility" : "md-sec__title";
  const renderTitle = () => {
    if (section.italicWord) {
      // Split title like "Pastelería y " + italic "Dulces."
      return (
        <span className={titleClass}>
          <span style={{ fontStyle: "normal" }}>{section.title}</span>{" "}
          {section.italicWord}
        </span>
      );
    }
    return <span className={titleClass}>{section.title}</span>;
  };
  return (
    <div className="md-sec__head">
      <div className="md-sec__title-row">
        <span className="md-sec__numeral">§ {section.numeral}</span>
        {renderTitle()}
      </div>
      <span className="md-sec__lede">{section.lede}</span>
      {section.serviceWindow ? (
        <span className="md-sec__service">{section.serviceWindow}</span>
      ) : null}
    </div>
  );
}

// Show at most 4 dishes per Pastelería subgroup — full selection lives in
// the vitrina, signage stays at-a-glance.
const PASTRY_ITEMS_PER_GROUP = 4;

function PastryGroup({ group, showPrices }: { group: MenuSubgroup; showPrices: boolean }) {
  const capped = group.items.slice(0, PASTRY_ITEMS_PER_GROUP);
  const half = Math.ceil(capped.length / 2);
  const left = capped.slice(0, half);
  const right = capped.slice(half);
  return (
    <div className="md-sub">
      <span className="md-sub__label">{group.label}</span>
      <div className="md-pastry">
        <div className="md-pastry__col">
          {left.map((it) => (
            <PastryRow key={it.id} item={it} showPrices={showPrices} />
          ))}
        </div>
        <div className="md-pastry__col">
          {right.map((it) => (
            <PastryRow key={it.id} item={it} showPrices={showPrices} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MenuEjecutivoBox({
  showPrices,
  backendExecutive
}: {
  showPrices: boolean;
  backendExecutive: ExecutiveMenu | null;
}) {
  // Prefer backend data (resolves today's rotation server-side); fall back to
  // the local static constant if the API is unreachable so signage never
  // goes blank on a TV.
  const priceLabel =
    backendExecutive?.price_label ?? MENU_EJECUTIVO_FIXED.priceLabel;
  const subline = backendExecutive?.subline ?? MENU_EJECUTIVO_FIXED.subline;

  type Course = { tag: string; name: string; note?: string };
  const courses: Course[] = backendExecutive
    ? backendExecutive.courses.map((c) => ({ tag: c.tag, name: c.name, note: c.note }))
    : [
        {
          tag: MENU_EJECUTIVO_FIXED.courseTags.bebida,
          name: MENU_EJECUTIVO_TODAY.courses.bebida.name,
          note: MENU_EJECUTIVO_TODAY.courses.bebida.note
        },
        {
          tag: MENU_EJECUTIVO_FIXED.courseTags.entrada,
          name: MENU_EJECUTIVO_TODAY.courses.entrada.name,
          note: MENU_EJECUTIVO_TODAY.courses.entrada.note
        },
        {
          tag: MENU_EJECUTIVO_FIXED.courseTags.fondo,
          name: MENU_EJECUTIVO_TODAY.courses.fondo.name,
          note: MENU_EJECUTIVO_TODAY.courses.fondo.note
        },
        {
          tag: MENU_EJECUTIVO_FIXED.courseTags.queque,
          name: MENU_EJECUTIVO_TODAY.courses.queque.name,
          note: MENU_EJECUTIVO_TODAY.courses.queque.note
        }
      ];

  const CourseCol = ({ tag, name, note }: Course) => (
    <div className="md-ejec__course-col">
      <div className="md-ejec__course">
        <span className="md-ejec__tag">{tag}</span>
        <span className="md-ejec__dish">{name}</span>
      </div>
      {note ? <span className="md-ejec__note">{note}</span> : null}
    </div>
  );
  return (
    <div className="md-ejec">
      <div className="md-ejec__head">
        <div className="md-ejec__title-row">
          <span className="md-ejec__numeral">§ 07</span>
          <span className="md-ejec__title">Menu Ejecutivo.</span>
        </div>
        {showPrices ? (
          <span className="md-ejec__price">{priceLabel}</span>
        ) : null}
      </div>
      <span className="md-ejec__sub">{subline}</span>
      <div className="md-ejec__courses">
        {courses.map((c) => (
          <CourseCol key={c.tag} tag={c.tag} name={c.name} note={c.note} />
        ))}
      </div>
    </div>
  );
}

function splitByColumn(sections: MenuSectionType[]): {
  left: MenuSectionType[];
  right: MenuSectionType[];
} {
  const left: MenuSectionType[] = [];
  const right: MenuSectionType[] = [];
  for (const s of sections) {
    if ((LEFT_SECTIONS as readonly string[]).includes(s.id)) left.push(s);
    else right.push(s);
  }
  return { left, right };
}

function MenuDisplayShell({
  showPrices,
  current,
  unavailable,
  dateLabel,
  closedToday,
  editionMark,
  backendExecutive
}: {
  showPrices: boolean;
  current: Schedule;
  unavailable: ReadonlySet<string>;
  dateLabel: string;
  closedToday: boolean;
  editionMark: string;
  backendExecutive: ExecutiveMenu | null;
}) {
  const visible = menuSections.filter((s) => matchesSchedule(current, s.schedule));
  const { left, right } = splitByColumn(visible);

  // Signage is a show display — hide prices everywhere except the Menu
  // Ejecutivo block (where the $10.990 price is part of the program copy).
  const renderSection = (s: MenuSectionType) =>
    s.id === "menu-ejecutivo" ? (
      <MenuEjecutivoBox
        key={s.id}
        showPrices={showPrices}
        backendExecutive={backendExecutive}
      />
    ) : (
      <SectionBlock
        key={s.id}
        section={s}
        showPrices={false}
        current={current}
        unavailable={unavailable}
      />
    );

  return (
    <div className="md-stage">
      <header className="md-mast">
        <div className="md-mast__top">
          <div className="md-edition">
            <span className="md-edition__rule" aria-hidden />
            <span className="md-edition__label">{editionMark}</span>
          </div>
          <span className="md-mast__date">{dateLabel}</span>
        </div>
        <div className="md-mast__lockup">
          <LogoLockup
            isotipo={88}
            wordmarkSize={88}
            wordmarkLine={88}
            subSize={12}
            gap={22}
            isotipoColor="#1A1A1A"
            wordmarkColor="#1A1A1A"
          />
          <span className="md-mast__claim">la carta del día.</span>
        </div>
        <div className="md-mast__service">
          <span className="md-mast__where">Magnere 1570 · Local 105 · Providencia</span>
          <span className="md-mast__hours">08:00 — cierre</span>
        </div>
      </header>

      {closedToday ? (
        <aside className="md-closed">
          <span className="md-closed__label">Cerrado hoy · Abrimos mañana</span>
        </aside>
      ) : null}

      <main className="md-body">
        <div className="md-col">{left.map(renderSection)}</div>
        <div className="md-col">{right.map(renderSection)}</div>
      </main>

      <footer className="md-colo">
        <div className="md-colo__left">
          <span className="md-colo__slogan">Tómate tu tiempo. Pide en barra.</span>
          <span className="md-colo__hours">
            {current === "weekend"
              ? "VIE 08:00 — CIERRE  ·  SAB 08:00 — CIERRE"
              : "LUN — JUE 08:00 — CIERRE  ·  Cocina 13:00 — 17:00  ·  Onces 17:00 — cierre"}
          </span>
        </div>
        <div className="md-colo__right">
          <div className="md-colo__qr-label">
            <span className="md-colo__qr-label-eyebrow">Carta completa</span>
            <span className="md-colo__qr-label-url">derivastudio.cl/menu</span>
          </div>
          <Image
            className="md-colo__qr"
            src="/brand/deriva-menu-qr-branded.png"
            alt="Escanea para ver la carta completa"
            width={200}
            height={200}
            priority
          />
        </div>
      </footer>
    </div>
  );
}

export async function LiveMenuDisplay() {
  await connection();
  const now = chileNow();
  const forceShow = process.env.DERIVA_SHOW_PRICES === "1";
  const showPrices = forceShow || Date.now() >= PRICING_OPEN_AT.getTime();
  const current = getCurrentSchedule(now);
  const unavailable = getTemporarilyUnavailableItemIds(now);
  const dateLabel = getMenuEjecutivoDateLabel(now);
  const closedToday = isClosedToday(now);
  const editionMark = getEditionMark(now);
  // Backend resolves today's Menu Ejecutivo courses; pull only that block.
  // Sections/items still come from menu.ts. If the API is unreachable the
  // box silently falls back to MENU_EJECUTIVO_TODAY.
  const publicMenu = await getPublicMenuView();
  const backendExecutive =
    publicMenu?.sections.find((s) => s.executive_menu)?.executive_menu ?? null;
  return (
    <MenuDisplayShell
      showPrices={showPrices}
      current={current}
      unavailable={unavailable}
      dateLabel={dateLabel}
      closedToday={closedToday}
      editionMark={editionMark}
      backendExecutive={backendExecutive}
    />
  );
}

export default function MenuDisplayPage() {
  return (
    <Suspense
      fallback={
        <MenuDisplayShell
          showPrices={false}
          current="weekday"
          unavailable={new Set()}
          dateLabel="HOY"
          closedToday={false}
          editionMark="Vol. 001 · Otoño"
          backendExecutive={null}
        />
      }
    >
      <LiveMenuDisplay />
    </Suspense>
  );
}
