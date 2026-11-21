import React, { useEffect, useState } from 'react';
import { notificationSentence, notificationTarget } from '../notificationText';
import {
  AlertTriangle,
  ArrowLeft,
  AtSign,
  FileText,
  MessageSquare,
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
import { resolveCommunityAuthor, resolveCommunityDirectory, resolveProfileVerified, type RoleCapabilities } from '../personas';
import { Avatar } from '../components/ProfileIdentityCard';

import { EmptyState, Select, Tabs } from '../components/ui';
import { RichText } from '../components/RichText';
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
  /** Élément ouvert par l'adresse (« report/SIG-2026-001 » : ce signalement). */
  selectedId?: string;
}

export function NotificationsView({ ext, updateExt, nav, people, user, setToast, rail, selectedId }: AccountAdminProps) {
  // Deux onglets : les alertes, et l'activité du membre (ses posts, ses commentaires, ses mentions).
  const [section, setSection] = useState<'alerts' | 'activity'>(selectedId === 'activite' ? 'activity' : 'alerts');
  useEffect(() => {
    if (selectedId === 'activite') setSection('activity');
  }, [selectedId]);
  const myPosts = ext.posts.filter((p) => p.authorId === user.id);
  const myComments = ext.posts.flatMap((p) => p.replies.filter((r) => r.authorId === user.id).map((reply) => ({ post: p, reply })));
  // Mentions : les réponses d'autres membres qui vous citent (« Afi Mensah Merci… »).
  const myMentions = ext.posts.flatMap((p) =>
    p.replies.filter((r) => r.authorId !== user.id && r.replyToName === user.name).map((reply) => ({ post: p, reply }))
  );
  const [activityKind, setActivityKind] = useState<'posts' | 'comments' | 'mentions'>(() =>
    myPosts.length === 0 && myComments.length > 0 ? 'comments' : 'posts'
  );
  const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;
  // Une ligne d'activité a la forme d'une alerte : l'avatar de la personne, une phrase, un détail, la date.
  // Même résolution que le fil (initiales et couleur de l'auteur, même hors de l'annuaire).
  const personOf = (id: string, name: string): Profile => resolveCommunityAuthor(id, name, people, ext).profile;
  const activityRow = (key: string, person: Profile, text: React.ReactNode, detail: React.ReactNode, meta: string, onOpen: () => void) => (
    <div role="listitem" key={key} className="wf-notif-item">
      <button type="button" className="wf-notif-row read" onClick={onOpen}>
        <Avatar person={person} />
        <div className="wf-notif-body">
          <p className="wf-notif-text">{text}</p>
          {detail && <p className="wf-notif-detail">{detail}</p>}
          <span className="wf-notif-meta">{meta}</span>
        </div>
      </button>
    </div>
  );

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

        <Tabs<'alerts' | 'activity'>
          label="Alertes et activité"
          value={section}
          onChange={setSection}
          items={[
            { id: 'alerts', label: 'Alertes' },
            { id: 'activity', label: 'Activité' }
          ]}
        />

        {/* Activité : mêmes filtres que les alertes (même ligne, même forme), puis la liste ou un état vide. */}
        {section === 'activity' && (
          <>
            <div className="ui-filter" role="group" aria-label="Filtrer l’activité">
              {(
                [
                  { id: 'posts', label: `Mes posts${myPosts.length ? ` (${myPosts.length})` : ''}` },
                  { id: 'comments', label: `Mes commentaires${myComments.length ? ` (${myComments.length})` : ''}` },
                  { id: 'mentions', label: `Mentions${myMentions.length ? ` (${myMentions.length})` : ''}` }
                ] as { id: typeof activityKind; label: string }[]
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={activityKind === f.id}
                  className={activityKind === f.id ? 'is-on' : ''}
                  onClick={() => setActivityKind(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {activityKind === 'posts' &&
              (myPosts.length === 0 ? (
                <div className="empty">
                  <FileText size={34} />
                  <h3>Aucun post pour le moment</h3>
                  <p>Les posts et les questions que vous publiez apparaîtront ici.</p>
                </div>
              ) : (
                <div className="wf-notif-list" role="list" aria-label="Mes posts">
                  {myPosts.map((p) =>
                    activityRow(
                      p.id,
                      user,
                      <b>{p.title}</b>,
                      <RichText text={p.body} />,
                      `${p.kind === 'question' ? 'Question d’entraide' : 'Publication'} · ${p.createdAt} · ${plural(p.helpfulBy?.length || 0, 'utile', 'utiles')} · ${plural(p.replies.length, 'réponse', 'réponses')}`,
                      () => nav('community', p.id)
                    )
                  )}
                </div>
              ))}

            {activityKind === 'comments' &&
              (myComments.length === 0 ? (
                <div className="empty">
                  <MessageSquare size={34} />
                  <h3>Aucun commentaire pour le moment</h3>
                  <p>Vos commentaires et vos réponses dans le fil d’entraide apparaîtront ici.</p>
                </div>
              ) : (
                <div className="wf-notif-list" role="list" aria-label="Mes commentaires">
                  {myComments.map(({ post, reply }) =>
                    activityRow(
                      reply.id,
                      user,
                      <>
                        <b>Vous</b> avez répondu à « {post.title} »
                      </>,
                      reply.text,
                      `Commentaire · ${reply.createdAt}`,
                      () => nav('community', post.id)
                    )
                  )}
                </div>
              ))}

            {activityKind === 'mentions' &&
              (myMentions.length === 0 ? (
                <div className="empty">
                  <AtSign size={34} />
                  <h3>Aucune nouvelle mention</h3>
                  <p>Lorsque quelqu’un vous identifie dans un post ou un commentaire, cette notification apparaîtra ici.</p>
                </div>
              ) : (
                <div className="wf-notif-list" role="list" aria-label="Mentions">
                  {myMentions.map(({ post, reply }) =>
                    activityRow(
                      reply.id,
                      personOf(reply.authorId, reply.authorName),
                      <>
                        <b>{reply.authorName}</b> vous a mentionné(e) dans un commentaire sur « {post.title} »
                      </>,
                      reply.text,
                      `Mention · ${reply.createdAt}`,
                      () => nav('community', post.id)
                    )
                  )}
                </div>
              ))}
          </>
        )}

        {section === 'alerts' && (
        <>
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
                <div role="listitem" key={n.id} className="wf-notif-item">
                <button type="button" className={`wf-notif-row ${n.read ? 'read' : 'unread'}`} onClick={() => openNotif(n)}>
                  <Avatar person={actor} />
                  <div className="wf-notif-body">
                    {sentence ? (
                      <>
                        <p className="wf-notif-text">
                          {sentence.actor && <b>{sentence.actor}</b>} {sentence.text}
                        </p>
                        {sentence.detail && <p className="wf-notif-detail">{sentence.detail}</p>}
                      </>
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
                </div>
              );
            })}
          </div>
        )}
        </>
        )}
      </div>

      <aside className="right-rail" aria-label="À venir">
        {rail}
      </aside>
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
