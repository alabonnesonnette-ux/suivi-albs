# Suivi ALBS

Outil interne de la conciergerie **À La Bonne Sonnette** : litiges, suivis logement, audits, ménages, prospects.

En ligne : https://suivi-albs.netlify.app

## Comment c'est organisé

- `site/` : l'application elle-même (c'est ce dossier que Netlify met en ligne).
  - `index.html` : toute l'appli (affichage + logique).
  - `sw.js`, `manifest.webmanifest`, icônes : pour l'installer comme une appli sur téléphone.
  - `_headers` : réglages d'affichage pour Netlify.
- `supabase/functions/rappels/` : la fonction qui envoie les rappels (elle tourne chez Supabase, pas sur Netlify).
- `netlify.toml` : dit à Netlify de publier le dossier `site`.

## Pour faire une modification

Demande-la à Claude en lui donnant ce dépôt (`alabonnesonnette-ux/suivi-albs`).
Dès qu'une modification est enregistrée ici, Netlify met le site à jour tout seul en 1 à 2 minutes.
Toutes les anciennes versions restent dans l'historique : on peut toujours revenir en arrière.

**Ne plus glisser de dossier à la main sur Netlify** : la version en ligne doit toujours venir d'ici.

## Données

Les données (logements, dossiers, ménages…) sont dans Supabase, pas dans ce dépôt.
Modifier le code ne touche pas aux données.

Les codes secrets (clés Supabase privées, secret des rappels) ne doivent jamais être mis dans ce dépôt.
