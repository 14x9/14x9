import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type WorkFrontmatter = {
  title: string;
  category: string; // e.g. "Web Design — Film"
  role?: string; // e.g. "Art Direction, UX & UI Design"
  summary?: string;
  liveUrl?: string;
  hero?: string; // path under /public, e.g. /work/unum-ken-burns/hero.jpg
  /** Solid fill behind the case-study title block, e.g. "#294D61". Each study
      picks its own; falls back to the site's ink. */
  heroColor?: string;
  order?: number; // sort order in the work list (lower = earlier)
  year?: string;
  comingSoon?: boolean;

  // --- Work-grid layout (homepage thumbnail grid) ---
  // The desktop grid is 12 columns. Portrait thumbs occupy 5 columns, landscape
  // thumbs 6, and a 5 + 6 pair leaves one blank column between them as the gutter.
  // Projects pair up two-per-row in document order; set span: 3 to make a
  // landscape run full-bleed across all 12 columns (breaks out of a pair).
  thumb?: string; // path under /public, e.g. /work/thumbnails/Thumbnail-Hark-L.jpg
  orientation?: "landscape" | "portrait"; // portrait → 5 cols, landscape → 6 cols
  span?: 1 | 2 | 3; // 3 = full-bleed (12 cols); 1/2 follow orientation
};

export type WorkMeta = WorkFrontmatter & { slug: string };
export type WorkDoc = WorkMeta & { content: string };

const WORK_DIR = path.join(process.cwd(), "content", "work");

/**
 * Resolve a slug to its file on disk. Supports both layouts so it doesn't matter
 * whether a study was hand-authored as a flat file or written by Keystatic:
 *   - flat:   content/work/<slug>.mdx
 *   - folder: content/work/<slug>/index.mdx
 * Templates and partials (names starting with "_") are ignored.
 */
function fileForSlug(slug: string): string | null {
  if (slug.startsWith("_")) return null;
  const flat = path.join(WORK_DIR, `${slug}.mdx`);
  if (fs.existsSync(flat)) return flat;
  const folder = path.join(WORK_DIR, slug, "index.mdx");
  if (fs.existsSync(folder)) return folder;
  return null;
}

/** Every case-study slug on disk (flat files and folder entries alike). */
function listSlugs(): string[] {
  if (!fs.existsSync(WORK_DIR)) return [];
  const slugs: string[] = [];
  for (const entry of fs.readdirSync(WORK_DIR, { withFileTypes: true })) {
    if (entry.name.startsWith("_")) continue;
    if (entry.isFile() && entry.name.endsWith(".mdx")) {
      slugs.push(entry.name.replace(/\.mdx$/, ""));
    } else if (
      entry.isDirectory() &&
      fs.existsSync(path.join(WORK_DIR, entry.name, "index.mdx"))
    ) {
      slugs.push(entry.name);
    }
  }
  return slugs;
}

/** All case studies, sorted by `order` then title. */
export function getAllWork(): WorkMeta[] {
  return listSlugs()
    .map((slug) => {
      const file = fileForSlug(slug)!;
      const { data } = matter(fs.readFileSync(file, "utf8"));
      return { slug, ...(data as WorkFrontmatter) };
    })
    .sort((a, b) => {
      const ao = a.order ?? 999;
      const bo = b.order ?? 999;
      if (ao !== bo) return ao - bo;
      return a.title.localeCompare(b.title);
    });
}

/** Slugs for generateStaticParams. */
export function getWorkSlugs(): string[] {
  return getAllWork().map((w) => w.slug);
}

/** Full document (frontmatter + MDX body) for a single case study. */
export function getWork(slug: string): WorkDoc | null {
  const file = fileForSlug(slug);
  if (!file) return null;
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  return { slug, ...(data as WorkFrontmatter), content };
}
