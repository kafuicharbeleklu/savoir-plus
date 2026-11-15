export type CatalogType = 'module' | 'resource' | 'path';
export type ReviewLevel = 'Communautaire' | 'Pédagogique' | 'Renforcée';
export type DifficultyLevel = 'Débutant' | 'Intermédiaire' | 'Avancé';
export type AppPage =
  | 'home'
  | 'catalog'
  | 'learning'
  | 'progression'
  | 'community'
  | 'community-compose'
  | 'community-thread'
  | 'relations'
  | 'member'
  | 'messages'
  | 'profile'
  | 'notifications'
  | 'report'
  | 'settings'
  | 'reader'
  | 'quiz-intro'
  | 'quiz'
  | 'result'
  | 'resource-detail'
  | 'resource-read'
  | 'module-detail'
  | 'path-detail'
  | 'studio'
  | 'studio-editor'
  | 'studio-quiz'
  | 'studio-media'
  | 'studio-path'
  | 'studio-publish'
  | 'studio-ocr'
  | 'studio-stats'
  | 'studio-profile'
  | 'admin'
  | 'admin-users'
  | 'admin-roles'
  | 'admin-contents'
  | 'admin-validation'
  | 'admin-audit'
  | 'admin-support'
  | 'admin-settings'
  | 'moderation'
  | 'appeal'
  | 'auth-flows';

export interface CatalogItem {
  id: string;
  type: CatalogType;
  title: string;
  domain: 'Numérique' | 'Communication' | 'Gestion';
  level: DifficultyLevel;
  duration: string;
  author: string;
  authorRole: string;
  version: string;
  review: ReviewLevel;
  summary: string;
  objectives: string[];
  prerequisites: string;
  interactive?: boolean;
  sections?: { title: string; subtitle: string; status?: 'Terminé' | 'En cours' | 'À commencer' }[];
  pathType?: 'Compétence' | 'Métier';
  moduleCount?: number;
  pathModules?: { id: string; title: string; version: string; note: string; status: 'Terminé' | 'En cours' | 'À commencer' }[];
  resourceFormat?: string;
  resourceBody?: { heading: string; text: string }[];
  resourcePrompt?: string;
  xpReward?: number;
  skills?: string[];
}

export const CATALOG_ITEMS: CatalogItem[] = [
  {
    id: 'phishing',
    type: 'module',
    title: 'Ne tombez plus dans le piège',
    domain: 'Numérique',
    level: 'Débutant',
    duration: '12 min',
    author: 'Kossi Agbo',
    authorRole: 'Apprendre. Puis transmettre.',
    version: 'Version 2',
    review: 'Pédagogique',
    summary: 'Apprenez à reconnaître un e-mail de phishing et adoptez les bons réflexes au quotidien.',
    objectives: [
      'Repérer les signaux d’urgence ou de menace dans un message.',
      'Vérifier l’adresse de l’expéditeur et la destination d’un lien.',
      'Réagir calmement et signaler une tentative suspecte.'
    ],
    prerequisites: 'Savoir utiliser un ordinateur, un smartphone ou une messagerie. Aucun prérequis bloquant.',
    interactive: true,
    xpReward: 150,
    skills: ['Vigilance e-mail', 'Inspection de liens', 'Réflexes de sécurité'],
    sections: [
      { title: '01 Reconnaître les signaux', subtitle: 'Section consultable depuis le lecteur · 3 min' },
      { title: '02 Vérifier la source', subtitle: 'Section consultable depuis le lecteur · 4 min' },
      { title: '03 Adopter les bons réflexes', subtitle: 'Section consultable depuis le lecteur · 3 min' },
      { title: '04 Vérifier mes acquis', subtitle: 'Activité à réaliser dans le lecteur · 3 questions' }
    ]
  },
  {
    id: 'reseaux',
    type: 'module',
    title: 'Comprendre les réseaux',
    domain: 'Numérique',
    level: 'Débutant',
    duration: '45 min',
    author: 'Kossi Agbo',
    authorRole: 'Créateur & Mentor · Réseaux & Sécurité',
    version: 'Version 2',
    review: 'Pédagogique',
    interactive: true,
    xpReward: 150,
    skills: ['Équipements réseau', 'Adressage IP', 'Passerelle & DNS'],
    summary: 'Identifier les équipements courants, comprendre le rôle d’une adresse IP et décrire un échange simple.',
    objectives: [
      'Identifier les équipements courants d’un réseau local.',
      'Expliquer le rôle d’une adresse IP et d’un routeur.',
      'Décrire un échange simple entre deux appareils.'
    ],
    prerequisites: 'Savoir utiliser un ordinateur et un navigateur. Pas de prérequis bloquant défini.',
    sections: [
      { title: '01 Les équipements réseau', subtitle: 'Section consultable · 15 min', status: 'Terminé' },
      { title: '02 Les adresses IP et la passerelle', subtitle: 'Dernière section sauvegardée · 15 min', status: 'En cours' },
      { title: '03 Décrire un échange simple', subtitle: 'Section consultable · 15 min', status: 'À commencer' },
      { title: '04 Vérifier ses acquis', subtitle: 'Quiz de 3 questions · Sans limite de temps', status: 'À commencer' }
    ]
  },
  {
    id: 'comptes',
    type: 'module',
    title: 'Protéger ses comptes',
    domain: 'Numérique',
    level: 'Débutant',
    duration: '25 min',
    author: 'Kossi Agbo',
    authorRole: 'Curieuse, chaque jour.',
    version: 'Version 1',
    review: 'Renforcée',
    interactive: true,
    xpReward: 150,
    skills: ['Phrases secrètes', 'Double authentification', 'Révocation de sessions'],
    summary: 'Construire des mots de passe robustes, activer la double authentification et gérer ses sessions.',
    objectives: [
      'Choisir un mot de passe unique par service important.',
      'Activer un second facteur de vérification.',
      'Révoquer une session ouverte sur un appareil inconnu.'
    ],
    prerequisites: 'Aucun prérequis obligatoire.',
    sections: [
      { title: '01 Mots de passe robustes', subtitle: 'Section consultable · 8 min', status: 'À commencer' },
      { title: '02 Double authentification (2FA)', subtitle: 'Section consultable · 10 min', status: 'À commencer' },
      { title: '03 Sessions actives et révocation', subtitle: 'Section consultable · 7 min', status: 'À commencer' },
      { title: '04 Vérifier ses acquis', subtitle: 'Quiz de 3 questions · Sans limite de temps', status: 'À commencer' }
    ]
  },
  {
    id: 'fiche-reseau',
    type: 'resource',
    title: 'Ma fiche de révision : Les repères du réseau',
    domain: 'Numérique',
    level: 'Débutant',
    duration: '5 min',
    author: 'Kossi Agbo',
    authorRole: 'Contributrice pédagogique',
    version: 'Version 1',
    review: 'Communautaire',
    resourceFormat: 'Fiche',
    summary: 'Retenir les rôles des équipements d’un réseau, les notions clés (IP, routeur) et les points essentiels.',
    objectives: ['Disposer d’un mémo clair pour réviser avant une évaluation.'],
    prerequisites: 'Aucun prérequis déclaré par l’auteur. Cette indication ne constitue pas une évaluation de votre niveau.',
    resourceBody: [
      {
        heading: 'Trois notions à retenir',
        text: 'Équipement : appareil qui participe au réseau. Adresse IP : adresse d’une interface sur le réseau. Routeur : équipement qui relie des réseaux distincts.'
      },
      {
        heading: 'Pour aller plus loin',
        text: 'Consultez la fiche du module « Comprendre les réseaux » si vous souhaitez suivre un apprentissage structuré avec quiz.'
      }
    ],
    resourcePrompt: 'Expliquez avec vos mots la différence entre l’appareil, son adresse et le réseau auquel il est connecté.'
  },
  {
    id: 'memo-liens',
    type: 'resource',
    title: 'Mémo : Vérifier un lien suspect en 10 secondes',
    domain: 'Communication',
    level: 'Débutant',
    duration: '3 min',
    author: 'Kossi Agbo',
    authorRole: 'Curieuse, chaque jour.',
    version: 'Version 1',
    review: 'Communautaire',
    resourceFormat: 'Fiche',
    summary: 'Trois réflexes rapides avant de cliquer sur un lien reçu par SMS, messagerie ou e-mail.',
    objectives: ['Identifier le vrai nom de domaine avant d’ouvrir une page.'],
    prerequisites: 'Aucun prérequis déclaré.',
    resourceBody: [
      {
        heading: 'Lire de droite à gauche avant le premier « / »',
        text: 'Dans https://portail.banque-exemple.test/connexion, le domaine réel est banque-exemple.test, juste avant le premier slash.'
      },
      {
        heading: 'En cas de doute',
        text: 'Ouvrez directement l’application officielle ou saisissez l’adresse habituelle dans votre navigateur.'
      }
    ],
    resourcePrompt: 'Repérez le domaine principal dans un message reçu aujourd’hui sans cliquer dessus.'
  },
  {
    id: 'fondamentaux-it',
    type: 'path',
    title: 'Fondamentaux IT',
    domain: 'Numérique',
    level: 'Débutant',
    duration: 'Durée totale non précisée',
    author: 'Kossi Agbo',
    authorRole: 'Formateur réseaux & systèmes',
    version: 'Version 1',
    review: 'Pédagogique',
    pathType: 'Compétence',
    moduleCount: 6,
    summary: 'Comprendre un environnement informatique courant et adopter les premiers réflexes de diagnostic.',
    objectives: [
      'Comprendre le matériel, les systèmes et les réseaux locaux.',
      'Appliquer les bases d’hygiène numérique et de sécurité.'
    ],
    prerequisites: 'Utilisation courante d’un ordinateur conseillée. L’ordre proposé guide la progression ; il ne crée pas de verrouillage.',
    pathModules: [
      { id: 'phishing', title: '01 Ne tombez plus dans le piège', version: 'v2', note: 'Revue pédagogique visible sur la fiche', status: 'Terminé' },
      { id: 'reseaux', title: '02 Comprendre les réseaux', version: 'v2', note: 'Voir le module · Reprise disponible', status: 'En cours' },
      { id: 'comptes', title: '03 Protéger ses comptes', version: 'v1', note: 'Voir le module · Accès selon vos droits', status: 'À commencer' }
    ]
  },
  {
    id: 'support-it',
    type: 'path',
    title: 'Technicien support IT',
    domain: 'Gestion',
    level: 'Intermédiaire',
    duration: 'Durée totale non précisée',
    author: 'Afi Koudjo',
    authorRole: 'Responsable support utilisateur',
    version: 'Version 1',
    review: 'Pédagogique',
    pathType: 'Métier',
    moduleCount: 8,
    summary: 'Accompagner les utilisateurs, diagnostiquer les incidents courants et documenter les solutions.',
    objectives: [
      'Structurer un diagnostic méthodique.',
      'Communiquer clairement avec un utilisateur non technique.'
    ],
    prerequisites: 'Connaissances de base en environnement bureautique et réseau.',
    pathModules: [
      { id: 'reseaux', title: '01 Comprendre les réseaux', version: 'v2', note: 'Voir le module', status: 'En cours' },
      { id: 'comptes', title: '02 Protéger ses comptes', version: 'v1', note: 'Voir le module', status: 'À commencer' }
    ]
  }
];

export interface CommunityReply {
  id: string;
  authorId: string;
  authorName: string;
  authorRole?: string;
  text: string;
  createdAt: string;
  helpfulBy: string[];
  linkedModuleId?: string;
  parentReplyId?: string;
  replyToName?: string;
}

export interface CommunityPost {
  id: string;
  kind: 'question' | 'publication';
  title: string;
  domain: 'Numérique' | 'Communication' | 'Gestion';
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  solutionReplyId?: string;
  followers: string[];
  helpfulBy?: string[];
  repostedBy?: string[];
  repostedFrom?: {
    postId: string;
    authorName: string;
    authorId: string;
    title: string;
    body: string;
    domain: 'Numérique' | 'Communication' | 'Gestion';
    kind: 'question' | 'publication';
  };
  repostNote?: string;
  replies: CommunityReply[];
}

export interface StudioContent {
  id: string;
  type: CatalogType;
  title: string;
  domain: 'Numérique' | 'Communication' | 'Gestion';
  version: string;
  pubStatus: 'Brouillon' | 'Publié';
  reviewStatus: 'Non soumise' | 'En revue' | 'À corriger' | 'Validée';
  audience: 'Membres autorisés' | 'Public' | 'Privé';
  duration: string;
  sources: string;
  sections: { id: string; title: string; body: string; keyPoints?: string[]; tip?: string }[];
  updatedAt: string;
  /** Quiz propre au contenu (chaque contenu porte son quiz). */
  quiz?: { prompt: string; options: string[]; correctIndex: number; explanation: string }[];
  /** Fiche illustrée pas à pas. */
  steps?: { caption: string; imageUrl?: string }[];
  /** Structuré avec l'aide de l'IA puis relu par l'auteur. */
  aiAssisted?: boolean;
  /** Auteur (nom affiché) ; absent sur les contenus d'origine : Kossi Agbo. */
  authorName?: string;
  /** Dernière modification (ms). */
  updatedAtMs?: number;
  /** Médias de la bibliothèque joints à ce contenu. */
  mediaIds?: string[];
  /** Modules d'un parcours, dans l'ordre conseillé (identifiants du catalogue). */
  pathModuleIds?: string[];
  /** Copie de la dernière version publiée : c'est elle que voient les apprenants. */
  published?: StudioPublishedSnapshot;
}

export type StudioPublishedSnapshot = Pick<
  StudioContent,
  'title' | 'domain' | 'duration' | 'sources' | 'sections' | 'quiz' | 'steps' | 'version' | 'audience' | 'mediaIds' | 'pathModuleIds'
>;

export interface StudioQuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  points: number;
}

export interface StudioMedia {
  id: string;
  filename: string;
  kind: 'Image' | 'Document' | 'Vidéo';
  state: 'Disponible' | 'En traitement' | 'Échec';
  usage: string;
  altText: string;
  source: string;
  rights: string;
  /** Poids lisible (« 240 Ko ») pour les fichiers importés. */
  sizeLabel?: string;
}

export interface NotificationItem {
  id: string;
  category: 'Relations' | 'Communauté' | 'Apprentissage' | 'Compte';
  actorId?: string;
  actorName?: string;
  actorInitials?: string;
  actorColor?: string;
  title: string;
  detail: string;
  date: string;
  read: boolean;
  targetPage: string;
  targetId?: string;
  /** Destinataire (personnage de démo). Absent : visible par tous. */
  recipientId?: string;
}

export function formatNotificationTimestamp(d: Date = new Date()): string {
  const day = d.getDate();
  const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  const month = months[d.getMonth()] || 'nov.';
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} · ${hours} h ${mins}`;
}

export interface ReportItem {
  id: string;
  targetLabel: string;
  reason: string;
  details: string;
  status: 'Reçu' | 'En cours d’examen' | 'Précisions demandées' | 'Clôturé';
  date: string;
  extraNote?: string;
}

export interface ModerationDossier {
  id: string;
  targetType: 'Échange' | 'Publication' | 'Commentaire' | 'Élément signalé';
  summary: string;
  status: 'À examiner' | 'En examen' | 'Précisions demandées' | 'Décision soumise';
  assignee: string | null;
  conflictDeclared: boolean;
  evidence: string;
  facts: string;
  decisionMeasure?: string;
  decisionDuration?: string;
  decisionRule?: string;
  internalReason?: string;
  publicMessage?: string;
}

export type AdminRoleName =
  | 'Super administrateur'
  | 'Administrateur'
  | 'Responsable de modération'
  | 'Modérateur'
  | 'Support'
  | 'Auditeur';

export const ADMIN_ROLES: AdminRoleName[] = [
  'Super administrateur',
  'Administrateur',
  'Responsable de modération',
  'Modérateur',
  'Support',
  'Auditeur'
];

export type AccountStatus =
  | 'pending_verification'
  | 'active'
  | 'restricted'
  | 'suspended'
  | 'deactivated'
  | 'deletion_pending';

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  institution: string;
  createdAt: string;
  status: AccountStatus;
  verified: boolean;
  roles: string[];
  lastActivity: string;
  sanctionsCount: number;
  reportsCount: number;
  openTicketsCount: number;
  exceptionalNote: string;
}

export interface RoleAssignmentRecord {
  id: string;
  targetUserId: string;
  targetName: string;
  role: AdminRoleName;
  scope: string;
  requester: string;
  secondApprover: string | null;
  justification: string;
  effectiveDate: string;
  expiresAt?: string;
  status: 'En attente d’approbation' | 'Actif' | 'Révoqué';
}

export interface FlaggedContentRecord {
  id: string;
  type: 'Ressource' | 'Module' | 'Parcours' | 'Publication' | 'Commentaire' | 'Média';
  title: string;
  author: string;
  version: string;
  reportCount: number;
  visibility: 'Accessible' | 'Masqué temporairement' | 'Retiré' | 'Modification demandée';
  lastActionAt: string;
  history: string[];
}

export interface ValidationRequestRecord {
  id: string;
  contentId: string;
  title: string;
  contentType: 'Ressource' | 'Module' | 'Parcours' | 'Fiche' | 'Quiz';
  author: string;
  domain: 'Numérique' | 'Communication' | 'Gestion';
  version: string;
  level: 'Revue communautaire' | 'Validation pédagogique' | 'Validation renforcée';
  validator: string;
  submittedAt: string;
  status: 'Soumise' | 'En examen' | 'À corriger' | 'Validée' | 'Refusée';
  decisionNote: string;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  scope: string;
  timestamp: string;
  result: 'Succès' | 'Refusé';
  justification: string;
  requestId: string;
}

export interface SupportTicketRecord {
  id: string;
  userName: string;
  userStatus: AccountStatus;
  category: 'Accès au compte' | 'Problème technique' | 'Contenu ou publication' | 'Demande de données' | 'Autre';
  subject: string;
  description: string;
  date: string;
  priority: 'Normale' | 'Haute';
  status: 'nouveau' | 'ouvert' | 'en attente' | 'résolu' | 'fermé';
  assignee: string;
  publicReply: string;
  internalNote: string;
}

export interface PlatformSettingChange {
  id: string;
  settingName: string;
  currentValue: string;
  proposedValue: string;
  justification: string;
  requester: string;
  approver: string | null;
  status: 'En attente d’approbation' | 'Appliqué';
}

export interface PlatformSettingsState {
  reportCategories: string[];
  moderationReasons: string[];
  sanctionDurations: string[];
  domains: string[];
  validationRuleNote: string;
  pendingChanges: PlatformSettingChange[];
}

export interface ExtendedDemoState {
  plannedIds: string[];
  posts: CommunityPost[];
  studioContents: StudioContent[];
  studioQuiz: {
    title: string;
    timeLimit: string;
    attemptsAllowed: number;
    passingScore: number;
    questions: StudioQuizQuestion[];
  };
  studioMedia: StudioMedia[];
  studioPathModules: { id: string; title: string; version: string; accessible: boolean }[];
  ocrDraft: {
    pagesCorrected: Record<number, string>;
    excludedPages: number[];
    aiStructureAccepted: boolean;
  };
  notifications: NotificationItem[];
  notifPrefs: {
    learning: boolean;
    social: boolean;
    community: boolean;
  };
  reports: ReportItem[];
  dossiers: ModerationDossier[];
  appeal: {
    submitted: boolean;
    explanation: string;
    status: 'Aucun' | 'Reçu' | 'En examen' | 'Accepté' | 'Rejeté';
    decisionNote?: string;
  };
  profileDetails: Record<string, {
    tagline: string;
    location?: string;
    verified?: boolean;
    bio: string;
    interests: string;
    profileVisibility: 'Membres' | 'Moi uniquement' | 'Public';
    xpVisibility: 'Moi uniquement' | 'Membres';
    contactPolicy: 'Personnes que je suis' | 'Membres autorisés' | 'Personne';
  }>;
  followingIds: Record<string, string[]>;
  moduleProgress: Record<string, Record<string, { lessons: number[]; answers: number[]; submitted: boolean }>>;
  requestMessages: Record<string, string>;
  appPrefs: {
    theme: 'Clair' | 'Sombre' | 'Système';
    language: 'Français';
    reducedMotion: boolean;
    contentLanguage?: 'Français' | 'Français & Anglais';
    autoplayVideos?: boolean;
    soundEffects?: boolean;
    preferredFeedView?: 'Contributions les plus pertinentes' | 'Plus récentes';
    photoVisibility?: 'Tous les membres' | 'Mes relations';
    /** Date (ms) de la demande d'archive de données, si faite. */
    dataExportRequestedAt?: number;
  };
  sessions: { id: string; label: string; current: boolean; lastSeen: string }[];
  sentRequests: { id: string; recipientName: string; firstMessage: string; status: 'En attente' | 'Annulée' }[];
  adminActiveRole: AdminRoleName;
  adminUsers: AdminUserRecord[];
  roleAssignments: RoleAssignmentRecord[];
  flaggedContents: FlaggedContentRecord[];
  validationRequests: ValidationRequestRecord[];
  auditLogs: AuditLogEntry[];
  supportTickets: SupportTicketRecord[];
  platformSettings: PlatformSettingsState;
}

const EXT_KEY = 'savoir-extended-v1';

/** Quiz d'origine du module « Comprendre les réseaux » (chaque contenu porte désormais son quiz). */
const SEED_NETWORK_QUIZ: NonNullable<StudioContent['quiz']> = [
  {
    prompt: 'À quoi sert une adresse IP sur un réseau local ?',
    options: ['Identifier une interface réseau', 'Augmenter la taille de l’écran', 'Remplacer le câble électrique'],
    correctIndex: 0,
    explanation: 'L’adresse IP permet d’identifier une interface et d’acheminer les échanges.'
  },
  {
    prompt: 'Quel équipement relie des réseaux IP distincts ?',
    options: ['Un routeur', 'Un clavier', 'Un écran'],
    correctIndex: 0,
    explanation: 'Le routeur permet de relier des réseaux IP. Revoir la section Les adresses IP.'
  }
];

export const initialExtendedState = (): ExtendedDemoState => ({
  plannedIds: ['comptes'],
  posts: [
    {
      id: 'post-1',
      kind: 'question',
      title: 'À quoi sert la passerelle par défaut ?',
      domain: 'Numérique',
      authorId: 'maya',
      authorName: 'Maya',
      body: 'J’ai compris le rôle de l’adresse IP sur un réseau local, mais pas celui de la passerelle. Comment joindre un autre réseau ?',
      createdAt: 'Aujourd’hui · 10 h 15',
      followers: ['afi'],
      helpfulBy: ['afi', 'kossi', 'nadege'],
      repostedBy: ['kossi'],
      replies: [
        {
          id: 'rep-1',
          authorId: 'afi',
          authorName: 'Afi Mensah',
          authorRole: 'Apprenante · Cybersécurité & Numérique',
          text: 'La passerelle est le point de sortie vers d’autres réseaux (comme Internet). C’est souvent votre routeur qui joue ce rôle.',
          createdAt: 'Aujourd’hui · 10 h 42',
          helpfulBy: ['kossi'],
          linkedModuleId: 'reseaux'
        },
        {
          id: 'rep-1-1',
          authorId: 'maya',
          authorName: 'Maya',
          authorRole: 'Apprenante · Réseaux & Systèmes',
          parentReplyId: 'rep-1',
          replyToName: 'Afi Mensah',
          text: 'Merci beaucoup Afi ! Je comprends mieux pourquoi l’adresse du routeur revient toujours dans les paramètres IP.',
          createdAt: 'Aujourd’hui · 10 h 51',
          helpfulBy: ['afi']
        },
        {
          id: 'rep-2',
          authorId: 'kossi',
          authorName: 'Kossi Agbo',
          authorRole: 'Créateur & Mentor · Réseaux & Sécurité',
          text: 'Retenez l’analogie de la porte d’entrée : les appareils du même bureau se parlent directement, mais pour sortir, tout passe par la passerelle.',
          createdAt: 'Aujourd’hui · 11 h 05',
          helpfulBy: ['afi']
        }
      ]
    },
    {
      id: 'post-2',
      kind: 'publication',
      title: 'Ma méthode pour réviser un module en 15 minutes',
      domain: 'Communication',
      authorId: 'sam',
      authorName: 'Sam',
      body: 'Je résume chaque section en trois points clés, puis je vérifie immédiatement ma compréhension avec un exemple concret avant de passer au quiz.',
      createdAt: 'Hier · 17 h 20',
      followers: [],
      helpfulBy: ['afi', 'kossi'],
      repostedBy: [],
      replies: [
        {
          id: 'rep-3',
          authorId: 'kossi',
          authorName: 'Kossi Agbo',
          authorRole: 'Créateur & Mentor · Réseaux & Sécurité',
          text: 'Très efficace ! Noter un exemple réel aide énormément à retenir les signaux de phishing.',
          createdAt: 'Hier · 18 h 10',
          helpfulBy: ['afi']
        }
      ]
    }
  ],
  studioContents: [
    {
      id: 'st-1',
      type: 'resource',
      title: 'Ma fiche de révision : Les repères du réseau',
      domain: 'Numérique',
      version: 'v1',
      pubStatus: 'Brouillon',
      reviewStatus: 'Non soumise',
      audience: 'Membres autorisés',
      duration: '5 min',
      sources: 'Support original du créateur · Licence pédagogique interne',
      updatedAt: 'Enregistré aujourd’hui',
      sections: [
        { id: 's1', title: 'Trois notions à retenir', body: 'Équipement, adresse IP et routeur : distinguer l’appareil de son adresse.' },
        { id: 's2', title: 'Exemple concret', body: 'Deux ordinateurs sur un même réseau local communiquent via le routeur.' }
      ]
    },
    {
      id: 'st-2',
      type: 'module',
      title: 'Comprendre les réseaux',
      domain: 'Numérique',
      version: 'v2',
      pubStatus: 'Publié',
      reviewStatus: 'Validée',
      audience: 'Membres autorisés',
      duration: '45 min',
      sources: 'Support original de Kossi Agbo',
      updatedAt: 'Publié · v2',
      sections: [
        { id: 'm1', title: '01 Introduction aux réseaux', body: 'Dans cette section, vous découvrirez les équipements qui permettent aux appareils de communiquer.' },
        { id: 'm2', title: '02 Les adresses IP', body: 'Une adresse IP identifie une interface sur un réseau IP.' },
        { id: 'm3', title: '03 Vérification', body: 'Quiz de 5 questions à choix unique.' }
      ],
      quiz: SEED_NETWORK_QUIZ
    },
    {
      id: 'st-3',
      type: 'resource',
      title: 'Les bases du réseau sans fil',
      domain: 'Numérique',
      version: 'v1',
      pubStatus: 'Brouillon',
      reviewStatus: 'À corriger',
      audience: 'Membres autorisés',
      duration: '',
      sources: 'À préciser',
      updatedAt: 'Retours de revue reçus',
      sections: [
        { id: 'w1', title: 'Points d’accès Wi-Fi', body: 'Compléter la partie sécurité WPA3 avant nouvelle soumission.' }
      ]
    }
  ],
  studioQuiz: {
    title: 'Vérifier ses acquis — Réseaux',
    timeLimit: 'Sans limite',
    attemptsAllowed: 2,
    passingScore: 4,
    questions: [
      {
        id: 'sq-1',
        prompt: 'À quoi sert une adresse IP sur un réseau local ?',
        options: ['Identifier une interface réseau', 'Augmenter la taille de l’écran', 'Remplacer le câble électrique'],
        correctIndex: 0,
        explanation: 'L’adresse IP permet d’identifier une interface et d’acheminer les échanges.',
        points: 1
      },
      {
        id: 'sq-2',
        prompt: 'Quel équipement relie des réseaux IP distincts ?',
        options: ['Un routeur', 'Un clavier', 'Un écran'],
        correctIndex: 0,
        explanation: 'Le routeur permet de relier des réseaux IP. Revoir la section Les adresses IP.',
        points: 1
      }
    ]
  },
  studioMedia: [
    {
      id: 'med-1',
      filename: 'schema-reseau.png',
      kind: 'Image',
      state: 'Disponible',
      usage: 'Utilisé dans 1 brouillon',
      altText: 'Schéma : deux réseaux reliés par un routeur',
      source: 'Illustration personnelle',
      rights: 'Création originale déclarée'
    },
    {
      id: 'med-2',
      filename: 'fiche-revision.pdf',
      kind: 'Document',
      state: 'Disponible',
      usage: 'Non utilisé',
      altText: 'Document de synthèse sur les équipements réseau',
      source: 'Support interne SAVOIR+',
      rights: 'Usage pédagogique autorisé'
    },
    {
      id: 'med-3',
      filename: 'explication.mp4',
      kind: 'Vidéo',
      state: 'En traitement',
      usage: 'Traitement en cours',
      altText: 'Courte explication vidéo',
      source: 'Enregistrement studio',
      rights: 'Création originale déclarée'
    },
    {
      id: 'med-4',
      filename: 'capture.png',
      kind: 'Image',
      state: 'Échec',
      usage: 'Import interrompu',
      altText: '',
      source: '',
      rights: ''
    }
  ],
  studioPathModules: [
    { id: 'phishing', title: 'Découvrir son environnement & vigilance', version: 'v2', accessible: true },
    { id: 'reseaux', title: 'Comprendre les réseaux', version: 'v2', accessible: true },
    { id: 'comptes', title: 'Protéger ses comptes', version: 'v1', accessible: false }
  ],
  ocrDraft: {
    pagesCorrected: {
      5: 'Une adresse IP identifie une interface sur un réseau. Le routeur transmet les paquets entre des réseaux distincts.'
    },
    excludedPages: [6],
    aiStructureAccepted: false
  },
  notifications: [
    {
      id: 'n0-bienvenue',
      category: 'Apprentissage',
      actorId: 'nadege',
      actorName: 'Nadège Koffi',
      actorInitials: 'NK',
      actorColor: 'mint',
      title: 'Bienvenue sur SAVOIR+',
      detail: 'Commencez par le module « Ne tombez plus dans le piège » : 3 sections, un atelier et un quiz.',
      date: '14 nov. 2026 · 08 h 30',
      read: false,
      targetPage: 'module-detail',
      targetId: 'phishing'
    },
    {
      id: 'n2',
      category: 'Communauté',
      actorId: 'kossi',
      actorName: 'Kossi Agbo',
      actorInitials: 'KA',
      actorColor: 'lavender',
      title: 'Nouvelle réponse dans une question d’entraide',
      detail: 'Question de Maya : À quoi sert la passerelle par défaut ?',
      date: '14 nov. 2026 · 11 h 05',
      read: false,
      targetPage: 'community-thread',
      targetId: 'post-1',
      recipientId: 'afi'
    },
    {
      id: 'n3',
      category: 'Compte',
      actorId: 'nadege',
      actorName: 'Nadège Koffi',
      actorInitials: 'NK',
      actorColor: 'mint',
      title: 'Votre signalement a été mis à jour',
      detail: 'Dossier SIG-2026-001 · Consultez les informations qui vous sont destinées.',
      date: '13 nov. 2026 · 17 h 30',
      read: true,
      targetPage: 'report',
      recipientId: 'afi'
    }
  ],
  notifPrefs: {
    learning: true,
    social: true,
    community: true
  },
  reports: [
    {
      id: 'SIG-2026-001',
      targetLabel: 'Échange de démonstration (2 messages sélectionnés)',
      reason: 'Harcèlement ou propos abusifs',
      details: 'Messages répétés hors du cadre d’entraide.',
      status: 'Précisions demandées',
      date: 'Aujourd’hui'
    }
  ],
  dossiers: [
    {
      id: 'SIG-2026-001',
      targetType: 'Échange',
      summary: 'Échange signalé · 2 messages sélectionnés',
      status: 'À examiner',
      assignee: null,
      conflictDeclared: false,
      evidence: 'Deux messages sélectionnés et leur contexte autorisé. Accès aux preuves journalisé. Aucun accès libre au reste des conversations.',
      facts: ''
    },
    {
      id: 'SIG-2026-002',
      targetType: 'Publication',
      summary: 'Publication signalée · Domaine Numérique',
      status: 'En examen',
      assignee: 'Modérateur A',
      conflictDeclared: false,
      evidence: 'Extrait figé de la publication communautaire (v1).',
      facts: 'Vérification de la source technique en cours.'
    },
    {
      id: 'SIG-2026-003',
      targetType: 'Commentaire',
      summary: 'Commentaire signalé · Précisions attendues',
      status: 'Précisions demandées',
      assignee: 'Modérateur B',
      conflictDeclared: false,
      evidence: 'Commentaire unique conservé avec horodatage.',
      facts: 'Demande de contexte complémentaire envoyée au déclarant.'
    }
  ],
  appeal: {
    submitted: false,
    explanation: '',
    status: 'Aucun',
    decisionNote: ''
  },
  profileDetails: {
    afi: {
      tagline: 'Apprenante | Cybersécurité & Numérique | Entraide communautaire',
      location: 'Lomé, Région Maritime',
      verified: true,
      bio: 'J’apprends à mieux comprendre le numérique et à partager mes découvertes.',
      interests: 'Numérique, Entraide, Cybersécurité',
      profileVisibility: 'Membres',
      xpVisibility: 'Moi uniquement',
      contactPolicy: 'Personnes que je suis'
    },
    kossi: {
      tagline: 'Administrateur Réseaux & Sécurité | Créateur & Mentor | Systèmes IT',
      location: 'Lomé, Région Maritime',
      verified: true,
      bio: 'Passionné de technologie. Toujours partant pour apprendre ensemble.',
      interests: 'Numérique, Réseaux, Partage de connaissances',
      profileVisibility: 'Membres',
      xpVisibility: 'Membres',
      contactPolicy: 'Membres autorisés'
    },
    nadege: {
      tagline: 'Modération & Gouvernance | Qualité pédagogique | Confiance numérique',
      location: 'Lomé, Région Maritime',
      verified: true,
      bio: 'Responsable de la gouvernance, de la validation des contenus et du traitement équitable des signalements.',
      interests: 'Gouvernance, Pédagogie, Sécurité numérique',
      profileVisibility: 'Membres',
      xpVisibility: 'Moi uniquement',
      contactPolicy: 'Membres autorisés'
    }
  },
  followingIds: {
    afi: ['kossi', 'maya'],
    kossi: ['afi'],
    nadege: ['kossi']
  },
  moduleProgress: {
    afi: {
      // Sections lues mais quiz non passé : terminer le module phishing fait franchir le niveau 2 en démo.
      reseaux: { lessons: [0, 1, 2], answers: [], submitted: false },
      comptes: { lessons: [], answers: [], submitted: false }
    },
    kossi: {
      reseaux: { lessons: [0, 1, 2], answers: [0, 1, 2], submitted: true },
      comptes: { lessons: [], answers: [], submitted: false }
    },
    nadege: {
      reseaux: { lessons: [], answers: [], submitted: false },
      comptes: { lessons: [], answers: [], submitted: false }
    }
  },
  requestMessages: {},
  appPrefs: {
    theme: 'Clair',
    language: 'Français',
    reducedMotion: false,
    contentLanguage: 'Français',
    autoplayVideos: true,
    soundEffects: true,
    preferredFeedView: 'Contributions les plus pertinentes',
    photoVisibility: 'Tous les membres'
  },
  sessions: [
    { id: 'sess-1', label: 'Navigateur sur cet appareil', current: true, lastSeen: 'Session actuelle' },
    { id: 'sess-2', label: 'Autre navigateur (Mobile)', current: false, lastSeen: 'Dernière activité : il y a 2 h' }
  ],
  sentRequests: [],
  adminActiveRole: 'Super administrateur',
  adminUsers: [
    {
      id: 'usr-afi',
      name: 'Afi Mensah',
      email: 'afi.mensah@exemple.test',
      institution: 'Lycée Numérique Lomé (démo)',
      createdAt: '12 oct. 2026',
      status: 'active',
      verified: true,
      roles: ['Apprenant'],
      lastActivity: 'Aujourd’hui · 14 h 10',
      sanctionsCount: 0,
      reportsCount: 0,
      openTicketsCount: 0,
      exceptionalNote: 'Compte de démonstration actif ; aucune restriction enregistrée.'
    },
    {
      id: 'usr-kossi',
      name: 'Kossi Agbo',
      email: 'kossi.agbo@exemple.test',
      institution: 'Université de Lomé (démo)',
      createdAt: '05 oct. 2026',
      status: 'active',
      verified: true,
      roles: ['Apprenant', 'Créateur habilité'],
      lastActivity: 'Aujourd’hui · 13 h 45',
      sanctionsCount: 0,
      reportsCount: 0,
      openTicketsCount: 1,
      exceptionalNote: 'Créateur habilité sur le domaine Numérique (périmètre démo).'
    },
    {
      id: 'usr-nadege',
      name: 'Nadège Koffi',
      email: 'nadege.koffi@exemple.test',
      institution: 'SAVOIR+ Gouvernance (démo)',
      createdAt: '01 oct. 2026',
      status: 'active',
      verified: true,
      roles: ['Administrateur', 'Responsable de modération', 'Validateur pédagogique'],
      lastActivity: 'Aujourd’hui · 14 h 25',
      sanctionsCount: 0,
      reportsCount: 0,
      openTicketsCount: 0,
      exceptionalNote: 'Responsable gouvernance et modération pour la démonstration.'
    },
    {
      id: 'usr-maya',
      name: 'Maya D.',
      email: 'maya.d@exemple.test',
      institution: 'Indépendant',
      createdAt: '09 nov. 2026',
      status: 'pending_verification',
      verified: false,
      roles: ['Apprenant (en attente)'],
      lastActivity: 'Hier · 19 h 02',
      sanctionsCount: 0,
      reportsCount: 0,
      openTicketsCount: 1,
      exceptionalNote: 'Lien de confirmation e-mail envoyé, en attente de validation.'
    },
    {
      id: 'usr-sam',
      name: 'Sam T.',
      email: 'sam.t@exemple.test',
      institution: 'Centre Formation Est',
      createdAt: '21 oct. 2026',
      status: 'restricted',
      verified: true,
      roles: ['Apprenant'],
      lastActivity: 'Aujourd’hui · 09 h 30',
      sanctionsCount: 1,
      reportsCount: 1,
      openTicketsCount: 0,
      exceptionalNote: 'Restriction d’envoi de messages de 24 h suite au dossier DEC-2026-001 ; recours disponible.'
    },
    {
      id: 'usr-yao',
      name: 'Yao K.',
      email: 'yao.k@exemple.test',
      institution: 'Indépendant',
      createdAt: '01 oct. 2026',
      status: 'suspended',
      verified: true,
      roles: ['Apprenant'],
      lastActivity: 'Il y a 3 jours',
      sanctionsCount: 2,
      reportsCount: 2,
      openTicketsCount: 0,
      exceptionalNote: 'Suspension temporaire de 7 jours ; session limitée ouverte uniquement pour le recours.'
    },
    {
      id: 'usr-nadia',
      name: 'Nadia B.',
      email: 'nadia.b@exemple.test',
      institution: 'Institut Tech',
      createdAt: '18 sept. 2026',
      status: 'deletion_pending',
      verified: true,
      roles: ['Apprenant'],
      lastActivity: 'Il y a 6 jours',
      sanctionsCount: 0,
      reportsCount: 0,
      openTicketsCount: 0,
      exceptionalNote: 'Demande de suppression personnelle en attente de traitement selon politique de conservation.'
    }
  ],
  roleAssignments: [
    {
      id: 'rol-1',
      targetUserId: 'usr-kossi',
      targetName: 'Kossi Agbo',
      role: 'Modérateur',
      scope: 'Communauté · Numérique',
      requester: 'Super admin démo',
      secondApprover: 'Responsable modération démo',
      justification: 'Traitement des signalements sur le domaine Numérique.',
      effectiveDate: '10 nov. 2026',
      expiresAt: '31 déc. 2026',
      status: 'Actif'
    },
    {
      id: 'rol-2',
      targetUserId: 'usr-afi',
      targetName: 'Afi Mensah',
      role: 'Support',
      scope: 'Tickets accès & compte',
      requester: 'Administrateur démo',
      secondApprover: null,
      justification: 'Assistance de premier niveau lors du pilote hackathon.',
      effectiveDate: '13 nov. 2026',
      status: 'En attente d’approbation'
    },
    {
      id: 'rol-3',
      targetUserId: 'usr-sam',
      targetName: 'Sam T.',
      role: 'Auditeur',
      scope: 'Journaux en lecture seule',
      requester: 'Super admin démo',
      secondApprover: 'Administrateur démo',
      justification: 'Revue périodique de conformité (lecture seule).',
      effectiveDate: '01 nov. 2026',
      status: 'Révoqué'
    }
  ],
  flaggedContents: [
    {
      id: 'cnt-1',
      type: 'Publication',
      title: 'Astuce rapide pour contourner une vérification',
      author: 'Sam T.',
      version: 'v1',
      reportCount: 2,
      visibility: 'Masqué temporairement',
      lastActionAt: 'Aujourd’hui · 11 h 20',
      history: ['v1 publiée par l’auteur', 'Masquage temporaire appliqué pendant l’examen SIG-2026-002']
    },
    {
      id: 'cnt-2',
      type: 'Ressource',
      title: 'Les bases du réseau sans fil',
      author: 'Kossi Agbo',
      version: 'v1',
      reportCount: 1,
      visibility: 'Modification demandée',
      lastActionAt: 'Hier · 16 h 05',
      history: ['v1 soumise', 'Modification demandée : préciser les sources WPA3 avant diffusion']
    },
    {
      id: 'cnt-3',
      type: 'Commentaire',
      title: 'Réponse sur la configuration routeur',
      author: 'Yao K.',
      version: 'v1',
      reportCount: 3,
      visibility: 'Retiré',
      lastActionAt: 'Il y a 2 jours',
      history: ['v1 publiée', 'Retrait appliqué (liens et recherche inclus) ; version originale conservée pour preuve']
    }
  ],
  validationRequests: [
    {
      id: 'VAL-2026-001',
      contentId: 'st-1',
      title: 'Ma fiche de révision : Les repères du réseau',
      contentType: 'Fiche',
      author: 'Kossi Agbo',
      domain: 'Numérique',
      version: 'v1',
      level: 'Validation pédagogique',
      validator: 'Kossi Agbo',
      submittedAt: 'Aujourd’hui · 09 h 15',
      status: 'En examen',
      decisionNote: ''
    },
    {
      id: 'VAL-2026-002',
      contentId: 'st-3',
      title: 'Les bases du réseau sans fil',
      contentType: 'Ressource',
      author: 'Kossi Agbo',
      domain: 'Numérique',
      version: 'v1',
      level: 'Revue communautaire',
      validator: 'Validateur externe',
      submittedAt: 'Hier · 15 h 40',
      status: 'À corriger',
      decisionNote: 'Préciser les sources de la section sécurité WPA3 avant validation.'
    },
    {
      id: 'VAL-2026-003',
      contentId: 'st-2',
      title: 'Comprendre les réseaux',
      contentType: 'Module',
      author: 'Kossi Agbo',
      domain: 'Numérique',
      version: 'v2',
      level: 'Validation renforcée',
      validator: 'Comité pédagogique',
      submittedAt: '08 nov. 2026',
      status: 'Validée',
      decisionNote: 'Objectifs, exemples et quiz v2 cohérents.'
    }
  ],
  auditLogs: [
    {
      id: 'AUD-101',
      actor: 'Modérateur A',
      action: 'Consultation preuve signalement',
      target: 'SIG-2026-001',
      scope: 'Modération · Échanges',
      timestamp: '13 nov. 2026 · 10 h 12',
      result: 'Succès',
      justification: 'Examen initial des 2 messages signalés.',
      requestId: 'req-9f2a1'
    },
    {
      id: 'AUD-102',
      actor: 'Super admin démo',
      action: 'Attribution rôle Modérateur',
      target: 'Kossi Agbo',
      scope: 'Communauté · Numérique',
      timestamp: '10 nov. 2026 · 14 h 30',
      result: 'Succès',
      justification: 'Double validation obtenue (Responsable modération démo).',
      requestId: 'req-8c4b0'
    },
    {
      id: 'AUD-103',
      actor: 'Opérateur Support',
      action: 'Accès refusé — conversation privée',
      target: 'Conv #afi-kossi',
      scope: 'Support',
      timestamp: '09 nov. 2026 · 18 h 05',
      result: 'Refusé',
      justification: 'Le rôle Support ne dispose pas d’un accès libre aux messages privés.',
      requestId: 'req-7d1e9'
    }
  ],
  supportTickets: [
    {
      id: 'SUP-001',
      userName: 'Maya D.',
      userStatus: 'pending_verification',
      category: 'Accès au compte',
      subject: 'Lien de vérification e-mail expiré',
      description: 'Je n’ai pas pu confirmer mon adresse dans le délai prévu lors de l’inscription.',
      date: 'Aujourd’hui · 11 h 00',
      priority: 'Haute',
      status: 'ouvert',
      assignee: 'Support Niveau 1',
      publicReply: 'Vous pouvez demander un nouveau lien depuis l’écran de vérification e-mail ; les liens précédents sont automatiquement invalidés.',
      internalNote: 'Vérifier uniquement l’état de vérification. Aucun contournement manuel d’adresse autorisé.'
    },
    {
      id: 'SUP-002',
      userName: 'Kossi Agbo',
      userStatus: 'active',
      category: 'Contenu ou publication',
      subject: 'Question sur la reprise après mise à jour v2',
      description: 'Un apprenant me demande si sa progression v1 reste visible après publication de la v2.',
      date: 'Hier · 17 h 45',
      priority: 'Normale',
      status: 'en attente',
      assignee: 'Support Pédagogique',
      publicReply: '',
      internalNote: 'Rappeler la politique de versions : l’historique acquis sur la v1 est conservé.'
    }
  ],
  platformSettings: {
    reportCategories: [
      'Désinformation',
      'Harcèlement',
      'Contenu haineux',
      'Spam',
      'Usurpation d’identité',
      'Exposition de données personnelles'
    ],
    moderationReasons: [
      'Envois répétés hors cadre',
      'Source technique non fiable',
      'Propos contraires aux règles d’entraide'
    ],
    sanctionDurations: ['24 heures', '7 jours', '30 jours'],
    domains: ['Numérique', 'Communication', 'Gestion'],
    validationRuleNote: 'Toute validation pédagogique porte sur une version précise et exclut l’auto-approbation et la validation par IA seule.',
    pendingChanges: [
      {
        id: 'SET-001',
        settingName: 'Seuil d’alerte signalements urgents',
        currentValue: '3 signalements distincts',
        proposedValue: '2 signalements distincts avec preuve média',
        justification: 'Accélérer la prise en charge des dossiers sensibles durant le pilote.',
        requester: 'Responsable de modération',
        approver: null,
        status: 'En attente d’approbation'
      }
    ]
  }
});

export function appendAuditLog(
  logs: AuditLogEntry[],
  entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'requestId'>
): AuditLogEntry[] {
  const now = new Date();
  const timestamp = `${now.toLocaleDateString('fr-FR')} · ${now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })}`;
  const next: AuditLogEntry = {
    id: `AUD-${100 + logs.length + 1}`,
    timestamp,
    requestId: `req-${Math.random().toString(36).slice(2, 7)}`,
    ...entry
  };
  return [next, ...logs];
}

export function readExtended(): ExtendedDemoState {
  try {
    const raw = localStorage.getItem(EXT_KEY);
    if (!raw) return initialExtendedState();
    const base = initialExtendedState();
    const parsed = JSON.parse(raw);
    return {
      ...base,
      ...parsed,
      appeal: { ...base.appeal, ...(parsed?.appeal || {}) },
      appPrefs: { ...base.appPrefs, ...(parsed?.appPrefs || {}) },
      notifPrefs: { ...base.notifPrefs, ...(parsed?.notifPrefs || {}) },
      profileDetails: {
        ...base.profileDetails,
        ...Object.fromEntries(
          Object.entries(parsed?.profileDetails || {}).map(([k, v]: [string, any]) => [
            k,
            { ...(base.profileDetails[k] || {}), ...(v || {}) }
          ])
        )
      },
      followingIds: { ...base.followingIds, ...(parsed?.followingIds || {}) },
      moduleProgress: { ...base.moduleProgress, ...(parsed?.moduleProgress || {}) },
      requestMessages: { ...base.requestMessages, ...(parsed?.requestMessages || {}) },
      platformSettings: { ...base.platformSettings, ...(parsed?.platformSettings || {}) },
      studioContents: (Array.isArray(parsed?.studioContents) ? parsed.studioContents : base.studioContents).map(
        (c: StudioContent) => (c.id === 'st-2' && !c.quiz ? { ...c, quiz: SEED_NETWORK_QUIZ } : c)
      )
    };
  } catch {
    return initialExtendedState();
  }
}

export function writeExtended(next: ExtendedDemoState) {
  localStorage.setItem(EXT_KEY, JSON.stringify(next));
}

const SNAPSHOT_KEYS = [
  'title',
  'domain',
  'duration',
  'sources',
  'sections',
  'quiz',
  'steps',
  'audience',
  'mediaIds',
  'pathModuleIds'
] as const;

/** Copie figée d'un contenu au moment de sa publication. */
export function studioSnapshot(c: StudioContent): StudioPublishedSnapshot {
  return JSON.parse(
    JSON.stringify({
      title: c.title,
      domain: c.domain,
      duration: c.duration,
      sources: c.sources,
      sections: c.sections,
      quiz: c.quiz,
      steps: c.steps,
      version: c.version,
      audience: c.audience,
      mediaIds: c.mediaIds,
      pathModuleIds: c.pathModuleIds
    })
  );
}

/** Ce que voient les apprenants : la dernière version publiée, pas le brouillon en cours. */
export function publishedView(c: StudioContent): StudioContent {
  const p = c.published;
  if (!p) return c;
  return {
    ...c,
    title: p.title,
    domain: p.domain,
    duration: p.duration,
    sources: p.sources,
    sections: p.sections,
    quiz: p.quiz,
    steps: p.steps,
    version: p.version,
    audience: p.audience,
    mediaIds: p.mediaIds,
    pathModuleIds: p.pathModuleIds
  };
}

/** Vrai si un contenu publié a été modifié depuis sa dernière publication. */
export function hasUnpublishedChanges(c: StudioContent): boolean {
  if (c.pubStatus !== 'Publié' || !c.published) return false;
  const pick = (x: Partial<StudioContent>) => JSON.stringify(SNAPSHOT_KEYS.map((k) => x[k] ?? null));
  return pick(c) !== pick(c.published);
}

/** « v2 » → « v3 ». */
export function nextStudioVersion(version: string): string {
  const n = parseInt((version || '').replace(/\D/g, ''), 10);
  return `v${(Number.isFinite(n) ? n : 1) + 1}`;
}

export function buildDynamicCatalog(ext: ExtendedDemoState): CatalogItem[] {
  const base = CATALOG_ITEMS.map((item) => ({ ...item }));
  const publishedStudio = ext.studioContents.filter((s) => s.pubStatus === 'Publié').map(publishedView);

  for (const s of publishedStudio) {
    if (s.id === 'st-2') {
      const idx = base.findIndex((b) => b.id === 'reseaux');
      if (idx >= 0) {
        base[idx] = {
          ...base[idx],
          title: s.title,
          domain: s.domain,
          version: s.version,
          duration: s.duration || base[idx].duration,
          review: s.reviewStatus === 'Validée' ? 'Pédagogique' : 'Communautaire',
          summary: s.sections[0]?.body || base[idx].summary
        };
      }
      continue;
    }

    const mappedId = s.id === 'st-1' ? 'fiche-reseau' : s.id;
    const existingIdx = base.findIndex((b) => b.id === mappedId);
    const reviewLevel: ReviewLevel = s.reviewStatus === 'Validée' ? 'Pédagogique' : 'Communautaire';

    const dynamicEntry: CatalogItem = {
      id: mappedId,
      type: s.type,
      title: s.title,
      domain: s.domain,
      level: 'Débutant',
      duration: s.duration || '5 min',
      author: s.authorName || 'Kossi Agbo',
      authorRole: 'Créateur & Mentor · Studio pédagogique',
      version: s.version || 'v1',
      review: reviewLevel,
      interactive: s.type === 'module',
      xpReward: s.type === 'module' ? 150 : undefined,
      summary: s.sections[0]?.body || 'Contenu publié depuis le Studio SAVOIR+.',
      objectives: s.sections.some((sec) => sec.keyPoints?.length)
        ? s.sections.map((sec) => sec.keyPoints?.[0]).filter((k): k is string => Boolean(k)).slice(0, 3)
        : ['Comprendre et appliquer les notions clés présentées dans ce contenu.'],
      prerequisites: s.sources ? `Source déclarée : ${s.sources}` : 'Aucun prérequis bloquant.',
      resourceFormat: s.type === 'resource' ? 'Fiche' : undefined,
      resourceBody:
        s.type === 'resource'
          ? s.sections.map((sec) => ({ heading: sec.title, text: sec.body }))
          : undefined,
      sections:
        s.type === 'module'
          ? s.sections.map((sec, idx) => ({
              title: `0${idx + 1} ${sec.title}`,
              subtitle: `Section Studio · ${s.duration || '5 min'}`
            }))
          : undefined,
      pathType: s.type === 'path' ? 'Compétence' : undefined,
      moduleCount: s.type === 'path' ? (s.pathModuleIds || []).length : undefined,
      pathModules:
        s.type === 'path'
          ? (s.pathModuleIds || []).flatMap((id) => {
              const m = base.find((b) => b.id === id);
              return m ? [{ id: m.id, title: m.title, version: m.version, note: m.duration, status: 'À commencer' as const }] : [];
            })
          : undefined
    };

    if (existingIdx >= 0) {
      base[existingIdx] = { ...base[existingIdx], ...dynamicEntry };
    } else {
      base.unshift(dynamicEntry);
    }
  }

  return base;
}

/** Notifications visibles par un personnage : les siennes et celles sans destinataire. */
/** Catégorie d'alerte → préférence (Préférences › Notifications). « Compte » est toujours envoyé. */
const NOTIF_PREF_KEY: Partial<Record<NotificationItem['category'], 'learning' | 'social' | 'community'>> = {
  Apprentissage: 'learning',
  Relations: 'social',
  Communauté: 'community'
};

export function notificationsFor(
  list: NotificationItem[],
  uid: string,
  prefs?: { learning?: boolean; social?: boolean; community?: boolean }
): NotificationItem[] {
  return list.filter((n) => {
    if (n.recipientId && n.recipientId !== uid) return false;
    const key = NOTIF_PREF_KEY[n.category];
    return !prefs || !key || prefs[key] !== false;
  });
}
