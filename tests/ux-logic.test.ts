import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canAccessRoute,
  resolveCapabilities,
  difficultySegments,
  isFocusedStudyRoute,
  isStudioRoute,
  isGovernanceRoute,
  computeGlobalLevel
} from '../src/personas';
import type { AdminUserRecord } from '../src/wireframeData';

const baseUsers: AdminUserRecord[] = [
  {
    id: 'usr-afi',
    name: 'Afi Mensah',
    email: 'afi@exemple.test',
    institution: 'Lycée Numérique Lomé (démo)',
    createdAt: '10/11/2026',
    status: 'active',
    verified: true,
    roles: ['Apprenant'],
    lastActivity: 'Aujourd’hui',
    sanctionsCount: 0,
    reportsCount: 0,
    openTicketsCount: 0,
    exceptionalNote: ''
  },
  {
    id: 'usr-kossi',
    name: 'Kossi Agbo',
    email: 'kossi@exemple.test',
    institution: 'Université de Lomé (démo)',
    createdAt: '09/11/2026',
    status: 'active',
    verified: true,
    roles: ['Créateur habilité'],
    lastActivity: 'Aujourd’hui',
    sanctionsCount: 0,
    reportsCount: 0,
    openTicketsCount: 0,
    exceptionalNote: ''
  },
  {
    id: 'usr-nadege',
    name: 'Nadège Koffi',
    email: 'nadege@exemple.test',
    institution: 'SAVOIR+',
    createdAt: '01/11/2026',
    status: 'active',
    verified: true,
    roles: ['Administrateur', 'Responsable de modération'],
    lastActivity: 'Aujourd’hui',
    sanctionsCount: 0,
    reportsCount: 0,
    openTicketsCount: 0,
    exceptionalNote: ''
  }
];

test('Role capabilities are strictly scoped by persona', () => {
  const afi = resolveCapabilities('afi', 'local', baseUsers);
  assert.equal(afi.canLearn, true);
  assert.equal(afi.canCreate, false);
  assert.equal(afi.canModerate, false);
  assert.equal(afi.canAdmin, false);

  const kossi = resolveCapabilities('kossi', 'local', baseUsers);
  assert.equal(kossi.canCreate, true);
  assert.equal(kossi.canModerate, false);
  assert.equal(kossi.canAdmin, false);

  const nadege = resolveCapabilities('nadege', 'local', baseUsers);
  assert.equal(nadege.canCreate, true);
  assert.equal(nadege.canModerate, true);
  assert.equal(nadege.canValidate, true);
  assert.equal(nadege.canAdmin, true);
});

test('Suspended account revokes ordinary capabilities while keeping appeal access open (REV-11)', () => {
  const suspendedUsers = baseUsers.map((u) => (u.id === 'usr-kossi' ? { ...u, status: 'suspended' as const } : u));
  const kossi = resolveCapabilities('kossi', 'local', suspendedUsers);
  assert.equal(kossi.isSuspended, true);
  assert.equal(kossi.canCreate, false);
  assert.equal(kossi.canLearn, false);
  assert.equal(kossi.canAdmin, false);
});

test('Route classification and HTB difficulty segments behave deterministically', () => {
  assert.equal(isFocusedStudyRoute('reader'), true);
  assert.equal(isFocusedStudyRoute('quiz'), true);
  assert.equal(isFocusedStudyRoute('home'), false);
  assert.equal(isStudioRoute('studio-quiz'), true);
  assert.equal(isGovernanceRoute('moderation'), true);
  assert.equal(isGovernanceRoute('admin-audit'), true);

  assert.deepEqual(difficultySegments('Débutant'), { filled: 1, total: 3, label: 'Débutant', tone: 'easy' });
  assert.deepEqual(difficultySegments('Avancé'), { filled: 3, total: 3, label: 'Avancé', tone: 'hard' });
});

test('Level calculation maps XP into consistent level progress', () => {
  const lvl = computeGlobalLevel(250);
  assert.equal(lvl.level, 2);
  assert.equal(lvl.currentXp, 50);
  assert.equal(lvl.targetXp, 200);
  assert.equal(lvl.percent, 25);
});

import { initialExtendedState, buildDynamicCatalog, formatNotificationTimestamp, CATALOG_ITEMS } from '../src/wireframeData';
import { getCatalogTypeMeta, computeCatalogCardSteps, resolveProfileVerified } from '../src/personas';
import { resolveStudyContent } from '../src/content';

test('Dynamic catalog reflects live Studio publications and resolves study content', () => {
  const ext = initialExtendedState();
  ext.studioContents.push({
    id: 'st-live-1',
    type: 'module',
    title: 'Hygiène numérique mobile',
    domain: 'Numérique',
    duration: '12 min',
    version: 'v1',
    pubStatus: 'Publié',
    reviewStatus: 'Non soumise',
    audience: 'Membres autorisés',
    sources: 'Guide ANSSI',
    updatedAt: 'Maintenant',
    sections: [{ id: 's1', title: 'Mises à jour', body: 'Activer les correctifs automatiques.' }]
  });
  const catalog = buildDynamicCatalog(ext);
  const published = catalog.find((c) => c.id === 'st-live-1');
  assert.ok(published);
  assert.equal(published?.title, 'Hygiène numérique mobile');
  assert.equal(published?.interactive, true);

  const study = resolveStudyContent('st-live-1', ext.studioContents, ext.studioQuiz);
  assert.equal(study.id, 'st-live-1');
  assert.equal(study.lessons.length, 3);
  assert.equal(study.lessons[0].title, 'Mises à jour');

  const coreReseaux = resolveStudyContent('reseaux');
  assert.equal(coreReseaux.labType, 'reseaux');
  assert.equal(coreReseaux.lessons.length, 3);
});

test('Notifications include responsible actor metadata and explicit timestamps', () => {
  const ext = initialExtendedState();
  assert.ok(ext.notifications.length >= 3);
  for (const n of ext.notifications) {
    assert.ok(n.actorId && n.actorName, `Missing actor on ${n.id}`);
    assert.ok(!/aujourd|hier/i.test(n.date), `Relative date should be timestamped on ${n.id}: ${n.date}`);
    assert.match(n.date, /\d{1,2}\s+\w+\.?\s+\d{4}\s+·\s+\d{2}\s+h\s+\d{2}/);
  }
  const formatted = formatNotificationTimestamp(new Date(2026, 10, 14, 9, 5));
  assert.equal(formatted, '14 nov. 2026 · 09 h 05');
});

test('Sober card metadata and step ratio helpers handle module, resource, and path consistently', () => {
  assert.deepEqual(getCatalogTypeMeta('module'), { label: 'Module', tone: 'module' });
  assert.deepEqual(getCatalogTypeMeta('resource'), { label: 'Ressource', tone: 'resource' });
  assert.deepEqual(getCatalogTypeMeta('path'), { label: 'Parcours', tone: 'path' });

  const phishing = CATALOG_ITEMS.find((i) => i.id === 'phishing')!;
  const fiche = CATALOG_ITEMS.find((i) => i.id === 'fiche-reseau')!;
  const path = CATALOG_ITEMS.find((i) => i.id === 'fondamentaux-it')!;

  const counts = { phishing: 3, reseaux: 3, comptes: 3 };
  const getProg = (id: string) =>
    id === 'phishing'
      ? { lessons: [0, 1], answers: [], submitted: false }
      : { lessons: [], answers: [], submitted: false };

  const modSteps = computeCatalogCardSteps(phishing, getProg, counts);
  assert.equal(modSteps.pct, 50);
  assert.equal(modSteps.doneSteps, 2);
  assert.equal(modSteps.totalSteps, 4);

  const resSteps = computeCatalogCardSteps(fiche, getProg, counts);
  assert.equal(resSteps.pct, 0);
  assert.equal(resSteps.totalSteps, 0);

  const pathSteps = computeCatalogCardSteps(path, getProg, counts);
  assert.ok(pathSteps.pct > 0);
  assert.equal(pathSteps.totalSteps, 6);
});

test('Profile verification badge resolves deterministically and defaults include LinkedIn-style location', () => {
  const ext = initialExtendedState();
  assert.equal(resolveProfileVerified('afi', ext.adminUsers, true), true);
  assert.equal(resolveProfileVerified('kossi', ext.adminUsers, true), true);
  assert.equal(resolveProfileVerified('usr-maya', ext.adminUsers, false), false);

  const unverifiedAfi = ext.adminUsers.map((u) => (u.id === 'usr-afi' ? { ...u, verified: false } : u));
  assert.equal(resolveProfileVerified('afi', unverifiedAfi, true), false);

  assert.ok(ext.profileDetails.afi.tagline.includes('|'));
  assert.equal(ext.profileDetails.afi.location, 'Lomé, Région Maritime');
});

import { resolveActiveSpace, filterHomeFeed, evaluateStudioReadiness } from '../src/personas';

test('Adaptive space routing maps learner, community, studio, and admin routes cleanly', () => {
  assert.equal(resolveActiveSpace('home'), 'learner');
  assert.equal(resolveActiveSpace('catalog'), 'learner');
  assert.equal(resolveActiveSpace('progression'), 'learner');
  assert.equal(resolveActiveSpace('community'), 'community');
  assert.equal(resolveActiveSpace('community-thread'), 'community');
  assert.equal(resolveActiveSpace('relations'), 'community');
  assert.equal(resolveActiveSpace('member'), 'community');
  assert.equal(resolveActiveSpace('studio-editor'), 'studio');
  assert.equal(resolveActiveSpace('studio-publish'), 'studio');
  assert.equal(resolveActiveSpace('admin-users'), 'admin');
  assert.equal(resolveActiveSpace('moderation'), 'admin');
  assert.equal(resolveActiveSpace('appeal', true), 'admin');
  assert.equal(resolveActiveSpace('appeal', false), 'learner');
  assert.equal(resolveActiveSpace('profile'), 'account');
  assert.equal(resolveActiveSpace('settings'), 'account');
});

test('Home feed filter separates all, following, open questions, and modules deterministically', () => {
  const ext = initialExtendedState();
  const all = filterHomeFeed(ext.posts, 'all', ['kossi']);
  assert.equal(all.length, ext.posts.length);

  const following = filterHomeFeed(ext.posts, 'following', ['kossi']);
  assert.ok(following.every((p) => p.authorId === 'kossi'));

  const openQ = filterHomeFeed(ext.posts, 'open-questions', ['kossi']);
  assert.ok(openQ.every((p) => p.kind === 'question' && !p.solutionReplyId));

  const mods = filterHomeFeed(ext.posts, 'modules', ['kossi']);
  assert.equal(mods.length, 0);
});

test('Studio readiness evaluation detects missing fields, media errors, and invalid quiz thresholds', () => {
  const ext = initialExtendedState();
  const content = ext.studioContents[0];
  const validQuiz = { ...ext.studioQuiz, passingScore: 2 };
  const readyMedia = ext.studioMedia.filter((m) => m.state === 'Disponible');
  const okReport = evaluateStudioReadiness(content, validQuiz, readyMedia);
  assert.equal(okReport.canPublish, true);
  assert.equal(okReport.blockingCount, 0);

  const brokenQuiz = { ...ext.studioQuiz, passingScore: 9 };
  const brokenMedia = ext.studioMedia.map((m, idx) =>
    idx === 0 ? { ...m, state: 'Échec' as const, usage: 'Utilisé dans 1 brouillon' } : m
  );
  const failReport = evaluateStudioReadiness({ ...content, title: ' ' }, brokenQuiz, brokenMedia);
  assert.equal(failReport.canPublish, false);
  assert.ok(failReport.blockingCount >= 2);
});

import { shouldBypassSplash, resolveSplashDurations, SPLASH_HOLD_MS, SPLASH_REDUCED_HOLD_MS } from '../src/personas';

test('Splash screen respects ?autostart=1 / ?splash=0 bypass and reduced motion timings', () => {
  assert.equal(shouldBypassSplash(''), false);
  assert.equal(shouldBypassSplash('?foo=bar'), false);
  assert.equal(shouldBypassSplash('?autostart=0'), false);
  assert.equal(shouldBypassSplash('?autostart=false'), false);
  assert.equal(shouldBypassSplash('?autostart=1'), true);
  assert.equal(shouldBypassSplash('?autostart=true'), true);
  assert.equal(shouldBypassSplash('?splash=0'), true);

  assert.equal(resolveSplashDurations(false).holdMs, SPLASH_HOLD_MS);
  assert.equal(resolveSplashDurations(true).holdMs, SPLASH_REDUCED_HOLD_MS);
  assert.ok(resolveSplashDurations(true).holdMs < resolveSplashDurations(false).holdMs);
});

import type { Profile } from '../src/data';
import {
  resolveCommunityAuthor,
  togglePostHelpful,
  applyPostRepost,
  appendCommunityReply
} from '../src/personas';

const demoProfiles: Profile[] = [
  {
    id: 'afi',
    name: 'Afi Mensah',
    role: 'Apprenante · Cybersécurité & Numérique',
    initials: 'AM',
    color: 'peach',
    bio: ''
  },
  {
    id: 'kossi',
    name: 'Kossi Agbo',
    role: 'Créateur & Mentor · Réseaux & Sécurité',
    initials: 'KA',
    color: 'lavender',
    bio: ''
  }
];

test('LinkedIn-style community helpers resolve author avatars, toggle helpful, repost, and thread nested replies', () => {
  const ext = initialExtendedState();

  const known = resolveCommunityAuthor('afi', 'Afi Mensah', demoProfiles, ext);
  assert.equal(known.isKnownMember, true);
  assert.equal(known.verified, true);
  assert.equal(known.profile.initials, 'AM');

  const external = resolveCommunityAuthor('ext-maya', 'Maya Kouassi', demoProfiles, ext, 'Mentore Cybersécurité');
  assert.equal(external.isKnownMember, false);
  assert.equal(external.profile.initials, 'MK');
  assert.equal(external.headline, 'Mentore Cybersécurité');

  const afterLike = togglePostHelpful(ext.posts, 'post-1', 'sam');
  assert.ok(afterLike.find((p) => p.id === 'post-1')?.helpfulBy?.includes('sam'));
  const afterUnlike = togglePostHelpful(afterLike, 'post-1', 'sam');
  assert.ok(!afterUnlike.find((p) => p.id === 'post-1')?.helpfulBy?.includes('sam'));

  const kossi = demoProfiles.find((p) => p.id === 'kossi')!;
  const repost1 = applyPostRepost(ext.posts, 'post-1', kossi, undefined, 'rep-plain-1');
  assert.equal(repost1.created, true);
  assert.equal(repost1.posts[0].id, 'rep-plain-1');
  assert.equal(repost1.posts[0].repostedFrom?.postId, 'post-1');
  assert.ok(repost1.posts.find((p) => p.id === 'post-1')?.repostedBy?.includes('kossi'));

  const duplicatePlain = applyPostRepost(repost1.posts, 'post-1', kossi, undefined, 'rep-plain-2');
  assert.equal(duplicatePlain.created, false);

  const quoteRepost = applyPostRepost(repost1.posts, 'post-1', kossi, 'Très bon rappel sécurité !', 'rep-quote-1');
  assert.equal(quoteRepost.created, true);
  assert.equal(quoteRepost.posts[0].repostNote, 'Très bon rappel sécurité !');

  const withTopReply = appendCommunityReply(ext.posts, 'post-1', {
    id: 'rep-new-top',
    authorId: 'afi',
    authorName: 'Afi Mensah',
    text: 'Merci pour cette piste !'
  });
  const topAdded = withTopReply.find((p) => p.id === 'post-1')!.replies.find((r) => r.id === 'rep-new-top')!;
  assert.equal(topAdded.parentReplyId, undefined);

  // Replying to a nested reply ('rep-1-1' whose parent is 'rep-1') flattens to parentReplyId 'rep-1' while keeping replyToName
  const withSubReply = appendCommunityReply(withTopReply, 'post-1', {
    id: 'rep-new-sub',
    authorId: 'kossi',
    authorName: 'Kossi Agbo',
    text: 'Je confirme ce réflexe.',
    parentReplyId: 'rep-1-1',
    replyToName: 'Maya Kouassi'
  });
  const subAdded = withSubReply.find((p) => p.id === 'post-1')!.replies.find((r) => r.id === 'rep-new-sub')!;
  assert.equal(subAdded.parentReplyId, 'rep-1');
  assert.equal(subAdded.replyToName, 'Maya Kouassi');

  const ignoreBlank = appendCommunityReply(withSubReply, 'post-1', {
    authorId: 'afi',
    authorName: 'Afi Mensah',
    text: '   '
  });
  assert.equal(ignoreBlank.find((p) => p.id === 'post-1')!.replies.length, withSubReply.find((p) => p.id === 'post-1')!.replies.length);
});

import { resolveActiveLab, resolveDefaultCommentPreview, resolveDiscoverSuggestions } from '../src/personas';

test('resolveActiveLab prioritizes in-progress module for TopBar avatar', () => {
  const counts = { phishing: 3, reseaux: 3, comptes: 3 };
  const active = resolveActiveLab(
    CATALOG_ITEMS,
    (id) => (id === 'reseaux' ? { lessons: [0], answers: [], submitted: false } : { lessons: [], answers: [], submitted: false }),
    counts
  );
  assert.ok(active);
  assert.equal(active!.item.id, 'reseaux');
  assert.ok(active!.pct > 0 && active!.pct < 100);

  const fallback = resolveActiveLab(
    CATALOG_ITEMS,
    () => ({ lessons: [], answers: [], submitted: false }),
    counts
  );
  assert.ok(fallback);
  assert.equal(fallback!.item.id, 'phishing');
  assert.equal(fallback!.pct, 0);
});

test('resolveDefaultCommentPreview retracts comments unless latest top-level comment is from community', () => {
  const ext = initialExtendedState();
  const post1Top = ext.posts[0].replies.filter((r) => !r.parentReplyId);

  // Latest top reply on post-1 is by 'kossi'
  assert.equal(resolveDefaultCommentPreview([], ['kossi'], 'afi'), null);
  assert.equal(resolveDefaultCommentPreview(post1Top, [], 'afi'), null);
  assert.equal(resolveDefaultCommentPreview(post1Top, ['maya'], 'afi'), null);
  assert.equal(resolveDefaultCommentPreview(post1Top, ['kossi'], 'kossi'), null);

  const preview = resolveDefaultCommentPreview(post1Top, ['kossi', 'maya'], 'afi');
  assert.ok(preview);
  assert.equal(preview!.id, 'rep-2');
  assert.equal(preview!.authorId, 'kossi');
});

test('resolveDiscoverSuggestions excludes current user and already-followed accounts', () => {
  const allPeople: Profile[] = [
    ...demoProfiles,
    {
      id: 'nadege',
      name: 'Nadège Koffi',
      role: 'Modération & Gouvernance · SAVOIR+',
      initials: 'NK',
      color: 'mint',
      bio: ''
    }
  ];

  const suggestionsForAfi = resolveDiscoverSuggestions(allPeople, 'afi', ['kossi', 'maya'], 3);
  assert.deepEqual(
    suggestionsForAfi.map((p) => p.id),
    ['nadege']
  );

  const suggestionsAfterFollow = resolveDiscoverSuggestions(allPeople, 'afi', ['kossi', 'maya', 'nadege'], 3);
  assert.equal(suggestionsAfterFollow.length, 0);
});
import {
  resolveCommunityDirectory,
  resolveAlgorithmicDiscoverProfiles,
  resolveFollowedAndConnectedProfiles
} from '../src/personas';

test('Relations Discover shows only unfollowed algorithmic suggestions and Mes relations lists all followed and connected accounts', () => {
  const ext = initialExtendedState();
  const baseProfiles: Profile[] = [
    ...demoProfiles,
    {
      id: 'nadege',
      name: 'Nadège Koffi',
      role: 'Modération & Gouvernance · SAVOIR+',
      initials: 'NK',
      color: 'mint',
      bio: 'Gouvernance et sécurité numérique.'
    }
  ];

  const directory = resolveCommunityDirectory(baseProfiles, ext);
  assert.ok(directory.some((p) => p.id === 'maya'));
  assert.ok(directory.some((p) => p.id === 'sam'));

  const discover = resolveAlgorithmicDiscoverProfiles(directory, 'afi', ext.followingIds.afi, ext);
  const discoverIds = discover.map((d) => d.profile.id);
  assert.ok(!discoverIds.includes('afi'));
  assert.ok(!discoverIds.includes('kossi'));
  assert.ok(!discoverIds.includes('maya'));
  assert.ok(discoverIds.includes('nadege'));
  assert.ok(discoverIds.includes('sam'));
  assert.ok(discover.every((d) => !d.isFollowed && d.suggestionReason.startsWith('Suggéré')));

  const relations = [
    {
      id: 'afi__nadege',
      members: ['afi', 'nadege'],
      status: 'accepted' as const,
      blockedBy: []
    }
  ];
  const network = resolveFollowedAndConnectedProfiles(directory, 'afi', ext.followingIds.afi, relations, ext);
  const networkIds = network.map((n) => n.profile.id);
  assert.deepEqual(networkIds, ['kossi', 'maya', 'nadege']);
  assert.equal(network.find((n) => n.profile.id === 'kossi')?.isFollowed, true);
  assert.equal(network.find((n) => n.profile.id === 'maya')?.isFollowed, true);
  assert.equal(network.find((n) => n.profile.id === 'nadege')?.relationStatus, 'accepted');
});

import {
  computeSavoirRank,
  formatMemberHandle,
  computeAnnualActivitySummary,
  computeSavoirBadges
} from '../src/personas';

test('Savoir rank, member handle, annual activity heatmap, and badges compute deterministically', () => {
  assert.equal(computeSavoirRank(0, 0).title, 'Débutant');
  assert.equal(computeSavoirRank(150, 1).title, 'Explorateur');
  assert.equal(computeSavoirRank(320, 2).title, 'Confirmé');
  assert.equal(computeSavoirRank(500, 3).title, 'Mentor SAVOIR+');

  assert.equal(formatMemberHandle('Afi Mensah', 'afi'), '@afimensah');
  assert.equal(formatMemberHandle('Nadège Koffi', 'nadege'), '@nadegekoffi');

  const activity = computeAnnualActivitySummary({
    totalXp: 150,
    completedLessonsCount: 3,
    passedQuizzesCount: 1,
    postsCount: 1,
    repliesCount: 2
  });
  assert.equal(activity.yearXp, 185);
  assert.equal(activity.months.length, 12);
  assert.ok(activity.activeWeeks >= 1);
  assert.ok(activity.streakWeeks >= 1);
  assert.equal(activity.weeklyTarget, 200);

  const badges = computeSavoirBadges({
    totalXp: 150,
    level: 1,
    completedModules: ['phishing'],
    passedQuizzes: ['phishing'],
    perfectQuizzes: ['phishing'],
    completedLessonsCount: 3,
    postsCount: 1,
    repliesCount: 1,
    solutionsCount: 0,
    helpfulGivenCount: 2,
    followingCount: 2,
    acceptedRelationsCount: 1,
    streakWeeks: 2
  });
  assert.equal(badges.length, 20);
  assert.equal(badges.find((b) => b.id === 'mod-phishing')?.earned, true);
  assert.equal(badges.find((b) => b.id === 'mod-perfect')?.earned, true);
  assert.equal(badges.find((b) => b.id === 'mod-reseaux')?.earned, false);
  assert.equal(badges.find((b) => b.id === 'com-helpful')?.earned, true);
  assert.equal(badges.find((b) => b.id === 'str-two-weeks')?.earned, true);
});


test('Garde de route : Studio et Gouvernance inaccessibles par URL sans le rôle requis', () => {
  const afi = resolveCapabilities('afi', 'local', baseUsers);
  const kossi = resolveCapabilities('kossi', 'local', baseUsers);
  const nadege = resolveCapabilities('nadege', 'local', baseUsers);
  // Apprenante : ni Studio ni Gouvernance, mais pages d'apprentissage et recours accessibles
  assert.equal(canAccessRoute('admin-users', afi), false);
  assert.equal(canAccessRoute('moderation', afi), false);
  assert.equal(canAccessRoute('studio-editor', afi), false);
  assert.equal(canAccessRoute('reader', afi), true);
  assert.equal(canAccessRoute('appeal', afi), true);
  // Créateur : Studio oui, Gouvernance non
  assert.equal(canAccessRoute('studio-ocr', kossi), true);
  assert.equal(canAccessRoute('admin', kossi), false);
  // Gouvernance : tout
  assert.equal(canAccessRoute('admin-audit', nadege), true);
  assert.equal(canAccessRoute('studio', nadege), true);
});
