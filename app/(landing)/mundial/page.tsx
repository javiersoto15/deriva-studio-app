import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteNav } from "../../../src/components/landing/SiteNav";
import { getTodaySlate } from "../../../src/api/world-cup";
import { PollaWizard } from "./_components/PollaWizard";
import { getEditionMark } from "../../../src/lib/edition";
import { slateDayLabel } from "../../../src/lib/slate-day";
import "flag-icons/css/flag-icons.min.css";
import "./mundial.css";

const siteUrl = "https://derivastudio.cl";
const pageUrl = `${siteUrl}/mundial`;
const INSTAGRAM_URL = "https://www.instagram.com/deriva.coffee.studio/";

export const metadata: Metadata = {
  title: "La Polla del Mundial",
  description:
    "Adivina el marcador exacto de los partidos de hoy. Si le achuntas a todos, te ganas un café gratis en Deriva Coffee Studio para mañana.",
  alternates: { canonical: pageUrl },
  openGraph: {
    title: "La Polla del Mundial · Deriva Coffee Studio",
    description: "Predice los marcadores de hoy. Exacto gana café.",
    url: pageUrl,
    type: "website"
  }
};

export default function MundialPage() {
  return (
    <div className="polla-shell">
      <SiteNav active="mundial" variant="solid" />
      <main className="polla" aria-labelledby="polla-title">
        <Suspense fallback={<PollaSkeleton />}>
          <PollaSlate />
        </Suspense>
      </main>
    </div>
  );
}

function PollaSkeleton() {
  return (
    <div className="polla__rail">
      <div className="polla__mast">
        <span>LA POLLA DEL MUNDIAL</span>
        <span className="polla__mast-tick" />
      </div>
      <div className="polla__skeleton" />
    </div>
  );
}

async function PollaSlate() {
  const result = await getTodaySlate();
  const edition = getEditionMark();

  // No campaign today (404) or transport failure → calm empty state.
  if (!result.ok) {
    if (result.kind === "empty") {
      return (
        <Terminal
          edition={edition}
          eyebrow="La Polla del Mundial"
          title={<>Hoy no hay <em>partidos</em>.</>}
          body="Vuelve pronto para la próxima fecha del Mundial — la anunciamos en Instagram."
          ig
        />
      );
    }
    return (
      <Terminal
        edition={edition}
        eyebrow="La Polla del Mundial"
        title={<>Volvemos <em>al toque</em>.</>}
        body="No pudimos cargar los partidos de hoy. Refresca en un momento."
      />
    );
  }

  const { day } = result;

  if (!day.submission_open) {
    return (
      <Terminal
        edition={edition}
        eyebrow="La Polla del Mundial"
        title={<>Las predicciones <em>cerraron</em>.</>}
        body="La fecha de hoy ya cerró. Vuelve pronto para la próxima fecha del Mundial."
      />
    );
  }

  const dayLabel = slateDayLabel(day.campaign_date);

  return <PollaWizard day={day} edition={edition} dayLabel={dayLabel} />;
}

function Terminal({
  edition,
  eyebrow,
  title,
  body,
  ig
}: {
  edition: string;
  eyebrow: string;
  title: React.ReactNode;
  body: string;
  ig?: boolean;
}) {
  return (
    <div className="polla__rail">
      <div className="polla__mast">
        <span>LA POLLA DEL MUNDIAL · {edition}</span>
        <span className="polla__mast-tick" />
      </div>
      <div className="polla__terminal">
        <p className="polla__terminal-eyebrow">{eyebrow}</p>
        <h1 id="polla-title" className="polla__terminal-title">{title}</h1>
        <p className="polla__terminal-body">{body}</p>
        {ig && (
          <p className="polla__colophon">
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">@deriva.coffee.studio</a>
          </p>
        )}
        <p className="polla__colophon">Magnere 1570 · Providencia</p>
      </div>
    </div>
  );
}
