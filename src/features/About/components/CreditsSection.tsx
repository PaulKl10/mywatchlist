import Image from "next/image";
import { Info } from "lucide-react";
import {
  ABOUT_ANCHORS,
  JUSTWATCH_URL,
  PUBLISHER,
  TMDB_NOTICE,
  TMDB_NOTICE_EN,
  TMDB_URL,
} from "@/lib/legal";
import { ExternalLink, LegalSection, legalText } from "./LegalSection";

export function CreditsSection() {
  return (
    <LegalSection
      id={ABOUT_ANCHORS.credits}
      title="À propos et crédits"
      icon={<Info className="h-5 w-5" aria-hidden="true" />}
    >
      <p className={legalText.paragraph}>
        My Watchlist est un projet personnel, gratuit et sans publicité, pour gérer sa
        watchlist, noter des films et séries, partager des suggestions entre amis et choisir
        un film à plusieurs avec « Ce soir ? ». Le code est sur{" "}
        <ExternalLink href={PUBLISHER.url}>GitHub</ExternalLink>.
      </p>

      <h3 className={legalText.subheading}>The Movie Database (TMDB)</h3>
      <a
        href={TMDB_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="The Movie Database (TMDB)"
        className="self-start"
      >
        <Image src="/tmdb-logo.svg" alt="TMDB" width={154} height={20} unoptimized />
      </a>
      <p className={legalText.paragraph}>
        La connexion, les fiches des films et séries, les affiches, les watchlists et les
        notes viennent de <ExternalLink href={TMDB_URL}>The Movie Database (TMDB)</ExternalLink>.
      </p>
      <p className={legalText.paragraph}>{TMDB_NOTICE}</p>
      <p lang="en" className="text-sm italic text-zinc-500">
        {TMDB_NOTICE_EN}
      </p>

      <h3 className={legalText.subheading}>JustWatch</h3>
      <p className={legalText.paragraph}>
        Les plateformes de streaming (« Où regarder » sur les fiches, plateformes de « Ce
        soir ? ») sont fournies par <ExternalLink href={JUSTWATCH_URL}>JustWatch</ExternalLink>,
        via TMDB.
      </p>
    </LegalSection>
  );
}
