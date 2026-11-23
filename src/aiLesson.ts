/**
 * Création assistée par IA : ce qui relie la proposition du service au format des cours du Studio.
 *
 * Le parcours suit trois principes d'interaction (Amershi et al., « Guidelines for Human-AI Interaction »,
 * CHI 2019, relus le 23 novembre 2026) : dire ce que le système sait faire et jusqu'où (1 et 2) ; se
 * restreindre quand il doute (10) — une lacune de la source est signalée, jamais comblée ; permettre de
 * corriger sans effort (9) — le plan se corrige avant la rédaction, chaque bloc après. Le plan d'abord, comme
 * le Course Builder de Coursera, qui propose un plan et des objectifs à relire avant le contenu.
 */
import type { AiAudience, AiPlan, AiRichSection } from './ai';
import type { StudyLesson } from './content';
import type { DifficultyLevel } from './levels';
import { ladderClassOf, readingBandOf } from './levels';
import { LANGUAGE_TARGETS } from './readability';
import { EMPTY_FIGURE, SECTION_TARGETS, figureFromText, isFigureReady, richOfSection, typo, type StudioSection } from './studioLesson';

/** Le public visé par un contenu : sa classe pour un cours scolaire, sinon son niveau. */
export function audienceFor(classLabel: string | undefined, level: DifficultyLevel): AiAudience {
  const known = classLabel && ladderClassOf(classLabel) ? classLabel : undefined;
  const band = readingBandOf(known);
  const language = LANGUAGE_TARGETS[band];
  return {
    ...(known ? { classLabel: known } : { level }),
    avgWords: language.avgWords,
    maxWords: language.maxWords,
    maxSections: SECTION_TARGETS[band].sections[1]
  };
}

/** Une ligne du plan, avec un identifiant stable pour la liste que l'encadreur réordonne. */
export interface PlanRow {
  id: string;
  title: string;
  idea: string;
}

export const planRows = (plan: Pick<AiPlan, 'sections'>): PlanRow[] => plan.sections.map((section, i) => ({ id: `plan-${i + 1}-${Date.now().toString(36)}`, ...section }));

/** Le plan est prêt à rédiger : de une à huit sections, chacune titrée. */
export const isPlanReady = (rows: PlanRow[]): boolean => rows.length >= 1 && rows.length <= 8 && rows.every((row) => row.title.trim().length > 0);

/**
 * Une section proposée par l'IA devient une section du Studio au format complet. La figure, décrite en
 * texte, est reconstruite ; si elle n'est pas valide (ou absente), l'exemple reste à finir par l'auteur.
 */
export function sectionFromAi(ai: AiRichSection, id: string): StudioSection {
  const figure = ai.example.figureKind === 'none' ? EMPTY_FIGURE : figureFromText(ai.example.figureKind, ai.example.figureText);
  const parts = ai.parts.map((part) => ({ title: part.title.trim(), text: part.text.trim(), items: part.items.length >= 2 ? part.items : undefined }));
  // Le format demande deux parties au moins : une place vide rappelle à l'auteur de compléter.
  while (parts.length < 2) parts.push({ title: '', text: '', items: undefined });
  return {
    id,
    title: ai.title.trim(),
    body: ai.lead.trim(),
    format: 'rich',
    scene: ai.scene.trim(),
    parts,
    example: {
      title: ai.example.title.trim(),
      caption: ai.example.caption.trim(),
      notes: ai.example.notes,
      figure: isFigureReady(figure) ? figure : EMPTY_FIGURE
    },
    question: { ask: ai.question.ask.trim(), answer: ai.question.answer.trim() },
    keyPoints: ai.keyPoints,
    tip: ai.tip.trim()
  };
}

/** La leçon telle qu'elle sera lue, pour l'aperçu d'une section en cours de relecture. */
export function previewLesson(section: StudioSection, index: number): StudyLesson {
  return {
    title: typo(section.title.trim()) || 'Sans titre',
    label: '',
    minutes: '',
    intro: typo(section.body.trim()),
    body: '',
    points: (section.keyPoints || []).map(typo),
    tip: typo((section.tip || '').trim()),
    rich: richOfSection(section, index) || undefined
  };
}
