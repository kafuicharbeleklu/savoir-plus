/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Clock,
  ArrowRight,
  Award,
  BarChart2,
  BookOpen,
  CalendarDays,
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
  Image as ImageIcon,
  Layers,
  Lock,
  MessageCircle,
  MessageSquare,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sliders,
  Sparkles,
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
  isProfileSpaceRoute,
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
  formatScheduleDate,
  notificationsFor,
  promoteDuePosts,
  readExtended,
  writeExtended,
  type AdminRoleName,
  type AppPage,
  type CommunityPost,
  type ExtendedDemoState
} from './wireframeData';
import {
  HEAVY_CLASS_MINUTES,
  buildRevisionPlan,
  demoCalendarState,
  normalizeCalendarState,
  resolveEvents,
  todayDay,
  type CalendarUserState,
  type LinkedModuleState
} from './calendar';
import {
  CONTACT_REFUSAL_MESSAGE,
  PURCHASE_MESSAGE,
  busyMinutes,
  buyItem,
  canSeePrices,
  childrenOf,
  classesOfStudent,
  classesOfTeacher,
  contactRefusal,
  formatPrice,
  hasAccess,
  learnersOf,
  normalizeSchoolState,
  priceOf,
  slotsFor,
  visibleInSuggestions,
  type SchoolState
} from './school';
import { initialSchoolState } from './seedSchool';

import { TopBar } from './components/TopBar';
import { MobileNav } from './components/MobileNav';
import { Avatar, DifficultyMeter, ProfileIdentityCard, ProgressBar, VerifiedBadge, setAvatarPhotos } from './components/ProfileIdentityCard';
import { CatalogCardBanner, CatalogContentCard, ContentTypeMark, XpBadgeInline } from './components/CatalogVisuals';
import { MessagingDrawer } from './components/MessagingDrawer';
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
} from './components/MessageThread';
import { SplashScreen } from './components/SplashScreen';
import { CalendarCard } from './components/CalendarMonth';
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
import { CalendarPage } from './pages/CalendarPage';
import { GuardianGate } from './pages/school/GuardianGate';
import { FamilyPage } from './pages/school/FamilyPage';
import { TeachingPage } from './pages/school/TeachingPage';
import { InstitutionPage } from './pages/school/InstitutionPage';
import { TimetableList } from './pages/school/shared';
import {
  AuthFlowsView,
  ModerationView,
  NotificationsView,
  ReportView,
  AppealView
} from './pages/AccountAndAdminPages';
import { SettingsView } from './pages/SettingsPage';
import { GovernanceRail } from './pages/governance/shared';
import { AdminIdentityView } from './pages/governance/Identity';
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
  'calendar',
  'family',
  'teaching',
  'institution',
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
  'admin-identity',
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
  const [conversationQuery, setConversationQuery] = useState('');
  /** Fenêtre de discussion flottante (tiroir) et personne ouverte dans la page Messagerie. */
  const [drawerPeerId, setDrawerPeerId] = useState('');
  const [messagesPeerId, setMessagesPeerId] = useState('');
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
  const homeFeedTab: HomeFeedTab = 'all'; // fil d'accueil : toutes les publications (plus de filtres)
  const [learningTab, setLearningTab] = useState<'En cours' | 'À commencer' | 'Terminés'>('En cours');
  const [relationsTab, setRelationsTab] = useState<'discover' | 'requests' | 'network'>('discover');
  const [settingsTab, setSettingsTab] = useState<'prefs' | 'privacy' | 'security'>('prefs');

  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [moreOpen, setMoreOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [composerOpen, setComposerOpen] = useState<boolean>(false);
  const [composerView, setComposerView] = useState<'compose' | 'scheduled'>('compose');
  const [scheduleTick, setScheduleTick] = useState(0);
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
      if (next !== prev && !writeExtended(next)) {
        queueMicrotask(() =>
          setToast('Espace du navigateur plein : ce changement ne sera pas conservé après rechargement.')
        );
      }
      return next;
    });
  };

  // Photos de profil : chaque avatar de l'application les lit dans un registre partagé.
  useLayoutEffect(() => {
    setAvatarPhotos(
      Object.fromEntries(
        Object.entries(ext.profileDetails)
          .filter(([, d]) => Boolean(d?.photoDataUrl))
          .map(([id, d]) => [id, d.photoDataUrl as string])
      )
    );
  }, [ext.profileDetails]);

  // Contributions programmées : elles paraissent à l'heure prévue (ou dès l'ouverture si l'heure est passée).
  useEffect(() => {
    const waiting = ext.scheduledPosts || [];
    if (waiting.length === 0) return;
    const nextDue = Math.min(...waiting.map((p) => p.scheduledAtMs ?? 0));
    const delay = nextDue - Date.now();
    const publishDue = () => updateExt((prev) => promoteDuePosts(prev));
    if (delay <= 0) {
      publishDue();
      return;
    }
    // Un minuteur ne dépasse pas 24 jours : au-delà, on revérifie à l'échéance du minuteur.
    const timer = window.setTimeout(() => {
      publishDue();
      setScheduleTick((t) => t + 1);
    }, Math.min(delay + 250, 2_000_000_000));
    return () => window.clearTimeout(timer);
  }, [ext.scheduledPosts, scheduleTick]);

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

  // Profils et vie scolaire : données de démonstration datées du jour, tant que le visiteur n'a rien modifié.
  const today = todayDay();
  const baseSchool = useMemo(() => initialSchoolState(today), [today]);
  const school = useMemo(() => normalizeSchoolState(ext.school, baseSchool), [ext.school, baseSchool]);
  const saveSchool = (next: SchoolState) => updateExt((prev) => ({ ...prev, school: next }));

  const user: Profile = people.find((p) => p.id === uid) || people[0] || profiles[0];
  // En mode connecté, la base ne porte pas encore ces profils : chaque membre y reste un apprenant adulte.
  const caps = resolveCapabilities(uid, mode, ext.adminUsers, cloudPreviewRole, mode === 'local' ? school : undefined, today);

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
    nav('settings', tab === 'prefs' ? 'account' : tab === 'privacy' ? 'visibility' : 'security');
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

  // Calendrier et plan de révision : calculés sur l'appareil. Tant que rien n'a été modifié,
  // chaque personnage voit son calendrier de démonstration, daté du jour.
  const calendarOf = (target: string) => {
    const state: CalendarUserState = ext.calendar?.[target]
      ? normalizeCalendarState(ext.calendar[target])
      : demoCalendarState(target, today);
    const events = resolveEvents(state);
    const progressFor = (id: string): Progress =>
      target === uid ? getModuleProgress(id) : ext.moduleProgress?.[target]?.[id] || emptyProgress();
    const modules = Object.fromEntries(
      Array.from(new Set(events.flatMap((e) => e.exam?.moduleIds || [])))
        .filter((id) => playableModuleIds.includes(id))
        .map((id) => {
          const modProg = progressFor(id);
          const linkedState: LinkedModuleState = isQuizPassed(modProg, answerKey(id))
            ? 'validated'
            : modProg.submitted
              ? 'failed'
              : modProg.lessons.length > 0
                ? 'started'
                : 'new';
          const title =
            dynamicCatalog.find((c) => c.id === id)?.title || resolveStudyContent(id, ext.studioContents, ext.studioQuiz).title;
          return [id, { title, state: linkedState }] as const;
        })
    );
    // Emploi du temps de l'élève : les jours de six heures de cours ou plus reçoivent moitié moins de séances.
    const slots = mode === 'local' ? slotsFor(school, target) : [];
    const heavyWeekdays = [1, 2, 3, 4, 5, 6].filter((weekday) => busyMinutes(slots, weekday) >= HEAVY_CLASS_MINUTES);
    const plan = buildRevisionPlan({ events, settings: state.settings, log: state.log, today, modules, heavyWeekdays });
    return { state, events, plan, log: state.log, slots };
  };
  const { state: calendarState, events: calendarEvents, plan: revisionPlan, slots: timetableSlots } = calendarOf(uid);
  const saveCalendar = (next: CalendarUserState) =>
    updateExt((prev) => ({ ...prev, calendar: { ...(prev.calendar || {}), [uid]: next } }));

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
  // Même règle pour la page de publication quand le profil ne publie pas (parent ou tuteur, classe « stricte »).
  const routeAllowed = canAccessRoute(page, caps) && !(page === 'community-compose' && !caps.canPublish);
  useEffect(() => {
    if (routeAllowed) return;
    setToast(
      page === 'community-compose'
        ? 'Ce profil consulte les contenus sans publier.'
        : isProfileSpaceRoute(page)
          ? 'Cet espace ne correspond pas à votre profil.'
        : isStudioRoute(page)
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

  // Messages: desktop opens the quick-chat drawer; at ≤768px the drawer is hidden, so open the full page.
  const openConversation = (relId: string) => {
    setSelectedRelId(relId);
    const peerId = relations.find((r) => r.id === relId)?.members.find((id) => id !== uid) || '';
    if (window.matchMedia?.('(max-width: 768px)').matches || page === 'messages') {
      setDrawerOpen(false);
      setMessagesPeerId(peerId);
      nav('messages');
    } else {
      // Ouvre directement la fenêtre de discussion de la personne, comme sur LinkedIn.
      setDrawerPeerId(peerId);
    }
  };

  // Sync quiz draft answers when opening study module
  useEffect(() => {
    if (page === 'quiz') {
      const draft = quizDraftsRef.current[activeStudyModuleId];
      setAnswers(draft ?? (activeStudyProgress.answers || []));
    }
  }, [page, activeStudyModuleId]);

  /** Contenu payant non acquis par le membre (démonstration locale ; les achats sont simulés). */
  const isLocked = (itemId: string) => mode === 'local' && !hasAccess(school, uid, itemId);

  const openReader = (moduleId = activeStudyModuleId || 'phishing', sectionIdx?: number) => {
    if (isLocked(moduleId)) {
      setToast('Contenu payant : sa fiche indique comment l’obtenir.');
      nav('module-detail', moduleId);
      return;
    }
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

  // Le module se lit sur une seule page. L'action principale, en bas, déclare la lecture une fois
  // (toutes les parties sont alors notées lues), puis mène aux consignes du quiz. Faire défiler la
  // page ou passer par le sommaire n'enregistre rien (R:645 : naviguer n'est pas déclarer avoir lu).
  const handleFinishReading = async () => {
    const allParts = activeStudyContent.lessons.map((_, i) => i);
    const unread = allParts.filter((i) => !activeStudyProgress.lessons.includes(i)).length;
    if (unread > 0) {
      setBusy(true);
      try {
        await saveModuleProgress(activeStudyModuleId, { ...activeStudyProgress, lessons: allParts });
        setToast(`Lecture terminée · +${unread * 25} XP`);
      } catch (e: any) {
        setToast(e?.message || 'Erreur lors de la sauvegarde');
        return; // on reste sur la page, pour pouvoir réessayer
      } finally {
        setBusy(false);
      }
    }
    nav('quiz-intro', activeStudyModuleId);
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
  // Suggestions : ni parents, ni comptes en attente de code ; un mineur n'est proposé qu'à ses proches.
  const suggestable =
    mode === 'local' ? networkDirectory.filter((p) => visibleInSuggestions(school, uid, p.id, today)) : networkDirectory;
  const myFollowing = ext.followingIds?.[uid] || [];
  // Messagerie : personnes à qui on a déjà écrit ou qui nous ont écrit (discussion acceptée,
  // ou demande envoyée / reçue avec son premier message) — pas les simples abonnements.
  const conversationContacts = relations
    .filter((r) => r.status !== 'declined' && r.members.includes(uid))
    .flatMap((r) => {
      const peerId = r.members.find((id) => id !== uid) || '';
      const profile = networkDirectory.find((p) => p.id === peerId) || people.find((p) => p.id === peerId);
      if (!profile) return [];
      const preview: string | undefined = ext.requestMessages?.[r.id];
      return [{ profile, headline: ext.profileDetails[peerId]?.tagline || profile.role, preview }];
    });
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
    // Mineurs, comptes en attente de code, parents : la demande n'est possible qu'entre personnes liées.
    const refusal = mode === 'local' ? contactRefusal(school, uid, targetProfile.id, today) : null;
    if (refusal) {
      setToast(CONTACT_REFUSAL_MESSAGE[refusal]);
      return;
    }
    const policy = ext.profileDetails[targetProfile.id]?.contactPolicy || 'Membres autorisés';
    const followsMe = (ext.followingIds?.[targetProfile.id] || []).includes(uid);
    if (policy === 'Personne' || (policy === 'Personnes que je suis' && !followsMe)) {
      setToast(`${targetProfile.name} n’accepte pas de demande de discussion de votre part.`);
      return;
    }
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

  /** Vrai si le profil peut publier, commenter et réagir ; sinon l'explique et renvoie faux. */
  const mayPublish = (): boolean => {
    if (caps.canPublish) return true;
    setToast(
      caps.accountKind === 'guardian'
        ? 'Un parent ou tuteur consulte les contenus sans publier ni réagir.'
        : 'Votre classe ne permet pas de publier ni de réagir.'
    );
    return false;
  };

  // LinkedIn-style inline feed & community interaction handlers
  const handleTogglePostHelpful = (postId: string) => {
    if (!mayPublish()) return;
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
    if (!mayPublish()) return;
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
    if (replyAuthorId === uid || !mayPublish()) return;
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
    if (!mayPublish()) return;
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
  const unreadNotifs = notificationsFor(ext.notifications, uid, ext.notifPrefs).filter((n) => !n.read).length;

  // Fenêtre « Changer de compte » : commune à l'application et à l'écran d'attente du code parental.
  const authModal = (
    <DemoAuthModal
      open={authModalOpen}
      onClose={() => setAuthModalOpen(false)}
      uid={uid}
      mode={mode}
      people={people}
      onSwitchPerson={handleSwitchPersona}
    />
  );

  /** « Se déconnecter » : ferme aussi la session Supabase, puis revient à l'accueil visiteur. */
  const signOut = () => {
    if (mode === 'cloud') void handleLogoutCloud();
    nav('visitor');
  };

  const renderActiveScreen = () => {
  // Visitor portal
  if (page === 'visitor') {
    return (
      <>
        <VisitorAuthView
          cloudConfigured={cloudConfigured}
          busy={busy}
          error={error}
          tourReady={splashPhase === 'done'}
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
          onExitToVisitor={signOut}
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

  // Moins de 12 ans sans parent ou tuteur vérifié rattaché : seul l'écran de saisie du code est accessible.
  if (caps.awaitingGuardianCode) {
    return (
      <>
        <GuardianGate
          user={user}
          school={school}
          today={today}
          onActivated={(next) => {
            saveSchool(next);
            setToast(`Compte ouvert : bienvenue, ${user.name.split(' ')[0]} !`);
            nav('home');
          }}
          onExit={signOut}
          onSwitchAccount={() => setAuthModalOpen(true)}
        />
        {authModal}
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
          summary={dynamicCatalog.find((c) => c.id === activeStudyModuleId)?.summary}
          domain={dynamicCatalog.find((c) => c.id === activeStudyModuleId)?.domain}
          progress={activeStudyProgress}
          lessonIndex={lessonIndex}
          busy={busy}
          onFinishReading={handleFinishReading}
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
              <span className="study-type-tag">Ressource</span>
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
  // Un parent ou tuteur et un établissement n'ont ni apprentissages, ni calendrier, ni progression propres.
  const learnsHere = caps.accountKind === 'learner' || caps.accountKind === 'educator';
  const isFullWidth =
    page === 'messages' ||
    page === 'auth-flows' ||
    page === 'profile' ||
    page === 'settings' ||
    page === 'member';

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
    setToast,
    // Contenu payant : le prix n'est montré qu'à un adulte ; un parent achète depuis son espace famille.
    paywall: (itemId: string) => {
      if (!isLocked(itemId)) return null;
      if (!canSeePrices(school, uid, today)) return { priceLabel: null };
      const priceLabel = formatPrice(priceOf(school, itemId));
      if (caps.accountKind === 'guardian') {
        return { priceLabel, buyLabel: 'Acheter pour un enfant', onBuy: () => nav('family') };
      }
      return {
        priceLabel,
        buyLabel: `Acheter · ${priceLabel} (simulé)`,
        onBuy: () => {
          const result = buyItem(school, uid, uid, itemId, today);
          if (result.ok === false) {
            setToast(PURCHASE_MESSAGE[result.reason]);
            return;
          }
          saveSchool(result.school);
          setToast(`Achat simulé enregistré · reçu ${result.purchase.id}`);
        }
      };
    }
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
    setToast,
    readOnly: !caps.canPublish
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
    onEnterVisitor: signOut,
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
    Array.from(
      new Set(['phishing', 'reseaux', 'comptes', ...dynamicCatalog.filter((c) => c.type === 'module').map((c) => c.id)])
    ).find((id) => {
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
      const discoverMembers = resolveAlgorithmicDiscoverProfiles(suggestable, uid, myFollowing, ext, 3).map(
        (entry) => entry.profile
      );
      return (
        <div className="dashboard-grid">
          <div className="dashboard-main">
            {/* Inline LinkedIn-style Composer — absent pour un profil qui lit sans publier */}
            {caps.canPublish && (
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
              {(ext.scheduledPosts || []).some((p) => p.authorId === user.id) && (
                <button
                  type="button"
                  className="home-composer-scheduled"
                  onClick={() => {
                    setComposerView('scheduled');
                    setComposerOpen(true);
                  }}
                >
                  <Clock size={14} aria-hidden="true" />
                  {(() => {
                    const n = (ext.scheduledPosts || []).filter((p) => p.authorId === user.id).length;
                    return n > 1 ? `${n} publications programmées` : '1 publication programmée';
                  })()}
                </button>
              )}
            </section>
            )}

            {/* Pedagogical Resume Card + Popular Carousel (All / Modules) */}
            <>
                <article
                  className="htb-card home-resume"
                  onClick={() =>
                    resumeProg.lessons.length >= (MODULES_CONTENT[resumeModuleId]?.lessons.length || 3) && !resumeValidated
                      ? (setActiveStudyModuleId(resumeModuleId), nav('quiz-intro', resumeModuleId))
                      : openReader(resumeModuleId)
                  }
                >
                  <div className="home-resume-body">
                    <span className="home-resume-kicker">
                      {resumeValidated ? 'Module validé' : resumePct === 0 ? 'À commencer' : 'Reprendre où vous en étiez'}
                    </span>
                    <h2>{resumeCatalog.title}</h2>
                    <p className="home-resume-next">
                      {resumeValidated
                        ? 'Vous pouvez le relire quand vous voulez.'
                        : resumeNextIdx !== undefined
                          ? resumePct === 0
                            ? resumeCatalog.summary
                            : 'Votre lecture est en cours.'
                          : resumeProg.submitted
                            ? 'Le quiz est à retenter pour valider le module.'
                            : 'Lecture terminée : il vous reste le quiz final.'}
                    </p>
                    <div className="home-resume-progress">
                      <ProgressBar value={resumePct} label="Progression du module en cours" tone="htb" />
                      <b className="tabular-nums">{resumePct} %</b>
                    </div>
                    <div className="home-resume-foot">
                      {/* Le bouton est la commande ; le clic sur le reste de la carte remonte à l'article. */}
                      <button type="button" className="primary">
                        {resumeValidated ? 'Revoir le module' : resumeNextIdx !== undefined ? (resumePct === 0 ? 'Commencer' : 'Reprendre la lecture') : 'Passer au quiz'}
                        <ArrowRight size={16} aria-hidden="true" />
                      </button>
                      <span className="home-resume-meta tabular-nums">
                        {resumeCatalog.duration} · {resumeCatalog.level} · {resumeCatalog.xpReward || 150} XP
                      </span>
                    </div>
                  </div>
                  <div className="home-resume-visual">
                    <CatalogCardBanner item={resumeCatalog} />
                  </div>
                </article>

                <section className="wf-card home-recommended">
                  <div className="between wf-mb-sm">
                    <div>
                      <span className="eyebrow">Recommandé pour vous</span>
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
              <p className="muted">Questions, méthodes et réponses de la communauté.</p>
            </div>

            {/* Unified Community Stream */}
            {(
              <section className="wf-stack" aria-label="Fil d’entraide et publications">
                {visibleFeedPosts.length === 0 ? (
                  <div className="empty">
                    <p>
                      Aucune publication pour le moment.
                    </p>
                    {caps.canPublish && (
                      <button className="primary" onClick={() => setComposerOpen(true)}>
                        <Plus size={15} /> Lancer une discussion
                      </button>
                    )}
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
                      readOnly={!caps.canPublish}
                    />
                  ))
                )}
              </section>
            )}
          </div>

          {/* Right Rail (Desktop 3rd Column) — masquée sur mobile : le fil d'actualité seul */}
          <aside className="right-rail home-rail" aria-label="Repères et découvertes">
            {/* Résumé de l'espace propre au profil : famille, classes, établissement */}
            {caps.canManageFamily && (
              <section className="rail-card" aria-label="Mes enfants">
                <h2 className="discover-feed-title">Mes enfants</h2>
                <div className="rail-stat-list">
                  {childrenOf(school, uid).length === 0 ? (
                    <p className="tiny muted">Aucun enfant rattaché pour le moment.</p>
                  ) : (
                    childrenOf(school, uid).map((childId) => (
                      <div key={childId} className="rail-stat-row">
                        <span>{people.find((p) => p.id === childId)?.name || 'Enfant'}</span>
                        <b>{classesOfStudent(school, childId)[0]?.name || 'Sans classe'}</b>
                      </div>
                    ))
                  )}
                </div>
                <button type="button" className="rail-card-foot" onClick={() => nav('family')}>
                  Ouvrir l’espace famille <ArrowRight size={16} aria-hidden="true" />
                </button>
              </section>
            )}
            {caps.canManageInstitution && (
              <section className="rail-card" aria-label="Mon établissement">
                <h2 className="discover-feed-title">Mon établissement</h2>
                <div className="rail-stat-list tabular-nums">
                  <div className="rail-stat-row">
                    <span>Demandes en attente</span>
                    <b>{school.memberships.filter((m) => m.institutionId === school.accounts[uid]?.institutionId && m.status === 'pending').length}</b>
                  </div>
                  <div className="rail-stat-row">
                    <span>Classes</span>
                    <b>{school.classes.filter((c) => c.institutionId === school.accounts[uid]?.institutionId).length}</b>
                  </div>
                </div>
                <button type="button" className="rail-card-foot" onClick={() => nav('institution')}>
                  Ouvrir mon établissement <ArrowRight size={16} aria-hidden="true" />
                </button>
              </section>
            )}
            {caps.canTeach && (
              <section className="rail-card" aria-label="Mes classes">
                <h2 className="discover-feed-title">Mes classes</h2>
                <div className="rail-stat-list tabular-nums">
                  <div className="rail-stat-row">
                    <span>Classes</span>
                    <b>{classesOfTeacher(school, uid).length}</b>
                  </div>
                  <div className="rail-stat-row">
                    <span>Apprenants suivis</span>
                    <b>{learnersOf(school, uid).length}</b>
                  </div>
                </div>
                <button type="button" className="rail-card-foot" onClick={() => nav('teaching')}>
                  Ouvrir l’espace encadrant <ArrowRight size={16} aria-hidden="true" />
                </button>
              </section>
            )}

            {learnsHere && (
              <CalendarCard
                today={today}
                events={calendarEvents}
                plan={revisionPlan}
                log={calendarState.log}
                onOpen={(day) => nav('calendar', day || '')}
              />
            )}

            {learnsHere && (
            <section className="rail-card">
              <span className="eyebrow">Votre progression</span>
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
              <button type="button" className="rail-card-foot" onClick={() => nav('progression')}>
                Ma progression détaillée <ArrowRight size={16} aria-hidden="true" />
              </button>
            </section>
            )}

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
              <button type="button" className="rail-card-foot" onClick={() => nav('relations')}>
                Voir toutes les suggestions <ArrowRight size={16} aria-hidden="true" />
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
            <header className="page-header">
              <span className="eyebrow">Apprendre</span>
              <h1>Mes apprentissages</h1>
              <p>Vos modules en cours, ceux à commencer et ceux que vous avez validés.</p>
            </header>
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
                        <button type="button" className="secondary ui-btn-sm" onClick={() => openReader(item.id)}>
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
              <span className="eyebrow">Rythme & acquis</span>
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
              <span className="eyebrow">Bibliothèque</span>
              <p className="tiny muted">Ajoutez de nouveaux modules à votre liste planifiée ou explorez les parcours.</p>
              <button className="secondary" onClick={() => nav('catalog')}>
                Ouvrir la bibliothèque <ArrowRight size={14} />
              </button>
            </section>
          </aside>
        </div>
      );
    }

    if (page === 'relations') {
      const discoverEntries = resolveAlgorithmicDiscoverProfiles(suggestable, uid, myFollowing, ext, 12);
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
            <header className="page-header">
              <span className="eyebrow">Réseau</span>
              <h1>Relations</h1>
              <p>Suivez des membres pour voir leurs publications ; pour discuter en privé, envoyez une demande : l’échange s’ouvre seulement quand elle est acceptée.</p>
            </header>
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
                    <button type="button" className="li-text-link" onClick={() => setRelationsTab('discover')}>
                      Découvrir des membres
                    </button>
                  </div>
                ) : (
                  <div className="wf-notif-list relation-list" role="list">
                    {myNetworkEntries.map((entry) => {
                      const other = entry.profile;
                      const rel = entry.relation
                        ? relations.find((r) => r.id === entry.relation!.id)
                        : undefined;
                      const blocked = Boolean(rel && rel.blockedBy.length > 0);
                      return (
                        <div key={other.id} role="listitem" className="wf-notif-row read relation-list-row">
                          <button
                            type="button"
                            className="relation-list-identity"
                            onClick={() => nav('member', other.id)}
                          >
                            <Avatar person={other} />
                            <div className="wf-notif-body">
                              <div className="wf-notif-head">
                                <h3>
                                  {other.name}
                                  {entry.verified && <VerifiedBadge />}
                                </h3>
                              </div>
                              <p className="tiny muted">{entry.headline}</p>
                              <span className="tiny muted wf-notif-actor">
                                {blocked
                                  ? 'Échange bloqué'
                                  : entry.relationStatus === 'accepted'
                                    ? 'Suivi · discussion active'
                                    : rel?.status === 'pending'
                                      ? 'Suivi · demande de discussion en attente'
                                      : 'Compte suivi'}
                              </span>
                            </div>
                          </button>
                          <div className="relation-list-actions">
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
                            {rel?.status === 'accepted' && (
                              <>
                                <button
                                  type="button"
                                  className="secondary"
                                  onClick={() => openConversation(rel.id)}
                                >
                                  Message
                                </button>
                                <ConversationMenu
                                  label={`Plus d’options pour ${other.name}`}
                                  items={[
                                    {
                                      label: rel.blockedBy.includes(uid) ? 'Débloquer' : 'Bloquer',
                                      danger: true,
                                      disabled: busy,
                                      onSelect: () => handleToggleBlock(rel)
                                    }
                                  ]}
                                />
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="right-rail" aria-label="Repères réseau">
            <section className="rail-card">
              <span className="eyebrow">Réseau en bref</span>
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
              <button className="secondary" onClick={() => nav('messages')}>
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
          onOpenComposer={caps.canPublish ? () => setComposerOpen(true) : undefined}
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
      // Colonne de gauche : personnes à qui on a déjà écrit (comme le tiroir).
      const msgContacts = withRelations(conversationContacts, relations, uid);
      const selectedRel = relations.find((r) => r.id === selectedRelId);
      const pagePeerId = messagesPeerId || selectedRel?.members.find((id) => id !== uid) || '';
      const peerContact = msgContacts.find((c) => c.profile.id === pagePeerId);
      const other = peerContact?.profile || null;
      const activeRel = peerContact?.rel;
      const isAccepted = activeRel?.status === 'accepted';
      const lvl = computeGlobalLevel(totalXP);

      return (
        <div className="dashboard-grid">
          <div className="dashboard-main">
            <section className="chat-panel" aria-label="Messagerie">
              <header className="chat-panel-head">
                <h1>Messagerie</h1>
                <label className="li-search">
                  <Search size={16} aria-hidden="true" />
                  <input
                    type="search"
                    placeholder="Rechercher dans les messages"
                    aria-label="Rechercher une discussion"
                    value={conversationQuery}
                    onChange={(e) => setConversationQuery(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="li-icon-btn chat-panel-head-action"
                  title="Gérer mes relations"
                  aria-label="Gérer mes relations"
                  onClick={() => nav('relations')}
                >
                  <Users size={18} aria-hidden="true" />
                </button>
              </header>
              <div className="conversation-list" role="list">
                {msgContacts.length === 0 ? (
                  <div className="conversation-empty">
                    <p>Aucune discussion pour le moment.</p>
                    <button type="button" className="li-text-link" onClick={() => nav('relations')}>
                      Découvrir des membres
                    </button>
                  </div>
                ) : (
                  (() => {
                    const q = normalizeSearch(conversationQuery);
                    const rows = q ? msgContacts.filter((c) => normalizeSearch(c.profile.name).includes(q)) : msgContacts;
                    if (rows.length === 0) {
                      return <p className="conversation-empty">Aucune personne ne correspond à « {conversationQuery} ».</p>;
                    }
                    return rows.map(({ profile: p, headline, preview, rel }) => (
                      <button
                        key={p.id}
                        type="button"
                        role="listitem"
                        className={`conversation-row ${pagePeerId === p.id ? 'active' : ''}`}
                        aria-current={pagePeerId === p.id ? 'true' : undefined}
                        onClick={() => {
                          setMessagesPeerId(p.id);
                          if (rel?.status === 'accepted') setSelectedRelId(rel.id);
                        }}
                      >
                        <Avatar person={p} />
                        <span className="conversation-row-text">
                          <b>{p.name}</b>
                          <small>{contactStatusLabel(rel, uid, headline, preview)}</small>
                        </span>
                      </button>
                    ));
                  })()
                )}
              </div>

              <div className="chat-main">
                {other && peerContact ? (
                  <>
                    <div className="chat-header">
                      <button className="identity-link" onClick={() => nav('member', other.id)}>
                        <div>
                          <b>{other.name}</b>
                          <small>{peerContact.headline}</small>
                        </div>
                      </button>
                      <ConversationMenu
                        items={[
                          { label: 'Voir le profil', onSelect: () => nav('member', other.id) },
                          ...(isAccepted && activeRel
                            ? [
                                { label: 'Signaler cet échange', onSelect: () => setReportTarget(`Conversation avec ${other.name}`) },
                                {
                                  label: activeRel.blockedBy.includes(uid) ? 'Débloquer' : 'Bloquer',
                                  danger: true,
                                  disabled: busy,
                                  onSelect: () => handleToggleBlock(activeRel)
                                }
                              ]
                            : [])
                        ]}
                      />
                    </div>
                    <ThreadScroll className="chat-messages" watch={isAccepted ? messages : activeRel?.status}>
                      <ConversationIntro person={other} onOpenProfile={() => nav('member', other.id)} />
                      {isAccepted && activeRel && selectedRelId === activeRel.id && (
                        <MessageThread messages={messages} people={[user, other, ...people]} />
                      )}
                    </ThreadScroll>
                    {isAccepted && activeRel ? (
                      canSend(activeRel, uid) ? (
                        <MessageComposer draft={draft} setDraft={setDraft} onSend={handleSendMessage} busy={busy} />
                      ) : (
                        <div className="chat-blocked">
                          <Lock size={14} /> Envoi impossible : un blocage est actif sur cette relation.
                        </div>
                      )
                    ) : (
                      <ConversationGate
                        rel={activeRel}
                        userId={uid}
                        other={other}
                        busy={busy}
                        onRequestContact={handleRequestContact}
                        onDecideContact={handleDecideContact}
                      />
                    )}
                  </>
                ) : (
                  <div className="chat-welcome">
                    <MessageCircle size={32} />
                    <h3>Sélectionnez une discussion</h3>
                    <p>Choisissez une personne à gauche pour reprendre l’échange.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="right-rail" aria-label="Repères de conversation et profil">
            {activeRel && other && (
              <section className="rail-card">
                <span className="eyebrow">Interlocuteur actif</span>
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
                <span className={`status-tag ${activeRel.blockedBy.length > 0 ? 'danger' : isAccepted ? 'ok' : 'warn'}`}>
                  {activeRel.blockedBy.length > 0 ? 'Échange bloqué' : isAccepted ? 'Discussion acceptée' : 'Demande en attente'}
                </span>
                <button className="secondary" onClick={() => nav('member', other.id)}>
                  Voir le profil complet
                </button>
              </section>
            )}

            <section className="rail-card">
              <span className="eyebrow">Messagerie & réseau</span>
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
              <span className="eyebrow">Votre progression</span>
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

    if (page === 'calendar') {
      return (
        <CalendarPage
          state={calendarState}
          events={calendarEvents}
          plan={revisionPlan}
          today={today}
          initialTarget={selectedId}
          moduleOptions={dynamicCatalog.filter((c) => c.type === 'module').map((c) => ({ id: c.id, title: c.title }))}
          onChange={saveCalendar}
          onOpenModule={(id) => nav('module-detail', id)}
          setToast={setToast}
          timetable={
            timetableSlots.length > 0 ? (
              <TimetableList slots={timetableSlots} school={school} showClass={caps.accountKind === 'educator'} />
            ) : undefined
          }
        />
      );
    }

    if (page === 'family' || page === 'teaching' || page === 'institution') {
      const schoolProps = {
        school,
        saveSchool,
        ext,
        user,
        // L'annuaire de la communauté : il porte aussi les membres qui n'ont pas de personnage jouable.
        people: networkDirectory,
        today,
        catalog: dynamicCatalog,
        selectedId,
        nav,
        setToast
      };
      if (page === 'family') return <FamilyPage {...schoolProps} calendarOf={calendarOf} />;
      if (page === 'teaching') return <TeachingPage {...schoolProps} />;
      return <InstitutionPage {...schoolProps} />;
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
    if (page === 'settings')
      return (
        <SettingsView
          ext={ext}
          updateExt={updateExt}
          nav={nav}
          user={user}
          caps={caps}
          relations={relations}
          people={people}
          onUnblock={handleToggleBlock}
          setToast={setToast}
          path={selectedId}
          mode={mode}
          onResetDemo={handleResetDemo}
          school={mode === 'local' ? school : undefined}
          saveSchool={saveSchool}
          today={today}
        />
      );
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
    if (page === 'admin-identity') return <AdminIdentityView {...adminProps} people={networkDirectory} today={today} />;
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
        onEnterVisitor={signOut}
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
                  {activeSpace === 'community' && caps.canPublish && (
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
                  {/* Espace propre au type de compte : famille, encadrant, établissement */}
                  {(caps.canManageFamily || caps.canTeach || caps.canManageInstitution) && (
                    <>
                      <span className="left-rail-section-label">Mon espace</span>
                      {caps.canManageFamily && (
                        <button className={`rail-nav-btn ${page === 'family' ? 'active' : ''}`} onClick={() => nav('family')}>
                          <span><Users size={16} /> Espace famille</span>
                        </button>
                      )}
                      {caps.canTeach && (
                        <button className={`rail-nav-btn ${page === 'teaching' ? 'active' : ''}`} onClick={() => nav('teaching')}>
                          <span><UserCheck size={16} /> Espace encadrant</span>
                        </button>
                      )}
                      {caps.canManageInstitution && (
                        <button className={`rail-nav-btn ${page === 'institution' ? 'active' : ''}`} onClick={() => nav('institution')}>
                          <span><ClipboardList size={16} /> Mon établissement</span>
                        </button>
                      )}
                      <div className="vous-divider" />
                    </>
                  )}
                  <span className="left-rail-section-label">Apprentissage</span>
                  {/* Un parent ou un établissement consulte la bibliothèque ; il n'a ni apprentissages ni calendrier propres. */}
                  {learnsHere && (
                    <button className={`rail-nav-btn ${page === 'learning' ? 'active' : ''}`} onClick={() => nav('learning')}>
                      <span><BookOpen size={16} /> Mes apprentissages</span>
                    </button>
                  )}
                  {learnsHere && (
                    <button className={`rail-nav-btn ${page === 'calendar' ? 'active' : ''}`} onClick={() => nav('calendar')}>
                      <span><CalendarDays size={16} /> Calendrier</span>
                    </button>
                  )}
                  <button className={`rail-nav-btn ${page === 'catalog' ? 'active' : ''}`} onClick={() => nav('catalog')}>
                    <span><Compass size={16} /> Bibliothèque</span>
                  </button>
                  {learnsHere && (
                    <button className={`rail-nav-btn ${page === 'progression' ? 'active' : ''}`} onClick={() => nav('progression')}>
                      <span><Award size={16} /> Progression & Badges</span>
                    </button>
                  )}
                  {(caps.canCreate || caps.canModerate || caps.canAdmin) && (
                    <>
                      <div className="vous-divider" />
                      <span className="left-rail-section-label">Espaces habilités</span>
                      {caps.canCreate && (
                        <button className="rail-nav-btn" onClick={() => nav('studio')}>
                          <span><Layers size={16} /> Studio</span>
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
              <nav className="rail-nav-card" aria-label="Navigation du Studio">
                <span className="left-rail-section-label">Studio</span>
                {(() => {
                  // Éditeur, quiz, publication et parcours sont des onglets d'un contenu : « Contenus » reste actif.
                  const inContents = ['studio', 'studio-editor', 'studio-quiz', 'studio-publish', 'studio-path'].includes(page);
                  const items: { id: RoutePage; label: string; icon: React.ReactNode; active: boolean }[] = [
                    { id: 'studio', label: 'Contenus', icon: <Layers size={16} />, active: inContents },
                    { id: 'studio-ocr', label: 'Créer avec l’IA', icon: <Sparkles size={16} />, active: page === 'studio-ocr' },
                    { id: 'studio-media', label: 'Médias', icon: <ImageIcon size={16} />, active: page === 'studio-media' },
                    { id: 'studio-stats', label: 'Statistiques', icon: <BarChart2 size={16} />, active: page === 'studio-stats' },
                    { id: 'studio-profile', label: 'Profil créateur', icon: <User size={16} />, active: page === 'studio-profile' }
                  ];
                  return items.map((it) => (
                    <button
                      key={it.id}
                      className={`rail-nav-btn ${it.active ? 'active' : ''}`}
                      aria-current={it.active ? 'page' : undefined}
                      onClick={() => nav(it.id)}
                    >
                      <span>
                        {it.icon} {it.label}
                      </span>
                    </button>
                  ));
                })()}
              </nav>
            )}

            {activeSpace === 'admin' && (
              <GovernanceRail ext={ext} updateExt={updateExt} nav={nav} page={page} setToast={setToast} />
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

      {page !== 'messages' && page !== 'settings' && (
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
            if (drawerPeerId) setMessagesPeerId(drawerPeerId);
            setDrawerPeerId('');
            setDrawerOpen(false);
            nav('messages');
          }}
          bubblePeerId={drawerPeerId}
          setBubblePeerId={setDrawerPeerId}
          onOpenRelations={() => {
            setDrawerOpen(false);
            nav('relations');
          }}
          onOpenProfile={(p) => {
            setDrawerOpen(false);
            nav('member', p.id);
          }}
          onOpenReport={(t) => setReportTarget(t)}
          contacts={conversationContacts}
          onRequestContact={handleRequestContact}
          onDecideContact={handleDecideContact}
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
        onOpenComposer={caps.canPublish ? () => setComposerOpen(true) : undefined}
        onEnterVisitor={signOut}
      />

      <PostComposerModal
        open={composerOpen && caps.canPublish}
        initialView={composerView}
        onClose={() => {
          setComposerOpen(false);
          setComposerView('compose');
        }}
        user={user}
        scheduled={(ext.scheduledPosts || []).filter((p) => p.authorId === user.id)}
        onPublish={(post) => {
          updateExt((prev) => ({ ...prev, posts: [post, ...prev.posts] }));
          setToast('Contribution publiée dans la communauté');
          nav('community-thread', post.id);
        }}
        onSchedule={(post) => {
          updateExt((prev) => ({ ...prev, scheduledPosts: [...(prev.scheduledPosts || []), post] }));
          setToast(`Publication programmée : ${formatScheduleDate(post.scheduledAtMs ?? Date.now())}`);
        }}
        onPublishScheduled={(id) => {
          const now = Date.now();
          updateExt((prev) =>
            promoteDuePosts(
              {
                ...prev,
                scheduledPosts: (prev.scheduledPosts || []).map((p) => (p.id === id ? { ...p, scheduledAtMs: now } : p))
              },
              now
            )
          );
          setToast('Contribution publiée dans la communauté');
        }}
        onDeleteScheduled={(id) => {
          updateExt((prev) => ({ ...prev, scheduledPosts: (prev.scheduledPosts || []).filter((p) => p.id !== id) }));
          setToast('Publication programmée supprimée');
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

      {authModal}

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
              {infoModal === 'hackathon' ? 'Nexus · Hackathon CREATE WITH AI' : 'SAVOIR+ · Information'}
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
