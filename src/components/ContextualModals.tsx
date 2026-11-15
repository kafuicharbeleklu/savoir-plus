import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  Flag,
  HelpCircle,
  Lock,
  MessageSquare,
  RotateCcw,
  Send,
  User,
  X
} from 'lucide-react';
import type { Profile } from '../data';
import type { CommunityPost, ExtendedDemoState, ReportItem } from '../wireframeData';
import { Avatar } from './ProfileIdentityCard';

export function PostComposerModal({
  open,
  onClose,
  user,
  onPublish
}: {
  open: boolean;
  onClose: () => void;
  user: Profile;
  onPublish: (post: CommunityPost) => void;
}) {
  const [kind, setKind] = useState<'publication' | 'question'>('publication');
  const [domain, setDomain] = useState<'Numérique' | 'Communication' | 'Gestion'>('Numérique');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    onPublish({
      id: `post-${Date.now()}`,
      kind,
      title: title.trim(),
      domain,
      authorId: user.id,
      authorName: user.name,
      body: body.trim(),
      createdAt: 'À l’instant',
      followers: [user.id],
      replies: []
    });
    setTitle('');
    setBody('');
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Publier dans la communauté"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form className="modal" onSubmit={submit}>
        <button type="button" className="icon-btn modal-close" aria-label="Fermer" onClick={onClose}>
          <X size={18} />
        </button>
        <div className="modal-author-row">
          <Avatar person={user} small />
          <div>
            <b>{user.name}</b>
            <small>Partager avec les membres connectés</small>
          </div>
        </div>
        <h2>Nouvelle contribution</h2>
        <div className="tabs modal-tabs">
          <button type="button" className={kind === 'publication' ? 'selected' : ''} onClick={() => setKind('publication')}>
            <MessageSquare size={14} /> Astuce ou méthode
          </button>
          <button type="button" className={kind === 'question' ? 'selected' : ''} onClick={() => setKind('question')}>
            <HelpCircle size={14} /> Question d’entraide
          </button>
        </div>

        <label className="modal-field">
          <span>Domaine</span>
          <select value={domain} onChange={(e) => setDomain(e.target.value as any)}>
            <option value="Numérique">Numérique</option>
            <option value="Communication">Communication</option>
            <option value="Gestion">Gestion</option>
          </select>
        </label>

        <label className="modal-field">
          <span>{kind === 'question' ? 'Votre question en une phrase' : 'Titre de votre astuce'}</span>
          <input
            required
            placeholder={kind === 'question' ? 'Ex. Comment repérer un lien raccourci suspect ?' : 'Ex. Ma check-list avant de cliquer'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label className="modal-field">
          <span>Détails et contexte</span>
          <textarea
            required
            rows={4}
            placeholder="Partagez votre méthode ou expliquez ce que vous avez déjà essayé…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>

        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" className="primary" disabled={!title.trim() || !body.trim()}>
            {kind === 'question' ? 'Publier la question' : 'Publier l’astuce'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function ContactRequestModal({
  target,
  onClose,
  onSubmit
}: {
  target: Profile | null;
  onClose: () => void;
  onSubmit: (firstMessage: string) => void;
}) {
  const [firstMessage, setFirstMessage] = useState('');

  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [target, onClose]);

  if (!target) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(firstMessage.trim());
    setFirstMessage('');
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Demander à discuter avec ${target.name}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form className="modal" onSubmit={submit}>
        <button type="button" className="icon-btn modal-close" aria-label="Fermer" onClick={onClose}>
          <X size={18} />
        </button>
        <span className="eyebrow">Demande de discussion</span>
        <div className="modal-author-row">
          <Avatar person={target} small />
          <div>
            <b>{target.name}</b>
            <small>{target.role}</small>
          </div>
        </div>

        <label className="modal-field">
          <span>Premier message de présentation (facultatif)</span>
          <textarea
            rows={3}
            maxLength={400}
            placeholder={`Bonjour ${target.name}, je souhaite échanger au sujet d’un module SAVOIR+…`}
            value={firstMessage}
            onChange={(e) => setFirstMessage(e.target.value)}
          />
        </label>

        <p className="tiny muted">
          Un seul message est transmis avec votre demande. Aucun autre envoi n’est possible tant que {target.name} n’a pas accepté.
        </p>

        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" className="primary">
            <Send size={14} /> Envoyer la demande
          </button>
        </div>
      </form>
    </div>
  );
}

export function ReportDialog({
  targetLabel,
  onClose,
  onSubmit
}: {
  targetLabel: string | null;
  onClose: () => void;
  onSubmit: (report: ReportItem) => void;
}) {
  const [reason, setReason] = useState('Harcèlement ou propos abusifs');
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (!targetLabel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [targetLabel, onClose]);

  if (!targetLabel) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: `SIG-${Math.floor(1000 + Math.random() * 9000)}`,
      targetLabel,
      reason,
      details: details.trim() || 'Signalement transmis pour examen.',
      status: 'Reçu',
      date: 'À l’instant'
    });
    setDetails('');
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Signaler un contenu ou un échange"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form className="modal" onSubmit={submit}>
        <button type="button" className="icon-btn modal-close" aria-label="Fermer" onClick={onClose}>
          <X size={18} />
        </button>
        <span className="eyebrow">Signalement privé & confidentiel</span>
        <h2>Signaler un élément</h2>
        <p className="report-target-box">
          <Flag size={14} /> Élément ciblé : <b>{targetLabel}</b>
        </p>

        <label className="modal-field">
          <span>Motif du signalement</span>
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            <option>Harcèlement ou propos abusifs</option>
            <option>Désinformation pédagogique ou technique</option>
            <option>Spam ou sollicitation répétée</option>
            <option>Usurpation d’identité</option>
            <option>Exposition de données personnelles</option>
            <option>Autre</option>
          </select>
        </label>

        <label className="modal-field">
          <span>Précisions utiles (facultatif)</span>
          <textarea
            rows={3}
            placeholder="Décrivez brièvement le contexte pour l’équipe de modération…"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
        </label>

        <p className="tiny muted">
          Votre identité n’est pas communiquée à la personne visée. Signaler ne bloque pas automatiquement la personne ;
          vous pouvez aussi la bloquer séparément.
        </p>

        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" className="primary">
            Envoyer le signalement
          </button>
        </div>
      </form>
    </div>
  );
}

export function DemoAuthModal({
  open,
  onClose,
  uid,
  mode,
  cloudConfigured,
  people,
  busy,
  error,
  onSwitchPerson,
  onLoginCloud,
  onLogoutCloud,
  onResetDemo,
  onEnterVisitor
}: {
  open: boolean;
  onClose: () => void;
  uid: string;
  mode: string;
  cloudConfigured: boolean;
  people: Profile[];
  ext: ExtendedDemoState;
  busy: boolean;
  error: string;
  onSwitchPerson: (id: string) => void;
  onLoginCloud: (email: string, password: string) => void;
  onLogoutCloud: () => void;
  onResetDemo: () => void;
  onEnterVisitor: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const demoList = [
    { id: 'afi', title: 'Afi Mensah', subtitle: 'Apprenante · Parcours & Entraide' },
    { id: 'kossi', title: 'Kossi Agbo', subtitle: 'Créateur & Mentor · Studio pédagogique' },
    { id: 'nadege', title: 'Nadège Koffi', subtitle: 'Modération & Gouvernance' }
  ];

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Comptes de démonstration et connexion"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal modal-wide">
        <button type="button" className="icon-btn modal-close" aria-label="Fermer" onClick={onClose}>
          <X size={18} />
        </button>

        <span className="eyebrow">Changer de rôle ou de session</span>
        <h2>Comptes & Connexion</h2>
        <p>
          Explorez SAVOIR+ avec trois personnages de démonstration fictifs pour tester l’intégration contextuelle des espaces Apprenant,
          Studio et Gouvernance.
        </p>

        <div className="persona-choices-three">
          {demoList.map((d) => {
            const p = people.find((x) => x.id === d.id) || {
              id: d.id,
              name: d.title,
              role: d.subtitle,
              initials: d.title.slice(0, 2).toUpperCase(),
              color: d.id === 'nadege' ? 'mint' : d.id === 'kossi' ? 'lavender' : 'peach',
              bio: ''
            };
            const selected = mode === 'local' && uid === d.id;
            return (
              <button
                key={d.id}
                type="button"
                className={selected ? 'selected' : ''}
                onClick={() => onSwitchPerson(d.id)}
              >
                <Avatar person={p} small />
                <b>{d.title}</b>
                <span>{d.subtitle}</span>
              </button>
            );
          })}
        </div>

        <div className="modal-visitor-bar">
          <button
            type="button"
            className="secondary"
            onClick={() => {
              onClose();
              onEnterVisitor();
            }}
          >
            <User size={15} /> Ouvrir l’accueil visiteur / Parcours d’inscription
          </button>

          {!confirmReset ? (
            <button type="button" className="text-link" onClick={() => setConfirmReset(true)}>
              <RotateCcw size={14} /> Réinitialiser la démo locale
            </button>
          ) : (
            <button
              type="button"
              className="primary"
              onClick={() => {
                onResetDemo();
                setConfirmReset(false);
              }}
            >
              Confirmer la réinitialisation
            </button>
          )}
        </div>

        <div className="cloud-form">
          <h3>
            <Cloud size={17} /> Connexion Supabase {cloudConfigured ? '(configurée)' : '(non configurée)'}
          </h3>
          {mode === 'cloud' ? (
            <div className="supabase-note">
              <CheckCircle2 size={16} />
              <span>Session Supabase active. Vos progressions et échanges sont synchronisés en temps réel.</span>
              <button type="button" className="secondary" disabled={busy} onClick={onLogoutCloud}>
                Se déconnecter
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onLoginCloud(email, password);
              }}
            >
              <div className="cloud-inputs">
                <label>
                  Adresse e-mail
                  <input
                    type="email"
                    required
                    placeholder="membre@exemple.test"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label>
                  Mot de passe
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
              </div>
              {error && (
                <p className="modal-error">
                  <AlertCircle size={14} /> {error}
                </p>
              )}
              <div className="modal-actions">
                <button type="submit" className="primary" disabled={busy || !cloudConfigured}>
                  <Lock size={14} /> Se connecter via Supabase
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
