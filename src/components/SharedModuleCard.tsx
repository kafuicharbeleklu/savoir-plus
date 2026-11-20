/**
 * Un module partagé dans une publication : une carte d'aperçu dans l'esprit de la Bibliothèque, au lieu
 * d'une ligne « Module · domaine · durée · niveau ». La couverture du sujet à gauche ; à droite le type
 * et le domaine, le titre, une phrase de résumé, puis la difficulté, la durée et les XP.
 */
import React from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import type { CatalogItem } from '../wireframeData';
import { CatalogCardBanner, ContentTypeMark, XpBadgeInline } from './CatalogVisuals';
import { DifficultyMeter } from './ProfileIdentityCard';

export function SharedModuleCard({ item, onOpen }: { item: CatalogItem; onOpen: () => void }) {
  return (
    <button type="button" className="shared-module" onClick={onOpen} aria-label={`Ouvrir le module « ${item.title} »`}>
      <span className="shared-module-cover" aria-hidden="true">
        <CatalogCardBanner item={item} compact />
      </span>
      <span className="shared-module-body">
        <ContentTypeMark type={item.type} extra={item.domain} />
        {/* « 3-2-1 » ne se coupe pas en fin de ligne : trait d'union insécable entre deux chiffres. */}
        <b className="shared-module-title">{item.title.replace(/(\d)-(?=\d)/g, '$1‑')}</b>
        {item.summary && <span className="shared-module-summary">{item.summary}</span>}
        <span className="shared-module-meta">
          <DifficultyMeter level={item.level} />
          {item.duration && (
            <span className="shared-module-time">
              <Clock size={13} aria-hidden="true" /> {item.duration}
            </span>
          )}
          {item.xpReward ? <XpBadgeInline amount={item.xpReward} /> : null}
        </span>
      </span>
      <ArrowRight size={16} aria-hidden="true" className="shared-module-arrow" />
    </button>
  );
}
