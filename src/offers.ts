/**
 * Les offres de SAVOIR+, en francs CFA. Apprendre reste gratuit ; ce qui se paie, ce sont les outils
 * de pilotage (établissement, famille, encadrant), les contenus payants et la publicité.
 * Les repères de prix viennent des abonnements éducatifs observés dans la région (de 1 600 à
 * 7 000 F CFA par mois pour une famille). Tout paiement est SIMULÉ dans la démonstration.
 */
import { AD_PLANS } from './ads';

export type OfferAudience = 'learner' | 'family' | 'educator' | 'institution' | 'advertiser';

export const AUDIENCE_LABEL: Record<OfferAudience, string> = {
  learner: 'Apprenant',
  family: 'Famille',
  educator: 'Encadrant',
  institution: 'Établissement',
  advertiser: 'Publicité'
};

export interface Offer {
  id: string;
  audience: OfferAudience;
  name: string;
  /** Prix en francs CFA ; 0 pour une offre gratuite, `null` pour un prix sur devis. */
  price: number | null;
  period: 'mois' | 'semaine';
  tagline: string;
  features: string[];
  /** L'offre mise en avant pour ce public. */
  recommended?: boolean;
}

export const OFFERS: Offer[] = [
  {
    id: 'learner-free',
    audience: 'learner',
    name: 'Découverte',
    price: 0,
    period: 'mois',
    tagline: 'Apprendre reste gratuit.',
    features: ['Les modules gratuits et leurs quiz', 'Le fil, l’entraide et la messagerie', 'Le calendrier et le plan de révision']
  },
  {
    id: 'learner-plus',
    audience: 'learner',
    name: 'Apprenant+',
    price: 1500,
    period: 'mois',
    tagline: 'Tout le catalogue, sans publicité.',
    recommended: true,
    features: ['Tous les modules payants inclus', 'Les attestations de réussite à télécharger', 'Aucune publicité']
  },
  {
    id: 'family',
    audience: 'family',
    name: 'Famille',
    price: 2500,
    period: 'mois',
    tagline: 'Suivre jusqu’à trois enfants.',
    recommended: true,
    features: ['Apprenant+ pour chaque enfant', 'Le message de la semaine pour chacun', 'Le plan de révision et l’emploi du temps de chaque enfant']
  },
  {
    id: 'educator-pro',
    audience: 'educator',
    name: 'Encadrant Pro',
    price: 3000,
    period: 'mois',
    tagline: 'Pour enseigner à son compte.',
    recommended: true,
    features: ['Classes et apprenants sans limite (une classe en offre gratuite)', 'Le suivi détaillé de chaque apprenant', 'La vente de vos modules : SAVOIR+ garde 15 % du prix']
  },
  {
    id: 'institution-essential',
    audience: 'institution',
    name: 'Essentiel',
    price: 15000,
    period: 'mois',
    tagline: 'Jusqu’à 150 élèves.',
    features: ['Classes, enseignants et demandes de rattachement', 'L’emploi du temps en grille', 'Les niveaux de restriction par classe']
  },
  {
    id: 'institution-steering',
    audience: 'institution',
    name: 'Pilotage',
    price: 35000,
    period: 'mois',
    tagline: 'Jusqu’à 500 élèves.',
    recommended: true,
    features: ['Tout Essentiel', 'La vue d’ensemble et les élèves à accompagner', 'La planification du trimestre en diagramme de Gantt']
  },
  {
    id: 'institution-network',
    audience: 'institution',
    name: 'Réseau',
    price: null,
    period: 'mois',
    tagline: 'Plus de 500 élèves, ou plusieurs sites.',
    features: ['Tout Pilotage', 'Plusieurs établissements sous un même compte', 'Un interlocuteur dédié']
  },
  ...Object.values(AD_PLANS).map(
    (plan): Offer => ({
      id: `ad-${plan.tier}`,
      audience: 'advertiser',
      name: plan.label,
      price: plan.pricePerWeek,
      period: 'semaine',
      tagline: `${plan.seconds} secondes à l’écran, ${plan.passes} passage${plan.passes > 1 ? 's' : ''} par tour.`,
      recommended: plan.tier === 'priority',
      features: [
        'Votre annonce dans la carte de la colonne de droite',
        plan.tier === 'spotlight' ? 'En tête de liste : trois secondes et un passage de plus' : 'Le rang dans la liste suit le montant réglé',
        'Réservé aux établissements et aux encadrants vérifiés'
      ]
    })
  )
];

export const offersFor = (audience: OfferAudience): Offer[] => OFFERS.filter((o) => o.audience === audience);

/** « 1 500 F CFA », avec une espace insécable pour les milliers. */
export function formatCfa(amount: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(amount).replace(/[  ]/g, ' ')} F CFA`;
}

export function priceLabel(offer: Offer): string {
  if (offer.price === null) return 'Sur devis';
  if (offer.price === 0) return 'Gratuit';
  return `${formatCfa(offer.price)} / ${offer.period}`;
}
