import type { ReactNode } from "react";

// CSS-driven crossfade. No state, no client boundary — generated keyframes
// cycle layer opacity so the rotation keeps running even if React never
// hydrates (kiosk TVs throttle JS timers).
//
// Each view holds solid for its own `hold` seconds (default HOLD_SECONDS),
// then crossfades over FADE_SECONDS into the next. Keyframes are generated per
// view as a percentage of the total cycle, so layers can have DIFFERENT hold
// durations while still sharing one animationDuration. With uniform holds this
// reproduces the previously hand-tuned equal-slot cycles exactly.
type RotatorView = { key: string; node: ReactNode; hold?: number };

const HOLD_SECONDS = 19;
const FADE_SECONDS = 1;

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

// Per-layer keyframes for the given per-view hold durations. Layer i is opaque
// during its hold, fades out over the trailing FADE_SECONDS, and fades back in
// during the tail of the previous slot (which for layer 0 wraps around to
// 100%). All times are emitted as % of the total cycle.
function buildKeyframes(holds: number[]): string {
  const slots = holds.map((h) => h + FADE_SECONDS);
  const total = slots.reduce((a, b) => a + b, 0);
  const pct = (seconds: number) => round((seconds / total) * 100);
  const fadePct = pct(FADE_SECONDS);
  const count = holds.length;
  let cum = 0;
  let css = "";
  for (let i = 0; i < count; i++) {
    const start = pct(cum);
    const holdEnd = pct(cum + holds[i]);
    const out = pct(cum + slots[i]);
    if (i === 0) {
      css += `@keyframes ${keyframeName(count, i)}{0%,${holdEnd}%{opacity:1}${out}%,${round(100 - fadePct)}%{opacity:0}100%{opacity:1}}`;
    } else {
      const fadeIn = round(start - fadePct);
      css += `@keyframes ${keyframeName(count, i)}{0%,${fadeIn}%{opacity:0}${start}%,${holdEnd}%{opacity:1}${out}%,100%{opacity:0}}`;
    }
    cum += slots[i];
  }
  return css;
}

function keyframeName(count: number, index: number): string {
  return `ab-rot-${count}-${index}`;
}

export function CrossfadeRotator({
  views,
  className
}: {
  views: RotatorView[];
  className?: string;
}) {
  const wrapper = className ?? "ab-rotator";
  // A single view has nothing to crossfade — render it solid.
  if (views.length <= 1) {
    return <div className={wrapper}>{views[0]?.node ?? null}</div>;
  }

  const count = views.length;
  const holds = views.map((v) => v.hold ?? HOLD_SECONDS);
  const totalSeconds = holds.reduce((a, b) => a + b + FADE_SECONDS, 0);
  const duration = `${totalSeconds}s`;
  return (
    <div className={wrapper}>
      <style dangerouslySetInnerHTML={{ __html: buildKeyframes(holds) }} />
      {views.map((v, i) => (
        <div
          key={v.key}
          className="ab-rotator__layer"
          style={{ animationName: keyframeName(count, i), animationDuration: duration }}
        >
          {v.node}
        </div>
      ))}
    </div>
  );
}
