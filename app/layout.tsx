import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import Chrome from "@/components/Chrome";

// Draw edge-to-edge into the display's safe areas (notch / status bar / home
// indicator). This is what makes env(safe-area-inset-*) report real values, so
// the sticky nav's frosted blur can extend up under the status bar to the very
// top edge instead of leaving a sharp strip of scrolling content above it.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "14x9 — Web Design Studio",
    template: "%s | 14x9",
  },
  description:
    "The studio of designer Naïm Sheriff. Based in Brooklyn, NY — helping brands create beautiful experiences for apps and web.",
  metadataBase: new URL("https://14x9.com"),
  icons: {
    icon: [
      { url: "/assets/14x9_favicon16.png", sizes: "16x16", type: "image/png" },
      { url: "/assets/14x9_favicon32.png", sizes: "32x32", type: "image/png" },
      { url: "/assets/14x9_favicon48.png", sizes: "48x48", type: "image/png" },
      { url: "/assets/14x9_favicon64.png", sizes: "64x64", type: "image/png" },
    ],
    apple: { url: "/assets/14x9-app-icon.png", sizes: "180x180", type: "image/png" },
  },
  openGraph: {
    title: "14x9 — Web Design Studio",
    description:
      "The studio of designer Naïm Sheriff. Based in Brooklyn, NY — helping brands create beautiful experiences for apps and web.",
    url: "https://14x9.com",
    siteName: "14x9",
    type: "website",
    images: [
      { url: "/assets/14x9%20share.jpg", width: 1200, height: 630, alt: "14x9" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "14x9 — Web Design Studio",
    description:
      "The studio of designer Naïm Sheriff. Based in Brooklyn, NY — helping brands create beautiful experiences for apps and web.",
    images: ["/assets/14x9%20share.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Chrome>{children}</Chrome>
      </body>
    </html>
  );
}
