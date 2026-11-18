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
    tagline: 'Tout le catalogue, publicité facultative.',
    recommended: true,
    features: ['Tous les modules payants inclus', 'Les attestations de réussite à télécharger', 'La publicité, à masquer dans vos paramètres']
  },
  {
    id: 'family',
    audience: 'family',
    name: 'Famille',
    price: 2500,
    period: 'mois',
    tagline: 'Suivre jusqu’à trois enfants.',
    recommended: true,
    features: ['Les contenus payants inclus pour chaque enfant', 'Le plan de révision et l’emploi du temps de chaque enfant', 'La publicité, à masquer dans vos paramètres']
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

export const offerById = (id: string): Offer | undefined => OFFERS.find((o) => o.id === id);

/**
 * Formule souscrite par un membre (paiement simulé). Avec l'offre gratuite, la carte publicitaire
 * est obligatoire ; avec une formule payante, le membre peut la masquer dans ses paramètres.
 */
export interface Subscription {
  offerId: string;
  since: string;
  /** Afficher la carte publicitaire. Absent : affichée. */
  showAds?: boolean;
  /** Moyen de paiement choisi (simulé). */
  method?: string;
}

/** La formule payante d'un membre, ou rien (offre gratuite, ou formule de publicité pour annonceur). */
export function paidSubscription(
  subscriptions: Record<string, Subscription> | undefined,
  uid: string
): { subscription: Subscription; offer: Offer } | null {
  const subscription = subscriptions?.[uid];
  const offer = subscription ? offerById(subscription.offerId) : undefined;
  if (!subscription || !offer || offer.price === 0 || offer.audience === 'advertiser') return null;
  return { subscription, offer };
}

/** Moyens de paiement proposés (paiement simulé dans la démonstration). */
export const PAYMENT_METHODS = ['Mixx by Yas', 'Flooz', 'Carte bancaire'];

/** Le public des formules d'un type de compte. */
export const audienceOfKind = (kind: string | undefined): OfferAudience =>
  kind === 'guardian' ? 'family' : kind === 'educator' ? 'educator' : kind === 'institution' ? 'institution' : 'learner';

/**
 * Les formules entre lesquelles un compte choisit : la gratuite d'abord (« Découverte » pour un
 * apprenant, sans formule pour un parent ou un encadrant), puis les payantes. Un établissement
 * souscrit toujours une formule : pas d'offre gratuite.
 */
export function plansFor(audience: OfferAudience): Offer[] {
  if (audience === 'advertiser') return [];
  const paid = offersFor(audience).filter((o) => o.price !== 0);
  if (audience === 'institution') return paid;
  const free =
    offersFor(audience).find((o) => o.price === 0) ||
    ({
      id: 'free',
      audience,
      name: 'Gratuite',
      price: 0,
      period: 'mois',
      tagline: audience === 'family' ? 'Suivre ses enfants et leur message de la semaine.' : 'Enseigner et suivre ses classes.',
      features: []
    } satisfies Offer);
  return [free, ...paid];
}

/** Les contenus payants sont inclus : formule Apprenant+ ou Famille du membre, ou Famille d'un de ses parents. */
export function contentIncluded(subscriptions: Record<string, Subscription> | undefined, uid: string, guardianIds: string[] = []): boolean {
  const own = paidSubscription(subscriptions, uid)?.offer.id;
  if (own === 'learner-plus' || own === 'family') return true;
  return guardianIds.some((g) => paidSubscription(subscriptions, g)?.offer.id === 'family');
}

/** Formule Famille : le plan de révision et l'emploi du temps de chaque enfant. */
export const familyTools = (subscriptions: Record<string, Subscription> | undefined, uid: string): boolean =>
  paidSubscription(subscriptions, uid)?.offer.id === 'family';

/** Formule Pilotage ou Réseau : la vue d'ensemble et la planification en diagramme de Gantt. */
export const institutionSteering = (subscriptions: Record<string, Subscription> | undefined, uid: string): boolean =>
  ['institution-steering', 'institution-network'].includes(paidSubscription(subscriptions, uid)?.offer.id || '');

/** « 1 500 F CFA », avec une espace insécable pour les milliers. */
export function formatCfa(amount: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(amount).replace(/[  ]/g, ' ')} F CFA`;
}

export function priceLabel(offer: Offer): string {
  if (offer.price === null) return 'Sur devis';
  if (offer.price === 0) return 'Gratuit';
  return `${formatCfa(offer.price)} / ${offer.period}`;
}
