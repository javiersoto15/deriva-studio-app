"use client";

import { LogoLockup } from "./LogoLockup";
import { useFiestasPatriasWindow } from "../lib/use-fiestas-patrias";

// LogoLockup that decides the Fiestas Patrias hat on the client after mount.
// For server components that already hold `now` behind connection(), pass
// `festive` to LogoLockup directly instead.
export function FestiveLogoLockup(props: Parameters<typeof LogoLockup>[0]) {
  const festive = useFiestasPatriasWindow();
  return <LogoLockup {...props} festive={festive} />;
}
