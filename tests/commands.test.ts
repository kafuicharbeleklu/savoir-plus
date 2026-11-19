import test from 'node:test';
import assert from 'node:assert/strict';
import { filterCommands, highlightRange, matchScore, normalize, type Command } from '../src/commands';

const ran: string[] = [];
const cmd = (group: string, label: string, extra: Partial<Command> = {}): Command => ({ id: `${group}:${label}`, group, label, run: () => ran.push(label), ...extra });
const commands: Command[] = [
  cmd('Reprendre', 'Reprendre « Ne tombez plus dans le piège »'),
  cmd('Aller à', 'Accueil'),
  cmd('Aller à', 'Plan de révision', { keywords: 'séances calendrier' }),
  cmd('Aller à', 'Paramètres', { keywords: 'réglages', onlyOnSearch: true }),
  cmd('Actions', 'Ajouter une date au calendrier', { keywords: 'examen' }),
  cmd('Bibliothèque', 'Comprendre les réseaux', { onlyOnSearch: true }),
  cmd('Membres', 'Kossi Agbo', { onlyOnSearch: true })
];

test('fenêtre de commande : sans recherche, l’essentiel ; contenus et membres seulement en réponse à une recherche', () => {
  const empty = filterCommands(commands, '');
  assert.deepEqual(
    empty.map((g) => g.group),
    ['Reprendre', 'Aller à', 'Actions']
  );
  assert.ok(!empty.flatMap((g) => g.items).some((c) => c.label === 'Paramètres'));
});

test('fenêtre de commande : recherche sans accents ni majuscules, libellé avant mots en plus, début de mot en tête', () => {
  assert.equal(normalize('Évaluation Révision'), 'evaluation revision');
  const rev = filterCommands(commands, 'rév');
  assert.equal(rev.flatMap((g) => g.items)[0].label, 'Plan de révision');
  const exam = filterCommands(commands, 'EXAMEN').flatMap((g) => g.items);
  assert.deepEqual(
    exam.map((c) => c.label),
    ['Ajouter une date au calendrier']
  );
  assert.equal(matchScore(commands[1], 'zz'), 0, 'un mot absent écarte l’entrée');
  assert.ok(matchScore(commands[5], 'reseaux') > matchScore(commands[2], 'calendrier'), 'le libellé compte plus que les mots en plus');
  assert.deepEqual(filterCommands(commands, 'kossi').map((g) => g.group), ['Membres']);
  assert.deepEqual(highlightRange('Plan de révision', 'rev'), [8, 11]);
  assert.equal(highlightRange('Accueil', 'zz'), null);
});
