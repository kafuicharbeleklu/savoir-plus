import React from 'react';
import { NexusMark } from './NexusMark';

export type FooterInfoTopic = 'about' | 'privacy' | 'help' | 'accessibility' | 'hackathon';

export function RightRailShowcaseCard({
  onOpenInfoModal
}: {
  onOpenInfoModal: (topic: FooterInfoTopic) => void;
}) {
  return (
    <section className="right-showcase-banner" aria-label="SAVOIR+ — Apprenez avec ceux qui partagent">
      <button
        type="button"
        className="right-showcase-hit"
        onClick={() => onOpenInfoModal('hackathon')}
      >
        <div className="right-showcase-left">
          <div className="right-showcase-brand" aria-hidden="true">
            <span className="right-showcase-word">SAVOIR</span>
            <span className="right-showcase-plus">+</span>
          </div>
          <h3 className="right-showcase-headline">
            <span>Apprenez</span>
            <span className="is-gold">avec ceux</span>
            <span className="is-gold">qui partagent</span>
            <span>sur</span>
            <span>SAVOIR+</span>
          </h3>
        </div>

        <div className="right-showcase-visual" aria-hidden="true">
          <svg
            viewBox="0 0 180 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="right-showcase-art"
          >
            {/* Warm sunlit studio interior backdrop */}
            <rect width="180" height="240" fill="#E8C9AE" />
            {/* Brick texture blocks */}
            <rect x="108" y="0" width="72" height="190" fill="#B97352" />
            <g opacity="0.24" fill="#7D4127">
              <rect x="114" y="10" width="26" height="10" rx="1" />
              <rect x="146" y="10" width="28" height="10" rx="1" />
              <rect x="124" y="26" width="30" height="10" rx="1" />
              <rect x="114" y="42" width="26" height="10" rx="1" />
              <rect x="146" y="42" width="28" height="10" rx="1" />
              <rect x="122" y="58" width="32" height="10" rx="1" />
              <rect x="114" y="74" width="24" height="10" rx="1" />
              <rect x="144" y="74" width="30" height="10" rx="1" />
            </g>
            {/* Daylight window */}
            <rect x="12" y="16" width="76" height="128" rx="4" fill="#F9F4EC" stroke="#6C5241" strokeWidth="4" />
            <line x1="50" y1="16" x2="50" y2="144" stroke="#6C5241" strokeWidth="3" />
            <line x1="12" y1="80" x2="88" y2="80" stroke="#6C5241" strokeWidth="3" />
            {/* Foliage outside window */}
            <circle cx="32" cy="112" r="14" fill="#7BA07C" opacity="0.45" />
            <circle cx="68" cy="108" r="16" fill="#5D8762" opacity="0.45" />
            {/* Desk & warm lamp glow */}
            <rect x="0" y="182" width="180" height="58" fill="#8C583A" />
            <rect x="0" y="176" width="180" height="10" fill="#A96E4B" />
            {/* Potted plant on sill */}
            <rect x="26" y="146" width="18" height="16" rx="2" fill="#D9D3C7" />
            <path d="M35 146C28 134 22 134 24 143M35 146C35 130 39 128 40 142M35 146C43 135 49 138 44 145" stroke="#3F7A52" strokeWidth="2.5" strokeLinecap="round" />
            {/* Learner in warm mustard/amber cardigan */}
            <path d="M62 178C64 144 82 132 104 132C126 132 142 146 144 178H62Z" fill="#D59A2B" />
            <path d="M94 134L104 168L114 134" fill="#FAF5EE" />
            {/* Head & hair */}
            <circle cx="104" cy="104" r="22" fill="#3B241A" />
            <circle cx="102" cy="106" r="16" fill="#9E6244" />
            <path d="M86 102C88 89 102 84 116 92C122 96 126 106 123 118C118 112 114 104 106 100C98 98 90 100 86 102Z" fill="#2F1C14" />
            {/* Laptop & notebook */}
            <path d="M22 148H72L80 176H26L22 148Z" fill="#464E54" />
            <rect x="26" y="151" width="44" height="22" rx="1" fill="#DDE6E1" />
            <path d="M30 158H64M30 164H56" stroke="#1D4D3B" strokeWidth="2" strokeLinecap="round" />
            {/* Open notebook / card accent on foreground desk */}
            <rect x="76" y="190" width="84" height="16" rx="8" fill="#F2E2CE" />
            <rect x="92" y="206" width="52" height="12" rx="6" fill="#C97343" />
          </svg>
        </div>
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
