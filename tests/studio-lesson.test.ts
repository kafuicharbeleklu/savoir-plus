import test from 'node:test';
import assert from 'node:assert/strict';
import { lessonCountOf, resolveStudyContent } from '../src/content';
import { moduleMaxXp } from '../src/domain.mjs';
import { lessonIssues } from '../src/lessonFormat';
import { levelRank } from '../src/levels';
import { evaluateStudioReadiness } from '../src/personas';
import { LANGUAGE_TARGETS, languageIssues, textStats } from '../src/readability';
import {
  FIGURE_KINDS,
  GEOMETRY_TEMPLATES,
  figureFromText,
  figureToText,
  formatGoals,
  hasRichWork,
  isFigureReady,
  isRichReady,
  isSectionComplete,
  moduleMinutes,
  newRichSection,
  reviewSection,
  richOfSection,
  sectionCountAdvice,
  toRichSection,
  toSimpleSection,
  type StudioSection
} from '../src/studioLesson';
import { buildDynamicCatalog, initialExtendedState, studioLevel, type StudioContent } from '../src/wireframeData';

/** Une section de CM2 écrite au clavier : apostrophes droites, phrases courtes. */
const fractions: StudioSection = {
  ...newRichSection('s-fractions', 'Partager en parts égales'),
  body: "Une fraction dit combien de parts on prend dans un tout.",
  scene: "Kokou coupe une orange en huit quartiers. Il en mange trois. Il reste cinq quartiers pour sa soeur.",
  parts: [
    { title: 'Le dénominateur', text: "Le nombre du bas dit en combien de parts égales on a coupé l'orange." },
    { title: 'Le numérateur', text: "Le nombre du haut dit combien de parts on prend.\n\nOn lit : trois huitièmes.", items: ['3 : les parts prises', '8 : les parts en tout'] }
  ],
  example: {
    title: "L'orange de Kokou",
    caption: 'Trois huitièmes mangés',
    notes: ["L'orange est coupée en 8 parts égales.", 'Kokou en prend 3.'],
    figure: figureFromText('fraction', '3/8 | La part de Kokou')
  },
  question: { ask: 'Et si les parts ne sont pas égales ?', answer: "Alors ce n'est pas une fraction : les parts doivent être égales." },
  keyPoints: ['Le bas dit en combien on coupe.', 'Le haut dit combien on prend.'],
  tip: 'Comptez toujours les parts du tout avant de lire la fraction.'
};

test('niveau de langue : les phrases se mesurent, les repères suivent la classe', () => {
  const stats = textStats('Le chat dort. Il rêve de **souris** ; la nuit tombe.');
  assert.equal(stats.sentences, 3);
  assert.equal(stats.words, 10);
  assert.equal(stats.longest.words, 4);
  assert.ok(LANGUAGE_TARGETS.early.avgWords < LANGUAGE_TARGETS.junior.avgWords && LANGUAGE_TARGETS.junior.avgWords < LANGUAGE_TARGETS.standard.avgWords);

  const long =
    'Kokou coupe une orange en huit quartiers égaux pour la partager avec ses camarades, puis il en mange trois sans attendre. ' +
    'Ensuite il compte les quartiers qui restent sur la table avant de les ranger dans un bol.';
  // La même phrase passe au lycée, pas au CE1.
  assert.equal(languageIssues(long, 'Terminale').length, 0);
  const ce1 = languageIssues(long, 'CE1');
  assert.ok(ce1.some((issue) => issue.startsWith('Phrases longues pour le niveau « CP1 à CE2 »')));
  assert.ok(ce1.some((issue) => /^Une phrase de \d+ mots/.test(issue)));
  // Un texte trop court ne se juge pas.
  assert.deepEqual(languageIssues('Bonjour à tous.', 'CP1'), []);
});

test('Studio : une section au format complet devient une leçon aux règles de nos cours', () => {
  const rich = richOfSection(fractions, 0)!;
  assert.deepEqual(lessonIssues(rich), []);
  // L'apostrophe du clavier devient l'apostrophe courbe, sans rien demander au créateur.
  assert.equal(rich.example.title, 'L’orange de Kokou');
  assert.ok(rich.sections[0].text[0].includes('l’orange'));
  assert.deepEqual(rich.sections[1].text, ['Le nombre du haut dit combien de parts on prend.', 'On lit : trois huitièmes.']);
  assert.deepEqual(rich.sections[1].items, ['3 : les parts prises', '8 : les parts en tout']);
  assert.ok(isSectionComplete(fractions, 0) && isRichReady(fractions, 0));

  // Une section neuve dit, bloc par bloc, ce qu'il reste à écrire.
  const blank = reviewSection(newRichSection('s1'), 0, 'CM2');
  assert.deepEqual([...new Set(blank.todo.map((item) => item.block))], ['head', 'scene', 'course', 'example', 'question', 'summary']);
  assert.ok(blank.todo.filter((item) => item.block === 'summary').every((item) => !item.required));
  assert.equal(isSectionComplete(newRichSection('s1'), 0), false);
  assert.deepEqual(reviewSection(fractions, 0, 'CM2').todo, []);

  // Une section simple reste valable ; passée au format complet, elle garde son texte.
  const simple: StudioSection = { id: 's2', title: 'Le masque', body: 'Le masque sépare le réseau de l’appareil. Il se lit de gauche à droite.' };
  assert.ok(isSectionComplete(simple, 0) && !isRichReady(simple, 0));
  const converted = toRichSection(simple);
  assert.equal(converted.body, 'Le masque sépare le réseau de l’appareil.');
  assert.equal(converted.parts?.[0].text, 'Il se lit de gauche à droite.');
  assert.equal(hasRichWork(converted), false);
  assert.equal(hasRichWork(fractions), true);
  const back = toSimpleSection(fractions);
  assert.equal(back.format, 'simple');
  assert.ok(back.body.includes('Kokou coupe une orange') && back.parts === undefined && back.example === undefined);
});

test('Studio : une figure se saisit en texte, les objectifs se ponctuent seuls', () => {
  const table = figureFromText('table', 'Masse | Poids\n100 g | 1 N\n500 g');
  assert.deepEqual(table, { kind: 'table', head: ['Masse', 'Poids'], rows: [['100 g', '1 N'], ['500 g', '']] });
  assert.equal(figureToText(table), 'Masse | Poids\n100 g | 1 N\n500 g | ');
  assert.equal(isFigureReady(table), true);
  assert.equal(isFigureReady(figureFromText('table', '')), false);

  const split = figureFromText('split', 'Loyer | 40 | la plus grosse dépense\nRepas | 35\nÉpargne | 25 %');
  assert.equal(split.kind === 'split' && split.parts.map((part) => part.percent).join('+'), '40+35+25');
  assert.equal(isFigureReady(split), true);
  assert.equal(isFigureReady(figureFromText('split', 'Loyer | 40\nRepas | 35')), false);

  const flow = figureFromText('flow', 'Le puits | eau brute | on filtre\nLa jarre | eau potable');
  assert.equal(flow.kind === 'flow' && flow.nodes.length === 2 && flow.links[0], 'on filtre');
  assert.equal(figureToText(flow), 'Le puits | eau brute | on filtre\nLa jarre | eau potable');

  const fraction = figureFromText('fraction', '3/8 | La part de Kokou');
  assert.deepEqual(fraction, { kind: 'fraction', shape: 'disc', items: [{ taken: 3, parts: 8, label: 'La part de Kokou' }] });
  assert.equal(isFigureReady(figureFromText('fraction', '9/8 | Trop')), false);

  // Chaque figure de géométrie type se trace telle quelle ; chaque exemple de saisie donne une figure valide.
  for (const template of GEOMETRY_TEMPLATES) assert.equal(isFigureReady(template.figure), true, template.id);
  for (const kind of FIGURE_KINDS.filter((k) => k.sample)) assert.equal(isFigureReady(figureFromText(kind.kind, kind.sample)), true, kind.kind);
  assert.equal(isFigureReady({ kind: 'image', src: '', alt: '' }), false);

  assert.deepEqual(formatGoals(['Lire une fraction.', "dessiner une fraction d'un disque", ' Comparer deux fractions ; ', '']), [
    'lire une fraction ;',
    'dessiner une fraction d’un disque ;',
    'comparer deux fractions.'
  ]);
});

test('Studio : le module publié se lit comme un cours, avec le niveau, la durée et les XP de sa classe', () => {
  const ext = initialExtendedState();
  const quiz = [{ prompt: 'Que dit le dénominateur ?', options: ['Les parts en tout', 'Les parts prises'], correctIndex: 0, explanation: 'Le bas dit en combien on coupe.' }];
  const draft: StudioContent = {
    ...ext.studioContents[0],
    id: 'st-fractions',
    type: 'module',
    title: 'Les fractions',
    domain: 'Scolaire',
    classLabel: 'CM2',
    goals: ['Lire une fraction', 'Dessiner une fraction'],
    sources: 'Cours de Kossi Agbo',
    duration: '',
    pubStatus: 'Publié',
    published: undefined,
    quiz,
    sections: [fractions, { ...fractions, id: 's-b', title: 'Comparer' }, { ...fractions, id: 's-c', title: 'Additionner' }, { ...fractions, id: 's-d', title: 'Simplifier' }]
  };

  // Le niveau se déduit de la classe ; les XP suivent le niveau et le nombre de sections.
  assert.equal(studioLevel(draft), 'Initiation');
  assert.equal(studioLevel({ ...draft, classLabel: undefined, level: 'Avancé' }), 'Avancé');
  const catalog = buildDynamicCatalog({ ...ext, studioContents: [...ext.studioContents, draft] });
  const item = catalog.find((c) => c.id === 'st-fractions')!;
  assert.equal(item.level, 'Initiation');
  assert.equal(item.classLabel, 'CM2');
  assert.equal(item.xpReward, moduleMaxXp(4, levelRank('Initiation')));
  assert.deepEqual(item.objectives, ['Lire une fraction.', 'Dessiner une fraction.']);
  assert.equal(lessonCountOf('st-fractions', catalog), 4);

  // Le lecteur reçoit des leçons au format complet et les objectifs mis en forme.
  const study = resolveStudyContent('st-fractions', [draft]);
  assert.equal(study.lessons.length, 4);
  assert.ok(study.lessons.every((lesson) => lesson.rich && lessonIssues(lesson.rich).length === 0));
  assert.equal(study.lessons[0].intro, 'Une fraction dit combien de parts on prend dans un tout.');
  assert.deepEqual(study.goals, ['lire une fraction ;', 'dessiner une fraction.']);
  assert.equal(moduleMinutes(draft.sections, quiz.length, 'CM2'), 4 * 1 + 1);

  // Vérifications : tout est prêt ; une section au format complet non finie bloque la publication.
  const ready = evaluateStudioReadiness(draft, { media: [] });
  assert.equal(ready.canPublish, true);
  assert.deepEqual(
    ready.checks.filter((c) => ['format', 'language', 'pacing'].includes(c.id)).map((c) => [c.id, c.ok, c.blocking]),
    [['format', true, false], ['language', true, false], ['pacing', true, false]]
  );
  const unfinished = evaluateStudioReadiness({ ...draft, sections: [...draft.sections.slice(0, 3), { ...newRichSection('s-e', 'Multiplier'), body: 'Une phrase.' }] }, { media: [] });
  assert.equal(unfinished.canPublish, false);
  assert.match(unfinished.checks.find((c) => c.id === 'structure')!.detail, /Section 4 : le format complet n’est pas fini/);
  // Une section simple ne bloque pas, mais le format est signalé ; un module de deux sections aussi.
  const mixed = evaluateStudioReadiness({ ...draft, goals: undefined, sections: [fractions, { id: 's-x', title: 'Suite', body: 'Un texte simple.' }] }, { media: [] });
  assert.equal(mixed.canPublish, true);
  assert.equal(mixed.checks.find((c) => c.id === 'format')!.detail, '1 section sur 2 au format complet des cours');
  assert.equal(mixed.checks.find((c) => c.id === 'pacing')!.ok, false);
  assert.equal(sectionCountAdvice(4, 'CM2'), null);
  assert.match(sectionCountAdvice(9, 'CE1') || '', /4 au plus/);

  // Un brouillon incomplet se lit en texte simple une fois publié… et au format complet dans l'aperçu.
  const halfDone = { ...draft, sections: [{ ...newRichSection('s-h', 'En cours'), body: 'Une phrase.', scene: 'Une situation.' }] };
  assert.equal(resolveStudyContent('st-fractions', [halfDone]).lessons[0].rich, undefined);
  assert.ok(resolveStudyContent('st-fractions', [halfDone], undefined, { draft: true }).lessons[0].rich);
});
