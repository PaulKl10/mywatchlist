import { ArrowLeft } from "lucide-react";

interface MediaDetailsBackButtonProps {
  onBack: () => void;
}

export function MediaDetailsBackButton({ onBack }: MediaDetailsBackButtonProps) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="mb-6 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-100 backdrop-blur-xl transition-colors hover:text-zinc-100 dark:border-zinc-600 dark:hover:text-zinc-100"
    >
      <ArrowLeft className="h-4 w-4" />
      Retour
    </button>
  );
}
