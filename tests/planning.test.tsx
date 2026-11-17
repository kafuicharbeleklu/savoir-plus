/**
 * Outils de pilotage : fenêtre et barres du diagramme de Gantt, rythme d'une classe, grille d'emploi
 * du temps, message hebdomadaire au parent, et rendu des deux composants.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  barGeometry,
  dayPosition,
  expectedProgress,
  ganttWindow,
  gridBounds,
  mondayOf,
  paceOf,
  planProblem,
  planStatus,
  plansOfClass,
  slotGeometry,
  weeklyHours,
  weeklyNote,
  type ChildSnapshot,
  type PlanItem
} from '../src/planning';
import { GanttChart, TimetableGrid } from '../src/components/PlanningTools';
import { initialSchoolState } from '../src/seedSchool';

const TODAY = '2026-11-17'; // un mardi

test('la fenêtre du Gantt est faite de semaines entières autour d’aujourd’hui', () => {
  assert.equal(mondayOf(TODAY), '2026-11-16');
  assert.equal(mondayOf('2026-11-22'), '2026-11-16'); // un dimanche appartient à la semaine qui finit
  assert.equal(mondayOf('2026-11-16'), '2026-11-16');
  const window = ganttWindow(TODAY, 3, 7);
  assert.equal(window.start, '2026-10-26');
  assert.equal(window.weeks.length, 11);
  assert.equal(window.days, 77);
  assert.equal(window.weeks[3], '2026-11-16');
});

test('une barre se place en pourcentage de la fenêtre, et se coupe à ses bords', () => {
  const window = ganttWindow(TODAY, 1, 2); // du 9 au 6 décembre : 28 jours
  assert.equal(window.start, '2026-11-09');
  // Une semaine entière, la deuxième de quatre.
  assert.deepEqual(barGeometry('2026-11-16', '2026-11-22', window), { left: 25, width: 25, clippedStart: false, clippedEnd: false });
  // Un seul jour occupe un vingt-huitième.
  const oneDay = barGeometry('2026-11-17', '2026-11-17', window);
  assert.ok(oneDay && Math.abs(oneDay.width - 100 / 28) < 1e-9);
  // Commencée avant la fenêtre, finie après : coupée des deux côtés, pleine largeur.
  assert.deepEqual(barGeometry('2026-10-01', '2026-12-31', window), { left: 0, width: 100, clippedStart: true, clippedEnd: true });
  // Entièrement dehors.
  assert.equal(barGeometry('2026-10-01', '2026-11-08', window), null);
  assert.equal(barGeometry('2026-12-07', '2026-12-20', window), null);
  // Le repère d'aujourd'hui.
  assert.ok(Math.abs((dayPosition(TODAY, window) as number) - (8 / 28) * 100) < 1e-9);
  assert.equal(dayPosition('2026-11-08', window), null);
});

test('statut, avancement attendu et rythme d’une séquence', () => {
  const sequence = { start: '2026-11-16', end: '2026-11-27' }; // douze jours
  assert.equal(planStatus(sequence, TODAY), 'current');
  assert.equal(planStatus(sequence, '2026-11-15'), 'upcoming');
  assert.equal(planStatus(sequence, '2026-11-28'), 'done');
  assert.equal(expectedProgress(sequence, '2026-11-15'), 0);
  assert.equal(expectedProgress(sequence, TODAY), 17); // deux jours sur douze
  assert.equal(expectedProgress(sequence, '2026-11-27'), 100);
  assert.equal(expectedProgress(sequence, '2026-12-25'), 100);
  // En retard à partir de quinze points sous l'attendu, en avance à quinze au-dessus.
  assert.equal(paceOf(40, 50), 'on-track');
  assert.equal(paceOf(35, 50), 'late');
  assert.equal(paceOf(65, 50), 'ahead');
});

test('une période se valide avant d’entrer dans la planification', () => {
  assert.equal(planProblem({ title: 'Révisions', start: '2026-11-16', end: '2026-11-20' }), null);
  assert.match(planProblem({ title: '  ', start: '2026-11-16', end: '2026-11-20' }) || '', /titre/);
  assert.match(planProblem({ title: 'Révisions', start: '2026-11-20', end: '2026-11-16' }) || '', /fin ne peut pas précéder/);
  assert.match(planProblem({ title: 'Année', start: '2026-09-14', end: '2027-06-30' }) || '', /quatre mois/);
});

test('la démonstration planifie le trimestre de chaque classe autour de la semaine en cours', () => {
  const school = initialSchoolState(TODAY);
  const terminale = plansOfClass(school.plans, 'cl-tle-d');
  assert.deepEqual(terminale.map((p) => p.kind), ['sequence', 'sequence', 'sequence', 'revision', 'exam']);
  assert.deepEqual(terminale.map((p) => planStatus(p, TODAY)), ['done', 'current', 'upcoming', 'upcoming', 'upcoming']);
  // La composition se termine avant les congés de Noël (24 décembre).
  assert.ok((terminale.at(-1) as PlanItem).end < '2026-12-24');
  // Chaque période renvoie à une classe qui existe, et finit après avoir commencé.
  const classIds = new Set(school.classes.map((c) => c.id));
  for (const plan of school.plans) {
    assert.ok(classIds.has(plan.classId), plan.id);
    assert.equal(planProblem(plan), null, plan.id);
  }
});

test('la grille horaire couvre au moins 8 h – 17 h et place chaque créneau', () => {
  const slots = [
    { start: '07:00', end: '09:00' },
    { start: '09:15', end: '11:15' },
    { start: '15:00', end: '17:00' }
  ];
  const bounds = gridBounds(slots);
  assert.deepEqual([bounds.start, bounds.end], [7 * 60, 17 * 60]);
  assert.deepEqual(bounds.hours, [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]);
  assert.deepEqual(slotGeometry(slots[0], bounds), { top: 0, height: 20 });
  assert.deepEqual(slotGeometry(slots[2], bounds), { top: 80, height: 20 });
  assert.equal(weeklyHours(slots), 6);
  // Sans créneau, la grille garde une journée type.
  assert.deepEqual([gridBounds([]).start, gridBounds([]).end], [8 * 60, 17 * 60]);
  // Un cours du soir étend la grille.
  assert.equal(gridBounds([{ start: '18:30', end: '20:30' }]).end, 21 * 60);
});

const child = (over: Partial<ChildSnapshot> = {}): ChildSnapshot => ({ name: 'Elom Dogbé', lateSessions: 0, streak: 0, validated: 1, total: 3, ...over });

test('le message de la semaine traite un seul sujet, le plus pressant d’abord', () => {
  // Le retard passe avant tout, et rappelle l'examen qui approche.
  const late = weeklyNote(child({ lateSessions: 2, nextExam: { title: 'Composition', inDays: 13 }, readyForQuiz: 'Budget' }));
  assert.equal(late.tone, 'warn');
  assert.equal(late.text, 'Elom a 2 séances de révision en retard avant « Composition » (dans 13 jours).');
  assert.match(weeklyNote(child({ lateSessions: 1 })).text, /^Elom a 1 séance de révision en retard\.$/);
  // Puis l'examen de la semaine.
  const exam = weeklyNote(child({ nextExam: { title: 'Composition', inDays: 1 }, readyForQuiz: 'Budget' }));
  assert.equal(exam.tone, 'info');
  assert.match(exam.text, /a lieu demain/);
  // Puis le quiz qui reste à passer, puis le module qui traîne.
  assert.match(weeklyNote(child({ nextExam: { title: 'Composition', inDays: 30 }, readyForQuiz: 'Budget' })).text, /il reste le quiz/);
  assert.match(weeklyNote(child({ slowest: { title: 'Sauvegarde', percent: 25 } })).text, /avance lentement \(25 %\)/);
  // Sinon, un encouragement précis.
  const good = weeklyNote(child({ streak: 3, slowest: { title: 'Sauvegarde', percent: 75 } }));
  assert.equal(good.tone, 'good');
  assert.equal(good.text, 'Elom suit son rythme : 1 module validé sur 3, 3 jours de suite.');
  // Chaque message donne au parent une chose à faire.
  for (const note of [late, exam, good]) assert.ok(note.action.length > 20);
});

test('le diagramme de Gantt dessine ses barres, son repère du jour et ses congés', () => {
  const window = ganttWindow(TODAY, 1, 2);
  const html = renderToStaticMarkup(
    <GanttChart
      label="Planification"
      window={window}
      today={TODAY}
      shades={[{ start: '2026-11-30', end: '2026-12-06', label: 'Congés' }]}
      onBarClick={() => undefined}
      rows={[
        {
          id: 'c1',
          label: 'Terminale D',
          sub: '10 élèves',
          bars: [
            { id: 'b1', label: 'Sauvegarder ses fichiers', start: '2026-11-16', end: '2026-11-22', tone: 'brand', progress: 40, detail: 'avancement 40 %' },
            { id: 'b2', label: 'Hors fenêtre', start: '2027-01-04', end: '2027-01-08', tone: 'brand' }
          ]
        }
      ]}
    />
  );
  assert.equal(html.match(/class="pl-gantt-gridline"/g)?.length, 4);
  assert.match(html, /class="pl-gantt-today"/);
  assert.match(html, /class="pl-gantt-shade"[^>]*left:75%;width:25%/);
  // La barre visible est un bouton, placé et rempli ; celle qui sort de la fenêtre n'est pas dessinée.
  assert.match(html, /<button type="button" class="pl-gantt-bar is-brand" style="left:25%;width:25%"/);
  assert.match(html, /class="pl-gantt-fill" style="width:40%"/);
  assert.match(html, /aria-label="Sauvegarder ses fichiers, 16 – 22 nov\., avancement 40 %"/);
  assert.ok(!html.includes('Hors fenêtre'));
});

test('la grille d’emploi du temps place les cours par jour et n’ajoute le samedi que s’il y a cours', () => {
  const week = [
    { id: 's1', weekday: 1, start: '07:00', end: '09:00', subject: 'Mathématiques', detail: 'M. Amétépé · Salle 12' },
    { id: 's2', weekday: 2, start: '09:15', end: '11:15', subject: 'Français' }
  ];
  const html = renderToStaticMarkup(<TimetableGrid label="Emploi du temps" slots={week} todayWeekday={2} />);
  assert.ok(!html.includes('Samedi'));
  assert.match(html, /class="is-today">Mardi/);
  assert.equal(html.match(/class="pl-grid-slot /g)?.length, 2);
  assert.match(html, /title="Mathématiques, lundi de 7 h à 9 h, M\. Amétépé · Salle 12"/);
  assert.match(html, /9 h 15 – 11 h 15/);
  const withSaturday = renderToStaticMarkup(<TimetableGrid label="Emploi du temps" slots={[...week, { id: 's3', weekday: 6, start: '07:00', end: '09:00', subject: 'EPS' }]} />);
  assert.match(withSaturday, /Samedi/);
});
