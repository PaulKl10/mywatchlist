/** Informations légales affichées sur la page « À propos » (crédits, mentions légales, confidentialité). */

/** Contact (demandes RGPD, signalements) : pas d'adresse e-mail, les tickets GitHub du projet, publics. */
export const CONTACT_URL = "https://github.com/PaulKl10/mywatchlist/issues";

/** Éditeur non professionnel : pseudonyme seul (LCEN), identité communiquée à l'hébergeur. */
export const PUBLISHER = {
  pseudonym: "PaulKl10",
  url: "https://github.com/PaulKl10",
} as const;

/** Hébergeur du site (Vercel ne publie pas de numéro de téléphone). */
export const HOST = {
  name: "Vercel Inc.",
  address: "440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis",
  email: "privacy@vercel.com",
  url: "https://vercel.com",
} as const;

/** Date de dernière mise à jour des mentions légales et de la politique de confidentialité. */
export const LEGAL_LAST_UPDATED = "16 novembre 2026";

export const TMDB_URL = "https://www.themoviedb.org";
export const JUSTWATCH_URL = "https://www.justwatch.com";

/** Phrase exigée par les conditions d'utilisation de l'API TMDB : original anglais et traduction. */
export const TMDB_NOTICE_EN =
  "This product uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.";
export const TMDB_NOTICE =
  "Ce produit utilise TMDB et les API TMDB, mais n'est ni approuvé, ni certifié, ni autrement validé par TMDB.";

/** Ancres de la page /a-propos. */
export const ABOUT_PATH = "/a-propos";
export const ABOUT_ANCHORS = {
  credits: "credits",
  legalNotice: "mentions-legales",
  privacy: "confidentialite",
} as const;
