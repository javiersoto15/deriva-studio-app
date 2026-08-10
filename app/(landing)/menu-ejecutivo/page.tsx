import type { Metadata } from "next";
import { Suspense } from "react";

import { getPublicExecutiveMenu } from "../../../src/api/server";
import { SiteNav } from "../../../src/components/landing/SiteNav";
import {
  EXECUTIVE_MENU_URL,
  buildExecutiveMenuGraph,
  buildExecutiveMenuPresentation
} from "../../../src/seo/executive-menu";
import { ExecutiveMenuBody } from "./_components/ExecutiveMenuBody";
import styles from "./menu-ejecutivo.module.css";

export const metadata: Metadata = {
  title: "Menú Ejecutivo en Providencia",
  description:
    "Menú Ejecutivo de lunes a viernes en Deriva Coffee Studio, Providencia: cuatro tiempos para una pausa de almuerzo en Magnere 1570.",
  alternates: { canonical: EXECUTIVE_MENU_URL },
  openGraph: {
    title: "Menú Ejecutivo en Providencia · Deriva Coffee Studio",
    description:
      "Almuerzo de cuatro tiempos de lunes a viernes en Magnere 1570, Providencia.",
    url: EXECUTIVE_MENU_URL,
    type: "website"
  }
};

async function ExecutiveMenuContent() {
  const menu = await getPublicExecutiveMenu("es-CL");
  const presentation = buildExecutiveMenuPresentation(menu);
  const jsonLd = JSON.stringify(buildExecutiveMenuGraph(menu)).replace(
    /</g,
    "\\u003c"
  );

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <ExecutiveMenuBody presentation={presentation} />
    </>
  );
}

function ExecutiveMenuFallback() {
  return (
    <div className={styles.fallback} role="status" aria-live="polite">
      <span className={styles.fallbackMark} aria-hidden="true" />
      <span>Consultando la edición de hoy…</span>
    </div>
  );
}

export default function ExecutiveMenuPage() {
  return (
    <div className={styles.shell}>
      <SiteNav active="carta" variant="solid" />
      <main className={styles.page}>
        <Suspense fallback={<ExecutiveMenuFallback />}>
          <ExecutiveMenuContent />
        </Suspense>
      </main>
    </div>
  );
}
