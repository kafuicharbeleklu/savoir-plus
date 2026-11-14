# SAVOIR+ — Démonstrateur hackathon

React / TypeScript / Vite, avec Supabase Auth, PostgreSQL et Realtime. Firebase a été retiré. Le mode local Afi/Kossi reste disponible sans compte et conserve ses données dans le navigateur.

## Éditer et démarrer en local

Installer Node 22+, extraire l’archive, ouvrir ce dossier dans son éditeur puis :

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
```

Le routage par fragments `#` fonctionne sur hébergement statique. Le dossier `dist/` contient la version compilée. Versionner les sources et package-lock.json avec Git ; ne pas versionner node_modules, mots de passe ou clés privées.

## Projet Supabase

Projet SAVOIR+ : `nkcgdgdiqawzhfpepzpd`, région eu-west-1. Configuration publique dans `src/supabase-public.json` : URL et clé publishable, destinées au navigateur. Aucune clé service_role. Pour changer de projet, copier `.env.example` vers `.env.local`, renseigner les deux variables VITE_SUPABASE_* puis recompiler.

Les migrations `supabase/migrations/` ont été appliquées au projet fourni. Pour un nouveau projet, appliquer ces migrations avec la CLI Supabase après liaison au projet cible. Ne pas réexécuter manuellement une migration déjà appliquée.

1. Dans Supabase Authentication, préparer deux comptes de démonstration e-mail/mot de passe. Conserver les mots de passe hors du dépôt et du chat. L’application ne propose pas d’inscription publique.
2. Dans SAVOIR+, ouvrir Vous → Réglages / personnages, puis le formulaire de connexion Supabase.
3. Le profil du compte est initialisé à la première connexion. Modifier le nom dans Mon profil pour distinguer les comptes.
4. Ouvrir un second navigateur avec le second compte. Envoyer une invitation, l’accepter, échanger, puis bloquer et vérifier le refus d’envoi.

Les profils sont visibles entre membres authentifiés ; la progression est privée. Relations et messages sont limités aux participants. Seul le destinataire accepte une invitation. Chaque membre peut gérer son propre blocage ; débloquer ne réactive pas le consentement. Les horodatages sont fixés par PostgreSQL. Realtime actualise l’interface, avec relecture périodique de secours. Une erreur distante ne produit pas de faux message local.

## Recette effectuée le 13 novembre 2026

- Compilation TypeScript/Vite et 3 tests métier réussis.
- `tests/supabase-rls.sql` exécuté sur le projet : isolation de progression, refus des tiers/anonymes, interdiction d’auto-acceptation, envoi après consentement, blocage, déblocage sans réactivation, participants immuables. Les fixtures sont annulées par ROLLBACK.
- Parcours local desktop vérifié précédemment : leçons, quiz, progression, relations, messages et blocage. Correction v0.31 : Messagerie dans la barre supérieure ouvre la page complète ; Message sur un contact ouvre le chat rapide desktop. Le brouillon est conservé.
- À faire : recette avec deux véritables sessions Supabase et recette sur téléphone. Les tests SQL ne prouvent pas l’authentification ni la réception Realtime dans deux navigateurs.

## Démonstration en 4 minutes

Accueil → module phishing → trois leçons → quiz → résultat → Mes apprentissages. Puis Relations : invitation Afi vers Kossi, changement de personnage dans Réglages, acceptation et message, retour Afi puis blocage. Le mode local fonctionne entre onglets de même origine, pas entre deux ordinateurs. Le mode connecté utilise des comptes Supabase distincts.

## Limites

Un module actif ; un second en aperçu. XP calculés côté client : pédagogie, pas certification. Pas d’IA intégrée, pièces jointes, modération administrative, indicateurs de lecture ou présence distante. Les 100 messages les plus récents sont affichés. Après refus/déblocage, pas de réinvitation automatique. Aucune migration des données locales vers Supabase. Aucun ancien stockage Firebase réel n’existait à migrer.

## Livraison

Soumission : 14 novembre 2026 à 15 h 30 UTC. Présentation finale : 5 décembre. Le référentiel consolidé conserve le plan, la fiche de soumission et les décisions ; ce README explique uniquement l’exécution du code. Le site existant reste public ; sa publication doit être vérifiée avant de soumettre le lien au jury.
