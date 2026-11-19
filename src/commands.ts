/**
 * Fenêtre de commande (Ctrl K) : aller n'importe où et lancer les gestes courants au clavier.
 * Chaque entrée fait ce qu'elle annonce : une page, un contenu, un membre, ou une action réelle du site.
 * Sans recherche, la fenêtre propose l'essentiel ; une recherche ouvre aussi la bibliothèque et les membres.
 */

export interface Command {
  id: string;
  /** Groupe affiché : « Reprendre », « Aller à », « Actions », « Bibliothèque », « Membres »… */
  group: string;
  label: string;
  /** Une précision, à droite du libellé (type, durée, rubrique). */
  hint?: string;
  /** Mots en plus pour la recherche (synonymes, rubrique). */
  keywords?: string;
  /** N'apparaît qu'en réponse à une recherche (contenus et membres : trop nombreux pour être listés). */
  onlyOnSearch?: boolean;
  run: () => void;
}

export interface CommandGroup {
  group: string;
  items: Command[];
}

/** Minuscules, sans accents : « Évaluation » et « evaluation » se valent. */
export const normalize = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/**
 * Pertinence d'une entrée pour une recherche : 0 si un mot manque. Le libellé compte plus que les mots
 * en plus ; un début de libellé ou de mot compte plus qu'un passage au milieu.
 */
export function matchScore(command: Command, query: string): number {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return 1;
  const label = normalize(command.label);
  const extra = normalize(`${command.hint || ''} ${command.keywords || ''} ${command.group}`);
  let score = 0;
  for (const word of words) {
    const at = label.indexOf(word);
    if (at === 0) score += 6;
    else if (at > 0 && /[\s'’«(-]/.test(label[at - 1])) score += 4;
    else if (at > 0) score += 2;
    else if (extra.includes(word)) score += 1;
    else return 0;
  }
  return score;
}

/** Les entrées à montrer, par groupe, dans l'ordre des groupes d'origine ; `limit` par groupe en recherche. */
export function filterCommands(commands: Command[], query: string, limit = 6): CommandGroup[] {
  const searching = query.trim().length > 0;
  const order: string[] = [];
  const byGroup = new Map<string, { command: Command; score: number; index: number }[]>();
  commands.forEach((command, index) => {
    if (!searching && command.onlyOnSearch) return;
    const score = searching ? matchScore(command, query) : 1;
    if (score === 0) return;
    if (!byGroup.has(command.group)) {
      byGroup.set(command.group, []);
      order.push(command.group);
    }
    byGroup.get(command.group)!.push({ command, score, index });
  });
  return order.map((group) => {
    const ranked = byGroup.get(group)!;
    if (searching) ranked.sort((a, b) => b.score - a.score || a.index - b.index);
    return { group, items: (searching ? ranked.slice(0, limit) : ranked).map((r) => r.command) };
  });
}

/** Où le libellé contient la recherche (premier mot trouvé), pour le surligner. */
export function highlightRange(label: string, query: string): [number, number] | null {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const plain = normalize(label);
  for (const word of words) {
    const at = plain.indexOf(word);
    // La normalisation garde la longueur d'un texte composé (une lettre accentuée reste une lettre).
    if (at >= 0 && plain.length === label.length) return [at, at + word.length];
  }
  return null;
}
