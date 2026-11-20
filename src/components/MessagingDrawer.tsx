import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Lock, Maximize2, MessageCircle, Search, X } from 'lucide-react';
import type { Message, MessageAttachment, Profile, Relation } from '../data';
import { canSend } from '../domain.mjs';
import { Avatar } from './ProfileIdentityCard';
import {
  contactStatusLabel,
  withRelations,
  ConversationGate,
  ConversationIntro,
  ConversationMenu,
  MessageComposer,
  MessageThread,
  ThreadScroll,
  normalizeSearch
} from './MessageThread';

/** Personne avec qui une discussion existe (acceptée, ou demande envoyée / reçue avec son premier message). */
export type DrawerContact = { profile: Profile; headline: string; preview?: string };

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
  attachments = false,
  onDeleteThread,
  onReportConversation,
  onToggleBlock,
  onOpenFullMessaging,
  onOpenRelations,
  onOpenProfile,
  onOpenReport,
  bubblePeerId,
  setBubblePeerId,
  contacts,
  onRequestContact,
  isFriend,
  onDecideContact
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
  onSend: (attachment?: MessageAttachment) => void | Promise<boolean | void>;
  /** Images, fichiers et GIF dans la barre de saisie (démonstration locale). */
  attachments?: boolean;
  /** Menu « … » › Signaler cette conversation : elle quitte ensuite la messagerie (comme sur LinkedIn). */
  onReportConversation?: (rel: Relation, other: Profile) => void;
  /** Menu « … » › Supprimer la discussion (la confirmation est demandée par l'appelant). */
  onDeleteThread?: (rel: Relation, other: Profile) => void;
  onToggleBlock: (r: Relation) => void;
  onOpenFullMessaging: () => void;
  onOpenRelations: () => void;
  onOpenProfile: (p: Profile) => void;
  onOpenReport: (targetLabel: string) => void;
  /** Personne dont la fenêtre de discussion est ouverte ('' si aucune). */
  bubblePeerId: string;
  setBubblePeerId: (peerId: string) => void;
  /** Personnes à qui on a déjà écrit ou qui nous ont écrit. */
  contacts: DrawerContact[];
  onRequestContact: (p: Profile) => void;
  /** Amis (ils se suivent l'un l'autre) : « Discuter » au lieu de « Demander à discuter ». */
  isFriend?: (id: string) => boolean;
  onDecideContact: (r: Relation, decision: 'accepted' | 'declined') => void;
}) {
  const [query, setQuery] = useState('');
  const [bubbleMin, setBubbleMin] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  // Personnes à qui on a déjà écrit, discussions ouvertes d'abord.
  const rows = withRelations(contacts, relations, user.id);
  const q = normalizeSearch(query);
  const visibleRows = q ? rows.filter((x) => normalizeSearch(x.profile.name).includes(q)) : rows;

  const bubbleContact = rows.find((x) => x.profile.id === bubblePeerId);
  const other = bubbleContact?.profile;
  const bubbleRel = bubbleContact?.rel;
  const isAccepted = bubbleRel?.status === 'accepted';

  // La fenêtre charge le fil de la relation acceptée avec la personne ouverte.
  useEffect(() => {
    if (bubblePeerId && bubbleRel && isAccepted && selected !== bubbleRel.id) setSelected(bubbleRel.id);
  }, [bubblePeerId, bubbleRel, isAccepted, selected, setSelected]);

  const openPerson = (peerId: string) => {
    setBubblePeerId(peerId);
    setBubbleMin(false);
  };

  return (
    <>
      {other && bubbleContact && (
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
                {!bubbleMin && <small>{bubbleContact.headline}</small>}
              </span>
            </button>
            {!bubbleMin && (
              <>
                <ConversationMenu
                  items={[
                    { label: 'Voir le profil', onSelect: () => onOpenProfile(other) },
                    ...(isAccepted && bubbleRel
                      ? [
                          {
                            label: 'Signaler cette conversation',
                            onSelect: () =>
                              onReportConversation ? onReportConversation(bubbleRel, other) : onOpenReport(`Échange privé avec ${other.name}`)
                          },
                          ...(onDeleteThread
                            ? [{ label: 'Supprimer la discussion', danger: true, onSelect: () => onDeleteThread(bubbleRel, other) }]
                            : []),
                          {
                            label: bubbleRel.blockedBy.includes(user.id) ? 'Débloquer' : 'Bloquer',
                            danger: true,
                            disabled: busy,
                            onSelect: () => onToggleBlock(bubbleRel)
                          }
                        ]
                      : [])
                  ]}
                />
                {isAccepted && (
                  <button
                    type="button"
                    className="li-icon-btn"
                    aria-label="Ouvrir en pleine page"
                    title="Ouvrir en pleine page"
                    onClick={onOpenFullMessaging}
                  >
                    <Maximize2 size={16} aria-hidden="true" />
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              className="li-icon-btn"
              aria-label="Fermer la discussion"
              title="Fermer la discussion"
              onClick={() => setBubblePeerId('')}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>
          {!bubbleMin && (
            <>
              <ThreadScroll className="bubble-scroll" watch={isAccepted ? messages : bubbleRel?.status}>
                {/* La carte de présentation s'efface dès le premier message, comme sur LinkedIn. */}
                {!(isAccepted && selected === bubbleRel?.id && messages.length > 0) && (
                  <ConversationIntro person={other} onOpenProfile={() => onOpenProfile(other)} />
                )}
                {isAccepted && selected === bubbleRel?.id && (
                  <MessageThread messages={messages} people={[user, other, ...people]} />
                )}
              </ThreadScroll>
              {error && <div className="drawer-error">{error}</div>}
              {isAccepted && bubbleRel ? (
                canSend(bubbleRel, user.id) ? (
                  <MessageComposer draft={draft} setDraft={setDraft} onSend={onSend} busy={busy} attachments={attachments} compact />
                ) : (
                  <div className="chat-blocked">
                    <Lock size={13} aria-hidden="true" /> Envoi suspendu suite à un blocage.
                  </div>
                )
              ) : (
                <ConversationGate
                  rel={bubbleRel}
                  userId={user.id}
                  other={other}
                  friend={Boolean(isFriend?.(other.id))}
                  busy={busy}
                  onRequestContact={onRequestContact}
                  onDecideContact={onDecideContact}
                />
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
            {error && !other && <div className="drawer-error">{error}</div>}
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
                <div className="conversation-empty is-centered">
                  <MessageCircle size={28} aria-hidden="true" />
                  <p>Aucune discussion</p>
                </div>
              ) : visibleRows.length === 0 ? (
                <p className="conversation-empty">Aucune personne ne correspond à « {query} ».</p>
              ) : (
                visibleRows.map(({ profile: p, headline, preview, rel }) => (
                  <button
                    key={p.id}
                    type="button"
                    role="listitem"
                    className={`conversation-row ${bubblePeerId === p.id ? 'active' : ''}`}
                    onClick={() => openPerson(p.id)}
                  >
                    <Avatar person={p} />
                    <span className="conversation-row-text">
                      <b>{p.name}</b>
                      <small>{contactStatusLabel(rel, user.id, headline, preview)}</small>
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
