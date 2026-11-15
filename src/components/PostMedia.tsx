import React from 'react';
import type { PostMedia } from '../wireframeData';

/** Image ou vidéo jointe à une contribution, avec sa mention d'origine quand elle existe. */
export function PostMediaView({ media, title }: { media: PostMedia; title: string }) {
  return (
    <figure className="li-post-media">
      {media.kind === 'video' ? (
        <video
          controls
          playsInline
          preload="metadata"
          src={media.src}
          aria-label={media.alt || `Vidéo jointe à « ${title} »`}
        />
      ) : (
        <img src={media.src} alt={media.alt || `Image jointe à « ${title} »`} loading="lazy" />
      )}
      {media.credit && <figcaption>{media.credit}</figcaption>}
    </figure>
  );
}
