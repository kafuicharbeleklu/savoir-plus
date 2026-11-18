/**
 * Les leçons rédigées : chaque partie de chaque module en a une, bien formée ; le module s'ouvre par
 * son bandeau et ses objectifs, puis les parties se suivent sur la même page (titre, sous-parties,
 * figure légendée, question, résumé).
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MODULES_CONTENT, type LessonRich, type StudyLesson } from '../src/content';
import { LESSONS_RICH, MODULE_GOALS } from '../src/lessonsRich';
import { goalsIssues, lessonIssues } from '../src/lessonFormat';
import { LessonPart, ModuleOpening } from '../src/components/LessonArticle';
import { ModuleInteractiveLab } from '../src/components/LessonLab';
import { AcademyReaderView, AcademyResultView } from '../src/pages/AcademyStudyPages';

const moduleIds = Object.keys(MODULES_CONTENT);

test('chaque partie de chaque module a sa leçon rédigée', () => {
  assert.ok(moduleIds.length >= 7);
  for (const id of moduleIds) {
    const lessons = MODULES_CONTENT[id].lessons;
    assert.equal(LESSONS_RICH[id]?.length, lessons.length, `module ${id}`);
    lessons.forEach((lesson, i) => assert.ok(lesson.rich, `${id}, partie ${i + 1}`));
  }
});

test('chaque module a ses objectifs, bien formés', () => {
  for (const id of moduleIds) {
    assert.deepEqual(MODULES_CONTENT[id].goals, MODULE_GOALS[id], `module ${id}`);
    assert.equal(MODULE_GOALS[id].length, 3, `module ${id}`);
    assert.deepEqual(goalsIssues(MODULE_GOALS[id]), [], `module ${id}`);
  }
  const issues = goalsIssues(['Dire ce que cherche le message ;', 'repérer les signaux']);
  assert.ok(issues.some((issue) => issue.includes('sans majuscule')));
  assert.ok(issues.some((issue) => issue.includes('doit finir par « . »')));
  assert.ok(goalsIssues(['un seul objectif.']).includes('objectifs : de deux à quatre'));
});

test('les leçons rédigées respectent le format', () => {
  for (const [id, lessons] of Object.entries(LESSONS_RICH)) {
    lessons.forEach((rich, i) => assert.deepEqual(lessonIssues(rich), [], `${id}, partie ${i + 1}`));
  }
});

test('le résumé et le réflexe de chaque partie sont remplis', () => {
  for (const id of moduleIds) {
    for (const lesson of MODULES_CONTENT[id].lessons) {
      assert.ok(lesson.points.length >= 2, `${id} — ${lesson.title}`);
      assert.ok(lesson.tip.trim().length > 0, `${id} — ${lesson.title}`);
      // L'encadré s'ouvre déjà par « Le réflexe à garder. » : le texte ne le répète pas.
      assert.ok(!/^le bon réflexe/i.test(lesson.tip), `${id} — ${lesson.title}`);
    }
  }
});

const sample = (): LessonRich => structuredClone(LESSONS_RICH.phishing[0]);

test('le contrôle de forme signale les défauts', () => {
  const straight = sample();
  straight.scene = "Un texte avec l'apostrophe droite.";
  assert.ok(lessonIssues(straight).includes('apostrophe droite dans un texte'));

  const noQuestion = sample();
  noQuestion.question.ask = 'Ce n’est pas une question.';
  assert.ok(lessonIssues(noQuestion).some((issue) => issue.includes('se termine par « ? »')));

  const badSplit = sample();
  badSplit.example.figure = { kind: 'split', parts: [{ label: 'A', percent: 60, note: 'x' }, { label: 'B', percent: 30, note: 'y' }] };
  assert.ok(lessonIssues(badSplit).includes('exemple : les parts doivent faire 100 %'));

  const badFlow = sample();
  badFlow.example.figure = { kind: 'flow', nodes: [{ art: 'laptop', label: 'A' }, { art: 'globe', label: 'B' }], links: [] };
  assert.ok(lessonIssues(badFlow).includes('exemple : une flèche entre chaque élément du schéma'));

  const badTable = sample();
  badTable.example.figure = { kind: 'table', head: ['A', 'B'], rows: [['1']] };
  assert.ok(lessonIssues(badTable).some((issue) => issue.includes('bon nombre de cases')));
});

const render = (lesson: StudyLesson, index = 0, practice: React.ReactNode = null) =>
  renderToStaticMarkup(<LessonPart lesson={lesson} index={index} practice={practice} />);

test('le module s’ouvre par son en-tête, sa présentation et ses objectifs', () => {
  const html = renderToStaticMarkup(
    <ModuleOpening
      title="Ne tombez plus dans le piège"
      domain="Numérique"
      summary="Apprenez à reconnaître un e-mail de phishing."
      goals={MODULE_GOALS.phishing}
      art="alert"
      seed="phishing"
      minutes={10}
      questionCount={3}
      hasPractice
    />
  );
  // Le titre, les durées par type d'activité et l'illustration tiennent dans l'en-tête, côte à côte.
  assert.match(html, /<header class="rd-hero rd-wide">/);
  assert.match(html, /<h1>Ne tombez plus dans le piège<\/h1>/);
  assert.match(html, /Module · Numérique/);
  assert.match(html, /10 min de lecture/);
  assert.match(html, /1 exercice/);
  assert.match(html, /Quiz de 3 questions/);
  assert.match(html, /class="art-scene[^"]* rd-hero-art"/);
  assert.ok(!html.includes('Lu<'));
  // La présentation et les objectifs viennent après l'en-tête, en texte simple (pas d'encadré sous l'image).
  const afterHero = html.slice(html.indexOf('</header>'));
  assert.match(afterHero, /Apprenez à reconnaître un e-mail de phishing\./);
  assert.match(afterHero, /À la fin de ce module, vous saurez :/);
  assert.equal(afterHero.match(/<li>/g)?.length, 3);
  assert.ok(!afterHero.includes('rd-aside'));

  // Un contenu du Studio : pas d'illustration ni d'objectifs, seulement l'en-tête.
  const plain = renderToStaticMarkup(<ModuleOpening title="Créer un tableau" minutes={2} questionCount={0} read />);
  assert.match(plain, /<header class="rd-hero rd-wide is-plain">/);
  assert.ok(!plain.includes('art-scene'));
  assert.ok(!plain.includes('vous saurez'));
  assert.ok(!plain.includes('Quiz de'));
  assert.match(plain, /Lu<\/li>/);
});

test('une partie rédigée a son titre, ses sous-parties, sa figure, sa question et son résumé', () => {
  const lesson = MODULES_CONTENT.phishing.lessons[0];
  const html = render(lesson);
  // Le titre de la partie sert d'ancre au sommaire.
  assert.match(html, /<h2 id="partie-1" class="rd-part-title" tabindex="-1">/);
  assert.equal(html.match(/<h2/g)?.length, 1);
  assert.match(html, /class="rd-art-badge"/);
  // Une sous-partie par point du cours, une pour l'exemple, une pour le résumé.
  assert.equal(html.match(/<h3>/g)?.length, lesson.rich!.sections.length + 2);
  assert.match(html, /<figure class="rd-figure rd-wide is-message">/);
  assert.match(html, /<figcaption>Un SMS frauduleux qui réunit les trois signaux<\/figcaption>/);
  assert.match(html, /class="rd-aside rd-wide is-question"/);
  assert.match(html, /<h3>En résumé<\/h3>/);
  assert.match(html, /Le réflexe à garder\./);
  // Le gras des textes devient du gras, pas des astérisques.
  assert.ok(!html.includes('**'));
  // Sans exercice, pas de sous-partie « À vous de jouer ».
  assert.ok(!html.includes('À vous de jouer'));
  // Les ancres suivent l'ordre des parties.
  assert.match(render(MODULES_CONTENT.phishing.lessons[2], 2), /<h2 id="partie-3"/);
});

test('chaque type de figure s’affiche', () => {
  const kinds = new Set<string>();
  for (const [id, lessons] of Object.entries(LESSONS_RICH)) {
    lessons.forEach((rich, i) => {
      const html = render(MODULES_CONTENT[id].lessons[i], i);
      const kind = rich.example.figure.kind;
      kinds.add(kind);
      const marker = { message: 'rd-msg ', timeline: 'rd-timeline', table: 'rd-table', flow: 'rd-flow', split: 'rd-split-bar' }[kind];
      assert.ok(html.includes(`class="${marker}`), `${id}, partie ${i + 1} : ${kind}`);
      assert.ok(!html.includes('**'), `${id}, partie ${i + 1} : gras non converti`);
    });
  }
  assert.deepEqual([...kinds].sort(), ['flow', 'message', 'split', 'table', 'timeline']);
});

test('une partie créée dans le Studio garde le même cadre, avec son seul paragraphe', () => {
  const lesson: StudyLesson = {
    title: 'Créer un tableau',
    label: 'Fiche',
    minutes: '2 min',
    intro: 'Un tableau se prépare avant de se remplir.',
    body: 'Commencez par les titres de colonnes.',
    points: ['Les titres d’abord.', 'Une donnée par case.'],
    tip: 'Gardez une ligne par élément.'
  };
  const html = render(lesson, 0, <p>exercice</p>);
  assert.match(html, /Commencez par les titres de colonnes\./);
  assert.ok(!html.includes('rd-art-badge'));
  assert.ok(!html.includes('rd-figure'));
  // Le titre de l'exercice est une ancre : le sommaire y mène.
  assert.match(html, /<h3 id="exercice" tabindex="-1">À vous de jouer<\/h3>/);
  assert.match(html, /<h3>En résumé<\/h3>/);
});

test('l’exercice montre sa scène et annonce le nombre d’indices', () => {
  const mail = renderToStaticMarkup(<ModuleInteractiveLab labType="phishing" />);
  assert.match(mail, /0 sur 4/);
  assert.equal(mail.match(/rd-lab-zone /g)?.length, 4);
  assert.match(mail, /securite-client\.test/);
  // Rien n'est trouvé au départ : pas de liste d'indices, pas de message de fin.
  assert.ok(!mail.includes('rd-lab-findings'));
  assert.ok(!mail.includes('rd-lab-done'));

  for (const labType of ['reseaux', 'comptes', 'generic'] as const) {
    const html = renderToStaticMarkup(<ModuleInteractiveLab labType={labType} />);
    assert.match(html, /0 sur 3/, labType);
    assert.equal(html.match(/rd-lab-zone is-row/g)?.length, 3, labType);
  }
});

test('le résultat du quiz, sur son écran, garde l’interface du cours', () => {
  const m = MODULES_CONTENT.reseaux;
  const noop = () => {};
  const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  // Le cadre du cours : la barre du haut, le sommaire à gauche, la colonne de lecture.
  const inCourseFrame = (html: string) =>
    html.startsWith('<div class="rd-shell is-chapter"><header class="rd-top">') && html.includes('<aside class="rd-outline"') && html.includes('class="rd-article rd-chapter-main"');
  const reader = renderToStaticMarkup(
    <AcademyReaderView moduleContent={m} progress={{ lessons: [], answers: [], submitted: false }} lessonIndex={0} answers={[]} setAnswers={noop} busy={false} onFinishReading={noop} onSubmitQuiz={noop} onOpenResult={noop} onExit={noop} />
  );
  assert.ok(inCourseFrame(reader));
  const result = (answers: number[]) =>
    renderToStaticMarkup(
      <AcademyResultView moduleContent={m} progress={{ lessons: [0, 1, 2], answers, submitted: true }} onRetryQuiz={noop} onReviewLessons={noop} onOpenLearning={noop} onExit={noop} totalXP={150} />
    );

  const passed = result(m.questions.map((q) => q.correctIndex));
  assert.ok(inCourseFrame(passed), 'même cadre que la page du cours');
  assert.match(text(passed), /Résultat du quiz .* Module validé .* Correction Question 1 sur 3/);
  // Le quiz final est la partie en cours du sommaire.
  assert.match(passed, /<li class="rd-step is-done is-current"><button type="button" aria-current="location">.*?Quiz final/);

  // La correction reprend les cartes du quiz : la réponse donnée (✕ si fausse) et la bonne réponse sont nommées.
  const failed = result([(m.questions[0].correctIndex + 1) % 3, m.questions[1].correctIndex, -1]);
  assert.match(text(failed), /Révision conseillée/);
  assert.equal(failed.match(/rd-card rd-question-card rd-correction/g)?.length, 3);
  assert.equal(failed.match(/rd-option is-static is-wrong/g)?.length, 1);
  assert.equal(failed.match(/Bonne réponse<\/small>/g)?.length, 2);
  assert.match(text(failed), /Question 3 sur 3 · sans réponse/);
});
