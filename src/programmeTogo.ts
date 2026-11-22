/**
 * Programmes officiels du Togo : où les trouver, et leur progression (thèmes et titres de leçons).
 *
 * Source : le portail École Togo du ministère (https://ecole.gouv.tg/college), rubrique « Programmes »
 * de chaque classe du collège : une page par matière, avec le programme en PDF, ouverte sans compte.
 * Les documents de 3e ont été lus le 22 novembre 2026 ; seuls leurs thèmes et titres de leçons sont
 * repris ici (le plan du programme), pas leur texte. Les cours de SAVOIR+ s'y rattachent par
 * `CatalogItem.programme` : la fiche d'un cours dit ainsi à quelle leçon officielle il correspond.
 *
 * Primaire et lycée : le portail ne publie pas (encore) leurs programmes ; voir `PROGRAMME_GAPS`.
 */

export interface ProgrammeTheme {
  theme: string;
  lessons: string[];
}

export interface ProgrammeDoc {
  id: string;
  classLabel: string;
  subject: string;
  /** Titre du document, tel qu'il figure sur sa page de garde. */
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
  /** Ce que la progression ne détaille pas en leçons. */
  note?: string;
}

const PORTAL = 'https://ecole.gouv.tg/college';
const page = (id: number) => `${PORTAL}/course/view.php?id=${id}`;
const pdf = (id: number) => `${PORTAL}/mod/resource/view.php?id=${id}`;

const DESG = 'Ministère des Enseignements Primaire, Secondaire, Technique et de l’Artisanat · Direction de l’Enseignement Secondaire Général';
const DPIP = 'Ministère des Enseignements Primaire et Secondaire · Direction des Programmes et Innovations Pédagogiques';

/** Les programmes de 3e, lus en entier (progression annuelle). */
export const PROGRAMMES_TOGO: ProgrammeDoc[] = [
  {
    id: '3e-maths',
    classLabel: '3e',
    subject: 'Mathématiques',
    title: 'Mathématiques · Programme de la classe de 3e',
    issuer: DESG,
    edition: '2021-2022',
    pageUrl: page(558),
    pdfUrl: pdf(437),
    themes: [
      {
        theme: 'Programme de calcul – calcul littéral',
        lessons: ['Monômes, polynômes, fractions rationnelles', 'Équations – Inéquations dans IR', 'Équations – Inéquations dans IR x IR']
      },
      { theme: 'Configurations du plan', lessons: ['Propriété de Thalès', 'Trigonométrie dans le triangle rectangle', 'Angles inscrits dans un cercle'] },
      { theme: 'Calcul numérique', lessons: ['Nombres réels : racines carrées', 'Nombres réels : intervalle, calculs approchés'] },
      { theme: 'Outil vectoriel, géométrie analytique', lessons: ['Vecteurs', 'Coordonnées et calculs dans un repère', 'Équations de droites'] },
      { theme: 'Configurations de l’espace', lessons: ['Pyramide, cône de révolution'] },
      { theme: 'Organisation des données', lessons: ['Applications linéaires, applications affines', 'Statistiques'] },
      { theme: 'Applications du plan', lessons: ['Symétries orthogonales, symétries centrales, translations', 'Homothéties'] }
    ]
  },
  {
    id: '3e-pct',
    classLabel: '3e',
    subject: 'Physique-Chimie et Technologie',
    title: 'Sciences physiques et technologie · Programme de la classe de 3e',
    issuer: DESG,
    edition: '2021-2022',
    pageUrl: page(557),
    pdfUrl: pdf(945),
    themes: [
      { theme: 'Physique · Mécanique', lessons: ['Les forces', 'Équilibre d’un corps soumis à des forces concourantes', 'Énergie mécanique'] },
      { theme: 'Physique · Électricité', lessons: ['Conducteurs ohmiques', 'Puissance et énergie électrique'] },
      { theme: 'Physique · Optique', lessons: ['Les lentilles', 'Analyse de la lumière blanche'] },
      { theme: 'Physique · Formes d’énergie et leurs transformations', lessons: ['Les formes d’énergie et leurs transformations'] },
      {
        theme: 'Chimie',
        lessons: ['Corps moléculaires', 'Les alcanes', 'Réaction entre des corps solides', 'Solutions aqueuses', 'Solutions acides et basiques']
      },
      {
        theme: 'Technologie',
        lessons: [
          'Un détecteur utilisant un transistor',
          'Réaliser le dessin technique d’un objet et le faire reproduire',
          'Le transformateur',
          'La sécurité électrique des êtres humains et des matériels',
          'De la lampe à incandescence à la LED',
          'Les formes d’énergie et leurs transformations dans des objets techniques',
          'L’ordinateur au service de la science'
        ]
      }
    ]
  },
  {
    id: '3e-svt',
    classLabel: '3e',
    subject: 'Sciences de la Vie et de la Terre',
    title: 'Sciences de la vie et de la Terre (SVT) · Programme de la classe de 3e',
    issuer: DPIP,
    edition: 'Août 2024',
    pageUrl: page(556),
    pdfUrl: pdf(941),
    themes: [
      {
        theme: 'Géodynamique et géologie du Togo',
        lessons: ['Les formations géologiques du Togo', 'Les intérêts économiques des formations géologiques du Togo']
      },
      {
        theme: 'Les êtres vivants et leur environnement',
        lessons: ['La pollution de l’environnement : synthèse sur l’eau', 'La commande nerveuse du mouvement', 'L’œil et la vision', 'La peau']
      },
      { theme: 'L’Homme et sa santé', lessons: ['Les micro-organismes pathogènes et non pathogènes (utiles)', 'Le paludisme', 'L’immunité'] },
      { theme: 'Nutrition et alimentation des êtres vivants', lessons: ['La digestion', 'La circulation sanguine', 'La respiration', 'L’excrétion'] },
      {
        theme: 'Reproduction des êtres vivants et hérédité',
        lessons: [
          'La transmission de la vie chez l’Homme : les organes génitaux',
          'La transmission de la vie chez l’Homme : les cycles sexuels, fécondation et grossesse',
          'La transmission de la vie chez l’Homme : l’accouchement et l’allaitement',
          'La transmission de la vie chez l’Homme : la maîtrise de la reproduction',
          'Les ressemblances et les différences entre les êtres vivants',
          'Le support des caractères héréditaires : l’acide désoxyribonucléique (ADN)',
          'Les maladies héréditaires'
        ]
      }
    ]
  },
  {
    id: '3e-geographie',
    classLabel: '3e',
    subject: 'Géographie',
    title: 'Géographie · Programme de la classe de 3e',
    issuer: DPIP,
    edition: 'Août 2024',
    pageUrl: page(559),
    pdfUrl: pdf(935),
    themes: [
      {
        theme: 'Togo : milieu physique et problèmes environnementaux majeurs',
        lessons: ['Togo : présentation et cartographie', 'Togo : relief et hydrographie', 'Togo : climat et ses anomalies', 'Togo : sol et végétation']
      },
      {
        theme: 'Dynamique de la population togolaise et ses enjeux',
        lessons: ['Togo : mouvements et répartition de la population', 'Togo : composition et structure de la population']
      },
      {
        theme: 'Une économie togolaise en pleine expansion',
        lessons: [
          'Togo : une agriculture en pleine mutation',
          'Togo : industrialisation',
          'Togo : échanges commerciaux et problèmes',
          'Économie bleue au Togo',
          'Togo : transports et télécommunications',
          'Togo : tourisme'
        ]
      }
    ]
  },
  {
    id: '3e-histoire',
    classLabel: '3e',
    subject: 'Histoire',
    title: 'Histoire · Programme de la classe de 3e',
    issuer: DPIP,
    edition: '2021-2022',
    pageUrl: page(559),
    pdfUrl: pdf(936),
    themes: [
      {
        theme: 'L’impérialisme et ses conséquences en Afrique (fin XIXe siècle – 1960)',
        lessons: [
          'L’impérialisme dans le monde et en Afrique : définition, causes et moyens d’action',
          'Les résistances des peuples à l’impérialisme au Togo',
          'Les résistances des souverains à l’impérialisme au Togo : cas d’Aja Kpoyizoun et de Na Biéma Asabiè',
          'L’impérialisme en Afrique et la mise sous tutelle : exploitation économique des colonies',
          'Le Togo sous domination coloniale allemande',
          'Le Togo sous domination coloniale française',
          'Les causes des luttes de libération du joug colonial',
          'Les luttes de libération du joug colonial au Togo'
        ]
      },
      {
        theme: 'Les deux guerres mondiales et leurs conséquences',
        lessons: ['La Première Guerre mondiale au Togo et ses conséquences', 'La Deuxième Guerre mondiale : l’ONU et la culture de la paix']
      },
      { theme: 'L’Afrique postcoloniale', lessons: ['Le Togo, une nation en devenir'] }
    ]
  },
  {
    id: '3e-ecm',
    classLabel: '3e',
    subject: 'Éducation civique et morale',
    title: 'Éducation civique et morale · Programme de la classe de 3e',
    issuer: DPIP,
    edition: 'Août 2024',
    pageUrl: page(560),
    pdfUrl: pdf(927),
    themes: [
      { theme: 'Démocratie à l’école', lessons: ['Pratiques démocratiques à l’école', 'Police des examens'] },
      { theme: 'État et nation', lessons: ['Constitution togolaise', 'Hiérarchie des normes (textes juridiques)'] },
      { theme: 'Décentralisation au Togo', lessons: ['Juxtaposition des territorialités et répartition des compétences'] },
      { theme: 'Droit de suffrage', lessons: ['Élections au Togo'] },
      { theme: 'Médias et lutte contre l’extrémisme violent', lessons: ['Médias', 'Jeune et TIC'] },
      { theme: 'Lutte contre la pauvreté', lessons: ['Formation professionnelle', 'Genre et développement'] },
      { theme: 'Risques de catastrophes naturelles', lessons: ['Catastrophes naturelles', 'Prévention et gestion des catastrophes naturelles'] }
    ]
  },
  {
    id: '3e-francais',
    classLabel: '3e',
    subject: 'Français',
    title: 'Français · Programme de la classe de 3e',
    issuer: DPIP,
    edition: 'Août 2024',
    pageUrl: page(561),
    pdfUrl: pdf(925),
    themes: [
      { theme: 'Le jeune et son avenir', lessons: [] },
      { theme: 'Médecines traditionnelles et modernes', lessons: [] },
      { theme: 'Les migrations', lessons: [] },
      { theme: 'Cultures et loisirs', lessons: [] },
      { theme: 'Les conflits et paix', lessons: [] },
      { theme: 'La sagesse africaine et la civilisation orale', lessons: [] },
      { theme: 'Lecture et expression de soi', lessons: [] }
    ],
    note: 'Le programme de français avance par semaines (lecture, oral, vocabulaire, orthographe, grammaire, expression écrite) à l’intérieur de chaque thème, sans titres de leçons.'
  },
  {
    id: '3e-anglais',
    classLabel: '3e',
    subject: 'Anglais',
    title: 'Anglais · Programme de la classe de 3e',
    issuer: DPIP,
    edition: 'Août 2024',
    pageUrl: page(562),
    pdfUrl: pdf(923),
    themes: [
      { theme: 'Le mariage et la vie en famille', lessons: ['La dot', 'Les mariages arrangés', 'La vie en famille'] },
      { theme: 'Les jeunes : problèmes et projets d’avenir', lessons: ['Les jeunes', 'L’emploi des jeunes', 'L’immigration des jeunes'] },
      { theme: 'Les technologies de l’information et de la communication', lessons: ['L’ordinateur', 'L’internet'] },
      { theme: 'Les sports et les jeux', lessons: ['Au stade', 'Les compétitions scolaires'] },
      { theme: 'Les traditions, les croyances et les religions', lessons: ['Les traditions et les célébrations', 'Les différentes pratiques religieuses'] },
      { theme: 'Équité-genre', lessons: ['L’éducation à l’équité-genre', 'Le leadership féminin'] },
      { theme: 'Le système démocratique', lessons: ['La démocratie : ses forces et ses faiblesses', 'Les élections'] }
    ]
  }
];

/** Pages « Programme » du portail pour les autres classes du collège (documents pas encore lus). */
export const PROGRAMME_PAGES: Record<'6e' | '5e' | '4e', Record<string, string>> = {
  '6e': { Mathématiques: page(534), PCT: page(541), SVT: page(536), Français: page(537), 'Histoire-Géographie': page(538), ECM: page(540), Anglais: page(539) },
  '5e': { Mathématiques: page(546), PCT: page(547), SVT: page(548), Français: page(563), 'Histoire-Géographie': page(545), ECM: page(544), Anglais: page(543) },
  '4e': { Mathématiques: page(551), PCT: page(550), SVT: page(549), Français: page(554), 'Histoire-Géographie': page(552), ECM: page(553), Anglais: page(555) }
};

/** Ce qui manque en ligne, à la date de la recherche (22 novembre 2026). */
export const PROGRAMME_GAPS = {
  primaire: 'Le portail École Togo n’a pas de rubrique « Programmes » pour le primaire, et ses pages de cours sont vides pour un visiteur.',
  lycee:
    'Le portail École Togo n’a pas de rubrique « Programmes » pour le lycée ; ses pages de cours donnent le plan des chapitres (Terminale D, Mathématiques : calculs algébriques, analyse, trigonométrie, géométrie du plan, géométrie de l’espace, applications du plan, organisation des données). EduSocialNews publie des livrets de programmes de lycée, à vérifier un par un.'
};

/** Référence d'un cours à une leçon d'un programme officiel. */
export interface ProgrammeRef {
  docId: string;
  theme: string;
  lesson: string;
}

export function resolveProgramme(ref: ProgrammeRef | undefined): { doc: ProgrammeDoc; theme: string; lesson: string } | null {
  if (!ref) return null;
  const doc = PROGRAMMES_TOGO.find((d) => d.id === ref.docId);
  const theme = doc?.themes.find((t) => t.theme === ref.theme);
  if (!doc || !theme || !theme.lessons.includes(ref.lesson)) return null;
  return { doc, theme: theme.theme, lesson: ref.lesson };
}
