import test from 'node:test';
import assert from 'node:assert/strict';
import type { AiRichSection } from '../src/ai';
import { audienceFor, isPlanReady, planRows, previewLesson, sectionFromAi } from '../src/aiLesson';
import { lessonIssues } from '../src/lessonFormat';
import { isRichReady, reviewSection } from '../src/studioLesson';

/** Une section telle que le service la renvoie (réponse réelle du 23 novembre 2026, raccourcie). */
const fromService: AiRichSection = {
  title: 'Réaliser une sauvegarde locale',
  lead: 'Vous allez apprendre à choisir vos dossiers essentiels et à les copier chaque semaine.',
  scene: "Camille rentre chez elle avec son ordinateur rempli de photos et de devoirs. Elle craint de perdre ses fichiers si l'appareil tombe en panne.",
  parts: [
    { title: 'Choisir les dossiers essentiels', text: "Avant de copier vos fichiers, repérez d'abord ce qui compte pour vous.\nSélectionnez vos **dossiers essentiels**.", items: ['Vos photos', 'Vos devoirs'] },
    { title: 'Copier chaque semaine', text: 'Copiez vos dossiers sur une clé USB ou un disque externe, au moins une **fois par semaine**.', items: [] }
  ],
  example: {
    title: "Les étapes d'une sauvegarde locale",
    figureKind: 'flow',
    figureText: 'Dossiers essentiels | photos, devoirs | on les copie\nSauvegarde locale | clé USB ou disque externe | on la range à part\nRangement | loin de l’ordinateur',
    caption: 'Copier ses fichiers, puis ranger le support',
    notes: ['On choisit d’abord les dossiers essentiels.', 'La copie se fait au moins une fois par semaine.']
  },
  question: { ask: 'Dois-je copier tout mon ordinateur ?', answer: "Non, il faut d'abord choisir vos dossiers essentiels." },
  keyPoints: ['Choisir ses dossiers essentiels.', 'Copier chaque semaine.'],
  tip: 'Chaque semaine, copiez vos dossiers essentiels puis rangez le support à part.'
};

test('IA : le public visé règle la langue et le nombre de sections demandés', () => {
  assert.deepEqual(audienceFor('CE1', 'Débutant'), { classLabel: 'CE1', avgWords: 12, maxWords: 20, maxSections: 4 });
  assert.deepEqual(audienceFor('3e', 'Expert'), { classLabel: '3e', avgWords: 18, maxWords: 25, maxSections: 6 });
  // Sans classe (contenu général) : le niveau choisi, les repères des adultes.
  assert.deepEqual(audienceFor(undefined, 'Avancé'), { level: 'Avancé', avgWords: 20, maxWords: 30, maxSections: 8 });
  assert.deepEqual(audienceFor('Cours du soir', 'Débutant'), { level: 'Débutant', avgWords: 20, maxWords: 30, maxSections: 8 });
});

test('IA : le plan se corrige avant la rédaction', () => {
  const rows = planRows({ sections: [{ title: 'Comprendre', idea: 'Trois copies.' }, { title: 'Tester', idea: 'On vérifie.' }] });
  assert.equal(rows.length, 2);
  assert.notEqual(rows[0].id, rows[1].id);
  assert.equal(isPlanReady(rows), true);
  assert.equal(isPlanReady([]), false);
  assert.equal(isPlanReady([{ ...rows[0], title: '  ' }]), false);
  assert.equal(isPlanReady(Array.from({ length: 9 }, (_, i) => ({ id: String(i), title: 'Section', idea: '' }))), false);
});

test('IA : une section proposée devient une section du Studio au format des cours', () => {
  const section = sectionFromAi(fromService, 'sec-1');
  assert.equal(section.format, 'rich');
  assert.equal(section.body, fromService.lead);
  assert.equal(section.example?.figure.kind, 'flow');
  // Une liste vide ne devient pas une liste ; une liste de deux éléments est gardée.
  assert.deepEqual(section.parts?.map((part) => part.items), [['Vos photos', 'Vos devoirs'], undefined]);
  // Elle est prête telle quelle : aucun bloc à finir, et le lecteur l'affiche comme un cours.
  assert.ok(isRichReady(section, 0));
  assert.deepEqual(reviewSection(section, 0, undefined).todo, []);
  const lesson = previewLesson(section, 0);
  assert.deepEqual(lessonIssues(lesson.rich!), []);
  assert.equal(lesson.rich!.example.title, 'Les étapes d’une sauvegarde locale');
  assert.equal(lesson.intro, fromService.lead);

  // La source ne permettait pas de figure : l'exemple reste à finir, la section n'est pas inventée.
  const noFigure = sectionFromAi({ ...fromService, example: { title: '', figureKind: 'none', figureText: '', caption: '', notes: [] } }, 'sec-2');
  assert.equal(noFigure.example?.figure.kind, 'table');
  assert.equal(isRichReady(noFigure, 1), false);
  assert.ok(reviewSection(noFigure, 1, undefined).todo.every((item) => item.block === 'example'));
  // Une figure mal décrite (répartition qui ne fait pas 100) n'est pas gardée ; une seule partie en appelle une seconde.
  const badFigure = sectionFromAi({ ...fromService, parts: fromService.parts.slice(0, 1), example: { ...fromService.example, figureKind: 'split', figureText: 'Loyer | 40\nRepas | 35' } }, 'sec-3');
  assert.equal(badFigure.example?.figure.kind, 'table');
  assert.equal(badFigure.parts?.length, 2);
});
