// DerivaImage — renders a <picture> with AVIF/WebP/JPG sources for every
// pre-generated variant of a photo slug. The browser picks the best format
// it supports + the smallest width that fits the layout, given `sizes`.
//
// We use a manual <picture> instead of next/image because the variants are
// already pre-rendered in the GCS-backed CDN; next/image's optimizer would
// add an unnecessary loopback fetch + transformation step.

import {
  PHOTO_BASE_URL,
  derivaPhotos,
  type PhotoSlug
} from "../../data/photos";

// Allow overriding the CDN host in dev (e.g. NEXT_PUBLIC_PHOTO_BASE_URL=/photos
// in .env.local while DNS provisions). Production deploys use the manifest
// value (https://media.derivastudio.cl/v1).
const BASE = process.env.NEXT_PUBLIC_PHOTO_BASE_URL ?? PHOTO_BASE_URL;

type DerivaImageProps = {
  slug: PhotoSlug;
  alt: string;
  /** CSS `sizes` attribute — tells the browser which width to fetch. */
  sizes: string;
  /** Default false. True biases LCP — only one per page (the hero). */
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** When true, the <img> stretches to fill its parent (use with object-fit). */
  fill?: boolean;
};

function srcsetFor(slug: PhotoSlug, ext: "avif" | "webp" | "jpg"): string {
  const entry = derivaPhotos[slug];
  return entry.widths
    .map((w) => `${BASE}/${slug}-${w}.${ext} ${w}w`)
    .join(", ");
}

export function DerivaImage({
  slug,
  alt,
  sizes,
  priority = false,
  className,
  style,
  fill = false
}: DerivaImageProps) {
  const entry = derivaPhotos[slug];
  const fallbackWidth = entry.widths[entry.widths.length - 1];
  const fallbackSrc = `${BASE}/${slug}-${fallbackWidth}.jpg`;
  const fillStyle: React.CSSProperties = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style }
    : style ?? {};

  return (
    <picture>
      <source type="image/avif" srcSet={srcsetFor(slug, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcsetFor(slug, "webp")} sizes={sizes} />
      <img
        src={fallbackSrc}
        srcSet={srcsetFor(slug, "jpg")}
        sizes={sizes}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className={className}
        style={fillStyle}
      />
    </picture>
  );
}
