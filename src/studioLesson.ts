/**
 * Une section du Studio au format complet de nos cours.
 *
 * Les cours de la Bibliothèque suivent un même déroulé (voir `LessonRich`) : une entrée en matière, le
 * cours en parties titrées, un exemple illustré par une figure légendée, la question que se pose l'élève,
 * puis le résumé et le réflexe à garder. Ce fichier donne ce déroulé aux créateurs : les champs d'une
 * section, leur conversion en leçon, les contrôles (forme, niveau de langue, découpage selon la classe)
 * et l'écriture des figures en texte simple, pour qu'un tableau ou un schéma se saisisse sans outil de dessin.
 */
import type { LessonArt, LessonFigure, LessonGeometryFigure, LessonRich } from './content';
import { lessonIssues } from './lessonFormat';
import { readingBandOf, type ReadingBand } from './levels';
import { languageIssues, textStats } from './readability';

/** Les champs du format complet, en plus du titre, de l'accroche (`body`), du résumé et du réflexe d'une section. */
export interface StudioRichFields {
  /** « rich » : la section suit le format complet ; absent ou « simple » : un titre et un texte. */
  format?: 'simple' | 'rich';
  /** L'entrée en matière : une situation concrète, en un court paragraphe. */
  scene?: string;
  /** Le cours : de deux à quatre parties titrées ; `items` ajoute une liste sous le texte. */
  parts?: { title: string; text: string; items?: string[] }[];
  /** L'exemple illustré. */
  example?: { title: string; caption: string; notes: string[]; figure: LessonFigure };
  /** La question que se pose l'élève, et sa réponse. */
  question?: { ask: string; answer: string };
}

export type StudioSection = { id: string; title: string; body: string; keyPoints?: string[]; tip?: string } & StudioRichFields;

const ARTS: LessonArt[] = ['search', 'list', 'chart', 'key', 'route', 'shield', 'people', 'done'];

/** L'apostrophe du clavier devient l'apostrophe courbe des cours : le créateur n'a pas à y penser. */
export const typo = (text: string) => text.replace(/'/g, '’');

const paragraphs = (text: string) =>
  typo(text)
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

const typoFigure = (figure: LessonFigure): LessonFigure =>
  figure.kind === 'image'
    ? { ...figure, alt: typo(figure.alt), credit: figure.credit ? typo(figure.credit) : undefined }
    : (JSON.parse(JSON.stringify(figure).replace(/'/g, '’')) as LessonFigure);

export const EMPTY_FIGURE: LessonFigure = { kind: 'table', head: ['', ''], rows: [] };

/** Une section vide au format complet : deux parties à écrire, un tableau à remplir. */
export function newRichSection(id: string, title = 'Nouvelle section'): StudioSection {
  return {
    id,
    title,
    body: '',
    format: 'rich',
    scene: '',
    parts: [
      { title: '', text: '' },
      { title: '', text: '' }
    ],
    example: { title: '', caption: '', notes: [], figure: EMPTY_FIGURE },
    question: { ask: '', answer: '' }
  };
}

/**
 * Passe une section simple au format complet sans rien perdre : sa première phrase devient l'accroche,
 * le reste du texte la première partie du cours.
 */
export function toRichSection(section: StudioSection): StudioSection {
  if (section.parts) return { ...section, format: 'rich' };
  const text = section.body.trim();
  const cut = text.search(/[.!?…](\s|$)/);
  const lead = cut >= 0 ? text.slice(0, cut + 1) : text;
  const rest = cut >= 0 ? text.slice(cut + 1).trim() : '';
  const blank = newRichSection(section.id, section.title);
  return {
    ...blank,
    ...section,
    format: 'rich',
    body: lead,
    parts: [
      { title: '', text: rest },
      { title: '', text: '' }
    ]
  };
}

/** La leçon complète d'une section, telle que la saisie la donne (même incomplète : les contrôles diront quoi finir). */
export function richOfSection(section: StudioSection, index: number): LessonRich | null {
  if (section.format !== 'rich') return null;
  return {
    art: ARTS[index % ARTS.length],
    scene: typo((section.scene || '').trim()),
    sections: (section.parts || []).map((part) => {
      const items = (part.items || []).map((item) => typo(item.trim())).filter(Boolean);
      return { title: typo(part.title.trim()), text: paragraphs(part.text), items: items.length ? items : undefined };
    }),
    example: {
      title: typo(section.example?.title.trim() || ''),
      caption: typo(section.example?.caption.trim() || ''),
      notes: (section.example?.notes || []).map((n) => typo(n.trim())).filter(Boolean),
      figure: typoFigure(section.example?.figure || EMPTY_FIGURE)
    },
    question: { ask: typo((section.question?.ask || '').trim()), answer: paragraphs(section.question?.answer || '') }
  };
}

/** Vrai si une figure peut être dessinée telle quelle (elle n'a plus de défaut de forme). */
export function isFigureReady(figure: LessonFigure): boolean {
  const filled = { title: 'x', text: ['x'] };
  return lessonIssues({ art: 'done', scene: 'x', sections: [filled, filled], example: { title: 'x', caption: 'x', notes: ['x', 'x'], figure: typoFigure(figure) }, question: { ask: 'x ?', answer: ['x'] } }).length === 0;
}

/** Une section est complète quand elle a un titre, un texte et, au format complet, plus aucun défaut de forme. */
export function isSectionComplete(section: StudioSection, index: number): boolean {
  if (!section.title.trim() || !section.body.trim()) return false;
  const rich = richOfSection(section, index);
  return rich ? lessonIssues(rich).length === 0 : true;
}

/** Au format complet et sans défaut, avec son résumé et son réflexe : la section a la tenue d'un cours de la Bibliothèque. */
export function isRichReady(section: StudioSection, index: number): boolean {
  return section.format === 'rich' && isSectionComplete(section, index) && (section.keyPoints || []).length >= 2 && Boolean((section.tip || '').trim());
}

/* ------------------------------------------------------------------ Objectifs du module */

/**
 * Les objectifs complètent « À la fin de ce module, vous saurez : ». Le créateur écrit un objectif par
 * ligne ; la ponctuation de la liste (minuscule, « ; », point final) se pose toute seule.
 */
export function formatGoals(lines: string[] | undefined): string[] {
  const goals = (lines || []).map((line) => typo(line.trim()).replace(/\s*[.;,:]+$/, '')).filter(Boolean);
  return goals.map((goal, i) => goal.charAt(0).toLowerCase() + goal.slice(1) + (i === goals.length - 1 ? '.' : ' ;'));
}

/* ------------------------------------------------------------------ Découpage selon la classe */

/**
 * Repères de découpage par tranche de lecture (relevés le 23 novembre 2026). Découper un cours en segments
 * courts améliore l'apprentissage (principe de segmentation, Mayer : effet médian d = 0,67) ; la mémoire de
 * travail tient 3 à 4 éléments chez l'adulte, 2 à 2,5 au début du primaire (Cowan) ; du CP au CM1, on reste
 * plus souvent à la tâche sur une activité de 10 minutes que de 30 (Godwin et al.). Le nombre de sections
 * et de mots par section en sont déduits : ce sont des conseils.
 *
 * `wordsPerMinute` part de la fluence attendue en fin d'année (repères Éduscol : 50 mots lus par minute au
 * CP, 70 au CE1, 90 au CE2, 110 au CM1, 120 au CM2, 130 en 6e) ; au-delà, c'est une estimation de lecture d'étude.
 */
export const SECTION_TARGETS: Record<ReadingBand, { sections: [number, number]; maxWords: number; wordsPerMinute: number }> = {
  early: { sections: [3, 4], maxWords: 200, wordsPerMinute: 70 },
  junior: { sections: [3, 5], maxWords: 500, wordsPerMinute: 115 },
  teen: { sections: [3, 6], maxWords: 900, wordsPerMinute: 150 },
  standard: { sections: [3, 8], maxWords: 1200, wordsPerMinute: 180 }
};

const wordCount = (text: string) => (text.match(/[\p{L}\p{N}]+/gu) || []).length;

/** Tout le texte lu par l'élève dans une section. */
export function sectionText(section: StudioSection): string {
  if (section.format !== 'rich') return section.body;
  return [
    section.body,
    section.scene || '',
    ...(section.parts || []).flatMap((part) => [part.text, ...(part.items || []).map((item) => `${item}.`)]),
    ...(section.example?.notes || []).map((note) => `${note}.`),
    section.question?.answer || ''
  ]
    .filter((text) => text.trim())
    .join('\n');
}

/** Minutes de lecture d'une section pour une classe (une au moins). */
export function readingMinutes(section: StudioSection, classLabel: string | undefined): number {
  const { wordsPerMinute } = SECTION_TARGETS[readingBandOf(classLabel)];
  // Une figure se regarde : une demi-minute de plus.
  const figure = section.format === 'rich' ? 0.5 : 0;
  return Math.max(1, Math.round(wordCount(sectionText(section)) / wordsPerMinute + figure));
}

/** Durée d'un module : la lecture de ses sections, plus une minute par question du quiz. */
export function moduleMinutes(sections: StudioSection[], questionCount: number, classLabel: string | undefined): number {
  return sections.reduce((sum, section) => sum + readingMinutes(section, classLabel), 0) + questionCount;
}

/** Les blocs d'une section au format complet, dans l'ordre où l'élève les lit. */
export type LessonBlock = 'head' | 'scene' | 'course' | 'example' | 'question' | 'summary';

/** Un point à finir dans un bloc ; `required` : sans lui, la section ne peut pas s'afficher au format complet. */
export interface SectionTodo {
  block: LessonBlock;
  text: string;
  required: boolean;
}

export interface SectionReview {
  /** Ce qui reste à écrire, bloc par bloc. */
  todo: SectionTodo[];
  /** Conseils de langue pour la classe visée. */
  language: string[];
  /** La section dépasse la longueur conseillée pour la classe. */
  long: string | null;
  /** Mesures du texte. */
  words: number;
  avgWords: number;
  minutes: number;
}

const FORMAT_HINT: [RegExp, LessonBlock, string][] = [
  [/^entrée en matière vide$/, 'scene', 'Racontez une situation concrète en deux ou trois phrases.'],
  [/^cours : de 2 à 4 parties$/, 'course', 'De 2 à 4 parties.'],
  [/^partie (\d) : titre ou texte vide$/, 'course', 'Partie $1 : donnez-lui un titre et un texte.'],
  [/^partie (\d) : une liste a au moins deux éléments$/, 'course', 'Partie $1 : une liste a au moins deux lignes.'],
  [/^exemple : titre ou légende vide$/, 'example', 'Donnez un titre et une légende à l’exemple.'],
  [/^exemple : de 2 à 4 remarques$/, 'example', 'De 2 à 4 remarques sous « Ce qu’il faut y voir ».'],
  [/^exemple : tableau incomplet$/, 'example', 'Le tableau a besoin d’un en-tête et d’au moins une ligne.'],
  [/^exemple : image manquante$/, 'example', 'Choisissez une image.'],
  [/^exemple : l’image a besoin d’un texte de remplacement$/, 'example', 'Décrivez l’image en une phrase, pour qui ne la voit pas.'],
  [/^exemple : (.+)$/, 'example', '$1.'],
  [/^question de l’élève : elle se termine par « \? »$/, 'question', 'Écrivez une question, terminée par « ? ».'],
  [/^question de l’élève : réponse vide$/, 'question', 'Donnez la réponse.']
];

const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function todoOf(issue: string): SectionTodo {
  for (const [pattern, block, text] of FORMAT_HINT) if (pattern.test(issue)) return { block, text: capital(issue.replace(pattern, text)), required: true };
  return { block: 'course', text: capital(issue) + '.', required: true };
}

/** Contrôles d'une section pour une classe : forme, langue, découpage. */
export function reviewSection(section: StudioSection, index: number, classLabel: string | undefined): SectionReview {
  const target = SECTION_TARGETS[readingBandOf(classLabel)];
  const rich = richOfSection(section, index);
  const text = sectionText(section);
  const stats = textStats(text);
  const words = wordCount(text);
  const todo: SectionTodo[] = [];
  if (!section.title.trim()) todo.push({ block: 'head', text: 'Donnez un titre à la section.', required: true });
  if (!section.body.trim()) todo.push({ block: 'head', text: rich ? 'Dites en une phrase ce que l’élève va apprendre.' : 'Écrivez le texte de la section.', required: true });
  if (rich) {
    todo.push(...lessonIssues(rich).map(todoOf));
    if ((section.keyPoints || []).length < 2) todo.push({ block: 'summary', text: 'Au moins deux points à retenir.', required: false });
    if (!(section.tip || '').trim()) todo.push({ block: 'summary', text: 'Une phrase pour le réflexe à garder.', required: false });
  }
  return {
    todo,
    language: languageIssues(text, classLabel),
    long: words > target.maxWords ? `Section longue (${words} mots) : au-delà de ${target.maxWords} mots pour ce niveau, coupez-la en deux.` : null,
    words,
    avgWords: stats.avgWords,
    minutes: readingMinutes(section, classLabel)
  };
}

/** Repasse une section au format simple : ses textes sont gardés en un seul bloc, l'exemple illustré est retiré. */
export function toSimpleSection(section: StudioSection): StudioSection {
  const { scene, parts, example, question, ...rest } = section;
  void scene;
  void example;
  const body = [section.body, section.scene || '', ...(parts || []).flatMap((part) => [part.text, ...(part.items || [])]), question?.answer || '']
    .map((text) => text.trim())
    .filter(Boolean)
    .join(' ');
  return { ...rest, format: 'simple', body };
}

/** Vrai si repasser au format simple ferait perdre un exemple illustré ou une question déjà écrits. */
export function hasRichWork(section: StudioSection): boolean {
  const example = section.example;
  return Boolean(example && (example.title.trim() || example.caption.trim() || example.notes.length || figureToText(example.figure).trim() || example.figure.kind === 'geometry' || (example.figure.kind === 'image' && example.figure.src))) || Boolean(section.question?.ask.trim());
}

/** Conseil sur le nombre de sections d'un module, selon la classe. */
export function sectionCountAdvice(count: number, classLabel: string | undefined): string | null {
  const [min, max] = SECTION_TARGETS[readingBandOf(classLabel)].sections;
  if (count < min) return `${count} section${count > 1 ? 's' : ''} : un module en compte plutôt ${min} à ${max} pour ce niveau.`;
  if (count > max) return `${count} sections : ${max} au plus pour ce niveau ; au-delà, faites-en deux modules.`;
  return null;
}

/* ------------------------------------------------------------------ Figures saisies en texte */

export type FigureKind = LessonFigure['kind'];

export const FIGURE_KINDS: { kind: FigureKind; label: string; help: string; sample: string }[] = [
  { kind: 'table', label: 'Tableau', help: 'Une ligne par rangée, les colonnes séparées par « | ». La première ligne est l’en-tête.', sample: 'Masse | Poids\n100 g | 1 N\n500 g | 5 N' },
  { kind: 'timeline', label: 'Étapes dans le temps', help: 'Un moment par ligne, dans l’ordre.', sample: 'Lundi : Afi reçoit le message.\nMardi : elle vérifie l’adresse.' },
  { kind: 'flow', label: 'Schéma en chaîne', help: 'Un élément par ligne : « nom | précision | ce qui mène au suivant ». De 2 à 4 éléments.', sample: 'Le puits | eau brute | on filtre\nLe filtre | sable et charbon | on fait bouillir\nLa jarre | eau potable' },
  { kind: 'split', label: 'Répartition', help: 'Une part par ligne : « nom | pourcentage | précision ». De 2 à 4 parts, qui font 100.', sample: 'Loyer | 40 | la plus grosse dépense\nRepas | 35 | chaque jour\nÉpargne | 25 | mise de côté' },
  { kind: 'fraction', label: 'Fraction dessinée', help: 'Une fraction par ligne : « 3/8 | légende ». De une à trois fractions.', sample: '3/8 | La part mangée par Kossi' },
  { kind: 'geometry', label: 'Figure de géométrie', help: 'Choisissez une figure : elle se trace toute seule, avec ses points nommés.', sample: '' },
  { kind: 'image', label: 'Image', help: 'Une photo ou un dessin dont vous avez les droits, avec sa description et son crédit.', sample: '' }
];

const cells = (line: string) => line.split('|').map((c) => c.trim());
const lines = (text: string) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

/** Le texte de saisie d'une figure (l'inverse de `figureFromText`). */
export function figureToText(figure: LessonFigure): string {
  const row = (parts: string[]) => parts.join(' | ').replace(/(\s*\|\s*)+$/, '');
  switch (figure.kind) {
    case 'table':
      return [figure.head, ...figure.rows]
        .filter((line) => line.some((cell) => cell.trim()))
        .map((line) => line.join(' | '))
        .join('\n');
    case 'timeline':
      return figure.steps.join('\n');
    case 'flow':
      return figure.nodes.map((node, i) => row([node.label, node.sub || '', figure.links[i] || ''])).join('\n');
    case 'split':
      return figure.parts.map((part) => row([part.label, String(part.percent), part.note])).join('\n');
    case 'fraction':
      return figure.items.map((item) => `${item.taken}/${item.parts} | ${item.label}`).join('\n');
    default:
      return '';
  }
}

/** Construit une figure à partir de sa saisie en texte ; `previous` garde ce que le texte ne dit pas (forme, image). */
export function figureFromText(kind: FigureKind, text: string, previous?: LessonFigure): LessonFigure {
  const rows = lines(text);
  switch (kind) {
    case 'table': {
      const table = rows.map(cells);
      const width = Math.max(2, ...table.map((r) => r.length));
      const pad = (r: string[]) => [...r, ...Array(width - r.length).fill('')];
      return { kind: 'table', head: pad(table[0] || []), rows: table.slice(1).map(pad) };
    }
    case 'timeline':
      return { kind: 'timeline', steps: rows };
    case 'flow': {
      const parsed = rows.map(cells);
      return {
        kind: 'flow',
        nodes: parsed.map((c, i) => ({ art: ARTS[i % ARTS.length], label: c[0] || '', sub: c[1] || undefined })),
        links: parsed.slice(0, -1).map((c) => c[2] || '')
      };
    }
    case 'split':
      return {
        kind: 'split',
        parts: rows.map(cells).map((c) => ({ label: c[0] || '', percent: Number((c[1] || '0').replace(',', '.').replace('%', '')) || 0, note: c[2] || '' }))
      };
    case 'fraction':
      return {
        kind: 'fraction',
        shape: previous?.kind === 'fraction' ? previous.shape : 'disc',
        items: rows.map(cells).map((c) => {
          const [taken, parts] = (c[0] || '').split('/').map((n) => parseInt(n.trim(), 10));
          return { taken: Number.isFinite(taken) ? taken : 0, parts: Number.isFinite(parts) ? parts : 2, label: c[1] || '' };
        })
      };
    case 'geometry':
      return previous?.kind === 'geometry' ? previous : GEOMETRY_TEMPLATES[0].figure;
    case 'image':
      return previous?.kind === 'image' ? previous : { kind: 'image', src: '', alt: '' };
    default:
      return previous || EMPTY_FIGURE;
  }
}

/* ------------------------------------------------------------------ Figures de géométrie types */

type Point = LessonGeometryFigure['points'][number];
const P = (id: string, x: number, y: number, labelAt: Point['labelAt']): Point => ({ id, x, y, labelAt });

/** Des figures prêtes à l'emploi : le créateur en choisit une, elle se trace aux couleurs du cours. */
export const GEOMETRY_TEMPLATES: { id: string; label: string; figure: LessonGeometryFigure }[] = [
  {
    id: 'triangle',
    label: 'Triangle',
    figure: {
      kind: 'geometry',
      width: 320,
      height: 200,
      points: [P('A', 150, 15, 'n'), P('B', 40, 185, 'sw'), P('C', 290, 185, 'se')],
      segments: [
        { from: 'A', to: 'B' },
        { from: 'B', to: 'C' },
        { from: 'C', to: 'A' }
      ]
    }
  },
  {
    id: 'triangle-rectangle',
    label: 'Triangle rectangle',
    figure: {
      kind: 'geometry',
      width: 320,
      height: 200,
      points: [P('A', 60, 20, 'nw'), P('B', 60, 180, 'sw'), P('C', 280, 180, 'se')],
      segments: [
        { from: 'A', to: 'B' },
        { from: 'B', to: 'C' },
        { from: 'A', to: 'C', tone: 'accent' }
      ],
      rightAngles: [{ at: 'B', from: 'A', to: 'C' }]
    }
  },
  {
    id: 'thales',
    label: 'Configuration de Thalès',
    figure: {
      kind: 'geometry',
      width: 320,
      height: 215,
      points: [P('A', 150, 15, 'n'), P('B', 40, 200, 'w'), P('C', 290, 200, 'e'), P('M', 84, 126, 'w'), P('N', 234, 126, 'e')],
      polygons: [{ points: ['A', 'M', 'N'], tone: 'accent' }],
      segments: [
        { from: 'A', to: 'B', ray: true },
        { from: 'A', to: 'C', ray: true },
        { from: 'M', to: 'N', tone: 'accent' },
        { from: 'B', to: 'C', tone: 'accent' }
      ]
    }
  },
  {
    id: 'paralleles',
    label: 'Droites parallèles et sécante',
    figure: {
      kind: 'geometry',
      width: 320,
      height: 200,
      points: [P('A', 60, 60, 'n'), P('B', 260, 60, 'n'), P('C', 60, 150, 's'), P('D', 260, 150, 's'), P('E', 140, 60, 'ne'), P('F', 190, 150, 'se')],
      segments: [
        { from: 'A', to: 'B', line: true, tone: 'accent' },
        { from: 'C', to: 'D', line: true, tone: 'accent' },
        { from: 'E', to: 'F', line: true }
      ]
    }
  },
  {
    id: 'rectangle',
    label: 'Rectangle et diagonale',
    figure: {
      kind: 'geometry',
      width: 320,
      height: 200,
      points: [P('A', 50, 30, 'nw'), P('B', 270, 30, 'ne'), P('C', 270, 170, 'se'), P('D', 50, 170, 'sw')],
      segments: [
        { from: 'A', to: 'B' },
        { from: 'B', to: 'C' },
        { from: 'C', to: 'D' },
        { from: 'D', to: 'A' },
        { from: 'A', to: 'C', dashed: true, tone: 'accent' }
      ],
      rightAngles: [{ at: 'D', from: 'A', to: 'C' }]
    }
  },
  {
    id: 'cercle',
    label: 'Cercle, rayon et diamètre',
    figure: {
      kind: 'geometry',
      width: 320,
      height: 210,
      points: [P('O', 160, 105, 's'), P('A', 70, 105, 'w'), P('B', 250, 105, 'e'), P('M', 224, 41, 'ne')],
      circles: [{ center: 'O', radius: 90 }],
      segments: [
        { from: 'A', to: 'B', tone: 'accent' },
        { from: 'O', to: 'M', tone: 'warm' }
      ]
    }
  }
];

/** La figure type dont une figure de géométrie est tirée (pour le menu de l'éditeur). */
export function geometryTemplateOf(figure: LessonFigure): string {
  if (figure.kind !== 'geometry') return GEOMETRY_TEMPLATES[0].id;
  const key = JSON.stringify(figure.segments);
  return GEOMETRY_TEMPLATES.find((template) => JSON.stringify(template.figure.segments) === key)?.id || GEOMETRY_TEMPLATES[0].id;
}
