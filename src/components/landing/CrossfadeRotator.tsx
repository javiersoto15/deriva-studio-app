import type { ReactNode } from "react";

// CSS-driven crossfade. No state, no client boundary — generated keyframes
// cycle layer opacity so the rotation keeps running even if React never
// hydrates (kiosk TVs throttle JS timers).
//
// Each view holds solo for HOLD_SECONDS, then crossfades over FADE_SECONDS
// into the next. Keyframes are generated per view count so the rotator
// works with any number of views (2, 3, 4, …). The generated percentages
// reproduce the previously hand-tuned 2-view (40s) and 3-view (60s) cycles
// exactly; a 4th view extends the same cadence to 80s.
type RotatorView = { key: string; node: ReactNode };

const HOLD_SECONDS = 19;
const FADE_SECONDS = 1;
const SLOT_SECONDS = HOLD_SECONDS + FADE_SECONDS;

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

// Per-layer keyframes for `count` views. Layer i is opaque during its slot,
// fades out over the trailing FADE_SECONDS, and fades back in during the tail
// of the previous slot (which for layer 0 wraps around to 100%).
function buildKeyframes(count: number): string {
  const slot = 100 / count;
  const fade = (FADE_SECONDS / SLOT_SECONDS) * slot;
  let css = "";
  for (let i = 0; i < count; i++) {
    const start = i * slot;
    const holdEnd = start + (slot - fade);
    const out = start + slot;
    if (i === 0) {
      css += `@keyframes ${keyframeName(count, i)}{0%,${round(holdEnd)}%{opacity:1}${round(out)}%,${round(100 - fade)}%{opacity:0}100%{opacity:1}}`;
    } else {
      const fadeIn = start - fade;
      css += `@keyframes ${keyframeName(count, i)}{0%,${round(fadeIn)}%{opacity:0}${round(start)}%,${round(holdEnd)}%{opacity:1}${round(out)}%,100%{opacity:0}}`;
    }
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
  const duration = `${count * SLOT_SECONDS}s`;
  return (
    <div className={wrapper}>
      <style dangerouslySetInnerHTML={{ __html: buildKeyframes(count) }} />
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
