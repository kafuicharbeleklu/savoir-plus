/** Pictogrammes des illustrations de leçon (bandeau, schémas). */
export type LessonArt =
  | 'alert'
  | 'search'
  | 'shield'
  | 'devices'
  | 'laptop'
  | 'switch'
  | 'router'
  | 'globe'
  | 'server'
  | 'route'
  | 'key'
  | 'phone'
  | 'sessions'
  | 'mail'
  | 'list'
  | 'send'
  | 'wallet'
  | 'chart'
  | 'calendar'
  | 'drive'
  | 'cloud'
  | 'restore'
  | 'people'
  | 'agenda'
  | 'done';

/** Un message reçu (SMS, e-mail), montré comme il apparaît à l'écran. */
export interface LessonMessageFigure {
  kind: 'message';
  channel: 'sms' | 'email';
  /** Le nom affiché de l'expéditeur. */
  from: string;
  /** Lignes d'en-tête : adresse réelle, objet… */
  details?: { label: string; value: string }[];
  /** Le texte du message ; **le gras** y surligne les passages à remarquer. */
  body: string[];
}

/** Une situation racontée moment après moment. */
export interface LessonTimelineFigure {
  kind: 'timeline';
  steps: string[];
}

/** Un tableau : une ligne d'en-tête, puis les lignes. */
export interface LessonTableFigure {
  kind: 'table';
  head: string[];
  rows: string[][];
}

/** Un schéma en chaîne : des éléments reliés par des flèches ; `links[i]` nomme la flèche qui suit `nodes[i]`. */
export interface LessonFlowFigure {
  kind: 'flow';
  nodes: { art: LessonArt; label: string; sub?: string }[];
  links: string[];
}

/** Un tout découpé en parts (des pourcentages qui font 100). */
export interface LessonSplitFigure {
  kind: 'split';
  parts: { label: string; percent: number; note: string }[];
}

/**
 * Une figure de géométrie, décrite par ses points et ses traits. Les coordonnées sont celles du dessin :
 * x vers la droite, y vers le bas, dans un cadre de `width` × `height` (environ 320 × 220).
 */
export interface LessonGeometryFigure {
  kind: 'geometry';
  width: number;
  height: number;
  /** Les points nommés ; `labelAt` dit de quel côté écrire le nom (nord, sud-est…). */
  points: { id: string; x: number; y: number; label?: string; labelAt?: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' }[];
  /**
   * Les traits entre deux points. `line` prolonge le trait des deux côtés (une droite), `ray` seulement
   * au-delà du second point (une demi-droite) ; `tone` le met en couleur.
   */
  segments: { from: string; to: string; tone?: 'ink' | 'accent' | 'warm'; dashed?: boolean; line?: boolean; ray?: boolean; label?: string }[];
  /** Surfaces teintées (un triangle mis en avant). */
  polygons?: { points: string[]; tone?: 'accent' | 'warm' }[];
  /** Cercles : centre et rayon, dans les unités du dessin. */
  circles?: { center: string; radius: number; tone?: 'ink' | 'accent' | 'warm' }[];
  /** Angles droits à marquer : le sommet, puis un point sur chaque côté. */
  rightAngles?: { at: string; from: string; to: string }[];
}

/** Une ou plusieurs fractions dessinées : un disque ou une barre partagés en parts égales, certaines coloriées. */
export interface LessonFractionFigure {
  kind: 'fraction';
  shape: 'disc' | 'bar';
  items: { parts: number; taken: number; label: string }[];
}

/** Une image (photo, dessin, schéma importé), avec son texte de remplacement et son crédit. */
export interface LessonImageFigure {
  kind: 'image';
  src: string;
  alt: string;
  credit?: string;
}

export type LessonFigure =
  | LessonMessageFigure
  | LessonTimelineFigure
  | LessonTableFigure
  | LessonFlowFigure
  | LessonSplitFigure
  | LessonGeometryFigure
  | LessonFractionFigure
  | LessonImageFigure;

/**
 * Une leçon rédigée est une partie du module, qui se lit d'un trait : une entrée en matière, le
 * cours en sous-parties titrées, un exemple illustré par une figure légendée, la question que se
 * pose l'élève, puis le résumé (`points`) et le réflexe à garder (`tip`).
 * Les textes acceptent **le gras**.
 */
export interface LessonRich {
  /** Le pictogramme de la partie (celui de la première sert au bandeau du module). */
  art: LessonArt;
  /** L'entrée en matière : une situation concrète, en un court paragraphe. */
  scene: string;
  /** Le cours : des parties titrées, faites de paragraphes et, au besoin, d'une liste. */
  sections: { title: string; text: string[]; items?: string[]; ordered?: boolean; after?: string }[];
  /** L'exemple : une partie à part, avec sa figure, sa légende et ce qu'il faut y voir. */
  example: { title: string; intro?: string; figure: LessonFigure; caption: string; notes: string[] };
  /** La question que se pose l'élève, et la réponse. */
  question: { ask: string; answer: string[] };
}

export interface StudyLesson {
  title: string;
  label: string;
  minutes: string;
  intro: string;
  /** Paragraphe unique des contenus créés dans le Studio ; une leçon rédigée déroule `rich.sections` à la place. */
  body: string;
  points: string[];
  tip: string;
  /** Présent : la leçon est rédigée, avec exemple et question. */
  rich?: LessonRich;
}

export interface StudyQuestion {
  text: string;
  answers: string[];
  correctIndex: number;
  explanation: string;
}

export interface ModuleStudyContent {
  id: string;
  title: string;
  quizTitle: string;
  labType: 'phishing' | 'reseaux' | 'comptes' | 'generic';
  /** « À la fin de ce module, vous saurez : » — trois objectifs, à l'infinitif. */
  goals?: string[];
  lessons: StudyLesson[];
  questions: StudyQuestion[];
  /** Fiche illustrée pas à pas (contenus créés avec le Studio IA). */
  steps?: { caption: string; imageUrl?: string }[];
  /** Contenu structuré avec l'aide de l'IA puis relu par son auteur. */
  aiAssisted?: boolean;
  /** Rang du niveau du module (1 Initiation … 5 Expert) : il règle les XP. Absent : 2 (Débutant). */
  levelRank?: number;
  /** Classe d'un cours scolaire (CM2, 3e…) : elle règle la taille du texte dans le lecteur. */
  classLabel?: string;
}

/** Forme minimale d'un contenu du Studio utilisée par le lecteur (voir StudioContent). */
export interface StudioStudySource {
  id: string;
  title: string;
  domain: string;
  duration?: string;
  sources?: string;
  sections: { id: string; title: string; body: string; keyPoints?: string[]; tip?: string }[];
  quiz?: { prompt: string; options: string[]; correctIndex: number; explanation: string }[];
  steps?: { caption: string; imageUrl?: string }[];
  aiAssisted?: boolean;
  /** Dernière version publiée : c'est elle que lisent les apprenants. */
  published?: Partial<Omit<StudioStudySource, 'id' | 'published' | 'aiAssisted'>>;
}

import { EXTRA_MODULES_CONTENT } from './seedCatalog';
import { SCHOOL_MODULES_CONTENT } from './schoolCourses';
import { LESSONS_RICH, MODULE_GOALS } from './lessonsRich';

export const MODULES_CONTENT: Record<string, ModuleStudyContent> = {
  phishing: {
    id: 'phishing',
    title: 'Ne tombez plus dans le piège',
    quizTitle: 'Vérifier vos acquis sur le phishing',
    labType: 'phishing',
    lessons: [
      {
        title: 'Reconnaître les signaux',
        label: 'Observer avant de cliquer',
        minutes: '3 min',
        intro: 'Un e-mail inquiétant n’est pas forcément un e-mail urgent. Prenez quelques secondes pour regarder ce qu’il vous demande vraiment.',
        body: 'Le phishing cherche à vous faire agir sans réfléchir : communiquer un mot de passe, ouvrir une pièce jointe ou payer une facture. L’urgence, une menace et une récompense inhabituelle sont des signaux à examiner.',
        points: [
          'Un message de phishing cherche à vous faire agir avant de réfléchir.',
          'Trois signaux le trahissent : la pression, la demande sensible, l’action inattendue.',
          'Un seul de ces signaux suffit pour s’arrêter et vérifier.'
        ],
        tip: 'Faites une pause. L’urgence du message ne doit pas devenir la vôtre.'
      },
      {
        title: 'Vérifier la source',
        label: 'Regarder derrière le nom',
        minutes: '4 min',
        intro: 'Le nom affiché peut être familier. L’adresse réelle et la destination du lien racontent parfois une autre histoire.',
        body: 'Inspectez l’adresse complète. Sur ordinateur, survolez le lien pour voir sa destination ; sur mobile, évitez de l’ouvrir si vous avez un doute.',
        points: [
          'Un nom affiché comme « Service Sécurité » ne prouve rien : lisez l’adresse complète et la vraie destination du lien.',
          'Un cadenas HTTPS ne prouve pas qu’un site est honnête.',
          'Retrouvez le service en ouvrant son application ou son adresse habituelle.'
        ],
        tip: 'Vérifiez une demande par un canal que vous connaissez déjà, jamais par le lien ou le numéro fournis dans le message.'
      },
      {
        title: 'Adopter les bons réflexes',
        label: 'Protéger et partager',
        minutes: '3 min',
        intro: 'Vous n’avez pas besoin d’être expert pour agir correctement. Quelques réflexes simples font la différence.',
        body: 'Ne répondez pas au message suspect et ne transmettez aucun code. Au travail, signalez-le par le canal prévu. Si vous avez communiqué un secret, contactez rapidement le support légitime et sécurisez le compte concerné.',
        points: [
          'Ne demandez pas à vos contacts de cliquer sur un lien suspect.',
          'Signalez le message à votre équipe informatique ou au service concerné.',
          'Activez un facteur supplémentaire quand le service le permet.'
        ],
        tip: 'Vous avez un doute ? Demander de l’aide est un bon réflexe, pas un aveu de faiblesse.'
      }
    ],
    questions: [
      {
        text: 'Un e-mail menace de fermer votre compte dans une heure. Quel est le meilleur premier réflexe ?',
        answers: [
          'Cliquer immédiatement pour éviter la fermeture.',
          'Ouvrir le service par son application habituelle pour vérifier.',
          'Répondre avec son mot de passe.'
        ],
        correctIndex: 1,
        explanation: 'Vérifiez la demande par un canal indépendant et connu, sans utiliser le lien reçu.'
      },
      {
        text: 'Le petit cadenas HTTPS signifie que…',
        answers: [
          'Le site est forcément officiel.',
          'Tous les messages du site sont fiables.',
          'La connexion est chiffrée, mais le site peut être trompeur.'
        ],
        correctIndex: 2,
        explanation: 'HTTPS protège le transport des données. Il ne garantit pas l’honnêteté du site.'
      },
      {
        text: 'Vous avez communiqué un code à un interlocuteur suspect. Que faire ?',
        answers: [
          'Contacter le support légitime et sécuriser rapidement le compte.',
          'Attendre que le problème disparaisse.',
          'Envoyer un second code pour annuler le premier.'
        ],
        correctIndex: 0,
        explanation: 'Agissez rapidement par les canaux officiels et suivez la procédure de récupération du service.'
      }
    ]
  },
  reseaux: {
    id: 'reseaux',
    title: 'Comprendre les réseaux',
    quizTitle: 'Vérifier vos acquis sur les réseaux',
    labType: 'reseaux',
    lessons: [
      {
        title: 'Les équipements réseau',
        label: 'Identifier les rôles',
        minutes: '15 min',
        intro: 'Un réseau relie des appareils entre eux et vers l’extérieur grâce à des équipements aux rôles précis.',
        body: 'Sur un réseau local (bureau, école, domicile), les postes se connectent au commutateur (switch) ou au point d’accès Wi-Fi. Le routeur assure le passage vers d’autres réseaux comme Internet.',
        points: [
          'Un poste client ou serveur consomme ou fournit un service réseau.',
          'Le commutateur relie plusieurs appareils sur un même réseau local.',
          'Le routeur interconnecte des réseaux distincts et joue le rôle de passerelle.'
        ],
        tip: 'Distinguez toujours l’équipement qui relie en local (switch) de celui qui oriente vers l’extérieur (routeur).'
      },
      {
        title: 'Les adresses IP et la passerelle',
        label: 'Acheminer un paquet',
        minutes: '15 min',
        intro: 'Chaque interface réseau possède une adresse IP pour recevoir et émettre des données sans confusion.',
        body: 'Sur un réseau local IPv4 comme 192.168.1.0/24, deux appareils du même sous-réseau dialoguent directement. Pour joindre une adresse distante, ils envoient le paquet à la passerelle par défaut.',
        points: [
          'L’adresse IP identifie une interface, pas nécessairement une personne.',
          'Le masque détermine si le destinataire est local ou distant.',
          'La passerelle par défaut est l’adresse du routeur sur votre réseau local.'
        ],
        tip: 'En cas de panne réseau, vérifiez d’abord votre IP locale puis l’accès à la passerelle.'
      },
      {
        title: 'Décrire un échange simple',
        label: 'DNS, requête et réponse',
        minutes: '15 min',
        intro: 'Avant de charger une page web, votre appareil traduit le nom de domaine en adresse IP.',
        body: 'Le système DNS associe un nom lisible (exemple.edu) à une adresse IP. Le navigateur ouvre ensuite une connexion chiffrée vers le serveur ciblé via le routeur.',
        points: [
          'Le DNS résout le nom de domaine en adresse IP exploitable.',
          'Un échange suit une route aller puis une route retour.',
          'Connaître ces étapes aide à isoler une panne DNS d’une coupure physique.'
        ],
        tip: 'Si un site par nom échoue alors que votre réseau local répond, pensez à vérifier la résolution DNS.'
      }
    ],
    questions: [
      {
        text: 'Quel équipement relie deux réseaux IP distincts ?',
        answers: ['Le routeur (passerelle)', 'Le câble d’alimentation', 'L’imprimante USB'],
        correctIndex: 0,
        explanation: 'Le routeur sert de passerelle pour acheminer les paquets entre deux réseaux distincts.'
      },
      {
        text: 'À quoi sert principalement le service DNS lors de la navigation ?',
        answers: [
          'À compresser les images de la page.',
          'À traduire un nom de domaine en adresse IP.',
          'À remplacer le mot de passe utilisateur.'
        ],
        correctIndex: 1,
        explanation: 'Le DNS fait correspondre un nom de domaine lisible à une adresse IP réseau.'
      },
      {
        text: 'Deux postes sont dans le même réseau local 192.168.1.0/24. Comment communiquent-ils ?',
        answers: [
          'Uniquement après redémarrage du fournisseur Internet.',
          'En envoyant le mot de passe par e-mail.',
          'Directement sur le réseau local sans passer par un routeur distant.'
        ],
        correctIndex: 2,
        explanation: 'Sur un même sous-réseau local, les interfaces dialoguent directement via le commutateur.'
      }
    ]
  },
  comptes: {
    id: 'comptes',
    title: 'Protéger ses comptes',
    quizTitle: 'Vérifier vos acquis sur la protection des comptes',
    labType: 'comptes',
    lessons: [
      {
        title: 'Mots de passe robustes',
        label: 'Longueur et unicité',
        minutes: '8 min',
        intro: 'Un mot de passe réutilisé expose tous vos services dès qu’un seul site subit une fuite de données.',
        body: 'Privilégiez des phrases secrètes longues et uniques par service important (messagerie, banque, formation). Un gestionnaire de mots de passe mémorise ces secrets à votre place.',
        points: [
          'Ne réutilisez jamais le mot de passe de votre messagerie principale.',
          'La longueur (12+ caractères variés ou phrase secrète) prime sur les astuces prévisibles.',
          'Évitez les informations personnelles faciles à deviner.'
        ],
        tip: 'Sécurisez en priorité votre messagerie principale : elle permet souvent de réinitialiser les autres comptes.'
      },
      {
        title: 'Double authentification (2FA)',
        label: 'Ajouter une barrière',
        minutes: '10 min',
        intro: 'Même si votre mot de passe est divulgué, un second facteur bloque l’ouverture non autorisée.',
        body: 'Une application d’authentification (code temporaire) ou une clé physique offre une protection bien supérieure au simple mot de passe. Conservez vos codes de secours hors ligne.',
        points: [
          'Activez la double authentification sur vos comptes sensibles.',
          'Préférez une application dédiée au SMS lorsque c’est proposé.',
          'Rangez vos codes de récupération dans un endroit sûr.'
        ],
        tip: 'Ne validez jamais une notification d’authentification que vous n’avez pas déclenchée vous-même.'
      },
      {
        title: 'Sessions actives et révocation',
        label: 'Garder le contrôle',
        minutes: '7 min',
        intro: 'Un appareil emprunté ou oublié connecté reste une porte ouverte tant que la session n’est pas fermée.',
        body: 'Vérifiez régulièrement la liste des sessions actives dans les paramètres de sécurité. Révoquez immédiatement tout navigateur inconnu et changez votre secret en cas de doute.',
        points: [
          'Sur un poste partagé, utilisez une fenêtre privée et déconnectez-vous.',
          'Révoquez les anciennes sessions après un changement de mot de passe.',
          'Contrôlez les adresses et appareils rattachés à votre compte.'
        ],
        tip: 'La révocation d’une session coupe l’accès sur les appareils oubliés sans fermer votre session en cours.'
      }
    ],
    questions: [
      {
        text: 'Pourquoi faut-il un mot de passe unique pour chaque service important ?',
        answers: [
          'Pour éviter qu’une fuite sur un site ne compromette tous vos autres comptes.',
          'Pour accélérer la connexion Wi-Fi.',
          'Pour augmenter le niveau XP automatiquement.'
        ],
        correctIndex: 0,
        explanation: 'L’unicité empêche l’effet domino lorsqu’un service tiers subit une fuite de données.'
      },
      {
        text: 'Vous recevez une demande de validation 2FA sans avoir tenté de vous connecter. Que faire ?',
        answers: [
          'Accepter pour faire disparaître l’alerte.',
          'Refuser la demande, changer le mot de passe et vérifier les sessions actives.',
          'Partager le code dans un message privé.'
        ],
        correctIndex: 1,
        explanation: 'Refusez immédiatement, changez votre mot de passe et révoquez toute session suspecte.'
      },
      {
        text: 'Après avoir utilisé un ordinateur public, quel réflexe protège votre compte ?',
        answers: [
          'Fermer simplement l’écran sans se déconnecter.',
          'Enregistrer le mot de passe dans le navigateur.',
          'Se déconnecter et révoquer la session depuis vos paramètres si besoin.'
        ],
        correctIndex: 2,
        explanation: 'Déconnectez-vous explicitement et révoquez la session côté serveur depuis votre appareil habituel.'
      }
    ]
  },
  ...EXTRA_MODULES_CONTENT,
  ...SCHOOL_MODULES_CONTENT
};

// Les leçons rédigées au format complet reçoivent leur contenu enrichi, section par section.
for (const [moduleId, richLessons] of Object.entries(LESSONS_RICH)) {
  MODULES_CONTENT[moduleId]?.lessons.forEach((lesson, index) => {
    if (richLessons[index]) lesson.rich = richLessons[index];
  });
}
for (const [moduleId, goals] of Object.entries(MODULE_GOALS)) {
  if (MODULES_CONTENT[moduleId]) MODULES_CONTENT[moduleId].goals = goals;
}

export const lessons = MODULES_CONTENT.phishing.lessons;
export const questions = MODULES_CONTENT.phishing.questions;

export function resolveStudyContent(moduleId: string, studioContents?: StudioStudySource[], studioQuiz?: { title: string; questions: { prompt: string; options: string[]; correctIndex: number; explanation: string }[] }): ModuleStudyContent {
  if (MODULES_CONTENT[moduleId]) return MODULES_CONTENT[moduleId];
  const rawStudio = studioContents?.find((s) => s.id === moduleId);
  // Les apprenants lisent la version publiée, pas le brouillon en cours de modification.
  const fromStudio = rawStudio?.published ? { ...rawStudio, ...rawStudio.published } : rawStudio;
  if (fromStudio) {
    const studioSections = (fromStudio.sections.length ? fromStudio.sections : [{ id: 's1', title: 'Introduction', body: 'Contenu publié depuis le Studio.' }]);
    const totalMinutes = parseInt(fromStudio.duration || '', 10);
    const sectionMinutes = Number.isFinite(totalMinutes)
      ? `${Math.max(2, Math.round(totalMinutes / Math.max(1, studioSections.length)))} min`
      : '5 min';
    const mappedLessons: StudyLesson[] = studioSections.map((sec, idx) => {
      // Introduction = première phrase ; corps = le reste (évite d'afficher deux fois le même paragraphe).
      const text = (sec.body || '').trim();
      const cut = text.search(/[.!?…](\s|$)/);
      const intro = cut >= 0 ? text.slice(0, cut + 1) : text;
      const rest = cut >= 0 ? text.slice(cut + 1).trim() : '';
      const sourceNote = idx === 0 && fromStudio.sources ? `Source déclarée : ${fromStudio.sources}` : '';
      return {
      title: sec.title || `Section 0${idx + 1}`,
      label: `Domaine ${fromStudio.domain}`,
      minutes: sectionMinutes,
      intro: intro || 'Contenu pédagogique structuré.',
      body: [rest, sourceNote].filter(Boolean).join(' · '),
      points: sec.keyPoints?.length
        ? sec.keyPoints
        : [
            `Point clé issu de « ${sec.title || 'cette section'} »`,
            'Vérifiez votre compréhension avant de passer à l’étape suivante.'
          ],
      tip: sec.tip || 'Relisez les notions clés ou posez une question dans la Communauté en cas de blocage.'
      };
    });
    // Un contenu qui porte son propre quiz (Studio IA) l'utilise ; sinon, quiz partagé du Studio.
    const ownQuiz = fromStudio.quiz?.filter((q) => q.prompt && q.options.length >= 2) || [];
    const mappedQuestions: StudyQuestion[] = ownQuiz.length
      ? ownQuiz.map((q) => ({
          text: q.prompt,
          answers: q.options,
          correctIndex: Math.min(Math.max(q.correctIndex, 0), q.options.length - 1),
          explanation: q.explanation || 'Correction enregistrée par le créateur du module.'
        }))
      : studioQuiz && studioQuiz.questions.length >= 1
        ? studioQuiz.questions.map((q) => ({
            text: q.prompt,
            answers: q.options.length >= 2 ? q.options : ['Réponse A', 'Réponse B'],
            correctIndex: q.correctIndex,
            explanation: q.explanation || 'Correction enregistrée par le créateur du module.'
          }))
        : MODULES_CONTENT.reseaux.questions;
    return {
      id: fromStudio.id,
      title: fromStudio.title,
      quizTitle: studioQuiz?.title || `Évaluation — ${fromStudio.title}`,
      labType: 'generic',
      lessons: mappedLessons,
      questions: mappedQuestions,
      steps: fromStudio.steps?.filter((s) => s.caption),
      aiAssisted: fromStudio.aiAssisted
    };
  }
  return MODULES_CONTENT.phishing;
}

/** Corrigé du quiz d'un module intégré (les contenus du Studio passent par resolveStudyContent). */
export function builtInAnswerKey(moduleId: string): number[] | undefined {
  return MODULES_CONTENT[moduleId]?.questions.map((q) => q.correctIndex);
}
