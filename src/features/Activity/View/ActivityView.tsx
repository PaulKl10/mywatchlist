"use client";

import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { ActivityRow } from "../components/ActivityRow";
import { useFriendsActivityQuery } from "../hooks/useFriendsActivityQuery";

const messageClass = "rounded-lg border border-dashed border-zinc-300 px-6 py-12 text-center text-zinc-500 dark:border-zinc-700 dark:text-zinc-400";

export function ActivityView() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data, isPending, isError, refetch } = useFriendsActivityQuery(!!user);

  const renderContent = () => {
    if (isAuthLoading || (user && isPending)) {
      return (
        <ul className="flex flex-col gap-3" aria-busy="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="h-[90px] animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          ))}
        </ul>
      );
    }
    if (!user) {
      return (
        <div className={messageClass}>
          <p>Connecte-toi pour voir ce que regardent tes amis.</p>
          <Link href="/login" className="mt-3 inline-block font-medium text-amber-600 hover:text-amber-500">
            Connexion
          </Link>
        </div>
      );
    }
    if (isError || !data) {
      return (
        <p role="alert" className={messageClass}>
          Impossible de charger l&apos;activité.{" "}
          <button type="button" onClick={() => refetch()} className="underline">
            Réessayer
          </button>
        </p>
      );
    }
    if (!data.hasFriends) {
      return (
        <div className={messageClass}>
          <p>Ajoute des amis pour suivre ce qu&apos;ils notent et mettent dans leur watchlist.</p>
          <Link href="/profile" className="mt-3 inline-block font-medium text-amber-600 hover:text-amber-500">
            Ajouter des amis
          </Link>
        </div>
      );
    }
    if (data.items.length === 0) {
      return <p className={messageClass}>Rien de neuf chez tes amis ces 30 derniers jours.</p>;
    }
    const now = new Date();
    return (
      <ul className="flex flex-col gap-3">
        {data.items.map((item) => (
          <ActivityRow key={item.id} item={item} now={now} />
        ))}
      </ul>
    );
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Activité des amis</h1>
      {renderContent()}
    </div>
  );
}
