import { ImageResponse } from "next/og";
import { derivaColors } from "../src/brand";

// Node is the default and required runtime under cacheComponents — segment
// runtime config is no longer allowed, so we drop the explicit export.
export const alt = "Deriva Coffee Studio — Apertura piloto el 18 de mayo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function Diamond({ size: s = 14, color = derivaColors.copper }: { size?: number; color?: string }) {
  return (
    <div
      style={{
        width: s,
        height: s,
        background: color,
        transform: "rotate(45deg)",
        flexShrink: 0
      }}
    />
  );
}

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 88px",
          background: derivaColors.paper,
          color: derivaColors.green,
          fontFamily: "serif"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: derivaColors.muted
          }}
        >
          <span>Deriva Coffee Studio</span>
          <div style={{ display: "flex", alignItems: "center", gap: 14, color: derivaColors.copper }}>
            <Diamond size={14} />
            <span>Apertura piloto</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8
          }}
        >
          <div
            style={{
              fontSize: 80,
              lineHeight: 1.05,
              color: derivaColors.ink,
              letterSpacing: "-0.01em"
            }}
          >
            Servimos el
          </div>
          <div
            style={{
              fontSize: 100,
              lineHeight: 1.05,
              fontStyle: "italic",
              color: derivaColors.green,
              letterSpacing: "-0.01em"
            }}
          >
            primer café
          </div>
          <div
            style={{
              fontSize: 80,
              lineHeight: 1.05,
              color: derivaColors.ink,
              letterSpacing: "-0.01em"
            }}
          >
            el 18 de mayo.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 26,
            color: derivaColors.espresso
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ color: derivaColors.muted, fontSize: 20, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              Magnere 1570 · Local 105
            </span>
            <span style={{ fontSize: 30 }}>Providencia, Santiago</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 24, color: derivaColors.muted }}>
            <span>Café</span>
            <Diamond size={10} />
            <span>Mate</span>
            <Diamond size={10} />
            <span>Cocina</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
