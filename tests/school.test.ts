import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REDEEM_MESSAGE,
  accountOf,
  addClass,
  ageBandOf,
  ageOn,
  busyMinutes,
  buyItem,
  canPublish,
  canSeePrices,
  canViewPerformance,
  childrenOf,
  classesOfStudent,
  classesOfTeacher,
  contactRefusal,
  decideIdentity,
  educatorStanding,
  emptySchoolState,
  formatPrice,
  guardianCodeStatus,
  hasAccess,
  issueGuardianCode,
  learnersOf,
  libraryOf,
  makeGuardianCode,
  needsGuardianCode,
  normalizeSchoolState,
  offeringInstitution,
  redeemGuardianCode,
  relationBetween,
  requestMembership,
  restrictionFor,
  setClassRestriction,
  setMembershipStatus,
  slotConflict,
  slotsFor,
  studentsOfClass,
  submitIdentity,
  toggleClassModule,
  visibleInSuggestions,
  type SchoolState
} from '../src/school';
import { SCHOOL_MEMBER_NAMES, SCHOOL_PERSONAS, SEED_SCHOOL_PROGRESS, initialSchoolState } from '../src/seedSchool';
import { addDays, isValidDay, type Day } from '../src/calendar';
import { MODULES_CONTENT } from '../src/content';
import { computeModuleStat } from '../src/studioStats';
import { CATALOG_ITEMS } from '../src/wireframeData';
import { canAccessRoute, resolveCapabilities } from '../src/personas';

const TODAY: Day = '2026-11-17';
const seed = (): SchoolState => initialSchoolState(TODAY);

test('âges : moins de 12 ans, mineur, adulte ; sans date de naissance, adulte', () => {
  assert.equal(ageOn('2016-09-20', TODAY), 10);
  assert.equal(ageOn('2014-11-17', TODAY), 12, 'le jour de l’anniversaire compte');
  assert.equal(ageOn('2014-11-18', TODAY), 11);
  assert.equal(ageBandOf({ kind: 'learner', identity: 'none', birthDate: '2016-09-20' }, TODAY), 'child');
  assert.equal(ageBandOf({ kind: 'learner', identity: 'none', birthDate: '2009-06-02' }, TODAY), 'teen');
  assert.equal(ageBandOf({ kind: 'learner', identity: 'none', birthDate: '2008-11-17' }, TODAY), 'adult');
  assert.equal(ageBandOf({ kind: 'learner', identity: 'none' }, TODAY), 'adult');
  assert.equal(ageBandOf(undefined, TODAY), 'adult');
});

test('données de démonstration : cohérentes, datées du jour, sans personne réelle', () => {
  const school = seed();
  for (const [uid, account] of Object.entries(school.accounts)) {
    if (account.birthDate) assert.ok(isValidDay(account.birthDate), `${uid} : date de naissance invalide`);
  }
  // Chaque rattachement pointe vers un établissement et des classes qui existent.
  for (const m of school.memberships) {
    assert.ok(school.institutions.some((i) => i.id === m.institutionId), `${m.id} : établissement inconnu`);
    for (const classId of m.classIds) {
      const found = school.classes.find((c) => c.id === classId);
      assert.ok(found && found.institutionId === m.institutionId, `${m.id} : classe ${classId} hors de l’établissement`);
    }
  }
  // Chaque module donné à une classe existe dans le catalogue et a un contenu.
  for (const c of school.classes) {
    for (const moduleId of c.moduleIds) {
      assert.ok(CATALOG_ITEMS.some((item) => item.id === moduleId && item.type === 'module'), `${c.id} : module ${moduleId} inconnu`);
      assert.ok(MODULES_CONTENT[moduleId]);
    }
  }
  // Les élèves des classes de lycée et de collège sont mineurs ; ceux du CM2 ont moins de 12 ans.
  for (const uid of studentsOfClass(school, 'cl-tle-d')) assert.equal(ageBandOf(accountOf(school, uid), TODAY), 'teen', uid);
  for (const uid of studentsOfClass(school, 'cl-3e-a')) assert.equal(ageBandOf(accountOf(school, uid), TODAY), 'teen', uid);
  for (const uid of studentsOfClass(school, 'cl-cm2')) assert.equal(ageBandOf(accountOf(school, uid), TODAY), 'child', uid);
  assert.equal(studentsOfClass(school, 'cl-tle-d').length, 10);
  // Tout élève sans fiche de profil a un nom à afficher.
  const personaIds = new Set(SCHOOL_PERSONAS.map((p) => p.id));
  for (const uid of ['cl-tle-d', 'cl-3e-a', 'cl-cm2'].flatMap((id) => studentsOfClass(school, id))) {
    assert.ok(personaIds.has(uid) || SCHOOL_MEMBER_NAMES[uid], `${uid} : nom manquant`);
  }
  // Établissements marqués comme fictifs.
  assert.ok(school.institutions.every((i) => /démonstration/.test(i.type)));
  assert.equal(new Set(school.timetable.map((s) => s.id)).size, school.timetable.length, 'créneaux uniques');
});

test('encadrant : l’intitulé découle de l’identité vérifiée et du rattachement, et bascule tout seul', () => {
  let school = seed();
  // Kossi : identité vérifiée et deux rattachements validés.
  assert.deepEqual(
    { status: educatorStanding(school, 'kossi').status, label: educatorStanding(school, 'kossi').label },
    { status: 'teacher', label: 'Enseignant · 2 établissements' }
  );
  assert.deepEqual(classesOfTeacher(school, 'kossi').map((c) => c.id), ['cl-tle-d', 'cl-3e-a', 'cl-reseaux']);

  // Ama : vérifiée, demande en attente → encadreur indépendant vérifié, sans classe.
  assert.equal(educatorStanding(school, 'ama').label, 'Encadreur indépendant vérifié');
  assert.deepEqual(classesOfTeacher(school, 'ama'), []);
  // L'établissement valide : elle devient enseignante.
  school = setMembershipStatus(school, 'mb-ama-palmiers', 'active');
  assert.equal(educatorStanding(school, 'ama').label, 'Enseignant · Les Palmiers');
  assert.deepEqual(classesOfTeacher(school, 'ama').map((c) => c.id), ['cl-3e-a']);
  // Elle quitte l'établissement : retour à l'état indépendant.
  school = setMembershipStatus(school, 'mb-ama-palmiers', 'ended');
  assert.equal(educatorStanding(school, 'ama').status, 'independent');

  // Yawo : identité en cours d'examen → non vérifié. Un rattachement validé ne suffit pas sans identité vérifiée.
  assert.equal(educatorStanding(school, 'yawo').label, 'Encadreur indépendant');
  school = requestMembership(school, { institutionId: 'inst-palmiers', userId: 'yawo', role: 'teacher', classIds: ['cl-3e-a'], requestedBy: 'member' }, TODAY);
  const yawoMembership = school.memberships.find((m) => m.userId === 'yawo')!;
  school = setMembershipStatus(school, yawoMembership.id, 'active');
  assert.equal(educatorStanding(school, 'yawo').status, 'independent');
  assert.deepEqual(classesOfTeacher(school, 'yawo'), []);
  // La Gouvernance accepte son identité : il bascule en enseignant sans autre action.
  school = decideIdentity(school, 'KYC-003', 'verified');
  assert.equal(educatorStanding(school, 'yawo').label, 'Enseignant · Les Palmiers');

  // Si l'identité de Kossi était retirée, il perdrait ses classes d'un coup.
  const revoked: SchoolState = { ...school, accounts: { ...school.accounts, kossi: { ...school.accounts.kossi, identity: 'refused' } } };
  assert.equal(educatorStanding(revoked, 'kossi').status, 'independent');
  assert.deepEqual(learnersOf(revoked, 'kossi'), []);
});

test('rattachements : une demande attend l’autre partie ; pas de doublon ; transitions réglées', () => {
  let school = seed();
  const before = school.memberships.length;
  // Demande déjà en attente : pas de doublon.
  school = requestMembership(school, { institutionId: 'inst-palmiers', userId: 'ama', role: 'teacher', classIds: ['cl-3e-a'], requestedBy: 'member' }, TODAY);
  assert.equal(school.memberships.length, before);
  // Une demande en attente ne peut pas être « terminée », un rattachement actif ne peut pas être « refusé ».
  assert.equal(setMembershipStatus(school, 'mb-ama-palmiers', 'ended'), school);
  assert.equal(setMembershipStatus(school, 'mb-kossi-palmiers', 'declined'), school);
  // L'élève Sena demande la Terminale D : elle n'y est pas tant que l'établissement n'a pas validé.
  assert.ok(!studentsOfClass(school, 'cl-tle-d').includes('sena'));
  school = setMembershipStatus(school, 'mb-sena-palmiers', 'active');
  assert.ok(studentsOfClass(school, 'cl-tle-d').includes('sena'));
  // Refusée, une demande peut être refaite.
  school = setMembershipStatus(seed(), 'mb-sena-palmiers', 'declined');
  const again = requestMembership(school, { institutionId: 'inst-palmiers', userId: 'sena', role: 'student', classIds: ['cl-tle-d'], requestedBy: 'member' }, TODAY);
  assert.equal(again.memberships.length, school.memberships.length + 1);
});

test('moins de 12 ans : le compte attend le code d’un parent ou tuteur vérifié', () => {
  let school = seed();
  assert.equal(needsGuardianCode(school, 'kokou', TODAY), true);
  assert.equal(needsGuardianCode(school, 'elom', TODAY), false, 'à 17 ans, aucun code');
  assert.equal(needsGuardianCode(school, 'afi', TODAY), false);
  assert.equal(canPublish(school, 'kokou', TODAY), false);

  const code = school.guardianCodes[0];
  assert.equal(guardianCodeStatus(code, TODAY), 'valid');
  assert.equal(guardianCodeStatus(code, addDays(code.createdOn, 7)), 'valid', 'valable sept jours');
  assert.equal(guardianCodeStatus(code, addDays(code.createdOn, 8)), 'expired');

  // Mauvais code, puis bon code saisi en minuscules avec des espaces.
  assert.deepEqual(redeemGuardianCode(school, 'PAR-0000-0000', 'kokou', TODAY), { ok: false, reason: 'unknown' });
  const redeemed = redeemGuardianCode(school, '  par-7k3q-9m2x ', 'kokou', TODAY);
  assert.ok(redeemed.ok);
  if (!redeemed.ok) return;
  school = redeemed.school;
  assert.equal(redeemed.guardianId, 'akouvi');
  assert.equal(needsGuardianCode(school, 'kokou', TODAY), false);
  assert.deepEqual(childrenOf(school, 'akouvi'), ['elom', 'kokou']);
  // Le code est lié à Kokou : refusé à tout autre compte…
  assert.deepEqual(redeemGuardianCode(school, 'PAR-7K3Q-9M2X', 'cm2-01', TODAY), { ok: false, reason: 'used' });
  assert.ok(REDEEM_MESSAGE.used.includes('déjà servi'));
  // … mais Kokou peut le saisir de nouveau (autre appareil), même après les sept jours, sans rien changer.
  const again = redeemGuardianCode(school, 'PAR-7K3Q-9M2X', 'kokou', addDays(TODAY, 30));
  assert.ok(again.ok);
  if (again.ok) {
    assert.equal(again.guardianId, 'akouvi');
    assert.deepEqual(again.school, school);
  }
  // Même activé, un enfant de CM2 reste dans une classe « stricte » : pas de publication.
  assert.equal(restrictionFor(school, 'kokou', TODAY), 3);
  assert.equal(canPublish(school, 'kokou', TODAY), false);
});

test('code parental : créé seulement par un parent vérifié ; expiré, non vérifié et limite de deux refusés', () => {
  let school = seed();
  let n = 0;
  const fixed = () => ((n += 1) * 0.137) % 1;
  assert.match(makeGuardianCode(fixed), /^PAR-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);

  assert.deepEqual(issueGuardianCode(school, 'afi', 'Kokou', TODAY), { ok: false, reason: 'not-guardian' });
  assert.deepEqual(issueGuardianCode(school, 'mawuena', 'Kokou', TODAY), { ok: false, reason: 'unverified' });
  assert.deepEqual(issueGuardianCode(school, 'akouvi', '   ', TODAY), { ok: false, reason: 'name' });
  const issued = issueGuardianCode(school, 'akouvi', 'Kokou', TODAY, fixed);
  assert.ok(issued.ok);
  if (!issued.ok) return;
  school = issued.school;
  assert.equal(school.guardianCodes.length, 2);
  assert.notEqual(issued.code.code, 'PAR-7K3Q-9M2X');

  // Code expiré.
  assert.deepEqual(redeemGuardianCode(school, issued.code.code, 'kokou', addDays(TODAY, 8)), { ok: false, reason: 'expired' });
  // Parent dont l'identité n'est plus vérifiée au moment de la saisie.
  const unverified: SchoolState = { ...school, accounts: { ...school.accounts, akouvi: { ...school.accounts.akouvi, identity: 'pending' } } };
  assert.deepEqual(redeemGuardianCode(unverified, issued.code.code, 'kokou', TODAY), { ok: false, reason: 'unverified' });
  // Déjà rattaché à ce parent.
  assert.deepEqual(redeemGuardianCode(school, issued.code.code, 'elom', TODAY), { ok: false, reason: 'already-linked' });
  // Deux parents ou tuteurs au plus.
  const full: SchoolState = {
    ...school,
    guardianLinks: [
      { guardianId: 'g1', childId: 'kokou', since: TODAY },
      { guardianId: 'g2', childId: 'kokou', since: TODAY }
    ]
  };
  assert.deepEqual(redeemGuardianCode(full, issued.code.code, 'kokou', TODAY), { ok: false, reason: 'limit' });
});

test('niveaux de restriction : le plus strict des classes ; un mineur est au moins « encadré »', () => {
  let school = seed();
  assert.equal(restrictionFor(school, 'afi', TODAY), 1, 'adulte dans une classe ouverte');
  assert.equal(restrictionFor(school, 'elom', TODAY), 2);
  assert.equal(restrictionFor(school, 'kokou', TODAY), 3);
  assert.equal(restrictionFor(school, 'sena', TODAY), 2, 'mineure sans classe validée');
  assert.equal(restrictionFor(school, 'kossi', TODAY), 1);

  // L'établissement durcit la Terminale D : Elom ne publie plus.
  assert.equal(canPublish(school, 'elom', TODAY), true);
  school = setClassRestriction(school, 'cl-tle-d', 3);
  assert.equal(restrictionFor(school, 'elom', TODAY), 3);
  assert.equal(canPublish(school, 'elom', TODAY), false);
  // Une classe « ouverte » ne lève pas la protection d'un mineur.
  school = setClassRestriction(school, 'cl-tle-d', 1);
  assert.equal(restrictionFor(school, 'elom', TODAY), 2);
  // Deux classes : la plus stricte l'emporte.
  school = addClass(school, { institutionId: 'inst-horizon', name: 'Atelier', level: 'Cours du soir', year: '2026-2027', restriction: 3 });
  const atelier = school.classes.at(-1)!;
  school = { ...school, memberships: school.memberships.map((m) => (m.userId === 'afi' ? { ...m, classIds: [...m.classIds, atelier.id] } : m)) };
  assert.deepEqual(classesOfStudent(school, 'afi').map((c) => c.restriction), [1, 3]);
  assert.equal(restrictionFor(school, 'afi', TODAY), 3);
});

test('parent ou tuteur : lit, ne publie pas ; écrit à ses enfants et à leurs encadrants seulement', () => {
  const school = seed();
  assert.equal(canPublish(school, 'akouvi', TODAY), false);
  assert.equal(canPublish(school, 'afi', TODAY), true);
  assert.equal(canPublish(school, 'kossi', TODAY), true);

  assert.equal(relationBetween(school, 'akouvi', 'elom'), 'family');
  assert.equal(contactRefusal(school, 'akouvi', 'elom', TODAY), null);
  // Kossi enseigne à Elom : la mère peut lui écrire, et lui à elle.
  assert.equal(contactRefusal(school, 'akouvi', 'kossi', TODAY), null);
  assert.equal(contactRefusal(school, 'kossi', 'akouvi', TODAY), null);
  // Afi n'a aucun lien avec elle.
  assert.equal(contactRefusal(school, 'akouvi', 'afi', TODAY), 'guardian-scope');
  // Ama n'enseigne pas (encore) à ses enfants.
  assert.equal(contactRefusal(school, 'akouvi', 'ama', TODAY), 'guardian-scope');
});

test('mineurs : messagerie limitée à la famille et à l’établissement ; absents des suggestions des inconnus', () => {
  const school = seed();
  // Elom (17 ans, classe encadrée).
  assert.equal(contactRefusal(school, 'afi', 'elom', TODAY), 'protected', 'une adulte inconnue ne peut pas lui écrire');
  assert.equal(contactRefusal(school, 'elom', 'afi', TODAY), 'protected');
  assert.equal(contactRefusal(school, 'elom', 'kossi', TODAY), null, 'son enseignant');
  assert.equal(contactRefusal(school, 'elom', 'tle-01', TODAY), null, 'un camarade de classe');
  assert.equal(contactRefusal(school, 'elom', 'palmiers', TODAY), null, 'son établissement');
  assert.equal(relationBetween(school, 'elom', 'tle-01'), 'institution');
  // Kokou attend son code : aucun échange.
  assert.equal(contactRefusal(school, 'akouvi', 'kokou', TODAY), 'awaiting-code');
  // Entre adultes sans lien : rien ne s'y oppose ici (les règles de contact de chacun s'appliquent ensuite).
  assert.equal(contactRefusal(school, 'afi', 'kodjo', TODAY), null);
  // Suivi accepté par un encadreur indépendant.
  assert.equal(relationBetween(school, 'edem', 'sam'), 'mentorship');
  assert.equal(relationBetween(school, 'ama', 'fatou'), null, 'demande de suivi encore en attente');

  assert.equal(visibleInSuggestions(school, 'afi', 'elom', TODAY), false);
  assert.equal(visibleInSuggestions(school, 'kossi', 'elom', TODAY), true, 'son enseignant le voit');
  assert.equal(visibleInSuggestions(school, 'afi', 'akouvi', TODAY), false, 'un parent n’est jamais suggéré');
  assert.equal(visibleInSuggestions(school, 'akouvi', 'afi', TODAY), false, 'un parent ne reçoit pas de suggestions');
  assert.equal(visibleInSuggestions(school, 'afi', 'kokou', TODAY), false);
  assert.equal(visibleInSuggestions(school, 'afi', 'kossi', TODAY), true);
  // Un élève d'une classe « stricte » ne se voit pas proposer d'inconnus ; son établissement, si.
  assert.equal(visibleInSuggestions(school, 'cm2-01', 'afi', TODAY), false);
  assert.equal(visibleInSuggestions(school, 'cm2-01', 'palmiers', TODAY), true);
});

test('capacités par profil : ce que chacun voit et peut faire', () => {
  const school = seed();
  const caps = (uid: string) => resolveCapabilities(uid, 'local', [], undefined, school, TODAY);

  const afi = caps('afi');
  assert.deepEqual(
    [afi.accountKind, afi.canPublish, afi.canTeach, afi.canManageFamily, afi.canManageInstitution, afi.awaitingGuardianCode],
    ['learner', true, false, false, false, false]
  );
  const kossi = caps('kossi');
  assert.deepEqual([kossi.accountKind, kossi.canTeach, kossi.canCreate, kossi.roleLabel], ['educator', true, true, 'Enseignant · 2 établissements']);
  const akouvi = caps('akouvi');
  assert.deepEqual(
    [akouvi.accountKind, akouvi.canPublish, akouvi.canManageFamily, akouvi.canCreate, akouvi.roleLabel],
    ['guardian', false, true, false, 'Parent ou tuteur']
  );
  const palmiers = caps('palmiers');
  assert.deepEqual([palmiers.accountKind, palmiers.canManageInstitution, palmiers.canCreate], ['institution', true, false]);
  const elom = caps('elom');
  assert.deepEqual([elom.roleLabel, elom.canPublish, elom.awaitingGuardianCode], ['Élève · Terminale D', true, false]);
  const kokou = caps('kokou');
  assert.deepEqual([kokou.roleLabel, kokou.canPublish, kokou.awaitingGuardianCode], ['Élève · CM2', false, true]);
  // La gouvernance garde ses droits et son intitulé.
  const nadege = caps('nadege');
  assert.deepEqual([nadege.canAdmin, nadege.roleLabel], [true, 'Modération & Gouvernance']);
  // Sans données scolaires (mode connecté) : tout membre reste un apprenant adulte qui peut publier.
  const cloud = resolveCapabilities('quelquun', 'cloud', []);
  assert.deepEqual([cloud.accountKind, cloud.canPublish, cloud.canTeach], ['learner', true, false]);
  // Les routes des espaces suivent les capacités.
  assert.equal(canAccessRoute('family', akouvi), true);
  assert.equal(canAccessRoute('family', afi), false);
  assert.equal(canAccessRoute('teaching', kossi), true);
  assert.equal(canAccessRoute('teaching', akouvi), false);
  assert.equal(canAccessRoute('institution', palmiers), true);
  assert.equal(canAccessRoute('institution', kossi), false);
});

test('suivi des résultats : soi-même, ses parents, ses encadrants, son établissement — personne d’autre', () => {
  const school = seed();
  assert.equal(canViewPerformance(school, 'elom', 'elom'), true);
  assert.equal(canViewPerformance(school, 'akouvi', 'elom'), true);
  assert.equal(canViewPerformance(school, 'kossi', 'elom'), true);
  assert.equal(canViewPerformance(school, 'palmiers', 'elom'), true);
  assert.equal(canViewPerformance(school, 'afi', 'elom'), false);
  assert.equal(canViewPerformance(school, 'ama', 'elom'), false, 'demande de rattachement encore en attente');
  assert.equal(canViewPerformance(school, 'akouvi', 'tle-01'), false, 'un parent ne voit pas les autres élèves');
  assert.equal(canViewPerformance(school, 'akouvi', 'kokou'), false, 'pas avant que le code soit saisi');
  // Les Palmiers ne voient pas les élèves du Centre Horizon.
  assert.equal(canViewPerformance(school, 'palmiers', 'afi'), false);
  assert.equal(canViewPerformance(school, 'kossi', 'afi'), true, 'Kossi enseigne aussi au Centre Horizon');
  assert.equal(canViewPerformance(school, 'edem', 'sam'), true, 'suivi accepté');
  assert.equal(canViewPerformance(school, 'ama', 'fatou'), false, 'suivi demandé, pas encore accepté');
  assert.equal(learnersOf(school, 'kossi').length, 10 + 8 + 3);
  assert.deepEqual(learnersOf(school, 'edem'), ['sam']);
});

test('prix et achats simulés : montrés aux adultes seulement ; un parent vérifié achète pour son enfant', () => {
  let school = seed();
  assert.equal(formatPrice(1500), '1 500 FCFA');
  assert.equal(formatPrice(0), 'Gratuit');
  assert.equal(canSeePrices(school, 'akouvi', TODAY), true);
  assert.equal(canSeePrices(school, 'afi', TODAY), true);
  assert.equal(canSeePrices(school, 'elom', TODAY), false);
  assert.equal(canSeePrices(school, 'kokou', TODAY), false);

  // Elom a déjà le module acheté par sa mère ; les autres contenus payants restent fermés ; le gratuit est ouvert.
  assert.equal(hasAccess(school, 'elom', 'budget'), true);
  assert.equal(hasAccess(school, 'elom', 'reunion'), false);
  assert.equal(hasAccess(school, 'elom', 'comptes'), true);
  assert.equal(hasAccess(school, 'afi', 'budget'), false);

  assert.deepEqual(buyItem(school, 'akouvi', 'elom', 'budget', TODAY), { ok: false, reason: 'owned' });
  assert.deepEqual(buyItem(school, 'akouvi', 'elom', 'comptes', TODAY), { ok: false, reason: 'free' });
  assert.deepEqual(buyItem(school, 'elom', 'elom', 'reunion', TODAY), { ok: false, reason: 'minor' });
  assert.deepEqual(buyItem(school, 'akouvi', 'tle-01', 'reunion', TODAY), { ok: false, reason: 'not-child' });
  assert.deepEqual(buyItem(school, 'afi', 'elom', 'reunion', TODAY), { ok: false, reason: 'not-child' });

  const bought = buyItem(school, 'akouvi', 'elom', 'reunion', TODAY);
  assert.ok(bought.ok);
  if (!bought.ok) return;
  school = bought.school;
  assert.equal(bought.purchase.amount, 1000);
  assert.equal(bought.purchase.id, 'REC-20261117-002');
  assert.equal(hasAccess(school, 'elom', 'reunion'), true);
  assert.equal(hasAccess(school, 'kokou', 'reunion'), false, 'l’achat vaut pour l’enfant désigné');

  // Une adulte achète pour elle-même, sans vérification d'identité.
  const own = buyItem(school, 'afi', 'afi', 'budget', TODAY);
  assert.ok(own.ok);
  // Un parent non vérifié ne peut pas acheter pour un enfant.
  const pendingParent: SchoolState = {
    ...school,
    guardianLinks: [...school.guardianLinks, { guardianId: 'mawuena', childId: 'tro-01', since: TODAY }]
  };
  assert.deepEqual(buyItem(pendingParent, 'mawuena', 'tro-01', 'budget', TODAY), { ok: false, reason: 'unverified' });
});

test('vérification d’identité simulée : demande, décision de la Gouvernance, effet sur le compte', () => {
  let school = seed();
  assert.equal(accountOf(school, 'afi').identity, 'none');
  school = submitIdentity(school, 'afi', 'cni', TODAY);
  assert.equal(accountOf(school, 'afi').identity, 'pending');
  const request = school.identityRequests[0];
  assert.deepEqual({ id: request.id, userId: request.userId, status: request.status }, { id: 'KYC-005', userId: 'afi', status: 'pending' });
  // Une nouvelle demande remplace celle en attente, sans en empiler deux.
  school = submitIdentity(school, 'afi', 'passeport', TODAY);
  assert.equal(school.identityRequests.filter((r) => r.userId === 'afi' && r.status === 'pending').length, 1);
  const current = school.identityRequests.find((r) => r.userId === 'afi')!;
  school = decideIdentity(school, current.id, 'refused', 'Document illisible');
  assert.equal(accountOf(school, 'afi').identity, 'refused');
  assert.equal(school.identityRequests.find((r) => r.id === current.id)!.note, 'Document illisible');
  // Une demande déjà tranchée ne se rejoue pas.
  assert.equal(decideIdentity(school, current.id, 'verified'), school);
  // Aucun fichier n'est conservé : la demande ne porte que le type de pièce.
  assert.deepEqual(Object.keys(request).sort(), ['document', 'id', 'status', 'submittedOn', 'userId']);
});

test('emploi du temps : créneaux de l’élève et de l’enseignant, minutes de cours, chevauchements', () => {
  const school = seed();
  const elom = slotsFor(school, 'elom');
  assert.equal(elom.length, 13);
  assert.ok(elom.every((s) => s.classId === 'cl-tle-d'));
  assert.deepEqual(
    elom.map((s) => `${s.weekday}-${s.start}`),
    [...elom.map((s) => `${s.weekday}-${s.start}`)].sort(),
    'triés par jour puis par heure'
  );
  assert.equal(busyMinutes(elom, 1), 360, 'lundi : trois cours de deux heures');
  assert.equal(busyMinutes(elom, 0), 0, 'dimanche libre');

  // Kossi ne voit que ses propres cours, dans ses trois classes.
  const kossi = slotsFor(school, 'kossi');
  assert.deepEqual(kossi.map((s) => s.classId), ['cl-3e-a', 'cl-reseaux', 'cl-tle-d', 'cl-reseaux', 'cl-3e-a']);
  assert.ok(kossi.every((s) => s.teacherId === 'kossi'));
  assert.deepEqual(slotsFor(school, 'afi').map((s) => s.subject), ['Réseaux informatiques', 'Réseaux informatiques']);
  assert.deepEqual(slotsFor(school, 'akouvi'), [], 'le parent passe par la fiche de son enfant');

  // Même classe, même heure : refusé. Même enseignant dans deux classes à la même heure : refusé.
  const clash = slotConflict(school.timetable, { classId: 'cl-tle-d', weekday: 1, start: '08:00', end: '10:00', subject: 'Anglais' });
  assert.equal(clash?.subject, 'Mathématiques');
  const teacherClash = slotConflict(school.timetable, { classId: 'cl-3e-a', weekday: 3, start: '11:00', end: '12:00', subject: 'Informatique', teacherId: 'kossi' });
  assert.equal(teacherClash?.classId, 'cl-tle-d');
  // Créneaux qui se touchent sans se chevaucher : acceptés.
  assert.equal(slotConflict(school.timetable, { classId: 'cl-tle-d', weekday: 1, start: '11:15', end: '12:15', subject: 'Anglais' }), undefined);
  // Modifier un créneau ne le met pas en conflit avec lui-même.
  const first = school.timetable[0];
  assert.equal(slotConflict(school.timetable, { ...first }), undefined);
});

test('progressions des classes : assez riches pour que l’enseignant voie où sa classe bute', () => {
  const school = seed();
  const comptes = CATALOG_ITEMS.find((item) => item.id === 'comptes')!;
  const learners = studentsOfClass(school, 'cl-tle-d')
    .map((uid) => SEED_SCHOOL_PROGRESS[uid]?.comptes)
    .filter((p): p is NonNullable<typeof p> => Boolean(p && (p.lessons.length > 0 || p.submitted)));
  const stat = computeModuleStat(comptes, learners);
  assert.ok(stat.learners >= 6, 'la plupart des élèves ont commencé');
  assert.ok(stat.submitted >= 4, 'plusieurs quiz envoyés');
  assert.ok(stat.submitted < stat.learners, 'tous ne vont pas jusqu’au quiz');
  const rates = stat.questions.map((q) => q.correctRate as number);
  assert.equal(Math.min(...rates), rates[1], 'la deuxième question est la moins réussie');
  assert.ok(rates[1] < rates[0] && rates[1] < rates[2]);
  // Mêmes chiffres à chaque visite.
  assert.deepEqual(SEED_SCHOOL_PROGRESS['tle-01'], SEED_SCHOOL_PROGRESS['tle-01']);
  assert.equal(SEED_SCHOOL_PROGRESS.elom.comptes.submitted, true);
});

test('état enregistré par une ancienne version : complété à partir de l’état de départ', () => {
  const base = seed();
  assert.equal(normalizeSchoolState(undefined, base), base);
  const restored = normalizeSchoolState({ guardianLinks: [], accounts: { afi: { kind: 'learner', identity: 'verified' } } }, base);
  assert.deepEqual(restored.guardianLinks, []);
  assert.equal(restored.accounts.afi.identity, 'verified');
  assert.equal(restored.accounts.kossi.kind, 'educator', 'les comptes absents de l’enregistrement reviennent');
  assert.equal(restored.classes.length, base.classes.length);
  assert.deepEqual(emptySchoolState().institutions, []);
});

test('bibliothèque d’établissement : contenus de ses enseignants, offerts à ses élèves ; un établissement ne publie pas', () => {
  let school = seed();
  const items = [
    { id: 'sauvegarde', author: 'kossi' },
    { id: 'email-pro', author: 'ama' },
    { id: 'budget', author: 'edem' }
  ];
  const byAuthor = (item: { author: string }) => item.author;
  // Kossi enseigne aux Palmiers ; Ama attend encore la validation de son rattachement.
  assert.deepEqual(libraryOf(school, 'inst-palmiers', items, byAuthor).map((i) => i.id), ['sauvegarde']);
  assert.deepEqual(libraryOf(school, 'inst-horizon', items, byAuthor).map((i) => i.id), ['sauvegarde']);

  // Payant pour le public, offert aux élèves des établissements où Kossi enseigne.
  assert.equal(offeringInstitution(school, 'elom', 'kossi')?.name, 'Les Palmiers');
  assert.equal(offeringInstitution(school, 'afi', 'kossi')?.name, 'Centre Horizon');
  assert.equal(offeringInstitution(school, 'nadege', 'kossi'), undefined);
  assert.equal(hasAccess(school, 'elom', 'sauvegarde', 'kossi'), true);
  assert.equal(hasAccess(school, 'nadege', 'sauvegarde', 'kossi'), false);
  assert.equal(hasAccess(school, 'elom', 'sauvegarde'), false, 'sans auteur connu, rien n’est offert');

  // Rattachement validé : les contenus d'Ama entrent dans la bibliothèque des Palmiers.
  school = setMembershipStatus(school, 'mb-ama-palmiers', 'active');
  assert.deepEqual(libraryOf(school, 'inst-palmiers', items, byAuthor).map((i) => i.id), ['sauvegarde', 'email-pro']);

  // L'établissement donne un module à une classe, ou le lui retire.
  const given = toggleClassModule(school, 'cl-cm2', 'sauvegarde');
  assert.ok(given.classes.find((c) => c.id === 'cl-cm2')!.moduleIds.includes('sauvegarde'));
  assert.ok(!toggleClassModule(given, 'cl-cm2', 'sauvegarde').classes.find((c) => c.id === 'cl-cm2')!.moduleIds.includes('sauvegarde'));

  // Pas de fil pour un établissement : il ne publie pas.
  assert.equal(canPublish(school, 'palmiers', TODAY), false);
});

test('prochain cours : celui en cours, sinon le suivant dans la semaine ; heures en français', async () => {
  const { nextSlot, clockLabel } = await import('../src/school');
  // Jeudi 19 novembre 2026 : un cours de 10 h à 12 h ; vendredi, un cours à 8 h.
  const slots = [
    { id: 'a', classId: 'c1', weekday: 4, start: '10:00', end: '12:00', subject: 'Informatique' },
    { id: 'b', classId: 'c2', weekday: 5, start: '08:00', end: '10:00', subject: 'Réseaux', room: 'Salle 2' }
  ];
  const at = (h: number, m = 0) => h * 60 + m;
  assert.deepEqual(nextSlot(slots, '2026-11-19', at(9)), { slot: slots[0], day: '2026-11-19', live: false });
  assert.equal(nextSlot(slots, '2026-11-19', at(11))?.live, true, 'cours en ce moment');
  assert.deepEqual(nextSlot(slots, '2026-11-19', at(13)), { slot: slots[1], day: '2026-11-20', live: false });
  assert.equal(nextSlot([], '2026-11-19', at(9)), null);
  assert.equal(clockLabel('07:00'), '7 h');
  assert.equal(clockLabel('10:30'), '10 h 30');
});

test('badge d’un module : celui que son quiz débloque à lui seul', async () => {
  const { moduleBadge } = await import('../src/personas');
  assert.equal(moduleBadge('phishing')?.title, 'Vigilance Phishing');
  assert.equal(moduleBadge('email-pro')?.title, 'Plume Claire');
  assert.equal(moduleBadge('inconnu'), null);
});
