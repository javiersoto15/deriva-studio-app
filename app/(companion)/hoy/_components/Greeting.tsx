"use client";

import { useEffect, useState } from "react";
import { useCurrentMember } from "../../../../src/api/hooks";
import { colors } from "../../../../src/design/tokens";

function greetingFor(hour: number): string {
  if (hour < 12) return "Buenos días";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

export function Greeting({ shortDate }: { shortDate: string }) {
  const { data } = useCurrentMember();
  // Resolve hour after hydration so the SSR pass doesn't bake in the server's
  // clock — different timezones would surface as a hydration mismatch.
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => {
    setHour(new Date().getHours());
  }, []);

  const greeting = hour === null ? "Hola" : greetingFor(hour);
  const firstName = data?.name ? data.name.split(" ")[0] : null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 12,
        padding: "8px 24px 14px"
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 22,
          lineHeight: "28px",
          color: colors.ink900
        }}
      >
        {greeting}
        {firstName ? `, ${firstName}` : ""}.
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
          fontWeight: 500,
          fontSize: 10,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: colors.brown700,
          whiteSpace: "nowrap"
        }}
      >
        {shortDate}
      </div>
    </div>
  );
}
