import { config, collection, fields } from "@keystatic/core";
import { block, wrapper, repeating } from "@keystatic/core/content-components";
import { ImagePreview, VideoPreview } from "@/components/keystatic/BlockPreview";

/**
 * Keystatic — the visual editor for case studies.
 *
 * Run `npm run dev` and open http://localhost:3000/keystatic. Changes are
 * written straight to `content/work/*.mdx` and images under
 * `public/uploads/<slug>/`; commit them with git as usual. Storage is `local`,
 * so everything happens on your machine.
 *
 * ── IMPORTANT: why images live in public/uploads, not public/work ──
 * On save Keystatic computes `filesToDelete = (files it loaded for this entry)
 * − (files it writes back)` and hard-deletes the difference. In other words it
 * treats its configured image `directory` as exclusively its own and garbage-
 * collects anything in there it doesn't know about.
 *
 * Pointing it at `public/work` (shared by every study, and full of unreferenced
 * original exports) therefore destroyed assets. `public/uploads` is a folder
 * Keystatic alone owns, so its clean-up can never reach hand-placed files.
 * Do NOT point this at a directory that holds anything Keystatic didn't write.
 */
const imageStore = { directory: "public/uploads", publicPath: "/uploads" };

export default config({
  storage: { kind: "local" },
  ui: {
    brand: { name: "14x9" },
    navigation: { Work: ["work"] },
  },
  collections: {
    work: collection({
      label: "Case studies",
      slugField: "title",
      path: "content/work/*",
      format: { contentField: "content" },
      entryLayout: "content",
      columns: ["title", "category"],
      schema: {
        // --- Hero + header ---
        title: fields.slug({
          name: { label: "Title", description: "Shows as the big masthead title." },
        }),
        category: fields.text({
          label: "Project type",
          description: 'Shown under the title, e.g. "Store Design — Apparel".',
        }),
        role: fields.text({
          label: "Sub-title / role",
          description: 'e.g. "UX & UI Design". Optional.',
        }),
        summary: fields.text({
          label: "Description",
          multiline: true,
          description: "One or two sentences. Optional.",
        }),
        liveUrl: fields.url({
          label: "Live link",
          description: 'Optional — adds a "See it live" button.',
        }),
        heroColor: fields.text({
          label: "Hero colour",
          description:
            "Hex fill behind the title, e.g. #443530. Text auto-switches light/dark for contrast.",
        }),
        hero: fields.image({ label: "Hero image", ...imageStore }),

        // --- Homepage work-grid thumbnail ---
        thumb: fields.image({ label: "Grid thumbnail", ...imageStore }),
        orientation: fields.select({
          label: "Thumbnail orientation",
          options: [
            { label: "Landscape", value: "landscape" },
            { label: "Portrait", value: "portrait" },
          ],
          defaultValue: "landscape",
        }),
        span: fields.integer({
          label: "Grid span (1–3)",
          description: "How many columns the thumbnail occupies. 3 = full width.",
          defaultValue: 2,
          validation: { min: 1, max: 3 },
        }),
        order: fields.integer({
          label: "Sort order",
          description: "Lower shows earlier in the work list.",
          defaultValue: 99,
        }),
        comingSoon: fields.checkbox({
          label: "Coming soon (listed but not clickable)",
          defaultValue: false,
        }),

        // --- Body: blocks in any order, any amount ---
        content: fields.mdx({
          label: "Case study body",
          // Images come from the styled blocks below, not raw markdown images.
          options: { image: false },
          components: {
            Section: wrapper({
              label: "Text (eyebrow + paragraph)",
              schema: {
                title: fields.text({ label: "Eyebrow / heading" }),
              },
            }),
            Figure: block({
              label: "1-up image",
              schema: {
                src: fields.image({ label: "Image", ...imageStore }),
                alt: fields.text({ label: "Alt text (accessibility)" }),
                caption: fields.text({ label: "Caption (optional)" }),
                bleed: fields.checkbox({
                  label: "Full-bleed (edge to edge)",
                  defaultValue: false,
                }),
              },
              ContentView: ({ value }) => (
                <ImagePreview
                  image={value.src}
                  alt={value.alt}
                  caption={value.caption}
                />
              ),
            }),
            MediaGrid: wrapper({
              label: "Image grid (2-up / 3-up)",
              description: "Insert 1-up images inside to place them side by side.",
              schema: {
                columns: fields.integer({
                  label: "Columns (2 or 3)",
                  defaultValue: 2,
                  validation: { min: 2, max: 3 },
                }),
              },
            }),
            Video: block({
              label: "Video",
              schema: {
                src: fields.file({
                  label: "Video file (mp4)",
                  description: "Use this OR a Vimeo ID below.",
                  ...imageStore,
                }),
                vimeo: fields.text({ label: "Vimeo ID (instead of a file)" }),
                poster: fields.image({ label: "Poster still", ...imageStore }),
                aspect: fields.text({
                  label: "Aspect ratio (optional)",
                  description: 'e.g. "16 / 9". Reserves space so nothing jumps.',
                }),
                sound: fields.checkbox({
                  label: "Has sound (show controls)",
                  defaultValue: false,
                }),
                caption: fields.text({ label: "Caption (optional)" }),
              },
              ContentView: ({ value }) => (
                <VideoPreview
                  poster={value.poster}
                  vimeo={value.vimeo}
                  file={value.src}
                  caption={value.caption}
                />
              ),
            }),
            Quote: wrapper({
              label: "Pull quote",
              schema: {
                cite: fields.text({ label: "Attribution (optional)" }),
              },
            }),
            Carousel: repeating({
              label: "Carousel",
              description: "A swipeable image slider. Add slides inside.",
              children: ["CarouselItem"],
              schema: {},
            }),
            CarouselItem: block({
              label: "Slide",
              forSpecificLocations: true,
              schema: {
                src: fields.image({ label: "Image", ...imageStore }),
                alt: fields.text({ label: "Alt text (accessibility)" }),
              },
              ContentView: ({ value }) => (
                <ImagePreview image={value.src} alt={value.alt} />
              ),
            }),
          },
        }),
      },
    }),
  },
});
