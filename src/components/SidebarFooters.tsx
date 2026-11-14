import React from 'react';
import { ArrowRight } from 'lucide-react';
import { NexusMark } from './NexusMark';

export type FooterInfoTopic = 'about' | 'privacy' | 'help' | 'accessibility' | 'hackathon';

export function RightRailShowcaseCard({
  onOpenInfoModal
}: {
  onOpenInfoModal: (topic: FooterInfoTopic) => void;
}) {
  return (
    <section className="rail-card right-showcase-card" aria-label="SAVOIR+ par Nexus — Hackathon CREATE WITH AI">
      <div className="right-showcase-top">
        <span className="eyebrow">NEXUS · CREATE WITH AI 2026</span>
      </div>
      <h3 className="right-showcase-title">Apprendre et transmettre ensemble.</h3>
      <p className="tiny muted right-showcase-sub">Forum Femmes &amp; IA · Éducation &amp; Entraide</p>
      <button type="button" className="text-link right-showcase-link" onClick={() => onOpenInfoModal('hackathon')}>
        Découvrir le projet <ArrowRight size={14} />
      </button>
    </section>
  );
}

export function SidebarCompactFooter({
  nav,
  canCreate,
  onOpenInfoModal
}: {
  nav: (page: any, id?: string) => void;
  canCreate: boolean;
  onOpenInfoModal: (topic: FooterInfoTopic) => void;
}) {
  return (
    <footer className="linkedin-right-footer left-rail-footer" aria-label="Pied de page SAVOIR+ et Nexus">
      <div className="lrf-row">
        <button type="button" onClick={() => onOpenInfoModal('about')}>À propos</button>
        <button type="button" onClick={() => onOpenInfoModal('accessibility')}>Accessibilité</button>
        <button type="button" onClick={() => onOpenInfoModal('help')}>Aide &amp; Entraide</button>
      </div>
      <div className="lrf-row">
        <button type="button" onClick={() => onOpenInfoModal('privacy')}>
          Confidentialité &amp; Conditions
        </button>
        <button type="button" onClick={() => nav('settings')}>Sécurité</button>
      </div>
      <div className="lrf-row">
        <button type="button" onClick={() => onOpenInfoModal('hackathon')}>Hackathon CREATE WITH AI</button>
        <button type="button" onClick={() => onOpenInfoModal('hackathon')}>Forum Femmes &amp; IA</button>
      </div>
      <div className="lrf-row">
        <button type="button" onClick={() => nav(canCreate ? 'studio' : 'catalog')}>
          {canCreate ? 'Espace Créateur' : 'Bibliothèque'}
        </button>
        <button type="button" onClick={() => nav('relations')}>Réseau</button>
        <button type="button" onClick={() => nav('settings')}>Plus</button>
      </div>
      <div className="lrf-signature">
        <NexusMark width={18} height={13} />
        <span>Nexus · SAVOIR+ © 2026</span>
      </div>
    </footer>
  );
}
