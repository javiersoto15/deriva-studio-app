// Deriva logo lockup — matches Paper artboard `3VK-0 / 3XR-0` exactly:
//
//   [isotipo SVG  brown-700]  [ĐERIVA  Baskerville 28px brown-800]
//                             [COFFEE STUDIO  Poppins Light 8.5px / 0.28em]
//
// Production previously used <Image src="/brand/logo-con-isotipo.svg"> which
// rendered the brand-authored SVG verbatim. That SVG references CrownAvenue
// (the brand display font) inside <text> elements, but CrownAvenue isn't
// loaded in the browser — so the ĐERIVA wordmark fell back to a generic
// system serif and looked thin / wrong / small. This component rebuilds the
// lockup using inline structure with the same fonts Paper uses, which DO
// render correctly on iOS / macOS (Baskerville) and Google-loaded Poppins.
//
// Sized to match the Paper mobile artboard exactly (44×44 isotipo + 28px
// Baskerville + 8.5px Poppins). The visual heft comes from getting the
// typography right (CrownAvenue → Baskerville on iOS/macOS, system-ui
// fallback elsewhere), not from scaling up — the brand-SVG-as-Image path
// was rendering smaller-looking because the wordmark was falling back to
// a generic system serif inside an oversized bounding box.

import { colors } from "../design/tokens";
import {
  CHUPALLA_DARK,
  CHUPALLA_GEOMETRY,
  CHUPALLA_LIGHT,
  ISOTIPO_PATHS,
  ISOTIPO_VIEWBOX,
  chupallaStripes
} from "../brand/isotipo";

const SIZE = {
  isotipo: 44,
  wordmarkSize: 28,
  wordmarkLine: 28,
  subSize: 8.5,
  gap: 12
} as const;

type LogoLockupProps = {
  isotipo?: number;
  wordmarkSize?: number;
  wordmarkLine?: number;
  subSize?: number;
  gap?: number;
  isotipoColor?: string;
  wordmarkColor?: string;
  // Fiestas Patrias: the pod wears the chupalla. Callers decide from
  // `isFiestasPatriasWindow(now)` (server, behind connection()) or
  // `useFiestasPatriasWindow()` (client). Off by default so nothing reads
  // the clock during a static prerender.
  festive?: boolean;
  // Hat colours: "light" (black hat) for cream grounds, "dark" (beige hat)
  // for espresso plates where black vanishes.
  festiveGround?: "light" | "dark";
};

export function LogoLockup(props: LogoLockupProps = {}) {
  const s = {
    isotipo: props.isotipo ?? SIZE.isotipo,
    wordmarkSize: props.wordmarkSize ?? SIZE.wordmarkSize,
    wordmarkLine: props.wordmarkLine ?? SIZE.wordmarkLine,
    subSize: props.subSize ?? SIZE.subSize,
    gap: props.gap ?? SIZE.gap
  };
  const isotipoColor = props.isotipoColor ?? colors.brown700;
  const wordmarkColor = props.wordmarkColor ?? colors.brown800;
  const festive = props.festive ?? false;
  const chupalla = props.festiveGround === "dark" ? CHUPALLA_DARK : CHUPALLA_LIGHT;
  return (
    <div
      role="img"
      aria-label="Deriva Coffee Studio"
      style={{ display: "flex", alignItems: "center", gap: s.gap }}
    >
      <svg
        width={s.isotipo}
        height={s.isotipo}
        viewBox={ISOTIPO_VIEWBOX}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        style={{ flexShrink: 0 }}
      >
        <g
          fill={isotipoColor}
          transform={festive ? CHUPALLA_GEOMETRY.podTransform : undefined}
        >
          {ISOTIPO_PATHS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        {festive ? (
          <g transform={CHUPALLA_GEOMETRY.transform}>
            <path d={CHUPALLA_GEOMETRY.brim} fill={chupalla.hat} />
            <path d={CHUPALLA_GEOMETRY.crown} fill={chupalla.hat} />
            {chupallaStripes(chupalla).map((st, i) => (
              <path key={i} d={st.d} fill={st.fill} />
            ))}
          </g>
        ) : null}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span
          style={{
            fontFamily: "CrownAvenue, Baskerville, 'Big Caslon', 'Hoefler Text', Georgia, serif",
            fontWeight: 400,
            fontSize: s.wordmarkSize,
            lineHeight: `${s.wordmarkLine}px`,
            letterSpacing: "0.02em",
            color: wordmarkColor
          }}
        >
          ĐERIVA
        </span>
        <span
          style={{
            fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
            fontWeight: 300,
            fontSize: s.subSize,
            lineHeight: `${Math.round(s.subSize * 1.4)}px`,
            letterSpacing: "0.28em",
            color: wordmarkColor,
            marginTop: 4
          }}
        >
          COFFEE STUDIO
        </span>
      </div>
    </div>
  );
}
