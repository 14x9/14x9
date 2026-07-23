/**
 * Fallback image optimizer for case-study assets.
 *
 * You only need this if you turn Next's image optimizer OFF (e.g. a pure static
 * `output: 'export'` build). Normally the optimizer handles resizing/encoding at
 * serve time and you can ignore this script.
 *
 * Walks public/work/** and writes a capped-width .webp sibling next to every
 * .jpg/.jpeg/.png. Idempotent: skips a source whose .webp is already newer.
 *
 *   node scripts/optimize-images.mjs            # optimize everything
 *   node scripts/optimize-images.mjs bandier    # just public/work/bandier
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const MAX_WIDTH = 2400;
const QUALITY = 78;
const ROOT = path.join(process.cwd(), "public", "work");

const only = process.argv[2]; // optional slug to limit to one folder
const base = only ? path.join(ROOT, only) : ROOT;

/** Recursively collect raster source files under a directory. */
function collect(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return collect(full);
    return /\.(jpe?g|png)$/i.test(entry.name) ? [full] : [];
  });
}

const files = collect(base);
if (files.length === 0) {
  console.log(`No .jpg/.png files found under ${path.relative(process.cwd(), base)}`);
  process.exit(0);
}

let converted = 0;
for (const input of files) {
  const output = input.replace(/\.(jpe?g|png)$/i, ".webp");
  // Skip if an up-to-date webp already exists.
  if (
    fs.existsSync(output) &&
    fs.statSync(output).mtimeMs >= fs.statSync(input).mtimeMs
  ) {
    continue;
  }
  const img = sharp(input);
  const meta = await img.metadata();
  const width = meta.width && meta.width > MAX_WIDTH ? MAX_WIDTH : meta.width;
  await img
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(output);
  const before = (fs.statSync(input).size / 1024).toFixed(0);
  const after = (fs.statSync(output).size / 1024).toFixed(0);
  console.log(`${path.relative(process.cwd(), output)}  ${before}KB → ${after}KB`);
  converted += 1;
}

console.log(`\nDone. ${converted} file(s) optimized, ${files.length - converted} up to date.`);
