// Canned fixture data for Companion MVP (dev/MSW only).
// Shapes split into:
//   * fixture*Canonical — match openapi.yaml exactly.
//   * fixture*View      — UI-only enrichments served by mock /view routes.

import type { components } from "../api/schema";

type Member = components["schemas"]["Member"];
type MenuItem = components["schemas"]["MenuItem"];
type BalanceResponse = components["schemas"]["BalanceResponse"];

// ---- Canonical Member (matches Member schema in openapi.yaml) ----
// Default fixture: verified phone, unverified email — the most common state
// for a phone-first signup that captured an email but hasn't confirmed it yet.
export const fixtureMember: Member = {
  id: "mem_javier",
  member_code: "487219",
  member_qr_backup_code: "487219",
  name: "Javier Soto",
  phone: "+56 9 1234 4421",
  phone_verified_at: "2026-04-04T10:00:00Z",
  email: "javier.soto@gmail.com",
  email_verified_at: null,
  preferred_language: "es",
  favorite_drink: "Cortado",
  milk_preference: "Avena",
  caffeine_preference: "Sin azúcar después de las 16",
  dietary_notes: "",
  birthday: "1994-03-14",
  favorite_pickup_time: "08:30",
  last_seen_at: "2026-05-09T08:42:00Z",
  created_at: "2026-04-04T10:00:00Z",
  updated_at: "2026-05-09T08:42:00Z",
  preferences: {
    favorite_drink: "Cortado",
    milk: "Avena",
    caffeine: "Sin azúcar después de las 16",
    favorite_pickup_time: "08:30"
  },
  notification_prefs: { transactional: true, marketing: false }
};

// ---- /me identity payload — augments Member with Deriva user_id +
// linked_providers per the new auth_identities + user_profiles model.
// Firebase UID is intentionally absent — never surfaced to the frontend.
export const fixtureIdentity: components["schemas"]["IdentitySummary"] = {
  user_id: "us_8e3c4d1b9a7f4e2c8d5a6b1f7c9e3a01",
  email_verified_at: null,
  phone_verified_at: "2026-04-04T10:00:00Z",
  linked_providers: [
    {
      provider: "phone",
      subject: "+56912344421",
      verified_at: "2026-04-04T10:00:00Z",
      linked_at: "2026-04-04T10:00:00Z"
    },
    {
      provider: "google.com",
      subject: "javier@gmail.com",
      verified_at: "2026-04-12T18:20:00Z",
      linked_at: "2026-04-12T18:20:00Z"
    }
  ]
};

// ---- §3.5 reconciled member shape (post-redeem-campaign-token success).
// Same as fixtureMember but with email + first_name populated as if the user
// had clicked through an Apertura email and the backend bridged identities. ----
export const fixtureReconciledMember: Member & { first_name: string } = {
  ...fixtureMember,
  email: "javier@derivastudio.cl",
  first_name: "Javier"
};

// ---- Canonical menu (flat MenuItem[]) ----
// Fixtures mirror the real backend shape: bare-slug IDs, normalized taxonomy
// (category_id, section_id, category_label, section_label), with `section` kept
// as the legacy display value. Kept small — this is a dev-only sample, not a
// replica of the 47-item production seed.
const coffee = { category_id: "coffee" as const, category_label: "Coffee" };
export const fixtureMenuItems: MenuItem[] = [
  { id: "espresso", ...coffee, section_id: "espresso", section_label: "Espresso", section: "espresso", name: "Espresso", price_clp: 3000, available: true },
  { id: "cortado", ...coffee, section_id: "espresso", section_label: "Espresso", section: "espresso", name: "Cortado", price_clp: 3200, available: true },
  { id: "latte", ...coffee, section_id: "espresso", section_label: "Espresso", section: "espresso", name: "Latte", price_clp: 3400, available: true },
  { id: "flat-white", ...coffee, section_id: "espresso", section_label: "Espresso", section: "espresso", name: "Flat White", price_clp: 3500, available: true },
  { id: "americano", ...coffee, section_id: "espresso", section_label: "Espresso", section: "espresso", name: "Americano", price_clp: 3200, available: true },
  { id: "mocha", ...coffee, section_id: "espresso", section_label: "Espresso", section: "espresso", name: "Mocha", price_clp: 3900, available: true },
  { id: "pourover", ...coffee, section_id: "filtered", section_label: "Filtered Coffee", section: "filtered", name: "Pour Over", price_clp: 3800, available: true },
  { id: "decaf-filter", ...coffee, section_id: "filtered", section_label: "Filtered Coffee", section: "filtered", name: "Decaf Filter", price_clp: 4200, available: true },
  { id: "coffee-flight", ...coffee, section_id: "filtered", section_label: "Filtered Coffee", section: "filtered", name: "Coffee Flight", price_clp: 5500, available: true },
  { id: "espresso-tonic", ...coffee, section_id: "cold-coffee", section_label: "Cold Coffee", section: "cold-coffee", name: "Espresso Tonic", price_clp: 4900, available: true },
  { id: "citrus-espresso-soda", ...coffee, section_id: "cold-coffee", section_label: "Cold Coffee", section: "cold-coffee", name: "Citrus Espresso Soda", price_clp: 4900, available: true },
  { id: "iced-macchiato", ...coffee, section_id: "cold-coffee", section_label: "Cold Coffee", section: "cold-coffee", name: "Iced Macchiato", price_clp: 4500, available: true },
  { id: "iced-latte", ...coffee, section_id: "cold-coffee", section_label: "Cold Coffee", section: "cold-coffee", name: "Iced Latte", price_clp: 4500, available: true }
];

// ---- Canonical balance ----
export const fixtureBalance: BalanceResponse = {
  balance: 423,
  pending: 0,
  next_reward: {
    name: "Cortado de la casa",
    threshold_points: 700,
    points_remaining: 277
  },
  expires_oldest: "2026-09-09T00:00:00Z"
};

// ---- Canonical OriginCard ----
export const fixtureOriginCanonical: components["schemas"]["OriginCard"] = {
  id: "origin_huehue",
  name: "Huehuetenango · La Esperanza",
  country: "Guatemala",
  region: "Huehuetenango",
  producer: "Familia Mérida",
  process: "Lavado",
  varietal: "Bourbon, Caturra",
  tasting_notes: "Caramelo masticable, mandarina, cierre limpio de cacao oscuro.",
  brew_method: "V60 · 20g / 300ml",
  staff_note:
    "Lo recomendamos como filtro suave para la mañana — pide V60 si lo quieres más floral, Chemex si lo prefieres con cuerpo."
};

// ---- Canonical points ledger (LedgerEntry[]) ----
export const fixtureLedgerEntries: components["schemas"]["LedgerEntry"][] = [
  {
    id: "led_1",
    member_id: "mem_camila",
    points: 62,
    reason: "manual_purchase",
    receipt: "2026-0431",
    created_at: "2026-05-09T13:14:00Z"
  },
  {
    id: "led_2",
    member_id: "mem_camila",
    points: 34,
    reason: "manual_purchase",
    actor_id: "staff_ana",
    created_at: "2026-05-07T20:42:00Z"
  },
  {
    id: "led_3",
    member_id: "mem_camila",
    points: 48,
    reason: "welcome_bonus",
    created_at: "2026-04-04T10:00:00Z"
  }
];

// ---- UI-only fixtures (not in canonical contract) ----

// Member profile augmentation for the UI Cuenta surface.
export const fixtureMemberProfileView = {
  id: fixtureMember.id,
  member_id: fixtureMember.member_code,
  display_name: fixtureMember.name,
  phone: fixtureMember.phone ?? "",
  phone_verified_at: fixtureMember.phone_verified_at,
  balance_points: 423,
  email: fixtureMember.email ?? "",
  email_verified_at: fixtureMember.email_verified_at,
  member_since: "2026-04-04",
  ritual: "Cortado · avena · sin azúcar después de las 16",
  favorite_drink: "Cortado",
  birthday: "14 de marzo",
  language: "Español",
  notifications: "Solo transaccionales",
  digital_receipts: true,
  origins_tasted: 0
};

export const fixtureRewardsDetailed = [
  {
    id: "free_modifier",
    name: "Free modifier or alternative milk",
    threshold_points: 150,
    icon: "cup",
    expiry_label: "SIN VENCIMIENTO",
    eligibility_label: "DISPONIBLE",
    points_cost: 150,
    reward_type: "item",
    item_quantity: 1,
    available: true
  },
  {
    id: "free_classic_coffee",
    name: "Free classic coffee drink",
    threshold_points: 600,
    icon: "milk",
    expiry_label: "SIN VENCIMIENTO",
    eligibility_label: "600 PUNTOS",
    points_cost: 600,
    reward_type: "item",
    item_quantity: 1,
    eligible_item_ids: ["americano", "capuccino"],
    available: false
  },
  {
    id: "free_pastry",
    name: "Free pastry or bakery item",
    threshold_points: 900,
    icon: "cup",
    expiry_label: "SIN VENCIMIENTO",
    eligibility_label: "900 PUNTOS",
    points_cost: 900,
    reward_type: "item",
    item_quantity: 1,
    available: false
  }
];

export const fixtureActivityPreview = [
  { id: "act_p1", label: "Flat white + medialuna", when: "JUE 09 MAY · 09:14", points: 62, tag: null as string | null },
  { id: "act_p2", label: "Cortado", when: "MAR 07 MAY · 16:42 · REG. POR PERSONAL", points: 34, tag: "staff" },
  { id: "act_p3", label: "Espresso doble", when: "LUN 06 MAY · 08:12", points: 28, tag: null as string | null }
];

export const fixtureActivityLedger = [
  {
    id: "led_1",
    at: "2026-05-09T09:14:00-04:00",
    label: "Flat white + medialuna",
    sub: "ESCANEADO EN BARRA",
    amount_clp: 6200,
    points: 62,
    state: "scanned" as const
  },
  {
    id: "led_2",
    at: "2026-05-07T16:42:00-04:00",
    label: "Cortado",
    sub: "REG. POR PERSONAL",
    amount_clp: null,
    points: 34,
    state: "staff" as const
  },
  {
    id: "led_3",
    at: "2026-05-07T16:42:30-04:00",
    label: "Recibo 2026-0431",
    sub: "SOLICITUD EN REVISIÓN · ENVIADA HOY",
    amount_clp: null,
    points: 48,
    state: "pending" as const
  },
  {
    id: "led_4",
    at: "2026-05-04T10:51:00-04:00",
    label: "Espresso doble + Coffee Flight",
    sub: "ESCANEADO · -$2.500 RECOMPENSA",
    amount_clp: null,
    points: 91,
    state: "scanned" as const
  }
];

export const fixtureFavorites = {
  saved: [
    { id: "fav_1", name: "Flat White", sub: "6 OZ · ENTERA · SIN AZÚCAR", price_clp: 3500 },
    { id: "fav_2", name: "Cortado de la casa", sub: "4 OZ · DOBLE SHOT", price_clp: 3200 },
    { id: "fav_3", name: "V60 filtrado del día", sub: "300 ML · ORIGEN ROTATIVO", price_clp: 3800 },
    { id: "fav_4", name: "Mate del estudio", sub: "RONDA COMPARTIDA", price_clp: 3800 }
  ],
  suggestions: [
    { id: "sug_1", name: "Cappuccino", sub: "Por tus flat whites de la mañana" },
    { id: "sug_2", name: "Medialuna de jamón", sub: "Pareja habitual del cortado" }
  ]
};

// UI-only rich origin-card view (for /menu/origins/{id}/view).
export const fixtureOriginCardView = {
  id: "origin_huehue",
  country: "Guatemala",
  region: "Huehuetenango · La Esperanza",
  producer: "Familia Mérida",
  variety: "Bourbon, Caturra",
  process: "Lavado",
  method: "V60 · 20g / 300ml",
  name_a: "Huehuetenango,",
  name_b: "La Esperanza",
  body: "Microlote de altura, finca familiar a 1.700 msnm. Caramelo masticable, mandarina, y un cierre limpio de cacao oscuro.",
  barista_note:
    "\"Lo recomendamos como filtro suave para la mañana — pide V60 si lo quieres más floral, Chemex si lo prefieres con cuerpo.\"",
  barista_attrib: "TOMÁS, BARRA · 02 MAY"
};

// UI-only rich item-detail (for /menu/items/{id}/view).
export const fixtureItemDetailView: Record<
  string,
  {
    id: string;
    name: string;
    section_eyebrow: string;
    size_note: string;
    price_clp: number;
    spec: { label: string; value: string }[];
    allergens: string[];
    barista_note: string;
  }
> = {
  "flat-white": {
    id: "flat-white",
    name: "Flat White",
    section_eyebrow: "ESPRESSO · CON LECHE",
    size_note: "6 OZ · MICROESPUMA SEDOSA",
    price_clp: 3500,
    spec: [
      { label: "TUESTE", value: "Medio · house blend" },
      { label: "ORIGEN", value: "Rotativo · ver carta" },
      { label: "LECHE", value: "Entera Colún" },
      { label: "EXTRACCIÓN", value: "18g · 30s · 36g" },
      { label: "VOLUMEN", value: "170 ml" }
    ],
    allergens: ["Lactosa"],
    barista_note: "Pídelo más caliente si vienes de la calle — la microespuma aguanta."
  }
};

// UI-only claim-status surface (canonical only exposes POST /missing-points-claims).
export const fixtureClaims = [
  {
    id: "clm_pending",
    status: "pending" as const,
    receipt: "2026-0431",
    headline: "Tu solicitud está en revisión.",
    body: "TE AVISAMOS EN MENOS DE 24H"
  },
  {
    id: "clm_approved",
    status: "approved" as const,
    receipt: "2026-0408",
    headline: "+48 pts sumados a tu actividad.",
    body: "APROBADO POR · CAMILA R"
  },
  {
    id: "clm_rejected",
    status: "rejected" as const,
    receipt: "2026-0372",
    headline: "No pudimos validar este recibo.",
    body: "MOTIVO · NO COINCIDE CON UNA VENTA REGISTRADA"
  }
];
