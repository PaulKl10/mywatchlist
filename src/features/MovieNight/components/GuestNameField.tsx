import { GUEST_NAME_MAX_LENGTH } from "@/lib/movie-night/constants";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 placeholder-zinc-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

interface GuestNameFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  hint?: string;
}

/** Champ « Pseudo » des participants sans compte (rejoindre, héberger). */
export function GuestNameField({ id, value, onChange, label = "Pseudo", hint }: GuestNameFieldProps) {
  const hintId = `${id}-hint`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={GUEST_NAME_MAX_LENGTH}
        autoComplete="nickname"
        placeholder="Votre pseudo"
        aria-describedby={hint ? hintId : undefined}
        className={inputClass}
      />
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {hint}
        </p>
      )}
    </div>
  );
}
