/**
 * Publicité de la colonne de droite : des annonces d'établissements et d'encadrants abonnés à une
 * formule, qui se succèdent dans une seule carte. L'ordre est tiré au sort ; la durée d'affichage et
 * le nombre de passages dépendent de la formule payée et du rang de l'annonceur dans la liste.
 * Les paiements sont SIMULÉS : aucun argent n'est débité.
 */
import type { Day } from './calendar';
import type { LessonArt } from './content';

export type AdTier = 'visibility' | 'priority' | 'spotlight';

export interface AdPlan {
  tier: AdTier;
  label: string;
  /** Prix par semaine, en francs CFA. */
  pricePerWeek: number;
  /** Secondes d'affichage à chaque passage. */
  seconds: number;
  /** Passages dans un tour complet de la liste. */
  passes: number;
}

export const AD_PLANS: Record<AdTier, AdPlan> = {
  visibility: { tier: 'visibility', label: 'Visibilité', pricePerWeek: 5000, seconds: 8, passes: 1 },
  priority: { tier: 'priority', label: 'Priorité', pricePerWeek: 12000, seconds: 10, passes: 2 },
  spotlight: { tier: 'spotlight', label: 'Premier plan', pricePerWeek: 25000, seconds: 12, passes: 3 }
};

export interface AdCampaign {
  id: string;
  /** L'annonceur : un établissement ou un encadrant de SAVOIR+, ou la plateforme elle-même. */
  advertiserId: string;
  advertiserName: string;
  advertiserKind: 'institution' | 'educator' | 'house';
  tier: AdTier;
  headline: string;
  text: string;
  cta: string;
  art: LessonArt;
  start: Day;
  /** Dernier jour de diffusion, inclus. */
  end: Day;
  /** Montant réglé pour la période, en francs CFA : il départage deux annonces de même formule. */
  paid: number;
}

/** Les annonces en cours de diffusion à une date, sans celles de la plateforme. */
export function activeCampaigns(campaigns: AdCampaign[], today: Day): AdCampaign[] {
  return campaigns.filter((c) => c.advertiserKind !== 'house' && c.start <= today && today <= c.end);
}

/** Le classement : qui a payé le plus passe devant ; à montant égal, la campagne la plus ancienne. */
export function rankCampaigns(campaigns: AdCampaign[]): AdCampaign[] {
  return [...campaigns].sort((a, b) => b.paid - a.paid || a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
}

/** Ce que le rang ajoute à la formule : le premier de la liste reste plus longtemps et passe une fois de plus. */
export function slotOf(campaign: AdCampaign, rank: number): { seconds: number; passes: number } {
  const plan = AD_PLANS[campaign.tier];
  return { seconds: plan.seconds + (rank === 0 ? 3 : 0), passes: plan.passes + (rank === 0 ? 1 : 0) };
}

/** Générateur pseudo-aléatoire reproductible : un même tirage pour une même graine. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export interface AdSlot {
  campaign: AdCampaign;
  seconds: number;
}

/**
 * Un tour complet de la liste : chaque annonce y figure autant de fois que sa formule et son rang le
 * prévoient, dans un ordre tiré au sort, sans jamais se suivre elle-même quand une autre peut
 * s'intercaler. Sans annonce payée, la carte montre l'annonce de la plateforme.
 */
export function buildRotation(campaigns: AdCampaign[], today: Day, seed: number): AdSlot[] {
  const ranked = rankCampaigns(activeCampaigns(campaigns, today));
  if (ranked.length === 0) {
    const house = campaigns.find((c) => c.advertiserKind === 'house');
    return house ? [{ campaign: house, seconds: AD_PLANS[house.tier].seconds }] : [];
  }
  const random = seededRandom(seed);
  const left = ranked.map((campaign, rank) => ({ campaign, ...slotOf(campaign, rank) }));
  const rotation: AdSlot[] = [];
  let previous = '';
  // Tirage au sort, un passage après l'autre, parmi les annonces autres que celle qui vient de passer.
  // Une annonce qui a plus de passages restants que toutes les autres réunies passe d'office : c'est
  // le seul moyen de ne pas la voir deux fois de suite à la fin du tour.
  for (let remaining = left.reduce((sum, entry) => sum + entry.passes, 0); remaining > 0; remaining -= 1) {
    const open = left.filter((entry) => entry.passes > 0);
    const dominant = open.reduce((a, b) => (b.passes > a.passes ? b : a));
    const others = open.filter((entry) => entry.campaign.id !== previous);
    const pick =
      others.length === 0
        ? open[0]
        : dominant.campaign.id !== previous && dominant.passes > remaining - dominant.passes
          ? dominant
          : others[Math.floor(random() * others.length)];
    pick.passes -= 1;
    previous = pick.campaign.id;
    rotation.push({ campaign: pick.campaign, seconds: pick.seconds });
  }
  return rotation;
}

/** Part du temps d'antenne de chaque annonceur sur un tour, en pourcentage. */
export function airtimeShares(rotation: AdSlot[]): { id: string; name: string; share: number }[] {
  const total = rotation.reduce((sum, slot) => sum + slot.seconds, 0) || 1;
  const byId = new Map<string, { id: string; name: string; seconds: number }>();
  for (const slot of rotation) {
    const entry = byId.get(slot.campaign.id) || { id: slot.campaign.id, name: slot.campaign.advertiserName, seconds: 0 };
    entry.seconds += slot.seconds;
    byId.set(slot.campaign.id, entry);
  }
  return [...byId.values()].map((e) => ({ id: e.id, name: e.name, share: Math.round((e.seconds / total) * 100) })).sort((a, b) => b.share - a.share);
}

/** Annonces de démonstration, autour d'aujourd'hui. */
export function demoCampaigns(today: Day, addDays: (day: Day, n: number) => Day): AdCampaign[] {
  return [
    {
      id: 'ad-palmiers',
      advertiserId: 'palmiers',
      advertiserName: 'Les Palmiers',
      advertiserKind: 'institution',
      tier: 'spotlight',
      headline: 'Inscriptions 2027 ouvertes',
      text: 'Du primaire à la Terminale, à Lomé. Journée portes ouvertes le samedi.',
      cta: 'Voir l’établissement',
      art: 'people',
      start: addDays(today, -3),
      end: addDays(today, 10),
      paid: 25000
    },
    {
      id: 'ad-kossi',
      advertiserId: 'kossi',
      advertiserName: 'Kossi Agbo',
      advertiserKind: 'educator',
      tier: 'priority',
      headline: 'Tutorat en réseaux et sécurité',
      text: 'Séances individuelles ou en petit groupe, le soir et le samedi.',
      cta: 'Voir le profil',
      art: 'switch',
      start: addDays(today, -1),
      end: addDays(today, 5),
      paid: 12000
    },
    {
      id: 'ad-horizon',
      advertiserId: 'inst-horizon',
      advertiserName: 'Institut Horizon',
      advertiserKind: 'institution',
      tier: 'visibility',
      headline: 'Cours du soir pour adultes',
      text: 'Bureautique et initiation aux réseaux, du lundi au jeudi à 18 h 30.',
      // Pas de fiche publique sur SAVOIR+ : l'annonce n'a pas de bouton.
      cta: '',
      art: 'calendar',
      start: addDays(today, -2),
      end: addDays(today, 4),
      paid: 5000
    },
    {
      id: 'ad-house',
      advertiserId: 'savoir-plus',
      advertiserName: 'SAVOIR+',
      advertiserKind: 'house',
      tier: 'visibility',
      headline: 'Votre annonce ici',
      text: 'Établissements et encadrants : faites connaître vos cours, à partir de 5 000 F CFA par semaine.',
      cta: 'Voir les offres',
      art: 'send',
      start: today,
      end: today,
      paid: 0
    }
  ];
}
