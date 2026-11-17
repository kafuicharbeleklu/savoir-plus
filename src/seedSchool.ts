/**
 * Données de démonstration de la vie scolaire : deux établissements fictifs, leurs classes, un parent
 * et ses deux enfants, des élèves, des demandes en attente. Tout est inventé ; aucune personne ni
 * aucun établissement réel n'est représenté.
 *
 * Les dates sont relatives au jour de la visite, pour que la démonstration reste vivante.
 */
import { addDays, type Day } from './calendar';
import { MODULES_CONTENT } from './content';
import type { Profile, Progress } from './data';
import type { AccountRecord, Membership, SchoolState, TimetableSlot } from './school';

/** Personnages jouables ajoutés à ceux d'origine (Afi, Kossi, Nadège). */
export const SCHOOL_PERSONAS: Profile[] = [
  {
    id: 'elom',
    name: 'Elom Dogbé',
    role: 'Élève de Terminale D · Les Palmiers',
    initials: 'ED',
    color: 'mint',
    bio: 'En Terminale D. Je prépare le BAC II et je révise un peu chaque jour.'
  },
  {
    id: 'akouvi',
    name: 'Akouvi Dogbé',
    role: 'Parent · Elom et Kokou',
    initials: 'AD',
    color: 'lavender',
    bio: 'Mère d’Elom et de Kokou. Je suis leurs progrès et je choisis leurs contenus.'
  },
  {
    id: 'kokou',
    name: 'Kokou Dogbé',
    role: 'Élève de CM2 · Les Palmiers',
    initials: 'KD',
    color: 'peach',
    bio: ''
  },
  {
    id: 'palmiers',
    name: 'Les Palmiers',
    role: 'Établissement · Lomé (démonstration)',
    initials: 'LP',
    color: 'lavender',
    bio: 'Complexe scolaire fictif, créé pour la démonstration de SAVOIR+ : collège, lycée et classes primaires.'
  }
];

/** Élèves fictifs des classes : un prénom et une initiale, rien d'autre. */
const TERMINALE = ['Abla K.', 'Koffi A.', 'Dédé S.', 'Mawuli T.', 'Yawa D.', 'Komlan E.', 'Akofa B.', 'Enam F.', 'Edo N.'];
const TROISIEME = ['Kossiwa A.', 'Yao B.', 'Afiwa G.', 'Senyo K.', 'Ami L.', 'Kodzo M.', 'Esi P.', 'Mensa W.'];
const CM2 = ['Adjo H.', 'Kwami J.', 'Fafa N.', 'Selom R.', 'Délali V.'];

const idOf = (prefix: string, index: number) => `${prefix}-${String(index + 1).padStart(2, '0')}`;
const TLE_IDS = TERMINALE.map((_, i) => idOf('tle', i));
const TRO_IDS = TROISIEME.map((_, i) => idOf('tro', i));
const CM2_IDS = CM2.map((_, i) => idOf('cm2', i));

/** Noms des membres qui n'ont pas de fiche de profil (élèves des classes, demandeurs). */
export const SCHOOL_MEMBER_NAMES: Record<string, string> = {
  ...Object.fromEntries(TLE_IDS.map((id, i) => [id, TERMINALE[i]])),
  ...Object.fromEntries(TRO_IDS.map((id, i) => [id, TROISIEME[i]])),
  ...Object.fromEntries(CM2_IDS.map((id, i) => [id, CM2[i]])),
  sena: 'Sena Akakpo',
  yawo: 'Yawo Amouzou',
  mawuena: 'Mawuena Kpodar'
};

/* ------------------------------------------------------------------ Progressions des élèves */

/** Générateur pseudo-aléatoire à graine fixe : les mêmes chiffres à chaque visite. */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Progression vraisemblable d'un élève sur un module : la plupart vont au bout, certains s'arrêtent
 * en route, et une question (la deuxième) est nettement moins réussie que les autres — de quoi
 * montrer à l'enseignant où sa classe bute.
 */
function studentProgress(moduleId: string, random: () => number): Progress {
  const content = MODULES_CONTENT[moduleId];
  const lessonCount = content?.lessons.length || 3;
  const stage = random();
  if (stage < 0.12) return { lessons: [], answers: [], submitted: false };
  if (stage < 0.3) return { lessons: Array.from({ length: 1 + Math.floor(random() * (lessonCount - 1)) }, (_, i) => i), answers: [], submitted: false };
  const lessons = Array.from({ length: lessonCount }, (_, i) => i);
  if (stage < 0.4 || !content) return { lessons, answers: [], submitted: false };
  const answers = content.questions.map((question, index) => {
    const successRate = index === 1 ? 0.45 : 0.85;
    if (random() < successRate) return question.correctIndex;
    return (question.correctIndex + 1 + Math.floor(random() * 2)) % 3;
  });
  return { lessons, answers, submitted: true };
}

const CLASS_MODULES: Record<string, string[]> = {
  'cl-tle-d': ['comptes', 'sauvegarde', 'email-pro'],
  'cl-3e-a': ['comptes'],
  'cl-cm2': [],
  'cl-reseaux': ['reseaux', 'comptes']
};

/** Progressions des élèves fictifs et des personnages élèves, sur les modules de leur classe. */
export const SEED_SCHOOL_PROGRESS: Record<string, Record<string, Progress>> = (() => {
  const random = seeded(20261117);
  const out: Record<string, Record<string, Progress>> = {};
  const fill = (ids: string[], classId: string) => {
    for (const id of ids) {
      out[id] = Object.fromEntries(CLASS_MODULES[classId].map((moduleId) => [moduleId, studentProgress(moduleId, random)]));
    }
  };
  fill(TLE_IDS, 'cl-tle-d');
  fill(TRO_IDS, 'cl-3e-a');
  // Elom : un module validé, un en cours, un pas encore commencé.
  out.elom = {
    comptes: { lessons: [0, 1, 2], answers: MODULES_CONTENT.comptes.questions.map((q) => q.correctIndex), submitted: true },
    sauvegarde: { lessons: [0, 1], answers: [], submitted: false },
    'email-pro': { lessons: [], answers: [], submitted: false }
  };
  return out;
})();

/* ------------------------------------------------------------------ Emploi du temps */

const slot = (
  classId: string,
  weekday: number,
  start: string,
  end: string,
  subject: string,
  teacher: { id?: string; name?: string },
  room?: string
): TimetableSlot => ({
  id: `${classId}-${weekday}-${start.replace(':', '')}`,
  classId,
  weekday,
  start,
  end,
  subject,
  teacherId: teacher.id,
  teacherName: teacher.name,
  room
});

const KOSSI = { id: 'kossi', name: 'Kossi Agbo' };
const prof = (name: string) => ({ name });

const TIMETABLE: TimetableSlot[] = [
  // Terminale D — Les Palmiers
  slot('cl-tle-d', 1, '07:00', '09:00', 'Mathématiques', prof('M. Amétépé'), 'Salle 12'),
  slot('cl-tle-d', 1, '09:15', '11:15', 'Physique-chimie', prof('Mme Gbédémah'), 'Laboratoire'),
  slot('cl-tle-d', 1, '15:00', '17:00', 'Philosophie', prof('M. Soglo'), 'Salle 12'),
  slot('cl-tle-d', 2, '07:00', '09:00', 'SVT', prof('Mme Tossou'), 'Salle 8'),
  slot('cl-tle-d', 2, '09:15', '11:15', 'Français', prof('M. Adjavon'), 'Salle 12'),
  slot('cl-tle-d', 3, '07:00', '09:00', 'Mathématiques', prof('M. Amétépé'), 'Salle 12'),
  slot('cl-tle-d', 3, '10:00', '12:00', 'Informatique', KOSSI, 'Salle informatique'),
  slot('cl-tle-d', 4, '07:00', '09:00', 'Physique-chimie', prof('Mme Gbédémah'), 'Laboratoire'),
  slot('cl-tle-d', 4, '09:15', '11:15', 'Anglais', prof('Mme Quashie'), 'Salle 12'),
  slot('cl-tle-d', 4, '15:00', '17:00', 'Histoire-géographie', prof('M. Bassah'), 'Salle 12'),
  slot('cl-tle-d', 5, '07:00', '09:00', 'SVT', prof('Mme Tossou'), 'Salle 8'),
  slot('cl-tle-d', 5, '09:15', '11:15', 'Mathématiques', prof('M. Amétépé'), 'Salle 12'),
  slot('cl-tle-d', 6, '07:00', '09:00', 'Éducation physique', prof('M. Lawani'), 'Terrain'),
  // Troisième A — Les Palmiers
  slot('cl-3e-a', 2, '15:00', '17:00', 'Informatique', KOSSI, 'Salle informatique'),
  slot('cl-3e-a', 5, '08:00', '10:00', 'Informatique', KOSSI, 'Salle informatique'),
  // Initiation aux réseaux — Centre Horizon (cours du soir)
  slot('cl-reseaux', 2, '18:30', '20:30', 'Réseaux informatiques', KOSSI, 'Atelier 2'),
  slot('cl-reseaux', 4, '18:30', '20:30', 'Réseaux informatiques', KOSSI, 'Atelier 2')
];

/* ------------------------------------------------------------------ État de départ */

const adult = (kind: AccountRecord['kind'], birthDate: Day, identity: AccountRecord['identity'] = 'none'): AccountRecord => ({ kind, birthDate, identity });

/** État de départ de la vie scolaire, daté du jour de la visite. */
export function initialSchoolState(today: Day): SchoolState {
  const student = (userId: string, institutionId: string, classId: string, index: number): Membership => ({
    id: `mb-st-${classId}-${index}`,
    institutionId,
    userId,
    role: 'student',
    status: 'active',
    classIds: [classId],
    requestedBy: 'institution',
    requestedOn: addDays(today, -60)
  });
  const teen = (birthDate: Day): AccountRecord => ({ kind: 'learner', birthDate, identity: 'none' });

  return {
    accounts: {
      afi: adult('learner', '2002-03-14'),
      kossi: adult('educator', '1990-07-02', 'verified'),
      nadege: adult('learner', '1988-11-23', 'verified'),
      ama: adult('educator', '1987-05-09', 'verified'),
      edem: adult('educator', '1985-02-17', 'verified'),
      ines: adult('educator', '1991-09-30', 'verified'),
      yawo: adult('educator', '1994-04-21', 'pending'),
      akouvi: adult('guardian', '1984-01-19', 'verified'),
      mawuena: adult('guardian', '1979-08-03', 'pending'),
      elom: teen('2009-06-02'),
      kokou: teen('2016-09-20'),
      sena: teen('2009-12-11'),
      palmiers: { kind: 'institution', identity: 'verified', institutionId: 'inst-palmiers' },
      ...Object.fromEntries(TLE_IDS.map((id, i) => [id, teen(`${2009 + (i % 2)}-0${1 + (i % 9)}-15`)])),
      ...Object.fromEntries(TRO_IDS.map((id, i) => [id, teen(`${2011 + (i % 2)}-0${1 + (i % 9)}-08`)])),
      ...Object.fromEntries(CM2_IDS.map((id, i) => [id, teen(`2016-0${1 + (i % 9)}-22`)]))
    },
    institutions: [
      { id: 'inst-palmiers', name: 'Les Palmiers', city: 'Lomé', type: 'Complexe scolaire (démonstration)', verified: true },
      { id: 'inst-horizon', name: 'Centre Horizon', city: 'Lomé', type: 'Centre de formation (démonstration)', verified: true }
    ],
    classes: [
      { id: 'cl-tle-d', institutionId: 'inst-palmiers', name: 'Terminale D', level: 'Lycée', year: '2026-2027', restriction: 2, moduleIds: CLASS_MODULES['cl-tle-d'] },
      { id: 'cl-3e-a', institutionId: 'inst-palmiers', name: 'Troisième A', level: 'Collège', year: '2026-2027', restriction: 2, moduleIds: CLASS_MODULES['cl-3e-a'] },
      { id: 'cl-cm2', institutionId: 'inst-palmiers', name: 'CM2', level: 'Primaire', year: '2026-2027', restriction: 3, moduleIds: CLASS_MODULES['cl-cm2'] },
      { id: 'cl-reseaux', institutionId: 'inst-horizon', name: 'Initiation aux réseaux', level: 'Cours du soir', year: '2026-2027', restriction: 1, moduleIds: CLASS_MODULES['cl-reseaux'] }
    ],
    memberships: [
      { id: 'mb-kossi-palmiers', institutionId: 'inst-palmiers', userId: 'kossi', role: 'teacher', status: 'active', classIds: ['cl-tle-d', 'cl-3e-a'], subject: 'Informatique', requestedBy: 'institution', requestedOn: addDays(today, -70) },
      { id: 'mb-kossi-horizon', institutionId: 'inst-horizon', userId: 'kossi', role: 'teacher', status: 'active', classIds: ['cl-reseaux'], subject: 'Réseaux informatiques', requestedBy: 'member', requestedOn: addDays(today, -45) },
      { id: 'mb-ama-palmiers', institutionId: 'inst-palmiers', userId: 'ama', role: 'teacher', status: 'pending', classIds: ['cl-3e-a'], subject: 'Français · expression écrite', requestedBy: 'member', requestedOn: addDays(today, -2) },
      { id: 'mb-sena-palmiers', institutionId: 'inst-palmiers', userId: 'sena', role: 'student', status: 'pending', classIds: ['cl-tle-d'], requestedBy: 'member', requestedOn: addDays(today, -1) },
      student('elom', 'inst-palmiers', 'cl-tle-d', 0),
      student('kokou', 'inst-palmiers', 'cl-cm2', 0),
      student('afi', 'inst-horizon', 'cl-reseaux', 0),
      student('maya', 'inst-horizon', 'cl-reseaux', 1),
      student('fatou', 'inst-horizon', 'cl-reseaux', 2),
      ...TLE_IDS.map((id, i) => student(id, 'inst-palmiers', 'cl-tle-d', i + 1)),
      ...TRO_IDS.map((id, i) => student(id, 'inst-palmiers', 'cl-3e-a', i + 1)),
      ...CM2_IDS.map((id, i) => student(id, 'inst-palmiers', 'cl-cm2', i + 1))
    ],
    // Elom est rattaché à sa mère ; Kokou (10 ans) attend encore de saisir le code qu'elle a créé.
    guardianLinks: [{ guardianId: 'akouvi', childId: 'elom', since: addDays(today, -40) }],
    guardianCodes: [{ code: 'PAR-7K3Q-9M2X', guardianId: 'akouvi', childName: 'Kokou', createdOn: addDays(today, -2) }],
    mentorships: [
      { id: 'mt-edem-sam', educatorId: 'edem', learnerId: 'sam', status: 'active', requestedOn: addDays(today, -30) },
      { id: 'mt-ama-fatou', educatorId: 'ama', learnerId: 'fatou', status: 'pending', requestedOn: addDays(today, -3) }
    ],
    timetable: TIMETABLE,
    purchases: [
      { id: 'REC-DEMO-001', buyerId: 'akouvi', forUserId: 'elom', itemId: 'budget', amount: 1500, day: addDays(today, -6), method: 'Paiement simulé' }
    ],
    identityRequests: [
      { id: 'KYC-004', userId: 'mawuena', document: 'passeport', submittedOn: addDays(today, -1), status: 'pending' },
      { id: 'KYC-003', userId: 'yawo', document: 'cni', submittedOn: addDays(today, -2), status: 'pending' },
      { id: 'KYC-002', userId: 'akouvi', document: 'cni', submittedOn: addDays(today, -41), status: 'verified' },
      { id: 'KYC-001', userId: 'kossi', document: 'passeport', submittedOn: addDays(today, -72), status: 'verified' }
    ],
    prices: { budget: 1500, reunion: 1000, 'modele-budget': 500 }
  };
}
