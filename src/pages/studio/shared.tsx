/**
 * Studio — éléments communs aux écrans (cadre, libellés, statuts, liste de vérifications, import de média).
 */
import React from 'react';
import { AlertTriangle, BookOpen, CheckCircle2, Circle, FileText, Layers } from 'lucide-react';
import type { Profile, Progress } from '../../data';
import type { StudioReadinessCheck, StudioReadinessReport } from '../../personas';
import { hasUnpublishedChanges, type CatalogType, type ExtendedDemoState, type StudioContent, type StudioMedia } from '../../wireframeData';
import type { StatusTone } from '../../components/ui';

export interface StudioProps {
  ext: ExtendedDemoState;
  updateExt: (fn: (prev: ExtendedDemoState) => ExtendedDemoState) => void;
  nav: (page: any, id?: string) => void;
  selectedId: string;
  setToast: (msg: string) => void;
  user?: Profile;
  progress?: Progress;
}

export const TYPE_LABEL: Record<CatalogType, string> = { module: 'Module', resource: 'Ressource', path: 'Parcours' };
export const AUDIENCE_LABEL: Record<StudioContent['audience'], string> = {
  'Membres autorisés': 'Membres',
  Privé: 'Moi uniquement',
  Public: 'Public'
};
export const DOMAINS: StudioContent['domain'][] = ['Numérique', 'Communication', 'Gestion'];

export function TypeIcon({ type, size = 20 }: { type: CatalogType; size?: number }) {
  if (type === 'path') return <Layers size={size} aria-hidden="true" />;
  if (type === 'resource') return <FileText size={size} aria-hidden="true" />;
  return <BookOpen size={size} aria-hidden="true" />;
}

export type ContentBucket = 'draft' | 'review' | 'published' | 'fix';

/** Statut unique d'un contenu (point de couleur + libellé) et rangement par onglet. */
export function contentStatus(c: StudioContent): { tone: StatusTone; label: string; bucket: ContentBucket } {
  if (c.pubStatus === 'Publié') {
    return hasUnpublishedChanges(c)
      ? { tone: 'warn', label: 'Publié · modifications à publier', bucket: 'published' }
      : { tone: 'ok', label: 'Publié', bucket: 'published' };
  }
  if (c.reviewStatus === 'À corriger') return { tone: 'warn', label: 'À corriger', bucket: 'fix' };
  if (c.reviewStatus === 'En revue') return { tone: 'info', label: 'En revue', bucket: 'review' };
  return { tone: 'neutral', label: 'Brouillon', bucket: 'draft' };
}

/** « modifié il y a 5 min » ; à défaut, l'ancien libellé enregistré. */
export function formatUpdated(c: StudioContent): string {
  // Anciens libellés enregistrés (« Publié · v2 ») : on retire la version, déjà affichée à côté.
  if (!c.updatedAtMs) {
    return (c.updatedAt || '')
      .replace(/\s*·\s*v\d+$/i, '')
      .replace(/^./, (ch) => ch.toLowerCase());
  }
  const diff = Date.now() - c.updatedAtMs;
  const min = Math.round(diff / 60000);
  if (min < 1) return 'modifié à l’instant';
  if (min < 60) return `modifié il y a ${min} min`;
  const d = new Date(c.updatedAtMs);
  if (d.toDateString() === new Date().toDateString()) return 'modifié aujourd’hui';
  return `modifié le ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
}

export const newStudioId = (prefix = 'st') => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** Retire une numérotation saisie dans le titre (« 01 Introduction » → « Introduction »). */
export const stripNumbering = (title: string) => title.replace(/^\d{1,2}\s*[·.\-–:]?\s+/, '');

/* ------------------------------------------------------------------ cadre */

export const STUDIO_SECTIONS = [
  { id: 'studio', label: 'Contenus' },
  { id: 'studio-ocr', label: 'Créer avec l’IA' },
  { id: 'studio-media', label: 'Médias' },
  { id: 'studio-stats', label: 'Statistiques' },
  { id: 'studio-profile', label: 'Profil créateur' }
] as const;

export type StudioSectionId = (typeof STUDIO_SECTIONS)[number]['id'];

/** Cadre d'un écran du Studio. Sur petit écran, un seul sélecteur « Rubrique » remplace la colonne. */
export function StudioShell({
  active,
  nav,
  children
}: {
  active: StudioSectionId;
  nav: (page: any, id?: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="sx-page">
      <label className="sx-mobile-nav">
        <span>Rubrique</span>
        <select value={active} onChange={(e) => nav(e.target.value)}>
          {STUDIO_SECTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ vérifications */

export function Checklist({
  report,
  onFix
}: {
  report: StudioReadinessReport;
  onFix?: (tab: StudioReadinessCheck['tab']) => void;
}) {
  return (
    <ul className="sx-checks">
      {report.checks.map((c) => (
        <li key={c.id} className={c.ok ? 'is-ok' : c.blocking ? 'is-blocking' : 'is-advice'}>
          {c.ok ? (
            <CheckCircle2 size={20} aria-hidden="true" />
          ) : c.blocking ? (
            <AlertTriangle size={20} aria-hidden="true" />
          ) : (
            <Circle size={20} aria-hidden="true" />
          )}
          <span className="sx-check-text">
            <b>{c.label}</b>
            <small>
              {c.ok ? '' : c.blocking ? 'Bloquant · ' : 'Recommandé · '}
              {c.detail}
            </small>
          </span>
          {!c.ok && onFix && (
            <button type="button" className="li-text-link" onClick={() => onFix(c.tab)}>
              Corriger
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ médias */

/** Aperçus des fichiers importés pendant la session (non conservés après rechargement). */
export const mediaPreviews = new Map<string, string>();

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo` : `${Math.max(1, Math.round(bytes / 1024))} Ko`;

/** Ajoute un fichier choisi par l'utilisateur à la bibliothèque (aucun envoi vers un serveur). */
export function importMediaFile(
  file: File,
  updateExt: (fn: (prev: ExtendedDemoState) => ExtendedDemoState) => void,
  authorName?: string
): string {
  const id = newStudioId('med');
  const kind: StudioMedia['kind'] = file.type.startsWith('image/') ? 'Image' : file.type.startsWith('video/') ? 'Vidéo' : 'Document';
  if (kind !== 'Document') mediaPreviews.set(id, URL.createObjectURL(file));
  const item: StudioMedia = {
    id,
    filename: file.name,
    kind,
    state: 'Disponible',
    usage: '',
    altText: '',
    source: authorName ? `Fichier importé par ${authorName}` : 'Fichier importé',
    rights: '',
    sizeLabel: formatSize(file.size)
  };
  updateExt((prev) => ({ ...prev, studioMedia: [item, ...prev.studioMedia] }));
  return id;
}

export const MEDIA_ACCEPT = 'image/*,video/*,application/pdf';

export function mediaTone(state: StudioMedia['state']): StatusTone {
  return state === 'Disponible' ? 'ok' : state === 'Échec' ? 'danger' : 'neutral';
}

/** Nombre de contenus qui utilisent un média. */
export function mediaUsageCount(mediaId: string, contents: StudioContent[]): number {
  return contents.filter((c) => (c.mediaIds || []).includes(mediaId)).length;
}
