/**
 * Page dédiée aux badges (#badges, ou #badges/<membre> pour un autre membre).
 *
 * Tous les badges par catégorie, obtenus ou non, avec le critère de chacun ; un filtre (tous, obtenus,
 * à obtenir). Ni bilan, ni « À portée », ni barre de progression (retirés à la demande) : un badge non
 * obtenu dit seulement où en est le membre, en toutes lettres (« 4 / 6 sections lues »).
 */
import React, { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import type { Profile, Progress, Relation } from '../data';
import { initialExtendedState, type AppPage, type ExtendedDemoState } from '../wireframeData';
import { computeMemberStats } from '../memberStats';
import { moduleBadge, type BadgeCategoryId, type SavoirBadgeItem } from '../personas';
import { HexBadgeEmblem } from '../components/BadgeEmblem';
import { EmptyState, PageHeader } from '../components/ui';

type BadgeFilter = 'all' | 'earned' | 'todo';

const EMPTY_PROGRESS: Progress = { lessons: [], answers: [], submitted: false };

const BADGE_CATEGORIES: { id: BadgeCategoryId; label: string }[] = [
  { id: 'rank', label: 'Rangs et niveaux' },
  { id: 'modules', label: 'Modules et parcours' },
  { id: 'community', label: 'Communauté et entraide' },
  { id: 'streak', label: 'Régularité et défis' }
];

export function BadgesView({
  target,
  isOwnProfile,
  ext,
  nav,
  progress,
  relations = [],
  myFollowing = [],
  getModuleProgress,
  openReader
}: {
  target: Profile;
  isOwnProfile: boolean;
  ext: ExtendedDemoState;
  nav: (page: AppPage | 'visitor', id?: string) => void;
  progress?: Progress;
  relations?: Relation[];
  myFollowing?: string[];
  getModuleProgress?: (modId: string) => Progress;
  openReader?: (moduleId?: string, sectionIdx?: number) => void;
}) {
  const firstName = target.name.split(' ')[0];
  const [filter, setFilter] = useState<BadgeFilter>('all');

  const stats = computeMemberStats({
    target,
    isOwnProfile,
    ext,
    relations,
    myFollowing,
    progress: progress || EMPTY_PROGRESS,
    getModuleProgress: isOwnProfile ? getModuleProgress : undefined
  });
  const badges = stats.badges;
  const earned = badges.filter((b) => b.earned);

  // Un badge de module avance avec le module lui-même (sections lues, quiz).
  const moduleOf = (badgeId: string) => stats.moduleMetrics.find((m) => moduleBadge(m.mod.id)?.id === badgeId);
  const progressLabel = (b: SavoirBadgeItem) => {
    if (b.progress) return `${Math.min(b.progress.current, b.progress.target)} / ${b.progress.target} ${b.progress.unit}`;
    const mod = moduleOf(b.id);
    return mod && mod.pctVal > 0 ? `${mod.pctVal} % du module` : '';
  };

  const shown = badges.filter((b) => (filter === 'earned' ? b.earned : filter === 'todo' ? !b.earned : true));

  const tile = (b: SavoirBadgeItem) => {
    const label = b.earned ? '' : progressLabel(b);
    return (
      <li key={b.id} className={`bd-tile${b.earned ? ' is-earned' : ''}`}>
        <HexBadgeEmblem iconKey={b.iconKey} earned={b.earned} size="md" />
        <b className="bd-tile-title">{b.title}</b>
        <p className="bd-tile-text">{b.description}</p>
        {b.earned ? (
          <span className="bd-tile-state">
            <Check size={14} aria-hidden="true" /> Obtenu
          </span>
        ) : (
          <span className="bd-tile-state is-todo tabular-nums">{label || 'À obtenir'}</span>
        )}
      </li>
    );
  };

  return (
    <div className="dashboard-grid is-single bd">
      <div className="dashboard-main">
        {!isOwnProfile && (
          <button type="button" className="ui-back-link" onClick={() => nav('member', target.id)}>
            <ArrowLeft size={16} aria-hidden="true" /> Profil de {firstName}
          </button>
        )}
        <PageHeader title={isOwnProfile ? 'Badges' : `Badges de ${firstName}`} keepTitle={!isOwnProfile} />

        {/* Tous les badges */}
        <div className="pg-filter" role="group" aria-label="Filtrer les badges">
          {(
            [
              { id: 'all', label: `Tous (${badges.length})` },
              { id: 'earned', label: `Obtenus (${earned.length})` },
              { id: 'todo', label: `À obtenir (${badges.length - earned.length})` }
            ] as { id: BadgeFilter; label: string }[]
          ).map((f) => (
            <button key={f.id} type="button" aria-pressed={filter === f.id} className={filter === f.id ? 'is-on' : ''} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
        {shown.length === 0 && (
          <div className="pg-card">
            <EmptyState
              title={filter === 'earned' ? 'Aucun badge obtenu pour le moment' : 'Tous les badges sont obtenus'}
              text={filter === 'earned' && isOwnProfile ? 'Lisez une première section de module pour obtenir « Premier Pas ».' : undefined}
            />
          </div>
        )}
        {BADGE_CATEGORIES.map((c) => {
          const rows = shown.filter((b) => b.category === c.id);
          if (rows.length === 0) return null;
          const all = badges.filter((b) => b.category === c.id);
          return (
            <section key={c.id} aria-labelledby={`bd-cat-${c.id}`}>
              <div className="pg-section-head">
                <h2 id={`bd-cat-${c.id}`}>{c.label}</h2>
                <span className="pg-section-count tabular-nums">
                  {all.filter((b) => b.earned).length} / {all.length}
                </span>
              </div>
              <ul className="bd-grid">{rows.map(tile)}</ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

/** La page « Badges » : les siens, ou ceux d'un autre membre si sa progression est visible. */
export function BadgesPage({
  ext,
  nav,
  progress,
  currentUser,
  member,
  relations = [],
  myFollowing = [],
  getModuleProgress,
  openReader
}: {
  ext?: ExtendedDemoState;
  nav: (page: AppPage | 'visitor', id?: string) => void;
  progress?: Progress;
  currentUser: Profile;
  /** Autre membre (#badges/<id>) ; absent : ses propres badges. */
  member?: Profile;
  relations?: Relation[];
  myFollowing?: string[];
  getModuleProgress?: (modId: string) => Progress;
  openReader?: (moduleId?: string, sectionIdx?: number) => void;
  [key: string]: unknown;
}) {
  const state = ext || initialExtendedState();
  const isOwn = !member || member.id === currentUser.id;
  const target = isOwn ? currentUser : member!;
  // La progression d'un autre membre n'est visible que s'il l'a ouverte aux membres.
  if (!isOwn && (state.profileDetails[target.id]?.xpVisibility || 'Moi uniquement') !== 'Membres') {
    return (
      <div className="dashboard-grid is-single bd">
        <div className="dashboard-main">
          <button type="button" className="ui-back-link" onClick={() => nav('member', target.id)}>
            <ArrowLeft size={16} aria-hidden="true" /> Profil de {target.name.split(' ')[0]}
          </button>
          <div className="pg-card">
            <EmptyState title="Badges non visibles" text={`${target.name.split(' ')[0]} garde sa progression pour lui ou pour elle.`} />
          </div>
        </div>
      </div>
    );
  }
  return (
    <BadgesView
      key={target.id}
      target={target}
      isOwnProfile={isOwn}
      ext={state}
      nav={nav}
      progress={isOwn ? progress : undefined}
      relations={relations}
      myFollowing={myFollowing}
      getModuleProgress={isOwn ? getModuleProgress : undefined}
      openReader={isOwn ? openReader : undefined}
    />
  );
}
