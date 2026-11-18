import test from 'node:test';
import assert from 'node:assert/strict';
import { redeemGuardianCode } from '../src/school';
import { initialSchoolState } from '../src/seedSchool';
import {
  GRACE_MINUTES,
  addUsage,
  answerRequest,
  defaultRules,
  formatHour,
  formatMinutes,
  lockApplies,
  lockState,
  minutesUsed,
  requestOfDay,
  requestTime,
  rulesOf,
  rulesSummary,
  setRules
} from '../src/deviceLock';

const TODAY = '2026-11-17'; // un mardi
const at = (day: string, hh: number, mm = 0) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, hh, mm);
};
// Kokou (10 ans) entre le code créé par sa mère : son compte s'ouvre, le verrouillage le concerne.
const opened = () => {
  const result = redeemGuardianCode(initialSchoolState(TODAY), 'PAR-7K3Q-9M2X', 'kokou', TODAY);
  assert.ok(result.ok);
  return result.ok ? result.school : initialSchoolState(TODAY);
};

test('verrouillage : seulement pour un enfant de moins de 12 ans rattaché à un parent', () => {
  const school = initialSchoolState(TODAY);
  assert.equal(lockApplies(school, 'kokou', TODAY), false, 'pas avant que le code soit saisi');
  assert.equal(lockApplies(school, 'elom', TODAY), false, 'Elom a 17 ans');
  assert.equal(lockApplies(opened(), 'kokou', TODAY), true);
  // Rien n'est verrouillé tant que le parent n'a rien réglé.
  assert.deepEqual(rulesOf(opened(), 'kokou'), defaultRules('kokou'));
  assert.equal(lockState(opened(), 'kokou', at(TODAY, 23, 30)).locked, false);
});

test('verrouillage : pause immédiate, plage horaire, temps du jour', () => {
  let school = opened();
  const rules = { ...defaultRules('kokou'), weekdayMinutes: 45, weekendMinutes: 90, weekdayFrom: '16:00', weekdayTo: '20:00', weekendFrom: '09:00', weekendTo: '19:00' };
  school = setRules(school, rules);
  assert.equal(rulesSummary(rules), '45 min en semaine, 1 h 30 le week-end ; de 16 h à 20 h en semaine, de 9 h à 19 h le week-end');

  // Hors plage : fermé, avec l'heure de réouverture.
  assert.deepEqual(lockState(school, 'kokou', at(TODAY, 8)), { locked: true, reason: 'hours', reopens: 'à 16 h', used: 0, limit: 45 });
  assert.equal(lockState(school, 'kokou', at(TODAY, 20, 5)).reopens, 'demain à 16 h');
  assert.equal(lockState(school, 'kokou', at('2026-11-20', 21)).reopens, 'demain à 9 h', 'vendredi soir : le week-end commence à 9 h');
  assert.equal(lockState(school, 'kokou', at(TODAY, 17)).locked, false);

  // Temps du jour écoulé : fermé jusqu'au lendemain ; une partie commencée se termine d'abord.
  school = addUsage(school, 'kokou', TODAY, 45);
  assert.equal(minutesUsed(school, 'kokou', TODAY), 45);
  assert.deepEqual(lockState(school, 'kokou', at(TODAY, 17)), { locked: true, reason: 'limit', reopens: 'demain à 16 h', used: 45, limit: 45 });
  assert.equal(lockState(school, 'kokou', at(TODAY, 17), true).locked, false, 'il finit sa partie');
  school = addUsage(school, 'kokou', TODAY, GRACE_MINUTES);
  assert.equal(lockState(school, 'kokou', at(TODAY, 17), true).locked, true, 'pas au-delà du délai de grâce');

  // Pause immédiate : prime sur tout le reste.
  school = setRules(school, { ...rulesOf(school, 'kokou'), lockedNow: true });
  assert.equal(lockState(school, 'kokou', at('2026-11-21', 10)).reason, 'manual');
});

test('verrouillage : l’enfant demande du temps, le parent répond', () => {
  let school = setRules(opened(), { ...defaultRules('kokou'), weekdayMinutes: 30 });
  school = addUsage(school, 'kokou', TODAY, 30);
  assert.equal(lockState(school, 'kokou', at(TODAY, 18)).reason, 'limit');

  school = requestTime(school, 'kokou', at(TODAY, 18, 5));
  const request = requestOfDay(school, 'kokou', TODAY)!;
  assert.deepEqual([request.status, request.at], ['pending', '18 h 05']);
  assert.equal(requestTime(school, 'kokou', at(TODAY, 18, 6)), school, 'une demande à la fois');

  school = answerRequest(school, request.id, 15);
  assert.equal(requestOfDay(school, 'kokou', TODAY)!.status, 'granted');
  assert.deepEqual(lockState(school, 'kokou', at(TODAY, 18, 10)), { locked: false, used: 30, limit: 45 });
  // Le temps accordé ne vaut que pour ce jour-là.
  assert.equal(lockState(school, 'kokou', at('2026-11-18', 18)).limit, 30);

  // Un refus ne change rien au temps du jour.
  school = addUsage(school, 'kokou', TODAY, 15);
  school = requestTime(school, 'kokou', at(TODAY, 19));
  school = answerRequest(school, requestOfDay(school, 'kokou', TODAY)!.id, null);
  assert.equal(requestOfDay(school, 'kokou', TODAY)!.status, 'declined');
  assert.equal(lockState(school, 'kokou', at(TODAY, 19, 5)).locked, true);
});

test('verrouillage : libellés', () => {
  assert.deepEqual([formatHour('16:00'), formatHour('18:30'), formatHour('24:00')], ['16 h', '18 h 30', 'minuit']);
  assert.deepEqual([formatMinutes(45), formatMinutes(90), formatMinutes(120)], ['45 min', '1 h 30', '2 h']);
  assert.equal(rulesSummary(defaultRules('x')), 'pas de limite de temps');
  // Quatorze jours d'historique au plus.
  let school = opened();
  for (let i = 0; i < 20; i++) school = addUsage(school, 'kokou', `2026-11-${String(i + 1).padStart(2, '0')}`, 10);
  assert.equal(school.screenUsage.filter((u) => u.childId === 'kokou').length, 14);
});
