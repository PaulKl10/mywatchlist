import { prisma } from "@/lib/prisma";
import { ProfileUserScreen } from "@/screens/ProfileUserScreen";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tmdbId: string }>;
}) {
  const { tmdbId } = await params;
  const tmdbIdNum = parseInt(tmdbId, 10);
  if (Number.isNaN(tmdbIdNum)) {
    return { title: "Profil - My Watchlist" };
  }
  const user = await prisma.user.findUnique({
    where: { tmdb_id: tmdbIdNum },
  });
  const username = user?.username || `Profil ${tmdbId}`;
  return {
    title: `${username} - My Watchlist`,
    description: `Profil de ${username}`,
  };
}

export default function ProfileUserPage({
  params,
}: {
  params: Promise<{ tmdbId: string }>;
}) {
  return <ProfileUserScreen params={params} />;
}
