/**
 * Données de simulation complémentaires de la communauté : nouveaux membres, publications
 * de formats variés (texte, image, vidéo, module partagé), abonnements et progressions.
 * Tout est fictif ; les vidéos sont des séquences d'illustration libres de droits.
 */
import type { CommunityPost } from './wireframeData';

const PEXELS = 'https://videos.pexels.com/video-files';

/** Publications du jour, placées en tête du fil. */
export const SEED_POSTS_RECENT: CommunityPost[] = [
  {
    id: 'post-ama-atelier',
    kind: 'publication',
    title: 'Réviser à deux : ce que l’atelier d’hier m’a appris',
    domain: 'Communication',
    authorId: 'ama',
    authorName: 'Ama Dossou',
    body:
      'Hier, nous avons testé la révision en binôme pendant l’atelier.\n\n' +
      '• L’un explique la notion à voix haute, **sans notes**.\n' +
      '• L’autre pose une seule question : « Et concrètement ? »\n' +
      '• On échange les rôles au bout de dix minutes.\n\n' +
      'Résultat : les points flous apparaissent tout de suite. (Vidéo d’illustration.)',
    createdAt: 'Aujourd’hui · 15 h 40',
    media: {
      kind: 'video',
      src: `${PEXELS}/9198355/9198355-sd_960_540_25fps.mp4`,
      alt: 'Deux personnes révisent ensemble devant un ordinateur portable, un livre ouvert à la main.',
      credit: 'Vidéo d’illustration : Mikhail Nilov · Pexels'
    },
    followers: ['afi', 'ines'],
    helpfulBy: ['afi', 'kossi', 'ines', 'sam'],
    repostedBy: [],
    replies: [
      {
        id: 'rep-ama-1',
        authorId: 'sam',
        authorName: 'Sam',
        authorRole: 'Apprenant · Communication & Méthodes',
        text: 'La question « Et concrètement ? » est redoutable. Je la reprends pour mes fiches.',
        createdAt: 'Aujourd’hui · 16 h 02',
        helpfulBy: ['ama']
      },
      {
        id: 'rep-ama-2',
        authorId: 'ines',
        authorName: 'Inès Adjovi',
        authorRole: 'Conceptrice pédagogique · Gestion de projet',
        text: 'Nous faisons pareil en équipe projet : dix minutes chacun, pas plus. Au-delà, on récite au lieu d’expliquer.',
        createdAt: 'Aujourd’hui · 16 h 20',
        helpfulBy: ['ama', 'afi']
      }
    ]
  },
  {
    id: 'post-kossi-schema',
    kind: 'publication',
    title: 'Schéma : le trajet d’une requête, de votre ordinateur à Internet',
    domain: 'Numérique',
    authorId: 'kossi',
    authorName: 'Kossi Agbo',
    body:
      'Beaucoup de questions cette semaine sur la passerelle. Voici le schéma que j’utilise en formation : *même réseau*, les appareils se parlent directement ; *autre réseau*, tout passe par le routeur.',
    createdAt: 'Aujourd’hui · 13 h 05',
    media: {
      kind: 'image',
      src: 'media/schema-reseau.svg',
      alt: 'Schéma : l’ordinateur envoie sa demande au routeur, passerelle par défaut, qui la transmet vers Internet puis vers le site web.'
    },
    followers: ['afi', 'maya', 'kodjo'],
    helpfulBy: ['afi', 'maya', 'kodjo', 'fatou', 'nadege'],
    repostedBy: [],
    replies: [
      {
        id: 'rep-schema-1',
        authorId: 'maya',
        authorName: 'Maya',
        authorRole: 'Apprenante · Réseaux & Systèmes',
        text: 'C’est exactement ce qui me manquait après ma question de ce matin. Merci !',
        createdAt: 'Aujourd’hui · 13 h 20',
        helpfulBy: ['kossi']
      },
      {
        id: 'rep-schema-2',
        authorId: 'kodjo',
        authorName: 'Kodjo Amegan',
        authorRole: 'Technicien support · Réseaux & Assistance',
        text: 'Au support, c’est la première chose que je vérifie : la machine a-t-elle bien une passerelle ? Neuf fois sur dix, le souci est là.',
        createdAt: 'Aujourd’hui · 13 h 48',
        helpfulBy: ['kossi', 'afi', 'maya']
      }
    ]
  },
  {
    id: 'post-edem-budget',
    kind: 'question',
    title: 'Comment suivre un petit budget sans tableur ?',
    domain: 'Gestion',
    authorId: 'edem',
    authorName: 'Edem Lawson',
    body:
      'Je conseille de jeunes entrepreneurs qui n’ont pas d’ordinateur. Quelle méthode simple, sur papier ou sur téléphone, tient vraiment dans la durée ?',
    createdAt: 'Aujourd’hui · 11 h 30',
    solutionReplyId: 'rep-budget-1',
    followers: ['ines', 'sam'],
    helpfulBy: ['sam', 'fatou'],
    repostedBy: [],
    replies: [
      {
        id: 'rep-budget-1',
        authorId: 'ines',
        authorName: 'Inès Adjovi',
        authorRole: 'Conceptrice pédagogique · Gestion de projet',
        text: 'Un carnet, quatre colonnes : poste, prévu, réel, écart. Dix minutes chaque dimanche pour remplir « réel ». Le modèle est dans la bibliothèque.',
        createdAt: 'Aujourd’hui · 11 h 52',
        helpfulBy: ['edem', 'sam', 'afi'],
        linkedModuleId: 'budget'
      },
      {
        id: 'rep-budget-2',
        authorId: 'sam',
        authorName: 'Sam',
        authorRole: 'Apprenant · Communication & Méthodes',
        text: 'Je note chaque dépense dans une note du téléphone le jour même. Le soir, c’est trop tard : j’ai déjà oublié les petites sommes.',
        createdAt: 'Aujourd’hui · 12 h 10',
        helpfulBy: ['edem']
      }
    ]
  }
];

/** Publication du matin, placée juste après la question de Maya. */
export const SEED_POSTS_MORNING: CommunityPost[] = [
  {
    id: 'post-nadege-module',
    kind: 'publication',
    title: 'Nouveau module validé : « Écrire un e-mail professionnel clair »',
    domain: 'Communication',
    authorId: 'nadege',
    authorName: 'Nadège Koffi',
    body:
      'La revue pédagogique est terminée : le module d’Ama Dossou rejoint la bibliothèque. Trois sections courtes et un quiz, quinze minutes en tout.',
    createdAt: 'Aujourd’hui · 09 h 00',
    linkedItemId: 'email-pro',
    followers: ['ama'],
    helpfulBy: ['ama', 'ines', 'afi'],
    repostedBy: [],
    replies: [
      {
        id: 'rep-module-1',
        authorId: 'ama',
        authorName: 'Ama Dossou',
        authorRole: 'Formatrice en communication',
        text: 'Merci pour la relecture, les remarques sur le quiz l’ont rendu plus clair.',
        createdAt: 'Aujourd’hui · 09 h 25',
        helpfulBy: ['nadege']
      }
    ]
  }
];

/** Publications des jours précédents, placées en fin de fil. */
export const SEED_POSTS_OLDER: CommunityPost[] = [
  {
    id: 'post-fatou-signaux',
    kind: 'publication',
    title: 'Ma fiche mémo après le module sur le phishing',
    domain: 'Numérique',
    authorId: 'fatou',
    authorName: 'Fatou Diallo',
    body:
      'J’ai résumé le module en une image pour la garder près de mon bureau. Le signal n° 3 m’a déjà évité une erreur cette semaine.',
    createdAt: 'Hier · 12 h 10',
    media: {
      kind: 'image',
      src: 'media/signaux-message.svg',
      alt: 'Fiche : cinq signaux d’un message suspect — urgence ou menace, expéditeur inhabituel, lien qui ne correspond pas, mot de passe demandé, pièce jointe inattendue.'
    },
    followers: ['afi'],
    helpfulBy: ['afi', 'kossi', 'ama', 'kodjo'],
    repostedBy: [],
    replies: [
      {
        id: 'rep-signaux-1',
        authorId: 'kossi',
        authorName: 'Kossi Agbo',
        authorRole: 'Créateur & Mentor · Réseaux & Sécurité',
        text: 'Très bonne synthèse. Je la montrerai lors de la prochaine session, avec votre accord.',
        createdAt: 'Hier · 12 h 40',
        helpfulBy: ['fatou', 'afi']
      }
    ]
  },
  {
    id: 'post-kodjo-mdp',
    kind: 'question',
    title: 'Mot de passe oublié sur un ancien compte : par où commencer ?',
    domain: 'Numérique',
    authorId: 'kodjo',
    authorName: 'Kodjo Amegan',
    body:
      'Un utilisateur n’a plus accès à une ancienne messagerie, et l’adresse de secours n’existe plus. Quel ordre de vérification conseillez-vous avant d’abandonner le compte ?',
    createdAt: 'Hier · 09 h 45',
    solutionReplyId: 'rep-mdp-1',
    followers: ['kossi'],
    helpfulBy: ['maya'],
    repostedBy: [],
    replies: [
      {
        id: 'rep-mdp-1',
        authorId: 'kossi',
        authorName: 'Kossi Agbo',
        authorRole: 'Créateur & Mentor · Réseaux & Sécurité',
        text: 'Dans l’ordre : un appareil où la session est encore ouverte, puis le numéro de téléphone associé, puis le formulaire de récupération du service. Jamais de site tiers qui « débloque » les comptes.',
        createdAt: 'Hier · 10 h 05',
        helpfulBy: ['kodjo', 'afi', 'maya'],
        linkedModuleId: 'comptes'
      }
    ]
  },
  {
    id: 'post-ines-reunion',
    kind: 'publication',
    title: 'Ma règle pour refuser une réunion sans froisser personne',
    domain: 'Communication',
    authorId: 'ines',
    authorName: 'Inès Adjovi',
    body:
      'Quand je reçois une invitation sans ordre du jour, je réponds toujours la même chose :\n\n' +
      '1. **Quel est l’objectif ?** Une phrase suffit.\n' +
      '2. **Qu’attendez-vous de moi ?** Une décision, un avis, une information.\n' +
      '3. **Puis-je contribuer par écrit ?**\n\n' +
      'Une fois sur deux, la réunion devient un message. Et quand elle a lieu, elle est mieux préparée.',
    createdAt: '12 nov. · 16 h 30',
    followers: ['ama', 'edem'],
    helpfulBy: ['ama', 'edem', 'sam', 'nadege', 'afi'],
    repostedBy: [],
    replies: [
      {
        id: 'rep-reunion-1',
        authorId: 'edem',
        authorName: 'Edem Lawson',
        authorRole: 'Entrepreneur · Gestion au quotidien',
        text: 'Je l’applique depuis lundi : deux réunions en moins cette semaine.',
        createdAt: '12 nov. · 17 h 15',
        helpfulBy: ['ines']
      }
    ]
  },
  {
    id: 'post-sam-revision',
    kind: 'publication',
    title: 'Une heure de révision sans téléphone : mon retour',
    domain: 'Communication',
    authorId: 'sam',
    authorName: 'Sam',
    body:
      'J’ai essayé pendant une semaine : téléphone dans une autre pièce, une seule fiche ouverte, un minuteur de vingt-cinq minutes. J’ai terminé deux modules au lieu d’un. (Vidéo d’illustration.)',
    createdAt: '11 nov. · 18 h 05',
    media: {
      kind: 'video',
      src: `${PEXELS}/6281083/6281083-sd_960_540_24fps.mp4`,
      alt: 'Une personne révise à une table de travail, des documents étalés devant elle, dans une bibliothèque.',
      credit: 'Vidéo d’illustration : Yaroslav Shuraev · Pexels'
    },
    followers: ['afi'],
    helpfulBy: ['afi', 'fatou', 'maya'],
    repostedBy: [],
    replies: []
  },
  {
    id: 'post-sam-budget',
    kind: 'publication',
    title: 'Le module qui m’a fait gagner du temps ce mois-ci',
    domain: 'Gestion',
    authorId: 'sam',
    authorName: 'Sam',
    body: 'Vingt minutes, et j’ai enfin un tableau prévu / réel qui tient sur une page. Je le recommande à tous ceux qui débutent.',
    createdAt: '10 nov. · 08 h 15',
    linkedItemId: 'budget',
    followers: [],
    helpfulBy: ['edem', 'ines'],
    repostedBy: [],
    replies: []
  },
  {
    id: 'post-kossi-321',
    kind: 'publication',
    title: 'La règle 3-2-1 en une image',
    domain: 'Numérique',
    authorId: 'kossi',
    authorName: 'Kossi Agbo',
    body: 'Si vous ne deviez retenir qu’une chose du nouveau module sur la sauvegarde, ce serait celle-ci.',
    createdAt: '9 nov. · 19 h 00',
    media: {
      kind: 'image',
      src: 'media/regle-3-2-1.svg',
      alt: 'Règle 3-2-1 : trois copies de vos fichiers, sur deux supports différents, dont une copie conservée ailleurs.'
    },
    linkedItemId: 'sauvegarde',
    followers: ['kodjo'],
    helpfulBy: ['kodjo', 'fatou', 'afi', 'ama'],
    repostedBy: [],
    replies: [
      {
        id: 'rep-321-1',
        authorId: 'fatou',
        authorName: 'Fatou Diallo',
        authorRole: 'Apprenante · Bureautique & Numérique',
        text: 'Je n’avais qu’une clé USB… J’ai ajouté une copie en ligne dimanche.',
        createdAt: '9 nov. · 20 h 12',
        helpfulBy: ['kossi']
      }
    ]
  }
];

const MEMBER_DEFAULTS = {
  profileVisibility: 'Membres',
  xpVisibility: 'Membres',
  contactPolicy: 'Membres autorisés'
} as const;

/** Fiches des membres de la communauté (hors personnages de démonstration). */
export const SEED_MEMBER_DETAILS = {
  maya: {
    tagline: 'Apprenante | Réseaux & Systèmes',
    location: 'Kpalimé, Région des Plateaux',
    verified: false,
    bio: 'En reconversion vers le support informatique. Je pose beaucoup de questions, et je note les réponses.',
    interests: 'Réseaux, Systèmes, Numérique',
    ...MEMBER_DEFAULTS
  },
  sam: {
    tagline: 'Apprenant | Communication & Méthodes de travail',
    location: 'Sokodé, Région Centrale',
    verified: false,
    bio: 'Je teste des méthodes de révision et je partage celles qui tiennent plus d’une semaine.',
    interests: 'Communication, Méthodes, Gestion',
    ...MEMBER_DEFAULTS
  },
  ama: {
    tagline: 'Formatrice en communication | Rédaction professionnelle',
    location: 'Lomé, Région Maritime',
    verified: true,
    bio: 'J’aide les équipes à écrire plus court et plus clair. Autrice du module « Écrire un e-mail professionnel clair ».',
    interests: 'Communication, Rédaction, Pédagogie',
    ...MEMBER_DEFAULTS
  },
  edem: {
    tagline: 'Entrepreneur | Gestion & Comptabilité simple',
    location: 'Kara, Région de la Kara',
    verified: true,
    bio: 'J’accompagne de jeunes entrepreneurs dans leurs premiers budgets. Auteur du module « Tenir un budget simple ».',
    interests: 'Gestion, Entrepreneuriat, Budget',
    ...MEMBER_DEFAULTS
  },
  fatou: {
    tagline: 'Apprenante | Bureautique & Numérique',
    location: 'Atakpamé, Région des Plateaux',
    verified: false,
    bio: 'Assistante administrative. Je résume ce que j’apprends en fiches d’une page.',
    interests: 'Numérique, Bureautique, Cybersécurité',
    ...MEMBER_DEFAULTS
  },
  kodjo: {
    tagline: 'Technicien support | Réseaux & Assistance',
    location: 'Lomé, Région Maritime',
    verified: true,
    bio: 'Au support depuis six ans. Je documente les pannes courantes pour qu’on ne les résolve qu’une fois.',
    interests: 'Réseaux, Support, Numérique',
    ...MEMBER_DEFAULTS
  },
  ines: {
    tagline: 'Conceptrice pédagogique | Gestion de projet',
    location: 'Tsévié, Région Maritime',
    verified: true,
    bio: 'Je conçois des formations courtes et j’anime des équipes projet. Autrice du module « Préparer une réunion utile ».',
    interests: 'Pédagogie, Communication, Gestion',
    ...MEMBER_DEFAULTS
  }
};

/** Abonnements des membres : ils donnent des abonnés aux profils. */
export const SEED_MEMBER_FOLLOWING: Record<string, string[]> = {
  maya: ['afi', 'kossi'],
  sam: ['afi', 'ama'],
  ama: ['kossi', 'ines', 'afi'],
  edem: ['ama', 'ines'],
  fatou: ['afi', 'kossi', 'ama'],
  kodjo: ['kossi'],
  ines: ['nadege', 'ama', 'edem']
};

const done = (answers: number[]) => ({ lessons: [0, 1, 2], answers, submitted: true });
const started = (lessons: number[]) => ({ lessons, answers: [], submitted: false });

/** Progressions des membres : elles alimentent leur niveau, leurs badges et leurs compétences. */
export const SEED_MEMBER_PROGRESS = {
  maya: { phishing: done([1, 2, 0]), reseaux: started([0, 1]) },
  sam: { budget: done([1, 0, 2]), 'email-pro': started([0]) },
  ama: { 'email-pro': done([1, 2, 0]), reunion: done([1, 0, 2]), phishing: done([1, 2, 0]) },
  edem: { budget: done([1, 0, 2]), 'email-pro': started([0, 1]) },
  fatou: { phishing: done([1, 2, 0]), comptes: started([0]) },
  kodjo: { reseaux: done([0, 1, 2]), comptes: done([0, 1, 2]), sauvegarde: done([1, 2, 0]) },
  ines: { reunion: done([1, 0, 2]), 'email-pro': done([1, 2, 0]), budget: started([0]) }
};

/** Comptes ajoutés à la liste de la gouvernance. */
export const SEED_MEMBER_ACCOUNTS = [
  { id: 'usr-ama', name: 'Ama Dossou', institution: 'Institut de Communication (démo)', roles: ['Apprenant', 'Créateur habilité'], verified: true, createdAt: '08 oct. 2026', lastActivity: 'Aujourd’hui · 16 h 20' },
  { id: 'usr-edem', name: 'Edem Lawson', institution: 'Indépendant', roles: ['Apprenant', 'Créateur habilité'], verified: true, createdAt: '14 oct. 2026', lastActivity: 'Aujourd’hui · 12 h 15' },
  { id: 'usr-fatou', name: 'Fatou Diallo', institution: 'Centre Formation Est', roles: ['Apprenant'], verified: false, createdAt: '02 nov. 2026', lastActivity: 'Hier · 12 h 45' },
  { id: 'usr-kodjo', name: 'Kodjo Amegan', institution: 'Université de Lomé (démo)', roles: ['Apprenant'], verified: true, createdAt: '21 oct. 2026', lastActivity: 'Aujourd’hui · 13 h 50' },
  { id: 'usr-ines', name: 'Inès Adjovi', institution: 'Institut Tech', roles: ['Apprenant', 'Créateur habilité'], verified: true, createdAt: '18 oct. 2026', lastActivity: 'Aujourd’hui · 16 h 25' }
];
