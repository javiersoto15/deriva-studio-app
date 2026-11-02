"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

import type {
  PublicMenuAddon,
  PublicMenuItem,
  PublicMenuOffer,
  PublicMenuOfferItemPricing,
  PublicMenuSection,
  PublicMenuView
} from "../../../../../src/api/server";
import { clp, offerShape, resolveComponents } from "../../../../../src/api/offer-variants";
import { groupByTier, originName, pricesPerOrigin, renderableOrigins } from "../../../../../src/api/origin-pricing";
import { LOCALE_COOKIE, locales, type Locale } from "../../../../../src/i18n/locale";
import { isOpenNow, todayHoursLabel } from "../../../../../src/lib/open-now";
import { ISOTIPO_PATHS, ISOTIPO_VIEWBOX } from "../../../../../src/brand/isotipo";
import { BUSINESS_DESCRIPTOR, SITE_NAME } from "../../../../../src/seo/local-business";
import { CARTA_COPY } from "./copy";
import {
  buildDoors,
  groupFloor,
  groupOffers,
  isAuthorSubgroup,
  parseView,
  stopAnchor,
  stopItems,
  type CartaView,
  type Door,
  type DoorId,
  type OfferGroup,
  type Stop
} from "./doors";
import styles from "./carta-a.module.css";

// Carta A — the door carta (Paper "Carta A · 01–17"). Three views share one
// client component so moving between them is instant: the entrance (four
// doors), a door (its sections as chips + one scroll), and the combos hub.
// The view lives in `?puerta=` so links, refresh and the back button all work.

function viewQuery(view: CartaView): string {
  if (view.kind === "door") return `?puerta=${view.id}`;
  if (view.kind === "combos") return "?puerta=combos";
  return "";
}

const LANG_LABELS: Record<Locale, string> = { es: "ES", en: "EN", "pt-BR": "PT" };

function doorStyle(id: DoorId): CSSProperties {
  return {
    "--door-bg": `var(--door-${id})`,
    "--door-fg": `var(--door-${id}-fg)`,
    "--door-tint": `var(--door-${id}-tint)`
  } as CSSProperties;
}

function priceText(item: PublicMenuItem): string {
  if (item.price_label) return item.price_label;
  return typeof item.price_clp === "number" ? clp(item.price_clp) : "";
}

type SheetState =
  | { kind: "item"; item: PublicMenuItem; door: DoorId }
  | { kind: "offer"; group: OfferGroup }
  | { kind: "switch" }
  | null;

// ── Sheet (dialog) ──────────────────────────────────────────────────────
function Sheet({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      opener?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  return (
    <div className={styles.scrim} role="presentation" onClick={onClose}>
      <div
        ref={panelRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.grabber} aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}

function CloseButton({ onClose, label, className = "" }: { onClose: () => void; label: string; className?: string }) {
  return (
    <button type="button" data-autofocus className={`${styles.closeBtn} ${className}`} onClick={onClose} aria-label={label}>
      ✕
    </button>
  );
}

function ItemSheet({ item, door, locale, onClose }: { item: PublicMenuItem; door: DoorId; locale: Locale; onClose: () => void }) {
  const copy = CARTA_COPY[locale];
  const origins = renderableOrigins(item.origin_options);
  const perOrigin = pricesPerOrigin(item.origin_options);
  const allergens = (item.allergens ?? []).filter((a) => a && a !== "none");
  return (
    <Sheet label={item.name} onClose={onClose}>
      <div className={styles.sheetBody} style={doorStyle(door)}>
        {item.image_url ? (
          <div className={styles.photoWrap}>
            <img src={item.image_url} alt="" className={styles.sheetPhoto} />
            <CloseButton onClose={onClose} label={copy.close} className={styles.photoClose} />
          </div>
        ) : (
          <div className={styles.sheetTop}>
            <span />
            <CloseButton onClose={onClose} label={copy.close} />
          </div>
        )}
        <div className={styles.tags}>
          {item.signature ? <span className={styles.tag}>{copy.signature}</span> : null}
          {item.author?.trim() ? (
            <span className={styles.meta}>
              {copy.by} {item.author.trim()}
            </span>
          ) : item.meta ? (
            <span className={styles.meta}>{item.meta}</span>
          ) : null}
        </div>
        <div className={styles.rowTop}>
          <h2 className={styles.sheetTitle}>{item.name}</h2>
          {!perOrigin ? <span className={styles.price}>{priceText(item)}</span> : null}
        </div>
        {item.description ? <p className={styles.lede}>{item.description}</p> : null}
        {item.tasting_note ? <p className={styles.lede}>{item.tasting_note}</p> : null}
        {origins.length ? (
          <div className={styles.originLines}>
            {groupByTier(origins).map((group, gi) => (
              <div key={group.tier ?? gi} className={styles.originLines}>
                {group.tierLabel ? <span className={styles.sheetLabel}>{group.tierLabel}</span> : null}
                {group.origins.map((o) => (
                  <div key={o.id} className={styles.originLine}>
                    <span>{originName(o)}</span>
                    {typeof o.price_clp === "number" ? <span>{clp(o.price_clp)}</span> : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : null}
        {allergens.length ? (
          <>
            <span className={styles.sheetLabel}>{copy.allergens}</span>
            <div className={styles.addonChips}>
              {allergens.map((a) => (
                <span key={a} className={styles.addonChip} style={{ border: "1px solid var(--line)" }}>
                  {copy.allergenNames[a] ?? a}
                </span>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </Sheet>
  );
}

function pricingLabel(pricing: PublicMenuOfferItemPricing | undefined): string | null {
  if (!pricing) return null;
  if (pricing.kind === "included") return "Incluido";
  if (typeof pricing.amount_clp !== "number") return null;
  return pricing.kind === "supplement" ? `+ ${clp(pricing.amount_clp)}` : clp(pricing.amount_clp);
}

function OfferSheet({ group, locale, onClose }: { group: OfferGroup; locale: Locale; onClose: () => void }) {
  const copy = CARTA_COPY[locale];
  const [tab, setTab] = useState(0);
  const offer = group.offers[tab] ?? group.offers[0];
  const image = group.offers.find((o) => o.image_url)?.image_url;
  return (
    <Sheet label={group.title} onClose={onClose}>
      <div className={styles.sheetBody}>
        <div className={styles.sheetTop}>
          <span className={styles.comboPill}>{copy.combo}</span>
          <CloseButton onClose={onClose} label={copy.close} />
        </div>
        {image ? <img src={image} alt="" className={styles.banner} /> : null}
        <h2 className={styles.sheetTitle}>{group.title}</h2>
        {group.offers.length > 1 ? (
          <div className={styles.segment} role="tablist" aria-label={group.title}>
            {group.labels.map((label, i) => (
              <button
                key={group.offers[i].id}
                type="button"
                role="tab"
                aria-selected={i === tab}
                className={`${styles.segmentBtn} ${i === tab ? styles.segmentOn : ""}`}
                onClick={() => setTab(i)}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
        <OfferContent key={offer.id} offer={offer} locale={locale} />
      </div>
    </Sheet>
  );
}

// One offer's body inside the sheet: description, then its pairs (detail) or
// its priced options (variants). Keyed by offer id so the option pick resets
// when the guest switches tabs.
function OfferContent({ offer, locale }: { offer: PublicMenuOffer; locale: Locale }) {
  const copy = CARTA_COPY[locale];
  const shape = offerShape(offer);
  const variants = offer.variants ?? [];
  const [picked, setPicked] = useState(0);
  const variant = variants[picked];
  return (
    <>
        {offer.description ? <p className={styles.lede}>{offer.description}</p> : null}

        {shape === "detail" && offer.detail?.items?.length ? (
          <>
            {offer.detail.title ? <span className={styles.sheetLabel}>{offer.detail.title}</span> : null}
            <div>
              {offer.detail.items.map((row, i) => {
                const label = pricingLabel(row.pricing);
                const unit = typeof row.item.price_clp === "number" ? clp(row.item.price_clp) : null;
                return (
                  <div key={`${row.item.id}-${i}`} className={`${styles.pairRow} ${row.item.available === false ? styles.rowOff : ""}`}>
                    <div className={styles.rowMain}>
                      <span className={styles.name} style={{ fontSize: 17 }}>
                        {row.quantity > 1 ? `${row.quantity} × ` : ""}
                        {row.item.name}
                      </span>
                      {unit ? <span className={styles.combosMeta}>{copy.onMenu(unit)}</span> : null}
                    </div>
                    {label ? <span className={styles.pairPrice}>{label}</span> : null}
                  </div>
                );
              })}
            </div>
            {offer.detail.description ? <span className={styles.combosMeta}>{offer.detail.description}</span> : null}
          </>
        ) : null}

        {shape === "variants" && variant ? (
          <>
            <span className={styles.sheetLabel}>{copy.pick}</span>
            <div role="radiogroup" aria-label={copy.pick} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {variants.map((v, i) => (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={i === picked}
                  className={`${styles.variant} ${i === picked ? styles.variantOn : ""}`}
                  onClick={() => setPicked(i)}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span className={styles.variantRadio} aria-hidden="true" />
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{v.label}</span>
                  </span>
                  <span className={styles.price}>{clp(v.price_clp)}</span>
                </button>
              ))}
            </div>
            <span className={styles.sheetLabel}>{copy.includes}</span>
            <div>
              {resolveComponents(variant.components).map((c) => (
                <div key={c.id} className={styles.pairRow}>
                  <span style={{ fontSize: 15 }}>{c.kind === "item" ? c.name : c.label}</span>
                  <span className={styles.combosMeta}>× {c.quantity}</span>
                </div>
              ))}
            </div>
            <div className={styles.total}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{variant.label}</span>
              <span className={styles.mono} style={{ fontWeight: 500, fontSize: 20 }}>
                {clp(variant.price_clp)}
              </span>
            </div>
          </>
        ) : null}
    </>
  );
}

// ── Door pieces ─────────────────────────────────────────────────────────
function Rows({
  items,
  locale,
  onOpen
}: {
  items: PublicMenuItem[];
  locale: Locale;
  onOpen: (item: PublicMenuItem) => void;
}) {
  const copy = CARTA_COPY[locale];
  return (
    <div className={styles.rows}>
      {items.map((item) => {
        const perOrigin = pricesPerOrigin(item.origin_options);
        return (
          <button
            key={item.id}
            type="button"
            className={`${styles.row} ${item.available === false ? styles.rowOff : ""}`}
            onClick={() => onOpen(item)}
          >
            <span className={styles.rowMain}>
              <span className={styles.rowTop}>
                <span className={styles.name}>{item.name}</span>
                {!perOrigin ? <span className={styles.price}>{priceText(item)}</span> : null}
              </span>
              {item.description ? <span className={styles.desc}>{item.description}</span> : null}
              {perOrigin ? (
                <span className={styles.originLines}>
                  {renderableOrigins(item.origin_options).map((o) => (
                    <span key={o.id} className={styles.originLine}>
                      <span>{originName(o)}</span>
                      {typeof o.price_clp === "number" ? <span>{clp(o.price_clp)}</span> : null}
                    </span>
                  ))}
                </span>
              ) : null}
              {item.signature || item.meta ? (
                <span className={styles.tags}>
                  {item.signature ? <span className={styles.tag}>{copy.signature}</span> : null}
                  {item.meta ? <span className={styles.meta}>{item.meta}</span> : null}
                </span>
              ) : null}
            </span>
            {item.image_url ? <img src={item.image_url} alt="" loading="lazy" className={styles.thumb} /> : null}
          </button>
        );
      })}
    </div>
  );
}

function AuthorGrid({ items, locale, onOpen }: { items: PublicMenuItem[]; locale: Locale; onOpen: (item: PublicMenuItem) => void }) {
  const copy = CARTA_COPY[locale];
  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <button key={item.id} type="button" className={styles.card} onClick={() => onOpen(item)}>
          {item.image_url ? (
            <img src={item.image_url} alt="" loading="lazy" className={styles.cardPhoto} />
          ) : (
            <span className={styles.cardPhoto} aria-hidden="true" />
          )}
          <span className={styles.cardName}>{item.name}</span>
          <span className={styles.cardFoot}>
            <span className={styles.meta}>{item.author?.trim() ? `${copy.by} ${item.author.trim()}` : item.meta ?? ""}</span>
            <span className={styles.price} style={{ fontSize: 13 }}>
              {priceText(item)}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

function Addons({ addon }: { addon: PublicMenuAddon }) {
  return (
    <div className={styles.addons}>
      <span className={styles.addonLabel}>{addon.label}</span>
      <div className={styles.addonChips}>
        {addon.chips.map((chip) => (
          <span key={chip} className={styles.addonChip}>
            {chip}
          </span>
        ))}
      </div>
      {addon.hint ? <span className={styles.addonHint}>{addon.hint}</span> : null}
    </div>
  );
}

// How many priced choices a group spans — more than one earns the "desde" cue.
function priceChoices(group: OfferGroup): number {
  return group.offers.reduce((n, o) => n + (o.variants?.length ?? 0) + (o.detail?.items?.length ?? 0), 0);
}

function FloorPrice({ group, locale }: { group: OfferGroup; locale: Locale }) {
  const copy = CARTA_COPY[locale];
  const floor = groupFloor(group);
  if (floor === undefined) return null;
  // "el par" only when the guest chooses WHICH pair (Happy Hour); a fixed
  // two-of-one combo (2 Desayunos Campesinos) is just its price.
  const pairs = group.offers.every((o) => {
    const rows = o.detail?.items ?? [];
    return offerShape(o) === "detail" && rows.length > 1 && rows.every((r) => r.quantity === 2);
  });
  return (
    <>
      {priceChoices(group) > 1 ? `${copy.from} ` : ""}
      {clp(floor)}
      {pairs ? ` ${copy.pair}` : ""}
    </>
  );
}

function groupBlurb(group: OfferGroup): string | undefined {
  return group.offers.length > 1 ? group.labels.join(" · ") : group.offers[0].description;
}

function OfferCard({ group, locale, onOpen }: { group: OfferGroup; locale: Locale; onOpen: () => void }) {
  const copy = CARTA_COPY[locale];
  const image = group.offers.find((o) => o.image_url)?.image_url;
  const blurb = groupBlurb(group);
  return (
    <button type="button" className={styles.offerCard} onClick={onOpen}>
      {image ? <img src={image} alt="" loading="lazy" className={styles.offerImg} /> : null}
      <span className={styles.offerTop}>
        <span className={styles.comboPill}>{copy.combo}</span>
        <span className={styles.offerPrice}>
          <FloorPrice group={group} locale={locale} />
        </span>
      </span>
      <span className={styles.offerTitle}>{group.title}</span>
      {blurb ? <span className={styles.offerDesc}>{blurb}</span> : null}
      <span className={styles.offerCue}>{copy.seeCombo} →</span>
    </button>
  );
}

function OfferCards({
  offers,
  locale,
  onOffer
}: {
  offers: PublicMenuOffer[];
  locale: Locale;
  onOffer: (group: OfferGroup) => void;
}) {
  return (
    <>
      {groupOffers(offers).map((g) => (
        <OfferCard key={g.key} group={g} locale={locale} onOpen={() => onOffer(g)} />
      ))}
    </>
  );
}

// Group headings must never read like a dish name (founder, 2026-11-01): a
// group is a tinted band in the door's colour with its dish count; a subgroup
// inside a section is a small tracked label with a rule. Dish names stay the
// plain bold rows below them.
function GroupHeading({
  id,
  title,
  count,
  window
}: {
  id: string;
  title: string;
  count: number;
  window?: string;
}) {
  return (
    <div className={styles.groupBand}>
      <h2 id={id} className={styles.groupTitle}>
        {title}
      </h2>
      <span className={styles.groupMeta}>
        {window ? <span className={styles.window}>{window.replace(/^Servicio\s+/i, "")}</span> : null}
        <span className={styles.groupCount}>{count}</span>
      </span>
    </div>
  );
}

function SubHeading({ title, count }: { title: string; count: number }) {
  return (
    <h3 className={styles.subHead}>
      <span>{title}</span>
      <span className={styles.subRule} aria-hidden="true" />
      <span className={styles.groupCount}>{count}</span>
    </h3>
  );
}

function sectionCount(section: PublicMenuSection): number {
  return (section.items?.length ?? 0) + (section.subgroups ?? []).reduce((n, sg) => n + sg.items.length, 0);
}

function SectionBlock({
  section,
  stopKey,
  showHead,
  locale,
  onItem,
  onOffer
}: {
  section: PublicMenuSection;
  stopKey: string;
  showHead: boolean;
  locale: Locale;
  onItem: (item: PublicMenuItem) => void;
  onOffer: (group: OfferGroup) => void;
}) {
  return (
    <section id={stopAnchor({ key: stopKey })} className={styles.stop} aria-labelledby={`${stopKey}-title`}>
      {showHead ? (
        <div className={styles.stopHead}>
          {section.banner_image_url ? <img src={section.banner_image_url} alt="" className={styles.banner} /> : null}
          <GroupHeading
            id={`${stopKey}-title`}
            title={section.title.replace(/[.·\s]+$/, "")}
            count={sectionCount(section)}
            window={section.service_window}
          />
          {section.lede ? <p className={styles.lede}>{section.lede}</p> : null}
        </div>
      ) : null}
      {section.items?.length ? <Rows items={section.items} locale={locale} onOpen={onItem} /> : null}
      {(section.subgroups ?? []).map((sg) => (
        <div key={sg.id}>
          <SubHeading title={sg.label} count={sg.items.length} />
          <Rows items={sg.items} locale={locale} onOpen={onItem} />
          {sg.addons ? <Addons addon={sg.addons} /> : null}
        </div>
      ))}
      {(section.addons ?? []).map((a, i) => (
        <Addons key={i} addon={a} />
      ))}
      {section.executive_menu ? (
        <div className={styles.exec}>
          <div className={styles.offerTop}>
            <span className={styles.comboPill}>{section.executive_menu.price_label}</span>
            <span className={styles.combosMeta}>{section.executive_menu.hours}</span>
          </div>
          <span className={styles.execHero}>{section.executive_menu.hero}</span>
          <span className={styles.lede}>{section.executive_menu.subline}</span>
          {section.executive_menu.courses.map((c) => (
            <div key={c.id} className={styles.course}>
              <span className={styles.meta}>{c.tag}</span>
              <span style={{ fontWeight: 600 }}>{c.name}</span>
            </div>
          ))}
        </div>
      ) : null}
      <div className={styles.mainOffers}>
        <OfferCards offers={section.offers ?? []} locale={locale} onOffer={onOffer} />
      </div>
    </section>
  );
}

function DoorBody({
  door,
  locale,
  onItem,
  onOffer
}: {
  door: Door;
  locale: Locale;
  onItem: (item: PublicMenuItem) => void;
  onOffer: (group: OfferGroup) => void;
}) {
  const subgroupStops = door.stops.some((s) => s.subgroupId);
  if (!subgroupStops) {
    return (
      <>
        {door.sections.map((section) => (
          <SectionBlock key={section.id} section={section} stopKey={section.id} showHead locale={locale} onItem={onItem} onOffer={onOffer} />
        ))}
      </>
    );
  }
  // One section split into subgroup stops (Café, Dulce): each subgroup is its
  // own anchored block. The authored subgroup renders as a photo grid; the
  // section banner + lede open the first ordinary stop.
  const section = door.sections[0];
  const bannerStop = door.stops.find((s) => {
    const sg = section.subgroups?.find((g) => g.id === s.subgroupId);
    return !sg || !isAuthorSubgroup(sg);
  });
  return (
    <>
      {door.stops.map((stop, i) => {
        const sg = section.subgroups?.find((g) => g.id === stop.subgroupId);
        const items = sg ? sg.items : section.items ?? [];
        const authored = sg ? isAuthorSubgroup(sg) && door.id === "cafe" : false;
        const isBanner = stop.key === bannerStop?.key;
        return (
          <section key={stop.key} id={stopAnchor(stop)} className={styles.stop} aria-labelledby={`${stop.key}-title`}>
            <div className={styles.stopHead} style={i === 0 ? undefined : { paddingTop: 28 }}>
              {isBanner && section.banner_image_url ? <img src={section.banner_image_url} alt="" className={styles.banner} /> : null}
              <GroupHeading
                id={`${stop.key}-title`}
                title={stop.label}
                count={items.length}
                window={isBanner ? section.service_window : undefined}
              />
              {isBanner && section.lede ? <p className={styles.lede}>{section.lede}</p> : null}
            </div>
            {authored ? <AuthorGrid items={items} locale={locale} onOpen={onItem} /> : <Rows items={items} locale={locale} onOpen={onItem} />}
            {sg?.addons ? <Addons addon={sg.addons} /> : null}
            {i === door.stops.length - 1 ? (
              <>
                {(section.addons ?? []).map((a, k) => (
                  <Addons key={k} addon={a} />
                ))}
                <div className={styles.mainOffers}>
                  <OfferCards offers={section.offers ?? []} locale={locale} onOffer={onOffer} />
                </div>
              </>
            ) : null}
          </section>
        );
      })}
    </>
  );
}

// ── Main ────────────────────────────────────────────────────────────────
export function CartaA({
  menu,
  locale,
  initialView
}: {
  menu: PublicMenuView;
  locale: Locale;
  initialView: CartaView;
}) {
  const copy = CARTA_COPY[locale];
  const doors = useMemo(() => buildDoors(menu), [menu]);
  // Counted as the guest sees them: a Happy Hour family is one combo, not two.
  const comboCount = useMemo(() => doors.reduce((n, d) => n + groupOffers(d.offers).length, 0), [doors]);
  const totalItems = doors.reduce((n, d) => n + d.itemCount, 0);

  const [view, setView] = useState<CartaView>(initialView);
  const [sheet, setSheet] = useState<SheetState>(null);
  const [open, setOpen] = useState<{ open: boolean; closes: string } | null>(null);

  useEffect(() => {
    const now = new Date();
    const hours = todayHoursLabel(now);
    setOpen({ open: isOpenNow(now), closes: hours.split("–")[1] ?? "" });
  }, []);

  // History: every view change is a real entry so the phone's back gesture
  // walks door → entrance instead of leaving the carta.
  const go = useCallback((next: CartaView) => {
    setView(next);
    setSheet(null);
    window.history.pushState(null, "", `${window.location.pathname}${viewQuery(next)}`);
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const onPop = () => {
      setView(parseView(new URLSearchParams(window.location.search).get("puerta")));
      setSheet(null);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function selectLocale(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  }

  const closeSheet = useCallback(() => setSheet(null), []);
  const door = view.kind === "door" ? doors.find((d) => d.id === view.id) : undefined;

  return (
    <div className={styles.shell}>
      {view.kind === "door" && door ? (
        <DoorView
          door={door}
          locale={locale}
          onBack={() => go({ kind: "entrance" })}
          onSwitch={() => setSheet({ kind: "switch" })}
          onItem={(item) => setSheet({ kind: "item", item, door: door.id })}
          onOffer={(group) => setSheet({ kind: "offer", group })}
        />
      ) : view.kind === "combos" ? (
        <CombosView
          doors={doors}
          count={comboCount}
          locale={locale}
          onBack={() => go({ kind: "entrance" })}
          onOffer={(group) => setSheet({ kind: "offer", group })}
        />
      ) : (
        <>
          <header className={styles.entranceHead}>
            <div className={styles.headRow}>
              <svg viewBox={ISOTIPO_VIEWBOX} width={34} height={34} role="img" aria-label="Deriva">
                {ISOTIPO_PATHS.map((d, i) => (
                  <path key={i} d={d} fill="#00311F" />
                ))}
              </svg>
              <span className={styles.headTools}>
                <span className={styles.langs} role="group" aria-label={copy.languages}>
                  {locales.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      aria-pressed={loc === locale}
                      className={`${styles.lang} ${loc === locale ? styles.langOn : ""}`}
                      onClick={() => selectLocale(loc)}
                    >
                      {LANG_LABELS[loc]}
                    </button>
                  ))}
                </span>
                {menu.closed_today ? (
                  <span className={`${styles.status} ${styles.statusClosed}`}>
                    <span className={styles.statusDot} aria-hidden="true" />
                    {copy.closed}
                  </span>
                ) : open?.open ? (
                  <span className={styles.status}>
                    <span className={styles.statusDot} aria-hidden="true" />
                    {copy.open(open.closes)}
                  </span>
                ) : null}
              </span>
            </div>
            <div className={styles.titleRow}>
              <h1 className={styles.bigTitle}>{copy.title}</h1>
              <span className={`${styles.kicker}`} style={{ color: "var(--soft)", paddingBottom: 4 }}>
                {copy.options(totalItems)}
              </span>
            </div>
          </header>

          {menu.closed_today && menu.closed_label ? (
            <div className={styles.closedNote} role="status">
              <span className={styles.closedTitle}>{copy.closed}</span>
              <span className={styles.closedText}>{menu.closed_label}</span>
            </div>
          ) : null}

          <nav className={styles.doors} aria-label={copy.title}>
            {doors.map((d) => (
              <a
                key={d.id}
                href={`?puerta=${d.id}`}
                className={styles.door}
                style={doorStyle(d.id)}
                onClick={(e) => {
                  e.preventDefault();
                  go({ kind: "door", id: d.id });
                }}
              >
                <span className={styles.doorText}>
                  <span className={`${styles.kicker} ${styles.doorCount}`}>{copy.options(d.itemCount)}</span>
                  <span className={styles.doorName}>{d.label}</span>
                  <span className={styles.doorSub}>{d.description}</span>
                </span>
                {d.photo ? (
                  <span className={styles.doorPhotoWrap}>
                    <img src={d.photo} alt="" className={styles.doorPhoto} />
                    <span className={styles.arrow} aria-hidden="true">
                      →
                    </span>
                  </span>
                ) : null}
              </a>
            ))}
          </nav>

          {comboCount ? (
            <a
              href="?puerta=combos"
              className={styles.combosRow}
              style={{ color: "inherit", textDecoration: "none" }}
              onClick={(e) => {
                e.preventDefault();
                go({ kind: "combos" });
              }}
            >
              <span className={styles.combosLead}>
                <span className={styles.pct} aria-hidden="true">
                  %
                </span>
                <span className={styles.combosText}>
                  <span className={styles.combosName}>{copy.combos}</span>
                  <span className={styles.combosMeta}>{copy.combosCount(comboCount)}</span>
                </span>
              </span>
              <span aria-hidden="true" style={{ fontWeight: 700, fontSize: 18 }}>
                →
              </span>
            </a>
          ) : null}

          <FullIndex
            doors={doors}
            locale={locale}
            onDoor={(id) => go({ kind: "door", id })}
            onItem={(item, doorId) => setSheet({ kind: "item", item, door: doorId })}
          />
        </>
      )}

      {/* Paid landing page: the umbrella name must be visible page content
          (Google Ads Name Prominence — tests/seo/business-name.test.ts). */}
      <footer className={styles.footer}>
        <strong className={styles.footerBrand}>{SITE_NAME}</strong>
        <span>{BUSINESS_DESCRIPTOR}</span>
        <span>Magnere 1570 Local 105 · Providencia · Santiago</span>
        <span>Lun–Vie 08:00–21:00 · Sáb 10:00–21:00</span>
      </footer>

      {sheet?.kind === "item" ? <ItemSheet item={sheet.item} door={sheet.door} locale={locale} onClose={closeSheet} /> : null}
      {sheet?.kind === "offer" ? <OfferSheet group={sheet.group} locale={locale} onClose={closeSheet} /> : null}
      {sheet?.kind === "switch" ? (
        <Sheet label={copy.switchTo} onClose={closeSheet}>
          <div className={styles.sheetBody} style={{ gap: 10 }}>
            <div className={styles.sheetTop}>
              <span className={styles.stopTitle} style={{ fontSize: 22 }}>
                {copy.switchTo}
              </span>
              <CloseButton onClose={closeSheet} label={copy.close} />
            </div>
            {doors.map((d) => (
              <button key={d.id} type="button" className={styles.switchRow} style={doorStyle(d.id)} onClick={() => go({ kind: "door", id: d.id })}>
                {d.photo ? <img src={d.photo} alt="" className={styles.switchThumb} /> : null}
                <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
                  <span className={styles.switchName}>{d.label}</span>
                  <span className={styles.combosMeta} style={{ color: "inherit", opacity: 0.75 }}>
                    {copy.options(d.itemCount)}
                  </span>
                </span>
                <span aria-hidden="true">{view.kind === "door" && view.id === d.id ? "✓" : "→"}</span>
              </button>
            ))}
            {comboCount ? (
              <button type="button" className={styles.switchRow} style={{ background: "transparent", border: "1px solid var(--line)" }} onClick={() => go({ kind: "combos" })}>
                <span className={styles.pct} aria-hidden="true">
                  %
                </span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{copy.combos}</span>
              </button>
            ) : null}
          </div>
        </Sheet>
      ) : null}
    </div>
  );
}

// ── Toda la carta ───────────────────────────────────────────────────────
// The whole menu as a compact, server-rendered index under the doors: every
// section and dish with its price. The first screen stays the four doors, but
// /menu still carries its dishes as visible text — Google Ads landing-page
// relevance and organic search read the server HTML, not what a tap reveals.
function FullIndex({
  doors,
  locale,
  onDoor,
  onItem
}: {
  doors: Door[];
  locale: Locale;
  onDoor: (id: DoorId) => void;
  onItem: (item: PublicMenuItem, door: DoorId) => void;
}) {
  const copy = CARTA_COPY[locale];
  return (
    <section className={styles.index} aria-labelledby="toda-la-carta">
      <h2 id="toda-la-carta" className={styles.indexTitle}>
        {copy.fullMenu}
      </h2>
      <div className={styles.indexDoors}>
        {doors.map((door) => (
          <div key={door.id} className={styles.indexDoor} style={doorStyle(door.id)}>
            <button type="button" className={styles.indexDoorName} onClick={() => onDoor(door.id)}>
              <span className={styles.indexSwatch} aria-hidden="true" />
              {door.label}
              <span aria-hidden="true">→</span>
            </button>
            {door.stops.map((stop) => {
              const items = stopItems(door, stop);
              if (!items.length) return null;
              return (
                <div key={stop.key} className={styles.indexStop}>
                  <h3 className={styles.indexStopLabel}>{stop.label}</h3>
                  <ul className={styles.indexList}>
                    {items.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={`${styles.indexItem} ${item.available === false ? styles.rowOff : ""}`}
                          onClick={() => onItem(item, door.id)}
                        >
                          <span className={styles.indexName}>{item.name}</span>
                          {!pricesPerOrigin(item.origin_options) ? (
                            <span className={styles.indexPrice}>{priceText(item)}</span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Door view (sticky header + chip scroll-spy) ─────────────────────────
function DoorView({
  door,
  locale,
  onBack,
  onSwitch,
  onItem,
  onOffer
}: {
  door: Door;
  locale: Locale;
  onBack: () => void;
  onSwitch: () => void;
  onItem: (item: PublicMenuItem) => void;
  onOffer: (group: OfferGroup) => void;
}) {
  const copy = CARTA_COPY[locale];
  const headRef = useRef<HTMLDivElement>(null);
  const chipRail = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [active, setActive] = useState(door.stops[0]?.key ?? "");
  const [compact, setCompact] = useState(false);
  const raf = useRef(0);

  useEffect(() => {
    setActive(door.stops[0]?.key ?? "");
  }, [door]);

  useEffect(() => {
    function compute() {
      raf.current = 0;
      setCompact(window.scrollY > 60);
      const line = (headRef.current?.getBoundingClientRect().bottom ?? 160) + 16;
      let current = door.stops[0]?.key ?? "";
      for (const stop of door.stops) {
        const el = document.getElementById(stopAnchor(stop));
        if (el && el.getBoundingClientRect().top <= line) current = stop.key;
      }
      setActive(current);
      const shell = headRef.current?.parentElement;
      shell?.style.setProperty("--stop-offset", `${(headRef.current?.offsetHeight ?? 160) + 64}px`);
    }
    const onScroll = () => {
      if (!raf.current) raf.current = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf.current);
    };
  }, [door]);

  useEffect(() => {
    const rail = chipRail.current;
    const chip = chipRefs.current[active];
    if (!rail || !chip) return;
    rail.scrollTo({ left: Math.max(0, chip.offsetLeft - 20), behavior: "smooth" });
  }, [active]);

  function jump(stop: Stop) {
    const el = document.getElementById(stopAnchor(stop));
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - (headRef.current?.offsetHeight ?? 0) - 56 + 8;
    window.scrollTo({ top: stop.key === door.stops[0]?.key ? 0 : top, behavior: "smooth" });
  }

  return (
    <div style={doorStyle(door.id)}>
      <div ref={headRef} className={`${styles.chapterHead} ${compact ? styles.chapterHeadCompact : ""}`}>
        <div className={styles.chapterTop}>
          <button type="button" className={styles.backLink} onClick={onBack}>
            ← {copy.back}
          </button>
          <span className={styles.kicker} style={{ color: "var(--soft)" }}>
            {copy.options(door.itemCount)}
          </span>
        </div>
        <button type="button" className={styles.chapterTitleBtn} onClick={onSwitch} aria-haspopup="dialog">
          <h1 className={styles.chapterTitle}>{door.label}</h1>
          <span className={styles.caret} aria-hidden="true">
            ⌄
          </span>
        </button>
        {door.stops.length > 1 ? (
          <div ref={chipRail} className={styles.chips} role="tablist" aria-label={door.label}>
            {door.stops.map((stop) => (
              <button
                key={stop.key}
                ref={(el) => {
                  chipRefs.current[stop.key] = el;
                }}
                type="button"
                role="tab"
                aria-selected={active === stop.key}
                className={`${styles.chip} ${active === stop.key ? styles.chipOn : ""}`}
                onClick={() => jump(stop)}
              >
                {stop.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className={styles.chapterBody}>
        <div>
          <DoorBody door={door} locale={locale} onItem={onItem} onOffer={onOffer} />
        </div>
        {door.offers.length ? (
          <aside className={styles.aside} aria-label={copy.combos}>
            <span className={styles.sheetLabel}>{copy.combos}</span>
            <OfferCards offers={door.offers} locale={locale} onOffer={onOffer} />
          </aside>
        ) : null}
      </div>
    </div>
  );
}

// ── Combos hub ──────────────────────────────────────────────────────────
function CombosView({
  doors,
  count,
  locale,
  onBack,
  onOffer
}: {
  doors: Door[];
  count: number;
  locale: Locale;
  onBack: () => void;
  onOffer: (group: OfferGroup) => void;
}) {
  const copy = CARTA_COPY[locale];
  const [filter, setFilter] = useState<DoorId | "all">("all");
  const withOffers = doors.filter((d) => d.offers.length);
  const shown = withOffers.filter((d) => filter === "all" || d.id === filter);
  return (
    <div>
      <div className={styles.hubHead}>
        <div className={styles.chapterTop} style={{ paddingRight: 0 }}>
          <button type="button" className={styles.backLink} onClick={onBack}>
            ← {copy.back}
          </button>
          <span className={styles.kicker} style={{ opacity: 0.7 }}>
            {copy.combosCount(count)}
          </span>
        </div>
        <h1 className={styles.hubTitle}>{copy.combosTitle}</h1>
        <div className={styles.chips} style={{ paddingRight: 0 }} role="tablist">
          {(["all", ...withOffers.map((d) => d.id)] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={filter === id}
              className={`${styles.chip} ${filter === id ? styles.chipOn : ""}`}
              onClick={() => setFilter(id)}
            >
              {id === "all" ? copy.all : withOffers.find((d) => d.id === id)?.label}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.hubBody}>
        {shown.map((d) => {
          const groups = groupOffers(d.offers);
          return (
            <div key={d.id} className={styles.hubGroup} style={doorStyle(d.id)}>
              <h2 className={styles.subTitle} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{d.label}</span>
                <span className={styles.mono}>{groups.length}</span>
              </h2>
              <div className={styles.hubList}>
                {groups.map((group) => {
                  const blurb = groupBlurb(group);
                  return (
                    <button key={group.key} type="button" className={styles.hubRow} onClick={() => onOffer(group)}>
                      <span className={styles.hubSwatch} aria-hidden="true" />
                      <span className={styles.rowMain}>
                        <span className={styles.rowTop}>
                          <span className={styles.name} style={{ fontSize: 17 }}>
                            {group.title}
                          </span>
                          <span className={styles.price} style={{ fontSize: 14 }}>
                            <FloorPrice group={group} locale={locale} />
                          </span>
                        </span>
                        {blurb ? <span className={styles.desc} style={{ fontSize: 14 }}>{blurb}</span> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
