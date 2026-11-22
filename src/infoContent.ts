/**
 * Contenu des pages d'information (pied de page), mis en forme comme leurs équivalents LinkedIn,
 * relevés le 18 novembre 2026 : Centre d'aide (sujets, raccourcis, articles), documents juridiques
 * (confidentialité, conditions, règles de la communauté, publicité). Rien n'est annoncé que le site ne
 * fasse pas ; ce qui est simulé le dit.
 */

/** Une action du site, nommée par un lien : la page (et la partie de l'adresse) où elle mène. */
export interface InfoLink {
  label: string;
  page: string;
  id?: string;
  /** Seulement pour un compte qui publie, qui apprend, un parent, ou en démonstration locale (la visite guidée). */
  only?: 'publish' | 'learner' | 'guardian' | 'local' | 'tour';
}

export type HelpTopicId = 'basics' | 'learning' | 'community' | 'family' | 'schools' | 'account';

export const HELP_TOPICS: { id: HelpTopicId; label: string }[] = [
  { id: 'basics', label: 'Informations de base' },
  { id: 'learning', label: 'Apprendre' },
  { id: 'community', label: 'Communauté' },
  { id: 'family', label: 'Famille' },
  { id: 'schools', label: 'Établissements et encadrants' },
  { id: 'account', label: 'Compte et confidentialité' }
];

export interface HelpArticle {
  id: string;
  topic: HelpTopicId;
  title: string;
  /** Résumé, montré dans les listes. */
  excerpt: string;
  body: string[];
  links: InfoLink[];
  only?: InfoLink['only'];
}

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'reprendre-un-module',
    topic: 'learning',
    title: 'Reprendre un module là où vous l’avez laissé',
    excerpt: 'L’anneau de la barre du haut et la carte « Reprise » de l’accueil vous ramènent à la lecture, ou au quiz quand toutes les parties sont lues.',
    body: [
      'Le module en cours est le premier que vous avez commencé sans l’avoir encore validé. Il apparaît dans l’anneau de la barre du haut et dans la carte « Reprise » de l’accueil.',
      'Un clic vous ramène où vous vous êtes arrêté : à la section suivante, ou au quiz final quand toutes les sections sont lues. Quand aucun module n’est en cours, l’anneau disparaît.'
    ],
    links: [{ label: 'Mes apprentissages', page: 'learning', only: 'learner' }]
  },
  {
    id: 'valider-un-module',
    topic: 'learning',
    title: 'Valider un module : le quiz final',
    excerpt: 'Après la dernière section, le quiz final a sa page. Il faut deux bonnes réponses sur trois ; la correction s’affiche après l’envoi.',
    body: [
      'Chaque section du module a sa page ; le bouton du bas note la section lue et mène à la suivante, puis au quiz final, qui a la sienne. Le quiz compte trois questions à choix unique, sans limite de temps.',
      'Avec deux bonnes réponses sur trois, le module est validé et ses points d’expérience vous sont acquis. Vous pouvez renvoyer le quiz : un nouvel envoi remplace le résultat précédent.'
    ],
    links: [{ label: 'La bibliothèque', page: 'catalog' }]
  },
  {
    id: 'calendrier-et-plan',
    topic: 'learning',
    title: 'Votre calendrier et votre plan de révision',
    excerpt: 'Ajoutez vos examens : SAVOIR+ répartit des séances de révision selon le temps dont vous disposez.',
    body: [
      'Le calendrier réunit vos examens, les congés scolaires et vos séances de révision. Le plan se calcule sur votre appareil, selon le temps que vous indiquez par jour et la difficulté de chaque épreuve.',
      'Une séance manquée est replacée dans la suite du plan.'
    ],
    links: [{ label: 'Mon calendrier', page: 'calendar', only: 'learner' }]
  },
  {
    id: 'poser-une-question',
    topic: 'community',
    title: 'Poser une question à la communauté',
    excerpt: 'Un titre clair, son domaine, et ce que vous avez déjà essayé : les réponses arrivent plus vite.',
    body: [
      'Décrivez votre situation en quelques lignes et choisissez le domaine (numérique, communication, gestion). Les membres répondent dans le fil ; vous pouvez marquer la réponse qui vous a aidé.',
      'Ne partagez ni coordonnées ni informations personnelles dans une publication.'
    ],
    links: [{ label: 'Poser une question', page: 'community-compose', only: 'publish' }],
    only: 'publish'
  },
  {
    id: 'signaler',
    topic: 'community',
    title: 'Signaler un contenu ou un échange',
    excerpt: 'Depuis le menu « … » d’une publication ou d’une conversation : la personne signalée ne sait pas que c’est vous.',
    body: [
      'Ouvrez le menu « … » de la publication ou de la conversation, choisissez « Signaler », puis le motif qui s’applique, et envoyez. Le contenu signalé disparaît de votre fil ou de votre messagerie ; vous pouvez aussi ne plus suivre l’auteur ou bloquer la personne.',
      'L’équipe de modération examine le signalement et prend les mesures nécessaires si le contenu enfreint les règles de la communauté. La personne dont le contenu est retiré peut contester la décision par un recours, examiné par une autre personne que celle qui a décidé.'
    ],
    links: [{ label: 'Faire un signalement', page: 'report' }]
  },
  {
    id: 'code-parental',
    topic: 'family',
    title: 'Ouvrir le compte d’un enfant de moins de 12 ans',
    excerpt: 'Le compte s’ouvre avec un code créé par un parent vérifié ; le code vaut sept jours et n’ouvre qu’un compte.',
    body: [
      'Avant 12 ans, un compte s’ouvre avec l’accord d’un parent ou d’un tuteur dont l’identité est vérifiée. Le parent crée un code dans son espace famille ; l’enfant le saisit à l’ouverture de son compte.',
      'Un code vaut sept jours et n’ouvre qu’un seul compte. Un enfant peut être rattaché à deux parents au plus.'
    ],
    links: [{ label: 'Espace famille', page: 'family', only: 'guardian' }]
  },
  {
    id: 'verrouillage',
    topic: 'family',
    title: 'Régler le verrouillage de SAVOIR+ pour un enfant',
    excerpt: 'Pause immédiate, temps par jour, plage horaire et parties ouvertes : sur la fiche de l’enfant, selon votre besoin.',
    body: [
      'Sur la fiche d’un enfant de moins de 12 ans, vous pouvez mettre SAVOIR+ en pause, fixer un temps par jour (en semaine et le week-end), une plage horaire, et choisir si le fil et la messagerie restent ouverts.',
      'L’enfant voit ses règles et peut vous demander du temps quand celui du jour est écoulé. Le réglage s’applique à SAVOIR+, pas au reste du téléphone ou de la tablette.'
    ],
    links: [{ label: 'Espace famille', page: 'family', only: 'guardian' }]
  },
  {
    id: 'message-de-la-semaine',
    topic: 'family',
    title: 'Le message de la semaine',
    excerpt: 'Pour chaque enfant, une phrase sur sa semaine et une action concrète à proposer.',
    body: [
      'Chaque semaine, l’espace famille résume en une phrase où en est votre enfant (modules, révisions, prochain examen) et propose une action simple.',
      'Ce format court s’appuie sur une étude de Kraft et Rogers (2015) : un message hebdomadaire de ce type a réduit les échecs de 41 %.'
    ],
    links: [{ label: 'Espace famille', page: 'family', only: 'guardian' }]
  },
  {
    id: 'classes-et-planification',
    topic: 'schools',
    title: 'Classes, planification et emploi du temps',
    excerpt: 'L’établissement crée ses classes, planifie le trimestre en diagramme de Gantt et saisit l’emploi du temps ; l’encadrant les retrouve pour ses classes.',
    body: [
      'Un établissement crée ses classes, valide les demandes de rattachement, choisit le niveau de restriction de chaque classe et planifie séquences, révisions et évaluations.',
      'Un encadrant retrouve ces outils pour ses propres classes : vue d’ensemble, planification en lecture, emploi du temps en grille.'
    ],
    links: []
  },
  {
    id: 'bibliotheque-etablissement',
    topic: 'schools',
    title: 'La bibliothèque d’un établissement',
    excerpt: 'Les contenus publiés par ses enseignants, gratuits pour ses élèves ; l’établissement les donne à ses classes.',
    body: [
      'La bibliothèque d’un établissement réunit les contenus publiés par ses enseignants rattachés. Ils sont gratuits pour les élèves de l’établissement, même quand ils sont payants pour le public.',
      'L’établissement donne un module à une classe, ou le lui retire ; l’avancement de la classe apparaît alors dans le suivi.'
    ],
    links: []
  },
  {
    id: 'formules',
    topic: 'account',
    title: 'Choisir, changer ou résilier sa formule',
    excerpt: 'Dans Paramètres, rubrique Abonnement. Le paiement est simulé dans la démonstration.',
    body: [
      'Chaque public a ses formules, en francs CFA : Apprenant+ pour un apprenant, Famille pour un parent, Encadrant Pro, et Essentiel ou Pilotage pour un établissement.',
      'Avec l’offre gratuite, la carte publicitaire est obligatoire ; une formule payante permet de la masquer. Démonstration : aucun argent n’est débité.'
    ],
    links: [
      { label: 'Les formules', page: 'info', id: 'pricing' },
      { label: 'Ma formule', page: 'subscription' }
    ]
  },
  {
    id: 'visibilite',
    topic: 'account',
    title: 'Qui voit votre profil et votre progression',
    excerpt: 'Vous choisissez qui voit votre profil, votre progression, et qui peut vous écrire.',
    body: [
      'Votre progression, vos résultats de quiz et vos messages privés ne sont pas publiés sur votre profil. Dans Paramètres, rubrique Visibilité, vous choisissez qui voit votre profil et votre progression, et qui peut vous contacter.'
    ],
    links: [{ label: 'Visibilité', page: 'settings', id: 'visibility' }]
  },
  {
    id: 'visite-guidee',
    topic: 'basics',
    title: 'Découvrir SAVOIR+ avec la visite guidée',
    excerpt: 'Douze étapes en quatre rôles : apprenante, parent, établissement, encadrant.',
    body: [
      'La visite guidée change elle-même de personnage et de page, et explique chaque écran en deux phrases. On la relance depuis le menu Vous.'
    ],
    links: [{ label: 'Lancer la visite guidée', page: '', only: 'tour' }],
    only: 'local'
  },
  {
    id: 'reinitialiser',
    topic: 'basics',
    title: 'Repartir de zéro',
    excerpt: 'Les données de démonstration restent dans votre navigateur ; vous pouvez les effacer.',
    body: [
      'Tout ce que vous faites dans la démonstration est enregistré dans votre navigateur. Dans Paramètres, rubrique Confidentialité des données, vous pouvez le télécharger ou réinitialiser la démonstration.'
    ],
    links: [{ label: 'Confidentialité des données', page: 'settings', id: 'data' }],
    only: 'local'
  }
];

/** Raccourcis du Centre d'aide : les réglages qu'on cherche le plus. */
export const HELP_SHORTCUTS: InfoLink[] = [
  { label: 'Modifier mon profil', page: 'profile' },
  { label: 'Choisir ma formule', page: 'subscription' },
  { label: 'Visibilité du profil', page: 'settings', id: 'visibility' },
  { label: 'Réduire les animations', page: 'settings', id: 'account/motion' },
  { label: 'Signaler un contenu', page: 'report' },
  { label: 'Lancer la visite guidée', page: '', only: 'tour' }
];

/** Documents juridiques, reliés par une barre comme sur LinkedIn. */
export type LegalDocId = 'privacy' | 'terms' | 'community' | 'ads';

export interface LegalDoc {
  id: LegalDocId;
  title: string;
  sections: { title: string; text: string[] }[];
}

export const LEGAL_EFFECTIVE = 'Entrée en vigueur le 18 novembre 2026';

export const LEGAL_DOCS: LegalDoc[] = [
  {
    id: 'privacy',
    title: 'Politique de confidentialité',
    sections: [
      {
        title: 'Importance de la protection de votre vie privée',
        text: [
          'SAVOIR+ aide chacun à apprendre et à s’entraider. Pour cela, nous utilisons le moins de données possible, et nous vous disons lesquelles, pourquoi, et qui les voit.',
          'Ce prototype est présenté au Hackathon CREATE WITH AI. En démonstration, vos données restent dans votre navigateur.'
        ]
      },
      {
        title: 'Données que nous utilisons',
        text: [
          'Votre profil (nom, titre, lieu, centres d’intérêt), votre progression dans les modules, vos publications et vos messages. Les centres d’intérêt servent à vous recommander des contenus et des questions d’entraide.',
          'En mode connecté, ces données sont enregistrées dans notre base (Supabase) : les profils sont visibles des membres connectés, la progression reste privée, les relations et les messages ne sont visibles que de leurs participants.'
        ]
      },
      {
        title: 'Ce que voient les autres membres',
        text: [
          'Votre progression, vos résultats de quiz et vos messages privés ne sont pas publiés sur votre profil. Vous choisissez qui voit votre profil et votre progression, et qui peut vous écrire.',
          'Un parent suit l’avancement des modules de la classe de son enfant et son temps passé sur SAVOIR+ ; il ne voit pas ses messages privés. Un enseignant voit l’activité de ses élèves sur les modules de leurs classes, pas ce qu’ils font ailleurs.'
        ]
      },
      {
        title: 'Les mineurs',
        text: [
          'Avant 12 ans, un compte s’ouvre avec le code d’un parent vérifié ; aucune publicité ne lui est montrée et les prix ne lui sont jamais affichés. Un parent peut verrouiller SAVOIR+ selon son besoin.'
        ]
      },
      {
        title: 'Ce qui est simulé',
        text: [
          'Les paiements, la vérification d’identité et les comptes de mineurs sont simulés, avec une mention à l’écran. Aucune pièce d’identité n’est reçue ni conservée, et la caméra n’est jamais utilisée.'
        ]
      },
      {
        title: 'Vos choix',
        text: [
          'Dans Paramètres, vous réglez la visibilité de votre profil et de votre progression, les personnes qui peuvent vous contacter et les alertes que vous recevez. Vous pouvez télécharger vos données de démonstration ou les effacer.'
        ]
      }
    ]
  },
  {
    id: 'terms',
    title: 'Conditions d’utilisation',
    sections: [
      {
        title: 'Votre compte',
        text: [
          'Votre compte est personnel. Avant 12 ans, il s’ouvre avec l’accord d’un parent ou d’un tuteur. Un établissement ou un encadrant voit son identité vérifiée avant de recevoir des classes.'
        ]
      },
      {
        title: 'Ce que vous publiez',
        text: [
          'Vous restez responsable de vos publications et de vos réponses. Elles doivent respecter les règles de la communauté ; les contenus de cours publiés depuis le studio sont relus avant validation pédagogique.'
        ]
      },
      {
        title: 'Formules et contenus payants',
        text: [
          'Apprendre reste gratuit. Certaines formules et certains contenus sont payants, en francs CFA. Dans la démonstration, tout paiement est simulé : aucun argent n’est débité.'
        ]
      },
      {
        title: 'Modération et recours',
        text: [
          'Un contenu signalé peut être masqué, modifié à la demande de l’équipe ou retiré. Une décision peut être contestée par un recours, examiné par une autre personne que celle qui a décidé.'
        ]
      }
    ]
  },
  {
    id: 'community',
    title: 'Règles de la communauté',
    sections: [
      { title: 'Respectez les autres membres', text: ['Pas d’insulte, de harcèlement ni de contenu haineux. Une critique porte sur une idée, pas sur une personne.'] },
      {
        title: 'Aidez de façon utile',
        text: ['Une réponse explique, montre un exemple ou renvoie vers un module. Marquez la réponse qui vous a aidé : elle aidera aussi les suivants.']
      },
      {
        title: 'Protégez les données personnelles',
        text: ['Ne publiez ni coordonnées, ni mot de passe, ni information personnelle, les vôtres comme celles des autres.']
      },
      { title: 'Signalez plutôt que répondre', text: ['Un contenu vous semble trompeur ou blessant ? Signalez-le : l’équipe de modération l’examine.'] }
    ]
  },
  {
    id: 'ads',
    title: 'Publicité',
    sections: [
      {
        title: 'Qui peut annoncer',
        text: [
          'Les établissements et les encadrants vérifiés qui souscrivent une formule publicitaire : Visibilité, Priorité ou Premier plan. Chaque annonce porte la mention « Publicité ».'
        ]
      },
      {
        title: 'Comment les annonces sont choisies',
        text: [
          'L’ordre est tiré au sort ; la durée à l’écran et le nombre de passages dépendent de la formule choisie. Aucune annonce n’est choisie d’après ce que vous faites sur le site.'
        ]
      },
      {
        title: 'Qui les voit',
        text: [
          'Aucune annonce n’est montrée avant 12 ans. Avec l’offre gratuite, la carte publicitaire est affichée ; une formule payante permet de la masquer dans Paramètres.'
        ]
      }
    ]
  }
];

/** Mots comparés sans accents ni majuscules, pour la recherche du Centre d'aide. */
const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Articles qui contiennent tous les mots cherchés (titre, résumé ou texte). */
export function searchHelp(articles: HelpArticle[], query: string): HelpArticle[] {
  const words = fold(query).split(/\s+/).filter((w) => w.length > 1);
  if (words.length === 0) return articles;
  return articles.filter((a) => {
    const text = fold(`${a.title} ${a.excerpt} ${a.body.join(' ')}`);
    return words.every((w) => text.includes(w));
  });
}
