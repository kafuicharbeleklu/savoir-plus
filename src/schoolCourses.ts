/**
 * Cours scolaires de SAVOIR+, alignés sur le programme officiel du Togo (primaire, collège, lycée).
 * Les classes, matières et thèmes suivent ceux du programme (repris des portails École Togo du
 * ministère) ; les leçons, exemples et quiz sont rédigés par SAVOIR+ : aucun texte n'est copié.
 * Premier lot, ici : un cours par cycle (CM2, 3e, Seconde). Deuxième lot, classes d'examen : `schoolCoursesExamens.ts`.
 */
import type { CatalogItem } from './wireframeData';
import type { LessonRich, ModuleStudyContent } from './content';
import { EXAM_CATALOG_MODULES, EXAM_MODULES_CONTENT } from './schoolCoursesExamens';

const READER = 'Section consultable depuis le lecteur';
const QUIZ_SECTION = { title: '04 Vérifier mes acquis', subtitle: 'Activité à réaliser dans le lecteur · 3 questions' };
const AUTHOR = 'Équipe pédagogique SAVOIR+';
const AUTHOR_ROLE = 'Cours alignés sur le programme officiel du Togo';

/* ============================================================================ fiches de la Bibliothèque */

export const SCHOOL_CATALOG_MODULES: CatalogItem[] = [
  {
    id: 'cm2-fractions',
    type: 'module',
    title: 'Les fractions',
    domain: 'Scolaire',
    classLabel: 'CM2',
    level: 'Débutant',
    duration: '20 min',
    author: AUTHOR,
    authorRole: AUTHOR_ROLE,
    version: 'Version 1',
    review: 'Communautaire',
    summary: 'Partager, comparer, calculer : les fractions du programme de CM2, avec des exemples de tous les jours. Pour préparer le CEPD.',
    objectives: [
      'Lire et écrire une fraction, et dire ce que représentent ses deux nombres.',
      'Comparer deux fractions et reconnaître des fractions égales.',
      'Additionner des fractions de même dénominateur et calculer la fraction d’une quantité.'
    ],
    prerequisites: 'Savoir multiplier et diviser des nombres entiers. Mathématiques, programme de CM2.',
    interactive: true,
    xpReward: 150,
    skills: ['Lire une fraction', 'Comparer des fractions', 'Fraction d’une quantité'],
    sections: [
      { title: '01 Lire et écrire une fraction', subtitle: `${READER} · 6 min` },
      { title: '02 Comparer des fractions', subtitle: `${READER} · 7 min` },
      { title: '03 Calculer avec des fractions', subtitle: `${READER} · 7 min` },
      QUIZ_SECTION
    ]
  },
  {
    id: '3e-thales',
    type: 'module',
    title: 'Le théorème de Thalès',
    domain: 'Scolaire',
    classLabel: '3e',
    level: 'Intermédiaire',
    duration: '25 min',
    author: AUTHOR,
    authorRole: AUTHOR_ROLE,
    version: 'Version 1',
    review: 'Communautaire',
    summary: 'Reconnaître la configuration, calculer une longueur, prouver un parallélisme : le théorème de Thalès du programme de 3e. Pour préparer le BEPC.',
    objectives: [
      'Reconnaître une configuration de Thalès et écrire les rapports égaux.',
      'Calculer une longueur à l’aide du théorème.',
      'Utiliser la réciproque pour prouver que deux droites sont parallèles.'
    ],
    prerequisites: 'Connaître les fractions et le produit en croix. Mathématiques, programme de 3e.',
    interactive: true,
    xpReward: 150,
    skills: ['Configuration de Thalès', 'Calcul de longueur', 'Réciproque de Thalès'],
    sections: [
      { title: '01 Reconnaître la configuration', subtitle: `${READER} · 8 min` },
      { title: '02 Calculer une longueur', subtitle: `${READER} · 8 min` },
      { title: '03 Prouver un parallélisme', subtitle: `${READER} · 9 min` },
      QUIZ_SECTION
    ]
  },
  {
    id: '2nde-mole',
    type: 'module',
    title: 'La quantité de matière : la mole',
    domain: 'Scolaire',
    classLabel: 'Seconde',
    level: 'Avancé',
    duration: '25 min',
    author: AUTHOR,
    authorRole: AUTHOR_ROLE,
    version: 'Version 1',
    review: 'Communautaire',
    summary: 'Compter des entités invisibles, passer d’une masse ou d’un volume à une quantité de matière : la mole du programme de physique-chimie de Seconde.',
    objectives: [
      'Expliquer pourquoi les chimistes comptent les entités par paquets, les moles.',
      'Calculer une quantité de matière à partir d’une masse.',
      'Calculer une quantité de matière de gaz à partir d’un volume.'
    ],
    prerequisites: 'Savoir calculer en écriture scientifique. Physique-chimie, programme de Seconde.',
    interactive: true,
    xpReward: 150,
    skills: ['Constante d’Avogadro', 'Masse molaire', 'Volume molaire'],
    sections: [
      { title: '01 Compter en moles', subtitle: `${READER} · 8 min` },
      { title: '02 De la masse à la quantité de matière', subtitle: `${READER} · 8 min` },
      { title: '03 Le cas des gaz', subtitle: `${READER} · 9 min` },
      QUIZ_SECTION
    ]
  },
  ...EXAM_CATALOG_MODULES
];

/* ============================================================================ leçons et quiz */

export const SCHOOL_MODULES_CONTENT: Record<string, ModuleStudyContent> = {
  'cm2-fractions': {
    id: 'cm2-fractions',
    title: 'Les fractions',
    quizTitle: 'Vérifier vos acquis sur les fractions',
    labType: 'generic',
    goals: [
      'lire et écrire une fraction, et dire ce que représentent ses deux nombres ;',
      'comparer deux fractions et reconnaître des fractions égales ;',
      'additionner des fractions de même dénominateur et calculer la fraction d’une quantité.'
    ],
    lessons: [
      {
        title: 'Lire et écrire une fraction',
        label: 'Le partage en parts égales',
        minutes: '6 min',
        intro: 'Une fraction décrit un partage en parts égales.',
        body: 'Le dénominateur indique en combien de parts égales on partage l’unité ; le numérateur, combien de parts on prend.',
        points: [
          'Le dénominateur : en combien de parts égales on partage.',
          'Le numérateur : combien de parts on prend.',
          'Quand le numérateur égale le dénominateur, la fraction vaut 1.'
        ],
        tip: 'Lisez d’abord le nombre du bas : il dit la taille des parts.',
        rich: {
          art: 'chart',
          scene:
            'Mme Abla coupe un gâteau en 8 parts égales. Kossi en mange 3. Quelle part du gâteau a-t-il mangée ? On l’écrit avec deux nombres : 3/8.',
          sections: [
            {
              title: 'Deux nombres, deux rôles',
              text: [
                'Une fraction s’écrit avec deux nombres séparés par un trait : **3/8** se lit « trois huitièmes ».',
                'Le nombre du bas, le **dénominateur**, dit en combien de parts égales on a partagé l’unité. Le nombre du haut, le **numérateur**, dit combien de parts on prend.'
              ]
            },
            {
              title: 'Des parts vraiment égales',
              text: [
                'Une fraction n’a de sens que si les parts sont **égales**. Un gâteau coupé en quatre morceaux de tailles différentes ne donne pas des quarts.'
              ]
            },
            {
              title: 'Les fractions de tous les jours',
              text: ['Certaines fractions ont un nom courant :'],
              items: ['**1/2** : un demi, la moitié ;', '**1/3** : un tiers ;', '**1/4** : un quart ;', '**3/4** : trois quarts.'],
              after: 'Au-delà, on ajoute « -ième » : 1/5 se lit un cinquième, 3/10 trois dixièmes.'
            }
          ],
          example: {
            title: 'Le gâteau de Mme Abla',
            figure: {
              kind: 'split',
              parts: [
                { label: 'Mangé par Kossi', percent: 37.5, note: '3 parts sur 8' },
                { label: 'Reste', percent: 62.5, note: '5 parts sur 8' }
              ]
            },
            caption: 'Le gâteau partagé en 8 parts égales',
            notes: [
              'Kossi a mangé **3/8** du gâteau.',
              'Il reste **5/8** : 3/8 + 5/8 = 8/8, le gâteau entier.',
              'Quand le numérateur égale le dénominateur, la fraction vaut **1**.'
            ]
          },
          question: {
            ask: 'Une fraction peut-elle être plus grande que 1 ?',
            answer: [
              'Oui. 5/4, ce sont cinq quarts : un gâteau entier (quatre quarts) et encore un quart. Quand le numérateur dépasse le dénominateur, la fraction est plus grande que 1.'
            ]
          }
        }
      },
      {
        title: 'Comparer des fractions',
        label: 'Plus grand, plus petit, égal',
        minutes: '7 min',
        intro: 'Pour comparer deux fractions, on les écrit avec le même dénominateur.',
        body: 'À dénominateur égal, la plus grande fraction a le plus grand numérateur. Multiplier le numérateur et le dénominateur par un même nombre donne une fraction égale.',
        points: [
          'Même dénominateur : la plus grande fraction a le plus grand numérateur.',
          'Multiplier en haut et en bas par le même nombre donne une fraction égale.',
          'Même numérateur : la plus grande fraction a le plus petit dénominateur.'
        ],
        tip: 'Avant de comparer, mettez les deux fractions au même dénominateur.',
        rich: {
          art: 'search',
          scene: 'Afi a lu 2/5 de son livre, Yao 4/5 du même livre. Qui en a lu le plus ? Et si Afi avait lu 1/2 du livre, et Yao 2/4 ?',
          sections: [
            {
              title: 'Même dénominateur : on compare les numérateurs',
              text: ['Quand les parts ont la même taille, celui qui en a le plus a la plus grande fraction : **4/5 > 2/5**.']
            },
            {
              title: 'Comparer à 1',
              text: [
                'Une fraction est **plus petite que 1** quand son numérateur est plus petit que son dénominateur (3/4 < 1), **plus grande que 1** dans le cas contraire (7/4 > 1).'
              ]
            },
            {
              title: 'Des fractions égales',
              text: [
                'On obtient une fraction égale en **multipliant** (ou en divisant) le numérateur et le dénominateur **par le même nombre** : 1/2 = 2/4 = 4/8.',
                'C’est ce qui permet de comparer deux fractions de dénominateurs différents : on les écrit d’abord avec le même.'
              ]
            }
          ],
          example: {
            title: 'Trois comparaisons',
            figure: {
              kind: 'table',
              head: ['Fractions', 'Même dénominateur', 'Résultat'],
              rows: [
                ['2/5 et 4/5', 'Déjà le même : 5', '**4/5 > 2/5**'],
                ['1/2 et 3/4', '1/2 = 2/4', '**3/4 > 1/2**'],
                ['2/3 et 4/6', '2/3 = 4/6', '**égales**']
              ]
            },
            caption: 'Comparer en ramenant au même dénominateur',
            notes: [
              'Yao a lu plus qu’Afi : 4/5 > 2/5.',
              '1/2 et 2/4 représentent la même part du livre : ces fractions sont **égales**.',
              'Pour comparer 1/2 et 3/4, on écrit d’abord 1/2 sous la forme 2/4.'
            ]
          },
          question: {
            ask: 'Entre 1/3 et 1/4, laquelle est la plus grande ?',
            answer: [
              '1/3. À numérateur égal, plus on partage en beaucoup de parts, plus chaque part est petite : un tiers de gâteau est plus gros qu’un quart.'
            ]
          }
        }
      },
      {
        title: 'Calculer avec des fractions',
        label: 'Additionner, prendre une fraction d’une quantité',
        minutes: '7 min',
        intro: 'On additionne les numérateurs et on garde le dénominateur.',
        body: 'Pour prendre une fraction d’une quantité, on divise la quantité par le dénominateur, puis on multiplie par le numérateur.',
        points: [
          'On additionne les numérateurs, on garde le dénominateur.',
          'Fraction d’une quantité : diviser par le dénominateur, puis multiplier par le numérateur.',
          'On vérifie en additionnant ce qui est pris et ce qui reste.'
        ],
        tip: 'Commencez toujours par la division : la valeur d’une part d’abord, puis le nombre de parts.',
        rich: {
          art: 'wallet',
          scene:
            'Ama a 2 000 F. Elle dépense 1/4 de cette somme au marché le matin, et 2/4 l’après-midi. Quelle part de son argent a-t-elle dépensée, et combien lui reste-t-il ?',
          sections: [
            {
              title: 'Additionner des fractions de même dénominateur',
              text: [
                'On additionne les **numérateurs** et on garde le **dénominateur** : 1/4 + 2/4 = 3/4.',
                'On ne touche pas au dénominateur : la taille des parts ne change pas.'
              ]
            },
            { title: 'Soustraire', text: ['La règle est la même : 7/8 − 3/8 = 4/8.'] },
            {
              title: 'La fraction d’une quantité',
              text: ['Pour prendre **3/4 de 2 000 F**, on divise par le dénominateur, puis on multiplie par le numérateur :'],
              items: ['2 000 ÷ 4 = 500 F : la valeur d’un quart ;', '500 × 3 = 1 500 F : la valeur de trois quarts.'],
              ordered: true
            }
          ],
          example: {
            title: 'L’argent d’Ama',
            figure: {
              kind: 'flow',
              nodes: [
                { art: 'wallet', label: '2 000 F', sub: 'la somme de départ' },
                { art: 'chart', label: '500 F', sub: 'un quart' },
                { art: 'done', label: '1 500 F', sub: 'trois quarts' }
              ],
              links: ['÷ 4', '× 3']
            },
            caption: 'Calculer 3/4 de 2 000 F',
            notes: [
              'Ama a dépensé 1/4 + 2/4 = **3/4** de son argent, soit **1 500 F**.',
              'Il lui reste 4/4 − 3/4 = **1/4**, soit **500 F**.',
              'Vérification : 1 500 F + 500 F = 2 000 F.'
            ]
          },
          question: {
            ask: 'Peut-on additionner 1/2 et 1/3 de la même façon ?',
            answer: [
              'Pas directement : les parts n’ont pas la même taille. On écrit d’abord les deux fractions avec le même dénominateur : 1/2 = 3/6 et 1/3 = 2/6, donc 1/2 + 1/3 = 5/6.'
            ]
          }
        }
      }
    ],
    questions: [
      {
        text: 'Dans la fraction 5/8, que représente le 8 ?',
        answers: ['Le nombre de parts prises', 'Le nombre de parts égales du partage', 'Le nombre de gâteaux'],
        correctIndex: 1,
        explanation: 'Le dénominateur, en bas, dit en combien de parts égales on partage l’unité.'
      },
      {
        text: 'Quelle fraction est égale à 3/4 ?',
        answers: ['6/8', '3/8', '4/3'],
        correctIndex: 0,
        explanation: 'On multiplie le numérateur et le dénominateur par 2 : 3/4 = 6/8.'
      },
      {
        text: 'Combien font 2/5 de 1 500 F ?',
        answers: ['300 F', '600 F', '750 F'],
        correctIndex: 1,
        explanation: '1 500 ÷ 5 = 300 F pour un cinquième, puis 300 × 2 = 600 F.'
      }
    ]
  },

  '3e-thales': {
    id: '3e-thales',
    title: 'Le théorème de Thalès',
    quizTitle: 'Vérifier vos acquis sur le théorème de Thalès',
    labType: 'generic',
    goals: [
      'reconnaître une configuration de Thalès et écrire les rapports égaux ;',
      'calculer une longueur à l’aide du théorème ;',
      'utiliser la réciproque pour prouver que deux droites sont parallèles.'
    ],
    lessons: [
      {
        title: 'Reconnaître la configuration',
        label: 'Deux sécantes, deux parallèles',
        minutes: '8 min',
        intro: 'Deux droites sécantes en un point, coupées par deux droites parallèles : c’est une configuration de Thalès.',
        body: 'Si (MN) et (BC) sont parallèles, les longueurs des triangles AMN et ABC sont proportionnelles : AM/AB = AN/AC = MN/BC.',
        points: [
          'Deux droites sécantes en A, coupées par deux droites parallèles.',
          'AM/AB = AN/AC = MN/BC.',
          'Configuration emboîtée ou « papillon » : le même théorème.'
        ],
        tip: 'Repérez d’abord le point commun et les deux parallèles : le reste en découle.',
        rich: {
          art: 'route',
          scene:
            'Sur un plan de cadastre, deux routes partent du même carrefour A. Deux pistes parallèles les relient. Sans mesurer la seconde piste, on peut calculer sa longueur : c’est le théorème de Thalès.',
          sections: [
            {
              title: 'La configuration',
              text: [
                'Deux droites (d) et (d′) sont **sécantes en un point A**. Les points B et M sont sur (d), les points C et N sur (d′). Si **(MN) et (BC) sont parallèles**, on est dans une configuration de Thalès.'
              ]
            },
            {
              title: 'Deux formes possibles',
              text: [
                'M et N peuvent être du même côté de A que B et C : les deux triangles s’emboîtent. Ils peuvent aussi être de l’autre côté de A : c’est la configuration « papillon ». Le théorème s’applique dans les deux cas.'
              ]
            },
            {
              title: 'L’énoncé',
              text: [
                'Si les droites (MN) et (BC) sont parallèles, alors les longueurs sont **proportionnelles** : **AM/AB = AN/AC = MN/BC**.',
                'Chaque rapport compare un côté du triangle AMN au côté correspondant du triangle ABC.'
              ]
            }
          ],
          example: {
            title: 'Associer les côtés correspondants',
            figure: {
              kind: 'table',
              head: ['Côté du triangle AMN', 'Côté correspondant du triangle ABC', 'Pourquoi'],
              rows: [
                ['AM', 'AB', 'sur la même droite (d)'],
                ['AN', 'AC', 'sur la même droite (d′)'],
                ['MN', 'BC', 'sur deux droites parallèles']
              ]
            },
            caption: 'Le tableau à dresser avant d’écrire les rapports',
            notes: [
              'Les côtés correspondants sont sur la **même droite** ou sur **deux droites parallèles**.',
              'Le point A commence les deux premiers rapports.',
              'Dresser ce tableau évite d’inverser un rapport.'
            ]
          },
          question: {
            ask: 'Le théorème marche-t-il si (MN) et (BC) ne sont pas parallèles ?',
            answer: ['Non. Le parallélisme est la condition du théorème : sans lui, les rapports ne sont en général pas égaux.']
          }
        }
      },
      {
        title: 'Calculer une longueur',
        label: 'Le produit en croix',
        minutes: '8 min',
        intro: 'On cite les données, on écrit l’égalité des rapports, puis on calcule par produit en croix.',
        body: 'On garde le rapport qui contient la longueur cherchée et deux longueurs connues : de AM/AB = MN/BC, on tire MN = AM × BC ÷ AB.',
        points: [
          'Citer les données, écrire l’égalité, calculer.',
          'Garder les deux rapports qui contiennent l’inconnue et deux longueurs connues.',
          'Vérifier que les rapports donnent la même valeur.'
        ],
        tip: 'Un résultat plus grand que le côté du grand triangle trahit un rapport inversé.',
        rich: {
          art: 'list',
          scene:
            'Sur une figure, A, M, B sont alignés, ainsi que A, N, C, et les droites (MN) et (BC) sont parallèles. On sait que AM = 3 cm, AB = 5 cm et BC = 8 cm. Combien mesure MN ?',
          sections: [
            {
              title: 'Rédiger en trois temps',
              text: ['Une rédaction claire suit toujours le même ordre :'],
              items: [
                '**Citer les données** : les points alignés et les droites parallèles.',
                '**Écrire l’égalité** des rapports donnée par le théorème.',
                '**Remplacer** par les valeurs connues, puis calculer.'
              ],
              ordered: true
            },
            {
              title: 'Choisir les bons rapports',
              text: ['Parmi les trois rapports, on garde les deux qui contiennent **la longueur cherchée** et **deux longueurs connues**.']
            },
            {
              title: 'Le produit en croix',
              text: ['De l’égalité AM/AB = MN/BC, on tire **MN = AM × BC ÷ AB**.']
            }
          ],
          example: {
            title: 'Le calcul de MN',
            figure: {
              kind: 'table',
              head: ['Étape', 'Ce qu’on écrit'],
              rows: [
                ['Données', 'A, M, B et A, N, C alignés ; (MN) // (BC)'],
                ['Rapports utiles', 'AM/AB = MN/BC'],
                ['Valeurs', '3/5 = MN/8'],
                ['Produit en croix', 'MN = 3 × 8 ÷ 5'],
                ['Résultat', '**MN = 4,8 cm**']
              ]
            },
            caption: 'La rédaction complète, étape par étape',
            notes: [
              'Les données sont citées avant toute égalité : c’est ce qui autorise le théorème.',
              'MN est plus court que BC, ce qui est cohérent : AMN est le petit triangle.',
              'Le résultat est donné avec son unité.'
            ]
          },
          question: {
            ask: 'Comment vérifier mon résultat ?',
            answer: ['Calculez les deux rapports : 3/5 = 0,6 et 4,8/8 = 0,6. Ils sont égaux : le calcul est juste.']
          }
        }
      },
      {
        title: 'Prouver un parallélisme',
        label: 'La réciproque',
        minutes: '9 min',
        intro: 'Si les rapports sont égaux et les points alignés dans le même ordre, les droites sont parallèles.',
        body: 'La réciproque part des longueurs pour prouver le parallélisme ; si les rapports diffèrent, les droites ne sont pas parallèles.',
        points: [
          'Rapports égaux et points dans le même ordre : les droites sont parallèles.',
          'Rapports différents : les droites ne sont pas parallèles.',
          'Le théorème sert à calculer ; la réciproque, à prouver.'
        ],
        tip: 'Comparez les rapports sous forme de fractions simplifiées ou de nombres décimaux, jamais à l’œil.',
        rich: {
          art: 'done',
          scene: 'Un menuisier veut savoir si les deux traverses d’une étagère sont parallèles. À l’œil, impossible d’être sûr : il prend son mètre.',
          sections: [
            {
              title: 'L’énoncé de la réciproque',
              text: [
                'Si A, M, B d’une part et A, N, C d’autre part sont **alignés dans le même ordre**, et si **AM/AB = AN/AC**, alors les droites **(MN) et (BC) sont parallèles**.'
              ]
            },
            {
              title: 'Attention à l’ordre des points',
              text: [
                'La condition « dans le même ordre » est indispensable : M doit être du même côté de A que B, et N du même côté de A que C (ou bien tous deux de l’autre côté).'
              ]
            },
            {
              title: 'Si les rapports sont différents',
              text: [
                'Si AM/AB ≠ AN/AC, les droites **ne sont pas** parallèles : si elles l’étaient, le théorème direct donnerait des rapports égaux.'
              ]
            }
          ],
          example: {
            title: 'Les traverses du menuisier',
            figure: {
              kind: 'table',
              head: ['Mesures', 'Rapport'],
              rows: [
                ['AM = 2 cm, AB = 6 cm', 'AM/AB = 2/6 = 1/3'],
                ['AN = 3 cm, AC = 9 cm', 'AN/AC = 3/9 = 1/3'],
                ['Conclusion', '**(MN) // (BC)**']
              ]
            },
            caption: 'Deux rapports égaux, des points dans le même ordre',
            notes: [
              'Les deux rapports valent 1/3 : ils sont égaux.',
              'Les points sont alignés dans le même ordre : la réciproque s’applique.',
              'Le menuisier conclut sans équerre ni rapporteur.'
            ]
          },
          question: {
            ask: 'Quelle différence entre le théorème et sa réciproque ?',
            answer: ['Le théorème part du parallélisme pour calculer des longueurs. La réciproque part des longueurs pour prouver le parallélisme.']
          }
        }
      }
    ],
    questions: [
      {
        text: 'A, M, B et A, N, C sont alignés et (MN) // (BC). Quelle égalité est vraie ?',
        answers: ['AM/AB = AN/AC', 'AM/AN = AB/BC', 'AM/MB = BC/MN'],
        correctIndex: 0,
        explanation: 'Les rapports comparent les côtés du triangle AMN aux côtés correspondants du triangle ABC.'
      },
      {
        text: 'Avec AM = 4 cm, AB = 10 cm et BC = 15 cm, et (MN) // (BC), que vaut MN ?',
        answers: ['6 cm', '37,5 cm', '2,7 cm'],
        correctIndex: 0,
        explanation: 'MN = AM × BC ÷ AB = 4 × 15 ÷ 10 = 6 cm.'
      },
      {
        text: 'Les points sont alignés dans le même ordre, AM/AB = 0,5 et AN/AC = 0,6. Que conclure ?',
        answers: ['(MN) et (BC) sont parallèles', '(MN) et (BC) ne sont pas parallèles', 'On ne peut rien conclure'],
        correctIndex: 1,
        explanation: 'Si les droites étaient parallèles, les rapports seraient égaux. Ils diffèrent : les droites ne sont pas parallèles.'
      }
    ]
  },

  '2nde-mole': {
    id: '2nde-mole',
    title: 'La quantité de matière : la mole',
    quizTitle: 'Vérifier vos acquis sur la quantité de matière',
    labType: 'generic',
    goals: [
      'expliquer pourquoi les chimistes comptent les entités par paquets, les moles ;',
      'calculer une quantité de matière à partir d’une masse ;',
      'calculer une quantité de matière de gaz à partir d’un volume.'
    ],
    lessons: [
      {
        title: 'Compter en moles',
        label: 'Un paquet de 6,02 × 10²³ entités',
        minutes: '8 min',
        intro: 'La mole est une unité de comptage : une mole contient 6,02 × 10²³ entités.',
        body: 'La quantité de matière n d’un échantillon de N entités vaut n = N ÷ Nₐ, avec Nₐ = 6,02 × 10²³ mol⁻¹, la constante d’Avogadro.',
        points: ['1 mol = 6,02 × 10²³ entités.', 'n = N ÷ Nₐ.', 'La mole sert à compter des entités trop petites pour être comptées une à une.'],
        tip: 'Écrivez toujours l’unité à côté du nombre : 2 mol, et non 2.',
        rich: {
          art: 'search',
          scene:
            'Une goutte d’eau contient environ 1,7 × 10²¹ molécules. Personne ne peut les compter une à une : les chimistes comptent par paquets, comme on compte les œufs par plateaux de trente.',
          sections: [
            {
              title: 'Une unité de comptage',
              text: ['La **mole** (symbole **mol**) est un paquet d’entités : atomes, molécules ou ions. Une mole contient **6,02 × 10²³** entités.']
            },
            {
              title: 'La constante d’Avogadro',
              text: ['Ce nombre d’entités par mole s’appelle la **constante d’Avogadro** : **Nₐ = 6,02 × 10²³ mol⁻¹**.']
            },
            {
              title: 'Du nombre d’entités à la quantité de matière',
              text: [
                'La quantité de matière **n**, en mol, d’un échantillon qui contient N entités vaut **n = N ÷ Nₐ**.',
                'Par exemple, 1,2 × 10²⁴ molécules représentent 1,2 × 10²⁴ ÷ 6,02 × 10²³ ≈ **2 mol**.'
              ]
            }
          ],
          example: {
            title: 'Compter par paquets, du marché au laboratoire',
            figure: {
              kind: 'table',
              head: ['On compte…', 'par paquets de', 'Le paquet s’appelle'],
              rows: [
                ['les œufs', '30', 'un plateau'],
                ['les feuilles de papier', '500', 'une rame'],
                ['les atomes et les molécules', '6,02 × 10²³', '**une mole**']
              ]
            },
            caption: 'La même idée, à des échelles très différentes',
            notes: [
              'Un paquet de taille fixe évite de manipuler des nombres immenses.',
              'Seule la taille du paquet change : la mole est gigantesque parce que les atomes sont minuscules.',
              'Pourtant, une mole d’eau ne pèse qu’environ 18 g.'
            ]
          },
          question: {
            ask: 'Pourquoi un nombre aussi étrange que 6,02 × 10²³ ?',
            answer: [
              'Historiquement, c’est le nombre d’atomes contenus dans 12 g de carbone 12. Ce choix fait que la masse d’une mole, en grammes, se lit directement dans la classification périodique : c’est ce qui rend la leçon suivante si simple.'
            ]
          }
        }
      },
      {
        title: 'De la masse à la quantité de matière',
        label: 'La masse molaire',
        minutes: '8 min',
        intro: 'La masse molaire M est la masse d’une mole d’entités, en g/mol.',
        body: 'Pour un échantillon de masse m, la quantité de matière vaut n = m ÷ M ; à l’inverse, m = n × M.',
        points: [
          'M en g/mol, lue dans la classification périodique ou calculée.',
          'n = m ÷ M, et m = n × M.',
          'Tenir compte des indices de la formule chimique.'
        ],
        tip: 'Écrivez les unités dans le calcul : des g divisés par des g/mol donnent bien des mol.',
        rich: {
          art: 'chart',
          scene:
            'Au laboratoire, on ne compte pas les molécules : on les pèse. Il faut donc passer de la masse, lue sur la balance, à la quantité de matière.',
          sections: [
            {
              title: 'La masse molaire',
              text: [
                'La **masse molaire** M est la masse d’une mole d’entités, en **g/mol**. Pour un atome, on la lit dans la classification périodique : M(H) = 1 g/mol, M(C) = 12 g/mol, M(O) = 16 g/mol.'
              ]
            },
            {
              title: 'La masse molaire d’une molécule',
              text: ['On additionne les masses molaires des atomes qui la composent, en tenant compte des indices :'],
              items: ['M(H₂O) = 2 × 1 + 16 = **18 g/mol** ;', 'M(CO₂) = 12 + 2 × 16 = **44 g/mol**.']
            },
            {
              title: 'La relation',
              text: ['Pour un échantillon de masse m, en grammes : **n = m ÷ M**.', 'Et, pour peser une quantité donnée : m = n × M.']
            }
          ],
          example: {
            title: 'Combien de moles dans 36 g d’eau ?',
            figure: {
              kind: 'flow',
              nodes: [
                { art: 'search', label: '36 g', sub: 'masse lue sur la balance' },
                { art: 'list', label: '18 g/mol', sub: 'masse molaire de l’eau' },
                { art: 'done', label: '2 mol', sub: 'quantité de matière' }
              ],
              links: ['divisée par', 'donne']
            },
            caption: 'Une pesée, une division',
            notes: [
              'n = m ÷ M = 36 ÷ 18 = **2 mol**.',
              'Soit 2 × 6,02 × 10²³ ≈ **1,2 × 10²⁴ molécules**.',
              'Une seule pesée suffit : aucun comptage.'
            ]
          },
          question: {
            ask: 'Pourquoi M(H₂O) vaut-elle 18 g/mol et pas 17 ?',
            answer: [
              'La molécule d’eau contient **deux** atomes d’hydrogène : 2 × 1 + 16 = 18 g/mol. Oublier l’indice 2 est l’erreur la plus courante.'
            ]
          }
        }
      },
      {
        title: 'Le cas des gaz',
        label: 'Le volume molaire',
        minutes: '9 min',
        intro: 'Dans les mêmes conditions, une mole de n’importe quel gaz occupe le même volume, le volume molaire Vm.',
        body: 'Pour un volume V de gaz, la quantité de matière vaut n = V ÷ Vm ; Vm vaut environ 24 L/mol à 20 °C et 22,4 L/mol à 0 °C, sous la pression atmosphérique normale.',
        points: ['Pour un gaz : n = V ÷ Vm.', 'Vm ≈ 24 L/mol à 20 °C, 22,4 L/mol à 0 °C.', 'Valable pour les gaz seulement.'],
        tip: 'Relisez la température de l’énoncé avant de choisir la valeur de Vm.',
        rich: {
          art: 'cloud',
          scene: 'Un ballon gonflé à l’hélium ne pèse presque rien sur une balance. Pour un gaz, il est plus commode de mesurer un volume qu’une masse.',
          sections: [
            {
              title: 'Le volume molaire',
              text: [
                'Dans les mêmes conditions de température et de pression, **une mole de n’importe quel gaz occupe le même volume**, appelé volume molaire **Vm**.'
              ]
            },
            {
              title: 'Deux valeurs à connaître',
              text: ['Vm dépend de la température et de la pression. Sous la pression atmosphérique normale :'],
              items: ['à 0 °C : **Vm ≈ 22,4 L/mol** ;', 'à 20 °C : **Vm ≈ 24 L/mol**.']
            },
            {
              title: 'La relation',
              text: ['Pour un volume V de gaz, en litres : **n = V ÷ Vm**.', 'À l’inverse, le volume occupé par n moles de gaz vaut V = n × Vm.']
            }
          ],
          example: {
            title: 'Le même calcul pour tous les gaz',
            figure: {
              kind: 'table',
              head: ['Gaz, à 20 °C', 'Volume', 'Quantité de matière'],
              rows: [
                ['Dioxygène', '48 L', '48 ÷ 24 = **2 mol**'],
                ['Dioxyde de carbone', '12 L', '12 ÷ 24 = **0,5 mol**'],
                ['Hélium d’un ballon', '6 L', '6 ÷ 24 = **0,25 mol**']
              ]
            },
            caption: 'Le volume suffit, quelle que soit la nature du gaz',
            notes: [
              'Le résultat ne dépend que du volume et des conditions, pas de la nature du gaz.',
              'Ce n’est vrai que pour les gaz : un litre d’eau et un litre d’huile ne contiennent pas la même quantité de matière.',
              'On choisit Vm selon la température donnée par l’énoncé.'
            ]
          },
          question: {
            ask: 'Pourquoi tous les gaz ont-ils le même volume molaire ?',
            answer: [
              'Dans un gaz, les molécules sont très éloignées les unes des autres : le volume occupé dépend surtout de leur nombre, presque pas de leur taille. Un même nombre de molécules occupe donc le même volume.'
            ]
          }
        }
      }
    ],
    questions: [
      {
        text: 'Combien d’entités une mole contient-elle ?',
        answers: ['6,02 × 10²³', '1 000', '12'],
        correctIndex: 0,
        explanation: 'C’est la constante d’Avogadro : Nₐ = 6,02 × 10²³ mol⁻¹.'
      },
      {
        text: 'Quelle quantité de matière y a-t-il dans 88 g de dioxyde de carbone (M = 44 g/mol) ?',
        answers: ['0,5 mol', '2 mol', '132 mol'],
        correctIndex: 1,
        explanation: 'n = m ÷ M = 88 ÷ 44 = 2 mol.'
      },
      {
        text: 'À 20 °C (Vm = 24 L/mol), quel volume occupent 3 mol de dioxygène ?',
        answers: ['8 L', '27 L', '72 L'],
        correctIndex: 2,
        explanation: 'V = n × Vm = 3 × 24 = 72 L.'
      }
    ]
  },
  ...EXAM_MODULES_CONTENT
};

/* ============================================================================ registres communs */

/** Les leçons rédigées et les objectifs, déclarés comme ceux des autres modules (voir lessonsRich.ts). */
export const SCHOOL_LESSONS_RICH: Record<string, LessonRich[]> = Object.fromEntries(
  Object.values(SCHOOL_MODULES_CONTENT).map((m) => [m.id, m.lessons.map((lesson) => lesson.rich as LessonRich)])
);
export const SCHOOL_MODULE_GOALS: Record<string, string[]> = Object.fromEntries(
  Object.values(SCHOOL_MODULES_CONTENT).map((m) => [m.id, m.goals || []])
);
