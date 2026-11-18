import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_TOUR, readTourStep } from '../src/demoTour';

const PERSONAS = ['afi', 'kossi', 'nadege', 'elom', 'akouvi', 'kokou', 'palmiers'];

test('visite guidée : quatre rôles, dans l’ordre, chacun avec un personnage de démonstration', () => {
  assert.equal(new Set(DEMO_TOUR.map((s) => s.id)).size, DEMO_TOUR.length, 'identifiants uniques');
  assert.deepEqual(
    Array.from(new Set(DEMO_TOUR.map((s) => s.role))),
    ['Apprenante', 'Parent', 'Établissement', 'Encadrant', 'Fin']
  );
  for (const step of DEMO_TOUR) {
    assert.ok(PERSONAS.includes(step.persona), `${step.id} : personnage inconnu`);
    assert.ok(step.target.length > 0 && step.page.length > 0, `${step.id} : page et élément`);
    // Deux phrases au plus : une bulle se lit d'un coup d'œil.
    assert.ok(step.text.length <= 200, `${step.id} : texte trop long (${step.text.length})`);
    assert.ok(!step.text.includes('..'), `${step.id} : ponctuation`);
  }
  assert.equal(DEMO_TOUR[DEMO_TOUR.length - 1].id, 'end');
});

test('visite guidée : « ?visite=1 » la lance ; sans adresse ni étape gardée, rien', () => {
  assert.equal(readTourStep('?visite=1'), 0);
  assert.equal(readTourStep('?as=afi&visite=1'), 0);
  assert.equal(readTourStep(''), null);
  assert.equal(readTourStep('?visite=0'), null);
});
