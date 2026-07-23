"use client";

import Image from "next/image";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import styles from "./blocks.module.css";

type Slide = { src: string; alt?: string; width?: number; height?: number };

/**
 * A slide inside a Keystatic-authored <Carousel>. Renders nothing itself — the
 * Carousel reads its props. Registered so MDX doesn't choke on the tag.
 */
export function CarouselItem(_props: { src: string; alt?: string }): null {
  return null;
}

/** Build the slide list from <CarouselItem> children (Keystatic authoring path). */
function slidesFromChildren(children: ReactNode): Slide[] {
  const out: Slide[] = [];
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue;
    const props = (child as { props?: { src?: string; alt?: string } }).props ?? {};
    if (props.src) out.push({ src: props.src, alt: props.alt });
  }
  return out;
}

/**
 * Horizontal carousel built on native scroll-snap — no slider library, no
 * transform maths. Scroll, swipe, arrow keys, and the buttons all drive the same
 * scroll position, so touch and desktop behave identically and it degrades to a
 * plain scrollable strip if JS never runs.
 *
 * Accepts either an explicit `slides` array (hand-authored MDX) or
 * `<CarouselItem>` children (Keystatic).
 */
export default function Carousel({
  slides: slidesProp,
  children,
  aspect = "16 / 10",
}: {
  slides?: Slide[];
  children?: ReactNode;
  aspect?: string;
}) {
  const slides = slidesProp ?? slidesFromChildren(children);
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);

  const scrollTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(slides.length - 1, i));
    const slide = track.children[clamped] as HTMLElement | undefined;
    if (slide) track.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
  }, [slides.length]);

  // Track which slide is centred so the dots/buttons stay in sync with manual scrolling.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const i = Math.round(track.scrollLeft / (track.clientWidth || 1));
        setIndex(Math.max(0, Math.min(slides.length - 1, i)));
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [slides.length]);

  return (
    <div className={styles.carousel}>
      <ul
        ref={trackRef}
        className={styles.carouselTrack}
        style={{ aspectRatio: aspect }}
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label={`${slides.length} images`}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") { e.preventDefault(); scrollTo(index + 1); }
          if (e.key === "ArrowLeft") { e.preventDefault(); scrollTo(index - 1); }
        }}
      >
        {slides.map((s, i) => (
          <li key={s.src} className={styles.carouselSlide} aria-label={`${i + 1} of ${slides.length}`}>
            <Image
              src={s.src}
              alt={s.alt ?? ""}
              width={s.width ?? 2634}
              height={s.height ?? 1634}
              sizes="(max-width: 900px) 100vw, 1300px"
            />
          </li>
        ))}
      </ul>

      <div className={styles.carouselControls}>
        <div className={styles.dots}>
          {slides.map((s, i) => (
            <button
              key={s.src}
              type="button"
              className={`${styles.dot} ${i === index ? styles.dotOn : ""}`}
              aria-label={`Go to image ${i + 1}`}
              aria-current={i === index}
              onClick={() => scrollTo(i)}
            />
          ))}
        </div>
        <div className={styles.arrows}>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => scrollTo(index - 1)}
            disabled={index === 0}
            aria-label="Previous image"
          >
            ←
          </button>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => scrollTo(index + 1)}
            disabled={index === slides.length - 1}
            aria-label="Next image"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
