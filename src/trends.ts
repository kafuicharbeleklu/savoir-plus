/**
 * Relevés hebdomadaires d'un tableau de bord (établissement ou encadrant) : chaque semaine,
 * l'avancement du trimestre face à l'attendu, les élèves à accompagner, la réussite aux quiz et
 * l'écart à l'attendu de chaque classe. La semaine en cours se calcule en direct à partir des
 * progressions ; les semaines passées viennent des relevés enregistrés (ceux de la démonstration
 * sont posés au départ, puis chaque semaine consultée s'ajoute). Aucun classement d'élèves.
 */
import { addDays, type Day } from './calendar';
import { mondayOf } from './planning';

export interface WeekSnapshot {
  /** Lundi de la semaine relevée. */
  week: Day;
  /** Établissement (son identifiant) ou encadrant (le sien) dont c'est le tableau de bord. */
  scope: string;
  /** Avancement du trimestre : part moyenne des modules des classes déjà faite, en %. */
  progress: number;
  /** Avancement attendu à cette date d'après la planification, en % ; null sans planification. */
  expected: number | null;
  /** Élèves à accompagner : un quiz à retenter ou un net retard. */
  flagged: number;
  /** Part des quiz rendus qui sont réussis, en % ; null tant qu'aucun quiz n'est rendu. */
  quizRate: number | null;
  /** Écart à l'attendu de chaque classe, en points (positif : en avance). */
  classGaps: Record<string, number>;
}

export type WeekMeasures = Omit<WeekSnapshot, 'week' | 'scope'>;

/** Relevés gardés par tableau de bord : six mois. */
const KEEP_WEEKS = 26;

/** Les semaines d'un tableau de bord, de la plus ancienne à la semaine en cours (calculée en direct). */
export function weekSeries(
  snapshots: WeekSnapshot[] | undefined,
  scope: string,
  current: WeekMeasures,
  today: Day,
  weeks = 8
): WeekSnapshot[] {
  const thisWeek = mondayOf(today);
  const past = (snapshots || [])
    .filter((s) => s.scope === scope && s.week < thisWeek)
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-(weeks - 1));
  return [...past, { ...current, week: thisWeek, scope }];
}

const sameMeasures = (a: WeekMeasures, b: WeekMeasures): boolean =>
  a.progress === b.progress &&
  a.expected === b.expected &&
  a.flagged === b.flagged &&
  a.quizRate === b.quizRate &&
  JSON.stringify(a.classGaps) === JSON.stringify(b.classGaps);

/**
 * Enregistre la semaine en cours d'un tableau de bord (remplace le relevé de la même semaine).
 * Renvoie `null` quand rien ne change, pour ne pas réécrire l'état à chaque affichage.
 */
export function recordWeek(snapshots: WeekSnapshot[] | undefined, scope: string, current: WeekMeasures, today: Day): WeekSnapshot[] | null {
  const week = mondayOf(today);
  const list = snapshots || [];
  const existing = list.find((s) => s.scope === scope && s.week === week);
  if (existing && sameMeasures(existing, current)) return null;
  const others = list.filter((s) => !(s.scope === scope && s.week === week));
  const mine = [...others.filter((s) => s.scope === scope), { ...current, week, scope }]
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-KEEP_WEEKS);
  return [...others.filter((s) => s.scope !== scope), ...mine];
}

/** Variation d'une mesure entre la semaine précédente et la semaine en cours ; null si l'une manque. */
export function weekDelta(series: WeekSnapshot[], pick: (s: WeekSnapshot) => number | null): number | null {
  if (series.length < 2) return null;
  const now = pick(series[series.length - 1]);
  const before = pick(series[series.length - 2]);
  return now === null || before === null ? null : now - before;
}

export interface SparkPoint {
  x: number;
  y: number;
}

/**
 * Points d'une petite courbe dans un cadre de `width` × `height`, avec une marge `pad`.
 * Les valeurs absentes sont sautées. Le domaine peut être imposé pour comparer plusieurs courbes
 * sur la même échelle (les écarts à l'attendu de chaque classe, par exemple).
 */
export function sparkPoints(values: (number | null)[], width: number, height: number, pad = 3, domain?: [number, number]): SparkPoint[] {
  const present = values.filter((v): v is number => v !== null);
  if (present.length === 0) return [];
  const lo = domain ? domain[0] : Math.min(...present);
  const hi = domain ? domain[1] : Math.max(...present);
  const span = hi - lo || 1;
  const step = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;
  const points: SparkPoint[] = [];
  values.forEach((v, i) => {
    if (v === null) return;
    const ratio = domain || hi !== lo ? (v - lo) / span : 0.5;
    points.push({ x: round(pad + i * step), y: round(height - pad - ratio * (height - pad * 2)) });
  });
  return points;
}

const round = (n: number) => Math.round(n * 10) / 10;

/** Relevés de départ de la démonstration : sept semaines avant la semaine du jour. */
export function seedSnapshots(today: Day): WeekSnapshot[] {
  const monday = mondayOf(today);
  const weeksAgo = (n: number) => addDays(monday, -7 * n);
  const series = (
    scope: string,
    rows: { progress: number[]; expected: number[]; flagged: number[]; quizRate: (number | null)[]; gaps: Record<string, number[]> }
  ): WeekSnapshot[] =>
    rows.progress.map((progress, i) => ({
      week: weeksAgo(rows.progress.length - i),
      scope,
      progress,
      expected: rows.expected[i],
      flagged: rows.flagged[i],
      quizRate: rows.quizRate[i],
      classGaps: Object.fromEntries(Object.entries(rows.gaps).map(([id, gaps]) => [id, gaps[i]]))
    }));
  // Les sept semaines mènent aux mesures que donnent, la semaine du jour, les progressions de départ
  // (Les Palmiers : 75 % pour 54 % attendus ; Kossi Agbo : 58 % pour 44 %).
  return [
    ...series('inst-palmiers', {
      progress: [34, 41, 48, 55, 61, 66, 71],
      expected: [22, 27, 32, 37, 42, 47, 51],
      flagged: [6, 5, 5, 4, 4, 3, 3],
      quizRate: [null, 82, 85, 88, 90, 93, 95],
      gaps: { 'cl-tle-d': [8, 11, 14, 17, 20, 24, 27], 'cl-3e-a': [2, 4, 6, 8, 9, 11, 12] }
    }),
    ...series('kossi', {
      progress: [22, 28, 34, 40, 46, 51, 55],
      expected: [16, 20, 25, 29, 34, 38, 42],
      flagged: [6, 6, 5, 5, 4, 4, 4],
      quizRate: [null, 80, 84, 87, 90, 93, 95],
      gaps: { 'cl-tle-d': [8, 11, 14, 17, 20, 24, 27], 'cl-3e-a': [2, 4, 6, 8, 9, 11, 12], 'cl-reseaux': [-6, -5, -5, -4, -3, -2, -2] }
    })
  ];
}
