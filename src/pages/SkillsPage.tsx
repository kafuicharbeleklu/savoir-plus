/**
 * Page dédiée aux compétences (#skills, ou #skills/<membre> pour un autre membre), sur le modèle de la
 * page « Compétences » de LinkedIn (« Afficher toutes les compétences ») : des onglets par catégorie —
 * ici par domaine, et seulement au-delà de trois compétences comme chez LinkedIn — puis une ligne par
 * compétence avec ce qui la rattache (le module) et son état. Une compétence est « validée » quand le
 * quiz de son module est réussi, comme les compétences vérifiées de LinkedIn.
 */
import React, { useState } from 'react';
import { ArrowLeft, BadgeCheck, BookOpen } from 'lucide-react';
import type { Profile, Progress, Relation } from '../data';
import { initialExtendedState, type AppPage, type ExtendedDemoState } from '../wireframeData';
import { computeMemberStats } from '../memberStats';
import { EmptyState, ListCard, ListRow, PageHeader, Tabs } from '../components/ui';

const EMPTY_PROGRESS: Progress = { lessons: [], answers: [], submitted: false };

export function SkillsView({
  target,
  isOwnProfile,
  ext,
  nav,
  progress,
  relations = [],
  myFollowing = [],
  getModuleProgress
}: {
  target: Profile;
  isOwnProfile: boolean;
  ext: ExtendedDemoState;
  nav: (page: AppPage | 'visitor', id?: string) => void;
  progress?: Progress;
  relations?: Relation[];
  myFollowing?: string[];
  getModuleProgress?: (modId: string) => Progress;
}) {
  const firstName = target.name.split(' ')[0];
  const stats = computeMemberStats({
    target,
    isOwnProfile,
    ext,
    relations,
    myFollowing,
    progress: progress || EMPTY_PROGRESS,
    getModuleProgress: isOwnProfile ? getModuleProgress : undefined
  });
  const skills = stats.skills;
  const domains = Array.from(new Set(skills.map((s) => s.domain)));
  const [tab, setTab] = useState<string>('all');
  const shown = tab === 'all' ? skills : skills.filter((s) => s.domain === tab);

  return (
    <div className="dashboard-grid is-single sk">
      <div className="dashboard-main">
        {!isOwnProfile && (
          <button type="button" className="ui-back-link" onClick={() => nav('member', target.id)}>
            <ArrowLeft size={16} aria-hidden="true" /> Profil de {firstName}
          </button>
        )}
        <PageHeader title={isOwnProfile ? 'Compétences' : `Compétences de ${firstName}`} keepTitle={!isOwnProfile} />

        {skills.length === 0 ? (
          <div className="pg-card">
            <EmptyState
              title="Aucune compétence pour le moment"
              text={isOwnProfile ? 'Les compétences d’un module apparaissent dès que vous le commencez.' : undefined}
              action={isOwnProfile ? { label: 'Ouvrir la bibliothèque', onClick: () => nav('catalog') } : undefined}
            />
          </div>
        ) : (
          <>
            {/* Comme LinkedIn : les catégories n'apparaissent qu'au-delà de trois compétences. */}
            {skills.length > 3 && domains.length > 1 && (
              <Tabs<string>
                label="Catégories de compétences"
                value={tab}
                onChange={setTab}
                items={[{ id: 'all', label: 'Toutes', count: skills.length }, ...domains.map((d) => ({ id: d, label: d, count: skills.filter((s) => s.domain === d).length }))]}
              />
            )}
            <ListCard label="Compétences">
              {shown.map((s) => (
                <ListRow
                  key={s.name}
                  title={s.name}
                  meta={
                    <span className="sk-meta">
                      <span className="sk-line">
                        <BookOpen size={14} aria-hidden="true" /> Module « {s.moduleTitle} »
                      </span>
                      {s.validated ? (
                        <span className="sk-line is-ok">
                          <BadgeCheck size={14} aria-hidden="true" /> Validée par le quiz du module
                        </span>
                      ) : (
                        <span className="sk-line">En cours d’apprentissage</span>
                      )}
                    </span>
                  }
                  onClick={() => nav('module-detail', s.moduleId)}
                  ariaLabel={`${s.name} : ${s.validated ? 'validée' : 'en cours'}, module « ${s.moduleTitle} »`}
                />
              ))}
            </ListCard>
          </>
        )}
      </div>
    </div>
  );
}

/** La page « Compétences » : les siennes, ou celles d'un autre membre si sa progression est visible. */
export function SkillsPage({
  ext,
  nav,
  progress,
  currentUser,
  member,
  relations = [],
  myFollowing = [],
  getModuleProgress
}: {
  ext?: ExtendedDemoState;
  nav: (page: AppPage | 'visitor', id?: string) => void;
  progress?: Progress;
  currentUser: Profile;
  /** Autre membre (#skills/<id>) ; absent : ses propres compétences. */
  member?: Profile;
  relations?: Relation[];
  myFollowing?: string[];
  getModuleProgress?: (modId: string) => Progress;
  [key: string]: unknown;
}) {
  const state = ext || initialExtendedState();
  const isOwn = !member || member.id === currentUser.id;
  const target = isOwn ? currentUser : member!;
  if (!isOwn && (state.profileDetails[target.id]?.xpVisibility || 'Moi uniquement') !== 'Membres') {
    return (
      <div className="dashboard-grid is-single sk">
        <div className="dashboard-main">
          <button type="button" className="ui-back-link" onClick={() => nav('member', target.id)}>
            <ArrowLeft size={16} aria-hidden="true" /> Profil de {target.name.split(' ')[0]}
          </button>
          <div className="pg-card">
            <EmptyState title="Compétences non visibles" text={`${target.name.split(' ')[0]} garde sa progression pour lui ou pour elle.`} />
          </div>
        </div>
      </div>
    );
  }
  return (
    <SkillsView
      key={target.id}
      target={target}
      isOwnProfile={isOwn}
      ext={state}
      nav={nav}
      progress={isOwn ? progress : undefined}
      relations={relations}
      myFollowing={myFollowing}
      getModuleProgress={isOwn ? getModuleProgress : undefined}
    />
  );
}
