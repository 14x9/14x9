/**
 * One-off: move case-study assets into the folder Keystatic owns.
 *
 * Keystatic garbage-collects its configured image directory, so it must own that
 * folder exclusively. This copies every image a study references into
 * `public/uploads/<slug>/` and rewrites the MDX paths to `/uploads/<slug>/…`.
 *
 * - Originals under `public/work/` are COPIED, not moved, so nothing is lost.
 * - `hero`/`thumb` are named `hero.<ext>` / `thumb.<ext>` to match how Keystatic
 *   names top-level image fields (from the field key), so the first save is a
 *   no-op for them rather than a rename.
 * - References whose file is missing are still rewritten, so restoring the file
 *   into `public/uploads/<slug>/` later just works.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contentDir = path.join(root, "content", "work");
const publicDir = path.join(root, "public");

let copied = 0;
let rewritten = 0;
const missing = [];

for (const file of fs.readdirSync(contentDir).filter((f) => f.endsWith(".mdx"))) {
  const slug = file.replace(/\.mdx$/, "");
  const filePath = path.join(contentDir, file);
  let src = fs.readFileSync(filePath, "utf8");
  const before = src;
  const destDir = path.join(publicDir, "uploads", slug);

  /** Copy one asset into uploads/<slug>/ and return its new public path. */
  const relocate = (ref, newBase) => {
    if (!ref.startsWith("/") || ref.startsWith("/uploads/")) return ref;
    const from = path.join(publicDir, ref);
    const ext = path.extname(ref);
    const name = newBase ? `${newBase}${ext}` : path.basename(ref);
    const to = path.join(destDir, name);
    if (fs.existsSync(from)) {
      fs.mkdirSync(destDir, { recursive: true });
      if (!fs.existsSync(to)) {
        fs.copyFileSync(from, to);
        copied += 1;
      }
    } else {
      missing.push(`${slug}: ${ref}`);
    }
    return `/uploads/${slug}/${name}`;
  };

  // frontmatter hero / thumb -> hero.<ext> / thumb.<ext>
  src = src.replace(/^(hero:\s*)(\S+)$/m, (_m, k, v) => k + relocate(v.replace(/['"]/g, ""), "hero"));
  src = src.replace(/^(thumb:\s*)(\S+)$/m, (_m, k, v) => k + relocate(v.replace(/['"]/g, ""), "thumb"));

  // body src="..." (Figure, CarouselItem, Video, poster) -> keep original filename
  src = src.replace(/(\b(?:src|poster)=")([^"]+)(")/g, (_m, a, ref, b) => a + relocate(ref) + b);

  if (src !== before) {
    fs.writeFileSync(filePath, src);
    rewritten += 1;
    console.log(`rewrote ${file}`);
  }
}

console.log(`\n${copied} file(s) copied into public/uploads/, ${rewritten} mdx file(s) rewritten.`);
if (missing.length) {
  console.log(`\n${missing.length} reference(s) point at a file that no longer exists.`);
  console.log("Restore these into public/uploads/<slug>/ when you have them:");
  for (const m of missing) console.log("  " + m);
}
