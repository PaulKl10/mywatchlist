# My Watchlist

Application web pour gérer sa liste de films à regarder, noter des films et partager des recommandations entre amis. Authentification via [TMDB](https://www.themoviedb.org/) (The Movie Database).

## Guide utilisateur

### Premiers pas

1. **Créer un compte TMDB** (gratuit) sur [themoviedb.org](https://www.themoviedb.org/signup) si vous n’en avez pas.
2. **Se connecter** : cliquez sur « Connexion » puis « Se connecter avec TMDB ». Vous serez redirigé vers TMDB pour autoriser l’application.
3. Votre **watchlist** et vos **notes** sont synchronisées avec votre compte TMDB : vous pouvez les retrouver sur l’app ou directement sur TMDB.

### Utiliser l’application

- **Accueil** : Parcourez les films populaires, par genre, ou ceux dans les watchlists de vos amis. Cliquez sur un titre de catégorie pour explorer plus de films avec des filtres.
- **Fiche film** : Cliquez sur une affiche pour voir les détails. Vous pouvez ajouter le film à votre watchlist, le noter (1 à 10 étoiles) ou le suggérer à un ami.
- **Watchlist** : Consultez et gérez votre liste de films à regarder.
- **Mes notes** : Retrouvez tous les films que vous avez notés.
- **Mon profil** : Aperçu de votre watchlist, liste d’amis, demandes d’ami en attente et suggestions reçues.
- **Amis** : Ajoutez des amis par nom ou ID TMDB. Une fois amis, vous pouvez voir leurs watchlists et leur suggérer des films.
- **Suggestions** : Quand un ami vous suggère un film, acceptez pour l’ajouter à votre watchlist ou refusez pour l’ignorer.

### À propos de TMDB

[The Movie Database](https://www.themoviedb.org/) est une base de données collaborative de films, gratuite et sans publicité. My Watchlist utilise TMDB pour l’authentification et les données des films. Votre compte TMDB reste sous votre contrôle.

---

## Fonctionnalités (détails techniques)

- **Accueil** : Listes horizontales façon Netflix (populaires, par genre, films des amis)
- **Watchlist** : Ajouter/retirer des films de sa liste (synchronisée avec TMDB)
- **Notes** : Noter les films de 1 à 10 étoiles
- **Explorer** : Découvrir des films avec filtres (genres, année, note minimale)
- **Profil** : Aperçu de sa watchlist, amis, demandes d’ami
- **Amis** : Ajouter des amis par nom ou ID, accepter/refuser des demandes
- **Suggestions** : Proposer un film à un ami depuis la fiche du film ; accepter une suggestion l’ajoute à sa watchlist

## Stack technique

| Techno | Usage |
|--------|-------|
| **Next.js 16** | App Router, API Routes, SSR |
| **React 19** | UI |
| **TypeScript** | Typage |
| **Tailwind CSS 4** | Styles |
| **TanStack Query** | Cache et état serveur |
| **Prisma 7** | ORM + PostgreSQL (Neon) |
| **TMDB API** | Données films, auth, watchlist, notes |

## Prérequis

- Node.js 18+
- Compte [TMDB](https://www.themoviedb.org/) (gratuit)
- Base PostgreSQL (ex. [Neon](https://neon.tech))

## Installation

```bash
pnpm install
```

## Configuration

Créer un fichier `.env` à la racine :

```env
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
TMDB_API_KEY="votre_clé_api_tmdb"
```

- **DATABASE_URL** : URL de connexion PostgreSQL (Neon fournit une URL prête à l’emploi)
- **TMDB_API_KEY** : Clé API TMDB (Settings → API → Request an API Key)

Puis initialiser la base :

```bash
pnpm db:push
```

## Développement

```bash
pnpm dev
```

L’app est disponible sur [http://localhost:3000](http://localhost:3000).

### Connexion TMDB en local

TMDB bloque les redirections vers `localhost` (erreur 403 CloudFront). Pour tester la connexion :

1. **Installer ngrok** : [ngrok.com](https://ngrok.com) ou `brew install ngrok`
2. **Lancer le tunnel** : `ngrok http 3000`
3. **Copier l’URL** (ex. `https://abc123.ngrok-free.app`)
4. **Ajouter dans `.env`** : `NEXT_PUBLIC_APP_URL=https://votre-url.ngrok-free.app`
5. **Accéder à l’app via l’URL ngrok** (pas localhost) pour se connecter

## Scripts

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Serveur de développement |
| `pnpm build` | Build de production |
| `pnpm start` | Lancer le build en production |
| `pnpm db:push` | Synchroniser le schéma Prisma avec la BDD |
| `pnpm db:migrate` | Créer une migration |
| `pnpm db:studio` | Interface Prisma Studio |

## Architecture

```
src/
├── app/                 # Next.js App Router
│   ├── api/             # Routes API (proxy TMDB, amis, suggestions…)
│   ├── layout.tsx       # Layout global (Header, Footer)
│   └── page.tsx         # Pages minces → délèguent aux Screens
├── screens/             # Écrans = composition de features
├── features/            # Modules feature-based
│   ├── Home/            # Accueil, listes horizontales
│   ├── DiscoverMovies/  # Explorer avec filtres
│   ├── Watchlist/       # Ajout/suppression watchlist
│   ├── RatedMovies/     # Notation des films
│   ├── Profile/         # Profil, amis, demandes
│   └── Suggestions/     # Suggérer un film à un ami
├── components/          # Composants UI réutilisables
├── lib/                 # Prisma, services, utilitaires
└── types/               # Types TypeScript partagés
```

**Flux de données** : Page → Screen → View (features) → Hooks (TanStack Query) → API Next.js → TMDB / BDD

## Déploiement (Vercel)

1. Connecter le dépôt GitHub à Vercel
2. Configurer les variables d’environnement : `DATABASE_URL`, `TMDB_API_KEY`
3. Optionnel : `NEXT_PUBLIC_APP_URL` = URL de production pour les callbacks TMDB

Le script `postinstall` exécute `prisma generate` automatiquement lors du déploiement.
