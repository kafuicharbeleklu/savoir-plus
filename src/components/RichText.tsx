import React from 'react';
import { tokenizeRichText } from '../richText';

/** Affiche le texte d'une contribution avec sa mise en forme : gras, italique, liens. */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {tokenizeRichText(text).map((token, index) => {
        if (token.type === 'bold') return <strong key={index}>{token.value}</strong>;
        if (token.type === 'italic') return <em key={index}>{token.value}</em>;
        if (token.type === 'link') {
          return (
            <a key={index} className="rt-link" href={token.value} target="_blank" rel="noopener noreferrer nofollow">
              {token.value}
            </a>
          );
        }
        return <React.Fragment key={index}>{token.value}</React.Fragment>;
      })}
    </>
  );
}
