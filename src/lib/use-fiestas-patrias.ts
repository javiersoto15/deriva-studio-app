"use client";

import { useEffect, useState } from "react";
import { isFiestasPatriasWindow } from "./fiestas-patrias";

// Client-side flavour of the window check. Starts false so the static
// prerender never reads `new Date()` (Next 16 Cache Components), then
// resolves after mount — the same pattern SiteNav uses for today's hours.
export function useFiestasPatriasWindow(): boolean {
  const [festive, setFestive] = useState(false);
  useEffect(() => {
    setFestive(isFiestasPatriasWindow());
  }, []);
  return festive;
}
