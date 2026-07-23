"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A headline that always fills 100% of its container width and scales uniformly
 * on every breakpoint. It measures the text's real rendered width with plain
 * HTML (reliable in every browser — no SVG getBBox quirks) and sets the
 * font-size so the text spans the container exactly.
 */
export default function FluidHeadline({
  text,
  className,
  weight = 100,
  font = "display",
  heading = true,
}: {
  text: string;
  className?: string;
  weight?: number;
  /** Which family to fit. Page headlines use the display serif; the footer's
   *  studio line uses the body grotesque. */
  font?: "display" | "body";
  /** Exposed as a level-1 heading. Turn off where the text is informational
   *  rather than a page title — the footer runs on every page, so an h1 there
   *  would give every page a second, competing top-level heading. */
  heading?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState<number | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const meas = measureRef.current;
    if (!wrap || !meas) return;

    const BASE = 200; // measure at a fixed size, then scale proportionally
    let raf = 0;

    const fit = () => {
      const containerWidth = wrap.clientWidth;
      const textWidth = meas.getBoundingClientRect().width; // advance width at BASE px
      if (containerWidth > 0 && textWidth > 0) {
        setFontSize((BASE * containerWidth) / textWidth);
      }
    };
    const fitNextFrame = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(fit);
    };

    fit();
    // Re-fit once the webfont has actually loaded (fallback metrics differ).
    document.fonts?.ready.then(fitNextFrame).catch(() => {});
    // Container width changes (viewport, layout) → re-fit.
    const ro = new ResizeObserver(fitNextFrame);
    ro.observe(wrap);
    // Safety nets for a late font swap.
    const timers = [setTimeout(fit, 300), setTimeout(fit, 1000)];

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
    // `font` matters here too: swapping family changes the advance width, so the
    // cached measurement has to be retaken.
  }, [text, weight, font]);

  const fontStack = {
    fontFamily: font === "body" ? "var(--font-body)" : "var(--font-display)",
    fontWeight: weight,
    lineHeight: 1,
    whiteSpace: "nowrap" as const,
    letterSpacing: "normal" as const,
  };

  return (
    <div ref={wrapRef} className={className} style={{ width: "100%" }}>
      {/* Offscreen measurer at a fixed size, same font as the visible headline */}
      <span
        ref={measureRef}
        aria-hidden
        style={{
          ...fontStack,
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          visibility: "hidden",
          fontSize: "200px",
          pointerEvents: "none",
        }}
      >
        {text}
      </span>

      <div
        {...(heading ? { role: "heading", "aria-level": 1 } : {})}
        style={{
          ...fontStack,
          fontSize: fontSize ? `${fontSize}px` : undefined,
          // Hide until sized so there's no flash of a wrongly-scaled headline.
          visibility: fontSize ? "visible" : "hidden",
        }}
      >
        {text}
      </div>
    </div>
  );
}
