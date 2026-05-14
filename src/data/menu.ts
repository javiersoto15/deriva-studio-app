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
  | "Porción · 3 unid.";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  meta?: DietaryTag;
  priceClp?: number;
  priceLabel?: string;
  signature?: boolean;
  tastingNote?: string;
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
};

export type MenuSection = {
  id: string;
  numeral: string;
  title: string;
  italicWord?: string;
  fullItalic?: boolean;
  emphasis: "hero" | "primary" | "utility";
  lede: string;
  ledeItalic?: boolean;
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
      }
    ],
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
    id: "desayunos",
    numeral: "01",
    title: "Desayunos y",
    italicWord: "Brunch.",
    emphasis: "primary",
    lede:
      "Todos los desayunos incluyen café y jugo. El Brunch reúne las tres líneas en porciones para compartir.",
    items: [
      {
        id: "campesino",
        name: "Desayuno Campesino",
        meta: "Incluye café y jugo",
        priceClp: 11900,
        signature: true,
        description:
          "Dos huevos a elección con tocino crocante, tostadas de masa madre y fruta de estación. Base salada abundante."
      },
      {
        id: "bowl-natural",
        name: "Bowl Natural",
        meta: "Vegetariano",
        priceClp: 10900,
        description:
          "Yogurt natural, granola crocante, fruta de estación y miel. Acompañado de croissant, café y jugo."
      },
      {
        id: "dulce-deriva",
        name: "Desayuno Dulce Deriva",
        meta: "Vegetariano",
        priceClp: 9900,
        description:
          "French toast dorado con fruta de estación, miel o mermelada y mantequilla. Café y jugo incluidos."
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
          "Brunch completo para una persona: una versión abundante de la línea salada, fresca y dulce. Café y jugo incluidos."
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
        description: "Pastrami de la casa, queso semiduro, mostaza dijon y pepinillos en croissant tibio."
      },
      {
        id: "kasler-house",
        name: "Kasler House",
        meta: "Cerdo ahumado",
        priceClp: 8900,
        description: "Kasler artesanal, queso fundido, cebolla caramelizada y rúcula. Servido al horno."
      },
      {
        id: "clasico",
        name: "Clásico",
        meta: "Vegetariano · opt.",
        priceClp: 6900,
        description:
          "Jamón, queso y manteca apenas tibia. Hojaldre crocante, miga aireada. Versión simple, bien hecha."
      }
    ]
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
        description: "Roast beef en cocción lenta, cebolla asada, rúcula y mayonesa de mostaza. Baguette caliente."
      },
      {
        id: "huerta-asada",
        name: "Huerta Asada",
        meta: "Vegetariano",
        priceClp: 8500,
        description:
          "Berenjena, zucchini y pimentón al horno con pesto, queso fresco y hojas verdes. Vegetal al centro."
      }
    ]
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
        meta: "Vegetariano",
        priceClp: 8900,
        description: "Hummus de la casa, tomate confitado, pepino, aceitunas y feta. Aceite de oliva y orégano."
      },
      {
        id: "italiana",
        name: "Italiana",
        meta: "Vegetariano",
        priceClp: 7900,
        description: "Burrata fresca, tomate de estación, albahaca y reducción de balsam. Pan apenas tibio."
      }
    ]
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
        description:
          "Cebolla blanca confitada, queso fundido y aceite de orégano. Tradición rioplatense en versión de la casa."
      },
      {
        id: "pastrami-cream",
        name: "Pastrami Cream",
        meta: "Pastrami",
        priceClp: 10900,
        description: "Pastrami caliente, crema agria, cebollin y pickle dill. Pan recién horneado, dulzor de la masa."
      }
    ]
  },
  {
    id: "cocina",
    numeral: "06",
    title: "Cocina",
    fullItalic: true,
    emphasis: "hero",
    lede: "Entradas y fondos preparados al momento, materia prima de temporada.",
    ledeItalic: true,
    subgroups: [
      {
        id: "entradas",
        label: "Entradas",
        items: [
          {
            id: "crema-verduras",
            name: "Crema de Verduras Asadas",
            meta: "Vegetariano",
            priceClp: 5900,
            description:
              "Zapallo, zanahoria y pimientón asados con caldo de la casa. Servida tibia, hierbas frescas."
          },
          {
            id: "sopa-cebolla",
            name: "Sopa de Cebolla Caramelizada",
            meta: "Para compartir · opt.",
            priceClp: 6500,
            description:
              "Cebolla en cocción larga, caldo oscuro y crouton gratinado con queso. Perfil dulce-tostado."
          },
          {
            id: "ensalada-estacion",
            name: "Ensalada de Estación Proteica",
            meta: "Con proteína",
            priceClp: 10900,
            description:
              "Hojas de la huerta, granos cocidos, semillas, vegetal de estación y proteína del día con aderezo de la casa."
          },
          {
            id: "tiradito-salmon",
            name: "Tiradito de Salmón",
            meta: "Pescado crudo",
            priceClp: 12900,
            signature: true,
            description: "Salmón laminado, leche de tigre cítrica, cítricos y aceite de cilantro. Para abrir mesa, fresco."
          }
        ]
      },
      {
        id: "fondos",
        label: "Fondos",
        items: [
          {
            id: "sobrecostilla",
            name: "Sobrecostilla Braseada",
            meta: "Cocción lenta",
            priceClp: 13900,
            signature: true,
            description:
              "Sobrecostilla en cocción de horas con jugo reducido, puré rústico y vegetal asado. Plato de domingo."
          },
          {
            id: "noquis",
            name: "Ñoquis de la Casa",
            meta: "Vegetariano · opt.",
            priceClp: 10900,
            description: "Ñoquis frescos de papa con salsa de la semana: pomodoro, mantequilla y salvia, o ragú lento."
          },
          {
            id: "brochetas",
            name: "Brochetas Mixtas",
            meta: "Para compartir",
            priceClp: 9900,
            description: "Brochetas a la parrilla con carnes y vegetales del día. Ahumado leve, salsa chimichurri de la casa."
          },
          {
            id: "croquetas",
            name: "Croquetas de la Casa",
            meta: "Para compartir",
            priceClp: 6900,
            description:
              "Croquetas crocantes con relleno rotativo (jamón, queso, hongos). Bechamel densa, fritura limpia."
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
            priceClp: 2800,
            description:
              "Porción de tres empanadas individuales. Pino jugoso de carne, cebolla pochada, huevo y aceituna. Masa horneada, dorada al momento."
          },
          {
            id: "empanada-queso",
            name: "Empanadas de Queso",
            meta: "Porción · 3 unid.",
            priceClp: 2500,
            description:
              "Porción de tres empanadas individuales. Queso fundido envuelto en masa crocante. Para picar entre café y café."
          }
        ]
      }
    ]
  },
  {
    id: "pasteleria",
    numeral: "07",
    title: "Pastelería y",
    italicWord: "Dulces.",
    emphasis: "utility",
    lede: "Selección de pastelería artesanal de proveedor, con precios fijos según carta vigente.",
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
          },
          {
            id: "oreo-cheesecake",
            name: "Oreo Cheesecake",
            meta: "Precio pendiente",
            description: "Cheesecake cremoso sobre base de galleta de cacao, terminado con trozos de Oreo. Postre de mesa larga."
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
            id: "seleccion-alfajores",
            name: "Selección de Alfajores",
            meta: "Precio fijo · c/u",
            priceClp: 2000,
            priceLabel: "$2.000 c/u",
            description: "Variedades rotativas de la casa: tradicional con manjar, frambuesa, nuez, chocochip y ediciones de temporada."
          }
        ]
      }
    ]
  }
];
