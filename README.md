# SAVOIR+ — Démonstrateur hackathon

Plateforme d’apprentissage et d’entraide : modules courts, communauté, et des espaces pour les familles, les encadrants et les établissements. React 19, TypeScript, Vite 8. La démonstration fonctionne sans compte (données dans le navigateur) ; un mode connecté s’appuie sur Supabase (Auth, PostgreSQL, Realtime).

## Démarrer en local

Node 22 ou plus récent, puis dans ce dossier :

```sh
npm ci            # en cas de conflit de dépendances : npm ci --legacy-peer-deps
npm run dev       # http://127.0.0.1:3000
```

Vérifier et construire :

```sh
npx tsc --noEmit
npm test                      # tests métier et tests d’affichage (126 au 18 novembre 2026)
npx vite build --base=./      # version statique dans dist/
```

Le routage par fragments `#` fonctionne sur tout hébergement statique, sans règle de réécriture. Versionner les sources et `package-lock.json` ; jamais `node_modules`, ni mot de passe, ni clé privée.

## Démonstration

Chaque personnage s’ouvre par l’adresse, `splash=0` évitant l’écran de lancement :

| Adresse | Personnage |
| --- | --- |
| `?as=afi&splash=0` | Afi, apprenante (offre gratuite : publicité obligatoire, modules payants à l’achat) |
| `?as=kossi&splash=0` | Kossi, encadrant et créateur de modules (formule Encadrant Pro, Studio) |
| `?as=nadege&splash=0` | Nadège, modération et gouvernance |
| `?as=akouvi&splash=0` | Akouvi, parent d’Elom et de Kokou (formule Famille) |
| `?as=elom&splash=0` | Elom, 17 ans, élève de Terminale D aux Palmiers |
| `?as=kokou&splash=0` | Kokou, 10 ans : son compte attend le code parental `PAR-7K3Q-9M2X` |
| `?as=palmiers&splash=0` | Les Palmiers, établissement (formule Pilotage) |

- **Visite guidée** : `?visite=1` ou menu Vous › Visite guidée. Douze étapes en quatre rôles (apprenante, parent, établissement, encadrant) ; la visite change elle-même de personnage et de page.
- Un personnage par onglet : les onglets se relisent quand l’un d’eux enregistre (une pause décidée par un parent arrive chez l’enfant sans recharger).
- Les données de démonstration vivent dans le navigateur (`savoir-extended-v1`). Pour repartir de zéro : Paramètres › Confidentialité des données › Réinitialiser la démonstration.

Ce que la démonstration montre :

- **Accueil propre à chaque profil** : recommandations avec leur raison (« Donné à Terminale D »), fil ordonné pour le lecteur.
- **Module section par section** : chaque section a sa page (l’exercice dans la sienne), puis le quiz final et le résultat ont chacun la leur, dans la même interface (barre d’avancement, sommaire, colonne de lecture).
- **Espace famille** : message de la semaine par enfant, plan de révision en Gantt, emploi du temps, contenus payants ; **verrouillage de SAVOIR+** pour un enfant de moins de 12 ans (pause, temps par jour, plage horaire, demandes de temps).
- **Espace encadrant** et **espace établissement** : vue d’ensemble, planification en Gantt, emploi du temps en grille, classes ; l’établissement gère aussi sa bibliothèque (contenus de ses enseignants, gratuits pour ses élèves). Un établissement n’a ni XP, ni progression, ni fil.
- **Formules en F CFA** : Paramètres › Préférences du compte › Abonnement. Apprenant+ et Famille incluent les contenus payants ; Famille ouvre le plan et l’emploi du temps des enfants ; Pilotage ouvre la vue d’ensemble et le Gantt de l’établissement ; toute formule payante rend la carte publicitaire facultative.

Sont **simulés**, avec une mention visible : paiements (achats, formules, mobile money), vérification d’identité, comptes de mineurs. Aucune pièce n’est reçue ni conservée ; la caméra n’est jamais utilisée.

## Projet Supabase

Projet `nkcgdgdiqawzhfpepzpd`, région eu-west-1. Configuration publique dans `src/supabase-public.json` (URL et clé publishable, destinées au navigateur) ; aucune clé service_role. Pour changer de projet, copier `.env.example` vers `.env.local`, renseigner les deux variables `VITE_SUPABASE_*`, puis reconstruire.

Les migrations `supabase/migrations/` sont appliquées au projet fourni ; pour un nouveau projet, les appliquer avec la CLI Supabase après liaison. Profils visibles entre membres authentifiés, progression privée, relations et messages limités aux participants, blocage géré par chacun ; `tests/supabase-rls.sql` vérifie ces règles (fixtures annulées par ROLLBACK).

La vie scolaire (classes, familles, verrouillage, formules) n’existe qu’en mode démonstration : elle n’est pas encore enregistrée dans Supabase.

## Limites connues

- Données de démonstration propres à chaque navigateur ; pas de synchronisation entre appareils en mode démonstration.
- Le verrouillage s’applique à SAVOIR+, pas au reste de l’appareil (un site ne peut pas verrouiller un téléphone).
- XP calculés côté navigateur : pédagogie, pas certification.
- Les vidéos d’illustration (licence Pexels) sont hébergées avec le site, dans `public/media`.
- Annoncés dans les formules mais pas encore réalisés : attestations de réussite (Apprenant+), limites et suivi réservés à Encadrant Pro, vente de modules.

## Livraison

Présentation finale : 5 décembre 2026. Ce README explique l’exécution du code ; le plan et les décisions sont tenus à part.
