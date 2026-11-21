/**
 * Progression & badges — tout ce qui s'affiche ici est calculé à partir de l'activité réelle
 * du membre (sections lues, quiz, contributions), avec les mêmes chiffres que sa page profil.
 * Trois vues : vue d'ensemble, modules, compétences. Les badges ont leur page (BadgesPage).
 * `ProgressionView` sert à la fois à sa propre page et à la progression d'un autre membre.
 */
import React, { useState } from 'react';
import { ArrowRight, BadgeCheck, BookOpen } from 'lucide-react';
import type { Profile, Progress, Relation } from '../data';
import { initialExtendedState, type AppPage, type ExtendedDemoState } from '../wireframeData';
import { computeMemberStats } from '../memberStats';
import type { BadgeCategoryId, SavoirBadgeItem } from '../personas';
import { BannerEmblem } from '../components/CatalogVisuals';
import { BadgeRing } from '../components/BadgeEmblem';
import { ProgressBar } from '../components/ProfileIdentityCard';
import { EmptyState, ListCard, ListRow, PageHeader, StateTile, Tabs } from '../components/ui';

type ViewId = 'overview' | 'modules' | 'skills';

const EMPTY_PROGRESS: Progress = { lessons: [], answers: [], submitted: false };

const BADGE_CATEGORIES: { id: BadgeCategoryId; label: string }[] = [
  { id: 'rank', label: 'Rangs et niveaux' },
  { id: 'modules', label: 'Modules et parcours' },
  { id: 'community', label: 'Communauté et entraide' },
  { id: 'streak', label: 'Régularité et défis' }
];

/** Badge de validation de chaque module : sert à proposer le prochain badge à portée. */
const MODULE_BADGE: Record<string, string> = {
  phishing: 'mod-phishing',
  reseaux: 'mod-reseaux',
  comptes: 'mod-comptes',
  'email-pro': 'mod-email',
  budget: 'mod-budget',
  sauvegarde: 'mod-sauvegarde',
  reunion: 'mod-reunion'
};

/** Seuils des rangs, pour indiquer le suivant (voir computeSavoirRank). */
const RANK_STEPS = [
  { title: 'Explorateur', xp: 150 },
  { title: 'Confirmé', xp: 300 },
  { title: 'Mentor SAVOIR+', xp: 450 }
];

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

export type ProgressionViewId = ViewId;

export function ProgressionView({
  target,
  isOwnProfile,
  ext: state,
  nav,
  progress,
  relations = [],
  myFollowing = [],
  getModuleProgress,
  openReader,
  initialView = 'overview'
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
  initialView?: ViewId;
}) {
  const firstName = target.name.split(' ')[0];
  const [view, setView] = useState<ViewId>(initialView);

  const stats = computeMemberStats({
    target,
    isOwnProfile,
    ext: state,
    relations,
    myFollowing,
    progress: progress || EMPTY_PROGRESS,
    getModuleProgress: isOwnProfile ? getModuleProgress : undefined
  });

  /* ------------------------------------------------------------------ modules */
  const modules = stats.moduleMetrics.map((m) => {
    const status: 'done' | 'doing' | 'todo' = m.passed ? 'done' : m.pctVal > 0 ? 'doing' : 'todo';
    return { ...m, status, xpMax: m.mod.xpReward || 150 };
  });
  const order = { doing: 0, todo: 1, done: 2 } as const;
  const sortedModules = [...modules].sort((a, b) => order[a.status] - order[b.status] || b.pctVal - a.pctVal);
  const inProgress = sortedModules.filter((m) => m.status === 'doing');
  const nextToStart = sortedModules.find((m) => m.status === 'todo');
  // Pour un autre membre, on montre ce qu'il a en cours, sans lui suggérer de module.
  const focusModules = inProgress.length > 0 ? inProgress.slice(0, 3) : isOwnProfile && nextToStart ? [nextToStart] : [];
  const validatedCount = modules.filter((m) => m.status === 'done').length;

  const openModule = (id: string) => (isOwnProfile && openReader ? openReader(id) : nav('module-detail', id));

  /* ------------------------------------------------------------------ parcours */
  const paths = stats.catalog
    .filter((c) => c.type === 'path')
    .map((path) => {
      const ids = (path.pathModules || []).map((pm) => pm.id);
      const done = ids.filter((id) => stats.passedQuizzes.includes(id)).length;
      const started = ids.some((id) => modules.find((m) => m.mod.id === id && m.pctVal > 0));
      return { path, total: ids.length, done, started };
    })
    .filter((p) => p.total > 0);

  /* ------------------------------------------------------------------ badges */
  const badges = stats.badges;
  const earnedBadges = badges.filter((b) => b.earned);
  const leadModule = inProgress[0];
  const nextBadge: SavoirBadgeItem | undefined =
    (leadModule && badges.find((b) => b.id === MODULE_BADGE[leadModule.mod.id] && !b.earned)) || badges.find((b) => !b.earned);
  const nextBadgeModule = nextBadge ? modules.find((m) => MODULE_BADGE[m.mod.id] === nextBadge.id) : undefined;

  /* ------------------------------------------------------------------ niveau */
  const { lvl, totalXp, rankInfo } = stats;
  const nextRank = RANK_STEPS.find((step) => totalXp < step.xp && step.title !== rankInfo.title);
  const xpToNextLevel = lvl.targetXp - lvl.currentXp;

  const moduleRow = (m: (typeof modules)[number], onOpen: () => void) => (
    <ListRow
      key={m.mod.id}
      leading={
        <StateTile state={m.status === 'done' ? 'ok' : 'muted'}>
          <BannerEmblem item={m.mod} size={20} />
        </StateTile>
      }
      title={m.status === 'done' ? m.mod.title : <span className="ui-muted-title">{m.mod.title}</span>}
      meta={
        <span className="tabular-nums">
          {m.mod.domain} · {m.mod.duration} · {m.xpVal} / {m.xpMax} XP
          {m.modProg.submitted ? ` · quiz ${m.qScore}/${m.qLen}` : ''}
        </span>
      }
      trailing={
        <span className="pg-row-progress">
          <ProgressBar value={m.pctVal} label={`Avancement de ${m.mod.title}`} tone="htb" />
          <b className="tabular-nums">{m.pctVal} %</b>
        </span>
      }
      onClick={onOpen}
      ariaLabel={`${m.mod.title} : ${m.status === 'done' ? 'validé' : m.status === 'doing' ? `${m.pctVal} % réalisés` : 'à commencer'}`}
    />
  );

  return (
    <div className="dashboard-grid pg">
      <div className="dashboard-main">
        <PageHeader
          title={isOwnProfile ? 'Progression' : `Progression de ${firstName}`}
          keepTitle={!isOwnProfile}
          subtitle={isOwnProfile ? 'Votre niveau, vos modules et vos compétences.' : 'Niveau, modules et compétences.'}
        />

        <Tabs<ViewId>
          label="Vues de la progression"
          value={view}
          onChange={setView}
          items={[
            { id: 'overview', label: 'Vue d’ensemble' },
            { id: 'modules', label: 'Modules', count: modules.length },
            { id: 'skills', label: 'Compétences', count: stats.skills.length }
          ]}
        />

        {view === 'overview' && (
          <>
            {/* Niveau */}
            <section className="pg-card pg-level" aria-label="Niveau">
              <div className="pg-level-head">
                <span className="pg-level-badge tabular-nums" aria-hidden="true">
                  {lvl.level}
                </span>
                <div className="pg-level-text">
                  <h2>Niveau {lvl.level}</h2>
                  <p>Rang {rankInfo.title}</p>
                </div>
                <b className="pg-level-xp tabular-nums">{totalXp} XP</b>
              </div>
              <ProgressBar value={lvl.percent} label={`Progression vers le niveau ${lvl.level + 1}`} tone="htb" />
              <p className="pg-level-note tabular-nums">
                {xpToNextLevel} XP avant le niveau {lvl.level + 1}
                {nextRank ? ` · rang ${nextRank.title} à ${nextRank.xp} XP` : ''}
              </p>
              <div className="pg-kpis tabular-nums">
                <div>
                  <b>
                    {validatedCount} / {modules.length}
                  </b>
                  <span>modules validés</span>
                </div>
                <div>
                  <b>{stats.completedLessonsCount}</b>
                  <span>{stats.completedLessonsCount > 1 ? 'sections lues' : 'section lue'}</span>
                </div>
                <div>
                  <b>{stats.passedQuizzes.length}</b>
                  <span>{stats.passedQuizzes.length > 1 ? 'quiz réussis' : 'quiz réussi'}</span>
                </div>
                <div>
                  <b>
                    {earnedBadges.length} / {badges.length}
                  </b>
                  <span>badges</span>
                </div>
              </div>
            </section>

            {/* À poursuivre */}
            {(isOwnProfile || focusModules.length > 0) && (
              <section aria-labelledby="pg-focus-title">
                <div className="pg-section-head">
                  <h2 id="pg-focus-title">{inProgress.length > 0 ? (isOwnProfile ? 'À poursuivre' : 'En cours') : 'Pour commencer'}</h2>
                  <button type="button" className="li-text-link" onClick={() => setView('modules')}>
                    Tous les modules
                  </button>
                </div>
                {focusModules.length > 0 ? (
                  <ListCard label="Modules en cours">{focusModules.map((m) => moduleRow(m, () => openModule(m.mod.id)))}</ListCard>
                ) : (
                  <div className="pg-card">
                    <EmptyState
                      title="Tous les modules sont validés"
                      text="Explorez la bibliothèque pour revoir une notion ou consulter une ressource."
                      action={{ label: 'Ouvrir la bibliothèque', onClick: () => nav('catalog') }}
                    />
                  </div>
                )}
              </section>
            )}

            {/* Parcours */}
            {paths.length > 0 && (
              <section aria-labelledby="pg-paths-title">
                <div className="pg-section-head">
                  <h2 id="pg-paths-title">Parcours</h2>
                </div>
                <ListCard label="Parcours">
                  {paths.map(({ path, total, done, started }) => (
                    <ListRow
                      key={path.id}
                      leading={
                        <StateTile state={done === total ? 'ok' : 'muted'}>
                          <BannerEmblem item={path} size={20} />
                        </StateTile>
                      }
                      title={done === total ? path.title : <span className="ui-muted-title">{path.title}</span>}
                      meta={
                        <span className="tabular-nums">
                          {path.domain} · {plural(total, 'module', 'modules')}
                        </span>
                      }
                      trailing={
                        <span className="pg-row-progress">
                          <ProgressBar value={Math.round((done / total) * 100)} label={`Avancement du parcours ${path.title}`} tone="htb" />
                          <b className="tabular-nums">
                            {done} / {total}
                          </b>
                        </span>
                      }
                      onClick={() => nav('path-detail', path.id)}
                    />
                  ))}
                </ListCard>
              </section>
            )}

            {/* Entraide */}
            <section aria-labelledby="pg-help-title">
              <div className="pg-section-head">
                <h2 id="pg-help-title">Entraide</h2>
                {isOwnProfile && (
                  <button type="button" className="li-text-link" onClick={() => nav('notifications', 'activite')}>
                    Voir mon activité
                  </button>
                )}
              </div>
              <div className="pg-card pg-kpis is-standalone tabular-nums">
                <div>
                  <b>{stats.postsCount}</b>
                  <span>{stats.postsCount > 1 ? 'publications' : 'publication'}</span>
                </div>
                <div>
                  <b>{stats.repliesCount}</b>
                  <span>{stats.repliesCount > 1 ? 'réponses' : 'réponse'}</span>
                </div>
                <div>
                  <b>{stats.solutionsCount}</b>
                  <span>{stats.solutionsCount > 1 ? 'solutions retenues' : 'solution retenue'}</span>
                </div>
                <div>
                  <b>{stats.helpfulReceivedCount}</b>
                  <span>{stats.helpfulReceivedCount > 1 ? 'mentions « utile » reçues' : 'mention « utile » reçue'}</span>
                </div>
              </div>
            </section>
          </>
        )}

        {view === 'modules' && (
          <ListCard label="Tous les modules">{sortedModules.map((m) => moduleRow(m, () => nav('module-detail', m.mod.id)))}</ListCard>
        )}

        {view === 'skills' &&
          (stats.skills.length > 0 ? (
            <div className="pg-skills">
            <ListCard label="Compétences">
              {stats.skills.map((skill) => (
                <ListRow
                  key={skill.name}
                  title={skill.name}
                  meta={
                    <span className="sk-meta">
                      <span className="sk-line">
                        <BookOpen size={14} aria-hidden="true" /> Module « {skill.moduleTitle} »
                      </span>
                      {skill.validated ? (
                        <span className="sk-line is-ok">
                          <BadgeCheck size={14} aria-hidden="true" /> Validée par le quiz du module
                        </span>
                      ) : (
                        <span className="sk-line">En cours d’apprentissage</span>
                      )}
                    </span>
                  }
                  onClick={() => nav('module-detail', skill.moduleId)}
                  ariaLabel={`${skill.name} : ${skill.validated ? 'validée' : 'en cours'}, module « ${skill.moduleTitle} »`}
                />
              ))}
            </ListCard>
            </div>
          ) : (
            <div className="pg-card">
              <EmptyState
                title="Aucune compétence pour le moment"
                text={isOwnProfile ? 'Les compétences d’un module apparaissent dès que vous le commencez.' : undefined}
                action={isOwnProfile ? { label: 'Ouvrir la bibliothèque', onClick: () => nav('catalog') } : undefined}
              />
            </div>
          ))}
      </div>

      <aside className="right-rail" aria-label="Badges">
        {isOwnProfile && nextBadge && (
          <section className="rail-card pg-next">
            <span className="eyebrow">Prochain badge</span>
            <div className="pg-next-row">
              <BadgeRing iconKey={nextBadge.iconKey} earned={false} />
              <div>
                <b>{nextBadge.title}</b>
                <p>{nextBadge.description}</p>
              </div>
            </div>
            {nextBadgeModule ? (
              <button type="button" className="secondary" onClick={() => openModule(nextBadgeModule.mod.id)}>
                {nextBadgeModule.pctVal > 0 ? 'Reprendre le module' : 'Commencer le module'} <ArrowRight size={14} />
              </button>
            ) : nextBadge.track === 'community' ? (
              <button type="button" className="secondary" onClick={() => nav('home')}>
                Aller au fil d’entraide <ArrowRight size={14} />
              </button>
            ) : (
              <button type="button" className="secondary" onClick={() => nav('catalog')}>
                Ouvrir la bibliothèque <ArrowRight size={14} />
              </button>
            )}
          </section>
        )}

        <section className="rail-card">
          <span className="eyebrow">Badges obtenus</span>
          <h3 className="tabular-nums">
            {earnedBadges.length} sur {badges.length}
          </h3>
          {earnedBadges.length > 0 ? (
            <ul className="pg-badge-grid">
              {earnedBadges.slice(-8).map((badge) => (
                <li key={badge.id} title={`${badge.title} — ${badge.description}`}>
                  <BadgeRing iconKey={badge.iconKey} earned size="sm" />
                  <span>{badge.title}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="tiny muted">{isOwnProfile ? 'Votre premier badge arrive dès la première section lue.' : 'Aucun badge obtenu pour le moment.'}</p>
          )}
          <button type="button" className="text-link" onClick={() => nav('badges', isOwnProfile ? undefined : target.id)}>
            Voir tous les badges <ArrowRight size={14} />
          </button>
        </section>
      </aside>
    </div>
  );
}

/** Sa propre page « Progression & badges ». */
export function ProgressionPage({
  ext,
  nav,
  progress,
  userId = 'afi',
  currentUser,
  relations = [],
  myFollowing = [],
  getModuleProgress,
  openReader,
  selectedItemId
}: {
  ext?: ExtendedDemoState;
  nav: (page: AppPage | 'visitor', id?: string) => void;
  progress?: Progress;
  /** Fin de l'adresse : « competences » ouvre l'onglet Compétences. */
  selectedItemId?: string;
  userId?: string;
  currentUser?: Profile;
  relations?: Relation[];
  myFollowing?: string[];
  getModuleProgress?: (modId: string) => Progress;
  openReader?: (moduleId?: string, sectionIdx?: number) => void;
  /** Propriétés communes transmises à toutes les pages ; celle-ci n'en a pas l'usage. */
  [key: string]: unknown;
}) {
  const state = ext || initialExtendedState();
  const target: Profile = currentUser || {
    id: userId,
    name: 'Membre SAVOIR+',
    role: state.profileDetails[userId]?.tagline || 'Membre SAVOIR+',
    bio: '',
    color: 'mint',
    initials: userId.slice(0, 2).toUpperCase()
  };
  return (
    <ProgressionView
      key={selectedItemId || 'overview'}
      initialView={selectedItemId === 'competences' ? 'skills' : 'overview'}
      target={target}
      isOwnProfile
      ext={state}
      nav={nav}
      progress={progress}
      relations={relations}
      myFollowing={myFollowing}
      getModuleProgress={getModuleProgress}
      openReader={openReader}
    />
  );
}
