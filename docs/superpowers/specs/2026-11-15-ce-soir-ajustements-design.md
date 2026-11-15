# « Ce soir ? » — ajustements : pile fixe, choix d'entrée, solo local

Complète `2026-11-15-ce-soir-design.md` ; ce document l'emporte en cas de
conflit. Demandé par Paul après la mise en ligne.

## Intention

- Le formulaire de création a un réglage de trop : la taille de pile.
- L'écran d'entrée mélange création et « Rejoindre avec un code » : on veut
  choisir d'abord ce qu'on vient faire.
- En solo, il n'y a personne à attendre : chaque vote écrit en base et le
  polling toutes les 2 s ne servent à rien, et l'étape « Match ! » non plus.

## Décisions de Paul

1. **Pile de 15 films, sans choix.** Le réglage disparaît du formulaire.
2. **Choix d'abord** : en arrivant sur « Ce soir ? », deux boutons,
   « Héberger » et « Rejoindre avec un code ». Le formulaire correspondant
   n'apparaît qu'après le choix.
3. **Solo sans base pendant la partie** : un « oui » termine la partie tout de
   suite (« Ce soir : *titre* »), sans vérification ni écran « Match ! ».
4. Accepté par Paul : l'unique appel du début lit les films « déjà vus » et
   mémorise les plateformes (deux accès à la base, avant de jouer).

## Approches

- **Retenue : solo dans le navigateur.** Une requête serveur construit la pile
  (clé TMDB et disponibilités par plateforme côté serveur) sans créer de
  session ; ensuite tout se passe dans le navigateur.
- Écartée : garder la session en base et raccourcir le vote. Les écritures et
  le polling que Paul veut supprimer resteraient.
- Écartée : construire la pile dans le navigateur. Exposerait la clé TMDB.

## Comportement

**Pile.** `DECK_SIZE = 15` pour le solo et le multi. La colonne `deck_size`
reste et vaut 15 : pas de changement de schéma. `deckSize` disparaît des
réglages et de l'API (ignoré s'il est encore envoyé).

**Écran d'entrée `/ce-soir`.**

```
Invitations reçues          (connecté, seulement s'il y en a)
[ Héberger ]                → plateformes, genres, déjà vus,
                              [Jouer seul] [Jouer à plusieurs], ← Retour
[ Rejoindre avec un code ]  → code (+ pseudo si non connecté), ← Retour
```

- Lien `/ce-soir?code=…` : ouvre directement « Rejoindre », code pré-rempli.
- « Héberger » sans être connecté : lien « Connectez-vous pour héberger ».

**Solo.**

- « Jouer seul » appelle `POST /api/movie-night/solo` (connecté)
  `{ providerIds, genreIds, includeSeen, excludedMovieIds? }` → `{ deck }`.
  Mémorise les plateformes, exclut les déjà-vus (sauf `includeSeen`) et
  `excludedMovieIds`. Aucune session créée. Erreurs comme la création
  (`no_movies` 422, `tmdb_error`).
- La partie se joue sur `/ce-soir/solo`, gardée dans le `sessionStorage` de
  l'onglet : un rechargement reprend où on en était. Sans partie enregistrée,
  la page renvoie vers `/ce-soir`.
- Swipe identique au multi (geste, boutons, flèches), en-tête « Quitter » et
  « n / 15 », sans avatars.
- **Oui** → écran « Ce soir : *titre* » (affiche, « Voir la fiche du film »,
  « Retour à Ce soir ? ») et un lien **« Reprendre la pile »** s'il reste des
  cartes, pour un swipe accidentel *(choix Claude)*.
- **Pile finie sans oui** → « Aucun film retenu », **« Nouvelle pile »** (une
  requête, sans les films déjà proposés) et « Retour à Ce soir ? ».
- Le chemin « solo » côté serveur (`solo: true` à la création) disparaît : la
  création d'une session part toujours en salle d'attente. Le multi ne change
  pas.

## Laissé au constructeur

Découpage des composants (partager la pile de cartes entre solo et multi),
format exact du `sessionStorage`, plafond de `excludedMovieIds`.
