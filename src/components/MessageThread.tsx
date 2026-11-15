import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, Lock, MoreHorizontal } from 'lucide-react';
import type { Message, Profile } from '../data';
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
                      <p key={m.id} className="li-thread-text">
                        {m.text}
                      </p>
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

/** Zone de saisie au style LinkedIn : grand champ sur fond gris, barre d'envoi en dessous. */
export function MessageComposer({
  draft,
  setDraft,
  onSend,
  busy,
  compact = false
}: {
  draft: string;
  setDraft: (v: string) => void;
  onSend: () => void;
  busy: boolean;
  compact?: boolean;
}) {
  const canSubmit = !busy && draft.trim().length > 0;
  return (
    <form
      className={`li-compose ${compact ? 'is-compact' : ''}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSend();
      }}
    >
      <textarea
        aria-label="Écrire un message"
        placeholder="Écrire un message…"
        maxLength={1000}
        rows={compact ? 2 : 3}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (canSubmit) onSend();
          }
        }}
      />
      <div className="li-compose-bar">
        <span className="li-compose-hint">Entrée pour envoyer · Maj + Entrée pour aller à la ligne</span>
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
        <span className={`avatar ${person.color} li-thread-intro-avatar`} aria-hidden="true">
          {person.initials || 'SV'}
        </span>
        <b>{person.name}</b>
      </button>
      <span className="li-thread-intro-role">{person.role}</span>
      <span className="li-thread-intro-privacy">
        <Lock size={12} aria-hidden="true" /> Échange privé entre participants ayant accepté la relation
      </span>
    </div>
  );
}

export type ConversationMenuItem = { label: string; onSelect: () => void; danger?: boolean; disabled?: boolean };

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
