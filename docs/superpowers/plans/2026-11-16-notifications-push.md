# Notifications push — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Le destinataire d'une invitation « Ce soir ? », d'une demande d'ami ou d'une proposition de film/série reçoit une notification système sur chacun de ses appareils abonnés.

**Architecture:** Web Push standard avec `web-push` et des clés VAPID. Logique pure partagée dans `src/lib/push` (contenu des notifications, validation, configuration). Le service serveur `push.service.ts` enregistre les appareils (table `PushSubscription`) et envoie dans `after()` depuis les trois routes concernées. Côté client : gestionnaires `push`/`notificationclick` dans `public/sw.js`, et une section « Notifications » sur « Mon profil » qui abonne ou désabonne l'appareil.

**Tech Stack:** Next.js 16.4.6 (Route Handlers, `after`), React 19.3, TanStack Query 5, Prisma 7 (Neon), `web-push@3.6.7`, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-16-notifications-push-design.md`

## Global Constraints

- Dépendances exactes : `web-push@3.6.7` (dependencies) et `@types/web-push@3.6.4` (devDependencies), installées avec pnpm. Pas la 4.0.0.
- Variables d'environnement : `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:…` ou `https://…`). Sans elles, l'envoi ne fait rien (un seul avertissement en log), sans erreur.
- Textes exacts (vouvoiement) :
  - invitation : titre « {nom} vous invite à « Ce soir ? » », texte « Rejoignez la partie pour choisir un film ensemble. », URL `/ce-soir`, tag `movie-night-{movieNightId}` ;
  - demande d'ami : titre « {nom} vous a demandé en ami », texte « Répondez depuis votre profil. », URL `/profile`, tag `friend-request-{fromUserId}` ;
  - proposition : titre « {nom} vous propose « {titre} » », texte « Un film à découvrir sur votre profil. » (movie) ou « Une série à découvrir sur votre profil. » (tv), URL `/profile`, tag `suggestion-{fromUserId}-{mediaType}-{tmdbId}`.
- Icône des notifications : `/app192.png`. Notification de repli : titre « My Watchlist », URL `/`.
- Libellés de la section : titre « Notifications », boutons « Activer sur cet appareil » et « Désactiver », état abonné « Activées sur cet appareil ». Messages exacts : voir le tableau « Activation » de la spec.
- L'envoi ne ralentit ni ne fait échouer l'action de l'expéditeur : toujours dans `after()`, erreurs journalisées sans données personnelles (ni endpoint ni nom).
- La permission n'est demandée que dans le clic sur « Activer sur cet appareil ».
- Architecture : routes `/api` + services serveur ; pas de Server Actions. Mobile d'abord, zinc + ambre, mode sombre (`dark:`).
- **Jamais de `pnpm db:push` sans l'accord de Paul** (`prisma.config.ts` lit `.env`, base de l'app). `pnpm db:generate` est sans risque.
- Ne pas toucher ni indexer `.gitignore` (ligne `.gstack/` non commitée, hors sujet).
- Commits en français, terminés par une ligne vide puis `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Appareil désabonné ou expiré (le service répond 404/410) → supprimé de la base, les autres appareils reçoivent quand même, l'expéditeur n'en sait rien. (Task 1 : test `isGonePushStatus` ; Task 2 : boucle d'envoi par appareil avec `Promise.allSettled`.)
2. Clés VAPID absentes ou incomplètes (dev, ou oubli dans Vercel) → aucune exception, action de l'expéditeur réussie. (Task 1 : tests `readVapidConfig`.)
3. iPhone dans Safari, app non installée (pas de `PushManager`) → message « ajoutez à l'écran d'accueil », pas « non disponible ». (Task 3 : test `getPushUiState`.)
4. Même téléphone, autre compte connecté → l'appareil suit le compte qui s'abonne ; après déconnexion, il ne reçoit plus rien. (Task 2 : upsert par `endpoint` ; Task 3 : désabonnement à la déconnexion.)
5. Corps d'abonnement invalide (endpoint `http:`, clés vides ou trop longues, pas un objet) → 400 sans écriture. (Task 1 : tests `parsePushSubscriptionInput`.)

---

### Task 1: Logique pure partagée et dépendances

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml` (dépendances)
- Create: `src/lib/push/types.ts`, `src/lib/push/payload.ts`, `src/lib/push/validation.ts`, `src/lib/push/config.ts`
- Test: `src/lib/push/payload.test.ts`, `src/lib/push/validation.test.ts`, `src/lib/push/config.test.ts`

**Interfaces:**
- Produces:
  - `types.ts` :
    - `TPushPayload = { title: string; body: string; url: string; tag: string }` ;
    - `TPushEvent = { type: "movie_night_invite"; fromName: string; movieNightId: string } | { type: "friend_request"; fromName: string; fromUserId: string } | { type: "suggestion"; fromName: string; fromUserId: string; title: string; mediaType: "movie" | "tv"; tmdbId: number }` ;
    - `TPushSubscriptionInput = { endpoint: string; p256dh: string; auth: string }`.
  - `payload.ts` : `buildPushPayload(event: TPushEvent): TPushPayload`.
  - `validation.ts` : `parsePushSubscriptionInput(body: unknown): TPushSubscriptionInput | null` (corps = `PushSubscription.toJSON()`, `{ endpoint, keys: { p256dh, auth } }`) ; `parsePushEndpoint(body: unknown): string | null` (corps `{ endpoint }`) ; constantes `MAX_ENDPOINT_LENGTH = 2048`, `MAX_KEY_LENGTH = 200`.
  - `config.ts` : `TVapidConfig = { publicKey: string; privateKey: string; subject: string }` ; `readVapidConfig(env: Record<string, string | undefined>): TVapidConfig | null` (null si une des trois variables manque ou est vide, ou si `subject` ne commence ni par `mailto:` ni par `https://`) ; `isGonePushStatus(status: number | undefined): boolean` (vrai pour 404 et 410).

- [ ] **Step 1: Installer les dépendances**

Run: `pnpm add web-push@3.6.7 && pnpm add -D @types/web-push@3.6.4`
Expected: `package.json` liste `"web-push": "3.6.7"` (ou `^3.6.7`) et `"@types/web-push"`.

- [ ] **Step 2: Tests (échouent)**

```ts
// payload.test.ts
expect(buildPushPayload({ type: "movie_night_invite", fromName: "Paul", movieNightId: "mn1" })).toEqual({
  title: "Paul vous invite à « Ce soir ? »",
  body: "Rejoignez la partie pour choisir un film ensemble.",
  url: "/ce-soir", tag: "movie-night-mn1",
});
expect(buildPushPayload({ type: "friend_request", fromName: "Léa", fromUserId: "u2" })).toEqual({
  title: "Léa vous a demandé en ami", body: "Répondez depuis votre profil.",
  url: "/profile", tag: "friend-request-u2",
});
expect(buildPushPayload({ type: "suggestion", fromName: "Max", fromUserId: "u3", title: "Fight Club", mediaType: "movie", tmdbId: 550 })).toEqual({
  title: "Max vous propose « Fight Club »", body: "Un film à découvrir sur votre profil.",
  url: "/profile", tag: "suggestion-u3-movie-550",
});
expect(buildPushPayload({ type: "suggestion", fromName: "Max", fromUserId: "u3", title: "Dark", mediaType: "tv", tmdbId: 70523 }).body)
  .toBe("Une série à découvrir sur votre profil.");

// validation.test.ts
const valid = { endpoint: "https://fcm.googleapis.com/fcm/send/abc", keys: { p256dh: "BNc_x-1", auth: "tBH-q_9" } };
expect(parsePushSubscriptionInput(valid)).toEqual({ endpoint: valid.endpoint, p256dh: "BNc_x-1", auth: "tBH-q_9" });
expect(parsePushSubscriptionInput({ ...valid, expirationTime: null })).not.toBeNull();
it.each([
  [null], ["x"], [{}],
  [{ ...valid, endpoint: "http://fcm.googleapis.com/x" }],
  [{ ...valid, endpoint: "pas une url" }],
  [{ ...valid, endpoint: "https://a.b/" + "x".repeat(2048) }],
  [{ ...valid, keys: { p256dh: "", auth: "a" } }],
  [{ ...valid, keys: { p256dh: "a+b/c=", auth: "a" } }],   // pas du base64url
  [{ ...valid, keys: { p256dh: "a".repeat(201), auth: "a" } }],
  [{ endpoint: valid.endpoint }],
])("refuse %j", (body) => expect(parsePushSubscriptionInput(body)).toBeNull());
expect(parsePushEndpoint({ endpoint: valid.endpoint })).toBe(valid.endpoint);
expect(parsePushEndpoint({ endpoint: "http://x" })).toBeNull();
expect(parsePushEndpoint(null)).toBeNull();

// config.test.ts
const env = { NEXT_PUBLIC_VAPID_PUBLIC_KEY: "pub", VAPID_PRIVATE_KEY: "priv", VAPID_SUBJECT: "mailto:a@b.fr" };
expect(readVapidConfig(env)).toEqual({ publicKey: "pub", privateKey: "priv", subject: "mailto:a@b.fr" });
expect(readVapidConfig({ ...env, VAPID_SUBJECT: "https://exemple.fr" })).not.toBeNull();
expect(readVapidConfig({ ...env, VAPID_PRIVATE_KEY: undefined })).toBeNull();
expect(readVapidConfig({ ...env, NEXT_PUBLIC_VAPID_PUBLIC_KEY: "" })).toBeNull();
expect(readVapidConfig({ ...env, VAPID_SUBJECT: "a@b.fr" })).toBeNull();
expect([404, 410].every(isGonePushStatus)).toBe(true);
expect([undefined, 400, 413, 429, 500].some(isGonePushStatus)).toBe(false);
```

- [ ] **Step 3: Lancer les tests, ils échouent**

Run: `pnpm test src/lib/push`
Expected: FAIL (modules introuvables).

- [ ] **Step 4: Implémenter `types.ts`, `payload.ts`, `validation.ts`, `config.ts`**

Base64url = `/^[A-Za-z0-9_-]+$/`. Endpoint : `new URL()` dans un try/catch, protocole `https:`.

- [ ] **Step 5: Lancer les tests, ils passent**

Run: `pnpm test src/lib/push`
Expected: PASS.

- [ ] **Step 6: Vérifier et commiter**

Run: `pnpm exec tsc --noEmit -p . && pnpm lint && pnpm test`
Expected: aucune erreur.

```bash
git add package.json pnpm-lock.yaml src/lib/push
git commit -m "Notifications push : contenu, validation et configuration (logique pure)"
```

---

### Task 2: Serveur — abonnements, envoi, déclencheurs

**Files:**
- Modify: `prisma/schema.prisma` (modèle `PushSubscription`, relation sur `User`)
- Create: `src/lib/server/services/push.service.ts`
- Modify: `src/lib/server/services/index.ts`
- Create: `src/app/api/me/push-subscriptions/route.ts`
- Modify: `src/lib/server/services/friends.service.ts` (`addFriend`), `src/app/api/friends/route.ts`
- Modify: `src/app/api/suggestions/route.ts`
- Modify: `src/lib/server/services/movieNight.service.ts` (`inviteFriend`), `src/app/api/movie-night/[id]/invites/route.ts`

**Interfaces:**
- Consumes: Task 1 (`TPushEvent`, `TPushSubscriptionInput`, `buildPushPayload`, `parsePushSubscriptionInput`, `parsePushEndpoint`, `readVapidConfig`, `isGonePushStatus`).
- Produces (exportés depuis `@/lib/server/services`) :
  - `savePushSubscription(userId: string, input: TPushSubscriptionInput): Promise<void>` : upsert par `endpoint`, `userId` remis à l'utilisateur courant ;
  - `deletePushSubscription(userId: string, endpoint: string): Promise<void>` : `deleteMany` par `endpoint` + `userId` ;
  - `schedulePushNotification(userId: string, event: TPushEvent): void` : appelle `after()` de `next/server` avec l'envoi. À appeler depuis un Route Handler uniquement.
  - `addFriend` → `{ success: true; receiverId: string }` en cas de succès (erreurs inchangées).
  - `inviteFriend` → `TResult<{ invited: boolean }>` : `invited` vaut `true` quand une ligne passe ou est créée en `INVITED`, `false` quand l'ami était déjà `JOINED` (y compris la course de création). Réponse HTTP de la route inchangée (`{ ok: true }`).
  - `POST /api/me/push-subscriptions` → 204 ; `DELETE /api/me/push-subscriptions` → 204 ; 401 sans session ; 400 corps invalide ; `Cache-Control: no-store`.

- [ ] **Step 1: Schéma**

Modèle `PushSubscription` exactement comme dans la section « Données » de la spec, plus `pushSubscriptions PushSubscription[]` sur `User`. Puis `pnpm db:generate` (pas de `db:push`).

- [ ] **Step 2: `push.service.ts`**

- Configuration : `readVapidConfig(process.env)`, puis `webpush.setVapidDetails(subject, publicKey, privateKey)` une seule fois (variable de module). Config nulle → `console.warn` une seule fois, puis plus rien.
- Envoi (fonction interne `sendPushToUser(userId, payload)`) :
  - lire les abonnements de l'utilisateur ;
  - `Promise.allSettled` sur `webpush.sendNotification({ endpoint, keys: { p256dh, auth } }, JSON.stringify(payload), { TTL: 86_400 })` ;
  - pour chaque échec dont `isGonePushStatus(error.statusCode)` : supprimer l'abonnement (`deleteMany` par `endpoint`) ;
  - autres échecs : `console.error` avec le seul code de statut.
  - La fonction ne lève jamais (try/catch global, erreur journalisée).
- `schedulePushNotification(userId, event)` : `after(() => sendPushToUser(userId, buildPushPayload(event)))`.

- [ ] **Step 3: Route `/api/me/push-subscriptions`**

`POST` : session requise, `parsePushSubscriptionInput(await request.json())` (corps illisible → 400), `savePushSubscription`, réponse `new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } })`. `DELETE` : même chose avec `parsePushEndpoint` et `deletePushSubscription`.

- [ ] **Step 4: Déclencheurs**

Nom de l'expéditeur : `userDisplayName(current.user)` (`src/lib/server/services/movieNightState.ts`).

- `POST /api/friends` : après le succès, `schedulePushNotification(result.receiverId, { type: "friend_request", fromName, fromUserId: current.user.id })`.
- `POST /api/suggestions` : après le succès, `schedulePushNotification(receiverId, { type: "suggestion", fromName, fromUserId: user.id, title, mediaType, tmdbId: tmdbMovieId })`, avec le `media_type` normalisé de la route.
- `POST /api/movie-night/[id]/invites` : si le résultat est `ok` et `invited`, lire `getCurrentSession()` (l'hôte qui invite est forcément connecté) puis `schedulePushNotification(friendUserId, { type: "movie_night_invite", fromName, movieNightId: id })`.

- [ ] **Step 5: Vérifier et commiter**

Run: `pnpm exec tsc --noEmit -p . && pnpm lint && pnpm test`
Expected: aucune erreur, tous les tests passent.

```bash
git add prisma/schema.prisma src/lib/server src/app/api
git commit -m "Notifications push : abonnements des appareils et envoi sur invitation, demande d'ami et proposition"
```

---

### Task 3: Client — service worker, section « Notifications », pastille, déconnexion

**Files:**
- Modify: `public/sw.js`
- Create: `src/features/Notifications/utils/pushSupport.ts`
- Test: `src/features/Notifications/utils/pushSupport.test.ts`
- Create: `src/features/Notifications/utils/devicePush.ts`
- Create: `src/features/Notifications/services/push-subscriptions.service.ts`
- Create: `src/features/Notifications/hooks/usePushNotifications.ts`
- Create: `src/features/Notifications/components/PushNotificationsSettings.tsx`
- Modify: `src/features/Profile/View/ProfileView.tsx`
- Modify: `src/features/Notifications/hooks/useAppBadge.ts`
- Modify: `src/providers/AuthProvider.tsx` (`logout`)

**Interfaces:**
- Consumes: Task 2 (`POST`/`DELETE /api/me/push-subscriptions`, corps `PushSubscription.toJSON()` / `{ endpoint }`) ; Task 1 (`TPushPayload` : champs lus par le service worker).
- Produces:
  - `pushSupport.ts` (pur) :
    - `urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer>` ;
    - `TPushUiState = "unsupported" | "needs_install" | "no_service_worker" | "denied" | "off" | "on"` ;
    - `getPushUiState(input: { hasPushApi: boolean; isIos: boolean; isStandalone: boolean; hasServiceWorker: boolean; permission: NotificationPermission; subscribed: boolean }): TPushUiState` ;
    - `isIosUserAgent(userAgent: string, maxTouchPoints: number): boolean` (iPhone/iPad/iPod, ou « Macintosh » avec écran tactile).
  - `devicePush.ts` (navigateur, ne lève jamais sauf `subscribeDevice`) :
    - `readDevicePush(): Promise<{ state: TPushUiState; subscription: PushSubscription | null }>` ;
    - `subscribeDevice(): Promise<PushSubscription>` ;
    - `unsubscribeDevice(): Promise<void>`.
    - Toujours `navigator.serviceWorker.getRegistration()`, jamais `.ready` (qui ne se résout pas en dev, où le service worker n'est pas enregistré).
  - `usePushNotifications(): { state: TPushUiState | "loading"; isWorking: boolean; error: string | null; enable(): Promise<void>; disable(): Promise<void> }`.
  - `PushNotificationsSettings()` : section « Notifications ».

- [ ] **Step 1: Tests de `pushSupport` (échouent)**

```ts
const base = { hasPushApi: true, isIos: false, isStandalone: false, hasServiceWorker: true,
  permission: "default" as NotificationPermission, subscribed: false };
expect(getPushUiState(base)).toBe("off");
expect(getPushUiState({ ...base, subscribed: true, permission: "granted" })).toBe("on");
expect(getPushUiState({ ...base, permission: "denied" })).toBe("denied");
expect(getPushUiState({ ...base, hasServiceWorker: false })).toBe("no_service_worker");
expect(getPushUiState({ ...base, hasPushApi: false })).toBe("unsupported");
// iPhone dans Safari, non installé : pas de PushManager, mais il faut proposer l'installation
expect(getPushUiState({ ...base, isIos: true, hasPushApi: false })).toBe("needs_install");
expect(getPushUiState({ ...base, isIos: true, isStandalone: true })).toBe("off");
expect(getPushUiState({ ...base, isIos: true, isStandalone: true, hasPushApi: false })).toBe("unsupported"); // iOS < 16.4

expect(isIosUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)", 5)).toBe(true);
expect(isIosUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5)).toBe(true);  // iPad
expect(isIosUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0)).toBe(false); // Mac
expect(isIosUserAgent("Mozilla/5.0 (Linux; Android 14)", 5)).toBe(false);

expect(Array.from(urlBase64ToUint8Array("AQID_-8"))).toEqual([1, 2, 3, 255, 239]);
```

- [ ] **Step 2: Lancer les tests, ils échouent**

Run: `pnpm test src/features/Notifications`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Implémenter `pushSupport.ts`**

Ordre de `getPushUiState` : `needs_install` (iOS non installé), puis `unsupported`, `no_service_worker`, `denied`, `on` (abonné), `off`.

- [ ] **Step 4: Lancer les tests, ils passent**

Run: `pnpm test src/features/Notifications`
Expected: PASS.

- [ ] **Step 5: Service worker**

Dans `public/sw.js`, ajouter :
- `push` : `event.waitUntil(self.registration.showNotification(title, { body, icon: "/app192.png", tag, data: { url } }))`. Données absentes ou JSON illisible : titre « My Watchlist », URL `/`.
- `notificationclick` : fermer la notification. URL retenue = `data.url` si c'est une chaîne qui commence par `/` mais pas par `//`, sinon `/`. Chercher un client fenêtre de la même origine (`clients.matchAll({ type: "window", includeUncontrolled: true })`) : `focus()` puis `navigate(url)`. Sinon `clients.openWindow(url)`.
- Ne pas changer la logique de cache ni `CACHE_VERSION`.

- [ ] **Step 6: `devicePush.ts`, service client, hook**

- `readDevicePush` : `hasPushApi` = `"PushManager" in window && "Notification" in window && "serviceWorker" in navigator`. `isStandalone` = `matchMedia("(display-mode: standalone)").matches` ou `navigator.standalone === true`. `permission` = `Notification.permission` si disponible, sinon `"default"`. Abonnement : `registration?.pushManager.getSubscription()`.
- `subscribeDevice` :
  - `Notification.requestPermission()` (appelé dans le geste du clic) ; refus → erreur ;
  - `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) })` ;
  - clé publique absente → erreur.
- `unsubscribeDevice` : si un abonnement existe, `DELETE` serveur puis `subscription.unsubscribe()`, chaque étape dans un try/catch.
- Service client (`credentials: "include"`, `fetch`, erreur si `!res.ok`) : `sendPushSubscription(subscription: PushSubscriptionJSON): Promise<void>` et `removePushSubscription(endpoint: string): Promise<void>` (noms distincts des fonctions serveur de Task 2).
- Hook `usePushNotifications` :
  - au montage, `readDevicePush()` ; si abonné, renvoyer l'abonnement au serveur sans bloquer l'affichage (un échec est ignoré) ;
  - `enable` : `subscribeDevice` puis `sendPushSubscription` ; en cas d'échec, `error` = « Impossible d'activer les notifications. Réessayez. », sauf permission refusée → état `denied` ;
  - `disable` : `removePushSubscription` puis `subscription.unsubscribe()` ; en cas d'échec, `error` = « Impossible de désactiver les notifications. Réessayez. ».
  - Pas de TanStack Query ici (état local de l'appareil) : `useState` + `useEffect`.

- [ ] **Step 7: Section, profil, pastille, déconnexion**

- `PushNotificationsSettings` :
  - rendu de chaque état exactement selon le tableau « Activation » de la spec ;
  - `"loading"` → rien ;
  - titre `h2` « Notifications » avec l'icône `Bell` de lucide-react, dans le même style que les autres titres de section de `ProfileView` ;
  - boutons : ambre pour « Activer sur cet appareil », bordure pour « Désactiver », désactivés pendant `isWorking` ;
  - `error` dans un `role="alert"`.
- `ProfileView` : insérer `<PushNotificationsSettings />` juste après `<WatchTimeStats />`.
- `useAppBadge` : supprimer l'appel à `Notification.requestPermission()`, garder le reste. Mettre à jour le commentaire : la permission vient du bouton « Activer sur cet appareil ».
- `AuthProvider.logout` : appeler `await unsubscribeDevice()` avant la requête de déconnexion. `unsubscribeDevice` ne lève jamais, donc la déconnexion n'est jamais bloquée.

- [ ] **Step 8: Vérifier et commiter**

Run: `pnpm exec tsc --noEmit -p . && pnpm lint && pnpm test`
Expected: aucune erreur, tous les tests passent.

```bash
git add public/sw.js src/features/Notifications src/features/Profile/View/ProfileView.tsx src/providers/AuthProvider.tsx
git commit -m "Notifications push : section Notifications du profil, service worker et désabonnement à la déconnexion"
```

---

### Task 4: Base, clés de dev et vérification

**Files:** `.env.local` (clés de dev, non commité). Aucun autre fichier, sauf corrections.

- [ ] **Step 1: Appliquer le schéma — demander à Paul d'abord**

S'arrêter et demander à Paul sur quelle(s) base(s) lancer `pnpm db:push` (`.env.local` via `set -a; . ./.env.local; set +a`, et/ou `.env`). Changement additif : nouvelle table `PushSubscription`.

- [ ] **Step 2: Clés de dev**

Run: `pnpm exec web-push generate-vapid-keys --json`. Ajouter à `.env.local` (sans afficher la clé privée dans la sortie ni la conversation) :
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` ;
- `VAPID_PRIVATE_KEY` ;
- `VAPID_SUBJECT=mailto:notifications@example.com` (valeur de dev, à remplacer par Paul en prod).

- [ ] **Step 3: Vérification locale (build de production, service worker actif)**

Run: `pnpm build && pnpm exec next start -p 3107`.
- `curl` sans session : `POST` et `DELETE /api/me/push-subscriptions` → 401.
- `GET /sw.js` contient les gestionnaires `push` et `notificationclick`.
- Logs du serveur sans erreur au démarrage.

Expected : comportements ci-dessus. Le parcours complet (abonnement, réception sur téléphone) est vérifié par Paul après déploiement : il faut un compte connecté et un vrai appareil.

- [ ] **Step 4: Commit des corrections éventuelles**

Seulement si la vérification a demandé des corrections, avec un message « Notifications push : … ».
