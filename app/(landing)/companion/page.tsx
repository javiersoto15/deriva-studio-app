import type { Metadata } from "next";
import { SiteNav } from "../../../src/components/landing/SiteNav";
import { AppTeaser } from "../../../src/components/landing/AppTeaser";

const siteUrl = "https://derivastudio.cl";

export const metadata: Metadata = {
  title: "La app de Deriva — Crea tu propia Deriva",
  description:
    "Tu carta, tu código y tus recompensas, todo en un lugar. Suma tu correo y te avisamos cuando la app de Deriva esté lista.",
  alternates: { canonical: `${siteUrl}/companion` },
  openGraph: {
    title: "Crea tu propia Deriva",
    description:
      "La app de Deriva: tu carta, tu código y tus recompensas en un solo lugar. Muy pronto.",
    url: `${siteUrl}/companion`,
    type: "website"
  }
};

export default function CompanionPage() {
  return (
    <>
      <SiteNav active="inicio" />
      <main className="app-teaser app-teaser--page" aria-labelledby="companion-title">
        <AppTeaser headingId="companion-title" headingLevel="h1" />
      </main>
    </>
  );
}
