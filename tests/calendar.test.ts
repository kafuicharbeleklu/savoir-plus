import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SCHOOL_CALENDAR,
  addDays,
  buildMonthGrid,
  buildRevisionPlan,
  computeLoad,
  countdownLabel,
  currentStreak,
  daySlots,
  demoCalendarState,
  diffDays,
  editSchoolEvent,
  emptyCalendarState,
  eventEnd,
  examStatusLabel,
  explainLoad,
  formatRange,
  isValidDay,
  logSession,
  marksForDay,
  nextExam,
  normalizeCalendarState,
  planGauges,
  removeEvent,
  resolveEvents,
  unlogSession,
  upsertUserEvent,
  weekdayOf,
  DEFAULT_PLAN_SETTINGS,
  type CalendarEvent,
  type Day,
  type ExamSettings,
  type PlanSettings
} from '../src/calendar';

const TODAY: Day = '2026-11-17'; // un mardi

const exam = (id: string, start: Day, settings: Partial<ExamSettings> = {}, extra: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id,
  kind: 'exam',
  title: `Examen ${id}`,
  start,
  source: 'user',
  exam: { subject: id, difficulty: 2, level: 2, goal: 'pass', ...settings },
  ...extra
});

const countByDay = (days: Day[]) => days.reduce<Record<Day, number>>((acc, d) => ({ ...acc, [d]: (acc[d] || 0) + 1 }), {});

test('jours civils : calcul, validité et libellés français', () => {
  assert.equal(weekdayOf(TODAY), 2);
  assert.equal(addDays('2026-12-30', 3), '2027-01-02');
  assert.equal(addDays('2027-03-01', -1), '2027-02-28');
  assert.equal(diffDays('2026-11-17', '2026-12-05'), 18);
  assert.equal(diffDays('2026-12-05', '2026-11-17'), -18);
  assert.ok(isValidDay('2026-02-28'));
  assert.ok(!isValidDay('2026-02-30'));
  assert.ok(!isValidDay('17/11/2026'));

  assert.equal(formatRange('2026-11-17'), '17 nov.');
  assert.equal(formatRange('2027-02-13', '2027-02-21'), '13 – 21 févr.');
  assert.equal(formatRange('2026-12-24', '2027-01-03'), '24 déc. – 3 janv.');
  assert.equal(countdownLabel(0), 'aujourd’hui');
  assert.equal(countdownLabel(1), 'demain');
  assert.equal(countdownLabel(12), 'dans 12 jours');
  assert.equal(countdownLabel(-3), 'il y a 3 jours');
});

test('grille du mois : semaines du lundi au dimanche, mois complet', () => {
  // Novembre 2026 commence un dimanche : six lignes, la première démarre le lundi 26 octobre.
  const november = buildMonthGrid(2026, 10);
  assert.equal(november.length, 6);
  assert.equal(november[0][0], '2026-10-26');
  assert.equal(november[0][6], '2026-11-01');
  assert.equal(november[5][0], '2026-11-30');
  assert.ok(november.every((week) => week.length === 7 && weekdayOf(week[0]) === 1));

  // Février 2027 commence un lundi et dure 28 jours : quatre lignes exactement.
  const february = buildMonthGrid(2027, 1);
  assert.equal(february.length, 4);
  assert.equal(february[0][0], '2027-02-01');
  assert.equal(february[3][6], '2027-02-28');
});

test('calendrier scolaire : dates cohérentes, examens nationaux affichés seulement s’ils sont préparés', () => {
  for (const entry of SCHOOL_CALENDAR.entries) {
    assert.ok(isValidDay(entry.start), `${entry.id} : début invalide`);
    if (entry.end) assert.ok(isValidDay(entry.end) && entry.end > entry.start, `${entry.id} : fin invalide`);
    assert.ok(entry.certainty === 'announced' || entry.certainty === 'to-confirm');
    assert.equal(entry.source, 'school');
  }
  // Congés de Noël : 11 jours, reprise le 4 janvier.
  const noel = SCHOOL_CALENDAR.entries.find((e) => e.id === 'sc-noel')!;
  assert.equal(diffDays(noel.start, eventEnd(noel)) + 1, 11);
  assert.equal(addDays(eventEnd(noel), 1), '2027-01-04');

  const base = emptyCalendarState();
  const defaults = resolveEvents(base);
  assert.ok(defaults.some((e) => e.id === 'sc-noel'));
  assert.ok(defaults.every((e) => e.kind !== 'exam'), 'aucun examen national sans choix du membre');
  assert.ok(!defaults.some((e) => e.id.startsWith('sc-insc-')));
  assert.deepEqual(
    defaults.map((e) => e.start),
    [...defaults.map((e) => e.start)].sort(),
    'dates triées'
  );

  const bac2 = resolveEvents({ ...base, nationalExam: 'bac2' });
  assert.deepEqual(
    bac2.filter((e) => e.id.includes('bac') || e.id.includes('cepd') || e.id.includes('bepc')).map((e) => e.id),
    ['sc-insc-bac2', 'sc-bac2']
  );
  // Un repère national n'a pas de réglages : il ne crée aucune séance tant que l'élève n'ajoute pas ses matières.
  assert.equal(buildRevisionPlan({ events: bac2, settings: DEFAULT_PLAN_SETTINGS, log: [], today: TODAY }).sessions.length, 0);

  assert.equal(resolveEvents({ ...base, showSchool: false }).length, 0);
});

test('calendrier scolaire : le membre corrige ou retire une date sans toucher aux autres', () => {
  let state = emptyCalendarState();
  state = editSchoolEvent(state, 'sc-detente', '2027-02-12', '2027-02-21');
  const edited = resolveEvents(state).find((e) => e.id === 'sc-detente')!;
  assert.equal(edited.start, '2027-02-12');
  assert.equal(edited.certainty, 'edited');

  state = removeEvent(state, { id: 'sc-paques', source: 'school' });
  assert.ok(!resolveEvents(state).some((e) => e.id === 'sc-paques'));
  assert.ok(resolveEvents(state).some((e) => e.id === 'sc-noel'));

  state = upsertUserEvent(state, exam('maths', '2026-12-10'));
  state = upsertUserEvent(state, exam('maths', '2026-12-11'));
  assert.equal(state.events.length, 1);
  assert.equal(state.events[0].start, '2026-12-11');
  state = logSession(state, { examId: 'maths', minutes: 45, kind: 'learn' }, TODAY);
  state = removeEvent(state, { id: 'maths', source: 'user' });
  assert.equal(state.events.length, 0);
  assert.equal(state.log.length, 0, 'les séances de l’examen supprimé partent avec lui');
});

test('charge de révision : difficulté, niveau et objectif donnent le nombre de séances', () => {
  assert.equal(computeLoad({ subject: 'x', difficulty: 3, level: 1, goal: 'high' }, 45).minutes, 936);
  assert.equal(computeLoad({ subject: 'x', difficulty: 3, level: 1, goal: 'high' }, 45).sessions, 21);
  assert.equal(computeLoad({ subject: 'x', difficulty: 2, level: 2, goal: 'pass' }, 45).sessions, 8);
  assert.equal(computeLoad({ subject: 'x', difficulty: 1, level: 3, goal: 'pass' }, 45).sessions, 3);
  // Jamais moins de deux séances ; un quiz raté en ajoute.
  assert.equal(computeLoad({ subject: 'x', difficulty: 1, level: 3, goal: 'pass' }, 120).sessions, 2);
  assert.equal(computeLoad({ subject: 'x', difficulty: 2, level: 2, goal: 'pass' }, 45, 1).total, 9);
  // Viser plus haut demande plus de séances qu'avoir la moyenne, toutes choses égales.
  const pass = computeLoad({ subject: 'x', difficulty: 2, level: 2, goal: 'pass' }, 45);
  const high = computeLoad({ subject: 'x', difficulty: 2, level: 2, goal: 'high' }, 45);
  assert.ok(high.sessions > pass.sessions);

  const lines = explainLoad({ subject: 'x', difficulty: 3, level: 1, goal: 'high' }, computeLoad({ subject: 'x', difficulty: 3, level: 1, goal: 'high' }, 45));
  assert.equal(lines.length, 4);
  assert.match(lines[3], /15,6 heures.*21 séances de 45 minutes/);
});

test('créneaux d’une journée : rythme, jour de repos, congés et jour d’épreuve', () => {
  const settings: PlanSettings = { ...DEFAULT_PLAN_SETTINGS };
  const noBreak: CalendarEvent[] = [];
  const none = new Set<Day>();
  assert.equal(daySlots('2026-11-17', settings, noBreak, none), 1); // mardi : 45 min
  assert.equal(daySlots('2026-11-21', settings, noBreak, none), 2); // samedi : 90 min
  assert.equal(daySlots('2026-11-22', { ...settings, restDay: 0 }, noBreak, none), 0); // dimanche de repos
  assert.equal(daySlots('2026-11-17', settings, noBreak, new Set(['2026-11-17'])), 0); // jour d'épreuve

  const noel = SCHOOL_CALENDAR.entries.filter((e) => e.id === 'sc-noel');
  assert.equal(daySlots('2026-12-28', settings, noel, none), 1); // lundi de congé, même rythme
  assert.equal(daySlots('2026-12-28', { ...settings, breakMode: 'rest' }, noel, none), 0);
  assert.equal(daySlots('2026-12-28', { ...settings, breakMode: 'boost' }, noel, none), 2);
});

test('plan de révision : toutes les séances avant l’examen, relecture légère la veille', () => {
  const events = [exam('maths', '2026-12-02')]; // dans 15 jours
  const plan = buildRevisionPlan({ events, settings: DEFAULT_PLAN_SETTINGS, log: [], today: TODAY });
  const summary = plan.exams[0];
  assert.equal(summary.total, 8);
  assert.equal(summary.remaining, 8);
  assert.equal(summary.planned, 8);
  assert.equal(summary.unplaced, 0);
  assert.equal(summary.status, 'on-track');
  assert.equal(examStatusLabel(summary), 'À jour');

  assert.equal(plan.sessions.length, 8);
  assert.deepEqual(plan.sessions.map((s) => s.ordinal), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.ok(plan.sessions.every((s) => s.day >= TODAY && s.day < '2026-12-02'));
  // La veille : une seule séance, légère ; c'est la dernière du plan.
  const eve = plan.sessions.filter((s) => s.day === '2026-12-01');
  assert.equal(eve.length, 1);
  assert.equal(eve[0].kind, 'light');
  assert.equal(eve[0].ordinal, 8);
  // Aucun jour ne dépasse ses créneaux.
  for (const [day, count] of Object.entries(countByDay(plan.sessions.map((s) => s.day)))) {
    assert.ok(count <= daySlots(day, DEFAULT_PLAN_SETTINGS, [], new Set(['2026-12-02'])), `${day} surchargé`);
  }
  // Les phases se suivent : comprendre, s'exercer, se tester, puis relire.
  const kinds = plan.sessions.map((s) => s.kind);
  assert.deepEqual(kinds, ['learn', 'learn', 'learn', 'practice', 'practice', 'practice', 'test', 'light']);
  // Chaque séance explique sa présence.
  assert.ok(plan.sessions.every((s) => s.reasons.length >= 3));
  assert.match(plan.sessions[0].reasons[0], /Séance 1 sur 8 pour « maths »/);
});

test('plan de révision : jour de repos et congés respectés', () => {
  const events: CalendarEvent[] = [
    exam('maths', '2027-01-08', { difficulty: 3, level: 2, goal: 'high' }), // 16 séances
    ...SCHOOL_CALENDAR.entries.filter((e) => e.id === 'sc-noel')
  ];
  const today: Day = '2026-12-14';
  const sundayOff = buildRevisionPlan({ events, settings: { ...DEFAULT_PLAN_SETTINGS, restDay: 0 }, log: [], today });
  assert.ok(sundayOff.sessions.length > 0);
  assert.ok(sundayOff.sessions.every((s) => weekdayOf(s.day) !== 0), 'aucune séance le dimanche');

  const restBreak = buildRevisionPlan({ events, settings: { ...DEFAULT_PLAN_SETTINGS, breakMode: 'rest' }, log: [], today });
  assert.ok(restBreak.sessions.every((s) => s.day < '2026-12-24' || s.day > '2027-01-03'), 'aucune séance pendant les congés');

  const normal = buildRevisionPlan({ events, settings: DEFAULT_PLAN_SETTINGS, log: [], today });
  const inBreak = normal.sessions.find((s) => s.day >= '2026-12-24' && s.day <= '2027-01-03');
  assert.ok(inBreak, 'des séances pendant les congés en rythme normal');
  assert.ok(inBreak!.reasons.some((r) => r.startsWith('Congés de Noël')));
});

test('plan de révision : une séance faite avance le plan, une séance manquée est replacée', () => {
  const created: Day = '2026-11-07';
  const events = [exam('maths', '2026-12-02', {}, { createdOn: created })];
  const settings = DEFAULT_PLAN_SETTINGS;

  // Rien de fait depuis dix jours : le plan attendait déjà des séances.
  const lateRun = buildRevisionPlan({ events, settings, log: [], today: TODAY });
  const late = lateRun.exams[0];
  assert.equal(late.status, 'late');
  assert.ok(late.late >= 1);
  assert.equal(examStatusLabel(late), late.late > 1 ? `En retard de ${late.late} séances` : 'En retard de 1 séance');
  assert.equal(lateRun.sessions.filter((s) => s.catchUp).length, late.late);
  assert.ok(lateRun.sessions[0].catchUp);
  assert.ok(lateRun.sessions[0].reasons.some((r) => r.startsWith('Séance de rattrapage')));
  // Rien n'est perdu : les huit séances tiennent encore avant l'examen.
  assert.equal(late.planned, 8);

  // L'élève rattrape : le retard disparaît et le plan repart du bon rang.
  const log = Array.from({ length: late.late }, (_, i) => ({ examId: 'maths', day: addDays(TODAY, -1 - i), minutes: 45, kind: 'learn' as const }));
  const caughtUp = buildRevisionPlan({ events, settings, log, today: TODAY });
  assert.equal(caughtUp.exams[0].status, 'on-track');
  assert.equal(caughtUp.exams[0].done, late.late);
  assert.equal(caughtUp.sessions[0].ordinal, late.late + 1);
  assert.equal(caughtUp.sessions.length, 8 - late.late);

  // Une séance faite aujourd'hui occupe son créneau : le plan n'en remet pas une seconde le même jour (mardi : 1 créneau).
  const todayDone = buildRevisionPlan({ events, settings, log: [{ examId: 'maths', day: TODAY, minutes: 45, kind: 'learn' }], today: TODAY });
  assert.ok(todayDone.sessions.every((s) => s.day > TODAY));
});

test('plan de révision : charge impossible signalée, jamais maquillée', () => {
  // Examen difficile après-demain : seules deux séances tiennent (une aujourd'hui, une relecture la veille).
  const events = [exam('physique', addDays(TODAY, 2), { difficulty: 3, level: 1, goal: 'high' })];
  const plan = buildRevisionPlan({ events, settings: DEFAULT_PLAN_SETTINGS, log: [], today: TODAY });
  const summary = plan.exams[0];
  assert.equal(summary.total, 21);
  assert.equal(summary.planned, 2);
  assert.equal(summary.unplaced, 19);
  assert.equal(summary.status, 'overload');
  assert.equal(examStatusLabel(summary), '19 séances ne tiennent pas avant l’examen');
  assert.equal(plan.sessions.at(-1)!.kind, 'light');

  // Examen demain : une relecture légère, rien d'autre.
  const tomorrow = buildRevisionPlan({ events: [exam('svt', addDays(TODAY, 1))], settings: DEFAULT_PLAN_SETTINGS, log: [], today: TODAY });
  assert.deepEqual(tomorrow.sessions.map((s) => [s.day, s.kind]), [[TODAY, 'light']]);

  // Jour de l'examen, puis lendemain : plus aucune séance.
  const sameDay = buildRevisionPlan({ events: [exam('svt', TODAY)], settings: DEFAULT_PLAN_SETTINGS, log: [], today: TODAY });
  assert.equal(sameDay.sessions.length, 0);
  assert.equal(sameDay.exams[0].status, 'today');
  const after = buildRevisionPlan({ events: [exam('svt', addDays(TODAY, -1))], settings: DEFAULT_PLAN_SETTINGS, log: [], today: TODAY });
  assert.equal(after.exams[0].status, 'past');
});

test('plan de révision : plusieurs examens se partagent les créneaux sans dépasser', () => {
  const events = [
    exam('maths', '2026-11-27', { difficulty: 2, level: 2, goal: 'pass' }), // 8 séances
    exam('anglais', '2026-12-04', { difficulty: 1, level: 2, goal: 'pass' }) // 5 séances
  ];
  const plan = buildRevisionPlan({ events, settings: DEFAULT_PLAN_SETTINGS, log: [], today: TODAY });
  const examDays = new Set<Day>(['2026-11-27', '2026-12-04']);
  for (const [day, count] of Object.entries(countByDay(plan.sessions.map((s) => s.day)))) {
    assert.ok(count <= daySlots(day, DEFAULT_PLAN_SETTINGS, [], examDays), `${day} surchargé`);
  }
  assert.ok(plan.sessions.every((s) => !examDays.has(s.day)), 'aucune révision un jour d’épreuve');
  assert.ok(plan.sessions.filter((s) => s.examId === 'maths').every((s) => s.day < '2026-11-27'));
  assert.ok(plan.sessions.filter((s) => s.examId === 'anglais').every((s) => s.day < '2026-12-04'));
  assert.equal(plan.exams.find((e) => e.examId === 'maths')!.unplaced, 0);
  assert.equal(plan.exams.find((e) => e.examId === 'anglais')!.unplaced, 0);
  // Séances triées par jour.
  assert.deepEqual(plan.sessions.map((s) => s.day), [...plan.sessions.map((s) => s.day)].sort());
});

test('plan de révision : un module lié non validé ouvre le plan, un quiz raté ajoute une séance', () => {
  const events = [exam('reseaux', '2026-12-08', { moduleIds: ['reseaux', 'inconnu'] })];
  const base = { events, settings: DEFAULT_PLAN_SETTINGS, log: [], today: TODAY };

  const fresh = buildRevisionPlan({ ...base, modules: { reseaux: { title: 'Comprendre les réseaux', state: 'new' } } });
  assert.equal(fresh.exams[0].total, 8);
  assert.equal(fresh.sessions[0].kind, 'module');
  assert.equal(fresh.sessions[0].moduleId, 'reseaux');
  assert.ok(fresh.sessions[0].reasons.some((r) => r.includes('« Comprendre les réseaux »') && r.includes('pas encore validé')));
  assert.equal(fresh.sessions.filter((s) => s.kind === 'module').length, 1, 'un module inconnu du catalogue est ignoré');

  const failed = buildRevisionPlan({ ...base, modules: { reseaux: { title: 'Comprendre les réseaux', state: 'failed' } } });
  assert.equal(failed.exams[0].total, 9);
  assert.equal(failed.exams[0].load.extraSessions, 1);
  assert.ok(failed.sessions[0].reasons.some((r) => r.includes('n’a pas été réussi')));

  const validated = buildRevisionPlan({ ...base, modules: { reseaux: { title: 'Comprendre les réseaux', state: 'validated' } } });
  assert.equal(validated.exams[0].total, 8);
  assert.ok(validated.sessions.every((s) => s.kind !== 'module'));
});

test('séances notées : faire, annuler, et lecture d’une journée', () => {
  let state = upsertUserEvent(emptyCalendarState(), exam('maths', '2026-12-02'));
  state = logSession(state, { examId: 'maths', minutes: 45, kind: 'learn' }, TODAY);
  state = logSession(state, { examId: 'maths', minutes: 45, kind: 'learn' }, TODAY);
  assert.equal(state.log.length, 2);
  state = unlogSession(state, 'maths', TODAY);
  assert.equal(state.log.length, 1);
  assert.equal(unlogSession(state, 'maths', '2026-11-01'), state, 'rien à annuler ce jour-là');

  const events = resolveEvents(state);
  const plan = buildRevisionPlan({ events, settings: state.settings, log: state.log, today: TODAY });
  const marks = marksForDay(TODAY, events, plan.sessions, state.log);
  assert.equal(marks.done, 1);
  assert.equal(marks.planned, 0);
  assert.equal(marksForDay('2026-12-02', events, plan.sessions, state.log).exam, true);
  assert.equal(marksForDay('2026-12-25', events, plan.sessions, state.log).break, true);
  assert.equal(nextExam(events, TODAY)?.id, 'maths');
  assert.equal(nextExam(events, '2026-12-03'), undefined);
});

test('rattrapage : une séance en retard est due tout de suite, dès aujourd’hui', () => {
  const events = [exam('maths', '2026-12-10', {}, { createdOn: '2026-11-03' })];
  const plan = buildRevisionPlan({ events, settings: DEFAULT_PLAN_SETTINGS, log: [], today: TODAY });
  assert.ok(plan.exams[0].late >= 1);
  assert.equal(plan.sessions[0].day, TODAY, 'la première séance de rattrapage est aujourd’hui');
  assert.ok(plan.sessions[0].catchUp);

  // Sans retard, le plan ne force rien le premier jour : il suit la courbe.
  const fresh = buildRevisionPlan({ events: [exam('maths', '2026-12-10')], settings: DEFAULT_PLAN_SETTINGS, log: [], today: TODAY });
  assert.equal(fresh.exams[0].late, 0);
  assert.ok(fresh.sessions[0].day > TODAY);
});

test('repères du plan : série de jours, séances du jour, prochain examen, retard', () => {
  const log = (days: Day[]) => days.map((day) => ({ examId: 'maths', day, minutes: 45, kind: 'learn' as const }));
  // Série : jours de suite ; elle tient tant que la journée en cours n'est pas finie.
  assert.deepEqual(currentStreak([], TODAY), { days: 0, doneToday: false });
  assert.deepEqual(currentStreak(log(['2026-11-15', '2026-11-16']), TODAY), { days: 2, doneToday: false });
  assert.deepEqual(currentStreak(log(['2026-11-15', '2026-11-16', '2026-11-17']), TODAY), { days: 3, doneToday: true });
  assert.deepEqual(currentStreak(log(['2026-11-14', '2026-11-15']), TODAY), { days: 0, doneToday: false }, 'un jour sauté remet la série à zéro');
  assert.deepEqual(currentStreak(log(['2026-11-16', '2026-11-16']), TODAY).days, 1, 'deux séances le même jour comptent pour un jour');

  const state = demoCalendarState('afi', TODAY);
  const events = resolveEvents(state);
  const plan = buildRevisionPlan({ events, settings: state.settings, log: state.log, today: TODAY });
  const gauges = planGauges(plan, events, state.log, TODAY);
  assert.equal(gauges.streak, 2);
  assert.equal(gauges.doneToday, 0);
  assert.equal(gauges.todo, 1, 'la séance en retard est replacée aujourd’hui');
  assert.equal(gauges.examDays, 10);
  assert.equal(gauges.examTitle, 'Évaluation · Sécurité numérique');
  assert.equal(gauges.late, 1);
  assert.equal(gauges.unplaced, 0);

  // La séance faite : la série passe à trois jours, plus rien à faire aujourd'hui, plus de retard.
  const session = plan.sessions.find((s) => s.day === TODAY)!;
  const after = logSession(state, session, TODAY);
  const nextPlan = buildRevisionPlan({ events, settings: after.settings, log: after.log, today: TODAY });
  const nextGauges = planGauges(nextPlan, events, after.log, TODAY);
  assert.equal(nextGauges.streak, 3);
  assert.equal(nextGauges.doneToday, 1);
  assert.equal(nextGauges.todo, 0);
  assert.equal(nextGauges.late, 0);

  // Aucun examen : tout est à zéro, et le compte à rebours est absent.
  const empty = planGauges(buildRevisionPlan({ events: [], settings: DEFAULT_PLAN_SETTINGS, log: [], today: TODAY }), [], [], TODAY);
  assert.deepEqual(empty, { streak: 0, doneToday: 0, todo: 0, examDays: null, examTitle: undefined, late: 0, unplaced: 0 });
});

test('état enregistré par une ancienne version : complété sans perdre les saisies', () => {
  const restored = normalizeCalendarState({ events: [exam('maths', '2026-12-02')], settings: { weekdayMinutes: 60 } as PlanSettings });
  assert.equal(restored.events.length, 1);
  assert.equal(restored.settings.weekdayMinutes, 60);
  assert.equal(restored.settings.sessionMinutes, DEFAULT_PLAN_SETTINGS.sessionMinutes);
  assert.equal(restored.showSchool, true);
  assert.deepEqual(restored.log, []);
  assert.deepEqual(normalizeCalendarState(undefined), emptyCalendarState());
});

test('démonstration : le plan d’Afi est vivant et tient quel que soit le jour de la visite', () => {
  for (let offset = 0; offset < 7; offset += 1) {
    const today = addDays(TODAY, offset);
    const state = demoCalendarState('afi', today);
    const events = resolveEvents(state);
    const plan = buildRevisionPlan({
      events,
      settings: state.settings,
      log: state.log,
      today,
      modules: {
        phishing: { title: 'Ne tombez plus dans le piège', state: 'started' },
        comptes: { title: 'Sécuriser ses comptes', state: 'new' },
        reseaux: { title: 'Comprendre les réseaux', state: 'started' }
      }
    });
    assert.equal(plan.exams.length, 3);
    assert.ok(plan.exams.every((e) => e.unplaced === 0), `charge trop forte en partant du ${today}`);
    assert.ok(plan.exams.every((e) => weekdayOf(e.examDay) >= 1 && weekdayOf(e.examDay) <= 5), 'examens en semaine');
    const byId = Object.fromEntries(plan.exams.map((e) => [e.examId, e]));
    assert.equal(byId['demo-exam-securite'].done, 2);
    assert.equal(byId['demo-exam-securite'].status, 'on-track');
    assert.equal(byId['demo-exam-reseaux'].status, 'late', `réseaux en retard en partant du ${today}`);
    assert.equal(byId['demo-exam-oral'].status, 'on-track');
    assert.ok(plan.sessions.some((s) => s.kind === 'module'));
  }
  // Les autres personnages partent d'un calendrier vide (calendrier scolaire seulement).
  assert.equal(demoCalendarState('kossi', TODAY).events.length, 0);
});
