/**
 * Studio — Statistiques et Profil créateur.
 * Les chiffres viennent des progressions réellement enregistrées dans la démonstration.
 */
import React, { useState } from 'react';
import { MODULES_CONTENT } from '../../content';
import type { Progress } from '../../data';
import { moduleProgressPercent } from '../../domain.mjs';
import { buildDynamicCatalog, publishedView, type CatalogType } from '../../wireframeData';
import { Avatar } from '../../components/ProfileIdentityCard';
import { EmptyState, IconTile, ListCard, ListRow, PageHeader, StatusDot, Tabs } from '../../components/ui';
import { contentStatus, StudioShell, TYPE_LABEL, TypeIcon, type StudioProps } from './shared';

/** Identifiant du contenu côté apprenant (les deux contenus d'origine remplacent des entrées du catalogue). */
const catalogIdOf = (studioId: string) => (studioId === 'st-2' ? 'reseaux' : studioId === 'st-1' ? 'fiche-reseau' : studioId);
const detailRoute = (type: CatalogType) => (type === 'resource' ? 'resource-detail' : type === 'path' ? 'path-detail' : 'module-detail');

export function StudioStatsView({ ext, nav, progress, user }: StudioProps) {
  const [typeFilter, setTypeFilter] = useState<'all' | CatalogType>('all');

  const learnerIds = Array.from(new Set([...Object.keys(ext.moduleProgress || {}), ...(user ? [user.id] : [])]));
  const progressOf = (uid: string, catalogId: string): Progress | undefined =>
    catalogId === 'phishing' && uid === user?.id && progress ? progress : ext.moduleProgress?.[uid]?.[catalogId];

  const rows = ext.studioContents.map((c) => {
    const catalogId = catalogIdOf(c.id);
    const published = c.pubStatus === 'Publié';
    const live = publishedView(c);
    const lessonCount = MODULES_CONTENT[catalogId]?.lessons.length || live.sections.length || 3;
    const active = published
      ? learnerIds
          .map((uid) => ({ uid, p: progressOf(uid, catalogId) }))
          .filter((x): x is { uid: string; p: Progress } => Boolean(x.p && (x.p.lessons.length > 0 || x.p.submitted)))
      : [];
    const completion =
      published && c.type === 'module' && active.length > 0
        ? Math.round(active.reduce((sum, x) => sum + moduleProgressPercent(x.p, lessonCount), 0) / active.length)
        : null;
    const attempts = active.filter((x) => x.p.submitted).length;
    return { c, active, completion, attempts, published };
  });

  const visible = rows.filter((r) => typeFilter === 'all' || r.c.type === typeFilter);
  const count = (t: CatalogType) => rows.filter((r) => r.c.type === t).length;
  const publishedCount = visible.filter((r) => r.published).length;
  // Un même apprenant actif sur deux contenus n'est compté qu'une fois.
  const activeLearners = new Set(visible.flatMap((r) => r.active.map((x) => x.uid))).size;
  const rates = visible.map((r) => r.completion).filter((x): x is number => x !== null);
  const avgCompletion = rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null;

  return (
    <StudioShell active="studio-stats" nav={nav}>
      <PageHeader title="Statistiques" subtitle="Ce que les apprenants font de vos contenus publiés." />

      <Tabs<'all' | CatalogType>
        label="Filtrer par type"
        value={typeFilter}
        onChange={setTypeFilter}
        items={[
          { id: 'all', label: 'Tous', count: rows.length },
          { id: 'module', label: 'Modules', count: count('module') },
          { id: 'resource', label: 'Ressources', count: count('resource') },
          { id: 'path', label: 'Parcours', count: count('path') }
        ]}
      />

      <div className="ui-kpis tabular-nums">
        <div className="ui-kpi">
          <b>{publishedCount}</b>
          <span>{publishedCount > 1 ? 'contenus publiés' : 'contenu publié'}</span>
        </div>
        <div className="ui-kpi">
          <b>{activeLearners}</b>
          <span>{activeLearners > 1 ? 'apprenants actifs' : 'apprenant actif'}</span>
        </div>
        <div className="ui-kpi">
          <b>{avgCompletion === null ? '—' : `${avgCompletion} %`}</b>
          <span>achèvement moyen des modules</span>
        </div>
      </div>

      <div className="ui-list sx-table-wrap">
        {visible.length === 0 ? (
          <EmptyState title="Aucun contenu de ce type" text="Les statistiques apparaissent dès qu’un contenu est publié." />
        ) : (
          <table className="sx-table tabular-nums">
            <thead>
              <tr>
                <th scope="col">Contenu</th>
                <th scope="col">Statut</th>
                <th scope="col" className="is-num">
                  Apprenants
                </th>
                <th scope="col" className="is-num">
                  Achèvement
                </th>
                <th scope="col" className="is-num">
                  Quiz passés
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map(({ c, active, completion, attempts, published }) => {
                const status = contentStatus(c);
                return (
                  <tr key={c.id}>
                    <th scope="row">
                      <button type="button" className="sx-table-link" onClick={() => nav(c.type === 'path' ? 'studio-path' : 'studio-editor', c.id)}>
                        {c.title || 'Sans titre'}
                      </button>
                      <small>
                        {TYPE_LABEL[c.type]} · {c.published?.version || c.version} · {c.domain}
                      </small>
                    </th>
                    <td>
                      <StatusDot tone={status.tone}>{status.label}</StatusDot>
                    </td>
                    <td className="is-num">{published ? active.length : '—'}</td>
                    <td className="is-num">{completion === null ? '—' : `${completion} %`}</td>
                    <td className="is-num">{published && c.type === 'module' ? attempts : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <p className="sx-note">Chiffres calculés à partir des progressions enregistrées sur cet appareil ; aucune réponse individuelle n’est affichée.</p>
    </StudioShell>
  );
}

export function StudioCreatorProfileView({ ext, nav, user }: StudioProps) {
  const [memberView, setMemberView] = useState(false);
  if (!user) return null;

  const details = ext.profileDetails[user.id];
  const authored = buildDynamicCatalog(ext).filter((c) => c.author === user.name);
  const mine = ext.studioContents.filter((c) => (c.authorName || 'Kossi Agbo') === user.name);
  const drafts = mine.filter((c) => c.pubStatus !== 'Publié').length;
  const inReview = mine.filter((c) => c.reviewStatus === 'En revue').length;

  return (
    <StudioShell active="studio-profile" nav={nav}>
      <PageHeader
        title="Profil créateur"
        subtitle={memberView ? 'Aperçu : ce que voient les autres membres.' : 'Vos contenus publiés, tels que les membres les trouvent.'}
        actions={
          <>
            <button type="button" className="secondary ui-btn-sm" aria-pressed={memberView} onClick={() => setMemberView((v) => !v)}>
              {memberView ? 'Revenir à ma vue' : 'Aperçu membre'}
            </button>
            <button type="button" className="secondary ui-btn-sm" onClick={() => nav('profile')}>
              Voir mon profil
            </button>
          </>
        }
      />

      <section className="sx-card sx-creator" aria-label="Identité du créateur">
        <Avatar person={user} />
        <div className="sx-creator-text">
          <b>{user.name}</b>
          <span>{details?.tagline || user.role}</span>
          {details?.bio && <p>{details.bio}</p>}
        </div>
      </section>

      <div className="ui-kpis tabular-nums">
        <div className="ui-kpi">
          <b>{authored.length}</b>
          <span>{authored.length > 1 ? 'contenus publiés' : 'contenu publié'}</span>
        </div>
        {!memberView && (
          <>
            <div className="ui-kpi">
              <b>{drafts}</b>
              <span>{drafts > 1 ? 'brouillons' : 'brouillon'}</span>
            </div>
            <div className="ui-kpi">
              <b>{inReview}</b>
              <span>en revue</span>
            </div>
          </>
        )}
      </div>

      <ListCard label="Contenus publiés">
        {authored.length === 0 ? (
          <EmptyState
            title="Aucun contenu publié"
            text="Vos contenus apparaîtront ici dès leur publication."
            action={memberView ? undefined : { label: 'Voir mes contenus', onClick: () => nav('studio') }}
          />
        ) : (
          authored.map((c) => {
            // Un contenu validé s'affiche normalement ; un contenu pas encore validé s'affiche en gris.
            const validated = c.review === 'Pédagogique';
            return (
              <ListRow
                key={c.id}
                leading={
                  <IconTile tone={validated ? 'brand' : 'neutral'}>
                    <TypeIcon type={c.type} />
                  </IconTile>
                }
                title={validated ? c.title : <span className="ui-muted-title">{c.title}</span>}
                meta={[TYPE_LABEL[c.type], c.domain, /non précisée/i.test(c.duration) ? '' : c.duration, c.version.replace(/^Version\s+/i, 'v')].filter(Boolean).join(' · ')}
                onClick={() => nav(detailRoute(c.type), c.id)}
                ariaLabel={`Ouvrir ${c.title}${validated ? '' : ' (pas encore validé)'}`}
              />
            );
          })
        )}
      </ListCard>
    </StudioShell>
  );
}
