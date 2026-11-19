import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { InfoPage, isInfoTopic, type InfoPageProps } from '../src/pages/InfoPage';
import { HELP_ARTICLES, LEGAL_DOCS, searchHelp } from '../src/infoContent';

const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const base: InfoPageProps = { path: 'about', nav: () => {}, firstName: 'Afi', canPublish: true, learns: true, isGuardian: false, isLocal: true, onStartTour: () => {} };
const page = (path: string, extra: Partial<InfoPageProps> = {}) => text(renderToStaticMarkup(<InfoPage {...base} {...extra} path={path} />));

test('pages d’information : chacune sa page, hors de l’application, sur le modèle LinkedIn', () => {
  assert.ok(isInfoTopic('privacy'));
  assert.ok(!isInfoTopic('inconnu'));
  // Bandeau réduit au logo, aucune navigation de l'application, aucun onglet vers les autres rubriques.
  const about = page('about');
  assert.match(about, /^ ?SAVOIR \+ S \+ À propos de SAVOIR\+/);
  assert.doesNotMatch(about, /Mes apprentissages|Messagerie|Accessibilité Centre d’aide/);
  assert.match(about, /Vision .* Mission .* Pour qui/);
  assert.match(page('accessibility'), /Chacun doit pouvoir apprendre sur SAVOIR\+ .* Notre objectif .* WCAG 2\.2, niveau AA/);
  assert.match(page('inconnu'), /À propos de SAVOIR\+/);
});

test('centre d’aide : salutation, recherche, raccourcis, sujets, articles ; chaque article a sa page', () => {
  const help = page('help');
  assert.match(help, /Aide Bonjour Afi, nous sommes là pour vous aider\./);
  assert.match(help, /Raccourcis SAVOIR\+ .* Sujets Informations de base Apprendre Communauté Famille Établissements et encadrants Compte et confidentialité/);
  assert.match(help, /Articles suggérés/);
  assert.match(help, /Autres moyens de vous aider Règles de la communauté/);
  const article = page('help/valider-un-module');
  assert.match(article, /Aide Apprendre Valider un module : le quiz final/);
  assert.match(article, /deux bonnes réponses sur trois/);
  assert.match(article, /Retour à l’aide/);
  // Aucun lien vers ce que le compte ne peut pas faire.
  const parent = page('help', { canPublish: false, learns: false, isGuardian: true, isLocal: false, onStartTour: undefined });
  assert.doesNotMatch(parent, /Lancer la visite guidée/);
  assert.doesNotMatch(text(renderToStaticMarkup(<InfoPage {...base} canPublish={false} path="help/poser-une-question" />)), /Poser une question/);
  // La recherche ignore accents et majuscules.
  assert.deepEqual(searchHelp(HELP_ARTICLES, 'VERROUILLAGE enfant').map((a) => a.id), ['verrouillage']);
  assert.equal(searchHelp(HELP_ARTICLES, 'zzzz').length, 0);
});

test('confidentialité et conditions : documents reliés, grand titre, date d’entrée en vigueur', () => {
  assert.deepEqual(LEGAL_DOCS.map((d) => d.id), ['privacy', 'terms', 'community', 'ads']);
  const privacy = page('privacy');
  assert.match(privacy, /Politique de confidentialité Conditions d’utilisation Règles de la communauté Publicité Politique de confidentialité Entrée en vigueur le 18 novembre 2026/);
  assert.match(privacy, /la caméra n’est jamais utilisée/);
  assert.match(page('privacy/ads'), /Publicité Entrée en vigueur .* Qui peut annoncer/);
});

test('formules : page publique par public, prix en F CFA ramené à l’élève, comparaison, paiement simulé', () => {
  assert.ok(isInfoTopic('pricing'));
  const school = page('pricing/institution', { viewerAudience: 'institution', currentOfferId: 'institution-steering' });
  assert.match(school, /Formules Formules en francs CFA Apprendre reste gratuit\. Les outils se paient\./);
  assert.match(school, /ses élèves apprennent avec les contenus de leurs enseignants sans rien payer/);
  assert.match(school, /Essentiel Jusqu’à 150 élèves\. 15 000 F CFA \/ mois soit 100 F CFA par élève et par mois Choisir Essentiel/);
  assert.match(school, /Pilotage Jusqu’à 500 élèves\. 35 000 F CFA \/ mois soit 70 F CFA par élève et par mois Votre formule/);
  assert.match(school, /Réseau .* Sur devis selon le nombre d’élèves et de sites Prix établi avec l’équipe SAVOIR\+/);
  assert.match(school, /Comparer les formules .* La planification du trimestre en diagramme de Gantt Non inclus Inclus Inclus/);
  assert.match(school, /Paiement Mixx by Yas · Flooz · Carte bancaire Démonstration : le paiement est simulé, aucun argent n’est débité\./);
  // Les formules d'un autre public : pas de bouton, à qui elles s'adressent.
  const seenByLearner = page('pricing/institution', { viewerAudience: 'learner', currentOfferId: 'learner-free' });
  assert.doesNotMatch(seenByLearner, /Choisir Essentiel/);
  assert.match(seenByLearner, /Pour les comptes établissement/);
  // Sans public dans l'adresse : celui du compte qui regarde.
  const family = page('pricing', { viewerAudience: 'family', currentOfferId: 'free' });
  assert.match(family, /Gratuite .* Votre formule .* Famille .* 2 500 F CFA \/ mois .* Choisir Famille/);
  assert.doesNotMatch(family, /Comparer les formules/);
});
