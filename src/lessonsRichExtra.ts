/**
 * Leçons rédigées des modules du catalogue : e-mail professionnel, budget, sauvegarde, réunion
 * (voir `lessonsRich.ts` pour les règles d'écriture).
 */
import type { LessonRich } from './content';

const EMAIL_PRO: LessonRich[] = [
  {
    art: 'mail',
    scene:
      'Mme Agbéko reçoit quatre-vingts e-mails par jour. Dans la liste, le vôtre s’intitule « Question ». Celui d’à côté : « Validation du devis Kossi avant vendredi ». Devinez lequel sera ouvert en premier.',
    sections: [
      {
        title: 'Annoncez le sujet et l’action',
        text: [
          'Un bon objet répond à deux questions : **de quoi s’agit-il** et **qu’attendez-vous** ? Une validation, une information, un rendez-vous. Le destinataire sait quoi faire avant même d’ouvrir.'
        ]
      },
      {
        title: 'Faites court et précis',
        text: [
          'Visez **six à huit mots**, et commencez par le mot le plus utile : sur un téléphone, la fin de l’objet est coupée.',
          'Ajoutez la **date** quand il y a une échéance. Laissez de côté les majuscules partout et les points d’exclamation : ils ressemblent à du courrier indésirable.'
        ]
      }
    ],
    example: {
      title: 'Réécrivez trois objets',
      figure: {
        kind: 'table',
        head: ['Objet vague', 'Objet utile'],
        rows: [
          ['Question', '**Validation du devis** Kossi avant vendredi'],
          ['URGENT !!!', '**Salle indisponible lundi** : réunion déplacée à 10 h'],
          ['Réunion', '**Ordre du jour** de la réunion du 12 mars']
        ]
      },
      caption: 'Le sujet, l’action, la date',
      notes: [
        'Chaque objet utile se comprend **sans ouvrir** le message.',
        'L’urgence se dit par une **date**, pas par des majuscules.',
        'Le mot le plus utile vient en premier.'
      ]
    },
    question: {
      ask: 'Et si mon message traite de plusieurs sujets ?',
      answer: [
        'C’est le signe qu’il faut plusieurs messages. Un e-mail par sujet : chacun reçoit son objet précis, se retrouve plus tard, et peut être transmis à la bonne personne sans le reste.'
      ]
    }
  },
  {
    art: 'list',
    scene:
      'Vous écrivez un long message : le contexte d’abord, les détails ensuite, et la demande tout à la fin. Votre destinataire lit les deux premières lignes entre deux réunions, pense avoir compris, et ne répond pas à ce que vous attendiez.',
    sections: [
      {
        title: 'Commencez par la demande',
        text: ['La première phrase dit **ce que vous demandez**. Le lecteur pressé a l’essentiel ; le lecteur attentif trouvera la suite.']
      },
      {
        title: 'Suivez trois temps',
        text: ['Trois courts paragraphes suffisent, dans cet ordre :'],
        ordered: true,
        items: [
          '**La demande** : ce que vous attendez.',
          '**Le contexte** : ce qu’il faut savoir pour répondre, rien de plus.',
          '**L’échéance** : pour quand, et comment vous répondre.'
        ]
      },
      {
        title: 'Numérotez ce que vous attendez',
        text: [
          'Si vous attendez plusieurs éléments, **numérotez-les**. Le destinataire répondra point par point, et vous verrez tout de suite ce qui manque.'
        ]
      }
    ],
    example: {
      title: 'Lisez un message bien construit',
      figure: {
        kind: 'message',
        channel: 'email',
        from: 'Afi Mensah',
        details: [{ label: 'Objet', value: 'Validation du planning de formation avant jeudi' }],
        body: [
          'Bonjour Madame Agbéko,',
          '**Pouvez-vous valider le planning ci-joint ?**',
          'Il tient compte des deux absences signalées la semaine dernière ; seule la séance du mardi change d’horaire.',
          'Une réponse **avant jeudi midi** me permettrait de prévenir les participants.',
          'Bien cordialement,'
        ]
      },
      caption: 'La demande, le contexte, l’échéance',
      notes: [
        '**La demande** tient dans la première phrase après la formule d’appel.',
        '**Le contexte** se limite à ce qui a changé.',
        '**L’échéance** est une date précise, avec sa raison.'
      ]
    },
    question: {
      ask: 'Commencer par la demande, n’est-ce pas un peu sec ?',
      answer: [
        'Non, si la forme reste courtoise : une formule d’appel, une question plutôt qu’un ordre, une formule de politesse. Aller droit au but est une marque de respect pour le temps de l’autre.'
      ]
    }
  },
  {
    art: 'send',
    scene:
      'Le message est parti. Trois secondes plus tard, vous relisez la phrase « vous trouverez le document ci-joint »… sans document joint. Et votre réponse à tous, qui ne concernait qu’une personne, vient d’arriver chez quarante collègues.',
    sections: [
      {
        title: 'Relisez pour le ton',
        text: [
          'Relisez à voix basse. Le ton est-il celui que vous emploieriez **en face** de la personne ? À l’écrit, l’humour et l’agacement passent mal : ce qui vous semble neutre peut se lire comme sec.'
        ]
      },
      {
        title: 'Contrôlez la pièce jointe',
        text: [
          'Si le message annonce une pièce jointe, vérifiez qu’elle est **bien jointe**, et que c’est la bonne version. Donnez-lui un nom explicite : « Planning-formation-mars.pdf » plutôt que « doc1.pdf ».'
        ]
      },
      {
        title: 'Choisissez vos destinataires',
        text: ['Chaque champ a son rôle :'],
        items: [
          '**À** : les personnes qui doivent agir ou répondre.',
          '**Cc** : les personnes qui doivent seulement être informées.',
          '**Répondre à tous** : uniquement si chacun a besoin de votre réponse.'
        ]
      }
    ],
    example: {
      title: 'Faites la relecture en trente secondes',
      figure: {
        kind: 'timeline',
        steps: [
          '**Le ton** : je relis le message à voix basse.',
          '**La pièce jointe** : elle est là, et son nom dit ce qu’elle contient.',
          '**Les destinataires** : chacun a une raison de recevoir ce message.',
          '**L’envoi** : j’ajoute les adresses, puis j’envoie.'
        ]
      },
      caption: 'Quatre contrôles avant d’envoyer',
      notes: [
        'L’ordre compte : on finit par les destinataires.',
        'Le contrôle le plus souvent oublié est celui de la **pièce jointe**.',
        'Trente secondes de relecture évitent un second e-mail d’excuses.'
      ]
    },
    question: {
      ask: 'Le message est parti avec une erreur : que faire ?',
      answer: [
        'Corrigez vite et simplement. Renvoyez un court message dans le même fil : « Avec la pièce jointe, cette fois », ou la correction en une phrase. Inutile de vous excuser longuement : une rectification rapide inspire plus confiance qu’un silence.'
      ]
    }
  }
];

const BUDGET: LessonRich[] = [
  {
    art: 'wallet',
    scene:
      'Le 20 du mois, Yao n’a plus rien. Il ne comprend pas : il n’a fait aucune grosse dépense. Les 300 F de crédit par-ci, les 500 F de beignets par-là, il ne les a simplement jamais comptés.',
    sections: [
      {
        title: 'Notez chaque dépense, le jour même',
        text: [
          'Pendant un mois, notez **chaque dépense** le jour où elle a lieu : le montant, la date, à quoi elle a servi. Un carnet ou une note sur le téléphone suffit.',
          'Le jour même, parce que la mémoire oublie les petites sommes en quelques heures.'
        ]
      },
      {
        title: 'Regroupez par postes',
        text: [
          'À la fin du mois, rangez les dépenses en **cinq ou six postes** : logement, alimentation, transport, communication, imprévus. Avec trop de postes, vous ne verrez plus rien.'
        ]
      },
      {
        title: 'Cherchez les petites dépenses répétées',
        text: [
          'Une dépense de 300 F paraît négligeable. Répétée chaque jour, elle pèse 9 000 F à la fin du mois. Ce sont souvent ces **petites sommes régulières** qui expliquent un budget qui ne tient pas, plus que les grosses dépenses dont on se souvient.'
        ]
      }
    ],
    example: {
      title: 'Lisez le relevé de Yao',
      figure: {
        kind: 'table',
        head: ['Poste', 'Dépenses du mois', 'Total'],
        rows: [
          ['Transport', '2 trajets par jour à 300 F', '18 000 F'],
          ['Communication', '300 F de crédit, trois fois par semaine', '3 600 F'],
          ['Petits achats', 'Beignets et boissons : 500 F par jour', '**15 000 F**']
        ]
      },
      caption: 'Un extrait du relevé, sur un mois de trente jours',
      notes: [
        'Aucune de ces dépenses ne dépasse 600 F, et pourtant le total approche **37 000 F**.',
        'Les petits achats pèsent presque autant que le transport.',
        'Sans relevé, Yao aurait cherché une grosse dépense qui n’existe pas.'
      ]
    },
    question: {
      ask: 'Noter chaque dépense, n’est-ce pas trop contraignant ?',
      answer: [
        'C’est l’effort d’un mois, pas de toute une vie. Dix secondes par dépense suffisent. Ensuite, vous connaîtrez vos postes, et un point par semaine suffira.'
      ]
    }
  },
  {
    art: 'chart',
    scene:
      'Ama reçoit 60 000 F le premier du mois. Elle se promet d’épargner « ce qui restera ». Le 30, il ne reste rien, comme le mois dernier. Le problème n’est pas sa volonté : c’est l’ordre dans lequel elle s’y prend.',
    sections: [
      {
        title: 'Partez du revenu réel',
        text: [
          'Un budget se construit sur l’argent **réellement reçu**, pas sur celui qu’on espère. Si vos revenus varient, prenez le mois le plus faible comme base.'
        ]
      },
      {
        title: 'Répartissez en trois parts',
        text: ['Une répartition courante sert de point de départ :'],
        items: [
          '**Les besoins** : le logement, les repas, le transport.',
          '**Les envies** : les sorties, les vêtements, les loisirs.',
          '**L’épargne** : les projets et les imprévus.'
        ],
        after: 'Ce sont des repères, pas une règle. Quand le loyer est lourd, les besoins dépassent facilement la moitié du revenu.'
      },
      {
        title: 'Épargnez en premier',
        text: [
          'Mettez l’épargne de côté **dès la réception** du revenu, sur un compte ou dans une tontine. Ce qui reste est ce que vous pouvez dépenser. À l’inverse, « épargner ce qui restera » ne laisse presque jamais rien.'
        ]
      }
    ],
    example: {
      title: 'Répartissez le revenu d’Ama',
      intro: 'Avec le repère 50 / 30 / 20, les 60 000 F d’Ama se répartissent ainsi.',
      figure: {
        kind: 'split',
        parts: [
          { label: 'Besoins', percent: 50, note: '30 000 F' },
          { label: 'Envies', percent: 30, note: '18 000 F' },
          { label: 'Épargne', percent: 20, note: '12 000 F' }
        ]
      },
      caption: 'La répartition 50 / 30 / 20 d’un revenu de 60 000 F',
      notes: [
        'Les trois parts font bien **60 000 F** : chaque franc a un usage.',
        'Les 12 000 F d’épargne sont mis de côté **le premier du mois**.',
        'Avec un loyer de 35 000 F, les besoins d’Ama dépasseraient la moitié : elle réduirait alors la part des envies.'
      ]
    },
    question: {
      ask: 'Avec un petit revenu, épargner a-t-il un sens ?',
      answer: [
        'Oui, même pour une petite somme. L’épargne sert d’abord à absorber les imprévus : une ordonnance, une réparation. Sans réserve, chaque imprévu devient une dette. Commencez par un montant que vous tiendrez tous les mois.'
      ]
    }
  },
  {
    art: 'calendar',
    scene:
      'En janvier, Koffi a fait un beau budget. En mars, il ne sait plus où est la feuille. Un budget que l’on ne regarde pas est une prévision oubliée : il ne protège de rien.',
    sections: [
      {
        title: 'Fixez un rendez-vous court',
        text: [
          'Choisissez un moment fixe, par exemple le dimanche soir, et tenez-le **dix minutes**. Un point court et régulier vaut mieux qu’un grand bilan que l’on repousse.'
        ]
      },
      {
        title: 'Comparez le prévu et le réel',
        text: [
          'Poste par poste, mettez côte à côte ce que vous aviez **prévu** et ce que vous avez **dépensé**. L’écart vous dit où regarder : inutile de tout reprendre.'
        ]
      },
      {
        title: 'Ajustez au lieu d’abandonner',
        text: [
          'Un dépassement n’est pas un échec. Il signifie que la prévision était irréaliste, ou qu’un poste doit baisser. Dans les deux cas, on **corrige le mois suivant**. Un budget s’améliore à l’usage.'
        ]
      }
    ],
    example: {
      title: 'Faites le point de la semaine',
      figure: {
        kind: 'table',
        head: ['Poste', 'Prévu', 'Réel', 'Écart'],
        rows: [
          ['Alimentation', '7 000 F', '6 500 F', '− 500 F'],
          ['Transport', '4 000 F', '5 500 F', '**+ 1 500 F**'],
          ['Communication', '1 000 F', '1 000 F', '0 F']
        ]
      },
      caption: 'Le point hebdomadaire de Koffi',
      notes: [
        'Un seul poste dépasse : c’est **là** qu’il faut regarder.',
        'Koffi a pris le taxi-moto trois fois de plus que prévu.',
        'Sa décision : relever la prévision de transport, et baisser celle des envies du même montant.'
      ]
    },
    question: {
      ask: 'J’ai dépassé mon budget dès la deuxième semaine : est-ce raté ?',
      answer: [
        'Non. Le premier budget est toujours faux, parce qu’il repose sur des estimations. C’est le point de chaque semaine qui le rend juste. Corrigez la prévision, et continuez.'
      ]
    }
  }
];

const SAUVEGARDE: LessonRich[] = [
  {
    art: 'drive',
    scene:
      'La veille de la soutenance, la clé USB d’Edem refuse de s’ouvrir. Son mémoire de quatre-vingts pages n’existait que là. Il n’y a rien à réparer : ce qui n’existait qu’à un endroit n’existe plus.',
    sections: [
      {
        title: 'Connaissez les quatre causes de perte',
        text: ['Un fichier se perd de quatre façons :'],
        items: [
          '**La panne** : un disque ou une clé s’arrête sans prévenir.',
          '**La perte ou le vol** : le téléphone disparaît, les photos avec.',
          '**L’erreur** : on efface ou on écrase le mauvais fichier.',
          '**Le logiciel malveillant** : un rançongiciel chiffre tout et réclame une rançon.'
        ]
      },
      {
        title: 'Distinguez sauvegarde et synchronisation',
        text: [
          'Une **sauvegarde** est une copie **séparée**, qui survit quand l’original disparaît.',
          'La **synchronisation** ne joue pas ce rôle : si vous effacez un fichier sur le téléphone, il s’efface aussi en ligne. La corbeille non plus : elle se vide.'
        ]
      },
      {
        title: 'Commencez par l’irremplaçable',
        text: [
          'Tout ne se vaut pas. Un logiciel se réinstalle ; une photo de famille, un diplôme scanné, un mémoire en cours **ne se retrouvent pas**. Ce sont eux qu’il faut copier en premier.'
        ]
      }
    ],
    example: {
      title: 'Classez vos fichiers par priorité',
      figure: {
        kind: 'table',
        head: ['Fichier', 'Peut-on le retrouver ?', 'Priorité'],
        rows: [
          ['Mémoire en cours', 'Non', '**Haute**'],
          ['Photos de famille', 'Non', '**Haute**'],
          ['Diplômes et pièces scannés', 'Difficilement', '**Haute**'],
          ['Applications, musique achetée', 'Oui, en les retéléchargeant', 'Basse']
        ]
      },
      caption: 'Ce qui est irremplaçable passe en premier',
      notes: [
        'La question à se poser : **si je le perds ce soir, puis-je le retrouver demain ?**',
        'Les fichiers les plus précieux sont souvent les plus légers.',
        'Une application se retélécharge ; un souvenir ne se refait pas.'
      ]
    },
    question: {
      ask: 'Mes photos sont déjà « dans le cloud » : n’est-ce pas une sauvegarde ?',
      answer: [
        'Cela dépend du réglage. Si le service **synchronise**, une suppression sur le téléphone se répercute en ligne. Vérifiez ce qui se passe quand vous effacez une photo, et combien de temps elle reste récupérable. Dans le doute, gardez une seconde copie ailleurs.'
      ]
    }
  },
  {
    art: 'cloud',
    scene:
      'Edem a retenu la leçon : il copie désormais son mémoire sur une seconde clé USB, rangée dans le même sac que la première. Un vol de sac, et les deux copies partent ensemble. Copier ne suffit pas : il faut copier **ailleurs**.',
    sections: [
      {
        title: 'Retenez la règle en trois chiffres',
        text: ['La règle tient en une ligne :'],
        items: [
          '**3 copies** de vos fichiers importants : l’original et deux sauvegardes.',
          '**2 supports différents** : par exemple un disque externe et un stockage en ligne.',
          '**1 copie ailleurs** : hors de chez vous.'
        ]
      },
      {
        title: 'Comprenez chaque chiffre',
        text: [
          'Chaque chiffre répond à un risque. **Trois copies**, parce qu’une sauvegarde peut elle-même tomber en panne. **Deux supports**, parce qu’un même défaut touche souvent tous les appareils d’un même type.',
          '**Une copie ailleurs**, parce qu’un vol, un incendie ou une inondation emporte tout ce qui se trouve au même endroit.'
        ]
      }
    ],
    example: {
      title: 'Appliquez la règle au mémoire d’Edem',
      figure: {
        kind: 'flow',
        nodes: [
          { art: 'laptop', label: 'L’original', sub: 'Sur son ordinateur' },
          { art: 'drive', label: 'Sauvegarde 1', sub: 'Disque externe, à la maison' },
          { art: 'cloud', label: 'Sauvegarde 2', sub: 'En ligne, hors de la maison' }
        ],
        links: ['copie', 'copie']
      },
      caption: 'Trois copies, deux supports, une copie ailleurs',
      notes: [
        '**3** : l’original et deux sauvegardes.',
        '**2** : un disque d’un côté, un stockage en ligne de l’autre.',
        '**1** : si la maison est cambriolée, la copie en ligne reste intacte.'
      ]
    },
    question: {
      ask: 'Deux clés USB, est-ce que cela compte pour deux supports ?',
      answer: [
        'Non. Deux clés du même type vieillissent de la même façon et se rangent souvent au même endroit. « Deux supports » veut dire deux **technologies** différentes : une clé ou un disque d’un côté, un stockage en ligne de l’autre.'
      ]
    }
  },
  {
    art: 'restore',
    scene:
      'Depuis deux ans, le disque externe d’Abla clignote chaque soir : la sauvegarde tourne. Le jour où son ordinateur rend l’âme, elle branche le disque. Le dossier est là, mais la dernière copie date de quatorze mois.',
    sections: [
      {
        title: 'Restaurez un fichier pour de vrai',
        text: [
          'Le seul test qui compte : **restaurer** un fichier depuis la sauvegarde, puis l’**ouvrir**. Une sauvegarde que l’on n’a jamais relue est une promesse, pas une preuve.',
          'Faites-le une fois par trimestre, avec un fichier pris au hasard.'
        ]
      },
      {
        title: 'Contrôlez la date',
        text: [
          'Regardez la **date de la dernière sauvegarde**. Si elle est ancienne, la copie automatique s’est arrêtée : disque plein, câble débranché, mot de passe changé. Mieux vaut le découvrir aujourd’hui.'
        ]
      },
      {
        title: 'Protégez la sauvegarde elle-même',
        text: ['Une sauvegarde contient tout ce que vous avez de précieux. Traitez-la comme un compte sensible :'],
        items: [
          '**En ligne** : un mot de passe unique et la double authentification.',
          '**Sur disque externe** : rangez-le à l’abri, et ne le prêtez pas.'
        ]
      }
    ],
    example: {
      title: 'Faites le test du trimestre',
      figure: {
        kind: 'timeline',
        steps: [
          'Je choisis **un fichier au hasard** dans la sauvegarde.',
          'Je le **restaure** dans un dossier de test.',
          'Je l’**ouvre** : il s’affiche, et c’est bien la dernière version.',
          'Je note la **date de la dernière sauvegarde**.'
        ]
      },
      caption: 'Cinq minutes, une fois par trimestre',
      notes: [
        'Restaurer sans **ouvrir** ne prouve rien : un fichier peut être copié et illisible.',
        'La date dit si la copie automatique tourne encore.',
        'Le test se fait quand tout va bien, pas le jour de la panne.'
      ]
    },
    question: {
      ask: 'Ma sauvegarde est automatique : pourquoi la vérifier ?',
      answer: [
        'Parce qu’un automatisme s’arrête sans prévenir : le disque est plein, un réglage a changé, le service a expiré. Le voyant qui clignote ne dit pas ce qui a été copié. Seule une restauration le dit.'
      ]
    }
  }
];

const REUNION: LessonRich[] = [
  {
    art: 'people',
    scene:
      'Huit personnes sont réunies une heure pour écouter un collègue lire un document. À la sortie, rien n’a été décidé. Huit heures de travail sont parties pour une information qui tenait dans un message.',
    sections: [
      {
        title: 'Informer ou décider : choisissez le format',
        text: [
          'Pour **informer**, l’écrit suffit : un message ou un document partagé, que chacun lit quand il peut.',
          'Une **réunion** se justifie quand il faut être ensemble : trancher une question, résoudre un désaccord, construire quelque chose à plusieurs.'
        ]
      },
      {
        title: 'Écrivez l’objectif en une phrase',
        text: [
          'Avant d’inviter qui que ce soit, écrivez ce qui devra être **décidé ou produit** à la fin. « Parler du projet » n’est pas un objectif. « Choisir la date de lancement » en est un.'
        ]
      },
      {
        title: 'Invitez ceux qui décident',
        text: [
          'N’invitez que les personnes qui **décident** ou qui apportent une **information nécessaire**. Les autres recevront le compte rendu. Une réunion à cinq avance plus vite qu’une réunion à douze.'
        ]
      }
    ],
    example: {
      title: 'Choisissez le bon format',
      figure: {
        kind: 'table',
        head: ['Besoin', 'Format', 'Pourquoi'],
        rows: [
          ['Annoncer les nouveaux horaires', 'Un message', 'Personne n’a rien à décider'],
          ['Choisir entre deux fournisseurs', '**Une réunion**', 'Il faut trancher ensemble'],
          ['Partager les chiffres du mois', 'Un document', 'Chacun le lit à son rythme'],
          ['Régler un désaccord sur les priorités', '**Une réunion**', 'Il faut s’écouter et arbitrer']
        ]
      },
      caption: 'Informer par écrit, décider en réunion',
      notes: [
        'Deux besoins sur quatre se règlent **sans réunion**.',
        'Le mot clé d’une réunion utile : **ensemble**.',
        'Les deux réunions du tableau ont un point commun : il en sort une **décision**.'
      ]
    },
    question: {
      ask: 'Une réunion d’information, c’est donc toujours inutile ?',
      answer: [
        'Pas toujours. Quand l’annonce est délicate ou appelle beaucoup de questions, se voir est préférable : une réorganisation, par exemple. Mais c’est alors une réunion pour **répondre aux questions**, courte, avec le document envoyé avant.'
      ]
    }
  },
  {
    art: 'agenda',
    scene:
      'L’invitation dit seulement : « Réunion d’équipe, mardi 10 h ». Chacun arrive avec son idée de ce dont on va parler. Au bout d’une heure, trois sujets ont été effleurés, aucun n’est réglé, et le plus important n’a pas été abordé.',
    sections: [
      {
        title: 'Donnez quatre informations par point',
        text: ['Pour chaque point de l’ordre du jour, indiquez :'],
        items: [
          '**Le sujet** : de quoi on parle.',
          '**Le résultat attendu** : une décision, un avis ou une simple information.',
          '**Le porteur** : la personne qui présente.',
          '**La durée** : le temps qu’on lui accorde.'
        ]
      },
      {
        title: 'Envoyez-le la veille, avec les documents',
        text: [
          'Un document découvert en séance se lit mal et se discute mal. Envoyez l’ordre du jour et les pièces **la veille** : la réunion sert alors à décider, pas à lire.'
        ]
      },
      {
        title: 'Commencez par le plus important',
        text: [
          'Placez le point principal **en premier** : c’est lui qui aura le plus d’attention, et il ne risque pas d’être sacrifié faute de temps. Les sujets divers vont à la fin.'
        ]
      }
    ],
    example: {
      title: 'Lisez un ordre du jour qui cadre',
      figure: {
        kind: 'table',
        head: ['Sujet', 'Résultat attendu', 'Porteur', 'Durée'],
        rows: [
          ['Choix du fournisseur', '**Décision**', 'Kossi', '20 min'],
          ['Planning de mars', 'Avis', 'Afi', '15 min'],
          ['Points divers', 'Information', 'Tous', '10 min']
        ]
      },
      caption: 'Trois points, quarante-cinq minutes',
      notes: [
        'Le point qui demande une **décision** passe en premier.',
        'Chaque point a un porteur : personne ne découvre son rôle en séance.',
        'Le total fait **45 minutes** : la réunion a une fin annoncée.'
      ]
    },
    question: {
      ask: 'Et si un sujet imprévu surgit pendant la réunion ?',
      answer: [
        'Notez-le, et décidez tout de suite de son sort : il attend les points divers, ou il fera l’objet d’un échange à part. Le traiter sur-le-champ, c’est sacrifier un point que chacun avait préparé.'
      ]
    }
  },
  {
    art: 'done',
    scene:
      'Trois semaines après la réunion, personne n’a commandé le matériel. « Je croyais que c’était toi. » Tout le monde se souvient qu’on en a parlé ; personne ne se souvient de qui devait le faire.',
    sections: [
      {
        title: 'Relisez les décisions avant de partir',
        text: [
          '**Cinq minutes avant la fin**, relisez à voix haute ce qui a été décidé. C’est le moment où les malentendus apparaissent, pendant que tout le monde est encore là pour les lever.'
        ]
      },
      {
        title: 'Donnez à chaque décision un nom et une date',
        text: [
          'Une décision sans responsable n’appartient à personne. Pour chacune, notez **qui** s’en charge et **pour quand**. « On commande le matériel » devient « Kossi commande le matériel avant le 15 ».'
        ]
      },
      {
        title: 'Envoyez le compte rendu le jour même',
        text: [
          'Le compte rendu part **le jour même**, tant que les souvenirs sont frais. Il tient en quelques lignes : les décisions, les responsables, les échéances, les points reportés. Personne ne lit trois pages.'
        ]
      }
    ],
    example: {
      title: 'Lisez un compte rendu utile',
      figure: {
        kind: 'message',
        channel: 'email',
        from: 'Afi Mensah',
        details: [{ label: 'Objet', value: 'Compte rendu — réunion fournisseurs du 12 mars' }],
        body: [
          'Bonjour à tous,',
          'Voici ce que nous avons décidé ce matin :',
          '1. Fournisseur retenu : Atelier Kpalimé. **Kossi** passe la commande **avant le 15 mars**.',
          '2. Planning de mars validé. **Afi** l’envoie aux participants **demain**.',
          'Point reporté : le budget de communication, à la réunion du 26.'
        ]
      },
      caption: 'Des décisions, des noms, des dates',
      notes: [
        'Chaque décision a **un responsable** et **une date**.',
        'Le point reporté est écrit : il ne sera pas oublié.',
        'Le message est parti le jour même, et se lit en trente secondes.'
      ]
    },
    question: {
      ask: 'Faut-il aussi noter les discussions, ou seulement les décisions ?',
      answer: [
        'Seulement ce qui servira demain : les décisions, les responsables, les échéances. Le détail des échanges alourdit le compte rendu et relance les débats. Si un désaccord reste ouvert, notez-le en une ligne, comme point reporté.'
      ]
    }
  }
];

export const LESSONS_RICH_EXTRA: Record<string, LessonRich[]> = {
  'email-pro': EMAIL_PRO,
  budget: BUDGET,
  sauvegarde: SAUVEGARDE,
  reunion: REUNION
};
