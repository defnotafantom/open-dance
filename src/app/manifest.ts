import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Open Dance",
    short_name: "Open Dance",
    description:
      "Gestione corsi, iscrizioni, pagamenti e comunicazioni della scuola di danza.",
    start_url: "/",
    display: "standalone",
    background_color: "#0d0d0d",
    theme_color: "#A11622",
    lang: "it",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
