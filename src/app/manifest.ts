import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Open Dance",
    short_name: "Open Dance",
    description:
      "Gestione corsi, iscrizioni, pagamenti e comunicazioni della scuola di danza.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3a1216",
    lang: "it",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
