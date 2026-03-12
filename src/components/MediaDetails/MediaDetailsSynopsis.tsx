interface MediaDetailsSynopsisProps {
  overview: string | null | undefined;
}

export function MediaDetailsSynopsis({ overview }: MediaDetailsSynopsisProps) {
  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Synopsis
      </h2>
      <p className="mt-2 line-clamp-none text-justify text-zinc-400">
        {overview || "Aucune description disponible."}
      </p>
    </div>
  );
}
