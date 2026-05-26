// scripts/replace-photo.ts — replace a single photo slug in-place.
//
// Generates the 12 variants for a single master image and uploads them to
// the existing version prefix in GCS (overwriting in place). Then updates
// only that slug's `aspect` in src/data/photos.ts, leaving every other
// entry untouched. Use this when you don't have all the masters handy and
// just need to swap one photo.
//
// Usage:
//   npx tsx scripts/replace-photo.ts <slug> <master-path>
//
// Note: the bucket sets Cache-Control: public, max-age=300 (no immutable),
// so overwrites propagate to browsers within ~5 minutes. For guaranteed
// instant propagation (e.g. a hero swap), bump VERSION_PREFIX in
// upload-photos.ts and re-upload all masters.

import sharp from "sharp";
import { promises as fs } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

const BUCKET = "deriva-photos";
const VERSION_PREFIX = "v2";
const WIDTHS = [480, 960, 1440, 1920] as const;
const FORMATS = [
  { ext: "avif", mime: "image/avif", quality: 55 },
  { ext: "webp", mime: "image/webp", quality: 75 },
  { ext: "jpg", mime: "image/jpeg", quality: 82 }
] as const;

function runGcloud(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("gcloud", args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`gcloud exited ${code}: ${stderr.trim()}`));
    });
  });
}

async function uploadOne(
  slug: string,
  width: number,
  ext: string,
  contentType: string,
  buffer: Buffer
): Promise<void> {
  const key = `${VERSION_PREFIX}/${slug}-${width}.${ext}`;
  const tmp = path.join(
    tmpdir(),
    `deriva-replace-${process.pid}-${Date.now()}-${path.basename(key)}`
  );
  await fs.writeFile(tmp, buffer);
  try {
    await runGcloud([
      "storage",
      "cp",
      tmp,
      `gs://${BUCKET}/${key}`,
      `--content-type=${contentType}`,
      "--cache-control=public, max-age=300",
      "--quiet"
    ]);
  } finally {
    await fs.unlink(tmp).catch(() => undefined);
  }
  const kb = (buffer.length / 1024).toFixed(0);
  console.log(`  ✓ ${key.padEnd(40)} ${kb} KB`);
}

async function patchManifestAspect(slug: string, aspect: number): Promise<void> {
  const manifestPath = "src/data/photos.ts";
  const current = await fs.readFile(manifestPath, "utf8");
  const lineRegex = new RegExp(
    `(  "${slug}": \\{ slug: "${slug}", aspect: )([0-9.]+)(, widths: \\[[^\\]]+\\] \\},?)`
  );
  if (!lineRegex.test(current)) {
    throw new Error(
      `manifest line for slug "${slug}" not found in ${manifestPath}. Did you mean to add a new slug? Use upload-photos.ts.`
    );
  }
  const patched = current.replace(lineRegex, `$1${aspect.toFixed(4)}$3`);
  if (patched === current) {
    console.log(`  · manifest aspect unchanged (${aspect.toFixed(4)})`);
    return;
  }
  await fs.writeFile(manifestPath, patched);
  console.log(`  ✓ patched ${manifestPath} aspect → ${aspect.toFixed(4)}`);
}

async function main() {
  const [slug, masterPath] = process.argv.slice(2);
  if (!slug || !masterPath) {
    console.error("usage: tsx scripts/replace-photo.ts <slug> <master-path>");
    process.exit(1);
  }
  const abs = path.resolve(masterPath);
  console.log(`[${slug}] ← ${abs}`);

  const meta = await sharp(abs, { failOn: "none" }).metadata();
  if (!meta.width || !meta.height) {
    throw new Error("cannot read dimensions from master");
  }
  const aspect = meta.width / meta.height;
  console.log(`  source: ${meta.width}×${meta.height} (aspect ${aspect.toFixed(4)})`);

  for (const targetWidth of WIDTHS) {
    const w = Math.min(targetWidth, meta.width);
    const base = sharp(abs, { failOn: "none" }).rotate().resize({
      width: w,
      withoutEnlargement: true
    });
    for (const fmt of FORMATS) {
      let pipeline = base.clone();
      if (fmt.ext === "avif") pipeline = pipeline.avif({ quality: fmt.quality, effort: 6 });
      else if (fmt.ext === "webp") pipeline = pipeline.webp({ quality: fmt.quality, effort: 5 });
      else pipeline = pipeline.jpeg({ quality: fmt.quality, mozjpeg: true });
      const buffer = await pipeline.toBuffer();
      await uploadOne(slug, targetWidth, fmt.ext, fmt.mime, buffer);
    }
  }

  await patchManifestAspect(slug, aspect);

  console.log(
    `\n✓ replaced ${WIDTHS.length * FORMATS.length} variants for "${slug}" at gs://${BUCKET}/${VERSION_PREFIX}/`
  );
  console.log(
    "  Caveat: existing CDN edges + browsers may keep serving the old image until cache expires."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
