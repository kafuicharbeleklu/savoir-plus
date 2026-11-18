/**
 * Verrouillage de SAVOIR+ par le parent, pour un enfant de moins de 12 ans.
 *
 * Le parent règle, selon son besoin : une mise en pause immédiate, un temps par jour (en semaine,
 * le week-end), une plage horaire, et ce qui reste ouvert en dehors des modules (fil, messagerie).
 * Un site ne peut pas verrouiller l'appareil lui-même : la règle s'applique à SAVOIR+, sur les
 * appareils où l'enfant est connecté ; le parent le lit dans son espace.
 *
 * Fondements, relevés le 18 novembre 2026 :
 * – les enfants jugent durement les contrôles parentaux vécus comme de la surveillance (79 % de
 *   leurs avis à deux étoiles ou moins) et préfèrent la discussion (Ghosh et al., CHI 2018) :
 *   l'enfant voit ses règles et peut demander du temps ; le parent ne voit que des minutes, jamais
 *   ce que l'enfant lit ou écrit ;
 * – un avertissement avant la fin rend la transition plus difficile ; une routine, une fin « due à
 *   l'outil » et un point d'arrêt naturel la facilitent (Hiniker et al., CHI 2016) : pas de compte à
 *   rebours, des plages fixes, et une partie de module commencée se termine avant la pause.
 */
import { addDays, dayFromDate, isWeekend, type Day } from './calendar';
import { accountOf, ageBandOf, guardiansOf, type DeviceRules, type SchoolState } from './school';

/** Au départ, rien n'est verrouillé : le parent règle selon son besoin. */
export const defaultRules = (childId: string): DeviceRules => ({
  childId,
  lockedNow: false,
  weekdayMinutes: 0,
  weekendMinutes: 0,
  weekdayFrom: '00:00',
  weekdayTo: '24:00',
  weekendFrom: '00:00',
  weekendTo: '24:00',
  allowFeed: true,
  allowMessages: true
});

/** Le verrouillage concerne un enfant de moins de 12 ans rattaché à au moins un parent. */
export const lockApplies = (school: SchoolState, childId: string, today: Day): boolean =>
  ageBandOf(accountOf(school, childId), today) === 'child' && guardiansOf(school, childId).length > 0;

export const rulesOf = (school: SchoolState, childId: string): DeviceRules =>
  school.deviceRules.find((r) => r.childId === childId) || defaultRules(childId);

export const setRules = (school: SchoolState, rules: DeviceRules): SchoolState => ({
  ...school,
  deviceRules: [...school.deviceRules.filter((r) => r.childId !== rules.childId), rules]
});

/* ------------------------------------------------------------------ temps passé */

export const minutesUsed = (school: SchoolState, childId: string, day: Day): number =>
  school.screenUsage.find((u) => u.childId === childId && u.day === day)?.minutes || 0;

/** Ajoute des minutes au jour ; seuls les quatorze derniers jours sont gardés. */
export function addUsage(school: SchoolState, childId: string, day: Day, minutes = 1): SchoolState {
  const oldest = addDays(day, -13);
  const others = school.screenUsage.filter((u) => !(u.childId === childId && u.day === day) && !(u.childId === childId && u.day < oldest));
  return { ...school, screenUsage: [...others, { childId, day, minutes: minutesUsed(school, childId, day) + minutes }] };
}

/* ------------------------------------------------------------------ libellés */

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
};

/** « 16:00 » → « 16 h », « 18:30 » → « 18 h 30 », « 24:00 » et « 00:00 » → « minuit ». */
export const formatHour = (hhmm: string): string => {
  const [h, m] = hhmm.split(':');
  if (hhmm === '24:00' || hhmm === '00:00') return 'minuit';
  return m === '00' ? `${Number(h)} h` : `${Number(h)} h ${m}`;
};

/** 45 → « 45 min », 90 → « 1 h 30 », 120 → « 2 h ». */
export const formatMinutes = (n: number): string =>
  n < 60 ? `${n} min` : n % 60 === 0 ? `${n / 60} h` : `${Math.floor(n / 60)} h ${String(n % 60).padStart(2, '0')}`;

export const allDay = (from: string, to: string) => from === '00:00' && to === '24:00';

/** « de 16 h à 20 h », ou « toute la journée ». */
export const formatWindow = (from: string, to: string): string => (allDay(from, to) ? 'toute la journée' : `de ${formatHour(from)} à ${formatHour(to)}`);

const limitLabel = (n: number) => (n > 0 ? formatMinutes(n) : 'sans limite');

/** Les règles en une phrase, pour l'enfant comme pour le parent. */
export function rulesSummary(rules: DeviceRules): string {
  const parts: string[] = [];
  if (rules.weekdayMinutes === rules.weekendMinutes) {
    parts.push(rules.weekdayMinutes > 0 ? `${formatMinutes(rules.weekdayMinutes)} par jour` : 'pas de limite de temps');
  } else {
    parts.push(`${limitLabel(rules.weekdayMinutes)} en semaine, ${limitLabel(rules.weekendMinutes)} le week-end`);
  }
  const week = formatWindow(rules.weekdayFrom, rules.weekdayTo);
  const end = formatWindow(rules.weekendFrom, rules.weekendTo);
  if (week === end) {
    if (week !== 'toute la journée') parts.push(week);
  } else {
    parts.push(`${week} en semaine, ${end} le week-end`);
  }
  return parts.join(' ; ');
}

/* ------------------------------------------------------------------ état du jour */

export type LockReason = 'manual' | 'hours' | 'limit';

export interface LockState {
  locked: boolean;
  reason?: LockReason;
  /** Quand SAVOIR+ rouvre : « à 16 h », « demain à 7 h », « demain ». */
  reopens?: string;
  /** Minutes passées aujourd'hui, et limite du jour (0 : sans limite), temps accordé compris. */
  used: number;
  limit: number;
}

/** Une partie de module commencée se termine avant la pause, dans cette limite. */
export const GRACE_MINUTES = 15;

const ofDay = (rules: DeviceRules, day: Day) =>
  isWeekend(day)
    ? { limit: rules.weekendMinutes, from: rules.weekendFrom, to: rules.weekendTo }
    : { limit: rules.weekdayMinutes, from: rules.weekdayFrom, to: rules.weekdayTo };

/**
 * L'état de SAVOIR+ pour l'enfant, à cet instant. `inStudy` : il lit une partie de module ou passe
 * son quiz ; quand le temps du jour s'achève, il finit ce qu'il a commencé (point d'arrêt naturel).
 */
export function lockState(school: SchoolState, childId: string, now: Date, inStudy = false): LockState {
  const rules = rulesOf(school, childId);
  const day = dayFromDate(now);
  const today = ofDay(rules, day);
  const bonus = rules.bonus?.day === day ? rules.bonus.minutes : 0;
  const limit = today.limit > 0 ? today.limit + bonus : 0;
  const used = minutesUsed(school, childId, day);
  const minute = now.getHours() * 60 + now.getMinutes();
  const next = ofDay(rules, addDays(day, 1));
  const tomorrow = next.from === '00:00' ? 'demain' : `demain à ${formatHour(next.from)}`;

  if (rules.lockedNow) return { locked: true, reason: 'manual', used, limit };
  if (minute < toMinutes(today.from)) return { locked: true, reason: 'hours', reopens: `à ${formatHour(today.from)}`, used, limit };
  if (minute >= toMinutes(today.to)) return { locked: true, reason: 'hours', reopens: tomorrow, used, limit };
  if (limit > 0 && used >= limit && !(inStudy && used < limit + GRACE_MINUTES)) {
    return { locked: true, reason: 'limit', reopens: tomorrow, used, limit };
  }
  return { locked: false, used, limit };
}

/* ------------------------------------------------------------------ demandes de temps */

const clockLabel = (now: Date) => `${now.getHours()} h ${String(now.getMinutes()).padStart(2, '0')}`;

export const requestOfDay = (school: SchoolState, childId: string, day: Day) =>
  [...school.timeRequests].reverse().find((r) => r.childId === childId && r.day === day);

/** L'enfant demande du temps : une demande en attente à la fois. */
export function requestTime(school: SchoolState, childId: string, now: Date): SchoolState {
  const day = dayFromDate(now);
  if (requestOfDay(school, childId, day)?.status === 'pending') return school;
  const id = `TR-${day}-${childId}-${school.timeRequests.length + 1}`;
  return { ...school, timeRequests: [...school.timeRequests, { id, childId, day, at: clockLabel(now), status: 'pending' }] };
}

/** Le parent répond : des minutes en plus pour ce jour-là, ou non (`null`). */
export function answerRequest(school: SchoolState, requestId: string, minutes: number | null): SchoolState {
  const request = school.timeRequests.find((r) => r.id === requestId);
  if (!request || request.status !== 'pending') return school;
  const timeRequests = school.timeRequests.map((r) =>
    r.id === requestId ? { ...r, status: minutes ? ('granted' as const) : ('declined' as const), minutes: minutes || undefined } : r
  );
  if (!minutes) return { ...school, timeRequests };
  const rules = rulesOf(school, request.childId);
  const already = rules.bonus?.day === request.day ? rules.bonus.minutes : 0;
  return setRules({ ...school, timeRequests }, { ...rules, bonus: { day: request.day, minutes: already + minutes } });
}
