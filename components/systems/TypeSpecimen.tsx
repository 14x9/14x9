"use client";

import { useEffect, useRef, useState } from "react";
import Text from "@/components/Text";
import styles from "./TypeSpecimen.module.css";

type Variant = Parameters<typeof Text>[0]["variant"];

type Specs = {
  family: string;
  size: string;
  lineHeight: string;
  weight: string;
  tracking: string;
  transform: string;
};

/**
 * Renders a type specimen and reports its *live computed* specs. Measured from
 * the DOM rather than hardcoded so the display ramp's clamp() sizes show their
 * real value at the current viewport — resize and the numbers follow.
 */
export default function TypeSpecimen({
  variant,
  label,
  token,
  sample = "The quick brown fox",
}: {
  variant: Variant;
  label: string;
  token: string;
  sample?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [specs, setSpecs] = useState<Specs | null>(null);

  useEffect(() => {
    const el = ref.current?.firstElementChild;
    if (!el) return;

    const read = () => {
      const cs = getComputedStyle(el);
      const px = (v: string) => `${Math.round(parseFloat(v) * 100) / 100}px`;
      const size = parseFloat(cs.fontSize);
      const lh = parseFloat(cs.lineHeight);
      setSpecs({
        family: cs.fontFamily.split(",")[0].replace(/["']/g, ""),
        size: px(cs.fontSize),
        lineHeight: Number.isNaN(lh)
          ? cs.lineHeight
          : `${px(cs.lineHeight)} (${(lh / size).toFixed(2)})`,
        weight: cs.fontWeight,
        tracking: cs.letterSpacing === "normal" ? "0" : px(cs.letterSpacing),
        transform: cs.textTransform,
      });
    };

    read();
    // clamp() sizes change with viewport, and metrics shift once the webfont
    // swaps in — re-read on both so the numbers stay honest.
    window.addEventListener("resize", read);
    document.fonts?.ready.then(read).catch(() => {});
    return () => window.removeEventListener("resize", read);
  }, []);

  return (
    <div className={styles.row}>
      <div className={styles.specimen} ref={ref}>
        <Text variant={variant}>{sample}</Text>
      </div>

      <dl className={styles.specs}>
        <Spec k="Style" v={label} />
        <Spec k="Font" v={specs?.family} />
        <Spec k="Size" v={specs?.size} />
        <Spec k="Line height" v={specs?.lineHeight} />
        <Spec k="Weight" v={specs?.weight} />
        <Spec k="Tracking" v={specs?.tracking} />
        {specs?.transform && specs.transform !== "none" && (
          <Spec k="Transform" v={specs.transform} />
        )}
        <Spec k="Token" v={token} mono />
      </dl>
    </div>
  );
}

function Spec({ k, v, mono }: { k: string; v?: string; mono?: boolean }) {
  return (
    <div className={styles.spec}>
      <dt className={styles.key}>{k}</dt>
      <dd className={`${styles.val} ${mono ? styles.mono : ""}`}>
        {v ?? "—"}
      </dd>
    </div>
  );
}
