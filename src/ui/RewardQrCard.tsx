import { colors } from "../design/tokens";

export type RewardQrCardProps = {
  // Seed value (e.g. token or short code) — varies the cell pattern across renders.
  seed: string;
};

// Stylized mock QR for reward redemption (artboard 1CO-0).
// Sibling to <QrMockCard> — no perforation or backup-code panel; this screen
// shows the short code in the header eyebrow instead. 29x29 cell grid.
export function RewardQrCard({ seed }: RewardQrCardProps) {
  const size = 29;
  // Stable hash from seed so the same token always renders the same pattern.
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h ^ seed.charCodeAt(i)) * 16777619;
  }
  const cells = Array.from({ length: size * size }, (_, i) => {
    const x = (i * 2654435761 + h) >>> 0;
    return x % 7 < 3;
  });

  const cell = 8;
  const total = size * cell; // 232
  return (
    <div
      style={{
        width: 280,
        height: 280,
        borderRadius: 18,
        backgroundColor: colors.beige100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }}
    >
      <svg
        viewBox={`0 0 ${total} ${total}`}
        width={total}
        height={total}
        role="img"
        aria-label="Código QR de recompensa"
        style={{ display: "block" }}
      >
        {cells.map((on, i) => {
          if (!on) return null;
          const r = Math.floor(i / size);
          const c = i % size;
          // Skip cells under finder-pattern corners.
          const inTL = r < 8 && c < 8;
          const inTR = r < 8 && c > size - 9;
          const inBL = r > size - 9 && c < 8;
          if (inTL || inTR || inBL) return null;
          return (
            <rect
              key={i}
              x={c * cell}
              y={r * cell}
              width={cell}
              height={cell}
              fill={colors.ink900}
            />
          );
        })}
        {/* Finder patterns */}
        {[
          [0, 0],
          [(size - 7) * cell, 0],
          [0, (size - 7) * cell]
        ].map(([x, y]) => (
          <g key={`${x}-${y}`} transform={`translate(${x},${y})`}>
            <rect x={0} y={0} width={cell * 7} height={cell * 7} fill={colors.ink900} />
            <rect
              x={cell}
              y={cell}
              width={cell * 5}
              height={cell * 5}
              fill={colors.beige100}
            />
            <rect
              x={cell * 2}
              y={cell * 2}
              width={cell * 3}
              height={cell * 3}
              fill={colors.ink900}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
