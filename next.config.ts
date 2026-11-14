import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Pas d'optimisation Vercel : le loader sert directement la bonne taille
    // depuis le CDN d'origine (TMDB, Gravatar, placehold.co).
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    // Largeurs du srcset = tailles proposées par TMDB (voir image-loader.ts).
    imageSizes: [92, 154, 185, 342],
    deviceSizes: [500, 780, 1280],
  },
};

export default nextConfig;
