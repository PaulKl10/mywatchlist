"use client";

import { useId } from "react";

interface SettingSwitchProps {
  label: string;
  /** Précision affichée sous le libellé. */
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** Interrupteur on/off d'un réglage de « Ce soir ? ». */
export function SettingSwitch({ label, description, checked, onChange }: SettingSwitchProps) {
  const labelId = useId();
  const descriptionId = useId();

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-col">
        <span id={labelId} className="text-sm text-zinc-700 dark:text-zinc-300">
          {label}
        </span>
        {description && (
          <span id={descriptionId} className="text-xs text-zinc-500 dark:text-zinc-400">
            {description}
          </span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-amber-500" : "bg-zinc-300 dark:bg-zinc-700"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}
