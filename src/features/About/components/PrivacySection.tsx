import { ShieldCheck } from "lucide-react";
import { ABOUT_ANCHORS, CONTACT_EMAIL, LEGAL_LAST_UPDATED, PUBLISHER, TMDB_URL } from "@/lib/legal";
import { GUEST_COOKIE, SESSION_TTL_MS } from "@/lib/movie-night/constants";
import { REQUEST_TOKEN_COOKIE, SESSION_COOKIE } from "@/lib/constants";
import { ExternalLink, LegalSection, legalText } from "./LegalSection";

const MOVIE_NIGHT_TTL_HOURS = SESSION_TTL_MS / (60 * 60 * 1000);

type TItem = {
  label: string;
  detail: string;
  /** Libellé technique (nom de cookie), affiché en police à chasse fixe. */
  code?: boolean;
};

const COLLECTED_DATA: TItem[] = [
  {
    label: "Compte",
    detail:
      "à la connexion avec TMDB : identifiant TMDB, nom d'utilisateur, avatar (image TMDB ou empreinte Gravatar) et identifiant de session TMDB.",
  },
  {
    label: "Watchlist et notes",
    detail:
      "elles restent sur votre compte TMDB, que l'app lit et modifie pour vous. Une copie de votre watchlist (titre, affiche, date de sortie, note, résumé) est gardée pour l'afficher à vos amis.",
  },
  {
    label: "Amis et suggestions",
    detail:
      "demandes d'ami, liste d'amis, suggestions envoyées et reçues avec leur message éventuel.",
  },
  {
    label: "Temps de visionnage",
    detail: "films et séries que vous comptez comme vus, avec leur durée.",
  },
  {
    label: "« Ce soir ? »",
    detail:
      "participation aux soirées, votes, plateformes et genres choisis, pseudo des invités sans compte. Les dernières plateformes choisies sont gardées sur votre compte.",
  },
  {
    label: "Notifications push (si vous les activez)",
    detail:
      "adresse technique de l'appareil fournie par le navigateur et ses clés de chiffrement.",
  },
  {
    label: "Mesure d'audience et performances",
    detail:
      "Vercel Web Analytics et Speed Insights : statistiques globales (pages vues, pays, type d'appareil, temps de chargement), sans cookie.",
  },
  {
    label: "Journaux techniques",
    detail: "adresse IP et requêtes, gardées par l'hébergeur pour la sécurité du service.",
  },
];

const LEGAL_BASES: TItem[] = [
  {
    label: "Exécution du service que vous demandez",
    detail: "compte, watchlist, notes, amis, suggestions, temps de visionnage, « Ce soir ? ».",
  },
  {
    label: "Consentement",
    detail:
      "notifications push. Vous pouvez les désactiver à tout moment depuis votre profil ou les réglages du navigateur.",
  },
  {
    label: "Intérêt légitime",
    detail: "mesure d'audience, suivi des performances et sécurité du service.",
  },
];

const RETENTION: TItem[] = [
  { label: "Données du compte", detail: "jusqu'à la suppression du compte." },
  {
    label: "Session de connexion",
    detail: "30 jours au plus, supprimée à la déconnexion.",
  },
  {
    label: "Soirées « Ce soir ? »",
    detail: `elles expirent ${MOVIE_NIGHT_TTL_HOURS} heures après leur création, puis sont supprimées avec leurs votes et les pseudos des invités.`,
  },
  {
    label: "Abonnements aux notifications",
    detail:
      "jusqu'à leur désactivation, la déconnexion de l'appareil ou leur expiration signalée par le navigateur.",
  },
];

const RECIPIENTS: TItem[] = [
  {
    label: "Vercel Inc. (États-Unis)",
    detail: "hébergement du site, mesure d'audience et performances.",
  },
  {
    label: "Neon",
    detail: "base de données, hébergée dans l'Union européenne (Francfort, Allemagne).",
  },
  {
    label: "TMDB (États-Unis)",
    detail:
      "connexion, watchlist et notes. Votre compte TMDB est soumis à la politique de confidentialité de TMDB.",
  },
  {
    label: "Service de notification de votre navigateur",
    detail:
      "Google, Apple, Mozilla ou Microsoft selon le navigateur. Il achemine les notifications, dont le contenu est chiffré.",
  },
];

const STORAGE: TItem[] = [
  { label: SESSION_COOKIE, code: true, detail: "garde votre connexion, 30 jours." },
  { label: REQUEST_TOKEN_COOKIE, code: true, detail: "connexion en cours avec TMDB, 10 minutes." },
  {
    label: GUEST_COOKIE,
    code: true,
    detail: `identifie un invité sans compte dans une soirée, ${MOVIE_NIGHT_TTL_HOURS} heures au plus.`,
  },
  {
    label: "Stockage local du navigateur",
    detail:
      "filtres de la page Découvrir, dernières plateformes choisies, partie solo en cours. Ces données ne quittent pas votre appareil.",
  },
];

function ItemList({ items }: { items: TItem[] }) {
  return (
    <ul className={legalText.list}>
      {items.map(({ label, detail, code }) => (
        <li key={label}>
          {code ? (
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              {label}
            </code>
          ) : (
            <span className={legalText.strong}>{label}</span>
          )}{" "}
          : {detail}
        </li>
      ))}
    </ul>
  );
}

export function PrivacySection() {
  const mailto = (
    <a href={`mailto:${CONTACT_EMAIL}`} className={legalText.link}>
      {CONTACT_EMAIL}
    </a>
  );

  return (
    <LegalSection
      id={ABOUT_ANCHORS.privacy}
      title="Politique de confidentialité"
      icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
    >
      <p className={legalText.paragraph}>
        Le responsable du traitement est l&apos;éditeur du site,{" "}
        <ExternalLink href={PUBLISHER.url}>{PUBLISHER.pseudonym}</ExternalLink>, joignable à{" "}
        {mailto}. Vos données ne sont ni vendues, ni utilisées pour de la publicité ou du
        profilage.
      </p>

      <h3 className={legalText.subheading}>Données traitées</h3>
      <ItemList items={COLLECTED_DATA} />

      <h3 className={legalText.subheading}>Qui voit quoi</h3>
      <ul className={legalText.list}>
        <li>
          Les autres utilisateurs connectés peuvent vous trouver par votre nom ou votre ID TMDB
          et voir votre nom et votre avatar.
        </li>
        <li>Votre watchlist et votre temps de visionnage ne sont visibles que par vos amis.</li>
        <li>Les participants d&apos;une soirée « Ce soir ? » voient les autres participants.</li>
      </ul>

      <h3 className={legalText.subheading}>Bases légales (article 6 du RGPD)</h3>
      <ItemList items={LEGAL_BASES} />

      <h3 className={legalText.subheading}>Durées de conservation</h3>
      <ItemList items={RETENTION} />

      <h3 className={legalText.subheading}>Destinataires et sous-traitants</h3>
      <ItemList items={RECIPIENTS} />
      <p className={legalText.paragraph}>
        Vercel et TMDB sont situés aux États-Unis. Vercel adhère au Data Privacy Framework
        UE–États-Unis, reconnu par la Commission européenne.
      </p>

      <h3 className={legalText.subheading}>Cookies et stockage local</h3>
      <p className={legalText.paragraph}>
        Le site n&apos;utilise que des cookies et un stockage strictement nécessaires à son
        fonctionnement. Ils ne demandent donc pas votre consentement. Aucun cookie publicitaire
        ni de mesure d&apos;audience n&apos;est déposé.
      </p>
      <ItemList items={STORAGE} />

      <h3 className={legalText.subheading}>Vos droits</h3>
      <p className={legalText.paragraph}>
        Vous pouvez accéder à vos données, les rectifier, les effacer, en limiter
        l&apos;utilisation, vous y opposer ou les récupérer. Votre nom et votre avatar se
        modifient sur <ExternalLink href={TMDB_URL}>TMDB</ExternalLink> et sont mis à jour à
        votre prochaine connexion.
      </p>
      <p className={legalText.paragraph}>
        Pour tout effacer, utilisez{" "}
        <span className={legalText.strong}>« Supprimer mon compte »</span> en bas de votre
        profil. Pour toute autre demande, écrivez à {mailto}. Vous pouvez aussi adresser une
        réclamation à la <ExternalLink href="https://www.cnil.fr">CNIL</ExternalLink>.
      </p>

      <p className="text-sm text-zinc-500">Dernière mise à jour : {LEGAL_LAST_UPDATED}</p>
    </LegalSection>
  );
}
