import styles from "./Marquee.module.css";

/**
 * Infinite horizontal marquee (used for the Brands / Agencies bands on /about).
 * Duplicates the content so the scroll loops seamlessly. Respects
 * prefers-reduced-motion (animation is disabled globally in that case).
 */
export default function Marquee({
  text,
  repeat = 6,
}: {
  text: string;
  repeat?: number;
}) {
  const items = Array.from({ length: repeat });
  return (
    <div className={styles.marquee} aria-label={text} role="img">
      <div className={styles.track} aria-hidden>
        {items.map((_, i) => (
          <span key={i} className={styles.item}>
            {text} <span className={styles.dot}>•</span>
          </span>
        ))}
        {items.map((_, i) => (
          <span key={`b-${i}`} className={styles.item}>
            {text} <span className={styles.dot}>•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
