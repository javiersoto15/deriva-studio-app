import { connection } from "next/server";

import { isotipoSvgMarkup } from "../src/brand/isotipo";
import { isFiestasPatriasWindow } from "../src/lib/fiestas-patrias";

// Favicon / PWA icon. Was a static app/icon.svg (green pod on white); now a
// tiny dynamic route so the mark wears the Fiestas Patrias chupalla during
// the window (src/lib/fiestas-patrias.ts). Same markup source as LogoLockup.
//
// connection() marks the route dynamic under Cache Components so `new Date()`
// is legal; browsers cache favicons aggressively anyway, so the short
// max-age below is what actually bounds the flip.

export const contentType = "image/svg+xml";

export default async function Icon() {
  await connection();
  const festive = isFiestasPatriasWindow(new Date());
  const svg = isotipoSvgMarkup({
    color: "#00311F",
    background: "#FFFFFF",
    festive
  });
  return new Response(svg, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600"
    }
  });
}
