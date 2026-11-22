/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ConfirmDialog } from './components/ui';
import { playSound, setSoundEffects } from './sounds';
import {
  Clock,
  ArrowRight,
  Award,
  BarChart2,
  BookOpen,
  CalendarDays,
  ChartGantt,
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
  GraduationCap,
  Home,
  Image as ImageIcon,
  Inbox,
  Layers,
  LayoutGrid,
  Lock,
  MessageCircle,
  MessageSquare,
  PenLine,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sliders,
  FilePen,
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
  removeRelation,
  openFamilyThread,
  openFriendThread,
  latestMessageAt,
  requestContact,
  resetDemo,
  saveName,
  saveProgress,
  sendMessage,
  toggleBlock,
  type Message,
  type MessageAttachment,
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
  EXTENDED_STORAGE_KEY,
  formatNotificationTimestamp,
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
  nextExam,
  normalizeCalendarState,
  planGauges,
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
  guardiansOf,
  hasAccess,
  learnersOf,
  normalizeSchoolState,
  priceOf,
  slotsFor,
  visibleInSuggestions,
  type SchoolState
} from './school';
import { accountOf as schoolAccountOf, ageBandOf, institutionOf, libraryOf, nextSlot, studentsOfClass } from './school';
import { addDays as addCalendarDays, dayFromDate } from './calendar';
import { demoCampaigns } from './ads';
import { OwnAdCard, SponsoredCard } from './components/SponsoredCard';
import { NextCourseCard } from './components/NextCourseCard';
import { audienceOfKind, contentIncluded, institutionSteering, paidSubscription, plansFor } from './offers';
import { rankFeed, recommend, viewerOf } from './personalize';
import { addUsage, lockApplies, lockState, requestOfDay, requestTime, rulesOf } from './deviceLock';
import { initialSchoolState } from './seedSchool';

import { TopBar } from './components/TopBar';
import { MobileNav } from './components/MobileNav';
import { Avatar, DifficultyMeter, ProfileIdentityCard, ProgressBar, VerifiedBadge, setAvatarPhotos } from './components/ProfileIdentityCard';
import { CatalogContentCard, ContentTypeMark, XpBadgeInline } from './components/CatalogVisuals';
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
import { WeekCard } from './components/CalendarMonth';
import { TodayCard, type TodayStep } from './components/TodayCard';
import { flushSync } from 'react-dom';
import { FeedPostCard } from './components/FeedPostCard';
import {
  SidebarCompactFooter,
  type FooterInfoTopic
} from './components/SidebarFooters';
import {
  DemoAuthModal,
  PostComposerModal,
  ReportDialog,
  type ReportFollowUp,
  type ReportTarget
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
import { BadgesPage } from './pages/BadgesPage';
import { CalendarPage } from './pages/CalendarPage';
import { GuardianGate } from './pages/school/GuardianGate';
import { InfoPage } from './pages/InfoPage';
import { DeviceLockScreen } from './pages/school/DeviceLockScreen';
import { DemoTour } from './components/DemoTour';
import { DEMO_TOUR, readTourStep, writeTourStep } from './demoTour';
import { FamilyPage } from './pages/school/FamilyPage';
import { TeachingPage } from './pages/school/TeachingPage';
import { InstitutionPage } from './pages/school/InstitutionPage';
import { TimetableList, memberName } from './pages/school/shared';
import { WorkShell, type WorkNavGroup, type WorkSpaceLink } from './components/WorkShell';
import {
  AuthFlowsView,
  ModerationView,
  NotificationsView,
  AppealView
} from './pages/AccountAndAdminPages';
import { SettingsView } from './pages/SettingsPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
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
  'info',
  'family',
  'subscription',
  'teaching',
  'institution',
  'progression',
  'badges',
  'community',
  'community-compose',
  'community-thread',
  'relations',
  'member',
  'messages',
  'profile',
  'notifications',
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
  // Un personnage par onglet : quand un autre onglet enregistre, celui-ci relit l'état. Sans cela, un onglet resté
  // ouvert écraserait le changement de l'autre (un code parental déjà utilisé resservirait, une pause décidée
  // par le parent n'arriverait pas chez l'enfant).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === EXTENDED_STORAGE_KEY) setExt(readExtended());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

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
  // Où arriver sur la page d'une section : en haut, ou sur son exercice (lien « À vous de jouer » du sommaire).
  const [readerAnchor, setReaderAnchor] = useState<'top' | 'practice'>('top');
  // Publicité : le tirage des annonces est fixé pour la visite ; la fenêtre des offres s'ouvre depuis la carte.
  const [adSeed] = useState(() => Math.floor(Math.random() * 1_000_000_000));
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
  const [composerIntent, setComposerIntent] = useState<'question' | 'method' | 'photo' | undefined>(undefined);
  const [scheduleTick, setScheduleTick] = useState(0);
  const [reportTarget, setReportTargetState] = useState<ReportTarget | null>(null);
  // Un libellé seul (module, ressource, profil…) ou une cible précise (publication, conversation).
  const setReportTarget = (t: string | ReportTarget | null) => setReportTargetState(typeof t === 'string' ? { label: t } : t);
  // Publications masquées pendant cette visite : un bandeau « Annuler » reste à leur place jusqu'au rechargement.
  const [hiddenThisVisit, setHiddenThisVisit] = useState<string[]>([]);
  // Discussion dont la suppression attend confirmation (menu « … » de la discussion).
  const [deleteThread, setDeleteThread] = useState<{ relId: string; name: string } | null>(null);
  const cancelDeleteThread = useCallback(() => setDeleteThread(null), []);
  // Retraits à confirmer (ne plus suivre, bloquer, retirer une demande), comme sur LinkedIn.
  const [confirmState, setConfirmState] = useState<{
    title: string;
    text: string;
    confirmLabel: string;
    danger?: boolean;
    run: () => void | Promise<void>;
  } | null>(null);
  const cancelConfirm = useCallback(() => setConfirmState(null), []);

  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [toast, setToastState] = useState<string>('');
  // Bandeau d'erreur : rouge, avec le son d'erreur (le « Toast red » de LinkedIn).
  const [toastError, setToastError] = useState(false);
  const setToast = (msg: string) => {
    setToastState(msg);
    setToastError(false);
  };
  const failToast = (msg: string) => {
    setToastState(msg);
    setToastError(true);
    playSound('fail');
  };
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

  // Effets sonores (Préférences générales), activés par défaut comme chez LinkedIn.
  useEffect(() => {
    setSoundEffects(ext.appPrefs.soundEffects !== false);
  }, [ext.appPrefs.soundEffects]);

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

  // Un message de l'autre personne arrive dans la discussion ouverte : son de réception.
  const seenMessages = useRef<{ relId: string; count: number }>({ relId: '', count: 0 });
  useEffect(() => {
    const prev = seenMessages.current;
    const last = messages[messages.length - 1];
    if (prev.relId === selectedRelId && messages.length > prev.count && last && last.author !== uid) playSound('msgReceived');
    seenMessages.current = { relId: selectedRelId, count: messages.length };
  }, [messages, selectedRelId, uid]);

  // Profils et vie scolaire : données de démonstration datées du jour, tant que le visiteur n'a rien modifié.
  const today = todayDay();
  const baseSchool = useMemo(() => initialSchoolState(today), [today]);
  const school = useMemo(() => normalizeSchoolState(ext.school, baseSchool), [ext.school, baseSchool]);
  const saveSchool = (next: SchoolState) => updateExt((prev) => ({ ...prev, school: next }));

  const user: Profile = people.find((p) => p.id === uid) || people[0] || profiles[0];
  // En mode connecté, la base ne porte pas encore ces profils : chaque membre y reste un apprenant adulte.
  const caps = resolveCapabilities(uid, mode, ext.adminUsers, cloudPreviewRole, mode === 'local' ? school : undefined, today);
  // Les formules se souscrivent à partir de 18 ans, pour un type de compte qui en a.
  const canSubscribe =
    (mode !== 'local' || ageBandOf(schoolAccountOf(school, uid), today) === 'adult') && plansFor(audienceOfKind(caps.accountKind)).length > 0;
  // Un parent ou tuteur n'a pas d'Accueil : #home ouvre l'Espace famille, en remplaçant l'adresse.
  const noHome = caps.accountKind === 'guardian' && caps.canManageFamily;
  useLayoutEffect(() => {
    if (!noHome || page !== 'home') return;
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}#family`);
    setPage('family');
    setSelectedId('');
  }, [noHome, page]);

  // Navigation helper
  const nav = (target: RoutePage, id = '') => {
    // Plus de page des signalements : « Signaler » (centre d'aide, menu mobile…) ouvre la fenêtre de signalement.
    if (target === 'report') {
      setMoreOpen(false);
      setReportTarget(id || 'Signalement général');
      return;
    }
    const hash = id ? `#${target}/${encodeURIComponent(id)}` : `#${target}`;
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
    if (target === 'settings' && (id === 'prefs' || id === 'privacy' || id === 'security')) {
      setSettingsTab(id);
    }
    const update = () => {
      setPage(target);
      setSelectedId(id);
      setMoreOpen(false);
    };
    // Changement de page : un fondu court (transition de vue du navigateur), sauf animations réduites.
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    const calm = ext.appPrefs.reducedMotion || Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    if (target !== page && !calm && typeof doc.startViewTransition === 'function') doc.startViewTransition(() => flushSync(update));
    else update();
    const behavior = ext.appPrefs.reducedMotion ? 'auto' : 'smooth';
    document.querySelector('.app-scroll-viewport')?.scrollTo({ top: 0, behavior });
    document.querySelector('.shell-scroll-viewport')?.scrollTo({ top: 0, behavior });
    window.scrollTo({ top: 0, behavior });
  };
  // Liens du pied de page (À propos, Accessibilité, Centre d’aide, Confidentialité, Hackathon) : des pages dédiées.
  const openInfoPage = (topic: FooterInfoTopic) => nav('info', topic);

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
  /** Journal des séances de révision d'un membre (sans recalculer son plan). */
  const revisionLogOf = (id: string) => (ext.calendar?.[id] ? normalizeCalendarState(ext.calendar[id]) : demoCalendarState(id, today)).log;
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

  // Verrouillage d'un enfant de moins de 12 ans par son parent (src/deviceLock.ts). Une minute est comptée par
  // minute d'écran visible tant que SAVOIR+ est ouvert ; la même horloge relit la plage horaire.
  const childLock = mode === 'local' && lockApplies(school, uid, today);
  const studyPage = page === 'reader' || page === 'quiz-intro' || page === 'quiz' || page === 'result';
  const studyPageRef = useRef(studyPage);
  studyPageRef.current = studyPage;
  const [, setLockClock] = useState(0);
  useEffect(() => {
    if (!childLock) return;
    const timer = window.setInterval(() => {
      setLockClock((n) => n + 1);
      if (document.visibilityState !== 'visible') return;
      updateExt((prev) => {
        const current = normalizeSchoolState(prev.school, baseSchool);
        const now = new Date();
        if (lockState(current, uid, now, studyPageRef.current).locked) return prev;
        return { ...prev, school: addUsage(current, uid, dayFromDate(now)) };
      });
    }, 60_000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childLock, uid]);
  const childRules = childLock ? rulesOf(school, uid) : null;
  const feedOff = Boolean(childRules && !childRules.allowFeed);
  const messagesOff = Boolean(childRules && !childRules.allowMessages);
  const areaClosed = (feedOff && page.startsWith('community')) || (messagesOff && page === 'messages');

  // Visite guidée de la démonstration (src/demoTour.ts) : chaque étape choisit son personnage et sa page.
  const [tourIndex, setTourIndex] = useState<number | null>(() => readTourStep(window.location.search));
  // Une notification ouvre le fil sur une publication : la page défile jusqu'à elle.
  useEffect(() => {
    if (page !== 'community' || !selectedId) return;
    const t = window.setTimeout(() => {
      document.getElementById(`post-${selectedId}`)?.scrollIntoView({ block: 'start', behavior: ext.appPrefs.reducedMotion ? 'auto' : 'smooth' });
    }, 260);
    return () => window.clearTimeout(t);
  }, [page, selectedId]);

  // « ?visite=1 » ne sert qu'une fois : retiré de l'adresse, un rechargement ne relance pas la visite.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('visite')) return;
    params.delete('visite');
    const query = params.toString();
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
  }, []);
  useEffect(() => {
    writeTourStep(tourIndex);
    if (tourIndex === null) return;
    const step = DEMO_TOUR[tourIndex];
    if (mode !== 'local' || step.persona !== uid) handleSwitchPersona(step.persona);
    nav(step.page as Parameters<typeof nav>[0], step.param || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourIndex]);

  // Route guard: Studio / Governance pages typed in the URL fall back to home without the matching role.
  // Même règle pour la page de publication quand le profil ne publie pas (parent ou tuteur, classe « stricte »).
  // Un établissement n'est pas une personne : ni accueil d'apprenant, ni fil, ni progression. Son accueil est son espace.
  const institutionAway =
    caps.accountKind === 'institution' &&
    ['home', 'community', 'community-compose', 'learning', 'calendar', 'progression', 'reader', 'quiz-intro', 'quiz', 'result'].includes(page);
  const routeAllowed = !institutionAway && !areaClosed && canAccessRoute(page, caps) && !(page === 'community-compose' && !caps.canPublish);
  useEffect(() => {
    if (routeAllowed) return;
    if (institutionAway) {
      nav('institution');
      return;
    }
    if (areaClosed) {
      setToast('Ton parent a fermé cette partie de SAVOIR+.');
      nav('home');
      return;
    }
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

  // L'enfant demande du temps : la demande part à son parent, avec une alerte.
  const handleRequestTime = () => {
    const now = new Date();
    updateExt((prev) => {
      const current = normalizeSchoolState(prev.school, baseSchool);
      const next = requestTime(current, uid, now);
      if (next === current) return prev;
      const firstName = user.name.split(' ')[0];
      const alerts = guardiansOf(current, uid).map((guardianId, i) => ({
        id: `nt-time-${uid}-${now.getTime()}-${i}`,
        category: 'Compte' as const,
        kind: 'time-request' as const,
        actorId: uid,
        actorName: user.name,
        title: `${firstName} demande plus de temps sur SAVOIR+`,
        detail: 'Son temps du jour est écoulé. Vous pouvez lui accorder 15 ou 30 minutes depuis votre espace famille.',
        date: 'À l’instant',
        read: false,
        targetPage: 'family',
        targetId: uid,
        recipientId: guardianId
      }));
      return { ...prev, school: next, notifications: [...alerts, ...prev.notifications] };
    });
    setToast('Demande envoyée à ton parent');
  };

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
  const openConversation = (relId: string, knownPeerId?: string) => {
    setSelectedRelId(relId);
    const peerId = knownPeerId || relations.find((r) => r.id === relId)?.members.find((id) => id !== uid) || '';
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
    if (page === 'reader' || page === 'quiz-intro' || page === 'quiz') {
      const draft = quizDraftsRef.current[activeStudyModuleId];
      setAnswers(draft ?? (activeStudyProgress.answers || []));
    }
  }, [page, activeStudyModuleId]);

  /** Contenu payant non acquis par le membre (démonstration locale ; les achats sont simulés). */
  // Le catalogue ne porte que le nom de l'auteur : un contenu d'un enseignant est offert à ses élèves.
  const authorIdOfItem = (itemId: string) => {
    const author = dynamicCatalog.find((c) => c.id === itemId)?.author;
    return author ? networkDirectory.find((p) => p.name === author)?.id : undefined;
  };
  // Formule Apprenant+ ou Famille (la sienne, ou celle d'un parent) : tous les contenus payants sont inclus.
  const isLocked = (itemId: string) =>
    mode === 'local' && !contentIncluded(ext.subscriptions, uid, guardiansOf(school, uid)) && !hasAccess(school, uid, itemId, authorIdOfItem(itemId));

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
    setReaderAnchor('top');
    setAnswers(modProg.answers || []);
    nav('reader', moduleId);
  };

  /** Ouvre une section du cours, sur sa page : en haut, ou sur son exercice. */
  const goToPart = (index: number, anchor: 'top' | 'practice' = 'top') => {
    setLessonIndex(index);
    setReaderAnchor(anchor);
    if (page !== 'reader') nav('reader', activeStudyModuleId);
  };

  // Chaque section a sa page. Le bouton du bas note la section lue (+25 XP), puis ouvre la suivante, ou
  // le quiz final après la dernière. Passer par le sommaire n'enregistre rien (R:645 : naviguer n'est pas
  // déclarer avoir lu).
  const handleCompletePart = async () => {
    const lessonCount = activeStudyContent.lessons.length;
    const index = Math.max(0, Math.min(lessonIndex, lessonCount - 1));
    if (!activeStudyProgress.lessons.includes(index)) {
      setBusy(true);
      try {
        const lessons = [...new Set([...activeStudyProgress.lessons, index])].sort((a, b) => a - b);
        await saveModuleProgress(activeStudyModuleId, { ...activeStudyProgress, lessons });
        setToast(`Section « ${activeStudyContent.lessons[index]?.title} » terminée · +25 XP`);
      } catch (e: any) {
        failToast(e?.message || 'Erreur lors de la sauvegarde');
        return; // on reste sur la section, pour pouvoir réessayer
      } finally {
        setBusy(false);
      }
    }
    if (index < lessonCount - 1) goToPart(index + 1);
    else nav('quiz', activeStudyModuleId);
  };

  const handleSubmitQuiz = async () => {
    setBusy(true);
    try {
      const normalized = activeStudyContent.questions.map((_, idx) =>
        answers[idx] !== undefined ? answers[idx] : -1
      );
      await saveModuleProgress(activeStudyModuleId, {
        ...activeStudyProgress,
        // Envoyer le quiz vaut aussi déclaration de lecture : toutes les parties sont notées lues.
        lessons: activeStudyContent.lessons.map((_, i) => i),
        answers: normalized,
        submitted: true
      });
      delete quizDraftsRef.current[activeStudyModuleId];
      nav('result', activeStudyModuleId);
      setToast('Quiz enregistré — consultez votre correction ci-dessous');
    } catch (e: any) {
      failToast(e?.message || 'Erreur lors de l’envoi du quiz');
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
  // Amis : deux membres qui se suivent l'un l'autre ; ils discutent sans demande préalable.
  const isFriend = (id: string) => myFollowing.includes(id) && (ext.followingIds?.[id] || []).includes(uid);
  // Messagerie : personnes à qui on a déjà écrit ou qui nous ont écrit (discussion acceptée,
  // ou demande envoyée / reçue avec son premier message) — pas les simples abonnements.
  // Discussion supprimée par ce membre : ses messages d'avant restent cachés ; elle revient au message suivant.
  const clearedThreadAt = (relId: string) => ext.clearedThreads?.[uid]?.[relId] || 0;
  const threadVisible = (relId: string) => {
    const cleared = clearedThreadAt(relId);
    return !cleared || relId === selectedRelId || (mode === 'local' && latestMessageAt(relId) > cleared);
  };
  const shownMessages = messages.filter((m) => m.createdAt > clearedThreadAt(selectedRelId));
  const conversationContacts = relations
    .filter((r) => r.status !== 'declined' && r.members.includes(uid) && threadVisible(r.id))
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
    if (!already) playSound('connect');
  };

  // Publications : enregistrer, masquer du fil (menu « … »).
  const savedPostIds = ext.savedPosts?.[uid] || [];
  const hiddenPostMap = ext.hiddenPosts?.[uid] || {};
  const toggleSavePost = (postId: string) => {
    const on = savedPostIds.includes(postId);
    updateExt((prev) => {
      const mine = prev.savedPosts?.[uid] || [];
      return { ...prev, savedPosts: { ...prev.savedPosts, [uid]: on ? mine.filter((id) => id !== postId) : [postId, ...mine] } };
    });
    setToast(on ? 'Publication retirée de vos éléments enregistrés' : 'Publication enregistrée : retrouvez-la dans Vous › Éléments enregistrés');
  };
  const hidePost = (postId: string, reason: 'not-interested' | 'ai-slop' | 'reported') => {
    updateExt((prev) => ({
      ...prev,
      hiddenPosts: { ...prev.hiddenPosts, [uid]: { ...(prev.hiddenPosts?.[uid] || {}), [postId]: reason } }
    }));
    setHiddenThisVisit((v) => (v.includes(postId) ? v : [...v, postId]));
  };
  const undoHidePost = (postId: string) => {
    updateExt((prev) => {
      const mine = { ...(prev.hiddenPosts?.[uid] || {}) };
      delete mine[postId];
      return { ...prev, hiddenPosts: { ...prev.hiddenPosts, [uid]: mine } };
    });
    setHiddenThisVisit((v) => v.filter((id) => id !== postId));
  };

  const confirmDeleteThread = () => {
    if (!deleteThread) return;
    const { relId } = deleteThread;
    const peerId = relations.find((r) => r.id === relId)?.members.find((id) => id !== uid) || '';
    updateExt((prev) => ({
      ...prev,
      clearedThreads: { ...prev.clearedThreads, [uid]: { ...(prev.clearedThreads?.[uid] || {}), [relId]: Date.now() } }
    }));
    if (selectedRelId === relId) setSelectedRelId('');
    if (peerId && drawerPeerId === peerId) setDrawerPeerId('');
    if (peerId && messagesPeerId === peerId) setMessagesPeerId('');
    setDeleteThread(null);
    setToast('Discussion supprimée');
    playSound('deleted');
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
    // Amis : la discussion s'ouvre directement, sans demande à accepter.
    if (mode === 'local' && isFriend(targetProfile.id)) {
      openConversation(openFriendThread(uid, targetProfile.id), targetProfile.id);
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
      playSound('connect');
    } catch (e: any) {
      failToast(e?.message || 'Impossible d’envoyer la demande');
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
        playSound('accepted');
      } else {
        setToast('Demande refusée');
      }
    } catch (e: any) {
      failToast(e?.message || 'Action impossible');
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
      failToast(e?.message || 'Annulation impossible');
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
      failToast(e?.message || 'Action impossible');
    } finally {
      setBusy(false);
    }
  };

  const nameOfMember = (id: string) =>
    networkDirectory.find((p) => p.id === id)?.name || people.find((p) => p.id === id)?.name || 'ce membre';
  const firstNameOf = (name: string) => name.split(' ')[0];
  /** « Suivre » part tout de suite ; « Ne plus suivre » demande confirmation. */
  const followOrConfirm = (targetId: string) => {
    if (!myFollowing.includes(targetId)) {
      toggleFollowPerson(targetId);
      return;
    }
    const name = nameOfMember(targetId);
    setConfirmState({
      title: `Ne plus suivre ${name} ?`,
      text: `Vous ne verrez plus ses publications dans votre fil. ${firstNameOf(name)} n’en sera pas informé(e).`,
      confirmLabel: 'Ne plus suivre',
      run: () => toggleFollowPerson(targetId)
    });
  };
  /** « Débloquer » part tout de suite ; « Bloquer » demande confirmation. */
  const blockOrConfirm = (r: Relation) => {
    if (r.blockedBy.includes(uid)) {
      void handleToggleBlock(r);
      return;
    }
    const name = nameOfMember(r.members.find((id) => id !== uid) || '');
    setConfirmState({
      title: `Bloquer ${name} ?`,
      text: `Vous ne pourrez plus échanger de messages avec ${firstNameOf(name)}, qui n’en sera pas informé(e). Vous pourrez le débloquer à tout moment.`,
      confirmLabel: 'Bloquer',
      danger: true,
      run: () => void handleToggleBlock(r)
    });
  };
  /** « Retirer la relation » (comme « Remove connection » sur LinkedIn), après confirmation. */
  const removeRelationOrConfirm = (r: Relation) => {
    const peerId = r.members.find((id) => id !== uid) || '';
    const name = nameOfMember(peerId);
    setConfirmState({
      title: `Retirer ${name} de vos relations ?`,
      text: `La discussion se ferme : il faudra une nouvelle demande pour échanger de nouveau. ${firstNameOf(name)} n’en sera pas informé(e).`,
      confirmLabel: 'Retirer',
      run: async () => {
        setBusy(true);
        try {
          await removeRelation(mode, uid, r);
          if (selectedRelId === r.id) setSelectedRelId('');
          if (drawerPeerId === peerId) setDrawerPeerId('');
          if (messagesPeerId === peerId) setMessagesPeerId('');
          setToast(`${name} ne fait plus partie de vos relations`);
          playSound('deleted');
        } catch (e: any) {
          failToast(e?.message || 'Impossible de retirer cette relation');
        } finally {
          setBusy(false);
        }
      }
    });
  };
  /** « En attente » : retirer la demande envoyée, après confirmation (comme « Withdraw » sur LinkedIn). */
  const withdrawOrConfirm = (r: Relation) => {
    const name = nameOfMember(r.recipient);
    setConfirmState({
      title: 'Retirer la demande ?',
      text: `Votre demande de discussion à ${name} sera retirée. Vous pourrez en envoyer une nouvelle plus tard.`,
      confirmLabel: 'Retirer',
      run: () => void handleCancelContact(r)
    });
  };

  const handleSendMessage = async (attachment?: MessageAttachment): Promise<boolean> => {
    const activeRel = relations.find((r) => r.id === selectedRelId);
    if (!activeRel || (!draft.trim() && !attachment)) return false;
    if (caps.isRestricted) {
      setToast('Envoi temporairement restreint sur votre compte.');
      return false;
    }
    setBusy(true);
    try {
      await sendMessage(mode, uid, activeRel, draft.trim(), `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, attachment);
      setDraft('');
      playSound('msgSent');
      return true;
    } catch (e: any) {
      failToast(e?.message || 'Échec de l’envoi du message');
      return false;
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
    if (created) playSound('postSuccess');
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
      failToast(e?.message || 'Impossible de transférer cette contribution');
      return false;
    }
  };

  // Bulle de la visite guidée, posée au-dessus de la page en cours (lecteur compris).
  const tourStep = tourIndex !== null ? DEMO_TOUR[tourIndex] : null;
  const tourOverlay =
    tourStep && tourIndex !== null ? (
      <DemoTour
        step={tourStep}
        index={tourIndex}
        total={DEMO_TOUR.length}
        personaName={networkDirectory.find((p) => p.id === tourStep.persona)?.name || tourStep.persona}
        onNext={() => {
          if (tourIndex >= DEMO_TOUR.length - 1) {
            setTourIndex(null);
            setToast('Fin de la visite guidée');
          } else setTourIndex(tourIndex + 1);
        }}
        onPrev={() => setTourIndex(Math.max(0, tourIndex - 1))}
        onClose={() => {
          setTourIndex(null);
          setToast('Visite interrompue : reprenez-la depuis le menu Vous');
        }}
      />
    ) : null;

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
  const acceptedRelations = relations.filter((r) => r.status === 'accepted');
  const unreadNotifs = notificationsFor(ext.notifications, uid, ext.notifPrefs).filter((n) => !n.read).length;
  // Une nouvelle alerte arrive (pas au chargement, ni en changeant de personnage) : son de notification.
  const seenAlerts = useRef<{ uid: string; count: number } | null>(null);
  useEffect(() => {
    const prev = seenAlerts.current;
    if (prev && prev.uid === uid && unreadNotifs > prev.count) playSound('notification');
    seenAlerts.current = { uid, count: unreadNotifs };
  }, [unreadNotifs, uid]);

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
          <div className={`toast${toastError ? ' is-error' : ''}`} role="status" aria-live="polite">
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
          <div className={`toast${toastError ? ' is-error' : ''}`} role="status" aria-live="polite">
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
          // Le code se vérifie sur l'état enregistré le plus récent : déjà utilisé dans un autre onglet, il ne ressert pas.
          latestSchool={() => normalizeSchoolState(readExtended().school, baseSchool)}
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
          <div className={`toast${toastError ? ' is-error' : ''}`} role="status" aria-live="polite">
            {toast}
          </div>
        )}
      </>
    );
  }

  // Moins de 12 ans : SAVOIR+ verrouillé par le parent (pause, plage horaire, temps du jour écoulé).
  const childLockState = childLock ? lockState(school, uid, new Date(), studyPage) : null;
  if (childLockState?.locked) {
    return (
      <>
        <DeviceLockScreen
          user={user}
          lock={childLockState}
          rules={rulesOf(school, uid)}
          request={requestOfDay(school, uid, today)}
          onRequest={handleRequestTime}
          onExit={signOut}
          onSwitchAccount={() => setAuthModalOpen(true)}
        />
        {authModal}
        {toast && (
          <div className={`toast${toastError ? ' is-error' : ''}`} role="status" aria-live="polite">
            {toast}
          </div>
        )}
      </>
    );
  }

  // Pages d'information du pied de page, comme sur LinkedIn : elles sortent de l'application (bandeau réduit
  // au logo, ni colonne de gauche ni barre de navigation) et chacune a sa mise en page (src/pages/InfoPage.tsx).
  // La formule du compte : la payante, sinon l'offre gratuite de son public (un établissement n'en a pas).
  const currentOfferId =
    paidSubscription(ext.subscriptions, uid)?.offer.id ||
    (caps.accountKind === 'learner' ? 'learner-free' : caps.accountKind === 'guardian' || caps.accountKind === 'educator' ? 'free' : undefined);
  // Fenêtre de signalement (comme LinkedIn) : présente dans l'application et sur les pages d'information.
  // Une publication signalée quitte le fil, une conversation signalée quitte la messagerie ; le
  // remerciement propose de ne plus suivre l'auteur ou de bloquer la personne.
  const reportedRel = reportTarget?.kind === 'conversation' ? relations.find((r) => r.id === reportTarget.id) : undefined;
  const reportFollowUps: ReportFollowUp[] = [];
  if (reportTarget?.kind === 'post' && reportTarget.personId && myFollowing.includes(reportTarget.personId)) {
    const personId = reportTarget.personId;
    reportFollowUps.push({
      label: `Ne plus suivre ${reportTarget.personName}`,
      doneLabel: `Vous ne suivez plus ${reportTarget.personName}`,
      onSelect: () => toggleFollowPerson(personId)
    });
  }
  if (reportedRel && !reportedRel.blockedBy.includes(uid)) {
    reportFollowUps.push({
      label: `Bloquer ${reportTarget?.personName}`,
      doneLabel: `${reportTarget?.personName} est bloqué(e)`,
      onSelect: () => void handleToggleBlock(reportedRel)
    });
  }
  const reportDialog = (
    <ReportDialog
      target={reportTarget}
      followUps={reportFollowUps}
      onClose={() => setReportTarget(null)}
      onSubmit={(report) => {
        const t = reportTarget;
        updateExt((prev) => ({
          ...prev,
          reports: [report, ...prev.reports],
          ...(t?.kind === 'post' && t.id
            ? { hiddenPosts: { ...prev.hiddenPosts, [uid]: { ...(prev.hiddenPosts?.[uid] || {}), [t.id]: 'reported' as const } } }
            : {}),
          ...(t?.kind === 'conversation' && t.id
            ? { clearedThreads: { ...prev.clearedThreads, [uid]: { ...(prev.clearedThreads?.[uid] || {}), [t.id]: Date.now() } } }
            : {})
        }));
        if (t?.kind === 'post' && t.id) {
          const postId = t.id;
          setHiddenThisVisit((v) => (v.includes(postId) ? v : [...v, postId]));
        }
        if (t?.kind === 'conversation' && t.id) {
          if (selectedRelId === t.id) setSelectedRelId('');
          if (t.personId && drawerPeerId === t.personId) setDrawerPeerId('');
          if (t.personId && messagesPeerId === t.personId) setMessagesPeerId('');
        }
      }}
    />
  );

  if (page === 'info') {
    return (
      <>
        <InfoPage
          path={selectedId}
          nav={nav}
          firstName={user.name.split(' ')[0]}
          canPublish={caps.canPublish}
          learns={caps.accountKind === 'learner' || caps.accountKind === 'educator'}
          isGuardian={caps.accountKind === 'guardian'}
          isLocal={mode === 'local'}
          onStartTour={mode === 'local' ? () => setTourIndex(0) : undefined}
          viewerAudience={audienceOfKind(caps.accountKind)}
          currentOfferId={currentOfferId}
        />
        {reportDialog}
        {toast && (
          <div className={`toast${toastError ? ' is-error' : ''}`} role="status" aria-live="polite">
            {toast}
          </div>
        )}
      </>
    );
  }

  // Le cours d'un module : chaque section sur sa page, puis le quiz final sur la sienne, puis le résultat ;
  // toutes gardent l'interface du cours (barre du haut, sommaire, colonne de lecture).
  if (page === 'reader') {
    return (
      <>
        <AcademyReaderView
          moduleContent={activeStudyContent}
          summary={dynamicCatalog.find((c) => c.id === activeStudyModuleId)?.summary}
          domain={dynamicCatalog.find((c) => c.id === activeStudyModuleId)?.domain}
          progress={activeStudyProgress}
          lessonIndex={lessonIndex}
          anchor={readerAnchor}
          busy={busy}
          onGoToPart={goToPart}
          onCompletePart={handleCompletePart}
          onOpenQuiz={() => nav('quiz', activeStudyModuleId)}
          onExit={() => nav(studyReturnTarget.page === 'visitor' ? 'home' : studyReturnTarget.page, studyReturnTarget.id || '')}
        />
        {tourOverlay}
        {toast && (
          <div className={`toast${toastError ? ' is-error' : ''}`} role="status" aria-live="polite">
            {toast}
          </div>
        )}
      </>
    );
  }

  if (page === 'quiz-intro' || page === 'quiz') {
    return (
      <>
        <AcademyQuizView
          moduleContent={activeStudyContent}
          progress={activeStudyProgress}
          answers={answers}
          setAnswers={(next) => {
            // Le brouillon suit chaque réponse : quitter la page ne fait rien perdre.
            quizDraftsRef.current[activeStudyModuleId] = next;
            setAnswers(next);
          }}
          busy={busy}
          onSubmitQuiz={handleSubmitQuiz}
          onOpenResult={() => nav('result', activeStudyModuleId)}
          onGoToPart={goToPart}
          onExit={() => nav(studyReturnTarget.page === 'visitor' ? 'home' : studyReturnTarget.page, studyReturnTarget.id || '')}
        />
        {tourOverlay}
        {toast && (
          <div className={`toast${toastError ? ' is-error' : ''}`} role="status" aria-live="polite">
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
          onOpenQuiz={() => nav('quiz', activeStudyModuleId)}
          onReviewLessons={goToPart}
          onOpenLearning={() => nav('learning')}
          onExit={() => nav('home')}
          totalXP={totalXP}
          nextModule={nextModuleAfter(activeStudyModuleId)}
          onOpenNextModule={(id) => nav('module-detail', id)}
        />
        {toast && (
          <div className={`toast${toastError ? ' is-error' : ''}`} role="status" aria-live="polite">
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
          <div className={`toast${toastError ? ' is-error' : ''}`} role="status" aria-live="polite">
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
  // Un compte apprend s'il est apprenant ou encadrant ; un parent ou un établissement n'a ni XP ni progression.
  const accountLearns = (id: string) => {
    const kind = schoolAccountOf(school, id).kind;
    return kind === 'learner' || kind === 'educator';
  };
  // Bibliothèque d'un établissement : les contenus publiés par ses enseignants.
  const institutionLibrary = (id: string) => {
    const account = schoolAccountOf(school, id);
    if (account.kind !== 'institution' || !account.institutionId) return undefined;
    return libraryOf(school, account.institutionId, dynamicCatalog, (item) => networkDirectory.find((p) => p.name === item.author)?.id);
  };
  // Pages sans la colonne de gauche (profil et menu). Relations : sa colonne « Réseau en bref » passe à gauche.
  const isFullWidth =
    page === 'relations' ||
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
    // Ce que le module prépare : la prochaine séance du plan qui le travaille, l'évaluation à venir qui le couvre.
    moduleAgenda: (moduleId: string) => {
      const exam = calendarEvents
        .filter((e) => e.exam?.moduleIds?.includes(moduleId) && e.start >= today)
        .sort((a, b) => a.start.localeCompare(b.start))[0];
      const session = revisionPlan.sessions.filter((x) => x.moduleId === moduleId && x.day >= today).sort((a, b) => a.day.localeCompare(b.day))[0];
      if (!exam && !session) return null;
      return { sessionDay: session?.day, exam: exam ? { title: exam.exam?.subject || exam.title, day: exam.start } : undefined };
    },
    // Contenu payant : le prix n'est montré qu'à un adulte ; un parent achète depuis son espace famille.
    paywall: (itemId: string) => {
      if (!isLocked(itemId)) return null;
      if (!canSeePrices(school, uid, today)) return { priceLabel: null };
      const priceLabel = formatPrice(priceOf(school, itemId));
      if (caps.accountKind === 'guardian') {
        return {
          priceLabel,
          buyLabel: 'Acheter pour un enfant',
          onBuy: () => nav('family'),
          planLabel: 'Ou tous les contenus de vos enfants avec la formule Famille',
          onPlan: () => nav('info', 'pricing/family')
        };
      }
      return {
        priceLabel,
        ...(caps.accountKind === 'learner'
          ? { planLabel: 'Ou tout le catalogue avec Apprenant+', onPlan: () => nav('info', 'pricing/learner') }
          : {}),
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
    onToggleFollow: followOrConfirm,
    onTogglePostHelpful: handleTogglePostHelpful,
    onAddReply: handleAddPostReply,
    onToggleReplyHelpful: handleToggleReplyHelpful,
    onSelectSolution: handleSelectQuestionSolution,
    onRepost: handleRepostPost,
    onForwardToRelation: handleForwardPostToRelation,
    setToast,
    readOnly: !caps.canPublish
  };

  // Carte publicitaire : une seule définition, posée dans la colonne de droite des pages les plus visitées
  // (accueil, relations, messagerie, alertes, mes apprentissages). Jamais montrée à un compte d'enfant de moins de 12 ans.
  // Offre gratuite : la publicité est obligatoire. Un abonné peut la masquer (Paramètres) et en suspendre le défilement.
  const paidPlan = paidSubscription(ext.subscriptions, uid);
  const adSlot = (
    <>
      {ageBandOf(schoolAccountOf(school, uid), today) !== 'child' && (!paidPlan || paidPlan.subscription.showAds !== false) && (
        <SponsoredCard
          canPause={Boolean(paidPlan)}
          campaigns={demoCampaigns(today, addCalendarDays)}
          today={today}
          seed={adSeed}
          canOpen={(id) => networkDirectory.some((p) => p.id === id)}
          onOpenAdvertiser={(id) => nav('member', id)}
          onOpenOffers={() => nav('info', `pricing/${audienceOfKind(caps.accountKind)}`)}
        />
      )}
    </>
  );

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
    reportTarget: reportTarget?.label || 'Élément général',
    settingsTab,
    setSettingsTab,
    setToast,
    selectedId
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

  // Module en cours : le même pour l'anneau de la barre du haut et pour la carte « Reprise » de l'accueil ;
  // rien quand aucun module n'est commencé sans être validé.
  const activeLab = resolveActiveLab(dynamicCatalog, modulePct);
  // Reprendre un module là où on l'a laissé : le quiz quand toutes les parties sont lues, sinon la lecture.
  const resumeModule = (id: string) => {
    if (getModuleProgress(id).lessons.length >= (MODULES_CONTENT[id]?.lessons.length || 3) && !isModuleValidated(id)) {
      setActiveStudyModuleId(id);
      nav('quiz-intro', id);
    } else openReader(id);
  };
  const acceptedPeerIds = acceptedRelations
    .map((r) => r.members.find((m) => m !== uid))
    .filter((id): id is string => Boolean(id));
  const communityMemberIds = Array.from(new Set([...myFollowing, ...acceptedPeerIds]));

  // Determine active module to resume on Home hero
  // Le module en cours ; sinon le phishing (cœur du pitch), proposé tant qu'il n'est pas validé.
  const resumeModuleId = activeLab?.item.id || 'phishing';
  const resumeCatalog = dynamicCatalog.find((c) => c.id === resumeModuleId) || dynamicCatalog[0];
  const resumeProg = getModuleProgress(resumeModuleId);
  const resumePct = modulePct(resumeModuleId);
  const resumeValidated = isModuleValidated(resumeModuleId);

  const renderMainContent = () => {
    if (!routeAllowed) return null; // redirect to home is in flight (route guard effect)
    if (page === 'home' || page === 'community') {
      const lvl = computeGlobalLevel(totalXP);
      // Publication visée par une notification (« community/<id> ») : toujours dans le fil, en tête si le filtre la cache.
      const focusPostId = page === 'community' ? selectedId : '';
      const filteredFeedPosts = filterHomeFeed(ext.posts, homeFeedTab, myFollowing).filter(
        (p) => !hiddenPostMap[p.id] || hiddenThisVisit.includes(p.id) || p.id === focusPostId
      );
      const focusPost = focusPostId ? ext.posts.find((p) => p.id === focusPostId) : undefined;
      const visibleFeedPosts =
        focusPost && !filteredFeedPosts.some((p) => p.id === focusPost.id) ? [focusPost, ...filteredFeedPosts] : filteredFeedPosts;
      // Accueil propre à ce profil : ce que l'école a donné, les personnes liées, les abonnements, les intérêts.
      const homeViewer = viewerOf({
        uid,
        kind: caps.accountKind,
        interests: ext.profileDetails[uid]?.interests,
        following: myFollowing,
        school,
        nameOf: (id) => networkDirectory.find((p) => p.id === id)?.name || id,
        contentIds: playableModuleIds,
        moduleState: (id) => (isModuleValidated(id) ? 'done' : modulePct(id) > 0 ? 'started' : 'new')
      });
      const recommendations = recommend(dynamicCatalog, homeViewer, {
        authorIdOf: (item) => networkDirectory.find((p) => p.name === item.author)?.id,
        limit: 8
      });
      const feedEntries = rankFeed(visibleFeedPosts, homeViewer);
      const postCardProps = {
        currentUser: user,
        people,
        ext,
        acceptedRelations,
        followingIds: myFollowing,
        communityMemberIds,
        onToggleFollowPerson: toggleFollowPerson,
        onTogglePostHelpful: handleTogglePostHelpful,
        onAddReply: handleAddPostReply,
        onToggleReplyHelpful: handleToggleReplyHelpful,
        onSelectSolution: handleSelectQuestionSolution,
        onRepost: handleRepostPost,
        onForwardToRelation: handleForwardPostToRelation,
        onOpenMember: (memberId: string) => nav('member', memberId),
        onOpenModule: (moduleId: string) => nav('module-detail', moduleId),
        onOpenThread: (postId: string) => nav('community-thread', postId),
        onOpenRelations: () => nav('relations'),
        onReport: (label: string) => setReportTarget(label),
        onReportPost: (post: CommunityPost) =>
          setReportTarget({
            label: `Publication de ${post.authorName} : « ${post.title} »`,
            kind: 'post',
            id: post.id,
            personId: post.authorId,
            personName: post.authorName
          }),
        setToast,
        readOnly: !caps.canPublish,
        onToggleSave: toggleSavePost,
        onHide: hidePost,
        onUndoHide: undoHidePost
      };

      // Vous › Éléments enregistrés : les publications enregistrées, la plus récente en tête.
      if (page === 'community' && selectedId === 'saved') {
        const savedPosts = savedPostIds.flatMap((id) => ext.posts.filter((p) => p.id === id));
        return (
          <div className="dashboard-grid">
            <div className="dashboard-main">
              <section className="wf-card saved-posts-head">
                <h1>Éléments enregistrés</h1>
                <p className="muted">
                  {savedPosts.length === 0
                    ? 'Aucune publication enregistrée. Choisissez « Enregistrer » dans le menu « … » d’une publication pour la retrouver ici.'
                    : `${savedPosts.length} publication${savedPosts.length > 1 ? 's' : ''} enregistrée${savedPosts.length > 1 ? 's' : ''}, visible${savedPosts.length > 1 ? 's' : ''} par vous seul(e).`}
                </p>
              </section>
              {savedPosts.map((post) => (
                <FeedPostCard key={post.id} post={post} {...postCardProps} saved onHide={undefined} />
              ))}
            </div>
            <aside className="right-rail" aria-label="Repères">
              {adSlot}
            </aside>
          </div>
        );
      }
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
                  Partagez une astuce ou posez une question…
                </button>
              </div>
              {/* Les trois gestes de la maquette : chacun ouvre la fenêtre de publication dans le bon mode. */}
              <div className="home-composer-shortcuts">
                {(
                  [
                    ['question', 'Question', <MessageSquare size={16} aria-hidden="true" />],
                    ['method', 'Méthode', <PenLine size={16} aria-hidden="true" />],
                    ['photo', 'Photo', <ImageIcon size={16} aria-hidden="true" />]
                  ] as const
                ).map(([intent, label, icon]) => (
                  <button
                    key={intent}
                    type="button"
                    className="home-composer-shortcut-btn"
                    onClick={() => {
                      setComposerIntent(intent);
                      setComposerOpen(true);
                    }}
                  >
                    {icon} {label}
                  </button>
                ))}
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
                {/* Aujourd'hui : la séance du jour et le module à reprendre, une seule action ; seulement pour un compte qui apprend. */}
                {learnsHere &&
                  (() => {
                    const content = MODULES_CONTENT[resumeModuleId];
                    const lessonCount = content?.lessons.length || 3;
                    const questionCount = content?.questions.length || 3;
                    const steps: TodayStep[] = [
                      ...Array.from({ length: lessonCount }, (_, i) => ({
                        label: content?.lessons[i]?.title || `Section ${i + 1}`,
                        done: resumeProg.lessons.includes(i),
                        kind: 'section' as const
                      })),
                      { label: 'Quiz final', done: resumeValidated, kind: 'quiz' as const }
                    ];
                    const nextLesson = steps.findIndex((step) => step.kind === 'section' && !step.done);
                    const lesson = nextLesson >= 0 ? content?.lessons[nextLesson] : undefined;
                    const next = resumeValidated
                      ? 'Module validé · révision libre'
                      : lesson
                        ? `Section ${nextLesson + 1} · ${lesson.title}${lesson.minutes ? ` · ${lesson.minutes}` : ''}`
                        : resumeProg.submitted
                          ? `Quiz à retenter · ${questionCount} questions`
                          : `Quiz final · ${questionCount} questions`;
                    const upcomingExam = nextExam(calendarEvents, today);
                    return (
                      <TodayCard
                        today={today}
                        item={resumeCatalog}
                        steps={steps}
                        next={next}
                        verb={resumeValidated ? 'Revoir' : resumePct === 0 ? 'Commencer' : lesson ? 'Reprendre' : 'Terminer'}
                        sessionsToday={revisionPlan.sessions.filter((session) => session.day === today)}
                        gauges={planGauges(revisionPlan, calendarEvents, calendarState.log, today)}
                        onResume={() => resumeModule(resumeModuleId)}
                        onOpenPlan={() => nav('calendar', 'plan')}
                        onOpenExam={() => nav('calendar', upcomingExam ? upcomingExam.start : '')}
                      />
                    );
                  })()}

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
                      {recommendations.map(({ item, reason }) => {
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
                            reason={reason}
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


            {/* Fil d'entraide : le parent d'un enfant de moins de 12 ans peut le fermer. */}
            {!feedOff && (
              <div className="home-section-head">
                <h2>Fil d’entraide</h2>
                <p className="muted">Questions, méthodes et réponses de la communauté.</p>
              </div>
            )}

            {/* Unified Community Stream */}
            {!feedOff && (
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
                  feedEntries.map(({ post, context }) => (
                    <FeedPostCard
                      key={post.id === focusPostId ? `${post.id}:focus` : post.id}
                      post={post}
                      context={context}
                      focused={post.id === focusPostId}
                      defaultExpandedComments={post.id === focusPostId}
                      {...postCardProps}
                      saved={savedPostIds.includes(post.id)}
                      hiddenReason={hiddenThisVisit.includes(post.id) ? hiddenPostMap[post.id] : undefined}
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
              <WeekCard
                today={today}
                events={calendarEvents}
                plan={revisionPlan}
                log={calendarState.log}
                onOpen={(day) => nav('calendar', day || '')}
              />
            )}

            {learnsHere &&
              (() => {
                // Modules par domaine : validés, en cours, à commencer. Le texte porte les chiffres ; la barre montre la part.
                const domains = Array.from(new Set(playableModuleIds.map((id) => dynamicCatalog.find((c) => c.id === id)?.domain).filter(Boolean))) as string[];
                const rows = domains.map((domain) => {
                  const ids = playableModuleIds.filter((id) => dynamicCatalog.find((c) => c.id === id)?.domain === domain);
                  const validated = ids.filter((id) => isModuleValidated(id)).length;
                  const started = ids.filter((id) => !isModuleValidated(id) && modulePct(id) > 0).length;
                  return { domain, total: ids.length, validated, started, todo: ids.length - validated - started };
                });
                return (
                  <section className="rail-card prog-card" aria-label="Votre progression">
                    <h2 className="discover-feed-title">Votre progression</h2>
                    <p className="prog-level tabular-nums">
                      <b>Niveau {lvl.level}</b> · {totalXP} XP
                    </p>
                    <ProgressBar value={lvl.percent} label="Expérience du niveau en cours" tone="htb" />
                    <p className="prog-next">{lvl.targetXp - lvl.currentXp} XP avant le niveau {lvl.level + 1}</p>
                    <div className="prog-domains">
                      <span className="prog-domains-title">Modules par domaine</span>
                      {rows.map((r) => (
                        <div key={r.domain} className="prog-domain">
                          <span className="prog-domain-name">{r.domain}</span>
                          <span
                            className="prog-seg"
                            role="img"
                            aria-label={`${r.domain} : ${r.validated} validé${r.validated > 1 ? 's' : ''}, ${r.started} en cours, ${r.todo} à commencer`}
                          >
                            {r.validated > 0 && <i className="is-done" style={{ flexGrow: r.validated }} />}
                            {r.started > 0 && <i className="is-started" style={{ flexGrow: r.started }} />}
                            {r.todo > 0 && <i className="is-todo" style={{ flexGrow: r.todo }} />}
                          </span>
                          <b className="tabular-nums">
                            {r.validated}/{r.total}
                          </b>
                        </div>
                      ))}
                      <p className="prog-legend">
                        <span><i className="is-done" /> Validé</span>
                        <span><i className="is-started" /> En cours</span>
                        <span><i className="is-todo" /> À commencer</span>
                      </p>
                    </div>
                    <button type="button" className="rail-card-foot" onClick={() => nav('progression')}>
                      Ma progression détaillée <ArrowRight size={16} aria-hidden="true" />
                    </button>
                  </section>
                );
              })()}

            {adSlot}

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
            <h1 className="sr-only">Mes apprentissages</h1>
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
              {learningTab !== 'Terminés' && (
                <button className="primary" onClick={() => nav('catalog')}>
                  Explorer la bibliothèque
                </button>
              )}
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
            {adSlot}
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
        <div className="dashboard-grid relations-grid">
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
                Invitations ({pendingIncoming.length})
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
                        <div className="connect-card-footer">
                          {caps.accountKind === 'institution' ? (
                            !rel && (
                              <button
                                type="button"
                                className="follow-btn follow-btn-sm is-idle"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRequestContact(p);
                                }}
                              >
                                <UserPlus size={13} /> Demander le contact
                              </button>
                            )
                          ) : (
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
                          )}
                          {rel?.status === 'pending' && <span className="status-tag warn">En attente</span>}
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
                                    ? entry.isFollowed
                                      ? 'Suivi · discussion active'
                                      : 'Discussion active'
                                    : rel?.status === 'pending'
                                      ? rel.requester === uid
                                        ? entry.isFollowed
                                          ? 'Suivi · demande de discussion envoyée'
                                          : 'Demande de discussion envoyée'
                                        : entry.isFollowed
                                          ? 'Suivi · vous a envoyé une demande'
                                          : 'Vous a envoyé une demande'
                                      : 'Compte suivi'}
                              </span>
                            </div>
                          </button>
                          <div className="relation-list-actions">
                            {entry.isFollowed && (
                              <button
                                type="button"
                                className="follow-btn follow-btn-sm is-following"
                                onClick={() => followOrConfirm(other.id)}
                                aria-pressed={true}
                              >
                                <Check size={13} /> Suivi
                              </button>
                            )}
                            {/* Demande envoyée : « En attente » (comme « Pending » sur LinkedIn) ; un clic propose de la retirer. */}
                            {rel?.status === 'pending' && rel.requester === uid && (
                              <button
                                type="button"
                                className="follow-btn follow-btn-sm is-pending"
                                disabled={busy}
                                onClick={() => withdrawOrConfirm(rel)}
                                title="Retirer la demande"
                              >
                                <Clock size={13} /> En attente
                              </button>
                            )}
                            {rel?.status === 'accepted' && (
                              <ConversationMenu
                                label={`Plus d’options pour ${other.name}`}
                                items={[
                                  { label: 'Retirer la relation', disabled: busy, onSelect: () => removeRelationOrConfirm(rel) },
                                  {
                                    label: rel.blockedBy.includes(uid) ? 'Débloquer' : 'Bloquer',
                                    danger: true,
                                    disabled: busy,
                                    onSelect: () => blockOrConfirm(rel)
                                  }
                                ]}
                              />
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
                <div className="rail-stat-row has-icon">
                  <span>
                    <UserCheck size={16} aria-hidden="true" /> Comptes suivis
                  </span>
                  <b>{myFollowing.length}</b>
                </div>
                <div className="rail-stat-row has-icon">
                  <span>
                    <MessageCircle size={16} aria-hidden="true" /> Contacts acceptés
                  </span>
                  <b>{acceptedRelations.length}</b>
                </div>
                <div className="rail-stat-row has-icon">
                  <span>
                    <Inbox size={16} aria-hidden="true" /> Invitations reçues
                  </span>
                  <b>{pendingIncoming.length}</b>
                </div>
              </div>
            </section>
            {adSlot}
            <SidebarCompactFooter nav={nav} canCreate={caps.canCreate} onOpenInfoModal={openInfoPage} />
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
          revisionLog={revisionLogOf(target.id)}
          currentUser={user}
          ext={ext}
          people={people}
          relations={relations}
          myFollowing={myFollowing}
          totalXP={totalXP}
          getModuleProgress={getModuleProgress}
          lessonCounts={LESSON_COUNTS}
          learns={accountLearns(target.id)}
          canFollow={caps.accountKind !== 'institution' && accountLearns(target.id)}
          library={institutionLibrary(target.id)}
          onToggleFollow={followOrConfirm}
          onOpenChatDrawer={openConversation}
          onRequestContact={handleRequestContact}
          onCancelRequest={withdrawOrConfirm}
          onReportTarget={(label) => setReportTarget(label)}
          onOpenInfoModal={openInfoPage}
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
          revisionLog={revisionLogOf(uid)}
          currentUser={user}
          ext={ext}
          people={people}
          relations={relations}
          myFollowing={myFollowing}
          totalXP={totalXP}
          getModuleProgress={getModuleProgress}
          lessonCounts={LESSON_COUNTS}
          learns={learnsHere}
          canFollow={caps.accountKind !== 'institution'}
          library={institutionLibrary(uid)}
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
          onToggleFollow={followOrConfirm}
          onOpenChatDrawer={openConversation}
          onReportTarget={(label) => setReportTarget(label)}
          onOpenComposer={caps.canPublish ? () => setComposerOpen(true) : undefined}
          onOpenInfoModal={openInfoPage}
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
                  <p className="conversation-empty">Aucune discussion.</p>
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
                                {
                                  label: 'Signaler cette conversation',
                                  onSelect: () =>
                                    setReportTarget({
                                      label: `Conversation avec ${other.name}`,
                                      kind: 'conversation',
                                      id: activeRel.id,
                                      personId: other.id,
                                      personName: other.name
                                    })
                                },
                                {
                                  label: 'Supprimer la discussion',
                                  danger: true,
                                  onSelect: () => setDeleteThread({ relId: activeRel.id, name: other.name })
                                },
                                {
                                  label: activeRel.blockedBy.includes(uid) ? 'Débloquer' : 'Bloquer',
                                  danger: true,
                                  disabled: busy,
                                  onSelect: () => blockOrConfirm(activeRel)
                                }
                              ]
                            : [])
                        ]}
                      />
                    </div>
                    <ThreadScroll className="chat-messages" watch={isAccepted ? shownMessages : activeRel?.status}>
                      {/* La carte de présentation s'efface dès le premier message, comme sur LinkedIn. */}
                      {!(isAccepted && activeRel && selectedRelId === activeRel.id && shownMessages.length > 0) && (
                        <ConversationIntro person={other} onOpenProfile={() => nav('member', other.id)} />
                      )}
                      {isAccepted && activeRel && selectedRelId === activeRel.id && (
                        <MessageThread messages={shownMessages} people={[user, other, ...people]} />
                      )}
                    </ThreadScroll>
                    {isAccepted && activeRel ? (
                      canSend(activeRel, uid) ? (
                        <MessageComposer draft={draft} setDraft={setDraft} onSend={handleSendMessage} busy={busy} attachments={mode === 'local'} />
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
                        friend={mode === 'local' && isFriend(other.id)}
                        busy={busy}
                        onRequestContact={handleRequestContact}
                        onDecideContact={handleDecideContact}
                      />
                    )}
                  </>
                ) : (
                  <div className="chat-welcome">
                    <MessageCircle size={32} />
                    {msgContacts.length === 0 ? (
                      <>
                        <h3>Aucune discussion pour le moment</h3>
                        <p>Un échange privé s’ouvre quand une demande de contact est acceptée.</p>
                        <button type="button" className="secondary" onClick={() => nav('relations')}>
                          Découvrir des membres
                        </button>
                      </>
                    ) : (
                      <>
                        <h3>Sélectionnez une discussion</h3>
                        <p>Choisissez une personne à gauche pour reprendre l’échange.</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Colonne de la Messagerie : la publicité et les liens de pied de page (plus de cartes de contact). */}
          <aside className="right-rail" aria-label="Publicité et liens utiles">
            {adSlot}
            <SidebarCompactFooter nav={nav} canCreate={caps.canCreate} onOpenInfoModal={openInfoPage} />
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
      if (page === 'family')
        return (
          <FamilyPage
            {...schoolProps}
            calendarOf={calendarOf}
            onWrite={(peerId, text) => {
              // Parent et enfant se parlent sans demande préalable : le lien familial est déjà vérifié.
              const relId = mode === 'local' ? openFamilyThread(uid, peerId) : '';
              setDrawerOpen(false);
              setMessagesPeerId(peerId);
              if (relId) setSelectedRelId(relId);
              setDraft(text);
              nav('messages');
            }}
          />
        );
      if (page === 'teaching') return <TeachingPage {...schoolProps} />;
      return <InstitutionPage {...schoolProps} />;
    }

    if (page === 'catalog')
      return (
        <CatalogExtraView
          {...extraProps}
          purchasedIds={Array.from(new Set(school.purchases.filter((p) => p.buyerId === uid).map((p) => p.itemId)))}
        />
      );
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

    if (page === 'badges') {
      const member = selectedId && selectedId !== uid ? networkDirectory.find((p) => p.id === selectedId) : undefined;
      return (
        <BadgesPage
          {...extraProps}
          currentUser={user}
          member={member}
          members={networkDirectory}
          relations={relations}
          myFollowing={myFollowing}
        />
      );
    }

    if (page === 'community-compose') return <CommunityComposeView {...communityProps} />;
    if (page === 'community-thread') return <CommunityThreadView {...communityProps} />;

    if (page === 'notifications')
      return (
        <NotificationsView
          {...accountAdminProps}
          rail={
            <>
              {learnsHere && (
                <WeekCard today={today} events={calendarEvents} plan={revisionPlan} log={calendarState.log} onOpen={(day) => nav('calendar', day || '')} />
              )}
              {adSlot}
            </>
          }
        />
      );
    if (page === 'subscription')
      return (
        <SubscriptionPage
          user={user}
          ext={ext}
          updateExt={updateExt}
          school={mode === 'local' ? school : undefined}
          people={people}
          catalog={dynamicCatalog}
          audience={audienceOfKind(caps.accountKind)}
          adult={canSubscribe}
          nav={nav}
          setToast={setToast}
          today={today}
          target={selectedId}
        />
      );
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

  /* Coque « espace de travail » : les outils de l'établissement, de l'encadrant, de la famille, du Studio et
     de la gouvernance ont leur barre latérale et un plan de travail en pleine largeur ; le réseau garde ses colonnes. */
  const workSpaceId: 'institution' | 'teaching' | 'family' | 'studio' | 'admin' | null =
    page === 'institution' && caps.canManageInstitution
      ? 'institution'
      : page === 'teaching' && caps.canTeach
        ? 'teaching'
        : (page === 'family' || (caps.accountKind === 'guardian' && ['catalog', 'module-detail', 'resource-detail', 'path-detail'].includes(page))) &&
            caps.canManageFamily
          ? 'family'
          : activeSpace === 'studio'
            ? 'studio'
            : activeSpace === 'admin'
              ? 'admin'
              : null;
  const workSpaces: WorkSpaceLink[] = [
    ...(caps.canManageInstitution ? [{ id: 'institution', label: 'Établissement', onSelect: () => nav('institution') }] : []),
    ...(caps.canTeach ? [{ id: 'teaching', label: 'Enseigner', onSelect: () => nav('teaching') }] : []),
    ...(caps.canManageFamily ? [{ id: 'family', label: 'Famille', onSelect: () => nav('family') }] : []),
    ...(caps.canCreate ? [{ id: 'studio', label: 'Studio', onSelect: () => nav('studio') }] : []),
    ...(caps.canModerate || caps.canAdmin ? [{ id: 'admin', label: 'Gouvernance', onSelect: () => nav('admin') }] : [])
  ];
  const workShell = (() => {
    if (!workSpaceId) return null;
    const accountMark = <Avatar person={user} />;
    if (workSpaceId === 'institution') {
      const institution = institutionOf(school, schoolAccountOf(school, uid).institutionId);
      const classes = institution ? school.classes.filter((c) => c.institutionId === institution.id) : [];
      const members = institution ? school.memberships.filter((m) => m.institutionId === institution.id) : [];
      const requests = members.filter((m) => m.status === 'pending').length;
      const teachers = members.filter((m) => m.role === 'teacher' && m.status === 'active').length;
      const tabs = ['overview', 'planning', 'timetable', 'classes', 'library', 'teachers', 'requests'];
      // Une classe ouverte appartient à la rubrique Classes ; sans rubrique, l'espace s'ouvre comme la page.
      const current = tabs.includes(selectedId)
        ? selectedId
        : selectedId
          ? 'classes'
          : institutionSteering(ext.subscriptions, uid)
            ? 'overview'
            : 'classes';
      const go = (id: string) => nav('institution', id === 'overview' ? '' : id);
      const groups: WorkNavGroup[] = [
        {
          items: [
            { id: 'overview', label: 'Vue d’ensemble', icon: <LayoutGrid size={18} aria-hidden="true" />, onSelect: () => go('overview') },
            { id: 'planning', label: 'Planification', icon: <ChartGantt size={18} aria-hidden="true" />, onSelect: () => go('planning') },
            { id: 'timetable', label: 'Emploi du temps', icon: <CalendarDays size={18} aria-hidden="true" />, onSelect: () => go('timetable') },
            { id: 'classes', label: 'Classes', icon: <Users size={18} aria-hidden="true" />, count: classes.length, onSelect: () => go('classes') },
            { id: 'library', label: 'Bibliothèque', icon: <BookOpen size={18} aria-hidden="true" />, count: institutionLibrary(uid)?.length, onSelect: () => go('library') },
            { id: 'teachers', label: 'Enseignants', icon: <UserCheck size={18} aria-hidden="true" />, count: teachers, onSelect: () => go('teachers') },
            { id: 'requests', label: 'Demandes', icon: <Inbox size={18} aria-hidden="true" />, count: requests, urgent: requests > 0, onSelect: () => go('requests') }
          ].map((item) => ({ ...item, active: item.id === current }))
        }
      ];
      // Son annonce en cours, s'il en a une : la même photo que dans la colonne de droite des membres.
      const ownAd = demoCampaigns(today, addCalendarDays).find((c) => c.advertiserId === uid && c.start <= today && today <= c.end);
      return {
        label: 'Rubriques de l’établissement',
        mark: <span className="work-mark-square">{accountMark}</span>,
        title: institution?.name || user.name,
        subtitle: paidPlan ? `Formule ${paidPlan.offer.name}` : 'Sans formule',
        groups,
        aside: ownAd ? <OwnAdCard campaign={ownAd} onOpenOffers={() => nav('info', 'pricing/advertiser')} /> : undefined
      };
    }
    if (workSpaceId === 'teaching') {
      const classes = classesOfTeacher(school, uid);
      const tabs = ['overview', 'planning', 'timetable', 'classes'];
      const current = tabs.includes(selectedId) ? selectedId : classes.some((c) => c.id === selectedId) ? selectedId : classes.length ? 'overview' : 'classes';
      const groups: WorkNavGroup[] = [
        {
          items: [
            { id: 'overview', label: 'Vue d’ensemble', icon: <LayoutGrid size={18} aria-hidden="true" />, onSelect: () => nav('teaching') },
            { id: 'planning', label: 'Planification', icon: <ChartGantt size={18} aria-hidden="true" />, onSelect: () => nav('teaching', 'planning') },
            { id: 'timetable', label: 'Emploi du temps', icon: <CalendarDays size={18} aria-hidden="true" />, onSelect: () => nav('teaching', 'timetable') },
            { id: 'classes', label: 'Classes et apprenants', icon: <Users size={18} aria-hidden="true" />, onSelect: () => nav('teaching', 'classes') }
          ].map((item) => ({ ...item, active: item.id === current }))
        },
        ...(classes.length
          ? [
              {
                label: 'Mes classes',
                items: classes.map((c) => ({
                  id: c.id,
                  label: c.name,
                  icon: <GraduationCap size={18} aria-hidden="true" />,
                  count: studentsOfClass(school, c.id).length,
                  active: current === c.id,
                  onSelect: () => nav('teaching', c.id)
                }))
              }
            ]
          : [])
      ];
      // Le cours en cours ou le prochain, d'après son emploi du temps.
      const now = new Date();
      const course = nextSlot(slotsFor(school, uid), today, now.getHours() * 60 + now.getMinutes());
      const courseClass = course ? classes.find((c) => c.id === course.slot.classId) : undefined;
      return {
        label: 'Rubriques de l’espace encadrant',
        mark: accountMark,
        title: 'Enseigner',
        subtitle: user.name,
        groups,
        aside:
          course && courseClass ? (
            <NextCourseCard
              slot={course.slot}
              day={course.day}
              today={today}
              live={course.live}
              className={courseClass.name}
              onOpen={() => nav('teaching', courseClass.id)}
            />
          ) : undefined
      };
    }
    if (workSpaceId === 'family') {
      const familyName = user.name.split(' ').slice(1).join(' ');
      // Les enfants s'ouvrent depuis leurs cartes de la vue d'ensemble ; le menu garde l'espace d'une page à l'autre.
      const inLibrary = page !== 'family';
      const groups: WorkNavGroup[] = [
        {
          items: [
            { id: 'home', label: 'Vue d’ensemble', icon: <LayoutGrid size={18} aria-hidden="true" />, active: !inLibrary, onSelect: () => nav('family') },
            { id: 'catalog', label: 'Bibliothèque', icon: <Compass size={18} aria-hidden="true" />, active: inLibrary, onSelect: () => nav('catalog') }
          ]
        }
      ];
      return {
        label: 'Rubriques de l’espace famille',
        mark: accountMark,
        title: familyName ? `Famille ${familyName}` : 'Espace famille',
        subtitle: paidPlan ? `Formule ${paidPlan.offer.name}` : 'Offre gratuite',
        groups
      };
    }
    if (workSpaceId === 'studio') {
      // Éditeur, quiz, publication et parcours sont des onglets d'un contenu : « Contenus » reste actif.
      const inContents = ['studio', 'studio-editor', 'studio-quiz', 'studio-publish', 'studio-path'].includes(page);
      const groups: WorkNavGroup[] = [
        {
          items: [
            { id: 'studio', label: 'Contenus', icon: <Layers size={18} aria-hidden="true" />, active: inContents, onSelect: () => nav('studio') },
            { id: 'studio-ocr', label: 'Créer avec l’IA', icon: <FilePen size={18} aria-hidden="true" />, active: page === 'studio-ocr', onSelect: () => nav('studio-ocr') },
            { id: 'studio-media', label: 'Médias', icon: <ImageIcon size={18} aria-hidden="true" />, active: page === 'studio-media', onSelect: () => nav('studio-media') },
            { id: 'studio-stats', label: 'Statistiques', icon: <BarChart2 size={18} aria-hidden="true" />, active: page === 'studio-stats', onSelect: () => nav('studio-stats') },
            { id: 'studio-profile', label: 'Profil créateur', icon: <User size={18} aria-hidden="true" />, active: page === 'studio-profile', onSelect: () => nav('studio-profile') }
          ]
        }
      ];
      return { label: 'Rubriques du Studio', mark: accountMark, title: 'Studio', subtitle: user.name, groups };
    }
    return {
      label: 'Rubriques de la gouvernance',
      mark: accountMark,
      title: 'Gouvernance',
      subtitle: user.name,
      groups: [],
      extra: <GovernanceRail ext={ext} updateExt={updateExt} nav={nav} page={page} setToast={setToast} />
    };
  })();

  return (
    <div className={`app-root${workShell ? ' is-work' : ''}`} data-page={page}>
      <TopBar
        page={caps.accountKind === 'institution' && page === 'institution' ? 'home' : page}
        nav={nav}
        onOpenSubscription={canSubscribe ? () => nav('subscription') : undefined}
        user={user}
        caps={caps}
        ext={ext}
        people={people}
        activeLab={learnsHere ? activeLab : null}
        onOpenActiveLab={resumeModule}
        pendingCount={pendingIncoming.length}
        unreadNotifs={unreadNotifs}
        topQuery={topQuery}
        setTopQuery={setTopQuery}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onEnterVisitor={signOut}
        hideMessaging={messagesOff}
        onStartTour={mode === 'local' ? () => setTourIndex(0) : undefined}
        onOpenMessaging={() => {
          setDrawerOpen(false);
          nav('messages');
        }}
      />

      {workShell && workSpaceId ? (
        <div className="app-scroll-viewport">
          <WorkShell
            space={workSpaceId}
            label={workShell.label}
            mark={workShell.mark}
            title={workShell.title}
            subtitle={workShell.subtitle}
            spaces={workSpaces}
            currentSpace={workSpaceId}
            groups={workShell.groups}
            extra={'extra' in workShell ? workShell.extra : undefined}
            aside={'aside' in workShell ? workShell.aside : undefined}
            footer={<SidebarCompactFooter nav={nav} canCreate={caps.canCreate} onOpenInfoModal={openInfoPage} />}
          >
            <div key={`${page}:${selectedId}`} className="page-transition">
              {renderMainContent()}
            </div>
          </WorkShell>
        </div>
      ) : (
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

              {/* Pas de raccourci « Publier / Question » : le fil a sa zone de publication, et la colonne reste la
                  même que l'on arrive par l'Accueil ou par une alerte (#community). */}
              {(activeSpace === 'learner' || activeSpace === 'community') && (
                <nav className="rail-nav-card" aria-label="Espaces d’apprentissage">
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
                        <button className={`rail-nav-btn ${page === 'institution' && selectedId !== 'library' ? 'active' : ''}`} onClick={() => nav('institution')}>
                          <span><ClipboardList size={16} /> Mon établissement</span>
                        </button>
                      )}
                      <div className="vous-divider" />
                    </>
                  )}
                  <span className="left-rail-section-label">{caps.accountKind === 'institution' ? 'Ressources' : 'Apprentissage'}</span>
                  {/* Un parent ou un établissement consulte la bibliothèque ; il n'a ni apprentissages ni calendrier propres. */}
                  {learnsHere && (
                    <button className={`rail-nav-btn ${page === 'home' ? 'active' : ''}`} onClick={() => nav('home')}>
                      <span><Home size={16} /> Aujourd’hui</span>
                    </button>
                  )}
                  {/* La bibliothèque d'un établissement : les contenus de ses enseignants, dans son espace. */}
                  {caps.accountKind === 'institution' ? (
                    <button
                      className={`rail-nav-btn ${page === 'institution' && selectedId === 'library' ? 'active' : ''}`}
                      onClick={() => nav('institution', 'library')}
                    >
                      <span><Compass size={16} /> Bibliothèque</span>
                    </button>
                  ) : (
                    <button className={`rail-nav-btn ${page === 'catalog' ? 'active' : ''}`} onClick={() => nav('catalog')}>
                      <span><Compass size={16} /> Bibliothèque</span>
                    </button>
                  )}
                  {learnsHere && (
                    <button className={`rail-nav-btn ${page === 'calendar' ? 'active' : ''}`} onClick={() => nav('calendar')}>
                      <span><CalendarDays size={16} /> Calendrier</span>
                    </button>
                  )}
                  {learnsHere && (
                    // La page Badges s'ouvre depuis Progression (« Voir tous les badges ») et depuis le profil.
                    <button className={`rail-nav-btn ${page === 'progression' || page === 'badges' ? 'active' : ''}`} onClick={() => nav('progression')}>
                      <span><Award size={16} /> Progression</span>
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

            <SidebarCompactFooter
              nav={nav}
              canCreate={caps.canCreate}
              onOpenInfoModal={openInfoPage}
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
      )}

      {page !== 'messages' && page !== 'settings' && !messagesOff && (
        <MessagingDrawer
          open={drawerOpen}
          setOpen={setDrawerOpen}
          user={user}
          people={people}
          relations={relations}
          selected={selectedRelId}
          setSelected={setSelectedRelId}
          messages={shownMessages}
          draft={draft}
          setDraft={setDraft}
          busy={busy}
          error={error}
          onSend={handleSendMessage}
          attachments={mode === 'local'}
          onToggleBlock={blockOrConfirm}
          onDeleteThread={(rel, peer) => setDeleteThread({ relId: rel.id, name: peer.name })}
          onReportConversation={(rel, peer) =>
            setReportTarget({ label: `Conversation avec ${peer.name}`, kind: 'conversation', id: rel.id, personId: peer.id, personName: peer.name })
          }
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
          isFriend={(id) => mode === 'local' && isFriend(id)}
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
        hideMessaging={messagesOff}
      />
      {tourOverlay}

      <PostComposerModal
        open={composerOpen && caps.canPublish}
        initialView={composerView}
        intent={composerIntent}
        onClose={() => {
          setComposerOpen(false);
          setComposerView('compose');
          setComposerIntent(undefined);
        }}
        user={user}
        scheduled={(ext.scheduledPosts || []).filter((p) => p.authorId === user.id)}
        onPublish={(post) => {
          updateExt((prev) => ({ ...prev, posts: [post, ...prev.posts] }));
          setToast('Contribution publiée dans la communauté');
          playSound('postSuccess');
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
          playSound('postSuccess');
        }}
        onDeleteScheduled={(id) => {
          updateExt((prev) => ({ ...prev, scheduledPosts: (prev.scheduledPosts || []).filter((p) => p.id !== id) }));
          setToast('Publication programmée supprimée');
          playSound('deleted');
        }}
      />

      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title || ''}
        text={confirmState?.text}
        confirmLabel={confirmState?.confirmLabel || 'Confirmer'}
        danger={confirmState?.danger}
        onConfirm={() => {
          void confirmState?.run();
          setConfirmState(null);
        }}
        onCancel={cancelConfirm}
      />

      <ConfirmDialog
        open={Boolean(deleteThread)}
        title="Supprimer la discussion ?"
        text={
          deleteThread
            ? `L’historique de votre échange avec ${deleteThread.name} sera effacé de votre messagerie. ${deleteThread.name.split(' ')[0]} garde sa copie. Cette action est définitive.`
            : undefined
        }
        confirmLabel="Supprimer"
        danger
        onConfirm={confirmDeleteThread}
        onCancel={cancelDeleteThread}
      />

      {reportDialog}

      {authModal}


      {toast && (
        <div className={`toast${toastError ? ' is-error' : ''}`} role="status" aria-live="polite">
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
