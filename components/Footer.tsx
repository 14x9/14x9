import FluidHeadline from "./FluidHeadline";
import { site } from "@/lib/site";
import styles from "./Footer.module.css";

/**
 * Global footer — a full-bleed magma block closing every page (mounted in
 * Chrome.tsx). Contact and social links sit centred up top; the studio line
 * anchors the bottom, scaled by FluidHeadline to span the container exactly at
 * any width, always on one line.
 *
 * All copy comes from lib/site.ts.
 */
export default function Footer() {
  // Em spaces, not regular ones: HTML collapses runs of normal whitespace, and
  // this line is measured and scaled as a single unit, so the separator has to
  // carry its own width.
  const studioLine = `${site.name} — ${site.established} • ${site.location}`;

  return (
    <footer className={styles.footer}>
      <div className="container">
        <ul className={styles.links}>
          <li>
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </li>
          {site.social.map((s) => (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noreferrer noopener">
                {s.label}
              </a>
            </li>
          ))}
        </ul>

        <FluidHeadline
          text={studioLine}
          font="body"
          weight={400}
          heading={false}
          className={styles.studioLine}
        />
      </div>
    </footer>
  );
}
