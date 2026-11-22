import test from 'node:test';
import assert from 'node:assert/strict';
import {
  completeLesson,
  emptyProgress,
  xp,
  progressPercent,
  canSend,
  pairId,
  score,
  scoreAnswers,
  moduleProgressPercent,
  moduleXp,
  canRequestContactByPolicy
} from '../src/domain.mjs';

test('Relecture sans double XP, progression finale exacte', () => {
  let p = completeLesson(emptyProgress(), 0);
  p = completeLesson(p, 0);
  assert.equal(xp(p), 25);
  assert.equal(progressPercent(p), 25);
  p = completeLesson(completeLesson(p, 1), 2);
  p.submitted = true;
  assert.equal(xp(p), 150);
  assert.equal(progressPercent(p), 100);
});

test('Chat interdit avant consentement, aux tiers et après blocage', () => {
  const r = { members: ['a', 'b'], status: 'pending', blockedBy: [] };
  assert.equal(canSend(r, 'a'), false);
  r.status = 'accepted';
  assert.equal(canSend(r, 'a'), true);
  assert.equal(canSend(r, 'c'), false);
  r.blockedBy = ['b'];
  assert.equal(canSend(r, 'a'), false);
});

test('Paire stable et correction des trois questions', () => {
  assert.equal(pairId('b', 'a'), pairId('a', 'b'));
  assert.throws(() => pairId('a', 'a'));
  assert.equal(score([1, 2, 0]), 3);
  assert.equal(score([0, 0, 1]), 0);
});

test('Scoring multi-modules, progression et XP paramétrés sans doublons', () => {
  assert.equal(scoreAnswers([0, 1, 2], [0, 1, 2]), 3);
  assert.equal(scoreAnswers([1, 1, 0], [0, 1, 2]), 1);
  const partial = { lessons: [0, 0, 1], answers: [0, 1, 2], submitted: false };
  assert.equal(moduleProgressPercent(partial, 3), 50);
  assert.equal(moduleXp(partial, 3), 50);
  const done = { lessons: [0, 1, 2], answers: [0, 1, 2], submitted: true };
  assert.equal(moduleProgressPercent(done, 3), 100);
  assert.equal(moduleXp(done, 3), 150);
});

test('Politique de demande de contact S-05 (Personne, Personnes que je suis, Membres autorisés)', () => {
  assert.equal(canRequestContactByPolicy('Personne', true, false), false);
  assert.equal(canRequestContactByPolicy('Personnes que je suis', false, false), false);
  assert.equal(canRequestContactByPolicy('Personnes que je suis', true, false), true);
  assert.equal(canRequestContactByPolicy('Membres autorisés', false, false), true);
  assert.equal(canRequestContactByPolicy('Membres autorisés', true, true), false);
});

test('XP : selon le niveau et le nombre de sections', async () => {
  const { lessonXp, quizXp, moduleMaxXp, moduleXp, completeLesson } = await import('../src/domain.mjs');
  // Une section : 20, 25, 30, 35, 40 XP du niveau 1 (Initiation) au niveau 5 (Expert) ; le quiz en vaut trois.
  assert.deepEqual([1, 2, 3, 4, 5].map((r) => lessonXp(r)), [20, 25, 30, 35, 40]);
  assert.deepEqual([1, 2, 3, 4, 5].map((r) => quizXp(r)), [60, 75, 90, 105, 120]);
  // Sans niveau précisé : les valeurs d'avant (Débutant).
  assert.equal(moduleMaxXp(3), 150);
  // Un module Expert de cinq sections rapporte plus qu'un module Initiation de trois.
  assert.equal(moduleMaxXp(5, 5), 320);
  assert.equal(moduleMaxXp(3, 1), 120);
  const done = { lessons: [0, 1, 2, 3, 4], answers: [0, 0], submitted: true };
  assert.equal(moduleXp(done, 5, [0, 0], 5), 320);
  assert.equal(moduleXp({ lessons: [0, 4], answers: [], submitted: false }, 5, [0, 0], 3), 60);
  // Une quatrième section se valide, une section hors du module non.
  assert.deepEqual(completeLesson({ lessons: [0], answers: [], submitted: false }, 3, 5).lessons, [0, 3]);
  assert.throws(() => completeLesson({ lessons: [], answers: [], submitted: false }, 3));
});
