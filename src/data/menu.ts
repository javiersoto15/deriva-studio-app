export type DietaryTag =
  | "Vegetariano"
  | "Vegetariano · opt."
  | "Vegetariano · base"
  | "Vegano"
  | "Sin gluten"
  | "Pastrami"
  | "Cerdo ahumado"
  | "Carne lenta"
  | "Cocción lenta"
  | "Pescado crudo"
  | "Con proteína"
  | "Para compartir"
  | "Para compartir · opt."
  | "Incluye café y jugo"
  | "Sin costo · base"
  | "Precio fijo"
  | "Precio fijo · c/u"
  | "Precio pendiente"
  | "Full size · 1 pax"
  | "Doble · 60 ml"
  | "90 ml"
  | "180 ml"
  | "240 ml"
  | "300 ml"
  | "330 ml"
  | "3 × 90 ml"
  | "Porción · 3 unid."
  | "Porción · 5 unid."
  | "Por unidad"
  | "Variedad"
  | "Para 2 · ampliable";

export type Schedule = "weekday" | "weekend";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  meta?: DietaryTag;
  priceClp?: number;
  priceLabel?: string;
  signature?: boolean;
  tastingNote?: string;
  unavailable?: boolean;
  schedule?: readonly Schedule[];
};

export type MenuAddons = {
  label: string;
  hint?: string;
  chips: string[];
};

export type MenuSubgroup = {
  id: string;
  label: string;
  items: MenuItem[];
  addons?: MenuAddons;
  schedule?: readonly Schedule[];
};

// Optional service window for sections served at specific hours
// (Desayunos y Once, Cocina). Rendered as a small typographic chip in
// MenuSection. Bread sections (Croissants, Baguettes, etc.) run all day
// and leave this undefined.
export type MenuSection = {
  id: string;
  numeral: string;
  title: string;
  italicWord?: string;
  fullItalic?: boolean;
  emphasis: "hero" | "primary" | "utility";
  lede: string;
  ledeItalic?: boolean;
  serviceWindow?: string;
  // When `addons` is set, by default they render after all subgroups. Set
  // this to a subgroup id (e.g. "infusiones") to render the addons just
  // before that subgroup — useful when addons apply only to the preceding
  // subgroups (Cafetería: Extras/Leches apply to coffee, not to Té).
  addonsBefore?: string;
  schedule?: readonly Schedule[];
  // Overrides the "N ítems" count chip in the section header — used by the
  // Menu Ejecutivo to show "HOY · MIÉ 20 MAY" instead of an item count.
  countOverride?: string;
  items?: MenuItem[];
  subgroups?: MenuSubgroup[];
  addons?: MenuAddons | MenuAddons[];
};

// Prices stay hidden on the public carta until the apertura pricing reveal.
// Sunday 2026-05-17 00:00 America/Santiago (UTC-4 in May, post-DST).
export const PRICING_OPEN_AT = new Date("2026-05-17T00:00:00-04:00");

export const menuSections: MenuSection[] = [
  {
    id: "cafeteria",
    numeral: "00",
    title: "Cafetería",
    fullItalic: true,
    emphasis: "hero",
    lede: "Espresso, filtrados y bebidas con café. Grano de especialidad, tostado para mesa.",
    ledeItalic: true,
    subgroups: [
      {
        id: "espresso",
        label: "Barra de espresso",
        items: [
          {
            id: "espresso",
            name: "Espresso",
            meta: "Doble · 60 ml",
            priceClp: 3000,
            description:
              "Cuerpo redondo y dulzor de caramelo claro. Receta de la casa, recalibrada a diario.",
            tastingNote:
              "Notas: panela, almendra tostada y final corto de cacao. Origen rotativo, pregunta al barista."
          },
          {
            id: "cortado",
            name: "Cortado",
            meta: "90 ml",
            priceClp: 3200,
            description: "Espresso doble con leche apenas texturizada. Equilibrio entre dulzor y acidez."
          },
          {
            id: "cappuccino",
            name: "Cappuccino",
            meta: "180 ml",
            priceClp: 3200,
            description: "Capa de espuma firme sobre espresso y leche caliente. Servido clásico."
          },
          {
            id: "latte",
            name: "Latte",
            meta: "240 ml",
            priceClp: 3400,
            description: "Leche larga y sedosa sobre doble shot. Arte latte como firma del barista."
          },
          {
            id: "flat-white",
            name: "Flat White",
            meta: "180 ml",
            priceClp: 3500,
            description: "Microespuma fina sobre doble ristretto. Café más presente, menos leche."
          },
          {
            id: "americano",
            name: "Americano",
            meta: "240 ml",
            priceClp: 3200,
            description: "Espresso largado con agua caliente. Para tomar pausado, sin perder cuerpo."
          },
          {
            id: "mocha",
            name: "Mocha",
            meta: "240 ml",
            priceClp: 3900,
            description:
              "Chocolate semiamargo de la casa, espresso y leche texturizada. Toque dulce de cierre."
          }
        ],
        addons: {
          label: "+ Syrups",
          hint: "Se agregan a cortado, flat white, cappuccino, latte o mocha.",
          chips: [
            "Vainilla",
            "Vainilla sin azúcar",
            "Caramelo",
            "Caramelo sin azúcar",
            "Chocolate",
            "Mora",
            "Mantequilla de maní"
          ]
        }
      },
      {
        id: "filtrados",
        label: "Filtrados",
        items: [
          {
            id: "pourover",
            name: "Pour Over",
            meta: "300 ml",
            priceClp: 3800,
            description:
              "Preparación manual en V60 o Chemex. Origen rotativo, taza limpia. Pregunta por el origen."
          },
          {
            id: "decaf-filter",
            name: "Decaf Filter",
            meta: "300 ml",
            priceClp: 4200,
            description: "Descafeinado al agua, dulzor de panela y final corto. Para horarios tardes."
          },
          {
            id: "coffee-flight",
            name: "Coffee Flight",
            meta: "3 × 90 ml",
            priceClp: 5500,
            description: "Tres pasadas del mismo grano: espresso, filtrado y leche. Para entender el café."
          }
        ]
      },
      {
        id: "frias",
        label: "Bebidas frías con café",
        items: [
          {
            id: "espresso-tonic",
            name: "Espresso Tonic",
            meta: "300 ml",
            priceClp: 4900,
            description: "Doble espresso sobre tónica fría y cáscara de naranja. Burbuja, amargor y cítrico."
          },
          {
            id: "citrus-espresso-soda",
            name: "Citrus Espresso Soda",
            meta: "330 ml",
            priceClp: 4900,
            description: "Espresso, soda artesanal y reducción de pomelo. Fresco, seco y con cuerpo."
          },
          {
            id: "iced-macchiato",
            name: "Iced Macchiato",
            meta: "300 ml",
            priceClp: 4500,
            description: "Espresso frío, leche y marca de café al final. Refrescante, corto y cremoso."
          },
          {
            id: "iced-latte",
            name: "Iced Latte",
            meta: "330 ml",
            priceClp: 4500,
            description: "Espresso sobre leche fría y hielo. Suave, lechoso y fácil de tomar."
          }
        ]
      },
      {
        id: "infusiones",
        label: "Infusiones",
        items: [
          {
            id: "te-variedad",
            name: "Té",
            meta: "Variedad",
            priceClp: 2500,
            description: "Selección rotativa de tés e infusiones de hoja: negro, verde, rojo y herbales. Pregunta por la opción del día."
          }
        ]
      }
    ],
    addonsBefore: "infusiones",
    addons: [
      {
        label: "+ Extras",
        hint: "Extra shot de espresso disponible en cualquier café de la Cafetería.",
        chips: ["Extra shot"]
      },
      {
        label: "+ Leches",
        hint: "Elige tu leche para cualquier café con leche.",
        chips: ["Entera", "Descremada", "Avena"]
      }
    ]
  },
  {
    id: "desayunos-weekend",
    numeral: "01",
    title: "Desayunos y",
    italicWord: "Once.",
    emphasis: "primary",
    schedule: ["weekend"],
    serviceWindow: "Desayuno 08:00 – 11:30 · Once 17:00 hasta cierre",
    lede:
      "Los desayunos incluyen café y jugo natural. La once incluye café y un dulce del mostrador. El Brunch reúne la línea completa en porciones para compartir.",
    items: [
      {
        id: "campesino",
        name: "Desayuno Campesino",
        priceClp: 11900,
        signature: true,
        description:
          "Dos huevos a elección con tocino crocante y tostadas de masa madre."
      },
      {
        id: "bowl-natural",
        name: "Bowl Natural",
        meta: "Vegetariano",
        priceClp: 10900,
        description:
          "Yogurt natural, granola crocante, fruta de estación y miel. Acompañado de croissant."
      },
      {
        id: "dulce-deriva",
        name: "Desayuno Dulce Deriva",
        meta: "Vegetariano",
        priceClp: 9900,
        description:
          "French toast dorado con fruta de estación, miel o mermelada y mantequilla."
      },
      {
        id: "huevos-pochados",
        name: "Huevos Pochados Deriva",
        meta: "Vegetariano · base",
        priceClp: 9900,
        signature: true,
        description:
          "Huevos pochados sobre masa madre, palta, tomate asado, hojas verdes y limoneta. Yema cremosa de firma."
      },
      {
        id: "brunch",
        name: "Brunch Deriva Studio",
        meta: "Full size · 1 pax",
        priceClp: 16900,
        signature: true,
        description:
          "Brunch abundante para una persona que reúne las tres líneas de desayuno: huevos a elección con tocino crocante, tostadas de masa madre, yogurt con granola y fruta de estación, y french toast."
      },
    ],
    addons: {
      label: "+ Agregados",
      hint: "Mantequilla sin costo. Otros agregados con cargo según opción.",
      chips: [
        "Mantequilla",
        "Queso",
        "Jamón",
        "Palta",
        "Tomate",
        "Salmón gravlax",
        "Coppa",
        "Tocino extra",
        "Huevo"
      ]
    }
  },
  {
    id: "desayunos-weekday",
    numeral: "01",
    title: "Desayunos.",
    fullItalic: true,
    emphasis: "primary",
    schedule: ["weekday"],
    serviceWindow: "Servicio 08:00 – 12:00",
    lede:
      "Los desayunos incluyen café y jugo natural. El Brunch reúne la línea completa en porciones para compartir.",
    items: [
      {
        id: "campesino",
        name: "Desayuno Campesino",
        priceClp: 11900,
        signature: true,
        description:
          "Dos huevos a elección con tocino crocante y tostadas de masa madre."
      },
      {
        id: "bowl-natural",
        name: "Bowl Natural",
        meta: "Vegetariano",
        priceClp: 10900,
        description:
          "Yogurt natural, granola crocante, fruta de estación y miel. Acompañado de croissant."
      },
      {
        id: "dulce-deriva",
        name: "Desayuno Dulce Deriva",
        meta: "Vegetariano",
        priceClp: 9900,
        description:
          "French toast dorado con fruta de estación, miel o mermelada y mantequilla."
      },
      {
        id: "huevos-pochados",
        name: "Huevos Pochados Deriva",
        meta: "Vegetariano · base",
        priceClp: 9900,
        signature: true,
        description:
          "Huevos pochados sobre masa madre, palta, tomate asado, hojas verdes y limoneta. Yema cremosa de firma."
      },
      {
        id: "brunch",
        name: "Brunch Deriva Studio",
        meta: "Full size · 1 pax",
        priceClp: 16900,
        signature: true,
        description:
          "Brunch abundante para una persona que reúne las tres líneas de desayuno: huevos a elección con tocino crocante, tostadas de masa madre, yogurt con granola y fruta de estación, y french toast."
      }
    ],
    addons: {
      label: "+ Agregados",
      hint: "Mantequilla sin costo. Otros agregados con cargo según opción.",
      chips: [
        "Mantequilla",
        "Queso",
        "Jamón",
        "Palta",
        "Tomate",
        "Salmón gravlax",
        "Coppa",
        "Tocino extra",
        "Huevo"
      ]
    }
  },
  {
    id: "croissants",
    numeral: "02",
    title: "Croissants",
    emphasis: "utility",
    lede: "Sandwichería en croissant, rellenos generosos y contrastes frescos.",
    items: [
      {
        id: "deli-pastrami",
        name: "Deli Pastrami",
        meta: "Pastrami",
        priceClp: 9900,
        description: "Croissant tostado con pastrami, ricotta, rúcula, tomate asado y pesto."
      },
      {
        id: "kasler-house",
        name: "Kasler House",
        meta: "Cerdo ahumado",
        priceClp: 8900,
        description: "Croissant con lomo kasler, hummus, palta, hojas verdes y cebolla encurtida."
      },
      {
        id: "clasico",
        name: "Clásico",
        priceClp: 6900,
        description: "Croissant con jamón y queso, con opción de tomate asado o pesto."
      }
    ],
    addons: {
      label: "+ Agregados al pan",
      hint: "Suma a cualquier sándwich, tostada o focaccia.",
      chips: ["Pesto", "Tomate cherry"]
    }
  },
  {
    id: "baguettes",
    numeral: "03",
    title: "Baguettes",
    emphasis: "utility",
    lede: "Sandwichería en baguette, corteza firme y sabores con peso.",
    items: [
      {
        id: "roast-beef",
        name: "Roast Beef de la Casa",
        meta: "Carne lenta",
        priceClp: 9900,
        unavailable: true,
        description: "Baguette con roast beef, rúcula, pepino encurtido, queso fundido y mostaza miel merkén."
      },
      {
        id: "huerta-asada",
        name: "Huerta Asada",
        meta: "Vegetariano",
        priceClp: 8500,
        unavailable: true,
        description: "Baguette vegetariana con crema de zapallo, verduras asadas, hojas verdes y limoneta."
      }
    ],
    addons: {
      label: "+ Agregados al pan",
      hint: "Suma a cualquier sándwich, tostada o focaccia.",
      chips: ["Pesto", "Tomate cherry"]
    }
  },
  {
    id: "tostadas",
    numeral: "04",
    title: "Tostadas",
    italicWord: "Gourmet.",
    emphasis: "primary",
    lede: "Masa madre tostada de la casa con preparaciones de mostrador.",
    items: [
      {
        id: "mediterranea",
        name: "Mediterránea",
        priceClp: 8900,
        description: "Tostada de masa madre con palta, coppa, tomate asado y cebolla encurtida."
      },
      {
        id: "italiana",
        name: "Italiana",
        meta: "Vegetariano",
        priceClp: 7900,
        description: "Tostada de masa madre con ricotta o mascarpone, rúcula, tomate cherry, limón, aceto y aceituna verde."
      },
      {
        id: "masa-madre-duo",
        name: "Masa Madre Duo",
        priceClp: 5990,
        description:
          "Dos tostadas de masa madre a elección, con un agregado libre: tomate, huevos, jamón o palta."
      }
    ],
    addons: {
      label: "+ Agregados al pan",
      hint: "Suma a cualquier sándwich, tostada o focaccia.",
      chips: ["Pesto", "Tomate cherry"]
    }
  },
  {
    id: "focaccias",
    numeral: "05",
    title: "Focaccias",
    emphasis: "utility",
    lede: "Masa esponjosa, fermentación larga, rellenos al horno.",
    items: [
      {
        id: "fugazzeta",
        name: "Fugazzeta Gourmet",
        meta: "Vegetariano",
        priceClp: 9900,
        description: "Focaccia con mozzarella, queso ahumado, cebolla pluma, aceitunas y chimichurri."
      },
      {
        id: "pastrami-cream",
        name: "Pastrami Cream",
        meta: "Pastrami",
        priceClp: 10900,
        description: "Focaccia con pastrami, tomate fresco, rúcula, mix de queso crema y pepino, y mayo."
      }
    ],
    addons: {
      label: "+ Agregados al pan",
      hint: "Suma a cualquier sándwich, tostada o focaccia.",
      chips: ["Pesto", "Tomate cherry"]
    }
  },
  {
    id: "cocina",
    numeral: "06",
    title: "Cocina",
    fullItalic: true,
    emphasis: "hero",
    serviceWindow: "Servicio 13:00 – 17:00",
    lede: "Entradas y fondos preparados al momento, materia prima de temporada.",
    ledeItalic: true,
    subgroups: [
      {
        id: "entradas",
        label: "Entradas",
        items: [
          {
            id: "crema-del-dia",
            name: "Crema del Día",
            meta: "Vegetariano",
            priceClp: 5900,
            description: "Crema rotativa de verduras de temporada, preparada al horno."
          },
          {
            id: "ensalada-estacion",
            name: "Ensalada de Estación Proteica",
            meta: "Con proteína",
            priceClp: 10900,
            description: "Hojas verdes, frutos secos, queso, proteína a elección y limoneta."
          },
          {
            id: "croquetas",
            name: "Croquetas de la Casa",
            meta: "Para compartir",
            priceClp: 6900,
            schedule: ["weekend"],
            unavailable: true,
            description: "Croquetas con relleno del día, salsa de tomate y aceite verde."
          }
        ]
      },
      {
        id: "fondos",
        label: "Fondos",
        schedule: ["weekend"],
        items: [
          {
            id: "sobrecostilla",
            name: "Sobrecostilla Braseada",
            meta: "Cocción lenta",
            priceClp: 13900,
            signature: true,
            description: "Sobrecostilla de cocción lenta con reducción de jugos, risotto de azafrán y setas."
          },
          {
            id: "noquis",
            name: "Ñoquis de la Casa",
            meta: "Vegetariano",
            priceClp: 10900,
            description: "Ñoquis vegetarianos con mantequilla especiada, puré de berenjena y queso curado."
          },
          {
            id: "brochetas",
            name: "Brochetas Mixtas",
            meta: "Para compartir",
            priceClp: 9900,
            description: "Brochetas de vacuno y pollo con chimichurri y puré mixto de papa y camote."
          }
        ]
      },
      {
        id: "empanadas",
        label: "Empanadas",
        items: [
          {
            id: "empanada-pino",
            name: "Empanadas de Pino",
            meta: "Porción · 3 unid.",
            priceClp: 4000,
            description:
              "Porción de tres empanadas horneadas de pino: carne, cebolla pochada, huevo y aceituna. Masa dorada al momento."
          },
          {
            id: "empanada-queso",
            name: "Empanadas de Queso",
            meta: "Porción · 3 unid.",
            priceClp: 3800,
            description:
              "Porción de tres empanadas horneadas de queso fundido envuelto en masa crocante. Para picar entre café y café."
          }
        ]
      }
    ]
  },
  {
    id: "menu-ejecutivo",
    numeral: "07",
    title: "Menu Ejecutivo.",
    fullItalic: true,
    emphasis: "primary",
    schedule: ["weekday"],
    serviceWindow: "13:00 – 16:00 · LUN A VIE",
    lede: "Cuatro momentos. Una cuenta. Sólo entre la una y las cuatro."
  },
  {
    id: "onces",
    numeral: "08",
    title: "Onces.",
    fullItalic: true,
    emphasis: "primary",
    schedule: ["weekday"],
    serviceWindow: "Servicio 17:00 hasta cierre",
    lede:
      "Dos formatos pensados para la tarde, con café incluido. Once Deriva combina focaccia y dulce; Como en Casa, dos tostadas con agregados libres.",
    items: [
      {
        id: "once-deriva",
        name: "Once Deriva",
        priceClp: 10900,
        signature: true,
        description:
          "Café del día, focaccia a elección de la carta y un dulce del mostrador. Nuestro 11 Deriva para cerrar la jornada."
      },
      {
        id: "como-en-casa",
        name: "Como en Casa",
        priceClp: 9900,
        description:
          "Dos tostadas de masa madre con dos agregados libres, acompañadas de café. La once de la casa, sencilla y a la mesa."
      }
    ]
  },
  {
    id: "pasteleria",
    numeral: "09",
    title: "Pastelería y",
    italicWord: "Dulces.",
    emphasis: "utility",
    lede: "Selección de pastelería artesanal de proveedor. Consulta con el equipo qué dulces hay disponibles hoy: la vitrina rota a diario y no siempre están todos.",
    subgroups: [
      {
        id: "pies-tortas",
        label: "Pies, tortas y kuchen",
        items: [
          {
            id: "pie-limon",
            name: "Pie de Limón",
            meta: "Precio fijo",
            priceClp: 3200,
            description: "Crema cítrica de limón sobre masa quebrada, terminada con merengue dorado a la llama."
          },
          {
            id: "pie-frambuesa",
            name: "Pie de Frambuesa",
            meta: "Precio fijo",
            priceClp: 3200,
            description: "Frambuesas de temporada sobre masa quebrada, con dulzor preciso y final ácido."
          },
          {
            id: "tres-leches",
            name: "Torta Tres Leches",
            meta: "Precio fijo",
            priceClp: 4800,
            description: "Bizcocho empapado en tres leches con crema pastelera. Húmedo, fresco, dulzor controlado."
          },
          {
            id: "cuatro-leches",
            name: "Torta Cuatro Leches",
            meta: "Precio fijo",
            priceClp: 5000,
            description: "Versión generosa del clásico: bizcocho empapado en cuatro leches, miga densa y dulzor profundo."
          },
          {
            id: "kuchen-nuez",
            name: "Kuchen de Nuez",
            meta: "Precio fijo",
            priceClp: 3500,
            description: "Receta del sur: nueces tostadas, manjar suave y miga mantecosa. Compañía clásica para un filtrado."
          },
          {
            id: "red-velvet",
            name: "Red Velvet",
            meta: "Precio fijo",
            priceClp: 4900,
            description: "Bizcocho rojo de cacao suave entre capas de crema de queso. Dulzor preciso, textura húmeda."
          },
          {
            id: "choco-mani",
            name: "Torta Choco Maní",
            meta: "Precio fijo",
            priceClp: 4900,
            description: "Chocolate intenso con maní tostado y caramelo salado. Para los que vienen por el café cargado."
          },
          {
            id: "lucuma-manjar",
            name: "Lúcuma Manjar",
            meta: "Precio fijo",
            priceClp: 4500,
            description: "Lúcuma fresca y manjar artesanal sobre bizcocho aireado. Sabor de cumpleaños chileno, sin atajos."
          },
          {
            id: "glazed-lemon-cake",
            name: "Glazed Lemon Cake",
            meta: "Precio fijo",
            priceClp: 3500,
            description:
              "Bizcocho cítrico con glaseado de limón fresco. Miga húmeda, final aromático y dulzor preciso."
          }
        ]
      },
      {
        id: "queques-brownies-alfajores",
        label: "Queques, brownies y alfajores",
        items: [
          {
            id: "queque-marmoleado",
            name: "Queque Marmoleado",
            meta: "Precio fijo",
            priceClp: 2800,
            description: "Vetas de vainilla y cacao en una miga tierna. Compañía sobria para un cortado de media mañana."
          },
          {
            id: "queque-vainilla-chip",
            name: "Queque Vainilla Chip",
            meta: "Precio fijo",
            priceClp: 2800,
            description: "Miga aireada de vainilla con chips de chocolate semiamargo. Dulzor controlado, perfil de mantequilla."
          },
          {
            id: "queque-naranja",
            name: "Queque Naranja",
            meta: "Precio fijo",
            priceClp: 2800,
            description: "Ralladura de naranja fresca y un toque de almíbar cítrico. Final aromático, miga húmeda."
          },
          {
            id: "brownie-chips",
            name: "Brownie Chips",
            meta: "Precio fijo",
            priceClp: 2900,
            description: "Chocolate denso de corteza fina y centro fundente, con chips que se rinden al primer mordisco."
          },
          {
            id: "muffin-arandano",
            name: "Muffin de Arándano",
            meta: "Precio fijo",
            priceClp: 2500,
            description: "Miga aireada con arándanos enteros que estallan al horno. Acidez fresca contra el café del día."
          },
          {
            id: "muffin-chips",
            name: "Muffin Chips",
            meta: "Precio fijo",
            priceClp: 2500,
            description: "Muffin de vainilla con chips de chocolate semiamargo. Compañía clásica para un filtrado de media tarde."
          },
          {
            id: "seleccion-alfajores",
            name: "Selección de Alfajores",
            meta: "Precio fijo · c/u",
            priceClp: 2000,
            priceLabel: "$2.000 c/u",
            description: "Variedades rotativas de la casa: tradicional con manjar, frambuesa, nuez, chocochip y ediciones de temporada."
          },
          {
            id: "seleccion-galletas",
            name: "Selección de Galletas",
            meta: "Porción · 5 unid.",
            priceClp: 2500,
            description: "Porción surtida de cinco galletas de la casa: avena, chocochip, mantequilla y ediciones rotativas. Para picar con café."
          }
        ]
      }
    ]
  }
];
