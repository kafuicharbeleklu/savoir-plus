/**
 * Une notification en une phrase, comme sur LinkedIn : « Kossi Agbo a répondu à la question de Maya
 * « … » ». Le nom de l'auteur ouvre la phrase (en gras à l'affichage) ; sans phrase connue, on garde le
 * titre et le détail. Et l'endroit où elle mène : une publication s'ouvre dans le fil, à sa place.
 */
import type { NotificationItem } from './wireframeData';

export interface NotificationSentence {
  /** Qui agit : affiché en gras en tête de phrase. */
  actor: string;
  /** La suite de la phrase. */
  text: string;
}

const REPLY_TITLE = 'Nouvelle réponse dans une question d’entraide';
const REPLY_DETAIL = /^Question de (.+?) : (.+?)\s*$/;

export function notificationSentence(n: Pick<NotificationItem, 'title' | 'detail' | 'actorName'>): NotificationSentence | null {
  if (!n.actorName) return null;
  if (n.title === REPLY_TITLE) {
    const m = REPLY_DETAIL.exec(n.detail);
    if (m) return { actor: n.actorName, text: `a répondu à la question de ${m[1]} « ${m[2].replace(/\s*\?$/, ' ?')} »` };
    return { actor: n.actorName, text: 'a répondu à une question d’entraide' };
  }
  return null;
}

/** Où mène la notification : une publication s'ouvre dans le fil (page « community »), à sa place. */
export function notificationTarget(n: Pick<NotificationItem, 'targetPage' | 'targetId'>): { page: string; id?: string } {
  if (n.targetPage === 'community-thread' && n.targetId) return { page: 'community', id: n.targetId };
  return { page: n.targetPage, id: n.targetId };
}
