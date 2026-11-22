/**
 * Niveaux de difficulté et échelle des classes.
 *
 * Cinq niveaux, chacun avec son critère : ce qu'il faut déjà savoir pour suivre le contenu. Pour un cours
 * scolaire, le niveau ne se choisit pas : il se déduit de la classe (`levelOfClass`). Pour les autres
 * contenus, l'auteur applique le critère de `LEVEL_CRITERIA`.
 *
 * L'échelle des classes (CP1 → Terminale) sert aussi à proposer à chacun ce qui est à sa portée : un
 * cours de sa classe d'abord, ceux des classes voisines ensuite, jamais un cours de Terminale en
 * première ligne pour un élève de CM2 (`classFit`).
 */

export const DIFFICULTY_LEVELS = ['Initiation', 'Débutant', 'Intermédiaire', 'Avancé', 'Expert'] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

/** Rang d'un niveau, de 1 (Initiation) à 5 (Expert). */
export const levelRank = (level: DifficultyLevel): number => DIFFICULTY_LEVELS.indexOf(level) + 1;

/** Le critère de chaque niveau : pour qui, et à quelles classes il correspond. */
export const LEVEL_CRITERIA: Record<DifficultyLevel, { who: string; school: string }> = {
  Initiation: { who: 'Aucun prérequis : on découvre le sujet, un geste ou une idée à la fois.', school: 'Primaire (CP1 à CM2)' },
  Débutant: { who: 'On sait lire, écrire, compter et utiliser l’outil : on apprend les notions du sujet une à une.', school: 'Collège (6e et 5e)' },
  Intermédiaire: { who: 'Les bases du sujet sont connues : on applique une méthode en plusieurs étapes.', school: 'Collège (4e et 3e)' },
  Avancé: { who: 'Les bases sont maîtrisées : notions abstraites, raisonnement autonome.', school: 'Lycée (Seconde et Première)' },
  Expert: { who: 'On vise la maîtrise : synthèse, cas complexes, épreuve finale.', school: 'Terminale et au-delà' }
};

/** Les classes, dans l'ordre de la scolarité. */
export const CLASS_LADDER = ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2', '6e', '5e', '4e', '3e', 'Seconde', 'Première', 'Terminale'] as const;
export type LadderClass = (typeof CLASS_LADDER)[number];

const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const CLASS_PATTERNS: [RegExp, LadderClass][] = [
  [/\bcp\s*1\b/, 'CP1'],
  [/\bcp\s*2\b/, 'CP2'],
  [/\bce\s*1\b/, 'CE1'],
  [/\bce\s*2\b/, 'CE2'],
  [/\bcm\s*1\b/, 'CM1'],
  [/\bcm\s*2\b/, 'CM2'],
  [/\b(sixieme|6\s*e(me)?)\b/, '6e'],
  [/\b(cinquieme|5\s*e(me)?)\b/, '5e'],
  [/\b(quatrieme|4\s*e(me)?)\b/, '4e'],
  [/\b(troisieme|3\s*e(me)?)\b/, '3e'],
  [/\b(seconde|2\s*n?de)\b/, 'Seconde'],
  [/\b(premiere|1\s*(re|ere))\b/, 'Première'],
  [/\b(terminale?|tle)\b/, 'Terminale']
];

/** « Terminale D » → Terminale, « Troisième A » → 3e ; rien pour un groupe hors scolarité (cours du soir). */
export function ladderClassOf(name: string | undefined): LadderClass | null {
  if (!name) return null;
  const text = fold(name);
  for (const [pattern, label] of CLASS_PATTERNS) if (pattern.test(text)) return label;
  return null;
}

/** Place d'une classe dans la scolarité (0 = CP1), ou rien si le libellé n'est pas une classe. */
export function classRank(label: string | undefined): number | null {
  const found = ladderClassOf(label);
  return found ? CLASS_LADDER.indexOf(found) : null;
}

/** Le niveau d'un cours scolaire, d'après sa classe. */
export function levelOfClass(classLabel: string): DifficultyLevel {
  const rank = classRank(classLabel);
  if (rank === null) return 'Débutant';
  if (rank <= 5) return 'Initiation'; // CP1 à CM2
  if (rank <= 7) return 'Débutant'; // 6e, 5e
  if (rank <= 9) return 'Intermédiaire'; // 4e, 3e
  if (rank <= 11) return 'Avancé'; // Seconde, Première
  return 'Expert'; // Terminale
}

/** Nombre de classes d'écart entre un cours et la classe la plus proche du membre ; rien si l'un des deux n'a pas de classe. */
export function classGap(itemClass: string | undefined, viewerClasses: string[]): number | null {
  const item = classRank(itemClass);
  const ranks = viewerClasses.map((c) => classRank(c)).filter((r): r is number => r !== null);
  if (item === null || ranks.length === 0) return null;
  return Math.min(...ranks.map((r) => Math.abs(r - item)));
}

/**
 * Rang d'un contenu pour un membre, du plus à sa portée au moins adapté :
 * 0 = cours de sa classe ; 1 = classe voisine (révision ou avance) ; 2 = contenu sans classe ;
 * 3 = cours scolaire d'une classe éloignée. Sans classe connue : les contenus généraux d'abord (0),
 * les cours scolaires ensuite (1).
 */
export function classFit(itemClass: string | undefined, viewerClasses: string[]): number {
  const isSchool = classRank(itemClass) !== null;
  const hasClass = viewerClasses.some((c) => classRank(c) !== null);
  if (!hasClass) return isSchool ? 1 : 0;
  if (!isSchool) return 2;
  const gap = classGap(itemClass, viewerClasses);
  return gap === 0 ? 0 : gap === 1 ? 1 : 3;
}
