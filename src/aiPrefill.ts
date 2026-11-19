/**
 * Texte préparé pour le Studio IA depuis une autre page (fiche de rattrapage d'une classe) :
 * la page l'enregistre, le Studio le reprend à l'ouverture. Rien n'est envoyé à l'IA avant que
 * l'encadrant clique sur « Générer la proposition ».
 */
import type { StudioContent } from './wireframeData';

export interface AiPrefill {
  title: string;
  domain: StudioContent['domain'];
  source: string;
  /** D'où vient le texte, en une phrase (affichée au-dessus du formulaire). */
  origin: string;
}

let pending: AiPrefill | null = null;

export const setAiPrefill = (prefill: AiPrefill) => {
  pending = prefill;
};

export const peekAiPrefill = (): AiPrefill | null => pending;

export const clearAiPrefill = () => {
  pending = null;
};
