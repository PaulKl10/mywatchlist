# « Ce soir ? » ajustements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pile fixe de 15, choix « Héberger / Rejoindre » avant tout formulaire, et solo joué dans le navigateur (un appel au début, un « oui » termine la partie).

**Architecture:** Côté serveur, `deckSize` disparaît au profit de `DECK_SIZE` ; la création part toujours en salle d'attente ; un nouvel endpoint sans session construit une pile solo. Côté client, la logique solo est un module pur (testé) persisté en `sessionStorage`, joué sur `/ce-soir/solo` avec la pile de cartes extraite de `SwipeDeck`.

**Tech Stack:** Next.js 16.4.6 (App Router), React 19.3, TanStack Query, Tailwind 4, Prisma 7, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-15-ce-soir-ajustements-design.md` (complète `2026-11-15-ce-soir-design.md`).

## Global Constraints

- `DECK_SIZE = 15` pour solo et multi ; colonne `deck_size` conservée (écrit 15) ; aucun changement de schéma Prisma.
- `deckSize` et `solo` envoyés par un ancien client sont ignorés, jamais une erreur.
- Solo : aucune requête entre le premier appel et la fin de partie, hors « Nouvelle pile ».
- Textes en français, exactement : « Héberger », « Rejoindre avec un code », « ← Retour », « Connectez-vous pour héberger », « Jouer seul », « Jouer à plusieurs », « Reprendre la pile », « Aucun film retenu », « Nouvelle pile », « Retour à Ce soir ? », « Ce soir : *titre* ».
- `sessionStorage` : chaque lecture/écriture dans un try/catch ; sans stockage, la partie se joue en mémoire.
- Jamais de commande Prisma contre `.env` (prod). pnpm. Commits terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Rechargement de `/ce-soir/solo` en pleine pile → même carte ; `sessionStorage` vide, corrompu ou d'un ancien format → retour à `/ce-soir`, sans plantage. (Task 2 : tests `readSoloGame`.)
2. Double toucher ou swipes rapides en solo → une seule carte votée à la fois, jamais deux films retenus. (Task 2 : `swipeSolo` sans effet sur une partie terminée ; verrou du geste réutilisé en Task 3.)
3. « Nouvelle pile » quand plus aucun film ne correspond → message `no_movies`, on reste sur « Aucun film retenu ». (Vérification navigateur, Task 6.)
4. `sessionStorage` indisponible (navigation privée qui lève) → « Jouer seul » fonctionne quand même. (Task 2 : `saveSoloGame` ne lève jamais.)
5. Ancien client qui envoie `{ deckSize: 10, solo: true }` → création acceptée, salle d'attente, pile de 15. (Task 1 : test de validation.)

---

### Task 1: Serveur — pile fixe, création sans solo, endpoint solo

**Files:**
- Modify: `src/lib/movie-night/constants.ts`, `src/lib/movie-night/types.ts`, `src/lib/movie-night/validation.ts`, `src/lib/server/services/movieNight.service.ts`, `src/lib/server/services/movieNightState.ts`, `src/lib/server/services/movieNightPlay.service.ts` (select `deck_size` inutile), `src/lib/server/services/index.ts`, `src/app/api/movie-night/route.ts`
- Create: `src/app/api/movie-night/solo/route.ts`
- Test: `src/lib/movie-night/validation.test.ts`, `src/lib/server/services/movieNightState.test.ts`

**Interfaces:**
- Produces: `DECK_SIZE = 15` ; `MAX_SOLO_EXCLUDED_IDS = 300` (constants) ; `TMovieNightSettings = { providerIds; genreIds; includeSeen }` (sans `deckSize`) ; `TCreateMovieNightInput = TMovieNightSettings` ; `parseSoloDeckInput(body: unknown): { ok: true; value: TMovieNightSettings & { excludedMovieIds: number[] } } | { ok: false; message: string }` ; `buildSoloDeck(user: User, settings: TMovieNightSettings, excludedMovieIds: number[]): Promise<TResult<TDeckMovie[]>>` ; `POST /api/movie-night/solo` → `200 { deck: TDeckMovie[] }`, 401 non connecté, 400 entrée invalide, 422 `no_movies`, 500 `tmdb_error`.

- [ ] **Step 1: Tests de validation (échouent)**

```ts
it("ignore deckSize et solo d'un ancien client", () => {
  expect(parseCreateMovieNightInput({ providerIds: [8, 8, 337], genreIds: [35], deckSize: 10, solo: true }))
    .toEqual({ ok: true, value: { providerIds: [8, 337], genreIds: [35], includeSeen: false } });
});
it("parseSoloDeckInput : réglages + exclusions dédoublonnées", () => {
  expect(parseSoloDeckInput({ providerIds: [8], genreIds: [], includeSeen: true, excludedMovieIds: [5, 5, 7] }))
    .toEqual({ ok: true, value: { providerIds: [8], genreIds: [], includeSeen: true, excludedMovieIds: [5, 7] } });
  expect(parseSoloDeckInput({ providerIds: [8], genreIds: [] })).toEqual({
    ok: true, value: { providerIds: [8], genreIds: [], includeSeen: false, excludedMovieIds: [] } });
});
it.each([[{ excludedMovieIds: "5" }], [{ excludedMovieIds: [0] }], [{ excludedMovieIds: Array.from({ length: 301 }, (_, i) => i + 1) }]])(
  "parseSoloDeckInput refuse %j", (extra) => {
  expect(parseSoloDeckInput({ providerIds: [8], genreIds: [], ...extra }).ok).toBe(false);
});
```
Retirer les cas `deckSize` des tests existants (`deckSize: 12` n'est plus une erreur) ; `movieNightState.test.ts:107` attend `{ providerIds: [8], genreIds: [35], includeSeen: false }`.

- [ ] **Step 2:** `pnpm exec vitest run src/lib` → FAIL (`parseSoloDeckInput` absent, `deckSize` présent).
- [ ] **Step 3: Implémenter.** Remplacer `DECK_SIZES`/`TDeckSize`/`DEFAULT_DECK_SIZE` par `DECK_SIZE`. `parseSoloDeckInput` réutilise le parseur de réglages. `prepareRoundDeck` passe `deckSize: DECK_SIZE` à `buildDeck`. `createMovieNight(host, settings)` : plus de branche solo, statut `LOBBY`, `deck_size: DECK_SIZE`. `buildSoloDeck` : mémorise `streaming_provider_ids` comme la création, puis `prepareRoundDeck({ settings, participantUserIds: [user.id], previousMovieIds: excludedMovieIds })`. Route solo calquée sur `src/app/api/movie-night/route.ts` (`getCurrentSession`, `withTmdbErrors`, `movieNightResultResponse` avec `(deck) => ({ deck })` ou équivalent existant), réponse `no-store`.
- [ ] **Step 4:** `pnpm exec vitest run && pnpm exec tsc --noEmit` → PASS (le client cassé par `deckSize` est corrigé en Task 4 : si `tsc` échoue seulement dans `MovieNightConfigForm.tsx`, retirer le réglage dès maintenant).
- [ ] **Step 5: Commit** « Ce soir ? » : pile fixe de 15, endpoint de pile solo sans session

### Task 2: Logique solo pure et stockage

**Files:**
- Create: `src/features/MovieNight/utils/soloGame.ts`, `src/features/MovieNight/utils/soloGame.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type TSoloGame = { v: 1; settings: TMovieNightSettings; deck: TDeckMovie[]; index: number;
    shownMovieIds: number[]; chosenMovieId: number | null };
  export type TSoloStatus = "swiping" | "chosen" | "exhausted";
  export const SOLO_STORAGE_KEY = "movie-night-solo";
  startSoloGame(settings, deck): TSoloGame            // index 0, shownMovieIds = ids de la pile
  soloStatus(game): TSoloStatus                       // chosen si chosenMovieId, exhausted si index >= deck.length
  swipeSolo(game, liked: boolean): TSoloGame          // oui : chosenMovieId = carte, index + 1 ; non : index + 1 ; sans effet hors "swiping"
  resumeSolo(game): TSoloGame                         // chosenMovieId = null
  nextSoloDeck(game, deck): TSoloGame                 // nouvelle pile, index 0, shownMovieIds complétés (sans doublon)
  soloExcludedIds(game): number[]                     // les MAX_SOLO_EXCLUDED_IDS derniers shownMovieIds
  readSoloGame(raw: string | null): TSoloGame | null  // null si absent, JSON invalide, v ≠ 1, forme incohérente
  loadSoloGame(): TSoloGame | null ; saveSoloGame(game): void   // sessionStorage, jamais d'exception
  ```

- [ ] **Step 1: Tests (échouent)** — avec une pile `[a, b, c]` :
  - `swipeSolo(start, false)` → index 1, statut `swiping` ; `swipeSolo(start, true)` → `chosenMovieId = a.id`, index 1, statut `chosen`.
  - `swipeSolo(chosenGame, true)` renvoie la même partie (pas de second film).
  - `resumeSolo` après un oui sur `a` → statut `swiping`, carte courante `b` ; oui sur `c` (dernière) puis `resumeSolo` → `exhausted`.
  - trois non → `exhausted` ; `nextSoloDeck(game, [d])` → index 0, `shownMovieIds = [a, b, c, d]`.
  - `soloExcludedIds` garde les 300 derniers sur 310.
  - `readSoloGame` : `null`, `"{"`, `{"v":2,…}`, `index` négatif ou non entier, `deck` non tableau → `null` ; aller-retour `JSON.stringify(game)` → partie égale.
  - `saveSoloGame` et `loadSoloGame` avec un `sessionStorage` qui lève (`vi.stubGlobal`) → aucune exception, `loadSoloGame()` → `null`.
- [ ] **Step 2:** `pnpm exec vitest run src/features/MovieNight/utils/soloGame.test.ts` → FAIL.
- [ ] **Step 3:** Implémenter (fonctions pures, aucune mutation de l'entrée).
- [ ] **Step 4:** même commande → PASS.
- [ ] **Step 5: Commit** « Ce soir ? » : logique de partie solo et sauvegarde dans l'onglet

### Task 3: Pile de cartes partagée et écran de fin réutilisable

**Files:**
- Create: `src/features/MovieNight/components/SwipeStack.tsx`, `src/features/MovieNight/hooks/useSwipeKeys.ts`
- Modify: `src/features/MovieNight/components/SwipeDeck.tsx`, `src/features/MovieNight/components/MovieNightEnded.tsx`, `src/features/MovieNight/View/MovieNightSessionView.tsx`

**Interfaces:**
- Produces: `SwipeStack({ deck: TDeckMovie[]; index: number; gesture: ReturnType<typeof useSwipeGesture> })` — cartes (courante + 2 dessous), annonce `aria-live`, boutons « Non » / « Oui » ; `useSwipeKeys(enabled: boolean, fling: (d: TSwipeDirection) => void): void` — flèches gauche/droite, mêmes exclusions qu'aujourd'hui (repeat, modificateurs, champ éditable) ; `MovieNightEnded({ movie: TDeckMovie | null; children?: ReactNode })` — `children` s'affiche entre « Voir la fiche du film » et « Retour à Ce soir ? ».

- [ ] **Step 1:** Extraire de `SwipeDeck` le rendu de la pile, des boutons et l'écoute clavier, sans changer le comportement (geste, verrou, pause, reset sur vote refusé restent dans `SwipeDeck`). `MovieNightSessionView` passe `state.chosenMovie`.
- [ ] **Step 2:** `pnpm exec tsc --noEmit && pnpm lint && pnpm exec vitest run` → PASS.
- [ ] **Step 3: Commit** « Ce soir ? » : pile de cartes et écran de fin réutilisables

### Task 4: Solo dans le navigateur

**Files:**
- Modify: `src/features/MovieNight/services/movie-night.service.ts`, `src/features/MovieNight/hooks/useMovieNightMutations.ts`, `src/features/MovieNight/components/MovieNightConfigForm.tsx`
- Create: `src/app/ce-soir/solo/page.tsx`, `src/screens/MovieNightSoloScreen.tsx`, `src/features/MovieNight/View/MovieNightSoloView.tsx`

**Interfaces:**
- Consumes: Task 1 endpoint, Task 2 module, Task 3 composants.
- Produces: `fetchSoloDeck(input: TMovieNightSettings & { excludedMovieIds?: number[] }): Promise<{ deck: TDeckMovie[] }>` ; `useSoloDeckMutation()` ; page `/ce-soir/solo` (métadonnées comme `/ce-soir`).

- [ ] **Step 1: Formulaire.** Retirer « Taille de la pile ». « Jouer seul » → `useSoloDeckMutation` puis `saveSoloGame(startSoloGame(settings, deck))` et `router.push("/ce-soir/solo")` ; « Jouer à plusieurs » → création inchangée sans `deckSize`/`solo`. Les deux boutons désactivés pendant l'une ou l'autre requête ; erreur de l'une ou l'autre affichée.
- [ ] **Step 2: `MovieNightSoloView`.** Partie en mémoire, initialisée par `loadSoloGame()` après montage (pas de rendu serveur divergent) ; aucune partie → `router.replace("/ce-soir")`. Chaque changement → `saveSoloGame`.
  - `swiping` : en-tête `grid-cols-[1fr_auto_1fr]` « Quitter » (→ `/ce-soir`) et « n / 15 », `useSwipeGesture` + `useSwipeKeys` + `SwipeStack` ; mise en page identique à `SwipeDeck` (même hauteur).
  - `chosen` : `MovieNightEnded` avec le film retenu ; enfant « Reprendre la pile » (bouton, `resumeSolo`) seulement si `index < deck.length`.
  - `exhausted` : « Aucun film retenu », bouton « Nouvelle pile » (`fetchSoloDeck({ ...settings, excludedMovieIds: soloExcludedIds(game) })` → `nextSoloDeck`), message d'erreur, lien « Retour à Ce soir ? ».
- [ ] **Step 3:** `pnpm exec tsc --noEmit && pnpm lint && pnpm exec vitest run` → PASS.
- [ ] **Step 4: Commit** « Ce soir ? » : partie solo dans le navigateur, sans session en base

### Task 5: Choix d'entrée « Héberger / Rejoindre »

**Files:**
- Modify: `src/features/MovieNight/View/MovieNightHomeView.tsx`

- [ ] **Step 1:** État `mode: "choice" | "host" | "join"`, initialisé à `"join"` si `?code=` sinon `"choice"`. Invitations reçues au-dessus, dans tous les modes. `choice` : deux grands boutons « Héberger » et « Rejoindre avec un code ». `host` : formulaire (connecté) ou lien `/login` « Connectez-vous pour héberger ». `join` : `JoinMovieNightForm` (pseudo si non connecté). `host` et `join` ont un bouton « ← Retour » vers `choice`, titre de section focalisé à l'ouverture.
- [ ] **Step 2:** `pnpm exec tsc --noEmit && pnpm lint` → PASS.
- [ ] **Step 3: Commit** « Ce soir ? » : choisir Héberger ou Rejoindre avant les formulaires

### Task 6: Vérification navigateur et documentation

- [ ] **Step 1:** Serveur de dev sur la branche Neon `dev` (`.env.local`), Playwright à 390 px, compte de test `sdd_test_host` : choix → Héberger → Jouer seul ; aucune requête `/api/movie-night*` pendant les swipes ; oui → « Ce soir : … » → « Reprendre la pile » ; rechargement en pleine pile → même carte ; pile finie → « Nouvelle pile » ; filtre impossible → message `no_movies` (Review Focus 3) ; `?code=` → formulaire Rejoindre direct ; multi : création → salle d'attente, pile de 15 au lancement.
- [ ] **Step 2:** Mettre à jour `2026-11-15-ce-soir-design.md` : une ligne en tête renvoyant vers le document d'ajustements.
- [ ] **Step 3:** `pnpm build` → succès. Commit « Ce soir ? » : spec à jour des ajustements
