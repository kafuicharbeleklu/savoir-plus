/**
 * Statistiques d'un créateur : ce que les apprenants font de ses modules.
 * Tout est calculé à partir des progressions enregistrées (sections lues, réponses au quiz) ;
 * aucune réponse individuelle n'est exposée, seulement des décomptes et des taux.
 */
import type { Progress } from './data';
import { MODULES_CONTENT, lessonCountOf } from './content';
import { isQuizPassed, moduleProgressPercent, scoreAnswers } from './domain.mjs';
import type { CatalogItem } from './wireframeData';

export interface ModuleStat {
  id: string;
  title: string;
  domain: string;
  /** Apprenants ayant commencé le module (au moins une section lue ou un quiz envoyé). */
  learners: number;
  /** Apprenants ayant réussi le quiz. */
  validated: number;
  inProgress: number;
  /** Avancement moyen des apprenants, en %. */
  completion: number | null;
  /** Apprenants ayant envoyé le quiz. */
  submitted: number;
  /** Part des apprenants qui vont jusqu'au quiz, en %. */
  reachRate: number | null;
  /** Part des quiz envoyés qui sont réussis, en %. */
  passRate: number | null;
  /** Score moyen au quiz, en %. */
  avgScore: number | null;
  /** Étapes franchies après le démarrage : chaque section lue, puis le quiz réussi. */
  steps: { label: string; detail?: string; count: number; rate: number | null }[];
  /** Taux de bonnes réponses par question, parmi les quiz envoyés. */
  questions: { label: string; text: string; correct: number; correctRate: number | null }[];
}

export interface CreatorStats {
  modules: ModuleStat[];
  totals: {
    learners: number;
    completion: number | null;
    passRate: number | null;
    avgScore: number | null;
    validated: number;
    submitted: number;
  };
}

const pct = (part: number, whole: number): number | null => (whole > 0 ? Math.round((part / whole) * 100) : null);
const mean = (values: number[]): number | null =>
  values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
const hasStarted = (p: Progress | undefined): p is Progress => Boolean(p && (p.lessons.length > 0 || p.submitted));

export function computeModuleStat(mod: CatalogItem, learners: Progress[]): ModuleStat {
  const study = MODULES_CONTENT[mod.id];
  const lessonCount = lessonCountOf(mod.id, [mod]);
  const key = study ? study.questions.map((q) => q.correctIndex) : [];
  const submitted = learners.filter((p) => p.submitted);
  const validated = learners.filter((p) => isQuizPassed(p, key.length ? key : undefined)).length;

  const steps = [
    ...Array.from({ length: lessonCount }, (_, index) => {
      const count = learners.filter((p) => p.lessons.includes(index)).length;
      return { label: `Section ${index + 1}`, detail: study?.lessons[index]?.title, count, rate: pct(count, learners.length) };
    }),
    { label: 'Quiz réussi', detail: 'Module validé', count: validated, rate: pct(validated, learners.length) }
  ];

  const questions = (study?.questions || []).map((question, index) => {
    const correct = submitted.filter((p) => p.answers[index] === question.correctIndex).length;
    return { label: `Question ${index + 1}`, text: question.text, correct, correctRate: pct(correct, submitted.length) };
  });

  return {
    id: mod.id,
    title: mod.title,
    domain: mod.domain,
    learners: learners.length,
    validated,
    inProgress: learners.length - validated,
    completion: mean(learners.map((p) => moduleProgressPercent(p, lessonCount, key.length ? key : undefined))),
    submitted: submitted.length,
    reachRate: pct(submitted.length, learners.length),
    passRate: pct(validated, submitted.length),
    avgScore:
      key.length > 0 ? mean(submitted.map((p) => Math.round((scoreAnswers(p.answers || [], key) / key.length) * 100))) : null,
    steps,
    questions
  };
}

export function computeCreatorStats({
  modules,
  progressByUser,
  excludeUserId
}: {
  /** Modules publiés du créateur. */
  modules: CatalogItem[];
  /** Progressions connues : membre → module → progression. */
  progressByUser: Record<string, Record<string, Progress | undefined> | undefined>;
  /** Le créateur lui-même n'est pas compté parmi ses apprenants. */
  excludeUserId?: string;
}): CreatorStats {
  const uids = Object.keys(progressByUser).filter((uid) => uid !== excludeUserId);
  const active = new Set<string>();
  const stats = modules.map((mod) => {
    const learners: Progress[] = [];
    for (const uid of uids) {
      const p = progressByUser[uid]?.[mod.id];
      if (hasStarted(p)) {
        learners.push(p);
        active.add(uid);
      }
    }
    return computeModuleStat(mod, learners);
  });
  const withLearners = stats.filter((s) => s.learners > 0);
  const validated = stats.reduce((sum, s) => sum + s.validated, 0);
  const submitted = stats.reduce((sum, s) => sum + s.submitted, 0);
  return {
    modules: stats,
    totals: {
      learners: active.size,
      completion: mean(withLearners.map((s) => s.completion ?? 0)),
      passRate: pct(validated, submitted),
      avgScore: mean(stats.filter((s) => s.avgScore !== null).map((s) => s.avgScore as number)),
      validated,
      submitted
    }
  };
}

/** Un graphique des étapes n'a d'intérêt que si des apprenants s'arrêtent en route. */
export const hasStepLoss = (stat: ModuleStat): boolean => stat.steps.some((step) => step.count < stat.learners);

/** Un graphique des questions n'a d'intérêt que si au moins une question n'est pas réussie par tous. */
export const hasQuestionGap = (stat: ModuleStat): boolean =>
  stat.submitted > 0 && stat.questions.some((q) => q.correctRate !== null && q.correctRate < 100);

/**
 * Ce qu'il faut retenir d'un module, en phrases. Quand les chiffres ne montrent aucun écart,
 * la phrase le dit et remplace le graphique : inutile de dessiner quatre barres pleines.
 */
export function moduleInsights(stat: ModuleStat): string[] {
  const notes: string[] = [];
  if (stat.learners === 0) return notes;
  const people = (n: number) => `${n} ${n > 1 ? 'apprenants' : 'apprenant'}`;

  // Plus forte perte entre deux étapes consécutives.
  let previous = stat.learners;
  let worst: { label: string; lost: number } | null = null;
  for (const step of stat.steps) {
    const lost = previous - step.count;
    if (lost > 0 && (!worst || lost > worst.lost)) worst = { label: step.label, lost };
    previous = Math.min(previous, step.count);
  }
  if (worst) {
    notes.push(
      worst.label === 'Quiz réussi'
        ? `${people(worst.lost)} sur ${stat.learners} ${worst.lost > 1 ? 'n’ont' : 'n’a'} pas encore validé le quiz.`
        : `${people(worst.lost)} sur ${stat.learners} ${worst.lost > 1 ? 's’arrêtent' : 's’arrête'} avant la ${worst.label.toLowerCase()}.`
    );
  } else {
    notes.push(
      stat.learners > 1 ? `Les ${stat.learners} apprenants sont allés au bout du module.` : 'Le seul apprenant est allé au bout du module.'
    );
  }

  if (stat.submitted === 0) {
    notes.push('Aucun quiz envoyé pour le moment.');
  } else if (!hasQuestionGap(stat)) {
    notes.push('Aucune question ne pose de difficulté : toutes sont réussies.');
  } else {
    const answered = stat.questions.filter((q) => q.correctRate !== null);
    const weakest = answered.reduce((low, q) => ((q.correctRate as number) < (low.correctRate as number) ? q : low));
    if ((weakest.correctRate as number) < 70) {
      notes.push(`La ${weakest.label.toLowerCase()} est la moins réussie : ${weakest.correctRate} % de bonnes réponses.`);
    }
  }
  return notes;
}
