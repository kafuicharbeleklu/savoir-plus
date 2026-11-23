/**
 * Studio — liste « Contenus » (accueil du Studio) et points d'entrée des autres écrans.
 * Une seule liste, un bouton « Créer », des onglets avec compteurs ; chaque contenu
 * s'ouvre dans son espace de travail (src/pages/studio/Workspace.tsx).
 */
import { newRichSection } from '../studioLesson';
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { appendAuditLog, type CatalogType, type StudioContent } from '../wireframeData';
import { catalogDetailRoute, CONTENT_ACTION_LABEL, contentActions, studioCatalogId, type ContentAction } from '../studioActions';
import { ActionMenu, ConfirmDialog, EmptyState, ListCard, ListRow, PageHeader, type RowState, RowTitle, SearchField, StateTile, Tabs } from '../components/ui';
import { contentStatus, formatUpdated, newStudioId, StudioShell, TYPE_LABEL, TypeIcon, type ContentBucket, type StudioProps } from './studio/shared';

export { StudioEditorView, StudioPathView, StudioPublishView, StudioQuizView } from './studio/Workspace';
export { StudioMediaView } from './studio/Media';
export { StudioAiView } from './studio/Ai';
export { StudioCreatorProfileView, StudioStatsView } from './studio/Insights';

type Filter = 'all' | ContentBucket;

const normalize = (v: string) =>
  v
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

const workspaceRoute = (c: StudioContent) => (c.type === 'path' ? 'studio-path' : 'studio-editor');

export function StudioHomeView({ ext, updateExt, nav, setToast, user }: StudioProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [toDelete, setToDelete] = useState<StudioContent | null>(null);
  const [toUnpublish, setToUnpublish] = useState<StudioContent | null>(null);

  const createNew = (type: CatalogType) => {
    const id = newStudioId();
    const item: StudioContent = {
      id,
      type,
      title: type === 'module' ? 'Nouveau module' : type === 'path' ? 'Nouveau parcours' : 'Nouvelle ressource',
      domain: 'Numérique',
      version: 'v1',
      pubStatus: 'Brouillon',
      reviewStatus: 'Non soumise',
      audience: 'Membres autorisés',
      duration: '',
      sources: '',
      updatedAt: 'Brouillon créé à l’instant',
      updatedAtMs: Date.now(),
      authorName: user?.name,
      // Un module part au format complet des cours : entrée en matière, cours, exemple illustré, question, résumé.
      sections: [type === 'module' ? newRichSection('sec-1', 'Introduction') : { id: 'sec-1', title: type === 'path' ? 'Présentation' : 'Introduction', body: '' }],
      pathModuleIds: type === 'path' ? [] : undefined
    };
    updateExt((prev) => ({ ...prev, studioContents: [item, ...prev.studioContents] }));
    setToast('Brouillon créé');
    nav(workspaceRoute(item), id);
  };

  const duplicate = (c: StudioContent) => {
    const copy: StudioContent = {
      ...JSON.parse(JSON.stringify({ ...c, published: undefined })),
      id: newStudioId(),
      title: `${c.title} (copie)`,
      version: 'v1',
      pubStatus: 'Brouillon',
      reviewStatus: 'Non soumise',
      authorName: user?.name || c.authorName,
      updatedAt: 'Copie créée à l’instant',
      updatedAtMs: Date.now()
    };
    updateExt((prev) => ({ ...prev, studioContents: [copy, ...prev.studioContents] }));
    setToast(`« ${c.title} » dupliqué`);
  };

  const actor = `${user?.name || 'Créateur'} (Créateur)`;

  const unpublish = (c: StudioContent) => {
    updateExt((prev) => ({
      ...prev,
      studioContents: prev.studioContents.map((x) =>
        x.id === c.id ? { ...x, pubStatus: 'Brouillon', updatedAtMs: Date.now(), updatedAt: 'Dépublié' } : x
      ),
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor,
        action: 'Dépublication',
        target: c.title,
        scope: `Studio · ${c.domain}`,
        result: 'Succès',
        justification: 'Contenu retiré de la bibliothèque par son auteur.'
      })
    }));
    setToUnpublish(null);
    setToast(`« ${c.title} » n’est plus visible des apprenants`);
  };

  const cancelReview = (c: StudioContent) => {
    updateExt((prev) => ({
      ...prev,
      studioContents: prev.studioContents.map((x) =>
        x.id === c.id ? { ...x, reviewStatus: 'Non soumise', updatedAtMs: Date.now(), updatedAt: 'Demande de validation annulée' } : x
      ),
      validationRequests: prev.validationRequests.filter(
        (v) => !(v.contentId === c.id && (v.status === 'Soumise' || v.status === 'En examen'))
      ),
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor,
        action: 'Demande de validation annulée',
        target: `${c.title} (${c.version})`,
        scope: `Studio · ${c.domain}`,
        result: 'Succès',
        justification: 'Demande retirée de la file de validation par son auteur.'
      })
    }));
    setToast(`Demande de validation annulée pour « ${c.title} »`);
  };

  /** Ce que fait chaque action du menu d'un contenu. */
  const runAction = (action: ContentAction, c: StudioContent) => {
    if (action === 'publish' || action === 'publish-update' || action === 'resubmit') nav('studio-publish', c.id);
    else if (action === 'view') nav(catalogDetailRoute(c.type), studioCatalogId(c.id));
    else if (action === 'stats') nav('studio-stats');
    else if (action === 'duplicate') duplicate(c);
    else if (action === 'cancel-review') cancelReview(c);
    else if (action === 'unpublish') setToUnpublish(c);
    else setToDelete(c);
  };

  const remove = (c: StudioContent) => {
    updateExt((prev) => ({ ...prev, studioContents: prev.studioContents.filter((x) => x.id !== c.id) }));
    setToDelete(null);
    setToast(`« ${c.title || 'Contenu'} » supprimé`);
  };

  const rows = ext.studioContents.map((c) => ({ c, status: contentStatus(c) }));
  const count = (b: ContentBucket) => rows.filter((r) => r.status.bucket === b).length;
  const q = normalize(search);
  const visible = rows.filter((r) => (filter === 'all' || r.status.bucket === filter) && (!q || normalize(r.c.title).includes(q)));

  return (
    <StudioShell active="studio" nav={nav}>
      <PageHeader
        title="Contenus"
        subtitle="Vos ressources, modules et parcours."
        actions={
          <ActionMenu
            triggerClassName="primary ui-btn-sm"
            trigger={
              <>
                Créer <ChevronDown size={16} aria-hidden="true" />
              </>
            }
            items={[
              { label: 'Créer avec l’IA', onSelect: () => nav('studio-ocr') },
              { label: 'Ressource', onSelect: () => createNew('resource') },
              { label: 'Module', onSelect: () => createNew('module') },
              { label: 'Parcours', onSelect: () => createNew('path') }
            ]}
          />
        }
      />

      <div className="ui-toolbar">
        <Tabs<Filter>
          label="Filtrer par statut"
          value={filter}
          onChange={setFilter}
          items={[
            { id: 'all', label: 'Tous', count: rows.length },
            { id: 'draft', label: 'Brouillons', count: count('draft') },
            { id: 'review', label: 'En revue', count: count('review') },
            { id: 'published', label: 'Publiés', count: count('published') },
            { id: 'fix', label: 'À corriger', count: count('fix') }
          ]}
        />
        <SearchField value={search} onChange={setSearch} placeholder="Rechercher un titre" label="Rechercher dans mes contenus" />
      </div>

      <ListCard label="Mes contenus" className="sx-contents">
        {visible.length === 0 ? (
          rows.length === 0 ? (
            <EmptyState
              title="Aucun contenu pour l’instant"
              text="Créez une ressource, un module ou un parcours, à la main ou avec l’aide de l’IA."
              action={{ label: 'Créer avec l’IA', onClick: () => nav('studio-ocr') }}
            />
          ) : (
            <EmptyState
              title="Aucun contenu ne correspond"
              text={q ? `Aucun titre ne contient « ${search} ».` : 'Aucun contenu dans cet onglet.'}
              action={{
                label: 'Afficher tous les contenus',
                onClick: () => {
                  setFilter('all');
                  setSearch('');
                }
              }}
            />
          )
        ) : (
          visible.map(({ c, status }) => {
            // Publié : normal · à corriger : rouge · brouillon ou en revue : gris.
            const state: RowState = status.bucket === 'published' ? 'ok' : status.bucket === 'fix' ? 'alert' : 'muted';
            return (
            <ListRow
              key={c.id}
              leading={
                <StateTile state={state}>
                  <TypeIcon type={c.type} />
                </StateTile>
              }
              title={
                <RowTitle state={state} hint={state === 'ok' ? undefined : status.label}>
                  {c.title || 'Sans titre'}
                </RowTitle>
              }
              meta={`${TYPE_LABEL[c.type]} · ${c.published?.version || c.version} · ${c.domain} · ${formatUpdated(c)}`}
              onClick={() => nav(workspaceRoute(c), c.id)}
              ariaLabel={`Modifier ${c.title || 'le contenu'} (${status.label})`}
              trailing={
                <>
                  <ActionMenu
                    label={`Actions sur ${c.title || 'le contenu'}`}
                    items={contentActions(c).map((action) => ({
                      label: CONTENT_ACTION_LABEL[action],
                      danger: action === 'delete',
                      onSelect: () => runAction(action, c)
                    }))}
                  />
                </>
              }
            />
            );
          })
        )}
      </ListCard>

      <ConfirmDialog
        open={Boolean(toUnpublish)}
        title="Dépublier ce contenu ?"
        text={`« ${toUnpublish?.title || 'Ce contenu'} » ne sera plus visible dans la bibliothèque des apprenants. Il redevient un brouillon que vous pourrez publier à nouveau.`}
        confirmLabel="Dépublier"
        onConfirm={() => toUnpublish && unpublish(toUnpublish)}
        onCancel={() => setToUnpublish(null)}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Supprimer ce contenu ?"
        text={
          toDelete?.pubStatus === 'Publié'
            ? `« ${toDelete.title} » est publié : il disparaîtra de la bibliothèque des apprenants. Cette action est définitive.`
            : `« ${toDelete?.title || 'Ce brouillon'} » sera définitivement supprimé.`
        }
        confirmLabel="Supprimer"
        danger
        onConfirm={() => toDelete && remove(toDelete)}
        onCancel={() => setToDelete(null)}
      />
    </StudioShell>
  );
}
