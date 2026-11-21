import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canAccessRoute,
  resolveDemoPersona,
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
  // Deux alertes de départ : comme sur LinkedIn, le suivi d'un signalement ne passe plus par les alertes.
  assert.ok(ext.notifications.length >= 2);
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
  // Le parcours annonce maintenant exactement les trois modules qu'il liste.
  assert.equal(pathSteps.totalSteps, 3);
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
  // La bibliothèque contient des médias en échec, mais aucun n'est joint à ce contenu : rien ne bloque.
  const okReport = evaluateStudioReadiness(content, { media: ext.studioMedia });
  assert.equal(okReport.canPublish, true);
  assert.equal(okReport.blockingCount, 0);

  const brokenMedia = ext.studioMedia.map((m, idx) => (idx === 0 ? { ...m, state: 'Échec' as const } : m));
  const failReport = evaluateStudioReadiness(
    { ...content, title: ' ', mediaIds: [brokenMedia[0].id] },
    { media: brokenMedia }
  );
  assert.equal(failReport.canPublish, false);
  assert.ok(failReport.blockingCount >= 2);
  assert.equal(failReport.checks.find((c) => c.id === 'media')?.blocking, true);
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

test('module en cours : le premier commencé et pas validé ; rien pour un module fini ou jamais ouvert', () => {
  const active = resolveActiveLab(CATALOG_ITEMS, (id) => (id === 'reseaux' ? 33 : 0));
  assert.ok(active);
  assert.equal(active!.item.id, 'reseaux');
  assert.equal(active!.pct, 33);
  // Le phishing passe d'abord quand il est lui aussi en cours.
  assert.equal(resolveActiveLab(CATALOG_ITEMS, (id) => (id === 'reseaux' ? 33 : id === 'phishing' ? 75 : 0))!.item.id, 'phishing');
  // Rien de commencé : pas de module « en cours » (avant : le phishing à 0 %).
  assert.equal(resolveActiveLab(CATALOG_ITEMS, () => 0), null);
  // Un module validé n'est plus « en cours » (avant : réseaux à 100 % dans la barre du haut).
  assert.equal(resolveActiveLab(CATALOG_ITEMS, (id) => (id === 'reseaux' ? 100 : 0)), null);
});

test('resolveDefaultCommentPreview retracts comments unless latest top-level comment is from community', () => {
  const ext = initialExtendedState();
  const post1Top = ext.posts.find((p) => p.id === 'post-1')!.replies.filter((r) => !r.parentReplyId);

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
  // 80 badges : séries (domaines, quiz, sections, entraide, régularité), niveaux, 100 % par module.
  assert.equal(badges.length, 80);
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

test('Personnage de démo : ?as= prioritaire, puis mémoire de l’onglet, sinon Afi', () => {
  assert.equal(resolveDemoPersona('?as=kossi', null), 'kossi');
  assert.equal(resolveDemoPersona('?as=kossi', 'nadege'), 'kossi');
  assert.equal(resolveDemoPersona('', 'nadege'), 'nadege');
  assert.equal(resolveDemoPersona('?as=pirate', 'inconnu'), 'afi');
  assert.equal(resolveDemoPersona('', null), 'afi');
});

test('Studio IA : un contenu porte ses propres points clés, réflexe, quiz et fiche illustrée', () => {
  const studio = [
    {
      id: 'st-ai-1',
      title: 'Sauvegarder ses fichiers',
      domain: 'Numérique',
      duration: '10 min',
      sources: 'Explication de Kossi · structuration assistée par IA',
      sections: [
        { id: 'sec-1', title: 'La règle 3-2-1', body: 'Trois copies, deux supports, une hors de chez soi.', keyPoints: ['3 copies', '2 supports'], tip: 'Testez la restauration.' },
        { id: 'sec-2', title: 'Copier', body: 'Copiez chaque semaine.' },
        { id: 'sec-3', title: 'Vérifier', body: 'Ouvrez un fichier restauré.' }
      ],
      quiz: [{ prompt: 'Combien de copies ?', options: ['1', '2', '3'], correctIndex: 2, explanation: 'Règle 3-2-1.' }],
      steps: [{ caption: 'Choisissez vos dossiers', imageUrl: 'https://exemple.test/1.jpg' }, { caption: '' }],
      aiAssisted: true
    }
  ];
  const shared = { title: 'Quiz partagé', questions: [{ prompt: 'Autre', options: ['a', 'b'], correctIndex: 0, explanation: '' }] };
  const content = resolveStudyContent('st-ai-1', studio, shared);
  assert.deepEqual(content.lessons[0].points, ['3 copies', '2 supports']);
  assert.equal(content.lessons[0].tip, 'Testez la restauration.');
  assert.equal(content.lessons[1].points.length, 2); // valeurs par défaut quand la section n'a pas de points clés
  assert.equal(content.questions.length, 1);
  assert.equal(content.questions[0].text, 'Combien de copies ?');
  assert.equal(content.questions[0].correctIndex, 2);
  assert.equal(content.steps?.length, 1); // les étapes sans légende sont ignorées
  assert.equal(content.aiAssisted, true);
  // Sans quiz propre : le quiz partagé du Studio reste utilisé
  const legacy = resolveStudyContent('st-x', [{ ...studio[0], id: 'st-x', quiz: undefined }], shared);
  assert.equal(legacy.questions[0].text, 'Autre');
});

test('Préparation publication : un contenu Studio IA est contrôlé sur son propre quiz', async () => {
  const { evaluateStudioReadiness } = await import('../src/personas');
  const ext = initialExtendedState();
  const base = { ...ext.studioContents[0], type: 'module' as const, title: 'Sauvegardes', sources: 'Explication de Kossi', audience: 'Membres autorisés' as const,
    sections: [{ id: 's1', title: 'Règle 3-2-1', body: 'Trois copies.' }] };
  const own = evaluateStudioReadiness({ ...base, quiz: [{ prompt: 'Combien ?', options: ['1', '3'], correctIndex: 1, explanation: 'Règle 3-2-1.' }] }, { media: [] });
  assert.equal(own.checks.find((c) => c.id === 'quiz')?.ok, true);
  assert.equal(own.canPublish, true);
  // Un module sans question n'est pas publiable ; une ressource sans quiz l'est.
  const noQuiz = evaluateStudioReadiness(base, { media: [] });
  assert.equal(noQuiz.checks.find((c) => c.id === 'quiz')?.ok, false);
  assert.equal(noQuiz.canPublish, false);
  assert.equal(evaluateStudioReadiness({ ...base, type: 'resource' as const }, { media: [] }).canPublish, true);
  // Un parcours se contrôle sur ses modules.
  const path = { ...base, type: 'path' as const, pathModuleIds: ['phishing'] };
  assert.equal(evaluateStudioReadiness(path, { media: [] }).canPublish, false);
  assert.equal(evaluateStudioReadiness({ ...path, pathModuleIds: ['phishing', 'reseaux'] }, { media: [] }).canPublish, true);
});

test('Studio : les apprenants lisent la version publiée, pas le brouillon en cours', async () => {
  const { buildDynamicCatalog, hasUnpublishedChanges, nextStudioVersion, publishedView, studioSnapshot } = await import('../src/wireframeData');
  const ext = initialExtendedState();
  const live = {
    ...ext.studioContents[0],
    id: 'st-live-9',
    type: 'module' as const,
    title: 'Titre publié',
    version: 'v1',
    pubStatus: 'Publié' as const
  };
  const published = { ...live, published: studioSnapshot(live) };
  assert.equal(hasUnpublishedChanges(published), false);

  const edited = { ...published, title: 'Titre en cours de réécriture' };
  assert.equal(hasUnpublishedChanges(edited), true);
  assert.equal(publishedView(edited).title, 'Titre publié');
  ext.studioContents.unshift(edited);
  assert.equal(buildDynamicCatalog(ext).find((c) => c.id === 'st-live-9')?.title, 'Titre publié');
  assert.equal(resolveStudyContent('st-live-9', ext.studioContents).title, 'Titre publié');
  assert.equal(nextStudioVersion('v2'), 'v3');
});

test('Profil : progression d’un membre calculée à un seul endroit (abonnés, compétences, modules)', async () => {
  const { computeMemberStats } = await import('../src/memberStats');
  const { initialExtendedState } = await import('../src/wireframeData');
  const ext = initialExtendedState();
  const empty = { lessons: [], answers: [], submitted: false };
  const person = (id: string, name: string) => ({ id, name, role: '', initials: '', color: 'mint', bio: '' });

  // Autre membre : seules ses données enregistrées comptent (pas la progression de l’utilisateur courant).
  const kossi = computeMemberStats({
    target: person('kossi', 'Kossi Agbo'),
    isOwnProfile: false,
    ext,
    relations: [],
    myFollowing: [],
    progress: { lessons: [0, 1, 2], answers: [0, 0, 0], submitted: true }
  });
  assert.deepEqual(kossi.passedQuizzes, ['reseaux']);
  assert.equal(kossi.followersCount, 6, 'Afi, Nadège, Maya, Ama, Fatou et Kodjo suivent Kossi');
  assert.ok(kossi.skills.length > 0 && kossi.skills.every((s) => s.validated));
  assert.equal(kossi.totalXp, kossi.moduleMetrics.reduce((acc, m) => acc + m.xpVal, 0));

  // Son propre profil : la progression en cours fait apparaître des compétences « en cours ».
  const afi = computeMemberStats({
    target: person('afi', 'Afi Mensah'),
    isOwnProfile: true,
    ext,
    relations: [],
    myFollowing: ['kossi', 'maya'],
    progress: empty
  });
  assert.equal(afi.followersCount, 5, 'Kossi, Maya, Sam, Ama et Fatou suivent Afi');
  assert.equal(afi.followingCount, 2);
  assert.deepEqual(afi.passedQuizzes, []);
  assert.ok(afi.skills.length > 0 && afi.skills.every((s) => !s.validated));
});

test('Gouvernance : chaque vue ne voit et ne fait que ce que son rôle permet', async () => {
  const { canApproveSettings, canExportAudit, canManageStatus, govAccess, govCounts, govInbox } = await import('../src/governance');
  // Moindre privilège : agir, voir ou aucun accès.
  assert.equal(govAccess('Support', 'admin-support'), 'act');
  assert.equal(govAccess('Support', 'moderation'), 'none');
  assert.equal(govAccess('Modérateur', 'moderation'), 'act');
  assert.equal(govAccess('Modérateur', 'appeal'), 'none');
  assert.equal(govAccess('Auditeur', 'moderation'), 'view');
  assert.equal(govAccess('Auditeur', 'admin-audit'), 'view');
  assert.equal(govAccess('Administrateur', 'admin-settings'), 'act');
  assert.equal(canApproveSettings('Administrateur'), false);
  assert.equal(canApproveSettings('Super administrateur'), true);
  assert.equal(canExportAudit('Auditeur'), true);
  assert.equal(canExportAudit('Modérateur'), false);
  assert.equal(canManageStatus('Support'), false);

  const ext = initialExtendedState();
  const counts = govCounts(ext);
  assert.equal(counts.moderation, ext.dossiers.length);
  assert.equal(counts['admin-roles'], 1);
  // La boîte « À traiter » ne liste que les files visibles avec la vue active.
  assert.deepEqual(govInbox(ext, 'Support').map((r) => r.section), ['admin-support']);
  assert.deepEqual(govInbox(ext, 'Modérateur').map((r) => r.section), ['moderation', 'admin-contents']);
  // Huit files depuis l'ajout de « Identités » (vérifications d'identité simulées).
  assert.equal(govInbox(ext, 'Super administrateur').length, 8);
  assert.equal(counts['admin-identity'], 2, 'deux demandes d’identité en attente dans la démonstration');
  assert.equal(govAccess('Responsable de modération', 'admin-identity'), 'act');
  assert.equal(govAccess('Support', 'admin-identity'), 'none');
  assert.equal(govAccess('Auditeur', 'admin-identity'), 'view');
  // Une décision soumise sort le dossier de la file.
  ext.dossiers[0].status = 'Décision soumise';
  assert.equal(govCounts(ext).moderation, ext.dossiers.length - 1);
});

test('mise en forme : gras, italique et liens sont reconnus, le reste est du texte', async () => {
  const { tokenizeRichText } = await import('../src/richText');
  const tokens = tokenizeRichText('Lisez **bien** la *source* : https://exemple.test/guide. Puis 2 * 3 * 4.');
  assert.deepEqual(
    tokens.filter((t) => t.type !== 'text'),
    [
      { type: 'bold', value: 'bien' },
      { type: 'italic', value: 'source' },
      { type: 'link', value: 'https://exemple.test/guide' }
    ]
  );
  assert.equal(tokens.map((t) => t.value).join(''), 'Lisez bien la source : https://exemple.test/guide. Puis 2 * 3 * 4.');
});

test('publication programmée : seule la contribution arrivée à échéance rejoint le fil', async () => {
  const { promoteDuePosts, initialExtendedState } = await import('../src/wireframeData');
  const base = initialExtendedState();
  const now = new Date(2026, 10, 16, 9, 0).getTime();
  const draft = (id: string, at: number) => ({
    id,
    kind: 'publication' as const,
    title: id,
    domain: 'Numérique' as const,
    authorId: 'afi',
    authorName: 'Afi Mensah',
    body: 'Texte',
    createdAt: '',
    followers: ['afi'],
    replies: [],
    scheduledAtMs: at
  });
  const state = { ...base, scheduledPosts: [draft('due', now - 60_000), draft('later', now + 3_600_000)] };
  const next = promoteDuePosts(state, now);
  assert.equal(next.posts[0].id, 'due');
  assert.equal(next.posts[0].scheduledAtMs, undefined);
  assert.equal(next.posts[0].createdAt, 'Aujourd’hui · 08 h 59');
  assert.deepEqual((next.scheduledPosts || []).map((p) => p.id), ['later']);
  assert.equal(next.posts.length, base.posts.length + 1);
  assert.equal(promoteDuePosts(next, now), next);
});

test('catalogue étendu : chaque module interactif a ses leçons, son quiz et son emblème de parcours', async () => {
  const { CATALOG_ITEMS } = await import('../src/wireframeData');
  const { MODULES_CONTENT } = await import('../src/content');
  const modules = CATALOG_ITEMS.filter((c) => c.type === 'module' && c.interactive);
  assert.equal(modules.length, 7);
  for (const mod of modules) {
    const study = MODULES_CONTENT[mod.id];
    assert.ok(study, `contenu manquant : ${mod.id}`);
    assert.equal(study.lessons.length, 3);
    assert.equal(study.questions.length, 3);
    for (const q of study.questions) assert.ok(q.correctIndex >= 0 && q.correctIndex < q.answers.length);
  }
  for (const path of CATALOG_ITEMS.filter((c) => c.type === 'path')) {
    for (const pm of path.pathModules || []) assert.ok(CATALOG_ITEMS.some((c) => c.id === pm.id), `module de parcours inconnu : ${pm.id}`);
  }
  assert.deepEqual([...new Set(CATALOG_ITEMS.map((c) => c.domain))].sort(), ['Communication', 'Gestion', 'Numérique']);
});

test('fil d’actualité : formats variés, auteurs variés et références valides', async () => {
  const { initialExtendedState, CATALOG_ITEMS } = await import('../src/wireframeData');
  const state = initialExtendedState();
  const posts = state.posts;
  assert.ok(posts.length >= 12);
  assert.equal(new Set(posts.map((p) => p.id)).size, posts.length);
  assert.ok(posts.some((p) => p.media?.kind === 'image'));
  assert.ok(posts.some((p) => p.media?.kind === 'video'));
  assert.ok(posts.some((p) => p.linkedItemId));
  assert.ok(posts.some((p) => !p.media && !p.linkedItemId));
  assert.ok(new Set(posts.map((p) => p.authorId)).size >= 8);
  for (const p of posts) {
    if (p.linkedItemId) assert.ok(CATALOG_ITEMS.some((c) => c.id === p.linkedItemId));
    if (p.solutionReplyId) assert.ok(p.replies.some((r) => r.id === p.solutionReplyId));
  }
  assert.ok(state.adminUsers.some((u) => u.id === 'usr-ama' && u.email === 'ama.dossou@exemple.test'));
  assert.ok(state.profileDetails.ines?.tagline);
});

test('badges : les nouveaux badges s’obtiennent avec de vraies mesures', () => {
  const base = {
    totalXp: 0,
    level: 1,
    completedModules: [],
    passedQuizzes: [],
    perfectQuizzes: [],
    completedLessonsCount: 0,
    postsCount: 0,
    repliesCount: 0,
    solutionsCount: 0,
    helpfulGivenCount: 0,
    followingCount: 0,
    acceptedRelationsCount: 0,
    streakWeeks: 0
  };
  const none = computeSavoirBadges(base);
  assert.equal(none.filter((b) => b.earned).length, 0);
  const some = computeSavoirBadges({
    ...base,
    passedQuizzes: ['email-pro', 'reunion', 'budget', 'sauvegarde'],
    passedDomains: ['Numérique', 'Communication', 'Gestion'],
    mediaPostsCount: 1,
    helpfulReceivedCount: 3,
    followersCount: 3
  });
  for (const id of ['mod-email', 'mod-budget', 'mod-sauvegarde', 'mod-reunion', 'mod-domains', 'mod-path-com', 'com-visual', 'com-appreciated', 'com-followed']) {
    assert.equal(some.find((b) => b.id === id)?.earned, true, id);
  }
});

test('statistiques du créateur : décomptes, taux et étapes calculés sur les progressions', async () => {
  const { computeCreatorStats, computeModuleStat, hasQuestionGap, hasStepLoss, moduleInsights } = await import('../src/studioStats');
  const { CATALOG_ITEMS } = await import('../src/wireframeData');
  const mod = CATALOG_ITEMS.find((c) => c.id === 'phishing')!;
  const done = { lessons: [0, 1, 2], answers: [1, 2, 0], submitted: true };
  const failed = { lessons: [0, 1, 2], answers: [0, 2, 1], submitted: true };
  const started = { lessons: [0], answers: [], submitted: false };
  const untouched = { lessons: [], answers: [], submitted: false };
  const stats = computeCreatorStats({
    modules: [mod],
    progressByUser: { a: { phishing: done }, b: { phishing: failed }, c: { phishing: started }, d: { phishing: untouched }, auteur: { phishing: done } },
    excludeUserId: 'auteur'
  });
  const s = stats.modules[0];
  // L'auteur et le membre qui n'a rien commencé ne comptent pas.
  assert.equal(s.learners, 3);
  assert.equal(s.validated, 1);
  assert.equal(s.inProgress, 2);
  assert.equal(s.submitted, 2);
  assert.equal(s.passRate, 50);
  assert.equal(s.reachRate, 67);
  assert.deepEqual(s.steps.map((f) => f.count), [3, 2, 2, 1]);
  assert.deepEqual(s.steps.map((f) => f.rate), [100, 67, 67, 33]);
  assert.deepEqual(s.questions.map((q) => q.correctRate), [50, 100, 50]);
  assert.deepEqual(s.questions.map((q) => q.correct), [1, 2, 1]);
  assert.equal(stats.totals.learners, 3);
  assert.equal(stats.totals.passRate, 50);
  // Points à retenir : la plus forte perte, puis la question la moins réussie.
  const notes = moduleInsights(s);
  assert.equal(notes.length, 2);
  assert.match(notes[0], /1 apprenant sur 3/);
  assert.match(notes[1], /question 1 est la moins réussie : 50 %/);
  assert.equal(hasStepLoss(s), true);
  assert.equal(hasQuestionGap(s), true);
  // Sans écart, pas de graphique : deux phrases suffisent.
  const smooth = computeModuleStat(mod, [done, done]);
  assert.equal(hasStepLoss(smooth), false);
  assert.equal(hasQuestionGap(smooth), false);
  assert.deepEqual(moduleInsights(smooth), [
    'Les 2 apprenants sont allés au bout du module.',
    'Aucune question ne pose de difficulté : toutes sont réussies.'
  ]);
  assert.match(moduleInsights(computeModuleStat(mod, [done]))[0], /Le seul apprenant est allé au bout/);
  assert.deepEqual(moduleInsights(computeModuleStat(mod, [])), []);
});

test('tri des dates : les libellés français se classent dans l’ordre chronologique', async () => {
  const { dateLabelRank } = await import('../src/governance');
  const now = new Date(2026, 10, 15, 18, 0).getTime();
  const labels = ['Il y a 6 jours', '13 nov. 2026 · 10 h 12', 'Hier · 19 h 02', 'Aujourd’hui · 09 h 05', 'Aujourd’hui · 14 h 10'];
  const ranks = labels.map((label) => dateLabelRank(label, now));
  assert.ok(ranks.every((rank) => typeof rank === 'number'));
  assert.deepEqual([...ranks].sort((a, b) => (a as number) - (b as number)), ranks);
  assert.equal(dateLabelRank('', now), null);
  assert.equal(dateLabelRank('date inconnue', now), null);
});

test('menu d’un contenu du Studio : les actions suivent le statut', async () => {
  const { contentActions, studioCatalogId, catalogDetailRoute } = await import('../src/studioActions');
  const { initialExtendedState, studioSnapshot } = await import('../src/wireframeData');
  const base = initialExtendedState().studioContents[0];
  const draft = { ...base, type: 'module' as const, pubStatus: 'Brouillon' as const, reviewStatus: 'Non soumise' as const, published: undefined };
  assert.deepEqual(contentActions(draft), ['publish', 'duplicate', 'delete']);
  assert.deepEqual(contentActions({ ...draft, reviewStatus: 'En revue' }), ['cancel-review', 'duplicate', 'delete']);
  assert.deepEqual(contentActions({ ...draft, reviewStatus: 'À corriger' }), ['resubmit', 'duplicate', 'delete']);
  const live = { ...draft, pubStatus: 'Publié' as const };
  const published = { ...live, published: studioSnapshot(live) };
  assert.deepEqual(contentActions(published), ['view', 'stats', 'duplicate', 'unpublish', 'delete']);
  // Une ressource publiée n'a pas de statistiques par apprenant.
  assert.deepEqual(contentActions({ ...published, type: 'resource' }), ['view', 'duplicate', 'unpublish', 'delete']);
  // Modifié depuis la publication : on propose d'abord de publier les modifications.
  assert.equal(contentActions({ ...published, title: `${published.title} (révisé)` })[0], 'publish-update');
  assert.equal(studioCatalogId('st-2'), 'reseaux');
  assert.equal(studioCatalogId('st-9'), 'st-9');
  assert.equal(catalogDetailRoute('path'), 'path-detail');
});

import { shouldShowExploreTour, computeCoachLayout } from '../src/tour';

test('Visite guidée « Explorer sans compte » : premier chargement seulement, bulle toujours dans la fenêtre', () => {
  assert.equal(shouldShowExploreTour('', false), true);
  assert.equal(shouldShowExploreTour('', true), false);
  assert.equal(shouldShowExploreTour('?tour=1', true), true);
  assert.equal(shouldShowExploreTour('?tour=0', false), false);
  assert.equal(shouldShowExploreTour('?splash=0', false), true);

  const bubble = { width: 320, height: 150 };
  const viewport = { width: 1280, height: 800 };

  // Assez de place dessous : la bulle se pose sous le lien, pointe centrée sur lui.
  const below = computeCoachLayout({ top: 500, left: 250, width: 140, height: 26 }, bubble, viewport);
  assert.equal(below.placement, 'below');
  assert.equal(below.top, 500 + 26 + 6 + 12);
  assert.equal(below.left, 320 - 160);
  assert.equal(below.arrowX, 160);
  assert.deepEqual(below.spot, { top: 494, left: 244, width: 152, height: 38 });

  // Lien en bas de fenêtre : la bulle passe au-dessus.
  const above = computeCoachLayout({ top: 740, left: 250, width: 140, height: 26 }, bubble, viewport);
  assert.equal(above.placement, 'above');
  assert.equal(above.top, 740 - 6 - 12 - 150);

  // Lien près d'un bord, petit écran : la bulle reste dans la fenêtre et la pointe vise encore le lien.
  const narrow = computeCoachLayout({ top: 300, left: 8, width: 140, height: 26 }, bubble, { width: 390, height: 700 });
  assert.equal(narrow.left, 12);
  assert.equal(narrow.arrowX, 78 - 12);
  assert.ok(narrow.left + bubble.width <= 390 - 12);
});
