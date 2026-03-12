import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface MediaDetailsErrorStateProps {
  error: unknown;
  defaultMessage: string;
}

export function MediaDetailsErrorState({
  error,
  defaultMessage,
}: MediaDetailsErrorStateProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-950">
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
        Erreur
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        {error instanceof Error ? error.message : defaultMessage}
      </p>
      <Link
        href="/"
        className="flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>
    </div>
  );
}
