import fs from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";

/**
 * Intrinsic dimensions for a `/public`-relative image path (e.g. "/work/x/a.webp").
 *
 * Lets case-study blocks omit width/height — authored images (and Keystatic
 * uploads) get measured at render/build time instead. Falls back to a 16:10-ish
 * default if the file is missing or unreadable so a bad path never crashes the build.
 */
/**
 * Whether a `/public`-relative image actually exists on disk. Used to skip
 * rendering references whose file is missing, which would otherwise fail the
 * image optimizer at request time.
 */
export function localImageExists(src: string): boolean {
  if (!src) return false;
  if (!src.startsWith("/")) return true; // remote/data URIs — not ours to check
  return fs.existsSync(path.join(process.cwd(), "public", src));
}

export function getImageSize(
  src: string,
  fallback: { width: number; height: number } = { width: 2000, height: 1250 },
): { width: number; height: number } {
  try {
    // Only local /public assets can be measured from disk.
    if (!src.startsWith("/")) return fallback;
    const file = path.join(process.cwd(), "public", src);
    const { width, height } = imageSize(fs.readFileSync(file));
    if (!width || !height) return fallback;
    return { width, height };
  } catch {
    return fallback;
  }
}
