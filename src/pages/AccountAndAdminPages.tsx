import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  Eye,
  Flag,
  Lock,
  Monitor,
  Scale,
  ShieldAlert,
  ShieldCheck,
  User,
  UserCheck
} from 'lucide-react';
import { appendAuditLog, formatNotificationTimestamp, type ExtendedDemoState, type NotificationItem } from '../wireframeData';
import type { Profile, Relation } from '../data';
import { resolveCommunityDirectory, resolveProfileVerified, type RoleCapabilities } from '../personas';
import { GovernanceShell } from './AdminPages';
import { Avatar } from '../components/ProfileIdentityCard';

interface AccountAdminProps {
  ext: ExtendedDemoState;
  updateExt: (fn: (prev: ExtendedDemoState) => ExtendedDemoState) => void;
  nav: (page: any, id?: string) => void;
  user: Profile;
  caps?: RoleCapabilities;
  relations: Relation[];
  people: Profile[];
  onUnblock: (r: Relation) => void;
  onEnterVisitor?: () => void;
  reportTarget: string;
  settingsTab?: 'prefs' | 'privacy' | 'security';
  setSettingsTab?: (tab: 'prefs' | 'privacy' | 'security') => void;
  setToast: (msg: string) => void;
}

export function NotificationsView({ ext, updateExt, nav, people, setToast }: AccountAdminProps) {
  const [showPrefs, setShowPrefs] = useState(false);

  const resolveActor = (n: NotificationItem): Profile => {
    const matched = n.actorId ? people.find((p) => p.id === n.actorId) : undefined;
    if (matched) return matched;
    return {
      id: n.actorId || 'savoir',
      name: n.actorName || 'SAVOIR+',
      role: '',
      initials: n.actorInitials || 'SV',
      color: n.actorColor || 'mint',
      bio: ''
    };
  };

  const items = ext.notifications;

  const markAllRead = () => {
    updateExt((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true }))
    }));
    setToast('Toutes les notifications affichées ont été marquées comme lues');
  };

  const openNotif = (id: string, targetPage: string, targetId?: string) => {
    updateExt((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    }));
    nav(targetPage, targetId);
  };

  const unreadCount = ext.notifications.filter((n) => !n.read).length;

  return (
    <div className="dashboard-grid">
      <div className="dashboard-main">
        <div className="between wf-mb-sm">
          <div className="page-heading wf-no-mb">
            <h1>Alertes</h1>
          </div>
          <div className="wf-inline-actions">
            <button className="secondary" onClick={() => setShowPrefs(!showPrefs)}>
              Préférences
            </button>
            <button className="primary" onClick={markAllRead}>
              <Check size={15} /> Tout marquer comme lu
            </button>
          </div>
        </div>

        {showPrefs && (
          <section className="wf-card wf-mb">
            <h3>Préférences de notifications</h3>
            <p className="tiny muted wf-mb-sm">
              Les alertes essentielles de sécurité et décisions de compte restent toujours consultables.
            </p>
            <div className="wf-stack-sm">
              {[
                { key: 'learning', label: 'Activité pédagogique et reprises' },
                { key: 'social', label: 'Demandes de relation et messages' },
                { key: 'community', label: 'Réponses et solutions de la communauté' }
              ].map((pref) => (
                <label className="wf-check-row" key={pref.key}>
                  <input
                    type="checkbox"
                    checked={(ext.notifPrefs as any)[pref.key]}
                    onChange={(e) =>
                      updateExt((prev) => ({
                        ...prev,
                        notifPrefs: { ...prev.notifPrefs, [pref.key]: e.target.checked }
                      }))
                    }
                  />
                  <span>{pref.label}</span>
                </label>
              ))}
            </div>
          </section>
        )}

        {items.length === 0 ? (
          <div className="empty">
            <Bell size={34} />
            <h3>Aucune alerte pour le moment.</h3>
            <p>Vos événements récents apparaîtront ici.</p>
          </div>
        ) : (
          <div className="wf-notif-list" role="list">
            {items.map((n) => {
              const actor = resolveActor(n);
              return (
                <button
                  type="button"
                  role="listitem"
                  className={`wf-notif-row ${n.read ? 'read' : 'unread'}`}
                  key={n.id}
                  onClick={() => openNotif(n.id, n.targetPage, n.targetId)}
                >
                  <Avatar person={actor} />
                  <div className="wf-notif-body">
                    <div className="wf-notif-head">
                      <h3>{n.title}</h3>
                      <span className="tiny muted wf-notif-time">{n.date}</span>
                    </div>
                    <p className="tiny muted">{n.detail}</p>
                    <span className="tiny muted wf-notif-actor">{actor.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <aside className="right-rail" aria-label="Repères notifications">
        <section className="rail-card">
          <span className="eyebrow">RÉGLAGES RAPIDES</span>
          <h3>Alertes facultatives</h3>
          <div className="wf-stack-sm">
            {[
              { key: 'learning', label: 'Apprentissage & reprises' },
              { key: 'social', label: 'Relations & messages' },
              { key: 'community', label: 'Entraide & solutions' }
            ].map((pref) => (
              <label className="wf-check-row tiny" key={pref.key}>
                <input
                  type="checkbox"
                  checked={(ext.notifPrefs as any)[pref.key]}
                  onChange={(e) => {
                    const nextVal = e.target.checked;
                    updateExt((prev) => ({
                      ...prev,
                      notifPrefs: { ...prev.notifPrefs, [pref.key]: nextVal }
                    }));
                    setToast('Préférence d’alerte mise à jour');
                  }}
                />
                <span>{pref.label}</span>
              </label>
            ))}
          </div>
          <button className="secondary wf-full-btn" onClick={() => nav('settings')}>
            Paramètres complets <ArrowRight size={15} />
          </button>
        </section>

        <section className="rail-card">
          <span className="eyebrow">À TRAITER EN PRIORITÉ</span>
          <h3>{unreadCount > 0 ? `${unreadCount} alerte(s) non lue(s)` : 'Tout est à jour'}</h3>
          <div className="rail-quick-list">
            <button type="button" className="rail-quick-item" onClick={() => nav('report')}>
              <b>Suivi des signalements ({ext.reports.length})</b>
              <small>
                {ext.reports.some((r) => r.status === 'Précisions demandées')
                  ? 'Précisions demandées sur un dossier'
                  : 'Consulter vos démarches privées'}
              </small>
            </button>
          </div>
        </section>
      </aside>
    </div>
  );
}

export function ReportView({ ext, updateExt, nav, reportTarget, setToast }: AccountAdminProps) {
  const [reason, setReason] = useState('Contenu trompeur ou désinformation');
  const [details, setDetails] = useState('');
  const [extraReply, setExtraReply] = useState('');

  const submitReport = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `SIG-2026-00${ext.reports.length + 1}`;
    updateExt((prev) => ({
      ...prev,
      reports: [
        {
          id,
          targetLabel: reportTarget || 'Contenu de démonstration sélectionné',
          reason,
          details: details.trim() || 'Aucune précision complémentaire.',
          status: 'Reçu',
          date: 'À l’instant'
        },
        ...prev.reports
      ],
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor: 'Déclarant (confidentiel)',
        action: 'Nouveau signalement déposé',
        target: id,
        scope: 'Signalement privé',
        result: 'Succès',
        justification: `Motif sélectionné : ${reason}`
      })
    }));
    setDetails('');
    setToast(`Signalement ${id} enregistré dans votre suivi privé`);
  };

  const sendPrecision = (id: string) => {
    if (!extraReply.trim()) return;
    updateExt((prev) => ({
      ...prev,
      reports: prev.reports.map((r) =>
        r.id === id ? { ...r, status: 'En cours d’examen', extraNote: extraReply.trim() } : r
      )
    }));
    setExtraReply('');
    setToast('Précisions transmises au dossier');
  };

  return (
    <div className="wf-detail-wrap">
      <button className="back-link" onClick={() => nav('notifications')}>
        <ArrowLeft size={16} /> Retour aux alertes
      </button>

      <div className="page-heading">
        <span className="eyebrow">SIGNALEMENT & SUIVI PRIVÉ</span>
        <h1>Signaler un contenu ou un échange</h1>
        <p>
          Votre identité reste confidentielle vis-à-vis de la personne signalée. Le blocage reste une action
          indépendante.
        </p>
      </div>

      <div className="wf-two-col">
        <form className="wf-card wf-form-stack" onSubmit={submitReport}>
          <h3>Nouveau signalement</h3>
          <p className="tiny muted">
            Élément visé : <b>{reportTarget || 'Aucun élément présélectionné (test général)'}</b>
          </p>
          <label>
            Motif principal
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              <option>Contenu trompeur ou désinformation</option>
              <option>Harcèlement ou propos abusifs</option>
              <option>Spam ou sollicitation répétée</option>
              <option>Exposition de données personnelles</option>
              <option>Autre</option>
            </select>
          </label>
          <label>
            Précisions (facultatif)
            <textarea
              rows={4}
              placeholder="Décrivez brièvement le problème constaté…"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </label>
          <p className="tiny muted">
            Éléments transmis à l’équipe habilitée : référence de l’objet, motif choisi et vos précisions.
          </p>
          <button type="submit" className="primary">
            <Flag size={15} /> Envoyer le signalement
          </button>
        </form>

        <section className="wf-card">
          <h3>Mes signalements (Suivi privé)</h3>
          <div className="wf-stack-sm wf-mt-sm">
            {ext.reports.map((rep) => (
              <div className="wf-report-item" key={rep.id}>
                <div className="between">
                  <b>{rep.id}</b>
                  <span className="status-tag">{rep.status}</span>
                </div>
                <p className="tiny">{rep.targetLabel}</p>
                <small className="muted">Motif : {rep.reason}</small>
                {rep.status === 'Précisions demandées' && (
                  <div className="wf-form-stack wf-mt-sm">
                    <input
                      placeholder="Répondre à la demande de précisions…"
                      value={extraReply}
                      onChange={(e) => setExtraReply(e.target.value)}
                    />
                    <button
                      type="button"
                      className="secondary"
                      disabled={!extraReply.trim()}
                      onClick={() => sendPrecision(rep.id)}
                    >
                      Envoyer les précisions
                    </button>
                  </div>
                )}
                {rep.extraNote && (
                  <small className="muted">Votre complément : « {rep.extraNote} »</small>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

type SettingsSection = 'account' | 'security' | 'visibility' | 'data' | 'notifications';

export function SettingsView({
  ext,
  updateExt,
  nav,
  user,
  caps,
  relations,
  people,
  onUnblock,
  onEnterVisitor,
  settingsTab,
  setSettingsTab,
  setToast
}: AccountAdminProps) {
  const [section, setSection] = useState<SettingsSection>(() => {
    if (settingsTab === 'security') return 'security';
    if (settingsTab === 'privacy') return 'visibility';
    return 'account';
  });
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [dataRequested, setDataRequested] = useState(false);

  React.useEffect(() => {
    if (settingsTab === 'security') setSection('security');
    else if (settingsTab === 'privacy' && section !== 'data') setSection('visibility');
    else if (settingsTab === 'prefs' && section !== 'notifications') setSection('account');
  }, [settingsTab]);

  const selectSection = (next: SettingsSection) => {
    setSection(next);
    setExpandedRow(null);
    if (setSettingsTab) {
      if (next === 'security') setSettingsTab('security');
      else if (next === 'visibility' || next === 'data') setSettingsTab('privacy');
      else setSettingsTab('prefs');
    }
  };

  const details = ext.profileDetails[user.id] || ext.profileDetails.afi;
  const blockedRelations = relations.filter((r) => r.blockedBy.includes(user.id));
  const isVerified = resolveProfileVerified(user.id, ext.adminUsers, details?.verified);
  const myFollowing = ext.followingIds[user.id] || [];
  const directory = resolveCommunityDirectory(people, ext);
  const unfollowedMembers = directory.filter(
    (p) => p.id !== user.id && !myFollowing.includes(p.id)
  );

  const patchProfileDetails = (patch: Partial<typeof details>) => {
    updateExt((prev) => ({
      ...prev,
      profileDetails: {
        ...prev.profileDetails,
        [user.id]: { ...(prev.profileDetails[user.id] || prev.profileDetails.afi), ...patch }
      }
    }));
  };

  const patchAppPrefs = (patch: Partial<ExtendedDemoState['appPrefs']>) => {
    updateExt((prev) => ({
      ...prev,
      appPrefs: { ...prev.appPrefs, ...patch }
    }));
  };

  const toggleRow = (id: string) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  const navItems: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
    { id: 'account', label: 'Préférences du compte', icon: <User size={18} /> },
    { id: 'security', label: 'Identification et sécurité', icon: <Lock size={18} /> },
    { id: 'visibility', label: 'Visibilité', icon: <Eye size={18} /> },
    { id: 'data', label: 'Confidentialité des données', icon: <ShieldCheck size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> }
  ];

  const autoplay = ext.appPrefs.autoplayVideos ?? true;
  const soundOn = ext.appPrefs.soundEffects ?? true;
  const contentLang = ext.appPrefs.contentLanguage || 'Français';
  const photoVis = ext.appPrefs.photoVisibility || 'Tous les membres';
  const feedPref = ext.appPrefs.preferredFeedView || 'Contributions les plus pertinentes';

  return (
    <div className="settings-layout-wrap">
      <div className="workspace-mobile-nav" role="navigation" aria-label="Sections des préférences mobile">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={section === item.id ? 'active' : ''}
            onClick={() => selectSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="settings-layout">
        {/* Left LinkedIn-style Settings Sidebar */}
        <aside className="settings-sidebar" aria-label="Menu des préférences">
          <div className="settings-sidebar-header">
            <Avatar person={user} small />
            <h1>Préférences</h1>
          </div>
          <nav className="settings-sidebar-nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`settings-nav-item ${section === item.id ? 'active' : ''}`}
                aria-current={section === item.id ? 'page' : undefined}
                onClick={() => selectSection(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Right Grouped Settings Cards */}
        <div className="settings-cards-col">
          {section === 'account' && (
            <>
              <section className="settings-group-card">
                <h2>Informations du profil</h2>
                <div className="settings-row-group">
                  <button
                    type="button"
                    className="settings-row"
                    aria-expanded={expandedRow === 'profile-info'}
                    onClick={() => toggleRow('profile-info')}
                  >
                    <span className="settings-row-label">Nom, lieu et secteur</span>
                    <span className="settings-row-right">
                      <span className="settings-row-val">{details.location || 'Lomé, Région Maritime'}</span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </span>
                  </button>
                  {expandedRow === 'profile-info' && (
                    <div className="settings-row-body">
                      <p className="tiny muted">
                        {user.name} · {details.tagline}
                      </p>
                      <button type="button" className="secondary" onClick={() => nav('profile')}>
                        Modifier sur Mon profil
                      </button>
                    </div>
                  )}
                </div>

                <div className="settings-row-group">
                  <button
                    type="button"
                    className="settings-row"
                    aria-expanded={expandedRow === 'demographics'}
                    onClick={() => toggleRow('demographics')}
                  >
                    <span className="settings-row-label">Parcours & centres d’intérêt</span>
                    <span className="settings-row-right">
                      <span className="settings-row-val">{details.interests}</span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </span>
                  </button>
                  {expandedRow === 'demographics' && (
                    <div className="settings-row-body">
                      <p className="tiny muted">
                        Ces thèmes servent uniquement à personnaliser les suggestions d’entraide dans votre fil.
                      </p>
                      <button type="button" className="secondary" onClick={() => nav('profile')}>
                        Éditer les centres d’intérêt
                      </button>
                    </div>
                  )}
                </div>

                <div className="settings-row-group">
                  <button
                    type="button"
                    className="settings-row"
                    aria-expanded={expandedRow === 'verifications'}
                    onClick={() => toggleRow('verifications')}
                  >
                    <span className="settings-row-label">Vérifications</span>
                    <span className="settings-row-right">
                      <span className="settings-row-val">
                        {isVerified ? 'Compte vérifié' : 'En attente'}
                      </span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </span>
                  </button>
                  {expandedRow === 'verifications' && (
                    <div className="settings-row-body">
                      <p className="tiny muted">
                        Statut du compte : {caps?.roleLabel || 'Membre'} · {isVerified ? 'Identité de démonstration vérifiée.' : 'Vérification non activée.'}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <section className="settings-group-card">
                <h2>Afficher</h2>
                <div className="settings-row-group">
                  <button
                    type="button"
                    className="settings-row"
                    aria-expanded={expandedRow === 'theme'}
                    onClick={() => toggleRow('theme')}
                  >
                    <span className="settings-row-label">Mode sombre</span>
                    <span className="settings-row-right">
                      <span className="settings-row-val">{ext.appPrefs.theme}</span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </span>
                  </button>
                  {expandedRow === 'theme' && (
                    <div className="settings-row-body">
                      <select
                        aria-label="Choisir le mode d'affichage"
                        value={ext.appPrefs.theme}
                        onChange={(e) => {
                          patchAppPrefs({ theme: e.target.value as any });
                          setToast(`Thème « ${e.target.value} » appliqué`);
                        }}
                      >
                        <option value="Clair">Clair (SAVOIR+)</option>
                        <option value="Sombre">Sombre</option>
                        <option value="Système">Suivre le système</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="settings-row-group">
                  <button
                    type="button"
                    className="settings-row"
                    aria-expanded={expandedRow === 'motion'}
                    onClick={() => toggleRow('motion')}
                  >
                    <span className="settings-row-label">Réduire les animations</span>
                    <span className="settings-row-right">
                      <span className="settings-row-val">
                        {ext.appPrefs.reducedMotion ? 'Activé' : 'Désactivé'}
                      </span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </span>
                  </button>
                  {expandedRow === 'motion' && (
                    <div className="settings-row-body">
                      <label className="wf-check-row">
                        <input
                          type="checkbox"
                          checked={ext.appPrefs.reducedMotion}
                          onChange={(e) => {
                            patchAppPrefs({ reducedMotion: e.target.checked });
                            setToast('Préférence d’animation enregistrée');
                          }}
                        />
                        <span>Limiter les transitions visuelles sur l’interface</span>
                      </label>
                    </div>
                  )}
                </div>
              </section>

              <section className="settings-group-card">
                <h2>Préférences générales</h2>
                <div className="settings-row-group">
                  <button
                    type="button"
                    className="settings-row"
                    aria-expanded={expandedRow === 'lang'}
                    onClick={() => toggleRow('lang')}
                  >
                    <span className="settings-row-label">Langue</span>
                    <span className="settings-row-right">
                      <span className="settings-row-val">{ext.appPrefs.language}</span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </span>
                  </button>
                  {expandedRow === 'lang' && (
                    <div className="settings-row-body">
                      <select aria-label="Langue de l'interface" value={ext.appPrefs.language} onChange={() => {}}>
                        <option value="Français">Français</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="settings-row-group">
                  <button
                    type="button"
                    className="settings-row"
                    aria-expanded={expandedRow === 'content-lang'}
                    onClick={() => toggleRow('content-lang')}
                  >
                    <span className="settings-row-label">Langue du contenu</span>
                    <span className="settings-row-right">
                      <span className="settings-row-val">{contentLang}</span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </span>
                  </button>
                  {expandedRow === 'content-lang' && (
                    <div className="settings-row-body">
                      <select
                        aria-label="Langue du contenu pédagogique"
                        value={contentLang}
                        onChange={(e) => {
                          patchAppPrefs({ contentLanguage: e.target.value as any });
                          setToast('Langue de contenu enregistrée');
                        }}
                      >
                        <option value="Français">Français</option>
                        <option value="Français & Anglais">Français &amp; Anglais</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="settings-row-group">
                  <button
                    type="button"
                    className="settings-row"
                    onClick={() => {
                      const next = !autoplay;
                      patchAppPrefs({ autoplayVideos: next });
                      setToast(`Lecture automatique ${next ? 'activée' : 'désactivée'}`);
                    }}
                  >
                    <span className="settings-row-label">Lancer les médias automatiquement</span>
                    <span className="settings-row-right">
                      <span className="settings-row-val">{autoplay ? 'Activé' : 'Désactivé'}</span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </span>
                  </button>
                </div>

                <div className="settings-row-group">
                  <button
                    type="button"
                    className="settings-row"
                    onClick={() => {
                      const next = !soundOn;
                      patchAppPrefs({ soundEffects: next });
                      setToast(`Effets sonores ${next ? 'activés' : 'désactivés'}`);
                    }}
                  >
                    <span className="settings-row-label">Effets sonores</span>
                    <span className="settings-row-right">
                      <span className="settings-row-val">{soundOn ? 'Activé' : 'Désactivé'}</span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </span>
                  </button>
                </div>

                <div className="settings-row-group">
                  <button
                    type="button"
                    className="settings-row"
                    aria-expanded={expandedRow === 'photo-vis'}
                    onClick={() => toggleRow('photo-vis')}
                  >
                    <span className="settings-row-label">Affichage des photos de profil</span>
                    <span className="settings-row-right">
                      <span className="settings-row-val">{photoVis}</span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </span>
                  </button>
                  {expandedRow === 'photo-vis' && (
                    <div className="settings-row-body">
                      <select
                        aria-label="Affichage des photos de profil"
                        value={photoVis}
                        onChange={(e) => {
                          patchAppPrefs({ photoVisibility: e.target.value as any });
                          setToast('Préférence d’affichage des avatars enregistrée');
                        }}
                      >
                        <option value="Tous les membres">Tous les membres</option>
                        <option value="Mes relations">Mes relations</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="settings-row-group">
                  <button
                    type="button"
                    className="settings-row"
                    aria-expanded={expandedRow === 'feed-view'}
                    onClick={() => toggleRow('feed-view')}
                  >
                    <span className="settings-row-label">Vue du fil d’actualité préférée</span>
                    <span className="settings-row-right">
                      <span className="settings-row-val">{feedPref}</span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </span>
                  </button>
                  {expandedRow === 'feed-view' && (
                    <div className="settings-row-body">
                      <select
                        aria-label="Vue du fil d'actualité"
                        value={feedPref}
                        onChange={(e) => {
                          patchAppPrefs({ preferredFeedView: e.target.value as any });
                          setToast('Tri du fil mis à jour');
                        }}
                      >
                        <option value="Contributions les plus pertinentes">
                          Contributions les plus pertinentes
                        </option>
                        <option value="Plus récentes">Plus récentes</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="settings-row-group">
                  <button
                    type="button"
                    className="settings-row"
                    aria-expanded={expandedRow === 'unfollowed'}
                    onClick={() => toggleRow('unfollowed')}
                  >
                    <span className="settings-row-label">Personnes que vous ne suivez plus</span>
                    <span className="settings-row-right">
                      <span className="settings-row-val tabular-nums">{unfollowedMembers.length}</span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </span>
                  </button>
                  {expandedRow === 'unfollowed' && (
                    <div className="settings-row-body">
                      {unfollowedMembers.length === 0 ? (
                        <p className="tiny muted">Vous suivez tous les membres suggérés actuellement.</p>
                      ) : (
                        <div className="wf-stack-sm">
                          {unfollowedMembers.map((m) => (
                            <div className="between" key={m.id}>
                              <span className="tiny">
                                <b>{m.name}</b> · {m.role}
                              </span>
                              <button
                                type="button"
                                className="secondary"
                                onClick={() => {
                                  updateExt((prev) => ({
                                    ...prev,
                                    followingIds: {
                                      ...prev.followingIds,
                                      [user.id]: Array.from(
                                        new Set([...(prev.followingIds[user.id] || []), m.id])
                                      )
                                    }
                                  }));
                                  setToast(`Vous suivez désormais ${m.name}`);
                                }}
                              >
                                + Suivre
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {section === 'security' && (
            <>
              <section className="settings-group-card">
                <div className="between settings-group-head-pad">
                  <h2>Sessions actives</h2>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      updateExt((prev) => ({
                        ...prev,
                        sessions: prev.sessions.filter((s) => s.current)
                      }));
                      setToast('Autres sessions révoquées');
                    }}
                  >
                    Déconnecter les autres sessions
                  </button>
                </div>
                <div className="wf-stack-sm settings-pad-body">
                  {ext.sessions.map((s) => (
                    <div className="wf-program-item" key={s.id}>
                      <div className="wf-inline-actions">
                        <Monitor size={17} />
                        <div>
                          <b>{s.label}</b>
                          <small>{s.lastSeen}</small>
                        </div>
                      </div>
                      {s.current ? (
                        <span className="status-tag ok">Session actuelle</span>
                      ) : (
                        <button
                          type="button"
                          className="text-link danger"
                          onClick={() => {
                            updateExt((prev) => ({
                              ...prev,
                              sessions: prev.sessions.filter((x) => x.id !== s.id)
                            }));
                            setToast('Session révoquée');
                          }}
                        >
                          Révoquer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section className="settings-group-card">
                <h2>Protection du compte & droit au recours</h2>
                <div className="settings-pad-body wf-stack-sm">
                  <p className="tiny muted">
                    Même en cas de suspension administrative, un portail dédié reste automatiquement accessible pour consulter
                    la décision motivée et déposer un recours indépendant.
                  </p>
                  <div className="wf-inline-actions">
                    <button type="button" className="secondary" onClick={() => nav('report')}>
                      <Flag size={15} /> Suivre mes signalements
                    </button>
                    {(caps?.canModerate || caps?.canAdmin) && (
                      <button type="button" className="secondary" onClick={() => nav('moderation')}>
                        <ShieldAlert size={15} /> Console de modération
                      </button>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}

          {section === 'visibility' && (
            <>
              <section className="settings-group-card">
                <h2>Visibilité de votre profil et de votre activité</h2>
                <div className="settings-pad-body wf-form-stack">
                  <label>
                    Qui peut voir votre profil ?
                    <select
                      value={details.profileVisibility}
                      onChange={(e) => {
                        patchProfileDetails({ profileVisibility: e.target.value as any });
                        setToast('Visibilité du profil mise à jour');
                      }}
                    >
                      <option value="Membres">Membres connectés</option>
                      <option value="Moi uniquement">Moi uniquement</option>
                      <option value="Public">Public</option>
                    </select>
                  </label>
                  <label>
                    Visibilité du niveau et des XP
                    <select
                      value={details.xpVisibility}
                      onChange={(e) => {
                        patchProfileDetails({ xpVisibility: e.target.value as any });
                        setToast('Visibilité XP mise à jour');
                      }}
                    >
                      <option value="Moi uniquement">Moi uniquement</option>
                      <option value="Membres">Membres connectés</option>
                    </select>
                  </label>
                  <label>
                    Qui peut vous envoyer une demande de discussion ?
                    <select
                      value={details.contactPolicy}
                      onChange={(e) => {
                        patchProfileDetails({ contactPolicy: e.target.value as any });
                        setToast('Préférence de contact mise à jour');
                      }}
                    >
                      <option value="Personnes que je suis">Personnes que je suis (recommandé)</option>
                      <option value="Membres autorisés">Membres autorisés</option>
                      <option value="Personne">Personne</option>
                    </select>
                  </label>
                </div>
              </section>

              <section className="settings-group-card">
                <h2>Personnes bloquées</h2>
                <div className="settings-pad-body">
                  {blockedRelations.length === 0 ? (
                    <p className="tiny muted">Aucun membre bloqué actuellement.</p>
                  ) : (
                    <div className="wf-stack-sm">
                      {blockedRelations.map((r) => {
                        const other = people.find((p) => p.id === r.members.find((m) => m !== user.id));
                        return (
                          <div className="wf-program-item" key={r.id}>
                            <span>{other?.name || 'Membre'}</span>
                            <button type="button" className="secondary" onClick={() => onUnblock(r)}>
                              Débloquer (sans réactiver l’accord)
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {section === 'data' && (
            <section className="settings-group-card">
              <h2>Confidentialité des données</h2>
              <div className="settings-pad-body wf-stack-sm">
                <p className="tiny muted">
                  Demander un export exclut les secrets et les notes internes de modération. Aucune donnée personnelle
                  n’est utilisée à des fins publicitaires.
                </p>
                <div className="wf-inline-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setDataRequested(true);
                      setToast('Demande d’export enregistrée (démonstration)');
                    }}
                  >
                    {dataRequested ? 'Demande d’export reçue' : 'Demander mes données'}
                  </button>
                  {onEnterVisitor && (
                    <button type="button" className="text-link" onClick={onEnterVisitor}>
                      Tester la session visiteur (inscription / récupération)
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

          {section === 'notifications' && (
            <section className="settings-group-card">
              <h2>Notifications que vous recevez</h2>
              <div className="settings-pad-body wf-stack-sm">
                <p className="tiny muted">
                  Choisissez les catégories d’alertes facultatives affichées dans votre centre d’alertes.
                </p>
                {[
                  { key: 'learning', label: 'Activité pédagogique et reprises' },
                  { key: 'social', label: 'Demandes de relation et messages' },
                  { key: 'community', label: 'Réponses et solutions de la communauté' }
                ].map((pref) => (
                  <label className="wf-check-row" key={pref.key}>
                    <input
                      type="checkbox"
                      checked={(ext.notifPrefs as any)[pref.key]}
                      onChange={(e) => {
                        const nextVal = e.target.checked;
                        updateExt((prev) => ({
                          ...prev,
                          notifPrefs: { ...prev.notifPrefs, [pref.key]: nextVal }
                        }));
                        setToast('Préférence d’alerte mise à jour');
                      }}
                    />
                    <span>{pref.label}</span>
                  </label>
                ))}
                <div>
                  <button type="button" className="secondary" onClick={() => nav('notifications')}>
                    Ouvrir mes alertes <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export function AuthFlowsView({ nav, setToast }: AccountAdminProps) {
  const [step, setStep] = useState<'landing' | 'signup' | 'verify' | 'login' | 'reset' | 'onboarding'>('landing');
  const [emailInput, setEmailInput] = useState('exemple@savoir.test');

  return (
    <div className="wf-detail-wrap">
      <button className="back-link" onClick={() => nav('home')}>
        <ArrowLeft size={16} /> Retour à l’application connectée
      </button>

      <div className="page-heading">
        <span className="eyebrow">PARCOURS D’ACCÈS & IDENTITÉ</span>
        <h1>Accueil, inscription et récupération de compte</h1>
        <p>Aperçu interactif des écrans publics sans fermer votre session de démonstration actuelle.</p>
      </div>

      <div className="catalog-tabs-underline" role="tablist" aria-label="Étapes du parcours d’accès">
        {[
          { id: 'landing', label: 'Accueil public' },
          { id: 'signup', label: 'Inscription' },
          { id: 'verify', label: 'Vérification' },
          { id: 'login', label: 'Connexion & oubli' },
          { id: 'reset', label: 'Nouveau mot de passe' },
          { id: 'onboarding', label: 'Profil initial' }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={step === t.id}
            className={step === t.id ? 'selected' : ''}
            onClick={() => setStep(t.id as any)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className="wf-card wf-form-stack">
        {step === 'landing' && (
          <>
            <span className="eyebrow">ACCUEIL PUBLIC</span>
            <h2>Apprendre, pratiquer et s’entraider sur SAVOIR+</h2>
            <p className="wf-muted-text">
              Plateforme d’apprentissage structuré et d’entraide communautaire. Le mode démonstration ne publie pas
              les données privées aux visiteurs.
            </p>
            <div className="wf-inline-actions">
              <button className="primary" onClick={() => setStep('signup')}>
                Créer un compte
              </button>
              <button className="secondary" onClick={() => setStep('login')}>
                Se connecter
              </button>
            </div>
          </>
        )}

        {step === 'signup' && (
          <>
            <span className="eyebrow">CRÉER UN COMPTE</span>
            <label>
              Adresse e-mail
              <input value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
            </label>
            <label>
              Mot de passe (12 caractères min., gestionnaires de mots de passe autorisés)
              <input type="password" defaultValue="MotDePasseRobuste12!" />
            </label>
            <label className="wf-check-row">
              <input type="checkbox" defaultChecked />
              <span>J’accepte les conditions d’utilisation (v1.0) et ai consulté la confidentialité.</span>
            </label>
            <button className="primary" onClick={() => setStep('verify')}>
              Créer mon compte (demande neutre)
            </button>
          </>
        )}

        {step === 'verify' && (
          <>
            <span className="eyebrow">VÉRIFICATION OBLIGATOIRE</span>
            <h3>Vérifiez votre adresse e-mail</h3>
            <p className="wf-muted-text">
              Si cette adresse est éligible, un lien de confirmation temporaire lui a été envoyé. Tant que
              l’adresse n’est pas vérifiée, publication et messagerie restent verrouillées.
            </p>
            <div className="wf-inline-actions">
              <button className="secondary" onClick={() => setToast('Nouveau lien simulé (les anciens sont invalidés)')}>
                Renvoyer le lien
              </button>
              <button className="primary" onClick={() => setStep('onboarding')}>
                Simuler lien confirmé <ArrowRight size={15} />
              </button>
            </div>
          </>
        )}

        {step === 'login' && (
          <>
            <span className="eyebrow">CONNEXION & RÉCUPÉRATION</span>
            <label>
              Adresse e-mail
              <input value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
            </label>
            <label>
              Mot de passe
              <input type="password" defaultValue="••••••••••••" />
            </label>
            <p className="tiny muted">Les messages d’erreur restent neutres pour ne pas révéler l’existence d’un compte.</p>
            <div className="wf-inline-actions">
              <button className="primary" onClick={() => nav('home')}>
                Accéder au tableau de bord
              </button>
              <button className="text-link" onClick={() => setStep('reset')}>
                Mot de passe oublié ?
              </button>
            </div>
          </>
        )}

        {step === 'reset' && (
          <>
            <span className="eyebrow">DÉFINIR UN NOUVEAU MOT DE PASSE</span>
            <label>
              Nouveau mot de passe
              <input type="password" defaultValue="NouveauSecret2026!" />
            </label>
            <p className="tiny muted">
              Confirmer révoque automatiquement les anciennes sessions et les liens précédents.
            </p>
            <button
              className="primary"
              onClick={() => {
                setToast('Mot de passe modifié et anciennes sessions révoquées (démo)');
                setStep('login');
              }}
            >
              Enregistrer et se reconnecter
            </button>
          </>
        )}

        {step === 'onboarding' && (
          <>
            <span className="eyebrow">PROFIL INITIAL</span>
            <label>
              Nom d’affichage (facultatif)
              <input defaultValue="Afi Mensah" />
            </label>
            <label>
              Centres d’intérêt
              <input defaultValue="Numérique, Cybersécurité, Entraide" />
            </label>
            <div className="wf-inline-actions">
              <button className="secondary" onClick={() => nav('home')}>
                Compléter plus tard
              </button>
              <button className="primary" onClick={() => nav('home')}>
                Accéder à mon espace
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export function ModerationView({ ext, updateExt, nav, user, setToast }: AccountAdminProps) {
  const [selectedDossierId, setSelectedDossierId] = useState(ext.dossiers[0]?.id || 'SIG-2026-001');
  const dossier = ext.dossiers.find((d) => d.id === selectedDossierId) || ext.dossiers[0];

  const [measure, setMeasure] = useState(dossier?.decisionMeasure || 'Restriction d’envoi de messages');
  const [duration, setDuration] = useState(dossier?.decisionDuration || '24 heures');
  const [rule, setRule] = useState(dossier?.decisionRule || 'Règle de respect des échanges (v1)');
  const [internalReason, setInternalReason] = useState(
    dossier?.internalReason || 'Envois répétés hors cadre malgré refus explicite.'
  );
  const [publicMsg, setPublicMsg] = useState(
    dossier?.publicMessage || 'Votre capacité d’envoi de messages est restreinte pour 24 heures. Vous pouvez contester cette décision.'
  );

  const patchDossier = (
    patch: Partial<typeof dossier>,
    audit?: { action: string; result?: 'Succès' | 'Refusé'; justification: string }
  ) => {
    if (!dossier) return;
    updateExt((prev) => ({
      ...prev,
      dossiers: prev.dossiers.map((d) => (d.id === dossier.id ? { ...d, ...patch } : d)),
      auditLogs: audit
        ? appendAuditLog(prev.auditLogs, {
            actor: prev.adminActiveRole,
            action: audit.action,
            target: dossier.id,
            scope: 'Modération',
            result: audit.result || 'Succès',
            justification: audit.justification
          })
        : prev.auditLogs
    }));
  };

  const selectDossier = (d: typeof dossier) => {
    setSelectedDossierId(d.id);
    if (d.decisionMeasure) setMeasure(d.decisionMeasure);
    if (d.decisionDuration) setDuration(d.decisionDuration);
    if (d.decisionRule) setRule(d.decisionRule);
    if (d.internalReason) setInternalReason(d.internalReason);
    if (d.publicMessage) setPublicMsg(d.publicMessage);
  };

  return (
    <GovernanceShell ext={ext} updateExt={updateExt} nav={nav} activePage="moderation" user={user} setToast={setToast}>
      <div className="between wf-mb-sm">
        <div className="page-heading wf-no-mb">
          <span className="eyebrow">CONSOLE OPÉRATEUR DE MODÉRATION</span>
          <h1>File de modération & Décisions</h1>
          <p>
            Périmètre de démonstration : les déclarants ne voient ni les notes internes ni la sanction appliquée.
          </p>
        </div>
        <button className="secondary" onClick={() => nav('appeal')}>
          Voir les recours en attente
        </button>
      </div>

      <div className="wf-editor-split">
        <aside className="wf-card wf-stack-sm">
          <b>File active ({ext.dossiers.length})</b>
          {ext.dossiers.map((d) => (
            <button
              key={d.id}
              className={`wf-media-row ${d.id === dossier?.id ? 'active-row' : ''}`}
              onClick={() => selectDossier(d)}
            >
              <div>
                <b>
                  {d.id} · {d.targetType}
                </b>
                <small className="muted">{d.summary}</small>
              </div>
              <span className="status-tag">{d.status}</span>
            </button>
          ))}
        </aside>

        {dossier && (
          <section className="wf-card wf-form-stack">
            <div className="between">
              <div>
                <span className="eyebrow">{dossier.id}</span>
                <h3>{dossier.summary}</h3>
              </div>
              <div className="wf-inline-actions">
                <button
                  className="secondary"
                  disabled={dossier.conflictDeclared}
                  onClick={() => {
                    patchDossier(
                      { assignee: 'Opérateur démo', status: 'En examen' },
                      { action: 'Prise en charge dossier modération', justification: 'Affectation opérateur dans son périmètre.' }
                    );
                    setToast('Dossier pris en charge');
                  }}
                >
                  <UserCheck size={14} /> {dossier.assignee ? `Affecté : ${dossier.assignee}` : 'Prendre en charge'}
                </button>
                <button
                  className="text-link danger"
                  onClick={() => {
                    patchDossier(
                      { conflictDeclared: !dossier.conflictDeclared, assignee: null },
                      {
                        action: !dossier.conflictDeclared
                          ? 'Conflit d’intérêts déclaré (décision bloquée)'
                          : 'Conflit d’intérêts levé (démo)',
                        justification: 'Séparation des responsabilités.'
                      }
                    );
                    setToast('Conflit d’intérêts mis à jour : décision bloquée pour cet opérateur');
                  }}
                >
                  {dossier.conflictDeclared ? 'Lever conflit (démo)' : 'Déclarer conflit d’intérêts'}
                </button>
              </div>
            </div>

            <div className="wf-evidence-box">
              <b>Preuves rattachées (périmètre strict · accès tracé)</b>
              <p className="tiny muted">{dossier.evidence}</p>
            </div>

            {dossier.conflictDeclared ? (
              <div className="wf-alert-warn">
                <AlertTriangle size={16} />
                <span>
                  Conflit d’intérêts déclaré : vous ne pouvez ni préparer ni approuver une décision sur ce dossier.
                </span>
              </div>
            ) : (
              <>
                <div className="wf-two-inputs">
                  <label>
                    Mesure envisagée
                    <select value={measure} onChange={(e) => setMeasure(e.target.value)}>
                      <option>Restriction d’envoi de messages</option>
                      <option>Masquage du contenu</option>
                      <option>Avertissement motivé</option>
                      <option>Suspension temporaire</option>
                      <option>Aucune violation constatée</option>
                    </select>
                  </label>
                  <label>
                    Durée
                    <select value={duration} onChange={(e) => setDuration(e.target.value)}>
                      <option>24 heures</option>
                      <option>7 jours</option>
                      <option>30 jours</option>
                      <option>Sans durée</option>
                    </select>
                  </label>
                </div>
                <label>
                  Règle applicable
                  <input value={rule} onChange={(e) => setRule(e.target.value)} />
                </label>
                <label>
                  Justification interne (invisible pour les membres)
                  <textarea rows={2} value={internalReason} onChange={(e) => setInternalReason(e.target.value)} />
                </label>
                <label>
                  Message communicable à la personne concernée
                  <textarea rows={2} value={publicMsg} onChange={(e) => setPublicMsg(e.target.value)} />
                </label>
                <div className="lesson-actions">
                  <span className="tiny muted">Les sanctions sensibles exigent une seconde approbation.</span>
                  <button
                    className="primary"
                    onClick={() => {
                      patchDossier(
                        {
                          status: 'Décision soumise',
                          decisionMeasure: measure,
                          decisionDuration: duration,
                          decisionRule: rule,
                          internalReason,
                          publicMessage: publicMsg
                        },
                        {
                          action: `Décision de modération : ${measure} (${duration})`,
                          justification: `${rule} — ${internalReason}`
                        }
                      );
                      setToast(`Décision enregistrée et journalisée pour ${dossier.id}`);
                    }}
                  >
                    <ShieldCheck size={15} /> Soumettre la décision
                  </button>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </GovernanceShell>
  );
}

export function AppealView({ ext, updateExt, nav, caps, user, setToast }: AccountAdminProps) {
  const [text, setText] = useState(ext.appeal.explanation);
  const [decisionNote, setDecisionNote] = useState(ext.appeal.decisionNote || '');

  const submitAppeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    updateExt((prev) => ({
      ...prev,
      appeal: {
        submitted: true,
        explanation: text.trim(),
        status: 'Reçu',
        decisionNote: undefined
      },
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor: user?.name || 'Titulaire concerné (accès limité)',
        action: 'Recours déposé sur DEC-2026-001',
        target: 'DEC-2026-001',
        scope: 'Sanctions & Recours',
        result: 'Succès',
        justification: 'Recours transmis à un réviseur distinct du décideur initial.'
      })
    }));
    setToast('Votre recours a été enregistré pour réexamen indépendant');
  };

  const decideAppeal = (accept: boolean) => {
    const note = (
      decisionNote.trim() ||
      (accept
        ? 'Mesure levée après réexamen indépendant ; accès ordinaires rétablis.'
        : 'Sanction maintenue après vérification des preuves et règles applicables.')
    );
    updateExt((prev) => ({
      ...prev,
      appeal: {
        ...prev.appeal,
        status: accept ? 'Accepté' : 'Rejeté',
        decisionNote: note
      },
      adminUsers: accept
        ? prev.adminUsers.map((u) => (u.status === 'suspended' ? { ...u, status: 'active' } : u))
        : prev.adminUsers,
      notifications: [
        {
          id: `not-appeal-${Date.now()}`,
          category: 'Compte',
          actorId: user?.id || 'nadege',
          actorName: user?.name || 'Nadège Koffi',
          actorInitials: user?.initials || 'NK',
          actorColor: user?.color || 'mint',
          title: accept ? 'Recours accepté — accès rétablis' : 'Décision sur votre recours',
          detail: note,
          date: formatNotificationTimestamp(),
          read: false,
          targetPage: 'appeal'
        },
        ...prev.notifications
      ],
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor: `${user?.name || 'Réviseur'} (${ext.adminActiveRole})`,
        action: accept ? 'Recours accepté — suspension levée' : 'Recours rejeté — sanction maintenue',
        target: 'DEC-2026-001',
        scope: 'Sanctions & Recours',
        result: 'Succès',
        justification: note
      })
    }));
    setToast(accept ? 'Recours accepté : comptes suspendus rétablis' : 'Recours rejeté : décision motivée enregistrée');
  };

  const resetAppealDemo = () => {
    updateExt((prev) => ({
      ...prev,
      appeal: {
        submitted: false,
        explanation: '',
        status: 'Aucun',
        decisionNote: undefined
      }
    }));
    setText('');
    setDecisionNote('');
    setToast('Recours réinitialisé pour une nouvelle démonstration');
  };

  return (
    <GovernanceShell ext={ext} updateExt={updateExt} nav={nav} activePage="appeal" user={user} setToast={setToast}>
      <div className="page-heading">
        <span className="eyebrow">SANCTIONS & SUIVI DES RECOURS</span>
        <h1>Décision n° DEC-2026-001</h1>
        <p>
          Les utilisateurs restreints ou suspendus conservent un portail dédié pour consulter la décision et déposer un
          recours indépendant.
        </p>
      </div>

      <section className="wf-card wf-mb">
        <div className="between">
          <span className="eyebrow">Suspension ou restriction administrative</span>
          <span className="tiny muted">
            <Lock size={13} /> Dossier protégé
          </span>
        </div>
        <p className="wf-mt-sm">
          <b>Motif communicable :</b> Envois répétés non sollicités après demande de cessation. Le réviseur du recours
          doit être distinct du décideur initial et de son approbateur.
        </p>
      </section>

      <section className="wf-card wf-form-stack wf-mb">
        <h3>{ext.appeal.submitted ? 'Suivi du recours' : 'Déposer un recours'}</h3>
        {ext.appeal.submitted ? (
          <div className="wf-stack-sm">
            <div className="between">
              <span>Statut du recours</span>
              <span
                className={`status-tag ${
                  ext.appeal.status === 'Accepté'
                    ? 'ok'
                    : ext.appeal.status === 'Rejeté'
                      ? 'warn'
                      : ''
                }`}
              >
                <CheckCircle2 size={14} /> {ext.appeal.status}
              </span>
            </div>
            <p className="tiny muted">
              Observations transmises par le titulaire concerné :
            </p>
            <div className="wf-evidence-box">
              <p className="tiny">« {ext.appeal.explanation} »</p>
            </div>
            {ext.appeal.decisionNote && (
              <div className="wf-evidence-box">
                <b>Réponse motivée du réviseur :</b>
                <p className="tiny muted wf-mt-sm">{ext.appeal.decisionNote}</p>
              </div>
            )}
          </div>
        ) : (
          <form className="wf-form-stack" onSubmit={submitAppeal}>
            <label>
              Vos observations et éléments d’explication
              <textarea
                rows={4}
                placeholder="Expliquez les faits ou joignez des précisions…"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </label>
            <p className="tiny muted">
              Le dépôt d’un recours ne lève pas automatiquement la mesure avant son examen.
            </p>
            <button type="submit" className="primary" disabled={!text.trim()}>
              Envoyer mon recours <ArrowRight size={15} />
            </button>
          </form>
        )}
      </section>

      {(caps?.canModerate || caps?.canAdmin) && ext.appeal.submitted && (
        <section className="wf-card wf-form-stack">
          <div className="between">
            <h3>Décision indépendante sur le recours</h3>
            <span className="tiny muted">Rôle actif : {ext.adminActiveRole}</span>
          </div>
          <label>
            Justification communicable de la décision
            <textarea
              rows={3}
              placeholder="Indiquez la décision motivée (ex. vérification effectuée, mesure levée ou maintenue)…"
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
            />
          </label>
          <div className="wf-inline-actions">
            <button type="button" className="primary" onClick={() => decideAppeal(true)}>
              <CheckCircle2 size={15} /> Accepter le recours et rétablir les comptes suspendus
            </button>
            <button type="button" className="secondary danger" onClick={() => decideAppeal(false)}>
              Maintenir la sanction (Rejeter)
            </button>
            {(ext.appeal.status === 'Accepté' || ext.appeal.status === 'Rejeté') && (
              <button type="button" className="secondary" onClick={resetAppealDemo}>
                Réinitialiser ce recours (démo)
              </button>
            )}
          </div>
        </section>
      )}
    </GovernanceShell>
  );
}
