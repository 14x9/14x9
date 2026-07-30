import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "14x9 Inc. Design",
    short_name: "Studio of designer Naïm Sheriff.",
    description: "The studio of designer Naïm Sheriff. Based in Brooklyn, NY",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#FF4400",
    icons: [
      {
        src: "/assets/14x9-app-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/14x9_favicon64.png",
        sizes: "64x64",
        type: "image/png",
      },
      {
        src: "/assets/14x9_favicon32.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
  };
}
