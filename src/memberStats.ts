/**
 * Progression d'un membre (XP, niveau, rang, badges, compétences), calculée à un seul endroit
 * pour que la page profil et la vue « Progression & badges » affichent les mêmes chiffres.
 */
import type { Profile, Progress, Relation } from './data';
import { MODULES_CONTENT } from './content';
import { moduleProgressPercent, moduleXp, scoreAnswers } from './domain.mjs';
import { computeAnnualActivitySummary, computeGlobalLevel, computeSavoirBadges, computeSavoirRank } from './personas';
import { buildDynamicCatalog, type ExtendedDemoState } from './wireframeData';

const EMPTY_PROGRESS: Progress = { lessons: [], answers: [], submitted: false };

export interface MemberStatsInput {
  target: Profile;
  isOwnProfile: boolean;
  ext: ExtendedDemoState;
  relations: Relation[];
  /** Abonnements de l'utilisateur courant (utilisés pour son propre profil). */
  myFollowing: string[];
  /** Progression du module principal de l'utilisateur courant. */
  progress: Progress;
  getModuleProgress?: (modId: string) => Progress;
}

function ownModuleProgress(
  modId: string,
  progress: Progress,
  ext: ExtendedDemoState,
  userId: string,
  getModuleProgress?: (id: string) => Progress
): Progress {
  if (getModuleProgress) return getModuleProgress(modId);
  if (modId === 'phishing') return progress;
  return ext.moduleProgress?.[userId]?.[modId] || EMPTY_PROGRESS;
}

export function computeMemberStats({
  target,
  isOwnProfile,
  ext,
  relations,
  myFollowing,
  progress,
  getModuleProgress
}: MemberStatsInput) {
  const catalog = buildDynamicCatalog(ext);
  const playableModules = catalog.filter((c) => c.type === 'module' && c.interactive);

  const moduleMetrics = playableModules.map((mod) => {
    const modProg = isOwnProfile
      ? ownModuleProgress(mod.id, progress, ext, target.id, getModuleProgress)
      : ext.moduleProgress?.[target.id]?.[mod.id] || EMPTY_PROGRESS;
    const study = MODULES_CONTENT[mod.id];
    const lessonCount = study ? study.lessons.length : 3;
    const correctIndices = study ? study.questions.map((q) => q.correctIndex) : [0, 0];
    const key = study ? correctIndices : undefined;
    const pctVal = moduleProgressPercent(modProg, lessonCount, key);
    const xpVal = moduleXp(modProg, lessonCount, key);
    const qLen = correctIndices.length;
    const passThreshold = Math.max(1, Math.ceil(qLen * 0.66));
    const qScore = scoreAnswers(modProg.answers || [], correctIndices);
    const passed = modProg.submitted && qScore >= passThreshold;
    const perfect = modProg.submitted && qScore === qLen && qLen > 0;
    return { mod, modProg, lessonCount, pctVal, xpVal, qScore, qLen, passed, perfect };
  });

  const totalXp = moduleMetrics.reduce((acc, m) => acc + m.xpVal, 0);
  const lvl = computeGlobalLevel(totalXp);
  const completedModules = moduleMetrics.filter((m) => m.pctVal === 100).map((m) => m.mod.id);
  const passedQuizzes = moduleMetrics.filter((m) => m.passed).map((m) => m.mod.id);
  const perfectQuizzes = moduleMetrics.filter((m) => m.perfect).map((m) => m.mod.id);
  const completedLessonsCount = moduleMetrics.reduce((acc, m) => acc + m.modProg.lessons.length, 0);

  const postsCount = ext.posts.filter((p) => p.authorId === target.id && !p.repostedFrom).length;
  const repliesCount = ext.posts.reduce(
    (acc, p) => acc + p.replies.filter((r) => r.authorId === target.id).length,
    0
  );
  const solutionsCount = ext.posts.filter(
    (p) => p.solutionReplyId && p.replies.some((r) => r.id === p.solutionReplyId && r.authorId === target.id)
  ).length;
  const helpfulGivenCount = ext.posts.reduce(
    (acc, p) =>
      acc +
      (p.helpfulBy?.includes(target.id) ? 1 : 0) +
      p.replies.filter((r) => r.helpfulBy.includes(target.id)).length,
    0
  );
  const mediaPostsCount = ext.posts.filter((p) => p.authorId === target.id && Boolean(p.media)).length;
  const helpfulReceivedCount = ext.posts.reduce(
    (acc, p) =>
      acc +
      (p.authorId === target.id ? (p.helpfulBy || []).filter((id) => id !== target.id).length : 0) +
      p.replies
        .filter((r) => r.authorId === target.id)
        .reduce((sum, r) => sum + r.helpfulBy.filter((id) => id !== target.id).length, 0),
    0
  );
  const passedDomains = Array.from(new Set(moduleMetrics.filter((m) => m.passed).map((m) => m.mod.domain)));
  const followingCount = (isOwnProfile ? myFollowing : ext.followingIds[target.id] || []).length;
  /** Personnes qui suivent ce membre (abonnés). */
  const followersCount = Object.entries(ext.followingIds || {}).filter(
    ([id, list]) => id !== target.id && (list || []).includes(target.id)
  ).length;
  const acceptedRelationsCount = relations.filter(
    (r) => r.members.includes(target.id) && r.status === 'accepted'
  ).length;

  const rankInfo = computeSavoirRank(totalXp, completedModules.length);
  const activity = computeAnnualActivitySummary({
    totalXp,
    completedLessonsCount,
    passedQuizzesCount: passedQuizzes.length,
    postsCount,
    repliesCount
  });

  const badges = computeSavoirBadges({
    totalXp,
    level: lvl.level,
    completedModules,
    passedQuizzes,
    perfectQuizzes,
    completedLessonsCount,
    postsCount,
    repliesCount,
    solutionsCount,
    helpfulGivenCount,
    followingCount,
    acceptedRelationsCount,
    streakWeeks: activity.streakWeeks,
    passedDomains,
    mediaPostsCount,
    helpfulReceivedCount,
    followersCount
  });

  /** Compétences travaillées : celles des modules commencés ou validés, avec leur module d'origine. */
  const skills: { name: string; moduleTitle: string; validated: boolean }[] = [];
  for (const m of moduleMetrics) {
    if (!m.passed && m.pctVal === 0) continue;
    for (const sk of m.mod.skills || []) {
      if (!skills.some((s) => s.name === sk)) skills.push({ name: sk, moduleTitle: m.mod.title, validated: m.passed });
    }
  }

  return {
    catalog,
    playableModules,
    moduleMetrics,
    totalXp,
    lvl,
    completedModules,
    passedQuizzes,
    perfectQuizzes,
    completedLessonsCount,
    postsCount,
    repliesCount,
    solutionsCount,
    helpfulGivenCount,
    helpfulReceivedCount,
    mediaPostsCount,
    passedDomains,
    followingCount,
    followersCount,
    acceptedRelationsCount,
    rankInfo,
    activity,
    badges,
    skills
  };
}

export type MemberStats = ReturnType<typeof computeMemberStats>;
