"use client";

import { useEffect, useRef, useState } from "react";
import SunControls, { type SunStats } from "./SunControls";
import { SUN_DEFAULTS, type SunSettings } from "./sunSettings";
import styles from "./Sun.module.css";

/**
 * The orange disc behind the /about hero. Fixed, cropped off the left edge of
 * the screen, and interactive: pointing at it (or touching it) scatters it, and
 * it springs back into a circle when left alone.
 *
 * There is only ever one thing on screen — a field of tens of thousands of dots.
 * At rest they sit on a jittered grid dense enough to add up to a solid disc, so
 * "solid" and "scattered" are the same object in two arrangements rather than
 * two layers being cross-faded.
 *
 * That dot count is only affordable because the dots are splatted straight into
 * an ImageData buffer (a few clamped byte adds each) instead of being stroked
 * onto the canvas. Every dot is the same colour, so the RGB bytes are written
 * once per resize and each frame only touches alpha.
 *
 * Append ?sun to the URL for a console that tunes all of it live.
 */
export default function Sun() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<SunSettings>(SUN_DEFAULTS);
  const [tuning, setTuning] = useState(false);
  const [stats, setStats] = useState<SunStats>({
    fps: 0,
    ms: 0,
    particles: 0,
    idle: true,
  });

  // The render loop reads settings through refs so a slider drag never tears
  // down and rebuilds the whole effect.
  const settingsRef = useRef(settings);
  const tuningRef = useRef(tuning);
  const applyRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!wrapRef.current || !canvasRef.current) return;
    const canvas: HTMLCanvasElement = canvasRef.current;
    const wrap: HTMLDivElement = wrapRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ctx: CanvasRenderingContext2D = context;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // A cleared pixel is the sun's colour at zero alpha, so the whole buffer can
    // be reset with one typed-array fill and the colour never rewritten.
    const clearWord = transparentWord(readSunColor());

    // Geometry. `scale` converts CSS px to buffer px.
    let radius = 0;
    let scale = 1;
    let rb = 0;
    let boxLeft = 0; // viewport px — maps the pointer into the buffer
    let boxTop = 0;
    let bufW = 0;
    let center = 0;

    let img: ImageData | null = null;
    let data: Uint8ClampedArray = new Uint8ClampedArray(0);
    let data32: Uint32Array = new Uint32Array(0);

    // Particles as parallel typed arrays — at this count an array of objects
    // costs more in allocation and cache misses than the physics itself.
    let count = 0;
    let hxs = new Float32Array(0);
    let hys = new Float32Array(0);
    let xs = new Float32Array(0);
    let ys = new Float32Array(0);
    let vxs = new Float32Array(0);
    let vys = new Float32Array(0);
    let ws = new Uint8Array(0);

    // The anti-aliased rim, as pixel offsets and their circle coverage.
    let edgeIdx = new Uint32Array(0);
    let edgeCov = new Float32Array(0);

    let t = 0; // how disrupted the field is: ramps the pointer's influence
    // RMS distance from home, in buffer px. Drives the edge mask: see draw().
    let spread = 0;
    let active = false;
    let px = 0;
    let py = 0;
    let raf = 0;
    let running = false;
    let builtWith = "";

    /** Sizes everything off the wrapper, which is fixed to the viewport.
     *  Returns false when it has no box yet (hidden tab, pre-layout). */
    function layout() {
      const s = settingsRef.current;
      const vw = wrap.clientWidth;
      const vh = wrap.clientHeight;
      if (!vw || !vh) return false;

      radius = Math.max(vw * s.radius, vh * 0.2);
      // The centre sits less than a radius from the left edge, so the viewport
      // crops the disc the way the reference art is cropped by its frame.
      const cx = radius * s.crop;
      const cy = vh * s.centerY;
      // Room for the bloom, plus a little for the pointer to shove dots past it.
      const margin = radius * (s.edgeEnd * (1 + s.bloom) - 1 + 0.3);
      const size = (radius + margin) * 2;
      boxLeft = cx - size / 2;
      boxTop = cy - size / 2;

      // Never rasterise above CSS resolution — there is nothing to gain.
      scale = 1 / Math.max(1, s.dotSize);
      rb = radius * scale;
      bufW = Math.max(2, Math.round(size * scale));
      center = bufW / 2;

      canvas.width = bufW;
      canvas.height = bufW;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      canvas.style.left = `${boxLeft}px`;
      canvas.style.top = `${boxTop}px`;

      img = ctx.createImageData(bufW, bufW);
      data = img.data;
      data32 = new Uint32Array(data.buffer);

      seed();
      buildEdge();
      builtWith = structureKey();
      return true;
    }

    /**
     * Precomputes the anti-aliased circle edge as a list of pixels and their
     * coverage. Seeding dots inside a circle is not enough to get a clean rim:
     * each dot splats a 3x3 kernel, so the outermost ones bleed a pixel past the
     * boundary and leave it ragged. This masks that bleed back to the true
     * circle, which is what makes the resting state a real circle rather than a
     * dithered approximation of one.
     *
     * Only the boundary annulus is stored — a few thousand pixels — so applying
     * it per frame is trivial next to the splat itself. Geometry only, so it
     * survives any change to dot alpha, softness or count.
     */
    function buildEdge() {
      const R = rb * settingsRef.current.edgeEnd;
      const aa = 1; // transition width in buffer px
      const lo = R - aa; // fully inside: nothing to do
      const hi = R + aa + 2; // past the widest kernel bleed: fully cleared
      const idx: number[] = [];
      const cov: number[] = [];

      const y0 = Math.max(0, Math.floor(center - hi));
      const y1 = Math.min(bufW - 1, Math.ceil(center + hi));

      for (let y = y0; y <= y1; y++) {
        const dy = y + 0.5 - center;
        const dy2 = dy * dy;
        if (dy2 > hi * hi) continue;

        // Walk only the two arcs this row crosses, not the disc's full width.
        const outer = Math.sqrt(hi * hi - dy2);
        const inner = dy2 < lo * lo ? Math.sqrt(lo * lo - dy2) : 0;
        const spans: [number, number][] = inner
          ? [
              [center - outer, center - inner],
              [center + inner, center + outer],
            ]
          : [[center - outer, center + outer]];

        for (const [from, to] of spans) {
          const x0 = Math.max(0, Math.floor(from));
          const x1 = Math.min(bufW - 1, Math.ceil(to));
          for (let x = x0; x <= x1; x++) {
            const dx = x + 0.5 - center;
            const r = Math.sqrt(dx * dx + dy2);
            const c = Math.min(1, Math.max(0, 0.5 + (R - r) / aa));
            if (c > 0.999) continue;
            idx.push(((y * bufW + x) << 2) + 3);
            cov.push(c);
          }
        }
      }

      edgeIdx = new Uint32Array(idx);
      edgeCov = new Float32Array(cov);
    }

    /** Lays the resting disc out as a jittered grid. Even coverage matters more
     *  than randomness here — scattering points freely clumps, and the clumps
     *  show up as blotches once the field is dense enough to look solid. */
    function seed() {
      const s = settingsRef.current;
      const rMax = rb * s.edgeEnd;
      const cells = Math.ceil((rMax * 2) / s.spacing) + 1;
      const cap = cells * cells;

      hxs = new Float32Array(cap);
      hys = new Float32Array(cap);
      xs = new Float32Array(cap);
      ys = new Float32Array(cap);
      vxs = new Float32Array(cap);
      vys = new Float32Array(cap);
      ws = new Uint8Array(cap);

      const origin = center - rMax;
      // At feather 0 the band collapses and every dot is full strength, so the
      // disc is uniform right up to the cut and the edge mask defines the rim.
      const band = (s.edgeEnd - s.edgeStart) * s.feather;
      let n = 0;

      for (let gy = 0; gy < cells; gy++) {
        for (let gx = 0; gx < cells; gx++) {
          const x = origin + (gx + Math.random()) * s.spacing;
          const y = origin + (gy + Math.random()) * s.spacing;
          const dx = x - center;
          const dy = y - center;
          const r = Math.sqrt(dx * dx + dy * dy);
          if (r > rMax) continue;

          let taper = 1;
          if (band > 1e-6) {
            const e = Math.min(1, Math.max(0, (s.edgeEnd - r / rb) / band));
            taper = e * e * (3 - 2 * e); // smoothstep
          }
          hxs[n] = x;
          hys[n] = y;
          xs[n] = x;
          ys[n] = y;
          // The per-dot variation is invisible in the saturated core and only
          // surfaces at the rim, where it becomes the dithered edge — so it is
          // scaled by feather too, keeping a hard-edged disc perfectly even.
          ws[n] = s.peak * taper * (1 - s.feather * 0.18 * Math.random());
          n++;
        }
      }

      count = n;
    }

    /** Splats every dot as a separable 3x3 kernel, which resolves to a round dot
     *  rather than a square. The diagonal taps matter: with only a cross the
     *  pixels sitting diagonally between dot centres catch nothing and the
     *  resting disc comes out full of pinholes.
     *
     *  The kernel tightens toward a single pixel as the field disperses, and the
     *  centre brightens to compensate. Bloom alone cannot break the disc up —
     *  dots this closely spaced still overlap once spread — so they have to get
     *  smaller as they separate, which is also what keeps them reading as dots
     *  rather than as a wash once apart.
     *
     *  Adds land in a Uint8ClampedArray, so overlap saturates for free instead
     *  of needing a min() on every write. */
    function draw() {
      if (!img) return;
      const soft = settingsRef.current.softness;
      data32.fill(clearWord);

      const w = bufW;
      const row = w << 2;
      const max = w - 1;
      const bleed = 1 - t;
      const orthK = (soft * 256 * bleed) | 0;
      const diagK = (soft * soft * 256 * bleed) | 0;
      const boost = 1 + t;

      if (orthK < 2) {
        // Fully dispersed: the kernel has narrowed to a single pixel and the
        // eight neighbour writes would all round to zero. Worth its own loop —
        // `t` sits here for as long as the pointer stays on the sun, which is
        // exactly when frames are being drawn.
        for (let i = 0; i < count; i++) {
          const xi = xs[i] | 0;
          const yi = ys[i] | 0;
          if (xi < 1 || yi < 1 || xi >= max || yi >= max) continue;
          data[((yi * w + xi) << 2) + 3] += ws[i] * boost;
        }
      } else {
        for (let i = 0; i < count; i++) {
          const xi = xs[i] | 0;
          const yi = ys[i] | 0;
          if (xi < 1 || yi < 1 || xi >= max || yi >= max) continue;

          const a = ws[i];
          const orth = (a * orthK) >> 8;
          const o = ((yi * w + xi) << 2) + 3;
          const up = o - row;
          const down = o + row;

          data[o] += a * boost;
          data[o - 4] += orth;
          data[o + 4] += orth;
          data[up] += orth;
          data[down] += orth;

          if (diagK >= 2) {
            const diag = (a * diagK) >> 8;
            data[up - 4] += diag;
            data[up + 4] += diag;
            data[down - 4] += diag;
            data[down + 4] += diag;
          }
        }
      }

      // Cut the rim back to a true circle. The mask opens while the field is
      // away from home so scattered dots are free to fly past the boundary —
      // the hard edge is a property of the resting state, not a permanent clip.
      //
      // It is driven by how far the field actually is from home rather than by
      // `t`. The springs lag `t` badly on the way back, so keying off `t` would
      // re-clip the rim while it was still spread thin, drawing a bright
      // hairline ring at the boundary. Tying it to the field means the edge only
      // hardens once the density behind it is genuinely back.
      const relax = Math.min(1, Math.max(t, spread * 2));
      if (relax < 0.999) {
        for (let k = 0; k < edgeIdx.length; k++) {
          const c = edgeCov[k];
          const o = edgeIdx[k];
          data[o] = data[o] * (c + (1 - c) * relax);
        }
      }

      ctx.putImageData(img, 0, 0);
    }

    function step() {
      const s = settingsRef.current;
      // Scatter fast, reassemble slower — the settle is the part worth watching.
      t += ((active ? 1 : 0) - t) * (active ? s.attack : s.release);

      const reach = rb * s.reach;
      const reach2 = reach * reach;
      const push = rb * s.push * t;
      const jitter = rb * s.jitter * t;
      const stirring = t > 0.002;
      const expand = 1 + s.bloom * t;
      const spring = s.spring;
      const damping = s.damping;
      let settled = true;
      // Every 16th dot is enough for an RMS estimate over a field this size.
      let sumSq = 0;
      let samples = 0;

      for (let i = 0; i < count; i++) {
        const x = xs[i];
        const y = ys[i];
        let vx = vxs[i];
        let vy = vys[i];

        if (stirring) {
          const dx = x - px;
          const dy = y - py;
          const d2 = dx * dx + dy * dy;
          if (d2 < reach2) {
            const d = Math.sqrt(d2) || 0.001;
            const f = 1 - d / reach;
            const a = (f * f * push) / d;
            vx += dx * a;
            vy += dy * a;
          }
          // Ambient stir, so the whole disc breaks up rather than only the part
          // directly under the pointer.
          vx += (Math.random() - 0.5) * jitter;
          vy += (Math.random() - 0.5) * jitter;
        }

        // Springs toward its home scaled out from the centre, so the resting
        // arrangement is preserved exactly — at t = 0 the target is home.
        const ox = center + (hxs[i] - center) * expand - x;
        const oy = center + (hys[i] - center) * expand - y;
        vx = (vx + ox * spring) * damping;
        vy = (vy + oy * spring) * damping;

        vxs[i] = vx;
        vys[i] = vy;
        const nx = x + vx;
        const ny = y + vy;
        xs[i] = nx;
        ys[i] = ny;

        if ((i & 15) === 0) {
          const gx = nx - hxs[i];
          const gy = ny - hys[i];
          sumSq += gx * gx + gy * gy;
          samples++;
        }

        if (settled && (vx * vx + vy * vy > 4e-4 || ox * ox + oy * oy > 0.01)) {
          settled = false;
        }
      }

      spread = samples ? Math.sqrt(sumSq / samples) : 0;
      return settled;
    }

    // Frame timing, only surfaced while the console is open.
    let frames = 0;
    let acc = 0;
    let window0 = 0;

    function report(idle: boolean) {
      if (!tuningRef.current) return;
      setStats({
        fps: idle || !frames ? 0 : Math.round((frames * 1000) / (performance.now() - window0)),
        ms: frames ? +(acc / frames).toFixed(2) : 0,
        particles: count,
        idle,
      });
    }

    function loop() {
      const t0 = performance.now();
      const settled = step();
      draw();
      acc += performance.now() - t0;
      frames++;

      // Home and still: snap off the last hundredths of a pixel so the resting
      // disc is exactly the grid it was seeded as, then stop burning frames.
      if (!active && settled && t < 0.004) {
        t = 0;
        spread = 0;
        xs.set(hxs);
        ys.set(hys);
        vxs.fill(0);
        vys.fill(0);
        draw();
        running = false;
        report(true);
        return;
      }

      if (performance.now() - window0 > 400) {
        report(false);
        frames = 0;
        acc = 0;
        window0 = performance.now();
      }

      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (running || reduced || !bufW) return;
      running = true;
      frames = 0;
      acc = 0;
      window0 = performance.now();
      raf = requestAnimationFrame(loop);
    }

    function setPointer(clientX: number, clientY: number) {
      if (!bufW) return;
      px = (clientX - boxLeft) * scale;
      py = (clientY - boxTop) * scale;
      const dx = px - center;
      const dy = py - center;
      const hit = rb * 1.05;
      active = dx * dx + dy * dy < hit * hit;
      start();
    }

    /** Keys that change the field's structure and so need a reseed; everything
     *  else is read fresh each frame and needs nothing. */
    function structureKey() {
      const s = settingsRef.current;
      return [
        s.radius,
        s.crop,
        s.centerY,
        s.dotSize,
        s.spacing,
        s.peak,
        s.feather,
        s.edgeStart,
        s.edgeEnd,
        s.bloom, // only because it sizes the canvas margin
      ].join("|");
    }

    applyRef.current = () => {
      const s = settingsRef.current;
      canvas.style.filter = s.blur > 0 ? `blur(${s.blur}px)` : "";
      if (structureKey() !== builtWith && !layout()) return;
      draw();
      start();
    };

    const onMove = (e: PointerEvent) => setPointer(e.clientX, e.clientY);
    const onDown = (e: PointerEvent) => setPointer(e.clientX, e.clientY);
    const onUp = (e: PointerEvent) => {
      // Touch has no hover, so lifting the finger is what ends the disruption.
      if (e.pointerType !== "mouse") {
        active = false;
        start();
      }
    };
    const onLeave = () => {
      active = false;
      start();
    };

    let resizeRaf = 0;
    const relayout = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        if (!layout()) return;
        setReady(true);
        draw();
        start();
      });
    };

    // Observing the wrapper (rather than listening for window resize) also
    // covers the case where the first paint happens with no layout box at all —
    // a background tab, say — which would otherwise leave a zero-size canvas.
    const ro = new ResizeObserver(relayout);
    ro.observe(wrap);

    if (!reduced) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onDown, { passive: true });
      window.addEventListener("pointerup", onUp, { passive: true });
      window.addEventListener("pointercancel", onUp, { passive: true });
      document.addEventListener("pointerleave", onLeave);
    }

    return () => {
      applyRef.current = null;
      ro.disconnect();
      cancelAnimationFrame(raf);
      cancelAnimationFrame(resizeRaf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  useEffect(() => {
    setTuning(new URLSearchParams(window.location.search).has("sun"));
  }, []);

  useEffect(() => {
    tuningRef.current = tuning;
    // The field usually settles before the console mounts, so nothing would
    // have reported the particle count yet. Kick one frame to fill it in.
    if (tuning) applyRef.current?.();
  }, [tuning]);

  useEffect(() => {
    settingsRef.current = settings;
    applyRef.current?.();
  }, [settings]);

  return (
    <>
      <div className={styles.wrap} ref={wrapRef} data-ready={ready} aria-hidden>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
      {tuning ? (
        <SunControls
          settings={settings}
          stats={stats}
          onChange={setSettings}
          onClose={() => setTuning(false)}
        />
      ) : null}
    </>
  );
}

/** Reads --color-sun so the disc stays token-driven. Falls back to #ff8902. */
function readSunColor(): [number, number, number] {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--color-sun")
    .trim();
  const hex = /^#?([0-9a-f]{6})$/i.exec(raw);
  if (!hex) return [255, 137, 2];
  const n = parseInt(hex[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Packs a colour at zero alpha into one word, matching the platform's byte
 *  order — ImageData bytes are always RGBA, but a Uint32 view of them is not. */
function transparentWord([r, g, b]: [number, number, number]): number {
  const probe = new Uint8Array(4);
  new Uint32Array(probe.buffer)[0] = 1;
  const littleEndian = probe[0] === 1;
  return littleEndian
    ? (r | (g << 8) | (b << 16)) >>> 0
    : ((r << 24) | (g << 16) | (b << 8)) >>> 0;
}
