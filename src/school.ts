/**
 * Profils et vie scolaire : apprenant, encadrant, parent ou tuteur, établissement.
 *
 * Tout ce fichier est de la logique pure, sans écran. Les règles qu'il porte sont celles du
 * rapport de cadrage (note/rapport-plan.md, §9) :
 *  - un seul profil « encadrant » : son intitulé découle de la vérification d'identité et du
 *    rattachement à un établissement, et bascule tout seul quand l'un des deux change ;
 *  - en dessous de 12 ans, un compte ne s'active qu'avec le code d'un parent ou tuteur vérifié ;
 *  - chaque classe porte un niveau de restriction ; le plus strict s'applique à l'élève ;
 *  - on ne suit les résultats que de ses apprenants, de ses enfants ou de ses classes.
 *
 * La vérification d'identité et les paiements sont SIMULÉS : aucun document, aucun visage,
 * aucun argent ne quitte l'appareil.
 */
import { addDays, diffDays, weekdayOf, type Day } from './calendar';
import type { PlanItem } from './planning';
import type { WeekSnapshot } from './trends';

/* ------------------------------------------------------------------ Comptes */

export type AccountKind = 'learner' | 'educator' | 'guardian' | 'institution';

export const ACCOUNT_KIND_LABEL: Record<AccountKind, string> = {
  learner: 'Apprenant',
  educator: 'Encadrant',
  guardian: 'Parent ou tuteur',
  institution: 'Établissement'
};

/** Vérification d'identité (simulée) : jamais demandée, en cours d'examen, acceptée, refusée. */
export type IdentityStatus = 'none' | 'pending' | 'verified' | 'refused';

export const IDENTITY_LABEL: Record<IdentityStatus, string> = {
  none: 'Identité non vérifiée',
  pending: 'Vérification en cours',
  verified: 'Identité vérifiée',
  refused: 'Vérification refusée'
};

export interface AccountRecord {
  kind: AccountKind;
  /** Date de naissance ; absente pour un établissement et pour les comptes adultes d'origine. */
  birthDate?: Day;
  identity: IdentityStatus;
  /** Établissement que ce compte administre (compte « établissement »). */
  institutionId?: string;
}

const DEFAULT_ACCOUNT: AccountRecord = { kind: 'learner', identity: 'none' };

/** En dessous de cet âge, le compte ne s'active qu'avec le code d'un parent ou tuteur. */
export const GUARDIAN_CODE_AGE = 12;
export const ADULT_AGE = 18;
/** Durée de validité d'un code parental, en jours. */
export const GUARDIAN_CODE_DAYS = 7;
/** Nombre maximal de parents ou tuteurs rattachés à un enfant. */
export const MAX_GUARDIANS = 2;

export type AgeBand = 'child' | 'teen' | 'adult';

export function ageOn(birthDate: Day, today: Day): number {
  const years = Number(today.slice(0, 4)) - Number(birthDate.slice(0, 4));
  return today.slice(5) < birthDate.slice(5) ? years - 1 : years;
}

/** Tranche d'âge d'un compte. Sans date de naissance, le compte est tenu pour adulte. */
export function ageBandOf(account: AccountRecord | undefined, today: Day): AgeBand {
  if (!account?.birthDate) return 'adult';
  const age = ageOn(account.birthDate, today);
  return age < GUARDIAN_CODE_AGE ? 'child' : age < ADULT_AGE ? 'teen' : 'adult';
}

/* ------------------------------------------------------------------ Établissements et liens */

export interface Institution {
  id: string;
  name: string;
  city: string;
  type: string;
  /** Vérifié par la Gouvernance de SAVOIR+. */
  verified: boolean;
}

/** 1 ouvert · 2 encadré · 3 strict. */
export type RestrictionLevel = 1 | 2 | 3;

export const RESTRICTION_LABEL: Record<RestrictionLevel, string> = { 1: 'Ouvert', 2: 'Encadré', 3: 'Strict' };
export const RESTRICTION_DETAIL: Record<RestrictionLevel, string> = {
  1: 'Fil, publications et messagerie comme tout membre.',
  2: 'L’élève lit le fil et publie ; sa messagerie privée est limitée à son établissement et à ses parents.',
  3: 'L’élève lit sans publier ni réagir ; aucune messagerie hors de sa famille et de son établissement.'
};

export interface SchoolClass {
  id: string;
  institutionId: string;
  name: string;
  level: string;
  year: string;
  restriction: RestrictionLevel;
  /** Modules SAVOIR+ donnés à la classe. */
  moduleIds: string[];
}

export type MembershipStatus = 'pending' | 'active' | 'declined' | 'ended';

/** Rattachement d'un membre à un établissement, comme enseignant ou comme élève. */
export interface Membership {
  id: string;
  institutionId: string;
  userId: string;
  role: 'teacher' | 'student';
  status: MembershipStatus;
  classIds: string[];
  /** Matière enseignée (enseignant). */
  subject?: string;
  /** Qui a fait la demande : le membre, ou l'établissement qui l'invite ou crée son compte. */
  requestedBy: 'member' | 'institution';
  requestedOn: Day;
}

export interface GuardianLink {
  guardianId: string;
  childId: string;
  since: Day;
}

/** Code créé par un parent ou tuteur vérifié, pour un enfant, à usage unique. */
export interface GuardianCode {
  code: string;
  guardianId: string;
  childName: string;
  createdOn: Day;
  usedBy?: string;
}

/** Suivi d'un apprenant par un encadreur indépendant, avec l'accord de l'apprenant. */
export interface Mentorship {
  id: string;
  educatorId: string;
  learnerId: string;
  status: MembershipStatus;
  requestedOn: Day;
}

export interface TimetableSlot {
  id: string;
  classId: string;
  /** 1 = lundi … 6 = samedi. */
  weekday: number;
  /** « 07:00 » */
  start: string;
  end: string;
  subject: string;
  /** Enseignant titulaire d'un compte SAVOIR+ ; sinon seul son nom est affiché. */
  teacherId?: string;
  teacherName?: string;
  room?: string;
}

/** Achat simulé : aucun argent réel. */
export interface Purchase {
  id: string;
  buyerId: string;
  forUserId: string;
  itemId: string;
  amount: number;
  day: Day;
  method: string;
}

export type IdentityDocument = 'cni' | 'passeport' | 'carte-electeur';
export const IDENTITY_DOCUMENT_LABEL: Record<IdentityDocument, string> = {
  cni: 'Carte nationale d’identité',
  passeport: 'Passeport',
  'carte-electeur': 'Carte d’électeur'
};

/** Demande de vérification d'identité, instruite par la Gouvernance. Simulée : aucun fichier n'est conservé. */
export interface IdentityRequest {
  id: string;
  userId: string;
  document: IdentityDocument;
  submittedOn: Day;
  status: IdentityStatus;
  note?: string;
}

export interface SchoolState {
  accounts: Record<string, AccountRecord>;
  institutions: Institution[];
  classes: SchoolClass[];
  memberships: Membership[];
  guardianLinks: GuardianLink[];
  guardianCodes: GuardianCode[];
  mentorships: Mentorship[];
  timetable: TimetableSlot[];
  /** Planification des classes : séquences de cours, révisions, évaluations. */
  plans: PlanItem[];
  purchases: Purchase[];
  identityRequests: IdentityRequest[];
  /** Verrouillage de SAVOIR+ réglé par le parent d'un enfant de moins de 12 ans (src/deviceLock.ts). */
  deviceRules: DeviceRules[];
  /** Minutes passées sur SAVOIR+ par un enfant verrouillable, jour par jour. */
  screenUsage: ScreenUsage[];
  /** Demandes de temps en plus, de l'enfant au parent. */
  timeRequests: TimeRequest[];
  /** Prix de démonstration, en francs CFA. Absent : contenu gratuit. */
  prices: Record<string, number>;
  /** Relevés hebdomadaires des tableaux de bord (src/trends.ts). Absent dans un état enregistré avant eux. */
  snapshots?: WeekSnapshot[];
}

/** Règles de verrouillage d'un enfant, choisies par son parent selon son besoin. */
export interface DeviceRules {
  childId: string;
  /** Mis en pause par le parent, jusqu'à ce qu'il déverrouille. */
  lockedNow: boolean;
  /** Minutes par jour ; 0 : sans limite. */
  weekdayMinutes: number;
  weekendMinutes: number;
  /** Plages autorisées, « HH:MM » ; de 00:00 à 24:00 : toute la journée. */
  weekdayFrom: string;
  weekdayTo: string;
  weekendFrom: string;
  weekendTo: string;
  /** Ce qui reste ouvert en dehors des modules et de la bibliothèque. */
  allowFeed: boolean;
  allowMessages: boolean;
  /** Minutes accordées en plus pour un jour, en réponse à une demande. */
  bonus?: { day: Day; minutes: number };
}

export interface ScreenUsage {
  childId: string;
  day: Day;
  minutes: number;
}

export interface TimeRequest {
  id: string;
  childId: string;
  day: Day;
  /** Heure de la demande, « 17 h 05 ». */
  at: string;
  status: 'pending' | 'granted' | 'declined';
  /** Minutes accordées. */
  minutes?: number;
}

export const emptySchoolState = (): SchoolState => ({
  accounts: {},
  institutions: [],
  classes: [],
  memberships: [],
  guardianLinks: [],
  guardianCodes: [],
  mentorships: [],
  timetable: [],
  plans: [],
  purchases: [],
  identityRequests: [],
  deviceRules: [],
  screenUsage: [],
  timeRequests: [],
  prices: {}
});

/** Complète un état enregistré par une version précédente, à partir de l'état de départ. */
export function normalizeSchoolState(raw: Partial<SchoolState> | undefined | null, base: SchoolState): SchoolState {
  if (!raw) return base;
  const list = <T,>(value: T[] | undefined, fallback: T[]): T[] => (Array.isArray(value) ? value : fallback);
  return {
    accounts: { ...base.accounts, ...(raw.accounts || {}) },
    institutions: list(raw.institutions, base.institutions),
    classes: list(raw.classes, base.classes),
    memberships: list(raw.memberships, base.memberships),
    guardianLinks: list(raw.guardianLinks, base.guardianLinks),
    guardianCodes: list(raw.guardianCodes, base.guardianCodes),
    mentorships: list(raw.mentorships, base.mentorships),
    timetable: list(raw.timetable, base.timetable),
    plans: list(raw.plans, base.plans),
    purchases: list(raw.purchases, base.purchases),
    identityRequests: list(raw.identityRequests, base.identityRequests),
    deviceRules: list(raw.deviceRules, base.deviceRules),
    screenUsage: list(raw.screenUsage, base.screenUsage),
    timeRequests: list(raw.timeRequests, base.timeRequests),
    prices: { ...base.prices, ...(raw.prices || {}) },
    snapshots: list(raw.snapshots, base.snapshots || [])
  };
}

export const accountOf = (school: SchoolState, uid: string): AccountRecord => school.accounts[uid] || DEFAULT_ACCOUNT;
export const institutionOf = (school: SchoolState, id: string | undefined): Institution | undefined =>
  school.institutions.find((i) => i.id === id);

const activeMemberships = (school: SchoolState, uid: string, role?: Membership['role']) =>
  school.memberships.filter((m) => m.userId === uid && m.status === 'active' && (!role || m.role === role));

/* ------------------------------------------------------------------ Encadrant */

export interface EducatorStanding {
  /** Enseignant d'un établissement, ou encadreur indépendant. */
  status: 'teacher' | 'independent';
  verified: boolean;
  institutions: Institution[];
  label: string;
}

/**
 * Intitulé d'un encadrant. Il n'est pas choisi : il faut une identité vérifiée ET un rattachement
 * validé pour être « enseignant ». Que l'un des deux tombe, et l'encadrant redevient indépendant.
 */
export function educatorStanding(school: SchoolState, uid: string): EducatorStanding {
  const verified = accountOf(school, uid).identity === 'verified';
  const institutions = verified
    ? activeMemberships(school, uid, 'teacher')
        .map((m) => institutionOf(school, m.institutionId))
        .filter((i): i is Institution => Boolean(i))
        .filter((inst, index, all) => all.findIndex((x) => x.id === inst.id) === index)
    : [];
  if (institutions.length > 0) {
    return {
      status: 'teacher',
      verified,
      institutions,
      label: institutions.length === 1 ? `Enseignant · ${institutions[0].name}` : `Enseignant · ${institutions.length} établissements`
    };
  }
  return { status: 'independent', verified, institutions: [], label: verified ? 'Encadreur indépendant vérifié' : 'Encadreur indépendant' };
}

/* ------------------------------------------------------------------ Parents, tuteurs, enfants */

export const childrenOf = (school: SchoolState, guardianId: string): string[] =>
  school.guardianLinks.filter((l) => l.guardianId === guardianId).map((l) => l.childId);
export const guardiansOf = (school: SchoolState, childId: string): string[] =>
  school.guardianLinks.filter((l) => l.childId === childId).map((l) => l.guardianId);

/** Un compte de moins de 12 ans attend le code d'un parent ou tuteur vérifié. */
export function needsGuardianCode(school: SchoolState, uid: string, today: Day): boolean {
  const account = accountOf(school, uid);
  if (account.kind !== 'learner' || ageBandOf(account, today) !== 'child') return false;
  return !guardiansOf(school, uid).some((g) => accountOf(school, g).identity === 'verified');
}

export type CodeStatus = 'valid' | 'used' | 'expired';

export function guardianCodeStatus(code: GuardianCode, today: Day): CodeStatus {
  if (code.usedBy) return 'used';
  return diffDays(code.createdOn, today) > GUARDIAN_CODE_DAYS ? 'expired' : 'valid';
}

/** Dernier jour de validité d'un code. */
export const guardianCodeExpiry = (code: GuardianCode): Day => addDays(code.createdOn, GUARDIAN_CODE_DAYS);

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans I, O, 0, 1 : pas de confusion à la lecture

/** Fabrique un code lisible, de la forme « PAR-7K3Q-9M2X ». */
export function makeGuardianCode(random: () => number = Math.random): string {
  const pick = () => CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length) % CODE_ALPHABET.length];
  const block = () => Array.from({ length: 4 }, pick).join('');
  return `PAR-${block()}-${block()}`;
}

export const normalizeCode = (raw: string): string => raw.trim().toUpperCase().replace(/\s+/g, '');

export type IssueCodeResult = { ok: true; school: SchoolState; code: GuardianCode } | { ok: false; reason: 'not-guardian' | 'unverified' | 'name' };

/** Un parent ou tuteur vérifié crée un code pour un enfant. */
export function issueGuardianCode(
  school: SchoolState,
  guardianId: string,
  childName: string,
  today: Day,
  random: () => number = Math.random
): IssueCodeResult {
  const account = accountOf(school, guardianId);
  if (account.kind !== 'guardian') return { ok: false, reason: 'not-guardian' };
  if (account.identity !== 'verified') return { ok: false, reason: 'unverified' };
  const name = childName.trim();
  if (!name) return { ok: false, reason: 'name' };
  let value = makeGuardianCode(random);
  while (school.guardianCodes.some((c) => c.code === value)) value = makeGuardianCode(random);
  const code: GuardianCode = { code: value, guardianId, childName: name, createdOn: today };
  return { ok: true, school: { ...school, guardianCodes: [...school.guardianCodes, code] }, code };
}

export type RedeemFailure = 'unknown' | 'used' | 'expired' | 'unverified' | 'limit' | 'already-linked';
export type RedeemResult = { ok: true; school: SchoolState; guardianId: string } | { ok: false; reason: RedeemFailure };

export const REDEEM_MESSAGE: Record<RedeemFailure, string> = {
  unknown: 'Ce code n’existe pas. Vérifiez-le avec votre parent ou tuteur.',
  used: 'Ce code a déjà servi pour un compte : un code n’en ouvre qu’un seul. Demandez-en un nouveau.',
  expired: 'Ce code a expiré. Demandez-en un nouveau.',
  unverified: 'Le parent ou tuteur qui a créé ce code n’a pas encore fait vérifier son identité.',
  limit: 'Deux parents ou tuteurs sont déjà rattachés à ce compte.',
  'already-linked': 'Ce parent ou tuteur est déjà rattaché à ce compte.'
};

/** L'enfant saisit le code : le lien avec le parent ou tuteur est créé, le code ne resservira pas. */
export function redeemGuardianCode(school: SchoolState, rawCode: string, childId: string, today: Day): RedeemResult {
  const value = normalizeCode(rawCode);
  const code = school.guardianCodes.find((c) => c.code === value);
  if (!code) return { ok: false, reason: 'unknown' };
  const status = guardianCodeStatus(code, today);
  if (status !== 'valid') return { ok: false, reason: status };
  if (accountOf(school, code.guardianId).identity !== 'verified') return { ok: false, reason: 'unverified' };
  const current = guardiansOf(school, childId);
  if (current.includes(code.guardianId)) return { ok: false, reason: 'already-linked' };
  if (current.length >= MAX_GUARDIANS) return { ok: false, reason: 'limit' };
  return {
    ok: true,
    guardianId: code.guardianId,
    school: {
      ...school,
      guardianCodes: school.guardianCodes.map((c) => (c.code === value ? { ...c, usedBy: childId } : c)),
      guardianLinks: [...school.guardianLinks, { guardianId: code.guardianId, childId, since: today }]
    }
  };
}

/* ------------------------------------------------------------------ Classes et restrictions */

export const classesOfStudent = (school: SchoolState, uid: string): SchoolClass[] => {
  const ids = new Set(activeMemberships(school, uid, 'student').flatMap((m) => m.classIds));
  return school.classes.filter((c) => ids.has(c.id));
};

export const classesOfTeacher = (school: SchoolState, uid: string): SchoolClass[] => {
  // Seul un enseignant (identité vérifiée et rattachement validé) a des classes.
  if (educatorStanding(school, uid).status !== 'teacher') return [];
  const ids = new Set(activeMemberships(school, uid, 'teacher').flatMap((m) => m.classIds));
  return school.classes.filter((c) => ids.has(c.id));
};

export const studentsOfClass = (school: SchoolState, classId: string): string[] =>
  school.memberships.filter((m) => m.role === 'student' && m.status === 'active' && m.classIds.includes(classId)).map((m) => m.userId);

/**
 * Niveau de restriction d'un membre : le plus strict de ses classes. Un enfant de moins de 12 ans
 * est au moins « encadré » ; un mineur sans classe aussi. Un adulte sans classe est « ouvert ».
 */
export function restrictionFor(school: SchoolState, uid: string, today: Day): RestrictionLevel {
  const band = ageBandOf(accountOf(school, uid), today);
  const fromClasses = classesOfStudent(school, uid).reduce<RestrictionLevel>((max, c) => (c.restriction > max ? c.restriction : max), 1);
  const floor: RestrictionLevel = band === 'adult' ? 1 : 2;
  return fromClasses > floor ? fromClasses : floor;
}

/* ------------------------------------------------------------------ Liens entre deux membres */

/** Ce qui relie deux membres : la famille, un établissement commun, ou un suivi accepté. */
export type RelationReason = 'family' | 'institution' | 'mentorship';

const institutionIdsOf = (school: SchoolState, uid: string): string[] => {
  const ids = activeMemberships(school, uid).map((m) => m.institutionId);
  const administered = accountOf(school, uid).institutionId;
  return administered ? [...ids, administered] : ids;
};

export function relationBetween(school: SchoolState, a: string, b: string): RelationReason | null {
  if (a === b) return null;
  if (school.guardianLinks.some((l) => (l.guardianId === a && l.childId === b) || (l.guardianId === b && l.childId === a))) return 'family';
  const ofA = institutionIdsOf(school, a);
  if (institutionIdsOf(school, b).some((id) => ofA.includes(id))) return 'institution';
  if (school.mentorships.some((m) => m.status === 'active' && ((m.educatorId === a && m.learnerId === b) || (m.educatorId === b && m.learnerId === a))))
    return 'mentorship';
  return null;
}

/** Apprenants d'un encadrant : élèves de ses classes (enseignant) et apprenants qui ont accepté son suivi. */
export function learnersOf(school: SchoolState, educatorId: string): string[] {
  const fromClasses = classesOfTeacher(school, educatorId).flatMap((c) => studentsOfClass(school, c.id));
  const fromMentorship = school.mentorships.filter((m) => m.educatorId === educatorId && m.status === 'active').map((m) => m.learnerId);
  return Array.from(new Set([...fromClasses, ...fromMentorship]));
}

/**
 * Qui peut voir les résultats d'un apprenant : lui-même, ses parents ou tuteurs, ses encadrants
 * (classe ou suivi accepté), et l'établissement où il est inscrit. Personne d'autre.
 */
export function canViewPerformance(school: SchoolState, viewerId: string, learnerId: string): boolean {
  if (viewerId === learnerId) return true;
  if (guardiansOf(school, learnerId).includes(viewerId)) return true;
  if (learnersOf(school, viewerId).includes(learnerId)) return true;
  const administered = accountOf(school, viewerId).institutionId;
  return Boolean(administered && activeMemberships(school, learnerId, 'student').some((m) => m.institutionId === administered));
}

/* ------------------------------------------------------------------ Droits dans la communauté */

/** Publier, commenter, réagir : jamais pour un parent, un compte en attente de code ou une classe « stricte ». */
export function canPublish(school: SchoolState, uid: string, today: Day): boolean {
  const account = accountOf(school, uid);
  // Un parent consulte ; un établissement n'a pas de fil : ni l'un ni l'autre ne publie.
  if (account.kind === 'guardian' || account.kind === 'institution') return false;
  if (needsGuardianCode(school, uid, today)) return false;
  return restrictionFor(school, uid, today) < 3;
}

/** Un membre protégé (mineur, ou classe encadrée) n'échange en privé qu'avec les personnes qui lui sont liées. */
const isProtected = (school: SchoolState, uid: string, today: Day) => restrictionFor(school, uid, today) >= 2;

export type ContactRefusal = 'awaiting-code' | 'protected' | 'guardian-scope';

export const CONTACT_REFUSAL_MESSAGE: Record<ContactRefusal, string> = {
  'awaiting-code': 'Ce compte attend le code d’un parent ou tuteur.',
  protected: 'La messagerie de ce compte est limitée à sa famille et à son établissement.',
  'guardian-scope': 'Un parent ou tuteur écrit à ses enfants et à leurs encadrants.'
};

/**
 * Peut-on demander à discuter ? Renvoie `null` si oui, sinon la raison du refus.
 * Les règles de contact choisies par chacun (« Personne », « Personnes que je suis ») s'appliquent ensuite.
 */
export function contactRefusal(school: SchoolState, fromId: string, toId: string, today: Day): ContactRefusal | null {
  if (needsGuardianCode(school, fromId, today) || needsGuardianCode(school, toId, today)) return 'awaiting-code';
  const related = relationBetween(school, fromId, toId);
  if ((isProtected(school, fromId, today) || isProtected(school, toId, today)) && !related) return 'protected';
  const guardianSide = [fromId, toId].find((id) => accountOf(school, id).kind === 'guardian');
  if (guardianSide && !related) {
    const other = guardianSide === fromId ? toId : fromId;
    const reachesChild = childrenOf(school, guardianSide).some((child) => learnersOf(school, other).includes(child));
    if (!reachesChild) return 'guardian-scope';
  }
  return null;
}

/**
 * Un membre protégé ou un parent n'est proposé en suggestion qu'aux personnes qui lui sont liées.
 * Un parent, et un élève d'une classe « stricte », ne reçoivent pas de suggestions d'inconnus.
 */
export function visibleInSuggestions(school: SchoolState, viewerId: string, candidateId: string, today: Day): boolean {
  const candidate = accountOf(school, candidateId);
  if (candidate.kind === 'guardian') return false;
  if (accountOf(school, viewerId).kind === 'guardian') return false;
  if (restrictionFor(school, viewerId, today) >= 3 && relationBetween(school, viewerId, candidateId) === null) return false;
  if (needsGuardianCode(school, candidateId, today)) return false;
  if (!isProtected(school, candidateId, today)) return true;
  return relationBetween(school, viewerId, candidateId) !== null;
}

/* ------------------------------------------------------------------ Prix et achats simulés */

/** Les prix ne sont montrés qu'aux adultes : on ne propose pas d'achat à un enfant. */
export const canSeePrices = (school: SchoolState, uid: string, today: Day): boolean => ageBandOf(accountOf(school, uid), today) === 'adult';

export const priceOf = (school: SchoolState, itemId: string): number => school.prices[itemId] || 0;
export const formatPrice = (amount: number): string => (amount > 0 ? `${amount.toLocaleString('fr-FR').replace(/ | /g, ' ')} FCFA` : 'Gratuit');

/** Un contenu payant est accessible s'il a été acheté pour ce membre. */
/* ------------------------------------------------------------------ Bibliothèque d'établissement */

/** Enseignants rattachés (rattachement actif) à un établissement. */
export const activeTeachersOf = (school: SchoolState, institutionId: string): string[] =>
  school.memberships.filter((m) => m.institutionId === institutionId && m.role === 'teacher' && m.status === 'active').map((m) => m.userId);

/** Établissements dont un membre est élève (rattachement actif). */
export const institutionsOfStudent = (school: SchoolState, uid: string): string[] =>
  Array.from(new Set(school.memberships.filter((m) => m.userId === uid && m.role === 'student' && m.status === 'active').map((m) => m.institutionId)));

/**
 * Bibliothèque d'un établissement : les contenus publiés par ses enseignants. Un établissement
 * n'apprend pas (ni XP, ni progression, ni fil) ; il gère cette bibliothèque, gratuite pour ses élèves.
 */
export function libraryOf<T extends { id: string }>(
  school: SchoolState,
  institutionId: string,
  items: T[],
  authorIdOf: (item: T) => string | undefined
): T[] {
  const teachers = new Set(activeTeachersOf(school, institutionId));
  return items.filter((item) => {
    const author = authorIdOf(item);
    return Boolean(author && teachers.has(author));
  });
}

/** L'établissement qui offre un contenu à un élève : celui dont l'un des enseignants en est l'auteur. */
export function offeringInstitution(school: SchoolState, uid: string, authorId: string | undefined): Institution | undefined {
  if (!authorId) return undefined;
  return institutionOf(
    school,
    institutionsOfStudent(school, uid).find((id) => activeTeachersOf(school, id).includes(authorId))
  );
}

/** Donne un module à une classe, ou le lui retire. */
export function toggleClassModule(school: SchoolState, classId: string, moduleId: string): SchoolState {
  return {
    ...school,
    classes: school.classes.map((c) =>
      c.id !== classId
        ? c
        : { ...c, moduleIds: c.moduleIds.includes(moduleId) ? c.moduleIds.filter((id) => id !== moduleId) : [...c.moduleIds, moduleId] }
    )
  };
}

/** Accès à un contenu : gratuit, acheté pour ce membre, ou offert par son établissement (contenu de l'un de ses enseignants). */
export function hasAccess(school: SchoolState, uid: string, itemId: string, authorId?: string): boolean {
  return (
    priceOf(school, itemId) === 0 ||
    school.purchases.some((p) => p.forUserId === uid && p.itemId === itemId) ||
    Boolean(offeringInstitution(school, uid, authorId))
  );
}

export type PurchaseFailure = 'minor' | 'unverified' | 'not-child' | 'free' | 'owned';
export type PurchaseResult = { ok: true; school: SchoolState; purchase: Purchase } | { ok: false; reason: PurchaseFailure };

export const PURCHASE_MESSAGE: Record<PurchaseFailure, string> = {
  minor: 'Seul un adulte peut acheter un contenu.',
  unverified: 'Faites vérifier votre identité avant un premier achat.',
  'not-child': 'Vous ne pouvez acheter que pour vous-même ou pour un enfant rattaché à votre compte.',
  free: 'Ce contenu est gratuit.',
  owned: 'Ce contenu est déjà acquis.'
};

/** Achat simulé d'un contenu, pour soi (adulte) ou pour un enfant rattaché (parent ou tuteur vérifié). */
export function buyItem(
  school: SchoolState,
  buyerId: string,
  forUserId: string,
  itemId: string,
  today: Day,
  method = 'Paiement simulé'
): PurchaseResult {
  const buyer = accountOf(school, buyerId);
  if (ageBandOf(buyer, today) !== 'adult') return { ok: false, reason: 'minor' };
  const amount = priceOf(school, itemId);
  if (amount === 0) return { ok: false, reason: 'free' };
  if (buyerId !== forUserId) {
    if (buyer.kind !== 'guardian' || !childrenOf(school, buyerId).includes(forUserId)) return { ok: false, reason: 'not-child' };
    if (buyer.identity !== 'verified') return { ok: false, reason: 'unverified' };
  }
  if (school.purchases.some((p) => p.forUserId === forUserId && p.itemId === itemId)) return { ok: false, reason: 'owned' };
  const purchase: Purchase = {
    id: `REC-${today.replace(/-/g, '')}-${String(school.purchases.length + 1).padStart(3, '0')}`,
    buyerId,
    forUserId,
    itemId,
    amount,
    day: today,
    method
  };
  return { ok: true, purchase, school: { ...school, purchases: [...school.purchases, purchase] } };
}

/* ------------------------------------------------------------------ Vérification d'identité (simulée) */

/** Le membre dépose une demande : elle part à la Gouvernance. Aucun fichier n'est conservé. */
export function submitIdentity(school: SchoolState, uid: string, document: IdentityDocument, today: Day): SchoolState {
  const request: IdentityRequest = {
    id: `KYC-${String(school.identityRequests.length + 1).padStart(3, '0')}`,
    userId: uid,
    document,
    submittedOn: today,
    status: 'pending'
  };
  return {
    ...school,
    accounts: { ...school.accounts, [uid]: { ...accountOf(school, uid), identity: 'pending' } },
    identityRequests: [request, ...school.identityRequests.filter((r) => !(r.userId === uid && r.status === 'pending'))]
  };
}

/** La Gouvernance accepte ou refuse. Le statut du compte suit, et avec lui l'intitulé de l'encadrant. */
export function decideIdentity(school: SchoolState, requestId: string, decision: 'verified' | 'refused', note?: string): SchoolState {
  const request = school.identityRequests.find((r) => r.id === requestId);
  if (!request || request.status !== 'pending') return school;
  return {
    ...school,
    accounts: { ...school.accounts, [request.userId]: { ...accountOf(school, request.userId), identity: decision } },
    identityRequests: school.identityRequests.map((r) => (r.id === requestId ? { ...r, status: decision, note } : r))
  };
}

/* ------------------------------------------------------------------ Rattachements */

/** Un membre demande à rejoindre un établissement, ou l'établissement l'invite : la demande attend l'autre partie. */
export function requestMembership(
  school: SchoolState,
  input: Pick<Membership, 'institutionId' | 'userId' | 'role' | 'classIds' | 'subject' | 'requestedBy'>,
  today: Day
): SchoolState {
  const open = school.memberships.some(
    (m) => m.institutionId === input.institutionId && m.userId === input.userId && m.role === input.role && (m.status === 'pending' || m.status === 'active')
  );
  if (open) return school;
  const membership: Membership = { ...input, id: `mb-${school.memberships.length + 1}-${input.userId}`, status: 'pending', requestedOn: today };
  return { ...school, memberships: [...school.memberships, membership] };
}

/** Valide ou refuse une demande en attente ; `ended` met fin à un rattachement actif. */
export function setMembershipStatus(school: SchoolState, id: string, status: Exclude<MembershipStatus, 'pending'>): SchoolState {
  const current = school.memberships.find((m) => m.id === id);
  if (!current) return school;
  const allowed = current.status === 'pending' ? status === 'active' || status === 'declined' : current.status === 'active' && status === 'ended';
  return allowed ? { ...school, memberships: school.memberships.map((m) => (m.id === id ? { ...m, status } : m)) } : school;
}

/** L'établissement crée une classe. */
export function addClass(school: SchoolState, input: Omit<SchoolClass, 'id' | 'moduleIds'> & { moduleIds?: string[] }): SchoolState {
  const id = `cl-${school.classes.length + 1}-${Date.now().toString(36)}`;
  return { ...school, classes: [...school.classes, { ...input, id, moduleIds: input.moduleIds || [] }] };
}

export const setClassRestriction = (school: SchoolState, classId: string, restriction: RestrictionLevel): SchoolState => ({
  ...school,
  classes: school.classes.map((c) => (c.id === classId ? { ...c, restriction } : c))
});

/* ------------------------------------------------------------------ Emploi du temps */

const byWeekdayThenStart = (a: TimetableSlot, b: TimetableSlot) => a.weekday - b.weekday || a.start.localeCompare(b.start);

/** Créneaux d'un membre : ceux de ses classes (élève), ou ceux qu'il assure (enseignant). */
export function slotsFor(school: SchoolState, uid: string): TimetableSlot[] {
  const asStudent = new Set(classesOfStudent(school, uid).map((c) => c.id));
  const asTeacher = new Set(classesOfTeacher(school, uid).map((c) => c.id));
  return school.timetable
    .filter((s) => asStudent.has(s.classId) || (asTeacher.has(s.classId) && s.teacherId === uid))
    .sort(byWeekdayThenStart);
}

const minutesOf = (clock: string) => Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3, 5));

/**
 * Le prochain cours d'un emploi du temps à partir d'un jour et d'une heure (minutes depuis minuit) :
 * le cours en cours s'il y en a un, sinon le suivant dans les sept jours. `null` sans cours.
 */
export function nextSlot(slots: TimetableSlot[], today: Day, nowMinutes: number): { slot: TimetableSlot; day: Day; live: boolean } | null {
  for (let offset = 0; offset < 7; offset++) {
    const day = addDays(today, offset);
    const weekday = weekdayOf(day);
    const candidates = slots
      .filter((s) => s.weekday === weekday && (offset > 0 || minutesOf(s.end) > nowMinutes))
      .sort((a, b) => minutesOf(a.start) - minutesOf(b.start));
    if (candidates.length) return { slot: candidates[0], day, live: offset === 0 && minutesOf(candidates[0].start) <= nowMinutes };
  }
  return null;
}

/** « 07:00 » → « 7 h », « 10:30 » → « 10 h 30 ». */
export const clockLabel = (clock: string): string => {
  const h = Number(clock.slice(0, 2));
  const m = clock.slice(3, 5);
  return m === '00' ? `${h} h` : `${h} h ${m}`;
};

/** Minutes de cours un jour de la semaine (0 = dimanche … 6 = samedi). */
export function busyMinutes(slots: TimetableSlot[], weekday: number): number {
  return slots.filter((s) => s.weekday === weekday).reduce((sum, s) => sum + Math.max(0, minutesOf(s.end) - minutesOf(s.start)), 0);
}

/** Deux créneaux d'une même classe ou d'un même enseignant qui se chevauchent : l'établissement doit choisir. */
export function slotConflict(existing: TimetableSlot[], candidate: Omit<TimetableSlot, 'id'> & { id?: string }): TimetableSlot | undefined {
  return existing.find(
    (s) =>
      s.id !== candidate.id &&
      s.weekday === candidate.weekday &&
      (s.classId === candidate.classId || (Boolean(candidate.teacherId) && s.teacherId === candidate.teacherId)) &&
      minutesOf(s.start) < minutesOf(candidate.end) &&
      minutesOf(candidate.start) < minutesOf(s.end)
  );
}
