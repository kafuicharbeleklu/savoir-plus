/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Award,
  BarChart2,
  BookOpen,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Compass,
  Edit3,
  FileText,
  FileUp,
  Flag,
  HelpCircle,
  Home,
  Image as ImageIcon,
  Layers,
  Lock,
  MessageCircle,
  MessageSquare,
  Plus,
  Send,
  Settings,
  ShieldCheck,
  Sliders,
  User,
  UserCheck,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import {
  cloudConfigured,
  loginCloud,
  logoutCloud,
  observe,
  observeAuth,
  observeMessages,
  profiles,
  decideContact,
  cancelContact,
  requestContact,
  resetDemo,
  saveName,
  saveProgress,
  sendMessage,
  toggleBlock,
  type Message,
  type Profile,
  type Progress,
  type Relation
} from './data';
import {
  canSend,
  emptyProgress,
  isQuizPassed,
  moduleProgressPercent,
  moduleXp,
  pairId
} from './domain.mjs';
import { MODULES_CONTENT, resolveStudyContent } from './content';
import {
  applyPostRepost,
  appendCommunityReply,
  canAccessRoute,
  computeGlobalLevel,
  resolveDemoPersona,
  isFocusedStudyRoute,
  computeCatalogCardSteps,
  filterHomeFeed,
  isGovernanceRoute,
  isStudioRoute,
  resolveActiveLab,
  resolveActiveSpace,
  resolveAlgorithmicDiscoverProfiles,
  resolveCapabilities,
  resolveCommunityDirectory,
  resolveFollowedAndConnectedProfiles,
  resolveProfileVerified,
  resolveSplashDurations,
  shouldBypassSplash,
  togglePostHelpful,
  type HomeFeedTab
} from './personas';
import {
  ADMIN_ROLES,
  buildDynamicCatalog,
  initialExtendedState,
  notificationsFor,
  readExtended,
  writeExtended,
  type AdminRoleName,
  type AppPage,
  type CommunityPost,
  type ExtendedDemoState
} from './wireframeData';

import { TopBar } from './components/TopBar';
import { MobileNav } from './components/MobileNav';
import { Avatar, DifficultyMeter, ProfileIdentityCard, ProgressBar, VerifiedBadge } from './components/ProfileIdentityCard';
import { CatalogContentCard, ContentTypeMark, XpBadgeInline } from './components/CatalogVisuals';
import { MessagingDrawer } from './components/MessagingDrawer';
import { SplashScreen } from './components/SplashScreen';
import { FeedPostCard } from './components/FeedPostCard';
import {
  SidebarCompactFooter,
  type FooterInfoTopic
} from './components/SidebarFooters';
import {
  DemoAuthModal,
  PostComposerModal,
  ReportDialog
} from './components/ContextualModals';

const DEMO_PERSONA_KEY = 'savoir-demo-persona';
/** Pages d'étude dont l'identifiant d'URL désigne le module à ouvrir (liens profonds, R:4444). */
const STUDY_DEEP_LINK_PAGES: string[] = ['reader', 'quiz-intro', 'quiz', 'result'];
const DEMO_BANNER_KEY = 'savoir-demo-banner-hidden';

const LESSON_COUNTS: Record<string, number> = Object.fromEntries(
  Object.entries(MODULES_CONTENT).map(([id, mod]) => [id, mod.lessons.length])
);

import { VisitorAuthView } from './pages/VisitorAuthView';
import { AppealPortalView } from './pages/AppealPortalView';
import {
  AcademyQuizIntroView,
  AcademyQuizView,
  AcademyReaderView,
  AcademyResultView
} from './pages/AcademyStudyPages';
import {
  CatalogExtraView,
  ModuleDetailView,
  PathDetailView,
  ProgressionPage,
  ResourceDetailView,
  ResourceReadView
} from './pages/LearningExtraPages';
import { CommunityComposeView, CommunityThreadView } from './pages/CommunityPages';
import {
  AuthFlowsView,
  ModerationView,
  NotificationsView,
  ReportView,
  SettingsView,
  AppealView
} from './pages/AccountAndAdminPages';
import { ProfilePage } from './pages/ProfilePage';
import {
  StudioCreatorProfileView,
  StudioEditorView,
  StudioHomeView,
  StudioMediaView,
  StudioAiView,
  StudioPathView,
  StudioPublishView,
  StudioQuizView,
  StudioStatsView
} from './pages/StudioPages';
import {
  AdminAuditView,
  AdminDashboardView,
  AdminFlaggedContentsView,
  AdminRolesView,
  AdminSettingsView,
  AdminSupportView,
  AdminUsersView,
  AdminValidationView
} from './pages/AdminPages';

type RoutePage = AppPage | 'visitor';

const VALID_PAGES = new Set<string>([
  'visitor',
  'home',
  'catalog',
  'learning',
  'progression',
  'community',
  'community-compose',
  'community-thread',
  'relations',
  'member',
  'messages',
  'profile',
  'notifications',
  'report',
  'settings',
  'reader',
  'quiz-intro',
  'quiz',
  'result',
  'resource-detail',
  'resource-read',
  'module-detail',
  'path-detail',
  'studio',
  'studio-editor',
  'studio-quiz',
  'studio-media',
  'studio-path',
  'studio-publish',
  'studio-ocr',
  'studio-stats',
  'studio-profile',
  'admin',
  'admin-users',
  'admin-roles',
  'admin-contents',
  'admin-validation',
  'admin-audit',
  'admin-support',
  'admin-settings',
  'moderation',
  'appeal',
  'auth-flows'
]);

function parseHash(): { page: RoutePage; id: string } {
  const raw = window.location.hash.replace(/^#\/?/, '').trim();
  if (!raw) return { page: 'home', id: '' };
  const [p, ...rest] = raw.split('/');
  const page = VALID_PAGES.has(p) ? (p as RoutePage) : 'home';
  return { page, id: decodeURIComponent(rest.join('/')) };
}

export default function App() {
  const initialRoute = parseHash();

  const [mode, setMode] = useState<'local' | 'cloud'>('local');
  const [uid, setUid] = useState<string>(() => {
    let stored: string | null = null;
    try {
      stored = window.sessionStorage.getItem(DEMO_PERSONA_KEY);
    } catch {
      // stockage indisponible (navigation privée) : on retombe sur l'URL ou Afi
    }
    return resolveDemoPersona(window.location.search, stored);
  });
  const [demoBannerHidden, setDemoBannerHidden] = useState<boolean>(() => {
    try {
      return window.sessionStorage.getItem(DEMO_BANNER_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [cloudPreviewRole, setCloudPreviewRole] = useState<'learner' | 'creator' | 'admin'>('learner');

  // Première visite (aucun lien précis, aucun personnage choisi dans cet onglet) : page d'accueil visiteur.
  const [page, setPage] = useState<RoutePage>(() => {
    if (window.location.hash || new URLSearchParams(window.location.search).get('as')) return initialRoute.page;
    try {
      if (window.sessionStorage.getItem(DEMO_PERSONA_KEY)) return initialRoute.page;
    } catch {
      return initialRoute.page;
    }
    return 'visitor';
  });
  const [selectedId, setSelectedId] = useState<string>(initialRoute.id);
  const [ext, setExt] = useState<ExtendedDemoState>(() => readExtended());

  const [people, setPeople] = useState<Profile[]>(profiles);
  const [progress, setProgress] = useState<Progress>(emptyProgress());
  const [relations, setRelations] = useState<Relation[]>([]);
  const [selectedRelId, setSelectedRelId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState<string>('');

  const [activeStudyModuleId, setActiveStudyModuleId] = useState<string>(() =>
    STUDY_DEEP_LINK_PAGES.includes(initialRoute.page) && initialRoute.id ? initialRoute.id : 'phishing'
  );
  const [lessonIndex, setLessonIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<number[]>([]);
  // Brouillons de quiz non envoyés, par module (conservés pendant la session).
  const quizDraftsRef = useRef<Record<string, number[]>>({});
  const [studyReturnTarget, setStudyReturnTarget] = useState<{ page: RoutePage; id?: string }>({ page: 'home' });

  const [topQuery, setTopQuery] = useState<string>('');
  const [catalogDomain, setCatalogDomain] = useState<string>('Tous');
  const [homeFeedTab, setHomeFeedTab] = useState<HomeFeedTab>('all');
  const [learningTab, setLearningTab] = useState<'En cours' | 'À commencer' | 'Terminés'>('En cours');
  const [relationsTab, setRelationsTab] = useState<'discover' | 'requests' | 'network'>('discover');
  const [settingsTab, setSettingsTab] = useState<'prefs' | 'privacy' | 'security'>('prefs');

  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [moreOpen, setMoreOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [composerOpen, setComposerOpen] = useState<boolean>(false);
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [infoModal, setInfoModal] = useState<FooterInfoTopic | null>(null);

  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [toast, setToast] = useState<string>('');
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
  );
  const popularTrackRef = useRef<HTMLDivElement>(null);
  const [popularCanScroll, setPopularCanScroll] = useState<{ left: boolean; right: boolean }>({
    left: false,
    right: true
  });

  const [splashPhase, setSplashPhase] = useState<'visible' | 'exiting' | 'done'>(() => {
    if (typeof window === 'undefined') return 'done';
    return shouldBypassSplash(window.location.search) ? 'done' : 'visible';
  });

  // Launch splash lifecycle (Instagram-style overlay -> smooth fade-out -> unmount)
  useEffect(() => {
    if (splashPhase === 'done') return;
    const osReduced =
      typeof window !== 'undefined' &&
      Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    const { holdMs, exitMs } = resolveSplashDurations(Boolean(ext.appPrefs.reducedMotion) || osReduced);
    if (splashPhase === 'visible') {
      const holdTimer = window.setTimeout(() => setSplashPhase('exiting'), holdMs);
      return () => clearTimeout(holdTimer);
    }
    const exitDoneTimer = window.setTimeout(() => setSplashPhase('done'), exitMs);
    return () => clearTimeout(exitDoneTimer);
  }, [splashPhase, ext.appPrefs.reducedMotion]);

  // Sync extended state
  const updateExt = (fn: (prev: ExtendedDemoState) => ExtendedDemoState) => {
    setExt((prev) => {
      const next = fn(prev);
      writeExtended(next);
      return next;
    });
  };

  // Hash navigation listener
  useEffect(() => {
    const onHash = () => {
      const next = parseHash();
      setPage(next.page);
      setSelectedId(next.id);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // System theme watcher
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  // Compute consistent global theme across all routes
  const isDark =
    ext.appPrefs.theme === 'Sombre' || (ext.appPrefs.theme === 'Système' && systemPrefersDark);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    document.documentElement.dataset.reducedMotion = String(!!ext.appPrefs.reducedMotion);
  }, [isDark, ext.appPrefs.reducedMotion]);

  // Toast auto dismiss
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3400);
    return () => clearTimeout(timer);
  }, [toast]);

  // Keep Column 3 (.right-rail) unclipped (no internal scrollbar): scroll naturally until its last element fits, then stick
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const rails = Array.from(document.querySelectorAll<HTMLElement>('.right-rail'));
    if (rails.length === 0) return;

    const updateTop = () => {
      const scrollEl = document.querySelector<HTMLElement>('.app-scroll-viewport');
      const vh = scrollEl ? scrollEl.clientHeight : Math.max(320, window.innerHeight - 64);
      const baseTop = 24;
      const bottomGap = 60;
      rails.forEach((rail) => {
        const h = rail.offsetHeight;
        const topOffset = h + baseTop + bottomGap > vh ? Math.round(vh - h - bottomGap) : baseTop;
        rail.style.setProperty('--right-rail-top', `${topOffset}px`);
      });
    };

    updateTop();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateTop) : null;
    rails.forEach((rail) => ro?.observe(rail));
    window.addEventListener('resize', updateTop);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', updateTop);
    };
  }, [page, uid, catalogDomain, ext.plannedIds.length, ext.posts.length]);

  // Modal Escape for infoModal
  useEffect(() => {
    if (!infoModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInfoModal(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [infoModal]);

  // Cloud auth observer
  useEffect(() => {
    return observeAuth((cloudUid) => {
      if (cloudUid) {
        setMode('cloud');
        setUid(cloudUid);
        setPage((curr) => (curr === 'visitor' ? 'home' : curr));
      } else {
        setMode((currMode) => (currMode === 'cloud' ? 'local' : currMode));
      }
    });
  }, []);

  // Snapshot observer (profiles, progress, relations)
  useEffect(() => {
    if (page === 'visitor') return;
    return observe(
      mode,
      uid,
      (snap) => {
        setPeople(snap.profiles);
        setProgress(snap.progress);
        setRelations(snap.relations);
        setError('');
      },
      (msg) => setError(msg)
    );
  }, [mode, uid, page]);

  // Active conversation message observer
  useEffect(() => {
    if (!selectedRelId || page === 'visitor') {
      setMessages([]);
      return;
    }
    return observeMessages(
      mode,
      selectedRelId,
      (msgs) => setMessages(msgs),
      (msg) => setError(msg)
    );
  }, [mode, selectedRelId, page]);

  const user: Profile = people.find((p) => p.id === uid) || people[0] || profiles[0];
  const caps = resolveCapabilities(uid, mode, ext.adminUsers, cloudPreviewRole);

  // Navigation helper
  const nav = (target: RoutePage, id = '') => {
    const hash = id ? `#${target}/${encodeURIComponent(id)}` : `#${target}`;
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
    if (target === 'settings' && (id === 'prefs' || id === 'privacy' || id === 'security')) {
      setSettingsTab(id);
    }
    setPage(target);
    setSelectedId(id);
    setMoreOpen(false);
    const behavior = ext.appPrefs.reducedMotion ? 'auto' : 'smooth';
    document.querySelector('.app-scroll-viewport')?.scrollTo({ top: 0, behavior });
    document.querySelector('.shell-scroll-viewport')?.scrollTo({ top: 0, behavior });
    window.scrollTo({ top: 0, behavior });
  };

  const openSettingsTab = (tab: 'prefs' | 'privacy' | 'security') => {
    setSettingsTab(tab);
    nav('settings');
  };

  // Multi-module progress helpers
  const getModuleProgress = (modId: string): Progress => {
    if (modId === 'phishing') return progress;
    return ext.moduleProgress?.[uid]?.[modId] || emptyProgress();
  };

  const saveModuleProgress = async (modId: string, next: Progress) => {
    if (modId === 'phishing') {
      await saveProgress(mode, uid, next);
      return;
    }
    updateExt((prev) => ({
      ...prev,
      moduleProgress: {
        ...prev.moduleProgress,
        [uid]: {
          ...(prev.moduleProgress?.[uid] || {}),
          [modId]: next
        }
      }
    }));
  };

  const dynamicCatalog = buildDynamicCatalog(ext);
  const playableModuleIds = Array.from(
    new Set([
      ...Object.keys(MODULES_CONTENT),
      ...dynamicCatalog.filter((c) => c.type === 'module').map((c) => c.id)
    ])
  );

  // Corrigé du quiz d'un module : sert à ne valider le module / donner les 75 XP qu'au-dessus du seuil.
  const answerKey = (modId: string) =>
    resolveStudyContent(modId, ext.studioContents, ext.studioQuiz).questions.map((q) => q.correctIndex);
  const isModuleValidated = (modId: string) => isQuizPassed(getModuleProgress(modId), answerKey(modId));
  const modulePct = (modId: string) =>
    moduleProgressPercent(
      getModuleProgress(modId),
      resolveStudyContent(modId, ext.studioContents, ext.studioQuiz).lessons.length,
      answerKey(modId)
    );

  // Prochain module jouable non validé (ordre du catalogue), proposé en fin de quiz.
  const nextModuleAfter = (currentId: string) => {
    const nextId = playableModuleIds.find((id) => id !== currentId && !isModuleValidated(id));
    if (!nextId) return undefined;
    const item = dynamicCatalog.find((c) => c.id === nextId);
    return { id: nextId, title: item?.title || resolveStudyContent(nextId, ext.studioContents, ext.studioQuiz).title };
  };

  const totalXP = playableModuleIds.reduce((sum, modId) => {
    const study = resolveStudyContent(modId, ext.studioContents, ext.studioQuiz);
    return sum + moduleXp(getModuleProgress(modId), study.lessons.length, answerKey(modId));
  }, 0);

  const syncPopularScroll = () => {
    const el = popularTrackRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    setPopularCanScroll({
      left: el.scrollLeft > 4,
      right: maxScroll - el.scrollLeft > 4
    });
  };

  const scrollPopularTrack = (dir: -1 | 1) => {
    const el = popularTrackRef.current;
    if (!el) return;
    const step = Math.max(260, Math.round(el.clientWidth * 0.82));
    el.scrollBy({
      left: dir * step,
      behavior: ext.appPrefs.reducedMotion ? 'auto' : 'smooth'
    });
  };

  useEffect(() => {
    if (page !== 'home' && page !== 'community') return;
    const raf = window.requestAnimationFrame(syncPopularScroll);
    window.addEventListener('resize', syncPopularScroll);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', syncPopularScroll);
    };
  }, [page, dynamicCatalog.length]);

  const activeStudyContent = resolveStudyContent(activeStudyModuleId, ext.studioContents, ext.studioQuiz);
  const activeStudyProgress = getModuleProgress(activeStudyModuleId);
  const activeModulePct = moduleProgressPercent(activeStudyProgress, activeStudyContent.lessons.length);

  // Lien profond ou navigation arrière vers une page d'étude : ouvrir le module indiqué dans l'URL.
  useEffect(() => {
    if (STUDY_DEEP_LINK_PAGES.includes(page) && selectedId && selectedId !== activeStudyModuleId) {
      setActiveStudyModuleId(selectedId);
    }
  }, [page, selectedId]);

  // Route guard: Studio / Governance pages typed in the URL fall back to home without the matching role.
  const routeAllowed = canAccessRoute(page, caps);
  useEffect(() => {
    if (routeAllowed) return;
    setToast(
      isStudioRoute(page)
        ? 'Espace réservé aux créateurs habilités.'
        : 'Espace réservé à la modération et à la gouvernance.'
    );
    nav('home');
  }, [page, routeAllowed]);

  // Mémorise le personnage de démo pour cet onglet (un rechargement ne ramène plus à Afi).
  // Sur l'accueil visiteur (première visite ou déconnexion), rien n'est mémorisé et l'ancien choix est oublié.
  useEffect(() => {
    try {
      if (page === 'visitor') window.sessionStorage.removeItem(DEMO_PERSONA_KEY);
      else if (mode === 'local') window.sessionStorage.setItem(DEMO_PERSONA_KEY, uid);
    } catch {
      // stockage indisponible : sans conséquence
    }
  }, [uid, mode, page]);

  const hideDemoBanner = () => {
    setDemoBannerHidden(true);
    try {
      window.sessionStorage.setItem(DEMO_BANNER_KEY, '1');
    } catch {
      // stockage indisponible : le bandeau réapparaîtra au rechargement
    }
  };

  // Messages: desktop opens the quick-chat drawer; at ≤768px the drawer is hidden, so open the full page.
  const openConversation = (relId: string) => {
    setSelectedRelId(relId);
    if (window.matchMedia?.('(max-width: 768px)').matches) {
      setDrawerOpen(false);
      nav('messages');
    } else {
      setDrawerOpen(true);
    }
  };

  // Sync quiz draft answers when opening study module
  useEffect(() => {
    if (page === 'quiz') {
      const draft = quizDraftsRef.current[activeStudyModuleId];
      setAnswers(draft ?? (activeStudyProgress.answers || []));
    }
  }, [page, activeStudyModuleId]);

  const openReader = (moduleId = activeStudyModuleId || 'phishing', sectionIdx?: number) => {
    const study = resolveStudyContent(moduleId, ext.studioContents, ext.studioQuiz);
    const modProg = getModuleProgress(moduleId);
    const nextIncomplete = [0, 1, 2].find((i) => i < study.lessons.length && !modProg.lessons.includes(i));
    const idx = sectionIdx !== undefined ? sectionIdx : nextIncomplete !== undefined ? nextIncomplete : 0;

    if (!isFocusedStudyRoute(page)) {
      setStudyReturnTarget({ page, id: selectedId });
    }
    setActiveStudyModuleId(moduleId);
    setLessonIndex(idx);
    setAnswers(modProg.answers || []);
    nav('reader', moduleId);
  };

  const scrollStudyToTop = () => {
    const behavior = ext.appPrefs.reducedMotion ? 'auto' : 'smooth';
    document.querySelector('.shell-scroll-viewport')?.scrollTo({ top: 0, behavior });
    window.scrollTo({ top: 0, behavior });
  };

  const goToLesson = (idx: number) => {
    setLessonIndex(idx);
    scrollStudyToTop();
  };

  // Primary reader action: records the reading once (if not already done), then always moves forward —
  // to the next section, or to the quiz rules after the last one (R:645: navigation ≠ declared reading).
  const handleCompleteLesson = async () => {
    const lessonCount = activeStudyContent.lessons.length;
    const alreadyDone = activeStudyProgress.lessons.includes(lessonIndex);
    if (!alreadyDone) {
      setBusy(true);
      try {
        const nextLessons = [...new Set([...activeStudyProgress.lessons, lessonIndex])].sort((a, b) => a - b);
        await saveModuleProgress(activeStudyModuleId, { ...activeStudyProgress, lessons: nextLessons });
        setToast(`Section « ${activeStudyContent.lessons[lessonIndex]?.title} » terminée · +25 XP`);
      } catch (e: any) {
        setToast(e?.message || 'Erreur lors de la sauvegarde');
        return; // stay on the section so the learner can retry
      } finally {
        setBusy(false);
      }
    }
    if (lessonIndex < lessonCount - 1) {
      goToLesson(lessonIndex + 1);
    } else {
      nav('quiz-intro', activeStudyModuleId);
    }
  };

  const handleSubmitQuiz = async () => {
    setBusy(true);
    try {
      const normalized = activeStudyContent.questions.map((_, idx) =>
        answers[idx] !== undefined ? answers[idx] : -1
      );
      await saveModuleProgress(activeStudyModuleId, {
        ...activeStudyProgress,
        answers: normalized,
        submitted: true
      });
      delete quizDraftsRef.current[activeStudyModuleId];
      nav('result', activeStudyModuleId);
      setToast('Quiz enregistré — consultez votre correction ci-dessous');
    } catch (e: any) {
      setToast(e?.message || 'Erreur lors de l’envoi du quiz');
    } finally {
      setBusy(false);
    }
  };

  // « Nouvelle tentative » ne retire rien : le résultat enregistré (et ses XP) reste acquis jusqu'au
  // prochain envoi ; seules les réponses du brouillon repartent à zéro (R:763).
  const handleRetryQuiz = () => {
    quizDraftsRef.current[activeStudyModuleId] = [];
    setAnswers([]);
    nav('quiz-intro', activeStudyModuleId);
  };

  // Social helpers
  const networkDirectory = resolveCommunityDirectory(people, ext);
  const myFollowing = ext.followingIds?.[uid] || [];
  const toggleFollowPerson = (targetId: string) => {
    if (targetId === uid) return;
    const already = myFollowing.includes(targetId);
    const targetName = networkDirectory.find((p) => p.id === targetId)?.name || 'ce membre';
    updateExt((prev) => ({
      ...prev,
      followingIds: {
        ...prev.followingIds,
        [uid]: already
          ? (prev.followingIds?.[uid] || []).filter((id) => id !== targetId)
          : [...(prev.followingIds?.[uid] || []), targetId]
      }
    }));
    setToast(already ? `Vous ne suivez plus ${targetName}` : `Vous suivez désormais ${targetName}`);
  };

  const handleRequestContact = async (targetProfile: Profile) => {
    if (targetProfile.id === uid) return;
    setBusy(true);
    try {
      await requestContact(mode, uid, targetProfile.id);
      const id = pairId(uid, targetProfile.id);
      const firstMessage = `Bonjour ${targetProfile.name.split(' ')[0]}, j’aimerais échanger avec vous sur SAVOIR+.`;
      updateExt((prev) => ({
        ...prev,
        requestMessages: { ...prev.requestMessages, [id]: firstMessage },
        sentRequests: [
          {
            id,
            recipientName: targetProfile.name,
            firstMessage,
            status: 'En attente'
          },
          ...prev.sentRequests.filter((s) => s.id !== id)
        ]
      }));
      setToast(`Demande de discussion envoyée à ${targetProfile.name}`);
    } catch (e: any) {
      setToast(e?.message || 'Impossible d’envoyer la demande');
    } finally {
      setBusy(false);
    }
  };

  const handleDecideContact = async (r: Relation, decision: 'accepted' | 'declined') => {
    setBusy(true);
    try {
      await decideContact(mode, uid, r, decision);
      if (decision === 'accepted') {
        const firstText = ext.requestMessages?.[r.id];
        if (firstText) {
          await sendMessage(mode, r.requester, { ...r, status: 'accepted' }, firstText, `intro-${r.id}`);
        }
        setSelectedRelId(r.id);
        setToast('Demande acceptée — la discussion est désormais ouverte');
      } else {
        setToast('Demande refusée');
      }
    } catch (e: any) {
      setToast(e?.message || 'Action impossible');
    } finally {
      setBusy(false);
    }
  };

  const handleCancelContact = async (r: Relation) => {
    setBusy(true);
    try {
      await cancelContact(mode, uid, r);
      updateExt((prev) => ({
        ...prev,
        sentRequests: prev.sentRequests.map((s) => (s.id === r.id ? { ...s, status: 'Annulée' } : s))
      }));
      setToast('Demande de discussion annulée');
    } catch (e: any) {
      setToast(e?.message || 'Annulation impossible');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleBlock = async (r: Relation) => {
    setBusy(true);
    try {
      const wasBlocked = r.blockedBy.includes(uid);
      await toggleBlock(mode, uid, r);
      setToast(
        wasBlocked
          ? 'Blocage levé. Une nouvelle demande reste nécessaire pour discuter.'
          : 'Membre bloqué : les nouveaux messages sont désormais impossibles.'
      );
    } catch (e: any) {
      setToast(e?.message || 'Action impossible');
    } finally {
      setBusy(false);
    }
  };

  const handleSendMessage = async () => {
    const activeRel = relations.find((r) => r.id === selectedRelId);
    if (!activeRel || !draft.trim()) return;
    if (caps.isRestricted) {
      setToast('Envoi temporairement restreint sur votre compte.');
      return;
    }
    setBusy(true);
    try {
      await sendMessage(mode, uid, activeRel, draft.trim(), `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
      setDraft('');
    } catch (e: any) {
      setToast(e?.message || 'Échec de l’envoi du message');
    } finally {
      setBusy(false);
    }
  };

  // LinkedIn-style inline feed & community interaction handlers
  const handleTogglePostHelpful = (postId: string) => {
    updateExt((prev) => ({
      ...prev,
      posts: togglePostHelpful(prev.posts, postId, uid)
    }));
  };

  const handleAddPostReply = (
    postId: string,
    text: string,
    parentReplyId?: string,
    replyToName?: string
  ) => {
    const headline = ext.profileDetails[uid]?.tagline || caps.roleLabel || user.role;
    updateExt((prev) => ({
      ...prev,
      posts: appendCommunityReply(prev.posts, postId, {
        authorId: uid,
        authorName: user.name,
        authorRole: headline,
        text,
        parentReplyId,
        replyToName
      })
    }));
    setToast(parentReplyId ? 'Réponse ajoutée au fil' : 'Commentaire publié');
  };

  const handleToggleReplyHelpful = (postId: string, replyId: string, replyAuthorId: string) => {
    if (replyAuthorId === uid) return;
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
                      helpfulBy: r.helpfulBy.includes(uid)
                        ? r.helpfulBy.filter((id) => id !== uid)
                        : [...r.helpfulBy, uid]
                    }
              )
            }
      )
    }));
  };

  const handleSelectQuestionSolution = (postId: string, replyId: string) => {
    updateExt((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => {
        if (p.id !== postId || p.authorId !== uid || p.kind !== 'question') return p;
        const clearing = p.solutionReplyId === replyId;
        return { ...p, solutionReplyId: clearing ? undefined : replyId };
      })
    }));
    const target = ext.posts.find((p) => p.id === postId);
    const clearing = target?.solutionReplyId === replyId;
    setToast(clearing ? 'Question rouverte' : 'Solution choisie par l’auteur');
  };

  const handleRepostPost = (postId: string, note?: string) => {
    let created = false;
    updateExt((prev) => {
      const res = applyPostRepost(prev.posts, postId, user, note);
      created = res.created;
      return { ...prev, posts: res.posts };
    });
    setToast(
      created
        ? note
          ? 'Repartage publié avec votre avis'
          : 'Contribution repartagée dans votre fil'
        : 'Vous avez déjà repartagé cette contribution'
    );
  };

  const handleForwardPostToRelation = async (relation: Relation, post: CommunityPost): Promise<boolean> => {
    if (caps.isRestricted) {
      setToast('Transfert impossible : messagerie temporairement restreinte.');
      return false;
    }
    const otherId = relation.members.find((m) => m !== uid) || '';
    const otherName = people.find((p) => p.id === otherId)?.name || 'ce contact';
    const previewBody = `📌 Contribution partagée : « ${post.title} » (${post.domain}) — par ${post.authorName}`;
    try {
      await sendMessage(
        mode,
        uid,
        relation,
        previewBody,
        `fwd-${post.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      );
      setToast(`Contribution transférée à ${otherName}`);
      return true;
    } catch (e: any) {
      setToast(e?.message || 'Impossible de transférer cette contribution');
      return false;
    }
  };

  // Auth / Persona switching / Onboarding
  const handleSwitchPersona = (id: string) => {
    setMode('local');
    setUid(id);
    setSelectedRelId('');
    setAuthModalOpen(false);
    const name = people.find((p) => p.id === id)?.name || id;
    setToast(`Personnage de démo : ${name}`);
    if (page === 'visitor') nav('home');
  };

  const handleCompleteOnboarding = async (displayName: string, interests: string) => {
    const cleanName = displayName.trim() || 'Afi Mensah';
    setMode('local');
    setUid('afi');
    try {
      await saveName('local', 'afi', cleanName);
    } catch {
      // keep fallback
    }
    updateExt((prev) => ({
      ...prev,
      profileDetails: {
        ...prev.profileDetails,
        afi: {
          ...(prev.profileDetails.afi || initialExtendedState().profileDetails.afi),
          interests: interests.trim() || 'Cybersécurité, Réseaux, Entraide'
        }
      }
    }));
    setToast(`Bienvenue sur SAVOIR+, ${cleanName} !`);
    nav('home');
  };

  const handleLoginCloud = async (email: string, password: string) => {
    setBusy(true);
    setError('');
    try {
      await loginCloud(email, password);
      setAuthModalOpen(false);
      setToast('Connexion Supabase réussie');
      nav('home');
    } catch (e: any) {
      setError(e?.message || 'Identifiants invalides');
    } finally {
      setBusy(false);
    }
  };

  const handleLogoutCloud = async () => {
    setBusy(true);
    try {
      await logoutCloud();
      setMode('local');
      setUid('afi');
      setToast('Déconnecté de Supabase');
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la déconnexion');
    } finally {
      setBusy(false);
    }
  };

  const handleResetDemo = () => {
    resetDemo();
    const fresh = initialExtendedState();
    setExt(fresh);
    setActiveStudyModuleId('phishing');
    setLessonIndex(0);
    setAnswers([]);
    setSelectedRelId('');
    setDraft('');
    setToast('Démonstration locale réinitialisée');
  };

  const pendingIncoming = relations.filter((r) => r.recipient === uid && r.status === 'pending' && r.blockedBy.length === 0);
  const pendingOutgoing = relations.filter((r) => r.requester === uid && r.status === 'pending');
  const acceptedRelations = relations.filter((r) => r.status === 'accepted');
  const unreadNotifs = notificationsFor(ext.notifications, uid).filter((n) => !n.read).length;

  const renderActiveScreen = () => {
  // Visitor portal
  if (page === 'visitor') {
    return (
      <>
        <VisitorAuthView
          cloudConfigured={cloudConfigured}
          busy={busy}
          error={error}
          onSelectPersona={(id) => handleSwitchPersona(id)}
          onLoginCloud={handleLoginCloud}
          onCompleteOnboarding={handleCompleteOnboarding}
          setToast={setToast}
        />
        {toast && (
          <div className="toast" role="status" aria-live="polite">
            {toast}
          </div>
        )}
      </>
    );
  }

  // REV-11: Suspended account restricted exclusively to Appeal Portal
  if (caps.isSuspended) {
    return (
      <>
        <AppealPortalView
          user={user}
          caps={caps}
          ext={ext}
          updateExt={updateExt}
          onExitToVisitor={() => nav('visitor')}
          setToast={setToast}
        />
        {toast && (
          <div className="toast" role="status" aria-live="polite">
            {toast}
          </div>
        )}
      </>
    );
  }

  // Focused Study Routes (Auto HTB Dark)
  if (page === 'reader') {
    return (
      <>
        <AcademyReaderView
          moduleContent={activeStudyContent}
          progress={activeStudyProgress}
          lessonIndex={lessonIndex}
          setLessonIndex={goToLesson}
          busy={busy}
          onCompleteLesson={handleCompleteLesson}
          onOpenQuizIntro={() => nav('quiz-intro', activeStudyModuleId)}
          onExit={() => nav(studyReturnTarget.page === 'visitor' ? 'home' : studyReturnTarget.page, studyReturnTarget.id || '')}
        />
        {toast && (
          <div className="toast" role="status" aria-live="polite">
            {toast}
          </div>
        )}
      </>
    );
  }

  if (page === 'quiz-intro') {
    return (
      <>
        <AcademyQuizIntroView
          moduleContent={activeStudyContent}
          progress={activeStudyProgress}
          onStartQuiz={() => nav('quiz', activeStudyModuleId)}
          onBackToReader={() => nav('reader', activeStudyModuleId)}
          onExit={() => nav(studyReturnTarget.page === 'visitor' ? 'home' : studyReturnTarget.page, studyReturnTarget.id || '')}
        />
        {toast && (
          <div className="toast" role="status" aria-live="polite">
            {toast}
          </div>
        )}
      </>
    );
  }

  if (page === 'quiz') {
    return (
      <>
        <AcademyQuizView
          moduleContent={activeStudyContent}
          progress={activeStudyProgress}
          answers={answers}
          setAnswers={setAnswers}
          busy={busy}
          onSubmit={handleSubmitQuiz}
          onExit={() => {
            quizDraftsRef.current[activeStudyModuleId] = answers;
            nav('quiz-intro', activeStudyModuleId);
          }}
        />
        {toast && (
          <div className="toast" role="status" aria-live="polite">
            {toast}
          </div>
        )}
      </>
    );
  }

  if (page === 'result') {
    return (
      <>
        <AcademyResultView
          moduleContent={activeStudyContent}
          progress={activeStudyProgress}
          onRetryQuiz={handleRetryQuiz}
          onReviewLessons={(sectionIdx) => {
            setLessonIndex(sectionIdx);
            nav('reader', activeStudyModuleId);
          }}
          onOpenLearning={() => nav('learning')}
          onExit={() => nav('home')}
          totalXP={totalXP}
          nextModule={nextModuleAfter(activeStudyModuleId)}
          onOpenNextModule={(id) => nav('module-detail', id)}
        />
        {toast && (
          <div className="toast" role="status" aria-live="polite">
            {toast}
          </div>
        )}
      </>
    );
  }

  if (page === 'resource-read') {
    return (
      <div className="study-shell">
        <header className="study-topbar">
          <div className="study-topbar-left">
            <button className="secondary study-exit-btn" onClick={() => nav('resource-detail', selectedId || 'fiche-reseau')}>
              <X size={15} /> Fermer la ressource
            </button>
            <div className="study-breadcrumb">
              <span className="study-type-tag">RESSOURCE AUTONOME</span>
            </div>
          </div>
        </header>
        <div className="shell-scroll-viewport">
          <div className="study-centered-pane">
            <ResourceReadView
              ext={ext}
              nav={nav}
              openReport={(t) => setReportTarget(t)}
              selectedItemId={selectedId}
            />
          </div>
        </div>
        {toast && (
          <div className="toast" role="status" aria-live="polite">
            {toast}
          </div>
        )}
      </div>
    );
  }

  const studioNav = isStudioRoute(page);
  const govNav = isGovernanceRoute(page);
  const activeSpace = resolveActiveSpace(page, caps.canModerate || caps.canAdmin);
  const isFullWidth =
    page === 'messages' ||
    page === 'auth-flows' ||
    page === 'profile' ||
    page === 'settings' ||
    page === 'member' ||
    page === 'progression';

  // Common props passed to subpages
  const extraProps = {
    ext,
    updateExt,
    nav,
    openReader,
    openReport: (t: string) => setReportTarget(t),
    progress,
    userId: uid,
    getModuleProgress,
    selectedItemId: selectedId,
    query: topQuery,
    setQuery: setTopQuery,
    domain: catalogDomain,
    setDomain: setCatalogDomain,
    setToast
  };

  const communityProps = {
    ext,
    updateExt,
    nav,
    user,
    people,
    acceptedRelations,
    selectedId,
    openReport: (t: string) => setReportTarget(t),
    onToggleFollow: toggleFollowPerson,
    onTogglePostHelpful: handleTogglePostHelpful,
    onAddReply: handleAddPostReply,
    onToggleReplyHelpful: handleToggleReplyHelpful,
    onSelectSolution: handleSelectQuestionSolution,
    onRepost: handleRepostPost,
    onForwardToRelation: handleForwardPostToRelation,
    setToast
  };

  const accountAdminProps = {
    ext,
    updateExt,
    nav,
    user,
    caps,
    relations,
    people,
    onUnblock: handleToggleBlock,
    onEnterVisitor: () => nav('visitor'),
    reportTarget: reportTarget || 'Élément général',
    settingsTab,
    setSettingsTab,
    setToast
  };

  const studioProps = {
    ext,
    updateExt,
    nav,
    selectedId,
    setToast,
    user,
    progress
  };

  const adminProps = {
    ext,
    updateExt,
    nav,
    activePage: page,
    user,
    setToast
  };

  // Active lab for TopBar avatar & Home hero
  const activeLab = resolveActiveLab(dynamicCatalog, getModuleProgress, LESSON_COUNTS);
  const acceptedPeerIds = acceptedRelations
    .map((r) => r.members.find((m) => m !== uid))
    .filter((id): id is string => Boolean(id));
  const communityMemberIds = Array.from(new Set([...myFollowing, ...acceptedPeerIds]));

  // Determine active module to resume on Home hero
  const resumeModuleId =
    // Le module phishing (cœur du pitch) est proposé en premier tant qu'il n'est pas validé.
    ['phishing', 'reseaux', 'comptes'].find((id) => {
      const pct = modulePct(id);
      return pct > 0 && pct < 100;
    }) || 'phishing';
  const resumeCatalog = dynamicCatalog.find((c) => c.id === resumeModuleId) || dynamicCatalog[0];
  const resumeProg = getModuleProgress(resumeModuleId);
  const resumePct = modulePct(resumeModuleId);
  const resumeValidated = isModuleValidated(resumeModuleId);
  const resumeNextIdx = [0, 1, 2].find((i) => !resumeProg.lessons.includes(i));

  const renderMainContent = () => {
    if (!routeAllowed) return null; // redirect to home is in flight (route guard effect)
    if (page === 'home' || page === 'community') {
      const lvl = computeGlobalLevel(totalXP);
      const visibleFeedPosts = filterHomeFeed(ext.posts, homeFeedTab, myFollowing);
      const openHelpPosts = ext.posts.filter((p) => p.kind === 'question' && !p.solutionReplyId);
      const discoverMembers = resolveAlgorithmicDiscoverProfiles(
        networkDirectory,
        uid,
        myFollowing,
        ext,
        3
      ).map((entry) => entry.profile);
      return (
        <div className="dashboard-grid">
          <div className="dashboard-main">
            <header className="home-hero">
              <p className="home-hero-date">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <h1>Bonjour {user.name.split(' ')[0]}</h1>
              <p className="home-hero-sub">
                {resumeValidated
                  ? 'Module validé : découvrez la suite de votre parcours.'
                  : resumePct > 0
                    ? 'Reprenez là où vous en étiez.'
                    : 'Commencez par un module court : quelques minutes suffisent.'}
              </p>
            </header>

            {mode === 'local' && !demoBannerHidden && page === 'home' && (() => {
              const phishingPct = modulePct('phishing');
              const startLabel = isModuleValidated('phishing')
                ? 'Revoir le module phishing'
                : phishingPct > 0
                  ? 'Reprendre le module phishing'
                  : 'Démarrer le module phishing (12 min)';
              const otherId = uid === 'kossi' ? 'afi' : 'kossi';
              const otherName = people.find((p) => p.id === otherId)?.name.split(' ')[0] || otherId;
              return (
                <section className="demo-banner" aria-label="Présentation de la démonstration">
                  <div className="demo-banner-text">
                    <span className="eyebrow">DÉMONSTRATION · HACKATHON CREATE WITH AI</span>
                    <p className="demo-banner-pitch">
                      <b>SAVOIR+</b> : apprendre par défis courts, progresser avec des XP et s’entraider entre membres.
                    </p>
                    <small className="tiny muted">
                      Vous explorez en tant que <b>{user.name}</b> ({caps.roleLabel}). Démo locale — non synchronisée :
                      personnages, publications et XP sont fictifs.
                    </small>
                  </div>
                  <div className="demo-banner-actions">
                    <button className="primary" onClick={() => openReader('phishing')}>
                      {startLabel} <ArrowRight size={15} />
                    </button>
                    <div className="demo-persona-switch" role="group" aria-label="Changer de personnage de démo">
                      {(['afi', 'kossi'] as const).map((id) => (
                        <button
                          key={id}
                          type="button"
                          aria-pressed={uid === id}
                          className={uid === id ? 'active' : ''}
                          onClick={() => uid !== id && handleSwitchPersona(id)}
                        >
                          {people.find((p) => p.id === id)?.name.split(' ')[0] || id}
                        </button>
                      ))}
                    </div>
                    <a
                      className="text-link tiny"
                      href={`${window.location.pathname}?as=${otherId}#relations`}
                      target="_blank"
                      rel="noopener"
                    >
                      Ouvrir {otherName} dans une 2ᵉ fenêtre
                    </a>
                  </div>
                  <button className="icon-btn demo-banner-close" aria-label="Masquer la présentation" onClick={hideDemoBanner}>
                    <X size={16} />
                  </button>
                </section>
              );
            })()}

            {/* Pedagogical Resume Card + Popular Carousel (All / Modules) */}
            <>
                <article className="htb-card home-resume">
                  <div className="between">
                    <ContentTypeMark type="module" labelOverride="Reprise · Module" />
                    <DifficultyMeter level={resumeCatalog.level} />
                  </div>
                  <h2>{resumeCatalog.title}</h2>
                  <div className="htb-card-progress">
                    <div className="between tiny tabular-nums">
                      <span>
                        {resumeNextIdx !== undefined
                          ? `Prochaine section : 0${resumeNextIdx + 1} · ${MODULES_CONTENT[resumeModuleId]?.lessons[resumeNextIdx]?.title}`
                          : resumeValidated
                            ? 'Module validé — Révision libre disponible'
                            : resumeProg.submitted
                              ? 'Quiz à retenter pour valider le module'
                              : 'Sections lues — Prêt pour le quiz final'}
                      </span>
                      <b>{resumePct}%</b>
                    </div>
                    <ProgressBar value={resumePct} label="Progression du module en cours" tone="htb" />
                  </div>
                  <div className="htb-meta-line">
                    <XpBadgeInline amount={resumeCatalog.xpReward || 150} />
                    <span aria-hidden="true">·</span>
                    <span>{resumeCatalog.domain}</span>
                    <span aria-hidden="true">·</span>
                    <span>{resumeCatalog.duration}</span>
                  </div>
                  <div className="wf-inline-actions">
                    <button
                      className="primary"
                      onClick={() =>
                        resumeProg.lessons.length >= (MODULES_CONTENT[resumeModuleId]?.lessons.length || 3) && !resumeValidated
                          ? (setActiveStudyModuleId(resumeModuleId), nav('quiz-intro', resumeModuleId))
                          : openReader(resumeModuleId)
                      }
                    >
                      {resumePct === 0 ? 'Commencer le module' : resumePct === 100 ? 'Revoir le module' : 'Continuer'} <ArrowRight size={15} />
                    </button>
                  </div>
                </article>

                <section className="wf-card home-recommended">
                  <div className="between wf-mb-sm">
                    <div>
                      <span className="eyebrow">RECOMMANDÉ POUR VOUS</span>
                      <h2>Modules & Ressources populaires</h2>
                    </div>
                    <button className="text-link" onClick={() => nav('catalog')}>
                      Tout explorer <ArrowRight size={14} />
                    </button>
                  </div>
                  <div className="popular-carousel-wrap">
                    {popularCanScroll.left && (
                      <button
                        type="button"
                        className="carousel-edge-btn prev"
                        onClick={() => scrollPopularTrack(-1)}
                        aria-label="Faire défiler vers la gauche"
                        title="Précédent"
                      >
                        <ChevronLeft size={18} />
                      </button>
                    )}
                    <div
                      ref={popularTrackRef}
                      className="popular-carousel-track"
                      onScroll={syncPopularScroll}
                    >
                      {dynamicCatalog.map((item) => {
                        const stepInfo = computeCatalogCardSteps(item, getModuleProgress, LESSON_COUNTS);
                        const targetPage = item.type === 'resource' ? 'resource-detail' : item.type === 'path' ? 'path-detail' : 'module-detail';
                        return (
                          <CatalogContentCard
                            key={item.id}
                            item={item}
                            pct={stepInfo.pct}
                            doneSteps={stepInfo.doneSteps}
                            totalSteps={stepInfo.totalSteps}
                            compactBanner
                            onOpen={() => nav(targetPage, item.id)}
                          />
                        );
                      })}
                    </div>
                    {popularCanScroll.right && (
                      <button
                        type="button"
                        className="carousel-edge-btn next"
                        onClick={() => scrollPopularTrack(1)}
                        aria-label="Faire défiler vers la droite"
                        title="Suivant"
                      >
                        <ChevronRight size={18} />
                      </button>
                    )}
                  </div>
                </section>
            </>


            <div className="home-section-head">
              <h2>Fil d’entraide</h2>
              <p className="muted">Questions, méthodes et réponses des membres que vous suivez.</p>
            </div>

            {/* Inline LinkedIn-style Composer */}
            <section className="home-composer-inline" aria-label="Créer une contribution">
              <div className="home-composer-trigger-row">
                <Avatar person={user} small />
                <button
                  type="button"
                  className="home-composer-prompt"
                  onClick={() => setComposerOpen(true)}
                >
                  Bonjour {user.name.split(' ')[0]}, partagez une astuce ou posez une question…
                </button>
              </div>
              <div className="home-composer-shortcuts">
                <button
                  type="button"
                  className="home-composer-shortcut-btn"
                  onClick={() => nav('community-compose')}
                >
                  <HelpCircle size={15} /> Poser une question
                </button>
                <button
                  type="button"
                  className="home-composer-shortcut-btn"
                  onClick={() => setComposerOpen(true)}
                >
                  <MessageSquare size={15} /> Partager une méthode
                </button>
                <button
                  type="button"
                  className="home-composer-shortcut-btn"
                  onClick={() => nav('catalog')}
                >
                  <BookOpen size={15} /> Explorer les modules
                </button>
              </div>
            </section>

            {/* Unified Feed Filter Bar */}
            <div className="feed-filter-bar" role="tablist" aria-label="Filtrer le fil d’accueil">
              {(
                [
                  { id: 'all', label: 'Tous' },
                  { id: 'following', label: `Abonnements (${myFollowing.length})` },
                  { id: 'open-questions', label: `Questions ouvertes (${openHelpPosts.length})` }
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={homeFeedTab === tab.id}
                  className={homeFeedTab === tab.id ? 'selected' : ''}
                  onClick={() => setHomeFeedTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Unified Community Stream */}
            {homeFeedTab !== 'modules' && (
              <section className="wf-stack" aria-label="Fil d’entraide et publications">
                {visibleFeedPosts.length === 0 ? (
                  <div className="empty">
                    <p>
                      {homeFeedTab === 'following'
                        ? 'Aucune contribution récente de vos abonnements.'
                        : 'Aucune question ouverte pour le moment.'}
                    </p>
                    <button className="primary" onClick={() => setComposerOpen(true)}>
                      <Plus size={15} /> Lancer une discussion
                    </button>
                  </div>
                ) : (
                  visibleFeedPosts.map((post) => (
                    <FeedPostCard
                      key={post.id}
                      post={post}
                      currentUser={user}
                      people={people}
                      ext={ext}
                      acceptedRelations={acceptedRelations}
                      followingIds={myFollowing}
                      communityMemberIds={communityMemberIds}
                      onToggleFollowPerson={toggleFollowPerson}
                      onTogglePostHelpful={handleTogglePostHelpful}
                      onAddReply={handleAddPostReply}
                      onToggleReplyHelpful={handleToggleReplyHelpful}
                      onSelectSolution={handleSelectQuestionSolution}
                      onRepost={handleRepostPost}
                      onForwardToRelation={handleForwardPostToRelation}
                      onOpenMember={(memberId) => nav('member', memberId)}
                      onOpenModule={(moduleId) => nav('module-detail', moduleId)}
                      onOpenThread={(postId) => nav('community-thread', postId)}
                      onOpenRelations={() => nav('relations')}
                      onReport={(label) => setReportTarget(label)}
                      setToast={setToast}
                    />
                  ))
                )}
              </section>
            )}
          </div>

          {/* Right Rail (Desktop 3rd Column) */}
          <aside className="right-rail" aria-label="Repères et découvertes">
            <section className="rail-card">
              <span className="eyebrow">VOTRE PROGRESSION</span>
              <h3 className="tabular-nums">Niveau {lvl.level} · {totalXP} XP</h3>
              <ProgressBar value={lvl.percent} label="Expérience globale" tone="htb" />
              <div className="rail-stat-list tabular-nums">
                <div className="rail-stat-row">
                  <span>Modules validés</span>
                  <b>{playableModuleIds.filter((id) => isModuleValidated(id)).length} / {playableModuleIds.length}</b>
                </div>
                <div className="rail-stat-row">
                  <span>Contacts acceptés</span>
                  <b>{acceptedRelations.length}</b>
                </div>
                <div className="rail-stat-row">
                  <span>Demandes en attente</span>
                  <b>{pendingIncoming.length}</b>
                </div>
              </div>
              <button className="secondary" onClick={() => nav('progression')}>
                Ma progression détaillée
              </button>
            </section>

            <section className="rail-card">
              <h2 className="discover-feed-title">Ajouter à votre fil d’actualité</h2>
              <div className="discover-feed-list">
                {discoverMembers.length === 0 ? (
                  <p className="tiny muted">Aucune nouvelle suggestion pour le moment.</p>
                ) : (
                  discoverMembers.map((m) => {
                    const headline = ext.profileDetails[m.id]?.tagline || m.role;
                    const isVerifiedMember = resolveProfileVerified(
                      m.id,
                      ext.adminUsers,
                      ext.profileDetails[m.id]?.verified
                    );
                    return (
                      <div key={m.id} className="discover-feed-row">
                        <button
                          type="button"
                          className="li-avatar-btn"
                          aria-label={`Voir le profil de ${m.name}`}
                          onClick={() => nav('member', m.id)}
                        >
                          <Avatar person={m} />
                        </button>
                        <div className="discover-feed-info">
                          <div className="discover-feed-name-row">
                            <button
                              type="button"
                              className="discover-feed-name"
                              onClick={() => nav('member', m.id)}
                            >
                              {m.name}
                            </button>
                            {isVerifiedMember && <VerifiedBadge />}
                          </div>
                          <p className="discover-feed-headline" title={headline}>{headline}</p>
                          <button
                            type="button"
                            className="discover-follow-pill"
                            onClick={() => toggleFollowPerson(m.id)}
                          >
                            + Suivre
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <button type="button" className="text-link discover-see-all" onClick={() => nav('relations')}>
                Voir toutes les suggestions <ArrowRight size={14} />
              </button>
            </section>

          </aside>
        </div>
      );
    }

    if (page === 'learning') {
      const moduleItems = dynamicCatalog.filter((c) => c.type === 'module');
      const enriched = moduleItems.map((item) => {
        const study = resolveStudyContent(item.id, ext.studioContents, ext.studioQuiz);
        const modProg = getModuleProgress(item.id);
        const pct = moduleProgressPercent(modProg, study.lessons.length, answerKey(item.id));
        const isPlanned = ext.plannedIds.includes(item.id);
        const bucket: 'En cours' | 'À commencer' | 'Terminés' =
          isModuleValidated(item.id) && pct === 100
            ? 'Terminés'
            : modProg.lessons.length > 0 || (modProg.answers && modProg.answers.length > 0)
              ? 'En cours'
              : isPlanned
                ? 'À commencer'
                : 'À commencer';
        return { item, modProg, pct, bucket, isPlanned };
      });

      const visible = enriched.filter((entry) => entry.bucket === learningTab);
      const lvl = computeGlobalLevel(totalXP);

      return (
        <div className="dashboard-grid">
          <div className="dashboard-main">
            <div className="md:hidden">
              <ProfileIdentityCard
                user={user}
                ext={ext}
                caps={caps}
                compact
                onOpenProfile={() => nav('profile')}
              />
            </div>

            <h1 className="sr-only">Mes apprentissages</h1>

          <div className="catalog-tabs-underline" role="tablist" aria-label="Filtrer mes apprentissages">
            {(['En cours', 'À commencer', 'Terminés'] as const).map((tab) => {
              const count = enriched.filter((e) => e.bucket === tab).length;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={learningTab === tab}
                  className={learningTab === tab ? 'selected' : ''}
                  onClick={() => setLearningTab(tab)}
                >
                  {tab} ({count})
                </button>
              );
            })}
          </div>

          {visible.length === 0 ? (
            <div className="empty">
              <p>Aucun module dans l’onglet « {learningTab} » pour le moment.</p>
              <button className="primary" onClick={() => nav('catalog')}>
                Explorer la bibliothèque
              </button>
            </div>
          ) : (
            <div className="course-grid">
              {visible.map(({ item, pct, isPlanned }) => {
                const stepInfo = computeCatalogCardSteps(item, getModuleProgress, LESSON_COUNTS);
                return (
                  <CatalogContentCard
                    key={item.id}
                    item={item}
                    pct={stepInfo.pct}
                    doneSteps={stepInfo.doneSteps}
                    totalSteps={stepInfo.totalSteps}
                    compactBanner
                    onOpen={() => nav('module-detail', item.id)}
                    footerActions={
                      <div className="between wf-full-actions">
                        <button type="button" className="primary" onClick={() => openReader(item.id)}>
                          {pct === 0 ? 'Commencer' : pct === 100 ? 'Revoir' : 'Continuer'} <ArrowRight size={14} />
                        </button>
                        {isPlanned && pct === 0 && (
                          <button
                            type="button"
                            className="text-link"
                            onClick={() => {
                              updateExt((prev) => ({
                                ...prev,
                                plannedIds: prev.plannedIds.filter((id) => id !== item.id)
                              }));
                              setToast('Retiré de la liste planifiée');
                            }}
                          >
                            Retirer
                          </button>
                        )}
                      </div>
                    }
                  />
                );
              })}
            </div>
          )}
          </div>

          <aside className="right-rail" aria-label="Repères de progression">
            <section className="rail-card">
              <span className="eyebrow">RYTHME & ACQUIS</span>
              <h3 className="tabular-nums">Niveau {lvl.level} · {lvl.currentXp}/{lvl.targetXp} XP</h3>
              <ProgressBar value={lvl.percent} label="Progression niveau" tone="htb" />
              <div className="rail-stat-list tabular-nums">
                <div className="rail-stat-row">
                  <span>En cours</span>
                  <b>{enriched.filter((e) => e.bucket === 'En cours').length}</b>
                </div>
                <div className="rail-stat-row">
                  <span>À commencer</span>
                  <b>{enriched.filter((e) => e.bucket === 'À commencer').length}</b>
                </div>
                <div className="rail-stat-row">
                  <span>Terminés</span>
                  <b>{enriched.filter((e) => e.bucket === 'Terminés').length}</b>
                </div>
              </div>
              <button className="secondary" onClick={() => nav('progression')}>
                Progression & Badges
              </button>
            </section>

            <section className="rail-card">
              <span className="eyebrow">BIBLIOTHÈQUE</span>
              <p className="tiny muted">Ajoutez de nouveaux modules à votre liste planifiée ou explorez les parcours.</p>
              <button className="primary" onClick={() => nav('catalog')}>
                Ouvrir le catalogue <ArrowRight size={14} />
              </button>
            </section>
          </aside>
        </div>
      );
    }

    if (page === 'relations') {
      const discoverEntries = resolveAlgorithmicDiscoverProfiles(
        networkDirectory,
        uid,
        myFollowing,
        ext,
        12
      );
      const myNetworkEntries = resolveFollowedAndConnectedProfiles(
        networkDirectory,
        uid,
        myFollowing,
        relations,
        ext
      );

      return (
        <div className="dashboard-grid">
          <div className="dashboard-main">
            <h1 className="sr-only">Relations</h1>

            <div className="catalog-tabs-underline" role="tablist" aria-label="Sections du réseau">
              <button
                type="button"
                role="tab"
                aria-selected={relationsTab === 'discover'}
                className={relationsTab === 'discover' ? 'selected' : ''}
                onClick={() => setRelationsTab('discover')}
              >
                Découvrir ({discoverEntries.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={relationsTab === 'requests'}
                className={relationsTab === 'requests' ? 'selected' : ''}
                onClick={() => setRelationsTab('requests')}
              >
                Invitations ({pendingIncoming.length + pendingOutgoing.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={relationsTab === 'network'}
                className={relationsTab === 'network' ? 'selected' : ''}
                onClick={() => setRelationsTab('network')}
              >
                Mes relations ({myNetworkEntries.length})
              </button>
            </div>

            {relationsTab === 'discover' && (
              discoverEntries.length === 0 ? (
                <div className="empty">
                  <Users size={34} />
                  <h3>Aucune nouvelle suggestion pour le moment</h3>
                  <p>Tous les profils suggérés selon vos intérêts figurent déjà dans Mes relations.</p>
                  <button type="button" className="secondary" onClick={() => setRelationsTab('network')}>
                    Voir Mes relations ({myNetworkEntries.length})
                  </button>
                </div>
              ) : (
                <div className="connect-grid">
                  {discoverEntries.map((entry) => {
                    const p = entry.profile;
                    const rel = relations.find((r) => r.id === pairId(uid, p.id));
                    return (
                      <article
                        key={p.id}
                        className="connect-card"
                        onClick={() => nav('member', p.id)}
                      >
                        <div className="connect-card-top">
                          <div className="connect-card-head">
                            <Avatar person={p} />
                            <div>
                              <div className="mini-profile-name-row">
                                <button
                                  type="button"
                                  className="identity-link"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    nav('member', p.id);
                                  }}
                                >
                                  <b>{p.name}</b>
                                </button>
                                {entry.verified && <VerifiedBadge />}
                              </div>
                              <small className="tiny muted">{entry.headline}</small>
                            </div>
                          </div>
                        </div>
                        <p className="tiny muted">{p.bio}</p>
                        <small className="tiny muted">{entry.suggestionReason}</small>
                        <div className="connect-card-footer">
                          <button
                            type="button"
                            className="follow-btn follow-btn-sm is-idle"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFollowPerson(p.id);
                            }}
                            aria-pressed={false}
                          >
                            <UserPlus size={13} /> Suivre
                          </button>
                          {rel?.status === 'accepted' ? (
                            <button
                              type="button"
                              className="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                openConversation(rel.id);
                              }}
                            >
                              <MessageCircle size={14} /> Message
                            </button>
                          ) : rel?.status === 'pending' ? (
                            <span className="status-tag warn">Demande en attente</span>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )
            )}

            {relationsTab === 'requests' && (
              <div className="wf-stack">
                <section className="wf-card">
                  <h2 className="wf-mb-sm">Invitations reçues ({pendingIncoming.length})</h2>
                  {pendingIncoming.length === 0 ? (
                    <p className="tiny muted">Aucune invitation en attente.</p>
                  ) : (
                    <div className="wf-stack-sm">
                      {pendingIncoming.map((r) => {
                        const sender = networkDirectory.find((p) => p.id === r.requester);
                        if (!sender) return null;
                        const firstMsg = ext.requestMessages?.[r.id];
                        return (
                          <div key={r.id} className="relation-row">
                            <div>
                              <button className="identity-link" onClick={() => nav('member', sender.id)}>
                                <b>{sender.name}</b>
                              </button>
                              <small className="tiny muted">{sender.role}</small>
                              {firstMsg && <p className="tiny wf-mt-sm">Premier message : « {firstMsg} »</p>}
                            </div>
                            <div className="wf-inline-actions">
                              <button className="primary" disabled={busy} onClick={() => handleDecideContact(r, 'accepted')}>
                                <Check size={14} /> Accepter
                              </button>
                              <button className="secondary" disabled={busy} onClick={() => handleDecideContact(r, 'declined')}>
                                Refuser
                              </button>
                              <button className="text-link danger" onClick={() => setReportTarget(`Demande de ${sender.name}`)}>
                                <Flag size={13} /> Signaler
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="wf-card">
                  <h2 className="wf-mb-sm">Demandes envoyées ({pendingOutgoing.length})</h2>
                  {pendingOutgoing.length === 0 ? (
                    <p className="tiny muted">Aucune demande envoyée en attente.</p>
                  ) : (
                    <div className="wf-stack-sm">
                      {pendingOutgoing.map((r) => {
                        const target = networkDirectory.find((p) => p.id === r.recipient);
                        if (!target) return null;
                        return (
                          <div key={r.id} className="relation-row">
                            <div>
                              <b>{target.name}</b>
                              <small className="tiny muted">En attente d’acceptation — aucun second message autorisé.</small>
                              {ext.requestMessages?.[r.id] && <p className="tiny">« {ext.requestMessages[r.id]} »</p>}
                            </div>
                            <button className="secondary" disabled={busy} onClick={() => handleCancelContact(r)}>
                              Annuler la demande
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            )}

            {relationsTab === 'network' && (
              <div className="wf-stack-sm">
                {myNetworkEntries.length === 0 ? (
                  <div className="empty">
                    <p>Vous ne suivez encore aucun compte et n’avez aucune relation active.</p>
                    <button className="primary" onClick={() => setRelationsTab('discover')}>
                      Découvrir des membres
                    </button>
                  </div>
                ) : (
                  myNetworkEntries.map((entry) => {
                    const other = entry.profile;
                    const rel = entry.relation
                      ? relations.find((r) => r.id === entry.relation!.id)
                      : undefined;
                    const blocked = Boolean(rel && rel.blockedBy.length > 0);
                    return (
                      <div key={other.id} className="relation-row">
                        <div className="connect-card-head">
                          <Avatar person={other} small />
                          <div>
                            <div className="mini-profile-name-row">
                              <button type="button" className="identity-link" onClick={() => nav('member', other.id)}>
                                <b>{other.name}</b>
                              </button>
                              {entry.verified && <VerifiedBadge />}
                            </div>
                            <small className="tiny muted">
                              {blocked
                                ? 'Échange bloqué'
                                : `${entry.headline} · ${entry.relationStatus === 'accepted' ? 'Suivi & discussion active' : 'Compte suivi'}`}
                            </small>
                          </div>
                        </div>
                        <div className="wf-inline-actions">
                          {entry.isFollowed && (
                            <button
                              type="button"
                              className="follow-btn follow-btn-sm is-following"
                              onClick={() => toggleFollowPerson(other.id)}
                              aria-pressed={true}
                            >
                              <Check size={13} /> Suivi
                            </button>
                          )}
                          {rel?.status === 'accepted' ? (
                            <>
                              <button
                                type="button"
                                className="primary"
                                onClick={() => openConversation(rel.id)}
                              >
                                <MessageCircle size={14} /> Message
                              </button>
                              <button
                                type="button"
                                className="secondary danger"
                                disabled={busy}
                                onClick={() => handleToggleBlock(rel)}
                              >
                                {rel.blockedBy.includes(uid) ? 'Débloquer' : 'Bloquer'}
                              </button>
                            </>
                          ) : rel?.status === 'pending' ? (
                            <span className="status-tag warn">Demande en attente</span>
                          ) : (
                            <button
                              type="button"
                              className="secondary"
                              disabled={busy}
                              onClick={() => handleRequestContact(other)}
                            >
                              <MessageCircle size={14} /> Demander à discuter
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <aside className="right-rail" aria-label="Repères réseau">
            <section className="rail-card">
              <span className="eyebrow">RÉSEAU EN BREF</span>
              <div className="rail-stat-list tabular-nums">
                <div className="rail-stat-row">
                  <span>Comptes suivis</span>
                  <b>{myFollowing.length}</b>
                </div>
                <div className="rail-stat-row">
                  <span>Suggestions algorithme</span>
                  <b>{discoverEntries.length}</b>
                </div>
                <div className="rail-stat-row">
                  <span>Contacts acceptés</span>
                  <b>{acceptedRelations.length}</b>
                </div>
                <div className="rail-stat-row">
                  <span>Invitations reçues</span>
                  <b>{pendingIncoming.length}</b>
                </div>
              </div>
              <button className="primary" onClick={() => nav('messages')}>
                Ouvrir la messagerie
              </button>
              <button className="secondary" onClick={() => openSettingsTab('privacy')}>
                Réglages de contact
              </button>
            </section>
          </aside>
        </div>
      );
    }

    if (page === 'member') {
      const target =
        networkDirectory.find((p) => p.id === selectedId) ||
        networkDirectory.find((p) => p.id !== uid) ||
        user;
      return (
        <ProfilePage
          isOwnProfile={target.id === uid}
          target={target}
          currentUser={user}
          ext={ext}
          people={people}
          relations={relations}
          myFollowing={myFollowing}
          totalXP={totalXP}
          getModuleProgress={getModuleProgress}
          lessonCounts={LESSON_COUNTS}
          onToggleFollow={toggleFollowPerson}
          onOpenChatDrawer={openConversation}
          onRequestContact={handleRequestContact}
          onReportTarget={(label) => setReportTarget(label)}
          onOpenInfoModal={setInfoModal}
          nav={nav}
          openSettingsTab={openSettingsTab}
          setToast={setToast}
          progress={progress}
          updateExt={updateExt}
          openReader={openReader}
        />
      );
    }

    if (page === 'profile') {
      return (
        <ProfilePage
          isOwnProfile={true}
          target={user}
          currentUser={user}
          ext={ext}
          people={people}
          relations={relations}
          myFollowing={myFollowing}
          totalXP={totalXP}
          getModuleProgress={getModuleProgress}
          lessonCounts={LESSON_COUNTS}
          onSaveProfile={async (newName, tagline, location, bio, interests) => {
            if (newName.trim()) {
              await saveName(mode, uid, newName.trim());
            }
            updateExt((prev) => ({
              ...prev,
              profileDetails: {
                ...prev.profileDetails,
                [uid]: {
                  ...(prev.profileDetails[uid] || initialExtendedState().profileDetails.afi),
                  tagline,
                  location,
                  bio,
                  interests
                }
              }
            }));
            setToast('Profil mis à jour');
          }}
          onToggleFollow={toggleFollowPerson}
          onOpenChatDrawer={openConversation}
          onReportTarget={(label) => setReportTarget(label)}
          onOpenComposer={() => setComposerOpen(true)}
          onOpenInfoModal={setInfoModal}
          nav={nav}
          openSettingsTab={openSettingsTab}
          setToast={setToast}
          progress={progress}
          updateExt={updateExt}
          openReader={openReader}
        />
      );
    }

    if (page === 'messages') {
      const activeRel = relations.find((r) => r.id === selectedRelId);
      const other = activeRel ? people.find((p) => p.id === activeRel.members.find((id) => id !== uid)) : null;
      const lvl = computeGlobalLevel(totalXP);

      return (
        <div className="dashboard-grid">
          <div className="dashboard-main">
            <div className="between wf-mb-sm">
              <h1>Conversations</h1>
              <button className="secondary" onClick={() => nav('relations')}>
                <Users size={15} /> Gérer mes relations
              </button>
            </div>

            <section className="chat-panel" aria-label="Messagerie complète">
              <aside className="conversation-list">
                <div className="conversation-title">Discussions ({acceptedRelations.length})</div>
                {acceptedRelations.length === 0 ? (
                  <div className="conversation-empty">
                    Aucune discussion active. Acceptez ou envoyez une demande dans Relations.
                  </div>
                ) : (
                  acceptedRelations.map((r) => {
                    const p = people.find((x) => x.id === r.members.find((id) => id !== uid));
                    if (!p) return null;
                    return (
                      <button
                        key={r.id}
                        className={selectedRelId === r.id ? 'active' : ''}
                        onClick={() => setSelectedRelId(r.id)}
                      >
                        <Avatar person={p} small />
                        <div>
                          <b>{p.name}</b>
                          <small>{r.blockedBy.length ? 'Échange bloqué' : p.role}</small>
                        </div>
                      </button>
                    );
                  })
                )}
              </aside>

              <div className="chat-main">
                {activeRel && other ? (
                  <>
                    <div className="chat-header">
                      <button className="identity-link" onClick={() => nav('member', other.id)}>
                        <Avatar person={other} small />
                        <div>
                          <b>{other.name}</b>
                          <small className="tiny muted">{other.role}</small>
                        </div>
                      </button>
                      <div className="wf-inline-actions">
                        <button
                          className="secondary"
                          onClick={() => setReportTarget(`Conversation avec ${other.name}`)}
                        >
                          <Flag size={14} /> Signaler
                        </button>
                        <button className="secondary danger" disabled={busy} onClick={() => handleToggleBlock(activeRel)}>
                          {activeRel.blockedBy.includes(uid) ? 'Débloquer' : 'Bloquer'}
                        </button>
                      </div>
                    </div>
                    <div className="chat-context">
                      <Lock size={12} /> Échange privé entre participants ayant accepté la relation.
                    </div>
                    <div className="chat-messages">
                      {messages.length === 0 ? (
                        <div className="chat-welcome">
                          <MessageCircle size={28} />
                          <h3>Démarrez la discussion avec {other.name}</h3>
                          <p>Posez votre question ou partagez votre avancement.</p>
                        </div>
                      ) : (
                        messages.map((m) => (
                          <div key={m.id} className={`message ${m.author === uid ? 'mine' : ''}`}>
                            <p>{m.text}</p>
                            <small>
                              {new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              {m.author === uid && <CheckCheck size={12} />}
                            </small>
                          </div>
                        ))
                      )}
                    </div>
                    {canSend(activeRel, uid) ? (
                      <form
                        className="chat-compose"
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendMessage();
                        }}
                      >
                        <input
                          aria-label="Message à envoyer"
                          placeholder="Écrire un message…"
                          maxLength={1000}
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                        />
                        <button type="submit" className="primary" disabled={busy || !draft.trim()}>
                          <Send size={14} /> Envoyer
                        </button>
                      </form>
                    ) : (
                      <div className="chat-blocked">
                        <Lock size={14} /> Envoi impossible : un blocage est actif sur cette relation.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="chat-welcome">
                    <MessageCircle size={32} />
                    <h3>Sélectionnez une discussion</h3>
                    <p>Choisissez un contact à gauche ou ouvrez Relations pour démarrer un échange.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="right-rail" aria-label="Repères de conversation et profil">
            {activeRel && other && (
              <section className="rail-card">
                <span className="eyebrow">INTERLOCUTEUR ACTIF</span>
                <div className="connect-card-head">
                  <Avatar person={other} small />
                  <div>
                    <div className="mini-profile-name-row">
                      <b>{other.name}</b>
                      {resolveProfileVerified(other.id, ext.adminUsers, ext.profileDetails[other.id]?.verified) && (
                        <VerifiedBadge />
                      )}
                    </div>
                    <small className="tiny muted">
                      {ext.profileDetails[other.id]?.tagline || other.role}
                    </small>
                  </div>
                </div>
                <span className={`status-tag ${activeRel.blockedBy.length > 0 ? 'danger' : 'ok'}`}>
                  {activeRel.blockedBy.length > 0 ? 'Échange bloqué' : 'Discussion acceptée'}
                </span>
                <button className="secondary" onClick={() => nav('member', other.id)}>
                  Voir le profil complet
                </button>
              </section>
            )}

            <section className="rail-card">
              <span className="eyebrow">MESSAGERIE & RÉSEAU</span>
              <div className="rail-stat-list tabular-nums">
                <div className="rail-stat-row">
                  <span>Contacts acceptés</span>
                  <b>{acceptedRelations.length}</b>
                </div>
                <div className="rail-stat-row">
                  <span>Invitations en attente</span>
                  <b>{pendingIncoming.length}</b>
                </div>
              </div>
              <button className="secondary" onClick={() => nav('relations')}>
                Gérer mes relations
              </button>
              <button className="text-link" onClick={() => openSettingsTab('privacy')}>
                Paramètres de contact
              </button>
            </section>

            <section className="rail-card">
              <span className="eyebrow">VOTRE PROGRESSION</span>
              <h3 className="tabular-nums">Niveau {lvl.level} · {totalXP} XP</h3>
              <ProgressBar value={lvl.percent} label="Expérience globale" tone="htb" />
              <div className="profile-quick-links">
                <button type="button" className="text-link" onClick={() => nav('profile')}>
                  Mon profil
                </button>
                <button type="button" className="text-link" onClick={() => nav('progression')}>
                  Ma progression
                </button>
              </div>
            </section>
          </aside>
        </div>
      );
    }

    if (page === 'catalog') return <CatalogExtraView {...extraProps} />;
    if (page === 'resource-detail') return <ResourceDetailView {...extraProps} />;
    if (page === 'module-detail') return <ModuleDetailView {...extraProps} />;
    if (page === 'path-detail') return <PathDetailView {...extraProps} />;
    if (page === 'progression') {
      return (
        <ProgressionPage
          {...extraProps}
          currentUser={user}
          relations={relations}
          myFollowing={myFollowing}
        />
      );
    }

    if (page === 'community-compose') return <CommunityComposeView {...communityProps} />;
    if (page === 'community-thread') return <CommunityThreadView {...communityProps} />;

    if (page === 'notifications') return <NotificationsView {...accountAdminProps} />;
    if (page === 'report') return <ReportView {...accountAdminProps} />;
    if (page === 'settings') return <SettingsView {...accountAdminProps} />;
    if (page === 'auth-flows') return <AuthFlowsView {...accountAdminProps} />;
    if (page === 'moderation') return <ModerationView {...accountAdminProps} />;
    if (page === 'appeal') return <AppealView {...accountAdminProps} />;

    if (page === 'studio') return <StudioHomeView {...studioProps} />;
    if (page === 'studio-editor') return <StudioEditorView {...studioProps} />;
    if (page === 'studio-quiz') return <StudioQuizView {...studioProps} />;
    if (page === 'studio-media') return <StudioMediaView {...studioProps} />;
    if (page === 'studio-path') return <StudioPathView {...studioProps} />;
    if (page === 'studio-publish') return <StudioPublishView {...studioProps} />;
    if (page === 'studio-ocr') return <StudioAiView {...studioProps} />;
    if (page === 'studio-stats') return <StudioStatsView {...studioProps} />;
    if (page === 'studio-profile') return <StudioCreatorProfileView {...studioProps} />;

    if (page === 'admin') return <AdminDashboardView {...adminProps} />;
    if (page === 'admin-users') return <AdminUsersView {...adminProps} />;
    if (page === 'admin-roles') return <AdminRolesView {...adminProps} />;
    if (page === 'admin-contents') return <AdminFlaggedContentsView {...adminProps} />;
    if (page === 'admin-validation') return <AdminValidationView {...adminProps} />;
    if (page === 'admin-audit') return <AdminAuditView {...adminProps} />;
    if (page === 'admin-support') return <AdminSupportView {...adminProps} />;
    if (page === 'admin-settings') return <AdminSettingsView {...adminProps} />;

    return null;
  };

  return (
    <div className="app-root">
      <TopBar
        page={page}
        nav={nav}
        user={user}
        caps={caps}
        ext={ext}
        people={people}
        activeLab={activeLab}
        onOpenActiveLab={(id) => openReader(id)}
        pendingCount={pendingIncoming.length}
        unreadNotifs={unreadNotifs}
        topQuery={topQuery}
        setTopQuery={setTopQuery}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onEnterVisitor={() => nav('visitor')}
        onOpenMessaging={() => {
          setDrawerOpen(false);
          nav('messages');
        }}
      />

      <div className="app-scroll-viewport">
        <div className={`app-shell ${isFullWidth ? 'full-width' : ''}`}>
          {!isFullWidth && (
            <aside className="left-rail" aria-label="Navigation contextuelle latérale">
              <ProfileIdentityCard
                user={user}
                ext={ext}
                caps={caps}
                onOpenProfile={() => nav('profile')}
              />

              {(activeSpace === 'learner' || activeSpace === 'community') && (
                <nav className="rail-nav-card" aria-label="Espaces d’apprentissage">
                  {activeSpace === 'community' && (
                    <>
                      <span className="left-rail-section-label">Communauté</span>
                      <button
                        className={`rail-nav-btn ${page === 'community-compose' ? 'active' : ''}`}
                        onClick={() => nav('community-compose')}
                      >
                        <span><Plus size={16} /> Publier / Question</span>
                      </button>
                      <div className="vous-divider" />
                    </>
                  )}
                  <span className="left-rail-section-label">Apprentissage</span>
                  <button className={`rail-nav-btn ${page === 'learning' ? 'active' : ''}`} onClick={() => nav('learning')}>
                    <span><BookOpen size={16} /> Mes apprentissages</span>
                  </button>
                  <button className={`rail-nav-btn ${page === 'catalog' ? 'active' : ''}`} onClick={() => nav('catalog')}>
                    <span><Compass size={16} /> Bibliothèque</span>
                  </button>
                  <button className="rail-nav-btn" onClick={() => nav('progression')}>
                    <span><Award size={16} /> Progression & Badges</span>
                  </button>
                  {(caps.canCreate || caps.canModerate || caps.canAdmin) && (
                    <>
                      <div className="vous-divider" />
                      <span className="left-rail-section-label">Espaces habilités</span>
                      {caps.canCreate && (
                        <button className="rail-nav-btn" onClick={() => nav('studio')}>
                          <span><Layers size={16} /> Studio Créateur</span>
                        </button>
                      )}
                      {(caps.canModerate || caps.canAdmin) && (
                        <button className="rail-nav-btn" onClick={() => nav('admin')}>
                          <span><ShieldCheck size={16} /> Gouvernance</span>
                        </button>
                      )}
                    </>
                  )}
                </nav>
              )}

            {activeSpace === 'studio' && (
              <nav className="rail-nav-card" aria-label="Navigation Knowledge Studio">
                <span className="left-rail-section-label">Knowledge Studio</span>
                <button className={`rail-nav-btn ${page === 'studio' ? 'active' : ''}`} onClick={() => nav('studio')}>
                  <span><Layers size={16} /> Mes contenus</span>
                </button>
                <button className={`rail-nav-btn ${page === 'studio-editor' ? 'active' : ''}`} onClick={() => nav('studio-editor')}>
                  <span><Edit3 size={16} /> Éditeur structuré</span>
                </button>
                <button className={`rail-nav-btn ${page === 'studio-quiz' ? 'active' : ''}`} onClick={() => nav('studio-quiz')}>
                  <span><CheckCircle2 size={16} /> Éditeur de quiz</span>
                </button>
                <button className={`rail-nav-btn ${page === 'studio-media' ? 'active' : ''}`} onClick={() => nav('studio-media')}>
                  <span><ImageIcon size={16} /> Médias & droits</span>
                </button>
                <button className={`rail-nav-btn ${page === 'studio-path' ? 'active' : ''}`} onClick={() => nav('studio-path')}>
                  <span><BookOpen size={16} /> Assemblage parcours</span>
                </button>
                <button className={`rail-nav-btn ${page === 'studio-publish' ? 'active' : ''}`} onClick={() => nav('studio-publish')}>
                  <span><FileText size={16} /> Contrôle & publier</span>
                </button>
                <button className={`rail-nav-btn ${page === 'studio-ocr' ? 'active' : ''}`} onClick={() => nav('studio-ocr')}>
                  <span><FileUp size={16} /> Studio IA</span>
                </button>
                <button className={`rail-nav-btn ${page === 'studio-stats' ? 'active' : ''}`} onClick={() => nav('studio-stats')}>
                  <span><BarChart2 size={16} /> Statistiques</span>
                </button>
                <button className={`rail-nav-btn ${page === 'studio-profile' ? 'active' : ''}`} onClick={() => nav('studio-profile')}>
                  <span><User size={16} /> Profil créateur</span>
                </button>
                <div className="vous-divider" />
                <button className="rail-nav-btn" onClick={() => nav('home')}>
                  <span><Home size={16} /> Retour à l’accueil</span>
                </button>
              </nav>
            )}

            {activeSpace === 'admin' && (
              <nav className="rail-nav-card" aria-label="Console Gouvernance">
                <span className="left-rail-section-label">Console Gouvernance</span>
                <div className="rail-role-select-wrap">
                  <label className="tiny muted">Rôle actif</label>
                  <select
                    aria-label="Rôle actif en gouvernance"
                    value={ext.adminActiveRole}
                    onChange={(e) => {
                      const nextRole = e.target.value as AdminRoleName;
                      updateExt((prev) => ({ ...prev, adminActiveRole: nextRole }));
                      setToast(`Vue gouvernance basculée : ${nextRole}`);
                    }}
                  >
                    {ADMIN_ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <button className={`rail-nav-btn ${page === 'admin' ? 'active' : ''}`} onClick={() => nav('admin')}>
                  <span><ShieldCheck size={16} /> Tableau de bord</span>
                </button>
                <button className={`rail-nav-btn ${page === 'moderation' ? 'active' : ''}`} onClick={() => nav('moderation')}>
                  <span><Flag size={16} /> File de modération</span>
                </button>
                <button className={`rail-nav-btn ${page === 'admin-users' ? 'active' : ''}`} onClick={() => nav('admin-users')}>
                  <span><Users size={16} /> Utilisateurs</span>
                </button>
                <button className={`rail-nav-btn ${page === 'admin-roles' ? 'active' : ''}`} onClick={() => nav('admin-roles')}>
                  <span><UserCheck size={16} /> Rôles & droits</span>
                </button>
                <button className={`rail-nav-btn ${page === 'admin-contents' ? 'active' : ''}`} onClick={() => nav('admin-contents')}>
                  <span><BookOpen size={16} /> Contenus signalés</span>
                </button>
                <button className={`rail-nav-btn ${page === 'admin-validation' ? 'active' : ''}`} onClick={() => nav('admin-validation')}>
                  <span><CheckCircle2 size={16} /> Validation péda</span>
                </button>
                <button className={`rail-nav-btn ${page === 'admin-audit' ? 'active' : ''}`} onClick={() => nav('admin-audit')}>
                  <span><ClipboardList size={16} /> Journaux d’audit</span>
                </button>
                <button className={`rail-nav-btn ${page === 'admin-support' ? 'active' : ''}`} onClick={() => nav('admin-support')}>
                  <span><HelpCircle size={16} /> Support</span>
                </button>
                <button className={`rail-nav-btn ${page === 'admin-settings' ? 'active' : ''}`} onClick={() => nav('admin-settings')}>
                  <span><Sliders size={16} /> Paramètres</span>
                </button>
                <button className={`rail-nav-btn ${page === 'appeal' ? 'active' : ''}`} onClick={() => nav('appeal')}>
                  <span><Settings size={16} /> Recours</span>
                </button>
                <div className="vous-divider" />
                <button className="rail-nav-btn" onClick={() => nav('home')}>
                  <span><Home size={16} /> Retour à l’accueil</span>
                </button>
              </nav>
            )}

            <SidebarCompactFooter
              nav={nav}
              canCreate={caps.canCreate}
              onOpenInfoModal={setInfoModal}
            />
          </aside>
          )}

          <main className="main-content">
            <div key={`${page}:${selectedId}`} className="page-transition">
              {renderMainContent()}
            </div>
          </main>
        </div>
      </div>

      {page !== 'messages' && (
        <MessagingDrawer
          open={drawerOpen}
          setOpen={setDrawerOpen}
          user={user}
          people={people}
          relations={relations}
          selected={selectedRelId}
          setSelected={setSelectedRelId}
          messages={messages}
          draft={draft}
          setDraft={setDraft}
          busy={busy}
          error={error}
          onSend={handleSendMessage}
          onToggleBlock={handleToggleBlock}
          onOpenFullMessaging={() => {
            setDrawerOpen(false);
            nav('messages');
          }}
          onOpenRelations={() => {
            setDrawerOpen(false);
            nav('relations');
          }}
          onOpenProfile={(p) => {
            setDrawerOpen(false);
            nav('member', p.id);
          }}
          onOpenReport={(t) => setReportTarget(t)}
        />
      )}

      <MobileNav
        page={page}
        nav={nav}
        moreOpen={moreOpen}
        setMoreOpen={setMoreOpen}
        caps={caps}
        pendingCount={pendingIncoming.length}
        unreadNotifs={unreadNotifs}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onEnterVisitor={() => nav('visitor')}
      />

      <PostComposerModal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        user={user}
        onPublish={(post) => {
          updateExt((prev) => ({ ...prev, posts: [post, ...prev.posts] }));
          setToast('Contribution publiée dans la communauté');
          nav('community-thread', post.id);
        }}
      />

      <ReportDialog
        targetLabel={reportTarget}
        onClose={() => setReportTarget(null)}
        onSubmit={(report) => {
          updateExt((prev) => ({ ...prev, reports: [report, ...prev.reports] }));
          setToast(`Signalement ${report.id} enregistré`);
        }}
      />

      <DemoAuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        uid={uid}
        mode={mode}
        cloudConfigured={cloudConfigured}
        people={people}
        ext={ext}
        busy={busy}
        error={error}
        onSwitchPerson={handleSwitchPersona}
        onLoginCloud={handleLoginCloud}
        onLogoutCloud={handleLogoutCloud}
        onResetDemo={handleResetDemo}
        onEnterVisitor={() => {
          setAuthModalOpen(false);
          nav('visitor');
        }}
      />

      {infoModal && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Informations SAVOIR+"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInfoModal(null);
          }}
        >
          <div className="modal">
            <button type="button" className="icon-btn modal-close" aria-label="Fermer" onClick={() => setInfoModal(null)}>
              <X size={18} />
            </button>
            <span className="eyebrow">
              {infoModal === 'hackathon' ? 'NEXUS · HACKATHON CREATE WITH AI' : 'SAVOIR+ · INFORMATION'}
            </span>
            <h2>
              {infoModal === 'about'
                ? 'À propos de SAVOIR+'
                : infoModal === 'privacy'
                  ? 'Confidentialité & Contrôle des données'
                  : infoModal === 'accessibility'
                    ? 'Accessibilité & Design inclusif'
                    : infoModal === 'hackathon'
                      ? 'SAVOIR+ par Nexus · Hackathon 2026'
                      : 'Aide & Entraide'}
            </h2>
            {infoModal === 'about' && (
              <p className="lead">
                SAVOIR+ réunit l’entraide éditoriale inspirée d’un réseau social et la rigueur pratique d’une académie
                structurée par sections, laboratoires interactifs et vérifications d’acquis. Conçu par l’équipe{' '}
                <b>Nexus</b>.
              </p>
            )}
            {infoModal === 'privacy' && (
              <p className="lead">
                Votre progression, vos résultats de quiz et vos discussions privées ne sont jamais publiés sur votre
                profil public. Vous contrôlez qui peut vous contacter depuis Paramètres &amp; Confidentialité.
              </p>
            )}
            {infoModal === 'accessibility' && (
              <p className="lead">
                SAVOIR+ vise les bonnes pratiques WCAG 2.2 AA : navigation complète au clavier, contrastes vérifiés,
                préférence de réduction des animations respectée et cibles tactiles adaptées sur mobile.
              </p>
            )}
            {infoModal === 'hackathon' && (
              <p className="lead">
                Prototype présenté par l’équipe <b>Nexus</b> dans le cadre du <b>Hackathon CREATE WITH AI</b> et du{' '}
                <b>Forum Femmes &amp; Intelligence Artificielle 2026</b>. Il démontre l’apprentissage guidé, la
                progression vérifiable et l’entraide directe entre membres.
              </p>
            )}
            {infoModal === 'help' && (
              <p className="lead">
                Besoin d’aide sur un module ou un compte ? Posez une question directement dans le fil, commentez une
                réponse ou consultez vos signalements depuis l’espace Alertes.
              </p>
            )}
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setInfoModal(null)}>
                Fermer
              </button>
              {infoModal === 'privacy' && (
                <button
                  type="button"
                  className="primary"
                  onClick={() => {
                    setInfoModal(null);
                    nav('settings');
                  }}
                >
                  Ouvrir mes paramètres
                </button>
              )}
              {(infoModal === 'help' || infoModal === 'hackathon') && (
                <button
                  type="button"
                  className="primary"
                  onClick={() => {
                    setInfoModal(null);
                    nav(infoModal === 'hackathon' ? 'catalog' : 'home');
                  }}
                >
                  {infoModal === 'hackathon' ? 'Explorer le catalogue' : 'Aller à l’accueil'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
  };

  const osReducedMotion =
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  return (
    <>
      {renderActiveScreen()}
      {splashPhase !== 'done' && (
        <SplashScreen
          exiting={splashPhase === 'exiting'}
          reducedMotion={Boolean(ext.appPrefs.reducedMotion) || osReducedMotion}
        />
      )}
    </>
  );
}
