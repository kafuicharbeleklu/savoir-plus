/**
 * Une alerte en une phrase, comme sur LinkedIn : « Kossi Agbo a répondu à la question de Maya « … » ».
 * L'auteur ouvre la phrase (en gras à l'affichage) ; une seconde ligne, facultative, donne le contexte.
 * Chaque alerte a un type (`kind`) et ses paramètres ; les alertes enregistrées avant l'ajout des types
 * sont reconnues par leur titre. Et l'endroit où elle mène : une publication s'ouvre dans le fil à sa
 * place ; un signalement se déroule dans l'alerte même.
 */
import type { NotificationItem, NotificationKind } from './wireframeData';

export interface NotificationSentence {
  /** Qui agit : en gras en tête de phrase ; absent pour une alerte du site lui-même. */
  actor?: string;
  /** La suite de la phrase (ou toute la phrase sans auteur). */
  text: string;
  /** Une seconde ligne de contexte, facultative. */
  detail?: string;
}

type Params = Record<string, string | undefined>;

/** La phrase de chaque type d'alerte (après le nom de l'auteur). */
const SENTENCES: Record<NotificationKind, (p: Params) => string> = {
  welcome: () => 'vous souhaite la bienvenue sur SAVOIR+',
  'question-reply': (p) => (p.owner ? `a répondu à la question de ${p.owner} « ${p.title} »` : `a répondu à votre question « ${p.title} »`),
  'post-comment': (p) => `a commenté votre publication « ${p.title} »`,
  'comment-reply': (p) => `a répondu à votre commentaire sur « ${p.title} »`,
  'post-helpful': (p) => `a trouvé votre publication utile : « ${p.title} »`,
  'solution-chosen': (p) => `a choisi votre réponse comme solution à « ${p.title} »`,
  'new-follower': () => 'vous suit désormais',
  'contact-request': () => 'souhaite échanger avec vous',
  'contact-accepted': () => 'a accepté votre demande d’échange',
  'report-update': (p) => {
    const ref = `votre signalement ${p.id}`;
    if (p.status === 'Précisions demandées') return `vous demande des précisions sur ${ref}`;
    if (p.status === 'En cours d’examen') return `examine ${ref}`;
    if (p.status === 'Reçu') return `a bien reçu ${ref}`;
    if (p.status === 'Clôturé') return `a clôturé ${ref}`;
    return `a mis à jour ${ref}`;
  },
  // La décision détaillée suit sur la seconde ligne (« Mesure levée après réexamen… ») : la phrase reste courte.
  'appeal-decision': (p) => (p.accepted === 'oui' ? 'a accepté votre recours' : 'a examiné votre recours'),
  'time-request': () => 'demande plus de temps sur SAVOIR+',
  'module-given': (p) => `a donné le module « ${p.title} » à la classe ${p.className}`,
  'badge-earned': (p) => `Vous avez obtenu le badge « ${p.title} »`,
  'content-published': (p) => `a publié votre contenu « ${p.title} »`,
  'content-changes': (p) => `demande des modifications sur « ${p.title} »`
};

/** Les types sans auteur : le site parle lui-même (« Vous avez obtenu le badge… »). */
const WITHOUT_ACTOR: NotificationKind[] = ['badge-earned'];

const clean = (text: string) => text.replace(/\s*\?\s*$/, ' ?').trim();

/** Le type et les paramètres d'une alerte, y compris pour celles enregistrées avant l'ajout des types. */
export function notificationKindOf(n: Pick<NotificationItem, 'kind' | 'params' | 'title' | 'detail' | 'targetId'>): { kind: NotificationKind; params: Params } | null {
  if (n.kind) return { kind: n.kind, params: n.params || {} };
  if (n.title === 'Bienvenue sur SAVOIR+') return { kind: 'welcome', params: {} };
  if (n.title === 'Nouvelle réponse dans une question d’entraide') {
    const m = /^Question de (.+?) : (.+?)\s*$/.exec(n.detail);
    return { kind: 'question-reply', params: m ? { owner: m[1], title: clean(m[2]) } : { title: 'une question d’entraide' } };
  }
  if (n.title === 'Votre signalement a été mis à jour') {
    const m = /(SIG-[0-9-]+)/.exec(n.detail);
    return { kind: 'report-update', params: { id: m ? m[1] : n.targetId } };
  }
  if (/ demande plus de temps sur SAVOIR\+$/.test(n.title)) return { kind: 'time-request', params: {} };
  if (n.title === 'Recours accepté — accès rétablis') return { kind: 'appeal-decision', params: { accepted: 'oui' } };
  if (n.title === 'Décision sur votre recours') return { kind: 'appeal-decision', params: { accepted: 'non' } };
  return null;
}

/**
 * La phrase d'une alerte. `reportOf` retrouve un signalement (son état et ce qu'il vise) pour une alerte
 * de signalement. Sans type reconnu ni auteur, `null` : l'affichage garde le titre et le détail.
 */
export function notificationSentence(
  n: Pick<NotificationItem, 'kind' | 'params' | 'title' | 'detail' | 'targetId' | 'actorName'>,
  context: { reportOf?: (id: string) => { status: string; targetLabel: string } | undefined } = {}
): NotificationSentence | null {
  const known = notificationKindOf(n);
  if (!known) return null;
  const { kind } = known;
  const params: Params = { ...known.params };
  let detail: string | undefined;
  if (kind === 'report-update' && params.id) {
    const report = context.reportOf?.(params.id);
    if (report) {
      params.status = params.status || report.status;
      detail = report.targetLabel;
    }
  } else if (kind === 'welcome' || kind === 'time-request' || kind === 'appeal-decision') {
    detail = n.detail || undefined;
  }
  const text = SENTENCES[kind](params);
  const extra = detail ? { detail } : {};
  if (WITHOUT_ACTOR.includes(kind)) return { text, ...extra };
  return n.actorName ? { actor: n.actorName, text, ...extra } : null;
}

/** Où mène l'alerte, au plus précis : une publication s'ouvre dans le fil, à sa place. */
export function notificationTarget(n: Pick<NotificationItem, 'targetPage' | 'targetId'>): { page: string; id?: string } {
  if (n.targetPage === 'community-thread' && n.targetId) return { page: 'community', id: n.targetId };
  return { page: n.targetPage, id: n.targetId };
}

/** Le signalement dont parle l'alerte : elle se déroule sur place (pas de page des signalements). */
export function notificationReportId(n: Pick<NotificationItem, 'kind' | 'params' | 'title' | 'detail' | 'targetId'>): string | undefined {
  const known = notificationKindOf(n);
  return known?.kind === 'report-update' ? known.params.id : undefined;
}
