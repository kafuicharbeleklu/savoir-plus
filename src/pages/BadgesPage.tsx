/**
 * Page dédiée aux badges (#badges, ou #badges/<membre> pour un autre membre), dans l'esprit de la page
 * Badges de HackTheBox : des catégories repliables avec leur compte (« 1/5 ») ; des tuiles simples —
 * un pictogramme au trait dans un cercle, le nom, le critère — dont le fond s'éclaire quand le badge est
 * obtenu ; au survol, la rareté du badge (part des membres qui l'ont).
 */
import React, { useMemo, useState } from 'react';
import { ArrowLeft, ChevronUp } from 'lucide-react';
import type { Profile, Progress, Relation } from '../data';
import { initialExtendedState, type AppPage, type ExtendedDemoState } from '../wireframeData';
import { computeMemberStats } from '../memberStats';
import type { BadgeCategoryId, SavoirBadgeItem } from '../personas';
import { BadgeGlyph } from '../components/BadgeEmblem';
import { EmptyState, PageHeader } from '../components/ui';

const EMPTY_PROGRESS: Progress = { lessons: [], answers: [], submitted: false };

const BADGE_CATEGORIES: { id: BadgeCategoryId; label: string }[] = [
  { id: 'rank', label: 'Rangs et niveaux' },
  { id: 'modules', label: 'Modules et parcours' },
  { id: 'community', label: 'Communauté et entraide' },
  { id: 'streak', label: 'Régularité et défis' }
];

const percentFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

export function BadgesView({
  target,
  isOwnProfile,
  ext,
  nav,
  progress,
  relations = [],
  myFollowing = [],
  getModuleProgress,
  members = []
}: {
  target: Profile;
  isOwnProfile: boolean;
  ext: ExtendedDemoState;
  nav: (page: AppPage | 'visitor', id?: string) => void;
  progress?: Progress;
  relations?: Relation[];
  myFollowing?: string[];
  getModuleProgress?: (modId: string) => Progress;
  /** Membres de la communauté : sert à calculer la rareté de chaque badge. */
  members?: Profile[];
}) {
  const firstName = target.name.split(' ')[0];
  const [closed, setClosed] = useState<BadgeCategoryId[]>([]);

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

  // Rareté : combien des autres membres ont chaque badge (le membre affiché est compté à part).
  const others = useMemo(() => {
    const seen = new Set<string>();
    const pool = members.filter((p) => p.id !== target.id && !seen.has(p.id) && seen.add(p.id));
    const counts = new Map<string, number>();
    for (const p of pool) {
      const theirs = computeMemberStats({ target: p, isOwnProfile: false, ext, relations, myFollowing: [], progress: EMPTY_PROGRESS }).badges;
      for (const b of theirs) if (b.earned) counts.set(b.id, (counts.get(b.id) || 0) + 1);
    }
    return { size: pool.length, counts };
  }, [members, target.id, ext, relations]);
  const rarity = (b: SavoirBadgeItem) => {
    const total = others.size + 1;
    const holders = (others.counts.get(b.id) || 0) + (b.earned ? 1 : 0);
    return `${percentFormat.format((holders / total) * 100)} % des membres`;
  };

  const toggle = (id: BadgeCategoryId) => setClosed((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));

  const tile = (b: SavoirBadgeItem) => {
    const share = rarity(b);
    return (
      <li
        key={b.id}
        className={`bd-tile${b.earned ? ' is-earned' : ''}`}
        tabIndex={0}
        aria-label={`${b.title}${b.earned ? ', obtenu' : ''}. ${b.description} Rareté : ${share}.`}
      >
        <div className="bd-tile-face" aria-hidden="true">
          <span className="bd-ring">
            <BadgeGlyph iconKey={b.iconKey} size={18} />
          </span>
          <b className="bd-tile-title">{b.title}</b>
          {/* Espaces insécables dans les guillemets : « utile » ne se coupe pas en fin de ligne. */}
          <p className="bd-tile-text">{b.description.replace(/« /g, '« ').replace(/ »/g, ' »')}</p>
        </div>
        {/* Au survol (ou au clavier), la rareté prend la place du badge, comme sur HackTheBox. */}
        <div className="bd-tile-rarity" aria-hidden="true">
          <span>Rareté</span>
          <b className="tabular-nums">{share}</b>
        </div>
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

        {BADGE_CATEGORIES.map((c) => {
          const rows = badges.filter((b) => b.category === c.id);
          if (rows.length === 0) return null;
          const open = !closed.includes(c.id);
          return (
            <section key={c.id} className={`bd-cat${open ? '' : ' is-closed'}`}>
              <h2 className="bd-cat-head">
                <button type="button" aria-expanded={open} aria-controls={`bd-cat-${c.id}`} onClick={() => toggle(c.id)}>
                  <span className="bd-cat-title">{c.label}</span>
                  <span className="bd-cat-count tabular-nums">
                    {rows.filter((b) => b.earned).length}/{rows.length}
                  </span>
                  <ChevronUp size={16} aria-hidden="true" className="bd-cat-chevron" />
                </button>
              </h2>
              {open && (
                <ul id={`bd-cat-${c.id}`} className="bd-grid">
                  {rows.map(tile)}
                </ul>
              )}
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
  members = [],
  relations = [],
  myFollowing = [],
  getModuleProgress
}: {
  ext?: ExtendedDemoState;
  nav: (page: AppPage | 'visitor', id?: string) => void;
  progress?: Progress;
  currentUser: Profile;
  /** Autre membre (#badges/<id>) ; absent : ses propres badges. */
  member?: Profile;
  /** Membres de la communauté, pour la rareté. */
  members?: Profile[];
  relations?: Relation[];
  myFollowing?: string[];
  getModuleProgress?: (modId: string) => Progress;
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
      members={[currentUser, ...members]}
    />
  );
}
