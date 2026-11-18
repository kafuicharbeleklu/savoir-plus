import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { InfoPage, isInfoTopic } from '../src/pages/InfoPage';

const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const page = (topic: string, extra: Partial<React.ComponentProps<typeof InfoPage>> = {}) =>
  text(renderToStaticMarkup(<InfoPage topic={topic} nav={() => {}} canPublish isGuardian={false} isLocal onStartTour={() => {}} {...extra} />));

test('pages d’information : une page seule par rubrique, sans onglets vers les autres', () => {
  assert.ok(isInfoTopic('privacy'));
  assert.ok(!isInfoTopic('inconnu'));
  // La page s'ouvre sur son titre et son texte ; aucune rangée d'onglets vers les autres rubriques.
  assert.match(page('about'), /^ ?À propos Ce qu’est SAVOIR\+/);
  assert.doesNotMatch(page('about'), /Accessibilité Centre d’aide Confidentialité et conditions/);
  assert.match(page('privacy'), /^ ?Confidentialité et conditions Ce qui reste privé/);
  assert.match(page('accessibility'), /WCAG 2\.2, niveau AA/);
  assert.match(page('privacy'), /La caméra n’est jamais utilisée/);
  assert.match(page('hackathon'), /Le rôle de l’IA/);
  // Une adresse inconnue retombe sur « À propos ».
  assert.match(page('inconnu'), /Ce qu’est SAVOIR\+/);
});

test('centre d’aide : aucun lien vers ce que le compte ne peut pas faire', () => {
  const learner = page('help');
  assert.match(learner, /Poser une question à la communauté/);
  assert.match(learner, /Lancer la visite guidée/);
  assert.doesNotMatch(learner, /Espace famille/);
  const parent = page('help', { canPublish: false, isGuardian: true, isLocal: false, onStartTour: undefined });
  assert.doesNotMatch(parent, /Poser une question à la communauté/);
  assert.doesNotMatch(parent, /Lancer la visite guidée/);
  assert.match(parent, /Espace famille/);
});
