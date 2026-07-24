"use client";

import { useEffect, useRef, useState } from "react";

import type {
  PublicMenuView,
  PublicMenuSection,
  PublicMenuSubgroup,
  PublicMenuAddon,
  PublicMenuOffer,
  PublicMenuOfferItemPricing,
  ExecutiveMenu
} from "../../../../src/api/server";
import { LOCALE_COOKIE, locales, type Locale } from "../../../../src/i18n/locale";
import styles from "../carta.module.css";
import {
  itemPhoto,
  isHighlighted,
  sectionBanner,
  type MenuItemX,
  type MenuSectionX
} from "./menu-fields";

const LANG_LABELS: Record<Locale, string> = { es: "ES", en: "EN", "pt-BR": "PT" };

function clp(n?: number): string {
  if (typeof n !== "number") return "";
  return `$${n.toLocaleString("es-CL")}`;
}

function priceText(item: MenuItemX): string {
  return item.price_label ?? clp(item.price_clp);
}

// ── Item row ────────────────────────────────────────────────────────────
function ItemRow({ item, showPrices }: { item: MenuItemX; showPrices: boolean }) {
  return (
    <div className={`${styles.row} ${item.available === false ? styles.rowUnavailable : ""}`}>
      <div className={styles.rowMain}>
        <div className={styles.rowTitleLine}>
          <span className={styles.name}>{item.name}</span>
          {item.meta ? <span className={styles.meta}>{item.meta}</span> : null}
          {item.signature ? <span className={styles.sigTag}>✦ de la casa</span> : null}
        </div>
        {item.description ? <span className={styles.desc}>{item.description}</span> : null}
        {item.tasting_note ? <span className={styles.desc}>{item.tasting_note}</span> : null}
      </div>
      {showPrices ? (
        <div className={styles.priceCol}>
          <span className={styles.price}>{priceText(item)}</span>
        </div>
      ) : null}
    </div>
  );
}

// Highlighted item → photo card (backend `highlighted`/`photo_url`, or preview shim).
function HighlightCard({ item, showPrices }: { item: MenuItemX; showPrices: boolean }) {
  const photo = itemPhoto(item);
  return (
    <div className={styles.highlight}>
      <div className={styles.highlightPhoto} style={photo ? { backgroundImage: `url(${photo})` } : undefined} />
      <div className={styles.highlightBody}>
        <div className={styles.rowMain}>
          <div className={styles.rowTitleLine}>
            <span className={styles.name}>{item.name}</span>
            {item.meta ? <span className={styles.meta}>{item.meta}</span> : null}
          </div>
          {item.description ? <span className={styles.desc}>{item.description}</span> : null}
        </div>
        {showPrices ? <span className={styles.price}>{priceText(item)}</span> : null}
      </div>
    </div>
  );
}

function Items({ items, showPrices }: { items: MenuItemX[]; showPrices: boolean }) {
  return (
    <>
      {items.map((item) =>
        isHighlighted(item) ? (
          <HighlightCard key={item.id} item={item} showPrices={showPrices} />
        ) : (
          <ItemRow key={item.id} item={item} showPrices={showPrices} />
        )
      )}
    </>
  );
}

function Addons({ addon }: { addon: PublicMenuAddon }) {
  return (
    <div className={styles.addons}>
      <span className={styles.addonLabel}>
        {addon.label}
        {addon.hint ? ` · ${addon.hint}` : ""}
      </span>
      <div className={styles.addonChips}>
        {addon.chips.map((chip) => (
          <span key={chip} className={styles.addonChip}>
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

function Subgroup({ sg, showPrices }: { sg: PublicMenuSubgroup; showPrices: boolean }) {
  return (
    <div className={styles.subgroup}>
      <div className={styles.subLabelRow}>
        <span className={styles.subLabel}>{sg.label}</span>
        <span className={styles.subRule} aria-hidden="true" />
      </div>
      <Items items={sg.items as MenuItemX[]} showPrices={showPrices} />
      {sg.addons ? <Addons addon={sg.addons} /> : null}
    </div>
  );
}

function EjecutivoInsert({ em }: { em: ExecutiveMenu }) {
  return (
    <div className={styles.insert}>
      <div className={styles.insertTop}>
        <span className={styles.insertKicker}>§07 · Inserto</span>
        <span className={styles.insertHours}>{em.hours}</span>
      </div>
      <div className={styles.insertHead}>
        <span className={styles.autorKicker}>Menu Ejecutivo</span>
        <span className={styles.insertHero}>{em.hero}</span>
        <span className={styles.insertSub}>{em.subline}</span>
      </div>
      <div className={styles.courses}>
        {em.courses.map((c) => (
          <div key={c.id} className={styles.course}>
            <span className={styles.courseNum}>{c.numeral}</span>
            <div className={styles.rowMain}>
              <span className={styles.courseTag}>{c.tag}</span>
              <span className={styles.courseName}>{c.name}</span>
            </div>
          </div>
        ))}
        <div className={styles.insertPrice}>
          <span className={styles.insertPriceLabel}>Precio fijo</span>
          <span className={styles.insertPriceValue}>{em.price_label}</span>
        </div>
      </div>
    </div>
  );
}

// ── Offers / combos ─────────────────────────────────────────────────────
// Display-only: the pricing metadata is rendered verbatim as a label, never
// summed. `included` → "Incluido", `fixed`+amount → "Promo · CLP $X",
// `supplement`+amount → "+ CLP $X". No amount → no label.
function offerPriceLabel(pricing?: PublicMenuOfferItemPricing): string | null {
  if (!pricing) return null;
  if (pricing.kind === "included") return "Incluido";
  if (typeof pricing.amount_clp !== "number") return null;
  if (pricing.kind === "fixed") return `Promo · CLP ${clp(pricing.amount_clp)}`;
  if (pricing.kind === "supplement") return `+ CLP ${clp(pricing.amount_clp)}`;
  return null;
}

// Themed dialog that mirrors src/ui/Sheet.tsx's focus behavior (scroll lock,
// ESC dismiss, backdrop dismiss, focus-first) but wears the Carta dark/day
// palette instead of the companion's light beige. Rendered inside the themed
// `.shell` so the --ground/--ink custom properties cascade in; not portalled
// (the shell has no transformed ancestor, so fixed positions to the viewport).
function OfferDialog({
  offer,
  open,
  onClose,
  showPrices
}: {
  offer: PublicMenuOffer;
  open: boolean;
  onClose: () => void;
  showPrices: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = `offer-${offer.id}-title`;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) closeRef.current?.focus({ preventScroll: true });
  }, [open]);

  if (!open) return null;
  const detail = offer.detail;

  return (
    <div className={styles.dlgScrim} role="presentation" onClick={onClose}>
      <div
        ref={panelRef}
        className={styles.dlg}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.dlgHead}>
          <div className={styles.dlgHeadText}>
            <span className={styles.offersLabel}>Oferta</span>
            <span id={titleId} className={styles.dlgTitle}>
              {offer.title}
            </span>
            {offer.description ? <span className={styles.dlgPreview}>{offer.description}</span> : null}
          </div>
          <button
            ref={closeRef}
            type="button"
            className={styles.dlgClose}
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className={styles.dlgBody}>
          {detail?.title || detail?.description ? (
            <div className={styles.dlgDetail}>
              {detail.title ? <span className={styles.dlgDetailTitle}>{detail.title}</span> : null}
              {detail.description ? (
                <span className={styles.dlgDetailDesc}>{detail.description}</span>
              ) : null}
            </div>
          ) : null}

          {detail?.items?.length ? (
            <ul className={styles.dlgItems}>
              {detail.items.map((row, i) => {
                const it = row.item;
                const photo = itemPhoto(it);
                const priceLabel = offerPriceLabel(row.pricing);
                const unavailable = it.available === false;
                return (
                  <li
                    key={`${it.id}-${i}`}
                    className={`${styles.dlgItem} ${unavailable ? styles.dlgItemOff : ""}`}
                  >
                    {photo ? (
                      <span
                        className={styles.dlgItemThumb}
                        style={{ backgroundImage: `url(${photo})` }}
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className={styles.dlgItemMain}>
                      <div className={styles.dlgItemNameLine}>
                        <span className={styles.dlgItemName}>{it.name}</span>
                        {row.quantity > 1 ? (
                          <span className={styles.dlgItemQty}>×{row.quantity}</span>
                        ) : null}
                        {unavailable ? (
                          <span className={styles.dlgItemFlag}>Agotado</span>
                        ) : null}
                      </div>
                      {showPrices && (it.price_label || typeof it.price_clp === "number") ? (
                        <span className={styles.dlgItemNormal}>{priceText(it)}</span>
                      ) : null}
                    </div>
                    {priceLabel ? <span className={styles.dlgItemPricing}>{priceLabel}</span> : null}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// One offer inside a section's offers block. Simple offers (no `detail`) render
// exactly as before — a static title/description. Offers WITH a `detail` become
// a clickable card that opens OfferDialog; `detail` presence is the openability
// signal (there is no backend `modal` flag).
function OfferRow({ offer, showPrices }: { offer: PublicMenuOffer; showPrices: boolean }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  if (!offer.detail) {
    return (
      <div className={styles.offer}>
        <span className={styles.offerTitle}>{offer.title}</span>
        <span className={styles.offerDesc}>{offer.description}</span>
      </div>
    );
  }

  const image = offer.image_url;
  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`${styles.offer} ${styles.offerButton}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        {image ? (
          <span
            className={styles.offerThumb}
            style={{ backgroundImage: `url(${image})` }}
            aria-hidden="true"
          />
        ) : null}
        <span className={styles.offerButtonBody}>
          <span className={styles.offerTitle}>{offer.title}</span>
          <span className={styles.offerDesc}>{offer.description}</span>
          <span className={styles.offerCue} aria-hidden="true">
            Ver detalle →
          </span>
        </span>
      </button>
      <OfferDialog
        offer={offer}
        open={open}
        onClose={() => {
          setOpen(false);
          btnRef.current?.focus();
        }}
        showPrices={showPrices}
      />
    </>
  );
}

// A full section (chapter). Hero chapters with a banner get a photo opener.
function Section({ section, showPrices }: { section: MenuSectionX; showPrices: boolean }) {
  const banner = sectionBanner(section);
  const directItems = (section.items ?? []) as MenuItemX[];

  return (
    <section id={`sec-${section.id}`} className={styles.chapter}>
      {banner ? (
        <div className={styles.opener} style={{ backgroundImage: `url(${banner})` }}>
          <div className={styles.openerPanel}>
            <span className={styles.openerNumeral}>§{section.numeral}</span>
            <span className={styles.openerTitle}>{section.title}</span>
            {section.lede ? <span className={styles.openerLede}>{section.lede}</span> : null}
          </div>
        </div>
      ) : (
        // Every non-banner section → monumental numeral (one consistent break).
        <div className={styles.plateHead}>
          <span className={styles.plateRule} aria-hidden="true" />
          <div className={styles.plateNumWrap}>
            <span className={styles.plateNum}>{section.numeral}</span>
            <span className={styles.plateKicker}>Sección</span>
          </div>
          <span className={`${styles.chapterTitle} ${styles.chapterTitleHero}`}>{section.title}</span>
          {section.lede ? <span className={styles.chapterLede}>{section.lede}</span> : null}
        </div>
      )}

      {section.offers?.length ? (
        <div className={styles.offers}>
          <span className={styles.offersLabel}>Combos & ofertas</span>
          {section.offers.map((o) => (
            <OfferRow key={o.id} offer={o as PublicMenuOffer} showPrices={showPrices} />
          ))}
        </div>
      ) : null}

      {directItems.length ? (
        <div className={styles.rowsPad}>
          <Items items={directItems} showPrices={showPrices} />
        </div>
      ) : null}

      {(section.subgroups ?? []).map((sg) => (
        <Subgroup key={sg.id} sg={sg} showPrices={showPrices} />
      ))}

      {(section.addons ?? []).map((addon, i) => (
        <Addons key={`${section.id}-addon-${i}`} addon={addon} />
      ))}

      {section.executive_menu ? <EjecutivoInsert em={section.executive_menu} /> : null}
    </section>
  );
}

// ── Carta de autor spotlight ────────────────────────────────────────────
function AutorSpotlight({ items, showPrices }: { items: MenuItemX[]; showPrices: boolean }) {
  const railRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const [active, setActive] = useState(0);

  if (!items.length) return null;

  // Track scroll position → active card, for the progress indicator. Throttled
  // to one update per frame so the re-render never lands mid-scroll (which,
  // with mandatory snap, used to yank the rail back to the first card).
  function onScroll() {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const el = railRef.current;
      if (!el) return;
      const max = el.scrollWidth - el.clientWidth;
      const frac = max > 0 ? el.scrollLeft / max : 0;
      setActive(Math.round(frac * (items.length - 1)));
    });
  }

  return (
    <div className={styles.autor}>
      <div className={styles.autorHead}>
        <span className={styles.autorKicker}>Firmas de la casa</span>
        <span className={styles.autorTitle}>Café de autor</span>
        <span className={styles.autorSub}>Tres recetas que sólo existen aquí. Rotan con la temporada.</span>
      </div>
      <div className={styles.autorCarousel} ref={railRef} onScroll={onScroll}>
        {items.map((item) => {
          const photo = itemPhoto(item);
          return (
            <article key={item.id} className={styles.autorCard}>
              <div
                className={styles.autorCardPhoto}
                style={photo ? { backgroundImage: `url(${photo})` } : undefined}
              >
                <div className={styles.autorCardOverlay}>
                  <span className={styles.autorCardName}>{item.name}</span>
                  {showPrices ? <span className={styles.autorCardPrice}>{priceText(item)}</span> : null}
                </div>
              </div>
              <div className={styles.autorCardBody}>
                {item.meta ? <span className={styles.autorCardMeta}>{item.meta}</span> : null}
                {item.description ? <span className={styles.autorCardDesc}>{item.description}</span> : null}
              </div>
            </article>
          );
        })}
      </div>
      <div className={styles.autorScroll}>
        <div className={styles.autorScrollBar} aria-hidden="true">
          {items.map((item, i) => (
            <span
              key={item.id}
              className={`${styles.autorScrollSeg} ${i === active ? styles.autorScrollSegOn : ""}`}
            />
          ))}
        </div>
        <span className={styles.autorScrollText}>
          Desliza · {String(active + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}

// ── Shell ───────────────────────────────────────────────────────────────
export function CartaBody({
  menu,
  locale,
  showPrices
}: {
  menu: PublicMenuView;
  locale: Locale;
  showPrices: boolean;
}) {
  // Default to the nocturno (dark) register; toggle flips a single attribute.
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  function selectLocale(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  }

  const sections = menu.sections as MenuSectionX[];

  const shellRef = useRef<HTMLDivElement>(null);
  const chipNavRef = useRef<HTMLElement | null>(null);
  const chipRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const spyRaf = useRef(0);
  const [activeSec, setActiveSec] = useState<string>(sections[0]?.id ?? "");

  // Measure the fixed site-nav + sticky chip-bar → offsets for the sticky top
  // and the section scroll-margin (so anchor jumps land below both bars).
  useEffect(() => {
    const shell = shellRef.current;
    const nav = document.querySelector<HTMLElement>(".landing-nav");
    const measure = () => {
      const navH = nav?.offsetHeight ?? 56;
      const chipH = chipNavRef.current?.offsetHeight ?? 56;
      shell?.style.setProperty("--chipnav-top", `${navH}px`);
      shell?.style.setProperty("--section-offset", `${navH + chipH + 8}px`);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Scroll-spy: active section = the last one whose top has scrolled above the
  // bottom of the sticky bars. Throttled to one rAF per scroll.
  useEffect(() => {
    function compute() {
      spyRaf.current = 0;
      const line = (chipNavRef.current?.getBoundingClientRect().bottom ?? 120) + 12;
      let current = sections[0]?.id ?? "";
      for (const s of sections) {
        const el = document.getElementById(`sec-${s.id}`);
        if (el && el.getBoundingClientRect().top <= line) current = s.id;
      }
      setActiveSec(current);
    }
    function onScroll() {
      if (spyRaf.current) return;
      spyRaf.current = requestAnimationFrame(compute);
    }
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sections]);

  // Keep the active chip centered in the horizontal rail.
  useEffect(() => {
    const rail = chipNavRef.current;
    const chip = chipRefs.current[activeSec];
    if (!rail || !chip) return;
    const target = chip.offsetLeft - rail.clientWidth / 2 + chip.clientWidth / 2;
    rail.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [activeSec]);

  // Pull the carta-de-autor subgroup out of Cafetería and feature it up top.
  const cafeteria = sections.find((s) => s.id === "cafeteria");
  const autorItems =
    (cafeteria?.subgroups?.find((sg) => sg.id === "cafes-autor")?.items as MenuItemX[]) ?? [];

  // Cafetería in the main flow with the autor subgroup removed (it's featured).
  const renderedSections = sections.map((s) =>
    s.id === "cafeteria"
      ? { ...s, subgroups: (s.subgroups ?? []).filter((sg) => sg.id !== "cafes-autor") }
      : s
  );

  const heroItem = autorItems[0];
  const heroPhoto = heroItem ? itemPhoto(heroItem) : undefined;

  return (
    <div className={styles.shell} data-theme={theme} ref={shellRef}>
      <div className={styles.page}>
      {heroPhoto ? (
        <div className={styles.hero} style={{ backgroundImage: `url(${heroPhoto})` }}>
          <div className={styles.heroCaption}>
            <span className={styles.heroKicker}>Café de autor</span>
            <span className={styles.openerTitle}>{heroItem.name}</span>
          </div>
        </div>
      ) : null}

      <div className={styles.masthead}>
        <div className={styles.editionRow}>
          <span className={styles.edition}>
            {menu.name === "Carta Deriva Coffee Studio" ? "№ 29 · Otoño" : menu.season}
          </span>
          <div className={styles.controls}>
            <div className={styles.langGroup} role="group" aria-label="Idioma">
              {locales.map((loc, i) => (
                <span key={loc} style={{ display: "inline-flex", alignItems: "center" }}>
                  {i > 0 ? (
                    <span className={styles.langSep} aria-hidden="true">
                      ·
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => selectLocale(loc)}
                    aria-pressed={loc === locale}
                    className={`${styles.langBtn} ${loc === locale ? styles.langOn : ""}`}
                  >
                    {LANG_LABELS[loc]}
                  </button>
                </span>
              ))}
            </div>
            <div className={styles.toggle} role="group" aria-label="Tema">
              <button
                type="button"
                className={`${styles.toggleSeg} ${theme === "light" ? styles.toggleSegOn : ""}`}
                aria-pressed={theme === "light"}
                onClick={() => setTheme("light")}
              >
                Día
              </button>
              <button
                type="button"
                className={`${styles.toggleSeg} ${theme === "dark" ? styles.toggleSegOn : ""}`}
                aria-pressed={theme === "dark"}
                onClick={() => setTheme("dark")}
              >
                Noche
              </button>
            </div>
          </div>
        </div>
        <h1 className={styles.mastTitle}>La carta</h1>
        <p className={styles.mastLede}>
          Café de especialidad, panadería de masa madre y cocina de mercado. Vigente al servicio en
          Magnere 1570.
        </p>
        <div className={styles.mastNote}>
          <span className={styles.mastDot} aria-hidden="true" />
          <span className={styles.mastNoteText}>
            Servicio de temporada · {menu.current_schedule === "weekend" ? "fin de semana" : "entre semana"}
          </span>
        </div>
      </div>

      <nav className={styles.chipNav} aria-label="Secciones" ref={chipNavRef}>
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#sec-${s.id}`}
            ref={(el) => {
              chipRefs.current[s.id] = el;
            }}
            className={`${styles.chip} ${activeSec === s.id ? styles.chipActive : ""}`}
          >
            {s.title.replace(/[.·]+$/, "")}
          </a>
        ))}
      </nav>

      <AutorSpotlight items={autorItems} showPrices={showPrices} />

      {renderedSections.map((section) => (
        <Section key={section.id} section={section} showPrices={showPrices} />
      ))}

      <footer className={styles.footer}>
        <p className={styles.footerText}>
          Carta vigente al servicio · precios definitivos en local
          <br />
          Magnere 1570 Local 105 · Providencia · Santiago
          <br />
          Lun–Vie 08:00–21:00 · Sáb 10:00–21:00
        </p>
      </footer>
      </div>
    </div>
  );
}
