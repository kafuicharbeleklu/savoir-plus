// Client du Studio IA (fonction Supabase « ai-studio »). Aucune clé d'IA n'est présente dans le navigateur :
// la fonction serveur détient les clés et applique les garde-fous (taille du texte, limite de requêtes).
import config from './supabase-public.json';

const env = (import.meta as any).env || {};
const SUPABASE_URL: string = env.VITE_SUPABASE_URL || config.url;
const PUBLISHABLE_KEY: string = env.VITE_SUPABASE_PUBLISHABLE_KEY || config.publishableKey;
const ENDPOINT = `${SUPABASE_URL}/functions/v1/ai-studio`;

export const AI_SOURCE_MIN = 80;
export const AI_SOURCE_MAX = 6000;

export interface AiQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AiStep {
  caption: string;
  illustrationPrompt: string;
}

/** Le public visé : la classe ou le niveau, et les repères de langue et de découpage qui en découlent. */
export interface AiAudience {
  classLabel?: string;
  level?: string;
  /** Mots par phrase, en moyenne. */
  avgWords: number;
  /** Longueur de phrase à ne pas dépasser. */
  maxWords: number;
  /** Nombre de sections à ne pas dépasser. */
  maxSections: number;
}

/** Le plan proposé : un titre, des objectifs, une ligne par section. L'encadreur le corrige avant la rédaction. */
export interface AiPlan {
  title: string;
  goals: string[];
  sections: { title: string; idea: string }[];
  /** Ce que la source ne précise pas. */
  gaps: string[];
}

export type AiPlanInput = Pick<AiPlan, 'title' | 'goals' | 'sections'>;

/** Une section rédigée au format des cours ; la figure de l'exemple est décrite en texte (voir studioLesson.ts). */
export interface AiRichSection {
  title: string;
  lead: string;
  scene: string;
  parts: { title: string; text: string; items: string[] }[];
  example: { title: string; figureKind: 'table' | 'timeline' | 'flow' | 'split' | 'fraction' | 'none'; figureText: string; caption: string; notes: string[] };
  question: { ask: string; answer: string };
  keyPoints: string[];
  tip: string;
}

export interface AiStatus {
  text: boolean;
  images: boolean;
  /** Le service sait proposer un plan et rédiger section par section. */
  plan: boolean;
}

async function call<T>(init: RequestInit, timeoutMs: number): Promise<T> {
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      ...init,
      headers: { apikey: PUBLISHABLE_KEY, 'Content-Type': 'application/json', ...(init.headers || {}) },
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (e: any) {
    throw new Error(
      e?.name === 'TimeoutError'
        ? 'Le service IA met trop de temps à répondre. Réessayez.'
        : 'Service IA injoignable. Vérifiez votre connexion.'
    );
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Service IA indisponible (${res.status}).`);
  return data as T;
}

/** État du service : indique si la génération de texte et d'images est configurée côté serveur. */
export async function aiStatus(): Promise<AiStatus> {
  try {
    const data = await call<any>({ method: 'GET' }, 10_000);
    const formats: unknown = data?.text?.formats;
    return {
      text: Boolean(data?.text?.available),
      images: Boolean(data?.images?.available),
      plan: Array.isArray(formats) && formats.includes('section')
    };
  } catch {
    return { text: false, images: false, plan: false };
  }
}

const post = <T>(body: Record<string, unknown>, timeoutMs: number) => call<T>({ method: 'POST', body: JSON.stringify(body) }, timeoutMs);

/** Le plan du module, d'après le texte de l'encadreur. */
export function proposePlan(source: string, titleHint: string, audience: AiAudience): Promise<{ model: string; plan: AiPlan }> {
  return post({ action: 'plan', source, titleHint, ...audience }, 85_000);
}

/** Une section du plan, rédigée au format des cours. */
export function writeSection(
  source: string,
  titleHint: string,
  audience: AiAudience,
  plan: AiPlanInput,
  index: number
): Promise<{ model: string; index: number; section: AiRichSection; gaps: string[] }> {
  return post({ action: 'section', source, titleHint, plan, index, ...audience }, 115_000);
}

/** Le quiz et la fiche pas à pas du module, d'après le plan. */
export function writeQuiz(source: string, titleHint: string, audience: AiAudience, plan: AiPlanInput): Promise<{ model: string; questions: AiQuestion[]; steps: AiStep[] }> {
  return post({ action: 'quiz', source, titleHint, plan, ...audience }, 105_000);
}

/** Résolutions proposées : 1024 px (standard) ou 1536 px (haute résolution, plus lente et plus coûteuse en quota). */
export const AI_IMAGE_SIZES = [1024, 1536] as const;
export type AiImageSize = (typeof AI_IMAGE_SIZES)[number];

export async function illustrateSteps(prompts: string[], size: AiImageSize = 1024): Promise<{ url?: string; error?: string }[]> {
  const data = await call<{ images: { url?: string; error?: string }[] }>(
    { method: 'POST', body: JSON.stringify({ action: 'illustrate', prompts, size }) },
    180_000
  );
  return data.images || [];
}
