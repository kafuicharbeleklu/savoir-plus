import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Bold,
  CheckCircle2,
  ChevronDown,
  Clock,
  Cloud,
  Eye,
  Flag,
  Hash,
  HelpCircle,
  Image as ImageIcon,
  Italic,
  Lightbulb,
  List,
  ListOrdered,
  Lock,
  RotateCcw,
  Send,
  Smile,
  User,
  X
} from 'lucide-react';
import type { Profile } from '../data';
import { formatScheduleDate } from '../wireframeData';
import type { CommunityPost, ExtendedDemoState, ReportItem } from '../wireframeData';
import { Avatar } from './ProfileIdentityCard';

import { Select } from './ui';
const COMPOSER_EMOJIS = ['👍', '🙏', '💡', '✅', '⚠️', '🔒', '📌', '🎯', '🤔', '👏', '🚀', '😊'];
const MAX_SCHEDULE_DAYS = 90;

type ComposerView = 'compose' | 'schedule' | 'scheduled';

const pad2 = (n: number) => String(n).padStart(2, '0');
const toDateInput = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const toTimeInput = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

/** Proposition par défaut du sélecteur d'heure : la prochaine heure pleine. */
function nextFullHour(): Date {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  return d;
}

/** Réduit une image avant de la joindre (1280 px au plus, JPEG) pour qu'elle tienne dans le navigateur. */
function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('lecture'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('image'));
      img.onload = () => {
        const ratio = Math.min(1, 1280 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * ratio));
        canvas.height = Math.max(1, Math.round(img.height * ratio));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('canvas'));
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Fenêtre « Nouvelle contribution », sur le modèle de la fenêtre de publication de LinkedIn :
 * auteur et réglages en tête, titre et texte sans cadre, outils en bas à gauche, horloge et « Publier » à droite.
 * Chaque commande est réelle : mise en forme, image jointe, publication immédiate ou programmée.
 */
export function PostComposerModal({
  open,
  onClose,
  user,
  onPublish,
  scheduled = [],
  onSchedule,
  onPublishScheduled,
  onDeleteScheduled,
  initialView = 'compose',
  intent
}: {
  open: boolean;
  onClose: () => void;
  user: Profile;
  onPublish: (post: CommunityPost) => void;
  /** Publications programmées de l'auteur, pas encore parues. */
  scheduled?: CommunityPost[];
  onSchedule?: (post: CommunityPost) => void;
  onPublishScheduled?: (id: string) => void;
  onDeleteScheduled?: (id: string) => void;
  initialView?: ComposerView;
  /** Geste choisi sur l'accueil : une question, une méthode, ou une photo (le choix d'image s'ouvre aussitôt). */
  intent?: 'question' | 'method' | 'photo';
}) {
  const [kind, setKind] = useState<'publication' | 'question'>('publication');
  const [domain, setDomain] = useState<'Numérique' | 'Communication' | 'Gestion'>('Numérique');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [view, setView] = useState<ComposerView>('compose');
  const [scheduleAt, setScheduleAt] = useState<number | null>(null);
  const [dateValue, setDateValue] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (emojiOpen) setEmojiOpen(false);
      else if (view !== 'compose') setView('compose');
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, emojiOpen, view]);

  useEffect(() => {
    if (open) {
      setView(initialView);
      if (intent) setKind(intent === 'question' ? 'question' : 'publication');
      if (initialView === 'compose') {
        requestAnimationFrame(() => {
          if (intent === 'photo') fileRef.current?.click();
          else titleRef.current?.focus();
        });
      }
    } else {
      setEmojiOpen(false);
      setConfirmDeleteId(null);
    }
  }, [open, initialView, intent]);

  if (!open) return null;

  const canSchedule = Boolean(onSchedule);
  const ready = Boolean(title.trim() && body.trim());
  const pending = [...scheduled].sort((a, b) => (a.scheduledAtMs ?? 0) - (b.scheduledAtMs ?? 0));

  /* ------------------------------------------------------------------ outils de texte */
  const applyEdit = (build: (value: string, from: number, to: number) => { value: string; from: number; to: number }) => {
    const area = bodyRef.current;
    const from = area ? area.selectionStart : body.length;
    const to = area ? area.selectionEnd : body.length;
    const result = build(body, from, to);
    setBody(result.value);
    requestAnimationFrame(() => {
      if (!area) return;
      area.focus();
      area.setSelectionRange(result.from, result.to);
    });
  };

  const insertText = (text: string) =>
    applyEdit((value, from, to) => ({
      value: value.slice(0, from) + text + value.slice(to),
      from: from + text.length,
      to: from + text.length
    }));

  /** Entoure la sélection (ou un mot d'exemple) du marqueur : **gras**, *italique*. */
  const wrapSelection = (marker: string, sample: string) =>
    applyEdit((value, from, to) => {
      const selected = value.slice(from, to) || sample;
      return {
        value: value.slice(0, from) + marker + selected + marker + value.slice(to),
        from: from + marker.length,
        to: from + marker.length + selected.length
      };
    });

  /** Transforme les lignes sélectionnées en liste : puces ou étapes numérotées. */
  const prefixLines = (prefixFor: (index: number) => string) =>
    applyEdit((value, from, to) => {
      const start = value.lastIndexOf('\n', from - 1) + 1;
      const endIndex = value.indexOf('\n', to);
      const end = endIndex === -1 ? value.length : endIndex;
      const rewritten = value
        .slice(start, end)
        .split('\n')
        .map((line, index) => prefixFor(index) + line.replace(/^(?:•\s|\d+\.\s)/, ''))
        .join('\n');
      const caret = start + rewritten.length;
      return { value: value.slice(0, start) + rewritten + value.slice(end), from: caret, to: caret };
    });

  const onBodyKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
      const key = e.key.toLowerCase();
      if (key === 'b') {
        e.preventDefault();
        wrapSelection('**', 'texte en gras');
        return;
      }
      if (key === 'i') {
        e.preventDefault();
        wrapSelection('*', 'texte en italique');
        return;
      }
    }
    if (e.key !== 'Enter' || e.shiftKey) return;
    // Dans une liste, Entrée poursuit la liste ; sur une ligne vide, elle la termine.
    const area = e.currentTarget;
    if (area.selectionStart !== area.selectionEnd) return;
    const caret = area.selectionStart;
    const start = body.lastIndexOf('\n', caret - 1) + 1;
    const line = body.slice(start, caret);
    const bullet = /^•\s(.*)$/.exec(line);
    const step = /^(\d+)\.\s(.*)$/.exec(line);
    if (!bullet && !step) return;
    e.preventDefault();
    const content = bullet ? bullet[1] : step![2];
    if (!content.trim()) {
      applyEdit((value) => ({ value: value.slice(0, start) + value.slice(caret), from: start, to: start }));
      return;
    }
    insertText(bullet ? '\n• ' : `\n${Number(step![1]) + 1}. `);
  };

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('Ce fichier n’est pas une image.');
      return;
    }
    try {
      setImage(await readImageAsDataUrl(file));
      setImageError('');
    } catch {
      setImageError('Cette image n’a pas pu être lue. Essayez un fichier JPEG ou PNG.');
    }
  };

  /* ------------------------------------------------------------------ programmation */
  const candidate = dateValue && timeValue ? new Date(`${dateValue}T${timeValue}`).getTime() : NaN;
  const scheduleValid =
    Number.isFinite(candidate) &&
    candidate > Date.now() + 60 * 1000 &&
    candidate < Date.now() + MAX_SCHEDULE_DAYS * 24 * 60 * 60 * 1000;

  const openSchedule = () => {
    const base = scheduleAt ? new Date(scheduleAt) : nextFullHour();
    setDateValue(toDateInput(base));
    setTimeValue(toTimeInput(base));
    setEmojiOpen(false);
    setView('schedule');
  };

  const confirmSchedule = () => {
    if (!scheduleValid) return;
    setScheduleAt(candidate);
    setView('compose');
  };

  const reset = () => {
    setTitle('');
    setBody('');
    setImage(null);
    setImageError('');
    setScheduleAt(null);
    setView('compose');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (view === 'schedule') {
      confirmSchedule();
      return;
    }
    if (view !== 'compose' || !ready) return;
    const post: CommunityPost = {
      id: `post-${Date.now()}`,
      kind,
      title: title.trim(),
      domain,
      authorId: user.id,
      authorName: user.name,
      body: body.trim(),
      createdAt: 'À l’instant',
      followers: [user.id],
      replies: [],
      ...(image ? { media: { kind: 'image' as const, src: image } } : {})
    };
    if (scheduleAt && scheduleAt > Date.now() && onSchedule) {
      onSchedule({ ...post, scheduledAtMs: scheduleAt, createdAt: formatScheduleDate(scheduleAt) });
    } else {
      onPublish(post);
    }
    reset();
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={
        view === 'schedule' ? 'Programmer la publication' : view === 'scheduled' ? 'Publications programmées' : 'Nouvelle contribution'
      }
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form className={`pc pc-view-${view}`} onSubmit={submit}>
        {view === 'compose' && (
          <>
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
                    <Select value={kind} onChange={(e) => setKind(e.target.value as 'publication' | 'question')}>
                      <option value="publication">Astuce ou méthode</option>
                      <option value="question">Question d’entraide</option>
                    </Select>
                    <ChevronDown size={16} aria-hidden="true" />
                  </label>
                  <label className="pc-chip pc-chip-select">
                    <Hash size={16} aria-hidden="true" />
                    <span className="sr-only">Domaine</span>
                    <Select value={domain} onChange={(e) => setDomain(e.target.value as typeof domain)}>
                      <option value="Numérique">Numérique</option>
                      <option value="Communication">Communication</option>
                      <option value="Gestion">Gestion</option>
                    </Select>
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
                onKeyDown={onBodyKeyDown}
              />
              {image && (
                <div className="pc-image">
                  <img src={image} alt="Aperçu de l’image jointe" />
                  <button type="button" aria-label="Retirer l’image" title="Retirer l’image" onClick={() => setImage(null)}>
                    <X size={18} />
                  </button>
                </div>
              )}
              {imageError && (
                <p className="modal-error" role="alert">
                  {imageError}
                </p>
              )}
            </div>

            <div className="pc-tools" role="toolbar" aria-label="Outils de rédaction">
              <div className="pc-tool-wrap">
                <button
                  type="button"
                  className="pc-tool"
                  aria-label="Afficher le sélecteur d’émoticônes"
                  aria-expanded={emojiOpen}
                  title="Émoticônes"
                  onClick={() => setEmojiOpen((v) => !v)}
                >
                  <Smile size={22} />
                </button>
                {emojiOpen && (
                  <div className="pc-emoji" role="group" aria-label="Émoticônes">
                    {COMPOSER_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        aria-label={`Insérer ${emoji}`}
                        onClick={() => {
                          insertText(emoji);
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
                aria-label={image ? 'Remplacer l’image' : 'Ajouter une image'}
                title={image ? 'Remplacer l’image' : 'Ajouter une image'}
                onClick={() => fileRef.current?.click()}
              >
                <ImageIcon size={22} />
              </button>
              <input ref={fileRef} className="sr-only" type="file" accept="image/*" tabIndex={-1} aria-hidden="true" onChange={onPickImage} />
              <span className="pc-tools-sep" aria-hidden="true" />
              <button
                type="button"
                className="pc-tool"
                aria-label="Gras"
                title="Gras (Ctrl+B)"
                onClick={() => wrapSelection('**', 'texte en gras')}
              >
                <Bold size={22} />
              </button>
              <button
                type="button"
                className="pc-tool"
                aria-label="Italique"
                title="Italique (Ctrl+I)"
                onClick={() => wrapSelection('*', 'texte en italique')}
              >
                <Italic size={22} />
              </button>
              <button
                type="button"
                className="pc-tool"
                aria-label="Liste à puces"
                title="Liste à puces"
                onClick={() => prefixLines(() => '• ')}
              >
                <List size={22} />
              </button>
              <button
                type="button"
                className="pc-tool"
                aria-label="Étapes numérotées"
                title="Étapes numérotées"
                onClick={() => prefixLines((index) => `${index + 1}. `)}
              >
                <ListOrdered size={22} />
              </button>
            </div>

            <footer className="pc-foot">
              {scheduleAt && (
                <span className="pc-when">
                  <Clock size={16} aria-hidden="true" />
                  Programmée : {formatScheduleDate(scheduleAt)}
                  <button type="button" aria-label="Retirer la programmation" title="Publier tout de suite" onClick={() => setScheduleAt(null)}>
                    <X size={14} />
                  </button>
                </span>
              )}
              {canSchedule && (
                <button
                  type="button"
                  className="pc-clock"
                  aria-label={scheduleAt ? 'Modifier la date de publication' : 'Programmer pour plus tard'}
                  title={scheduleAt ? 'Modifier la date de publication' : 'Programmer pour plus tard'}
                  onClick={openSchedule}
                >
                  <Clock size={22} />
                </button>
              )}
              <button type="submit" className="primary pc-submit" disabled={!ready}>
                {scheduleAt ? 'Programmer' : 'Publier'}
              </button>
            </footer>
          </>
        )}

        {view === 'schedule' && (
          <>
            <header className="pc-sub-head">
              <button type="button" className="pc-close" aria-label="Retour à la rédaction" onClick={() => setView('compose')}>
                <ArrowLeft size={22} />
              </button>
              <h2>Programmer la publication</h2>
              <button type="button" className="pc-close" aria-label="Fermer" onClick={onClose}>
                <X size={24} />
              </button>
            </header>
            <div className="pc-sub-body">
              <div className="pc-sched-fields">
                <label>
                  Date
                  <input
                    type="date"
                    required
                    min={toDateInput(new Date())}
                    value={dateValue}
                    onChange={(e) => setDateValue(e.target.value)}
                  />
                </label>
                <label>
                  Heure
                  <input type="time" required value={timeValue} onChange={(e) => setTimeValue(e.target.value)} />
                </label>
              </div>
              <p className={scheduleValid ? 'pc-sched-note' : 'pc-sched-note is-error'} role={scheduleValid ? undefined : 'alert'}>
                {scheduleValid
                  ? `La contribution paraîtra le ${formatScheduleDate(candidate)} (heure de cet appareil).`
                  : `Choisissez un moment à venir, dans les ${MAX_SCHEDULE_DAYS} prochains jours.`}
              </p>
              <p className="pc-sched-note">
                Démonstration : si SAVOIR+ est fermé à l’heure prévue, la contribution paraît à la prochaine ouverture.
              </p>
              <button type="button" className="pc-link" onClick={() => setView('scheduled')}>
                Voir les publications programmées ({pending.length})
              </button>
            </div>
            <footer className="pc-foot">
              <button type="button" className="secondary pc-submit" onClick={() => setView('compose')}>
                Retour
              </button>
              <button type="submit" className="primary pc-submit" disabled={!scheduleValid}>
                Suivant
              </button>
            </footer>
          </>
        )}

        {view === 'scheduled' && (
          <>
            <header className="pc-sub-head">
              <button type="button" className="pc-close" aria-label="Retour à la rédaction" onClick={() => setView('compose')}>
                <ArrowLeft size={22} />
              </button>
              <h2>Publications programmées</h2>
              <button type="button" className="pc-close" aria-label="Fermer" onClick={onClose}>
                <X size={24} />
              </button>
            </header>
            <div className="pc-sub-body">
              {pending.length === 0 ? (
                <p className="pc-sched-empty">Aucune publication programmée.</p>
              ) : (
                <ul className="pc-sched-list">
                  {pending.map((post) => (
                    <li key={post.id}>
                      <div className="pc-sched-main">
                        <b>{post.title}</b>
                        <small>
                          {formatScheduleDate(post.scheduledAtMs ?? 0)} · {post.kind === 'question' ? 'Question' : 'Astuce'} ·{' '}
                          {post.domain}
                        </small>
                      </div>
                      {confirmDeleteId === post.id ? (
                        <span className="pc-sched-actions">
                          <span>Supprimer ?</span>
                          <button
                            type="button"
                            className="pc-link is-danger"
                            onClick={() => {
                              onDeleteScheduled?.(post.id);
                              setConfirmDeleteId(null);
                            }}
                          >
                            Oui
                          </button>
                          <button type="button" className="pc-link" onClick={() => setConfirmDeleteId(null)}>
                            Non
                          </button>
                        </span>
                      ) : (
                        <span className="pc-sched-actions">
                          <button type="button" className="pc-link" onClick={() => onPublishScheduled?.(post.id)}>
                            Publier maintenant
                          </button>
                          <button type="button" className="pc-link is-danger" onClick={() => setConfirmDeleteId(post.id)}>
                            Supprimer
                          </button>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <footer className="pc-foot">
              <button type="button" className="secondary pc-submit" onClick={() => setView('compose')}>
                Retour
              </button>
            </footer>
          </>
        )}
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
          <Select value={reason} onChange={(e) => setReason(e.target.value)}>
            <option>Harcèlement ou propos abusifs</option>
            <option>Désinformation pédagogique ou technique</option>
            <option>Spam ou sollicitation répétée</option>
            <option>Usurpation d’identité</option>
            <option>Exposition de données personnelles</option>
            <option>Autre</option>
          </Select>
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

/** Fenêtre « Changer de compte » : le choix d'un personnage de démonstration, rien d'autre. */
export function DemoAuthModal({
  open,
  onClose,
  uid,
  mode,
  people,
  onSwitchPerson
}: {
  open: boolean;
  onClose: () => void;
  uid: string;
  mode: string;
  people: Profile[];
  onSwitchPerson: (id: string) => void;
}) {
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
    { id: 'elom', title: 'Elom Dogbé', subtitle: 'Élève de Terminale · 17 ans' },
    { id: 'kokou', title: 'Kokou Dogbé', subtitle: 'Élève de CM2 · 10 ans, attend son code' },
    { id: 'akouvi', title: 'Akouvi Dogbé', subtitle: 'Parent · deux enfants' },
    { id: 'kossi', title: 'Kossi Agbo', subtitle: 'Enseignant · Studio et classes' },
    { id: 'palmiers', title: 'Les Palmiers', subtitle: 'Établissement · classes et membres' },
    { id: 'nadege', title: 'Nadège Koffi', subtitle: 'Modération & Gouvernance' }
  ];

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Changer de compte"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal modal-wide">
        <button type="button" className="icon-btn modal-close" aria-label="Fermer" onClick={onClose}>
          <X size={18} />
        </button>

        <h2>Changer de compte</h2>
        <p>
          Explorez SAVOIR+ avec sept personnages fictifs : une apprenante, deux élèves, un parent, un enseignant, un établissement
          et la gouvernance. Chacun voit ce que son profil autorise.
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
              <button key={d.id} type="button" className={selected ? 'selected' : ''} aria-pressed={selected} onClick={() => onSwitchPerson(d.id)}>
                <Avatar person={p} small />
                <b>{d.title}</b>
                <span>{d.subtitle}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
