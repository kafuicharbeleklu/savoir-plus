/**
 * Vidéos d'illustration hébergées avec le site (dans `public/media`), depuis le 18 novembre 2026.
 * Ce sont des séquences Pexels, libres de droits sous la licence Pexels ; leurs auteurs sont
 * crédités là où elles s'affichent. Le site ne dépend plus de videos.pexels.com pour les lire.
 */

/** Identifiant Pexels → fichier local, relatif à la page (fonctionne aussi sous un sous-dossier). */
export const HOSTED_VIDEOS: Record<string, string> = {
  '8199407': 'media/pexels-8199407.mp4',
  '8199412': 'media/pexels-8199412.mp4',
  '9198355': 'media/pexels-9198355.mp4',
  '6281083': 'media/pexels-6281083.mp4'
};

/**
 * Adresse à lire pour une vidéo : le fichier local quand la séquence est hébergée avec le site,
 * sinon l'adresse d'origine. Sert aussi aux publications enregistrées avant l'hébergement local.
 */
export function hostedVideo(src: string): string {
  const match = /videos\.pexels\.com\/video-files\/(\d+)\//.exec(src);
  return (match && HOSTED_VIDEOS[match[1]]) || src;
}
