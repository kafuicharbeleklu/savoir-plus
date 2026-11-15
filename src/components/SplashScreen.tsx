import React from 'react';
import { SPLASH_HOLD_MS } from '../personas';
import { NexusMark } from './NexusMark';

const LETTERS = 'SAVOIR'.split('');

/**
 * Écran de lancement : le nom se compose lettre à lettre, le « + » vient se poser,
 * puis une fine barre se remplit pendant le chargement avant que l'écran ne s'efface.
 */
export function SplashScreen({
  exiting,
  reducedMotion = false
}: {
  exiting: boolean;
  reducedMotion?: boolean;
}) {
  return (
    <div
      className={`splash-screen ${exiting ? 'is-exiting' : ''} ${reducedMotion ? 'is-reduced' : ''}`}
      style={{ '--splash-hold': `${SPLASH_HOLD_MS}ms` } as React.CSSProperties}
      role="status"
      aria-live="polite"
      aria-label="Chargement de SAVOIR+, conçu par Nexus pour le Hackathon CREATE WITH AI"
    >
      <div className="splash-ambient" aria-hidden="true" />

      <div className="splash-spacer" aria-hidden="true" />

      <div className="splash-center" aria-hidden="true">
        <div className="splash-wordmark">
          {LETTERS.map((letter, index) => (
            <b key={index} className="splash-letter" style={{ '--i': index } as React.CSSProperties}>
              {letter}
            </b>
          ))}
          <b className="splash-plus">+</b>
        </div>
        <div className="splash-progress">
          <i />
        </div>
      </div>

      <footer className="splash-footer">
        <span className="splash-from">par</span>
        <div className="splash-nexus-row">
          <NexusMark className="splash-nexus-mark" width={24} height={17} />
          <span className="splash-nexus-name">Nexus</span>
        </div>
        <p className="splash-hackathon">Hackathon CREATE WITH AI · Forum Femmes &amp; IA 2026</p>
      </footer>
    </div>
  );
}
