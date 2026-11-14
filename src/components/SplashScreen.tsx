import React from 'react';
import { NexusMark } from './NexusMark';

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
      role="status"
      aria-live="polite"
      aria-label="Chargement de SAVOIR+, conçu par Nexus pour le Hackathon CREATE WITH AI"
    >
      <div className="splash-ambient" aria-hidden="true" />

      <div className="splash-spacer" aria-hidden="true" />

      <div className="splash-center">
        <div className="splash-wordmark">
          SAVOIR<span>+</span>
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
