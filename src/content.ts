export interface StudyLesson {
  title: string;
  label: string;
  minutes: string;
  intro: string;
  body: string;
  points: string[];
  tip: string;
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
  lessons: StudyLesson[];
  questions: StudyQuestion[];
}

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
          'Une menace : « Votre compte sera fermé dans 24 h. »',
          'Une demande sensible : mot de passe, code de connexion ou coordonnées bancaires.',
          'Une action inattendue : ouvrir une pièce jointe ou payer immédiatement.'
        ],
        tip: 'Le bon réflexe : faire une pause. L’urgence du message ne doit pas devenir la vôtre.'
      },
      {
        title: 'Vérifier la source',
        label: 'Regarder derrière le nom',
        minutes: '4 min',
        intro: 'Le nom affiché peut être familier. L’adresse réelle et la destination du lien racontent parfois une autre histoire.',
        body: 'Inspectez l’adresse complète. Sur ordinateur, survolez le lien pour voir sa destination ; sur mobile, évitez de l’ouvrir si vous avez un doute.',
        points: [
          'Lisez le domaine complet : assistance@banque-exemple.test n’est pas votre banque.',
          'Un cadenas HTTPS ne prouve pas qu’un site est honnête.',
          'Retrouvez le service en ouvrant son application ou son adresse habituelle.'
        ],
        tip: 'Vérifiez une demande par un canal que vous connaissez déjà, pas le numéro contenu dans le message.'
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
  }
};

export const lessons = MODULES_CONTENT.phishing.lessons;
export const questions = MODULES_CONTENT.phishing.questions;

export function resolveStudyContent(moduleId: string, studioContents?: { id: string; title: string; domain: string; duration?: string; sources?: string; sections: { id: string; title: string; body: string }[] }[], studioQuiz?: { title: string; questions: { prompt: string; options: string[]; correctIndex: number; explanation: string }[] }): ModuleStudyContent {
  if (MODULES_CONTENT[moduleId]) return MODULES_CONTENT[moduleId];
  const fromStudio = studioContents?.find((s) => s.id === moduleId);
  if (fromStudio) {
    const mappedLessons: StudyLesson[] = (fromStudio.sections.length ? fromStudio.sections : [{ id: 's1', title: 'Introduction', body: 'Contenu publié depuis Studio Créateur.' }]).slice(0, 3).map((sec, idx) => ({
      title: sec.title || `Section 0${idx + 1}`,
      label: `Domaine ${fromStudio.domain}`,
      minutes: fromStudio.duration || '5 min',
      intro: sec.body || 'Contenu pédagogique structuré.',
      body: `${sec.body || ''}${fromStudio.sources ? ` · Source déclarée : ${fromStudio.sources}` : ''}`,
      points: [
        `Point clé issu de « ${sec.title || 'cette section'} »`,
        'Vérifiez votre compréhension avant de passer à l’étape suivante.'
      ],
      tip: 'Relisez les notions clés ou posez une question dans la Communauté en cas de blocage.'
    }));
    while (mappedLessons.length < 3) {
      mappedLessons.push({
        title: `Approfondissement ${mappedLessons.length + 1}`,
        label: fromStudio.domain,
        minutes: '4 min',
        intro: 'Complément pédagogique du module publié depuis Studio Créateur.',
        body: 'Consolidez les notions présentées dans les sections précédentes avant l’évaluation finale.',
        points: ['Relier la théorie à un cas concret.', 'Tester vos acquis avec le quiz.'],
        tip: 'Vous pouvez revenir sur chaque section à tout moment.'
      });
    }
    const mappedQuestions: StudyQuestion[] =
      studioQuiz && studioQuiz.questions.length >= 1
        ? studioQuiz.questions.slice(0, 3).map((q) => ({
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
      questions: mappedQuestions
    };
  }
  return MODULES_CONTENT.phishing;
}
