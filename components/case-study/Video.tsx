"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import styles from "./blocks.module.css";

type VideoProps = {
  /** Self-hosted file under /public, e.g. "/work/unum/tour.mp4". Preferred. */
  src?: string;
  /** Vimeo id, e.g. "1098635358". Loads only after the poster is clicked. */
  vimeo?: string;
  /** Still frame. Required for `vimeo`, optional (but nice) for `src`. */
  poster?: string;
  /** Reserves space before the file loads — no layout shift. */
  aspect?: string;
  /** Give it sound + controls instead of an ambient muted loop. */
  sound?: boolean;
  bleed?: boolean;
  caption?: ReactNode;
  children?: ReactNode;
};

/**
 * Case-study video.
 *
 * Two modes, both built to stay out of the way:
 *  - `src`  — a self-hosted file. Ambient clips autoplay muted on loop, but only
 *    while on screen; scrolling past pauses them so we're not burning battery
 *    decoding video nobody is looking at.
 *  - `vimeo` — a poster image with a play button. The Vimeo iframe is injected
 *    on click, so the page ships no third-party player, script, or cookie until
 *    someone actually asks to watch.
 *
 * Either way the frame is sized by `aspect` up front, so nothing reflows.
 */
export default function Video({
  src,
  vimeo,
  poster,
  aspect = "16 / 9",
  sound = false,
  bleed = false,
  caption,
  children,
}: VideoProps) {
  const cap = caption ?? children;
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false); // vimeo: iframe requested

  const ambient = !sound;

  // Play self-hosted ambient loops only while they're in view.
  useEffect(() => {
    const el = ref.current;
    if (!el || !src || !ambient) return;
    if (typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [src, ambient]);

  const frameStyle = { aspectRatio: aspect } as CSSProperties;

  return (
    <figure className={`${styles.figure} ${bleed ? styles.bleed : ""}`}>
      <div className={styles.media} style={frameStyle}>
        {src ? (
          <video
            ref={ref}
            src={src}
            poster={poster}
            muted={ambient}
            loop={ambient}
            controls={!ambient}
            playsInline
            preload="metadata"
            className={styles.videoEl}
          />
        ) : vimeo && playing ? (
          <iframe
            src={`https://player.vimeo.com/video/${vimeo}?autoplay=1&title=0&byline=0&portrait=0`}
            title={typeof cap === "string" ? cap : "Video"}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className={styles.videoEl}
          />
        ) : vimeo ? (
          <button
            type="button"
            className={styles.facade}
            onClick={() => setPlaying(true)}
            aria-label="Play video"
          >
            {poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={poster} alt="" loading="lazy" />
            ) : null}
            <span className={styles.playBtn} aria-hidden>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        ) : null}
      </div>
      {cap ? <figcaption className={styles.caption}>{cap}</figcaption> : null}
    </figure>
  );
}
