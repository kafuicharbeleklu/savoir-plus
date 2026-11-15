/**
 * Film d'accueil de la page de connexion : deux plans tournés en bibliothèque, lus en boucle
 * avec un fondu enchaîné. Muet, sans commandes, purement décoratif.
 * – Réservé aux grands écrans : rien n'est chargé sur mobile.
 * – Avec « réduire les animations », le premier plan reste affiché, immobile.
 * – Si la vidéo ne se charge pas, le fond aux couleurs de SAVOIR+ reste en place.
 *
 * Séquences : Yan Krukau, Pexels (licence Pexels, usage libre).
 */
import React, { useEffect, useRef, useState } from 'react';
import { useIsNarrow } from './ui';

const CLIPS = [
  {
    src: 'https://videos.pexels.com/video-files/8199407/8199407-hd_1280_720_25fps.mp4',
    position: '62% 50%',
  },
  {
    src: 'https://videos.pexels.com/video-files/8199412/8199412-hd_1280_720_25fps.mp4',
    position: '46% 50%',
  },
];

/** Durée du fondu entre deux plans, en secondes (reprise dans landing.css). */
const FADE = 1;

function prefersStill() {
  if (typeof window === 'undefined') return false;
  if (document.documentElement.dataset.reducedMotion === 'true') return true;
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

export function LandingVideo() {
  const narrow = useIsNarrow('(max-width: 960px)');
  const refs = useRef<(HTMLVideoElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);
  const [still] = useState(prefersStill);
  const activeRef = useRef(0);

  // Lancement du premier plan (le son est coupé avant la lecture : condition de la lecture automatique).
  useEffect(() => {
    if (narrow || still) return;
    const first = refs.current[0];
    if (!first) return;
    first.muted = true;
    void first.play().catch(() => undefined);
  }, [narrow, still]);

  if (narrow) return null;

  const handleTime = (index: number) => {
    const video = refs.current[index];
    if (!video || index !== activeRef.current || !Number.isFinite(video.duration)) return;
    if (video.duration - video.currentTime > FADE) return;
    // Le plan en cours se termine : le suivant démarre dessous et prend le relais en fondu.
    const nextIndex = (index + 1) % CLIPS.length;
    const next = refs.current[nextIndex];
    if (!next || next.readyState < 2) return;
    activeRef.current = nextIndex;
    next.currentTime = 0;
    next.muted = true;
    void next.play().catch(() => undefined);
    setActive(nextIndex);
  };

  const handleEnded = (index: number) => {
    const video = refs.current[index];
    if (!video) return;
    if (index === activeRef.current) {
      // Le plan suivant n'était pas prêt : on rejoue celui-ci plutôt que de figer l'image.
      video.currentTime = 0;
      void video.play().catch(() => undefined);
    }
  };

  return (
    <div className={`lv${ready ? ' is-ready' : ''}`} aria-hidden="true">
      {CLIPS.map((clip, index) => (
        <video
          key={clip.src}
          ref={(el) => {
            refs.current[index] = el;
          }}
          className={`lv-clip${index === active ? ' is-active' : ''}`}
          style={{ objectPosition: clip.position }}
          src={still && index > 0 ? undefined : clip.src}
          muted
          playsInline
          disablePictureInPicture
          tabIndex={-1}
          preload={index === 0 || ready ? 'auto' : 'none'}
          onLoadedData={index === 0 ? () => setReady(true) : undefined}
          onTimeUpdate={still ? undefined : () => handleTime(index)}
          onEnded={still ? undefined : () => handleEnded(index)}
        />
      ))}
      <div className="lv-shade" />
      <span className="lv-credit">Vidéo : Yan Krukau · Pexels</span>
    </div>
  );
}
