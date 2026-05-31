"use client";

import { useMemo } from "react";

import {
  type TodayResponse,
  useToday
} from "../../../../src/api/hooks";
import { getBarista } from "../../../../src/data/today/barra";
import { getCafeDelDia } from "../../../../src/data/today/cafe-del-dia";
import { getNota } from "../../../../src/data/today/nota";
import { getRotacion } from "../../../../src/data/today/rotacion";
import type {
  Barista,
  DestacadoOrigin,
  Origin
} from "../../../../src/data/today/types";
import type { EditionParts } from "../../../../src/lib/edition";
import { isOpenNow } from "../../../../src/lib/open-now";
import { useActiveBackendLocale } from "../../../../src/i18n/use-active-locale";
import { useAuth } from "../../../../src/auth/use-auth";
import { BarraTile } from "./BarraTile";
import { HeroCafeDelDia } from "./HeroCafeDelDia";
import { MetricStrip } from "./MetricStrip";
import { NotaTile } from "./NotaTile";
import { RotacionTile } from "./RotacionTile";

type HoyViewModel = {
  cafeDelDia: DestacadoOrigin;
  rotacion: ReadonlyArray<Origin>;
  barista: Barista | null;
  openLabel: string;
  closesAt: string;
  isOpen: boolean;
  lastOrder: { name: string; when: string } | null;
};

export function HoyEdition({ edition }: { edition: EditionParts }) {
  const { status } = useAuth();
  const locale = useActiveBackendLocale();
  const query = useToday(edition.weekday, locale, status === "authenticated");
  const view = useMemo(
    () => buildHoyView(query.data, edition),
    [query.data, edition]
  );
  const nota = getNota(edition.isoWeek);

  return (
    <>
      <HeroCafeDelDia origin={view.cafeDelDia} />

      <div style={{ display: "flex", gap: 8, padding: "10px 14px 0" }}>
        <RotacionTile origins={view.rotacion} />
        {view.barista ? <BarraTile barista={view.barista} /> : null}
      </div>

      <NotaTile nota={nota} />

      <MetricStrip
        openLabel={view.openLabel}
        closesAt={view.closesAt}
        isOpen={view.isOpen}
        lastOrder={view.lastOrder}
      />
    </>
  );
}

function buildHoyView(data: TodayResponse | undefined, edition: EditionParts): HoyViewModel {
  if (!data) return degradedFallback(edition);
  const now = new Date();
  const hours = deriveHours(data, now);
  return {
    cafeDelDia: {
      ...data.destacado,
      brew: data.destacado.brew ?? ""
    },
    rotacion: data.rotacion,
    barista: data.barra
      ? {
          name: data.barra.name,
          turnoUntil: formatUntil(data.barra.turno_until_utc),
          note: data.barra.note
        }
      : null,
    openLabel: hours.openLabel,
    closesAt: hours.displayTime,
    isOpen: hours.isOpen,
    lastOrder: data.last_order
      ? {
          name: data.last_order.name,
          when: formatLastOrder(data.last_order.placed_at_utc)
        }
      : null
  };
}

// The backend is the source of truth for /hoy. These static modules are kept
// only as a degraded shell while Firebase auth initializes or the network is
// unavailable, so the page does not blank out.
function degradedFallback(edition: EditionParts): HoyViewModel {
  const isOpen = isOpenNow(new Date());
  return {
    cafeDelDia: getCafeDelDia(edition.weekday),
    rotacion: getRotacion(edition.weekday),
    barista: getBarista(edition.weekday),
    openLabel: isOpen ? "Abierto" : "Cerrado",
    closesAt: isOpen ? "21:00" : "08:00",
    isOpen,
    lastOrder: { name: "Flat white.", when: "sáb · 10:14" }
  };
}

function deriveHours(data: TodayResponse, now: Date) {
  const opensAt = data.hours.opens_at_utc ? new Date(data.hours.opens_at_utc) : null;
  const closesAt = data.hours.closes_at_utc ? new Date(data.hours.closes_at_utc) : null;
  const isOpen = Boolean(opensAt && closesAt && now >= opensAt && now < closesAt);
  const target = isOpen ? closesAt : opensAt;
  return {
    isOpen,
    openLabel: isOpen ? "Abierto" : "Cerrado",
    displayTime: target ? formatSantiagoTime(target) : "Cerrado"
  };
}

function formatUntil(value: string | null | undefined): string {
  if (!value) return "cerrado";
  return `hasta las ${formatSantiagoTime(new Date(value))}`;
}

function formatLastOrder(value: string): string {
  const date = new Date(value);
  const weekday = new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    weekday: "short"
  })
    .format(date)
    .replace(/\.$/, "");
  return `${weekday} · ${formatSantiagoTime(date)}`;
}

function formatSantiagoTime(date: Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}
