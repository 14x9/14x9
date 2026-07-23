# Referencing your Figma file with the Figma MCP

You can have Claude Code pull layouts, measurements, and tokens straight from
your Figma file. There are two ways to connect; pick one.

## Option A — Figma Desktop "Dev Mode MCP server" (recommended)

Runs locally from the Figma desktop app. No account OAuth needed.

1. Open the **Figma desktop app** (not the browser) and open your file.
2. Menu → **Preferences** → enable **Enable Dev Mode MCP server**. You should see
   a confirmation that the server is running locally (default `http://127.0.0.1:3845`).
3. Make sure the same MCP server is registered for Claude Code. In an
   **interactive** `claude` terminal session run `/mcp` and confirm a Figma
   server is connected (or add one pointing at the local Dev Mode server).

## Option B — Figma connector (OAuth)

The `figma` connector is already installed in this workspace but **not
authorized**. Authorizing needs an interactive session (the OAuth browser flow
can't run in an automated/non-interactive one).

- In an **interactive** `claude` terminal: run `/mcp`, pick the Figma server, and
  complete the browser sign-in.
- Or, on claude.ai: **Settings → Connectors** → authorize Figma.

Once authorized it stays connected for future sessions.

## Using it once connected

1. In Figma, select the **frame / component / section** you want to build.
2. Copy its link: right-click → **Copy link to selection** (or grab the node URL).
3. In Claude Code, paste it with a request, e.g.:
   > Implement this Figma frame as the Hark case study hero: <paste link>
4. Claude loads the `figma-design-to-code` workflow and calls `get_design_context`
   on that node to read layout, spacing, colors, and variables, then writes the
   code into this project.

### Mapping Figma into this project

- **Tokens / variables** → reconcile with `styles/tokens.css`. If Figma has color
  or type variables, ask Claude to map them onto the existing token names so the
  system stays the single source of truth.
- **Case-study screens** → become `<Figure>` / `<Video>` / `<MediaGrid>` blocks in
  a `content/work/<slug>.mdx` file (see `_template.mdx`).
- **Assets (the actual bitmaps/video)** → Figma MCP gives structure and specs, not
  final image files. Export images/gifs/video from Figma (or reuse your Webflow
  exports) into `public/work/<slug>/` and reference them by path in the MDX.

### Fonts

`PPM` (body) and `PPE` (display, "PP Editorial New") are **Pangram Pangram**
fonts and are licensed separately from Figma. Put the licensed web files in
`public/fonts/` using the names listed in `styles/fonts.css`. Until they're
present the site renders with Helvetica/Times fallbacks.
