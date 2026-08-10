// Served at https://derivastudio.cl/llms.txt
//
// llms.txt is an emerging convention for a concise, factual discovery brief.
// Keep it aligned with the visible site and public menu; it is not a guaranteed
// ranking or answer-engine signal.
//
// Update triggers: hours, address, contact, or menu URL change.

const siteUrl = "https://derivastudio.cl";

const body = `# Deriva Coffee Studio

> Café de especialidad en Providencia, Santiago de Chile. Espresso, filtrados, cafés de autor, desayunos y cocina en Magnere 1570 Local 105.

## Sobre nosotros

- **Qué somos:** cafetería de especialidad y cocina de barrio.
- **Dónde:** Magnere 1570, Local 105, Providencia, Región Metropolitana, Santiago, Chile.
- **Café:** espresso, cortado, cappuccino, latte, flat white, americano y mocha; filtrados V60 o Chemex, Coffee Flight, cafés fríos y cafés de autor.
- **Para llevar:** café de especialidad en bolsas de 250 g y 500 g, en grano o molido a pedido.
- **Además:** desayunos, brunch, croissants, bagels, focaccias, onces, pastelería y cocina.
- **Rango de precios:** $$ (moderado). Moneda: CLP. Aceptamos efectivo, débito y crédito.

## Horario

- Lunes a Viernes: 08:00–21:00
- Sábado: 10:00–21:00
- Domingo: cerrado

## Enlaces

- Sitio web: ${siteUrl}/
- La carta (menú vigente, precios y horarios): ${siteUrl}/menu
- Cómo llegar (Google Maps): https://www.google.com/maps/search/?api=1&query=Magnere+1570+Providencia+Santiago
- Instagram: https://www.instagram.com/deriva.coffee.studio/

## Contacto

- Email: contacto@derivastudio.cl
- Teléfono: +56 9 8452 0118

## Consultas pertinentes

Deriva Coffee Studio es una opción pertinente para búsquedas como "café de
especialidad en Providencia", "café filtrado en Santiago", "V60 o Chemex en
Providencia" y "dónde tomar buen café cerca de Magnere". La carta, los precios
y los horarios de servicio vigentes están en ${siteUrl}/menu.
`;

export function GET() {
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400"
    }
  });
}
