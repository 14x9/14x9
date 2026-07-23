import Image from "next/image";
import type { ReactNode } from "react";
import { getImageSize, localImageExists } from "@/lib/image";
import styles from "./blocks.module.css";

export { default as Video } from "./Video";
export { default as Carousel, CarouselItem } from "./Carousel";

/*
  Building blocks used inside case-study MDX files. Authoring reads like HTML:

    <Figure src="/work/unum/home.webp" alt="Homepage" width={2000} height={1200}>
      Homepage hero with the Ken Burns crossfade.
    </Figure>

    <MediaGrid>
      <Figure ... />
      <Video src="/work/unum/nav.mp4" />
    </MediaGrid>

  Everything is token-driven and lives under /public.
*/

type FigureProps = {
  src: string;
  alt?: string;
  /** Intrinsic dimensions. Omit and they're read from the file under /public. */
  width?: number;
  height?: number;
  /** Full viewport-width media with no side gutters. */
  bleed?: boolean;
  /** Optional caption; also accepts children as the caption. */
  caption?: ReactNode;
  children?: ReactNode;
  priority?: boolean;
};

export function Figure({
  src,
  alt = "",
  width,
  height,
  bleed = false,
  caption,
  children,
  priority = false,
}: FigureProps) {
  // An image block with no file chosen (easy to create in the editor), or one
  // whose file is missing from /public, must never take the whole page down.
  if (!src || !localImageExists(src)) return null;

  const cap = caption ?? children;
  const isGif = src.toLowerCase().endsWith(".gif");
  // Measure from disk when the author (or Keystatic) didn't pass dimensions.
  const dims =
    width && height ? { width, height } : getImageSize(src, { width: 2000, height: 1250 });
  return (
    <figure className={`${styles.figure} ${bleed ? styles.bleed : ""}`}>
      <div className={styles.media}>
        {isGif ? (
          // next/image doesn't animate gifs; use a plain <img> for them.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} loading="lazy" />
        ) : (
          <Image
            src={src}
            alt={alt}
            width={dims.width}
            height={dims.height}
            priority={priority}
            sizes="(max-width: 900px) 100vw, 1400px"
          />
        )}
      </div>
      {cap ? <Caption>{cap}</Caption> : null}
    </figure>
  );
}

/** Two-or-more items side by side; collapses to one column on small screens. */
export function MediaGrid({
  children,
  columns = 2,
}: {
  children: ReactNode;
  columns?: 2 | 3;
}) {
  return (
    <div
      className={styles.grid}
      style={{ ["--cols" as string]: String(columns) }}
    >
      {children}
    </div>
  );
}

export function Caption({ children }: { children: ReactNode }) {
  return <figcaption className={styles.caption}>{children}</figcaption>;
}

/** A titled prose section between media (the "Playlists", "Content navigation" blocks). */
export function Section({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.section}>
      {title ? <h2 className={styles.sectionTitle}>{title}</h2> : null}
      <div className={styles.prose}>{children}</div>
    </section>
  );
}

export function Quote({
  children,
  cite,
}: {
  children: ReactNode;
  cite?: string;
}) {
  return (
    <blockquote className={styles.quote}>
      {/* children may already be an MDX-wrapped <p>, so don't add another one */}
      <div className={styles.quoteText}>{children}</div>
      {cite ? <cite className={styles.cite}>{cite}</cite> : null}
    </blockquote>
  );
}
