# 14x9 — Portfolio

Self-hosted rebuild of the 14x9 portfolio (formerly on Webflow). Built with
**Next.js (App Router) + TypeScript**, plain CSS + design tokens, and **MDX** for
case studies.

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
```

## Add or edit a case study (the visual editor)

Run `npm run dev` and open **http://localhost:3000/keystatic** — a visual editor
for your case studies. Everything runs locally; nothing is uploaded anywhere.

1. **Case studies → +** to add one, or click an existing study to edit it.
2. Fill in the fields: title, project type, sub-title, description, live link,
   **hero colour** (a hex like `#443530` — the title text auto-switches
   light/dark for contrast), hero image, and the homepage thumbnail.
3. In the body, click **+** to drop in blocks in any order: *Text (eyebrow +
   paragraph)*, *1-up image*, *Image grid (2-up / 3-up)*, *Video*, *Carousel*,
   *Pull quote*. Images can be **any size or format** — they're optimized
   automatically, so no need to export WebP first.
4. **Save**, then commit the changed files with git.

> **Watch the thumbnails.** Every image block shows a preview of its image. If a
> block shows *"No image selected"* when you expect a picture, Keystatic could
> not load that file — **saving will drop that image reference**. Fix the image
> before saving. (Your files are safe either way; see "Images" below.)

You can also edit the MDX by hand — see
[`docs/case-study-template.mdx`](docs/case-study-template.mdx).

## Build & self-host

```bash
npm run build
npm run start      # serves the production build (needs Node)
```

Deploys anywhere Node runs (Vercel, Netlify, a VPS, Docker…). Point your custom
domain at the host and you're live.

## Structure

```
app/
  page.tsx              Home = the Work index (the new homepage)
  about/page.tsx        About
  systems/page.tsx      Design system reference (tokens + components)
  work/[slug]/page.tsx  Renders a case study from its MDX file
components/             Nav, Footer, Button, Text, ProjectList, Marquee, case-study/*
content/work/*.mdx      One file per case study (edit via /keystatic or by hand)
keystatic.config.tsx    Visual editor schema (fields + body blocks)
lib/                    site.ts, work.ts (reads studies), color.ts, image.ts
styles/                 tokens.css (design tokens), fonts.css, globals.css
public/uploads/<slug>/  Case-study images — the folder Keystatic manages
public/fonts/           PPM + PPE font files (you supply — see styles/fonts.css)
docs/                   case-study-template.mdx (manual authoring reference)
```

## Editing the site

- **Design system** — everything visual (color, type scale, spacing, buttons) is
  a CSS variable in [`styles/tokens.css`](styles/tokens.css). Change a value and
  it updates site-wide. View the catalog at **/systems**.
- **Nav / footer / contact** — [`lib/site.ts`](lib/site.ts).
- **Add a case study** — see "Add or edit a case study" above.
- **Coming soon** — set `comingSoon: true` in a study's frontmatter to list it
  without a link.

## Images

Case-study images live in **`public/uploads/<slug>/`**. `next/image`'s optimizer
is on, so sources can be full-resolution — they're resized and served as WebP
automatically. `<Figure>` reads each image's dimensions from the file, so you
never pass `width`/`height`.

⚠️ **`public/uploads/` belongs to Keystatic.** On save it deletes anything in
there it didn't write, so don't hand-place files you care about in that folder —
add them through the editor, or drop them in and reference them before saving.
Assets anywhere else (including `public/work/`) are never touched.

If you ever switch to a pure static export (where the optimizer isn't
available), set `images.unoptimized: true` in `next.config.mjs` and run
`npm run optimize:images` to pre-generate capped-width WebP.

## Fonts

`PPM` (body) / `PPE` (display) are Pangram Pangram fonts. Add the licensed web
files to `public/fonts/` per [`styles/fonts.css`](styles/fonts.css); fallbacks
render until then.

## Figma

See [`FIGMA.md`](FIGMA.md) for connecting your Figma file via the Figma MCP.
