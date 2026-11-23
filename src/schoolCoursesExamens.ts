/**
 * Cours scolaires des classes d'examen (CM2 → CEPD, 3e → BEPC, Terminale → BAC II), deuxième lot.
 * Comme dans `schoolCourses.ts` : les classes, matières et thèmes suivent le programme officiel du
 * Togo (thèmes relevés sur les portails École Togo : « Calcul littéral » et « Mécanique » en 3e,
 * « Analyse » en Terminale D) ; les leçons, exemples et quiz sont rédigés par SAVOIR+, sans texte copié.
 * Chaque cours se déclare une seule fois (`CourseDef`) : sa fiche de Bibliothèque en est déduite.
 */
import type { CatalogItem } from './wireframeData';
import type { LessonRich, ModuleStudyContent, StudyQuestion } from './content';
import type { ProgrammeRef } from './programmeTogo';
import { levelOfClass } from './levels';

interface CourseLesson {
  title: string;
  label: string;
  minutes: string;
  intro: string;
  body: string;
  points: string[];
  tip: string;
  rich: LessonRich;
}

interface CourseDef {
  id: string;
  title: string;
  classLabel: string;
  /** La leçon du programme officiel à laquelle le cours correspond, quand le programme a été lu. */
  programme?: ProgrammeRef;
  duration: string;
  summary: string;
  prerequisites: string;
  skills: string[];
  quizTitle: string;
  /** « Vous saurez : » — minuscule au début, « ; » à la fin, « . » pour le dernier. */
  goals: string[];
  lessons: CourseLesson[];
  questions: StudyQuestion[];
}

const READER = 'Section consultable depuis le lecteur';

/** « former le passé composé ; » → « Former le passé composé. » (objectif de la fiche). */
const asObjective = (goal: string) => {
  const text = goal.replace(/\s*[;.]$/, '');
  return `${text.charAt(0).toLocaleUpperCase('fr')}${text.slice(1)}.`;
};

function defineCourse(def: CourseDef): { item: CatalogItem; content: ModuleStudyContent } {
  return {
    item: {
      id: def.id,
      type: 'module',
      title: def.title,
      domain: 'Scolaire',
      classLabel: def.classLabel,
      programme: def.programme,
      level: levelOfClass(def.classLabel),
      duration: def.duration,
      author: 'Équipe pédagogique SAVOIR+',
      authorRole: 'Cours alignés sur le programme officiel du Togo',
      version: 'Version 1',
      review: 'Communautaire',
      summary: def.summary,
      objectives: def.goals.map(asObjective),
      prerequisites: def.prerequisites,
      interactive: true,
      xpReward: 150,
      skills: def.skills,
      sections: [
        ...def.lessons.map((lesson, i) => ({ title: `0${i + 1} ${lesson.title}`, subtitle: `${READER} · ${lesson.minutes}` })),
        { title: `0${def.lessons.length + 1} Vérifier mes acquis`, subtitle: `Activité à réaliser dans le lecteur · ${def.questions.length} questions` }
      ]
    },
    content: {
      id: def.id,
      title: def.title,
      quizTitle: def.quizTitle,
      labType: 'generic',
      goals: def.goals,
      lessons: def.lessons,
      questions: def.questions
    }
  };
}

/* ============================================================================ CM2 · Français */

const CM2_PASSE_COMPOSE: CourseDef = {
  id: 'cm2-passe-compose',
  title: 'Le passé composé',
  classLabel: 'CM2',
  duration: '20 min',
  summary: 'Former le passé composé, choisir entre être et avoir, accorder le participe passé : la conjugaison de CM2 pour raconter ce qui est déjà arrivé. Pour préparer le CEPD.',
  prerequisites: 'Savoir conjuguer être et avoir au présent. Français (conjugaison), CM2.',
  skills: ['Former le passé composé', 'Choisir l’auxiliaire', 'Accorder avec être'],
  quizTitle: 'Vérifier vos acquis sur le passé composé',
  goals: [
    'former le passé composé d’un verbe avec son auxiliaire et son participe passé ;',
    'choisir entre l’auxiliaire être et l’auxiliaire avoir ;',
    'accorder le participe passé employé avec être.'
  ],
  lessons: [
    {
      title: 'Former le passé composé',
      label: 'Un auxiliaire et un participe passé',
      minutes: '6 min',
      intro: 'Au passé composé, le verbe s’écrit en deux mots : l’auxiliaire et le participe passé.',
      body: 'L’auxiliaire être ou avoir se conjugue au présent ; le participe passé du verbe le suit. Le passé composé raconte une action terminée.',
      points: ['Passé composé = auxiliaire au présent + participe passé.', 'Verbes en -er : participe passé en -é.', 'Il raconte une action terminée.'],
      tip: 'Pour choisir entre « é » et « er », remplacez le verbe par « vendu » ou « vendre ».',
      rich: {
        art: 'list',
        scene:
          'Hier, Kokou a joué au ballon, puis il est rentré à la maison. Pour raconter ce qui est déjà arrivé, il emploie deux mots pour un seul verbe : c’est le passé composé.',
        sections: [
          {
            title: 'Deux mots pour un verbe',
            text: [
              'Au passé composé, le verbe s’écrit en **deux mots** : l’**auxiliaire** être ou avoir, conjugué au présent, puis le **participe passé** du verbe.',
              'J’**ai mangé**, tu **as fini**, elle **est partie**.'
            ]
          },
          {
            title: 'Le participe passé',
            text: ['Le participe passé se forme à partir de l’infinitif :'],
            items: [
              'verbes en **-er** : participe en **-é** (chanter → chanté) ;',
              'verbes en **-ir** comme finir : participe en **-i** (finir → fini) ;',
              'd’autres verbes : participe en **-u**, **-is** ou **-it** (voir → vu, prendre → pris, écrire → écrit).'
            ],
            after: 'Les participes passés des verbes irréguliers s’apprennent par cœur.'
          },
          {
            title: 'À quoi sert-il ?',
            text: ['Le passé composé raconte une action **terminée** au moment où l’on parle : hier, ce matin, l’an dernier.']
          }
        ],
        example: {
          title: 'Le verbe chanter au passé composé',
          figure: {
            kind: 'table',
            head: ['Personne', 'Auxiliaire avoir', 'Participe passé'],
            rows: [
              ['j’', 'ai', 'chanté'],
              ['tu', 'as', 'chanté'],
              ['il, elle', 'a', 'chanté'],
              ['nous', 'avons', 'chanté'],
              ['vous', 'avez', 'chanté'],
              ['ils, elles', 'ont', 'chanté']
            ]
          },
          caption: 'Seul l’auxiliaire change ; le participe passé reste le même',
          notes: [
            'L’auxiliaire se conjugue au **présent**.',
            'Le participe passé « chanté » ne change pas d’une personne à l’autre.',
            'On écrit « chanté » avec **é**, et non « chanter » : après avoir ou être, c’est le participe passé.'
          ]
        },
        question: {
          ask: 'Comment savoir s’il faut écrire « é » ou « er » à la fin du verbe ?',
          answer: [
            'Remplacez le verbe par « vendre ». Si l’on peut dire « vendu », écrivez **é** : il a chanté (il a vendu). Si l’on peut dire « vendre », écrivez **er** : il va chanter (il va vendre).'
          ]
        }
      }
    },
    {
      title: 'Choisir l’auxiliaire',
      label: 'Être ou avoir',
      minutes: '7 min',
      intro: 'La plupart des verbes se conjuguent avec avoir ; quelques verbes très courants prennent être.',
      body: 'Aller, venir, arriver, partir, entrer, sortir, monter, descendre, tomber, rester, naître et mourir prennent être, comme les verbes pronominaux.',
      points: [
        'La plupart des verbes prennent avoir.',
        'Aller, venir, arriver, partir, entrer, sortir, monter, descendre, tomber, rester, naître, mourir prennent être.',
        'Les verbes pronominaux (se laver, se lever) prennent être.'
      ],
      tip: 'Retenez les verbes à auxiliaire être par paires de contraires.',
      rich: {
        art: 'search',
        scene:
          'Afi hésite : doit-elle écrire « j’ai tombé » ou « je suis tombée » ? La plupart des verbes prennent avoir, mais quelques-uns, très courants, prennent être.',
        sections: [
          {
            title: 'Avoir, pour la plupart des verbes',
            text: ['La grande majorité des verbes se conjuguent avec **avoir** : j’ai mangé, tu as couru, nous avons lu.']
          },
          {
            title: 'Être, pour quelques verbes de déplacement ou de changement',
            text: ['Une quinzaine de verbes se conjuguent avec **être**. Les plus courants :'],
            items: ['**aller**, **venir**, **arriver**, **partir** ;', '**entrer**, **sortir**, **monter**, **descendre** ;', '**tomber**, **rester**, **naître**, **mourir**.'],
            after: 'On dit donc : je suis allé, elle est venue, ils sont tombés.'
          },
          {
            title: 'Les verbes pronominaux',
            text: ['Les verbes qui se conjuguent avec **se** (se laver, se lever) prennent toujours **être** : je me suis lavé, elle s’est levée.']
          }
        ],
        example: {
          title: 'Avoir ou être ?',
          figure: {
            kind: 'table',
            head: ['Phrase au présent', 'Au passé composé', 'Auxiliaire'],
            rows: [
              ['Kossi mange du riz.', 'Kossi **a mangé** du riz.', 'avoir'],
              ['Ama arrive à l’école.', 'Ama **est arrivée** à l’école.', 'être'],
              ['Les enfants tombent.', 'Les enfants **sont tombés**.', 'être'],
              ['Nous finissons le devoir.', 'Nous **avons fini** le devoir.', 'avoir']
            ]
          },
          caption: 'Quatre phrases, deux auxiliaires',
          notes: [
            'Manger et finir prennent **avoir**, comme la plupart des verbes.',
            'Arriver et tomber font partie des verbes qui prennent **être**.',
            '« J’ai tombé » est une erreur : on dit « je suis tombé ».'
          ]
        },
        question: {
          ask: 'Existe-t-il un moyen de retenir les verbes qui prennent être ?',
          answer: [
            'Beaucoup vont par paires de contraires : aller et venir, entrer et sortir, monter et descendre, arriver et partir, naître et mourir. Retenez les paires, puis ajoutez tomber et rester.'
          ]
        }
      }
    },
    {
      title: 'Accorder le participe passé',
      label: 'Avec être, on accorde',
      minutes: '7 min',
      intro: 'Avec être, le participe passé s’accorde avec le sujet ; avec avoir, il ne s’accorde pas avec le sujet.',
      body: 'On ajoute e au féminin, s au pluriel et es au féminin pluriel : elle est partie, ils sont partis, elles sont parties.',
      points: ['Avec être : le participe passé s’accorde avec le sujet.', 'Avec avoir : pas d’accord avec le sujet.', 'Féminin : e ; pluriel : s ; féminin pluriel : es.'],
      tip: 'Dès que vous voyez l’auxiliaire être, cherchez le sujet avant d’écrire la fin du participe.',
      rich: {
        art: 'done',
        scene:
          'Elom écrit : « Mes sœurs sont parti au marché. » Sa maîtresse entoure « parti » en rouge. Il manque deux lettres : avec être, le participe passé s’accorde.',
        sections: [
          {
            title: 'Avec être : accord avec le sujet',
            text: ['Employé avec **être**, le participe passé s’accorde **en genre et en nombre avec le sujet** :'],
            items: ['féminin : on ajoute **e** (elle est partie) ;', 'pluriel : on ajoute **s** (ils sont partis) ;', 'féminin pluriel : on ajoute **es** (elles sont parties).']
          },
          {
            title: 'Avec avoir : pas d’accord avec le sujet',
            text: ['Employé avec **avoir**, le participe passé **ne s’accorde pas avec le sujet** : elle a mangé, ils ont mangé, elles ont mangé.']
          },
          {
            title: 'Trouver le sujet',
            text: [
              'Pour accorder, cherchez d’abord le sujet en posant la question « **qui est-ce qui** ? » devant le verbe, puis demandez-vous s’il est masculin ou féminin, singulier ou pluriel.'
            ]
          }
        ],
        example: {
          title: 'Le verbe partir, selon le sujet',
          figure: {
            kind: 'table',
            head: ['Sujet', 'Passé composé', 'On ajoute'],
            rows: [
              ['Kokou', 'est parti', 'rien'],
              ['Afi', 'est parti**e**', 'e'],
              ['Kokou et Yao', 'sont parti**s**', 's'],
              ['Afi et Ama', 'sont parti**es**', 'es'],
              ['Kokou et Afi', 'sont parti**s**', 's']
            ]
          },
          caption: 'Le participe passé suit le sujet',
          notes: [
            'Avec un sujet féminin, on ajoute **e** ; au pluriel, **s**.',
            'Un garçon et une fille ensemble : l’accord se fait au **masculin pluriel**.',
            'La phrase d’Elom devient : « Mes sœurs sont parti**es** au marché. »'
          ]
        },
        question: {
          ask: 'Et si le sujet est « je » ou « tu » ?',
          answer: ['On accorde selon la personne qui parle ou à qui l’on parle. Une fille écrit « je suis arrivée », un garçon « je suis arrivé ».']
        }
      }
    }
  ],
  questions: [
    {
      text: 'Quelle phrase est au passé composé ?',
      answers: ['Kossi mange une mangue.', 'Kossi a mangé une mangue.', 'Kossi mangera une mangue.'],
      correctIndex: 1,
      explanation: 'Le passé composé s’écrit en deux mots : l’auxiliaire (a) et le participe passé (mangé).'
    },
    {
      text: 'Quelle forme est correcte ?',
      answers: ['Je suis tombé.', 'J’ai tombé.', 'Je suis tomber.'],
      correctIndex: 0,
      explanation: 'Tomber se conjugue avec l’auxiliaire être, et le participe passé s’écrit avec é.'
    },
    {
      text: 'Complétez : « Ama et Afi sont … à l’école. »',
      answers: ['arrivé', 'arrivés', 'arrivées'],
      correctIndex: 2,
      explanation: 'Avec être, le participe passé s’accorde avec le sujet : deux filles, donc féminin pluriel.'
    }
  ]
};

/* ============================================================================ CM2 · Sciences et technologie */

const CM2_EAU_POTABLE: CourseDef = {
  id: 'cm2-eau-potable',
  title: 'L’eau potable',
  classLabel: 'CM2',
  duration: '20 min',
  summary: 'Une eau claire n’est pas toujours bonne à boire : reconnaître une eau potable, la rendre potable et la garder propre. Sciences et technologie, CM2.',
  prerequisites: 'Aucun prérequis. Sciences et technologie, CM2.',
  skills: ['Reconnaître une eau potable', 'Traiter l’eau', 'Conserver l’eau'],
  quizTitle: 'Vérifier vos acquis sur l’eau potable',
  goals: [
    'dire ce qu’est une eau potable et pourquoi une eau claire peut rendre malade ;',
    'rendre une eau potable en la filtrant, puis en la faisant bouillir ou en la désinfectant ;',
    'conserver l’eau de boisson à l’abri des microbes.'
  ],
  lessons: [
    {
      title: 'Reconnaître une eau potable',
      label: 'Claire ne veut pas dire potable',
      minutes: '6 min',
      intro: 'Une eau potable est une eau que l’on peut boire sans tomber malade.',
      body: 'Les microbes sont invisibles : une eau claire peut en contenir et transmettre la diarrhée, le choléra ou la fièvre typhoïde.',
      points: [
        'Une eau potable ne rend pas malade.',
        'Les microbes sont invisibles : une eau claire peut être dangereuse.',
        'L’eau sale transmet la diarrhée, le choléra, la fièvre typhoïde.'
      ],
      tip: 'Ne jugez jamais une eau à sa seule clarté.',
      rich: {
        art: 'search',
        scene: 'Au retour du champ, Yao a très soif. L’eau du marigot est claire et fraîche. Peut-il la boire sans danger ?',
        sections: [
          {
            title: 'Une eau potable',
            text: [
              'Une eau **potable** est une eau que l’on peut boire **sans tomber malade**. Elle est claire, sans odeur, sans mauvais goût, et surtout **sans microbes dangereux**.'
            ]
          },
          {
            title: 'Les microbes ne se voient pas',
            text: [
              'Les **microbes** sont des êtres vivants si petits qu’on ne les voit pas à l’œil nu. Une eau peut être parfaitement claire et en contenir des milliers.',
              'Ils arrivent dans l’eau avec les déchets, les excréments des hommes et des animaux, ou les mains sales.'
            ]
          },
          {
            title: 'Les maladies de l’eau sale',
            text: ['Boire une eau souillée peut donner des maladies graves :'],
            items: ['**la diarrhée**, qui fait perdre beaucoup d’eau au corps ;', '**le choléra** ;', '**la fièvre typhoïde**.'],
            after: 'Ces maladies sont surtout dangereuses pour les jeunes enfants.'
          }
        ],
        example: {
          title: 'D’où vient l’eau, et peut-on la boire ?',
          figure: {
            kind: 'table',
            head: ['Source d’eau', 'Risque', 'À faire avant de boire'],
            rows: [
              ['Robinet, borne-fontaine', 'faible', 'la garder dans un récipient propre'],
              ['Forage, pompe', 'faible si la pompe est entretenue', 'la garder dans un récipient propre'],
              ['Puits ouvert', 'élevé', 'la filtrer et la désinfecter'],
              ['Marigot, rivière, mare', '**très élevé**', 'la filtrer et la désinfecter']
            ]
          },
          caption: 'Toutes les eaux ne se valent pas',
          notes: [
            'L’eau du marigot est la plus risquée : les animaux y boivent et les déchets y arrivent avec la pluie.',
            'Même l’eau du robinet peut être salie par un récipient ou des mains sales.',
            'Yao doit attendre d’être à la maison, ou traiter l’eau avant de la boire.'
          ]
        },
        question: {
          ask: 'Pourquoi une eau claire peut-elle rendre malade ?',
          answer: ['Parce que les microbes sont invisibles. La clarté dit seulement qu’il n’y a pas de boue : elle ne dit rien des microbes.']
        }
      }
    },
    {
      title: 'Rendre l’eau potable',
      label: 'Filtrer, puis bouillir ou désinfecter',
      minutes: '7 min',
      intro: 'On laisse reposer l’eau et on la filtre, puis on tue les microbes.',
      body: 'La décantation et la filtration rendent l’eau claire ; l’ébullition ou la désinfection tuent les microbes. On filtre toujours avant de désinfecter.',
      points: ['Décanter et filtrer rendent l’eau claire.', 'Bouillir ou désinfecter tue les microbes.', 'Toujours filtrer avant de désinfecter.'],
      tip: 'Retenez l’ordre : laisser reposer, filtrer, puis bouillir ou désinfecter.',
      rich: {
        art: 'shield',
        scene: 'Chez Mme Akouvi, l’eau vient du puits. Avant de remplir la jarre des enfants, elle fait toujours la même chose, dans le même ordre.',
        sections: [
          {
            title: 'Étape 1 : laisser reposer et filtrer',
            text: [
              'On laisse d’abord l’eau **reposer** : la boue tombe au fond. C’est la **décantation**.',
              'Puis on verse l’eau à travers un **linge propre** ou un filtre : c’est la **filtration**. L’eau devient claire, mais elle contient encore des microbes.'
            ]
          },
          {
            title: 'Étape 2 : tuer les microbes',
            text: ['Deux méthodes simples tuent les microbes :'],
            items: [
              '**l’ébullition** : faire bouillir l’eau à gros bouillons, puis la laisser refroidir dans un récipient couvert ;',
              '**la désinfection** : ajouter un produit comme l’eau de Javel ou un comprimé désinfectant, puis attendre une demi-heure.'
            ],
            after: 'On respecte la dose indiquée par l’agent de santé ou sur l’emballage. La désinfection avec un produit se fait toujours avec un adulte.'
          },
          {
            title: 'L’ordre compte',
            text: ['On **filtre d’abord**, on **désinfecte ensuite**. Dans une eau boueuse, les microbes se cachent dans les saletés et le produit agit mal.']
          }
        ],
        example: {
          title: 'De l’eau du puits à l’eau de boisson',
          figure: {
            kind: 'flow',
            nodes: [
              { art: 'cloud', label: 'Eau du puits', sub: 'trouble, avec des microbes' },
              { art: 'list', label: 'Eau filtrée', sub: 'claire, encore des microbes' },
              { art: 'shield', label: 'Eau bouillie', sub: 'microbes tués' },
              { art: 'done', label: 'Eau potable', sub: 'refroidie, couverte' }
            ],
            links: ['on filtre', 'on fait bouillir', 'on laisse refroidir']
          },
          caption: 'Trois gestes, toujours dans cet ordre',
          notes: [
            'La filtration enlève ce qui se voit ; l’ébullition tue ce qui ne se voit pas.',
            'L’eau bouillie refroidit **couverte**, pour ne pas être salie de nouveau.',
            'Aucune étape ne peut être sautée.'
          ]
        },
        question: {
          ask: 'Filtrer avec un linge suffit-il ?',
          answer: [
            'Non. Le linge retient la boue et les saletés, mais les microbes sont assez petits pour le traverser. Il faut ensuite faire bouillir l’eau ou la désinfecter.'
          ]
        }
      }
    },
    {
      title: 'Garder l’eau propre',
      label: 'Du récipient au gobelet',
      minutes: '7 min',
      intro: 'Une eau traitée redevient dangereuse si on la salit.',
      body: 'On garde l’eau de boisson dans un récipient lavé et couvert, on la verse sans y plonger les mains, et on se lave les mains à l’eau et au savon.',
      points: ['Un récipient lavé, couvert, posé en hauteur.', 'On verse l’eau ; on n’y plonge jamais les mains.', 'On se lave les mains à l’eau et au savon.'],
      tip: 'Un couvercle et un gobelet à manche : deux objets simples qui gardent l’eau potable.',
      rich: {
        art: 'drive',
        scene:
          'L’eau de la jarre a été bouillie ce matin. À midi, Kokou y plonge un gobelet qu’il tenait dans ses mains pleines de terre. L’eau n’est plus potable.',
        sections: [
          {
            title: 'Un récipient propre et fermé',
            text: [
              'L’eau de boisson se garde dans un récipient **lavé au savon** et **couvert**. On le pose en hauteur, hors de portée des animaux et de la poussière.'
            ]
          },
          {
            title: 'Ne jamais plonger les mains',
            text: ['Les mains portent des microbes. Pour se servir :'],
            items: ['on **verse** l’eau, ou on utilise un robinet ;', 'sinon, on prend un gobelet **à manche**, réservé à cet usage, qu’on ne pose pas par terre.']
          },
          {
            title: 'Se laver les mains',
            text: [
              'On se lave les mains **à l’eau et au savon** avant de manger et avant de toucher l’eau de boisson. On les lave aussi après être allé aux toilettes. C’est l’un des gestes qui évitent le plus de maladies.'
            ]
          }
        ],
        example: {
          title: 'Quatre gestes autour de la jarre',
          figure: {
            kind: 'table',
            head: ['Geste', 'Bon ou mauvais ?', 'Pourquoi'],
            rows: [
              ['Couvrir la jarre', '**bon**', 'la poussière et les mouches n’entrent pas'],
              ['Plonger la main dans l’eau', 'mauvais', 'les microbes des mains passent dans l’eau'],
              ['Utiliser un gobelet à manche', '**bon**', 'les doigts ne touchent pas l’eau'],
              ['Laisser le gobelet par terre', 'mauvais', 'il ramasse les saletés du sol']
            ]
          },
          caption: 'Les bons et les mauvais gestes',
          notes: [
            'Une eau traitée peut redevenir dangereuse en quelques secondes.',
            'Le geste de Kokou a suffi à salir toute la jarre.',
            'Le couvercle et le gobelet à manche protègent le travail du matin.'
          ]
        },
        question: {
          ask: 'Combien de temps peut-on garder de l’eau bouillie ?',
          answer: [
            'Mieux vaut en préparer chaque jour. On la garde une journée dans un récipient propre et fermé, puis on lave le récipient avant de le remplir de nouveau.'
          ]
        }
      }
    }
  ],
  questions: [
    {
      text: 'Une eau est claire et sans odeur. Est-elle forcément potable ?',
      answers: ['Oui : si elle est claire, elle est potable.', 'Non : elle peut contenir des microbes invisibles.', 'Oui, si elle est fraîche.'],
      correctIndex: 1,
      explanation: 'Les microbes ne se voient pas : seule une eau traitée ou venue d’une source sûre est potable.'
    },
    {
      text: 'Dans quel ordre traite-t-on l’eau du puits ?',
      answers: ['On la fait bouillir, puis on la filtre.', 'On la filtre, puis on la fait bouillir.', 'On la filtre seulement.'],
      correctIndex: 1,
      explanation: 'On enlève d’abord la boue, puis on tue les microbes : dans une eau trouble, le traitement agit mal.'
    },
    {
      text: 'Comment se servir dans la jarre d’eau de boisson ?',
      answers: ['Avec un gobelet à manche réservé à cet usage', 'Avec les mains', 'Avec un bol posé par terre'],
      correctIndex: 0,
      explanation: 'Les doigts ne doivent pas toucher l’eau : on la verse, ou on utilise un gobelet à manche propre.'
    }
  ]
};

/* ============================================================================ 3e · Mathématiques */

const TROISIEME_CALCUL_LITTERAL: CourseDef = {
  id: '3e-calcul-litteral',
  title: 'Le calcul littéral : développer et factoriser',
  classLabel: '3e',
  programme: { docId: '3e-maths', theme: 'Programme de calcul – calcul littéral', lesson: 'Monômes, polynômes, fractions rationnelles' },
  duration: '25 min',
  summary: 'Développer, utiliser les produits remarquables, factoriser pour résoudre une équation : le calcul littéral du programme de 3e. Pour préparer le BEPC.',
  prerequisites: 'Savoir réduire une expression et calculer avec les nombres relatifs. Mathématiques, programme de 3e.',
  skills: ['Distributivité', 'Produits remarquables', 'Factorisation'],
  quizTitle: 'Vérifier vos acquis sur le calcul littéral',
  goals: [
    'développer une expression avec la distributivité ;',
    'utiliser les trois produits remarquables ;',
    'factoriser une expression pour résoudre une équation produit.'
  ],
  lessons: [
    {
      title: 'Développer une expression',
      label: 'La distributivité',
      minutes: '8 min',
      intro: 'Développer, c’est transformer un produit en somme.',
      body: 'On utilise k(a + b) = ka + kb et, pour deux sommes, (a + b)(c + d) = ac + ad + bc + bd, en faisant attention aux signes.',
      points: ['k(a + b) = ka + kb.', '(a + b)(c + d) = ac + ad + bc + bd.', 'Un « − » devant une parenthèse change tous les signes.'],
      tip: 'Écrivez les quatre produits avant de réduire : c’est là que se perdent les signes.',
      rich: {
        art: 'list',
        scene:
          'Un champ rectangulaire mesure x mètres de large. Sa longueur dépasse sa largeur de 5 mètres. Son aire s’écrit x(x + 5), ou bien x² + 5x : deux écritures de la même quantité.',
        sections: [
          {
            title: 'Transformer un produit en somme',
            text: ['Développer, c’est utiliser la **distributivité** : **k(a + b) = ka + kb**.', 'Ainsi, 3(x + 4) = 3x + 12 et x(x + 5) = x² + 5x.']
          },
          {
            title: 'La double distributivité',
            text: [
              'Pour un produit de deux sommes, chaque terme de la première multiplie chaque terme de la seconde : **(a + b)(c + d) = ac + ad + bc + bd**.',
              '(x + 2)(x + 3) = x² + 3x + 2x + 6 = **x² + 5x + 6**.'
            ]
          },
          {
            title: 'Attention aux signes',
            text: [
              'Le signe fait partie du terme. Dans (x − 4)(x + 1), on multiplie par **−4** : x² + x − 4x − 4 = x² − 3x − 4.',
              'Un signe « − » devant une parenthèse change **tous** les signes : −(2x − 3) = −2x + 3.'
            ]
          }
        ],
        example: {
          title: 'Développer (2x + 3)(x − 5)',
          figure: {
            kind: 'table',
            head: ['Produit', 'Résultat'],
            rows: [
              ['2x × x', '2x²'],
              ['2x × (−5)', '−10x'],
              ['3 × x', '3x'],
              ['3 × (−5)', '−15'],
              ['Somme, puis réduction', '**2x² − 7x − 15**']
            ]
          },
          caption: 'Quatre produits, puis on réduit',
          notes: [
            'Deux termes dans chaque parenthèse : **quatre** produits à écrire.',
            'On réduit en regroupant les termes en x : −10x + 3x = −7x.',
            'Vérification avec x = 1 : (2 + 3)(1 − 5) = −20, et 2 − 7 − 15 = −20.'
          ]
        },
        question: {
          ask: 'Comment vérifier un développement ?',
          answer: [
            'Remplacez x par un nombre simple dans les deux écritures. Si les résultats diffèrent, il y a une erreur. S’ils sont égaux, le développement est très probablement juste.'
          ]
        }
      }
    },
    {
      title: 'Les produits remarquables',
      label: 'Trois égalités à connaître',
      minutes: '8 min',
      intro: 'Trois produits reviennent si souvent qu’on en retient le résultat.',
      body: '(a + b)² = a² + 2ab + b² ; (a − b)² = a² − 2ab + b² ; (a + b)(a − b) = a² − b².',
      points: ['(a + b)² = a² + 2ab + b².', '(a − b)² = a² − 2ab + b².', '(a + b)(a − b) = a² − b².'],
      tip: 'Avant de développer un carré, écrivez à part a, b et le double produit 2ab.',
      rich: {
        art: 'key',
        scene:
          'Koffi calcule 21² de tête : 21² = (20 + 1)² = 400 + 40 + 1 = 441. Il ne pose aucune multiplication : il applique un produit remarquable.',
        sections: [
          {
            title: 'Les trois produits remarquables',
            text: ['Trois produits reviennent si souvent qu’on en retient le résultat : ce sont les **produits remarquables**, aussi appelés identités remarquables. Pour tous nombres a et b :'],
            items: ['**(a + b)² = a² + 2ab + b²** ;', '**(a − b)² = a² − 2ab + b²** ;', '**(a + b)(a − b) = a² − b²**.'],
            after: 'Elles se démontrent avec la double distributivité.'
          },
          {
            title: 'Le double produit',
            text: [
              'Le terme **2ab** s’appelle le double produit. C’est lui que l’on oublie le plus souvent : (x + 3)² ne vaut pas x² + 9, mais x² + **6x** + 9.'
            ]
          },
          {
            title: 'Bien repérer a et b',
            text: [
              'Dans (2x − 5)², a = 2x et b = 5. Donc a² = (2x)² = **4x²**, 2ab = 2 × 2x × 5 = 20x et b² = 25 : (2x − 5)² = 4x² − 20x + 25.'
            ]
          }
        ],
        example: {
          title: 'Reconnaître la forme, puis appliquer',
          figure: {
            kind: 'table',
            head: ['Expression', 'Forme', 'Résultat'],
            rows: [
              ['(x + 4)²', '(a + b)²', 'x² + 8x + 16'],
              ['(3x − 2)²', '(a − b)²', '9x² − 12x + 4'],
              ['(x + 7)(x − 7)', '(a + b)(a − b)', 'x² − 49'],
              ['99 × 101', '(100 − 1)(100 + 1)', '10 000 − 1 = **9 999**']
            ]
          },
          caption: 'Trois développements et un calcul mental',
          notes: [
            'Le double produit de (3x − 2)² vaut 2 × 3x × 2 = 12x.',
            '(3x)² = 9x² : le carré porte aussi sur le 3.',
            'Les produits remarquables servent aussi au calcul mental.'
          ]
        },
        question: {
          ask: 'Pourquoi (a + b)² n’est-il pas égal à a² + b² ?',
          answer: ['Essayez avec a = 2 et b = 3 : (2 + 3)² = 25, mais 2² + 3² = 13. La différence, 12, est exactement le double produit 2 × 2 × 3.']
        }
      }
    },
    {
      title: 'Factoriser',
      label: 'Du développement au produit',
      minutes: '9 min',
      intro: 'Factoriser, c’est transformer une somme en produit.',
      body: 'On cherche un facteur commun, sinon un produit remarquable. Un produit est nul si, et seulement si, l’un de ses facteurs est nul.',
      points: ['Factoriser : transformer une somme en produit.', 'D’abord le facteur commun, sinon un produit remarquable.', 'Un produit est nul si l’un des facteurs est nul.'],
      tip: 'Vérifiez une factorisation en la développant : vous devez retrouver l’expression de départ.',
      rich: {
        art: 'restore',
        scene: 'Pour résoudre x² − 9 = 0, développer ne sert à rien. Il faut faire le chemin inverse : transformer la somme en produit.',
        sections: [
          {
            title: 'Chercher un facteur commun',
            text: ['Factoriser est l’inverse de développer. On cherche d’abord un **facteur commun** : 6x + 9 = 3(2x + 3), et x² + 5x = x(x + 5).']
          },
          {
            title: 'Factoriser avec un produit remarquable',
            text: ['Quand il n’y a pas de facteur commun, on cherche un produit remarquable lu de droite à gauche :'],
            items: ['x² − 9 = x² − 3² = **(x + 3)(x − 3)** ;', 'x² + 6x + 9 = **(x + 3)²** ;', '4x² − 20x + 25 = **(2x − 5)²**.']
          },
          {
            title: 'À quoi sert la factorisation ?',
            text: [
              '**Un produit est nul si, et seulement si, l’un de ses facteurs est nul.** Une fois factorisée, l’équation x² − 9 = 0 devient (x + 3)(x − 3) = 0 : x = −3 ou x = 3.'
            ]
          }
        ],
        example: {
          title: 'Résoudre (x − 2)(2x + 6) = 0',
          figure: {
            kind: 'table',
            head: ['Étape', 'Ce qu’on écrit'],
            rows: [
              ['Règle', 'un produit est nul si l’un des facteurs est nul'],
              ['Premier facteur', 'x − 2 = 0, donc x = 2'],
              ['Second facteur', '2x + 6 = 0, donc x = −3'],
              ['Solutions', '**x = 2 ou x = −3**']
            ]
          },
          caption: 'Une équation produit, deux équations simples',
          notes: [
            'On ne développe surtout pas : la forme factorisée donne les solutions.',
            'Chaque facteur donne une équation du premier degré.',
            'Vérification : pour x = 2, le premier facteur vaut 0, donc le produit aussi.'
          ]
        },
        question: {
          ask: 'Comment savoir quelle méthode utiliser pour factoriser ?',
          answer: [
            'Cherchez d’abord un facteur commun. S’il n’y en a pas, comptez les termes : deux termes séparés par un « − » font penser à a² − b² ; trois termes, à un carré (a + b)² ou (a − b)².'
          ]
        }
      }
    }
  ],
  questions: [
    {
      text: 'Quel est le développement de (x + 5)² ?',
      answers: ['x² + 25', 'x² + 10x + 25', 'x² + 5x + 25'],
      correctIndex: 1,
      explanation: 'a² + 2ab + b² avec a = x et b = 5 : le double produit vaut 10x.'
    },
    {
      text: 'Quelle est la forme factorisée de x² − 16 ?',
      answers: ['(x − 4)²', '(x + 4)(x − 4)', 'x(x − 16)'],
      correctIndex: 1,
      explanation: 'x² − 16 = x² − 4² : c’est la forme a² − b² = (a + b)(a − b).'
    },
    {
      text: 'Quelles sont les solutions de (x − 1)(x + 4) = 0 ?',
      answers: ['x = 1 ou x = −4', 'x = −1 ou x = 4', 'x = 1 seulement'],
      correctIndex: 0,
      explanation: 'Un produit est nul si l’un des facteurs est nul : x − 1 = 0 ou x + 4 = 0.'
    }
  ]
};

/* ============================================================================ 3e · Physique-chimie et technologie */

const TROISIEME_POIDS_MASSE: CourseDef = {
  id: '3e-poids-masse',
  title: 'Poids et masse',
  classLabel: '3e',
  programme: { docId: '3e-pct', theme: 'Physique · Mécanique', lesson: 'Les forces' },
  duration: '22 min',
  summary: 'La masse se mesure en kilogrammes, le poids en newtons : décrire le poids d’un corps comme une force, le mesurer, et le relier à la masse par P = m × g. Reprend « Poids d’un corps » (PCT de 4e) et le prolonge avec « Les forces » (PCT de 3e), pour préparer le BEPC.',
  prerequisites: 'Savoir convertir des grammes en kilogrammes. PCT (mécanique), programme de 3e.',
  skills: ['Masse et poids', 'Caractéristiques d’une force', 'Relation P = m × g'],
  quizTitle: 'Vérifier vos acquis sur le poids et la masse',
  goals: [
    'distinguer la masse d’un objet de son poids ;',
    'décrire le poids comme une force et le mesurer avec un dynamomètre ;',
    'utiliser la relation P = m × g.'
  ],
  lessons: [
    {
      title: 'Masse et poids : deux grandeurs',
      label: 'Le kilogramme et le newton',
      minutes: '7 min',
      intro: 'La masse dépend de la quantité de matière ; le poids est la force d’attraction exercée par la Terre.',
      body: 'La masse se mesure à la balance, en kilogrammes, et ne change pas avec le lieu. Le poids se mesure au dynamomètre, en newtons, et dépend du lieu.',
      points: [
        'Masse : quantité de matière, en kg, mesurée à la balance.',
        'Poids : force exercée par la Terre, en N, mesurée au dynamomètre.',
        'La masse ne change pas avec le lieu ; le poids, si.'
      ],
      tip: 'Regardez l’unité : des kilogrammes, c’est une masse ; des newtons, c’est un poids.',
      rich: {
        art: 'search',
        scene:
          'Au marché, Mme Afi « pèse » 2 kg de riz. En physique, elle mesure en réalité une masse. Le poids, lui, est autre chose : c’est une force.',
        sections: [
          {
            title: 'La masse',
            text: [
              'La **masse** d’un objet dépend de la **quantité de matière** qu’il contient. Elle se mesure avec une **balance**, en **kilogrammes** (kg).',
              'Elle ne change pas quand on déplace l’objet : 2 kg de riz restent 2 kg de riz à Lomé, à Kara ou sur la Lune.'
            ]
          },
          {
            title: 'Le poids',
            text: [
              'Le **poids** d’un objet est la **force d’attraction** que la Terre exerce sur lui. Il se mesure avec un **dynamomètre**, en **newtons** (N).'
            ]
          },
          {
            title: 'Ne pas les confondre',
            text: ['Dans la vie courante, on dit « poids » pour parler de la masse. En physique, on distingue :'],
            items: ['la masse : en kg, avec une balance, **invariable** ;', 'le poids : en N, avec un dynamomètre, **variable selon le lieu**.']
          }
        ],
        example: {
          title: 'Masse et poids, côte à côte',
          figure: {
            kind: 'table',
            head: ['Ce qu’on compare', 'Masse', 'Poids'],
            rows: [
              ['Ce que c’est', 'la quantité de matière', 'la force exercée par la Terre'],
              ['Symbole', 'm', 'P'],
              ['Unité', 'kilogramme (kg)', 'newton (N)'],
              ['Instrument', 'balance', 'dynamomètre'],
              ['Change avec le lieu ?', 'non', '**oui**']
            ]
          },
          caption: 'Deux grandeurs, deux unités, deux instruments',
          notes: [
            'Le sac de riz de Mme Afi a une **masse** de 2 kg.',
            'Son **poids** est une force, d’environ 20 N sur Terre.',
            'Écrire « un poids de 2 kg » est une erreur en physique.'
          ]
        },
        question: {
          ask: 'Pourquoi la balance du marché affiche-t-elle des kilogrammes, alors qu’elle subit le poids ?',
          answer: [
            'La balance réagit bien au poids, mais elle est graduée en kilogrammes. En un même lieu, le poids et la masse sont proportionnels : on peut donc passer de l’un à l’autre.'
          ]
        }
      }
    },
    {
      title: 'Le poids, une force',
      label: 'Direction, sens, point d’application',
      minutes: '7 min',
      intro: 'Comme toute force, le poids se décrit par quatre caractéristiques.',
      body: 'Le poids s’applique au centre de gravité, suivant la verticale, vers le bas ; son intensité se mesure en newtons avec un dynamomètre.',
      points: ['Le poids s’applique au centre de gravité.', 'Direction verticale, sens vers le bas.', 'Intensité en newtons, mesurée au dynamomètre.'],
      tip: 'Pour décrire une force, donnez toujours ses quatre caractéristiques.',
      rich: {
        art: 'route',
        scene:
          'Une mangue se détache de sa branche. Elle ne part ni vers le haut ni sur le côté : elle tombe droit vers le sol. C’est son poids qui agit.',
        sections: [
          {
            title: 'Les quatre caractéristiques du poids',
            text: ['Comme toute force, le poids se décrit par quatre caractéristiques :'],
            items: [
              '**point d’application** : le centre de gravité de l’objet, noté G ;',
              '**direction** : la verticale du lieu ;',
              '**sens** : vers le bas, vers le centre de la Terre ;',
              '**intensité** : sa valeur, en newtons.'
            ]
          },
          {
            title: 'Représenter le poids',
            text: [
              'On représente le poids par une **flèche** (un vecteur) qui part de G, dirigée verticalement vers le bas. Sa longueur est proportionnelle à l’intensité, selon une échelle : par exemple 1 cm pour 10 N.'
            ]
          },
          {
            title: 'Mesurer avec un dynamomètre',
            text: [
              'On suspend l’objet au crochet du **dynamomètre**. Le ressort s’allonge, et l’on lit l’intensité du poids sur la graduation, en newtons.'
            ]
          }
        ],
        example: {
          title: 'Le poids d’une mangue de 300 g',
          figure: {
            kind: 'table',
            head: ['Caractéristique', 'Pour la mangue'],
            rows: [
              ['Point d’application', 'son centre de gravité G'],
              ['Direction', 'verticale'],
              ['Sens', 'vers le bas'],
              ['Intensité', 'environ **3 N**'],
              ['Représentation', 'une flèche de 3 cm, à l’échelle 1 cm pour 1 N']
            ]
          },
          caption: 'La fiche d’identité d’une force',
          notes: [
            'Les quatre caractéristiques décrivent complètement la force.',
            'La direction verticale est celle du **fil à plomb**.',
            'La flèche part du centre de gravité, pas du bas de l’objet.'
          ]
        },
        question: {
          ask: 'Le poids agit-il encore quand l’objet est posé sur une table ?',
          answer: [
            'Oui. La Terre attire toujours l’objet. S’il ne tombe pas, c’est que la table exerce sur lui une force vers le haut qui compense son poids.'
          ]
        }
      }
    },
    {
      title: 'La relation P = m × g',
      label: 'L’intensité de la pesanteur',
      minutes: '8 min',
      intro: 'En un lieu donné, le poids est proportionnel à la masse : P = m × g.',
      body: 'P est en newtons, m en kilogrammes et g en newtons par kilogramme. Sur Terre, g vaut environ 9,8 N/kg, souvent arrondi à 10 N/kg.',
      points: ['P = m × g, avec m en kg et P en N.', 'Sur Terre, g ≈ 9,8 N/kg (souvent arrondi à 10 N/kg).', 'Sur la Lune, g ≈ 1,6 N/kg : même masse, poids plus faible.'],
      tip: 'Convertissez toujours la masse en kilogrammes avant de calculer.',
      rich: {
        art: 'chart',
        scene:
          'En classe, on suspend au dynamomètre des masses de 100 g, 200 g, puis 300 g. Le poids lu double, puis triple : le poids et la masse sont proportionnels.',
        sections: [
          {
            title: 'Une relation de proportionnalité',
            text: [
              'En un lieu donné, le poids est **proportionnel** à la masse : **P = m × g**.',
              'P est en newtons (N), m en kilogrammes (kg) et g en newtons par kilogramme (N/kg).'
            ]
          },
          {
            title: 'L’intensité de la pesanteur',
            text: [
              'Le coefficient **g** s’appelle l’intensité de la pesanteur. Sur Terre, **g ≈ 9,8 N/kg** ; on prend souvent **10 N/kg** pour simplifier les calculs.'
            ]
          },
          {
            title: 'La masse en kilogrammes',
            text: ['Avant d’appliquer la relation, on convertit la masse en **kilogrammes** : 500 g = 0,5 kg. C’est l’erreur la plus fréquente.']
          },
          {
            title: 'Sur la Lune',
            text: [
              'Sur la Lune, g vaut environ **1,6 N/kg**, six fois moins que sur Terre. La masse ne change pas, mais le poids est six fois plus faible.'
            ]
          }
        ],
        example: {
          title: 'Les mesures de la classe, avec g = 10 N/kg',
          figure: {
            kind: 'table',
            head: ['Masse', 'Masse en kg', 'Poids P = m × g'],
            rows: [
              ['100 g', '0,1 kg', '1 N'],
              ['200 g', '0,2 kg', '2 N'],
              ['500 g', '0,5 kg', '5 N'],
              ['2 kg', '2 kg', '**20 N**']
            ]
          },
          caption: 'Le poids est proportionnel à la masse',
          notes: [
            'Quand la masse double, le poids double.',
            'Le quotient P ÷ m vaut toujours 10 N/kg : c’est g.',
            'Pour trouver la masse à partir du poids : m = P ÷ g.'
          ]
        },
        question: {
          ask: 'Un astronaute de 70 kg « pèse-t-il » moins sur la Lune ?',
          answer: [
            'Sa masse reste 70 kg. Son poids passe d’environ 700 N sur Terre à environ 112 N sur la Lune (70 × 1,6) : il est attiré six fois moins fort.'
          ]
        }
      }
    }
  ],
  questions: [
    {
      text: 'Quelle grandeur se mesure en newtons ?',
      answers: ['La masse', 'Le poids', 'Le volume'],
      correctIndex: 1,
      explanation: 'Le poids est une force : il se mesure en newtons, avec un dynamomètre.'
    },
    {
      text: 'Avec g = 10 N/kg, quel est le poids d’un objet de 250 g ?',
      answers: ['2 500 N', '25 N', '2,5 N'],
      correctIndex: 2,
      explanation: '250 g = 0,25 kg, donc P = 0,25 × 10 = 2,5 N.'
    },
    {
      text: 'Un objet a une masse de 6 kg sur Terre. Quelle est sa masse sur la Lune ?',
      answers: ['1 kg', '6 kg', '60 kg'],
      correctIndex: 1,
      explanation: 'La masse ne dépend pas du lieu : seul le poids change.'
    }
  ]
};

/* ============================================================================ Terminale · Mathématiques */

const TERMINALE_LOGARITHME: CourseDef = {
  id: 'tle-logarithme',
  title: 'La fonction logarithme népérien',
  classLabel: 'Terminale',
  duration: '30 min',
  summary: 'Définition, propriétés algébriques, étude de la fonction, équations et inéquations : le logarithme népérien, au cœur de l’analyse en Terminale. Pour préparer le BAC II.',
  prerequisites: 'Connaître la dérivation et les primitives. Mathématiques (analyse), Terminale.',
  skills: ['Propriétés de ln', 'Étude de la fonction ln', 'Équations avec ln'],
  quizTitle: 'Vérifier vos acquis sur le logarithme népérien',
  goals: [
    'définir la fonction ln et utiliser ses propriétés algébriques ;',
    'étudier la fonction ln : dérivée, variations et limites ;',
    'résoudre des équations et des inéquations avec ln.'
  ],
  lessons: [
    {
      title: 'Définition et propriétés algébriques',
      label: 'Transformer un produit en somme',
      minutes: '10 min',
      intro: 'La fonction ln est la primitive de x ↦ 1/x sur ]0 ; +∞[ qui s’annule en 1.',
      body: 'Pour a et b strictement positifs, ln(ab) = ln a + ln b ; on en déduit ln(a/b) = ln a − ln b et ln(aⁿ) = n ln a. Le nombre e vérifie ln e = 1.',
      points: ['ln est définie sur ]0 ; +∞[ ; ln 1 = 0 et ln e = 1.', 'ln(ab) = ln a + ln b ; ln(a/b) = ln a − ln b.', 'ln(aⁿ) = n ln a.'],
      tip: 'Écrivez toujours la condition d’existence avant d’utiliser une propriété.',
      rich: {
        art: 'key',
        scene:
          'Avant les calculatrices, les astronomes multipliaient d’énormes nombres en les remplaçant par des additions, grâce à des tables. L’outil qui change un produit en somme porte un nom : le logarithme.',
        sections: [
          {
            title: 'La définition',
            text: [
              'La fonction **logarithme népérien**, notée **ln**, est la primitive de la fonction x ↦ 1/x sur ]0 ; +∞[ qui **s’annule en 1**.',
              'Elle est donc définie pour **x > 0** seulement, et **ln 1 = 0**.'
            ]
          },
          {
            title: 'La propriété fondamentale',
            text: ['Pour tous réels a et b **strictement positifs** : **ln(ab) = ln a + ln b**. Le logarithme transforme un produit en somme.']
          },
          {
            title: 'Les propriétés qui en découlent',
            text: ['Pour a > 0, b > 0 et n entier relatif :'],
            items: ['**ln(a/b) = ln a − ln b** ;', '**ln(1/a) = −ln a** ;', '**ln(aⁿ) = n ln a** ;', '**ln(√a) = ½ ln a**.']
          },
          {
            title: 'Le nombre e',
            text: ['Il existe un unique réel, noté **e** (e ≈ 2,718), tel que **ln e = 1**. Par conséquent, ln(eⁿ) = n pour tout entier n.']
          }
        ],
        example: {
          title: 'Simplifier avec les propriétés',
          figure: {
            kind: 'table',
            head: ['Expression', 'On l’écrit', 'Résultat'],
            rows: [
              ['ln 6', 'ln(2 × 3)', 'ln 2 + ln 3'],
              ['ln 8', 'ln(2³)', '3 ln 2'],
              ['ln(1/4)', '−ln(2²)', '−2 ln 2'],
              ['ln 12 − ln 3', 'ln(12/3) = ln 4', '2 ln 2'],
              ['ln(e⁵)', 'ln(eⁿ) = n', '**5**']
            ]
          },
          caption: 'Tout ramener à ln 2 et ln 3',
          notes: [
            'Chaque ligne applique une seule propriété.',
            'ln(a + b) ne se simplifie pas : il n’existe **aucune** formule pour le logarithme d’une somme.',
            'On vérifie à la calculatrice : ln 8 ≈ 2,079 et 3 ln 2 ≈ 2,079.'
          ]
        },
        question: {
          ask: 'Peut-on calculer ln(−3) ou ln 0 ?',
          answer: [
            'Non. La fonction ln n’est définie que pour les réels strictement positifs. Avant tout calcul, on vérifie que ce qui est « dans » le logarithme est strictement positif.'
          ]
        }
      }
    },
    {
      title: 'Étudier la fonction ln',
      label: 'Dérivée, variations, limites',
      minutes: '10 min',
      intro: 'La dérivée de ln est 1/x : la fonction est strictement croissante sur ]0 ; +∞[.',
      body: 'ln x est négatif sur ]0 ; 1[, nul en 1 et positif au-delà ; ln x tend vers −∞ en 0 et vers +∞ en +∞. Si u est strictement positive, (ln u)′ = u′/u.',
      points: [
        '(ln x)′ = 1/x : ln est strictement croissante.',
        'ln x < 0 sur ]0 ; 1[ et ln x > 0 sur ]1 ; +∞[.',
        'ln x tend vers −∞ en 0 et vers +∞ en +∞.',
        '(ln u)′ = u′/u, pour u strictement positive.'
      ],
      tip: 'Pour le signe de ln x, comparez x à 1, pas à 0.',
      rich: {
        art: 'chart',
        scene:
          'La courbe de ln monte sans cesse, mais de plus en plus lentement : ln 10 ≈ 2,3, ln 1 000 ≈ 6,9, ln 1 000 000 ≈ 13,8. Monte-t-elle jusqu’à l’infini, ou plafonne-t-elle ?',
        sections: [
          {
            title: 'Dérivée et sens de variation',
            text: [
              'Par définition, ln est dérivable sur ]0 ; +∞[ et **(ln x)′ = 1/x**.',
              'Comme 1/x > 0 pour tout x > 0, la fonction ln est **strictement croissante** sur ]0 ; +∞[.'
            ]
          },
          {
            title: 'Le signe de ln x',
            text: ['Puisque ln est strictement croissante et que ln 1 = 0 :'],
            items: ['**ln x < 0** pour 0 < x < 1 ;', '**ln x = 0** pour x = 1 ;', '**ln x > 0** pour x > 1.']
          },
          {
            title: 'Les limites',
            text: [
              'En +∞, **ln x tend vers +∞** : la courbe monte lentement, mais sans plafond.',
              'En 0, par valeurs positives, **ln x tend vers −∞** : l’axe des ordonnées est **asymptote verticale** à la courbe.'
            ]
          },
          {
            title: 'Dériver ln(u)',
            text: [
              'Si u est une fonction dérivable et **strictement positive**, alors **(ln u)′ = u′/u**. Par exemple, la dérivée de ln(2x + 1) est 2/(2x + 1) sur ]−½ ; +∞[.'
            ]
          }
        ],
        example: {
          title: 'Les valeurs repères de la fonction ln',
          figure: {
            kind: 'table',
            head: ['x', 'proche de 0', '1', 'e', 'très grand'],
            rows: [
              ['ln x', 'tend vers −∞', '0', '1', 'tend vers +∞'],
              ['Signe de ln x', '−', '0', '+', '+'],
              ['Dérivée 1/x', '+', '+', '+', '+']
            ]
          },
          caption: 'Le tableau qui résume l’étude',
          notes: [
            'La dérivée est toujours positive : la fonction est strictement croissante.',
            'La courbe coupe l’axe des abscisses en x = 1.',
            'Elle passe par le point de coordonnées (e ; 1).',
            'L’axe des ordonnées est asymptote verticale.'
          ]
        },
        question: {
          ask: 'ln x tend vers +∞, mais à quelle vitesse ?',
          answer: [
            'Très lentement : ln x est négligeable devant x. On retient deux limites de référence : (ln x)/x tend vers 0 en +∞, et x ln x tend vers 0 en 0.'
          ]
        }
      }
    },
    {
      title: 'Équations et inéquations',
      label: 'Utiliser la croissance de ln',
      minutes: '10 min',
      intro: 'Pour a et b strictement positifs, ln a = ln b équivaut à a = b, et ln a < ln b équivaut à a < b.',
      body: 'On écrit les conditions d’existence, on se ramène à ln A = ln B ou ln A < ln B, on résout, puis on ne garde que les solutions qui vérifient les conditions.',
      points: ['ln a = ln b équivaut à a = b (a et b strictement positifs).', 'ln x = k équivaut à x = e^k.', 'Toujours écrire les conditions d’existence.'],
      tip: 'Une inconnue en exposant ? Prenez le logarithme des deux membres.',
      rich: {
        art: 'done',
        scene:
          'Un capital placé à 5 % par an est multiplié par 1,05 chaque année. Au bout de combien d’années aura-t-il doublé ? Il faut résoudre 1,05ⁿ = 2 : l’inconnue est en exposant, et c’est ln qui la fait descendre.',
        sections: [
          {
            title: 'Deux équivalences',
            text: ['La fonction ln étant strictement croissante, pour a > 0 et b > 0 :'],
            items: ['**ln a = ln b** équivaut à **a = b** ;', '**ln a < ln b** équivaut à **a < b**.']
          },
          {
            title: 'L’équation ln x = k',
            text: [
              'Pour tout réel k, l’équation ln x = k a une unique solution : **x = e^k** (« e puissance k »). Par exemple, ln x = 2 donne x = e², et ln x = 0 donne x = 1.'
            ]
          },
          {
            title: 'La méthode',
            text: ['Pour résoudre une équation ou une inéquation avec ln :'],
            items: [
              'on écrit les **conditions d’existence** : tout ce qui est dans un ln doit être strictement positif ;',
              'on transforme l’écriture pour obtenir ln A = ln B ou ln A < ln B ;',
              'on résout A = B ou A < B ;',
              'on ne garde que les solutions qui vérifient les conditions.'
            ],
            ordered: true
          }
        ],
        example: {
          title: 'Résoudre ln(x + 2) = ln(2x − 1)',
          figure: {
            kind: 'table',
            head: ['Étape', 'Ce qu’on écrit'],
            rows: [
              ['Conditions', 'x + 2 > 0 et 2x − 1 > 0, donc x > ½'],
              ['Équivalence', 'x + 2 = 2x − 1'],
              ['Résolution', 'x = 3'],
              ['Vérification', '3 > ½ : la solution est acceptée'],
              ['Conclusion', '**S = {3}**']
            ]
          },
          caption: 'Les conditions d’abord, la résolution ensuite',
          notes: [
            'Sans conditions d’existence, on risque de garder une solution interdite.',
            'L’égalité ln A = ln B permet de « supprimer » les ln des deux côtés.',
            'On conclut toujours par l’ensemble des solutions.'
          ]
        },
        question: {
          ask: 'Et le capital, au bout de combien d’années double-t-il ?',
          answer: [
            'On prend le logarithme des deux membres : n ln 1,05 = ln 2, donc n = ln 2 ÷ ln 1,05 ≈ 14,2. Le capital aura doublé au bout de 15 ans.'
          ]
        }
      }
    }
  ],
  questions: [
    {
      text: 'À quoi est égal ln(a × b), pour a > 0 et b > 0 ?',
      answers: ['ln a × ln b', 'ln a + ln b', 'ln(a + b)'],
      correctIndex: 1,
      explanation: 'C’est la propriété fondamentale : le logarithme transforme un produit en somme.'
    },
    {
      text: 'Quel est le signe de ln 0,5 ?',
      answers: ['Positif', 'Négatif', 'Nul'],
      correctIndex: 1,
      explanation: '0,5 est compris entre 0 et 1 : son logarithme est strictement négatif.'
    },
    {
      text: 'Quelle est la solution de ln x = 3 ?',
      answers: ['x = 3e', 'x = e³', 'x = ln 3'],
      correctIndex: 1,
      explanation: 'ln x = k équivaut à x = e^k : ici, x = e³.'
    }
  ]
};

/* ============================================================================ export */

const COURSES = [CM2_PASSE_COMPOSE, CM2_EAU_POTABLE, TROISIEME_CALCUL_LITTERAL, TROISIEME_POIDS_MASSE, TERMINALE_LOGARITHME].map(defineCourse);

export const EXAM_CATALOG_MODULES: CatalogItem[] = COURSES.map((course) => course.item);
export const EXAM_MODULES_CONTENT: Record<string, ModuleStudyContent> = Object.fromEntries(COURSES.map((course) => [course.content.id, course.content]));
