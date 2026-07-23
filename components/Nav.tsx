"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";
import Logo from "./Logo";
import styles from "./Nav.module.css";

// Which nav item the current route belongs to. Exact matches only — case
// studies at /work/* deliberately leave "Work" inactive, since the nav link
// points at the homepage rather than the study you're reading.
function isActive(pathname: string, href: string) {
  return pathname === href;
}

// Perceived luminance of an sRGB triplet, 0 (black) → 1 (white).
function luma(r: number, g: number, b: number) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// Walk up from an element to the first opaque background-color; default to white
// (the page background) when nothing solid is found.
function backgroundLuma(el: Element | null): number {
  let node: Element | null = el;
  while (node) {
    const m = getComputedStyle(node).backgroundColor.match(/[\d.]+/g);
    if (m) {
      const a = m[3] === undefined ? 1 : Number(m[3]);
      if (a > 0.5) return luma(Number(m[0]), Number(m[1]), Number(m[2]));
    }
    node = node.parentElement;
  }
  return 1;
}

// Average luminance of the slice of an image that sits behind the nav strip
// [navTop, navBottom]. Returns null if it can't be measured (e.g. tainted canvas).
function imageLuma(
  img: HTMLImageElement,
  navTop: number,
  navBottom: number,
): number | null {
  const natW = img.naturalWidth;
  const natH = img.naturalHeight;
  if (!img.complete || !natW || !natH) return null;

  const rect = img.getBoundingClientRect();
  const y0 = Math.max(navTop, rect.top);
  const y1 = Math.min(navBottom, rect.bottom);
  if (y1 <= y0) return null;

  // Map the on-screen strip to source pixels. Handles object-fit: cover and the
  // default (image filled to the element box, 1:1 vertical map).
  let sy: number;
  let sh: number;
  if (getComputedStyle(img).objectFit === "cover") {
    const scale = Math.max(rect.width / natW, rect.height / natH);
    const offY = (rect.height - natH * scale) / 2;
    sy = (y0 - rect.top - offY) / scale;
    sh = (y1 - y0) / scale;
  } else {
    sy = ((y0 - rect.top) / rect.height) * natH;
    sh = ((y1 - y0) / rect.height) * natH;
  }
  sy = Math.max(0, Math.min(natH - 1, sy));
  sh = Math.max(1, Math.min(natH - sy, sh));

  try {
    const cw = 16;
    const ch = 6;
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, sy, natW, sh, 0, 0, cw, ch);
    const { data } = ctx.getImageData(0, 0, cw, ch);
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) sum += luma(data[i], data[i + 1], data[i + 2]);
    return sum / (data.length / 4);
  } catch {
    return null;
  }
}

// The frosted blur is off at the top of the page and fades in once you scroll.
// Two thresholds rather than one so a rest position right on the boundary (or
// sub-pixel scroll jitter) can't flicker the blur on and off.
const BLUR_ON = 12;
const BLUR_OFF = 4;

export default function Nav() {
  const ref = useRef<HTMLElement>(null);
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const header = ref.current;
    if (!header) return;

    let raf = 0;

    const measure = () => {
      const rect = header.getBoundingClientRect();
      const y = (rect.top + rect.bottom) / 2;
      const cache = new Map<HTMLImageElement, number | null>();
      const samples: number[] = [];

      for (const f of [0.12, 0.3, 0.5, 0.7, 0.88]) {
        const x = rect.left + rect.width * f;
        // Topmost element behind the nav (blur layers are pointer-events:none so
        // they're skipped; nav content is filtered out explicitly).
        const behind = document
          .elementsFromPoint(x, y)
          .find((el) => !header.contains(el));

        if (!behind) {
          samples.push(1);
        } else if (behind instanceof HTMLImageElement) {
          if (!cache.has(behind)) cache.set(behind, imageLuma(behind, rect.top, rect.bottom));
          const l = cache.get(behind);
          samples.push(l ?? backgroundLuma(behind));
        } else {
          samples.push(backgroundLuma(behind));
        }
      }

      const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
      setDark(avg < 0.5);
      setScrolled((prev) =>
        window.scrollY > (prev ? BLUR_OFF : BLUR_ON),
      );
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // Re-measure once images/fonts have settled after a navigation.
    const settle = window.setTimeout(measure, 300);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  return (
    <header
      ref={ref}
      className={styles.nav}
      data-theme={dark ? "dark" : undefined}
      data-scrolled={scrolled ? "" : undefined}
    >
      {/* Progressive frosted blur: a stack of backdrop-filter layers, each with
          a larger blur radius masked to a shorter band from the top, so the blur
          compounds at the top of the bar and fades to clear at its bottom edge. */}
      <div className={styles.blur} aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} />
        ))}
      </div>
      <div className={`container ${styles.inner}`}>
        <nav aria-label="Primary">
          <ul className={styles.links}>
            {site.nav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`${styles.link} ${active ? styles.active : ""}`.trim()}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <Link href="/" className={styles.brand} aria-label={`${site.name} — home`}>
          <Logo className={styles.logo} />
        </Link>
      </div>
    </header>
  );
}
