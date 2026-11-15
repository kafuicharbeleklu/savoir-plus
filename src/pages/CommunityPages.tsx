import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  Edit3,
  Eye,
  Flag,
  HelpCircle,
  MessageSquare,
  Plus,
  ThumbsUp
} from 'lucide-react';
import type { CommunityPost, ExtendedDemoState } from '../wireframeData';
import type { Profile, Relation } from '../data';
import { FeedPostCard } from '../components/FeedPostCard';
import { appendCommunityReply, applyPostRepost, togglePostHelpful } from '../personas';

interface CommunityProps {
  ext: ExtendedDemoState;
  updateExt: (fn: (prev: ExtendedDemoState) => ExtendedDemoState) => void;
  nav: (page: any, id?: string) => void;
  user: Profile;
  people?: Profile[];
  acceptedRelations?: Relation[];
  selectedId: string;
  openReport: (targetLabel: string) => void;
  onToggleFollow?: (targetId: string) => void;
  onTogglePostHelpful?: (postId: string) => void;
  onAddReply?: (postId: string, text: string, parentReplyId?: string, replyToName?: string) => void;
  onToggleReplyHelpful?: (postId: string, replyId: string, replyAuthorId: string) => void;
  onSelectSolution?: (postId: string, replyId: string) => void;
  onRepost?: (postId: string, note?: string) => void;
  onForwardToRelation?: (relation: Relation, post: CommunityPost) => Promise<boolean> | boolean;
  setToast: (msg: string) => void;
}

const KNOWN_MEMBERS = new Set(['afi', 'kossi', 'nadege']);

export function CommunityFeedView({
  ext,
  updateExt,
  nav,
  user,
  people = [user],
  acceptedRelations = [],
  openReport,
  onToggleFollow,
  onTogglePostHelpful,
  onAddReply,
  onToggleReplyHelpful,
  onSelectSolution,
  onRepost,
  onForwardToRelation,
  setToast
}: CommunityProps) {
  const [filterTab, setFilterTab] = useState<'all' | 'following' | 'mine' | 'open'>('all');
  const [domainFilter, setDomainFilter] = useState<'Tous' | 'Numérique' | 'Communication' | 'Gestion'>('Tous');
  const [search, setSearch] = useState('');

  const myFollowing = ext.followingIds?.[user.id] || [];
  const handleToggleFollow = (targetId: string) => {
    if (onToggleFollow) {
      onToggleFollow(targetId);
      return;
    }
    const already = myFollowing.includes(targetId);
    updateExt((prev) => ({
      ...prev,
      followingIds: {
        ...prev.followingIds,
        [user.id]: already
          ? (prev.followingIds?.[user.id] || []).filter((id) => id !== targetId)
          : [...(prev.followingIds?.[user.id] || []), targetId]
      }
    }));
    setToast(already ? 'Abonnement retiré' : 'Abonnement unidirectionnel activé');
  };

  const q = search.trim().toLowerCase();
  const visiblePosts = ext.posts.filter((p) => {
    if (filterTab === 'following' && !myFollowing.includes(p.authorId)) return false;
    if (filterTab === 'mine' && p.authorId !== user.id) return false;
    if (filterTab === 'open' && (p.kind !== 'question' || !!p.solutionReplyId)) return false;
    if (domainFilter !== 'Tous' && p.domain !== domainFilter) return false;
    if (!q) return true;
    return `${p.title} ${p.body} ${p.authorName}`.toLowerCase().includes(q);
  });

  const openQuestions = ext.posts.filter((p) => p.kind === 'question' && !p.solutionReplyId);
  const domainCounts = (['Tous', 'Numérique', 'Communication', 'Gestion'] as const).map((d) => ({
    label: d,
    count: d === 'Tous' ? ext.posts.length : ext.posts.filter((p) => p.domain === d).length
  }));
  const contributorMap: Record<string, { name: string; count: number; helpful: number }> = {};
  for (const p of ext.posts) {
    contributorMap[p.authorName] ||= { name: p.authorName, count: 0, helpful: 0 };
    contributorMap[p.authorName].count += 1;
    for (const r of p.replies) {
      contributorMap[r.authorName] ||= { name: r.authorName, count: 0, helpful: 0 };
      contributorMap[r.authorName].count += 1;
      contributorMap[r.authorName].helpful += r.helpfulBy.length;
    }
  }
  const topContributors = Object.values(contributorMap)
    .sort((a, b) => b.helpful - a.helpful || b.count - a.count)
    .slice(0, 3);

  return (
    <div className="dashboard-grid">
      <div className="dashboard-main">
        <div className="between wf-mb-sm">
          <h1>Entraide</h1>
          <button className="primary" onClick={() => nav('community-compose')}>
            <Plus size={16} /> Publier ou poser une question
          </button>
        </div>

        <div className="catalog-tabs-underline" role="tablist" aria-label="Filtrer les échanges">
          <button
            type="button"
            role="tab"
            aria-selected={filterTab === 'all'}
            className={filterTab === 'all' ? 'selected' : ''}
            onClick={() => setFilterTab('all')}
          >
            Tous les échanges
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterTab === 'following'}
            className={filterTab === 'following' ? 'selected' : ''}
            onClick={() => setFilterTab('following')}
          >
            Mes abonnements
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterTab === 'open'}
            className={filterTab === 'open' ? 'selected' : ''}
            onClick={() => setFilterTab('open')}
          >
            Questions ouvertes
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterTab === 'mine'}
            className={filterTab === 'mine' ? 'selected' : ''}
            onClick={() => setFilterTab('mine')}
          >
            Mes contributions
          </button>
        </div>

        <div className="catalog-filter-bar">
          <div className="catalog-filters-inline always-visible">
            <div className={`catalog-filter-pill ${domainFilter !== 'Tous' ? 'is-filtered' : ''}`}>
              <span className="cf-label">Domaine</span>
              <span className="cf-sep" aria-hidden="true">–</span>
              <span className="cf-val">{domainFilter}</span>
              <ChevronDown size={14} className="cf-chevron" aria-hidden="true" />
              <select
                aria-label="Domaine"
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value as any)}
              >
                {['Tous', 'Numérique', 'Communication', 'Gestion'].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {(domainFilter !== 'Tous' || filterTab !== 'all') && (
            <button
              type="button"
              className="text-link catalog-reset-btn"
              onClick={() => {
                setDomainFilter('Tous');
                setFilterTab('all');
              }}
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>

        {visiblePosts.length === 0 ? (
          <div className="empty">
            <MessageSquare size={36} />
            <h3>Aucun échange pour ces critères.</h3>
            <p>
              {filterTab === 'following'
                ? 'Suivez des membres depuis leurs profils ou les discussions pour retrouver leurs contributions ici.'
                : 'Posez votre propre question ou modifiez les filtres.'}
            </p>
            <button className="primary" onClick={() => nav('community-compose')}>
              Nouvelle contribution
            </button>
          </div>
        ) : (
          <div className="wf-stack">
            {visiblePosts.map((post) => (
              <FeedPostCard
                key={post.id}
                post={post}
                currentUser={user}
                people={people}
                ext={ext}
                acceptedRelations={acceptedRelations}
                followingIds={myFollowing}
                onToggleFollowPerson={handleToggleFollow}
                onTogglePostHelpful={(id) =>
                  onTogglePostHelpful
                    ? onTogglePostHelpful(id)
                    : updateExt((prev) => ({ ...prev, posts: togglePostHelpful(prev.posts, id, user.id) }))
                }
                onAddReply={(postId, text, parentReplyId, replyToName) =>
                  onAddReply
                    ? onAddReply(postId, text, parentReplyId, replyToName)
                    : updateExt((prev) => ({
                        ...prev,
                        posts: appendCommunityReply(prev.posts, postId, {
                          authorId: user.id,
                          authorName: user.name,
                          authorRole: user.role,
                          text,
                          parentReplyId,
                          replyToName
                        })
                      }))
                }
                onToggleReplyHelpful={(postId, replyId, replyAuthorId) => {
                  if (onToggleReplyHelpful) {
                    onToggleReplyHelpful(postId, replyId, replyAuthorId);
                    return;
                  }
                  if (replyAuthorId === user.id) return;
                  updateExt((prev) => ({
                    ...prev,
                    posts: prev.posts.map((p) =>
                      p.id !== postId
                        ? p
                        : {
                            ...p,
                            replies: p.replies.map((r) =>
                              r.id !== replyId
                                ? r
                                : {
                                    ...r,
                                    helpfulBy: r.helpfulBy.includes(user.id)
                                      ? r.helpfulBy.filter((u) => u !== user.id)
                                      : [...r.helpfulBy, user.id]
                                  }
                            )
                          }
                    )
                  }));
                }}
                onSelectSolution={(postId, replyId) => {
                  if (onSelectSolution) {
                    onSelectSolution(postId, replyId);
                    return;
                  }
                  updateExt((prev) => ({
                    ...prev,
                    posts: prev.posts.map((p) =>
                      p.id !== postId || p.authorId !== user.id || p.kind !== 'question'
                        ? p
                        : { ...p, solutionReplyId: p.solutionReplyId === replyId ? undefined : replyId }
                    )
                  }));
                }}
                onRepost={(postId, note) => {
                  if (onRepost) {
                    onRepost(postId, note);
                    return;
                  }
                  updateExt((prev) => ({
                    ...prev,
                    posts: applyPostRepost(prev.posts, postId, user, note).posts
                  }));
                }}
                onForwardToRelation={
                  onForwardToRelation ||
                  (async () => {
                    setToast('Ouvrez Messagerie pour transférer ce fil');
                    return false;
                  })
                }
                onOpenMember={(memberId) => nav('member', memberId)}
                onOpenModule={(moduleId) => nav('module-detail', moduleId)}
                onOpenThread={(postId) => nav('community-thread', postId)}
                onOpenRelations={() => nav('relations')}
                onReport={(label) => openReport(label)}
                setToast={setToast}
              />
            ))}
          </div>
        )}
      </div>

      <aside className="right-rail" aria-label="Repères communauté">
        <section className="rail-card">
          <span className="eyebrow">Domaines & tendances</span>
          <h3>Explorer par sujet</h3>
          <div className="rail-quick-list">
            {domainCounts.map((dc) => (
              <button
                key={dc.label}
                type="button"
                className={`rail-filter-btn ${domainFilter === dc.label ? 'active' : ''}`}
                onClick={() => setDomainFilter(dc.label)}
              >
                <span>{dc.label}</span>
                <b className="tabular">{dc.count}</b>
              </button>
            ))}
          </div>
          <button className="secondary wf-full-btn" onClick={() => nav('community-compose')}>
            <Plus size={15} /> Nouvelle contribution
          </button>
        </section>

        <section className="rail-card">
          <span className="eyebrow">Besoin d’un coup de main ({openQuestions.length})</span>
          <h3>Questions sans solution</h3>
          {openQuestions.length === 0 ? (
            <p className="tiny muted">Toutes les questions actuelles ont reçu une solution.</p>
          ) : (
            <div className="rail-quick-list">
              {openQuestions.slice(0, 3).map((qPost) => (
                <button
                  key={qPost.id}
                  type="button"
                  className="rail-quick-item"
                  onClick={() => nav('community-thread', qPost.id)}
                >
                  <b>{qPost.title}</b>
                  <small>
                    {qPost.authorName} · {qPost.domain} · {qPost.replies.length} réponse(s)
                  </small>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rail-card">
          <span className="eyebrow">Entraide active</span>
          <h3>Contributeurs récents</h3>
          <div className="rail-quick-list">
            {topContributors.map((c) => (
              <button
                key={c.name}
                type="button"
                className="rail-quick-item"
                onClick={() => setSearch(c.name)}
              >
                <b>{c.name}</b>
                <small>
                  {c.count} participation(s) · {c.helpful} vote(s) utile
                </small>
              </button>
            ))}
          </div>
          <button className="text-link" onClick={() => nav('relations')}>
            Voir les membres <ArrowRight size={14} />
          </button>
        </section>
      </aside>
    </div>
  );
}

export function CommunityComposeView({ ext, updateExt, nav, user, setToast }: CommunityProps) {
  const [kind, setKind] = useState<'question' | 'publication'>('question');
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState<'Numérique' | 'Communication' | 'Gestion'>('Numérique');
  const [body, setBody] = useState('');
  const [preview, setPreview] = useState(false);

  const publish = () => {
    if (!title.trim() || !body.trim()) return;
    const newId = `post-${Date.now()}`;
    const newPost: CommunityPost = {
      id: newId,
      kind,
      title: title.trim(),
      domain,
      authorId: user.id,
      authorName: user.name,
      body: body.trim(),
      createdAt: 'À l’instant',
      followers: [user.id],
      replies: []
    };
    updateExt((prev) => ({
      ...prev,
      posts: [newPost, ...prev.posts]
    }));
    setToast(kind === 'question' ? 'Question publiée' : 'Contribution publiée');
    nav('community-thread', newId);
  };

  return (
    <div className="wf-detail-wrap">
      <button className="back-link" onClick={() => nav('home')}>
        <ArrowLeft size={16} /> Retour à l’accueil
      </button>

      <div className="page-heading">
        <span className="eyebrow">Nouvelle contribution</span>
        <h1>{kind === 'question' ? 'Poser une question à la communauté' : 'Partager une astuce ou méthode'}</h1>
        <p>Audience : membres connectés autorisés. Évitez de partager des coordonnées ou secrets personnels.</p>
      </div>

      <section className="wf-card">
        <div className="tabs wf-mb">
          <button className={kind === 'question' ? 'selected' : ''} onClick={() => setKind('question')}>
            <HelpCircle size={15} /> Question d’entraide
          </button>
          <button className={kind === 'publication' ? 'selected' : ''} onClick={() => setKind('publication')}>
            <MessageSquare size={15} /> Publication / astuce
          </button>
        </div>

        {!preview ? (
          <div className="wf-form-stack">
            <label>
              Titre clair et précis
              <input
                placeholder={
                  kind === 'question'
                    ? 'Ex. Comment repérer un faux lien dans un SMS ?'
                    : 'Ex. Ma méthode pour retenir un module en 15 minutes'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
              />
            </label>
            <label>
              Domaine
              <select value={domain} onChange={(e) => setDomain(e.target.value as any)}>
                <option value="Numérique">Numérique</option>
                <option value="Communication">Communication</option>
                <option value="Gestion">Gestion</option>
              </select>
            </label>
            <label>
              {kind === 'question' ? 'Contexte et ce que vous avez essayé (ou ce qui vous bloque)' : 'Votre partage'}
              <textarea
                rows={5}
                placeholder="Décrivez votre situation ou votre méthode…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </label>
          </div>
        ) : (
          <div className="wf-preview-box">
            <span className="eyebrow">
              Aperçu · {kind === 'question' ? 'Question' : 'Publication'} · {domain}
            </span>
            <h3>{title || '(Sans titre)'}</h3>
            <p>{body || '(Aucun texte saisi)'}</p>
            <small className="muted">Par {user.name} · Audience : membres connectés autorisés</small>
          </div>
        )}

        <div className="lesson-actions">
          <button type="button" className="secondary" onClick={() => setPreview(!preview)}>
            <Eye size={15} /> {preview ? 'Revenir à l’édition' : 'Aperçu avant envoi'}
          </button>
          <button
            type="button"
            className="primary"
            disabled={!title.trim() || !body.trim()}
            onClick={publish}
          >
            {kind === 'question' ? 'Publier la question' : 'Publier la contribution'} <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}

export function CommunityThreadView({
  ext,
  updateExt,
  nav,
  user,
  selectedId,
  openReport,
  onToggleFollow,
  setToast
}: CommunityProps) {
  const post = ext.posts.find((p) => p.id === selectedId) || ext.posts[0];
  const [replyText, setReplyText] = useState('');
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  if (!post) {
    return (
      <div className="empty">
        <h3>Discussion introuvable.</h3>
        <button className="primary" onClick={() => nav('home')}>
          Retour à l’accueil
        </button>
      </div>
    );
  }

  const isAuthor = post.authorId === user.id;
  const isFollowing = post.followers.includes(user.id);

  const toggleFollow = () => {
    updateExt((prev) => ({
      ...prev,
      posts: prev.posts.map((p) =>
        p.id !== post.id
          ? p
          : {
              ...p,
              followers: isFollowing ? p.followers.filter((f) => f !== user.id) : [...p.followers, user.id]
            }
      )
    }));
    setToast(isFollowing ? 'Suivi du fil arrêté' : 'Vous suivez cette discussion');
  };

  const addReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    updateExt((prev) => ({
      ...prev,
      posts: prev.posts.map((p) =>
        p.id !== post.id
          ? p
          : {
              ...p,
              replies: [
                ...p.replies,
                {
                  id: `rep-${Date.now()}`,
                  authorId: user.id,
                  authorName: user.name,
                  text: replyText.trim(),
                  createdAt: 'À l’instant',
                  helpfulBy: []
                }
              ]
            }
      )
    }));
    setReplyText('');
    setToast('Réponse ajoutée');
  };

  const toggleHelpful = (replyId: string, authorId: string) => {
    if (authorId === user.id) return;
    updateExt((prev) => ({
      ...prev,
      posts: prev.posts.map((p) =>
        p.id !== post.id
          ? p
          : {
              ...p,
              replies: p.replies.map((r) =>
                r.id !== replyId
                  ? r
                  : {
                      ...r,
                      helpfulBy: r.helpfulBy.includes(user.id)
                        ? r.helpfulBy.filter((u) => u !== user.id)
                        : [...r.helpfulBy, user.id]
                    }
              )
            }
      )
    }));
  };

  const toggleSolution = (replyId: string) => {
    if (!isAuthor || post.kind !== 'question') return;
    const clearing = post.solutionReplyId === replyId;
    updateExt((prev) => ({
      ...prev,
      posts: prev.posts.map((p) =>
        p.id !== post.id ? p : { ...p, solutionReplyId: clearing ? undefined : replyId }
      )
    }));
    setToast(clearing ? 'Question rouverte' : 'Solution choisie par l’auteur');
  };

  const saveReplyEdit = (replyId: string) => {
    if (!editText.trim()) return;
    updateExt((prev) => ({
      ...prev,
      posts: prev.posts.map((p) =>
        p.id !== post.id
          ? p
          : {
              ...p,
              solutionReplyId: p.solutionReplyId === replyId ? undefined : p.solutionReplyId,
              replies: p.replies.map((r) =>
                r.id === replyId ? { ...r, text: editText.trim(), createdAt: `${r.createdAt} (modifié)` } : r
              )
            }
      )
    }));
    setEditingReplyId(null);
    setToast('Modification enregistrée · Si cette réponse était solution, la question est rouverte.');
  };

  return (
    <div className="wf-detail-wrap">
      <button className="back-link" onClick={() => nav('home')}>
        <ArrowLeft size={16} /> Retour à l’accueil
      </button>

      <article className="wf-card wf-mb">
        <div className="between">
          <div className="wf-inline-actions">
            <span className="eyebrow">{post.kind === 'question' ? 'QUESTION' : 'PUBLICATION'}</span>
            {post.kind === 'question' && post.solutionReplyId && (
              <span className="status-tag ok">Résolue</span>
            )}
          </div>
          <div className="wf-inline-actions">
            <button className="secondary" onClick={toggleFollow}>
              <Bell size={14} /> {isFollowing ? 'Suivi actif' : 'Suivre ce fil'}
            </button>
            <button
              className="text-link"
              onClick={() => openReport(`Communauté (${post.kind}) : ${post.title}`)}
            >
              <Flag size={14} /> Signaler
            </button>
          </div>
        </div>

        <h1 className="wf-detail-title">{post.title}</h1>
        <div className="between wf-mb-sm">
          <p className="tiny muted">
            Par{' '}
            {KNOWN_MEMBERS.has(post.authorId) ? (
              <button type="button" className="text-link" onClick={() => nav('member', post.authorId)}>
                <b>{post.authorName}</b>
              </button>
            ) : (
              <b>{post.authorName}</b>
            )}{' '}
            · {post.domain} · {post.createdAt}
          </p>
          {KNOWN_MEMBERS.has(post.authorId) && post.authorId !== user.id && onToggleFollow && (
            <button type="button" className="secondary" onClick={() => onToggleFollow(post.authorId)}>
              {(ext.followingIds?.[user.id] || []).includes(post.authorId) ? 'Suivi' : `Suivre ${post.authorName}`}
            </button>
          )}
        </div>
        <p className="wf-thread-body">{post.body}</p>
      </article>

      <div className="section-title">
        <h2>
          {post.replies.length} {post.kind === 'question' ? 'Réponses' : 'Commentaires'}
        </h2>
        <span className="tiny muted">La solution choisie exprime une utilité d’entraide, pas une certification.</span>
      </div>

      <div className="wf-stack wf-mb">
        {post.replies.map((r) => {
          const isSol = post.solutionReplyId === r.id;
          const isOwnReply = r.authorId === user.id;
          const helpfulCount = r.helpfulBy.length;
          const liked = r.helpfulBy.includes(user.id);
          return (
            <div className={`wf-card ${isSol ? 'wf-solution-card' : ''}`} key={r.id}>
              <div className="between">
                <div className="wf-inline-actions">
                  {KNOWN_MEMBERS.has(r.authorId) ? (
                    <button type="button" className="text-link" onClick={() => nav('member', r.authorId)}>
                      <b>{r.authorName}</b>
                    </button>
                  ) : (
                    <b>{r.authorName}</b>
                  )}
                  <span className="tiny muted">{r.createdAt}</span>
                </div>
                {isSol && (
                  <span className="status-tag ok">
                    <CheckCircle2 size={13} /> Solution choisie par l’auteur
                  </span>
                )}
              </div>

              {editingReplyId === r.id ? (
                <div className="wf-form-stack wf-mt">
                  <textarea rows={3} value={editText} onChange={(e) => setEditText(e.target.value)} />
                  <div className="wf-inline-actions">
                    <button className="primary" onClick={() => saveReplyEdit(r.id)}>
                      Enregistrer
                    </button>
                    <button className="secondary" onClick={() => setEditingReplyId(null)}>
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <p className="wf-reply-text">{r.text}</p>
              )}

              {r.linkedModuleId && (
                <button
                  className="text-link wf-mb-sm"
                  onClick={() => nav('module-detail', r.linkedModuleId)}
                >
                  Voir le module lié : Comprendre les réseaux <ArrowRight size={14} />
                </button>
              )}

              <div className="between wf-post-footer">
                <div className="wf-inline-actions">
                  <button
                    className={`secondary ${liked ? 'wf-active-pill' : ''}`}
                    disabled={isOwnReply}
                    title={isOwnReply ? 'Auto-réaction impossible' : 'Marquer utile'}
                    onClick={() => toggleHelpful(r.id, r.authorId)}
                  >
                    <ThumbsUp size={14} /> Utile ({helpfulCount})
                  </button>
                  {isOwnReply && (
                    <button
                      className="text-link"
                      onClick={() => {
                        setEditingReplyId(r.id);
                        setEditText(r.text);
                      }}
                    >
                      <Edit3 size={14} /> Modifier
                    </button>
                  )}
                  {isAuthor && post.kind === 'question' && (
                    <button className="secondary" onClick={() => toggleSolution(r.id)}>
                      <Check size={14} /> {isSol ? 'Retirer la solution' : 'Choisir comme solution'}
                    </button>
                  )}
                </div>
                <button
                  className="text-link"
                  onClick={() => openReport(`Réponse de ${r.authorName} dans « ${post.title} »`)}
                >
                  <Flag size={13} /> Signaler
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <form className="wf-card wf-form-stack" onSubmit={addReply}>
        <h3>{post.kind === 'question' ? 'Proposer une réponse' : 'Ajouter un commentaire'}</h3>
        <textarea
          rows={3}
          placeholder="Partagez votre explication clairement…"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
        />
        <div className="between">
          <span className="tiny muted">Envoi confirmé localement dans ce démonstrateur.</span>
          <button type="submit" className="primary" disabled={!replyText.trim()}>
            Publier la réponse <ArrowRight size={15} />
          </button>
        </div>
      </form>
    </div>
  );
}
