import type { Metadata } from "next";
import { SiteNav } from "../../../../src/components/landing/SiteNav";

const siteUrl = "https://derivastudio.cl";
const pageUrl = `${siteUrl}/deriva-match-up/bases`;

export const metadata: Metadata = {
  title: "Bases · Deriva Match Up",
  description:
    "Bases legales de la promoción Deriva Match Up. Vigente del 8 al 30 de junio de 2026, una vez por persona, solo cafés individuales, precio mínimo $1.600.",
  alternates: { canonical: pageUrl },
  openGraph: {
    title: "Bases · Deriva Match Up",
    description:
      "Bases legales de la promoción Deriva Match Up. Vigente del 8 al 30 de junio de 2026.",
    url: pageUrl,
    type: "website"
  }
};

// Each clause is a numbered article in the chapbook register — mono numeral,
// title, body. Kept verbatim-legible, not legalese soup.
const CLAUSES = [
  {
    n: "01",
    title: "Organizador",
    body: "La promoción “Deriva Match Up” es organizada por Nucleo Studio Group SpA, con domicilio en Magnere 1570, Local 105, Providencia, Región Metropolitana, Chile."
  },
  {
    n: "02",
    title: "Vigencia",
    body: "La promoción es válida desde el 8 de junio hasta el 30 de junio de 2026, ambos días inclusive, mientras dure el horario de atención de la cafetería."
  },
  {
    n: "03",
    title: "Mecánica",
    body: "Para participar, el cliente presenta en la barra una boleta vigente de otra cafetería correspondiente a la compra de un café. Deriva iguala el precio pagado en esa boleta, con un precio mínimo de $1.600 CLP: si el café costó menos de $1.600, el cliente paga $1.600."
  },
  {
    n: "04",
    title: "Una participación por persona",
    body: "Cada persona puede usar la igualación una sola vez durante toda la vigencia. La participación se valida por RUT, verificado con el carnet de identidad físico en la barra al momento de la compra."
  },
  {
    n: "05",
    title: "Solo cafés individuales",
    body: "La promoción aplica únicamente a cafés individuales. No aplica a combos, packs, promociones, descuentos ni cualquier precio de oferta del otro local; la boleta debe corresponder a un café comprado a su precio regular."
  },
  {
    n: "06",
    title: "Tratamiento de datos",
    body: "El RUT se almacena de forma cifrada (hash), con el único fin de validar una igualación por persona. El registro se conserva por 30 días desde su creación y luego se elimina. El RUT no se comparte con terceros y no genera saldo, crédito, puntos ni beneficio futuro de ningún tipo."
  },
  {
    n: "07",
    title: "Lugar",
    body: "La igualación es válida exclusivamente de forma presencial en Magnere 1570, Local 105, Providencia. No aplica a pedidos por delivery ni a otras sucursales."
  },
  {
    n: "08",
    title: "Modificaciones",
    body: "Deriva podrá modificar, suspender o finalizar la promoción por causas justificadas, informando oportunamente a través de sus canales oficiales. El uso de la promoción implica la aceptación de estas bases."
  }
];

export default function MatchUpBasesPage() {
  return (
    <div className="resenas-shell">
      <SiteNav active="match-up" variant="solid" />
      <main className="matchup-bases" aria-labelledby="bases-title">
        <div className="matchup-bases__sheet">
          <header className="matchup-bases__head">
            <div className="matchup-bases__mast">
              <span>Vol. 001</span>
              <span className="matchup-bases__tick" aria-hidden="true" />
              <span>Deriva Match Up · MMXXVI</span>
            </div>
            <div className="landing-slug">
              <span className="landing-slug__rule" aria-hidden="true" />
              <span>§ Bases de la promoción</span>
            </div>
            <h1 id="bases-title" className="matchup-bases__title">
              Deriva <em>Match Up.</em>
            </h1>
            <p className="matchup-bases__lede">
              Trae la boleta del café que tomas siempre en otra cafetería y te
              igualamos el precio. Estas son las reglas, en limpio.
            </p>
          </header>

          <ol className="matchup-bases__list">
            {CLAUSES.map((c) => (
              <li key={c.n} className="matchup-bases__clause">
                <span className="matchup-bases__num" aria-hidden="true">
                  {c.n}
                </span>
                <div className="matchup-bases__clausebody">
                  <h2 className="matchup-bases__clausetitle">{c.title}</h2>
                  <p className="matchup-bases__clausetext">{c.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="matchup-bases__back">
            <a href="/deriva-match-up" className="resenas-coda__cta">
              ← Volver a Deriva Match Up
            </a>
          </div>
        </div>
      </main>
      <footer className="landing-footer">
        <span className="landing-footer__brand">
          <span className="landing-diamond" aria-hidden="true" />
          Deriva Coffee Studio
        </span>
        <span>Edición continuada · MMXXVI</span>
        <span>derivastudio.cl</span>
      </footer>
    </div>
  );
}
