/**
 * Calendrier et plan de révision.
 *
 * Le plan est calculé sur l'appareil, à partir de ce que l'élève a saisi : aucune donnée
 * n'est envoyée à un service. Il se recalcule à chaque changement (séance faite ou manquée,
 * examen ajouté, quiz raté) et chaque séance sait dire pourquoi elle est là.
 */

/* ------------------------------------------------------------------ Jours civils */

/** Jour civil au format AAAA-MM-JJ, sans heure ni fuseau. */
export type Day = string;

const DAY_MS = 86_400_000;
const pad = (n: number) => String(n).padStart(2, '0');
const utc = (day: Day): number => {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

export const dayFromDate = (d: Date): Day => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayDay = (): Day => dayFromDate(new Date());

export function isValidDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const t = utc(value);
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === value;
}

export const addDays = (day: Day, n: number): Day => new Date(utc(day) + n * DAY_MS).toISOString().slice(0, 10);
/** Nombre de jours de `from` à `to` (négatif si `to` est avant). */
export const diffDays = (from: Day, to: Day): number => Math.round((utc(to) - utc(from)) / DAY_MS);
/** 0 = dimanche … 6 = samedi. */
export const weekdayOf = (day: Day): number => new Date(utc(day)).getUTCDay();
export const isWeekend = (day: Day): boolean => weekdayOf(day) === 0 || weekdayOf(day) === 6;

const format = (day: Day, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('fr-FR', { ...options, timeZone: 'UTC' }).format(new Date(utc(day)));
const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase('fr') + text.slice(1);

/** « 17 nov. » */
export const formatDayShort = (day: Day): string => format(day, { day: 'numeric', month: 'short' });
/** « Mardi 17 novembre » */
export const formatDayLong = (day: Day): string => capitalize(format(day, { weekday: 'long', day: 'numeric', month: 'long' }));
/** « mar. » */
export const formatWeekdayShort = (day: Day): string => format(day, { weekday: 'short' });
/** « Novembre 2026 » */
export const formatMonthTitle = (year: number, month: number): string =>
  capitalize(format(`${year}-${pad(month + 1)}-01`, { month: 'long', year: 'numeric' }));
/** « nov. » — pour la vignette de date. */
export const formatMonthShort = (day: Day): string => format(day, { month: 'short' });

/** « 24 déc. – 3 janv. » ou « 17 nov. » pour un seul jour. */
export function formatRange(start: Day, end?: Day): string {
  if (!end || end <= start) return formatDayShort(start);
  if (start.slice(0, 7) === end.slice(0, 7)) return `${Number(start.slice(8))} – ${formatDayShort(end)}`;
  return `${formatDayShort(start)} – ${formatDayShort(end)}`;
}

/** « aujourd’hui », « demain », « dans 12 jours », « il y a 3 jours ». */
export function countdownLabel(days: number): string {
  if (days === 0) return 'aujourd’hui';
  if (days === 1) return 'demain';
  if (days === -1) return 'hier';
  return days > 0 ? `dans ${days} jours` : `il y a ${-days} jours`;
}

/** Semaines du mois, du lundi au dimanche (5 ou 6 lignes de 7 jours). */
export function buildMonthGrid(year: number, month: number): Day[][] {
  const first: Day = `${year}-${pad(month + 1)}-01`;
  const lead = (weekdayOf(first) + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const rows = Math.ceil((lead + daysInMonth) / 7);
  const start = addDays(first, -lead);
  return Array.from({ length: rows }, (_, row) => Array.from({ length: 7 }, (_, col) => addDays(start, row * 7 + col)));
}

/* ------------------------------------------------------------------ Événements */

/** Examen, congé ou vacances, simple repère (rentrée, date limite, rappel). */
export type CalendarEventKind = 'exam' | 'break' | 'marker';

export interface ExamSettings {
  /** Matière affichée dans les séances. */
  subject: string;
  /** 1 facile · 2 moyenne · 3 difficile. */
  difficulty: 1 | 2 | 3;
  /** Niveau que l'élève s'attribue : 1 à renforcer · 2 correct · 3 à l'aise. */
  level: 1 | 2 | 3;
  /** Avoir la moyenne, ou viser plus haut. */
  goal: 'pass' | 'high';
  /** Modules SAVOIR+ qui couvrent la matière. */
  moduleIds?: string[];
}

export interface CalendarEvent {
  id: string;
  kind: CalendarEventKind;
  title: string;
  start: Day;
  /** Dernier jour inclus ; absent pour une date d'un seul jour. */
  end?: Day;
  /** Calendrier scolaire fourni par l'application, ou date ajoutée par l'élève. */
  source: 'school' | 'user';
  /** Calendrier scolaire : date annoncée, date à confirmer, ou date modifiée par l'élève. */
  certainty?: 'announced' | 'to-confirm' | 'edited';
  note?: string;
  /** Présent : l'examen entre dans le plan de révision. */
  exam?: ExamSettings;
  /** Jour d'ajout : point de départ du plan, pour mesurer l'avance ou le retard. */
  createdOn?: Day;
}

export const eventEnd = (e: CalendarEvent): Day => (e.end && e.end > e.start ? e.end : e.start);
export const eventCovers = (e: CalendarEvent, day: Day): boolean => day >= e.start && day <= eventEnd(e);

export const DIFFICULTY_LABEL: Record<ExamSettings['difficulty'], string> = { 1: 'Facile', 2: 'Moyenne', 3: 'Difficile' };
export const LEVEL_LABEL: Record<ExamSettings['level'], string> = { 1: 'À renforcer', 2: 'Correct', 3: 'À l’aise' };
export const GOAL_LABEL: Record<ExamSettings['goal'], string> = { pass: 'Avoir la moyenne', high: 'Viser plus haut' };

/* ------------------------------------------------------------------ Calendrier scolaire */

export type NationalExamCode = 'cepd' | 'bepc' | 'bac1' | 'bac2';

export const NATIONAL_EXAMS: { code: NationalExamCode; label: string }[] = [
  { code: 'cepd', label: 'CEPD' },
  { code: 'bepc', label: 'BEPC' },
  { code: 'bac1', label: 'BAC I (probatoire)' },
  { code: 'bac2', label: 'BAC II' }
];

type SchoolEntry = CalendarEvent & { examCode?: NationalExamCode };

const school = (
  id: string,
  kind: CalendarEventKind,
  title: string,
  start: Day,
  end: Day | undefined,
  certainty: 'announced' | 'to-confirm',
  extra: Partial<SchoolEntry> = {}
): SchoolEntry => ({ id, kind, title, start, end, source: 'school', certainty, ...extra });

/**
 * Année scolaire 2026-2027 au Togo, d'après les annonces du ministère relayées par la presse.
 * Aucune date n'est inventée : celles sur lesquelles les sources divergent d'un jour, ou qu'une
 * seule source donne, sont marquées « à confirmer ».
 */
export const SCHOOL_CALENDAR: { id: string; label: string; source: string; entries: SchoolEntry[] } = {
  id: 'tg-2026-2027',
  label: 'Calendrier scolaire 2026-2027 (Togo)',
  source:
    'Dates annoncées par le ministère de l’Éducation nationale et relayées par République Togolaise, Koaci et La Cinquième (juillet et octobre 2026). Vérifiez-les auprès de votre établissement.',
  entries: [
    school('sc-rentree-2026', 'marker', 'Rentrée scolaire 2026-2027', '2026-09-14', undefined, 'announced'),
    school('sc-noel', 'break', 'Congés de Noël', '2026-12-24', '2027-01-03', 'announced', {
      note: 'Fin du premier trimestre le 23 décembre au soir ; reprise des cours le 4 janvier.'
    }),
    school('sc-detente', 'break', 'Congé de détente', '2027-02-13', '2027-02-21', 'to-confirm', {
      note: 'Les sources donnent le 12 ou le 13 février comme premier jour.'
    }),
    school('sc-paques', 'break', 'Congés de Pâques', '2027-04-10', '2027-04-18', 'to-confirm', {
      note: 'Fin du deuxième trimestre le 9 avril ; reprise des cours le 19 avril. Les sources donnent le 9 ou le 10 avril comme premier jour.'
    }),
    school('sc-grandes-vacances', 'break', 'Grandes vacances', '2027-07-17', '2027-09-12', 'announced', {
      note: 'Fin des cours le 16 juillet au soir.'
    }),
    school('sc-rentree-2027', 'marker', 'Rentrée scolaire 2027-2028', '2027-09-13', undefined, 'announced'),
    school('sc-insc-bac1', 'marker', 'Clôture des inscriptions au BAC I', '2026-12-19', undefined, 'to-confirm', { examCode: 'bac1' }),
    school('sc-insc-cepd', 'marker', 'Clôture des inscriptions au CEPD', '2026-12-31', undefined, 'announced', { examCode: 'cepd' }),
    school('sc-insc-bepc', 'marker', 'Clôture des inscriptions au BEPC', '2026-12-31', undefined, 'announced', { examCode: 'bepc' }),
    school('sc-insc-bac2', 'marker', 'Clôture des inscriptions au BAC II', '2027-01-16', undefined, 'announced', { examCode: 'bac2' }),
    school('sc-bac1', 'exam', 'BAC I (probatoire)', '2027-05-24', '2027-05-28', 'announced', { examCode: 'bac1' }),
    school('sc-cepd', 'exam', 'CEPD', '2027-06-08', '2027-06-10', 'announced', { examCode: 'cepd' }),
    school('sc-bepc', 'exam', 'BEPC', '2027-06-15', '2027-06-17', 'announced', { examCode: 'bepc' }),
    school('sc-bac2', 'exam', 'BAC II', '2027-06-21', '2027-06-25', 'announced', { examCode: 'bac2' })
  ]
};

/* ------------------------------------------------------------------ État d'un membre */

export interface PlanSettings {
  /** Minutes de révision un jour de semaine. */
  weekdayMinutes: number;
  /** Minutes de révision un samedi ou un dimanche. */
  weekendMinutes: number;
  /** Durée d'une séance. */
  sessionMinutes: number;
  /** Jour de repos (0 = dimanche … 6 = samedi), ou aucun. */
  restDay: number | null;
  /** Pendant les congés : repos, même rythme, ou chaque jour compté comme un jour de week-end. */
  breakMode: 'rest' | 'normal' | 'boost';
}

export const DEFAULT_PLAN_SETTINGS: PlanSettings = {
  weekdayMinutes: 45,
  weekendMinutes: 90,
  sessionMinutes: 45,
  restDay: null,
  breakMode: 'normal'
};

export const BREAK_MODE_LABEL: Record<PlanSettings['breakMode'], string> = {
  rest: 'Repos',
  normal: 'Même rythme',
  boost: 'Rythme renforcé'
};

export type SessionKind = 'module' | 'learn' | 'practice' | 'test' | 'light';

export const SESSION_KIND_LABEL: Record<SessionKind, string> = {
  module: 'Suivre le module',
  learn: 'Comprendre le cours',
  practice: 'S’exercer',
  test: 'Se tester',
  light: 'Relecture légère'
};

/** Séance faite : le jour où elle l'a été. */
export interface SessionLog {
  examId: string;
  day: Day;
  minutes: number;
  kind: SessionKind;
}

export interface CalendarUserState {
  /** Dates ajoutées par le membre. */
  events: CalendarEvent[];
  /** Afficher les congés et vacances du calendrier scolaire. */
  showSchool: boolean;
  /** Examen national préparé : ses dates s'ajoutent au calendrier. */
  nationalExam: NationalExamCode | null;
  /** Dates du calendrier scolaire retirées par le membre. */
  hiddenSchoolIds: string[];
  /** Dates du calendrier scolaire corrigées par le membre. */
  schoolEdits: Record<string, { start: Day; end?: Day }>;
  settings: PlanSettings;
  log: SessionLog[];
}

export const emptyCalendarState = (): CalendarUserState => ({
  events: [],
  showSchool: true,
  nationalExam: null,
  hiddenSchoolIds: [],
  schoolEdits: {},
  settings: { ...DEFAULT_PLAN_SETTINGS },
  log: []
});

/** Complète un état enregistré par une version précédente (champs ajoutés depuis). */
export function normalizeCalendarState(raw: Partial<CalendarUserState> | undefined | null): CalendarUserState {
  const base = emptyCalendarState();
  if (!raw) return base;
  return {
    ...base,
    ...raw,
    events: Array.isArray(raw.events) ? raw.events : base.events,
    hiddenSchoolIds: Array.isArray(raw.hiddenSchoolIds) ? raw.hiddenSchoolIds : base.hiddenSchoolIds,
    schoolEdits: raw.schoolEdits || base.schoolEdits,
    settings: { ...base.settings, ...(raw.settings || {}) },
    log: Array.isArray(raw.log) ? raw.log : base.log
  };
}

const byStart = (a: CalendarEvent, b: CalendarEvent) => (a.start === b.start ? a.title.localeCompare(b.title, 'fr') : a.start < b.start ? -1 : 1);

/** Toutes les dates visibles par le membre : calendrier scolaire (corrigé par lui) et dates ajoutées. */
export function resolveEvents(state: CalendarUserState): CalendarEvent[] {
  const fromSchool = state.showSchool
    ? SCHOOL_CALENDAR.entries
        .filter((entry) => !entry.examCode || entry.examCode === state.nationalExam)
        .filter((entry) => !state.hiddenSchoolIds.includes(entry.id))
        .map(({ examCode: _examCode, ...entry }): CalendarEvent => {
          const edit = state.schoolEdits[entry.id];
          return edit ? { ...entry, start: edit.start, end: edit.end, certainty: 'edited' } : entry;
        })
    : [];
  return [...fromSchool, ...state.events].sort(byStart);
}

/** Ajoute une date du membre, ou remplace celle qui porte le même identifiant. */
export function upsertUserEvent(state: CalendarUserState, event: CalendarEvent): CalendarUserState {
  const exists = state.events.some((e) => e.id === event.id);
  return {
    ...state,
    events: exists ? state.events.map((e) => (e.id === event.id ? event : e)) : [...state.events, event]
  };
}

/** Corrige les dates d'une entrée du calendrier scolaire. */
export function editSchoolEvent(state: CalendarUserState, id: string, start: Day, end?: Day): CalendarUserState {
  return { ...state, schoolEdits: { ...state.schoolEdits, [id]: { start, end: end && end > start ? end : undefined } } };
}

/** Retire une date : supprimée si elle vient du membre, masquée si elle vient du calendrier scolaire. */
export function removeEvent(state: CalendarUserState, event: Pick<CalendarEvent, 'id' | 'source'>): CalendarUserState {
  if (event.source === 'school') {
    return state.hiddenSchoolIds.includes(event.id) ? state : { ...state, hiddenSchoolIds: [...state.hiddenSchoolIds, event.id] };
  }
  return {
    ...state,
    events: state.events.filter((e) => e.id !== event.id),
    log: state.log.filter((entry) => entry.examId !== event.id)
  };
}

export function logSession(
  state: CalendarUserState,
  session: Pick<PlannedSession, 'examId' | 'minutes' | 'kind'>,
  day: Day
): CalendarUserState {
  return { ...state, log: [...state.log, { examId: session.examId, day, minutes: session.minutes, kind: session.kind }] };
}

/** Annule la dernière séance notée ce jour-là pour cet examen. */
export function unlogSession(state: CalendarUserState, examId: string, day: Day): CalendarUserState {
  const index = state.log.map((entry) => entry.examId === examId && entry.day === day).lastIndexOf(true);
  return index < 0 ? state : { ...state, log: state.log.filter((_, i) => i !== index) };
}

/* ------------------------------------------------------------------ Charge de révision */

const BASE_HOURS: Record<ExamSettings['difficulty'], number> = { 1: 4, 2: 7, 3: 10 };
const LEVEL_FACTOR: Record<ExamSettings['level'], number> = { 1: 1.3, 2: 1, 3: 0.7 };
const GOAL_FACTOR: Record<ExamSettings['goal'], number> = { pass: 0.8, high: 1.2 };

/** Détail du calcul, affiché à l'élève (« Voir le calcul »). */
export interface LoadBreakdown {
  baseHours: number;
  levelFactor: number;
  goalFactor: number;
  /** Temps de révision estimé, en minutes. */
  minutes: number;
  sessionMinutes: number;
  /** Séances tirées du temps estimé. */
  sessions: number;
  /** Séances ajoutées après un quiz raté sur un module lié. */
  extraSessions: number;
  total: number;
}

/**
 * Temps de révision d'un examen : une base selon sa difficulté, corrigée par le niveau que
 * l'élève s'attribue et par son objectif, puis découpée en séances.
 */
export function computeLoad(exam: ExamSettings, sessionMinutes: number, extraSessions = 0): LoadBreakdown {
  const baseHours = BASE_HOURS[exam.difficulty] ?? BASE_HOURS[2];
  const levelFactor = LEVEL_FACTOR[exam.level] ?? 1;
  const goalFactor = GOAL_FACTOR[exam.goal] ?? 1;
  const minutes = Math.round(baseHours * 60 * levelFactor * goalFactor);
  const length = Math.max(15, sessionMinutes);
  const sessions = Math.max(2, Math.ceil(minutes / length));
  return { baseHours, levelFactor, goalFactor, minutes, sessionMinutes: length, sessions, extraSessions, total: sessions + extraSessions };
}

/* ------------------------------------------------------------------ Plan de révision */

/** État d'un module SAVOIR+ lié à un examen, vu depuis la progression de l'élève. */
export type LinkedModuleState = 'validated' | 'failed' | 'started' | 'new';

export interface PlannedSession {
  key: string;
  examId: string;
  examTitle: string;
  subject: string;
  day: Day;
  minutes: number;
  /** Rang de la séance dans le plan de l'examen (1 … total). */
  ordinal: number;
  total: number;
  kind: SessionKind;
  /** Séance prévue plus tôt, non faite, replacée ici. */
  catchUp: boolean;
  moduleId?: string;
  moduleTitle?: string;
  /** « Pourquoi cette séance ? » */
  reasons: string[];
}

/** Ce que l'élève fait pendant la séance : « S’exercer », ou « Module « Comprendre les réseaux » ». */
export const sessionTaskLabel = (session: Pick<PlannedSession, 'kind' | 'moduleTitle'>): string =>
  session.kind === 'module' && session.moduleTitle ? `Module « ${session.moduleTitle} »` : SESSION_KIND_LABEL[session.kind];

export type ExamPlanStatus = 'past' | 'today' | 'done' | 'overload' | 'late' | 'ahead' | 'on-track';

export interface ExamPlan {
  examId: string;
  title: string;
  subject: string;
  examDay: Day;
  daysLeft: number;
  total: number;
  done: number;
  remaining: number;
  /** Séances restantes placées dans le calendrier. */
  planned: number;
  /** Séances restantes qui ne tiennent pas avant l'examen. */
  unplaced: number;
  /** Séances que le plan attendait déjà et qui n'ont pas été faites. */
  late: number;
  status: ExamPlanStatus;
  load: LoadBreakdown;
}

export interface RevisionPlan {
  sessions: PlannedSession[];
  exams: ExamPlan[];
}

export interface PlanInput {
  events: CalendarEvent[];
  settings: PlanSettings;
  log: SessionLog[];
  today: Day;
  modules?: Record<string, { title: string; state: LinkedModuleState }>;
}

/** Les séances se resserrent un peu à l'approche de l'examen (1 = répartition régulière). */
const RAMP = 1.25;

/** Nombre de séances possibles un jour donné. */
export function daySlots(day: Day, settings: PlanSettings, breaks: CalendarEvent[], examDays: ReadonlySet<Day>): number {
  if (examDays.has(day)) return 0;
  if (settings.restDay !== null && settings.restDay === weekdayOf(day)) return 0;
  let minutes = isWeekend(day) ? settings.weekendMinutes : settings.weekdayMinutes;
  if (breaks.some((b) => eventCovers(b, day))) {
    if (settings.breakMode === 'rest') return 0;
    if (settings.breakMode === 'boost') minutes = Math.max(settings.weekdayMinutes, settings.weekendMinutes);
  }
  return Math.max(0, Math.floor(minutes / Math.max(15, settings.sessionMinutes)));
}

const kindAt = (ordinal: number, total: number): SessionKind => {
  const share = ordinal / Math.max(1, total);
  return share <= 0.45 ? 'learn' : share <= 0.8 ? 'practice' : 'test';
};

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

const KIND_REASON: Record<Exclude<SessionKind, 'module'>, string> = {
  learn: 'Début du plan : comprendre le cours avant de s’exercer.',
  practice: 'Milieu du plan : appliquer le cours sur des exercices.',
  test: 'Fin du plan : se tester dans les conditions de l’examen.',
  light: 'Veille de l’examen : une relecture légère, sans nouveau chapitre.'
};

type Work = {
  event: CalendarEvent;
  exam: ExamSettings;
  eve: Day;
  mainEnd: Day;
  mainDays: number;
  mainTarget: number;
  mainPlaced: number;
  days: Day[];
  lightDay: Day | null;
  pendingModules: string[];
  summary: ExamPlan;
};

/**
 * Construit le plan : pour chaque examen, les séances restantes sont réparties d'aujourd'hui à la
 * veille de l'épreuve, dans les créneaux que laissent le rythme choisi, le jour de repos, les congés
 * et les jours d'épreuve. Une séance non faite n'est pas perdue : elle est replacée.
 */
export function buildRevisionPlan({ events, settings, log, today, modules = {} }: PlanInput): RevisionPlan {
  const breaks = events.filter((e) => e.kind === 'break');
  const examDays = new Set<Day>();
  for (const e of events) {
    if (e.kind !== 'exam') continue;
    for (let d = e.start; d <= eventEnd(e); d = addDays(d, 1)) examDays.add(d);
  }

  const works: Work[] = events
    .filter((e): e is CalendarEvent & { exam: ExamSettings } => e.kind === 'exam' && Boolean(e.exam))
    .sort(byStart)
    .map((event) => {
      const exam = event.exam;
      const eve = addDays(event.start, -1);
      const daysLeft = diffDays(today, event.start);
      const pendingModules = (exam.moduleIds || []).filter((id) => modules[id] && modules[id].state !== 'validated');
      const failed = pendingModules.filter((id) => modules[id].state === 'failed').length;
      const load = computeLoad(exam, settings.sessionMinutes, failed);
      const done = log.filter((entry) => entry.examId === event.id).length;
      const total = Math.max(load.total, done);
      const remaining = daysLeft <= 0 ? 0 : total - done;

      // Avance ou retard : ce que le plan attendait à ce jour, depuis l'ajout de l'examen.
      const startDay = event.createdOn && event.createdOn < today ? event.createdOn : today;
      const span = diffDays(startDay, eve);
      const elapsed = diffDays(startDay, today);
      const expected = span > 0 ? Math.floor(total * Math.pow(Math.min(1, elapsed / span), RAMP)) : 0;
      const late = Math.max(0, Math.min(remaining, expected - done));

      return {
        event,
        exam,
        eve,
        mainEnd: addDays(eve, -1),
        mainDays: 0,
        mainTarget: 0,
        mainPlaced: 0,
        days: [],
        lightDay: null,
        pendingModules,
        summary: {
          examId: event.id,
          title: event.title,
          subject: exam.subject || event.title,
          examDay: event.start,
          daysLeft,
          total,
          done,
          remaining,
          planned: 0,
          unplaced: 0,
          late,
          status: daysLeft < 0 ? 'past' : daysLeft === 0 ? 'today' : remaining === 0 ? 'done' : done >= expected + 2 ? 'ahead' : 'on-track',
          load
        }
      };
    });

  const active = works.filter((w) => w.summary.remaining > 0);
  const horizon = active.reduce<Day>((latest, w) => (w.eve > latest ? w.eve : latest), today);

  // Créneaux libres jour par jour ; les séances déjà faites aujourd'hui occupent les leurs.
  const free = new Map<Day, number>();
  const doneToday = log.filter((entry) => entry.day === today).length;
  for (let d = today; d <= horizon; d = addDays(d, 1)) {
    free.set(d, Math.max(0, daySlots(d, settings, breaks, examDays) - (d === today ? doneToday : 0)));
  }
  const take = (d: Day): boolean => {
    const left = free.get(d) || 0;
    if (left <= 0) return false;
    free.set(d, left - 1);
    return true;
  };

  // 1. La veille de chaque examen est réservée à une relecture légère.
  for (const w of active) {
    if (w.eve >= today && take(w.eve)) w.lightDay = w.eve;
    w.mainTarget = w.summary.remaining - (w.lightDay ? 1 : 0);
    w.mainDays = Math.max(0, diffDays(today, w.mainEnd) + 1);
  }

  // 2. Jour après jour, chaque créneau va à l'examen le plus en retard sur son rythme idéal.
  for (let d = today; d <= horizon; d = addDays(d, 1)) {
    const index = diffDays(today, d) + 1;
    for (;;) {
      if ((free.get(d) || 0) <= 0) break;
      let best: Work | null = null;
      let bestNeed = 0.5;
      for (const w of active) {
        if (w.mainPlaced >= w.mainTarget || d > w.mainEnd || w.mainDays <= 0) continue;
        // Les séances en retard sont dues tout de suite ; le reste suit la courbe idéale.
        const due = Math.min(w.summary.late, w.mainTarget);
        const need = due + (w.mainTarget - due) * Math.pow(index / w.mainDays, RAMP) - w.mainPlaced;
        if (need >= bestNeed - 1e-9 && (best === null || need > bestNeed + 1e-9)) {
          best = w;
          bestNeed = need;
        }
      }
      if (!best || !take(d)) break;
      best.days.push(d);
      best.mainPlaced += 1;
    }
  }

  // 3. Ce qui reste est placé dans les créneaux encore libres, au plus près de l'examen.
  for (const w of active) {
    for (let d = w.mainEnd; w.mainPlaced < w.mainTarget && d >= today; ) {
      if (take(d)) {
        w.days.push(d);
        w.mainPlaced += 1;
      } else {
        d = addDays(d, -1);
      }
    }
  }

  const sessions: PlannedSession[] = [];
  for (const w of active) {
    const s = w.summary;
    const allDays = [...w.days.sort(), ...(w.lightDay ? [w.lightDay] : [])];
    s.planned = allDays.length;
    s.unplaced = s.remaining - s.planned;
    if (s.unplaced > 0) s.status = 'overload';
    else if (s.late > 0) s.status = 'late';

    const breakTitle = (d: Day) => breaks.find((b) => eventCovers(b, d))?.title;
    allDays.forEach((day, i) => {
      const ordinal = s.done + i + 1;
      const isLight = Boolean(w.lightDay) && i === allDays.length - 1;
      const moduleId = !isLight ? w.pendingModules[i] : undefined;
      const kind: SessionKind = isLight ? 'light' : moduleId ? 'module' : kindAt(ordinal, s.total);
      const catchUp = i < s.late;
      const left = diffDays(day, w.event.start);
      const reasons = [
        `Séance ${ordinal} sur ${s.total} pour « ${s.subject} » : difficulté ${DIFFICULTY_LABEL[w.exam.difficulty].toLowerCase()}, niveau « ${LEVEL_LABEL[w.exam.level].toLowerCase()} », objectif « ${GOAL_LABEL[w.exam.goal].toLowerCase()} ».`,
        `L’examen a lieu ${left === 1 ? 'le lendemain' : `${left} jours plus tard`}, le ${formatDayLong(w.event.start).toLocaleLowerCase('fr')}.`
      ];
      if (kind === 'module' && moduleId) {
        const mod = modules[moduleId];
        reasons.push(
          mod.state === 'failed'
            ? `Le quiz du module « ${mod.title} » n’a pas été réussi : une séance de reprise est ajoutée au plan.`
            : `Le module « ${mod.title} » de SAVOIR+ couvre cette matière et n’est pas encore validé.`
        );
      } else if (kind !== 'module') {
        reasons.push(KIND_REASON[kind]);
      }
      if (catchUp) reasons.push('Séance de rattrapage : elle était attendue plus tôt et n’a pas été faite.');
      const inBreak = breakTitle(day);
      if (inBreak) reasons.push(`${inBreak} : réglage « ${BREAK_MODE_LABEL[settings.breakMode].toLowerCase()} » pendant les congés.`);
      sessions.push({
        key: `${w.event.id}:${ordinal}`,
        examId: w.event.id,
        examTitle: w.event.title,
        subject: s.subject,
        day,
        minutes: settings.sessionMinutes,
        ordinal,
        total: s.total,
        kind,
        catchUp,
        moduleId,
        moduleTitle: moduleId ? modules[moduleId]?.title : undefined,
        reasons
      });
    });
  }

  sessions.sort((a, b) => (a.day === b.day ? a.key.localeCompare(b.key) : a.day < b.day ? -1 : 1));
  return { sessions, exams: works.map((w) => w.summary) };
}

/** Phrase d'état d'un examen dans le plan (« En retard de 2 séances », « À jour »…). */
export function examStatusLabel(plan: ExamPlan): string {
  switch (plan.status) {
    case 'past':
      return 'Examen passé';
    case 'today':
      return 'C’est aujourd’hui';
    case 'done':
      return 'Plan terminé';
    case 'overload':
      return `${plural(plan.unplaced, 'séance ne tient', 'séances ne tiennent')} pas avant l’examen`;
    case 'late':
      return `En retard de ${plural(plan.late, 'séance', 'séances')}`;
    case 'ahead':
      return 'En avance';
    default:
      return 'À jour';
  }
}

/** Le calcul de la charge, en phrases (« Voir le calcul »). */
export function explainLoad(exam: ExamSettings, load: LoadBreakdown): string[] {
  const hours = (load.minutes / 60).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
  const lines = [
    `Difficulté ${DIFFICULTY_LABEL[exam.difficulty].toLowerCase()} : base de ${load.baseHours} heures de révision.`,
    `Niveau « ${LEVEL_LABEL[exam.level].toLowerCase()} » : base multipliée par ${load.levelFactor.toLocaleString('fr-FR')}.`,
    `Objectif « ${GOAL_LABEL[exam.goal].toLowerCase()} » : résultat multiplié par ${load.goalFactor.toLocaleString('fr-FR')}.`,
    `Soit environ ${hours} heures, découpées en ${plural(load.sessions, 'séance', 'séances')} de ${load.sessionMinutes} minutes.`
  ];
  if (load.extraSessions > 0) {
    lines.push(`${plural(load.extraSessions, 'séance ajoutée', 'séances ajoutées')} après un quiz non réussi sur un module lié.`);
  }
  return lines;
}

/* ------------------------------------------------------------------ Lecture par jour */

export interface DayMarks {
  exam: boolean;
  break: boolean;
  marker: boolean;
  /** Séances prévues ce jour-là. */
  planned: number;
  /** Séances faites ce jour-là. */
  done: number;
}

/** Ce qu'un jour contient, pour marquer la grille du mois. */
export function marksForDay(day: Day, events: CalendarEvent[], sessions: PlannedSession[], log: SessionLog[]): DayMarks {
  const marks: DayMarks = { exam: false, break: false, marker: false, planned: 0, done: 0 };
  for (const e of events) {
    if (!eventCovers(e, day)) continue;
    if (e.kind === 'exam') marks.exam = true;
    else if (e.kind === 'break') marks.break = true;
    else marks.marker = true;
  }
  for (const s of sessions) if (s.day === day) marks.planned += 1;
  for (const entry of log) if (entry.day === day) marks.done += 1;
  return marks;
}

/** Prochaine date d'examen à partir d'aujourd'hui (examens du plan comme repères nationaux). */
export function nextExam(events: CalendarEvent[], today: Day): CalendarEvent | undefined {
  return events.filter((e) => e.kind === 'exam' && eventEnd(e) >= today).sort(byStart)[0];
}

/**
 * Série en cours : nombre de jours de suite avec au moins une séance faite. Tant que la journée
 * n'est pas finie, la série de la veille tient encore.
 */
export function currentStreak(log: SessionLog[], today: Day): { days: number; doneToday: boolean } {
  const days = new Set(log.map((entry) => entry.day));
  const doneToday = days.has(today);
  let count = 0;
  for (let cursor = doneToday ? today : addDays(today, -1); days.has(cursor); cursor = addDays(cursor, -1)) count += 1;
  return { days: count, doneToday };
}

/** Les quatre repères du calendrier : série, séances du jour, prochain examen, retard. */
export interface PlanGauges {
  streak: number;
  /** Séances faites aujourd'hui. */
  doneToday: number;
  /** Séances encore à faire aujourd'hui. */
  todo: number;
  /** Jours avant le prochain examen ; `null` s'il n'y en a pas. */
  examDays: number | null;
  examTitle?: string;
  /** Séances en retard, déjà replacées dans le plan. */
  late: number;
  /** Séances qui ne tiennent pas avant leur examen. */
  unplaced: number;
}

export function planGauges(plan: RevisionPlan, events: CalendarEvent[], log: SessionLog[], today: Day): PlanGauges {
  const upcoming = nextExam(events, today);
  const open = plan.exams.filter((e) => e.status !== 'past' && e.status !== 'today');
  return {
    streak: currentStreak(log, today).days,
    doneToday: log.filter((entry) => entry.day === today).length,
    todo: plan.sessions.filter((s) => s.day === today).length,
    examDays: upcoming ? Math.max(0, diffDays(today, upcoming.start)) : null,
    examTitle: upcoming?.title,
    late: open.reduce((sum, e) => sum + e.late, 0),
    unplaced: open.reduce((sum, e) => sum + e.unplaced, 0)
  };
}

/* ------------------------------------------------------------------ Données de démonstration */

/** Examen placé un jour de semaine : un samedi ou un dimanche glisse au lundi. */
const onWeekday = (day: Day): Day => (weekdayOf(day) === 6 ? addDays(day, 2) : weekdayOf(day) === 0 ? addDays(day, 1) : day);

/**
 * Calendrier de départ d'un personnage de démonstration. Les dates sont relatives au jour de la
 * visite, pour que le plan reste vivant quel que soit le moment où l'on ouvre la démonstration.
 */
export function demoCalendarState(uid: string, today: Day): CalendarUserState {
  const state = emptyCalendarState();
  if (uid !== 'afi') return state;
  const createdOn = addDays(today, -5);
  return {
    ...state,
    events: [
      {
        id: 'demo-exam-securite',
        kind: 'exam',
        title: 'Évaluation · Sécurité numérique',
        start: onWeekday(addDays(today, 10)),
        source: 'user',
        createdOn,
        exam: { subject: 'Sécurité numérique', difficulty: 2, level: 3, goal: 'high', moduleIds: ['phishing', 'comptes'] }
      },
      {
        id: 'demo-exam-reseaux',
        kind: 'exam',
        title: 'Évaluation · Réseaux informatiques',
        start: onWeekday(addDays(today, 19)),
        source: 'user',
        createdOn,
        exam: { subject: 'Réseaux informatiques', difficulty: 3, level: 2, goal: 'pass', moduleIds: ['reseaux'] }
      },
      {
        id: 'demo-exam-oral',
        kind: 'exam',
        title: 'Oral · Communication professionnelle',
        start: onWeekday(addDays(today, 26)),
        source: 'user',
        createdOn,
        exam: { subject: 'Communication professionnelle', difficulty: 1, level: 3, goal: 'pass' }
      }
    ],
    // Deux séances faites en sécurité numérique, avant-hier et hier (série de deux jours) ;
    // aucune encore en réseaux : le plan y signale un retard et replace la séance aujourd'hui.
    log: [
      { examId: 'demo-exam-securite', day: addDays(today, -2), minutes: 45, kind: 'learn' },
      { examId: 'demo-exam-securite', day: addDays(today, -1), minutes: 45, kind: 'learn' }
    ]
  };
}
