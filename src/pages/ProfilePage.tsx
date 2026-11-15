/**
 * Page profil — structure LinkedIn : une carte d'identité, puis des sections
 * (Statistiques privées, Infos, Progression, Badges, Activité, Apprentissage,
 * Contenus publiés, Compétences, Centres d'intérêt) et une colonne de droite.
 * Toutes les données affichées sont réelles (src/memberStats.ts) ; la progression
 * d'un autre membre n'apparaît que s'il l'a rendue visible (Préférences › Visibilité).
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  Copy,
  Eye,
  FileText,
  GraduationCap,
  Layers,
  MessageSquare,
  Pencil,
  PenLine,
  Plus
} from 'lucide-react';
import { RichText } from '../components/RichText';
import type { Profile, Progress, Relation } from '../data';
import { computeMemberStats } from '../memberStats';
import { resolveAlgorithmicDiscoverProfiles, resolveCommunityDirectory, resolveProfileVerified } from '../personas';
import { type AppPage, type CatalogItem, type ExtendedDemoState } from '../wireframeData';
import { Avatar, ProgressBar, VerifiedBadge } from '../components/ProfileIdentityCard';
import type { FooterInfoTopic } from '../components/SidebarFooters';
import { HexBadgeEmblem, PedagogicalProfileView } from '../components/PedagogicalProfileView';
import { ActionMenu, EmptyState, IconTile, Modal, StatusDot } from '../components/ui';
import { ProfileMediaDialog, type MediaKind } from '../components/ProfileMedia';

interface ProfilePageProps {
  isOwnProfile: boolean;
  target: Profile;
  currentUser: Profile;
  ext: ExtendedDemoState;
  people: Profile[];
  relations: Relation[];
  myFollowing: string[];
  totalXP: number;
  getModuleProgress: (modId: string) => Progress;
  lessonCounts: Record<string, number>;
  onSaveProfile?: (name: string, tagline: string, location: string, bio: string, interests: string) => Promise<void>;
  onToggleFollow: (id: string) => void;
  onOpenChatDrawer: (relId: string) => void;
  onRequestContact?: (target: Profile) => void;
  onReportTarget: (label: string) => void;
  onOpenComposer?: () => void;
  onOpenInfoModal: (topic: FooterInfoTopic) => void;
  nav: (page: AppPage | 'visitor', id?: string) => void;
  openSettingsTab: (tab: 'prefs' | 'privacy' | 'security') => void;
  setToast: (msg: string) => void;
  progress?: Progress;
  updateExt?: (fn: (prev: ExtendedDemoState) => ExtendedDemoState) => void;
  openReader?: (moduleId?: string, sectionIdx?: number) => void;
}

const EMPTY_PROGRESS: Progress = { lessons: [], answers: [], submitted: false };
const CONTACT_LABEL: Record<string, string> = {
  'Personnes que je suis': 'Accepte les demandes des personnes suivies',
  'Membres autorisés': 'Accepte les demandes de tous les membres',
  Personne: 'N’accepte pas de demande de discussion'
};
const VISIBILITY_LABEL: Record<string, string> = {
  Membres: 'Membres connectés',
  Public: 'Public',
  'Moi uniquement': 'Moi uniquement'
};
const TYPE_LABEL: Record<CatalogItem['type'], string> = { module: 'Module', path: 'Parcours', resource: 'Ressource' };

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;
/** « Module · Numérique · 45 min » ; la durée est omise quand elle n'est pas renseignée. */
const itemMeta = (c: CatalogItem) =>
  [TYPE_LABEL[c.type], c.domain, /non précisée/i.test(c.duration) ? '' : c.duration].filter(Boolean).join(' · ');
const detailRoute = (type: CatalogItem['type']): AppPage =>
  type === 'resource' ? 'resource-detail' : type === 'path' ? 'path-detail' : 'module-detail';

/* ------------------------------------------------------------------ briques */

function Section({
  title,
  sub,
  action,
  footer,
  children,
  label
}: {
  title: string;
  sub?: React.ReactNode;
  action?: React.ReactNode;
  footer?: { label: string; onClick: () => void };
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <section className="pf-card pf-section" aria-label={label || title}>
      <header className="pf-section-head">
        <div className="pf-section-title">
          <h2>{title}</h2>
          {sub && <div className="pf-section-sub">{sub}</div>}
        </div>
        {action}
      </header>
      {children}
      {footer && (
        <button type="button" className="pf-section-foot" onClick={footer.onClick}>
          {footer.label} <ArrowRight size={16} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}

function EditIcon({ label, onClick, icon }: { label: string; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <button type="button" className="li-icon-btn pf-edit-btn" aria-label={label} title={label} onClick={onClick}>
      {icon || <Pencil size={18} aria-hidden="true" />}
    </button>
  );
}

/** Ligne d'une section (hauteur égale) : visuel, titre, méta, élément de droite. */
function Entry({
  leading,
  title,
  meta,
  trailing,
  onClick
}: {
  leading?: React.ReactNode;
  title: React.ReactNode;
  meta?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
}) {
  const inner = (
    <>
      {leading && <span className="pf-entry-leading">{leading}</span>}
      <span className="pf-entry-text">
        <b>{title}</b>
        {meta && <small>{meta}</small>}
      </span>
      {trailing && <span className="pf-entry-trailing">{trailing}</span>}
    </>
  );
  return onClick ? (
    <button type="button" className="pf-entry is-clickable" onClick={onClick}>
      {inner}
    </button>
  ) : (
    <div className="pf-entry">{inner}</div>
  );
}

/* ------------------------------------------------------------------ page */

export function ProfilePage({
  isOwnProfile,
  target,
  currentUser,
  ext,
  people,
  relations,
  myFollowing,
  getModuleProgress,
  onSaveProfile,
  onToggleFollow,
  onOpenChatDrawer,
  onRequestContact,
  onReportTarget,
  onOpenComposer,
  nav,
  openSettingsTab,
  setToast,
  progress,
  updateExt,
  openReader
}: ProfilePageProps) {
  const details = ext.profileDetails[target.id];
  const tagline = details?.tagline || target.role;
  const locationText = details?.location || '';
  const bioText = details?.bio || target.bio || '';
  const interestsRaw = details?.interests || '';
  const interests = interestsRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const isVerified = resolveProfileVerified(target.id, ext.adminUsers, details?.verified);
  const firstName = target.name.split(' ')[0];
  const institution =
    ext.adminUsers.find((u) => u.id === target.id || u.id === `usr-${target.id}`)?.institution || '';

  const [view, setView] = useState<'profile' | 'progression' | 'badges'>('profile');
  const [editOpen, setEditOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState<MediaKind | null>(null);
  const [activityTab, setActivityTab] = useState<'posts' | 'comments'>('posts');
  const [bioExpanded, setBioExpanded] = useState(false);
  const [allSkills, setAllSkills] = useState(false);
  const [form, setForm] = useState({ name: target.name, tagline, location: locationText, bio: bioText, interests: interestsRaw });

  useEffect(() => {
    setView('profile');
    setEditOpen(false);
    setContactOpen(false);
    setMediaOpen(null);
    setBioExpanded(false);
    setAllSkills(false);
    const hasPosts = ext.posts.some((p) => p.authorId === target.id);
    const hasComments = ext.posts.some((p) => p.replies.some((r) => r.authorId === target.id));
    setActivityTab(!hasPosts && hasComments ? 'comments' : 'posts');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.id]);
  useEffect(() => {
    if (!editOpen) setForm({ name: target.name, tagline, location: locationText, bio: bioText, interests: interestsRaw });
  }, [editOpen, target.name, tagline, locationText, bioText, interestsRaw]);

  const stats = useMemo(
    () =>
      computeMemberStats({
        target,
        isOwnProfile,
        ext,
        relations,
        myFollowing,
        progress: progress || EMPTY_PROGRESS,
        getModuleProgress: isOwnProfile ? getModuleProgress : undefined
      }),
    [target, isOwnProfile, ext, relations, myFollowing, progress, getModuleProgress]
  );

  // Préférences › Visibilité du membre consulté.
  const profilePrivate = !isOwnProfile && details?.profileVisibility === 'Moi uniquement';
  const showProgression = isOwnProfile || (details?.xpVisibility || 'Moi uniquement') === 'Membres';
  const contactPolicy = details?.contactPolicy || 'Membres autorisés';
  const targetFollowsMe = (ext.followingIds[target.id] || []).includes(currentUser.id);
  const acceptsMyRequest =
    contactPolicy === 'Membres autorisés' || (contactPolicy === 'Personnes que je suis' && targetFollowsMe);

  const currentRel = !isOwnProfile
    ? relations.find((r) => r.members.includes(currentUser.id) && r.members.includes(target.id) && r.status !== 'declined')
    : undefined;
  const isFollowed = myFollowing.includes(target.id);

  const memberPosts = ext.posts.filter((p) => p.authorId === target.id);
  const memberComments = ext.posts.flatMap((p) =>
    p.replies.filter((r) => r.authorId === target.id).map((r) => ({ post: p, reply: r }))
  );
  const interactionsReceived = memberPosts.reduce((acc, p) => acc + (p.helpfulBy?.length || 0) + p.replies.length, 0);
  const authored = stats.catalog.filter((c) => c.author === target.name);
  const startedModules = stats.moduleMetrics.filter((m) => m.pctVal > 0 || m.passed);
  const earnedBadges = stats.badges.filter((b) => b.earned);

  const profileHref = `${window.location.origin}${window.location.pathname}#member/${target.id}`;
  const profileUrl = profileHref.replace(/^https?:\/\//, '');
  const copyProfileLink = () => {
    const fail = () => setToast(`Copie impossible — lien du profil : ${profileHref}`);
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(profileHref).then(() => setToast('Lien du profil copié'), fail);
    } else {
      fail();
    }
  };

  const openProgression = (tab: 'progression' | 'badges') => {
    if (isOwnProfile) nav('progression');
    else setView(tab);
  };

  /** Enregistre (ou retire) la photo de profil ou la photo de couverture du membre. */
  const saveMedia = (kind: MediaKind, dataUrl: string | null) => {
    const field = kind === 'photo' ? 'photoDataUrl' : 'coverDataUrl';
    updateExt?.((prev) => {
      const base = prev.profileDetails[target.id] || {
        tagline: target.role,
        bio: target.bio,
        interests: '',
        profileVisibility: 'Membres' as const,
        xpVisibility: 'Membres' as const,
        contactPolicy: 'Membres autorisés' as const
      };
      const next = { ...base, [field]: dataUrl || undefined };
      return { ...prev, profileDetails: { ...prev.profileDetails, [target.id]: next } };
    });
  };
  const canEditMedia = isOwnProfile && Boolean(updateExt);
  const coverPhoto = details?.coverDataUrl;

  const defaultCover = (
    <svg viewBox="0 0 804 201" preserveAspectRatio="none">
      <defs>
        <linearGradient id="pfCoverGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#173A30" />
          <stop offset="60%" stopColor="#24594A" />
          <stop offset="100%" stopColor="#3B7A62" />
        </linearGradient>
      </defs>
      <rect width="804" height="201" fill="url(#pfCoverGrad)" />
      <circle cx="690" cy="40" r="130" fill="rgba(255,255,255,0.05)" />
      <circle cx="600" cy="170" r="96" fill="rgba(255,255,255,0.04)" />
      <path d="M0 164 Q 200 112 420 150 T 804 124 L 804 201 L 0 201 Z" fill="rgba(8, 18, 15, 0.18)" />
    </svg>
  );

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveProfile || !form.name.trim()) return;
    await onSaveProfile(form.name, form.tagline, form.location, form.bio, form.interests);
    setEditOpen(false);
  };

  const suggestPeople = resolveAlgorithmicDiscoverProfiles(resolveCommunityDirectory(people, ext), currentUser.id, myFollowing, ext, 6)
    .filter((entry) => entry.profile.id !== target.id)
    .slice(0, 3);
  const suggestedCatalog = stats.catalog
    .filter(
      (item) =>
        (item.type === 'module' || item.type === 'path') &&
        !(isOwnProfile && startedModules.some((m) => m.mod.id === item.id))
    )
    .slice(0, 2);

  /* ---------------------------------------------- vue détaillée (autre membre) */
  if (view !== 'profile' && !isOwnProfile && showProgression) {
    return (
      <div className="pf-subview">
        <button type="button" className="ui-back-link" onClick={() => setView('profile')}>
          <ArrowLeft size={16} aria-hidden="true" /> Profil de {firstName}
        </button>
        <PedagogicalProfileView
          key={`${target.id}-${view}`}
          embedded
          target={target}
          isOwnProfile={false}
          ext={ext}
          updateExt={updateExt}
          relations={relations}
          myFollowing={myFollowing}
          progress={EMPTY_PROGRESS}
          openReader={openReader}
          nav={nav}
          setToast={setToast}
          initialTab={view === 'badges' ? 'badges' : 'about'}
        />
      </div>
    );
  }

  /* ---------------------------------------------- boutons de la carte d'identité */
  let talk: { label: string; onClick?: () => void; disabled?: boolean } | null = null;
  let talkNote = '';
  if (!isOwnProfile) {
    if (currentRel?.blockedBy.length) talkNote = 'Échange bloqué avec ce membre.';
    else if (currentRel?.status === 'accepted') talk = { label: 'Message', onClick: () => onOpenChatDrawer(currentRel.id) };
    else if (currentRel?.status === 'pending' && currentRel.requester === target.id)
      talk = { label: 'Répondre à la demande', onClick: () => nav('relations') };
    else if (currentRel?.status === 'pending') talk = { label: 'Demande envoyée', disabled: true };
    else if (onRequestContact && acceptsMyRequest) talk = { label: 'Demander à discuter', onClick: () => onRequestContact(target) };
    else if (onRequestContact)
      talkNote =
        contactPolicy === 'Personne'
          ? `${firstName} ne reçoit pas de demandes de discussion.`
          : `${firstName} accepte les demandes des personnes qu’il ou elle suit.`;
  }
  const talkIsPrimary = isFollowed && talk && !talk.disabled;

  const networkLine = `${plural(stats.followersCount, 'abonné', 'abonnés')} · ${plural(stats.acceptedRelationsCount, 'relation', 'relations')}`;

  const topCard = (
    <section className="pf-card pf-top" aria-label="Présentation">
      <div className="pf-cover-wrap">
        <div className="pf-cover" aria-hidden="true">
          {coverPhoto ? <img src={coverPhoto} alt="" /> : defaultCover}
        </div>
        {canEditMedia && (
          <button
            type="button"
            className="pf-cover-edit"
            aria-label="Modifier la photo de couverture"
            title="Modifier la photo de couverture"
            onClick={() => setMediaOpen('cover')}
          >
            <Pencil size={20} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="pf-top-body">
        {canEditMedia ? (
          <button
            type="button"
            className="pf-avatar pf-avatar-btn"
            aria-label="Modifier la photo de profil"
            title="Modifier la photo de profil"
            onClick={() => setMediaOpen('photo')}
          >
            <Avatar person={target} />
          </button>
        ) : (
          <div className="pf-avatar">
            <Avatar person={target} />
          </div>
        )}
        <div className={`pf-top-grid ${!profilePrivate && (institution || authored.length > 0) ? 'has-orgs' : ''}`}>
          <div className="pf-identity">
            <div className="pf-name-row">
              <h1>{target.name}</h1>
              {isVerified && <VerifiedBadge />}
            </div>
            {tagline && <p className="pf-headline">{tagline}</p>}
            {!profilePrivate && (
              <>
                <p className="pf-location">
                  {locationText && <span>{locationText}</span>}
                  {locationText && <span aria-hidden="true"> · </span>}
                  <button type="button" className="pf-link" onClick={() => setContactOpen(true)}>
                    Coordonnées
                  </button>
                </p>
                <p className="pf-network tabular-nums">
                  {isOwnProfile ? (
                    <button type="button" className="pf-link" onClick={() => nav('relations')}>
                      {networkLine}
                    </button>
                  ) : (
                    networkLine
                  )}
                </p>
              </>
            )}
          </div>
          {!profilePrivate && (institution || authored.length > 0) && (
            <ul className="pf-orgs" aria-label="Rattachement">
              {institution && (
                <li>
                  <IconTile>
                    <GraduationCap size={18} aria-hidden="true" />
                  </IconTile>
                  <span>{institution}</span>
                </li>
              )}
              {authored.length > 0 && (
                <li>
                  <IconTile tone="brand">
                    <PenLine size={18} aria-hidden="true" />
                  </IconTile>
                  <span>Créateur · {plural(authored.length, 'contenu publié', 'contenus publiés')}</span>
                </li>
              )}
            </ul>
          )}
        </div>

        <div className="pf-actions">
          {isOwnProfile ? (
            <>
              <button type="button" className="primary ui-btn-sm" onClick={() => setEditOpen(true)}>
                Modifier le profil
              </button>
              <button type="button" className="secondary ui-btn-sm" onClick={copyProfileLink}>
                Partager le profil
              </button>
              <ActionMenu
                trigger="Plus"
                items={[
                  { label: 'Préférences de visibilité', onSelect: () => openSettingsTab('privacy') },
                  { label: 'Voir ma progression', onSelect: () => nav('progression') }
                ]}
              />
            </>
          ) : (
            <>
              {!profilePrivate && !isFollowed && (
                <button type="button" className="primary ui-btn-sm" onClick={() => onToggleFollow(target.id)}>
                  <Plus size={16} aria-hidden="true" /> Suivre
                </button>
              )}
              {!profilePrivate && talk && (
                <button
                  type="button"
                  className={`${talkIsPrimary ? 'primary' : 'secondary'} ui-btn-sm`}
                  disabled={talk.disabled}
                  onClick={talk.onClick}
                >
                  {talk.label}
                </button>
              )}
              {!profilePrivate && isFollowed && (
                <button
                  type="button"
                  className="secondary ui-btn-sm"
                  aria-pressed={true}
                  title="Ne plus suivre"
                  onClick={() => onToggleFollow(target.id)}
                >
                  <Check size={16} aria-hidden="true" /> Suivi
                </button>
              )}
              <ActionMenu
                trigger="Plus"
                items={[
                  { label: 'Copier le lien du profil', onSelect: copyProfileLink },
                  { label: 'Signaler ce profil', danger: true, onSelect: () => onReportTarget(`Profil de ${target.name}`) }
                ]}
              />
            </>
          )}
        </div>
        {talkNote && !profilePrivate && <p className="pf-note">{talkNote}</p>}
      </div>
    </section>
  );

  if (profilePrivate) {
    return (
      <div className="pf-page">
        <div className="pf-main">
          {topCard}
          <section className="pf-card">
            <EmptyState title="Ce profil est privé" text={`${firstName} a choisi de ne pas afficher son profil aux autres membres.`} />
          </section>
        </div>
      </div>
    );
  }

  const bioLong = bioText.length > 280;
  const visibleSkills = allSkills ? stats.skills : stats.skills.slice(0, 4);

  return (
    <div className="pf-page">
      <div className="pf-main">
        {topCard}

        {/* Statistiques — privées, comme « Analyses » sur LinkedIn */}
        {isOwnProfile && (
          <Section
            title="Statistiques"
            sub={
              <span className="pf-private">
                <Eye size={14} aria-hidden="true" /> Visibles uniquement par vous
              </span>
            }
            footer={{ label: 'Voir ma progression', onClick: () => nav('progression') }}
          >
            <div className="pf-stats tabular-nums">
              <button type="button" className="pf-stat" onClick={() => nav('learning')}>
                <BookOpen size={24} aria-hidden="true" />
                <span>
                  <b>{plural(stats.passedQuizzes.length, 'module validé', 'modules validés')}</b>
                  <small>Sur {plural(stats.playableModules.length, 'module interactif', 'modules interactifs')}.</small>
                </span>
              </button>
              <button type="button" className="pf-stat" onClick={() => nav('home')}>
                <MessageSquare size={24} aria-hidden="true" />
                <span>
                  <b>{plural(interactionsReceived, 'interaction d’entraide', 'interactions d’entraide')}</b>
                  <small>Réactions et réponses reçues sur vos publications.</small>
                </span>
              </button>
              <button type="button" className="pf-stat" onClick={() => nav('progression')}>
                <Award size={24} aria-hidden="true" />
                <span>
                  <b>
                    Niveau {stats.lvl.level} · {stats.totalXp} XP
                  </b>
                  <small>Rang {stats.rankInfo.title}.</small>
                </span>
              </button>
            </div>
          </Section>
        )}

        {/* Infos */}
        {(bioText || isOwnProfile) && (
          <Section
            title="Infos"
            action={isOwnProfile ? <EditIcon label="Modifier les infos" onClick={() => setEditOpen(true)} /> : undefined}
          >
            {bioText ? (
              <p className={`pf-about ${bioLong && !bioExpanded ? 'is-clamped' : ''}`}>
                {bioText}
                {bioLong && !bioExpanded && (
                  <button type="button" className="pf-more" onClick={() => setBioExpanded(true)}>
                    … voir plus
                  </button>
                )}
              </p>
            ) : (
              <EmptyState
                title="Présentez-vous en quelques lignes"
                text="Vos objectifs d’apprentissage, ce sur quoi vous pouvez aider."
                action={{ label: 'Ajouter une présentation', onClick: () => setEditOpen(true) }}
              />
            )}
          </Section>
        )}

        {/* Progression */}
        {showProgression && (
          <Section title="Progression" footer={{ label: 'Voir le détail de la progression', onClick: () => openProgression('progression') }}>
            <div className="pf-level">
              <div className="pf-level-badge tabular-nums" aria-hidden="true">
                {stats.lvl.level}
              </div>
              <div className="pf-level-text">
                <b>Niveau {stats.lvl.level}</b>
                <small>Rang {stats.rankInfo.title}</small>
              </div>
              <div className="pf-level-bar">
                <div className="pf-level-bar-head tabular-nums">
                  <span>{stats.totalXp} XP</span>
                  <span>
                    {stats.lvl.currentXp} / {stats.lvl.targetXp} XP avant le niveau {stats.lvl.level + 1}
                  </span>
                </div>
                <ProgressBar value={stats.lvl.percent} label={`Progression vers le niveau ${stats.lvl.level + 1}`} tone="htb" />
              </div>
            </div>
          </Section>
        )}

        {/* Badges */}
        {showProgression && (earnedBadges.length > 0 || isOwnProfile) && (
          <Section
            title="Badges"
            sub={<span className="tabular-nums">{earnedBadges.length} obtenus sur {stats.badges.length}</span>}
            footer={
              earnedBadges.length > 0
                ? { label: `Afficher les ${stats.badges.length} badges`, onClick: () => openProgression('badges') }
                : undefined
            }
          >
            {earnedBadges.length === 0 ? (
              <EmptyState
                title="Aucun badge pour l’instant"
                text="Terminez une première section de module pour obtenir votre premier badge."
                action={{ label: 'Explorer la bibliothèque', onClick: () => nav('catalog') }}
              />
            ) : (
              <div className="pf-entries">
                {earnedBadges.slice(0, 3).map((b) => (
                  <Entry
                    key={b.id}
                    leading={<HexBadgeEmblem iconKey={b.iconKey} earned size="sm" />}
                    title={b.title}
                    meta={b.description}
                  />
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Activité */}
        <Section
          title="Activité"
          sub={<span className="tabular-nums">{plural(stats.followersCount, 'abonné', 'abonnés')}</span>}
          action={
            isOwnProfile && onOpenComposer ? (
              <button type="button" className="secondary ui-btn-sm" onClick={onOpenComposer}>
                Créer un post
              </button>
            ) : undefined
          }
          footer={
            (activityTab === 'posts' ? memberPosts.length : memberComments.length) > 0
              ? { label: 'Voir le fil d’entraide', onClick: () => nav('home') }
              : undefined
          }
        >
          <div className="pf-chips" role="tablist" aria-label="Type d’activité">
            {(
              [
                { id: 'posts', label: 'Publications', count: memberPosts.length },
                { id: 'comments', label: 'Commentaires', count: memberComments.length }
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={activityTab === t.id}
                className={`pf-chip ${activityTab === t.id ? 'is-selected' : ''}`}
                onClick={() => setActivityTab(t.id)}
              >
                {t.label} <span className="tabular-nums">{t.count}</span>
              </button>
            ))}
          </div>
          {activityTab === 'posts' &&
            (memberPosts.length === 0 ? (
              <EmptyState
                title={isOwnProfile ? 'Vous n’avez encore rien publié' : `${firstName} n’a encore rien publié`}
                text={isOwnProfile ? 'Posez une question ou partagez une méthode avec la communauté.' : undefined}
              />
            ) : (
              <div className="pf-posts">
                {memberPosts.slice(0, 3).map((p) => (
                  <button key={p.id} type="button" className="pf-post" onClick={() => nav('community-thread', p.id)}>
                    <small>
                      {p.kind === 'question' ? 'Question d’entraide' : 'Publication'} · {p.createdAt}
                    </small>
                    <b>{p.title}</b>
                    <p>
                      <RichText text={p.body} />
                    </p>
                    <small className="tabular-nums">
                      {p.domain} · {plural(p.helpfulBy?.length || 0, 'utile', 'utiles')} · {plural(p.replies.length, 'réponse', 'réponses')}
                    </small>
                  </button>
                ))}
              </div>
            ))}
          {activityTab === 'comments' &&
            (memberComments.length === 0 ? (
              <EmptyState title={isOwnProfile ? 'Vous n’avez encore rien commenté' : `${firstName} n’a encore rien commenté`} />
            ) : (
              <div className="pf-posts">
                {memberComments.slice(0, 3).map(({ post, reply }) => (
                  <button key={reply.id} type="button" className="pf-post" onClick={() => nav('community-thread', post.id)}>
                    <small>En réponse à « {post.title} » · {reply.createdAt}</small>
                    <p>{reply.text}</p>
                  </button>
                ))}
              </div>
            ))}
        </Section>

        {/* Apprentissage — modules réellement commencés */}
        {showProgression && (startedModules.length > 0 || isOwnProfile) && (
          <Section
            title="Apprentissage"
            footer={isOwnProfile && startedModules.length > 0 ? { label: 'Voir mes apprentissages', onClick: () => nav('learning') } : undefined}
          >
            {startedModules.length === 0 ? (
              <EmptyState
                title="Aucun module commencé"
                text="Choisissez un premier module : chaque section terminée rapporte des XP."
                action={{ label: 'Explorer la bibliothèque', onClick: () => nav('catalog') }}
              />
            ) : (
              <div className="pf-entries">
                {startedModules.map((m) => (
                  <Entry
                    key={m.mod.id}
                    leading={
                      <IconTile>
                        <BookOpen size={20} aria-hidden="true" />
                      </IconTile>
                    }
                    title={m.mod.title}
                    meta={`${m.mod.domain} · ${m.mod.level} · ${m.mod.duration}`}
                    trailing={
                      m.passed ? <StatusDot tone="ok">Validé</StatusDot> : <StatusDot tone="info">En cours · {m.pctVal} %</StatusDot>
                    }
                    onClick={() => nav('module-detail', m.mod.id)}
                  />
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Contenus publiés (créateurs) */}
        {authored.length > 0 && (
          <Section
            title="Contenus publiés"
            sub={<span className="tabular-nums">{plural(authored.length, 'contenu', 'contenus')} dans la bibliothèque</span>}
            footer={authored.length > 3 ? { label: `Afficher les ${authored.length} contenus`, onClick: () => nav('catalog') } : undefined}
          >
            <div className="pf-entries">
              {authored.slice(0, 3).map((c) => (
                <Entry
                  key={c.id}
                  leading={
                    <IconTile tone="brand">
                      {c.type === 'path' ? (
                        <Layers size={20} aria-hidden="true" />
                      ) : c.type === 'resource' ? (
                        <FileText size={20} aria-hidden="true" />
                      ) : (
                        <BookOpen size={20} aria-hidden="true" />
                      )}
                    </IconTile>
                  }
                  title={c.title}
                  meta={itemMeta(c)}
                  onClick={() => nav(detailRoute(c.type), c.id)}
                />
              ))}
            </div>
          </Section>
        )}

        {/* Compétences — issues des modules suivis */}
        {showProgression && (stats.skills.length > 0 || isOwnProfile) && (
          <Section
            title="Compétences"
            footer={
              !allSkills && stats.skills.length > 4
                ? { label: `Afficher les ${stats.skills.length} compétences`, onClick: () => setAllSkills(true) }
                : undefined
            }
          >
            {stats.skills.length === 0 ? (
              <EmptyState title="Aucune compétence pour l’instant" text="Elles apparaissent ici dès que vous commencez un module." />
            ) : (
              <div className="pf-entries">
                {visibleSkills.map((s) => (
                  <Entry
                    key={s.name}
                    title={s.name}
                    meta={`Module « ${s.moduleTitle} »`}
                    trailing={s.validated ? <StatusDot tone="ok">Validée</StatusDot> : <StatusDot tone="info">En cours</StatusDot>}
                  />
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Centres d'intérêt */}
        {(interests.length > 0 || isOwnProfile) && (
          <Section
            title="Centres d’intérêt"
            action={isOwnProfile ? <EditIcon label="Modifier les centres d’intérêt" onClick={() => setEditOpen(true)} /> : undefined}
          >
            {interests.length === 0 ? (
              <EmptyState
                title="Aucun centre d’intérêt"
                text="Ils servent à vous suggérer des ressources et des questions d’entraide."
                action={{ label: 'Ajouter des centres d’intérêt', onClick: () => setEditOpen(true) }}
              />
            ) : (
              <ul className="pf-tags">
                {interests.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            )}
          </Section>
        )}
      </div>

      {/* Colonne de droite */}
      <aside className="pf-rail" aria-label="Compléments du profil">
        <section className="pf-card pf-rail-card">
          <div className="pf-rail-row">
            <div>
              <h3>Langue du profil</h3>
              <p>{ext.appPrefs.language}</p>
            </div>
            {isOwnProfile && <EditIcon label="Modifier la langue" onClick={() => nav('settings', 'account/language')} />}
          </div>
          <div className="pf-rail-row">
            <div>
              <h3>Profil public et URL</h3>
              <p className="pf-url">{profileUrl}</p>
            </div>
            <EditIcon label="Copier le lien du profil" onClick={copyProfileLink} icon={<Copy size={18} aria-hidden="true" />} />
          </div>
        </section>

        {suggestPeople.length > 0 && (
          <section className="pf-card pf-rail-card">
            <h2>Personnes que vous pourriez connaître</h2>
            <div className="pf-suggest-list">
              {suggestPeople.map((entry) => (
                <div key={entry.profile.id} className="pf-suggest">
                  <button
                    type="button"
                    className="pf-suggest-avatar"
                    aria-label={`Voir le profil de ${entry.profile.name}`}
                    onClick={() => nav('member', entry.profile.id)}
                  >
                    <Avatar person={entry.profile} />
                  </button>
                  <div className="pf-suggest-text">
                    <button type="button" className="pf-suggest-name" onClick={() => nav('member', entry.profile.id)}>
                      {entry.profile.name}
                      {entry.verified && <VerifiedBadge />}
                    </button>
                    <p title={entry.headline}>{entry.headline}</p>
                    <button type="button" className="secondary ui-btn-sm" onClick={() => onToggleFollow(entry.profile.id)}>
                      <Plus size={16} aria-hidden="true" /> Suivre
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="pf-section-foot" onClick={() => nav('relations')}>
              Tout afficher <ArrowRight size={16} aria-hidden="true" />
            </button>
          </section>
        )}

        {suggestedCatalog.length > 0 && (
          <section className="pf-card pf-rail-card">
            <h2>Vous aimerez peut-être</h2>
            <div className="pf-suggest-list">
              {suggestedCatalog.map((item) => (
                <div key={item.id} className="pf-suggest">
                  <IconTile>
                    {item.type === 'path' ? <Layers size={20} aria-hidden="true" /> : <BookOpen size={20} aria-hidden="true" />}
                  </IconTile>
                  <div className="pf-suggest-text">
                    <button type="button" className="pf-suggest-name" onClick={() => nav(detailRoute(item.type), item.id)}>
                      {item.title}
                    </button>
                    <p>{itemMeta(item)}</p>
                    <button type="button" className="secondary ui-btn-sm" onClick={() => nav(detailRoute(item.type), item.id)}>
                      Découvrir
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="pf-section-foot" onClick={() => nav('catalog')}>
              Tout afficher <ArrowRight size={16} aria-hidden="true" />
            </button>
          </section>
        )}
      </aside>

      {/* Coordonnées */}
      <Modal open={contactOpen} size="sm" title={`Coordonnées de ${target.name}`} onClose={() => setContactOpen(false)}>
        <dl className="ui-facts">
          <div>
            <dt>Profil</dt>
            <dd>
              <a className="pf-link" href={profileHref}>
                {profileUrl}
              </a>
            </dd>
          </div>
          {institution && (
            <div>
              <dt>Établissement</dt>
              <dd>{institution}</dd>
            </div>
          )}
          <div>
            <dt>Discussion privée</dt>
            <dd>{CONTACT_LABEL[contactPolicy] || contactPolicy}</dd>
          </div>
          {isOwnProfile && (
            <div>
              <dt>Visibilité du profil</dt>
              <dd>{VISIBILITY_LABEL[details?.profileVisibility || 'Membres']}</dd>
            </div>
          )}
        </dl>
        <div className="pf-panel-actions">
          <button type="button" className="secondary ui-btn-sm" onClick={copyProfileLink}>
            <Copy size={16} aria-hidden="true" /> Copier le lien
          </button>
          {isOwnProfile && (
            <button
              type="button"
              className="li-text-link"
              onClick={() => {
                setContactOpen(false);
                openSettingsTab('privacy');
              }}
            >
              Modifier dans les Préférences
            </button>
          )}
        </div>
      </Modal>

      {/* Modifier le profil : fenêtre centrée, libellés au-dessus des champs, « Enregistrer » en pied */}
      {isOwnProfile && (
        <Modal
          open={editOpen}
          size="lg"
          title="Modifier le profil"
          onClose={() => setEditOpen(false)}
          footer={
            <button type="submit" form="pf-edit-form" className="primary ui-btn-sm" disabled={!form.name.trim()}>
              Enregistrer
            </button>
          }
        >
          <form id="pf-edit-form" className="pf-form" onSubmit={saveProfile}>
            <p className="pf-form-note">* Champ obligatoire</p>
            <label className="pf-field">
              <span>Nom *</span>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="pf-field">
              <span>Titre du profil</span>
              <input
                value={form.tagline}
                maxLength={160}
                placeholder="Ex. Apprenante | Cybersécurité"
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              />
              <small className="tabular-nums">{form.tagline.length} / 160</small>
            </label>
            <label className="pf-field">
              <span>Ville</span>
              <input value={form.location} placeholder="Ex. Lomé, Région Maritime" onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </label>
            <label className="pf-field">
              <span>Infos</span>
              <textarea rows={5} maxLength={1200} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              <small className="tabular-nums">{form.bio.length} / 1 200</small>
            </label>
            <label className="pf-field">
              <span>Centres d’intérêt</span>
              <input value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} />
              <small>Séparés par des virgules. Ils servent à personnaliser vos suggestions.</small>
            </label>

            {canEditMedia && (
              <div className="pf-form-section">
                <h3>Photos</h3>
                <p>Ajoutez ou modifiez votre photo de profil et votre photo de couverture.</p>
                <div className="pf-form-buttons">
                  <button
                    type="button"
                    className="pf-outline-btn"
                    onClick={() => {
                      setEditOpen(false);
                      setMediaOpen('photo');
                    }}
                  >
                    <Pencil size={16} aria-hidden="true" /> Photo de profil
                  </button>
                  <button
                    type="button"
                    className="pf-outline-btn"
                    onClick={() => {
                      setEditOpen(false);
                      setMediaOpen('cover');
                    }}
                  >
                    <Pencil size={16} aria-hidden="true" /> Photo de couverture
                  </button>
                </div>
              </div>
            )}

            <div className="pf-form-section">
              <h3>Coordonnées</h3>
              <p>Lien de votre profil, établissement et règles de contact.</p>
              <div className="pf-form-buttons">
                <button
                  type="button"
                  className="pf-outline-btn"
                  onClick={() => {
                    setEditOpen(false);
                    setContactOpen(true);
                  }}
                >
                  <Pencil size={16} aria-hidden="true" /> Voir les coordonnées
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Photo de profil et photo de couverture */}
      {canEditMedia && (
        <>
          <ProfileMediaDialog
            kind="photo"
            open={mediaOpen === 'photo'}
            current={details?.photoDataUrl}
            placeholder={<Avatar person={target} />}
            visibilityLabel={VISIBILITY_LABEL[details?.profileVisibility || 'Membres']}
            onOpenVisibility={() => {
              setMediaOpen(null);
              openSettingsTab('privacy');
            }}
            onChange={(dataUrl) => saveMedia('photo', dataUrl)}
            onClose={() => setMediaOpen(null)}
            setToast={setToast}
          />
          <ProfileMediaDialog
            kind="cover"
            open={mediaOpen === 'cover'}
            current={coverPhoto}
            placeholder={defaultCover}
            onChange={(dataUrl) => saveMedia('cover', dataUrl)}
            onClose={() => setMediaOpen(null)}
            setToast={setToast}
          />
        </>
      )}
    </div>
  );
}
