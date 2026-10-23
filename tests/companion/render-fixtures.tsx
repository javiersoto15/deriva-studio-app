import { readFileSync, writeFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { PublicMenuView } from "../../src/api/hooks";
import { MenuOfferCard, type MenuOfferCardLabels } from "../../app/(companion)/carta/_components/MenuOfferCard";
import { MenuSections } from "../../app/(companion)/carta/_components/MenuSections";
import { TodayMenuPanels, type TodayMenuLabels } from "../../app/(companion)/hoy/_components/TodayMenuPanels";
import { ReceiptClaimForm, type ReceiptClaimFormLabels } from "../../app/(companion)/sumar-visita/_components/ReceiptClaimForm";
import { ReviewSubmissionForm, type ReviewSubmissionLabels } from "../../app/(companion)/feedback/_components/ReviewSubmissionForm";
import { collectAvailableAuthorCoffees, collectMenuPromotions, dailySelectionIndex } from "../../src/companion/menu-discovery";
import { offerShape } from "../../src/api/offer-variants";
import { colors } from "../../src/design/tokens";
import type { Locale } from "../../src/i18n/locale";

// Usage: npm run render:companion-fixtures -- [es|en|pt-BR] [menu-fixture.json] [output.html]
const locales = ["es", "en", "pt-BR"] as const;
const localeArg = process.argv[2] ?? "es";
if (!locales.includes(localeArg as Locale)) throw new Error(`Unsupported UI locale: ${localeArg}`);
const locale = localeArg as Locale;
const defaultFixtures: Record<Locale, string> = {
  es: "/tmp/deriva-companion-menu-20261014-es.json",
  en: "/tmp/deriva-companion-menu-20261014-en.json",
  "pt-BR": "/tmp/deriva-companion-menu-20261014-pt.json"
};
const fixturePath = process.argv[3] ?? defaultFixtures[locale];
const outputPath = process.argv[4] ?? `/tmp/deriva-companion-ssr-fixture-${locale}.html`;
const menu = JSON.parse(readFileSync(fixturePath, "utf8")) as PublicMenuView;
const messages = JSON.parse(readFileSync(`${process.cwd()}/src/i18n/messages/${locale}.json`, "utf8"));
const offerLabels: MenuOfferCardLabels = {
  offer: messages.menu.offer,
  includes: messages.menu.offer_includes,
  rates: messages.menu.offer_rates,
  soldOut: messages.menu.offer_sold_out,
  included: messages.menu.offer_included,
  fixedPrice: messages.menu.offer_fixed_price,
  supplement: messages.menu.offer_supplement,
  controlledSelection: messages.menu.offer_controlled_selection
};
const todayLabels: TodayMenuLabels = {
  promotions: messages.today.promotions,
  promotionsEmpty: messages.today.promotions_empty,
  authorCoffee: messages.today.author_coffee,
  authorCoffeeItem: messages.today.author_coffee_item,
  authorEmpty: messages.today.author_empty,
  previousPromotion: messages.today.previous_promotion,
  nextPromotion: messages.today.next_promotion,
  previousCoffee: messages.today.previous_coffee,
  nextCoffee: messages.today.next_coffee,
  viewMenu: messages.today.view_menu,
  position: messages.today.position,
  authorBy: messages.today.author_by
};
const promotions = collectMenuPromotions(menu);
const authors = collectAvailableAuthorCoffees(menu);
const timeZone = "America/Santiago";
const todayParts = new Intl.DateTimeFormat("en-CA", {
  timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
}).formatToParts(new Date());
const todayValues = Object.fromEntries(todayParts.map((part) => [part.type, part.value]));
const fixtureDate = `${todayValues.year}-${todayValues.month}-${todayValues.day}`;
const firstPromotionIndex = dailySelectionIndex(promotions.length, fixtureDate, "promotion");
const firstAuthorIndex = dailySelectionIndex(authors.length, fixtureDate, "author");
const standaloneOffer = promotions.find(({ offer }) => offerShape(offer) === "variants") ?? promotions[0];
const receiptLabels: ReceiptClaimFormLabels = {
  codeLabel: messages.receiptClaim.code_label,
  verificationNote: messages.receiptClaim.verification_note,
  submit: messages.receiptClaim.submit,
  verifying: messages.receiptClaim.verifying,
  errors: {
    error_empty: messages.receiptClaim.error_empty,
    error_refund: messages.receiptClaim.error_refund,
    error_duplicate: messages.receiptClaim.error_duplicate,
    error_too_old: messages.receiptClaim.error_too_old,
    error_future: messages.receiptClaim.error_future,
    error_not_successful: messages.receiptClaim.error_not_successful,
    error_currency: messages.receiptClaim.error_currency,
    error_policy: messages.receiptClaim.error_policy,
    error_invalid: messages.receiptClaim.error_invalid,
    error_session: messages.receiptClaim.error_session,
    error_not_found: messages.receiptClaim.error_not_found,
    error_verifier: messages.receiptClaim.error_verifier,
    error_unavailable: messages.receiptClaim.error_unavailable,
    error_generic: messages.receiptClaim.error_generic
  }
};
const reviewLabels: ReviewSubmissionLabels = {
  backActivity: messages.feedback.back_activity,
  skip: messages.feedback.skip,
  eyebrow: messages.feedback.eyebrow,
  title: messages.feedback.title,
  intro: messages.feedback.intro,
  visitDate: messages.feedback.visit_date,
  rating: messages.feedback.rating,
  ratingAria: messages.feedback.rating_aria,
  ratingOptionLabels: [1, 2, 3, 4, 5].map((rating) => messages.feedback.rating_option.replace("{rating}", String(rating))) as ReviewSubmissionLabels["ratingOptionLabels"],
  ratingLow: messages.feedback.rating_low,
  ratingHigh: messages.feedback.rating_high,
  bodyLabel: messages.feedback.body_label,
  bodyPlaceholder: messages.feedback.body_placeholder,
  bodyHint: messages.feedback.body_hint.replace("{count}", "20"),
  sending: messages.feedback.sending,
  submit: messages.feedback.submit,
  submittedEyebrow: messages.feedback.submitted_eyebrow,
  submittedTitle: messages.feedback.submitted_title,
  pendingModeration: messages.feedback.pending_moderation,
  backWallet: messages.feedback.back_wallet
};
const fixtureHeadings: Record<Locale, [string, string, string, string, string]> = {
  es: ["Hoy · menú real", "Carta · todas las secciones", "Oferta · variante de precio", "Sumar visita · código de transacción", "Opinión · confirmación"],
  en: ["Today · live menu", "Menu · all sections", "Offer · variant pricing", "Add a visit · transaction code", "Feedback · confirmation"],
  "pt-BR": ["Hoje · cardápio real", "Cardápio · todas as seções", "Oferta · preços por opção", "Adicionar visita · código da transação", "Opinião · confirmação"]
};
const queryClient = new QueryClient();
const fixtureBody = createElement(
  QueryClientProvider,
  { client: queryClient },
  createElement("main", { className: "fixture-shell" },
      createElement("section", { className: "fixture-screen" },
        createElement("h1", { className: "fixture-heading" }, fixtureHeadings[locale][0]),
        createElement(TodayMenuPanels, {
          menu, locale, promotionIndex: firstPromotionIndex, authorIndex: firstAuthorIndex,
          labels: todayLabels, offerLabels, onPromotionIndexChange: () => {}, onAuthorIndexChange: () => {}
        })
      ),
      createElement("section", { className: "fixture-screen" },
        createElement("h1", { className: "fixture-heading" }, fixtureHeadings[locale][1]),
        createElement(MenuSections, { menu, locale, offerLabels })
      ),
      createElement("section", { className: "fixture-screen" },
        createElement("h1", { className: "fixture-heading" }, fixtureHeadings[locale][2]),
        standaloneOffer ? createElement(MenuOfferCard, { offer: standaloneOffer.offer, sectionTitle: standaloneOffer.sectionTitle, locale, labels: offerLabels }) : null
      ),
      createElement("section", { className: "fixture-screen" },
        createElement("h1", { className: "fixture-heading" }, fixtureHeadings[locale][3]),
        createElement(ReceiptClaimForm, {
          code: "", errorKey: null, pending: false, labels: receiptLabels,
          onCodeChange: () => {}, onSubmit: (event) => event.preventDefault()
        })
      ),
      createElement("section", { className: "fixture-screen" },
        createElement("h1", { className: "fixture-heading" }, locale === "es" ? "Compartir opinión · formulario" : locale === "en" ? "Share feedback · form" : "Compartilhar opinião · formulário"),
        createElement(ReviewSubmissionForm, {
          labels: reviewLabels, rating: 0, reviewBody: "", visitDate: "2026-10-14", todayDate: "2026-10-14",
          errorText: null, pending: false, submitted: false,
          onRatingChange: () => {}, onReviewBodyChange: () => {}, onVisitDateChange: () => {}, onSubmit: (event) => event.preventDefault()
        })
      ),
      createElement("section", { className: "fixture-screen" },
        createElement("h1", { className: "fixture-heading" }, fixtureHeadings[locale][4]),
        createElement(ReviewSubmissionForm, {
          labels: reviewLabels, rating: 5, reviewBody: "El equipo fue muy atento y el café estaba excelente.", visitDate: "2026-10-14", todayDate: "2026-10-14",
          errorText: null, pending: false, submitted: true,
          onRatingChange: () => {}, onReviewBodyChange: () => {}, onVisitDateChange: () => {}, onSubmit: (event) => event.preventDefault()
        })
      )
  )
);
const screens = createElement(NextIntlClientProvider, { locale, messages, children: fixtureBody });
const html = renderToStaticMarkup(screens);
const css = `
  :root { --font-display: 'Cormorant Garamond', Georgia, serif; --font-tracked: 'Poppins', Arial, sans-serif; --font-mono: 'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace; }
  * { box-sizing: border-box; }
  body { margin: 0; background: ${colors.beige100}; color: ${colors.ink900}; font-family: var(--font-tracked); }
  .fixture-shell { width: 100%; max-width: 760px; margin: 0 auto; min-height: 100vh; background: #fffdf9; }
  .fixture-screen { min-height: 740px; padding: 24px 16px 40px; border-bottom: 8px solid ${colors.beige200}; }
  .fixture-heading { margin: 0 0 16px; font: italic 300 34px/1.1 var(--font-display); color: ${colors.brown900}; }
`;
writeFileSync(outputPath, `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Deriva companion fixture</title><style>${css}</style></head><body>${html}</body></html>`, "utf8");
process.stdout.write(`${outputPath}\n`);
