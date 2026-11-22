/**
 * Programmes officiels du collège au Togo (6e à 3e) : le plan de chaque programme, gardé en interne.
 * Il ne s'affiche pas comme contenu de la Bibliothèque : il sert à rattacher un cours à sa leçon
 * officielle et à savoir ce qui relève de chaque classe (recommandations selon la classe de l'élève).
 *
 * Source : le portail École Togo du ministère (https://ecole.gouv.tg/college), rubrique « Programmes »
 * de chaque classe : une page par matière, avec le programme en PDF, ouverte sans compte. Les documents
 * ont été lus les 22 et 23 novembre 2026. On en reprend le plan — thèmes, titres des leçons, volume
 * horaire, œuvres au programme ; le détail de chaque leçon (capacités, contenus, guide du professeur)
 * reste dans le document officiel.
 *
 * - `PROGRAMMES_TOGO` : les programmes lus ;
 * - `CatalogItem.programme` rattache un cours de SAVOIR+ à une leçon de son programme ;
 * - `PROGRAMME_GAPS` : ce qui manque ou ce qui est incohérent sur le portail.
 */
export interface ProgrammeTheme {
  theme: string;
  lessons: string[];
  /** Volume horaire du thème, quand le programme le donne par thème (français). */
  hours?: string;
}

export interface ProgrammeDoc {
  id: string;
  classLabel: string;
  subject: string;
  /** Titre du document. */
  title: string;
  /** Autorité qui l'a publié, telle qu'elle figure sur la page de garde. */
  issuer: string;
  /** Édition indiquée sur la page de garde. */
  edition: string;
  /** Page du portail qui présente le document. */
  pageUrl: string;
  /** Le document lui-même (PDF). */
  pdfUrl: string;
  themes: ProgrammeTheme[];
  /** Volume horaire annuel, quand la progression le donne. */
  volume?: string;
  /** Œuvres au programme (français). */
  works?: string[];
  /** Ce que la progression ne détaille pas, ou une précision de lecture. */
  note?: string;
}

const PORTAL = 'https://ecole.gouv.tg/college';
const page = (id: number) => `${PORTAL}/course/view.php?id=${id}`;
const pdf = (id: number) => `${PORTAL}/mod/resource/view.php?id=${id}`;

const MEPS = 'Ministère des Enseignements Primaire et Secondaire';
const MEPSTA = 'Ministère des Enseignements Primaire, Secondaire, Technique et de l’Artisanat';
const DESG = 'Direction de l’Enseignement Secondaire Général';
const DPIP = 'Direction des Programmes et Innovations Pédagogiques';

type ThemeTuple = [theme: string, lessons: string[], hours?: string];

function doc(
  classLabel: string,
  key: string,
  subject: string,
  issuer: string,
  edition: string,
  pageId: number,
  pdfId: number,
  themes: ThemeTuple[],
  extra: Pick<ProgrammeDoc, 'volume' | 'works' | 'note'> = {}
): ProgrammeDoc {
  return {
    id: `${classLabel}-${key}`,
    classLabel,
    subject,
    title: `${subject} · Programme de la classe de ${classLabel}`,
    issuer,
    edition,
    pageUrl: page(pageId),
    pdfUrl: pdf(pdfId),
    themes: themes.map(([theme, lessons, hours]) => ({ theme, lessons, hours })),
    ...extra
  };
}

const MATHS = 'Mathématiques';
const PCT = 'Physique-Chimie et Technologie';
const SVT = 'Sciences de la Vie et de la Terre';
const GEO = 'Géographie';
const HIST = 'Histoire';
const ECM = 'Éducation civique et morale';
const FR = 'Français';
const ANG = 'Anglais';
const FR_NOTE =
  'Le programme de français avance par semaines (lecture, oral, vocabulaire, orthographe, grammaire, expression écrite) à l’intérieur de chaque thème, sans titres de leçons.';

export const PROGRAMMES_TOGO: ProgrammeDoc[] = [
  /* ------------------------------------------------------------------ 6e */
  doc('6e', 'maths', MATHS, `${MEPS} · ${DESG}`, '2018-2019', 534, 380, [
    ['Configurations du plan', ['Droites du plan', 'Segments', 'Angles', 'Cercles', 'Triangles', 'Parallélogrammes']],
    ['Calcul numérique', ['Arithmétique', 'Nombres décimaux, programme de calcul', 'Fractions', 'Nombres décimaux relatifs']],
    ['Organisation des données et fonctions', ['Situations de proportionnalité', 'Pourcentages et échelles']],
    ['Applications du plan', ['Figures symétriques par rapport à une droite', 'Figures symétriques par rapport à un point']],
    ['Configurations de l’espace', ['Cube, pavé droit']]
  ]),
  doc('6e', 'pct', PCT, `${MEPS} · ${DESG}`, 'Septembre 2018', 541, 942, [
    [
      'Physique · États et propriétés physiques de la matière',
      ['Les états de la matière', 'Les changements d’état de l’eau', 'Les grandeurs physiques : volume, masse, température']
    ],
    ['Physique · Électricité', ['Le circuit électrique', 'Les conducteurs et les isolants électriques', 'Les circuits série, les circuits avec dérivation']],
    [
      'Chimie · La combustion',
      [
        'Étude expérimentale de la combustion d’une bougie',
        'La combustion des combustibles usuels',
        'La combustion du soufre, un autre exemple de combustion',
        'La combustion et l’environnement'
      ]
    ],
    [
      'Technologie · Réalisation d’un objet technique',
      ['L’objet naturel et l’objet technique', 'Réalisation du prototype d’une éprouvette graduée', 'L’éprouvette graduée, objet technique']
    ],
    [
      'Technologie · Les matériaux',
      ['Les principales familles de matériaux', 'Caractéristiques et propriétés des matériaux', 'Recyclage des matériaux et impact environnemental']
    ],
    ['Technologie · Évolution d’un objet technique', ['De la balance romaine à la balance électronique']],
    ['Technologie · Étude d’un composant électrique simple', ['L’étude d’un interrupteur simple du commerce']],
    ['Technologie · Outil informatique', ['L’ordinateur et ses périphériques']]
  ]),
  doc(
    '6e',
    'svt',
    SVT,
    `${MEPS} · ${DPIP}`,
    'Août 2024',
    536,
    938,
    [
      ['Les êtres vivants et leur environnement', ['Organisation d’une sortie de terrain', 'Connaissance du milieu', 'Diversité des modes de déplacement chez les animaux']],
      [
        'L’Homme et sa santé',
        ['Hygiène', 'La vaccination', 'Méfaits de l’usage des drogues', 'Infections sexuellement transmissibles : IST, VIH-SIDA', 'Paludisme']
      ],
      ['Nutrition et alimentation des êtres vivants', ['Diversité et nécessité de l’alimentation chez les animaux', 'Application à l’élevage des animaux']],
      ['Reproduction des êtres vivants', ['Oviparité chez la poule', 'Viviparité chez l’homme']]
    ],
    { volume: '50 heures' }
  ),
  doc(
    '6e',
    'francais',
    FR,
    `${MEPS} · ${DPIP}`,
    'Août 2024',
    537,
    916,
    [
      ['Environnement scolaire', [], '12 heures'],
      ['Environnement familial', [], '12 heures'],
      ['Jeux et loisirs', [], '24 heures'],
      ['L’homme et la nature', [], '24 heures'],
      ['La santé', [], '24 heures'],
      ['Le travail des enfants', [], '12 heures'],
      ['Informations et médias', [], '12 heures']
    ],
    { works: ['Bou Tora Takpa Dissirama, Journal d’une bonne (éditions Haho)'], note: FR_NOTE }
  ),
  doc(
    '6e',
    'geographie',
    GEO,
    `${MEPS} · ${DPIP}`,
    'Août 2024',
    538,
    929,
    [
      ['Maîtriser son espace de vie', ['À la découverte de la géographie', 'Se repérer dans son espace de vie', 'De l’espace réel à l’espace schématisé']],
      [
        'L’homme et son environnement',
        ['Ménager l’atmosphère', 'L’eau, une ressource indispensable', 'Découvrir le relief', 'Protéger le sol de son milieu', 'Préserver la végétation']
      ]
    ],
    { volume: '25 heures' }
  ),
  doc(
    '6e',
    'histoire',
    HIST,
    `${MEPS} · ${DESG}`,
    '2018-2019',
    538,
    930,
    [
      [
        'Introduction à la science historique',
        ['L’histoire : définition et objet', 'Les sources de l’histoire', 'La notion de chronologie', 'Les grandes divisions du temps à l’échelle humaine']
      ],
      ['La préhistoire', ['L’apparition de l’Homme en Afrique : les vestiges préhistoriques en Afrique', 'Archéologie et préhistoire du Togo']],
      [
        'Les civilisations de l’Afrique',
        ['L’Égypte ancienne : présentation', 'L’héritage de la civilisation égyptienne', 'La métallurgie du fer au Togo et ses conséquences']
      ]
    ],
    { volume: '25 heures' }
  ),
  doc(
    '6e',
    'ecm',
    ECM,
    `${MEPS} · ${DPIP}`,
    'Août 2024',
    540,
    917,
    [
      ['Civilité', ['Règles de bienséance', 'Formules de courtoisie']],
      [
        'Connaissance de soi et des autres',
        ['IMC et son interprétation', 'Surpoids et obésité', 'Qui suis-je ?', 'Membres de ma famille', 'Fondements, fonctions et gestion de la famille']
      ],
      ['Connaissance de son cadre de vie', ['Description et utilité de la maison', 'Accidents domestiques et précautions à prendre', 'Connaissance du collège']],
      ['Extrémisme violent et culture de la paix', ['Comprendre l’extrémisme violent', 'Notions de paix', 'Paix avec soi-même et avec les autres']],
      [
        'Santé, environnement',
        ['Conservation et protection des aliments', 'Comité d’hygiène de l’établissement', 'Entretien de l’environnement immédiat', 'Jardins et parterres']
      ]
    ],
    { volume: '50 heures' }
  ),
  doc('6e', 'anglais', ANG, `${MEPS} · ${DPIP}`, 'Août 2024', 539, 915, [
    ['À l’école', ['Les salutations', 'En classe']],
    ['La date et l’heure', ['La date', 'L’heure', 'L’emploi du temps']],
    ['La maison', ['La famille', 'Dans la maison', 'Dans la cuisine', 'Les repas']],
    ['Le corps humain et l’hygiène corporelle', ['Le corps humain', 'L’hygiène corporelle']],
    ['Faire des achats', ['Au marché', 'À la boutique', 'Les vêtements']],
    ['Les valeurs citoyennes', ['Les emblèmes']],
    ['La violence à l’école', ['La vie à l’école']],
    ['Les sports et les jeux', ['L’importance du sport', 'Les compétitions scolaires']],
    ['Les fruits et les légumes', ['Le marché de fruits et de légumes']]
  ]),

  /* ------------------------------------------------------------------ 5e */
  doc('5e', 'maths', MATHS, `${MEPS} · ${DESG}`, '2018-2019', 546, 435, [
    ['Configurations du plan', ['Distance et segments', 'Angles', 'Triangles', 'Cercle', 'Polygones']],
    ['Calcul numérique', ['Nombres décimaux relatifs', 'Puissances', 'Arithmétique', 'Fractions']],
    ['Applications du plan', ['Figures symétriques par rapport à une droite, par rapport à un point']],
    ['Programmes de calcul, calcul littéral', ['Notion d’équation']],
    ['Organisation des données et fonctions', ['Proportionnalité', 'Pourcentages et échelles']],
    ['Outils vectoriels, géométrie analytique', ['Repérage d’un point sur une droite, sur un quadrillage']],
    ['Configurations de l’espace', ['Prisme droit', 'Cylindre droit']]
  ]),
  doc('5e', 'pct', PCT, `${MEPS} · ${DESG}`, '2018-2019', 547, 943, [
    ['Physique · États et propriétés physiques de la matière', ['État solide et état liquide', 'L’état gazeux']],
    ['Chimie · Discontinuité de la matière', ['Molécules et atomes']],
    ['Physique · Électricité', ['Intensité du courant électrique', 'Tension électrique', 'Circuit série et circuit avec dérivation']],
    [
      'Chimie · Réactions chimiques',
      [
        'Combustion du carbone',
        'Combustions du fer',
        'Combustion du dihydrogène',
        'Action de l’acide chlorhydrique sur le calcaire',
        'Cycle de réactions chimiques'
      ]
    ],
    ['Technologie · Réalisation d’un objet technique', ['Un filtre artisanal pour « purifier » l’eau']],
    ['Technologie · Les matériaux', ['La protection des matériaux', 'La dilatation thermique']],
    ['Technologie · Évolution d’un objet technique', ['Du cadran solaire à la montre connectée']],
    ['Technologie · Le dessin technique', ['Introduction au dessin technique']],
    ['Technologie · Étude d’un objet technique', ['Étude d’un interrupteur va-et-vient du commerce, câblage d’un va-et-vient']]
  ]),
  doc(
    '5e',
    'svt',
    SVT,
    `${MEPS} · ${DPIP}`,
    'Août 2024',
    548,
    939,
    [
      ['Les êtres vivants et leur environnement', ['La pollution de l’environnement : les polluants solides', 'La chaîne alimentaire', 'L’élevage des animaux']],
      ['L’Homme et sa santé', ['Alimentation équilibrée', 'Une maladie parasitaire : l’ascaridiose', 'Infections sexuellement transmissibles : IST, VIH-SIDA']],
      ['Nutrition et alimentation des êtres vivants', ['L’absorption d’eau et de sels minéraux par les plantes vertes', 'La photosynthèse']],
      [
        'Reproduction des êtres vivants',
        [
          'Reproduction sexuée chez les animaux et les végétaux',
          'Les grossesses précoces et les moyens de prévention',
          'Reproduction asexuée chez les animaux et les végétaux'
        ]
      ],
      ['Géodynamique et géologie du Togo', ['Le sol et ses caractéristiques', 'La dégradation des sols', 'Les sols en agriculture']]
    ],
    { volume: '50 heures' }
  ),
  doc(
    '5e',
    'francais',
    FR,
    `${MEPS} · ${DPIP}`,
    'Août 2024',
    563,
    926,
    [
      ['Les moyens de communication', [], '18 heures'],
      ['Vivre en ville ou à la campagne', [], '18 heures'],
      ['Les coutumes et les traditions', [], '18 heures'],
      ['Les arts et les métiers', [], '18 heures'],
      ['Les aventures et mystères', [], '18 heures'],
      ['Les qualités et les défauts', [], '12 heures'],
      ['À la découverte du monde', [], '12 heures']
    ],
    { works: ['Abdoulaye Sadji, Maïmouna'], note: FR_NOTE }
  ),
  doc(
    '5e',
    'geographie',
    GEO,
    `${MEPS} · ${DPIP}`,
    'Août 2024',
    545,
    931,
    [
      [
        'Connaître les régions économiques de mon pays',
        [
          'Région des Savanes : présentation',
          'Région des Savanes : vie économique et culturelle',
          'Région de la Kara : présentation',
          'Région de la Kara : vie économique et culturelle',
          'Région Centrale : présentation',
          'Région Centrale : vie économique et culturelle',
          'Région des Plateaux : présentation',
          'Région des Plateaux : vie économique et culturelle',
          'Région Maritime : présentation',
          'Région Maritime : vie économique et culturelle'
        ]
      ]
    ],
    { volume: '26 heures', note: 'Le programme demande de commencer par la région de l’élève, puis d’étudier les autres du nord vers le sud.' }
  ),
  doc(
    '5e',
    'histoire',
    HIST,
    `${MEPS} · ${DESG}`,
    '2018-2019',
    545,
    932,
    [
      [
        'Les mutations religieuses du Ier au XIIIe siècle',
        ['Naissance et développement du christianisme et de l’islam', 'Le christianisme et l’islam dans le monde aujourd’hui']
      ],
      [
        'Les empires du Soudan occidental du VIIe au XVIe siècle',
        [
          'L’empire du Ghana : évolution historique et civilisation',
          'L’empire du Mali : évolution historique et civilisation',
          'L’empire songhaï : évolution historique et civilisation'
        ]
      ],
      ['Le peuplement du Togo des origines au XIIe siècle', ['Les peuples et ethnies du Togo', 'Les traditions d’origine des peuples du Togo']],
      [
        'Le monde occidental du Xe au XVIe siècle',
        ['L’expansion maritime de l’Europe occidentale : les progrès techniques, les grands voyages de découvertes']
      ]
    ],
    { volume: '25 séances' }
  ),
  doc(
    '5e',
    'ecm',
    ECM,
    `${MEPS} · ${DPIP}`,
    'Août 2024',
    544,
    918,
    [
      ['Civisme', ['Civisme : concepts clés', 'Comportements civiques et inciviques']],
      ['Connaissance de son cadre de vie : la rue', ['Rue : concepts clés', 'Dangers potentiels de la rue', 'Règles du code de la route']],
      ['Connaissance de son cadre de vie : l’école', ['Utilité et organisation de l’école', 'Vie au collège']],
      ['Décentralisation au Togo', ['Subdivisions du Togo', 'Canton']],
      ['Symboles, principes et valeurs du Togo', ['Symboles du Togo (armoiries, hymne national, devise, drapeau)', 'Principes et valeurs du Togo']],
      ['Notion de violence', ['Violence et extrémisme violent', 'Conséquences de la violence et de l’extrémisme violent']],
      ['Santé, environnement et développement', ['Éléments polluants de notre environnement immédiat', 'Développement durable']]
    ],
    { volume: '50 heures' }
  ),

  /* ------------------------------------------------------------------ 4e */
  doc(
    '4e',
    'maths',
    MATHS,
    `${MEPS} · ${DESG}`,
    '2020-2021',
    551,
    436,
    [
      ['Applications du plan', ['Symétrie orthogonale, symétrie centrale', 'Projection', 'Translations']],
      ['Programme de calcul – calcul littéral', ['Calcul sur les expressions algébriques', 'Équations – Inéquations']],
      ['Configurations du plan', ['Distance et droites', 'Triangles – Polygones réguliers', 'Angles – Cercles']],
      ['Calcul numérique', ['Nombres rationnels', 'Nombres décimaux, calcul approché']],
      ['Configurations de l’espace', ['Perspective cavalière', 'Droites et plans de l’espace, positions relatives', 'Sphère']],
      ['Organisation des données', ['Proportionnalité', 'Statistiques']],
      ['Outil vectoriel, géométrie analytique', ['Vecteurs – Repérage']]
    ],
    { volume: '102 heures' }
  ),
  doc('4e', 'pct', PCT, `${MEPS} · ${DESG}`, '2018-2019', 550, 944, [
    ['Physique · Électricité', ['Aimant et bobine', 'Tension alternative', 'Tension du secteur', 'Le transformateur']],
    ['Physique · Mécanique', ['Poids d’un corps', 'Poussée d’Archimède']],
    [
      'Physique · Optique',
      ['Source et récepteur de lumière', 'Propagation rectiligne de la lumière', 'Les ombres, les phases de la Lune et les éclipses', 'Réflexion de la lumière']
    ],
    [
      'Chimie',
      [
        'Structure de l’atome',
        'Structure de l’atome et électricité',
        'Les ions',
        'Transformation chimique de l’ion cuivre en cuivre et inversement',
        'Transformation électrochimique de l’ion cuivre et du cuivre',
        'Courant électrique dans les électrolytes'
      ]
    ],
    [
      'Technologie',
      [
        'Les machines simples à travers les âges',
        'De la houe au motoculteur, les outils du travail de la terre à travers les âges',
        'Le dessin technique',
        'Schématisation d’une installation électrique domestique simple',
        'La génératrice de bicyclette',
        'Un redresseur de courant',
        'La communication sur Internet'
      ]
    ]
  ]),
  doc('4e', 'svt', SVT, `${MEPS} · ${DPIP}`, 'Août 2024', 549, 940, [
    ['Les êtres vivants et leur environnement', ['Pollution de l’environnement : polluants chimiques', 'Les ressources naturelles et leur gestion durable']],
    [
      'Géodynamique et géologie du Togo : la géodynamique externe',
      ['Les différents types de roches', 'Les phénomènes géodynamiques externes', 'Genèse des roches sédimentaires']
    ],
    ['L’Homme et sa santé', ['La tuberculose', 'La Covid-19', 'Le paludisme']],
    [
      'Géodynamique et géologie du Togo : la géodynamique interne',
      [
        'Le volcanisme',
        'Genèse des roches magmatiques',
        'Genèse des roches métamorphiques',
        'Synthèse sur l’étude des roches : cycle géochimique et intérêt économique des roches'
      ]
    ],
    ['Nutrition et alimentation des êtres vivants', ['Différents aliments de l’Homme et des animaux', 'Composition chimique des différents aliments']],
    [
      'Géodynamique et géologie du Togo : la tectonique des plaques',
      ['Structure du globe terrestre', 'Mouvement des plaques tectoniques', 'Les séismes']
    ],
    [
      'Reproduction des êtres vivants et hérédité',
      ['Reproduction humaine : organes génitaux de l’homme et de la femme', 'Grossesses précoces et les moyens de les prévenir']
    ]
  ]),
  doc(
    '4e',
    'francais',
    FR,
    `${MEPSTA} · ${DESG}`,
    '2020-2021',
    554,
    921,
    [
      ['Le monde du travail', [], '18 heures'],
      ['Les rapports sociaux', [], '24 heures'],
      ['Les phénomènes naturels', [], '12 heures'],
      ['L’expression des sentiments', [], '12 heures'],
      ['Portraits réels ou imaginaires', [], '12 heures'],
      ['Plaisir de lire', [], '36 heures']
    ],
    {
      works: [
        'Littérature togolaise : Stève Bodjona, Des larmes au crépuscule (éditions Awoudy)',
        'Littérature africaine : Abdel Hakim Amzat, Pourquoi moi (Laha éditions)',
        'Littérature française : Molière, Le Malade imaginaire'
      ],
      note: FR_NOTE
    }
  ),
  doc(
    '4e',
    'geographie',
    GEO,
    `${MEPS} · ${DPIP}`,
    'Août 2024',
    552,
    933,
    [
      [
        'Le continent africain face aux enjeux démographiques et environnementaux',
        ['Continent africain : présentation', 'Continent africain : enjeux démographiques', 'Continent africain : problèmes environnementaux majeurs']
      ],
      [
        'Le continent africain face aux enjeux économiques',
        ['Continent africain : agriculture', 'Continent africain : industrie', 'Continent africain : commerce', 'Continent africain : transports et télécommunications']
      ]
    ],
    { volume: '25 heures' }
  ),
  doc(
    '4e',
    'histoire',
    HIST,
    `${MEPSTA} · ${DPIP}`,
    '2020-2021',
    552,
    934,
    [
      [
        'Les traites négrières',
        [
          'L’esclavage et la traite des humains dans l’histoire de l’humanité',
          'La traite négrière atlantique',
          'Les routes caravanières en Afrique de l’Ouest et au Togo'
        ]
      ],
      ['L’Afrique du XVIIe au XIXe siècle', ['Le royaume ashanti', 'L’art africain']],
      [
        'Peuples et civilisations du Togo du XIIe au XIXe siècle',
        [
          'Les peuples du bassin de l’Oti et l’organisation du royaume anoufo',
          'L’aire lama',
          'Le royaume de Tchaoudjo',
          'L’aire ajatado : le royaume de Tado et la dispersion des Aja',
          'La cité-État de Notsé et la dispersion des Éwé',
          'Le royaume de Glidji'
        ]
      ]
    ],
    { volume: '25 heures' }
  ),
  doc('4e', 'anglais', ANG, `${MEPS} · ${DPIP}`, 'Août 2024', 555, 920, [
    ['Les activités commerciales', ['Le commerçant', 'Au supermarché', 'À la foire commerciale']],
    ['Les occupations et les professions', ['Le cultivateur', 'L’enseignant', 'Le menuisier']],
    ['Les excursions et les voyages', ['Le tourisme', 'À la gare routière']],
    ['Les saisons', ['Les saisons en Afrique', 'Les saisons en Europe']],
    ['La technologie de l’information et de la communication', ['Les moyens d’information', 'Le téléphone', 'La radio']],
    ['L’environnement', ['Mon environnement', 'Les feux de brousse', 'La pollution de l’air']],
    ['Le VIH-SIDA', ['Les sources de contamination du VIH-SIDA', 'La stigmatisation']]
  ]),

  /* ------------------------------------------------------------------ 3e */
  doc(
    '3e',
    'maths',
    MATHS,
    `${MEPSTA} · ${DESG}`,
    '2021-2022',
    558,
    437,
    [
      ['Programme de calcul – calcul littéral', ['Monômes, polynômes, fractions rationnelles', 'Équations – Inéquations dans IR', 'Équations – Inéquations dans IR x IR']],
      ['Configurations du plan', ['Propriété de Thalès', 'Trigonométrie dans le triangle rectangle', 'Angles inscrits dans un cercle']],
      ['Calcul numérique', ['Nombres réels : racines carrées', 'Nombres réels : intervalle, calculs approchés']],
      ['Outil vectoriel, géométrie analytique', ['Vecteurs', 'Coordonnées et calculs dans un repère', 'Équations de droites']],
      ['Configurations de l’espace', ['Pyramide, cône de révolution']],
      ['Organisation des données', ['Applications linéaires, applications affines', 'Statistiques']],
      ['Applications du plan', ['Symétries orthogonales, symétries centrales, translations', 'Homothéties']]
    ],
    { volume: '102 heures' }
  ),
  doc('3e', 'pct', PCT, `${MEPSTA} · ${DESG}`, '2021-2022', 557, 945, [
    ['Physique · Mécanique', ['Les forces', 'Équilibre d’un corps soumis à des forces concourantes', 'Énergie mécanique']],
    ['Physique · Électricité', ['Conducteurs ohmiques', 'Puissance et énergie électrique']],
    ['Physique · Optique', ['Les lentilles', 'Analyse de la lumière blanche']],
    ['Physique · Formes d’énergie et leurs transformations', ['Les formes d’énergie et leurs transformations']],
    ['Chimie', ['Corps moléculaires', 'Les alcanes', 'Réaction entre des corps solides', 'Solutions aqueuses', 'Solutions acides et basiques']],
    [
      'Technologie',
      [
        'Un détecteur utilisant un transistor',
        'Réaliser le dessin technique d’un objet et le faire reproduire',
        'Le transformateur',
        'La sécurité électrique des êtres humains et des matériels',
        'De la lampe à incandescence à la LED',
        'Les formes d’énergie et leurs transformations dans des objets techniques',
        'L’ordinateur au service de la science'
      ]
    ]
  ]),
  doc('3e', 'svt', SVT, `${MEPS} · ${DPIP}`, 'Août 2024', 556, 941, [
    ['Géodynamique et géologie du Togo', ['Les formations géologiques du Togo', 'Les intérêts économiques des formations géologiques du Togo']],
    [
      'Les êtres vivants et leur environnement',
      ['La pollution de l’environnement : synthèse sur l’eau', 'La commande nerveuse du mouvement', 'L’œil et la vision', 'La peau']
    ],
    ['L’Homme et sa santé', ['Les micro-organismes pathogènes et non pathogènes (utiles)', 'Le paludisme', 'L’immunité']],
    ['Nutrition et alimentation des êtres vivants', ['La digestion', 'La circulation sanguine', 'La respiration', 'L’excrétion']],
    [
      'Reproduction des êtres vivants et hérédité',
      [
        'La transmission de la vie chez l’Homme : les organes génitaux',
        'La transmission de la vie chez l’Homme : les cycles sexuels, fécondation et grossesse',
        'La transmission de la vie chez l’Homme : l’accouchement et l’allaitement',
        'La transmission de la vie chez l’Homme : la maîtrise de la reproduction',
        'Les ressemblances et les différences entre les êtres vivants',
        'Le support des caractères héréditaires : l’acide désoxyribonucléique (ADN)',
        'Les maladies héréditaires'
      ]
    ]
  ]),
  doc(
    '3e',
    'geographie',
    GEO,
    `${MEPS} · ${DPIP}`,
    'Août 2024',
    559,
    935,
    [
      [
        'Togo : milieu physique et problèmes environnementaux majeurs',
        ['Togo : présentation et cartographie', 'Togo : relief et hydrographie', 'Togo : climat et ses anomalies', 'Togo : sol et végétation']
      ],
      [
        'Dynamique de la population togolaise et ses enjeux',
        ['Togo : mouvements et répartition de la population', 'Togo : composition et structure de la population']
      ],
      [
        'Une économie togolaise en pleine expansion',
        [
          'Togo : une agriculture en pleine mutation',
          'Togo : industrialisation',
          'Togo : échanges commerciaux et problèmes',
          'Économie bleue au Togo',
          'Togo : transports et télécommunications',
          'Togo : tourisme'
        ]
      ]
    ],
    { volume: '37 heures' }
  ),
  doc(
    '3e',
    'histoire',
    HIST,
    `${MEPS} · ${DPIP}`,
    '2021-2022',
    559,
    936,
    [
      [
        'L’impérialisme et ses conséquences en Afrique (fin XIXe siècle – 1960)',
        [
          'L’impérialisme dans le monde et en Afrique : définition, causes et moyens d’action',
          'Les résistances des peuples à l’impérialisme au Togo',
          'Les résistances des souverains à l’impérialisme au Togo : cas d’Aja Kpoyizoun et de Na Biéma Asabiè',
          'L’impérialisme en Afrique et la mise sous tutelle : exploitation économique des colonies',
          'Le Togo sous domination coloniale allemande',
          'Le Togo sous domination coloniale française',
          'Les causes des luttes de libération du joug colonial',
          'Les luttes de libération du joug colonial au Togo'
        ]
      ],
      [
        'Les deux guerres mondiales et leurs conséquences',
        ['La Première Guerre mondiale au Togo et ses conséquences', 'La Deuxième Guerre mondiale : l’ONU et la culture de la paix']
      ],
      ['L’Afrique postcoloniale', ['Le Togo, une nation en devenir']]
    ],
    { volume: '35 heures' }
  ),
  doc(
    '3e',
    'ecm',
    ECM,
    `${MEPS} · ${DPIP}`,
    'Août 2024',
    560,
    927,
    [
      ['Démocratie à l’école', ['Pratiques démocratiques à l’école', 'Police des examens']],
      ['État et nation', ['Constitution togolaise', 'Hiérarchie des normes (textes juridiques)']],
      ['Décentralisation au Togo', ['Juxtaposition des territorialités et répartition des compétences']],
      ['Droit de suffrage', ['Élections au Togo']],
      ['Médias et lutte contre l’extrémisme violent', ['Médias', 'Jeune et TIC']],
      ['Lutte contre la pauvreté', ['Formation professionnelle', 'Genre et développement']],
      ['Risques de catastrophes naturelles', ['Catastrophes naturelles', 'Prévention et gestion des catastrophes naturelles']]
    ],
    { volume: '50 heures' }
  ),
  doc(
    '3e',
    'francais',
    FR,
    `${MEPS} · ${DPIP}`,
    'Août 2024',
    561,
    925,
    [
      ['Le jeune et son avenir', [], '24 heures'],
      ['Médecines traditionnelles et modernes', [], '24 heures'],
      ['Les migrations', [], '18 heures'],
      ['Cultures et loisirs', [], '12 heures'],
      ['Les conflits et paix', [], '12 heures'],
      ['La sagesse africaine et la civilisation orale', [], '12 heures'],
      ['Lecture et expression de soi', [], '12 heures']
    ],
    {
      works: [
        'Littérature togolaise : Moïse Olouwadara Inandjo, Sur les routes sanglantes de l’exil ; Kangni Alem, Atterrissage',
        'Littérature africaine : Guy Menga, La Marmite de Koka-Mbala ; Emmanuel Dongala, Johnny chien méchant',
        'Littérature française : Pierre Corneille, Cinna'
      ],
      note: FR_NOTE
    }
  ),
  doc('3e', 'anglais', ANG, `${MEPS} · ${DPIP}`, 'Août 2024', 562, 923, [
    ['Le mariage et la vie en famille', ['La dot', 'Les mariages arrangés', 'La vie en famille']],
    ['Les jeunes : problèmes et projets d’avenir', ['Les jeunes', 'L’emploi des jeunes', 'L’immigration des jeunes']],
    ['Les technologies de l’information et de la communication', ['L’ordinateur', 'L’internet']],
    ['Les sports et les jeux', ['Au stade', 'Les compétitions scolaires']],
    ['Les traditions, les croyances et les religions', ['Les traditions et les célébrations', 'Les différentes pratiques religieuses']],
    ['Équité-genre', ['L’éducation à l’équité-genre', 'Le leadership féminin']],
    ['Le système démocratique', ['La démocratie : ses forces et ses faiblesses', 'Les élections']]
  ])
];

/** Ce qui manque ou ce qui est incohérent en ligne, à la date de la lecture (23 novembre 2026). */
export const PROGRAMME_GAPS = {
  anglais5e:
    'Sur le portail, la page « Programme d’anglais de 5e » contient le fichier du programme d’ECM de 5e : le programme d’anglais de 5e n’y est pas.',
  ecm4e:
    'Le document « ECM, classe de 4e » du portail reprend, sous sa page de garde, la progression et les thèmes de la classe de 6e : il n’est pas repris ici.',
  primaire: 'Le portail École Togo n’a pas de rubrique « Programmes » pour le primaire, et ses pages de cours sont vides pour un visiteur.',
  lycee:
    'Le portail École Togo n’a pas de rubrique « Programmes » pour le lycée ; ses pages de cours donnent le plan des chapitres. EduSocialNews publie des livrets de programmes de lycée, à vérifier un par un.'
};

/* ============================================================================ cours → leçon du programme */

/** Référence d'un cours à une leçon d'un programme officiel. */
export interface ProgrammeRef {
  docId: string;
  theme: string;
  lesson: string;
}

export function resolveProgramme(ref: ProgrammeRef | undefined): { doc: ProgrammeDoc; theme: string; lesson: string } | null {
  if (!ref) return null;
  const found = PROGRAMMES_TOGO.find((d) => d.id === ref.docId);
  const theme = found?.themes.find((t) => t.theme === ref.theme);
  if (!found || !theme || !theme.lessons.includes(ref.lesson)) return null;
  return { doc: found, theme: theme.theme, lesson: ref.lesson };
}
