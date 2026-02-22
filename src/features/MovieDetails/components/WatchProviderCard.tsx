import Image from "next/image";
import type { TWatchProvider } from "@/types/movie.type";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

interface WatchProviderCardProps {
  provider: TWatchProvider;
  link: string;
}

export function WatchProviderCard({ provider, link }: WatchProviderCardProps) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className=""
      title={provider.provider_name}
    >
      <Image
        src={
          provider.logo_path
            ? `${TMDB_IMAGE_BASE}/w92${provider.logo_path}`
            : "https://placehold.co/46x46/27272a/71717a?text=?"
        }
        alt={provider.provider_name}
        width={46}
        height={46}
        className="rounded object-contain"
      />
    </a>
  );
}
