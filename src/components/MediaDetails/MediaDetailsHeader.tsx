interface MediaDetailsHeaderProps {
  title: string;
  originalTitle?: string | null;
  metadata: React.ReactNode;
  genres: { id: number; name: string }[];
  tagline?: string | null;
}

export function MediaDetailsHeader({
  title,
  originalTitle,
  metadata,
  genres,
  tagline,
}: MediaDetailsHeaderProps) {
  return (
    <>
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 md:text-4xl">
        {title}
      </h1>
      {originalTitle && originalTitle !== title && (
        <p className="mt-1 text-zinc-400">{originalTitle}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-400">
        {metadata}
      </div>

      {genres.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {genres.map((genre) => (
            <span
              key={genre.id}
              className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300"
            >
              {genre.name}
            </span>
          ))}
        </div>
      )}

      {tagline && (
        <p className="mt-4 italic text-zinc-500 dark:text-zinc-400">
          {tagline}
        </p>
      )}
    </>
  );
}
