/**
 * Niveau de langue d'un texte de cours, selon la classe visée : un enfant de CP1 et un élève de Terminale
 * ne lisent pas les mêmes phrases.
 *
 * Deux mesures simples, celles que retiennent les formules de lisibilité du français (Kandel & Moles 1958,
 * De Landsheere, Henry 1975, Mesnager) : la longueur des phrases et la part des mots longs. Repères relevés
 * le 23 novembre 2026 :
 * – CE1 : des textes simplifiés pour cette classe font 13 mots par phrase en moyenne (90 % des phrases sous
 *   20 mots) et 5,8 % de mots de plus de 8 lettres, contre 17 mots et 7,3 % pour les originaux (Gala et al.,
 *   Applied Psycholinguistics, 2021) ;
 * – « facile à lire et à comprendre » : des phrases courtes, une idée par phrase (Inclusion Europe) ;
 * – langage clair : moins de 20 mots par phrase pour le grand public (Guide de rédaction de Canada.ca).
 * Les seuils des classes intermédiaires sont interpolés entre ces repères : ce sont des conseils, pas des règles.
 */
import { readingBandOf, type ReadingBand } from './levels';

export interface LanguageTarget {
  /** Pour qui : « CP1 à CE2 »… */
  label: string;
  /** Mots par phrase, en moyenne, à ne pas dépasser. */
  avgWords: number;
  /** Longueur au-delà de laquelle une phrase est à couper. */
  maxWords: number;
  /** Part de mots de plus de 8 lettres à ne pas dépasser. */
  longWordShare: number;
}

export const LANGUAGE_TARGETS: Record<ReadingBand, LanguageTarget> = {
  early: { label: 'CP1 à CE2', avgWords: 12, maxWords: 20, longWordShare: 0.06 },
  junior: { label: 'CM1 à 6e', avgWords: 15, maxWords: 22, longWordShare: 0.09 },
  teen: { label: '5e à 3e', avgWords: 18, maxWords: 25, longWordShare: 0.13 },
  standard: { label: 'lycée et adultes', avgWords: 20, maxWords: 30, longWordShare: 0.17 }
};

export interface TextStats {
  sentences: number;
  words: number;
  /** Mots par phrase, en moyenne (arrondi au dixième). */
  avgWords: number;
  /** La phrase la plus longue : son nombre de mots et son début. */
  longest: { words: number; start: string };
  /** Part des mots de plus de 8 lettres (0 à 1). */
  longWordShare: number;
}

const WORD = /[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu;

/** Mesure un texte de cours (le gras `**…**` et les sauts de ligne ne comptent pas). */
export function textStats(text: string): TextStats {
  const clean = text.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
  const sentences = clean
    .split(/(?<=[.!?…])\s+|\s*[\n;]\s*/)
    .map((s) => s.trim())
    .filter((s) => (s.match(WORD) || []).length > 0);
  const counts = sentences.map((s) => (s.match(WORD) || []).length);
  const words = counts.reduce((a, b) => a + b, 0);
  const all = clean.match(WORD) || [];
  const long = all.filter((w) => w.replace(/[’'-]/g, '').length > 8).length;
  const top = counts.indexOf(Math.max(0, ...counts));
  return {
    sentences: sentences.length,
    words,
    avgWords: sentences.length ? Math.round((words / sentences.length) * 10) / 10 : 0,
    longest: top >= 0 && sentences.length ? { words: counts[top], start: sentences[top].split(' ').slice(0, 6).join(' ') } : { words: 0, start: '' },
    longWordShare: all.length ? long / all.length : 0
  };
}

/**
 * Conseils de langue pour un texte et une classe : phrases trop longues en moyenne, une phrase à couper,
 * trop de mots longs. Un texte de moins de 30 mots est trop court pour être jugé.
 */
export function languageIssues(text: string, classLabel: string | undefined): string[] {
  const target = LANGUAGE_TARGETS[readingBandOf(classLabel)];
  const stats = textStats(text);
  if (stats.words < 30 || stats.sentences < 2) return [];
  const issues: string[] = [];
  const fr = (n: number) => n.toLocaleString('fr-FR');
  if (stats.avgWords > target.avgWords + 1) {
    issues.push(`Phrases longues pour le niveau « ${target.label} » : ${fr(stats.avgWords)} mots en moyenne, visez ${target.avgWords} au plus.`);
  }
  if (stats.longest.words > target.maxWords) {
    issues.push(`Une phrase de ${stats.longest.words} mots (« ${stats.longest.start}… ») : coupez-la, ${target.maxWords} mots au plus pour ce niveau.`);
  }
  if (stats.longWordShare > target.longWordShare + 0.02) {
    issues.push(`Beaucoup de mots longs (${Math.round(stats.longWordShare * 100)} %) : préférez des mots courants, ou expliquez-les.`);
  }
  return issues;
}
