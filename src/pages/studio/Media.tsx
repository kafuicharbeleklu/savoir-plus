/**
 * Studio — bibliothèque de médias.
 * Import d'un vrai fichier (aperçu local, aucun envoi vers un serveur), texte alternatif,
 * source et droits ; l'usage est calculé à partir des contenus qui joignent le média.
 */
import React, { useRef, useState } from 'react';
import { FileText, Film, Image as ImageIcon, Upload } from 'lucide-react';
import type { StudioMedia } from '../../wireframeData';
import { ConfirmDialog, EmptyState, IconTile, ListCard, ListRow, PageHeader, rowTileTone, RowTitle, SavedIndicator, SidePanel, StatusDot, Tabs } from '../../components/ui';
import { importMediaFile, MEDIA_ACCEPT, mediaPreviews, mediaRowState, mediaTone, mediaUsageCount, StudioShell, type StudioProps } from './shared';

type KindFilter = 'all' | StudioMedia['kind'];

function KindIcon({ kind }: { kind: StudioMedia['kind'] }) {
  if (kind === 'Image') return <ImageIcon size={20} aria-hidden="true" />;
  if (kind === 'Vidéo') return <Film size={20} aria-hidden="true" />;
  return <FileText size={20} aria-hidden="true" />;
}

export function StudioMediaView({ ext, updateExt, nav, setToast, user }: StudioProps) {
  const [filter, setFilter] = useState<KindFilter>('all');
  const [openId, setOpenId] = useState('');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<StudioMedia | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const media = ext.studioMedia;
  const visible = media.filter((m) => filter === 'all' || m.kind === filter);
  const open = media.find((m) => m.id === openId);
  const count = (k: StudioMedia['kind']) => media.filter((m) => m.kind === k).length;
  const usageLabel = (m: StudioMedia) => {
    const n = mediaUsageCount(m.id, ext.studioContents);
    return n === 0 ? 'Non utilisé' : `Utilisé dans ${n} contenu${n > 1 ? 's' : ''}`;
  };

  const patchMedia = (id: string, p: Partial<StudioMedia>) => {
    updateExt((prev) => ({ ...prev, studioMedia: prev.studioMedia.map((m) => (m.id === id ? { ...m, ...p } : m)) }));
    setSavedAt(Date.now());
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const id = importMediaFile(file, updateExt, user?.name);
    setSavedAt(null);
    setOpenId(id);
    setToast(`« ${file.name} » ajouté à la bibliothèque`);
  };

  const remove = (m: StudioMedia) => {
    const url = mediaPreviews.get(m.id);
    if (url) {
      URL.revokeObjectURL(url);
      mediaPreviews.delete(m.id);
    }
    updateExt((prev) => ({
      ...prev,
      studioMedia: prev.studioMedia.filter((x) => x.id !== m.id),
      studioContents: prev.studioContents.map((c) =>
        (c.mediaIds || []).includes(m.id) ? { ...c, mediaIds: (c.mediaIds || []).filter((x) => x !== m.id) } : c
      )
    }));
    setToDelete(null);
    setOpenId('');
    setToast(`« ${m.filename} » supprimé`);
  };

  const preview = open ? mediaPreviews.get(open.id) : undefined;

  return (
    <StudioShell active="studio-media" nav={nav}>
      <PageHeader
        title="Médias"
        subtitle="Images, vidéos et documents à joindre à vos contenus."
        actions={
          <button type="button" className="primary ui-btn-sm" onClick={() => fileRef.current?.click()}>
            <Upload size={16} aria-hidden="true" /> Importer un fichier
          </button>
        }
      />
      <input ref={fileRef} type="file" accept={MEDIA_ACCEPT} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onFile} />

      <Tabs<KindFilter>
        label="Filtrer par type"
        value={filter}
        onChange={setFilter}
        items={[
          { id: 'all', label: 'Tous', count: media.length },
          { id: 'Image', label: 'Images', count: count('Image') },
          { id: 'Vidéo', label: 'Vidéos', count: count('Vidéo') },
          { id: 'Document', label: 'Documents', count: count('Document') }
        ]}
      />

      <ListCard label="Bibliothèque de médias" className="sx-media-list">
        {visible.length === 0 ? (
          <EmptyState
            title={media.length === 0 ? 'Bibliothèque vide' : 'Aucun média de ce type'}
            text="Importez une image, une vidéo ou un PDF depuis votre appareil."
            action={{ label: 'Importer un fichier', onClick: () => fileRef.current?.click() }}
          />
        ) : (
          visible.map((m) => (
            <ListRow
              key={m.id}
              leading={
                mediaPreviews.get(m.id) && m.kind === 'Image' ? (
                  <img className="sx-thumb" src={mediaPreviews.get(m.id)} alt="" />
                ) : (
                  <IconTile tone={rowTileTone(mediaRowState(m.state))}>
                    <KindIcon kind={m.kind} />
                  </IconTile>
                )
              }
              title={
                <RowTitle state={mediaRowState(m.state)} hint={m.state === 'Disponible' ? undefined : m.state}>
                  {m.filename}
                </RowTitle>
              }
              meta={[m.kind, m.sizeLabel, usageLabel(m)].filter(Boolean).join(' · ')}
              onClick={() => {
                setSavedAt(null);
                setOpenId(m.id);
              }}
              active={m.id === openId}
              ariaLabel={`Ouvrir ${m.filename}`}
            />
          ))
        )}
      </ListCard>
      <p className="sx-note">Les fichiers importés restent sur cet appareil : leur aperçu disparaît quand vous rechargez la page.</p>

      <SidePanel
        open={Boolean(open)}
        title={open?.filename || 'Média'}
        onClose={() => setOpenId('')}
        footer={
          open && (
            <button type="button" className="secondary ui-btn-sm danger" onClick={() => setToDelete(open)}>
              Supprimer
            </button>
          )
        }
      >
        {open && (
          <>
            {preview && open.kind === 'Image' && <img className="sx-media-preview" src={preview} alt={open.altText || ''} />}
            {preview && open.kind === 'Vidéo' && <video className="sx-media-preview" src={preview} controls />}
            <div className="sx-media-facts">
              <StatusDot tone={mediaTone(open.state)}>{open.state}</StatusDot>
              <span>{[open.kind, open.sizeLabel, usageLabel(open)].filter(Boolean).join(' · ')}</span>
              <SavedIndicator at={savedAt} />
            </div>
            {open.state === 'Échec' && <p className="sx-note">Ce fichier n’a pas pu être traité : supprimez-le puis importez-le à nouveau.</p>}
            {open.state === 'En traitement' && <p className="sx-note">Traitement en cours : le média sera utilisable dès qu’il sera disponible.</p>}
            {open.kind === 'Image' && (
              <label className="ui-field">
                <span>Texte alternatif</span>
                <input
                  value={open.altText}
                  maxLength={200}
                  placeholder="Décrivez l’image pour les lecteurs d’écran"
                  onChange={(e) => patchMedia(open.id, { altText: e.target.value })}
                />
              </label>
            )}
            <label className="ui-field">
              <span>Source</span>
              <input value={open.source} maxLength={200} placeholder="Ex. Illustration personnelle" onChange={(e) => patchMedia(open.id, { source: e.target.value })} />
            </label>
            <label className="ui-field">
              <span>Droits d’utilisation</span>
              <input
                value={open.rights}
                maxLength={200}
                placeholder="Ex. Création originale · usage pédagogique"
                onChange={(e) => patchMedia(open.id, { rights: e.target.value })}
              />
            </label>
          </>
        )}
      </SidePanel>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Supprimer ce média ?"
        text={
          toDelete && mediaUsageCount(toDelete.id, ext.studioContents) > 0
            ? `« ${toDelete.filename} » sera aussi retiré des contenus qui l’utilisent.`
            : `« ${toDelete?.filename} » sera retiré de votre bibliothèque.`
        }
        confirmLabel="Supprimer"
        danger
        onConfirm={() => toDelete && remove(toDelete)}
        onCancel={() => setToDelete(null)}
      />
    </StudioShell>
  );
}
