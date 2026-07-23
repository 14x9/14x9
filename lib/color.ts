/**
 * Colour helpers for the case-study masthead.
 *
 * The title/category sit directly on each study's `heroColor` fill, so the text
 * needs to flip between light and dark for contrast. `isLightColor` decides
 * which, from the fill's perceived brightness.
 */

/** Parse a #rgb or #rrggbb hex string into 0–255 channels, or null if unparseable. */
function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.trim().replace(/^#/, "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/**
 * True when a colour is light enough that it needs dark text on top.
 * Uses WCAG relative luminance (threshold 0.5). Unparseable or missing input
 * returns false, so the default dark fill keeps its light text.
 */
export function isLightColor(hex?: string): boolean {
  if (!hex) return false;
  const rgb = parseHex(hex);
  if (!rgb) return false;
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const luminance =
    0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b);
  return luminance > 0.5;
}
