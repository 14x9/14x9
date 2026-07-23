/**
 * Tunables for the /about sun. Split out so the dev console and the renderer
 * agree on one shape. Everything here is live-adjustable at /about?sun.
 *
 * The one trade-off worth understanding before turning knobs: `dotSize` sets how
 * many CSS px one buffer pixel covers, so the particle count scales with
 * 1/dotSize². Crisper dots cost quadratically more particles to keep the resting
 * disc solid. The console shows the count and frame time so you can see where
 * that lands.
 */
export type SunSettings = {
  // ---- Layout ----
  /** Disc radius as a fraction of the viewport's larger dimension. */
  radius: number;
  /** Centre x as a fraction of the radius. Below 1 crops it off the left edge. */
  crop: number;
  /** Centre y as a fraction of viewport height. */
  centerY: number;

  // ---- Look ----
  /** CSS px per buffer px. 1 = native (crispest, most particles). */
  dotSize: number;
  /** Buffer px between dots at rest. Lower = denser = more solid. */
  spacing: number;
  /** Alpha one dot deposits. Higher = more saturated, fewer pinholes. */
  peak: number;
  /** Kernel neighbour weight. 0 = single hard pixel, higher = rounder/softer. */
  softness: number;
  /** CSS blur over the whole canvas. 0 = off. */
  blur: number;
  /**
   * How much of the rim is feathered. 0 gives a hard, anti-aliased circle — the
   * resting disc is then a true circle, cut at `edgeEnd`, and `edgeStart` does
   * nothing. Above 0 it scales the taper band back in.
   */
  feather: number;
  /** Where the feathered taper begins, as a fraction of the radius. */
  edgeStart: number;
  /** The disc's outer radius, as a fraction of `radius`. Also the hard cut. */
  edgeEnd: number;

  // ---- Motion ----
  /** How far the disc swells while disturbed. This is what breaks it up. */
  bloom: number;
  /** Peak repulsion from the pointer, as a fraction of the radius. */
  push: number;
  /** Pointer influence radius, as a multiple of the disc radius. */
  reach: number;
  /** Ambient stir while disturbed, as a fraction of the radius. */
  jitter: number;
  /** Pull back toward home per frame. */
  spring: number;
  /** Velocity retained per frame. */
  damping: number;
  /** How fast the disruption ramps up… */
  attack: number;
  /** …and how fast it settles back. */
  release: number;
};

export const SUN_DEFAULTS: SunSettings = {
  radius: 0.295,
  crop: 0.78,
  centerY: 0.45,

  dotSize: 1.1,
  spacing: 1.16,
  peak: 255,
  softness: 0.8,
  blur: 0,
  feather: 0,
  edgeStart: 0.68,
  edgeEnd: 1.1,

  bloom: 0.34,
  push: 0.0063,
  reach: 1.15,
  jitter: 0.0022,
  spring: 0.016,
  damping: 0.865,
  attack: 0.075,
  release: 0.055,
};

export type SunField = {
  key: keyof SunSettings;
  label: string;
  min: number;
  max: number;
  step: number;
};

export const SUN_GROUPS: { title: string; fields: SunField[] }[] = [
  {
    title: "Look",
    fields: [
      { key: "dotSize", label: "Dot size (css px)", min: 1, max: 4, step: 0.1 },
      { key: "spacing", label: "Spacing (buf px)", min: 1.1, max: 3, step: 0.02 },
      { key: "peak", label: "Dot alpha", min: 40, max: 255, step: 1 },
      { key: "softness", label: "Dot softness", min: 0, max: 1, step: 0.02 },
      { key: "blur", label: "Blur (css px)", min: 0, max: 4, step: 0.1 },
      { key: "feather", label: "Rim feather", min: 0, max: 1, step: 0.02 },
      { key: "edgeStart", label: "Rim start", min: 0.4, max: 1, step: 0.01 },
      { key: "edgeEnd", label: "Rim end", min: 1, max: 1.4, step: 0.01 },
    ],
  },
  {
    title: "Motion",
    fields: [
      { key: "bloom", label: "Bloom", min: 0, max: 1.5, step: 0.01 },
      { key: "push", label: "Push", min: 0, max: 0.03, step: 0.0002 },
      { key: "reach", label: "Reach", min: 0.2, max: 2, step: 0.01 },
      { key: "jitter", label: "Jitter", min: 0, max: 0.02, step: 0.0002 },
      { key: "spring", label: "Spring", min: 0.002, max: 0.06, step: 0.001 },
      { key: "damping", label: "Damping", min: 0.7, max: 0.98, step: 0.005 },
      { key: "attack", label: "Attack", min: 0.02, max: 0.4, step: 0.005 },
      { key: "release", label: "Release", min: 0.01, max: 0.3, step: 0.005 },
    ],
  },
  {
    title: "Layout",
    fields: [
      { key: "radius", label: "Radius", min: 0.15, max: 0.6, step: 0.005 },
      { key: "crop", label: "Crop", min: 0.3, max: 1.2, step: 0.01 },
      { key: "centerY", label: "Centre Y", min: 0, max: 1, step: 0.01 },
    ],
  },
];
