import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Lock, Maximize2, Search, X } from 'lucide-react';
import type { Message, Profile, Relation } from '../data';
import { canSend } from '../domain.mjs';
import { Avatar } from './ProfileIdentityCard';
import {
  ConversationIntro,
  ConversationMenu,
  MessageComposer,
  MessageThread,
  ThreadScroll,
  normalizeSearch
} from './MessageThread';

export function MessagingDrawer({
  open,
  setOpen,
  user,
  people,
  relations,
  selected,
  setSelected,
  messages,
  draft,
  setDraft,
  busy,
  error,
  onSend,
  onToggleBlock,
  onOpenFullMessaging,
  onOpenRelations,
  onOpenProfile,
  onOpenReport
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  user: Profile;
  people: Profile[];
  relations: Relation[];
  selected: string;
  setSelected: (id: string) => void;
  messages: Message[];
  draft: string;
  setDraft: (v: string) => void;
  busy: boolean;
  error: string;
  onSend: () => void;
  onToggleBlock: (r: Relation) => void;
  onOpenFullMessaging: () => void;
  onOpenRelations: () => void;
  onOpenProfile: (p: Profile) => void;
  onOpenReport: (targetLabel: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [bubbleMin, setBubbleMin] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  const acceptedRelations = relations.filter((r) => r.status === 'accepted');
  const rows = acceptedRelations
    .map((r) => ({ r, p: people.find((x) => x.id === r.members.find((id) => id !== user.id)) }))
    .filter((x): x is { r: Relation; p: Profile } => Boolean(x.p));
  const q = normalizeSearch(query);
  const visibleRows = q ? rows.filter((x) => normalizeSearch(x.p.name).includes(q)) : rows;

  const activeRel = relations.find((r) => r.id === selected);
  const other = activeRel ? people.find((p) => p.id === activeRel.members.find((id) => id !== user.id)) : null;
  const showBubble = Boolean(bubbleOpen && activeRel && other);

  const openThread = (relId: string) => {
    setSelected(relId);
    setBubbleOpen(true);
    setBubbleMin(false);
  };

  return (
    <>
      {showBubble && activeRel && other && (
        <section
          className={`message-bubble ${bubbleMin ? 'is-min' : ''}`}
          aria-label={`Discussion avec ${other.name}`}
        >
          <header className="bubble-head">
            <button
              type="button"
              className="bubble-id"
              aria-expanded={!bubbleMin}
              title={bubbleMin ? 'Afficher la discussion' : 'Réduire la discussion'}
              onClick={() => setBubbleMin((v) => !v)}
            >
              <Avatar person={other} small />
              <span className="bubble-id-text">
                <b>{other.name}</b>
                {!bubbleMin && <small>{other.role}</small>}
              </span>
            </button>
            {!bubbleMin && (
              <>
                <ConversationMenu
                  items={[
                    { label: 'Voir le profil', onSelect: () => onOpenProfile(other) },
                    { label: 'Signaler cet échange', onSelect: () => onOpenReport(`Échange privé avec ${other.name}`) },
                    {
                      label: activeRel.blockedBy.includes(user.id) ? 'Débloquer' : 'Bloquer',
                      danger: true,
                      disabled: busy,
                      onSelect: () => onToggleBlock(activeRel)
                    }
                  ]}
                />
                <button
                  type="button"
                  className="li-icon-btn"
                  aria-label="Ouvrir en pleine page"
                  title="Ouvrir en pleine page"
                  onClick={onOpenFullMessaging}
                >
                  <Maximize2 size={16} aria-hidden="true" />
                </button>
              </>
            )}
            <button
              type="button"
              className="li-icon-btn"
              aria-label="Fermer la discussion"
              title="Fermer la discussion"
              onClick={() => setBubbleOpen(false)}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>
          {!bubbleMin && (
            <>
              <ThreadScroll className="bubble-scroll" watch={messages}>
                <ConversationIntro person={other} onOpenProfile={() => onOpenProfile(other)} />
                <MessageThread messages={messages} people={[user, ...people.filter((p) => p.id !== user.id)]} />
              </ThreadScroll>
              {error && <div className="drawer-error">{error}</div>}
              {canSend(activeRel, user.id) ? (
                <MessageComposer draft={draft} setDraft={setDraft} onSend={onSend} busy={busy} compact />
              ) : (
                <div className="chat-blocked">
                  <Lock size={13} aria-hidden="true" /> Envoi suspendu suite à un blocage.
                </div>
              )}
            </>
          )}
        </section>
      )}

      <aside className={`message-drawer ${open ? 'open' : ''}`} aria-label="Messagerie rapide">
        <div className="drawer-bar">
          <button id="drawer-toggle" className="drawer-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
            <span className="presence-wrap">
              <Avatar person={user} small />
              <i className="presence-dot" aria-hidden="true" />
            </span>
            <span>Messagerie</span>
          </button>
          <button
            type="button"
            className="li-icon-btn"
            title="Ouvrir la messagerie en pleine page"
            aria-label="Ouvrir la messagerie en pleine page"
            onClick={onOpenFullMessaging}
          >
            <Maximize2 size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="li-icon-btn"
            aria-label={open ? 'Réduire la messagerie' : 'Déplier la messagerie'}
            onClick={() => setOpen(!open)}
          >
            {open ? <ChevronDown size={20} aria-hidden="true" /> : <ChevronUp size={20} aria-hidden="true" />}
          </button>
        </div>

        {open && (
          <div className="drawer-body">
            {error && !showBubble && <div className="drawer-error">{error}</div>}
            <label className="li-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                placeholder="Rechercher dans les messages"
                aria-label="Rechercher une discussion"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className="conversation-list" role="list">
              {rows.length === 0 ? (
                <div className="conversation-empty">
                  <p>Aucune discussion active pour le moment.</p>
                  <button className="secondary" onClick={onOpenRelations}>
                    Découvrir des membres
                  </button>
                </div>
              ) : visibleRows.length === 0 ? (
                <p className="conversation-empty">Aucun contact ne correspond à « {query} ».</p>
              ) : (
                visibleRows.map(({ r, p }) => (
                  <button
                    key={r.id}
                    type="button"
                    role="listitem"
                    className={`conversation-row ${showBubble && selected === r.id ? 'active' : ''}`}
                    onClick={() => openThread(r.id)}
                  >
                    <Avatar person={p} />
                    <span className="conversation-row-text">
                      <b>{p.name}</b>
                      <small>{r.blockedBy.length ? 'Échange bloqué' : p.role}</small>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
