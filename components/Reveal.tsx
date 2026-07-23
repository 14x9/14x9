"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";
import styles from "./Reveal.module.css";

type RevealProps = {
  children: ReactNode;
  /** Element to render (default div). Use "li", "section", etc. to stay semantic. */
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  /** Stagger offset in ms — applied as transition-delay when it reveals. */
  delay?: number;
  /** Anything else (id, aria-*, …) passes through to the rendered element. */
  [key: string]: unknown;
};

/**
 * Reveals its content when it scrolls into view: fades + rises into place. One
 * shot per element (unobserves after it fires). Pass `delay` to stagger a row or
 * a group. Falls back to visible when IntersectionObserver isn't available.
 */
export default function Reveal({
  children,
  as,
  className = "",
  style,
  delay = 0,
  ...rest
}: RevealProps) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        }
      },
      // Fire a touch before the element is fully in view so it feels responsive.
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      {...rest}
      // Polymorphic host tag: the ref is always a DOM element at runtime.
      ref={ref as React.Ref<HTMLElement>}
      data-reveal=""
      className={`${styles.reveal} ${visible ? styles.visible : ""} ${className}`.trim()}
      style={{ ...style, transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </Tag>
  );
}
