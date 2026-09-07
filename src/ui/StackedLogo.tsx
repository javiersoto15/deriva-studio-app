// Stacked brand logo — isotipo over ĐERIVA over COFFEE STUDIO — as inline
// SVG. Replaces <Image src="/brand/logo-con-isotipo.svg"> on the signup
// pages so the mark can wear the Fiestas Patrias chupalla without shipping
// a second static asset. Geometry mirrors the brandbook stack
// (09_marketing/brand/fiestas-patrias-2026/logo-chupalla-stacked*.svg).

import {
  CHUPALLA_GEOMETRY,
  CHUPALLA_LIGHT,
  ISOTIPO_PATHS,
  chupallaStripes
} from "../brand/isotipo";
import { SUBLINE, WORDMARK } from "../brand/wordmark";
import { colors } from "../design/tokens";

const W = 1500;
const ISO = 760;
const H = ISO + 40 + 300 + 60 + 100;

type StackedLogoProps = {
  height?: number;
  isotipoColor?: string;
  typeColor?: string;
  festive?: boolean;
};

export function StackedLogo({
  height = 50,
  isotipoColor = colors.green,
  typeColor = colors.ink,
  festive = false
}: StackedLogoProps) {
  const width = Math.round((height * W) / H);
  return (
    <svg
      role="img"
      aria-label="Deriva Coffee Studio"
      width={width}
      height={height}
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform={`translate(${(W - ISO) / 2},0) scale(${ISO / 1080})`}>
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
            <path d={CHUPALLA_GEOMETRY.brim} fill={CHUPALLA_LIGHT.hat} />
            <path d={CHUPALLA_GEOMETRY.crown} fill={CHUPALLA_LIGHT.hat} />
            {chupallaStripes(CHUPALLA_LIGHT).map((st, i) => (
              <path key={i} d={st.d} fill={st.fill} />
            ))}
          </g>
        ) : null}
      </g>
      <g fill={typeColor}>
        <path
          transform={`translate(${(W - WORDMARK.width) / 2},${ISO + 40 + 240})`}
          d={WORDMARK.d}
        />
        <path
          transform={`translate(${(W - SUBLINE.width) / 2},${ISO + 40 + 300 + 60 + 70})`}
          d={SUBLINE.d}
        />
      </g>
    </svg>
  );
}
