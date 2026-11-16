# « Ce soir ? » — jouer sans compte

Complète `2026-11-15-ce-soir-design.md` et
`2026-11-15-ce-soir-ajustements-design.md` ; ce document l'emporte en cas de
conflit.

Date : 2026-11-16
Statut : approuvé (2026-11-16)

## Intention

« Ce soir ? » est visible dans le header et le menu sans être connecté. Si on
l'affiche, on doit pouvoir y jouer sans compte : un visiteur non connecté joue
sous un pseudo, comme les invités qui rejoignent déjà par code.

## Aujourd'hui

- Rejoindre par code avec un pseudo marche déjà sans compte.
- « Héberger » (multi) et « Jouer seul » exigent un compte :
  `POST /api/movie-night` et `POST /api/movie-night/solo` répondent
  `unauthorized`, et le panneau « Héberger » n'affiche que « Connectez-vous
  pour héberger ».

## Objectifs

- Un visiteur sans compte peut jouer seul.
- Un visiteur sans compte peut héberger une partie à plusieurs, sous un pseudo,
  avec les mêmes droits que tout hôte.
- Un compte connecté peut rejoindre par code une partie hébergée par un invité.

## Non-objectifs

- Rattacher une partie jouée sans compte à un compte créé ensuite.
- Limitation de débit sur la création de parties (voir Contraintes).
- Changer quoi que ce soit au parcours d'un compte connecté.

## Anti-objectifs

- Obliger à créer un compte TMDB pour jouer, seul ou à plusieurs.
- Un formulaire « Héberger » qui propose sans compte des réglages qui ne
  peuvent rien faire (inviter un ami, exclure les films déjà vus).

## Contraintes

- `MovieNight.hostId` est une clé obligatoire vers `User` : elle devient
  optionnelle. Le schéma s'applique par `pnpm db:push` (pas de dossier de
  migrations), **à lancer sur la base de production avant le déploiement**.
- Risque accepté par Paul : n'importe qui peut créer des parties en base. Les
  routes TMDB (`/api/discover`, `/api/search`) sont déjà publiques, et les
  parties expirées sont supprimées à chaque création.
- Un seul cookie invité par navigateur (`movie_night_guest`) : héberger sans
  compte le pose, comme rejoindre ; rejoindre ou héberger une autre partie le
  remplace (comportement déjà accepté pour les invités).

## Approches

Une seule voie sensée : **l'hôte sans compte est un participant invité, marqué
hôte**, identifié par le cookie invité existant. Toute l'autorisation passe déjà
par le participant courant (`resolveMovieNightParticipant`) et `isHost`, pas par
le compte : lancer, trancher, retirer et quitter marchent donc sans changement.

Écartées :

- Créer un compte « fantôme » pour l'hôte sans compte : pollue la table `User`
  et le reste de l'app (profil, amis) pour rien.
- Bloquer l'hébergement et cacher « Ce soir ? » aux visiteurs : contraire à la
  demande.

## Comportement

### Héberger sans compte

- Le panneau « Héberger » affiche le formulaire de configuration au lieu du lien
  « Connectez-vous pour héberger ».
- Sans compte, le formulaire :
  - ajoute un champ **« Pseudo »** (mêmes règles que pour rejoindre : 1 à 20
    caractères après trim), obligatoire pour « Jouer à plusieurs », absent ou
    ignoré pour « Jouer seul » ;
  - masque l'interrupteur **« Inclure les films déjà vus »** (aucune donnée de
    films vus sans compte ; la valeur envoyée est `false`, sans effet) ;
  - pré-coche les plateformes depuis le **navigateur** (`localStorage`) et les y
    mémorise à chaque partie *(choix Claude)*, au lieu du compte. Lecture et
    écriture protégées par try/catch : sans stockage, rien n'est pré-coché.

### Multi hébergé par un invité

- `POST /api/movie-night` accepte un visiteur sans compte avec
  `{ providerIds, genreIds, includeSeen?, guestName }`. Il crée la partie avec
  `hostId = null` et un participant `{ guestName, guestTokenHash, isHost: true,
  status: "JOINED" }`, puis pose le cookie invité (même jeton et même
  expiration que pour rejoindre). Pseudo absent ou invalide → `invalid_input`.
- Connecté, la route ne change pas (le `guestName` éventuel est ignoré).
- En salle d'attente, un hôte invité ne voit pas **« Inviter un ami »** : le
  code et le lien de partage suffisent.
- Tout le reste est inchangé : lancer, « Paul décide… » (avec le pseudo),
  retirer, quitter (fin de partie), inactivité, expiration à 6 h.
- Les films déjà vus des participants connectés restent exclus au lancement,
  même si l'hôte est un invité (sauf « Inclure les films déjà vus » : invisible
  pour l'hôte invité, donc toujours désactivé).

### Solo sans compte

- `POST /api/movie-night/solo` accepte un visiteur sans compte : il construit la
  pile sans mémoriser les plateformes ni exclure de films vus (seuls
  `excludedMovieIds` s'appliquent). Rien n'est écrit en base.
- La partie se joue ensuite dans le navigateur comme aujourd'hui (`/ce-soir/solo`).

### Invitations

- `listPendingInvites` lit le nom et l'avatar de l'hôte via `MovieNight.host`.
  Une invitation n'est possible que d'un hôte connecté, donc `host` est toujours
  présent pour elles ; le code doit quand même gérer `host` nul (nom de repli,
  par exemple le pseudo du participant hôte).

## Laissé au constructeur

- Où vit le pseudo dans le formulaire et la forme exacte du champ.
- La clé `localStorage` des plateformes.
- Le découpage entre `createMovieNight` (compte) et sa variante invitée, et la
  forme du résultat qui transporte le jeton invité jusqu'à la route.
- Tests : la logique pure qui change (validation du corps de création avec
  pseudo, lecture/écriture des plateformes mémorisées si elle est extraite).
