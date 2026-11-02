import type { Locale } from "../../../../../src/i18n/locale";

// UI chrome for the door carta. Backend copy (section titles, item names,
// descriptions, offer text) is always rendered verbatim — this file only holds
// the frame around it, in the same local-dictionary pattern as offer-copy.ts.
// Door names and blurbs come from the backend (`section.group`).

type Copy = {
  title: string;
  fullMenu: string;
  options: (n: number) => string;
  back: string;
  switchTo: string;
  combos: string;
  combosTitle: string;
  combosCount: (n: number) => string;
  combosSub: string;
  all: string;
  combo: string;
  from: string;
  pair: string;
  seeCombo: string;
  onMenu: (price: string) => string;
  signature: string;
  by: string;
  open: (closes: string) => string;
  closed: string;
  close: string;
  allergens: string;
  includes: string;
  pick: string;
  milk: string;
  languages: string;
  /** Curated picks chrome. The picks themselves come from the backend. */
  railTitle: string;
  picksStop: string;
  tagNew: string;
  tagRecommended: string;
  pairsWith: string;
  allergenNames: Record<string, string>;
};

export const CARTA_COPY: Record<Locale, Copy> = {
  es: {
    title: "La carta",
    fullMenu: "Toda la carta",
    options: (n) => `${n} opciones`,
    back: "La carta",
    switchTo: "Ir a",
    combos: "Combos y descuentos",
    combosTitle: "Combos y\ndescuentos",
    combosCount: (n) => `${n} vigentes`,
    combosSub: "Para compartir, con su propio precio",
    all: "Todos",
    combo: "% Combo",
    from: "desde",
    pair: "el par",
    seeCombo: "Ver combo",
    onMenu: (price) => `en carta ${price} c/u`,
    signature: "De la casa",
    by: "por",
    open: (closes) => `Abierto · cierra ${closes}`,
    closed: "Hoy cerrado",
    close: "Cerrar",
    allergens: "Alérgenos",
    includes: "Incluye",
    pick: "Elige una opción",
    milk: "Personaliza",
    languages: "Idioma",
    railTitle: "Nuevo y recomendado",
    picksStop: "Recomendados",
    tagNew: "Nuevo",
    tagRecommended: "Recomendado",
    pairsWith: "Va bien con",
    allergenNames: {
      gluten: "Gluten", lacteos: "Lácteos", huevo: "Huevo", frutos_secos: "Frutos secos",
      mani: "Maní", soya: "Soya", pescado: "Pescado", mostaza: "Mostaza", mariscos: "Mariscos", sesamo: "Sésamo"
    }
  },
  en: {
    title: "The menu",
    fullMenu: "The whole menu",
    options: (n) => `${n} options`,
    back: "The menu",
    switchTo: "Go to",
    combos: "Combos and deals",
    combosTitle: "Combos and\ndeals",
    combosCount: (n) => `${n} available`,
    combosSub: "To share, each with its own price",
    all: "All",
    combo: "% Combo",
    from: "from",
    pair: "per pair",
    seeCombo: "See combo",
    onMenu: (price) => `${price} each on the menu`,
    signature: "House pick",
    by: "by",
    open: (closes) => `Open · closes ${closes}`,
    closed: "Closed today",
    close: "Close",
    allergens: "Allergens",
    includes: "Includes",
    pick: "Pick an option",
    milk: "Customise",
    languages: "Language",
    railTitle: "New and recommended",
    picksStop: "Recommended",
    tagNew: "New",
    tagRecommended: "Recommended",
    pairsWith: "Goes well with",
    allergenNames: {
      gluten: "Gluten", lacteos: "Dairy", huevo: "Egg", frutos_secos: "Tree nuts",
      mani: "Peanut", soya: "Soy", pescado: "Fish", mostaza: "Mustard", mariscos: "Shellfish", sesamo: "Sesame"
    }
  },
  "pt-BR": {
    title: "O cardápio",
    fullMenu: "O cardápio completo",
    options: (n) => `${n} opções`,
    back: "O cardápio",
    switchTo: "Ir para",
    combos: "Combos e descontos",
    combosTitle: "Combos e\ndescontos",
    combosCount: (n) => `${n} disponíveis`,
    combosSub: "Para dividir, cada um com seu preço",
    all: "Todos",
    combo: "% Combo",
    from: "a partir de",
    pair: "o par",
    seeCombo: "Ver combo",
    onMenu: (price) => `${price} cada no cardápio`,
    signature: "Da casa",
    by: "por",
    open: (closes) => `Aberto · fecha ${closes}`,
    closed: "Fechado hoje",
    close: "Fechar",
    allergens: "Alérgenos",
    includes: "Inclui",
    pick: "Escolha uma opção",
    milk: "Personalize",
    languages: "Idioma",
    railTitle: "Novo e recomendado",
    picksStop: "Recomendados",
    tagNew: "Novo",
    tagRecommended: "Recomendado",
    pairsWith: "Combina com",
    allergenNames: {
      gluten: "Glúten", lacteos: "Lácteos", huevo: "Ovo", frutos_secos: "Castanhas",
      mani: "Amendoim", soya: "Soja", pescado: "Peixe", mostaza: "Mostarda", mariscos: "Frutos do mar", sesamo: "Gergelim"
    }
  }
};
