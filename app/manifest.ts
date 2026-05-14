import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { derivaColors } from "../src/brand";
import { colors } from "../src/design/tokens";

// Host-aware manifest (Phase 2A.4). Branches off the Host header:
//   - derivastudio.cl                  → landing manifest (marketing site)
//   - app.derivastudio.cl              → Deriva Companion (installable customer PWA)
//   - staff.* / admin.* / unknown      → minimal manifest (no install affordance;
//                                       staff/admin tools are not customer-installable)
//
// Next.js v15+ supports async manifest functions, which is required because
// `headers()` returns a Promise in the App Router.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const hdrs = await headers();
  const host = (hdrs.get("host") ?? "").toLowerCase();
  const isApp = host.startsWith("app.");
  const isStaffOrAdmin = host.startsWith("staff.") || host.startsWith("admin.");

  if (isApp) {
    return {
      name: "Deriva Companion",
      short_name: "Deriva",
      description:
        "Tu Deriva, recordada — café de especialidad, mate y cocina en Providencia.",
      start_url: "/inicio",
      scope: "/inicio",
      display: "standalone",
      orientation: "portrait",
      background_color: colors.beige100,
      theme_color: colors.brown700,
      lang: "es-CL",
      categories: ["food", "lifestyle"],
      icons: [
        { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
        { src: "/apple-icon.png", sizes: "180x180", type: "image/png", purpose: "any" }
      ]
    };
  }

  if (isStaffOrAdmin) {
    // Minimal manifest — these tools are not customer-installable.
    return {
      name: "Deriva (interno)",
      short_name: "Deriva",
      start_url: "/",
      display: "browser",
      background_color: colors.beige100,
      theme_color: colors.brown700,
      lang: "es-CL",
      icons: [
        { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
      ]
    };
  }

  // Default — landing/marketing site.
  return {
    name: "Deriva Coffee Studio",
    short_name: "Deriva",
    description:
      "Café de especialidad, mate y cocina en Magnere 1570 Local 105, Providencia, Santiago.",
    start_url: "/",
    display: "standalone",
    background_color: derivaColors.paper,
    theme_color: derivaColors.green,
    lang: "es-CL",
    icons: [
      {
        src: "/brand/isotipo-verde.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "/brand/isotipo-verde@2x.png",
        sizes: "128x128",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/brand/isotipo-verde@3x.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      }
    ]
  };
}
