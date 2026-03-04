"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { AddFriendModal } from "./AddFriendModal";

export function AddFriendButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-amber-500 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/30"
      >
        <UserPlus className="h-4 w-4" />
        Ajouter un ami
      </button>
      <AddFriendModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
