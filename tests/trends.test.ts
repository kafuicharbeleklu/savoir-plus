import test from 'node:test';
import assert from 'node:assert/strict';
import { recordWeek, seedSnapshots, sparkPoints, weekDelta, weekSeries, type WeekMeasures } from '../src/trends';
import { placeLabels, type GanttBar } from '../src/components/PlanningTools';
import { ganttWindow } from '../src/planning';

const measures = (progress: number, flagged = 2): WeekMeasures => ({ progress, expected: 50, flagged, quizRate: 80, classGaps: { a: 3 } });

test('relevés : la semaine en cours se calcule en direct, les sept précédentes viennent des relevés', () => {
  const today = '2026-11-18';
  const seeds = seedSnapshots(today);
  const series = weekSeries(seeds, 'inst-palmiers', measures(75, 3), today);
  assert.equal(series.length, 8);
  assert.equal(series[series.length - 1].week, '2026-11-16');
  assert.equal(series[series.length - 1].progress, 75);
  assert.deepEqual(
    series.map((s) => s.week),
    [...series.map((s) => s.week)].sort()
  );
  // Un autre tableau de bord ne mélange pas ses relevés.
  assert.ok(weekSeries(seeds, 'kossi', measures(58), today).every((s) => s.scope === 'kossi'));
});

test('relevés : enregistrer remplace la semaine en cours et ne réécrit rien si les mesures sont identiques', () => {
  const today = '2026-11-18';
  const first = recordWeek([], 'inst-palmiers', measures(70), today);
  assert.ok(first);
  assert.equal(first.length, 1);
  assert.equal(recordWeek(first, 'inst-palmiers', measures(70), today), null);
  const updated = recordWeek(first, 'inst-palmiers', measures(72), today);
  assert.ok(updated);
  assert.equal(updated.length, 1);
  assert.equal(updated[0].progress, 72);
  // La semaine suivante s'ajoute.
  const next = recordWeek(updated, 'inst-palmiers', measures(76), '2026-11-25');
  assert.equal(next?.length, 2);
});

test('relevés : écart d’une semaine à l’autre, et petite courbe dans son cadre', () => {
  const today = '2026-11-18';
  const series = weekSeries(seedSnapshots(today), 'inst-palmiers', measures(75), today);
  assert.equal(weekDelta(series, (s) => s.progress), 75 - series[series.length - 2].progress);
  assert.equal(weekDelta(series.slice(-1), (s) => s.progress), null);

  const points = sparkPoints([10, null, 30], 84, 30, 3);
  assert.equal(points.length, 2);
  assert.ok(points.every((p) => p.x >= 3 && p.x <= 81 && p.y >= 3 && p.y <= 27));
  assert.ok(points[0].y > points[1].y, 'la valeur la plus haute est dessinée plus haut');
  // Un domaine imposé place le zéro au même endroit pour toutes les courbes.
  assert.deepEqual(sparkPoints([0], 64, 22, 3, [-10, 10]), [{ x: 3, y: 11 }]);
});

test('Gantt : un titre trop long pour sa barre passe juste après, ou se tait, sans jamais être coupé', () => {
  const window = ganttWindow('2026-11-18', 3, 7);
  const bars: GanttBar[] = [
    { id: 'long', label: 'Protéger ses comptes', start: '2026-10-26', end: '2026-11-13', tone: 'done' },
    { id: 'short', label: 'Révisions', start: '2026-11-23', end: '2026-11-25', tone: 'soft' },
    { id: 'tight', label: 'Composition du trimestre', start: '2026-12-07', end: '2026-12-08', tone: 'warm' },
    { id: 'next', label: 'E-mail professionnel', start: '2026-12-09', end: '2026-12-31', tone: 'brand' }
  ];
  const placed = Object.fromEntries(placeLabels(bars, window, 880).map((p) => [p.bar.id, p.place]));
  assert.equal(placed.long, 'inside');
  assert.equal(placed.short, 'after');
  assert.equal(placed.tight, 'hidden');
  assert.equal(placed.next, 'inside');
  // Séquence en cours trop courte pour son titre, la suivante juste derrière : le titre passe au-dessus.
  const current: GanttBar[] = [
    { id: 'sauv', label: 'Sauvegarder ses fichiers', start: '2026-11-16', end: '2026-11-27', tone: 'brand' },
    { id: 'mail', label: 'E-mail professionnel', start: '2026-11-30', end: '2026-12-11', tone: 'brand' }
  ];
  assert.equal(placeLabels(current, window, 880)[0].place, 'above');
  // Largeur inconnue (rendu sur serveur) : chaque titre reste dans sa barre.
  assert.ok(placeLabels(bars, window, 0).every((p) => p.place === 'inside'));
});
