"use client";

import Image from "next/image";
import { ProfileWatchlistCard } from "./ProfileWatchlistCard";
import { TMDB_IMAGE_BASE } from "@/lib/constants";
import type { TAvailableWatchlistItem } from "@/types/watchlist.type";

interface AvailableWatchlistGridProps {
  items: TAvailableWatchlistItem[];
  className: string;
}

/** Médias dispo sur mes plateformes, avec le logo de la plateforme qui les propose. */
export function AvailableWatchlistGrid({ items, className }: AvailableWatchlistGridProps) {
  return (
    <div className={className}>
      {items.map((item) => (
        <div key={`${item.media_type}-${item.id}`} className="relative">
          <ProfileWatchlistCard item={item} />
          {item.provider.logoPath && (
            <Image
              src={`${TMDB_IMAGE_BASE}/w92${item.provider.logoPath}`}
              alt={item.provider.name}
              title={item.provider.name}
              width={32}
              height={32}
              sizes="32px"
              className="pointer-events-none absolute left-2 top-2 h-8 w-8 rounded-md shadow-md"
            />
          )}
        </div>
      ))}
    </div>
  );
}
