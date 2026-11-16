# Notifications push — invitations « Ce soir ? », demandes d'ami, propositions

Date : 2026-11-16
Statut : approuvé (2026-11-16)

## Intention

Aujourd'hui, une invitation « Ce soir ? », une demande d'ami ou une
proposition de film/série n'apparaît que dans la pastille du header et sur
« Mon profil » : il faut ouvrir l'app pour la voir. Paul veut qu'elles fassent
sonner le téléphone du destinataire, comme une app native, sans service payant.

## Objectifs

- Une vraie notification système (app fermée comprise) pour le destinataire de :
  - une invitation « Ce soir ? » ;
  - une demande d'ami ;
  - une proposition de film ou de série.
- Activation explicite, par appareil, depuis « Mon profil ».
- Un toucher sur la notification ouvre la bonne page de l'app.
- Gratuit : aucun service tiers payant, aucun compte développeur.

## Non-objectifs

- Préférences par type de notification (un seul interrupteur par appareil).
- Autres événements (ami accepté, partie lancée, match…).
- Notifications aux invités sans compte (ni amis ni invitations).
- Mettre à jour la pastille de l'icône depuis la notification.
- Historique ou centre de notifications dans l'app.

## Anti-objectifs

- Ralentir ou faire échouer l'action de l'expéditeur (inviter, demander en ami,
  proposer) à cause de l'envoi d'une notification.
- Demander la permission sans geste de l'utilisateur (ignoré sur iPhone, mal vu
  partout ailleurs).
- Un appareil qui continue de recevoir les notifications d'un compte après
  déconnexion.
- Une notification qui ouvre une URL hors de l'app.

## Contraintes

- Stack : Next.js 16.4.6 (App Router, Route Handlers, `after` de
  `next/server`), React 19.3, TanStack Query 5, Prisma 7 sur Neon, Vercel.
  Lire `AGENTS.md` et `node_modules/next/dist/docs/` (guide
  `01-app/02-guides/progressive-web-apps.md`, section Web Push ; référence
  `after`).
- Architecture du projet : pages minces → screens → features (View, hooks,
  services client) → routes `/api` → services serveur
  (`src/lib/server/services`). Pas de Server Actions : les appels passent par
  des routes, comme ailleurs.
- Service worker existant `public/sw.js` (cache), enregistré **en production
  seulement** (`ServiceWorkerRegister`). Pour tester en local :
  `pnpm build && pnpm start`.
- Prise en charge : Android (Chrome, Firefox, Edge) dans le navigateur ;
  iPhone/iPad **iOS 16.4+ uniquement si l'app est ajoutée à l'écran
  d'accueil** ; ordinateurs (Chrome, Edge, Firefox, Safari 16+).
- Schéma par `pnpm db:push` (pas de migrations). **Avant tout `db:push`,
  demander à Paul** (deux bases : `.env` lu par `prisma.config.ts`,
  `.env.local` lu par `next dev`).
- Interface en français, vouvoiement, mêmes conventions visuelles que l'app.

## Approches

1. **Web Push standard, librairie `web-push`, clés VAPID générées soi-même
   (retenue).** C'est la voie du guide Next. Les services de livraison
   (Google, Mozilla, Apple) sont gratuits et sans compte ; seule une table
   s'ajoute en base.
2. Service tiers (OneSignal, Firebase Cloud Messaging) : ajoute un compte, un
   SDK et un tableau de bord pour rien ; sur le web, ils passent de toute façon
   par le même Web Push.
3. Web Push sans librairie (signature VAPID et chiffrement écrits à la main) :
   pas de dépendance, mais cryptographie délicate à maintenir.

Choix validé par Paul : approche 1.

*(Choix Claude)* `web-push@3.6.7` (version stable depuis janvier 2024) avec
`@types/web-push`, plutôt que la 4.0.0 publiée le 2026-11-06 : trop récente.

## Comportement

### Activation (« Mon profil »)

Nouvelle section **« Notifications »** sur « Mon profil », placée avant les
invitations *(choix Claude)*. Un seul bouton selon l'état de l'appareil :

| État | Affichage |
|---|---|
| Navigateur sans Web Push | « Les notifications ne sont pas disponibles sur ce navigateur. » |
| iPhone/iPad, app non installée | « Pour recevoir les notifications, ajoutez My Watchlist à l'écran d'accueil (Partager → Sur l'écran d'accueil), puis ouvrez-la depuis l'icône. » |
| Pas de service worker (dev) | « Les notifications ne sont disponibles que dans l'app en ligne. » |
| Permission refusée | « Notifications bloquées. Autorisez-les dans les réglages du navigateur pour cette app. » |
| Non abonné | bouton **« Activer sur cet appareil »** |
| Abonné | « Activées sur cet appareil » + bouton **« Désactiver »** |

- « Activer » : demande la permission (dans le geste du clic), abonne
  l'appareil (`pushManager.subscribe`, `userVisibleOnly: true`, clé publique
  VAPID) et envoie l'abonnement au serveur. Erreur → message court et bouton
  toujours disponible.
- « Désactiver » : supprime l'abonnement côté serveur puis côté navigateur.
- L'état « abonné » se lit sur l'appareil (`pushManager.getSubscription()`).
  Si un abonnement existe localement, on le renvoie au serveur à l'affichage
  de la section (idempotent), pour qu'il suive le compte connecté.

### Pastille de l'icône

`useAppBadge` ne demande plus la permission tout seul. Il continue d'essayer
de mettre à jour la pastille (Chrome/Edge sur ordinateur n'ont pas besoin de
permission) ; sur iPhone, ça ne marche qu'une fois la permission accordée via
le bouton ci-dessus.

### Déconnexion

Avant l'appel de déconnexion, le client désabonne cet appareil (suppression
serveur + `subscription.unsubscribe()`), au mieux : un échec ne bloque jamais
la déconnexion.

### Envoi

Le destinataire reçoit une notification sur **chacun** de ses appareils
abonnés, dans ces trois cas, uniquement quand l'action réussit :

| Événement | Titre | Texte | Ouvre |
|---|---|---|---|
| Invitation « Ce soir ? » (ami invité ou ré-invité) | « *Nom* vous invite à « Ce soir ? » » | « Rejoignez la partie pour choisir un film ensemble. » | `/ce-soir` |
| Demande d'ami | « *Nom* vous a demandé en ami » | « Répondez depuis votre profil. » | `/profile` |
| Proposition | « *Nom* vous propose « *Titre* » » | « Un film à découvrir sur votre profil. » / « Une série à découvrir sur votre profil. » | `/profile` |

- *Nom* = nom affiché de l'expéditeur (`userDisplayName` : pseudo TMDB, sinon
  « Utilisateur *id* »). *Titre* = titre enregistré dans la proposition.
- Icône : `/app192.png`. Un `tag` par événement *(choix Claude)* : une
  nouvelle notification du même événement remplace l'ancienne au lieu de
  s'empiler (`movie-night-<id>`, `friend-request-<idExpéditeur>`,
  `suggestion-<idExpéditeur>-<type>-<idTmdb>`).
- Pas de notification si l'invitation n'a rien changé (l'ami était déjà dans
  la session).
- L'envoi se fait dans `after()` : la réponse part d'abord. Les erreurs sont
  journalisées sans données personnelles et n'atteignent jamais l'expéditeur.
- Un appareil que le service de livraison déclare disparu (HTTP 404 ou 410)
  est supprimé de la base.
- Sans clés VAPID configurées, l'envoi ne fait rien (avertissement en log une
  fois) : l'app reste utilisable en dev sans clés.

### Service worker

`public/sw.js` gagne deux gestionnaires :

- `push` : lit `{ title, body, url, tag }` et affiche la notification
  (`icon: "/app192.png"`, `data.url`). Sans données lisibles : notification
  générique « My Watchlist » vers `/` (une notification est obligatoire à
  chaque push).
- `notificationclick` : ferme la notification ; si `url` n'est pas un chemin
  relatif interne (commence par un seul `/`), utilise `/`. Enregistre `url`
  dans le Cache Storage (`{ url, at }`), puis met au premier plan un onglet de
  l'app déjà ouvert et lui envoie un message, sinon ouvre une fenêtre sur `url`.
  L'app lit et efface cette cible au lancement, au retour au premier plan et à
  réception du message, puis y navigue (cible ignorée au-delà de 5 minutes).
  *(Correctif 2026-11-16 : sur iPhone, `client.navigate()` échoue quand l'app
  est suspendue et `openWindow(url)` ouvre parfois l'accueil.)*

## Données

```prisma
model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
// User : pushSubscriptions PushSubscription[]
```

Changement additif (nouvelle table). Un même appareil (même `endpoint`) qui
s'abonne avec un autre compte est rattaché au nouveau compte (upsert par
`endpoint`).

## API

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/api/me/push-subscriptions` | Connecté. Corps = `PushSubscription.toJSON()` (`{ endpoint, keys: { p256dh, auth } }`). Upsert par `endpoint` sur l'utilisateur courant. 204. |
| DELETE | `/api/me/push-subscriptions` | Connecté. Corps `{ endpoint }`. Supprime l'abonnement s'il appartient à l'utilisateur courant. 204 (même s'il n'existait pas). |

- 401 sans session, 400 si le corps est invalide. `Cache-Control: no-store`.
- Validation : `endpoint` URL `https:` de 2 048 caractères au plus ; `p256dh`
  et `auth` chaînes base64url non vides de 200 caractères au plus.

## Configuration

Trois variables d'environnement :

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (lue aussi par le navigateur) ;
- `VAPID_PRIVATE_KEY` (serveur uniquement, secrète) ;
- `VAPID_SUBJECT` (`mailto:…` ou `https://…`, exigé par Apple).

Générées une fois (`web-push generate-vapid-keys`). Changer de clés invalide
tous les abonnements. À poser dans `.env.local` (dev) et dans Vercel (prod).

## Tests

Vitest, logique pure uniquement (pas de base, pas de réseau) :

- construction du contenu de chaque notification (titres, textes, URL, tag,
  film/série) ;
- validation du corps d'abonnement (cas valides, URL non https, champs
  manquants ou trop longs) ;
- conversion de la clé publique base64url en `Uint8Array` ;
- dérivation de l'état affiché par la section « Notifications » à partir des
  capacités du navigateur, de la permission et de l'abonnement ;
- choix de l'URL ouverte au clic (chemin interne accepté, tout le reste → `/`)
  si cette logique est extraite du service worker.

Vérification de bout en bout par Paul sur son téléphone après déploiement.

## Laissé au constructeur

- Découpage exact des fichiers (feature `src/features/Notifications`, service
  `push.service.ts`), noms internes.
- Forme du retour des services pour savoir qu'une invitation a bien été créée
  ou relancée, et comment récupérer l'id du destinataire d'une demande d'ami.
- Rendu exact de la section « Notifications ».
