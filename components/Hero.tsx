import HeroGlow from "./HeroGlow";
import styles from "./Hero.module.css";

/**
 * "Experiment Hero" — full-bleed, full-viewport-height warm gradient field with
 * a soft glow, centered on the studio intro line. Sits at the very top of the
 * homepage under the (transparent) nav. The glow drifts and tracks the pointer;
 * it lives in its own client component so this stays server-rendered.
 */
export default function Hero() {
  return (
    <section className={styles.hero} aria-label="Introduction">
      <HeroGlow />
      <p className={styles.intro}>
        The studio of designer Na&iuml;m Sheriff. Based in Brooklyn, NY helping
        brands create beautiful experiences for apps and web.
      </p>
    </section>
  );
}
