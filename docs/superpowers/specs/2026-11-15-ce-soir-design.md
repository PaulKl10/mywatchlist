# « Ce soir ? » — choisir un film en swipant, seul ou à plusieurs

> **Ajustements (2026-11-15)** : pile fixe de 15, choix « Héberger / Rejoindre » avant les formulaires, solo joué dans le navigateur. Voir `2026-11-15-ce-soir-ajustements-design.md`, qui l'emporte en cas de conflit.

Date : 2026-11-15
Statut : approuvé (2026-11-15)

## Intention

Répondre à « on regarde quoi ce soir ? » sans débat sans fin. On choisit les
plateformes auxquelles on est abonné et les genres qui nous tentent, puis on
swipe une pile de films à la Tinder : droite = oui, gauche = non. Seul, le
premier « oui » donne le film. À plusieurs (jusqu'à 4, chacun sur son
téléphone), le film choisi est le premier sur lequel **tout le monde** a dit
oui : c'est le « match ». Un match met la sélection en pause pour tout le
monde, et le chef du groupe décide si on s'arrête sur ce film ou si on
continue à swiper.

## Objectifs

- Se mettre d'accord sur un film en quelques minutes, à 1 à 4 personnes.
- Ne proposer que des films réellement disponibles ce soir sur les
  abonnements choisis.
- Laisser jouer un ami sans compte : un code et un pseudo suffisent.
- Un match s'affiche sur tous les téléphones en 2 secondes au plus.

## Non-objectifs (v1)

- Séries (films uniquement).
- Annuler un swipe.
- Chat, réactions, notifications push.
- Historique des sessions passées.
- Autre pays que la France pour les plateformes.
- Service temps réel externe (voir Approches).

## Anti-objectifs (ce qui ferait échouer la fonctionnalité même si elle « marche »)

- Dévoiler les votes des autres avant un match : les votes restent secrets.
  Seuls les matchs, puis le podium en fin de pile, sont partagés.
- Obliger un invité à créer un compte TMDB pour voter.
- Proposer un film à louer ou à acheter : « disponible » veut dire inclus
  dans un abonnement.
- Une session qui tombe en panne sans prévenir : pas de dépendance qui peut
  être mise en pause ou expirer d'elle-même.

## Contraintes

- Stack existante : Next.js 16.4 (App Router), React 19.3, TanStack Query 5,
  Tailwind CSS 4, Prisma 7 sur Postgres Neon, déploiement serverless Vercel.
  Lire `AGENTS.md` et la doc embarquée dans `node_modules/next/dist/docs/`
  avant d'écrire du code Next.
- Schéma Prisma appliqué par `pnpm db:push` (le projet n'a pas de dossier de
  migrations).
- Authentification existante : cookie httpOnly `tmdb_session_id`, résolu par
  `getCurrentSession()` (`src/lib/server/services/session.service.ts`).
- Les appels TMDB passent par `tmdbClient` côté serveur (clé jamais exposée).
  `/api/discover` accepte déjà `with_watch_providers`, `watch_region`,
  `with_watch_monetization_types` et `with_genres`.
- Amis : table `Friendship` (statut `ACCEPTED`), `getFriends(userId)` dans
  `friends.service.ts`.
- Notifications : `/api/notifications/count` alimente le badge du header
  (rafraîchi au retour sur l'onglet, `staleTime` d'une minute).
- Interface en français, mobile d'abord, mêmes conventions visuelles que
  l'app (zinc, accent ambre, mode sombre).

## Approches

La seule vraie question d'architecture était la synchronisation entre les
téléphones (salle d'attente, progression, apparition du match).

1. **Polling (retenu).** L'état de la session vit en base. Chaque téléphone
   le relit toutes les 2 s via `refetchInterval` de TanStack Query,
   uniquement sur les écrans salle d'attente et swipe, et seulement quand
   l'onglet est visible. Un vote est un POST, et le match est vérifié côté
   serveur au moment du vote : le dernier votant le voit tout de suite, les
   autres au prochain rafraîchissement. Aucune nouvelle dépendance. Coût :
   environ 2 requêtes/s pour une session à 4, négligeable.
2. **Supabase Realtime (écarté).** Gratuit et instantané, mais la base est
   sur Neon : il faudrait un projet Supabase dédié au transport de messages
   (canaux publics par défaut), et un projet gratuit est mis en pause après
   environ 7 jours d'inactivité, ce qui casserait la fonctionnalité sans
   prévenir pour un usage occasionnel.
3. **WebSocket / SSE depuis Next (écarté).** Les fonctions Vercel ne gardent
   pas de WebSocket ouverte. Les connexions SSE sont limitées en durée, et
   les instances ne partagent pas de mémoire : il faudrait de toute façon
   relire la base derrière.

Choix de Paul : polling. La synchronisation est isolée dans un seul hook
client, pour pouvoir changer de transport plus tard sans toucher au reste.

## Décisions de Paul

- Chacun joue sur son propre téléphone.
- On rejoint une session par **invitation d'un ami** ou par **code**.
- Le code est ouvert aux **invités sans compte**, qui choisissent un pseudo.
- **L'hôte choisit pour tout le monde** les plateformes et les genres.
- Une pile fait **10 à 20 films**.
- **Match** : seul, le premier oui ; à plusieurs, un film qui a le oui de
  **tous** les participants (actifs, voir plus bas).
- **Chaque match met la sélection en pause et affiche le film sur tous les
  téléphones. Le chef du groupe (l'hôte) décide pour tout le monde** :
  « On regarde ça » (fin de la soirée) ou « Continuer » (tout le monde
  reprend la pile).
- Si la pile se termine sans match : **podium des presque-matchs** et bouton
  **« Nouvelle pile »**.
- **Participant inactif** : sans signe de vie depuis plus d'une minute, il ne
  compte plus pour l'unanimité ni pour la fin de pile, et compte de nouveau
  s'il revient. Si l'hôte est inactif, n'importe quel participant actif peut
  lancer la nouvelle pile.
- **Films déjà vus** : détectés uniquement via la base de l'app (pas d'appel
  TMDB), avec un **interrupteur « Inclure les films déjà vus »** dans la
  configuration.
- **Tests** : ajout de Vitest pour la logique pure.
- Carte de swipe : **version A** (affiche plein cadre), avec le **badge de
  plateforme**. Maquette : `.superpowers/brainstorm/…/content/swipe-card.html`
  (locale, non commitée), décrite plus bas.
- Synchronisation par polling.

## Choix faits par Claude (à vérifier pendant la relecture)

Chacun est marqué *(choix Claude)* dans la suite :

- Nom « Ce soir ? », page `/ce-soir`, API sous `/api/movie-night`.
- Seul un compte connecté peut créer une session (l'hôte). Le solo est une
  session à un seul participant, qui saute la salle d'attente.
- Code de 6 caractères, sans caractères ambigus.
- Plus personne ne rejoint une fois le swipe lancé.
- Même pile, même ordre pour tous.
- Taille de pile au choix 10 / 15 / 20 (15 par défaut).
- Genres en « OU », aucun genre coché = tous les genres.
- « Déjà vu » = film noté dans l'app par un participant connecté
  (`WatchTimeEntry`). Interrupteur désactivé par défaut, donc les films déjà
  vus sont exclus. Les films des piles précédentes de la session sont
  toujours exclus.
- Vote définitif (pas d'annulation, cohérent avec les non-objectifs).
- L'hôte peut retirer un participant ; si l'hôte quitte, la session se termine.
- Seul l'hôte lance une nouvelle pile et tranche sur un match. S'il est
  inactif, ces deux décisions passent à n'importe quel participant actif.
- Session valable 6 heures.
- Plateformes de l'hôte mémorisées sur son compte.

## Parcours

### 1. Entrée — `/ce-soir`

Lien « Ce soir ? » dans le header et le menu burger *(choix Claude)*. La page
propose :

- **Créer une session** (compte connecté requis) : ouvre la configuration.
- **Rejoindre avec un code** : champ code, plus un champ pseudo si le
  visiteur n'est pas connecté.
- **Invitations reçues** (compte connecté) : sessions où un ami m'a invité,
  avec Rejoindre / Refuser.

### 2. Configuration (hôte)

- **Plateformes** : grille de logos des plateformes disponibles en France
  (TMDB `GET /watch/providers/movie?watch_region=FR&language=fr-FR`, triées
  par `display_priority`), multi-sélection, au moins une obligatoire.
  Pré-cochées avec la dernière sélection de l'hôte, mémorisée sur son compte
  *(choix Claude)*.
- **Genres** : puces multi-sélection depuis `TMDB_MOVIE_GENRES`
  (`src/features/DiscoverMovies/constants/genres.ts`). Aucun genre coché =
  tous les genres *(choix Claude)*.
- **Taille de la pile** : 10 / 15 / 20, 15 par défaut *(choix Claude)*.
- **Interrupteur « Inclure les films déjà vus »**, désactivé par défaut
  *(choix Claude pour la valeur par défaut)*.
- Boutons **« Jouer seul »** (crée la session, construit la pile et passe
  directement au swipe) et **« Jouer à plusieurs »** (crée la session et
  ouvre la salle d'attente).

### 3. Salle d'attente (à plusieurs)

```
┌─────────────────────────┐
│  Session  K7P-2QX       │
│  ● Paul (hôte)          │
│  ● Léa                  │
│  ● Max (invité)         │
│  [ Inviter un ami ]     │
│  [   Lancer   ]         │  ← hôte seulement
└─────────────────────────┘
```

- Le code s'affiche en gros, avec un bouton pour copier ou partager (Web
  Share API si disponible) un lien `/ce-soir?code=K7P2QX` qui pré-remplit
  le champ.
- **Inviter un ami** : liste des amis acceptés de l'hôte. L'invitation
  apparaît dans le compteur de notifications de l'ami et dans « Invitations
  reçues » sur `/ce-soir`.
- 4 participants maximum, hôte compris. La limite est vérifiée au moment où
  quelqu'un rejoint (par code ou en acceptant une invitation). Une invitation
  en attente ne réserve pas de place.
- L'hôte peut retirer un participant *(choix Claude)*.
- Retirer un invité en salle d'attente change le code : seul son cookie le
  désigne, l'ancien code lui permettrait de revenir depuis une fenêtre
  privée. Le nouveau code s'affiche dans la salle d'attente ; un lien déjà
  partagé est à renvoyer *(revue de sécurité)*.
- **Lancer** (hôte) construit la pile et fait passer la session en swipe.
  Après ça, le code ne permet plus de rejoindre et les invitations en
  attente deviennent caduques *(choix Claude)*.

### 4. Swipe — carte A

Maquette retenue (version A) :

```
┌─────────────────────────┐
│ ✕ Quitter   7/15  (P)(L)(M) │  ← anneau ambre = moi, vert = a fini la pile
│ ┌─────────────────────┐ │
│ │NETFLIX              │ │  ← badge plateforme
│ │      [affiche]      │ │
│ │                     │ │
│ │ Fight Club          │ │
│ │ 1999 · 2 h 19 · ★8.4│ │
│ │ (Drame) (Thriller)  │ │
│ │ Touchez pour le     │ │
│ │ synopsis            │ │
│ └─────────────────────┘ │
│       (✕)     (♥)       │
└─────────────────────────┘
```

- Affiche plein cadre, dégradé en bas, avec titre, année, durée, note et
  genres. Un toucher retourne la carte (ou ouvre un panneau) pour afficher
  le synopsis.
- Le badge en haut à gauche indique sur quel abonnement choisi le film est
  inclus. Plusieurs plateformes : celle avec la meilleure `display_priority`.
- Glisser à droite = oui, à gauche = non. Pendant le glissement, la carte
  pivote et un tampon « OUI » (vert) ou « NON » apparaît. Au-delà d'un seuil
  (distance ou vitesse), la carte part et le vote est envoyé ; sinon elle
  revient en place.
- Les boutons ✕ / ♥ font la même chose ; sur ordinateur, flèches gauche /
  droite. Pas de nouvelle dépendance pour le geste : Pointer Events et
  transformations CSS *(choix Claude)*.
- En haut : « Quitter », progression `n / N`, avatars des participants avec
  un anneau quand quelqu'un a fini la pile et grisés quand il est inactif.
  On voit qui a fini, jamais ses votes.

### 5. Match

- **Règle** : un film est un match quand tous les participants **actifs**
  de la session ont voté oui pour ce film dans la pile courante. Seul, c'est
  le premier oui.
- **Un match met la session en pause pour tout le monde** (statut `MATCH`).
  Le dernier votant voit l'écran « Match ! » dans la réponse de son vote ;
  les autres au prochain rafraîchissement, par-dessus la carte en cours,
  même au milieu d'un swipe. Pendant la pause, les votes sont refusés : une
  carte swipée à ce moment revient dans la pile.
- Écran « Match ! » : affiche, titre, avatars des participants.
  - **Le chef du groupe** voit deux boutons :
    - **On regarde ça** : la soirée se termine sur ce film (voir 7).
    - **Continuer** : tout le monde reprend la pile là où il en était.
  - Les autres voient « Paul décide… ».
  - Si l'hôte est inactif, les boutons passent à tous les participants
    actifs ; le premier qui appuie décide *(choix Claude)*.
- Un match sur lequel on a choisi « Continuer » ne remet plus la session en
  pause. Il reste dans la liste des matchs de la pile.
- Un participant retiré, parti ou devenu inactif peut créer un match
  (l'unanimité porte sur moins de monde) : il met la session en pause comme
  les autres. Si plusieurs matchs apparaissent d'un coup, ils sont présentés
  un par un, dans l'ordre de la pile.

### 6. Fin de pile

Quand un participant a fini la pile, il attend les autres (« En attente de
Léa et Max… »). Quand tous les participants actifs ont fini :

- **S'il y a des matchs** (ceux sur lesquels on a continué) : récapitulatif.
  Le chef du groupe peut en choisir un (« On regarde ça », fin de la soirée).
- **Sinon** : **podium**, les 3 films avec le plus de oui (ex. « 3 / 4 »).
  Égalité départagée par l'ordre dans la pile. Seuls les films avec au moins
  un oui y figurent ; si aucun, message « Aucun film n'a plu ». Le chef du
  groupe peut choisir un film du podium (« On regarde ça »).
- Dans les deux cas, le chef du groupe voit aussi **« Nouvelle pile »** :
  mêmes réglages, de nouveaux films (aucun film déjà proposé dans la
  session). Les autres voient « En attente de Paul ». Si l'hôte est inactif,
  n'importe quel participant actif peut décider.

### 7. Fin de soirée, départs et inactivité

- **« On regarde ça »** termine la session (statut `ENDED`, film retenu
  enregistré). Tous les téléphones affichent « Ce soir : *titre* », avec un
  lien vers la fiche du film (`/movies/[id]`), où figurent déjà les
  plateformes et le bouton watchlist.
- **Inactivité** : chaque rafraîchissement d'un participant met à jour son
  « vu à » (`lastSeenAt`). Au-delà de 60 secondes sans rafraîchissement, il
  est inactif : il ne compte plus pour l'unanimité ni pour « tout le monde a
  fini ». Dès qu'il rafraîchit de nouveau, il redevient actif et compte de
  nouveau, y compris pour les matchs déjà pris en compte (qui ne sont pas
  annulés).
- « Quitter » retire le participant de la session (ses votes ne comptent
  plus).
- Si l'hôte quitte avec « Quitter », la session se termine pour tout le
  monde *(choix Claude)*. Un hôte simplement inactif ne termine rien.
- Une session expire 6 heures après sa création *(choix Claude)*. Les
  sessions expirées sont supprimées paresseusement (par exemple à chaque
  création de session), sans tâche planifiée.

## Construction de la pile

Faite côté serveur au lancement (et à chaque « Nouvelle pile »), pas à la
création, pour inclure les exclusions de tous les participants présents.

1. TMDB `GET /discover/movie` avec :
   - `with_watch_providers` = ids des plateformes joints par `|` (OU) ;
   - `watch_region=FR`, `with_watch_monetization_types=flatrate` ;
   - `with_genres` = ids joints par `|` (OU ; la virgule voudrait dire ET) ;
   - `sort_by=popularity.desc`, `vote_count.gte=100` *(choix Claude, pour
     éviter les films obscurs)*, `include_adult=false`, `language=fr-FR`.
2. Piocher des pages au hasard parmi les 10 premières (bornées par
   `total_pages`) jusqu'à avoir assez de candidats, pour que deux soirées ne
   donnent pas la même pile.
3. Exclure :
   - sauf si « Inclure les films déjà vus » est coché : les films notés par
     un participant connecté (lignes `WatchTimeEntry` avec
     `media_type = "movie"`). Ces lignes ne sont écrites que par la notation
     dans l'app (`rating.handlers.ts`, depuis mars 2026) : les notes plus
     anciennes ou faites directement sur TMDB ne sont pas exclues. Ce trou
     est accepté par Paul, pas de rattrapage ni d'appel TMDB ;
   - toujours : les films des piles précédentes de la session.
4. Mélanger, garder `deckSize` films.
5. Pour chaque film retenu, en parallèle : TMDB
   `GET /movie/{id}?append_to_response=watch/providers&language=fr-FR` pour
   la durée et le badge (plateformes FR `flatrate` ∩ plateformes choisies).
6. Enregistrer un instantané de chaque film dans la pile (id, titre, affiche,
   date, note, durée, genres, synopsis, badge), pour que le polling ne
   rappelle jamais TMDB.

S'il y a moins de candidats que `deckSize`, la pile est plus courte. S'il n'y
en a aucun, le lancement échoue avec « Aucun film ne correspond, élargissez
les plateformes ou les genres », et la session reste en salle d'attente.

## Modèle de données (proposition, ajustable par le constructeur)

```prisma
model User {
  // … champs existants
  streaming_provider_ids Int[] @default([]) // dernières plateformes choisies comme hôte
  hostedMovieNights      MovieNight[]
  movieNightParticipations MovieNightParticipant[]
}

model MovieNight {
  id           String   @id @default(cuid())
  code         String   @unique          // 6 caractères
  hostId       String
  status       String   @default("LOBBY") // LOBBY | SWIPING | MATCH | ENDED
  provider_ids Int[]
  genre_ids    Int[]
  deck_size    Int
  include_seen Boolean  @default(false)
  pending_match_movie_id Int?            // film du match en attente de décision (statut MATCH)
  chosen_movie_id        Int?            // film retenu (statut ENDED via « On regarde ça »)
  createdAt    DateTime @default(now())
  expiresAt    DateTime

  host         User @relation(fields: [hostId], references: [id], onDelete: Cascade)
  participants MovieNightParticipant[]
  rounds       MovieNightRound[]
}

model MovieNightParticipant {
  id               String   @id @default(cuid())
  movieNightId     String
  userId           String?  // null pour un invité
  guestName        String?  // pseudo d'invité
  guestTokenHash   String?  @unique // sha256 du jeton du cookie invité
  status           String   // INVITED | JOINED | DECLINED | LEFT | REMOVED
  isHost           Boolean  @default(false)
  lastSeenAt       DateTime @default(now()) // inactif au-delà de 60 s
  createdAt        DateTime @default(now())

  movieNight MovieNight @relation(fields: [movieNightId], references: [id], onDelete: Cascade)
  user       User?      @relation(fields: [userId], references: [id], onDelete: Cascade)
  votes      MovieNightVote[]

  @@unique([movieNightId, userId])
}

model MovieNightRound {
  id           String   @id @default(cuid())
  movieNightId String
  index        Int      // 1, 2, … (« Nouvelle pile »)
  movies       Json     // instantanés ordonnés (voir Construction de la pile)
  continued_match_movie_ids Int[] @default([]) // matchs sur lesquels on a choisi « Continuer »
  createdAt    DateTime @default(now())

  movieNight MovieNight @relation(fields: [movieNightId], references: [id], onDelete: Cascade)
  votes      MovieNightVote[]

  @@unique([movieNightId, index])
}

model MovieNightVote {
  id            String   @id @default(cuid())
  roundId       String
  participantId String
  tmdb_movie_id Int
  liked         Boolean
  createdAt     DateTime @default(now())

  round       MovieNightRound       @relation(fields: [roundId], references: [id], onDelete: Cascade)
  participant MovieNightParticipant @relation(fields: [participantId], references: [id], onDelete: Cascade)

  @@unique([roundId, participantId, tmdb_movie_id])
}
```

La pile courante est le round d'index le plus élevé. « Actif » = statut
`JOINED` et `lastSeenAt` de moins de 60 s. Les matchs et le podium sont
calculés à partir des votes et des participants actifs.

**Réconciliation** : l'unanimité peut changer sans vote (départ, retrait,
inactivité). Après chaque vote, départ ou retrait, et à chaque lecture de
l'état par le polling, le serveur :

1. met à jour le `lastSeenAt` du participant qui lit ;
2. calcule les matchs de la pile courante ;
3. si la session est en `SWIPING` et qu'un match n'est ni dans
   `continued_match_movie_ids` ni déjà en attente, passe en `MATCH` avec le
   premier de ces matchs dans l'ordre de la pile.

Le passage en `MATCH` doit être atomique (mise à jour conditionnée à
`status = 'SWIPING'`), pour que deux requêtes simultanées ne posent pas deux
matchs différents.

## API (proposition)

Toutes les routes de session répondent `Cache-Control: no-store`.
L'autorisation passe par un helper unique qui résout le participant courant
de la session demandée : soit l'utilisateur de `getCurrentSession()`, soit
le cookie invité. Les actions réservées à l'hôte vérifient `isHost`.

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/watch-providers` | Plateformes FR (public, `publicCachedJson` avec `CDN_CACHE.details`) |
| POST | `/api/movie-night` | Créer (connecté) : `{ providerIds, genreIds, deckSize, solo }` ; mémorise les plateformes de l'hôte ; en solo, construit la pile et passe en `SWIPING` |
| POST | `/api/movie-night/join` | Rejoindre par code : `{ code, guestName? }` ; pose le cookie invité si besoin |
| GET | `/api/movie-night/invites` | Invitations en attente de l'utilisateur connecté |
| POST | `/api/movie-night/[id]/invites` | Hôte : inviter `{ friendUserId }` (ami accepté uniquement) |
| POST | `/api/movie-night/[id]/invites/respond` | Invité connecté : `{ accept: boolean }` |
| GET | `/api/movie-night/[id]` | État pour le polling (voir ci-dessous) |
| POST | `/api/movie-night/[id]/start` | Hôte : construit la pile 1, passe en `SWIPING` |
| POST | `/api/movie-night/[id]/votes` | `{ tmdbMovieId, liked }` → état à jour (dont le match s'il vient d'apparaître) ; refusé hors `SWIPING` |
| POST | `/api/movie-night/[id]/decision` | Chef du groupe (ou participant actif si l'hôte est inactif) : `{ action: "watch", tmdbMovieId }` (match, récap ou podium → `ENDED`) ou `{ action: "continue" }` (`MATCH` → `SWIPING`) |
| POST | `/api/movie-night/[id]/rounds` | Chef du groupe (ou participant actif si l'hôte est inactif) : nouvelle pile, quand tous les actifs ont fini la pile courante |
| POST | `/api/movie-night/[id]/leave` | Quitter (l'hôte termine la session) |
| DELETE | `/api/movie-night/[id]/participants/[participantId]` | Hôte : retirer un participant |

**État renvoyé par `GET /api/movie-night/[id]`** : statut, code (en salle
d'attente), réglages, participants (id, nom ou pseudo, avatar, hôte, actif,
nombre de cartes votées, a fini), pile courante (instantanés), **mes** votes
de la pile courante, match en attente, matchs de la pile courante, podium
(si tous les actifs ont fini sans match), film retenu, `me` (mon
participant) et `canDecide` (je peux trancher sur un match ou lancer une
nouvelle pile). Jamais les votes individuels des autres.

`/api/notifications/count` ajoute `movieNightInvites` (invitations
`INVITED` sur des sessions encore en `LOBBY` et non expirées) au total.

## Sécurité

- **Cookie invité** : `movie_night_guest`, httpOnly, `secure`,
  `sameSite=lax`, expiration alignée sur la session. La valeur est un jeton
  aléatoire de 32 octets (`crypto.randomBytes`), stocké en base sous forme de
  hash SHA-256. Un seul cookie invité par navigateur : rejoindre une autre
  session le remplace.
- **Code** : 6 caractères tirés d'un alphabet sans caractères ambigus
  (pas de 0/O, 1/I/L), soit environ 10⁹ combinaisons. Unicité vérifiée à la
  création. Valable seulement en `LOBBY` et avant expiration, 4 participants
  maximum. Pas de limitation de débit (pas d'infrastructure pour ça) : risque
  résiduel accepté, puisque deviner un code ne donne accès qu'à une salle
  d'attente de quelques minutes.
- **Pseudo** : 1 à 20 caractères après trim, unique dans la session (sinon
  message d'erreur), affiché uniquement comme texte. Pas de HTML.
- **Votes** : acceptés seulement en `SWIPING`, pour un film de la pile
  courante, par un participant `JOINED`. Le premier vote est définitif : un
  second vote sur le même film est refusé.
- Toutes les entrées sont validées côté serveur (ids numériques, tailles de
  tableaux bornées, `deckSize ∈ {10, 15, 20}`).

## Côté client

- Pages : `/ce-soir` (entrée, configuration, rejoindre, invitations) et
  `/ce-soir/[id]` (salle d'attente → swipe → match → fin de pile, selon le
  statut et l'état de mes votes).
- Un hook `useMovieNight(id)` porte le polling (`refetchInterval: 2000`
  tant que le statut est `LOBBY`, `SWIPING` ou `MATCH`, arrêt sur `ENDED`,
  pas de rafraîchissement onglet masqué). Les votes passent par une mutation
  qui avance la carte localement sans attendre le serveur, puis met à jour
  l'état. Si le vote est refusé parce qu'un match vient de mettre la session
  en pause, la carte revient.
- L'écran affiché découle du statut renvoyé par le serveur (`MATCH` →
  écran « Match ! », `ENDED` → « Ce soir : *titre* ») : pas de mémoire des
  matchs côté client.
- Organisation en feature, comme le reste de l'app :
  `src/features/MovieNight/{View,components,hooks,services}`, avec la logique
  serveur dans `src/lib/server/services/movieNight.service.ts`.

## Laissé au constructeur

- Découpage des composants, noms internes, détail des animations (seuils de
  swipe, durées).
- Rendu exact des écrans au-delà de la maquette A (configuration, salle
  d'attente, match, podium), dans le style existant de l'app.
- Forme exacte des réponses d'API et du JSON des instantanés.

## Tests

Le projet n'a pas encore de lanceur de tests. Paul a validé l'ajout de
**Vitest** (dépendance de dev, script `pnpm test`) pour la logique pure,
écrite sous forme de fonctions sans accès à la base ni à TMDB :

- calcul des participants actifs (seuil de 60 s) ;
- calcul des matchs, du match à mettre en pause (ordre de la pile, matchs
  déjà continués exclus) et du podium (tri, égalités, films sans oui) ;
- filtrage de la pile (exclusions, films déjà proposés, troncature) ;
- génération et format du code ;
- règles d'autorisation de décision (hôte actif, ou repli sur les
  participants actifs).
