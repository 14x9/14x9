import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getWork, getWorkSlugs } from "@/lib/work";
import { isLightColor } from "@/lib/color";
import Text from "@/components/Text";
import Button from "@/components/Button";
import Reveal from "@/components/Reveal";
import HeroMedia from "@/components/case-study/HeroMedia";
import {
  Figure,
  Video,
  Carousel,
  CarouselItem,
  MediaGrid,
  Caption,
  Section,
  Quote,
} from "@/components/case-study/blocks";
import styles from "./page.module.css";

// Components available inside case-study MDX without importing them.
const mdxComponents = {
  Figure,
  Video,
  Carousel,
  CarouselItem,
  MediaGrid,
  Caption,
  Section,
  Quote,
};

export function generateStaticParams() {
  return getWorkSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getWork(slug);
  if (!doc) return {};
  return {
    title: doc.title,
    description: doc.summary,
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = getWork(slug);
  if (!doc) notFound();

  // Flip the masthead text to dark on light hero fills; light on dark (default).
  const mastheadText = isLightColor(doc.heroColor)
    ? "var(--color-ink)"
    : "var(--color-paper)";

  return (
    <article className={styles.article}>
      {/* Title block on the study's own colour fill. */}
      <header
        className={styles.masthead}
        style={{ background: doc.heroColor ?? "var(--color-ink)" }}
      >
        <div className={`container ${styles.mastheadInner}`}>
          <Reveal>
            <h1 className={styles.title} style={{ color: mastheadText }}>
              {doc.title}
            </h1>
          </Reveal>
          <Reveal delay={90}>
            <p className={styles.category} style={{ color: mastheadText }}>
              {doc.category}
            </p>
          </Reveal>
        </div>
      </header>

      {/* Opening image: overlaps up into the colour fill, then opens out to the
          full browser width as the page scrolls. */}
      {doc.hero && (
        <HeroMedia src={doc.hero} alt={`${doc.title} — hero`} />
      )}

      {/* Role on the left, summary + live link on the right. */}
      <div className={`container ${styles.intro}`}>
        {doc.role && (
          <Reveal>
            <p className={styles.role}>{doc.role}</p>
          </Reveal>
        )}
        <Reveal delay={90} className={styles.introRight}>
          {doc.summary && <p className={styles.summary}>{doc.summary}</p>}
          {doc.liveUrl && (
            <Button href={doc.liveUrl} variant="outline" size="md">
              See it live ↗
            </Button>
          )}
        </Reveal>
      </div>

      <div className={`container ${styles.body}`}>
        <MDXRemote source={doc.content} components={mdxComponents} />
      </div>
    </article>
  );
}
