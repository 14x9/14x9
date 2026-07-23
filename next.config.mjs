/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Next's optimizer is ON: case-study images (including large originals
    // uploaded through Keystatic) are resized + re-encoded to modern formats
    // at serve time, so authors never hand-export WebP. Requires a Node host
    // (this site self-hosts via `next start`). GIFs and SVG logos are rendered
    // with plain <img> in the app, so they bypass the optimizer untouched.
    //
    // If you ever switch to a pure static export (`output: 'export'`), the
    // optimizer isn't available — set `unoptimized: true` here and run
    // `npm run optimize:images` to pre-generate WebP instead.
    formats: ["image/webp"],
  },
};

export default nextConfig;
