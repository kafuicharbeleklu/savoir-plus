/**
 * Relecture d'une proposition de l'IA : le texte de l'encadrant reste à côté, découpé en phrases,
 * et les phrases les plus proches du bloc ouvert sont surlignées. C'est un rapprochement par mots
 * communs, annoncé comme tel : il aide à vérifier, il ne prétend pas dire d'où vient chaque mot.
 */
import { keywords } from './classMap';

/** Le texte en paragraphes, chaque paragraphe en phrases. */
export function splitSource(source: string): string[][] {
  return source
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) =>
      (paragraph.match(/[^.!?…]+(?:[.!?…]+|$)\s*/g) || [paragraph]).map((sentence) => sentence.trim()).filter(Boolean)
    );
}

/** Clé d'une phrase : « paragraphe-phrase ». */
export const sentenceKey = (paragraph: number, sentence: number) => `${paragraph}-${sentence}`;

/**
 * Les phrases du texte source qui partagent le plus de mots porteurs avec un bloc : deux mots au
 * moins, et au moins un quart des mots de la phrase. Les mieux placées d'abord, `limit` au plus.
 */
export function relatedSentences(paragraphs: string[][], blockText: string, limit = 3): Set<string> {
  const block = keywords(blockText);
  if (block.size === 0) return new Set();
  const scored: { key: string; shared: number; score: number }[] = [];
  paragraphs.forEach((sentences, p) =>
    sentences.forEach((sentence, s) => {
      const words = keywords(sentence);
      if (words.size === 0) return;
      let shared = 0;
      for (const word of words) if (block.has(word)) shared += 1;
      const score = shared / words.size;
      if (shared >= 2 && score >= 0.25) scored.push({ key: sentenceKey(p, s), shared, score });
    })
  );
  return new Set(
    scored
      .sort((a, b) => b.score - a.score || b.shared - a.shared)
      .slice(0, limit)
      .map((x) => x.key)
  );
}

/** Décision de l'auteur sur un bloc : à relire (null), gardé ou retiré. */
export type BlockDecision = boolean | null;

/** Blocs encore à relire : le brouillon ne se crée qu'une fois chacun gardé ou retiré. */
export const pendingCount = (...groups: BlockDecision[][]): number => groups.flat().filter((d) => d === null).length;
