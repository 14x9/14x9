"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import styles from "./HeroMedia.module.css";

/**
 * The case study's opening image.
 *
 * It sits inset to the page gutters and overlaps up into the masthead's colour
 * fill, so on load there's a visible seam hinting that there's more below. As
 * the user scrolls it opens out to the full browser width.
 *
 * Progress is written to a `--p` custom property (0 → 1) directly on the node
 * rather than through React state — scroll events shouldn't re-render a tree.
 * The wrapper's box never changes size, so nothing below it shifts.
 */
export default function HeroMedia({
  src,
  alt,
  width = 2400,
  height = 1500,
  /** Scroll distance (px) over which it reaches full width. */
  range = 400,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  range?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--p", "1");
      return;
    }

    let raf = 0;
    const update = () => {
      const p = Math.min(1, Math.max(0, window.scrollY / range));
      el.style.setProperty("--p", p.toFixed(4));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [range]);

  return (
    <div ref={ref} className={styles.wrap}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority
        sizes="100vw"
        className={styles.img}
      />
    </div>
  );
}
