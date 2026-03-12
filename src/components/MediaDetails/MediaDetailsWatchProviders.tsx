"use client";

import { Monitor } from "lucide-react";
import type { TWatchProviders } from "@/types/movie.type";
import { WatchProviderCard } from "@/features/MovieDetails/components/WatchProviderCard";

interface MediaDetailsWatchProvidersProps {
  watchProviders: TWatchProviders;
}

const PROVIDER_SECTIONS: {
  key: keyof Pick<TWatchProviders, "flatrate" | "rent" | "buy">;
  label: string;
}[] = [
  { key: "flatrate", label: "En streaming" },
  { key: "rent", label: "Location" },
  { key: "buy", label: "Achat" },
];

export function MediaDetailsWatchProviders({
  watchProviders,
}: MediaDetailsWatchProvidersProps) {
  const hasProviders =
    watchProviders.flatrate.length > 0 ||
    watchProviders.buy.length > 0 ||
    watchProviders.rent.length > 0;

  if (!hasProviders) return null;

  return (
    <div className="my-6">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        <Monitor className="h-5 w-5" />
        Où regarder
      </h2>
      <div className="space-y-4">
        {PROVIDER_SECTIONS.map(
          ({ key, label }) =>
            watchProviders[key].length > 0 && (
              <div key={key}>
                <p className="mb-2 text-sm text-zinc-500">{label}</p>
                <div className="flex flex-wrap gap-3">
                  {[...watchProviders[key]]
                    .sort(
                      (a, b) => a.display_priority - b.display_priority
                    )
                    .map((provider) => (
                      <WatchProviderCard
                        key={provider.provider_id}
                        provider={provider}
                        link={watchProviders.link}
                      />
                    ))}
                </div>
              </div>
            )
        )}
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        Données fournies par{" "}
        <a
          href="https://www.justwatch.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-zinc-400"
        >
          JustWatch
        </a>
      </p>
    </div>
  );
}
