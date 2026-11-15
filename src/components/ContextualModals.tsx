import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Cloud,
  Eye,
  Flag,
  Hash,
  HelpCircle,
  Lightbulb,
  ListOrdered,
  Lock,
  RotateCcw,
  Send,
  Smile,
  User,
  X
} from 'lucide-react';
import type { Profile } from '../data';
import type { CommunityPost, ExtendedDemoState, ReportItem } from '../wireframeData';
import { Avatar } from './ProfileIdentityCard';

const COMPOSER_EMOJIS = ['👍', '🙏', '💡', '✅', '⚠️', '🔒', '📌', '🎯', '🤔', '👏', '🚀', '😊'];

/**
 * Fenêtre « Nouvelle contribution », sur le modèle de la fenêtre de publication de LinkedIn :
 * auteur et réglages en tête, titre et texte sans cadre, outils en bas à gauche, « Publier » à droite.
 * Chaque commande est réelle : type et domaine sont enregistrés, les outils modifient le texte.
 */
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
  const [emojiOpen, setEmojiOpen] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (emojiOpen) setEmojiOpen(false);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, emojiOpen]);

  useEffect(() => {
    if (open) titleRef.current?.focus();
    else setEmojiOpen(false);
  }, [open]);

  if (!open) return null;

  const ready = Boolean(title.trim() && body.trim());

  /** Insère un texte à l'emplacement du curseur, dans la zone de texte. */
  const insertInBody = (text: string) => {
    const area = bodyRef.current;
    const from = area ? area.selectionStart : body.length;
    const to = area ? area.selectionEnd : body.length;
    const next = body.slice(0, from) + text + body.slice(to);
    setBody(next);
    requestAnimationFrame(() => {
      if (!area) return;
      area.focus();
      const caret = from + text.length;
      area.setSelectionRange(caret, caret);
    });
  };

  const insertSteps = () => {
    const prefix = body && !body.endsWith('\n') ? '\n' : '';
    insertInBody(`${prefix}1. \n2. \n3. `);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
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
      aria-label="Nouvelle contribution"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form className="pc" onSubmit={submit}>
        <header className="pc-head">
          <Avatar person={user} />
          <div className="pc-head-main">
            <b className="pc-name">{user.name}</b>
            <div className="pc-chips">
              <span className="pc-chip" title="Les contributions sont visibles par les membres connectés">
                <Eye size={16} aria-hidden="true" /> Membres connectés
              </span>
              <label className="pc-chip pc-chip-select">
                {kind === 'question' ? <HelpCircle size={16} aria-hidden="true" /> : <Lightbulb size={16} aria-hidden="true" />}
                <span className="sr-only">Type de contribution</span>
                <select value={kind} onChange={(e) => setKind(e.target.value as 'publication' | 'question')}>
                  <option value="publication">Astuce ou méthode</option>
                  <option value="question">Question d’entraide</option>
                </select>
                <ChevronDown size={16} aria-hidden="true" />
              </label>
              <label className="pc-chip pc-chip-select">
                <Hash size={16} aria-hidden="true" />
                <span className="sr-only">Domaine</span>
                <select value={domain} onChange={(e) => setDomain(e.target.value as typeof domain)}>
                  <option value="Numérique">Numérique</option>
                  <option value="Communication">Communication</option>
                  <option value="Gestion">Gestion</option>
                </select>
                <ChevronDown size={16} aria-hidden="true" />
              </label>
            </div>
          </div>
          <button type="button" className="pc-close" aria-label="Fermer" onClick={onClose}>
            <X size={24} />
          </button>
        </header>

        <div className="pc-body">
          <input
            ref={titleRef}
            className="pc-title"
            required
            aria-label={kind === 'question' ? 'Votre question en une phrase' : 'Titre de votre astuce'}
            placeholder={kind === 'question' ? 'Votre question en une phrase' : 'Titre de votre astuce'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            ref={bodyRef}
            className="pc-text"
            required
            aria-label="Détails et contexte"
            placeholder={
              kind === 'question'
                ? 'Expliquez le contexte et ce que vous avez déjà essayé…'
                : 'Partagez votre méthode, étape par étape…'
            }
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>

        <div className="pc-tools">
          <div className="pc-tool-wrap">
            <button
              type="button"
              className="pc-tool"
              aria-label="Afficher le sélecteur d’émoticônes"
              aria-expanded={emojiOpen}
              title="Émoticônes"
              onClick={() => setEmojiOpen((v) => !v)}
            >
              <Smile size={24} />
            </button>
            {emojiOpen && (
              <div className="pc-emoji" role="group" aria-label="Émoticônes">
                {COMPOSER_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    aria-label={`Insérer ${emoji}`}
                    onClick={() => {
                      insertInBody(emoji);
                      setEmojiOpen(false);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            className="pc-tool"
            aria-label="Insérer des étapes numérotées"
            title="Étapes numérotées"
            onClick={insertSteps}
          >
            <ListOrdered size={24} />
          </button>
        </div>

        <footer className="pc-foot">
          {!ready && <span className="pc-hint">Un titre et un texte sont nécessaires pour publier.</span>}
          <button type="submit" className="primary pc-submit" disabled={!ready}>
            Publier
          </button>
        </footer>
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
