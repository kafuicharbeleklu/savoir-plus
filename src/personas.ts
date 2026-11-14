import type {
  AccountStatus,
  AdminUserRecord,
  CatalogItem,
  CatalogType,
  CommunityPost,
  DifficultyLevel,
  ExtendedDemoState,
  StudioContent,
  StudioMedia
} from './wireframeData';
import type { Profile, Progress } from './data';
import { isQuizPassed, moduleProgressPercent } from './domain.mjs';
import { builtInAnswerKey } from './content';

export interface RoleCapabilities {
  roleLabel: string;
  canLearn: boolean;
  canCreate: boolean;
  canValidate: boolean;
  canModerate: boolean;
  canAdmin: boolean;
  accountStatus: AccountStatus;
  isRestricted: boolean;
  isSuspended: boolean;
}

const DEMO_STATUS_ID_MAP: Record<string, string> = {
  afi: 'usr-afi',
  kossi: 'usr-kossi',
  nadege: 'usr-nadege'
};

export function resolveAccountStatus(uid: string, adminUsers: AdminUserRecord[]): AccountStatus {
  const mappedId = DEMO_STATUS_ID_MAP[uid] || uid;
  const record = adminUsers.find((u) => u.id === mappedId || u.id === uid);
  return record?.status ?? 'active';
}

export function resolveProfileVerified(
  uid: string,
  adminUsers: AdminUserRecord[],
  profileVerified?: boolean
): boolean {
  const mappedId = DEMO_STATUS_ID_MAP[uid] || uid;
  const record = adminUsers.find((u) => u.id === mappedId || u.id === uid);
  if (record) return Boolean(record.verified);
  return Boolean(profileVerified);
}

export function resolveCapabilities(
  uid: string,
  mode: 'local' | 'cloud',
  adminUsers: AdminUserRecord[],
  cloudPreviewRole?: 'learner' | 'creator' | 'admin'
): RoleCapabilities {
  const status = resolveAccountStatus(uid, adminUsers);
  const isSuspended = status === 'suspended' || status === 'deactivated';
  const isRestricted = status === 'restricted';

  // Even in restricted/suspended state, standard social/creation capabilities are locked (REV-11)
  if (isSuspended) {
    return {
      roleLabel: 'Compte suspendu · Recours ouvert',
      canLearn: false,
      canCreate: false,
      canValidate: false,
      canModerate: false,
      canAdmin: false,
      accountStatus: status,
      isRestricted: false,
      isSuspended: true
    };
  }

  if (mode === 'cloud' && cloudPreviewRole) {
    if (cloudPreviewRole === 'admin') {
      return {
        roleLabel: 'Modération & Gouvernance',
        canLearn: true,
        canCreate: true,
        canValidate: true,
        canModerate: true,
        canAdmin: true,
        accountStatus: status,
        isRestricted,
        isSuspended: false
      };
    }
    if (cloudPreviewRole === 'creator') {
      return {
        roleLabel: 'Créateur habilité',
        canLearn: true,
        canCreate: !isRestricted,
        canValidate: false,
        canModerate: false,
        canAdmin: false,
        accountStatus: status,
        isRestricted,
        isSuspended: false
      };
    }
    return {
      roleLabel: 'Membre apprenant',
      canLearn: true,
      canCreate: false,
      canValidate: false,
      canModerate: false,
      canAdmin: false,
      accountStatus: status,
      isRestricted,
      isSuspended: false
    };
  }

  if (uid === 'nadege') {
    return {
      roleLabel: 'Modération & Gouvernance',
      canLearn: true,
      canCreate: true,
      canValidate: true,
      canModerate: true,
      canAdmin: true,
      accountStatus: status,
      isRestricted,
      isSuspended: false
    };
  }

  if (uid === 'kossi') {
    return {
      roleLabel: 'Créateur habilité',
      canLearn: true,
      canCreate: !isRestricted,
      canValidate: false,
      canModerate: false,
      canAdmin: false,
      accountStatus: status,
      isRestricted,
      isSuspended: false
    };
  }

  return {
    roleLabel: isRestricted ? 'Apprenante · Messagerie restreinte' : 'Apprenante',
    canLearn: true,
    canCreate: false,
    canValidate: false,
    canModerate: false,
    canAdmin: false,
    accountStatus: status,
    isRestricted,
    isSuspended: false
  };
}

export function difficultySegments(level: DifficultyLevel): { filled: number; total: number; label: string; tone: 'easy' | 'mid' | 'hard' } {
  if (level === 'Avancé') return { filled: 3, total: 3, label: 'Avancé', tone: 'hard' };
  if (level === 'Intermédiaire') return { filled: 2, total: 3, label: 'Intermédiaire', tone: 'mid' };
  return { filled: 1, total: 3, label: 'Débutant', tone: 'easy' };
}

export function isFocusedStudyRoute(page: string): boolean {
  return ['reader', 'quiz-intro', 'quiz', 'result', 'resource-read'].includes(page);
}

export function isStudioRoute(page: string): boolean {
  return page.startsWith('studio');
}

export function isGovernanceRoute(page: string): boolean {
  return page.startsWith('admin') || page === 'moderation';
}

export const DEMO_PERSONA_IDS = ['afi', 'kossi', 'nadege'] as const;

/**
 * Personnage de démo au chargement : `?as=kossi` dans l'URL, sinon celui mémorisé pour cet onglet
 * (sessionStorage), sinon Afi. Deux fenêtres peuvent ainsi incarner deux personnages différents.
 * Ce choix de personnage n'est jamais présenté comme une authentification (R:4401).
 */
export function resolveDemoPersona(search: string, stored: string | null): string {
  const isDemo = (v: string | null): v is string => !!v && (DEMO_PERSONA_IDS as readonly string[]).includes(v);
  const fromUrl = new URLSearchParams(search).get('as');
  if (isDemo(fromUrl)) return fromUrl;
  if (isDemo(stored)) return stored;
  return 'afi';
}

/**
 * Route guard: Studio and Governance pages require the same capabilities that show them in the
 * navigation, so typing a URL never bypasses permissions (Référentiel R:2770).
 */
export function canAccessRoute(
  page: string,
  caps: Pick<RoleCapabilities, 'canCreate' | 'canModerate' | 'canAdmin'>
): boolean {
  if (isStudioRoute(page)) return caps.canCreate;
  if (isGovernanceRoute(page)) return caps.canModerate || caps.canAdmin;
  return true;
}

export function isAccountRoute(page: string): boolean {
  return page === 'profile' || page === 'settings';
}

export type ActiveSpace = 'learner' | 'community' | 'studio' | 'admin' | 'account';

export function resolveActiveSpace(page: string, canManageAdmin = true): ActiveSpace {
  if (isAccountRoute(page)) return 'account';
  if (isStudioRoute(page)) return 'studio';
  if (isGovernanceRoute(page)) return 'admin';
  if (page === 'appeal') return canManageAdmin ? 'admin' : 'learner';
  if (page.startsWith('community') || page === 'relations' || page === 'member') return 'community';
  return 'learner';
}

export type HomeFeedTab = 'all' | 'following' | 'open-questions' | 'modules';

export function filterHomeFeed(
  posts: CommunityPost[],
  tab: HomeFeedTab,
  followingIds: string[]
): CommunityPost[] {
  if (tab === 'modules') return [];
  if (tab === 'following') return posts.filter((p) => followingIds.includes(p.authorId));
  if (tab === 'open-questions') return posts.filter((p) => p.kind === 'question' && !p.solutionReplyId);
  return [...posts];
}

export interface StudioReadinessCheck {
  id: string;
  label: string;
  ok: boolean;
  blocking: boolean;
  detail: string;
}

export interface StudioReadinessReport {
  canPublish: boolean;
  blockingCount: number;
  okCount: number;
  checks: StudioReadinessCheck[];
}

export function evaluateStudioReadiness(
  content: StudioContent | undefined,
  quiz: ExtendedDemoState['studioQuiz'],
  media: StudioMedia[]
): StudioReadinessReport {
  const hasTitleAndSources = Boolean(
    content?.title.trim() && content?.sources.trim() && content.sources.trim() !== 'À préciser'
  );
  const hasValidSections = Boolean(
    content &&
      content.sections.length > 0 &&
      content.sections.every((s) => s.title.trim().length > 0 && s.body.trim().length > 0)
  );
  const unavailableReferenced = media.filter(
    (m) => m.state !== 'Disponible' && /utilis/i.test(m.usage)
  );
  const libraryIssues = media.filter((m) => m.state !== 'Disponible').length;
  const availableCount = media.filter((m) => m.state === 'Disponible').length;
  const mediaOk = unavailableReferenced.length === 0;

  const totalPoints = quiz.questions.reduce((acc, q) => acc + (q.points > 0 ? q.points : 1), 0);
  const quizValid =
    quiz.questions.length > 0 &&
    quiz.questions.every(
      (q) =>
        q.prompt.trim().length > 0 &&
        q.options.filter((o) => o.trim().length > 0).length >= 2 &&
        q.correctIndex >= 0 &&
        q.correctIndex < q.options.length &&
        q.explanation.trim().length > 0
    ) &&
    quiz.passingScore > 0 &&
    quiz.passingScore <= totalPoints;
  const audienceOk = Boolean(content?.audience);

  const checks: StudioReadinessCheck[] = [
    {
      id: 'title-sources',
      label: 'Titre et provenance',
      ok: hasTitleAndSources,
      blocking: true,
      detail: hasTitleAndSources ? 'Renseignés' : 'Titre ou sources à préciser'
    },
    {
      id: 'sections',
      label: 'Structure pédagogique',
      ok: hasValidSections,
      blocking: true,
      detail: content ? `${content.sections.length} section(s)` : 'Aucune section'
    },
    {
      id: 'media',
      label: 'Médias prêts',
      ok: mediaOk && libraryIssues === 0,
      blocking: unavailableReferenced.length > 0,
      detail:
        libraryIssues === 0
          ? `${availableCount} média(s) disponibles`
          : `${availableCount} prêt(s) · ${libraryIssues} en attente ou échec`
    },
    {
      id: 'quiz',
      label: 'Évaluation à choix unique',
      ok: quizValid,
      blocking: content?.type === 'module',
      detail: quizValid
        ? `${quiz.questions.length} question(s) · seuil ${quiz.passingScore}/${totalPoints}`
        : `Seuil (${quiz.passingScore}) > total (${totalPoints}) ou questions incomplètes`
    },
    {
      id: 'audience',
      label: 'Audience cible',
      ok: audienceOk,
      blocking: true,
      detail: content?.audience || 'Non définie'
    }
  ];

  const blockingCount = checks.filter((c) => !c.ok && c.blocking).length;
  const okCount = checks.filter((c) => c.ok).length;
  return {
    canPublish: blockingCount === 0,
    blockingCount,
    okCount,
    checks
  };
}

export function computeGlobalLevel(totalXp: number): { level: number; currentXp: number; targetXp: number; percent: number } {
  // Progressive thresholds for demonstration (not a global certification rule)
  const step = 200;
  const level = Math.max(1, Math.floor(totalXp / step) + 1);
  const currentXp = totalXp % step;
  return {
    level,
    currentXp,
    targetXp: step,
    percent: Math.round((currentXp / step) * 100)
  };
}

export function getCatalogTypeMeta(type: CatalogType): { label: string; tone: 'module' | 'resource' | 'path' } {
  if (type === 'module') return { label: 'Module', tone: 'module' };
  if (type === 'path') return { label: 'Parcours', tone: 'path' };
  return { label: 'Ressource', tone: 'resource' };
}

export function computeCatalogCardSteps(
  item: CatalogItem,
  getModProg: (modId: string) => Progress,
  lessonCountsById: Record<string, number>
): { pct: number; doneSteps: number; totalSteps: number } {
  if (item.type === 'resource') {
    return { pct: 0, doneSteps: 0, totalSteps: 0 };
  }
  if (item.type === 'path' && item.pathModules?.length) {
    let completedModules = 0;
    const totalPercent = item.pathModules.reduce((acc, pm) => {
      const p = getModProg(pm.id);
      const count = lessonCountsById[pm.id] || 3;
      const mp = moduleProgressPercent(p, count, builtInAnswerKey(pm.id));
      if (mp === 100) completedModules += 1;
      return acc + mp;
    }, 0);
    return {
      pct: Math.round(totalPercent / item.pathModules.length),
      doneSteps: completedModules,
      totalSteps: item.moduleCount || item.pathModules.length
    };
  }
  const modProg = getModProg(item.id);
  const lessonCount = lessonCountsById[item.id] || Math.max(1, (item.sections?.length || 4) - 1);
  const totalSteps = lessonCount + 1; // sections + quiz final
  const answerKey = builtInAnswerKey(item.id);
  const doneSteps = Math.min(lessonCount, modProg.lessons.length) + (isQuizPassed(modProg, answerKey) ? 1 : 0);
  return {
    pct: moduleProgressPercent(modProg, lessonCount, answerKey),
    doneSteps,
    totalSteps
  };
}

export const SPLASH_HOLD_MS = 1550;
export const SPLASH_REDUCED_HOLD_MS = 550;
export const SPLASH_EXIT_MS = 320;

export function shouldBypassSplash(search: string): boolean {
  const params = new URLSearchParams(search || '');
  if (params.get('splash') === '0') return true;
  if (!params.has('autostart')) return false;
  const val = (params.get('autostart') || '').toLowerCase();
  return val !== '0' && val !== 'false';
}

export function resolveSplashDurations(reducedMotion: boolean): { holdMs: number; exitMs: number } {
  return reducedMotion
    ? { holdMs: SPLASH_REDUCED_HOLD_MS, exitMs: 120 }
    : { holdMs: SPLASH_HOLD_MS, exitMs: SPLASH_EXIT_MS };
}

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
}

const FALLBACK_COLORS = ['peach', 'lavender', 'mint'] as const;

export function resolveCommunityAuthor(
  authorId: string,
  authorName: string,
  people: Profile[],
  ext: ExtendedDemoState,
  explicitRole?: string
): { profile: Profile; headline: string; verified: boolean; isKnownMember: boolean } {
  const known = people.find((p) => p.id === authorId);
  if (known) {
    const details = ext.profileDetails[known.id];
    return {
      profile: known,
      headline: explicitRole || details?.tagline || known.role,
      verified: resolveProfileVerified(known.id, ext.adminUsers, details?.verified),
      isKnownMember: true
    };
  }
  let hash = 0;
  for (let i = 0; i < (authorId || authorName).length; i += 1) {
    hash = (hash * 31 + (authorId || authorName).charCodeAt(i)) % 997;
  }
  const color = FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
  const fallbackProfile: Profile = {
    id: authorId,
    name: authorName,
    role: explicitRole || 'Membre communauté SAVOIR+',
    initials: computeInitials(authorName),
    color,
    bio: ''
  };
  const verified = resolveProfileVerified(authorId, ext.adminUsers, false);
  return {
    profile: fallbackProfile,
    headline: explicitRole || fallbackProfile.role,
    verified,
    isKnownMember: false
  };
}

export function togglePostHelpful(posts: CommunityPost[], postId: string, uid: string): CommunityPost[] {
  return posts.map((post) => {
    if (post.id !== postId) return post;
    const current = post.helpfulBy || [];
    const nextHelpful = current.includes(uid)
      ? current.filter((id) => id !== uid)
      : [...current, uid];
    return { ...post, helpfulBy: nextHelpful };
  });
}

export function applyPostRepost(
  posts: CommunityPost[],
  sourcePostId: string,
  user: Profile,
  note?: string,
  repostId = `repost-${Date.now()}`
): { posts: CommunityPost[]; created: boolean } {
  const source = posts.find((p) => p.id === sourcePostId);
  if (!source) return { posts, created: false };

  const targetOriginal = source.repostedFrom
    ? posts.find((p) => p.id === source.repostedFrom!.postId) || source
    : source;

  const cleanNote = (note || '').trim();
  const alreadyRepostedPlain =
    !cleanNote &&
    posts.some(
      (p) => p.authorId === user.id && p.repostedFrom?.postId === targetOriginal.id && !p.repostNote
    );

  if (alreadyRepostedPlain) {
    return { posts, created: false };
  }

  const repostEntry: CommunityPost = {
    id: repostId,
    kind: targetOriginal.kind,
    title: targetOriginal.title,
    domain: targetOriginal.domain,
    authorId: user.id,
    authorName: user.name,
    body: cleanNote || targetOriginal.body,
    createdAt: 'À l’instant',
    followers: [user.id],
    helpfulBy: [],
    repostedBy: [],
    repostNote: cleanNote || undefined,
    repostedFrom: {
      postId: targetOriginal.id,
      authorId: targetOriginal.authorId,
      authorName: targetOriginal.authorName,
      title: targetOriginal.title,
      body: targetOriginal.body,
      domain: targetOriginal.domain,
      kind: targetOriginal.kind
    },
    replies: []
  };

  const updated = posts.map((p) => {
    if (p.id !== targetOriginal.id) return p;
    const currentReposts = p.repostedBy || [];
    return {
      ...p,
      repostedBy: currentReposts.includes(user.id) ? currentReposts : [...currentReposts, user.id]
    };
  });

  return {
    posts: [repostEntry, ...updated],
    created: true
  };
}

export function appendCommunityReply(
  posts: CommunityPost[],
  postId: string,
  params: {
    id?: string;
    authorId: string;
    authorName: string;
    authorRole?: string;
    text: string;
    parentReplyId?: string;
    replyToName?: string;
    createdAt?: string;
  }
): CommunityPost[] {
  const cleanText = params.text.trim();
  if (!cleanText) return posts;

  return posts.map((post) => {
    if (post.id !== postId) return post;

    // Flatten sub-replies to max 1 visual nesting level (LinkedIn thread convention)
    let resolvedParentId = params.parentReplyId;
    if (resolvedParentId) {
      const parentObj = post.replies.find((r) => r.id === resolvedParentId);
      if (parentObj?.parentReplyId) {
        resolvedParentId = parentObj.parentReplyId;
      } else if (!parentObj) {
        resolvedParentId = undefined;
      }
    }

    const nextReply = {
      id: params.id || `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      authorId: params.authorId,
      authorName: params.authorName,
      authorRole: params.authorRole,
      text: cleanText,
      createdAt: params.createdAt || 'À l’instant',
      helpfulBy: [],
      ...(resolvedParentId ? { parentReplyId: resolvedParentId } : {}),
      ...(params.replyToName ? { replyToName: params.replyToName } : {})
    };

    return {
      ...post,
      replies: [...post.replies, nextReply]
    };
  });
}

export function resolveActiveLab(
  catalog: CatalogItem[],
  getProgress: (modId: string) => Progress,
  lessonCounts: Record<string, number>,
  preferredOrder: string[] = ['phishing', 'reseaux', 'comptes']
): { item: CatalogItem; pct: number } | null {
  const modules = catalog.filter((c) => c.type === 'module');
  if (modules.length === 0) return null;

  const orderedIds = Array.from(new Set([...preferredOrder, ...modules.map((m) => m.id)]));

  for (const id of orderedIds) {
    const item = modules.find((m) => m.id === id);
    if (!item) continue;
    const total = lessonCounts[id] || item.sections?.length || 3;
    const pct = moduleProgressPercent(getProgress(id), total, builtInAnswerKey(id));
    if (pct > 0 && pct < 100) {
      return { item, pct };
    }
  }

  for (const id of orderedIds) {
    const item = modules.find((m) => m.id === id);
    if (!item) continue;
    const total = lessonCounts[id] || item.sections?.length || 3;
    const pct = moduleProgressPercent(getProgress(id), total, builtInAnswerKey(id));
    if (pct > 0) {
      return { item, pct };
    }
  }

  const fallback = modules.find((m) => m.id === 'phishing') || modules[0];
  const fallbackTotal = lessonCounts[fallback.id] || fallback.sections?.length || 3;
  return {
    item: fallback,
    pct: moduleProgressPercent(getProgress(fallback.id), fallbackTotal, builtInAnswerKey(fallback.id))
  };
}

export function resolveDefaultCommentPreview(
  topReplies: CommunityPost['replies'],
  communityMemberIds: string[],
  currentUserId: string
): CommunityPost['replies'][number] | null {
  if (!topReplies || topReplies.length === 0) return null;
  const latestTop = topReplies[topReplies.length - 1];
  if (!latestTop) return null;
  if (latestTop.authorId === currentUserId) return null;
  if (!communityMemberIds.includes(latestTop.authorId)) return null;
  return latestTop;
}

export function resolveDiscoverSuggestions(
  people: Profile[],
  currentUserId: string,
  followingIds: string[],
  limit = 3
): Profile[] {
  return people
    .filter((p) => p.id !== currentUserId && !followingIds.includes(p.id))
    .slice(0, limit);
}

export interface NetworkDirectoryEntry {
  profile: Profile;
  headline: string;
  verified: boolean;
  isFollowed: boolean;
  relationStatus: 'none' | 'pending' | 'accepted' | 'declined';
  blocked: boolean;
  suggestionReason: string;
}

export function resolveCommunityDirectory(
  people: Profile[],
  ext: ExtendedDemoState
): Profile[] {
  const byId = new Map<string, Profile>();
  for (const p of people) {
    byId.set(p.id, p);
  }
  for (const post of ext.posts) {
    if (!byId.has(post.authorId)) {
      const resolved = resolveCommunityAuthor(post.authorId, post.authorName, people, ext);
      byId.set(post.authorId, {
        ...resolved.profile,
        bio: resolved.profile.bio || `Membre actif dans ${post.domain} sur SAVOIR+.`
      });
    }
    for (const rep of post.replies) {
      if (!byId.has(rep.authorId)) {
        const resolved = resolveCommunityAuthor(rep.authorId, rep.authorName, people, ext, rep.authorRole);
        byId.set(rep.authorId, {
          ...resolved.profile,
          bio: resolved.profile.bio || `Contributeur d’entraide dans ${post.domain}.`
        });
      }
    }
  }
  return Array.from(byId.values());
}

export function resolveAlgorithmicDiscoverProfiles(
  directory: Profile[],
  currentUserId: string,
  followingIds: string[],
  ext: ExtendedDemoState,
  limit = 12
): NetworkDirectoryEntry[] {
  const myInterests = (ext.profileDetails[currentUserId]?.interests || '')
    .toLowerCase()
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const candidates = directory.filter((p) => p.id !== currentUserId && !followingIds.includes(p.id));

  const scored = candidates.map((p) => {
    const details = ext.profileDetails[p.id];
    const headline = details?.tagline || p.role;
    const textPool = `${headline} ${details?.interests || ''} ${p.bio}`.toLowerCase();
    const sharedTopics = myInterests.filter((topic) => textPool.includes(topic));
    const verified = resolveProfileVerified(p.id, ext.adminUsers, details?.verified);
    const suggestionReason =
      sharedTopics.length > 0
        ? `Suggéré · Intérêt commun : ${sharedTopics[0]}`
        : verified
          ? 'Suggéré · Contributeur vérifié SAVOIR+'
          : 'Suggéré · Actif dans votre fil d’entraide';

    return {
      score: sharedTopics.length * 10 + (verified ? 3 : 0),
      entry: {
        profile: p,
        headline,
        verified,
        isFollowed: false,
        relationStatus: 'none' as const,
        blocked: false,
        suggestionReason
      }
    };
  });

  scored.sort((a, b) => b.score - a.score || a.entry.profile.name.localeCompare(b.entry.profile.name));
  return scored.slice(0, limit).map((s) => s.entry);
}

export function resolveFollowedAndConnectedProfiles(
  directory: Profile[],
  currentUserId: string,
  followingIds: string[],
  relations: { id: string; members: string[]; status: 'pending' | 'accepted' | 'declined'; blockedBy: string[] }[],
  ext: ExtendedDemoState
): (NetworkDirectoryEntry & { relation?: { id: string; members: string[]; status: 'pending' | 'accepted' | 'declined'; blockedBy: string[] } })[] {
  const acceptedPeers = new Map<string, typeof relations[number]>();
  const allRelByPeer = new Map<string, typeof relations[number]>();

  for (const r of relations) {
    const peerId = r.members.find((id) => id !== currentUserId);
    if (!peerId) continue;
    allRelByPeer.set(peerId, r);
    if (r.status === 'accepted') {
      acceptedPeers.set(peerId, r);
    }
  }

  const orderedIds = Array.from(new Set([...followingIds, ...acceptedPeers.keys()])).filter(
    (id) => id !== currentUserId
  );

  return orderedIds.map((id) => {
    const existing = directory.find((p) => p.id === id);
    const resolvedFallback = existing
      ? null
      : resolveCommunityAuthor(id, id.charAt(0).toUpperCase() + id.slice(1), directory, ext);
    const profile = existing || resolvedFallback!.profile;
    const details = ext.profileDetails[profile.id];
    const rel = allRelByPeer.get(profile.id);
    const verified = resolveProfileVerified(profile.id, ext.adminUsers, details?.verified);

    return {
      profile,
      headline: details?.tagline || profile.role,
      verified,
      isFollowed: followingIds.includes(profile.id),
      relationStatus: rel?.status || 'none',
      blocked: Boolean(rel?.blockedBy.length),
      suggestionReason: followingIds.includes(profile.id) ? 'Compte suivi' : 'Discussion acceptée',
      relation: rel
    };
  });
}

export interface SavoirRankInfo {
  title: string;
  tierIndex: number; // 1..4 diamonds
  tierMax: number;
  emblemTone: 'bronze' | 'silver' | 'gold' | 'emerald';
}

export function computeSavoirRank(totalXp: number, completedModules: number): SavoirRankInfo {
  if (totalXp >= 450 || completedModules >= 3) {
    return { title: 'Mentor SAVOIR+', tierIndex: 4, tierMax: 4, emblemTone: 'emerald' };
  }
  if (totalXp >= 300 || completedModules >= 2) {
    return { title: 'Confirmé', tierIndex: 3, tierMax: 4, emblemTone: 'gold' };
  }
  if (totalXp >= 150 || completedModules >= 1) {
    return { title: 'Explorateur', tierIndex: 2, tierMax: 4, emblemTone: 'silver' };
  }
  return { title: 'Débutant', tierIndex: 1, tierMax: 4, emblemTone: 'bronze' };
}

export function formatMemberHandle(name: string, id: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 14);
  return `@${slug || id}`;
}

export interface AnnualHeatmapMonth {
  label: string;
  cells: (0 | 1 | 2 | 3)[]; // 4 weekly intensity buckets per month
}

export function computeAnnualActivitySummary(params: {
  totalXp: number;
  completedLessonsCount: number;
  passedQuizzesCount: number;
  postsCount: number;
  repliesCount: number;
}): {
  yearXp: number;
  weeklyAverage: number;
  activeWeeks: number;
  streakWeeks: number;
  weeklyXp: number;
  weeklyTarget: number;
  months: AnnualHeatmapMonth[];
} {
  const { totalXp, completedLessonsCount, passedQuizzesCount, postsCount, repliesCount } = params;
  const communityXp = postsCount * 15 + repliesCount * 10;
  const yearXp = totalXp + communityXp;
  const activeSignals = completedLessonsCount + passedQuizzesCount + postsCount + repliesCount;
  const activeWeeks = yearXp === 0 ? 0 : Math.min(12, Math.max(1, Math.ceil(activeSignals / 2)));
  const streakWeeks = yearXp === 0 ? 0 : Math.min(activeWeeks, Math.max(1, passedQuizzesCount + (postsCount > 0 ? 1 : 0)));
  const weeklyAverage = activeWeeks > 0 ? Math.round((yearXp / activeWeeks) * 10) / 10 : 0;
  const weeklyTarget = 200;
  const weeklyXp = Math.min(weeklyTarget, totalXp > 0 ? Math.min(weeklyTarget, (totalXp % 200) || (totalXp >= 200 ? 200 : totalXp)) : 0);

  const monthLabels = ['Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov'];
  const months: AnnualHeatmapMonth[] = monthLabels.map((label, idx) => {
    const monthsFromEnd = monthLabels.length - 1 - idx;
    if (yearXp === 0 || monthsFromEnd >= Math.ceil(activeWeeks / 2)) {
      return { label, cells: [0, 0, 0, 0] };
    }
    const baseIntensity = monthsFromEnd === 0 ? 3 : monthsFromEnd === 1 ? 2 : 1;
    const cells: (0 | 1 | 2 | 3)[] = [0, 1, 2, 3].map((slot) => {
      if (monthsFromEnd === 0) {
        if (slot < Math.min(4, Math.max(1, activeSignals))) return (slot === 0 ? 3 : 2) as 0 | 1 | 2 | 3;
        return 1;
      }
      return (slot % 2 === 0 ? baseIntensity : Math.max(0, baseIntensity - 1)) as 0 | 1 | 2 | 3;
    });
    return { label, cells };
  });

  return {
    yearXp,
    weeklyAverage,
    activeWeeks,
    streakWeeks,
    weeklyXp,
    weeklyTarget,
    months
  };
}

export type BadgeTrack = 'learning' | 'community';
export type BadgeCategoryId = 'rank' | 'modules' | 'community' | 'streak';

export interface SavoirBadgeItem {
  id: string;
  title: string;
  description: string;
  track: BadgeTrack;
  category: BadgeCategoryId;
  iconKey:
    | 'compass'
    | 'award'
    | 'shield'
    | 'crown'
    | 'phishing'
    | 'network'
    | 'lock'
    | 'path'
    | 'message'
    | 'check'
    | 'users'
    | 'heart'
    | 'flame'
    | 'target'
    | 'book'
    | 'sparkles';
  earned: boolean;
}

export interface BadgeInputMetrics {
  totalXp: number;
  level: number;
  completedModules: string[];
  passedQuizzes: string[];
  perfectQuizzes: string[];
  completedLessonsCount: number;
  postsCount: number;
  repliesCount: number;
  solutionsCount: number;
  helpfulGivenCount: number;
  followingCount: number;
  acceptedRelationsCount: number;
  streakWeeks: number;
}

export function computeSavoirBadges(m: BadgeInputMetrics): SavoirBadgeItem[] {
  return [
    // Category: Rangs & Niveaux (track: learning)
    {
      id: 'rank-starter',
      title: 'Premier Pas',
      description: 'Démarrer votre parcours d’apprentissage sur SAVOIR+.',
      track: 'learning',
      category: 'rank',
      iconKey: 'compass',
      earned: m.completedLessonsCount > 0 || m.totalXp > 0
    },
    {
      id: 'rank-explorer',
      title: 'Explorateur',
      description: 'Atteindre au moins 150 XP ou valider un premier module.',
      track: 'learning',
      category: 'rank',
      iconKey: 'target',
      earned: m.totalXp >= 150 || m.completedModules.length >= 1
    },
    {
      id: 'rank-confirmed',
      title: 'Apprenant Confirmé',
      description: 'Cumuler 300 XP et valider deux modules complets.',
      track: 'learning',
      category: 'rank',
      iconKey: 'award',
      earned: m.totalXp >= 300 || m.completedModules.length >= 2
    },
    {
      id: 'rank-mentor',
      title: 'Mentor SAVOIR+',
      description: 'Atteindre le palier supérieur avec 450 XP ou trois modules validés.',
      track: 'learning',
      category: 'rank',
      iconKey: 'crown',
      earned: m.totalXp >= 450 || m.completedModules.length >= 3
    },

    // Category: Modules & Parcours (track: learning)
    {
      id: 'mod-phishing',
      title: 'Vigilance Phishing',
      description: 'Réussir l’évaluation du module « Ne tombez plus dans le piège ».',
      track: 'learning',
      category: 'modules',
      iconKey: 'phishing',
      earned: m.passedQuizzes.includes('phishing')
    },
    {
      id: 'mod-reseaux',
      title: 'Architecte Réseau',
      description: 'Valider le module « Comprendre les réseaux ».',
      track: 'learning',
      category: 'modules',
      iconKey: 'network',
      earned: m.passedQuizzes.includes('reseaux')
    },
    {
      id: 'mod-comptes',
      title: 'Gardien des Accès',
      description: 'Valider le module « Sécuriser ses comptes au quotidien ».',
      track: 'learning',
      category: 'modules',
      iconKey: 'lock',
      earned: m.passedQuizzes.includes('comptes')
    },
    {
      id: 'mod-perfect',
      title: 'Score Parfait',
      description: 'Obtenir 100 % de bonnes réponses sur au moins un quiz final.',
      track: 'learning',
      category: 'modules',
      iconKey: 'shield',
      earned: m.perfectQuizzes.length >= 1
    },
    {
      id: 'mod-path',
      title: 'Parcours Fondamentaux IT',
      description: 'Valider l’ensemble des trois modules du parcours Fondamentaux IT.',
      track: 'learning',
      category: 'modules',
      iconKey: 'path',
      earned: ['phishing', 'reseaux', 'comptes'].every((id) => m.completedModules.includes(id))
    },
    {
      id: 'mod-reader',
      title: 'Lecteur Assidu',
      description: 'Terminer au moins 6 sections de cours guidées.',
      track: 'learning',
      category: 'modules',
      iconKey: 'book',
      earned: m.completedLessonsCount >= 6
    },
    {
      id: 'mod-dual',
      title: 'Double Compétence',
      description: 'Terminer intégralement deux modules pédagogiques distincts.',
      track: 'learning',
      category: 'modules',
      iconKey: 'sparkles',
      earned: m.completedModules.length >= 2
    },
    {
      id: 'mod-triple-quiz',
      title: 'Maîtrise Évaluée',
      description: 'Réussir trois évaluations de fin de module.',
      track: 'learning',
      category: 'modules',
      iconKey: 'award',
      earned: m.passedQuizzes.length >= 3
    },

    // Category: Communauté & Entraide (track: community)
    {
      id: 'com-voice',
      title: 'Esprit d’Entraide',
      description: 'Publier un conseil ou répondre à une question dans le fil d’entraide.',
      track: 'community',
      category: 'community',
      iconKey: 'message',
      earned: m.postsCount + m.repliesCount >= 1
    },
    {
      id: 'com-solution',
      title: 'Solution Validée',
      description: 'Avoir une réponse choisie comme solution utile par l’auteur d’une question.',
      track: 'community',
      category: 'community',
      iconKey: 'check',
      earned: m.solutionsCount >= 1
    },
    {
      id: 'com-network',
      title: 'Cercle Solidaire',
      description: 'Suivre au moins deux membres ou établir une discussion acceptée.',
      track: 'community',
      category: 'community',
      iconKey: 'users',
      earned: m.followingCount >= 2 || m.acceptedRelationsCount >= 1
    },
    {
      id: 'com-helpful',
      title: 'Soutien Bienveillant',
      description: 'Marquer au moins deux contributions comme utiles pour encourager vos pairs.',
      track: 'community',
      category: 'community',
      iconKey: 'heart',
      earned: m.helpfulGivenCount >= 2
    },

    // Category: Régularité & Défis (track: community)
    {
      id: 'str-week',
      title: 'Série Lancée',
      description: 'Maintenir au moins une semaine active d’apprentissage sur SAVOIR+.',
      track: 'community',
      category: 'streak',
      iconKey: 'flame',
      earned: m.streakWeeks >= 1
    },
    {
      id: 'str-two-weeks',
      title: 'Régularité Exemplaire',
      description: 'Conserver une série active sur deux semaines ou plus.',
      track: 'community',
      category: 'streak',
      iconKey: 'flame',
      earned: m.streakWeeks >= 2
    },
    {
      id: 'str-dialogue',
      title: 'Pair Connecté',
      description: 'Accepter ou ouvrir une conversation privée d’entraide.',
      track: 'community',
      category: 'streak',
      iconKey: 'message',
      earned: m.acceptedRelationsCount >= 1
    },
    {
      id: 'str-mentor-share',
      title: 'Passeur de Savoir',
      description: 'Partager au moins deux contributions publiques avec la communauté.',
      track: 'community',
      category: 'streak',
      iconKey: 'users',
      earned: m.postsCount >= 2
    }
  ];
}








