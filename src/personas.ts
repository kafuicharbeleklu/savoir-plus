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
import { moduleProgressPercent } from './domain.mjs';

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
      const mp = moduleProgressPercent(p, count);
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
  const doneSteps = Math.min(lessonCount, modProg.lessons.length) + (modProg.submitted ? 1 : 0);
  return {
    pct: moduleProgressPercent(modProg, lessonCount),
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
  preferredOrder: string[] = ['reseaux', 'phishing', 'comptes']
): { item: CatalogItem; pct: number } | null {
  const modules = catalog.filter((c) => c.type === 'module');
  if (modules.length === 0) return null;

  const orderedIds = Array.from(new Set([...preferredOrder, ...modules.map((m) => m.id)]));

  for (const id of orderedIds) {
    const item = modules.find((m) => m.id === id);
    if (!item) continue;
    const total = lessonCounts[id] || item.sections?.length || 3;
    const pct = moduleProgressPercent(getProgress(id), total);
    if (pct > 0 && pct < 100) {
      return { item, pct };
    }
  }

  for (const id of orderedIds) {
    const item = modules.find((m) => m.id === id);
    if (!item) continue;
    const total = lessonCounts[id] || item.sections?.length || 3;
    const pct = moduleProgressPercent(getProgress(id), total);
    if (pct > 0) {
      return { item, pct };
    }
  }

  const fallback = modules.find((m) => m.id === 'phishing') || modules[0];
  const fallbackTotal = lessonCounts[fallback.id] || fallback.sections?.length || 3;
  return {
    item: fallback,
    pct: moduleProgressPercent(getProgress(fallback.id), fallbackTotal)
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





