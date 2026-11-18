/**
 * Visite guidée de la démonstration, en quatre rôles : une apprenante, un parent, un établissement,
 * un encadrant. Chaque étape choisit son personnage et sa page, puis montre un élément et l'explique
 * en deux phrases. Ce fichier ne contient que les données et la logique (sans React), pour les tester.
 * Lancement : menu « Vous › Visite guidée », ou un lien avec « ?visite=1 » (pour le jury).
 */

export type TourRole = 'Apprenante' | 'Parent' | 'Établissement' | 'Encadrant' | 'Fin';

export interface TourStep {
  id: string;
  role: TourRole;
  /** Personnage de démonstration de l'étape. */
  persona: string;
  /** Page, et partie de l'adresse qui suit (module, enfant, rubrique). */
  page: string;
  param?: string;
  /** Élément montré (sélecteur CSS). */
  target: string;
  title: string;
  text: string;
}

export const DEMO_TOUR: TourStep[] = [
  {
    id: 'learner-home',
    role: 'Apprenante',
    persona: 'afi',
    page: 'home',
    target: '.home-recommended',
    title: 'Un accueil propre à chacun',
    text: 'Afi voit d’abord ce que sa classe lui a donné, puis ce qu’elle a commencé et ce qui touche ses intérêts. Chaque carte dit pourquoi elle est là.'
  },
  {
    id: 'learner-feed',
    role: 'Apprenante',
    persona: 'afi',
    page: 'home',
    target: '.feed-post-card',
    title: 'Un fil dans l’ordre d’Afi',
    text: 'Toutes les publications restent, mais son enseignant passe en premier, avec la raison en tête de la publication.'
  },
  {
    id: 'learner-module',
    role: 'Apprenante',
    persona: 'afi',
    page: 'reader',
    param: 'phishing',
    target: '.rd-outline',
    title: 'Un module sur une seule page',
    text: 'Les parties, l’exercice et le quiz final se suivent sur une page ; le sommaire suit la lecture. Taille du texte et longueur des lignes suivent les études de lisibilité.'
  },
  {
    id: 'family-week',
    role: 'Parent',
    persona: 'akouvi',
    page: 'family',
    target: '.pl-child',
    title: 'Le message de la semaine',
    text: 'Une phrase et une action concrète par enfant : un message hebdomadaire de ce type a réduit de 41 % les échecs dans l’étude de Kraft et Rogers (2015).'
  },
  {
    id: 'family-plan',
    role: 'Parent',
    persona: 'akouvi',
    page: 'family',
    param: 'elom',
    target: '.pl-gantt',
    title: 'Le plan de révision d’Elom',
    text: 'Une ligne par examen : la période de révision se remplit à mesure qu’Elom fait ses séances. Inclus dans la formule Famille.'
  },
  {
    id: 'family-code',
    role: 'Parent',
    persona: 'akouvi',
    page: 'family',
    target: '[aria-label="Codes créés pour vos enfants"]',
    title: 'Avant 12 ans',
    text: 'Le compte de Kokou s’ouvre avec un code créé par sa mère, qui n’ouvre qu’un compte. Ensuite, elle règle le verrouillage : pause, temps par jour, plage horaire.'
  },
  {
    id: 'institution-overview',
    role: 'Établissement',
    persona: 'palmiers',
    page: 'institution',
    target: '[aria-label="Avancement des classes"]',
    title: 'Où en est chaque classe',
    text: 'Chaque classe face à l’attendu du jour, puis les élèves à accompagner. Un établissement n’a ni XP ni fil : il pilote.'
  },
  {
    id: 'institution-planning',
    role: 'Établissement',
    persona: 'palmiers',
    page: 'institution',
    param: 'planning',
    target: '.pl-gantt',
    title: 'Le trimestre en diagramme de Gantt',
    text: 'Séquences, révisions et compositions de chaque classe, avec les congés scolaires. Formule Pilotage.'
  },
  {
    id: 'institution-library',
    role: 'Établissement',
    persona: 'palmiers',
    page: 'institution',
    param: 'library',
    target: '[aria-label="Bibliothèque de l’établissement"]',
    title: 'Sa bibliothèque',
    text: 'Les contenus publiés par ses enseignants, gratuits pour ses élèves ; il les donne à ses classes.'
  },
  {
    id: 'educator-classes',
    role: 'Encadrant',
    persona: 'kossi',
    page: 'teaching',
    param: 'classes',
    target: '[aria-label="Mes classes"]',
    title: 'Ses classes, et ce qui bloque',
    text: 'Pour chaque classe, la question que les élèves ratent le plus ; plus bas, ses cours de la semaine.'
  },
  {
    id: 'educator-studio',
    role: 'Encadrant',
    persona: 'kossi',
    page: 'studio',
    target: '.sx-contents',
    title: 'Il crée ses modules',
    text: 'Ressources, modules et parcours, relus avant publication. L’IA propose une structure et un quiz ; l’encadrant relit et corrige.'
  },
  {
    id: 'end',
    role: 'Fin',
    persona: 'afi',
    page: 'home',
    target: '.vous-trigger',
    title: 'Fin de la visite',
    text: 'Pour la revoir : menu Vous › Visite guidée. Pour changer de personnage : Vous › Changer de compte.'
  }
];

export const DEMO_TOUR_KEY = 'savoir-visite-demo';

/** L'étape en cours, gardée pour l'onglet (elle survit au changement de personnage et au rechargement). */
export function readTourStep(search: string): number | null {
  // Une visite en cours reprend où elle en était ; sinon « ?visite=1 » la lance depuis le début.
  try {
    const raw = window.sessionStorage.getItem(DEMO_TOUR_KEY);
    const n = raw === null ? NaN : Number(raw);
    if (Number.isInteger(n) && n >= 0 && n < DEMO_TOUR.length) return n;
  } catch {
    // Stockage indisponible (ou hors navigateur) : seule l'adresse compte.
  }
  return new URLSearchParams(search || '').get('visite') === '1' ? 0 : null;
}

export function writeTourStep(step: number | null): void {
  try {
    if (step === null) window.sessionStorage.removeItem(DEMO_TOUR_KEY);
    else window.sessionStorage.setItem(DEMO_TOUR_KEY, String(step));
  } catch {
    // Stockage indisponible : la visite repart du début au prochain chargement.
  }
}
