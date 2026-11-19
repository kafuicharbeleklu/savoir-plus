/**
 * Formules — page publique, comme les pages d'information : le modèle économique en francs CFA, par
 * public, avec le prix ramené à l'élève pour un établissement, un tableau de comparaison, les moyens de
 * paiement et la mention « paiement simulé ». Elle s'ouvre aussi au moment où elle sert : un module
 * payant, une rubrique réservée à la formule Pilotage, l'annonce maison, le pied de page.
 * Adresse : « #info/pricing/<public> ». Les prix sont ceux de src/offers.ts, rien d'autre.
 */
import React from 'react';
import { Check, Minus } from 'lucide-react';
import {
  PAYMENT_METHODS,
  comparisonRows,
  formatAmount,
  offersFor,
  plansFor,
  pricePerSeat,
  type Offer,
  type OfferAudience
} from '../offers';
import { PHOTOS, PHOTO_CREDIT } from '../media';

export const PRICING_AUDIENCES: OfferAudience[] = ['learner', 'family', 'educator', 'institution', 'advertiser'];

export const isPricingAudience = (id: string): id is OfferAudience => (PRICING_AUDIENCES as string[]).includes(id);

const PUBLIC_LABEL: Record<OfferAudience, string> = {
  learner: 'Apprenants',
  family: 'Familles',
  educator: 'Encadrants',
  institution: 'Établissements',
  advertiser: 'Annonceurs'
};

/** « Pour les comptes … » : à qui s'adressent ces formules, quand ce n'est pas le compte qui regarde. */
const ACCOUNT_OF: Record<OfferAudience, string> = {
  learner: 'les comptes apprenant',
  family: 'les comptes parent ou tuteur',
  educator: 'les comptes encadrant',
  institution: 'les comptes établissement',
  advertiser: 'les établissements et encadrants vérifiés'
};

/** Ce que paie chaque public, en une phrase fidèle à ce que fait le site. */
const LEAD: Record<OfferAudience, string> = {
  learner: 'Les modules gratuits, le fil, l’entraide et le plan de révision restent ouverts à tous ; Apprenant+ ouvre tout le catalogue.',
  family: 'Le message de la semaine reste gratuit ; la formule Famille ajoute le plan de révision et l’emploi du temps de chaque enfant, et leurs contenus payants.',
  educator: 'Enseigner et suivre une classe reste gratuit ; Encadrant Pro lève la limite et vous permet de vendre vos modules.',
  institution: 'L’établissement paie pour piloter ; ses élèves apprennent avec les contenus de leurs enseignants sans rien payer.',
  advertiser: 'Les établissements et les encadrants vérifiés annoncent dans la carte de la colonne de droite, à la semaine.'
};

const PHOTO: Record<OfferAudience, string> = {
  learner: PHOTOS.revision,
  family: PHOTOS.entraide,
  educator: PHOTOS.etude,
  institution: PHOTOS.bibliotheque,
  advertiser: PHOTOS.ecriture
};

/** Sous le prix : le prix par élève, ou ce que le prix implique. */
function unitLine(plan: Offer): string {
  const perSeat = pricePerSeat(plan);
  if (perSeat) return `soit ${perSeat} F CFA par élève et par mois`;
  if (plan.price === null) return 'selon le nombre d’élèves et de sites';
  if (plan.price === 0) return 'la carte publicitaire reste affichée';
  if (plan.audience === 'advertiser') return 'par semaine de diffusion';
  return 'sans engagement, résiliable dans Paramètres';
}

export interface PricingPageProps {
  audience: OfferAudience;
  nav: (page: any, id?: string) => void;
  /** Le public du compte qui regarde : ses formules portent « Choisir ». */
  viewerAudience?: OfferAudience;
  /** Sa formule actuelle. */
  currentOfferId?: string;
}

export function PricingPage({ audience, nav, viewerAudience, currentOfferId }: PricingPageProps) {
  const plans = audience === 'advertiser' ? offersFor('advertiser') : plansFor(audience);
  // La comparaison sert là où les formules s'emboîtent : Essentiel, Pilotage, Réseau.
  const rows = audience === 'institution' ? comparisonRows(plans) : [];
  const mine = viewerAudience === audience;

  return (
    <main className="pr-page">
      <section className="pr-hero">
        <div className="pr-hero-text">
          <p className="pr-kicker">Formules en francs CFA</p>
          <h1 className="pr-title">
            Apprendre reste gratuit. <br />
            Les outils se paient.
          </h1>
          <p className="pr-lead">
            Sans engagement, payable par {PAYMENT_METHODS.slice(0, -1).join(', ')} ou {PAYMENT_METHODS[PAYMENT_METHODS.length - 1].toLowerCase()}. {LEAD[audience]}
          </p>
          <nav className="pr-seg" aria-label="Formules par public">
            {PRICING_AUDIENCES.map((a) => (
              <button key={a} type="button" className={a === audience ? 'is-on' : undefined} aria-current={a === audience ? 'page' : undefined} onClick={() => nav('info', `pricing/${a}`)}>
                {PUBLIC_LABEL[a]}
              </button>
            ))}
          </nav>
        </div>
        <figure className="pr-photo">
          <img src={PHOTO[audience]} alt="" loading="lazy" />
          <figcaption>{PHOTO_CREDIT}</figcaption>
        </figure>
      </section>

      <section className={`pr-plans is-${Math.min(plans.length, 3)}`} aria-label={`Formules : ${PUBLIC_LABEL[audience].toLowerCase()}`}>
        {plans.map((plan) => {
          const current = mine && plan.id === currentOfferId;
          return (
            <article key={plan.id} className={`pr-plan${plan.recommended ? ' is-reco' : ''}${current ? ' is-current' : ''}`}>
              {plan.recommended && <span className="pr-reco">Recommandé</span>}
              <header>
                <h2>{plan.name}</h2>
                <p>{plan.tagline}</p>
              </header>
              <p className="pr-price tabular-nums">
                {plan.price === null ? (
                  'Sur devis'
                ) : plan.price === 0 ? (
                  'Gratuit'
                ) : (
                  <>
                    {formatAmount(plan.price)}
                    <small>F CFA / {plan.period}</small>
                  </>
                )}
              </p>
              <p className="pr-unit">{unitLine(plan)}</p>
              <div className="pr-action">
                {current ? (
                  <p className="pr-current">
                    <Check size={16} aria-hidden="true" /> Votre formule
                  </p>
                ) : mine && plan.price !== null ? (
                  <button
                    type="button"
                    className={plan.recommended ? 'primary' : 'secondary'}
                    onClick={() => nav('settings', `account/plan/${plan.id}`)}
                  >
                    {plan.price === 0 ? 'Revenir à l’offre gratuite' : `Choisir ${plan.name}`}
                  </button>
                ) : (
                  <p className="pr-for">{plan.price === null ? 'Prix établi avec l’équipe SAVOIR+' : `Pour ${ACCOUNT_OF[audience]}`}</p>
                )}
              </div>
              {plan.features.length > 0 && (
                <ul className="pr-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check size={16} aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </section>

      {rows.length > 0 && (
        <section className="pr-compare" aria-label="Comparer les formules">
          <h2>Comparer les formules</h2>
          <div className="pr-compare-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Ce qui est inclus</th>
                  {plans.map((plan) => (
                    <th key={plan.id} scope="col" className={plan.recommended ? 'is-reco' : undefined}>
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.feature}>
                    <th scope="row">{row.feature}</th>
                    {row.included.map((yes, i) => (
                      <td key={plans[i].id} className={plans[i].recommended ? 'is-reco' : undefined}>
                        {yes ? (
                          <span className="pr-yes">
                            <Check size={16} aria-hidden="true" />
                            <span className="sr-only">Inclus</span>
                          </span>
                        ) : (
                          <span className="pr-no">
                            <Minus size={14} aria-hidden="true" /> Non inclus
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <footer className="pr-foot">
        <p className="pr-pay">
          <b>Paiement</b> {PAYMENT_METHODS.join(' · ')}
        </p>
        <p className="pr-sim">Démonstration : le paiement est simulé, aucun argent n’est débité.</p>
        {audience === 'advertiser' ? (
          <button type="button" className="ip-link" onClick={() => nav('info', 'privacy/ads')}>
            Règles de la publicité
          </button>
        ) : (
          <button type="button" className="ip-link" onClick={() => nav('info', 'pricing/advertiser')}>
            Formules de publicité pour les annonceurs
          </button>
        )}
      </footer>
    </main>
  );
}
