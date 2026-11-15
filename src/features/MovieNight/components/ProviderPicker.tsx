"use client";

import { useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { TMDB_IMAGE_BASE } from "@/lib/constants";
import type { TStreamingProvider } from "@/lib/movie-night/types";

interface ProviderPickerProps {
  providers: TStreamingProvider[];
  selected: number[];
  onChange: (ids: number[]) => void;
}

const COLLAPSED_COUNT = 12;

export function ProviderPicker({ providers, selected, onChange }: ProviderPickerProps) {
  const [expanded, setExpanded] = useState(false);
  const top = providers.slice(0, COLLAPSED_COUNT);
  const extraSelected = providers
    .slice(COLLAPSED_COUNT)
    .filter((p) => selected.includes(p.id));
  const visible = expanded ? providers : [...top, ...extraSelected];
  const toggle = (id: number) =>
    onChange(selected.includes(id) ? selected.filter((p) => p !== id) : [...selected, id]);

  return (
    <div>
    <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
      {visible.map((provider) => {
        const active = selected.includes(provider.id);
        return (
          <li key={provider.id}>
            <button
              type="button"
              aria-pressed={active}
              aria-label={provider.name}
              title={provider.name}
              onClick={() => toggle(provider.id)}
              className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border-2 transition-all ${
                active
                  ? "border-amber-500"
                  : "border-transparent opacity-50 hover:opacity-100"
              }`}
            >
              {provider.logoPath ? (
                <Image
                  src={`${TMDB_IMAGE_BASE}/w92${provider.logoPath}`}
                  alt=""
                  width={92}
                  height={92}
                  sizes="92px"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="px-1 text-center text-xs text-zinc-700 dark:text-zinc-300">
                  {provider.name}
                </span>
              )}
              {active && (
                <span className="absolute right-0.5 top-0.5 rounded-full bg-amber-500 p-0.5 text-zinc-900">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
    {providers.length > COLLAPSED_COUNT && (
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 text-sm font-medium text-amber-600 underline underline-offset-2 hover:text-amber-500 dark:text-amber-500"
      >
        {expanded ? "Voir moins" : `Voir toutes les plateformes (${providers.length})`}
      </button>
    )}
    </div>
  );
}
