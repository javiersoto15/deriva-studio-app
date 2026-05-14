"use client";

import { useEffect, useState } from "react";

import { Eyebrow } from "../../../../src/ui/Eyebrow";

// Phase 2B.4 — Tiny client island.
// We can't compute `new Date()` inside a Server Component under
// `cacheComponents` (no request-time clock at prerender). This island fills
// in the date label after hydration; renders empty space pre-hydration so
// the page doesn't shift.
const ES_DAYS = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];
const ES_MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

function formatDateEs(d: Date) {
  return `${ES_DAYS[d.getDay()]} ${String(d.getDate()).padStart(2, "0")} ${ES_MONTHS[d.getMonth()]}`;
}

export function TodayEyebrow() {
  const [label, setLabel] = useState<string>(" ");
  useEffect(() => {
    setLabel(formatDateEs(new Date()));
  }, []);
  return <Eyebrow variant="date">{label}</Eyebrow>;
}
