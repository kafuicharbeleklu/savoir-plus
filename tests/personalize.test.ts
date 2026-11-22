import test from 'node:test';
import assert from 'node:assert/strict';
import type { Profile } from '../src/data';
import { builtInAnswerKey } from '../src/content';
import { isQuizPassed } from '../src/domain.mjs';
import { resolveCommunityDirectory } from '../src/personas';
import { parseInterests, rankFeed, recommend, viewerOf, type Viewer, type ViewerKind } from '../src/personalize';
import { SCHOOL_PERSONAS, initialSchoolState } from '../src/seedSchool';
import { buildDynamicCatalog, initialExtendedState, type CatalogItem } from '../src/wireframeData';

const base = (id: string, name: string, role: string): Profile => ({ id, name, role, initials: name.slice(0, 2).toUpperCase(), color: 'peach', bio: '' });
const ext = initialExtendedState();
const people = resolveCommunityDirectory(
  [base('afi', 'Afi Mensah', 'Apprenante'), base('kossi', 'Kossi Agbo', 'Créateur & Mentor'), base('nadege', 'Nadège Koffi', 'Modération'), ...SCHOOL_PERSONAS],
  ext
);
const catalog = buildDynamicCatalog(ext);
const school = initialSchoolState('2026-11-17');
const authorIdOf = (item: { author: string }) => people.find((p) => p.name === item.author)?.id;

const viewer = (uid: string, kind: ViewerKind): Viewer =>
  viewerOf({
    uid,
    kind,
    interests: ext.profileDetails[uid]?.interests,
    following: ext.followingIds[uid] || [],
    school,
    nameOf: (id) => people.find((p) => p.id === id)?.name || id,
    contentIds: catalog.filter((c) => c.type === 'module').map((c) => c.id),
    moduleState: (id) => {
      const p = ext.moduleProgress[uid]?.[id];
      if (!p) return 'new';
      if (isQuizPassed(p, builtInAnswerKey(id))) return 'done';
      return p.lessons.length > 0 ? 'started' : 'new';
    }
  });
const recs = (uid: string, kind: ViewerKind) => recommend(catalog, viewer(uid, kind), { authorIdOf, limit: 6 });

test('centres d’intérêt : saisis librement, séparés par des virgules', () => {
  assert.deepEqual(parseInterests('Numérique, Entraide ,  Cybersécurité'), ['Numérique', 'Entraide', 'Cybersécurité']);
  assert.deepEqual(parseInterests(''), []);
  assert.deepEqual(parseInterests(undefined), []);
});

test('recommandé pour vous : propre à chaque profil, avec une raison', () => {
  const afi = recs('afi', 'learner');
  const kossi = recs('kossi', 'educator');
  const elom = recs('elom', 'learner');
  const akouvi = recs('akouvi', 'guardian');

  // D'abord ce que la classe a donné.
  assert.equal(afi[0].item.id, 'reseaux');
  assert.equal(afi[0].reason, 'Donné à Initiation aux réseaux');
  assert.equal(elom[0].item.id, 'sauvegarde');
  assert.equal(elom[0].reason, 'Donné à Terminale D');
  // Un parent voit ce que la classe de son enfant travaille.
  assert.equal(akouvi[0].reason, 'Classe d’Elom');
  // Ni ses propres contenus, ni un module déjà validé.
  assert.ok(kossi.every((r) => r.item.author !== 'Kossi Agbo'));
  assert.ok(elom.every((r) => r.item.id !== 'comptes'), 'Elom a déjà validé « Protéger ses comptes »');
  // Chaque carte dit pourquoi elle est là.
  for (const list of [afi, kossi, elom, akouvi]) assert.ok(list.every((r) => r.reason.length > 0));
  // Quatre profils, quatre premières cartes différentes ou des raisons différentes.
  const heads = [afi, kossi, elom, akouvi].map((list) => `${list[0].item.id}|${list[0].reason}`);
  assert.equal(new Set(heads).size, 4);
});

test('recommandé pour vous : une place pour élargir hors des domaines suivis', () => {
  const only = (domain: CatalogItem['domain'], n: number) =>
    Array.from({ length: n }, (_, i) => ({ ...catalog[0], id: `${domain}-${i}`, domain, author: 'Quelqu’un', level: 'Débutant' as const }));
  const items = [...only('Numérique', 6), ...only('Gestion', 2)];
  const v: Viewer = { id: 'x', kind: 'learner', interests: ['Numérique'], assigned: {}, related: {}, following: [], classes: [], done: [], started: [] };
  const list = recommend(items, v, { authorIdOf: () => undefined, limit: 4 });
  assert.equal(list.length, 4);
  assert.equal(list[3].item.domain, 'Gestion');
  assert.equal(list[3].reason, 'Pour élargir : Gestion');
});

test('recommandé pour vous : un cours scolaire seulement pour la classe du membre ou une classe voisine', () => {
  const schoolIds = (list: { item: CatalogItem }[]) => list.filter((r) => r.item.classLabel).map((r) => `${r.item.classLabel}:${r.item.id}`);
  const all = (uid: string, kind: ViewerKind) => recommend(catalog, viewer(uid, kind), { authorIdOf, limit: 40 });

  // Kokou est en CM2 : les cours de CM2, jamais ceux de 3e, de Seconde ou de Terminale.
  assert.deepEqual(viewer('kokou', 'learner').classes, ['CM2']);
  const kokou = all('kokou', 'learner');
  assert.ok(schoolIds(kokou).length >= 3);
  assert.ok(schoolIds(kokou).every((id) => id.startsWith('CM2:')), schoolIds(kokou).join(', '));
  assert.equal(kokou.find((r) => r.item.id === 'cm2-fractions')?.reason, 'Au programme de CM2');

  // Elom est en Terminale D : le cours de Terminale, pas ceux de CM2 ni de 3e.
  assert.deepEqual(viewer('elom', 'learner').classes, ['Terminale']);
  const elom = all('elom', 'learner');
  assert.deepEqual(schoolIds(elom), ['Terminale:tle-logarithme']);
  assert.equal(elom.find((r) => r.item.id === 'tle-logarithme')?.reason, 'Au programme de Terminale');

  // Afi suit un cours du soir, hors scolarité : aucun cours scolaire en première ligne.
  assert.deepEqual(viewer('afi', 'learner').classes, []);
  assert.deepEqual(schoolIds(all('afi', 'learner')), []);

  // Un parent voit ce qui convient à la classe de son enfant ; un enseignant, à ses classes.
  assert.deepEqual(viewer('akouvi', 'guardian').classes, ['Terminale']);
  assert.deepEqual(viewer('kossi', 'educator').classes.sort(), ['3e', 'Terminale']);
  assert.ok(schoolIds(all('kossi', 'educator')).every((id) => /^(3e|4e|Seconde|Première|Terminale):/.test(id)));
});

test('fil d’entraide : ordre et contexte propres à chaque profil', () => {
  const afi = rankFeed(ext.posts, viewer('afi', 'learner'));
  const kossi = rankFeed(ext.posts, viewer('kossi', 'educator'));
  const akouvi = rankFeed(ext.posts, viewer('akouvi', 'guardian'));
  // Toutes les publications restent, dans un ordre différent.
  assert.equal(afi.length, ext.posts.length);
  assert.notDeepEqual(
    afi.slice(0, 3).map((e) => e.post.id),
    kossi.slice(0, 3).map((e) => e.post.id)
  );
  // Afi voit d'abord son enseignant ; un parent, l'enseignant de son enfant ; un encadrant, ses élèves.
  assert.equal(afi[0].context, 'Kossi Agbo enseigne dans votre classe');
  assert.equal(akouvi[0].context, 'Kossi Agbo enseigne à Elom');
  assert.ok(kossi.slice(0, 3).some((e) => e.context?.endsWith('suit vos cours')));
  // Le contexte n'apparaît que pour un lien personnel.
  assert.ok(afi.some((e) => e.context === undefined));
});

test('alertes : une phrase avec son auteur, et une publication qui s’ouvre dans le fil', async () => {
  const { notificationSentence, notificationTarget } = await import('../src/notificationText');
  assert.deepEqual(
    notificationSentence({
      title: 'Nouvelle réponse dans une question d’entraide',
      detail: 'Question de Maya : À quoi sert la passerelle par défaut ?',
      actorName: 'Kossi Agbo'
    }),
    { actor: 'Kossi Agbo', text: 'a répondu à la question de Maya « À quoi sert la passerelle par défaut ? »' }
  );
  assert.deepEqual(notificationSentence({ title: 'Bienvenue sur SAVOIR+', detail: 'Commencez…', actorName: 'Nadège Koffi' }), {
    actor: 'Nadège Koffi',
    text: 'vous souhaite la bienvenue sur SAVOIR+',
    detail: 'Commencez…'
  });
  const { notificationsFor } = await import('../src/wireframeData');
  const legacy = { id: 'x', category: 'Compte' as const, title: 'Votre signalement a été mis à jour', detail: '', date: '', read: false, targetPage: 'report' };
  assert.equal(notificationsFor([legacy], 'afi').length, 0, 'comme LinkedIn, pas de suivi des signalements dans les alertes');
  assert.equal(notificationSentence({ title: 'Un titre inconnu', detail: '…', actorName: 'Kossi Agbo' }), null);
  assert.deepEqual(notificationTarget({ targetPage: 'community-thread', targetId: 'post-1' }), { page: 'community', id: 'post-1' });
  assert.deepEqual(notificationTarget({ targetPage: 'module-detail', targetId: 'phishing' }), { page: 'module-detail', id: 'phishing' });
});

test('badges : chaque badge comptable dit où en est le membre', async () => {
  const { computeSavoirBadges } = await import('../src/personas');
  const badges = computeSavoirBadges({
    totalXp: 100,
    level: 1,
    completedModules: [],
    passedQuizzes: ['phishing'],
    perfectQuizzes: [],
    completedLessonsCount: 4,
    postsCount: 1,
    repliesCount: 0,
    solutionsCount: 0,
    helpfulGivenCount: 0,
    followingCount: 1,
    acceptedRelationsCount: 0,
    streakWeeks: 0
  });
  const byId = (id: string) => badges.find((b) => b.id === id)!;
  assert.deepEqual(byId('mod-reader').progress, { current: 4, target: 6, unit: 'sections lues' });
  assert.deepEqual(byId('rank-explorer').progress, { current: 100, target: 150, unit: 'XP' });
  assert.deepEqual(byId('mod-triple-quiz').progress, { current: 1, target: 3, unit: 'quiz réussis' });
  assert.equal(byId('mod-phishing').progress, undefined, 'un badge de module avance avec son module');
});
