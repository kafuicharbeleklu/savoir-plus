// Client du Studio IA (fonction Supabase « ai-studio »). Aucune clé d'IA n'est présente dans le navigateur :
// la fonction serveur détient les clés et applique les garde-fous (taille du texte, limite de requêtes).
import config from './supabase-public.json';

const env = (import.meta as any).env || {};
const SUPABASE_URL: string = env.VITE_SUPABASE_URL || config.url;
const PUBLISHABLE_KEY: string = env.VITE_SUPABASE_PUBLISHABLE_KEY || config.publishableKey;
const ENDPOINT = `${SUPABASE_URL}/functions/v1/ai-studio`;

export const AI_SOURCE_MIN = 80;
export const AI_SOURCE_MAX = 6000;

export interface AiSection {
  title: string;
  body: string;
  keyPoints: string[];
  tip: string;
}

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

export interface AiModuleProposal {
  title: string;
  summary: string;
  sections: AiSection[];
  questions: AiQuestion[];
  steps: AiStep[];
  gaps: string[];
}

export interface AiStatus {
  text: boolean;
  images: boolean;
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
    return { text: Boolean(data?.text?.available), images: Boolean(data?.images?.available) };
  } catch {
    return { text: false, images: false };
  }
}

export async function generateModuleProposal(
  source: string,
  titleHint: string
): Promise<{ model: string; module: AiModuleProposal }> {
  return call({ method: 'POST', body: JSON.stringify({ action: 'module', source, titleHint }) }, 90_000);
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
