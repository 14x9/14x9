import Hero from "@/components/Hero";
import FluidHeadline from "@/components/FluidHeadline";
import Text from "@/components/Text";
import ProjectGrid from "@/components/ProjectGrid";
import Reveal from "@/components/Reveal";
import { getAllWork } from "@/lib/work";
import styles from "./page.module.css";

// Homepage: full-viewport hero, then the Work index.
export default function HomePage() {
  const work = getAllWork();

  return (
    <>
      <Hero />

      <div className={`container ${styles.page}`}>
        <Reveal as="header" className={styles.head}>
          <FluidHeadline text="The Work" className={styles.headline} />
          <Text variant="body-m" className={styles.subline}>
            A selection of work completed between 2018 &amp; 2026.
          </Text>
        </Reveal>

        <ProjectGrid items={work} />
      </div>
    </>
  );
}
