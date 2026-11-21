import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, FileText, Image as ImageIcon, Lock, MoreHorizontal, Paperclip, Smile, X } from 'lucide-react';
import type { Message, MessageAttachment, Profile, Relation } from '../data';
import { readImageAsDataUrl } from './ContextualModals';
import {
  EMOJI_GROUPS,
  GifView,
  MAX_ATTACHMENT_BYTES,
  MessageAttachmentView,
  formatBytes,
  readFileAsDataUrl,
  searchGifs
} from './MessageExtras';
import { Avatar } from './ProfileIdentityCard';

/** Deux messages d'une même personne à moins de 5 minutes d'écart sont regroupés (comme LinkedIn). */
const GROUP_WINDOW_MS = 5 * 60 * 1000;

type ThreadItem =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'group'; key: string; author: string; at: number; messages: Message[] };

function dayLabel(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (same(d, today)) return 'Aujourd’hui';
  if (same(d, yesterday)) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function buildThread(messages: Message[]): ThreadItem[] {
  const items: ThreadItem[] = [];
  let lastDay = '';
  let current: Extract<ThreadItem, { kind: 'group' }> | null = null;
  for (const m of [...messages].sort((a, b) => a.createdAt - b.createdAt)) {
    const day = new Date(m.createdAt).toDateString();
    if (day !== lastDay) {
      items.push({ kind: 'day', key: `day-${day}`, label: dayLabel(m.createdAt) });
      lastDay = day;
      current = null;
    }
    const last = current?.messages[current.messages.length - 1];
    if (current && current.author === m.author && last && m.createdAt - last.createdAt < GROUP_WINDOW_MS) {
      current.messages.push(m);
    } else {
      current = { kind: 'group', key: m.id, author: m.author, at: m.createdAt, messages: [m] };
      items.push(current);
    }
  }
  return items;
}

/** Fil de messages au style LinkedIn : en-tête (avatar, nom, heure) puis textes, sans bulles. */
export function MessageThread({ messages, people }: { messages: Message[]; people: Profile[] }) {
  const items = useMemo(() => buildThread(messages), [messages]);
  return (
    <ol className="li-thread" aria-label="Messages">
      {items.map((item) =>
        item.kind === 'day' ? (
          <li key={item.key} className="li-thread-day">
            <span>{item.label}</span>
          </li>
        ) : (
          <li key={item.key} className="li-thread-group">
            {(() => {
              const author = people.find((p) => p.id === item.author);
              return (
                <>
                  {author ? <Avatar person={author} small /> : <span className="li-thread-avatar-fallback" aria-hidden="true" />}
                  <div className="li-thread-body">
                    <div className="li-thread-head">
                      <b>{author?.name || 'Membre'}</b>
                      <span aria-hidden="true">•</span>
                      <time dateTime={new Date(item.at).toISOString()}>
                        {new Date(item.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                    {item.messages.map((m) => (
                      <React.Fragment key={m.id}>
                        {m.text && <p className="li-thread-text">{m.text}</p>}
                        {m.attachment && <MessageAttachmentView attachment={m.attachment} />}
                      </React.Fragment>
                    ))}
                  </div>
                </>
              );
            })()}
          </li>
        )
      )}
    </ol>
  );
}

/**
 * Zone de saisie au style LinkedIn : grand champ sur fond gris, puis la barre — image, pièce jointe, GIF,
 * émoticônes à gauche, « Envoyer » à droite. Une image ou un fichier choisi s'affiche au-dessus de la
 * barre jusqu'à l'envoi ; un GIF part dès qu'on le choisit (avec le texte déjà saisi).
 */
export function MessageComposer({
  draft,
  setDraft,
  onSend,
  busy,
  compact = false,
  attachments = false
}: {
  draft: string;
  setDraft: (v: string) => void;
  /** Renvoie `false` si l'envoi a échoué : la pièce jointe reste alors en attente. */
  onSend: (attachment?: MessageAttachment) => void | Promise<boolean | void>;
  busy: boolean;
  compact?: boolean;
  /** Images, fichiers et GIF (démonstration locale) ; les émoticônes sont toujours proposées. */
  attachments?: boolean;
}) {
  const [pending, setPending] = useState<MessageAttachment | null>(null);
  const [panel, setPanel] = useState<'emoji' | 'gif' | null>(null);
  const [emojiGroup, setEmojiGroup] = useState(EMOJI_GROUPS[0].id);
  const [gifQuery, setGifQuery] = useState('');
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Un panneau ouvert (émoticônes, GIF) se ferme d'un clic ailleurs ou avec Échap.
  useEffect(() => {
    if (!panel) return;
    const onDown = (e: MouseEvent) => {
      if (!formRef.current?.contains(e.target as Node)) setPanel(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setPanel(null);
      textRef.current?.focus();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [panel]);

  const canSubmit = !busy && (draft.trim().length > 0 || Boolean(pending));
  const send = (attachment?: MessageAttachment) => {
    setError('');
    Promise.resolve(onSend(attachment)).then((ok) => {
      if (ok !== false && attachment === pending) setPending(null);
    });
  };
  const submit = () => {
    if (!canSubmit) return;
    setPanel(null);
    send(pending || undefined);
  };

  const insertEmoji = (emoji: string) => {
    const el = textRef.current;
    const start = el?.selectionStart ?? draft.length;
    const end = el?.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + emoji + draft.slice(end);
    if (next.length > 1000) return;
    setDraft(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const pickImage = async (file?: File) => {
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) {
      setError('Choisissez une image (JPEG, PNG, GIF ou WebP).');
      return;
    }
    try {
      // Un GIF animé garde son animation : il n'est pas redessiné, mais il est limité à 1 Mo.
      if (file.type === 'image/gif') {
        if (file.size > MAX_ATTACHMENT_BYTES) {
          setError(`GIF trop lourd (${formatBytes(file.size)}) : 1 Mo au plus.`);
          return;
        }
        setPending({ kind: 'image', name: file.name, dataUrl: await readFileAsDataUrl(file) });
      } else {
        setPending({ kind: 'image', name: file.name, dataUrl: await readImageAsDataUrl(file) });
      }
    } catch {
      setError('Impossible de lire cette image.');
    }
  };

  const pickFile = async (file?: File) => {
    if (!file) return;
    setError('');
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setError(`Fichier trop lourd (${formatBytes(file.size)}) : 1 Mo au plus.`);
      return;
    }
    try {
      setPending({
        kind: 'file',
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        dataUrl: await readFileAsDataUrl(file)
      });
    } catch {
      setError('Impossible de lire ce fichier.');
    }
  };

  const group = EMOJI_GROUPS.find((g) => g.id === emojiGroup) || EMOJI_GROUPS[0];
  const gifs = searchGifs(gifQuery);
  const toggle = (which: 'emoji' | 'gif') => setPanel((v) => (v === which ? null : which));

  return (
    <form
      ref={formRef}
      className={`li-compose ${compact ? 'is-compact' : ''}`}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <textarea
        ref={textRef}
        aria-label="Écrire un message"
        placeholder="Écrire un message…"
        maxLength={1000}
        rows={compact ? 2 : 3}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
      />

      {pending && (
        <div className="li-compose-attachment">
          {pending.kind === 'image' ? (
            <img src={pending.dataUrl} alt="" />
          ) : (
            <span className="li-compose-attachment-icon" aria-hidden="true">
              <FileText size={20} />
            </span>
          )}
          <span className="li-compose-attachment-name">
            <b>{pending.kind === 'gif' ? 'GIF' : pending.name || 'Image'}</b>
            {pending.kind === 'file' && <small>{formatBytes(pending.size)}</small>}
          </span>
          <button type="button" className="li-icon-btn" aria-label="Retirer la pièce jointe" title="Retirer" onClick={() => setPending(null)}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}
      {error && (
        <p className="li-compose-error" role="alert">
          {error}
        </p>
      )}

      {panel === 'emoji' && (
        <div className="li-compose-pop li-emoji-pop" role="dialog" aria-label="Émoticônes">
          <div className="li-emoji-tabs" role="tablist" aria-label="Catégories">
            {EMOJI_GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={g.id === group.id}
                aria-label={g.label}
                title={g.label}
                className={g.id === group.id ? 'is-on' : ''}
                onClick={() => setEmojiGroup(g.id)}
              >
                {g.emojis[0]}
              </button>
            ))}
          </div>
          <p className="li-emoji-title">{group.label}</p>
          <div className="li-emoji-grid">
            {group.emojis.map((emoji) => (
              <button key={emoji} type="button" aria-label={`Insérer ${emoji}`} onClick={() => insertEmoji(emoji)}>
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {panel === 'gif' && (
        <div className="li-compose-pop li-gif-pop" role="dialog" aria-label="GIF">
          <input
            type="search"
            className="li-gif-search"
            placeholder="Rechercher un GIF"
            aria-label="Rechercher un GIF"
            value={gifQuery}
            onChange={(e) => setGifQuery(e.target.value)}
            autoFocus
          />
          <div className="li-gif-grid">
            {gifs.map((g) => (
              <button
                key={g.id}
                type="button"
                className="li-gif-tile"
                aria-label={`Envoyer le GIF « ${g.caption} »`}
                disabled={busy}
                onClick={() => {
                  setPanel(null);
                  setGifQuery('');
                  send({ kind: 'gif', id: g.id });
                }}
              >
                <GifView id={g.id} size="tile" />
              </button>
            ))}
            {gifs.length === 0 && <p className="li-gif-empty">Aucun GIF pour « {gifQuery.trim()} ».</p>}
          </div>
        </div>
      )}

      <div className="li-compose-bar">
        <div className="li-compose-tools">
          {attachments && (
            <>
              <button type="button" className="li-icon-btn" aria-label="Joindre une image" title="Image" onClick={() => imageRef.current?.click()}>
                <ImageIcon size={20} aria-hidden="true" />
              </button>
              <button type="button" className="li-icon-btn" aria-label="Joindre un fichier" title="Pièce jointe" onClick={() => fileRef.current?.click()}>
                <Paperclip size={20} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`li-icon-btn${panel === 'gif' ? ' is-on' : ''}`}
                aria-label="Choisir un GIF"
                aria-expanded={panel === 'gif'}
                title="GIF"
                onClick={() => toggle('gif')}
              >
                <span className="li-gif-icon" aria-hidden="true">
                  GIF
                </span>
              </button>
            </>
          )}
          <button
            type="button"
            className={`li-icon-btn${panel === 'emoji' ? ' is-on' : ''}`}
            aria-label="Ouvrir les émoticônes"
            aria-expanded={panel === 'emoji'}
            title="Émoticônes"
            onClick={() => toggle('emoji')}
          >
            <Smile size={20} aria-hidden="true" />
          </button>
          <input
            ref={imageRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              void pickImage(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <input
            ref={fileRef}
            type="file"
            hidden
            onChange={(e) => {
              void pickFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>
        <button type="submit" className="primary li-send-btn" disabled={!canSubmit}>
          Envoyer
        </button>
      </div>
    </form>
  );
}

/** Zone de fil qui reste calée sur le dernier message (sans faire défiler la page),
 *  avec un bouton rond pour y revenir quand on remonte dans l'historique. */
export function ThreadScroll({ className, watch, children }: { className: string; watch: unknown; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [away, setAway] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
    setAway(false);
  }, [watch]);
  return (
    <div className="li-thread-wrap">
      <div
        ref={ref}
        className={className}
        onScroll={(e) => {
          const el = e.currentTarget;
          setAway(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
        }}
      >
        {children}
      </div>
      {away && (
        <button
          type="button"
          className="li-thread-jump"
          aria-label="Revenir au dernier message"
          onClick={() => ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' })}
        >
          <ArrowDown size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/** Carte de profil en tête de discussion, comme sur LinkedIn. */
export function ConversationIntro({ person, onOpenProfile }: { person: Profile; onOpenProfile: () => void }) {
  return (
    <div className="li-thread-intro">
      <button type="button" className="li-thread-intro-id" onClick={onOpenProfile}>
        <Avatar person={person} className="li-thread-intro-avatar" />
        <b>{person.name}</b>
      </button>
      <span className="li-thread-intro-role">{person.role}</span>
      <span className="li-thread-intro-privacy">
        <Lock size={12} aria-hidden="true" /> Échange privé entre participants ayant accepté la relation
      </span>
    </div>
  );
}

export type ConversationMenuItem = {
  label: string;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
  /** Icône devant le libellé (menu d'une publication). */
  icon?: React.ReactNode;
};

/** Menu « … » de la discussion : profil, signalement, blocage. */
export function ConversationMenu({ items, label = 'Plus d’options' }: { items: ConversationMenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return (
    <div className="li-menu" ref={ref}>
      <button
        type="button"
        className="li-icon-btn"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal size={20} aria-hidden="true" />
      </button>
      {open && (
        <div className="li-menu-list" role="menu">
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              className={it.danger ? 'is-danger' : ''}
              disabled={it.disabled}
              onClick={() => {
                setOpen(false);
                it.onSelect();
              }}
            >
              {it.icon}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function normalizeSearch(v: string): string {
  return v
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Bas de fenêtre quand la discussion n'est pas encore ouverte : demander, patienter ou répondre. */
export function ConversationGate({
  rel,
  userId,
  other,
  friend = false,
  busy,
  onRequestContact,
  onDecideContact
}: {
  rel?: Relation;
  userId: string;
  other: Profile;
  /** Amis (ils se suivent l'un l'autre) : la discussion s'ouvre sans demande. */
  friend?: boolean;
  busy: boolean;
  onRequestContact: (p: Profile) => void;
  onDecideContact: (r: Relation, decision: 'accepted' | 'declined') => void;
}) {
  if (rel?.status === 'pending' && rel.requester !== userId) {
    return (
      <div className="bubble-gate">
        <p>{other.name} souhaite échanger avec vous en privé.</p>
        <div className="bubble-gate-actions">
          <button type="button" className="secondary" disabled={busy} onClick={() => onDecideContact(rel, 'declined')}>
            Refuser
          </button>
          <button type="button" className="primary" disabled={busy} onClick={() => onDecideContact(rel, 'accepted')}>
            Accepter
          </button>
        </div>
      </div>
    );
  }
  if (rel?.status === 'pending') {
    return (
      <div className="bubble-gate">
        <p>Demande envoyée. La discussion s’ouvrira dès que {other.name.split(' ')[0]} l’aura acceptée.</p>
      </div>
    );
  }
  return (
    <div className="bubble-gate">
      <p>
        {friend
          ? `Vous vous suivez l’un l’autre : écrivez directement à ${other.name.split(' ')[0]}.`
          : 'Sur SAVOIR+, l’échange privé s’ouvre une fois votre demande acceptée.'}
      </p>
      <div className="bubble-gate-actions">
        <button type="button" className="primary" disabled={busy} onClick={() => onRequestContact(other)}>
          {friend ? 'Discuter' : 'Demander à discuter'}
        </button>
      </div>
    </div>
  );
}

/** Deuxième ligne d'une discussion dans la liste : premier message d'une demande, sinon le titre. */
export function contactStatusLabel(
  rel: Relation | undefined,
  userId: string,
  headline: string,
  preview?: string
): string {
  if (!rel) return headline;
  if (rel.blockedBy.length) return 'Échange bloqué';
  if (rel.status === 'pending') {
    if (rel.requester === userId) return preview ? `Vous : ${preview}` : 'Demande envoyée · en attente';
    return preview || 'Vous propose une discussion';
  }
  return headline;
}

/** Ajoute la relation complète à chaque contact ; discussions ouvertes d'abord. */
export function withRelations<T extends { profile: Profile }>(contacts: T[], relations: Relation[], userId: string) {
  return contacts
    .map((c) => ({
      ...c,
      rel: relations.find((r) => r.members.includes(userId) && r.members.includes(c.profile.id) && r.status !== 'declined')
    }))
    .sort((a, b) => Number(b.rel?.status === 'accepted') - Number(a.rel?.status === 'accepted'));
}
