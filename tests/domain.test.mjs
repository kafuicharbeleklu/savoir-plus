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

