import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My Watchlist",
    short_name: "Watchlist",
    description: "Ma liste de films à regarder",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "fr-FR",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      {
        src: "/app192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/app512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

