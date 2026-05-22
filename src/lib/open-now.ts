// True if the shop is currently open per the published Magnere hours,
// computed in America/Santiago regardless of server timezone.
//
// Lun–Vie 08:00–21:00 · Sáb 10:00–21:00 · Dom cerrado

const CHILE_TZ = "America/Santiago";

export function isOpenNow(now: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CHILE_TZ,
    weekday: "short",
    hour: "numeric",
    hour12: false,
    minute: "numeric"
  }).formatToParts(now);

  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const minutes = hour * 60 + minute;

  if (weekday === "Sun") return false;
  if (weekday === "Sat") return minutes >= 600 && minutes < 1260;
  return minutes >= 480 && minutes < 1260;
}
