/**
 * Contrôles de forme d'une leçon rédigée (voir `LessonRich`) : ce qui doit être vrai pour que le
 * chapitre s'affiche proprement et garde la même tenue d'un module à l'autre.
 */
import type { LessonRich } from './content';

/** Tous les textes d'une leçon. */
function textsOf(rich: LessonRich): string[] {
  const figure = rich.example.figure;
  const inFigure =
    figure.kind === 'message'
      ? [figure.from, ...(figure.details || []).flatMap((d) => [d.label, d.value]), ...figure.body]
      : figure.kind === 'timeline'
        ? figure.steps
        : figure.kind === 'table'
          ? [...figure.head, ...figure.rows.flat()]
          : figure.kind === 'flow'
            ? [...figure.nodes.flatMap((n) => [n.label, n.sub || '']), ...figure.links]
            : figure.kind === 'split'
              ? figure.parts.flatMap((p) => [p.label, p.note])
              : figure.kind === 'geometry'
                ? [...figure.points.map((p) => p.label || ''), ...figure.segments.map((t) => t.label || '')]
                : figure.kind === 'fraction'
                  ? figure.items.map((item) => item.label)
                  : [figure.alt, figure.credit || ''];
  return [
    rich.scene,
    ...rich.sections.flatMap((s) => [s.title, ...s.text, ...(s.items || []), s.after || '']),
    rich.example.title,
    rich.example.intro || '',
    rich.example.caption,
    ...inFigure,
    ...rich.example.notes,
    rich.question.ask,
    ...rich.question.answer
  ];
}

/**
 * Défauts de forme des objectifs d'un module. Ils complètent « vous saurez : », en liste : une
 * minuscule au début, « ; » à la fin de chacun et « . » à la fin du dernier.
 */
export function goalsIssues(goals: string[]): string[] {
  const issues: string[] = [];
  if (goals.length < 2 || goals.length > 4) issues.push('objectifs : de deux à quatre');
  goals.forEach((goal, i) => {
    const end = i === goals.length - 1 ? '.' : ' ;';
    if (!goal.trim()) issues.push(`objectif ${i + 1} vide`);
    else {
      if (goal[0] !== goal[0].toLowerCase()) issues.push(`objectif ${i + 1} : sans majuscule, il complète « vous saurez »`);
      if (!goal.endsWith(end)) issues.push(`objectif ${i + 1} : doit finir par « ${end.trim()} »`);
      if (goal.includes("'")) issues.push(`objectif ${i + 1} : apostrophe droite`);
    }
  });
  return issues;
}

/** Défauts de forme d'une leçon. Une liste vide : la leçon est affichable telle quelle. */
export function lessonIssues(rich: LessonRich): string[] {
  const issues: string[] = [];

  if (!rich.scene.trim()) issues.push('entrée en matière vide');

  if (rich.sections.length < 2 || rich.sections.length > 4) issues.push('cours : de 2 à 4 parties');
  rich.sections.forEach((section, i) => {
    if (!section.title.trim() || !section.text.length || section.text.some((p) => !p.trim())) issues.push(`partie ${i + 1} : titre ou texte vide`);
    if (section.items && section.items.length < 2) issues.push(`partie ${i + 1} : une liste a au moins deux éléments`);
    if (section.after && !section.items) issues.push(`partie ${i + 1} : « after » suit une liste`);
  });

  const { example } = rich;
  if (!example.title.trim() || !example.caption.trim()) issues.push('exemple : titre ou légende vide');
  if (example.notes.length < 2 || example.notes.length > 4) issues.push('exemple : de 2 à 4 remarques');
  const figure = example.figure;
  if (figure.kind === 'message' && !figure.body.length) issues.push('exemple : message vide');
  if (figure.kind === 'timeline' && figure.steps.length < 2) issues.push('exemple : une situation a au moins deux moments');
  if (figure.kind === 'table') {
    if (figure.head.length < 2 || !figure.rows.length) issues.push('exemple : tableau incomplet');
    if (figure.rows.some((row) => row.length !== figure.head.length)) issues.push('exemple : une ligne du tableau n’a pas le bon nombre de cases');
  }
  if (figure.kind === 'flow') {
    if (figure.nodes.length < 2 || figure.nodes.length > 4) issues.push('exemple : un schéma relie de 2 à 4 éléments');
    if (figure.links.length !== figure.nodes.length - 1) issues.push('exemple : une flèche entre chaque élément du schéma');
  }
  if (figure.kind === 'split') {
    if (figure.parts.length < 2 || figure.parts.length > 4) issues.push('exemple : une répartition a de 2 à 4 parts');
    if (figure.parts.reduce((sum, part) => sum + part.percent, 0) !== 100) issues.push('exemple : les parts doivent faire 100 %');
  }
  if (figure.kind === 'geometry') {
    const ids = new Set(figure.points.map((point) => point.id));
    if (figure.points.length < 2) issues.push('exemple : une figure a au moins deux points');
    if (ids.size !== figure.points.length) issues.push('exemple : deux points de la figure portent le même nom');
    if (figure.points.some((point) => point.x < 0 || point.y < 0 || point.x > figure.width || point.y > figure.height)) issues.push('exemple : un point sort du cadre de la figure');
    const used = [
      ...figure.segments.flatMap((t) => [t.from, t.to]),
      ...(figure.polygons || []).flatMap((poly) => poly.points),
      ...(figure.circles || []).map((circle) => circle.center),
      ...(figure.rightAngles || []).flatMap((angle) => [angle.at, angle.from, angle.to])
    ];
    if (used.some((id) => !ids.has(id))) issues.push('exemple : un trait de la figure relie un point qui n’existe pas');
    if (!figure.segments.length && !(figure.circles || []).length) issues.push('exemple : une figure a au moins un trait ou un cercle');
  }
  if (figure.kind === 'fraction') {
    if (figure.items.length < 1 || figure.items.length > 3) issues.push('exemple : de une à trois fractions dessinées');
    if (figure.items.some((item) => !Number.isInteger(item.parts) || item.parts < 2 || item.parts > 12)) issues.push('exemple : une fraction se partage en 2 à 12 parts');
    if (figure.items.some((item) => !Number.isInteger(item.taken) || item.taken < 0 || item.taken > item.parts)) issues.push('exemple : les parts coloriées ne dépassent pas le nombre de parts');
    if (figure.items.some((item) => !item.label.trim())) issues.push('exemple : chaque fraction a sa légende');
  }
  if (figure.kind === 'image') {
    if (!figure.src.trim()) issues.push('exemple : image manquante');
    if (!figure.alt.trim()) issues.push('exemple : l’image a besoin d’un texte de remplacement');
  }

  if (!rich.question.ask.trim().endsWith('?')) issues.push('question de l’élève : elle se termine par « ? »');
  if (!rich.question.answer.length || rich.question.answer.some((p) => !p.trim())) issues.push('question de l’élève : réponse vide');

  // Typographie : apostrophe courbe partout, comme dans le reste des contenus.
  if (textsOf(rich).some((text) => text.includes("'"))) issues.push('apostrophe droite dans un texte');
  return issues;
}
