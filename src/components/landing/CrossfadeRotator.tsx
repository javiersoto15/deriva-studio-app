import type { ReactNode } from "react";

// CSS-driven crossfade. No state, no client boundary — keyframes in
// abierto.css cycle layer opacity so the rotation keeps running even
// if React never hydrates (kiosk TVs throttle JS timers).
//
// Today the cycle is hardcoded in CSS to 20s on view 0 + 45s on view 1.
// If we ever need more than two views or different timings, generate
// per-layer keyframes from the durations here.
type RotatorView = { key: string; node: ReactNode };

export function CrossfadeRotator({
  views,
  className
}: {
  views: RotatorView[];
  className?: string;
}) {
  return (
    <div className={className ?? "ab-rotator"}>
      {views.map((v, i) => (
        <div
          key={v.key}
          className={`ab-rotator__layer ab-rotator__layer--${i}`}
        >
          {v.node}
        </div>
      ))}
    </div>
  );
}
