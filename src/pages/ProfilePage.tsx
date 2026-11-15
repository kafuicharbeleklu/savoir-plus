import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  Eye,
  Flag,
  Globe,
  Layers,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  ShieldCheck,
  UserPlus,
  Users
} from 'lucide-react';
import { EmptyState } from '../components/ui';
import type { Profile, Progress, Relation } from '../data';
import { isQuizPassed, moduleProgressPercent } from '../domain.mjs';
import { builtInAnswerKey } from '../content';
import {
  computeGlobalLevel,
  resolveAlgorithmicDiscoverProfiles,
  resolveCommunityDirectory,
  resolveProfileVerified
} from '../personas';
import { CATALOG_ITEMS, type AppPage, type ExtendedDemoState } from '../wireframeData';
import { Avatar, VerifiedBadge } from '../components/ProfileIdentityCard';
import { RightRailShowcaseCard, type FooterInfoTopic } from '../components/SidebarFooters';
import { PedagogicalProfileView } from '../components/PedagogicalProfileView';

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

export function ProfilePage({
  isOwnProfile,
  target,
  currentUser,
  ext,
  people,
  relations,
  myFollowing,
  totalXP,
  getModuleProgress,
  lessonCounts,
  onSaveProfile,
  onToggleFollow,
  onOpenChatDrawer,
  onRequestContact,
  onReportTarget,
  onOpenComposer,
  onOpenInfoModal,
  nav,
  openSettingsTab,
  setToast,
  progress,
  updateExt,
  openReader
}: ProfilePageProps) {
  const details = ext.profileDetails[target.id];
  const tagline = details?.tagline || target.role;
  const locationText = details?.location || 'Lomé, Région Maritime';
  const bioText = details?.bio || target.bio || 'Membre actif sur SAVOIR+.';
  const interestsRaw = details?.interests || 'Numérique, Entraide, Apprentissage';
  const skillTags = interestsRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const isVerified = resolveProfileVerified(target.id, ext.adminUsers, details?.verified);

  const [editOpen, setEditOpen] = useState(false);
  const [coordsOpen, setCoordsOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<'profile' | 'htb-about' | 'htb-badges'>('profile');
  const [activityTab, setActivityTab] = useState<'posts' | 'comments' | 'resources'>('posts');
  const [nameInput, setNameInput] = useState(target.name);
  const [taglineInput, setTaglineInput] = useState(tagline);
  const [locationInput, setLocationInput] = useState(locationText);
  const [bioInput, setBioInput] = useState(bioText);
  const [interestsInput, setInterestsInput] = useState(interestsRaw);

  useEffect(() => {
    setProfileTab('profile');
    setEditOpen(false);
    setCoordsOpen(false);
    setNameInput(target.name);
    setTaglineInput(tagline);
    setLocationInput(locationText);
    setBioInput(bioText);
    setInterestsInput(interestsRaw);
  }, [target.id, target.name, tagline, locationText, bioText, interestsRaw]);

  const dynamicCatalog = CATALOG_ITEMS;
  const firstNameLower = target.name.split(' ')[0].toLowerCase();
  const authoredCatalog = dynamicCatalog.filter((c) =>
    c.author.toLowerCase().includes(firstNameLower)
  );
  const memberPosts = ext.posts.filter((p) => p.authorId === target.id);
  const memberComments = ext.posts.flatMap((p) =>
    p.replies
      .filter((r) => r.authorId === target.id)
      .map((r) => ({ post: p, reply: r }))
  );

  const lvl = computeGlobalLevel(totalXP);
  const acceptedCount = relations.filter(
    (r) => r.members.includes(target.id) && r.status === 'accepted'
  ).length;
  const followingCount = (ext.followingIds[target.id] || (isOwnProfile ? myFollowing : [])).length;

  const currentRel = !isOwnProfile
    ? relations.find((r) => r.members.includes(currentUser.id) && r.members.includes(target.id))
    : undefined;
  const isFollowed = myFollowing.includes(target.id);
  // Préférences › Visibilité du membre consulté : demandes de discussion et progression.
  const contactPolicy = details?.contactPolicy || 'Membres autorisés';
  const targetFollowsMe = (ext.followingIds[target.id] || []).includes(currentUser.id);
  const acceptsMyRequest =
    contactPolicy === 'Membres autorisés' || (contactPolicy === 'Personnes que je suis' && targetFollowsMe);
  const progressionHidden = !isOwnProfile && (details?.xpVisibility || 'Moi uniquement') !== 'Membres';

  const networkDirectory = resolveCommunityDirectory(people, ext);
  const suggestPeople = resolveAlgorithmicDiscoverProfiles(
    networkDirectory,
    currentUser.id,
    myFollowing,
    ext,
    6
  )
    .filter((entry) => entry.profile.id !== target.id)
    .slice(0, 4);

  const suggestedCatalog = dynamicCatalog
    .filter((item) => item.type === 'module' || item.type === 'path')
    .slice(0, 2);

  const totalReactionsReceived = memberPosts.reduce(
    (acc, post) => acc + (post.helpfulBy?.length || 0) + post.replies.length,
    0
  );

  const completedModulesCount = ['phishing', 'reseaux', 'comptes'].filter(
    (id) => isQuizPassed(getModuleProgress(id), builtInAnswerKey(id))
  ).length;

  const activeModule =
    dynamicCatalog.find((c) => c.id === 'reseaux') || dynamicCatalog[0];
  const activePct = activeModule
    ? moduleProgressPercent(
        getModuleProgress(activeModule.id),
        lessonCounts[activeModule.id] || 3,
        builtInAnswerKey(activeModule.id)
      )
    : 0;

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

  const handleCopyUrl = copyProfileLink;

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveProfile) return;
    await onSaveProfile(nameInput, taglineInput, locationInput, bioInput, interestsInput);
    setEditOpen(false);
  };

  return (
    <div className="profile-page-wrap">
      {!isOwnProfile && (
        <div className="profile-back-row">
          <button type="button" className="back-link" onClick={() => nav('relations')}>
            ← Retour aux relations
          </button>
        </div>
      )}

      <div className="catalog-tabs-underline profile-mode-tabs" role="tablist" aria-label="Vues du profil">
        <button
          type="button"
          role="tab"
          aria-selected={profileTab === 'profile'}
          className={profileTab === 'profile' ? 'selected' : ''}
          onClick={() => setProfileTab('profile')}
        >
          Profil
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={profileTab === 'htb-about'}
          className={profileTab === 'htb-about' ? 'selected' : ''}
          onClick={() => setProfileTab('htb-about')}
        >
          Parcours &amp; XP
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={profileTab === 'htb-badges'}
          className={profileTab === 'htb-badges' ? 'selected' : ''}
          onClick={() => setProfileTab('htb-badges')}
        >
          Badges
        </button>
      </div>

      {profileTab !== 'profile' && progressionHidden ? (
        <section className="profile-section-card">
          <EmptyState
            title="Progression privée"
            text={`${target.name} a choisi de ne pas afficher son niveau, ses XP ni ses badges.`}
          />
        </section>
      ) : profileTab !== 'profile' ? (
        <PedagogicalProfileView
          key={`${target.id}-${profileTab}`}
          target={target}
          isOwnProfile={isOwnProfile}
          ext={ext}
          updateExt={updateExt}
          relations={relations}
          myFollowing={myFollowing}
          progress={progress || { lessons: [], answers: [], submitted: false }}
          getModuleProgress={getModuleProgress}
          openReader={openReader}
          onSaveProfile={onSaveProfile}
          nav={nav}
          setToast={setToast}
          initialTab={profileTab === 'htb-badges' ? 'badges' : 'about'}
        />
      ) : (
      <div className="profile-page-grid">
        {/* Main Profile Column */}
        <div className="profile-main-col">
          {/* 1. Hero Card */}
          <section className="profile-section-card profile-hero-card" aria-label="En-tête du profil">
            <div className="profile-hero-cover">
              <svg
                viewBox="0 0 900 180"
                preserveAspectRatio="none"
                className="profile-hero-cover-art"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="savoirCoverGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#1B3C33" />
                    <stop offset="52%" stopColor="#265A4B" />
                    <stop offset="100%" stopColor="#8E6C4F" />
                  </linearGradient>
                </defs>
                <rect width="900" height="180" fill="url(#savoirCoverGrad)" />
                <circle cx="760" cy="48" r="110" fill="rgba(255,255,255,0.06)" />
                <circle cx="670" cy="140" r="90" fill="rgba(255,214,130,0.08)" />
                <path
                  d="M0 148 Q 220 96 460 132 T 900 108 L 900 180 L 0 180 Z"
                  fill="rgba(12, 22, 19, 0.22)"
                />
              </svg>
              {isOwnProfile && (
                <button
                  type="button"
                  className="profile-cover-edit-btn"
                  aria-label="Modifier les informations du profil"
                  onClick={() => setEditOpen((v) => !v)}
                >
                  <Pencil size={15} />
                </button>
              )}
            </div>

            <div className="profile-hero-body">
              <div className="profile-avatar-row">
                <div className="profile-hero-avatar-wrap">
                  <Avatar person={target} />
                </div>
                {isOwnProfile && (
                  <button
                    type="button"
                    className="profile-icon-edit-btn"
                    aria-label="Modifier mon profil"
                    onClick={() => setEditOpen((v) => !v)}
                  >
                    <Pencil size={16} />
                  </button>
                )}
              </div>

              <div className="profile-identity-columns">
                <div className="profile-identity-primary">
                  <div className="mini-profile-name-row">
                    <h1>{target.name}</h1>
                    {isVerified && <VerifiedBadge />}
                  </div>
                  <p className="profile-hero-headline">{tagline}</p>
                  <div className="profile-location-row">
                    <span className="profile-location-chip">
                      <MapPin size={13} aria-hidden="true" />
                      <span>{locationText}</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <button
                      type="button"
                      className="profile-inline-link"
                      aria-expanded={coordsOpen}
                      onClick={() => setCoordsOpen((v) => !v)}
                    >
                      Coordonnées
                    </button>
                  </div>

                  {coordsOpen && (
                    <div className="profile-coords-popover">
                      <p>
                        <b>Identifiant membre :</b> {profileUrl}
                      </p>
                      <p>
                        <b>Préférence de contact :</b> {details?.contactPolicy || 'Membres autorisés'}
                      </p>
                      {isOwnProfile && (
                        <p>
                          <b>Audience du profil :</b> {details?.profileVisibility || 'Membres'}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="profile-connections-row tabular-nums">
                    <button
                      type="button"
                      className="profile-inline-link"
                      onClick={() => nav('relations')}
                    >
                      {Math.max(acceptedCount, followingCount)} relations · {followingCount} abonnement
                      {followingCount > 1 ? 's' : ''}
                    </button>
                  </div>
                </div>

                <div className="profile-org-list" aria-label="Parcours et communauté">
                  <div className="profile-org-item">
                    <span className="profile-org-badge" aria-hidden="true">
                      <BookOpen size={14} />
                    </span>
                    <span>SAVOIR+ Académie</span>
                  </div>
                  <div className="profile-org-item">
                    <span className="profile-org-badge is-alt" aria-hidden="true">
                      <ShieldCheck size={14} />
                    </span>
                    <span>Cohorte Lomé Numérique</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="profile-hero-actions">
                {isOwnProfile ? (
                  <>
                    <button
                      type="button"
                      className="primary"
                      onClick={() => nav('learning')}
                    >
                      Mes objectifs
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => setEditOpen((v) => !v)}
                    >
                      <Edit3 size={14} /> {editOpen ? 'Fermer l’édition' : 'Modifier le profil'}
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => openSettingsTab('privacy')}
                    >
                      Améliorer la visibilité
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className={`follow-btn ${isFollowed ? 'is-following' : 'is-idle'}`}
                      onClick={() => onToggleFollow(target.id)}
                      aria-pressed={isFollowed}
                    >
                      {isFollowed ? <Check size={14} /> : <UserPlus size={14} />}
                      {isFollowed ? 'Suivi' : 'Suivre'}
                    </button>
                    {currentRel?.status === 'accepted' ? (
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => onOpenChatDrawer(currentRel.id)}
                      >
                        <MessageCircle size={14} /> Ouvrir la discussion
                      </button>
                    ) : currentRel?.status === 'pending' ? (
                      <span className="status-tag warn">Demande en attente</span>
                    ) : onRequestContact && acceptsMyRequest ? (
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => onRequestContact(target)}
                      >
                        <MessageCircle size={14} /> Demander à discuter
                      </button>
                    ) : onRequestContact ? (
                      <span className="tiny muted">
                        {contactPolicy === 'Personne'
                          ? 'Ce membre ne reçoit pas de demandes de discussion.'
                          : 'Ce membre accepte les demandes des personnes qu’il suit.'}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      className="secondary danger"
                      onClick={() => onReportTarget(`Profil de ${target.name}`)}
                    >
                      <Flag size={14} /> Signaler
                    </button>
                  </>
                )}
              </div>

              {/* Inline Edit Panel (Owner only) */}
              {isOwnProfile && editOpen && (
                <form className="profile-edit-panel wf-form-stack" onSubmit={handleSaveSubmit}>
                  <div className="between">
                    <h3>Modifier mes informations publiques</h3>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => setEditOpen(false)}
                    >
                      Annuler
                    </button>
                  </div>
                  <div className="wf-two-inputs">
                    <label>
                      Nom d’affichage
                      <input
                        required
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                      />
                    </label>
                    <label>
                      Localisation
                      <input
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                        placeholder="Ex. Lomé, Région Maritime"
                      />
                    </label>
                  </div>
                  <label>
                    Accroche / Titre
                    <input
                      value={taglineInput}
                      onChange={(e) => setTaglineInput(e.target.value)}
                    />
                  </label>
                  <label>
                    Présentation / Infos
                    <textarea
                      rows={3}
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                    />
                  </label>
                  <label>
                    Domaines & compétences (séparés par des virgules)
                    <input
                      value={interestsInput}
                      onChange={(e) => setInterestsInput(e.target.value)}
                    />
                  </label>
                  <div className="wf-inline-actions">
                    <button type="submit" className="primary">
                      <CheckCircle2 size={15} /> Enregistrer le profil
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => setEditOpen(false)}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}

              {/* Subtle Highlight Callout Row */}
              <div className="profile-callout-row">
                {isOwnProfile ? (
                  <>
                    <div className="profile-callout-box">
                      <div className="between">
                        <b>À l’écoute d’entraide et de partage</b>
                        <button
                          type="button"
                          className="profile-icon-edit-btn is-xs"
                          aria-label="Régler les préférences de contact"
                          onClick={() => openSettingsTab('privacy')}
                        >
                          <Pencil size={13} />
                        </button>
                      </div>
                      <p className="tiny muted">
                        {skillTags.slice(0, 3).join(' · ') || 'Numérique & Entraide'}
                      </p>
                      <button
                        type="button"
                        className="profile-inline-link"
                        onClick={() => openSettingsTab('privacy')}
                      >
                        Modifier la visibilité
                      </button>
                    </div>
                    <div className="profile-callout-box">
                      <div className="between">
                        <b>Objectif d’apprentissage en cours</b>
                        <span className="tiny muted tabular-nums">{activePct}%</span>
                      </div>
                      <p className="tiny muted">{activeModule?.title || 'Comprendre les réseaux'}</p>
                      <button
                        type="button"
                        className="profile-inline-link"
                        onClick={() => nav('learning')}
                      >
                        Continuer mon apprentissage
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="profile-callout-box">
                      <b>Politique de contact</b>
                      <p className="tiny muted">{details?.contactPolicy || 'Membres autorisés'}</p>
                    </div>
                    <div className="profile-callout-box">
                      <b>Audience et confidentialité</b>
                      <p className="tiny muted">
                        Profil visible : {details?.profileVisibility || 'Membres'} · Progression privée
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* 2. Statistiques (Owner private card) */}
          {isOwnProfile && (
            <section className="profile-section-card" aria-label="Statistiques personnelles">
              <div className="profile-section-head">
                <div>
                  <h2>Statistiques</h2>
                  <p className="profile-private-note">
                    <Eye size={13} aria-hidden="true" /> Privé — visible uniquement par vous
                  </p>
                </div>
              </div>
              <div className="profile-stat-grid tabular-nums">
                <button
                  type="button"
                  className="profile-stat-item"
                  onClick={() => nav('learning')}
                >
                  <Users size={18} aria-hidden="true" />
                  <div>
                    <b>{completedModulesCount} / 3 modules validés</b>
                    <span>Consultez votre progression dans Mes apprentissages.</span>
                  </div>
                </button>
                <button
                  type="button"
                  className="profile-stat-item"
                  onClick={() => nav('home')}
                >
                  <Layers size={18} aria-hidden="true" />
                  <div>
                    <b>{totalReactionsReceived} interactions d’entraide</b>
                    <span>Réactions utiles et réponses sur vos publications.</span>
                  </div>
                </button>
                <button
                  type="button"
                  className="profile-stat-item"
                  onClick={() => nav('progression')}
                >
                  <Award size={18} aria-hidden="true" />
                  <div>
                    <b>Niveau {lvl.level} · {totalXP} XP</b>
                    <span>Indicateur de démonstration pour votre parcours.</span>
                  </div>
                </button>
              </div>
              <button
                type="button"
                className="profile-section-footer-btn"
                onClick={() => nav('progression')}
              >
                Tout afficher <ArrowRight size={15} />
              </button>
            </section>
          )}

          {/* 3. Infos */}
          <section className="profile-section-card" aria-label="À propos du membre">
            <div className="profile-section-head">
              <h2>Infos</h2>
              {isOwnProfile && (
                <button
                  type="button"
                  className="profile-icon-edit-btn"
                  aria-label="Modifier la bio"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil size={15} />
                </button>
              )}
            </div>
            <p className="profile-about-text">{bioText}</p>
            <button
              type="button"
              className="profile-skills-box"
              onClick={() => nav(isOwnProfile ? 'progression' : 'catalog')}
            >
              <div>
                <div className="profile-skills-box-title">
                  <Award size={16} aria-hidden="true" />
                  <b>Compétences principales</b>
                </div>
                <p className="tiny muted">
                  {skillTags.join(' · ') || 'Vigilance numérique · Entraide'}
                </p>
              </div>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </section>

          {/* 4. Domaines & Entraide */}
          <section className="profile-section-card" aria-label="Domaines et entraide">
            <div className="profile-section-head">
              <h2>Domaines & Entraide</h2>
              {isOwnProfile && (
                <button
                  type="button"
                  className="profile-icon-edit-btn"
                  aria-label="Modifier les centres d'intérêt"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil size={15} />
                </button>
              )}
            </div>
            <div className="profile-domain-tags">
              {skillTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="profile-domain-tag"
                  onClick={() => nav('catalog')}
                >
                  {tag}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="profile-section-footer-btn"
              onClick={() => nav('catalog')}
            >
              Tout afficher <ArrowRight size={15} />
            </button>
          </section>

          {/* 5. Sélection */}
          <section className="profile-section-card" aria-label="Sélection mise en avant">
            <div className="profile-section-head">
              <h2>Sélection</h2>
              {isOwnProfile && onOpenComposer && (
                <button
                  type="button"
                  className="profile-icon-edit-btn"
                  aria-label="Publier une nouvelle contribution"
                  onClick={onOpenComposer}
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
            <div className="profile-selection-track">
              {authoredCatalog.slice(0, 2).map((c) => {
                const dest =
                  c.type === 'resource'
                    ? 'resource-detail'
                    : c.type === 'path'
                      ? 'path-detail'
                      : 'module-detail';
                return (
                  <button
                    key={c.id}
                    type="button"
                    className="profile-selection-card"
                    onClick={() => nav(dest, c.id)}
                  >
                    <span className="profile-selection-kind">{c.type === 'path' ? 'Parcours' : c.type === 'resource' ? 'Ressource' : 'Module'}</span>
                    <b>{c.title}</b>
                    <p className="tiny muted">{c.summary}</p>
                    <span className="profile-selection-meta">
                      {c.domain} · {c.duration}
                    </span>
                  </button>
                );
              })}
              {memberPosts.slice(0, 2).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="profile-selection-card"
                  onClick={() => nav('community-thread', p.id)}
                >
                  <span className="profile-selection-kind">
                    {p.kind === 'question' ? 'Question d’entraide' : 'Publication'}
                  </span>
                  <b>{p.title}</b>
                  <p className="tiny muted">{p.body}</p>
                  <span className="profile-selection-meta tabular-nums">
                    {(p.helpfulBy?.length || 0)} utile(s) · {p.replies.length} réponse(s)
                  </span>
                </button>
              ))}
              {authoredCatalog.length === 0 && memberPosts.length === 0 && (
                <p className="tiny muted">Aucune contribution sélectionnée pour le moment.</p>
              )}
            </div>
          </section>

          {/* 6. Activité */}
          <section className="profile-section-card" aria-label="Activité communautaire">
            <div className="profile-section-head">
              <div>
                <h2>Activité</h2>
                <p className="tiny muted tabular-nums">
                  {followingCount} abonnement{followingCount > 1 ? 's' : ''} · {memberPosts.length} publication
                  {memberPosts.length > 1 ? 's' : ''}
                </p>
              </div>
              {isOwnProfile && onOpenComposer && (
                <button type="button" className="secondary" onClick={onOpenComposer}>
                  Créer un post
                </button>
              )}
            </div>

            <div className="profile-activity-tabs" role="tablist" aria-label="Filtrer l'activité">
              <button
                type="button"
                role="tab"
                aria-selected={activityTab === 'posts'}
                className={activityTab === 'posts' ? 'active' : ''}
                onClick={() => setActivityTab('posts')}
              >
                Posts ({memberPosts.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activityTab === 'comments'}
                className={activityTab === 'comments' ? 'active' : ''}
                onClick={() => setActivityTab('comments')}
              >
                Commentaires ({memberComments.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activityTab === 'resources'}
                className={activityTab === 'resources' ? 'active' : ''}
                onClick={() => setActivityTab('resources')}
              >
                Ressources ({authoredCatalog.length})
              </button>
            </div>

            <div className="profile-activity-list">
              {activityTab === 'posts' && (
                memberPosts.length === 0 ? (
                  <p className="tiny muted">Aucune publication récente dans le fil.</p>
                ) : (
                  memberPosts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="profile-activity-row"
                      onClick={() => nav('community-thread', p.id)}
                    >
                      <div className="between">
                        <b>{p.title}</b>
                        <span className="tiny muted">{p.createdAt}</span>
                      </div>
                      <p className="tiny muted">{p.body}</p>
                      <span className="tiny muted tabular-nums">
                        {p.domain} · {p.helpfulBy?.length || 0} utile(s) · {p.replies.length} commentaire(s)
                      </span>
                    </button>
                  ))
                )
              )}

              {activityTab === 'comments' && (
                memberComments.length === 0 ? (
                  <p className="tiny muted">Aucun commentaire publié récemment.</p>
                ) : (
                  memberComments.map(({ post, reply }) => (
                    <button
                      key={reply.id}
                      type="button"
                      className="profile-activity-row"
                      onClick={() => nav('community-thread', post.id)}
                    >
                      <div className="between">
                        <b>Sur : {post.title}</b>
                        <span className="tiny muted">{reply.createdAt}</span>
                      </div>
                      <p className="tiny muted">« {reply.text} »</p>
                    </button>
                  ))
                )
              )}

              {activityTab === 'resources' && (
                authoredCatalog.length === 0 ? (
                  <p className="tiny muted">Aucune ressource publiée au catalogue pour ce profil.</p>
                ) : (
                  authoredCatalog.map((c) => {
                    const dest =
                      c.type === 'resource'
                        ? 'resource-detail'
                        : c.type === 'path'
                          ? 'path-detail'
                          : 'module-detail';
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className="profile-activity-row"
                        onClick={() => nav(dest, c.id)}
                      >
                        <div className="between">
                          <b>{c.title}</b>
                          <span className="tiny muted">{c.duration}</span>
                        </div>
                        <p className="tiny muted">{c.summary}</p>
                      </button>
                    );
                  })
                )
              )}
            </div>

            <button
              type="button"
              className="profile-section-footer-btn"
              onClick={() => nav('home')}
            >
              Tout afficher <ArrowRight size={15} />
            </button>
          </section>

          {/* 7. Formation & Parcours */}
          <section className="profile-section-card" aria-label="Formation et parcours">
            <div className="profile-section-head">
              <h2>Formation & Parcours</h2>
            </div>
            <div className="wf-stack-sm">
              {dynamicCatalog
                .filter((c) => c.type === 'module' || c.type === 'path')
                .slice(0, 3)
                .map((item) => {
                  const dest = item.type === 'path' ? 'path-detail' : 'module-detail';
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="profile-edu-row"
                      onClick={() => nav(dest, item.id)}
                    >
                      <span className="profile-edu-icon" aria-hidden="true">
                        <BookOpen size={18} />
                      </span>
                      <div className="profile-edu-text">
                        <b>{item.title}</b>
                        <small className="tiny muted">
                          {item.domain} · {item.level} · {item.duration}
                        </small>
                      </div>
                      <ArrowRight size={15} aria-hidden="true" />
                    </button>
                  );
                })}
            </div>
          </section>
        </div>

        {/* Right Rail (300px) */}
        <aside className="profile-right-rail" aria-label="Compléments du profil">
          <section className="rail-card">
            <div className="profile-rail-meta-block">
              <div className="between">
                <h3>Langue du profil</h3>
                {isOwnProfile && (
                  <button
                    type="button"
                    className="profile-icon-edit-btn is-xs"
                    aria-label="Modifier la langue du profil"
                    onClick={() => openSettingsTab('prefs')}
                  >
                    <Globe size={14} />
                  </button>
                )}
              </div>
              <p className="tiny muted">{ext.appPrefs.language}</p>
            </div>

            <div className="wf-divider" />

            <div className="profile-rail-meta-block">
              <div className="between">
                <h3>Profil public et URL</h3>
                <button
                  type="button"
                  className="profile-icon-edit-btn is-xs"
                  aria-label="Copier l'URL du profil"
                  onClick={handleCopyUrl}
                >
                  <Copy size={14} />
                </button>
              </div>
              <p className="tiny muted profile-url-text">{profileUrl}</p>
            </div>
          </section>

          <RightRailShowcaseCard onOpenInfoModal={onOpenInfoModal} />

          <section className="rail-card">
            <h2 className="discover-feed-title">Personnes que vous pourriez connaître</h2>
            <p className="tiny muted">Suggestions basées sur vos centres d’intérêt</p>
            <div className="discover-feed-list">
              {suggestPeople.length === 0 ? (
                <p className="tiny muted">Vous suivez déjà toutes les suggestions actuelles.</p>
              ) : (
                suggestPeople.map((entry) => (
                  <div key={entry.profile.id} className="discover-feed-row">
                    <button
                      type="button"
                      className="li-avatar-btn"
                      aria-label={`Voir le profil de ${entry.profile.name}`}
                      onClick={() => nav('member', entry.profile.id)}
                    >
                      <Avatar person={entry.profile} />
                    </button>
                    <div className="discover-feed-info">
                      <div className="discover-feed-name-row">
                        <button
                          type="button"
                          className="discover-feed-name"
                          onClick={() => nav('member', entry.profile.id)}
                        >
                          {entry.profile.name}
                        </button>
                        {entry.verified && <VerifiedBadge />}
                      </div>
                      <p className="discover-feed-headline" title={entry.headline}>
                        {entry.headline}
                      </p>
                      <button
                        type="button"
                        className="discover-follow-pill"
                        onClick={() => onToggleFollow(entry.profile.id)}
                      >
                        + Suivre
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button
              type="button"
              className="profile-section-footer-btn"
              onClick={() => nav('relations')}
            >
              Tout afficher <ArrowRight size={15} />
            </button>
          </section>

          <section className="rail-card">
            <h2 className="discover-feed-title">Vous aimerez peut-être</h2>
            <p className="tiny muted">Modules et parcours recommandés</p>
            <div className="discover-feed-list">
              {suggestedCatalog.map((item) => {
                const dest = item.type === 'path' ? 'path-detail' : 'module-detail';
                return (
                  <div key={item.id} className="discover-feed-row">
                    <span className="profile-edu-icon" aria-hidden="true">
                      <BookOpen size={16} />
                    </span>
                    <div className="discover-feed-info">
                      <button
                        type="button"
                        className="discover-feed-name"
                        onClick={() => nav(dest, item.id)}
                      >
                        {item.title}
                      </button>
                      <p className="discover-feed-headline">
                        {item.domain} · {item.duration}
                      </p>
                      <button
                        type="button"
                        className="discover-follow-pill"
                        onClick={() => nav(dest, item.id)}
                      >
                        Découvrir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              className="profile-section-footer-btn"
              onClick={() => nav('catalog')}
            >
              Tout afficher <ArrowRight size={15} />
            </button>
          </section>
        </aside>
      </div>
      )}
    </div>
  );
}
