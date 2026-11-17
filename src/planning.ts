/**
 * Outils de pilotage des espaces établissement et famille : planification en diagramme de Gantt,
 * grille d'emploi du temps, message hebdomadaire au parent. Rien ici ne dessine : ce module calcule
 * des positions et des textes, les composants les affichent.
 */
import { addDays, diffDays, weekdayOf, type Day } from './calendar';

/* ------------------------------------------------------------------ Planification (Gantt) */

export type PlanKind = 'sequence' | 'revision' | 'exam';

export const PLAN_KIND_LABEL: Record<PlanKind, string> = {
  sequence: 'Séquence de cours',
  revision: 'Révisions',
  exam: 'Évaluation'
};

/** Une période planifiée pour une classe : une séquence de cours, des révisions, une évaluation. */
export interface PlanItem {
  id: string;
  classId: string;
  title: string;
  start: Day;
  /** Dernier jour, inclus. */
  end: Day;
  kind: PlanKind;
  /** Module SAVOIR+ travaillé pendant la période : son avancement remplit la barre. */
  moduleId?: string;
}

/** Lundi de la semaine d'un jour. */
export function mondayOf(day: Day): Day {
  const weekday = weekdayOf(day); // 0 = dimanche
  return addDays(day, weekday === 0 ? -6 : 1 - weekday);
}

export interface GanttWindow {
  start: Day;
  /** Nombre de jours affichés. */
  days: number;
  /** Une colonne par semaine : son lundi. */
  weeks: Day[];
}

/** La fenêtre du diagramme : des semaines entières, quelques-unes avant aujourd'hui, le reste après. */
export function ganttWindow(today: Day, weeksBefore = 3, weeksAfter = 7): GanttWindow {
  const start = addDays(mondayOf(today), -7 * weeksBefore);
  const count = weeksBefore + 1 + weeksAfter;
  return { start, days: count * 7, weeks: Array.from({ length: count }, (_, i) => addDays(start, i * 7)) };
}

export interface BarGeometry {
  /** Bord gauche et largeur, en pourcentage de la fenêtre. */
  left: number;
  width: number;
  /** La période commence avant la fenêtre, ou finit après : la barre est coupée de ce côté. */
  clippedStart: boolean;
  clippedEnd: boolean;
}

/** Place d'une période dans la fenêtre ; `null` si elle est entièrement en dehors. */
export function barGeometry(start: Day, end: Day, window: GanttWindow): BarGeometry | null {
  const from = diffDays(window.start, start);
  const to = diffDays(window.start, end) + 1; // le dernier jour est inclus
  if (to <= 0 || from >= window.days || to <= from) return null;
  const a = Math.max(0, from);
  const b = Math.min(window.days, to);
  return { left: (a / window.days) * 100, width: ((b - a) / window.days) * 100, clippedStart: from < 0, clippedEnd: to > window.days };
}

/** Position d'un jour (son début) dans la fenêtre, en pourcentage ; `null` s'il est en dehors. */
export function dayPosition(day: Day, window: GanttWindow): number | null {
  const offset = diffDays(window.start, day);
  return offset < 0 || offset >= window.days ? null : (offset / window.days) * 100;
}

export type PlanStatus = 'done' | 'current' | 'upcoming';

export function planStatus(item: { start: Day; end: Day }, today: Day): PlanStatus {
  if (diffDays(item.end, today) > 0) return 'done';
  return diffDays(item.start, today) >= 0 ? 'current' : 'upcoming';
}

/** Avancement attendu d'une période à une date : la part du temps déjà écoulée, de 0 à 100. */
export function expectedProgress(item: { start: Day; end: Day }, today: Day): number {
  const total = diffDays(item.start, item.end) + 1;
  const elapsed = diffDays(item.start, today) + 1;
  return Math.round((Math.max(0, Math.min(total, elapsed)) / Math.max(1, total)) * 100);
}

export type Pace = 'ahead' | 'on-track' | 'late';

/** Rythme d'une classe sur une séquence : en retard si l'avancement réel est 15 points sous l'attendu. */
export function paceOf(actual: number, expected: number): Pace {
  if (actual - expected >= 15) return 'ahead';
  return expected - actual >= 15 ? 'late' : 'on-track';
}

export const PACE_LABEL: Record<Pace, string> = { ahead: 'En avance', 'on-track': 'Dans les temps', late: 'En retard' };

/** Les périodes d'une classe, de la plus ancienne à la plus récente. */
export function plansOfClass(plans: PlanItem[], classId: string): PlanItem[] {
  return plans.filter((p) => p.classId === classId).sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));
}

/** Ce qui empêche d'enregistrer une période ; `null` si elle est valable. */
export function planProblem(candidate: { title: string; start: Day; end: Day }): string | null {
  if (!candidate.title.trim()) return 'Donnez un titre à la période.';
  if (!candidate.start || !candidate.end) return 'Indiquez le début et la fin.';
  if (diffDays(candidate.start, candidate.end) < 0) return 'La fin ne peut pas précéder le début.';
  if (diffDays(candidate.start, candidate.end) > 120) return 'Une période dure quatre mois au plus : découpez-la.';
  return null;
}

/* ------------------------------------------------------------------ Grille d'emploi du temps */

export const minutesOfClock = (clock: string): number => {
  const [h, m] = clock.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export interface GridBounds {
  /** Début et fin de la journée affichée, en minutes, arrondis à l'heure. */
  start: number;
  end: number;
  /** Les heures pleines à marquer sur l'axe. */
  hours: number[];
}

/** La plage horaire d'une grille : de la première à la dernière heure de cours, au moins 8 h – 17 h. */
export function gridBounds(slots: { start: string; end: string }[]): GridBounds {
  const starts = slots.map((s) => minutesOfClock(s.start));
  const ends = slots.map((s) => minutesOfClock(s.end));
  const start = Math.floor(Math.min(8 * 60, ...starts) / 60) * 60;
  const end = Math.ceil(Math.max(17 * 60, ...ends) / 60) * 60;
  return { start, end, hours: Array.from({ length: (end - start) / 60 + 1 }, (_, i) => start / 60 + i) };
}

/** Place d'un créneau dans la colonne de son jour : haut et hauteur, en pourcentage. */
export function slotGeometry(slot: { start: string; end: string }, bounds: GridBounds): { top: number; height: number } {
  const span = Math.max(1, bounds.end - bounds.start);
  const from = Math.max(bounds.start, minutesOfClock(slot.start));
  const to = Math.min(bounds.end, minutesOfClock(slot.end));
  return { top: ((from - bounds.start) / span) * 100, height: (Math.max(0, to - from) / span) * 100 };
}

/** Heures de cours d'une semaine, à partir des créneaux. */
export function weeklyHours(slots: { start: string; end: string }[]): number {
  const minutes = slots.reduce((sum, s) => sum + Math.max(0, minutesOfClock(s.end) - minutesOfClock(s.start)), 0);
  return Math.round((minutes / 60) * 10) / 10;
}

/* ------------------------------------------------------------------ Message hebdomadaire au parent */

/** Ce que l'on sait d'un enfant cette semaine, pour en tirer un seul message. */
export interface ChildSnapshot {
  name: string;
  /** Séances de révision en retard sur le plan. */
  lateSessions: number;
  /** Jours de révision consécutifs. */
  streak: number;
  nextExam?: { title: string; inDays: number };
  /** Module dont toutes les parties sont lues, mais dont le quiz n'est pas passé. */
  readyForQuiz?: string;
  /** Module commencé qui avance le moins. */
  slowest?: { title: string; percent: number };
  validated: number;
  total: number;
}

export interface WeeklyNote {
  tone: 'warn' | 'info' | 'good';
  /** Une phrase : ce qu'il faut savoir. */
  text: string;
  /** Une phrase : ce que le parent peut faire. */
  action: string;
}

const days = (n: number) => (n <= 0 ? 'aujourd’hui' : n === 1 ? 'demain' : `dans ${n} jours`);

/**
 * Le message de la semaine : une phrase sur ce qui mérite attention, une sur ce que le parent peut
 * faire. Un seul sujet à la fois, le plus pressant d'abord. (Une phrase par semaine, qui dit quoi
 * améliorer, suffit à faire reculer les échecs : Kraft et Rogers, 2015.)
 */
export function weeklyNote(child: ChildSnapshot): WeeklyNote {
  const first = child.name.split(' ')[0];
  if (child.lateSessions > 0) {
    const exam = child.nextExam ? ` avant « ${child.nextExam.title} » (${days(child.nextExam.inDays)})` : '';
    return {
      tone: 'warn',
      text: `${first} a ${child.lateSessions} séance${child.lateSessions > 1 ? 's' : ''} de révision en retard${exam}.`,
      action: 'Aidez à caser une séance de trente minutes ce soir : la première est la plus dure à lancer.'
    };
  }
  if (child.nextExam && child.nextExam.inDays <= 7) {
    return {
      tone: 'info',
      text: `« ${child.nextExam.title} » a lieu ${days(child.nextExam.inDays)}, et ${first} est à jour dans ses révisions.`,
      action: 'Demandez-lui de vous expliquer un point du cours : expliquer à quelqu’un aide à retenir.'
    };
  }
  if (child.readyForQuiz) {
    return {
      tone: 'info',
      text: `${first} a lu tout le module « ${child.readyForQuiz} » ; il reste le quiz.`,
      action: 'Proposez de passer le quiz cette semaine, tant que la lecture est fraîche.'
    };
  }
  if (child.slowest && child.slowest.percent < 50) {
    return {
      tone: 'info',
      text: `Le module « ${child.slowest.title} » avance lentement (${child.slowest.percent} %).`,
      action: 'Regardez ensemble la première partie : dix minutes suffisent pour relancer.'
    };
  }
  const streak = child.streak > 1 ? `, ${child.streak} jours de suite` : '';
  return {
    tone: 'good',
    text: `${first} suit son rythme : ${child.validated} module${child.validated > 1 ? 's' : ''} validé${child.validated > 1 ? 's' : ''} sur ${child.total}${streak}.`,
    action: 'Dites-le-lui avec un fait précis : un encouragement concret porte plus qu’un compliment général.'
  };
}
