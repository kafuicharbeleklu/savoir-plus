import React, { useState } from 'react';
import { notificationSentence, notificationTarget } from '../notificationText';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
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
import { appendAuditLog, formatNotificationTimestamp, notificationsFor, type ExtendedDemoState, type NotificationItem } from '../wireframeData';
import type { Profile, Relation } from '../data';
import { resolveCommunityDirectory, resolveProfileVerified, type RoleCapabilities } from '../personas';
import { Avatar } from '../components/ProfileIdentityCard';

import { Select } from '../components/ui';
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
  /** Colonne de droite de la page des alertes. */
  rail?: React.ReactNode;
}

export function NotificationsView({ ext, updateExt, nav, people, user, setToast, rail }: AccountAdminProps) {

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

  const items = notificationsFor(ext.notifications, user.id, ext.notifPrefs);

  // Filtres : toutes, non lues, puis une entrée par catégorie présente.
  const [filter, setFilter] = useState<'all' | 'unread' | NotificationItem['category']>('all');
  const categories = (['Apprentissage', 'Communauté', 'Relations', 'Compte'] as NotificationItem['category'][]).filter((c) =>
    items.some((n) => n.category === c)
  );
  const shown = items.filter((n) => (filter === 'all' ? true : filter === 'unread' ? !n.read : n.category === filter));

  const markAllRead = () => {
    updateExt((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true }))
    }));
    setToast('Toutes les notifications affichées ont été marquées comme lues');
  };

  const openNotif = (n: NotificationItem) => {
    updateExt((prev) => ({
      ...prev,
      notifications: prev.notifications.map((x) => (x.id === n.id ? { ...x, read: true } : x))
    }));
    const target = notificationTarget(n);
    nav(target.page, target.id);
  };

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div className="dashboard-grid">
      <div className="dashboard-main">
        <h1 className="sr-only">Alertes</h1>

        <div className="ui-filter" role="group" aria-label="Filtrer les alertes">
          {(
            [
              { id: 'all', label: 'Toutes' },
              { id: 'unread', label: `Non lues${items.some((n) => !n.read) ? ` (${items.filter((n) => !n.read).length})` : ''}` },
              ...categories.map((c) => ({ id: c, label: c }))
            ] as { id: typeof filter; label: string }[]
          ).map((f) => (
            <button key={f.id} type="button" aria-pressed={filter === f.id} className={filter === f.id ? 'is-on' : ''} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
          {unreadCount > 0 && (
            <button type="button" className="li-text-link ui-filter-aside" onClick={markAllRead}>
              Tout marquer comme lu
            </button>
          )}
        </div>

        {shown.length === 0 ? (
          <div className="empty">
            <Bell size={34} />
            <h3>{items.length === 0 ? 'Aucune alerte pour le moment.' : 'Aucune alerte dans ce filtre.'}</h3>
            <p>{items.length === 0 ? 'Vos événements récents apparaîtront ici.' : 'Choisissez « Toutes » pour revoir l’ensemble.'}</p>
          </div>
        ) : (
          <div className="wf-notif-list" role="list">
            {shown.map((n) => {
              const actor = resolveActor(n);
              const sentence = notificationSentence(n);
              return (
                <button
                  type="button"
                  role="listitem"
                  className={`wf-notif-row ${n.read ? 'read' : 'unread'}`}
                  key={n.id}
                  onClick={() => openNotif(n)}
                >
                  <Avatar person={actor} />
                  <div className="wf-notif-body">
                    {sentence ? (
                      <p className="wf-notif-text">
                        <b>{sentence.actor}</b> {sentence.text}
                      </p>
                    ) : (
                      <>
                        <p className="wf-notif-text">
                          <b>{n.title}</b>
                        </p>
                        <p className="wf-notif-detail">{n.detail}</p>
                      </>
                    )}
                    <span className="wf-notif-meta">
                      {n.category} · {n.date}
                    </span>
                  </div>
                  {!n.read && <span className="wf-notif-dot" aria-label="Non lue" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <aside className="right-rail" aria-label="À venir">
        {rail}
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

      <h1 className="sr-only">Signaler un contenu ou un échange</h1>

      <div className="wf-two-col">
        <form className="wf-card wf-form-stack" onSubmit={submitReport}>
          <h3>Nouveau signalement</h3>
          <p className="tiny muted">
            Élément visé : <b>{reportTarget || 'Aucun élément présélectionné (test général)'}</b>
          </p>
          <p className="tiny muted">Votre identité reste confidentielle vis-à-vis de la personne signalée.</p>
          <label>
            Motif principal
            <Select value={reason} onChange={(e) => setReason(e.target.value)}>
              <option>Contenu trompeur ou désinformation</option>
              <option>Harcèlement ou propos abusifs</option>
              <option>Spam ou sollicitation répétée</option>
              <option>Exposition de données personnelles</option>
              <option>Autre</option>
            </Select>
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

export function AuthFlowsView({ nav, setToast }: AccountAdminProps) {
  const [step, setStep] = useState<'landing' | 'signup' | 'verify' | 'login' | 'reset' | 'onboarding'>('landing');
  const [emailInput, setEmailInput] = useState('exemple@savoir.test');

  return (
    <div className="wf-detail-wrap">
      <button className="back-link" onClick={() => nav('home')}>
        <ArrowLeft size={16} /> Retour à l’application connectée
      </button>

      <h1 className="sr-only">Accueil, inscription et récupération de compte</h1>

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
            <span className="eyebrow">Accueil public</span>
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
            <span className="eyebrow">Créer un compte</span>
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
            <span className="eyebrow">Vérification obligatoire</span>
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
            <span className="eyebrow">Connexion & récupération</span>
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
            <span className="eyebrow">Définir un nouveau mot de passe</span>
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
            <span className="eyebrow">Profil initial</span>
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

export { AppealView, ModerationView } from './governance/Queues';
