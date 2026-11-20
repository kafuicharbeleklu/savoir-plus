/**
 * La barre de la messagerie, comme sur LinkedIn : image, pièce jointe, GIF et clavier d'émoticônes.
 *
 * - Image : réduite à 1 280 px au plus (JPEG) pour tenir dans le navigateur ; un GIF animé reste tel quel.
 * - Pièce jointe : 1 Mo au plus, téléchargeable depuis la discussion.
 * - GIF : une collection de réactions animées dessinées dans le site (aucun service extérieur, aucune
 *   recherche envoyée à un tiers).
 * - Émoticônes : insérées à l'endroit du curseur.
 */
import React from 'react';
import { Download, FileText } from 'lucide-react';
import type { MessageAttachment } from '../data';

/** Taille maximale d'une pièce jointe (et d'un GIF importé comme image). */
export const MAX_ATTACHMENT_BYTES = 1024 * 1024;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('lecture'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

/* ------------------------------------------------------------------ émoticônes */

export const EMOJI_GROUPS: { id: string; label: string; emojis: string[] }[] = [
  {
    id: 'faces',
    label: 'Visages',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🙂', '😉', '😊', '😇', '🥰', '😍', '😘', '😋', '😎', '🤓', '🤩', '🥳', '😏', '🤔', '🤨', '😐', '🙄', '😬', '😮', '😲', '🥺', '😢', '😭', '😤', '😡', '🤯', '😳', '🥱', '😴', '🤗', '🤭', '🫡', '😌']
  },
  {
    id: 'gestures',
    label: 'Gestes',
    emojis: ['👍', '👎', '👏', '🙌', '🙏', '🤝', '👋', '✌️', '🤞', '👌', '🤙', '💪', '👀', '🫶', '✍️', '☝️', '👉', '👈', '👇', '👆']
  },
  {
    id: 'hearts',
    label: 'Cœurs',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💯', '💬', '💭']
  },
  {
    id: 'study',
    label: 'Études',
    emojis: ['📚', '📖', '📝', '✏️', '🖊️', '📌', '📎', '🗂️', '📅', '⏰', '💡', '🎯', '✅', '❌', '⚠️', '❓', '❗', '🔒', '🔑', '💻', '📱', '🌐', '🧠', '🏆', '🎓', '🚀', '🎉', '☕', '🔥', '🌍']
  }
];

/* ------------------------------------------------------------------ GIF */

export type GifMotion = 'pulse' | 'bob' | 'pop' | 'shake' | 'wave' | 'wobble' | 'tilt' | 'bounce' | 'beat' | 'flicker';

export interface GifItem {
  id: string;
  emoji: string;
  caption: string;
  motion: GifMotion;
  /** Teinte du fond (variable de couleur du site). */
  tone: 'brand' | 'warm' | 'calm' | 'soft';
  /** Mots qui le font trouver dans la recherche. */
  tags: string;
}

export const GIFS: GifItem[] = [
  { id: 'bravo', emoji: '👏', caption: 'Bravo !', motion: 'pulse', tone: 'brand', tags: 'bravo applaudir applaudissements félicitations bien joué réussi' },
  { id: 'merci', emoji: '🙏', caption: 'Merci !', motion: 'bob', tone: 'calm', tags: 'merci remercier remerciement gratitude' },
  { id: 'fete', emoji: '🎉', caption: 'Félicitations', motion: 'pop', tone: 'warm', tags: 'fête fete félicitations réussite bravo diplôme examen réussi' },
  { id: 'courage', emoji: '💪', caption: 'Courage !', motion: 'shake', tone: 'warm', tags: 'courage force motivation motivé persévérer' },
  { id: 'salut', emoji: '👋', caption: 'Salut !', motion: 'wave', tone: 'soft', tags: 'salut bonjour bonsoir coucou hello au revoir' },
  { id: 'top', emoji: '👍', caption: 'Top !', motion: 'pop', tone: 'brand', tags: 'top ok d’accord daccord oui super parfait génial' },
  { id: 'rire', emoji: '😂', caption: 'Trop drôle', motion: 'wobble', tone: 'soft', tags: 'rire drôle drole mdr lol humour' },
  { id: 'hmm', emoji: '🤔', caption: 'Hmm…', motion: 'tilt', tone: 'calm', tags: 'réfléchir réflexion hmm question doute pas sûr' },
  { id: 'revise', emoji: '📚', caption: 'On révise ?', motion: 'bounce', tone: 'brand', tags: 'réviser révision révisions étudier étude travail travailler cours examen devoirs' },
  { id: 'pause', emoji: '☕', caption: 'Pause café', motion: 'bob', tone: 'warm', tags: 'pause café cafe repos fatigue' },
  { id: 'feu', emoji: '🔥', caption: 'En feu !', motion: 'flicker', tone: 'warm', tags: 'feu génial série incroyable énorme' },
  { id: 'coeur', emoji: '❤️', caption: 'Merci beaucoup', motion: 'beat', tone: 'soft', tags: 'cœur coeur amour merci beaucoup affection' }
];

const normalize = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export function searchGifs(query: string): GifItem[] {
  const q = normalize(query.trim());
  if (!q) return GIFS;
  return GIFS.filter((g) => normalize(`${g.caption} ${g.tags}`).includes(q));
}

/** Un GIF de la collection : l'émoticône animée et sa légende sur un fond teinté. */
export function GifView({ id, size = 'message' }: { id: string; size?: 'message' | 'tile' }) {
  const gif = GIFS.find((g) => g.id === id);
  if (!gif) return <span className="li-gif li-gif--missing">GIF indisponible</span>;
  return (
    <span className={`li-gif li-gif--${gif.motion} li-gif--${gif.tone} li-gif--${size}`} role="img" aria-label={`GIF : ${gif.caption}`}>
      <span className="li-gif-emoji" aria-hidden="true">
        {gif.emoji}
      </span>
      <span className="li-gif-caption" aria-hidden="true">
        {gif.caption}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ affichage dans la discussion */

export function MessageAttachmentView({ attachment }: { attachment: MessageAttachment }) {
  if (attachment.kind === 'gif') {
    return (
      <div className="li-msg-attachment">
        <GifView id={attachment.id} />
      </div>
    );
  }
  if (attachment.kind === 'image') {
    return (
      <div className="li-msg-attachment">
        <img className="li-msg-image" src={attachment.dataUrl} alt={attachment.name} loading="lazy" />
      </div>
    );
  }
  return (
    <div className="li-msg-attachment">
      <a className="li-msg-file" href={attachment.dataUrl} download={attachment.name}>
        <FileText size={22} aria-hidden="true" />
        <span className="li-msg-file-text">
          <b>{attachment.name}</b>
          <small>{formatBytes(attachment.size)} · Télécharger</small>
        </span>
        <Download size={16} aria-hidden="true" />
      </a>
    </div>
  );
}
