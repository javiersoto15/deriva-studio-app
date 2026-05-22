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

// ---- Canonical OriginCard map (current DACH rotation) ----
// IDs match backend seeds: orig_house_blend_dach (all-purpose), orig_mexico_descafeinado_dach
// (decaf), orig_etiopia_yirgacheffe_dach (specialty rotation).
export const fixtureOriginsCanonical: Record<string, components["schemas"]["OriginCard"]> = {
  orig_house_blend_dach: {
    id: "orig_house_blend_dach",
    name: "House Blend · DACH",
    country: "Nicaragua · Colombia · Kenia",
    region: "Mezcla de origen",
    producer: "DACH",
    process: "Lavado y Natural",
    varietal: "Atuai rojo y amarillo, Castillo, Caturra, Batian",
    tasting_notes: "Chocolate, fruta tropical, durazno, avellana, caramelo, té negro.",
    brew_method: "Espresso · 18g / 36g",
    staff_note:
      "Blend de la casa, redondo y dulce — funciona en cualquier preparación con espresso o leche."
  },
  orig_mexico_descafeinado_dach: {
    id: "orig_mexico_descafeinado_dach",
    name: "Mexico Descafeinado · DACH",
    country: "México",
    region: "Chiapas",
    producer: "DACH",
    process: "Lavado · Descafeinado Mountain Water",
    varietal: "Bourbon, Catimor, Garnica, Typica",
    tasting_notes: "Canela, tabaco, vainilla, azúcar de caña, caramelo claro, especias.",
    brew_method: "V60 · 18g / 300ml",
    staff_note:
      "Descafeinado al agua — cuerpo cremoso y dulce especiado. Perfecto para la sobremesa."
  },
  orig_etiopia_yirgacheffe_dach: {
    id: "orig_etiopia_yirgacheffe_dach",
    name: "Etiopia Yirgacheffe · DACH",
    country: "Etiopía",
    region: "Yirgacheffe",
    producer: "DACH",
    process: "Lavado",
    varietal: "Heirloom",
    tasting_notes: "Chocolate negro, jazmín, té negro, acidez málica/cítrica, cuerpo cremoso.",
    brew_method: "V60 · 20g / 300ml",
    staff_note:
      "Rotación de filtrado actual — pide V60 si lo quieres más floral, Chemex para más cuerpo."
  }
};

// Default origin in barra (used for /menu/origins/:id calls that hit MSW without a
// specific id and for the carta `today_origin` slot).
export const fixtureOriginCanonical = fixtureOriginsCanonical.orig_house_blend_dach;

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

// UI-only rich origin-card view (for /menu/origins/{id}/view). Mirrors the
// MenuItemView origin rotation so each origin link renders distinct copy.
export const fixtureOriginViews: Record<
  string,
  {
    id: string;
    country: string;
    region: string;
    producer: string;
    variety: string;
    process: string;
    method: string;
    name_a: string;
    name_b: string;
    body: string;
    barista_note: string;
    barista_attrib: string;
  }
> = {
  orig_house_blend_dach: {
    id: "orig_house_blend_dach",
    country: "Nicaragua · Colombia · Kenia",
    region: "Mezcla de origen · DACH",
    producer: "DACH",
    variety: "Atuai rojo y amarillo, Castillo, Caturra, Batian",
    process: "Lavado y Natural",
    method: "Espresso · 18g / 36g",
    name_a: "House Blend,",
    name_b: "DACH",
    body: "Blend de la casa, cosecha 2024-2025 a 1.850 msnm promedio. Chocolate, fruta tropical, durazno y avellana sobre un cierre dulce de caramelo y té negro. Cuerpo completo y cremoso para cualquier espresso o bebida con leche.",
    barista_note:
      "\"Es nuestro caballito de batalla — equilibrado, dulce, perdona pequeños cambios de receta sin perder carácter.\"",
    barista_attrib: "BARRA DERIVA · 14 MAY"
  },
  orig_mexico_descafeinado_dach: {
    id: "orig_mexico_descafeinado_dach",
    country: "México",
    region: "Chiapas",
    producer: "DACH",
    variety: "Bourbon, Catimor, Garnica, Typica",
    process: "Lavado · Descafeinado Mountain Water",
    method: "V60 · 18g / 300ml",
    name_a: "Mexico,",
    name_b: "Descafeinado",
    body: "Descafeinado al agua (Mountain Water), cosecha 2023-2024 entre 1.100 y 1.300 msnm. Canela, tabaco, vainilla y caramelo claro sobre un cuerpo aceitoso y cremoso. La opción cuando quieres café sin cafeína pero con personalidad.",
    barista_note:
      "\"Para la sobremesa o pedidos tarde — el dulzor especiado aguanta bien en filtrado y en espresso.\"",
    barista_attrib: "BARRA DERIVA · 14 MAY"
  },
  orig_etiopia_yirgacheffe_dach: {
    id: "orig_etiopia_yirgacheffe_dach",
    country: "Etiopía",
    region: "Yirgacheffe",
    producer: "DACH",
    variety: "Heirloom",
    process: "Lavado",
    method: "V60 · 20g / 300ml",
    name_a: "Etiopia,",
    name_b: "Yirgacheffe",
    body: "Lavado de Yirgacheffe, cosecha 2023-2024 entre 1.700 y 2.200 msnm. Chocolate negro, jazmín y té negro sobre una acidez málica/cítrica viva y un cuerpo cremoso envolvente. Nuestra rotación actual de filtrado.",
    barista_note:
      "\"Pídelo en V60 si lo quieres más floral, Chemex para realzar el cuerpo. Brilla en el Coffee Flight.\"",
    barista_attrib: "BARRA DERIVA · 14 MAY"
  }
};

// Default view (House Blend) for callers that don't disambiguate by id.
export const fixtureOriginCardView = fixtureOriginViews.orig_house_blend_dach;

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
> = (() => {
  const HOUSE = "House Blend · DACH";
  const DECAF = "Mexico Descafeinado · DACH";
  const ROTATION = "Etiopia Yirgacheffe · DACH";
  const dairy = ["Lácteos"];
  const espressoSpec = (volume: string, extract = "18g · 30s · 36g") => [
    { label: "TUESTE", value: "Medio · house blend" },
    { label: "ORIGEN", value: HOUSE },
    { label: "EXTRACCIÓN", value: extract },
    { label: "VOLUMEN", value: volume }
  ];
  const milkSpec = (volume: string) => [
    { label: "TUESTE", value: "Medio · house blend" },
    { label: "ORIGEN", value: HOUSE },
    { label: "LECHE", value: "Entera Colún" },
    { label: "EXTRACCIÓN", value: "18g · 30s · 36g" },
    { label: "VOLUMEN", value: volume }
  ];
  return {
    espresso: {
      id: "espresso",
      name: "Espresso",
      section_eyebrow: "ESPRESSO · DOBLE",
      size_note: "60 ML · CAPA DE CREMA AVELLANA",
      price_clp: 3000,
      spec: espressoSpec("60 ml"),
      allergens: [],
      barista_note: "Tómalo en los primeros 30 segundos — el dulzor está en la primera mitad."
    },
    cortado: {
      id: "cortado",
      name: "Cortado",
      section_eyebrow: "ESPRESSO · CON LECHE",
      size_note: "90 ML · LECHE APENAS TEXTURIZADA",
      price_clp: 3200,
      spec: milkSpec("90 ml"),
      allergens: dairy,
      barista_note: "Pídelo más fuerte si vienes con sed de café — la base es doble shot."
    },
    cappuccino: {
      id: "cappuccino",
      name: "Cappuccino",
      section_eyebrow: "ESPRESSO · CON LECHE",
      size_note: "180 ML · ESPUMA FIRME",
      price_clp: 3200,
      spec: milkSpec("180 ml"),
      allergens: dairy,
      barista_note: "Servido clásico: espuma firme y café presente. Ideal de mañana."
    },
    latte: {
      id: "latte",
      name: "Latte",
      section_eyebrow: "ESPRESSO · CON LECHE",
      size_note: "240 ML · LECHE LARGA Y SEDOSA",
      price_clp: 3400,
      spec: milkSpec("240 ml"),
      allergens: dairy,
      barista_note: "Para los que quieren café suave y largo — la microespuma queda sedosa."
    },
    "flat-white": {
      id: "flat-white",
      name: "Flat White",
      section_eyebrow: "ESPRESSO · CON LECHE",
      size_note: "180 ML · MICROESPUMA SEDOSA",
      price_clp: 3500,
      spec: milkSpec("180 ml"),
      allergens: dairy,
      barista_note: "Pídelo más caliente si vienes de la calle — la microespuma aguanta."
    },
    americano: {
      id: "americano",
      name: "Americano",
      section_eyebrow: "ESPRESSO · LARGADO",
      size_note: "240 ML · CUERPO REDONDO",
      price_clp: 3200,
      spec: espressoSpec("240 ml + agua caliente"),
      allergens: [],
      barista_note: "Para tomar pausado — el agua se agrega después del shot para no perder crema."
    },
    mocha: {
      id: "mocha",
      name: "Mocha",
      section_eyebrow: "ESPRESSO · CON CHOCOLATE",
      size_note: "240 ML · CHOCOLATE SEMIAMARGO",
      price_clp: 3900,
      spec: milkSpec("240 ml"),
      allergens: dairy,
      barista_note: "Chocolate de la casa, semiamargo — equilibra el dulzor con la acidez del blend."
    },
    pourover: {
      id: "pourover",
      name: "Pour Over",
      section_eyebrow: "FILTRADO · ROTACIÓN ACTUAL",
      size_note: "300 ML · TAZA LIMPIA",
      price_clp: 3800,
      spec: [
        { label: "TUESTE", value: "Claro · rotación" },
        { label: "ORIGEN", value: ROTATION },
        { label: "MÉTODO", value: "V60 · 20g / 300ml" },
        { label: "VOLUMEN", value: "300 ml" }
      ],
      allergens: [],
      barista_note: "Pídelo en V60 para acentuar lo floral, Chemex si lo prefieres con más cuerpo."
    },
    "decaf-filter": {
      id: "decaf-filter",
      name: "Decaf Filter",
      section_eyebrow: "FILTRADO · DESCAFEINADO",
      size_note: "300 ML · DULZOR ESPECIADO",
      price_clp: 4200,
      spec: [
        { label: "TUESTE", value: "Medio · descafeinado" },
        { label: "ORIGEN", value: DECAF },
        { label: "MÉTODO", value: "V60 · 18g / 300ml" },
        { label: "VOLUMEN", value: "300 ml" }
      ],
      allergens: [],
      barista_note: "Descafeinado al agua (Mountain Water). Sabor pleno, sin cafeína."
    },
    "coffee-flight": {
      id: "coffee-flight",
      name: "Coffee Flight",
      section_eyebrow: "FILTRADO · TRES PASADAS",
      size_note: "3 × 90 ML · ESPRESSO, FILTRADO Y LECHE",
      price_clp: 5500,
      spec: [
        { label: "TUESTE", value: "Claro · rotación" },
        { label: "ORIGEN", value: ROTATION },
        { label: "MÉTODO", value: "Espresso + V60 + cortado" },
        { label: "VOLUMEN", value: "3 × 90 ml" }
      ],
      allergens: dairy,
      barista_note: "Tres preparaciones del mismo grano para entender cómo cambia en cada formato."
    },
    "espresso-tonic": {
      id: "espresso-tonic",
      name: "Espresso Tonic",
      section_eyebrow: "FRÍO · CON CAFÉ",
      size_note: "300 ML · BURBUJA Y CÍTRICO",
      price_clp: 4900,
      spec: [
        { label: "TUESTE", value: "Medio · house blend" },
        { label: "ORIGEN", value: HOUSE },
        { label: "BASE", value: "Tónica fría + cáscara de naranja" },
        { label: "VOLUMEN", value: "300 ml" }
      ],
      allergens: [],
      barista_note: "Revuelve suave una vez — el espresso baja y se mezcla solo con la tónica."
    },
    "citrus-espresso-soda": {
      id: "citrus-espresso-soda",
      name: "Citrus Espresso Soda",
      section_eyebrow: "FRÍO · CON CAFÉ",
      size_note: "330 ML · POMELO Y SODA",
      price_clp: 4900,
      spec: [
        { label: "TUESTE", value: "Medio · house blend" },
        { label: "ORIGEN", value: HOUSE },
        { label: "BASE", value: "Soda artesanal + reducción de pomelo" },
        { label: "VOLUMEN", value: "330 ml" }
      ],
      allergens: [],
      barista_note: "Fresco y seco — la reducción de pomelo se queda en el fondo, busca el final."
    },
    "iced-macchiato": {
      id: "iced-macchiato",
      name: "Iced Macchiato",
      section_eyebrow: "FRÍO · CON LECHE",
      size_note: "300 ML · MARCA DE CAFÉ AL FINAL",
      price_clp: 4500,
      spec: [
        { label: "TUESTE", value: "Medio · house blend" },
        { label: "ORIGEN", value: HOUSE },
        { label: "LECHE", value: "Entera Colún" },
        { label: "VOLUMEN", value: "300 ml" }
      ],
      allergens: dairy,
      barista_note: "La capa de espresso va arriba: revuelve antes de la primera bajada."
    },
    "iced-latte": {
      id: "iced-latte",
      name: "Iced Latte",
      section_eyebrow: "FRÍO · CON LECHE",
      size_note: "330 ML · SUAVE Y LECHOSO",
      price_clp: 4500,
      spec: [
        { label: "TUESTE", value: "Medio · house blend" },
        { label: "ORIGEN", value: HOUSE },
        { label: "LECHE", value: "Entera Colún" },
        { label: "VOLUMEN", value: "330 ml" }
      ],
      allergens: dairy,
      barista_note: "Para tomar lento — el hielo derrite y el café se va abriendo en la taza."
    }
  };
})();

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
