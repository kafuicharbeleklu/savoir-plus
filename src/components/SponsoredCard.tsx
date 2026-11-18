/**
 * La carte publicitaire de la colonne de droite et la fenêtre des offres.
 * La carte n'a pas de coins arrondis et porte la mention « Publicité » : on ne la confond pas avec
 * un contenu du site. Les annonces se succèdent. Avec l'offre gratuite, la publicité est obligatoire :
 * ni pause ni masquage ; un abonné peut mettre le défilement en pause, ou masquer la carte dans ses
 * paramètres. Tout paiement est simulé.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Pause, Play } from 'lucide-react';
import { buildRotation, type AdCampaign } from '../ads';
import type { Day } from '../calendar';
import { AUDIENCE_LABEL, offersFor, priceLabel, type OfferAudience } from '../offers';
import { ART_ICONS, ArtScene } from './LessonArt';
import { Modal, Tabs } from './ui';

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
        <ArtScene seed={campaign.id} frame={campaign.advertiserKind === 'institution' ? 'window' : house ? 'route' : 'sheet'} icon={<Icon size={20} strokeWidth={1.75} />} />
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

const AUDIENCES: OfferAudience[] = ['learner', 'family', 'educator', 'institution', 'advertiser'];

/** Les offres de SAVOIR+, par public, en francs CFA. */
export function OffersModal({
  initial = 'learner',
  onClose,
  currentOfferId,
  viewerAudience,
  onChoose
}: {
  initial?: OfferAudience;
  onClose: () => void;
  /** La formule du membre qui regarde. */
  currentOfferId?: string;
  /** Le public de ce membre : ses formules portent « Choisir cette formule ». */
  viewerAudience?: OfferAudience;
  onChoose?: (offerId: string) => void;
}) {
  const [audience, setAudience] = useState<OfferAudience>(initial);
  return (
    <Modal open size="lg" title="Offres et tarifs" onClose={onClose}>
      <Tabs<OfferAudience> label="Public de l’offre" value={audience} onChange={setAudience} items={AUDIENCES.map((id) => ({ id, label: AUDIENCE_LABEL[id] }))} />
      <div className="of-grid">
        {offersFor(audience).map((offer) => (
          <article key={offer.id} className={`of-card${offer.recommended ? ' is-recommended' : ''}`}>
            <header>
              <h3>{offer.name}</h3>
              {offer.recommended && <span className="of-flag">Conseillée</span>}
            </header>
            <p className="of-price tabular-nums">{priceLabel(offer)}</p>
            <p className="of-tagline">{offer.tagline}</p>
            <ul className="of-features">
              {offer.features.map((feature) => (
                <li key={feature}>
                  <Check size={15} aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            {offer.audience === viewerAudience &&
              (offer.id === currentOfferId ? (
                <p className="of-current">Votre formule</p>
              ) : onChoose && offer.price !== null ? (
                <button type="button" className="secondary ui-btn-sm of-choose" onClick={() => onChoose(offer.id)}>
                  Choisir cette formule
                </button>
              ) : null)}
          </article>
        ))}
      </div>
      <p className="of-note">
        Prix en francs CFA, par {audience === 'advertiser' ? 'semaine' : 'mois'}.
        {audience !== 'advertiser' && ' Avec une formule payante, la carte publicitaire se masque dans vos paramètres.'} Démonstration : aucun paiement réel
        n’a lieu ; la souscription en ligne viendra avec le paiement par mobile money.
      </p>
    </Modal>
  );
}
