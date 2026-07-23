"use client";

import { useEffect, useRef } from "react";
import styles from "./Hero.module.css";

/**
 * The hero's soft glow, drifting slowly around the field and following the
 * pointer when one enters.
 *
 * The glow is its own element moved with `transform` rather than a gradient
 * whose centre is animated: a full-bleed radial gradient has to be re-rasterised
 * every time its centre moves, which is far too much work per frame at this
 * size. As a transform on a promoted layer, the gradient rasterises once and the
 * compositor just moves it — which is what makes the motion smooth.
 *
 * Drift is a sum of sines with mutually unrelated periods (57s/33s horizontally,
 * 70s/27s vertically), so the path never visibly repeats the way a single
 * ellipse would. Pointer tracking blends over the drift rather than replacing
 * it, so releasing hands the glow back to wherever the drift has wandered to
 * with no jump.
 */
export default function HeroGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const hero = el?.parentElement;
    if (!el || !hero) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Layout, cached — read on resize/scroll rather than per frame.
    let w = 0;
    let h = 0;
    let size = 0;
    let rect = hero.getBoundingClientRect();

    // Drift clock and pointer state.
    let t = 0;
    let follow = 0; // 0 = drifting freely, 1 = pinned to the pointer
    let followTarget = 0;
    let pointerX = 0;
    let pointerY = 0;

    // Rendered centre, in hero-local px.
    let x = 0;
    let y = 0;
    let placed = false;

    // Shape state. Velocity is smoothed and kept as a vector rather than an
    // angle so the orientation interpolates through zero instead of wrapping
    // at ±180°, which would snap the ellipse around.
    let prevX = 0;
    let prevY = 0;
    let velX = 0;
    let velY = 0;
    // Stretch runs on its own under-damped spring, so the shape overshoots
    // slightly and settles when the glow stops — that wobble is the elasticity.
    let stretch = 0;
    let stretchVel = 0;

    let raf = 0;
    let last = 0;
    let running = false;

    const measure = () => {
      rect = hero.getBoundingClientRect();
      w = hero.clientWidth;
      h = hero.clientHeight;
      size = el.offsetWidth;
      if (!placed && w && h) {
        // Start where the static design has it, then drift away from there.
        x = w * 0.74;
        y = h * -0.12;
        // Seed the velocity reference too, or the first frame reads the jump
        // from 0 as an enormous speed and snaps the shape flat.
        prevX = x;
        prevY = y;
        placed = true;
      }
    };

    /** Where the glow wants to be when nothing is driving it. */
    const driftX = () =>
      w * (0.55 + 0.28 * Math.sin(t * 0.11) + 0.1 * Math.sin(t * 0.19 + 1.7));
    const driftY = () =>
      h * (0.1 + 0.3 * Math.sin(t * 0.09 + 0.6) + 0.1 * Math.cos(t * 0.23 + 2.4));

    /** Frame-rate independent ease — `rate` is roughly "per second". */
    const approach = (from: number, to: number, rate: number, dt: number) =>
      from + (to - from) * (1 - Math.exp(-rate * dt));

    const frame = (now: number) => {
      // Clamped so a background tab or a slow frame can't teleport the glow.
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;

      follow = approach(follow, followTarget, followTarget > follow ? 2.5 : 1.2, dt);

      const dx = driftX();
      const dy = driftY();
      const targetX = dx + (pointerX - dx) * follow;
      const targetY = dy + (pointerY - dy) * follow;

      // The lag here is the "buttery" part — the glow never snaps to the cursor.
      x = approach(x, targetX, 2.5, dt);
      y = approach(y, targetY, 2.5, dt);

      // --- Shape ---------------------------------------------------------
      // Smoothed velocity, px/sec.
      velX = approach(velX, (x - prevX) / dt, 9, dt);
      velY = approach(velY, (y - prevY) / dt, 9, dt);
      prevX = x;
      prevY = y;

      const speed = Math.hypot(velX, velY);
      // Elongate along the direction of travel, thinning across it — the
      // squash-and-stretch that reads as a soft body being pulled along.
      const target = Math.min(speed * 0.00075, 0.2);
      stretchVel += (target - stretch) * 70 * dt;
      stretchVel *= Math.exp(-7.5 * dt); // under-damped: settles with a wobble
      stretch += stretchVel * dt;

      const angle = (Math.atan2(velY, velX) * 180) / Math.PI;

      // A slow breathe on two unrelated periods, on axes that themselves rotate
      // slowly, so the resting shape is never a plain circle.
      const breatheX = 1 + 0.09 * Math.sin(t * 0.13);
      const breatheY = 1 + 0.09 * Math.sin(t * 0.17 + 2.1);
      const breatheAngle = 22 * Math.sin(t * 0.05);

      el.style.transform =
        `translate3d(${x - size / 2}px, ${y - size / 2}px, 0) ` +
        // Stretch operator, in the parent's frame: rotate onto the direction of
        // travel, scale, rotate back. Collapses to identity as stretch → 0, so a
        // resting glow is unaffected by whatever `angle` happens to be.
        `rotate(${angle}deg) scale(${1 + stretch}, ${1 - stretch * 0.55}) rotate(${-angle}deg) ` +
        // Applied first: turns the source circle into the breathing ellipse.
        `rotate(${breatheAngle}deg) scale(${breatheX}, ${breatheY})`;

      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onPointerMove = (e: PointerEvent) => {
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (inside) {
        pointerX = e.clientX - rect.left;
        pointerY = e.clientY - rect.top;
        followTarget = 1;
      } else {
        followTarget = 0;
      }
    };
    const onRelease = (e: PointerEvent) => {
      // Touch has no hover to fall back on, so lifting ends the tracking.
      if (e.pointerType !== "mouse") followTarget = 0;
    };
    const onLeave = () => {
      followTarget = 0;
    };

    measure();
    start();

    const ro = new ResizeObserver(measure);
    ro.observe(hero);
    // Only the hero's viewport offset changes on scroll, but pointer coords are
    // mapped through it, so it has to stay current.
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onRelease, { passive: true });
    window.addEventListener("pointercancel", onRelease, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    // Don't animate a hero that has been scrolled past.
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 },
    );
    io.observe(hero);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("scroll", measure);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerMove);
      window.removeEventListener("pointerup", onRelease);
      window.removeEventListener("pointercancel", onRelease);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <div ref={ref} className={styles.glow} aria-hidden />;
}
