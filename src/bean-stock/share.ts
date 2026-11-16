import type { Snapshot } from "./types";
import { normalizeKilograms } from "./model";
export function buildBeanShareText(snapshot: Snapshot): string {
  const stamp = new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(snapshot.now));
  return (
    `Stock de granos · ${stamp}\n\n` +
    snapshot.items
      .map(
        (item) =>
          `${item.name}${item.tier === "premium" ? " (premium)" : ""}: ${item.quantity_kg === null ? "Sin contar" : normalizeKilograms(item.quantity_kg)!.replace(".", ",") + " kg"}`,
      )
      .join("\n")
  );
}
export const beanWhatsAppUrl = (text: string) =>
  "https://wa.me/?text=" + encodeURIComponent(text);
