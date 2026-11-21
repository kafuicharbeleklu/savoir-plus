/**
 * Page dédiée aux badges (#badges, ou #badges/<membre> pour un autre membre).
 *
 * Conçue d'après les études sur les badges : montrer à quel point on est proche du prochain (l'activité
 * augmente juste avant de l'obtenir), garder toujours un badge à portée et d'autres plus lointains, et
 * rendre le critère de chacun évident. Trois temps : le bilan, les badges à portée (avec la progression
 * et l'action qui y mène), puis tous les badges par catégorie, obtenus ou non.
 */
import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import type { Profile, Progress, Relation } from '../data';
import { initialExtendedState, type AppPage, type ExtendedDemoState } from '../wireframeData';
import { computeMemberStats } from '../memberStats';
import { moduleBadge, type BadgeCategoryId, type SavoirBadgeItem } from '../personas';
import { HexBadgeEmblem } from '../components/BadgeEmblem';
import { ProgressBar } from '../components/ProfileIdentityCard';
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
  const ratio = (b: SavoirBadgeItem) => {
    if (b.earned) return 1;
    if (b.progress) return Math.min(1, b.progress.current / b.progress.target);
    const mod = moduleOf(b.id);
    return mod ? mod.pctVal / 100 : 0;
  };
  const progressLabel = (b: SavoirBadgeItem) => {
    if (b.progress) return `${Math.min(b.progress.current, b.progress.target)} / ${b.progress.target} ${b.progress.unit}`;
    const mod = moduleOf(b.id);
    return mod ? `${mod.pctVal} % du module` : '';
  };

  // À portée : les badges non obtenus les plus avancés (toujours au moins un, même à zéro).
  const within = badges
    .filter((b) => !b.earned)
    .map((b) => ({ b, r: ratio(b) }))
    .sort((x, y) => y.r - x.r)
    .slice(0, 3)
    .map((x) => x.b);

  const actionFor = (b: SavoirBadgeItem): { label: string; run: () => void } => {
    const mod = moduleOf(b.id);
    if (mod) {
      return {
        label: mod.pctVal > 0 ? 'Reprendre le module' : 'Commencer le module',
        run: () => (openReader ? openReader(mod.mod.id) : nav('module-detail', mod.mod.id))
      };
    }
    if (b.track === 'community') return { label: 'Aller au fil d’entraide', run: () => nav('home') };
    // XP, sections lues, quiz : ils viennent en poursuivant ses modules.
    return { label: 'Continuer à apprendre', run: () => nav('learning') };
  };

  const shown = badges.filter((b) => (filter === 'earned' ? b.earned : filter === 'todo' ? !b.earned : true));
  const pct = badges.length ? Math.round((earned.length / badges.length) * 100) : 0;

  const tile = (b: SavoirBadgeItem) => {
    const r = ratio(b);
    const label = progressLabel(b);
    return (
      <li key={b.id} className={`bd-tile${b.earned ? ' is-earned' : ''}`}>
        <HexBadgeEmblem iconKey={b.iconKey} earned={b.earned} size="md" />
        <b className="bd-tile-title">{b.title}</b>
        <p className="bd-tile-text">{b.description}</p>
        {b.earned ? (
          <span className="bd-tile-state">
            <Check size={14} aria-hidden="true" /> Obtenu
          </span>
        ) : label ? (
          <span className="bd-tile-progress">
            <ProgressBar value={Math.round(r * 100)} label={`Progression vers ${b.title}`} tone="htb" />
            <span className="tabular-nums">{label}</span>
          </span>
        ) : (
          <span className="bd-tile-state is-todo">À obtenir</span>
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

        {/* Bilan */}
        <section className="pg-card bd-summary" aria-label="Bilan des badges">
          <div className="bd-summary-head">
            <b className="bd-summary-count tabular-nums">
              {earned.length}
              <span> / {badges.length}</span>
            </b>
            <span className="bd-summary-label">{earned.length > 1 ? 'badges obtenus' : 'badge obtenu'}</span>
          </div>
          <ProgressBar value={pct} label="Badges obtenus" tone="htb" />
          <ul className="bd-summary-cats">
            {BADGE_CATEGORIES.map((c) => {
              const all = badges.filter((b) => b.category === c.id);
              return (
                <li key={c.id}>
                  <span>{c.label}</span>
                  <b className="tabular-nums">
                    {all.filter((b) => b.earned).length} / {all.length}
                  </b>
                </li>
              );
            })}
          </ul>
        </section>

        {/* À portée : le prochain pas, avec ce qu'il reste à faire */}
        {within.length > 0 && (
          <section aria-labelledby="bd-next-title">
            <div className="pg-section-head">
              <h2 id="bd-next-title">À portée</h2>
            </div>
            <ul className="bd-next">
              {within.map((b) => {
                const action = actionFor(b);
                const label = progressLabel(b);
                return (
                  <li key={b.id} className="pg-card bd-next-card">
                    <HexBadgeEmblem iconKey={b.iconKey} earned={false} size="md" />
                    <div className="bd-next-body">
                      <b>{b.title}</b>
                      <p>{b.description}</p>
                      {label && (
                        <span className="bd-tile-progress">
                          <ProgressBar value={Math.round(ratio(b) * 100)} label={`Progression vers ${b.title}`} tone="htb" />
                          <span className="tabular-nums">{label}</span>
                        </span>
                      )}
                    </div>
                    {isOwnProfile && (
                      <button type="button" className="secondary ui-btn-sm" onClick={action.run}>
                        {action.label} <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

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
