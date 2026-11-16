import { Scale } from "lucide-react";
import {
  ABOUT_ANCHORS,
  CONTACT_URL,
  HOST,
  LEGAL_LAST_UPDATED,
  PUBLISHER,
  TMDB_URL,
} from "@/lib/legal";
import { ExternalLink, LegalSection, legalText } from "./LegalSection";

export function LegalNoticeSection() {
  return (
    <LegalSection
      id={ABOUT_ANCHORS.legalNotice}
      title="Mentions légales"
      icon={<Scale className="h-5 w-5" aria-hidden="true" />}
    >
      <h3 className={legalText.subheading}>Éditeur</h3>
      <p className={legalText.paragraph}>
        My Watchlist est un site personnel et non commercial, édité à titre non
        professionnel par <ExternalLink href={PUBLISHER.url}>{PUBLISHER.pseudonym}</ExternalLink>.
        Comme le permet la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie
        numérique (LCEN), l&apos;éditeur reste anonyme : son identité a été communiquée à
        l&apos;hébergeur.
      </p>
      <p className={legalText.paragraph}>
        Contact : <ExternalLink href={CONTACT_URL}>tickets GitHub du projet</ExternalLink>
      </p>

      <h3 className={legalText.subheading}>Hébergeur</h3>
      <address className={`not-italic ${legalText.paragraph}`}>
        <ExternalLink href={HOST.url}>{HOST.name}</ExternalLink>
        <br />
        {HOST.address}
        <br />
        <a href={`mailto:${HOST.email}`} className={legalText.link}>
          {HOST.email}
        </a>
      </address>

      <h3 className={legalText.subheading}>Contenus</h3>
      <p className={legalText.paragraph}>
        Les informations sur les films et séries, ainsi que les affiches et photos, viennent
        de <ExternalLink href={TMDB_URL}>TMDB</ExternalLink> et restent la propriété de leurs
        ayants droit. Les messages et pseudos saisis par les utilisateurs restent sous leur
        responsabilité. Pour signaler un contenu, ouvrez un ticket sur GitHub.
      </p>

      <p className="text-sm text-zinc-500">Dernière mise à jour : {LEGAL_LAST_UPDATED}</p>
    </LegalSection>
  );
}
