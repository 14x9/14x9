import styles from "./BottomBlur.module.css";

/**
 * Fixed progressive blur along the bottom edge of the screen (mobile only).
 * Mirrors the nav's frosted stack — a set of backdrop-filter layers with
 * growing radius — but flipped vertically, so the blur compounds at the very
 * bottom edge and fades to clear toward the top. Rendered globally via Chrome.
 */
export default function BottomBlur() {
  return (
    <div className={styles.blur} aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} />
      ))}
    </div>
  );
}
