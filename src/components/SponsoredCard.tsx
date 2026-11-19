/**
 * La carte publicitaire de la colonne de droite, et l'annonce d'un établissement dans son espace.
 * La carte n'a pas de coins arrondis et porte la mention « Publicité » : on ne la confond pas avec
 * un contenu du site. Les annonces se succèdent. Avec l'offre gratuite, la publicité est obligatoire :
 * ni pause ni masquage ; un abonné peut mettre le défilement en pause, ou masquer la carte dans ses
 * paramètres. Tout paiement est simulé.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Pause, Play } from 'lucide-react';
import { buildRotation, type AdCampaign } from '../ads';
import { formatDayShort, type Day } from '../calendar';
import { ART_ICONS, ArtScene } from './LessonArt';
import { adPhoto } from '../media';

export function SponsoredCard({
  campaigns,
  today,
  seed,
  canOpen,
  onOpenAdvertiser,
  onOpenOffers,
  canPause = false
}: {
  campaigns: AdCampaign[];
  today: Day;
  /** Graine du tirage : la même pour une même visite. */
  seed: number;
  /** L'annonceur a-t-il une fiche que l'on peut ouvrir ? */
  canOpen: (advertiserId: string) => boolean;
  onOpenAdvertiser: (advertiserId: string) => void;
  onOpenOffers: () => void;
  /** Abonné : il peut mettre le défilement en pause. Offre gratuite : la publicité est obligatoire. */
  canPause?: boolean;
}) {
  const rotation = useMemo(() => buildRotation(campaigns, today, seed), [campaigns, today, seed]);
  const [index, setIndex] = useState(0);
  const [hold, setHold] = useState(false);
  const [paused, setPaused] = useState(false);
  const slot = rotation.length ? rotation[index % rotation.length] : undefined;
  const seconds = slot?.seconds || 0;
  // Avec un seul annonceur, rien ne défile.
  const rotates = new Set(rotation.map((s) => s.campaign.id)).size > 1;

  // Une annonce reste le temps que sa formule lui donne, puis laisse la place à la suivante.
  useEffect(() => {
    if (!seconds || hold || paused || !rotates) return;
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % rotation.length), seconds * 1000);
    return () => window.clearTimeout(timer);
  }, [index, seconds, hold, paused, rotates, rotation.length]);

  if (!slot) return null;
  const campaign = slot.campaign;
  const Icon = ART_ICONS[campaign.art];
  const house = campaign.advertiserKind === 'house';
  const photo = adPhoto(campaign);
  const openable = house || (campaign.cta !== '' && canOpen(campaign.advertiserId));

  return (
    <section
      className="ad-card"
      aria-label="Publicité"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
    >
      <div className="ad-card-visual">
        {photo ? (
          <img src={photo} alt="" loading="lazy" />
        ) : (
          <ArtScene seed={campaign.id} frame={campaign.advertiserKind === 'institution' ? 'window' : house ? 'route' : 'sheet'} icon={<Icon size={20} strokeWidth={1.75} />} />
        )}
      </div>
      <div className="ad-card-body" key={campaign.id}>
        <p className="ad-card-label">Publicité · {campaign.advertiserName}</p>
        <h2>{campaign.headline}</h2>
        <p>{campaign.text}</p>
        {openable && (
          <button type="button" className="ad-card-cta" onClick={() => (house ? onOpenOffers() : onOpenAdvertiser(campaign.advertiserId))}>
            {campaign.cta} <ArrowRight size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      {canPause && rotates && (
        <footer className="ad-card-foot">
          <button
            type="button"
            className="ad-card-pause"
            aria-pressed={paused}
            title={paused ? 'Reprendre le défilement des annonces' : 'Mettre le défilement en pause'}
            aria-label={paused ? 'Reprendre le défilement des annonces' : 'Mettre le défilement des annonces en pause'}
            onClick={() => setPaused(!paused)}
          >
            {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
          </button>
        </footer>
      )}
    </section>
  );
}

/** Dans l'espace d'un annonceur : son annonce en cours, avec la photo que voient les membres. */
export function OwnAdCard({ campaign, onOpenOffers }: { campaign: AdCampaign; onOpenOffers: () => void }) {
  const photo = adPhoto(campaign);
  return (
    <section className="own-ad" aria-label="Votre annonce">
      {photo && <img src={photo} alt="" loading="lazy" />}
      <div className="own-ad-body">
        <p className="own-ad-kicker">Votre annonce · en diffusion</p>
        <p className="own-ad-title">{campaign.headline}</p>
        <p className="own-ad-meta">Jusqu’au {formatDayShort(campaign.end)}</p>
        <button type="button" className="li-text-link" onClick={onOpenOffers}>
          Formules de publicité
        </button>
      </div>
    </section>
  );
}
