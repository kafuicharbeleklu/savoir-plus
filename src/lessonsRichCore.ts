/**
 * Leçons rédigées des modules « Comprendre les réseaux » et « Protéger ses comptes »
 * (voir `lessonsRich.ts` pour les règles d'écriture).
 */
import type { LessonRich } from './content';

const RESEAUX: LessonRich[] = [
  {
    art: 'switch',
    scene:
      'Dans la salle informatique du lycée, vingt postes partagent la même imprimante et la même connexion à Internet. Aucun fil ne relie pourtant deux postes entre eux : tout passe par quelques boîtiers, chacun avec un rôle précis.',
    sections: [
      {
        title: 'Découvrez les postes : clients et serveurs',
        text: [
          'Un **poste** est un appareil qui utilise le réseau : ordinateur, téléphone, imprimante. On parle de **client** quand il demande un service, et de **serveur** quand il le fournit. Le même ordinateur peut jouer les deux rôles.'
        ]
      },
      {
        title: 'Reliez les appareils avec le commutateur',
        text: [
          'Le **commutateur** (*switch*) relie par câble les appareils d’un même réseau local. Le **point d’accès Wi-Fi** fait le même travail sans fil. Grâce à eux, deux postes de la salle échangent directement.'
        ]
      },
      {
        title: 'Sortez du réseau local avec le routeur',
        text: [
          'Le **routeur** relie des réseaux différents. C’est lui qui fait passer les données de la salle vers Internet, et inversement : on l’appelle aussi la **passerelle**.',
          'À la maison, la « box » réunit souvent les trois dans un seul boîtier : routeur, commutateur et point d’accès Wi-Fi.'
        ]
      }
    ],
    example: {
      title: 'Suivez le chemin d’une page web',
      intro: 'Un élève ouvre un site depuis un poste de la salle. Sa demande traverse trois équipements avant d’atteindre Internet.',
      figure: {
        kind: 'flow',
        nodes: [
          { art: 'laptop', label: 'Le poste', sub: 'Il demande la page' },
          { art: 'switch', label: 'Le commutateur', sub: 'Il relie la salle' },
          { art: 'router', label: 'Le routeur', sub: 'Il fait sortir' },
          { art: 'globe', label: 'Internet', sub: 'Les autres réseaux' }
        ],
        links: ['câble', 'câble', 'sortie']
      },
      caption: 'Du poste à Internet : trois équipements, trois rôles',
      notes: [
        '**Le commutateur** reste à l’intérieur du réseau local : il ne connaît que la salle.',
        '**Le routeur** est le seul à regarder vers l’extérieur.',
        'Si Internet tombe mais que l’imprimante répond encore, cherchez du côté du routeur.'
      ]
    },
    question: {
      ask: 'Ma box fait tout à la maison : pourquoi distinguer ces équipements ?',
      answer: [
        'Parce que les rôles restent différents, même dans un seul boîtier. Savoir lequel est en cause permet de chercher une panne au bon endroit : un problème entre deux appareils de la maison ne se règle pas comme une coupure d’Internet.'
      ]
    }
  },
  {
    art: 'route',
    scene:
      'Votre ordinateur affiche l’adresse 192.168.1.24. Celui de votre voisine, 192.168.1.37. Ces numéros ne sont pas choisis au hasard : ils disent à quel réseau chaque poste appartient, et par où passer pour en sortir.',
    sections: [
      {
        title: 'Lisez une adresse IP',
        text: [
          'Une **adresse IP** identifie une interface sur le réseau, comme une adresse postale identifie une boîte aux lettres. En IPv4, elle s’écrit en quatre nombres de 0 à 255 : 192.168.1.24.',
          'Elle désigne une interface, pas une personne : un ordinateur relié par câble et par Wi-Fi possède deux adresses.'
        ]
      },
      {
        title: 'Séparez le réseau et le poste avec le masque',
        text: [
          'Le **masque** indique quelle partie de l’adresse désigne le réseau. Avec « /24 », les trois premiers nombres désignent le réseau et le dernier désigne le poste.',
          'Dans 192.168.1.0/24, tous les postes dont l’adresse commence par 192.168.1 sont **voisins** : ils se parlent directement.'
        ]
      },
      {
        title: 'Passez par la passerelle pour sortir',
        text: [
          'Pour joindre une adresse qui n’est pas dans son réseau, un poste confie le paquet à la **passerelle par défaut** : l’adresse du routeur sur le réseau local, souvent 192.168.1.1. Le routeur se charge de la suite.'
        ]
      }
    ],
    example: {
      title: 'Suivez deux paquets',
      intro: 'Un même poste, 192.168.1.24/24, envoie deux messages. Le masque décide du chemin.',
      figure: {
        kind: 'table',
        head: ['Destinataire', 'Même réseau ?', 'Chemin'],
        rows: [
          ['192.168.1.37', '**Oui** : l’adresse commence par 192.168.1', 'Directement, par le commutateur'],
          ['8.8.8.8', '**Non** : c’est un autre réseau', 'Vers la passerelle 192.168.1.1, puis Internet']
        ]
      },
      caption: 'Local ou distant : le masque décide',
      notes: [
        'Le poste compare **le début de l’adresse** du destinataire avec le sien.',
        'Pour un voisin, le routeur **n’intervient pas**.',
        'Pour tout le reste, une seule adresse à connaître : celle de la passerelle.'
      ]
    },
    question: {
      ask: 'Deux appareils peuvent-ils avoir la même adresse IP ?',
      answer: [
        'Pas sur le même réseau : les messages ne sauraient plus à qui aller, et l’un des deux perdrait la connexion. C’est pourquoi la box attribue elle-même les adresses, sans doublon.',
        'En revanche, des millions de maisons utilisent 192.168.1.24 chacune de leur côté : ces adresses **privées** ne sortent pas du réseau local.'
      ]
    }
  },
  {
    art: 'globe',
    scene:
      'Vous tapez « exemple.edu » dans votre navigateur et la page s’affiche en une seconde. Pendant cette seconde, votre appareil a posé une question, reçu une réponse, puis ouvert une connexion. Rien de tout cela ne s’est vu.',
    sections: [
      {
        title: 'Traduisez un nom en adresse avec le DNS',
        text: [
          'Les machines se joignent par des adresses IP, les humains retiennent des noms. Le **DNS** fait la traduction : c’est l’annuaire d’Internet. Vous donnez « exemple.edu », il répond par une adresse IP.'
        ]
      },
      {
        title: 'Suivez l’aller et le retour',
        text: [
          'Une fois l’adresse connue, le navigateur envoie une **requête** au serveur. Elle sort par la passerelle, traverse Internet, et le serveur renvoie une **réponse** par le chemin inverse.',
          'La connexion est le plus souvent **chiffrée** (HTTPS) : le contenu de l’échange est illisible en chemin.'
        ]
      },
      {
        title: 'Reconnaissez une panne de DNS',
        text: [
          'Quand le DNS ne répond plus, le navigateur annonce presque aussitôt qu’il **ne trouve pas** le site, au lieu d’attendre longtemps. Les applications déjà connectées, elles, continuent parfois de fonctionner.'
        ]
      }
    ],
    example: {
      title: 'Décomposez l’ouverture d’une page',
      figure: {
        kind: 'timeline',
        steps: [
          'Vous tapez « exemple.edu » dans le navigateur.',
          'Votre appareil demande au **DNS** l’adresse de ce nom.',
          'Le DNS répond par une adresse IP.',
          'Le navigateur envoie sa **requête** à cette adresse, par la passerelle.',
          'Le serveur renvoie la page : c’est la **réponse**.'
        ]
      },
      caption: 'Une question à l’annuaire, puis un aller-retour',
      notes: [
        'Le DNS intervient **avant** tout échange avec le site.',
        'La requête et la réponse suivent le même chemin, en sens inverse.',
        'Si la deuxième étape échoue, rien de la suite ne peut avoir lieu.'
      ]
    },
    question: {
      ask: 'Un site ne s’ouvre pas, mais ma messagerie fonctionne : que se passe-t-il ?',
      answer: [
        'Votre connexion n’est pas en cause, puisqu’un autre service répond. Deux pistes restent : le site lui-même est en panne, ou son nom n’est pas traduit. Essayez un autre site : s’il s’ouvre, le problème vient du site visé.'
      ]
    }
  }
];

const COMPTES: LessonRich[] = [
  {
    art: 'key',
    scene:
      'Kodjo utilise le même mot de passe partout depuis le lycée. Un petit forum où il s’était inscrit se fait pirater. Le soir même, quelqu’un essaie ce mot de passe sur sa messagerie, et il fonctionne.',
    sections: [
      {
        title: 'Un service, un mot de passe',
        text: [
          'Quand un site subit une fuite, les mots de passe volés sont essayés **automatiquement** sur les autres services. Un mot de passe unique par service limite la casse à un seul compte.',
          'Commencez par les comptes qui comptent le plus : la messagerie, la banque, le mobile money.'
        ]
      },
      {
        title: 'Préférez la longueur aux astuces',
        text: [
          'Remplacer un « a » par un « @ » ne trompe plus personne. Ce qui résiste, c’est la **longueur**. Une **phrase secrète** de quatre ou cinq mots sans lien entre eux est longue, et pourtant facile à retenir.',
          'Évitez ce qu’on peut deviner : un prénom, une date de naissance, le nom de votre équipe.'
        ]
      },
      {
        title: 'Laissez un gestionnaire s’en souvenir',
        text: [
          'Personne ne retient trente mots de passe différents. Un **gestionnaire de mots de passe** les garde dans un coffre chiffré et les saisit à votre place. Il ne vous reste qu’une phrase secrète à connaître : celle du coffre.'
        ]
      }
    ],
    example: {
      title: 'Comparez deux mots de passe',
      figure: {
        kind: 'table',
        head: ['Critère', 'Kodjo2008!', 'tortue-pagne-volcan-matin'],
        rows: [
          ['Longueur', '10 caractères', '**25 caractères**'],
          ['Peut-on le deviner ?', 'Oui : un prénom et une année', '**Non** : quatre mots sans lien'],
          ['Facile à retenir ?', 'Oui', 'Oui, comme une petite image']
        ]
      },
      caption: 'La longueur protège mieux que les symboles',
      notes: [
        'Le prénom et l’année de naissance se trouvent en deux minutes sur un réseau social.',
        'Quatre mots pris au hasard donnent bien plus de combinaisons qu’un mot « décoré ».',
        'Ne reprenez pas cet exemple : une phrase secrète publiée n’est plus secrète.'
      ]
    },
    question: {
      ask: 'Noter mes mots de passe dans un carnet, est-ce si grave ?',
      answer: [
        'Un carnet rangé chez vous protège mieux qu’un mot de passe réutilisé partout : un pirate à distance ne peut pas le lire. Mais il ne vous suit pas hors de la maison, et il se perd. Un gestionnaire rend le même service, partout et sous clé.'
      ]
    }
  },
  {
    art: 'phone',
    scene:
      'Il est 23 h. Votre téléphone affiche : « Tentative de connexion à votre compte. Est-ce bien vous ? » Vous êtes dans votre lit, vous n’avez rien demandé. Quelqu’un connaît donc votre mot de passe, et une seule chose l’arrête : cette question.',
    sections: [
      {
        title: 'Ajoutez une seconde preuve',
        text: [
          'La **double authentification** demande deux preuves : ce que vous **savez** (le mot de passe) et ce que vous **avez** (votre téléphone ou une clé). Voler l’une ne suffit plus.'
        ]
      },
      {
        title: 'Choisissez votre second facteur',
        text: ['Toutes les méthodes ne se valent pas, mais toutes valent mieux que rien :'],
        items: [
          '**L’application d’authentification** : elle affiche un code qui change toutes les trente secondes. C’est le bon choix par défaut.',
          '**La clé de sécurité** : un petit objet à brancher ou à approcher. La protection la plus solide.',
          '**Le SMS** : mieux que rien, mais un numéro de téléphone peut être détourné.'
        ]
      },
      {
        title: 'Gardez vos codes de secours',
        text: [
          'À l’activation, le service vous remet des **codes de secours**. Ils vous sauvent si vous perdez votre téléphone. Imprimez-les ou notez-les, et rangez-les hors ligne.'
        ]
      }
    ],
    example: {
      title: 'Voyez pourquoi deux preuves valent mieux qu’une',
      figure: {
        kind: 'flow',
        nodes: [
          { art: 'key', label: 'Le mot de passe', sub: 'Ce que vous savez' },
          { art: 'phone', label: 'Le téléphone', sub: 'Ce que vous avez' },
          { art: 'shield', label: 'Votre compte', sub: 'Il s’ouvre' }
        ],
        links: ['et', 'ensemble']
      },
      caption: 'Il faut les deux preuves pour entrer',
      notes: [
        'Voler le mot de passe **ne suffit plus** : il manque le téléphone.',
        'Voler le téléphone ne suffit pas non plus : il manque le mot de passe.',
        'Une demande que vous n’avez pas déclenchée veut dire que la première preuve est **déjà perdue** : refusez, puis changez le mot de passe.'
      ]
    },
    question: {
      ask: 'Et si je perds mon téléphone ?',
      answer: [
        'C’est exactement le rôle des codes de secours : chacun remplace une fois le code du téléphone. Sans eux, il faut passer par la procédure de récupération du service, qui peut prendre plusieurs jours. Rangez-les dès l’activation.'
      ]
    }
  },
  {
    art: 'sessions',
    scene:
      'Au cybercafé, Afi consulte sa messagerie, puis s’en va en fermant simplement la fenêtre. Le client suivant rouvre le navigateur : la boîte d’Afi s’affiche, toujours connectée.',
    sections: [
      {
        title: 'Comprenez ce qu’est une session',
        text: [
          'Quand vous vous connectez, le service ouvre une **session** : il se souvient de l’appareil pour ne pas redemander le mot de passe à chaque page. Fermer la fenêtre ne ferme pas la session. Seul le bouton **« Se déconnecter »** le fait.'
        ]
      },
      {
        title: 'Protégez-vous sur un poste partagé',
        text: ['Sur un ordinateur qui n’est pas le vôtre, trois gestes :'],
        items: [
          '**Ouvrez une fenêtre privée** : rien n’y est conservé à la fermeture.',
          '**Refusez d’enregistrer le mot de passe** quand le navigateur le propose.',
          '**Déconnectez-vous** avant de partir.'
        ]
      },
      {
        title: 'Coupez une session à distance',
        text: [
          'Dans les paramètres de sécurité de vos comptes, une page liste les **appareils connectés**. Vous pouvez y **révoquer** une session : l’appareil visé est déconnecté sur-le-champ, où qu’il soit.',
          'Après une révocation, changez le mot de passe si vous doutez qu’il soit resté secret.'
        ]
      }
    ],
    example: {
      title: 'Passez en revue les appareils connectés',
      intro: 'Le soir même, Afi ouvre la liste des sessions de son compte depuis son téléphone.',
      figure: {
        kind: 'table',
        head: ['Appareil', 'Dernière activité', 'À faire'],
        rows: [
          ['Téléphone d’Afi', 'À l’instant', 'Rien : c’est la session en cours'],
          ['Ordinateur du cybercafé', 'Aujourd’hui, 17 h 40', '**Révoquer** : session oubliée'],
          ['Appareil inconnu', 'Il y a 3 jours', '**Révoquer**, puis changer le mot de passe']
        ]
      },
      caption: 'La liste des sessions d’un compte',
      notes: [
        'Une session oubliée se coupe **à distance**.',
        'Un appareil que vous ne reconnaissez pas est une **alerte** : le mot de passe est peut-être connu.',
        'Afi n’a pas besoin de retourner au cybercafé : tout se fait depuis son téléphone.'
      ]
    },
    question: {
      ask: 'Changer mon mot de passe déconnecte-t-il les autres appareils ?',
      answer: [
        'Pas toujours. Certains services le font d’office, d’autres le proposent, d’autres encore laissent les sessions ouvertes. Ne le supposez pas : après un changement de mot de passe, ouvrez la liste des appareils et révoquez ceux qui n’ont rien à y faire.'
      ]
    }
  }
];

export const LESSONS_RICH_CORE: Record<string, LessonRich[]> = {
  reseaux: RESEAUX,
  comptes: COMPTES
};
