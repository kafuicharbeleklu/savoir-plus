import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addMonths, cancel, changeCycle, changeMethod, cyclePrice, settle, subscribe } from '../src/billing';
import { offerById, paidSubscription, type Subscription } from '../src/offers';

const family = offerById('family')!;

test('addMonths garde le jour, ou le dernier jour du mois', () => {
  assert.equal(addMonths('2026-09-15', 1), '2026-10-15');
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28');
  assert.equal(addMonths('2026-11-30', 2), '2027-01-30');
});

test('une formule mensuelle paie chaque échéance passée, jour même compris', () => {
  const sub = settle({ offerId: 'family', since: '2026-09-15' }, '2026-11-15');
  assert.deepEqual(sub.payments!.map((p) => p.day), ['2026-09-15', '2026-10-15', '2026-11-15']);
  assert.equal(sub.nextDue, '2026-12-15');
  assert.ok(sub.payments!.every((p) => p.amount === 2500 && p.cycle === 'monthly'));
});

test('l’année coûte dix mois ; la nouvelle fréquence part de la prochaine échéance', () => {
  assert.equal(cyclePrice(family, 'annual'), 25000);
  const changed = changeCycle({ offerId: 'family', since: '2026-09-15' }, 'annual', '2026-11-22');
  assert.equal(changed.nextDue, '2026-12-15');
  const later = settle(changed, '2027-06-01');
  const last = later.payments!.at(-1)!;
  assert.equal(last.day, '2026-12-15');
  assert.equal(last.amount, 25000);
  assert.equal(later.nextDue, '2027-12-15');
});

test('un nouveau moyen de paiement ne réécrit pas les reçus passés', () => {
  const sub: Subscription = { offerId: 'family', since: '2026-09-15', method: 'Flooz' };
  const changed = settle(changeMethod(sub, 'Carte bancaire', '2026-11-22'), '2026-12-15');
  assert.deepEqual(changed.payments!.map((p) => p.method), ['Flooz', 'Flooz', 'Flooz', 'Carte bancaire']);
});

test('résilier : active jusqu’à la prochaine échéance, sans nouveau prélèvement, puis gratuite', () => {
  const cancelled = cancel({ offerId: 'family', since: '2026-09-15' }, '2026-11-22');
  assert.equal(cancelled.endsOn, '2026-12-15');
  assert.equal(settle(cancelled, '2027-03-01').payments!.length, 3);
  const subs = { akouvi: cancelled };
  assert.ok(paidSubscription(subs, 'akouvi', '2026-12-14'));
  assert.equal(paidSubscription(subs, 'akouvi', '2026-12-15'), null);
});

test('changer de formule : effet immédiat, historique conservé', () => {
  const prev: Subscription = { offerId: 'institution-essential', since: '2026-09-01', showAds: false };
  const next = subscribe(prev, 'institution-steering', 'monthly', 'Flooz', '2026-11-22');
  assert.equal(next.offerId, 'institution-steering');
  assert.equal(next.since, '2026-11-22');
  assert.equal(next.showAds, false);
  assert.deepEqual(next.payments!.map((p) => `${p.offerId}:${p.day}`), [
    'institution-essential:2026-09-01',
    'institution-essential:2026-10-01',
    'institution-essential:2026-11-01',
    'institution-steering:2026-11-22'
  ]);
  assert.equal(next.nextDue, '2026-12-22');
  assert.equal(new Set(next.payments!.map((p) => p.id)).size, 4);
});
