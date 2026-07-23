import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import type { WorkMeta } from "@/lib/work";
import Reveal from "./Reveal";
import styles from "./ProjectGrid.module.css";

// Stagger step (ms) between the two items in a 2-up row.
const STAGGER = 90;

// Intrinsic thumbnail dimensions by orientation (drives aspect ratio).
const DIMS = {
  landscape: { w: 2688, h: 1728 },
  portrait: { w: 1092, h: 1700 },
} as const;

// 12-column desktop grid. Portrait thumbs occupy 5 columns, landscape thumbs 6,
// full-bleed landscapes 12. A 5 + 6 pair sums to 11, so one column is always
// left blank between the two — that blank column is the gutter.
function widthOf(item: WorkMeta): number {
  if ((item.span ?? 2) >= 3) return 12; // full-bleed landscape
  return item.orientation === "portrait" ? 5 : 6;
}

// Walk the list and assign each item its desktop grid-column. Paired items are
// pushed to opposite edges (left item to column 1, right item to column 12) so
// the leftover column sits between them.
function place(
  items: WorkMeta[],
): { item: WorkMeta; col: string; width: number; stagger: number }[] {
  let pairOpen = false; // a left item is waiting for its right partner
  return items.map((item) => {
    const width = widthOf(item);

    if (width === 12) {
      pairOpen = false;
      return { item, col: "1 / -1", width, stagger: 0 };
    }
    if (!pairOpen) {
      pairOpen = true;
      return { item, col: `1 / span ${width}`, width, stagger: 0 }; // hug the left edge
    }
    pairOpen = false;
    // Right of a pair — reveal a beat after its left partner.
    return { item, col: `span ${width} / -1`, width, stagger: STAGGER };
  });
}

export default function ProjectGrid({ items }: { items: WorkMeta[] }) {
  return (
    <ul className={styles.grid}>
      {place(items).map(({ item, col, width, stagger }) => {
        const orientation = item.orientation ?? "landscape";
        const dims = DIMS[orientation];
        const sizes =
          width === 12
            ? "100vw"
            : `(max-width: 600px) 100vw, ${Math.round((width / 12) * 100)}vw`;

        const media = item.thumb ? (
          <div className={styles.media}>
            <Image
              src={item.thumb}
              alt={item.title}
              width={dims.w}
              height={dims.h}
              sizes={sizes}
            />
          </div>
        ) : (
          // No thumbnail exported yet — show a titled placeholder tile.
          <div
            className={styles.placeholder}
            style={{ aspectRatio: `${dims.w} / ${dims.h}` }}
          >
            <span>{item.title}</span>
          </div>
        );

        const label = (
          <div className={styles.label}>
            <span className={styles.title}>{item.title}</span>
            <span className={styles.category}>
              {item.category}
              {item.comingSoon && (
                <span className={styles.soon}> (Coming Soon)</span>
              )}
            </span>
          </div>
        );

        return (
          <Reveal
            as="li"
            key={item.slug}
            className={styles.item}
            style={{ "--col": col } as CSSProperties}
            delay={stagger}
          >
            {item.comingSoon ? (
              <div className={`${styles.card} ${styles.disabled}`} aria-disabled>
                {media}
                {label}
              </div>
            ) : (
              <Link href={`/work/${item.slug}`} className={styles.card}>
                {media}
                {label}
              </Link>
            )}
          </Reveal>
        );
      })}
    </ul>
  );
}
