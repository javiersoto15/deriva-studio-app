"use client";

import { StackedLogo } from "./StackedLogo";
import { useFiestasPatriasWindow } from "../lib/use-fiestas-patrias";

// StackedLogo for client pages (signup flow): hat resolves after mount.
export function FestiveStackedLogo(props: Parameters<typeof StackedLogo>[0]) {
  const festive = useFiestasPatriasWindow();
  return <StackedLogo {...props} festive={festive} />;
}
