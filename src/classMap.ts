/**
 * Carte d'une classe pour l'encadrant : où en est chaque élève sur chaque module, en cinq niveaux,
 * puis les questions que la classe réussit le moins, et le texte qui sert à préparer une fiche de
 * rattrapage. Rien n'expose une réponse individuelle : la carte se fonde sur l'avancement et la note
 * au quiz (déjà visibles dans le suivi d'un élève), les questions sur des totaux de la classe.
 */
import { AI_SOURCE_MAX } from './ai';
import { MODULES_CONTENT, type StudyLesson } from './content';
import type { ModuleStat } from './studioStats';
import type { ModuleFollowUp } from './pages/school/shared';

export type MasteryLevel = 0 | 1 | 2 | 3 | 4;

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  0: 'Pas commencé',
  1: 'Découvert',
  2: 'En cours',
  3: 'Acquis',
  4: 'Maîtrisé'
};

/** Une question est « à reprendre » quand moins de 60 % de la classe la réussit. */
export const PASS_THRESHOLD = 60;

/**
 * Niveau d'un élève sur un module : découvert dès la première section lue, en cours quand toutes
 * les sections sont lues ou que le quiz est à retenter, acquis quand le quiz est réussi, maîtrisé
 * quand il l'est sans faute.
 */
export function masteryLevel(row: ModuleFollowUp): MasteryLevel {
  if (row.quiz === 'passed') return row.score === 100 ? 4 : 3;
  if (row.quiz === 'failed') return 2;
  if (row.lessonsRead >= row.lessonCount) return 2;
  return row.lessonsRead > 0 ? 1 : 0;
}

/** Ce que recouvre une case, en mots (infobulle et lecteur d'écran). */
export function masteryDetail(row: ModuleFollowUp): string {
  if (row.quiz === 'passed') return `Quiz réussi · ${row.score} %`;
  if (row.quiz === 'failed') return `Quiz à retenter · ${row.score} %`;
  if (row.lessonsRead === 0) return 'Pas encore commencé';
  const read = `${row.lessonsRead} section${row.lessonsRead > 1 ? 's' : ''} lue${row.lessonsRead > 1 ? 's' : ''} sur ${row.lessonCount}`;
  return `${read} · quiz pas encore envoyé`;
}

export interface ClassMapCell {
  moduleId: string;
  level: MasteryLevel;
  detail: string;
}

export interface ClassMapRow {
  uid: string;
  name: string;
  cells: ClassMapCell[];
  /** Modules validés (quiz réussi). */
  validated: number;
  /** Quiz envoyés mais pas réussis. */
  toRetake: number;
  /** Niveau moyen, de 0 à 4 : sert à classer les élèves. */
  mean: number;
}

/** Une ligne par élève, les élèves à accompagner en premier (niveau moyen le plus bas, puis quiz à retenter). */
export function classMapRows(students: { uid: string; name: string; rows: ModuleFollowUp[] }[]): ClassMapRow[] {
  return students
    .map(({ uid, name, rows }) => {
      const cells = rows.map((row) => ({ moduleId: row.moduleId, level: masteryLevel(row), detail: masteryDetail(row) }));
      return {
        uid,
        name,
        cells,
        validated: rows.filter((row) => row.quiz === 'passed').length,
        toRetake: rows.filter((row) => row.quiz === 'failed').length,
        mean: cells.length ? cells.reduce((sum, cell) => sum + cell.level, 0) / cells.length : 0
      };
    })
    .sort((a, b) => a.mean - b.mean || b.toRetake - a.toRetake || a.name.localeCompare(b.name, 'fr'));
}

export interface WeakQuestion {
  moduleId: string;
  moduleTitle: string;
  /** Rang de la question dans le quiz (0 pour la première). */
  index: number;
  label: string;
  text: string;
  correctRate: number;
  /** Quiz envoyés sur lesquels porte le taux. */
  submitted: number;
}

/** Les questions de la classe, de la moins réussie à la mieux réussie. */
export function weakQuestions(stats: ModuleStat[], limit = 4): WeakQuestion[] {
  const all: WeakQuestion[] = [];
  for (const stat of stats) {
    if (stat.submitted === 0) continue;
    stat.questions.forEach((question, index) => {
      if (question.correctRate === null) return;
      all.push({
        moduleId: stat.id,
        moduleTitle: stat.title,
        index,
        label: question.label,
        text: question.text,
        correctRate: question.correctRate,
        submitted: stat.submitted
      });
    });
  }
  return all.sort((a, b) => a.correctRate - b.correctRate || b.submitted - a.submitted).slice(0, limit);
}

/* ------------------------------------------------------------------ Fiche de rattrapage */

const plain = (text: string) => text.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();

const STOP = new Set(
  [
    'avec dans pour vous votre vos nous notre sans plus moins mais elle elles sont etre avoir fait faire cette ces tout tous toute toutes',
    'quand quel quelle quels quelles comme entre leur leurs aussi apres avant depuis donc puis ainsi alors chaque quoi meme sait savoir',
    'suite ensuite abord pourquoi faut peut doit bien tres encore jamais toujours autre autres celui celle ceux dont lorsque parce utile',
    'ecrivez faites gardez evitez votre leurs cela ceci'
  ]
    .join(' ')
    .split(' ')
);

/** Mots porteurs d'un texte : minuscules, sans accents, quatre lettres au moins, hors mots outils. */
export function keywords(text: string): Set<string> {
  const words = plain(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 4 && !STOP.has(word));
  return new Set(words);
}

/** Termine une phrase par un point, sauf si elle a déjà sa ponctuation. */
const ended = (text: string): string => {
  const clean = plain(text);
  return /[.!?…»]$/.test(clean) ? clean : `${clean}.`;
};

const lessonText = (lesson: StudyLesson): string => {
  const parts = [ended(lesson.intro)];
  if (lesson.rich) {
    for (const section of lesson.rich.sections) {
      parts.push([ended(section.title), ...section.text.map(ended), ...(section.items || []).map(ended), section.after ? ended(section.after) : ''].filter(Boolean).join(' '));
    }
  } else {
    parts.push(ended(lesson.body));
  }
  if (lesson.points.length) parts.push(`À retenir : ${lesson.points.map(ended).join(' ')}`);
  if (lesson.tip) parts.push(`Réflexe : ${ended(lesson.tip)}`);
  return plain(parts.filter(Boolean).join(' '));
};

/** Coupe un texte à la dernière phrase entière qui tient dans la limite. */
const fit = (text: string, max: number): string => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(' ; '));
  return (end > max * 0.5 ? cut.slice(0, end + 1) : cut).trim();
};

/**
 * Le texte envoyé à l'IA pour une fiche de rattrapage : la question, la bonne réponse et son
 * explication, puis les sections du module, la plus proche de la question en premier. Il ne contient
 * que le contenu du module et un taux de classe, aucune donnée d'élève.
 */
export function remediationSource(moduleId: string, index: number, correctRate: number, max = AI_SOURCE_MAX): string {
  const content = MODULES_CONTENT[moduleId];
  const question = content?.questions[index];
  if (!content || !question) return '';
  const asked = keywords(`${question.text} ${question.answers[question.correctIndex]} ${question.explanation}`);
  // Mots communs pondérés par leur rareté dans le module : « message » compte moins que « corps ».
  const lessonWords = content.lessons.map((lesson) => keywords(`${lesson.title} ${lessonText(lesson)}`));
  const weight = (word: string) => Math.log(1 + content.lessons.length / Math.max(1, lessonWords.filter((words) => words.has(word)).length));
  const ranked = content.lessons
    .map((lesson, i) => {
      // Un mot de la question présent dans le titre de la leçon compte double.
      const title = keywords(lesson.title);
      let score = 0;
      for (const word of asked) if (lessonWords[i].has(word)) score += weight(word) * (title.has(word) ? 2 : 1);
      return { lesson, score };
    })
    .sort((a, b) => b.score - a.score);
  const head = [
    `Fiche de rattrapage sur une question que la classe réussit à ${correctRate} % : « ${plain(question.text)} »`,
    `Bonne réponse : ${plain(question.answers[question.correctIndex])}`,
    `Pourquoi : ${plain(question.explanation)}`,
    `Ce que dit le module « ${content.title} » :`
  ].join('\n');
  const body = ranked.map(({ lesson }) => `${ended(lesson.title)} ${lessonText(lesson)}`).join('\n\n');
  return fit(`${head}\n\n${body}`, max);
}

/** Titre proposé pour la fiche (l'IA en propose un autre, que l'encadrant garde ou corrige). */
export const remediationTitle = (moduleTitle: string, index: number): string => `Rattrapage : ${moduleTitle}, question ${index + 1}`;
