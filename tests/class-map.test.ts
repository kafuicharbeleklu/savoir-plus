import test from 'node:test';
import assert from 'node:assert/strict';
import { PASS_THRESHOLD, classMapRows, masteryLevel, remediationSource, weakQuestions } from '../src/classMap';
import { pendingCount, relatedSentences, splitSource } from '../src/aiReview';
import type { ModuleFollowUp } from '../src/pages/school/shared';
import type { ModuleStat } from '../src/studioStats';

const row = (patch: Partial<ModuleFollowUp>): ModuleFollowUp => ({
  moduleId: 'm',
  title: 'Module',
  lessonsRead: 0,
  lessonCount: 3,
  percent: 0,
  quiz: 'none',
  score: null,
  ...patch
});

test('carte de classe : cinq niveaux, du pas commencé au maîtrisé', () => {
  assert.equal(masteryLevel(row({})), 0);
  assert.equal(masteryLevel(row({ lessonsRead: 1 })), 1);
  assert.equal(masteryLevel(row({ lessonsRead: 3 })), 2);
  assert.equal(masteryLevel(row({ lessonsRead: 3, quiz: 'failed', score: 33 })), 2);
  assert.equal(masteryLevel(row({ lessonsRead: 3, quiz: 'passed', score: 67 })), 3);
  assert.equal(masteryLevel(row({ lessonsRead: 3, quiz: 'passed', score: 100 })), 4);
});

test('carte de classe : les élèves à accompagner d’abord, quiz à retenter en tête à niveau égal', () => {
  const rows = classMapRows([
    { uid: 'a', name: 'Abla', rows: [row({ lessonsRead: 3, quiz: 'passed', score: 100 })] },
    { uid: 'c', name: 'Codjo', rows: [row({ lessonsRead: 3 })] },
    { uid: 'b', name: 'Bénédicte', rows: [row({ lessonsRead: 3, quiz: 'failed', score: 33 })] }
  ]);
  assert.deepEqual(
    rows.map((r) => r.uid),
    ['b', 'c', 'a']
  );
  assert.equal(rows[0].toRetake, 1);
  assert.equal(rows[2].validated, 1);
  assert.match(rows[0].cells[0].detail, /Quiz à retenter · 33 %/);
});

const stat = (id: string, rates: (number | null)[], submitted = 10): ModuleStat => ({
  id,
  title: id,
  domain: 'Numérique',
  learners: 10,
  validated: 0,
  inProgress: 0,
  completion: null,
  submitted,
  reachRate: null,
  passRate: null,
  avgScore: null,
  steps: [],
  questions: rates.map((rate, i) => ({ label: `Question ${i + 1}`, text: `Q${i + 1}`, correct: 0, correctRate: rate }))
});

test('questions les moins réussies : de la plus ratée à la mieux réussie, hors modules sans quiz envoyé', () => {
  const list = weakQuestions([stat('a', [80, 43]), stat('b', [57, null]), stat('c', [10], 0)], 3);
  assert.deepEqual(
    list.map((q) => `${q.moduleId}${q.index}`),
    ['a1', 'b0', 'a0']
  );
  assert.ok(list[0].correctRate < PASS_THRESHOLD);
});

test('fiche de rattrapage : la question, sa réponse, puis la leçon la plus proche, sans donnée d’élève', () => {
  const text = remediationSource('email-pro', 1, 43);
  assert.match(text, /^Fiche de rattrapage sur une question que la classe réussit à 43 %/);
  assert.match(text, /Bonne réponse : Par la demande elle-même\./);
  assert.match(text.split('\n\n')[1], /^Une demande, une structure\./, 'la leçon sur la demande vient en premier');
  assert.ok(!/\.\.|\. ;/.test(text), 'aucune ponctuation doublée');
  assert.ok(text.length <= 6000);
  assert.ok(remediationSource('email-pro', 1, 43, 400).length <= 400);
  assert.equal(remediationSource('inconnu', 0, 50), '');
});

test('relecture : phrases proches du bloc ouvert, et aucun brouillon avant une décision sur chaque bloc', () => {
  const paragraphs = splitSource(
    'La règle 3-2-1 protège vos fichiers. Gardez trois copies sur deux supports.\nUne copie reste hors de chez vous. Testez la restauration chaque mois.'
  );
  assert.equal(paragraphs.length, 2);
  assert.equal(paragraphs[0].length, 2);
  const related = relatedSentences(paragraphs, 'Tester la restauration : chaque mois, restaurer un fichier pour vérifier la sauvegarde.');
  assert.deepEqual([...related], ['1-1']);
  assert.equal(relatedSentences(paragraphs, '').size, 0);
  assert.equal(pendingCount([true, null], [false], []), 1);
  assert.equal(pendingCount([true], [false]), 0);
});
