/**
 * Contenus de formation complémentaires : modules complets (leçons + quiz), ressources courtes
 * de formats variés et parcours. Ils s'ajoutent au catalogue et au lecteur d'étude.
 */
import type { CatalogItem } from './wireframeData';
import type { ModuleStudyContent } from './content';

const READER = 'Section consultable depuis le lecteur';
const QUIZ_SECTION = { title: '04 Vérifier mes acquis', subtitle: 'Activité à réaliser dans le lecteur · 3 questions' };
const NO_PREREQ = 'Aucun prérequis bloquant.';

/* ============================================================================ modules */

export const EXTRA_CATALOG_MODULES: CatalogItem[] = [
  {
    id: 'email-pro',
    type: 'module',
    title: 'Écrire un e-mail professionnel clair',
    domain: 'Communication',
    level: 'Débutant',
    duration: '15 min',
    author: 'Ama Dossou',
    authorRole: 'Formatrice en communication',
    version: 'Version 1',
    review: 'Pédagogique',
    summary: 'Un objet précis, une demande lisible, un ton juste : trois réflexes pour être lu et obtenir une réponse.',
    objectives: [
      'Rédiger un objet qui annonce la demande.',
      'Structurer un message court autour d’une seule demande.',
      'Relire le ton, les destinataires et les pièces jointes avant l’envoi.'
    ],
    prerequisites: `Savoir envoyer un e-mail. ${NO_PREREQ}`,
    interactive: true,
    xpReward: 150,
    skills: ['Objet clair', 'Structure du message', 'Ton professionnel'],
    sections: [
      { title: '01 Un objet qui dit tout', subtitle: `${READER} · 4 min` },
      { title: '02 Une demande, une structure', subtitle: `${READER} · 6 min` },
      { title: '03 Relire avant d’envoyer', subtitle: `${READER} · 5 min` },
      QUIZ_SECTION
    ]
  },
  {
    id: 'budget',
    type: 'module',
    title: 'Tenir un budget simple',
    domain: 'Gestion',
    level: 'Débutant',
    duration: '20 min',
    author: 'Edem Lawson',
    authorRole: 'Entrepreneur · Gestion au quotidien',
    version: 'Version 1',
    review: 'Pédagogique',
    summary: 'Noter, prévoir, ajuster : une méthode en trois temps pour savoir où va l’argent et garder une marge.',
    objectives: [
      'Relever ses dépenses pendant un mois sans rien oublier.',
      'Répartir un revenu entre besoins, envies et épargne.',
      'Faire un point régulier pour corriger le tir.'
    ],
    prerequisites: `Savoir additionner des montants. ${NO_PREREQ}`,
    interactive: true,
    xpReward: 150,
    skills: ['Suivi des dépenses', 'Prévision', 'Épargne de précaution'],
    sections: [
      { title: '01 Savoir où va l’argent', subtitle: `${READER} · 6 min` },
      { title: '02 Prévoir avant de dépenser', subtitle: `${READER} · 8 min` },
      { title: '03 Tenir dans la durée', subtitle: `${READER} · 6 min` },
      QUIZ_SECTION
    ]
  },
  {
    id: 'sauvegarde',
    type: 'module',
    title: 'Sauvegarder ses fichiers : la règle 3-2-1',
    domain: 'Numérique',
    level: 'Débutant',
    duration: '15 min',
    author: 'Kossi Agbo',
    authorRole: 'Créateur & Mentor · Réseaux & Sécurité',
    version: 'Version 1',
    review: 'Pédagogique',
    summary: 'Trois copies, deux supports, une copie ailleurs : la méthode simple pour ne plus perdre un document.',
    objectives: [
      'Expliquer pourquoi une seule copie ne protège pas.',
      'Mettre en place la règle 3-2-1 avec des moyens courants.',
      'Vérifier qu’une sauvegarde peut vraiment être restaurée.'
    ],
    prerequisites: `Savoir copier un fichier. ${NO_PREREQ}`,
    interactive: true,
    xpReward: 150,
    skills: ['Règle 3-2-1', 'Sauvegarde automatique', 'Test de restauration'],
    sections: [
      { title: '01 Une copie ne suffit pas', subtitle: `${READER} · 4 min` },
      { title: '02 Appliquer la règle 3-2-1', subtitle: `${READER} · 6 min` },
      { title: '03 Vérifier la restauration', subtitle: `${READER} · 5 min` },
      QUIZ_SECTION
    ]
  },
  {
    id: 'reunion',
    type: 'module',
    title: 'Préparer une réunion utile',
    domain: 'Communication',
    level: 'Intermédiaire',
    duration: '18 min',
    author: 'Inès Adjovi',
    authorRole: 'Conceptrice pédagogique · Gestion de projet',
    version: 'Version 1',
    review: 'Pédagogique',
    summary: 'Décider si la réunion est nécessaire, la cadrer avec un ordre du jour, repartir avec des décisions écrites.',
    objectives: [
      'Choisir entre une réunion, un message ou un document partagé.',
      'Rédiger un ordre du jour avec un objectif par point.',
      'Conclure par des décisions, des responsables et des échéances.'
    ],
    prerequisites: 'Avoir déjà participé à une réunion de travail.',
    interactive: true,
    xpReward: 150,
    skills: ['Ordre du jour', 'Animation', 'Compte rendu'],
    sections: [
      { title: '01 Faut-il vraiment une réunion ?', subtitle: `${READER} · 5 min` },
      { title: '02 Un ordre du jour qui cadre', subtitle: `${READER} · 7 min` },
      { title: '03 Décisions et compte rendu', subtitle: `${READER} · 6 min` },
      QUIZ_SECTION
    ]
  }
];

export const EXTRA_MODULES_CONTENT: Record<string, ModuleStudyContent> = {
  'email-pro': {
    id: 'email-pro',
    title: 'Écrire un e-mail professionnel clair',
    quizTitle: 'Vérifier vos acquis sur l’e-mail professionnel',
    labType: 'generic',
    lessons: [
      {
        title: 'Un objet qui dit tout',
        label: 'Être compris avant d’être lu',
        minutes: '4 min',
        intro: 'Votre destinataire décide en deux secondes s’il ouvre votre message. L’objet fait ce travail à votre place.',
        body: 'Un bon objet annonce le sujet et ce que vous attendez : une validation, une information, un rendez-vous. Il tient en six à huit mots et commence par le mot le plus utile. « Question » ou « Urgent » ne disent rien ; « Validation du devis Kossi avant vendredi » dit tout.',
        points: [
          'Le sujet et l’action attendue apparaissent dans l’objet.',
          'Six à huit mots, sans majuscules partout ni points d’exclamation.',
          'Une date dans l’objet quand il y a une échéance.'
        ],
        tip: 'Écrivez l’objet en dernier : vous savez alors exactement ce que demande votre message.'
      },
      {
        title: 'Une demande, une structure',
        label: 'Aller à l’essentiel',
        minutes: '6 min',
        intro: 'Un message qui contient trois demandes n’obtient souvent qu’une réponse. Mieux vaut un e-mail par sujet.',
        body: 'Commencez par la demande, puis donnez le contexte utile, puis l’échéance. Trois courts paragraphes suffisent. Si plusieurs éléments sont attendus, numérotez-les : le destinataire pourra répondre point par point.',
        points: [
          'Première phrase : ce que vous demandez.',
          'Ensuite : le contexte strictement nécessaire.',
          'Enfin : la date souhaitée et la façon de vous répondre.'
        ],
        tip: 'Si votre message dépasse un écran de téléphone, proposez plutôt un appel ou joignez un document.'
      },
      {
        title: 'Relire avant d’envoyer',
        label: 'Ton, pièces jointes, destinataires',
        minutes: '5 min',
        intro: 'La plupart des malentendus par e-mail viennent d’un envoi trop rapide, pas d’un mauvais fond.',
        body: 'Relisez à voix basse : le ton est-il celui que vous emploieriez en face ? Vérifiez ensuite la pièce jointe annoncée, puis les destinataires. « Répondre à tous » n’est utile que si chacun a besoin de la réponse.',
        points: [
          'Une formule d’appel et une formule de politesse simples.',
          'La pièce jointe est bien jointe, et son nom est explicite.',
          'En copie : seulement les personnes qui doivent être informées.'
        ],
        tip: 'Ajoutez les destinataires en dernier : un message inachevé ne partira jamais par erreur.'
      }
    ],
    questions: [
      {
        text: 'Quel objet aidera le mieux votre destinataire ?',
        answers: ['Question', 'Validation du planning de formation avant jeudi', 'URGENT !!! À LIRE'],
        correctIndex: 1,
        explanation: 'Il annonce le sujet, l’action attendue et l’échéance, sans crier.'
      },
      {
        text: 'Par quoi commencer le corps du message ?',
        answers: ['Par l’historique complet du dossier.', 'Par des excuses pour le dérangement.', 'Par la demande elle-même.'],
        correctIndex: 2,
        explanation: 'La demande d’abord, le contexte utile ensuite : le lecteur sait tout de suite pourquoi vous écrivez.'
      },
      {
        text: 'Quand utiliser « Répondre à tous » ?',
        answers: [
          'Quand chaque destinataire a besoin de votre réponse.',
          'Toujours, par transparence.',
          'Jamais, c’est impoli.'
        ],
        correctIndex: 0,
        explanation: 'Sinon, vous encombrez des boîtes de réception et diluez l’information utile.'
      }
    ]
  },
  budget: {
    id: 'budget',
    title: 'Tenir un budget simple',
    quizTitle: 'Vérifier vos acquis sur le budget',
    labType: 'generic',
    lessons: [
      {
        title: 'Savoir où va l’argent',
        label: 'Noter pendant un mois',
        minutes: '6 min',
        intro: 'On ne peut pas piloter ce qu’on ne voit pas. Un budget commence par un relevé honnête, pas par des restrictions.',
        body: 'Pendant un mois, notez chaque dépense le jour même : montant, date, à quoi elle a servi. Un carnet ou une note sur le téléphone suffit. Regroupez ensuite en quelques postes : logement, alimentation, transport, communication, imprévus.',
        points: [
          'Notez le jour même : la mémoire oublie les petites sommes.',
          'Cinq ou six postes suffisent pour y voir clair.',
          'Les petites dépenses répétées pèsent souvent plus que les grosses.'
        ],
        tip: 'Ne jugez pas vos dépenses pendant le relevé : observez d’abord, vous déciderez ensuite.'
      },
      {
        title: 'Prévoir avant de dépenser',
        label: 'Besoins, envies, épargne',
        minutes: '8 min',
        intro: 'Prévoir, c’est décider à l’avance de l’usage de chaque franc, avant que le mois ne le décide pour vous.',
        body: 'Partez de votre revenu réel et répartissez-le en trois parts : les besoins (logement, repas, transport), les envies, puis l’épargne. Une répartition courante est 50 / 30 / 20, à adapter à votre situation. Mettez l’épargne de côté dès la réception du revenu, pas à la fin du mois.',
        points: [
          'On part du revenu réellement reçu, pas du revenu espéré.',
          'L’épargne se met de côté en premier.',
          'Une réserve d’imprévus évite de casser le budget au premier souci.'
        ],
        tip: 'Si 20 % d’épargne est hors de portée, commencez par 5 % : l’habitude compte plus que le montant.'
      },
      {
        title: 'Tenir dans la durée',
        label: 'Dix minutes par semaine',
        minutes: '6 min',
        intro: 'Un budget n’est pas un document que l’on range : c’est un point régulier, court, que l’on tient.',
        body: 'Chaque semaine, comparez ce que vous aviez prévu et ce que vous avez dépensé, poste par poste. Un dépassement n’est pas un échec : il indique que la prévision était irréaliste ou qu’un poste doit baisser. Ajustez le mois suivant.',
        points: [
          'Un rendez-vous fixe de dix minutes par semaine.',
          'On compare prévu et réel, poste par poste.',
          'On ajuste la prévision plutôt que d’abandonner le budget.'
        ],
        tip: 'Fixez-vous un seul objectif par mois, par exemple réduire un poste précis : il sera tenu.'
      }
    ],
    questions: [
      {
        text: 'Par quoi commence un budget ?',
        answers: ['Par l’arrêt de toutes les dépenses plaisir.', 'Par le relevé de ses dépenses réelles.', 'Par un emprunt pour repartir à zéro.'],
        correctIndex: 1,
        explanation: 'On observe d’abord où va l’argent ; les décisions viennent ensuite.'
      },
      {
        text: 'Quand mettre l’épargne de côté ?',
        answers: ['Dès la réception du revenu.', 'À la fin du mois, s’il reste quelque chose.', 'Une fois par an.'],
        correctIndex: 0,
        explanation: 'Mise de côté en premier, l’épargne ne dépend plus de ce qu’il reste.'
      },
      {
        text: 'Un poste dépasse la prévision ce mois-ci. Que faire ?',
        answers: [
          'Abandonner le budget : il ne fonctionne pas.',
          'Ne plus regarder ce poste.',
          'Comprendre l’écart et ajuster la prévision du mois suivant.'
        ],
        correctIndex: 2,
        explanation: 'L’écart est une information : soit la prévision était irréaliste, soit le poste doit baisser.'
      }
    ]
  },
  sauvegarde: {
    id: 'sauvegarde',
    title: 'Sauvegarder ses fichiers : la règle 3-2-1',
    quizTitle: 'Vérifier vos acquis sur la sauvegarde',
    labType: 'generic',
    lessons: [
      {
        title: 'Une copie ne suffit pas',
        label: 'Ce qui peut arriver à un fichier',
        minutes: '4 min',
        intro: 'Un téléphone tombe, une clé USB se perd, un disque s’arrête sans prévenir. Le fichier unique disparaît avec son support.',
        body: 'Les pertes de données viennent de quatre causes : la panne du support, la perte ou le vol, l’effacement par erreur, et les logiciels malveillants qui chiffrent les fichiers. Une sauvegarde est une copie séparée, qui survit quand l’original disparaît.',
        points: [
          'Un fichier présent à un seul endroit n’est pas sauvegardé.',
          'La corbeille et la synchronisation ne remplacent pas une sauvegarde.',
          'Les documents irremplaçables passent en premier : photos, diplômes, comptes.'
        ],
        tip: 'Listez vos cinq dossiers les plus précieux : ce sont eux qu’il faut sauvegarder d’abord.'
      },
      {
        title: 'Appliquer la règle 3-2-1',
        label: 'Trois copies, deux supports, une ailleurs',
        minutes: '6 min',
        intro: 'La règle 3-2-1 tient en une phrase et se met en place avec du matériel courant.',
        body: 'Gardez trois copies de vos fichiers importants : l’original et deux sauvegardes. Utilisez deux supports différents, par exemple un disque externe et un stockage en ligne. Conservez une copie ailleurs que chez vous : elle vous protège du vol, de l’incendie ou de l’inondation.',
        points: [
          '3 copies : l’original et deux sauvegardes.',
          '2 supports différents, pour ne pas tout perdre d’un seul coup.',
          '1 copie hors de chez vous, physique ou en ligne.'
        ],
        tip: 'Automatisez la sauvegarde : celle qu’il faut penser à lancer finit toujours par être oubliée.'
      },
      {
        title: 'Vérifier la restauration',
        label: 'Une sauvegarde se teste',
        minutes: '5 min',
        intro: 'On découvre trop souvent qu’une sauvegarde est vide ou illisible le jour où l’on en a besoin.',
        body: 'Une fois par trimestre, restaurez un fichier au hasard depuis chaque sauvegarde et ouvrez-le. Vérifiez aussi la date de la dernière sauvegarde. Protégez enfin la copie en ligne par un mot de passe unique et la double authentification.',
        points: [
          'Restaurer un fichier et l’ouvrir : le seul vrai test.',
          'Contrôler la date de la dernière sauvegarde.',
          'Protéger l’accès à la sauvegarde comme un compte sensible.'
        ],
        tip: 'Débranchez le disque externe après la sauvegarde : un rançongiciel ne chiffre pas ce qui n’est pas connecté.'
      }
    ],
    questions: [
      {
        text: 'Que signifie le « 2 » de la règle 3-2-1 ?',
        answers: ['Deux mots de passe.', 'Deux supports différents.', 'Deux sauvegardes par jour.'],
        correctIndex: 1,
        explanation: 'Deux supports différents évitent qu’une même panne ou un même incident emporte toutes les copies.'
      },
      {
        text: 'Pourquoi garder une copie hors de chez soi ?',
        answers: [
          'Pour libérer de la place sur l’ordinateur.',
          'Parce que c’est obligatoire.',
          'Pour rester protégé en cas de vol, d’incendie ou d’inondation.'
        ],
        correctIndex: 2,
        explanation: 'Un sinistre au domicile peut détruire l’original et la sauvegarde rangée à côté.'
      },
      {
        text: 'Comment savoir qu’une sauvegarde fonctionne ?',
        answers: ['En restaurant un fichier et en l’ouvrant.', 'En vérifiant que le disque s’allume.', 'En regardant sa taille.'],
        correctIndex: 0,
        explanation: 'Seule une restauration réussie prouve que la copie est complète et lisible.'
      }
    ]
  },
  reunion: {
    id: 'reunion',
    title: 'Préparer une réunion utile',
    quizTitle: 'Vérifier vos acquis sur la réunion',
    labType: 'generic',
    lessons: [
      {
        title: 'Faut-il vraiment une réunion ?',
        label: 'Choisir le bon format',
        minutes: '5 min',
        intro: 'Une réunion mobilise le temps de chaque participant. Elle se justifie quand il faut décider ou débattre ensemble.',
        body: 'Informer se fait très bien par écrit : un message ou un document partagé suffit. Une réunion est utile pour trancher une question, résoudre un désaccord ou construire quelque chose à plusieurs. Avant d’inviter, écrivez en une phrase ce qui devra être décidé à la fin.',
        points: [
          'Informer : un écrit. Décider ou débattre : une réunion.',
          'Une phrase d’objectif avant toute invitation.',
          'N’invitez que les personnes qui décident ou qui apportent une information nécessaire.'
        ],
        tip: 'Si vous ne parvenez pas à écrire l’objectif en une phrase, la réunion n’est pas prête.'
      },
      {
        title: 'Un ordre du jour qui cadre',
        label: 'Un objectif par point',
        minutes: '7 min',
        intro: 'L’ordre du jour est le contrat de la réunion : il dit ce qui sera traité, par qui, et en combien de temps.',
        body: 'Pour chaque point, indiquez le sujet, le résultat attendu (décision, avis, information), la personne qui le présente et la durée. Envoyez-le la veille avec les documents à lire. Commencez par le point le plus important : c’est celui qui aura le plus d’attention.',
        points: [
          'Sujet, résultat attendu, porteur et durée pour chaque point.',
          'Les documents sont envoyés à l’avance, pas découverts en séance.',
          'Le point principal en premier, les sujets divers à la fin.'
        ],
        tip: 'Prévoyez quarante-cinq minutes plutôt qu’une heure : la contrainte aide à conclure.'
      },
      {
        title: 'Décisions et compte rendu',
        label: 'Repartir avec du concret',
        minutes: '6 min',
        intro: 'Une réunion sans trace écrite devra souvent être refaite.',
        body: 'Cinq minutes avant la fin, relisez à voix haute les décisions prises. Pour chacune, notez qui s’en charge et pour quelle date. Envoyez le compte rendu le jour même, en quelques lignes : décisions, responsables, échéances, prochains points.',
        points: [
          'Chaque décision a un responsable et une date.',
          'Le compte rendu part le jour même.',
          'Il tient en quelques lignes : personne ne lit trois pages.'
        ],
        tip: 'Désignez la personne qui prend les notes dès le début, et tournez d’une réunion à l’autre.'
      }
    ],
    questions: [
      {
        text: 'Dans quel cas une réunion est-elle le bon format ?',
        answers: [
          'Pour transmettre une information déjà décidée.',
          'Pour trancher une question à plusieurs.',
          'Pour montrer que l’équipe travaille.'
        ],
        correctIndex: 1,
        explanation: 'Décider ou débattre ensemble justifie une réunion ; informer se fait par écrit.'
      },
      {
        text: 'Que contient chaque point d’un bon ordre du jour ?',
        answers: [
          'Le sujet, le résultat attendu, le porteur et la durée.',
          'Uniquement un titre.',
          'La liste de tous les participants.'
        ],
        correctIndex: 0,
        explanation: 'Ces quatre éléments disent à chacun pourquoi il est là et ce qui doit sortir de la discussion.'
      },
      {
        text: 'Que noter pour chaque décision prise ?',
        answers: ['Le temps passé à en discuter.', 'L’avis de chaque participant.', 'Qui s’en charge et pour quelle date.'],
        correctIndex: 2,
        explanation: 'Sans responsable ni échéance, une décision reste une intention.'
      }
    ]
  }
};

/* ============================================================================ ressources */

export const EXTRA_CATALOG_RESOURCES: CatalogItem[] = [
  {
    id: 'memo-mots-de-passe',
    type: 'resource',
    title: 'Mémo : 5 règles pour un mot de passe solide',
    domain: 'Numérique',
    level: 'Débutant',
    duration: '3 min',
    author: 'Kodjo Amegan',
    authorRole: 'Technicien support',
    version: 'Version 1',
    review: 'Communautaire',
    resourceFormat: 'Mémo',
    summary: 'Cinq règles courtes à garder sous la main au moment de créer ou de changer un mot de passe.',
    objectives: ['Créer un mot de passe long, unique et facile à retenir.'],
    prerequisites: 'Aucun prérequis déclaré.',
    resourceBody: [
      {
        heading: 'Long plutôt que compliqué',
        text: 'Une phrase de quatre ou cinq mots sans lien entre eux résiste mieux qu’un mot court truffé de symboles, et se retient plus facilement.'
      },
      {
        heading: 'Un mot de passe par service',
        text: 'Messagerie, banque, formation : chaque compte important a le sien. Un gestionnaire de mots de passe les retient pour vous.'
      },
      {
        heading: 'Rien de personnel, et un second facteur',
        text: 'Évitez prénoms, dates et noms de proches. Activez la double authentification partout où elle est proposée.'
      }
    ],
    resourcePrompt: 'Repérez un mot de passe que vous utilisez sur deux services et changez-en un aujourd’hui.'
  },
  {
    id: 'fiche-objet-email',
    type: 'resource',
    title: 'Fiche : l’objet d’e-mail en 6 mots',
    domain: 'Communication',
    level: 'Débutant',
    duration: '4 min',
    author: 'Ama Dossou',
    authorRole: 'Formatrice en communication',
    version: 'Version 1',
    review: 'Pédagogique',
    resourceFormat: 'Fiche',
    summary: 'Une formule simple et dix exemples pour écrire un objet que l’on ouvre.',
    objectives: ['Écrire un objet qui annonce le sujet et l’action attendue.'],
    prerequisites: 'Aucun prérequis déclaré.',
    resourceBody: [
      {
        heading: 'La formule',
        text: 'Action attendue + sujet + échéance. Exemple : « Validation du programme de l’atelier avant mardi ».'
      },
      {
        heading: 'Avant / après',
        text: '« Question » devient « Disponibilité de la salle B le 12 ? ». « Document » devient « Compte rendu de la réunion du 3 à relire ».'
      },
      {
        heading: 'À éviter',
        text: 'Les objets vides, les majuscules partout, « Urgent » sans date, et l’objet conservé d’une ancienne conversation sur un autre sujet.'
      }
    ],
    resourcePrompt: 'Réécrivez l’objet du dernier e-mail que vous avez envoyé avec la formule ci-dessus.'
  },
  {
    id: 'modele-budget',
    type: 'resource',
    title: 'Modèle : tableau de budget mensuel',
    domain: 'Gestion',
    level: 'Débutant',
    duration: '6 min',
    author: 'Edem Lawson',
    authorRole: 'Entrepreneur · Gestion au quotidien',
    version: 'Version 1',
    review: 'Communautaire',
    resourceFormat: 'Modèle',
    summary: 'Les colonnes et les lignes d’un tableau de budget à recopier dans un carnet ou un tableur.',
    objectives: ['Construire un tableau prévu / réel sur un mois.'],
    prerequisites: 'Aucun prérequis déclaré.',
    resourceBody: [
      {
        heading: 'Les colonnes',
        text: 'Poste · Prévu · Réel · Écart. L’écart est la différence entre le réel et le prévu : c’est la colonne que l’on regarde chaque semaine.'
      },
      {
        heading: 'Les lignes',
        text: 'Revenus en haut. Puis logement, alimentation, transport, communication, santé, loisirs, imprévus. Épargne sur sa propre ligne.'
      },
      {
        heading: 'La règle de lecture',
        text: 'Total des revenus moins total des dépenses et de l’épargne : le résultat doit être positif ou nul. Sinon, un poste doit baisser.'
      }
    ],
    resourcePrompt: 'Recopiez le tableau et remplissez la colonne « Prévu » pour le mois prochain.'
  },
  {
    id: 'checklist-reunion',
    type: 'resource',
    title: 'Check-list : préparer une réunion en 10 minutes',
    domain: 'Communication',
    level: 'Intermédiaire',
    duration: '3 min',
    author: 'Inès Adjovi',
    authorRole: 'Conceptrice pédagogique',
    version: 'Version 1',
    review: 'Pédagogique',
    resourceFormat: 'Check-list',
    summary: 'Sept vérifications avant d’envoyer une invitation, pour que chacun sache pourquoi il vient.',
    objectives: ['Vérifier qu’une réunion est cadrée avant de l’envoyer.'],
    prerequisites: 'Aucun prérequis déclaré.',
    resourceBody: [
      {
        heading: 'Avant d’inviter',
        text: 'L’objectif tient en une phrase. Un écrit ne suffirait pas. Seules les personnes nécessaires sont invitées.'
      },
      {
        heading: 'Dans l’invitation',
        text: 'Ordre du jour avec durée par point. Documents joints. Heure de fin indiquée. Personne chargée des notes désignée.'
      },
      {
        heading: 'À la fin',
        text: 'Décisions relues à voix haute, avec un responsable et une date pour chacune. Compte rendu envoyé le jour même.'
      }
    ],
    resourcePrompt: 'Passez votre prochaine invitation au crible de cette liste avant de l’envoyer.'
  },
  {
    id: 'glossaire-reseau',
    type: 'resource',
    title: 'Glossaire : 12 mots du réseau',
    domain: 'Numérique',
    level: 'Débutant',
    duration: '5 min',
    author: 'Kossi Agbo',
    authorRole: 'Créateur & Mentor · Réseaux & Sécurité',
    version: 'Version 1',
    review: 'Pédagogique',
    resourceFormat: 'Glossaire',
    summary: 'Les mots que l’on croise dans les réglages d’une box ou d’un téléphone, expliqués en une phrase.',
    objectives: ['Reconnaître et expliquer les termes courants d’un réseau local.'],
    prerequisites: 'Aucun prérequis déclaré.',
    resourceBody: [
      {
        heading: 'Les appareils',
        text: 'Routeur : relie votre réseau aux autres. Commutateur : relie les appareils d’un même réseau. Point d’accès : diffuse le Wi-Fi. Modem : fait le lien avec la ligne de l’opérateur.'
      },
      {
        heading: 'Les adresses',
        text: 'Adresse IP : identifie une interface. Masque : délimite le réseau local. Passerelle : sortie vers les autres réseaux. DNS : traduit un nom de site en adresse IP.'
      },
      {
        heading: 'Les réglages',
        text: 'DHCP : distribue les adresses automatiquement. SSID : nom du réseau Wi-Fi. WPA3 : protection récente du Wi-Fi. Pare-feu : filtre ce qui entre et sort.'
      }
    ],
    resourcePrompt: 'Ouvrez les réglages Wi-Fi de votre téléphone et retrouvez trois mots de ce glossaire.'
  }
];

/* ============================================================================ parcours */

export const EXTRA_CATALOG_PATHS: CatalogItem[] = [
  {
    id: 'autonomie-numerique',
    type: 'path',
    title: 'Autonomie numérique',
    domain: 'Numérique',
    level: 'Débutant',
    duration: '42 min',
    author: 'Kossi Agbo',
    authorRole: 'Créateur & Mentor · Réseaux & Sécurité',
    version: 'Version 1',
    review: 'Pédagogique',
    pathType: 'Compétence',
    moduleCount: 3,
    summary: 'Repérer un message piégé, protéger ses comptes et sauvegarder ses fichiers : les trois réflexes de base.',
    objectives: [
      'Reconnaître une tentative de phishing et y réagir.',
      'Protéger l’accès à ses comptes importants.',
      'Ne plus perdre de documents grâce à la règle 3-2-1.'
    ],
    prerequisites: 'Utilisation courante d’un téléphone ou d’un ordinateur. L’ordre proposé guide la progression ; il ne crée pas de verrouillage.',
    pathModules: [
      { id: 'phishing', title: '01 Ne tombez plus dans le piège', version: 'v2', note: '12 min · Débutant', status: 'En cours' },
      { id: 'comptes', title: '02 Protéger ses comptes', version: 'v1', note: '25 min · Débutant', status: 'À commencer' },
      { id: 'sauvegarde', title: '03 Sauvegarder ses fichiers : la règle 3-2-1', version: 'v1', note: '15 min · Débutant', status: 'À commencer' }
    ]
  },
  {
    id: 'communication-pro',
    type: 'path',
    title: 'Communication professionnelle',
    domain: 'Communication',
    level: 'Débutant',
    duration: '33 min',
    author: 'Ama Dossou',
    authorRole: 'Formatrice en communication',
    version: 'Version 1',
    review: 'Pédagogique',
    pathType: 'Compétence',
    moduleCount: 2,
    summary: 'Écrire des messages que l’on lit et tenir des réunions dont on sort avec des décisions.',
    objectives: [
      'Rédiger un e-mail court, clair et courtois.',
      'Préparer, animer et conclure une réunion utile.'
    ],
    prerequisites: 'Aucun prérequis bloquant. L’ordre proposé guide la progression ; il ne crée pas de verrouillage.',
    pathModules: [
      { id: 'email-pro', title: '01 Écrire un e-mail professionnel clair', version: 'v1', note: '15 min · Débutant', status: 'À commencer' },
      { id: 'reunion', title: '02 Préparer une réunion utile', version: 'v1', note: '18 min · Intermédiaire', status: 'À commencer' }
    ]
  }
];
