export function MediaDetailsLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="relative h-64 animate-pulse bg-zinc-800 md:h-96" />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:gap-8">
          <div className="aspect-2/3 w-full shrink-0 animate-pulse rounded-lg bg-zinc-800 md:w-64" />
          <div className="flex flex-1 flex-col gap-4">
            <div className="h-10 w-3/4 animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-1/4 animate-pulse rounded bg-zinc-800" />
            <div className="h-24 w-full animate-pulse rounded bg-zinc-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
