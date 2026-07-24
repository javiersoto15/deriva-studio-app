"use client";

import { useState } from "react";

import type {
  PublicMenuView,
  PublicMenuSection,
  PublicMenuSubgroup,
  PublicMenuAddon,
  ExecutiveMenu
} from "../../../../src/api/server";
import { LOCALE_COOKIE, locales, type Locale } from "../../../../src/i18n/locale";
import styles from "../carta.module.css";
import {
  itemPhoto,
  isHighlighted,
  sectionBanner,
  displayTitle,
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

// A full section (chapter). Hero chapters with a banner get a photo opener.
function Section({ section, showPrices }: { section: MenuSectionX; showPrices: boolean }) {
  const banner = sectionBanner(section);
  const isHero = section.emphasis === "hero";
  const directItems = (section.items ?? []) as MenuItemX[];

  return (
    <section id={`sec-${section.id}`} className={styles.chapter}>
      {banner ? (
        <div className={styles.opener} style={{ backgroundImage: `url(${banner})` }}>
          <div className={styles.openerPanel}>
            <span className={styles.openerNumeral}>§{section.numeral}</span>
            <span className={styles.openerTitle}>{displayTitle(section)}</span>
            {section.lede ? <span className={styles.openerLede}>{section.lede}</span> : null}
          </div>
        </div>
      ) : (
        <div className={`${styles.chapterHead} ${isHero ? styles.chapterHeadHero : ""}`}>
          <div className={styles.chapterTitleRow}>
            <span className={styles.numeral}>§{section.numeral}</span>
            <span className={`${styles.chapterTitle} ${isHero ? styles.chapterTitleHero : ""}`}>
              {displayTitle(section)}
            </span>
          </div>
          {section.lede ? <span className={styles.chapterLede}>{section.lede}</span> : null}
        </div>
      )}

      {section.offers?.length ? (
        <div className={styles.offers}>
          <span className={styles.offersLabel}>Combos & ofertas</span>
          {section.offers.map((o) => (
            <div key={o.id} className={styles.offer}>
              <span className={styles.offerTitle}>{o.title}</span>
              <span className={styles.offerDesc}>{o.description}</span>
            </div>
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
  if (!items.length) return null;
  return (
    <div className={styles.autor}>
      <div className={styles.autorHead}>
        <span className={styles.autorKicker}>Firmas de la casa</span>
        <span className={styles.autorTitle}>Café de autor</span>
        <span className={styles.autorSub}>Tres recetas que sólo existen aquí. Rotan con la temporada.</span>
      </div>
      <div className={styles.autorCards}>
        {items.map((item) => {
          const photo = itemPhoto(item);
          return (
            <a key={item.id} href="#sec-cafeteria" className={styles.autorCard}>
              <div
                className={styles.autorCardPhoto}
                style={photo ? { backgroundImage: `url(${photo})` } : undefined}
              />
              <span className={styles.autorCardName}>{item.name}</span>
              <div className={styles.autorCardFoot}>
                {item.meta ? <span className={styles.meta}>{item.meta}</span> : <span />}
                {showPrices ? <span className={styles.price}>{priceText(item)}</span> : null}
              </div>
            </a>
          );
        })}
      </div>
      <div className={styles.autorFooter}>
        <div className={styles.autorTick}>
          <span className={styles.autorTickOn} />
          <span className={styles.autorTickOff} />
          <span className={styles.autorTickOff} />
        </div>
        <span className={styles.autorFootText}>Desliza · rota cada semana</span>
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
    <div className={styles.shell} data-theme={theme}>
      <div className={styles.previewFlag}>Vista previa · carta nueva (no definitiva)</div>

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

      <nav className={styles.chipNav} aria-label="Secciones">
        {sections.map((s, i) => (
          <a key={s.id} href={`#sec-${s.id}`} className={`${styles.chip} ${i === 0 ? styles.chipActive : ""}`}>
            {displayTitle(s).replace(/[.·]+$/, "")}
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
