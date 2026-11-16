# « Ce soir ? » sans compte — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un visiteur sans compte peut jouer seul et héberger une partie à plusieurs sous un pseudo.

**Architecture:** L'hôte sans compte est un participant invité marqué `isHost`, identifié par le cookie invité existant ; `MovieNight.hostId` devient optionnel. Les routes de création et de pile solo acceptent un visiteur sans compte. Côté client, le formulaire « Héberger » s'ouvre à tous : pseudo pour le multi, plateformes mémorisées dans le `localStorage`, sans « Inclure les films déjà vus » ni « Inviter un ami ».

**Tech Stack:** Next.js 16.4.6 (App Router), React 19.3, TanStack Query 5, Tailwind 4, Prisma 7 (Postgres Neon), Vitest.

**Spec:** `docs/superpowers/specs/2026-11-16-ce-soir-sans-compte-design.md` (complète `2026-11-15-ce-soir-design.md` et `2026-11-15-ce-soir-ajustements-design.md`).

## Global Constraints

- Seul changement de schéma : `MovieNight.hostId String?` et `host User?` (on relâche un NOT NULL, aucune perte de données).
- `pnpm db:generate` est sans risque. **Avant tout `pnpm db:push`, s'arrêter et demander à Paul quelle base viser** : `prisma.config.ts` lit `.env` (base de l'app), alors que `next dev` lit `.env.local` en priorité.
- Pseudo : mêmes règles et même message que pour rejoindre (`parseGuestName`, `GUEST_NAME_MAX_LENGTH = 20`, « Choisissez un pseudo de 1 à 20 caractères. »), unicité inchangée.
- Textes exacts : « Pseudo », « Jouer seul », « Jouer à plusieurs », « Inclure les films déjà vus », « Inviter un ami ».
- `localStorage` : chaque lecture/écriture dans un try/catch ; sans stockage, rien n'est pré-coché et rien ne casse.
- Le parcours d'un compte connecté ne change pas (mêmes requêtes, mêmes réglages, mêmes écrans).
- pnpm. Commits en français, préfixés « « Ce soir ? » : », terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Pseudo vide, rempli d'espaces ou de 21 caractères en « Jouer à plusieurs » sans compte → bouton désactivé côté client ; envoyé quand même → 400 `invalid_input` avec le message du pseudo, aucune partie créée. (Task 1 : ordre des vérifications dans `createGuestMovieNight` ; Task 3 : bouton désactivé.)
2. Hôte invité qui recharge la salle d'attente ou revient sur `/ce-soir/[id]` → il est toujours reconnu comme hôte (cookie) et peut lancer. (Task 3 : vérification navigateur.)
3. Hôte invité → pas de bloc « Inviter un ami », donc aucun appel à l'API des amis (qui répondrait 401). (Task 1 : `me.isGuest` ; Task 2 : condition dans la salle d'attente.)
4. `localStorage` absent, bloqué ou contenant autre chose qu'une liste d'ids → formulaire sans plateforme pré-cochée, pas d'exception. (Task 2 : tests `readRememberedProviderIds`.)
5. Compte connecté qui rejoint par code une partie hébergée par un invité → il entre normalement, l'hôte affiché est le pseudo. (Task 3 : vérification navigateur.)

---

### Task 1: Serveur — hôte invité, solo sans compte, `me.isGuest`

**Files:**
- Modify: `prisma/schema.prisma` (modèle `MovieNight`)
- Modify: `src/lib/server/services/movieNight.service.ts` (`createMovieNight`, `buildSoloDeck`, `listPendingInvites`)
- Modify: `src/lib/server/services/index.ts` (export)
- Modify: `src/lib/server/services/movieNightState.ts` (`me`), `src/lib/movie-night/types.ts` (`TMovieNightState["me"]`)
- Modify: `src/app/api/movie-night/route.ts`, `src/app/api/movie-night/solo/route.ts`
- Test: `src/lib/server/services/movieNightState.test.ts`

**Interfaces:**
- Produces:
  - `TMovieNightState["me"]` = `{ participantId: string; isHost: boolean; isGuest: boolean }` (`isGuest` = mon participant n'a pas de `userId`).
  - `createGuestMovieNight(args: { guestName: unknown; settings: TMovieNightSettings }, now?: Date): Promise<TResult<{ id: string; guestToken: string; expiresAt: Date }>>`, exporté depuis `@/lib/server/services`.
  - `buildSoloDeck(user: User | null, settings: TMovieNightSettings, excludedMovieIds: number[]): Promise<TResult<TDeckMovie[]>>`.
  - `POST /api/movie-night` sans compte : corps `{ providerIds, genreIds, includeSeen?, guestName }` → `200 { id }` + cookie `movie_night_guest` ; 400 `invalid_input` (réglages ou pseudo). Avec compte : inchangé, `guestName` ignoré.
  - `POST /api/movie-night/solo` sans compte → `200 { deck }` (plus de 401).

- [ ] **Step 1: Test `me.isGuest` (échoue)**

Dans `movieNightState.test.ts`, remplacer l'assertion existante sur `state.me` et ajouter :

```ts
expect(state.me).toEqual({ participantId: "p-host", isHost: true, isGuest: false });

it("me.isGuest : vrai pour un participant sans compte, hôte compris", () => {
  const guestHost: TStateParticipant = { ...guest, id: "p-guest-host", isHost: true };
  const state = buildMovieNightState(
    input({ participants: [guestHost, guest], meId: guestHost.id }, { status: "LOBBY" }),
  );
  expect(state.me).toEqual({ participantId: "p-guest-host", isHost: true, isGuest: true });
});
```

- [ ] **Step 2: Lancer le test, il échoue**

Run: `pnpm test src/lib/server/services/movieNightState.test.ts`
Expected: FAIL (`isGuest` absent de `me`).

- [ ] **Step 3: Ajouter `isGuest` à `me`**

`types.ts` : `me: { participantId: string; isHost: boolean; isGuest: boolean }`. `buildMovieNightState` : `isGuest: me ? me.userId === null : false`.

- [ ] **Step 4: Lancer le test, il passe**

Run: `pnpm test src/lib/server/services/movieNightState.test.ts`
Expected: PASS.

- [ ] **Step 5: Schéma — `hostId` optionnel**

`hostId String?` et `host User? @relation(fields: [hostId], references: [id], onDelete: Cascade)`. Puis `pnpm db:generate` (pas de `db:push` ici, voir Task 3).

- [ ] **Step 6: Services**

- Extraire de `createMovieNight` un helper privé `insertMovieNight(args: { hostId: string | null; hostParticipant: Prisma.MovieNightParticipantCreateWithoutMovieNightInput; settings: TMovieNightSettings }, now: Date): Promise<{ id: string; expiresAt: Date }>`. Il garde la suppression paresseuse des parties expirées, la boucle de nouveau code sur collision (`MAX_CODE_ATTEMPTS`) et la création imbriquée atomique. `createMovieNight(host: User, …)` garde sa signature et son comportement : `rememberProviders`, puis `insertMovieNight` avec `{ userId: host.id, status: "JOINED", isHost: true, lastSeenAt: now }`.
- `createGuestMovieNight` :
  - `parseGuestName(args.guestName)` ; nul → `fail("invalid_input", \`Choisissez un pseudo de 1 à ${GUEST_NAME_MAX_LENGTH} caractères.\`)`, sans écrire en base.
  - Puis `createGuestToken()` et `insertMovieNight` avec `hostId: null` et l'hôte `{ guestName, guestTokenHash: hash, status: "JOINED", isHost: true, lastSeenAt: now }`.
  - Renvoie `{ id, guestToken: token, expiresAt }`. Pas de `rememberProviders`.
- `buildSoloDeck(user: User | null, …)` : avec `user`, comportement actuel ; sans `user`, ni `rememberProviders` ni films vus (`participantUserIds: []`).
- `listPendingInvites` : `host` peut être nul (en pratique impossible, une invitation vient d'un hôte connecté) → `hostName: host ? userDisplayName(host) : "Invité"`, `hostAvatarUrl: host ? userAvatarUrl(host) : null`.
- Exporter `createGuestMovieNight` dans `services/index.ts`.

- [ ] **Step 7: Routes**

- `POST /api/movie-night` : lire le corps une fois (`readJsonObject`), valider les réglages avec `parseCreateMovieNightInput`.
  - Avec compte : chemin actuel.
  - Sans compte : `createGuestMovieNight({ guestName: body.guestName, settings })`. En cas de succès, `setGuestCookie(guestToken, expiresAt)` puis `noStoreJson({ id })`, comme `join/route.ts`.
  - Mettre à jour le commentaire JSDoc de la route.
- `POST /api/movie-night/solo` : `const user = (await getCurrentSession())?.user ?? null;` et plus de 401. Mettre à jour le commentaire.

- [ ] **Step 8: Vérifier types, lint, tests**

Run: `pnpm exec tsc --noEmit -p . && pnpm lint && pnpm test`
Expected: aucune erreur, tous les tests passent.

- [ ] **Step 9: Commit**

```bash
git add prisma/schema.prisma src/lib src/app/api/movie-night
git commit -m "« Ce soir ? » : héberger et jouer seul sans compte (serveur)"
```

---

### Task 2: Client — formulaire « Héberger » ouvert à tous

**Files:**
- Create: `src/features/MovieNight/utils/rememberedProviders.ts`
- Test: `src/features/MovieNight/utils/rememberedProviders.test.ts`
- Create: `src/features/MovieNight/components/GuestNameField.tsx`
- Modify: `src/features/MovieNight/components/JoinMovieNightForm.tsx` (utilise `GuestNameField`)
- Modify: `src/features/MovieNight/components/MovieNightConfigForm.tsx`
- Modify: `src/features/MovieNight/View/MovieNightHomeView.tsx`
- Modify: `src/features/MovieNight/components/MovieNightLobby.tsx`
- Modify: `src/features/MovieNight/services/movie-night.service.ts`, `src/features/MovieNight/hooks/useMovieNightMutations.ts`

**Interfaces:**
- Consumes: Task 1 (`state.me.isGuest`, `POST /api/movie-night` avec `guestName`, solo sans compte).
- Produces:
  - `REMEMBERED_PROVIDERS_KEY = "movie-night-providers"`.
  - `readRememberedProviderIds(raw: string | null): number[]` (pure).
  - `loadRememberedProviderIds(): number[]` et `saveRememberedProviderIds(ids: number[]): void` : enveloppes `localStorage` qui ne lèvent jamais.
  - `TCreateMovieNightRequest = TCreateMovieNightInput & { guestName?: string }` (client).
  - `GuestNameField({ id, value, onChange, label?, hint? })`.
  - `MovieNightConfigForm({ isLoggedIn }: { isLoggedIn: boolean })`.

- [ ] **Step 1: Tests du stockage des plateformes (échouent)**

```ts
describe("readRememberedProviderIds", () => {
  it("relit une liste d'ids", () => {
    expect(readRememberedProviderIds("[8,337]")).toEqual([8, 337]);
  });
  it.each([[null], ["pas du json"], ['{"a":1}'], ["[8,\"x\"]"], ["[0]"], ["[8.5]"]])(
    "renvoie [] pour %j", (raw) => {
    expect(readRememberedProviderIds(raw)).toEqual([]);
  });
});
describe("load/saveRememberedProviderIds", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("aller-retour par le localStorage", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    });
    saveRememberedProviderIds([8, 337]);
    expect(store.get(REMEMBERED_PROVIDERS_KEY)).toBe("[8,337]");
    expect(loadRememberedProviderIds()).toEqual([8, 337]);
  });
  it("stockage qui lève : [] et aucune exception", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => { throw new Error("bloqué"); },
      setItem: () => { throw new Error("bloqué"); },
    });
    expect(loadRememberedProviderIds()).toEqual([]);
    expect(() => saveRememberedProviderIds([8])).not.toThrow();
  });
  it("localStorage absent : [] et aucune exception", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(loadRememberedProviderIds()).toEqual([]);
    expect(() => saveRememberedProviderIds([8])).not.toThrow();
  });
});
```

- [ ] **Step 2: Lancer les tests, ils échouent**

Run: `pnpm test src/features/MovieNight/utils/rememberedProviders.test.ts`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Implémenter `rememberedProviders.ts`**

Ids valides : entiers > 0, comme `isId` dans `soloGame.ts`. Toute liste contenant un id invalide → `[]`. Les enveloppes font `try { … } catch { … }` autour de l'accès à `localStorage` (couvre aussi son absence côté serveur).

- [ ] **Step 4: Lancer les tests, ils passent**

Run: `pnpm test src/features/MovieNight/utils/rememberedProviders.test.ts`
Expected: PASS.

- [ ] **Step 5: `GuestNameField`, puis l'utiliser dans `JoinMovieNightForm`**

Reprendre le champ pseudo actuel de `JoinMovieNightForm` (label « Pseudo », `maxLength={GUEST_NAME_MAX_LENGTH}`, `autoComplete="nickname"`, placeholder « Votre pseudo », même `inputClass`). `hint` facultatif : petit texte sous le champ, relié par `aria-describedby`. Le rendu de `JoinMovieNightForm` ne change pas.

- [ ] **Step 6: Service et mutation de création**

`createMovieNight(input: TCreateMovieNightRequest)` ; `useCreateMovieNightMutation` prend `TCreateMovieNightRequest`.

- [ ] **Step 7: `MovieNightConfigForm({ isLoggedIn })`**

- Plateformes pré-cochées :
  - connecté : `useMyStreamingProviderIdsQuery(isLoggedIn)` (actuel) ;
  - sans compte : `useState(loadRememberedProviderIds)`. Le formulaire n'est rendu qu'après la résolution de l'auth (voir le garde `isLoading` de `MovieNightHomeView`), donc jamais côté serveur.
  - Dans les deux cas, filtrer par `availableIds`, comme aujourd'hui.
- Sans compte uniquement :
  - champ `GuestNameField` en tête du formulaire, `hint` « Pour jouer à plusieurs » ;
  - pas d'interrupteur « Inclure les films déjà vus » (`includeSeen` envoyé à `false`) ;
  - à « Jouer seul » comme à « Jouer à plusieurs », `saveRememberedProviderIds(providerIds)` avant la requête.
- « Jouer à plusieurs » sans compte : désactivé tant que `parseGuestName(guestName)` est nul ; envoie `guestName: guestName.trim()`.
- « Jouer seul » ne dépend pas du pseudo.

- [ ] **Step 8: `MovieNightHomeView` et salle d'attente**

- Panneau « Héberger » : `<MovieNightConfigForm isLoggedIn={isLoggedIn} />` pour tous ; retirer le lien « Connectez-vous pour héberger » et l'import `Link` s'il ne sert plus.
- `MovieNightLobby` : la section « Inviter un ami » s'affiche si `isHost && !state.me.isGuest`.

- [ ] **Step 9: Vérifier types, lint, tests**

Run: `pnpm exec tsc --noEmit -p . && pnpm lint && pnpm test`
Expected: aucune erreur, tous les tests passent.

- [ ] **Step 10: Commit**

```bash
git add src/features/MovieNight
git commit -m "« Ce soir ? » : formulaire Héberger sans compte (pseudo, plateformes mémorisées dans le navigateur)"
```

---

### Task 3: Base et vérification de bout en bout

**Files:** aucun (sauf corrections trouvées pendant la vérification).

- [ ] **Step 1: Appliquer le schéma — demander à Paul d'abord**

S'arrêter et demander à Paul quelle base viser, et s'il lance lui-même `pnpm db:push`. Ne lancer `pnpm db:push` qu'avec son accord explicite, sur la base qu'il désigne. Attendu : `hostId` devient nullable, sans perte de données.

- [ ] **Step 2: Parcours sans compte (navigateur, dev server sur un port libre)**

Fenêtre privée, non connecté, `/ce-soir` :
1. « Héberger » → formulaire avec « Pseudo », sans « Inclure les films déjà vus ». « Jouer à plusieurs » désactivé sans pseudo.
2. « Jouer seul » sans pseudo → partie solo jouable sur `/ce-soir/solo`.
3. Retour, plateformes pré-cochées avec la sélection précédente.
4. Pseudo « Léa » → « Jouer à plusieurs » → salle d'attente, Léa (hôte), pas de bloc « Inviter un ami ». Recharger : toujours hôte, bouton « Lancer » présent.
5. Une autre session de navigateur, connectée, rejoint par le code → elle apparaît dans la salle. L'hôte invité lance, les deux swipent, un match affiche « Léa décide… » chez le compte connecté et les boutons chez Léa.

Expected : chaque point conforme ; aucune erreur 4xx/5xx inattendue dans le terminal du dev server.

- [ ] **Step 3: Parcours connecté inchangé**

Connecté : « Héberger » → pas de champ pseudo, interrupteur présent, plateformes du compte pré-cochées, « Inviter un ami » visible en salle d'attente.

- [ ] **Step 4: Commit des corrections éventuelles**

Seulement si la vérification a demandé des corrections : un commit par correction, message « « Ce soir ? » : … ».
