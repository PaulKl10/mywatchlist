"use client";

import Image from "next/image";
import { TMDB_IMAGE_BASE } from "@/lib/constants";
import { MediaDetailsBackButton } from "./MediaDetailsBackButton";

interface MediaDetailsLayoutProps {
  backdropPath: string | null;
  posterPath: string | null;
  posterAlt: string;
  onBack: () => void;
  children: React.ReactNode;
}

export function MediaDetailsLayout({
  backdropPath,
  posterPath,
  posterAlt,
  onBack,
  children,
}: MediaDetailsLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="relative h-64 md:h-[700px]">
        <Image
          src={
            backdropPath
              ? `${TMDB_IMAGE_BASE}/w1280${backdropPath}`
              : "https://placehold.co/1920x1080/1f2937/9ca3af.png?text=No+Backdrop"
          }
          alt={posterAlt}
          fill
          className="object-cover object-top"
          sizes="100vw"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 via-zinc-50/60 to-transparent dark:from-zinc-950 dark:via-zinc-950/60 dark:to-transparent" />
      </div>

      <div className="relative z-50 -mt-64 mx-auto max-w-[80%] py-8 md:pr-6 md:py-0">
        <MediaDetailsBackButton onBack={onBack} />

        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
          <div className="relative aspect-2/3 w-full shrink-0 overflow-hidden rounded-lg md:w-1/3">
            <Image
              src={
                posterPath
                  ? `${TMDB_IMAGE_BASE}/w500${posterPath}`
                  : "https://placehold.co/500x750/1f2937/9ca3af.png?text=No+Poster"
              }
              alt={posterAlt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 80vw, 27vw"
              loading="eager"
            />
          </div>

          <div className="flex flex-1 flex-col">{children}</div>
        </div>
      </div>
    </div>
  );
}
