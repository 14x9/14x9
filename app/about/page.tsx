import type { Metadata } from "next";
import Text from "@/components/Text";
import Marquee from "@/components/Marquee";
import Reveal from "@/components/Reveal";
import Sun from "@/components/Sun";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "About",
  description:
    "14x9 Inc. is the design studio of Naïm Sheriff — beautiful app and web experiences for brands and agencies.",
};

type Logo = { name: string; logo?: string };

// Client / partner lists for the two dark bands. Marks live in /public/logos as
// white artwork, which is why they sit directly on the dark band with no filter.
// `name` is used for the alt text (and as a wordmark fallback if a file is
// missing), so keep it filled in.
const clients: Logo[] = [
  { name: "Robinhood", logo: "/logos/logo-robinhood.svg" },
  { name: "Apple", logo: "/logos/logo-apple.svg" },
  { name: "Google", logo: "/logos/logo-google.svg" },
  { name: "Instacart", logo: "/logos/logo-instacart.svg" },
  { name: "Hark", logo: "/logos/logo-hark.svg" },
  { name: "Fairgame", logo: "/logos/logo-fairgame.svg" },
  { name: "Starbucks", logo: "/logos/logo-starbucks.svg" },
  { name: "T-Mobile", logo: "/logos/logo-tmobile.svg" },
  { name: "Market by Macy's", logo: "/logos/logo-macysmarket.svg" },
  { name: "Camp", logo: "/logos/logo-camp.svg" },
  { name: "Dupe", logo: "/logos/logo-dupe.svg" },
  { name: "Walmart", logo: "/logos/logo-walmart.svg" },
  { name: "Cricut", logo: "/logos/logo-cricut.svg" },
  { name: "Bombas", logo: "/logos/logo-bombas.svg" },
  { name: "BuzzFeed", logo: "/logos/logo-buzzfeed.svg" },
  { name: "SoFi", logo: "/logos/logo-sofi.svg" },
  { name: "FIGS", logo: "/logos/logo-figs.svg" },
  { name: "Nok", logo: "/logos/logo-nok.svg" },
  { name: "Bace", logo: "/logos/logo-bace.svg" },
  { name: "Bandier", logo: "/logos/logo-bandier.svg" },
  { name: "Ursa Major", logo: "/logos/logo-ursamajor.svg" },
  { name: "Design Quarters", logo: "/logos/logo-designquarters.svg" },
  { name: "UNUM Ken Burns", logo: "/logos/logo-kenburns.svg" },
  { name: "Scotts", logo: "/logos/logo-scotts.svg" },
  { name: "Tally", logo: "/logos/logo-tally.svg" },
  { name: "Allē", logo: "/logos/logo-alle.svg" },
  { name: "Alpecin", logo: "/logos/logo-alpecin.svg" },
  { name: "Hyundai", logo: "/logos/logo-hyundai.svg" },
  { name: "Signal", logo: "/logos/logo-signal.svg" },
  { name: "Spin Master", logo: "/logos/logo-spin.svg" },
];

const agencies: Logo[] = [
  { name: "Kettle", logo: "/logos/logo-kettle.svg" },
  { name: "Domaine", logo: "/logos/logo-domaine.svg" },
  { name: "Part and Sum", logo: "/logos/logo-partandsum.svg" },
  { name: "Big Spaceship", logo: "/logos/logo-BigSpaceship.svg" },
  { name: "Staff Only", logo: "/logos/logo-staffonly.svg" },
  { name: "Red Antler", logo: "/logos/logo-redantler.svg" },
  { name: "Hyperakt", logo: "/logos/logo-hyperakt.svg" },
  { name: "Bttr", logo: "/logos/logo-bttr.svg" },
];

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <Sun />

      {/* Hero: oversized serif word, with the intro copy offset to the right half. */}
      <section className={`container ${styles.hero}`}>
        <Reveal as="h1" className={styles.headline}>
          About
        </Reveal>

        <div className={styles.intro}>
          <div className={styles.introCol}>
            <Reveal>
              <p className={styles.est}>14x9 — est 2015</p>
            </Reveal>
            <Reveal delay={90}>
              <Text variant="body-xl">
                14x9 Inc. is the design studio of Naïm Sheriff. He believes
                design should be fun, yet simple. Over the past several years,
                he has partnered with brands and agencies to craft beautiful app
                and web experiences.
              </Text>
            </Reveal>
            <Reveal delay={180}>
              <Text variant="body-xl">
                Naïm thinks big and executes fast, and he thrives on turning
                collaborative ideas into reality.
              </Text>
            </Reveal>
            <Reveal delay={270}>
              <Text variant="body-xl">Let&rsquo;s make something great.</Text>
            </Reveal>
          </div>
        </div>
      </section>

      <LogoBand
        title="Brands"
        copy="Brand, strategy, Art Direction, and UI design work completed for some of the best companies."
        items={clients}
      />

      <LogoBand
        title="Agencies"
        copy="Occasional partnerships with the talented minds behind the most trusted agencies."
        items={agencies}
        endsSection
      />
    </div>
  );
}

/** A dark full-bleed band: marquee title, a line of copy, then a 4-up logo grid. */
function LogoBand({
  title,
  copy,
  items,
  endsSection = false,
}: {
  title: string;
  copy: string;
  items: Logo[];
  /**
   * Set on the last band of the dark run. Every other band's logos get its own
   * bottom padding plus the next band's (much larger) top padding to breathe
   * into; the final one has only its own, so it needs more of it to match.
   */
  endsSection?: boolean;
}) {
  return (
    <section
      className={`${styles.band} ${endsSection ? styles.bandEnd : ""}`.trim()}
    >
      <Marquee text={title} />

      <div className="container">
        <Reveal>
          <Text variant="body-xl" className={styles.bandCopy}>
            {copy}
          </Text>
        </Reveal>

        <ul className={styles.logoGrid}>
          {items.map((item, i) => (
            <Reveal
              as="li"
              key={item.name}
              className={styles.logoCell}
              // Cascade across each row of four.
              delay={(i % 4) * 60}
            >
              {item.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.logo}
                  alt={`${item.name} logo`}
                  className={styles.logoImg}
                />
              ) : (
                <span className={styles.logoName}>{item.name}</span>
              )}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
