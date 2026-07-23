import type { Metadata } from "next";
import "@/styles/globals.css";
import Chrome from "@/components/Chrome";

export const metadata: Metadata = {
  title: {
    default: "14x9 — Web Design Studio",
    template: "%s | 14x9",
  },
  description:
    "The studio of designer Naïm Sheriff. Based in Brooklyn, NY — helping brands create beautiful experiences for apps and web.",
  metadataBase: new URL("https://14x9.com"),
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
