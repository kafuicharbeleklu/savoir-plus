/**
 * Leçons rédigées : pour chaque partie d'un module, l'entrée en matière, le cours en sous-parties
 * titrées, un exemple avec sa figure, et la question que se pose l'élève. Une entrée par module,
 * une par section, dans l'ordre des sections. Les noms et adresses des exemples sont inventés
 * (domaines en « .test »). **Le gras** marque les mots clés ; dans une figure, il surligne.
 */
import type { LessonRich } from './content';
import { LESSONS_RICH_CORE } from './lessonsRichCore';
import { LESSONS_RICH_EXTRA } from './lessonsRichExtra';

const PHISHING: LessonRich[] = [
  {
    art: 'alert',
    scene:
      'Lundi matin, votre téléphone vibre : « Votre compte sera bloqué dans 24 h. Cliquez ici pour le réactiver. » Le cœur s’accélère, le doigt est déjà sur le lien. C’est exactement l’effet recherché.',
    sections: [
      {
        title: 'Comprenez ce que cherche le message',
        text: [
          'Un message de phishing ne veut pas vous informer : il veut vous **faire agir**. Donner un mot de passe ou un code, ouvrir une pièce jointe, payer. Tout son texte sert ce seul but.',
          'Pour y parvenir, il vous prive de la seule chose qui vous protège : le temps de réfléchir.'
        ]
      },
      {
        title: 'Repérez les trois signaux',
        text: ['Ces messages se ressemblent. Trois signaux reviennent presque toujours :'],
        ordered: true,
        items: [
          '**La pression** : une menace ou un délai très court.',
          '**La demande sensible** : un mot de passe, un code reçu par SMS, des coordonnées bancaires.',
          '**L’action inattendue** : un paiement ou une pièce jointe que vous n’attendiez pas.'
        ],
        after: 'Aucun de ces signaux ne prouve la fraude à lui seul. Mais **un seul suffit** pour s’arrêter et vérifier avant d’agir.'
      }
    ],
    example: {
      title: 'Lisez ce SMS de près',
      intro: 'Voici un message comme il en circule beaucoup. Les passages surlignés sont ceux qui doivent vous arrêter.',
      figure: {
        kind: 'message',
        channel: 'sms',
        from: 'SERVICE-CLIENT',
        body: ['**URGENT** : votre compte mobile money sera suspendu **aujourd’hui**.', 'Confirmez votre **code secret** en **répondant à ce message**.']
      },
      caption: 'Un SMS frauduleux qui réunit les trois signaux',
      notes: [
        '**La pression** : « URGENT » et « aujourd’hui » ne vous laissent pas le temps de vérifier.',
        '**La demande sensible** : « votre code secret ». Aucun service ne demande ce code par message.',
        '**L’action inattendue** : répondre par SMS, hors de l’application habituelle.'
      ]
    },
    question: {
      ask: 'Et si le message est bien écrit, avec le logo du service ?',
      answer: [
        'Cela ne prouve rien. Un logo se copie en une minute, et les fautes d’orthographe ne sont plus un indice fiable. Ce n’est pas l’apparence qui compte, c’est **ce que le message vous demande de faire**.'
      ]
    }
  },
  {
    art: 'search',
    scene:
      'Le message est signé « Service Sécurité » et porte le logo de votre banque. Tout semble en ordre. Pourtant, le nom affiché et le logo se choisissent librement : seule l’adresse réelle dit qui écrit.',
    sections: [
      {
        title: 'Lisez l’adresse, pas le nom affiché',
        text: [
          'Dans une messagerie, l’expéditeur **choisit le nom qui s’affiche**. Touchez ce nom, ou cliquez dessus, pour lire l’adresse complète qui se cache derrière.',
          'Une adresse se lit **par la fin**. Dans « securite@banque-exemple.support-client.test », le vrai propriétaire est « support-client.test », pas « banque-exemple ». Ce qui précède peut être inventé.'
        ]
      },
      {
        title: 'Regardez où mène un lien sans l’ouvrir',
        text: ['Le texte d’un lien ne dit pas où il mène. Sa destination se vérifie avant de cliquer :'],
        items: [
          '**Sur ordinateur** : survolez le lien, sa destination s’affiche en bas de la fenêtre.',
          '**Sur téléphone** : appuyez longuement dessus, sans relâcher trop tôt.',
          '**Dans le doute** : ne l’ouvrez pas.'
        ]
      },
      {
        title: 'Passez par un chemin que vous connaissez',
        text: [
          'Pour vérifier une demande, ouvrez **vous-même** l’application ou tapez l’adresse habituelle du service. N’utilisez ni le lien ni le numéro fournis dans le message.'
        ]
      }
    ],
    example: {
      title: 'Démasquez un e-mail qui imite la banque',
      intro: 'Le nom et le ton sont rassurants. Regardez plutôt les deux endroits surlignés.',
      figure: {
        kind: 'message',
        channel: 'email',
        from: 'Banque Exemple — Service Sécurité',
        details: [
          { label: 'De', value: 'alerte@banque-exemple.**verification-compte.test**' },
          { label: 'Objet', value: 'Activité inhabituelle sur votre compte' }
        ],
        body: [
          'Bonjour,',
          'Nous avons détecté une connexion inhabituelle. Pour protéger votre compte, confirmez votre identité.',
          'Accéder à mon espace : banque-exemple.**verification-compte.test**/connexion'
        ]
      },
      caption: 'L’adresse et le lien trahissent l’expéditeur',
      notes: [
        '**Le nom affiché** inspire confiance, mais il se choisit librement.',
        '**L’adresse** se termine par « verification-compte.test » : ce n’est pas le domaine de la banque.',
        '**Le lien** mène au même domaine inconnu, pas au site habituel.'
      ]
    },
    question: {
      ask: 'Le cadenas dans la barre d’adresse, ce n’est pas une garantie ?',
      answer: [
        'Non. Le cadenas dit seulement que la connexion est chiffrée : personne ne peut lire ce que vous envoyez en chemin. Il ne dit rien de **celui qui reçoit**. Un site frauduleux peut l’afficher aussi.'
      ]
    }
  },
  {
    art: 'shield',
    scene:
      'Akossiwa vient de saisir son mot de passe sur une page qui ressemblait à celle de sa banque. Un doute lui vient. Ce qu’elle fera dans les cinq prochaines minutes compte plus que l’erreur elle-même.',
    sections: [
      {
        title: 'Réagissez devant un message douteux',
        text: ['Trois gestes suffisent, et ils ne coûtent rien :'],
        items: [
          '**Ne répondez pas** : même un « non » confirme que votre numéro est actif.',
          '**Ne cliquez pas** : ni sur le lien, ni sur la pièce jointe.',
          '**Ne transférez pas** le message à vos contacts : vous leur tendriez le même piège.'
        ]
      },
      {
        title: 'Signalez pour protéger les autres',
        text: [
          'Au travail ou à l’école, prévenez la personne chargée de l’informatique. Sur un service en ligne, utilisez son bouton **« Signaler »**. Un signalement évite la même attaque à d’autres.'
        ]
      },
      {
        title: 'Agissez vite si vous avez déjà répondu',
        text: ['La rapidité limite les dégâts. Dans l’ordre :'],
        ordered: true,
        items: [
          '**Changez le mot de passe** du compte concerné.',
          '**Prévenez le service** par son canal officiel.',
          '**Surveillez vos opérations** dans les jours qui suivent.'
        ],
        after: 'Activez enfin la **validation en deux étapes** quand le service la propose. Même volé, votre mot de passe ne suffira plus.'
      }
    ],
    example: {
      title: 'Suivez Akossiwa pendant cinq minutes',
      figure: {
        kind: 'timeline',
        steps: [
          'Elle se rend compte qu’elle a saisi son mot de passe sur un faux site.',
          'Elle ouvre l’application officielle et **change ce mot de passe**.',
          'Elle appelle le service **au numéro inscrit sur sa carte**.',
          'Elle prévient le responsable informatique de son école.'
        ]
      },
      caption: 'Agir vite, par des chemins que l’on connaît déjà',
      notes: [
        'Elle agit **avant même de savoir** si le compte a été utilisé.',
        'Elle passe par une application et un numéro **qu’elle connaissait déjà**.',
        'Son signalement protège ses camarades, qui ont reçu le même message.'
      ]
    },
    question: {
      ask: 'J’ai cliqué, c’est trop tard : à quoi bon le dire ?',
      answer: [
        'Rien n’est perdu tant que vous agissez vite. Se taire est la seule vraie erreur : c’est ce qui laisse du temps au fraudeur, et ce qui expose vos collègues ou vos camarades au même message.'
      ]
    }
  }
];

/** « À la fin de ce module, vous saurez : » — les objectifs de chaque module, en tête de page. */
export const MODULE_GOALS: Record<string, string[]> = {
  phishing: ['repérer les signaux d’un message frauduleux ;', 'vérifier l’adresse d’un expéditeur et la destination d’un lien ;', 'réagir, et limiter les dégâts si vous avez déjà répondu.'],
  reseaux: ['nommer les équipements d’un réseau et leur rôle ;', 'lire une adresse IP et dire par où passe un paquet ;', 'décrire l’ouverture d’une page web, du nom de domaine à la réponse.'],
  comptes: ['créer des mots de passe longs et uniques ;', 'ajouter un second facteur à vos comptes importants ;', 'surveiller et couper les sessions ouvertes.'],
  'email-pro': ['écrire un objet qui dit le sujet et l’action attendue ;', 'construire un message autour d’une seule demande ;', 'relire le ton, la pièce jointe et les destinataires avant d’envoyer.'],
  budget: ['relever vos dépenses et les regrouper par postes ;', 'répartir un revenu entre besoins, envies et épargne ;', 'tenir votre budget avec un point de dix minutes par semaine.'],
  sauvegarde: ['dire ce qui menace un fichier gardé en un seul endroit ;', 'appliquer la règle 3-2-1 ;', 'vérifier qu’une sauvegarde se restaure vraiment.'],
  reunion: ['décider si une réunion est le bon format ;', 'préparer un ordre du jour qui cadre ;', 'conclure par des décisions, des responsables et un compte rendu.']
};

export const LESSONS_RICH: Record<string, LessonRich[]> = {
  phishing: PHISHING,
  ...LESSONS_RICH_CORE,
  ...LESSONS_RICH_EXTRA
};
