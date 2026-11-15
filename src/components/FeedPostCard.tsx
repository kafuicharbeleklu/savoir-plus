import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Flag,
  MessageSquare,
  Repeat2,
  Send,
  ThumbsUp
} from 'lucide-react';
import type { Profile, Relation } from '../data';
import { CATALOG_ITEMS, type CommunityPost, type CommunityReply, type ExtendedDemoState } from '../wireframeData';
import { resolveCommunityAuthor, resolveDefaultCommentPreview } from '../personas';
import { Avatar, VerifiedBadge } from './ProfileIdentityCard';

export interface FeedPostCardProps {
  post: CommunityPost;
  currentUser: Profile;
  people: Profile[];
  ext: ExtendedDemoState;
  acceptedRelations: Relation[];
  followingIds: string[];
  onToggleFollowPerson: (targetId: string) => void;
  onTogglePostHelpful: (postId: string) => void;
  onAddReply: (postId: string, text: string, parentReplyId?: string, replyToName?: string) => void;
  onToggleReplyHelpful: (postId: string, replyId: string, replyAuthorId: string) => void;
  onSelectSolution?: (postId: string, replyId: string) => void;
  onRepost: (postId: string, note?: string) => void;
  onForwardToRelation: (relation: Relation, post: CommunityPost) => Promise<boolean> | boolean;
  onOpenMember: (memberId: string) => void;
  onOpenModule: (moduleId: string) => void;
  onOpenThread: (postId: string) => void;
  onOpenRelations: () => void;
  onReport: (targetLabel: string) => void;
  setToast: (msg: string) => void;
  defaultExpandedComments?: boolean;
  communityMemberIds?: string[];
}

export function FeedPostCard({
  post,
  currentUser,
  people,
  ext,
  acceptedRelations,
  followingIds,
  onToggleFollowPerson,
  onTogglePostHelpful,
  onAddReply,
  onToggleReplyHelpful,
  onSelectSolution,
  onRepost,
  onForwardToRelation,
  onOpenMember,
  onOpenModule,
  onOpenThread,
  onOpenRelations,
  onReport,
  setToast,
  defaultExpandedComments = false,
  communityMemberIds
}: FeedPostCardProps) {
  const authorMeta = useMemo(
    () => resolveCommunityAuthor(post.authorId, post.authorName, people, ext),
    [post.authorId, post.authorName, people, ext]
  );

  const [commentText, setCommentText] = useState('');
  const [threadExpanded, setThreadExpanded] = useState(defaultExpandedComments);
  const [composerOpen, setComposerOpen] = useState(defaultExpandedComments);
  const [showAllComments, setShowAllComments] = useState(defaultExpandedComments);
  const [replyingTo, setReplyingTo] = useState<{
    parentReplyId: string;
    targetAuthorName: string;
  } | null>(null);
  const [subReplyText, setSubReplyText] = useState('');

  const [repostMenuOpen, setRepostMenuOpen] = useState(false);
  const [repostQuoteMode, setRepostQuoteMode] = useState(false);
  const [repostNote, setRepostNote] = useState('');

  const [forwardMenuOpen, setForwardMenuOpen] = useState(false);
  const [forwardingId, setForwardingId] = useState<string | null>(null);

  const mainInputRef = useRef<HTMLInputElement>(null);
  const subInputRef = useRef<HTMLInputElement>(null);

  const postHelpfulBy = post.helpfulBy || [];
  const hasLikedPost = postHelpfulBy.includes(currentUser.id);
  const repostedBy = post.repostedBy || [];
  const hasReposted = repostedBy.includes(currentUser.id);
  const isPostAuthor = post.authorId === currentUser.id;

  // Organize replies into top-level threads + nested sub-replies
  const { topReplies, subRepliesByParent } = useMemo(() => {
    const top: CommunityReply[] = [];
    const map: Record<string, CommunityReply[]> = {};
    for (const r of post.replies) {
      if (r.parentReplyId) {
        map[r.parentReplyId] ||= [];
        map[r.parentReplyId].push(r);
      } else {
        top.push(r);
      }
    }
    return { topReplies: top, subRepliesByParent: map };
  }, [post.replies]);

  const effectiveCommunityIds = communityMemberIds ?? followingIds;
  const defaultPreviewReply = useMemo(
    () =>
      threadExpanded
        ? null
        : resolveDefaultCommentPreview(topReplies, effectiveCommunityIds, currentUser.id),
    [threadExpanded, topReplies, effectiveCommunityIds, currentUser.id]
  );

  const commentsSectionVisible = composerOpen || threadExpanded || Boolean(defaultPreviewReply);
  const visibleTopReplies = showAllComments ? topReplies : topReplies.slice(0, 2);
  const hiddenTopCount = Math.max(0, topReplies.length - visibleTopReplies.length);

  const focusCommentComposer = () => {
    setComposerOpen(true);
    setThreadExpanded(true);
    setRepostMenuOpen(false);
    setForwardMenuOpen(false);
    window.setTimeout(() => mainInputRef.current?.focus(), 40);
  };

  const handleSubmitMainComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddReply(post.id, commentText.trim());
    setCommentText('');
    setShowAllComments(true);
    setThreadExpanded(true);
    setComposerOpen(true);
  };

  const handleStartSubReply = (parentReplyId: string, targetAuthorName: string) => {
    setThreadExpanded(true);
    setShowAllComments(true);
    setReplyingTo({ parentReplyId, targetAuthorName });
    setSubReplyText('');
    window.setTimeout(() => subInputRef.current?.focus(), 40);
  };

  const handleSubmitSubReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingTo || !subReplyText.trim()) return;
    onAddReply(post.id, subReplyText.trim(), replyingTo.parentReplyId, replyingTo.targetAuthorName);
    setSubReplyText('');
    setReplyingTo(null);
    setShowAllComments(true);
  };

  const handleTriggerQuickRepost = () => {
    onRepost(post.id);
    setRepostMenuOpen(false);
    setRepostQuoteMode(false);
    setRepostNote('');
  };

  const handleSubmitQuoteRepost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repostNote.trim()) return;
    onRepost(post.id, repostNote.trim());
    setRepostMenuOpen(false);
    setRepostQuoteMode(false);
    setRepostNote('');
  };

  const handleCopyShareLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}#community-thread/${post.id}`;
    try {
      await navigator.clipboard?.writeText(url);
      setToast('Lien de la discussion copié');
    } catch {
      setToast('Référence : ' + post.title);
    }
    setForwardMenuOpen(false);
  };

  const renderReplyItem = (reply: CommunityReply, isNested: boolean, rootParentId: string) => {
    const rMeta = resolveCommunityAuthor(
      reply.authorId,
      reply.authorName,
      people,
      ext,
      reply.authorRole
    );
    const rLiked = reply.helpfulBy.includes(currentUser.id);
    const isSolution = post.kind === 'question' && post.solutionReplyId === reply.id;
    const isSelfReply = reply.authorId === currentUser.id;
    const linkedCatalog = reply.linkedModuleId
      ? CATALOG_ITEMS.find((c) => c.id === reply.linkedModuleId)
      : undefined;

    return (
      <div
        key={reply.id}
        className={`li-comment-node ${isNested ? 'is-nested' : ''} ${isSolution ? 'is-solution' : ''}`}
      >
        <div className="li-comment-row">
          {rMeta.isKnownMember ? (
            <button
              type="button"
              className="li-avatar-btn"
              aria-label={`Voir le profil de ${reply.authorName}`}
              onClick={() => onOpenMember(reply.authorId)}
            >
              <Avatar person={rMeta.profile} small />
            </button>
          ) : (
            <Avatar person={rMeta.profile} small />
          )}

          <div className="li-comment-main">
            <div className="li-comment-bubble">
              <div className="li-comment-head">
                <div className="li-comment-author-meta">
                  <div className="li-comment-name-line">
                    {rMeta.isKnownMember ? (
                      <button
                        type="button"
                        className="li-author-name-btn"
                        onClick={() => onOpenMember(reply.authorId)}
                      >
                        {reply.authorName}
                      </button>
                    ) : (
                      <b className="li-author-name">{reply.authorName}</b>
                    )}
                    {rMeta.verified && <VerifiedBadge />}
                    {isSolution && (
                      <span className="li-solution-tag">
                        <CheckCircle2 size={12} aria-hidden="true" /> Solution choisie
                      </span>
                    )}
                  </div>
                  <p className="li-comment-headline">{rMeta.headline}</p>
                </div>

                <div className="li-comment-head-right">
                  <span className="li-comment-time">{reply.createdAt}</span>
                </div>
              </div>

              <p className="li-comment-body">
                {reply.replyToName && (
                  <span className="li-mention">{reply.replyToName}</span>
                )}{' '}
                {reply.text}
              </p>

              {linkedCatalog && (
                <button
                  type="button"
                  className="li-linked-module"
                  onClick={() => onOpenModule(linkedCatalog.id)}
                >
                  Voir le module associé : <b>{linkedCatalog.title}</b> <ArrowRight size={13} />
                </button>
              )}
            </div>

            <div className="li-comment-actions">
              <button
                type="button"
                className={`li-comment-act ${rLiked ? 'is-active' : ''}`}
                aria-pressed={rLiked}
                disabled={isSelfReply}
                onClick={() => onToggleReplyHelpful(post.id, reply.id, reply.authorId)}
                aria-label={
                  isSelfReply
                    ? `Vote utile indisponible sur votre réponse (${reply.helpfulBy.length})`
                    : `Marquer cette réponse utile (${reply.helpfulBy.length})`
                }
                title={isSelfReply ? 'Vous ne pouvez pas voter pour votre propre réponse' : 'Utile'}
              >
                <ThumbsUp size={13} aria-hidden="true" fill={rLiked ? 'currentColor' : 'none'} />
                {reply.helpfulBy.length > 0 && (
                  <span className="li-count-num tabular-nums">{reply.helpfulBy.length}</span>
                )}
              </button>

              <button
                type="button"
                className="li-comment-act"
                onClick={() => handleStartSubReply(rootParentId, reply.authorName)}
                aria-label={`Répondre à ${reply.authorName}${(subRepliesByParent[reply.id]?.length || 0) > 0 ? ` (${subRepliesByParent[reply.id].length})` : ''}`}
                title="Répondre"
              >
                <MessageSquare size={13} aria-hidden="true" />
                {!isNested && (subRepliesByParent[reply.id]?.length || 0) > 0 && (
                  <span className="li-count-num tabular-nums">{subRepliesByParent[reply.id].length}</span>
                )}
              </button>

              {onSelectSolution && isPostAuthor && post.kind === 'question' && !isNested && (
                <>
                  <span className="li-act-dot" aria-hidden="true">·</span>
                  <button
                    type="button"
                    className={`li-comment-act ${isSolution ? 'is-solution-act' : ''}`}
                    onClick={() => onSelectSolution(post.id, reply.id)}
                    aria-label={isSolution ? 'Retirer la solution' : 'Choisir comme solution'}
                    title={isSolution ? 'Retirer la solution' : 'Choisir comme solution'}
                  >
                    <Check size={13} aria-hidden="true" />
                    <span>{isSolution ? 'Retirer la solution' : 'Choisir comme solution'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <article className="wf-card feed-post-card" aria-label={`Contribution : ${post.title}`}>
      {post.repostedFrom && (
        <div className="li-repost-banner">
          <Repeat2 size={14} aria-hidden="true" />
          <span>
            <b>{post.authorName}</b> a repartagé cette contribution · {post.createdAt}
          </span>
        </div>
      )}

      {/* Post Author Header */}
      <div className="li-post-header">
        <div className="li-post-author-left">
          {authorMeta.isKnownMember ? (
            <button
              type="button"
              className="li-avatar-btn"
              aria-label={`Voir le profil de ${post.authorName}`}
              onClick={() => onOpenMember(post.authorId)}
            >
              <Avatar person={authorMeta.profile} />
            </button>
          ) : (
            <Avatar person={authorMeta.profile} />
          )}

          <div className="li-post-author-info">
            <div className="li-post-name-row">
              {authorMeta.isKnownMember ? (
                <button
                  type="button"
                  className="li-author-name-btn"
                  onClick={() => onOpenMember(post.authorId)}
                >
                  {post.authorName}
                </button>
              ) : (
                <b className="li-author-name">{post.authorName}</b>
              )}
              {authorMeta.verified && <VerifiedBadge />}
              <span className="li-post-domain-sep" aria-hidden="true">·</span>
              <span className="li-post-domain">{post.domain}</span>
            </div>
            <p className="li-post-headline">{authorMeta.headline}</p>
            <p className="li-post-meta-sub">
              <span>{post.createdAt}</span>
              <span aria-hidden="true">·</span>
              <span>{post.kind === 'question' ? 'Question d’entraide' : 'Publication'}</span>
            </p>
          </div>
        </div>

        <div className="li-post-header-right">
          <button
            type="button"
            className="icon-btn icon-btn-xs"
            aria-label={`Signaler « ${post.title} »`}
            title="Signaler cette publication"
            onClick={() => onReport(`Communauté (${post.kind}) : ${post.title}`)}
          >
            <Flag size={14} />
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="li-post-content">
        {post.repostedFrom ? (
          <>
            {post.repostNote && <p className="li-post-body">{post.repostNote}</p>}
            <div className="li-repost-quote-box">
              <div className="li-repost-quote-meta">
                <b>{post.repostedFrom.authorName}</b>
                <span aria-hidden="true">·</span>
                <span>{post.repostedFrom.domain}</span>
              </div>
              <h3 className="li-post-title">{post.repostedFrom.title}</h3>
              <p className="li-post-body muted">{post.repostedFrom.body}</p>
            </div>
          </>
        ) : (
          <>
            <h3 className="li-post-title">
              <button
                type="button"
                className="post-title-btn"
                onClick={() => onOpenThread(post.id)}
                title="Ouvrir le fil complet"
              >
                {post.title}
              </button>
            </h3>
            <p className="li-post-body">{post.body}</p>
          </>
        )}
      </div>

      {/* Barre d'actions : icônes seules (les nombres restent annoncés aux lecteurs d'écran) */}
      <div className="li-action-bar" role="group" aria-label="Actions sur la contribution">
        <button
          type="button"
          className={`li-action-btn ${hasLikedPost ? 'is-active' : ''}`}
          onClick={() => onTogglePostHelpful(post.id)}
          aria-pressed={hasLikedPost}
          aria-label={hasLikedPost ? `Retirer Utile (${postHelpfulBy.length})` : `Utile (${postHelpfulBy.length})`}
          title="Utile"
        >
          <ThumbsUp size={17} aria-hidden="true" fill={hasLikedPost ? 'currentColor' : 'none'} />
        </button>

        <button
          type="button"
          className={`li-action-btn ${composerOpen || threadExpanded ? 'is-open' : ''}`}
          onClick={focusCommentComposer}
          aria-label={
            post.kind === 'question'
              ? `Répondre (${post.replies.length})`
              : `Commenter (${post.replies.length})`
          }
          title={post.kind === 'question' ? 'Répondre' : 'Commenter'}
        >
          <MessageSquare size={17} aria-hidden="true" />
        </button>

        <div className="li-action-anchor">
          <button
            type="button"
            className={`li-action-btn ${hasReposted || repostMenuOpen ? 'is-active' : ''}`}
            aria-expanded={repostMenuOpen}
            aria-label={`Repartager (${repostedBy.length})`}
            title="Repartager"
            onClick={() => {
              setRepostMenuOpen((v) => !v);
              setForwardMenuOpen(false);
            }}
          >
            <Repeat2 size={17} aria-hidden="true" />
          </button>

          {repostMenuOpen && (
            <div className="li-action-popover" role="dialog" aria-label="Options de repartage">
              {!repostQuoteMode ? (
                <>
                  <button type="button" className="li-popover-item" onClick={handleTriggerQuickRepost}>
                    <Repeat2 size={15} aria-hidden="true" />
                    <div>
                      <b>Repartager instantanément</b>
                      <small>Partager directement cette contribution dans le fil</small>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="li-popover-item"
                    onClick={() => setRepostQuoteMode(true)}
                  >
                    <MessageSquare size={15} aria-hidden="true" />
                    <div>
                      <b>Repartager avec votre avis</b>
                      <small>Ajouter un commentaire ou un retour d’expérience</small>
                    </div>
                  </button>
                </>
              ) : (
                <form className="li-quote-form" onSubmit={handleSubmitQuoteRepost}>
                  <label className="tiny muted" htmlFor={`quote-${post.id}`}>
                    Votre commentaire de repartage
                  </label>
                  <textarea
                    id={`quote-${post.id}`}
                    rows={2}
                    placeholder="Ajoutez votre point de vue ou astuce…"
                    value={repostNote}
                    onChange={(e) => setRepostNote(e.target.value)}
                  />
                  <div className="li-popover-actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => {
                        setRepostQuoteMode(false);
                        setRepostMenuOpen(false);
                      }}
                    >
                      Annuler
                    </button>
                    <button type="submit" className="primary" disabled={!repostNote.trim()}>
                      Publier le repartage
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        <div className="li-action-anchor">
          <button
            type="button"
            className={`li-action-btn ${forwardMenuOpen ? 'is-open' : ''}`}
            aria-expanded={forwardMenuOpen}
            aria-label="Transférer cette contribution"
            title="Transférer"
            onClick={() => {
              setForwardMenuOpen((v) => !v);
              setRepostMenuOpen(false);
            }}
          >
            <Send size={17} aria-hidden="true" />
          </button>

          {forwardMenuOpen && (
            <div className="li-action-popover li-forward-popover" role="dialog" aria-label="Transférer la contribution">
              <div className="li-popover-head">
                <b>Transférer à un contact</b>
                <span className="tiny muted">Partage direct en messagerie</span>
              </div>
              {acceptedRelations.length === 0 ? (
                <div className="li-popover-empty">
                  <p className="tiny muted">
                    Acceptez d’abord une demande de contact pour transférer directement dans une discussion.
                  </p>
                  <button
                    type="button"
                    className="secondary wf-full-btn"
                    onClick={() => {
                      setForwardMenuOpen(false);
                      onOpenRelations();
                    }}
                  >
                    Gérer mes relations
                  </button>
                </div>
              ) : (
                <div className="li-forward-list">
                  {acceptedRelations.map((rel) => {
                    const otherId = rel.members.find((m) => m !== currentUser.id) || '';
                    const other = people.find((p) => p.id === otherId);
                    if (!other) return null;
                    const blocked = rel.blockedBy.length > 0;
                    return (
                      <button
                        key={rel.id}
                        type="button"
                        className="li-forward-row"
                        disabled={blocked || forwardingId === rel.id}
                        onClick={async () => {
                          setForwardingId(rel.id);
                          const ok = await onForwardToRelation(rel, post);
                          setForwardingId(null);
                          if (ok) setForwardMenuOpen(false);
                        }}
                      >
                        <Avatar person={other} small />
                        <div className="li-forward-person">
                          <b>{other.name}</b>
                          <small>{blocked ? 'Échange bloqué' : other.role}</small>
                        </div>
                        <span className="li-forward-send">
                          {forwardingId === rel.id ? 'Envoi…' : 'Envoyer'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              <button type="button" className="li-popover-copy" onClick={handleCopyShareLink}>
                <Copy size={14} aria-hidden="true" />
                <span>Copier le lien de la discussion</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Inline LinkedIn Comment Section (collapsed by default unless community latest preview or expanded) */}
      {commentsSectionVisible && (
        <div className="li-comments-section">
          {composerOpen && (
            <form className="li-comment-composer" onSubmit={handleSubmitMainComment}>
              <Avatar person={currentUser} small />
              <div className="li-composer-pill">
                <input
                  ref={mainInputRef}
                  type="text"
                  aria-label={
                    post.kind === 'question'
                      ? `Proposer une réponse à « ${post.title} »`
                      : `Ajouter un commentaire sur « ${post.title} »`
                  }
                  placeholder={
                    post.kind === 'question'
                      ? 'Proposer une réponse claire…'
                      : 'Ajouter un commentaire…'
                  }
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                {commentText.trim() && (
                  <button type="submit" className="li-composer-submit">
                    Publier
                  </button>
                )}
              </div>
            </form>
          )}

          {threadExpanded && topReplies.length > 0 && (
            <div className="li-comments-list">
              {visibleTopReplies.map((topReply) => {
                const subReplies = subRepliesByParent[topReply.id] || [];
                const isReplyingHere = replyingTo?.parentReplyId === topReply.id;

                return (
                  <div key={topReply.id} className="li-thread-branch">
                    {renderReplyItem(topReply, false, topReply.id)}

                    {(subReplies.length > 0 || isReplyingHere) && (
                      <div className="li-subreplies">
                        {subReplies.map((sub) => renderReplyItem(sub, true, topReply.id))}

                        {isReplyingHere && (
                          <form className="li-subreply-composer" onSubmit={handleSubmitSubReply}>
                            <Avatar person={currentUser} small />
                            <div className="li-composer-pill">
                              <input
                                ref={subInputRef}
                                type="text"
                                aria-label={`Répondre à ${replyingTo.targetAuthorName}`}
                                placeholder={`Répondre à ${replyingTo.targetAuthorName}…`}
                                value={subReplyText}
                                onChange={(e) => setSubReplyText(e.target.value)}
                              />
                              <button
                                type="submit"
                                className="li-composer-submit"
                                disabled={!subReplyText.trim()}
                              >
                                Envoyer
                              </button>
                            </div>
                            <button
                              type="button"
                              className="li-subreply-cancel"
                              onClick={() => setReplyingTo(null)}
                            >
                              Annuler
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {hiddenTopCount > 0 && (
                <button
                  type="button"
                  className="li-more-comments-btn"
                  onClick={() => setShowAllComments(true)}
                >
                  <span className="li-more-icon" aria-hidden="true">⤢</span>
                  <span className="li-more-label">
                    Voir {hiddenTopCount} autre{hiddenTopCount > 1 ? 's' : ''}{' '}
                    {post.kind === 'question' ? 'réponse' : 'commentaire'}
                    {hiddenTopCount > 1 ? 's' : ''}
                  </span>
                </button>
              )}
            </div>
          )}

          {!threadExpanded && defaultPreviewReply && (
            <div className="li-comments-list">
              {renderReplyItem(defaultPreviewReply, false, defaultPreviewReply.id)}
              {(topReplies.length > 1 || (subRepliesByParent[defaultPreviewReply.id]?.length || 0) > 0 || !composerOpen) && (
                <button
                  type="button"
                  className="li-more-comments-btn"
                  onClick={() => {
                    setThreadExpanded(true);
                    setShowAllComments(true);
                    setComposerOpen(true);
                  }}
                >
                  <span className="li-more-icon" aria-hidden="true">⤢</span>
                  <span className="li-more-label">
                    {topReplies.length > 1
                      ? `Voir toute la discussion (${post.replies.length})`
                      : 'Ouvrir les commentaires'}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
