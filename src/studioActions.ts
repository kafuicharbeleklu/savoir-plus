/**
 * Actions proposées dans le menu d'un contenu du Studio.
 * Elles dépendent du statut : on ne propose pas « Publier » sur un contenu déjà publié,
 * ni « Statistiques » sur un brouillon que personne n'a encore pu suivre.
 */
import { hasUnpublishedChanges, type CatalogType, type StudioContent } from './wireframeData';

export type ContentAction =
  | 'publish'
  | 'publish-update'
  | 'resubmit'
  | 'cancel-review'
  | 'view'
  | 'stats'
  | 'duplicate'
  | 'unpublish'
  | 'delete';

export const CONTENT_ACTION_LABEL: Record<ContentAction, string> = {
  publish: 'Publier…',
  'publish-update': 'Publier les modifications…',
  resubmit: 'Corriger et soumettre à nouveau…',
  'cancel-review': 'Annuler la demande de validation',
  view: 'Voir la version publiée',
  stats: 'Statistiques',
  duplicate: 'Dupliquer',
  unpublish: 'Dépublier',
  delete: 'Supprimer'
};

/** Actions du menu, dans l'ordre d'affichage, pour le statut actuel du contenu. */
export function contentActions(c: StudioContent): ContentAction[] {
  if (c.pubStatus === 'Publié') {
    const actions: ContentAction[] = [];
    if (hasUnpublishedChanges(c)) actions.push('publish-update');
    actions.push('view');
    // Seuls les modules ont un suivi par apprenant.
    if (c.type === 'module') actions.push('stats');
    actions.push('duplicate', 'unpublish', 'delete');
    return actions;
  }
  if (c.reviewStatus === 'En revue') return ['cancel-review', 'duplicate', 'delete'];
  if (c.reviewStatus === 'À corriger') return ['resubmit', 'duplicate', 'delete'];
  return ['publish', 'duplicate', 'delete'];
}

/** Identifiant du contenu côté apprenant (les deux contenus d'origine remplacent des entrées du catalogue). */
export const studioCatalogId = (studioId: string): string =>
  studioId === 'st-2' ? 'reseaux' : studioId === 'st-1' ? 'fiche-reseau' : studioId;

/** Page de la fiche côté apprenant. */
export const catalogDetailRoute = (type: CatalogType): string =>
  type === 'resource' ? 'resource-detail' : type === 'path' ? 'path-detail' : 'module-detail';
