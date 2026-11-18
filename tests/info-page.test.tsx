import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { InfoPage, isInfoTopic } from '../src/pages/InfoPage';

const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const page = (topic: string, extra: Partial<React.ComponentProps<typeof InfoPage>> = {}) =>
  text(renderToStaticMarkup(<InfoPage topic={topic} nav={() => {}} canPublish isGuardian={false} isLocal onStartTour={() => {}} {...extra} />));

test('pages d’information : de vraies pages, une rubrique par onglet', () => {
  assert.ok(isInfoTopic('privacy'));
  assert.ok(!isInfoTopic('inconnu'));
  // Les cinq rubriques, toujours accessibles par les onglets ; le titre n'est lu que par les lecteurs d'écran.
  assert.match(page('about'), /À propos Accessibilité Centre d’aide Confidentialité et conditions Hackathon/);
  assert.match(page('about'), /Ce qu’est SAVOIR\+/);
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
