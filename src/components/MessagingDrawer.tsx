import React, { useEffect, useRef } from 'react';
import {
  ArrowLeft,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Flag,
  Lock,
  Maximize2,
  MessageCircle,
  Send
} from 'lucide-react';
import type { Message, Profile, Relation } from '../data';
import { canSend } from '../domain.mjs';
import { Avatar } from './ProfileIdentityCard';

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
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  const acceptedRelations = relations.filter((r) => r.status === 'accepted');
  const activeRel = relations.find((r) => r.id === selected);
  const other = activeRel ? people.find((p) => p.id === activeRel.members.find((id) => id !== user.id)) : null;

  return (
    <aside className={`message-drawer ${open ? 'open' : ''}`} aria-label="Messagerie rapide">
      <div className="drawer-bar">
        <button
          id="drawer-toggle"
          className="drawer-toggle"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <Avatar person={user} small />
          <span>Messagerie</span>
          {acceptedRelations.length > 0 && <em className="drawer-count tabular-nums">{acceptedRelations.length}</em>}
          {open ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
        <button
          className="icon-btn"
          title="Ouvrir la messagerie en pleine page"
          aria-label="Ouvrir la messagerie en pleine page"
          onClick={onOpenFullMessaging}
        >
          <Maximize2 size={14} />
        </button>
      </div>

      {open && (
        <div className="drawer-body">
          {error && <div className="drawer-error">{error}</div>}
          {activeRel && other ? (
            <div className="chat-panel">
              <div className="chat-header">
                <button
                  className="icon-btn"
                  aria-label="Retour aux discussions"
                  onClick={() => setSelected('')}
                >
                  <ArrowLeft size={15} />
                </button>
                <button className="identity-link" onClick={() => onOpenProfile(other)}>
                  <Avatar person={other} small />
                  <div>
                    <b>{other.name}</b>
                    <span>Discussion directe</span>
                  </div>
                </button>
                <button
                  className="icon-btn"
                  title="Signaler cet échange"
                  aria-label="Signaler cet échange"
                  onClick={() => onOpenReport(`Échange privé avec ${other.name}`)}
                >
                  <Flag size={13} />
                </button>
                <button
                  className="text-link danger"
                  disabled={busy}
                  onClick={() => onToggleBlock(activeRel)}
                >
                  {activeRel.blockedBy.includes(user.id) ? 'Débloquer' : 'Bloquer'}
                </button>
              </div>

              <div className="chat-messages">
                <div className="chat-context">
                  <Lock size={11} /> Échange accepté entre participants
                </div>
                {messages.length === 0 ? (
                  <div className="chat-welcome">
                    <MessageCircle size={26} />
                    <h3>Démarrez la discussion</h3>
                    <p>Posez une question ou partagez votre avancée avec {other.name}.</p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`message ${m.author === user.id ? 'mine' : ''}`}>
                      <p>{m.text}</p>
                      <small>
                        {new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        {m.author === user.id && <CheckCheck size={11} />}
                      </small>
                    </div>
                  ))
                )}
                <div ref={endRef} />
              </div>

              {canSend(activeRel, user.id) ? (
                <form
                  className="chat-compose"
                  onSubmit={(e) => {
                    e.preventDefault();
                    onSend();
                  }}
                >
                  <input
                    aria-label="Écrire un message"
                    placeholder="Écrire un message…"
                    maxLength={1000}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <button type="submit" className="primary" disabled={busy || !draft.trim()} aria-label="Envoyer">
                    <Send size={14} />
                  </button>
                </form>
              ) : (
                <div className="chat-blocked">
                  <Lock size={13} /> Envoi suspendu suite à un blocage.
                </div>
              )}
            </div>
          ) : (
            <div className="conversation-list">
              <div className="conversation-title">
                <h3>Discussions récentes</h3>
                <button className="text-link" onClick={onOpenFullMessaging}>
                  Tout voir
                </button>
              </div>
              {acceptedRelations.length === 0 ? (
                <div className="conversation-empty">
                  <p>Aucune discussion active pour le moment.</p>
                  <button className="secondary" onClick={onOpenRelations}>
                    Découvrir des membres
                  </button>
                </div>
              ) : (
                acceptedRelations.map((r) => {
                  const p = people.find((x) => x.id === r.members.find((id) => id !== user.id));
                  if (!p) return null;
                  return (
                    <button key={r.id} onClick={() => setSelected(r.id)}>
                      <Avatar person={p} small />
                      <div>
                        <b>{p.name}</b>
                        <small>{r.blockedBy.length ? 'Échange bloqué' : p.role}</small>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
