import { colors } from "../design/tokens";

export type ShimmerProps = {
  width?: number | string;
  height?: number | string;
  // Match the surface the shimmer sits on so the pulse reads as the same
  // material breathing, not a foreign element.
  surface?: "beige" | "espresso";
  radius?: number;
  inline?: boolean;
};

// Single source of truth for loading placeholders. Replaces the em-dash
// fallback pattern (`data?.field ?? "—"`) which lingers if a query stalls and
// reads as broken state. The shimmer reads as "actively fetching" instead.
export function Shimmer({
  width = "100%",
  height = 14,
  surface = "beige",
  radius = 4,
  inline = false
}: ShimmerProps) {
  const base = surface === "espresso" ? "rgba(215,199,171,0.18)" : colors.beige300;
  return (
    <span
      aria-hidden="true"
      style={{
        display: inline ? "inline-block" : "block",
        width,
        height,
        borderRadius: radius,
        backgroundColor: base,
        animation: "deriva-shimmer 1400ms cubic-bezier(0.4, 0, 0.2, 1) infinite"
      }}
    />
  );
}
