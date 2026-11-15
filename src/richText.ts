/**
 * Mise en forme légère des contributions : **gras**, *italique* et liens cliquables.
 * Le texte est découpé en morceaux typés ; rien n'est interprété comme du HTML.
 */
export type RichToken = { type: 'text' | 'bold' | 'italic' | 'link'; value: string };

const PATTERN = /\*\*\S(?:[^*\n]*\S)?\*\*|\*\S(?:[^*\n]*\S)?\*|https?:\/\/[^\s<>"']+/g;

export function tokenizeRichText(text: string): RichToken[] {
  const tokens: RichToken[] = [];
  const pattern = new RegExp(PATTERN.source, 'g');
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const raw = match[0];
    if (match.index > last) tokens.push({ type: 'text', value: text.slice(last, match.index) });
    if (raw.startsWith('**')) {
      tokens.push({ type: 'bold', value: raw.slice(2, -2) });
    } else if (raw.startsWith('*')) {
      tokens.push({ type: 'italic', value: raw.slice(1, -1) });
    } else {
      // La ponctuation qui termine la phrase ne fait pas partie de l'adresse.
      const url = raw.replace(/[.,;:!?)\]]+$/, '');
      tokens.push({ type: 'link', value: url });
      if (url.length < raw.length) tokens.push({ type: 'text', value: raw.slice(url.length) });
    }
    last = match.index + raw.length;
  }
  if (last < text.length) tokens.push({ type: 'text', value: text.slice(last) });
  return tokens;
}
