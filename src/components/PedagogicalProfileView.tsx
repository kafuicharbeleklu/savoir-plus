import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Copy,
  Crown,
  Edit3,
  Flame,
  Globe,
  Heart,
  Lock,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Network,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Target,
  Users
} from 'lucide-react';
import type { Profile, Progress, Relation } from '../data';
import { MODULES_CONTENT } from '../content';
import { moduleProgressPercent, moduleXp, scoreAnswers } from '../domain.mjs';
import {
  computeAnnualActivitySummary,
  computeGlobalLevel,
  computeSavoirBadges,
  computeSavoirRank,
  formatMemberHandle,
  resolveProfileVerified,
  type BadgeCategoryId,
  type BadgeTrack,
  type SavoirBadgeItem
} from '../personas';
import { buildDynamicCatalog, CATALOG_ITEMS, type AppPage, type ExtendedDemoState } from '../wireframeData';
import { Avatar, VerifiedBadge } from './ProfileIdentityCard';
import { computeMemberStats } from '../memberStats';

export interface PedagogicalProfileViewProps {
  target: Profile;
  isOwnProfile: boolean;
  ext: ExtendedDemoState;
  updateExt?: (fn: (prev: ExtendedDemoState) => ExtendedDemoState) => void;
  relations: Relation[];
  myFollowing: string[];
  progress: Progress;
  getModuleProgress?: (modId: string) => Progress;
  openReader?: (moduleId?: string, sectionIdx?: number) => void;
  onSaveProfile?: (name: string, tagline: string, location: string, bio: string, interests: string) => Promise<void>;
  nav: (page: AppPage | 'visitor', id?: string) => void;
  setToast: (msg: string) => void;
  initialTab?: 'about' | 'badges';
  embedded?: boolean;
}

function resolveModProg(
  modId: string,
  progress: Progress,
  ext: ExtendedDemoState,
  userId: string,
  getModuleProgress?: (id: string) => Progress
): Progress {
  if (getModuleProgress) return getModuleProgress(modId);
  if (modId === 'phishing') return progress;
  return ext.moduleProgress?.[userId]?.[modId] || { lessons: [], answers: [], submitted: false };
}

function BadgeGlyph({ iconKey, size = 20 }: { iconKey: SavoirBadgeItem['iconKey']; size?: number }) {
  switch (iconKey) {
    case 'compass':
      return <Compass size={size} aria-hidden="true" />;
    case 'target':
      return <Target size={size} aria-hidden="true" />;
    case 'crown':
      return <Crown size={size} aria-hidden="true" />;
    case 'phishing':
      return <ShieldAlert size={size} aria-hidden="true" />;
    case 'network':
      return <Network size={size} aria-hidden="true" />;
    case 'lock':
      return <Lock size={size} aria-hidden="true" />;
    case 'shield':
      return <ShieldCheck size={size} aria-hidden="true" />;
    case 'path':
      return <Compass size={size} aria-hidden="true" />;
    case 'book':
      return <BookOpen size={size} aria-hidden="true" />;
    case 'sparkles':
      return <Sparkles size={size} aria-hidden="true" />;
    case 'message':
      return <MessageCircle size={size} aria-hidden="true" />;
    case 'check':
      return <CheckCircle2 size={size} aria-hidden="true" />;
    case 'users':
      return <Users size={size} aria-hidden="true" />;
    case 'heart':
      return <Heart size={size} aria-hidden="true" />;
    case 'flame':
      return <Flame size={size} aria-hidden="true" />;
    case 'award':
    default:
      return <Award size={size} aria-hidden="true" />;
  }
}

export function HexBadgeEmblem({
  iconKey,
  earned,
  size = 'md'
}: {
  iconKey: SavoirBadgeItem['iconKey'];
  earned: boolean;
  size?: 'sm' | 'md';
}) {
  return (
    <div className={`htb-hex-badge ${earned ? 'is-earned' : 'is-locked'} is-${size}`}>
      <svg viewBox="0 0 64 72" className="htb-hex-svg" aria-hidden="true">
        <path
          d="M32 3 L59 18.5 L59 53.5 L32 69 L5 53.5 L5 18.5 Z"
          className="htb-hex-shape"
          strokeLinejoin="round"
        />
      </svg>
      <span className="htb-hex-icon">
        <BadgeGlyph iconKey={iconKey} size={size === 'sm' ? 16 : 20} />
      </span>
    </div>
  );
}

const CATEGORY_META: { id: BadgeCategoryId; label: string; track: BadgeTrack }[] = [
  { id: 'rank', label: 'Rangs & Niveaux', track: 'learning' },
  { id: 'modules', label: 'Modules & Parcours', track: 'learning' },
  { id: 'community', label: 'Communauté & Entraide', track: 'community' },
  { id: 'streak', label: 'Régularité & Défis', track: 'community' }
];

export function PedagogicalProfileView({
  target,
  isOwnProfile,
  ext,
  updateExt,
  relations,
  myFollowing,
  progress,
  getModuleProgress,
  openReader,
  onSaveProfile,
  nav,
  setToast,
  initialTab = 'about',
  embedded = false
}: PedagogicalProfileViewProps) {
  const [tab, setTab] = useState<'about' | 'badges'>(initialTab);
  const [badgeTrack, setBadgeTrack] = useState<'all' | BadgeTrack>('all');
  const [onlyCompleted, setOnlyCompleted] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState<Record<BadgeCategoryId, boolean>>({
    rank: false,
    modules: false,
    community: false,
    streak: false
  });
  const [editingSummary, setEditingSummary] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const details = ext.profileDetails[target.id];
  const bioText = details?.bio || target.bio || '';
  const taglineText = details?.tagline || target.role;
  const locationText = details?.location || 'Lomé, Région Maritime';
  const interestsRaw = details?.interests || 'Numérique, Entraide, Apprentissage';
  const skillTags = interestsRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const isVerified = resolveProfileVerified(target.id, ext.adminUsers, details?.verified);
  const handleText = formatMemberHandle(target.name, target.id);
  const isPublicVis = (details?.profileVisibility || 'Membres') === 'Public';

  const [bioDraft, setBioDraft] = useState(bioText);
  const [interestsDraft, setInterestsDraft] = useState(interestsRaw);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab, target.id]);

  useEffect(() => {
    setBioDraft(bioText);
    setInterestsDraft(interestsRaw);
    setEditingSummary(false);
    setMoreMenuOpen(false);
  }, [target.id, bioText, interestsRaw]);

  // Calcul partagé avec la page profil (src/memberStats.ts) : mêmes chiffres partout.
  const stats = useMemo(
    () => computeMemberStats({ target, isOwnProfile, ext, relations, myFollowing, progress, getModuleProgress }),
    [target, isOwnProfile, ext, relations, myFollowing, progress, getModuleProgress]
  );
  const {
    catalog,
    moduleMetrics,
    totalXp,
    lvl,
    completedModules,
    passedQuizzes,
    postsCount,
    repliesCount,
    followingCount,
    acceptedRelationsCount,
    rankInfo,
    activity,
    badges
  } = stats;

  const learningBadges = badges.filter((b) => b.track === 'learning');
  const communityBadges = badges.filter((b) => b.track === 'community');
  const learningUnlocked = learningBadges.filter((b) => b.earned).length;
  const communityUnlocked = communityBadges.filter((b) => b.earned).length;
  const totalUnlocked = badges.filter((b) => b.earned).length;

  const previewBadges = useMemo(() => {
    const earned = badges.filter((b) => b.earned);
    const locked = badges.filter((b) => !b.earned);
    return [...earned, ...locked].slice(0, 3);
  }, [badges]);

  // Lien réel vers ce profil sur le site déployé (et non un domaine fictif).
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

  const handleToggleVisibility = () => {
    if (!isOwnProfile || !updateExt) return;
    const nextVis = isPublicVis ? 'Membres' : 'Public';
    updateExt((prev) => ({
      ...prev,
      profileDetails: {
        ...prev.profileDetails,
        [target.id]: {
          ...(prev.profileDetails[target.id] || {
            tagline: taglineText,
            location: locationText,
            bio: bioText,
            interests: interestsRaw,
            contactPolicy: 'Membres autorisés',
            profileVisibility: 'Membres',
            verified: isVerified
          }),
          profileVisibility: nextVis
        }
      }
    }));
    setToast(nextVis === 'Public' ? 'Profil rendu public sur SAVOIR+' : 'Profil limité aux membres connectés');
  };

  const handleSaveInlineSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveProfile) {
      await onSaveProfile(target.name, taglineText, locationText, bioDraft, interestsDraft);
    } else if (updateExt) {
      updateExt((prev) => ({
        ...prev,
        profileDetails: {
          ...prev.profileDetails,
          [target.id]: {
            ...(prev.profileDetails[target.id] || {
              tagline: taglineText,
              location: locationText,
              bio: bioText,
              interests: interestsRaw,
              contactPolicy: 'Membres autorisés',
              profileVisibility: 'Membres',
              verified: isVerified
            }),
            bio: bioDraft,
            interests: interestsDraft
          }
        }
      }));
      setToast('Résumé mis à jour');
    }
    setEditingSummary(false);
  };

  const earnedSkills = useMemo(() => {
    const skills = new Set<string>();
    for (const m of moduleMetrics) {
      if (m.passed || m.pctVal > 0) {
        for (const sk of m.mod.skills || []) skills.add(sk);
      }
    }
    return Array.from(skills);
  }, [moduleMetrics]);

  const studiedDomains = useMemo(() => {
    const doms = new Set<string>();
    for (const m of moduleMetrics) {
      if (m.pctVal > 0) doms.add(m.mod.domain);
    }
    return Array.from(doms);
  }, [moduleMetrics]);

  const avatarStrokeDash = 2 * Math.PI * 36;
  const avatarStrokeOffset = avatarStrokeDash * (1 - lvl.percent / 100);

  return (
    <div className="htb-profile-wrap">
      {!embedded && (
        <header className="htb-profile-header">
          <div className="htb-header-left">
            <div className="htb-avatar-ring-wrap">
              <svg viewBox="0 0 80 80" className="htb-avatar-ring-svg" aria-hidden="true">
                <circle cx="40" cy="40" r="36" className="htb-ring-track" />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  className="htb-ring-fill"
                  strokeDasharray={avatarStrokeDash}
                  strokeDashoffset={avatarStrokeOffset}
                />
              </svg>
              <div className="htb-avatar-inner">
                <Avatar person={target} />
              </div>
              {isOwnProfile && (
                <button
                  type="button"
                  className="htb-avatar-pencil"
                  aria-label="Modifier le résumé du profil"
                  onClick={() => {
                    setTab('about');
                    setEditingSummary(true);
                  }}
                >
                  <Pencil size={12} />
                </button>
              )}
            </div>

            <div className="htb-header-identity">
              <div className="htb-header-name-row">
                <h1>{target.name}</h1>
                {isVerified && <VerifiedBadge />}
                <span className="htb-handle">{handleText}</span>
              </div>
              <div className="htb-header-location">
                <MapPin size={13} aria-hidden="true" />
                <span>{locationText}</span>
              </div>
            </div>
          </div>

          <div className="htb-header-actions">
            {isOwnProfile ? (
              <>
                <button
                  type="button"
                  className="htb-btn-neutral"
                  onClick={() => {
                    setTab('about');
                    setEditingSummary((v) => !v);
                  }}
                >
                  <Edit3 size={14} /> Modifier
                </button>
                <button
                  type="button"
                  className={`htb-btn-visibility ${isPublicVis ? 'is-public' : ''}`}
                  onClick={handleToggleVisibility}
                >
                  {isPublicVis ? 'Profil public ✓' : 'Rendre le profil public'}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="htb-btn-neutral"
                onClick={() => nav('member', target.id)}
              >
                Profil réseau
              </button>
            )}
            <div className="htb-more-anchor">
              <button
                type="button"
                className="htb-btn-icon"
                aria-label="Plus d'options du profil"
                aria-expanded={moreMenuOpen}
                onClick={() => setMoreMenuOpen((v) => !v)}
              >
                <MoreHorizontal size={16} />
              </button>
              {moreMenuOpen && (
                <div className="htb-more-popover" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMoreMenuOpen(false);
                      nav(isOwnProfile ? 'profile' : 'member', isOwnProfile ? undefined : target.id);
                    }}
                  >
                    Ouvrir le profil détaillé
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMoreMenuOpen(false);
                      copyProfileLink();
                    }}
                  >
                    Copier le lien du profil
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Sub-navigation Tabs */}
      <div className="catalog-tabs-underline htb-tabs-bar" role="tablist" aria-label="Vues du parcours et des badges">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'about'}
          className={tab === 'about' ? 'selected' : ''}
          onClick={() => setTab('about')}
        >
          À propos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'badges'}
          className={tab === 'badges' ? 'selected' : ''}
          onClick={() => setTab('badges')}
        >
          Badges ({totalUnlocked}/{badges.length})
        </button>
      </div>

      {/* TAB 1: À PROPOS (HTB About 2-Column Layout) */}
      {tab === 'about' && (
        <div className="htb-about-grid">
          <div className="htb-about-left">
            {/* Summary */}
            <section className="htb-section-block" aria-label="Résumé">
              <h2 className="htb-block-heading">Résumé</h2>
              <div className="htb-card">
                {editingSummary && isOwnProfile ? (
                  <form className="wf-form-stack" onSubmit={handleSaveInlineSummary}>
                    <label>
                      Présentation
                      <textarea
                        rows={3}
                        value={bioDraft}
                        onChange={(e) => setBioDraft(e.target.value)}
                        placeholder="Présentez vos objectifs d’apprentissage et vos centres d’entraide..."
                      />
                    </label>
                    <label>
                      Centres d’intérêt (séparés par des virgules)
                      <input
                        value={interestsDraft}
                        onChange={(e) => setInterestsDraft(e.target.value)}
                      />
                    </label>
                    <div className="wf-inline-actions">
                      <button type="submit" className="primary">
                        Enregistrer
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => setEditingSummary(false)}
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="htb-centered-card-body">
                    <p className="htb-card-copy">
                      {bioText || 'Présentez votre parcours et vos objectifs d’apprentissage sur SAVOIR+.'}
                    </p>
                    {isOwnProfile && (
                      <button
                        type="button"
                        className="htb-inline-cta"
                        onClick={() => setEditingSummary(true)}
                      >
                        <Pencil size={13} /> Modifier le résumé
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Level & Rank Card */}
            <section className="htb-card htb-rank-card" aria-label="Niveau et rang">
              <div className="htb-rank-emblem-box" aria-hidden="true">
                <svg viewBox="0 0 88 88" className="htb-rank-shield-svg">
                  <polygon points="44,8 72,24 72,56 44,78 16,56 16,24" className="htb-rank-poly-outer" />
                  <polygon points="44,18 62,28 62,52 44,66 26,52 26,28" className="htb-rank-poly-inner" />
                  <path d="M32 39 L44 50 L56 39" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M36 30 L44 37 L52 30" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="htb-rank-details">
                <div className="htb-rank-top-row">
                  <div className="htb-rank-lvl-label">
                    <span className="muted">Niv</span>
                    <strong className="tabular-nums">{lvl.level}</strong>
                  </div>
                  <div className="htb-rank-bar-wrap">
                    <div className="htb-rank-bar-head">
                      <span className="htb-xp-pill-row">
                        <span>Niveau</span>
                        <span className="htb-xp-tag">XP</span>
                      </span>
                      <span className="tiny muted tabular-nums">
                        {lvl.currentXp}/{lvl.targetXp}
                      </span>
                    </div>
                    <div
                      className="htb-xp-track"
                      role="progressbar"
                      aria-valuenow={lvl.percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Niveau ${lvl.level}`}
                    >
                      <div className="htb-xp-fill" style={{ width: `${Math.max(4, lvl.percent)}%` }} />
                    </div>
                  </div>
                </div>

                <div className="htb-rank-stat-boxes">
                  <div className="htb-rank-subbox">
                    <b>{rankInfo.title}</b>
                    <span>Rang SAVOIR+</span>
                  </div>
                  <div className="htb-rank-subbox">
                    <div className="htb-diamonds" aria-label={`Palier ${rankInfo.tierIndex} sur ${rankInfo.tierMax}`}>
                      {Array.from({ length: rankInfo.tierMax }, (_, i) => (
                        <span
                          key={i}
                          className={`htb-diamond ${i < rankInfo.tierIndex ? 'is-filled' : ''}`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <span>Palier</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Annual Activity Heatmap Card */}
            <section className="htb-card htb-activity-card" aria-label="Activité annuelle">
              <div className="htb-activity-headline">
                <strong className="htb-accent-val tabular-nums">{activity.yearXp} XP</strong>
                <span>acquis sur SAVOIR+</span>
                <span className="status-tag warn">Illustration (démo)</span>
              </div>
              <p className="tiny muted">
                Répartition mensuelle illustrative : l’historique daté de l’activité n’est pas encore enregistré.
              </p>

              <div className="htb-heatmap-grid" role="img" aria-label={`Activité annuelle sur 12 mois : ${activity.yearXp} XP`}>
                {activity.months.map((m) => (
                  <div className="htb-heatmap-col" key={m.label}>
                    <span className="htb-heatmap-month">{m.label}</span>
                    <div className="htb-heatmap-cells">
                      {m.cells.map((level, idx) => (
                        <span key={idx} className={`htb-heat-cell lv-${level}`} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="htb-annual-kpis tabular-nums">
                <div className="htb-annual-kpi">
                  <span>Moyenne hebdo</span>
                  <b>{activity.weeklyAverage} XP</b>
                </div>
                <div className="htb-annual-kpi">
                  <span>XP total</span>
                  <b>{totalXp}</b>
                </div>
                <div className="htb-annual-kpi">
                  <span>Semaines actives</span>
                  <b>
                    {activity.activeWeeks} semaine{activity.activeWeeks > 1 ? 's' : ''}
                  </b>
                </div>
              </div>
            </section>

            {/* Certifications / Validations */}
            <section className="htb-section-block" aria-label="Attestations">
              <h2 className="htb-block-heading">Attestations & Validations</h2>
              <div className="htb-card">
                {completedModules.length > 0 ? (
                  <div className="htb-list-stack">
                    {moduleMetrics
                      .filter((m) => m.pctVal === 100)
                      .map((m) => (
                        <div className="htb-earned-row" key={m.mod.id}>
                          <div>
                            <b>{m.mod.title}</b>
                            <small className="tiny muted">
                              {m.mod.review} · Score {m.qScore}/{m.qLen}
                            </small>
                          </div>
                          <span className="status-tag ok">Validé</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="htb-centered-card-body">
                    <p className="htb-card-copy">
                      Terminez un module interactif et son quiz pour enregistrer votre première attestation de parcours.
                    </p>
                    <button
                      type="button"
                      className="htb-inline-cta"
                      onClick={() => (openReader ? openReader('phishing', 0) : nav('catalog'))}
                    >
                      Commencer un module <ArrowUpRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Achievements / Parcours */}
            <section className="htb-section-block" aria-label="Réalisations">
              <h2 className="htb-block-heading">Réalisations</h2>
              <div className="htb-card">
                <div className="htb-centered-card-body">
                  {completedModules.length === 3 ? (
                    <>
                      <p className="htb-card-copy">
                        Parcours <b>Fondamentaux IT</b> entièrement complété (3/3 modules validés).
                      </p>
                      <button type="button" className="htb-inline-cta" onClick={() => setTab('badges')}>
                        Voir mes badges <ArrowUpRight size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="htb-card-copy">
                        Aucun parcours complet terminé pour l’instant. Lancez-vous dans un parcours structuré.
                      </p>
                      <button type="button" className="htb-inline-cta" onClick={() => nav('path-detail', 'fondamentaux-it')}>
                        Explorer les parcours <ArrowUpRight size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* Events / Ateliers */}
            <section className="htb-section-block" aria-label="Ateliers et défis">
              <h2 className="htb-block-heading">Ateliers & Défis</h2>
              <div className="htb-card">
                <div className="htb-centered-card-body">
                  <p className="htb-card-copy">
                    {postsCount + repliesCount > 0
                      ? `${postsCount + repliesCount} contribution(s) active(s) dans le fil d’entraide SAVOIR+.`
                      : 'Participez aux discussions d’entraide pour partager vos astuces et progresser en groupe.'}
                  </p>
                  <button type="button" className="htb-inline-cta" onClick={() => nav('community')}>
                    Découvrir l’entraide <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT SIDEBAR COLUMN */}
          <aside className="htb-about-right" aria-label="Repères latéraux">
            <section className="htb-section-block">
              <h2 className="htb-block-heading">Réseaux & Liens</h2>
              <div className="htb-card">
                <div className="htb-centered-card-body">
                  <p className="htb-card-copy htb-url-line">
                    <Globe size={14} aria-hidden="true" /> {profileUrl}
                  </p>
                  <button
                    type="button"
                    className="htb-inline-cta"
                    onClick={copyProfileLink}
                  >
                    <Copy size={13} /> Copier le lien du profil
                  </button>
                </div>
              </div>
            </section>

            {/* Weekly Streak */}
            <section className="htb-section-block">
              <h2 className="htb-block-heading">
                Série hebdomadaire <span className="status-tag warn">Illustration (démo)</span>
              </h2>
              <div className="htb-card htb-streak-card">
                <div className="htb-streak-flame-row">
                  <span className="htb-flame-badge" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="htb-flame-svg">
                      <path
                        d="M12.3 2.2c.3 2.6-.7 4.4-2.1 5.9-1.1 1.2-2.2 2.4-2.2 4.3 0 1 .4 1.9 1.1 2.6-.5-.7-.6-1.6-.2-2.4.5-.9 1.5-1.4 2.1-2.5.4 1.2 1.2 1.9 2.1 2.7 1 .9 1.9 1.8 1.9 3.4 0 2.1-1.6 3.8-3.8 3.8-2.9 0-5.2-2.3-5.2-5.3 0-3 1.7-5.5 3.6-7.6 1.1-1.2 2.1-2.5 2.7-4.9z"
                        fill="currentColor"
                      />
                      <path
                        d="M12 2.2c3.9 2.9 6.5 6.8 6.5 11.1 0 4.3-3.1 7.7-7.1 7.7-3.9 0-6.9-3.1-6.9-7 0-3.3 1.8-6 4.1-8.4C10 4.1 11.2 3.1 12 2.2z"
                        fill="currentColor"
                        opacity="0.92"
                      />
                      <rect x="11.2" y="9" width="1.6" height="5.2" rx="0.8" fill="#ffffff" />
                      <circle cx="12" cy="16.4" r="0.95" fill="#ffffff" />
                    </svg>
                  </span>
                  <strong className="htb-streak-value tabular-nums">
                    {activity.streakWeeks} semaine{activity.streakWeeks > 1 ? 's' : ''}
                  </strong>
                </div>

                <div className="htb-rank-bar-wrap">
                  <div className="htb-rank-bar-head">
                    <span className="htb-xp-pill-row">
                      <span>Hebdo</span>
                      <span className="htb-xp-tag">XP</span>
                    </span>
                    <span className="tiny muted tabular-nums">
                      {activity.weeklyXp}/{activity.weeklyTarget}
                    </span>
                  </div>
                  <div
                    className="htb-xp-track"
                    role="progressbar"
                    aria-valuenow={Math.min(100, Math.round((activity.weeklyXp / activity.weeklyTarget) * 100))}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Objectif XP hebdomadaire"
                  >
                    <div
                      className={`htb-xp-fill ${activity.weeklyXp >= activity.weeklyTarget ? '' : 'is-streak'}`}
                      style={{
                        width: `${activity.weeklyXp > 0 ? Math.max(6, Math.min(100, Math.round((activity.weeklyXp / activity.weeklyTarget) * 100))) : 0}%`
                      }}
                    />
                  </div>
                </div>

                <div className="htb-streak-saver-row">
                  <span className="htb-streak-saver-label">Protection de série</span>
                  <div className="htb-streak-savers" aria-label="3 protections de série">
                    {[0, 1, 2].map((slot) => (
                      <span
                        key={slot}
                        className={`htb-snowflake-slot ${slot === 0 && activity.streakWeeks >= 2 ? 'is-ready' : ''}`}
                        aria-hidden="true"
                      >
                        <Snowflake size={16} />
                      </span>
                    ))}
                  </div>
                </div>

                <div className={`htb-streak-alert ${activity.weeklyXp >= activity.weeklyTarget ? 'is-ok' : ''}`}>
                  <AlertTriangle size={14} aria-hidden="true" />
                  <span>
                    {activity.weeklyXp >= activity.weeklyTarget ? (
                      'Objectif hebdomadaire illustratif atteint.'
                    ) : (
                      <>
                        Objectif hebdomadaire illustratif : encore{' '}
                        <strong className="htb-streak-alert-em tabular-nums">
                          {activity.weeklyTarget - activity.weeklyXp} XP
                        </strong>
                        . La série réelle, fondée sur les dates, arrive avec le calendrier.
                      </>
                    )}
                  </span>
                </div>
              </div>
            </section>

            {/* Top Interests */}
            <section className="htb-section-block">
              <h2 className="htb-block-heading">Centres d’intérêt</h2>
              <div className="htb-card">
                <div className="htb-centered-card-body">
                  {skillTags.length > 0 ? (
                    <div className="htb-pill-list">
                      {skillTags.map((tag) => (
                        <span key={tag} className="htb-tag-chip">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="htb-card-copy">Indiquez vos thèmes favoris pour personnaliser vos repères.</p>
                  )}
                  {isOwnProfile && (
                    <button
                      type="button"
                      className="htb-inline-cta"
                      onClick={() => setEditingSummary(true)}
                    >
                      <Pencil size={13} /> Modifier les intérêts
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Badges Preview Card */}
            <section className="htb-section-block">
              <h2 className="htb-block-heading">Badges</h2>
              <div className="htb-card htb-badges-preview-card">
                <div className="htb-preview-hex-row">
                  {previewBadges.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className="htb-preview-hex-btn"
                      title={`${b.title} — ${b.earned ? 'Obtenu' : 'Verrouillé'}`}
                      onClick={() => setTab('badges')}
                    >
                      <HexBadgeEmblem iconKey={b.iconKey} earned={b.earned} size="sm" />
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="htb-view-all-btn"
                  onClick={() => setTab('badges')}
                >
                  Tout voir ({totalUnlocked}/{badges.length})
                </button>
              </div>
            </section>

            {/* Skills */}
            <section className="htb-section-block">
              <h2 className="htb-block-heading">Compétences</h2>
              <div className="htb-card">
                <div className="htb-centered-card-body">
                  {earnedSkills.length > 0 ? (
                    <div className="htb-pill-list">
                      {earnedSkills.map((sk) => (
                        <span key={sk} className="htb-tag-chip is-accent">
                          {sk}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="htb-card-copy">Mettez en avant les compétences acquises via vos modules.</p>
                  )}
                  <button
                    type="button"
                    className="htb-inline-cta"
                    onClick={() => (isOwnProfile ? setEditingSummary(true) : nav('catalog'))}
                  >
                    <Pencil size={13} /> {isOwnProfile ? 'Mettre à jour' : 'Explorer les modules'}
                  </button>
                </div>
              </div>
            </section>

            {/* Domains / Toolstack */}
            <section className="htb-section-block">
              <h2 className="htb-block-heading">Domaines & Outils</h2>
              <div className="htb-card">
                <div className="htb-centered-card-body">
                  {studiedDomains.length > 0 ? (
                    <div className="htb-pill-list">
                      {studiedDomains.map((d) => (
                        <span key={d} className="htb-tag-chip">
                          {d}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="htb-card-copy">Vos domaines pratiqués apparaîtront ici au fil de vos leçons.</p>
                  )}
                  <button type="button" className="htb-inline-cta" onClick={() => nav('catalog')}>
                    <Pencil size={13} /> Explorer les domaines
                  </button>
                </div>
              </div>
            </section>

            {/* Languages */}
            <section className="htb-section-block">
              <h2 className="htb-block-heading">Langues</h2>
              <div className="htb-card">
                <div className="htb-centered-card-body">
                  <div className="htb-pill-list">
                    <span className="htb-tag-chip">{ext.appPrefs.language || 'Français'}</span>
                  </div>
                  {isOwnProfile && (
                    <button type="button" className="htb-inline-cta" onClick={() => nav('settings')}>
                      <Pencil size={13} /> Régler la langue
                    </button>
                  )}
                </div>
              </div>
            </section>
          </aside>
        </div>
      )}

      {/* TAB 2: BADGES (HTB Badges Grid + Collapsible Categories + Filter Switch) */}
      {tab === 'badges' && (
        <div className="htb-badges-view">
          <div className="htb-badges-toolbar">
            <div className="htb-badges-track-pills" role="group" aria-label="Catégorie principale de badges">
              <button
                type="button"
                className={`htb-track-pill ${badgeTrack === 'all' ? 'active' : ''}`}
                onClick={() => setBadgeTrack('all')}
              >
                Tous ({totalUnlocked}/{badges.length})
              </button>
              <button
                type="button"
                className={`htb-track-pill ${badgeTrack === 'learning' ? 'active' : ''}`}
                onClick={() => setBadgeTrack('learning')}
              >
                Apprentissage ({learningUnlocked}/{learningBadges.length})
              </button>
              <button
                type="button"
                className={`htb-track-pill ${badgeTrack === 'community' ? 'active' : ''}`}
                onClick={() => setBadgeTrack('community')}
              >
                Communauté & Entraide ({communityUnlocked}/{communityBadges.length})
              </button>
            </div>

            <label className="htb-completed-switch">
              <input
                type="checkbox"
                checked={onlyCompleted}
                onChange={(e) => setOnlyCompleted(e.target.checked)}
              />
              <span className="htb-switch-track" aria-hidden="true">
                <span className="htb-switch-knob" />
              </span>
              <span>Afficher uniquement obtenus</span>
            </label>
          </div>

          <div className="htb-badge-categories">
            {CATEGORY_META.filter((cat) => badgeTrack === 'all' || cat.track === badgeTrack).map((cat) => {
              const catItemsAll = badges.filter((b) => b.category === cat.id);
              const catUnlocked = catItemsAll.filter((b) => b.earned).length;
              const visibleItems = onlyCompleted ? catItemsAll.filter((b) => b.earned) : catItemsAll;
              const isCollapsed = collapsedCats[cat.id];

              return (
                <section className="htb-badge-cat-section" key={cat.id}>
                  <button
                    type="button"
                    className="htb-badge-cat-header"
                    aria-expanded={!isCollapsed}
                    onClick={() =>
                      setCollapsedCats((prev) => ({
                        ...prev,
                        [cat.id]: !prev[cat.id]
                      }))
                    }
                  >
                    <span className="htb-badge-cat-title">{cat.label}</span>
                    <span className="htb-badge-cat-meta tabular-nums">
                      <span>
                        {catUnlocked}/{catItemsAll.length}
                      </span>
                      {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </span>
                  </button>

                  {!isCollapsed && (
                    visibleItems.length === 0 ? (
                      <div className="htb-badge-empty-cat">
                        <p className="tiny muted">
                          Aucun badge obtenu dans « {cat.label} » pour le moment.
                        </p>
                      </div>
                    ) : (
                      <div className="htb-badges-grid">
                        {visibleItems.map((badge) => (
                          <article
                            key={badge.id}
                            className={`htb-badge-card ${badge.earned ? 'is-earned' : 'is-locked'}`}
                          >
                            <HexBadgeEmblem iconKey={badge.iconKey} earned={badge.earned} size="md" />
                            <h3>{badge.title}</h3>
                            <p>{badge.description}</p>
                            {badge.earned && (
                              <span className="htb-badge-earned-tag">
                                <Check size={12} aria-hidden="true" /> Obtenu
                              </span>
                            )}
                          </article>
                        ))}
                      </div>
                    )
                  )}
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
