/**
 * Facturation des formules (paiement simulé), sur le modèle de la gestion de l'abonnement Premium de
 * LinkedIn (« Manage Premium account », pages Purchases et Transactions de l'Admin Center) :
 * - une fréquence de facturation mensuelle ou annuelle, modifiable : elle s'applique à la prochaine
 *   échéance (fin de la période en cours) ;
 * - un moyen de paiement, modifiable : il vaut pour les échéances suivantes ;
 * - changer de formule prend effet le jour même : une nouvelle période de facturation commence ;
 * - résilier : la formule reste active jusqu'à la fin de la période payée, puis le compte revient à
 *   l'offre gratuite ; aucun nouveau prélèvement ;
 * - chaque échéance payée devient une transaction, avec son reçu à télécharger.
 * Ces fonctions sont pures : la page calcule l'état à jour sans rien écrire tant qu'on n'agit pas.
 */
import type { Day } from './calendar';
import { PAYMENT_METHODS, offerById, type BillingCycle, type Offer, type Subscription } from './offers';

/** Un an payé d'avance : dix mois facturés, deux offerts. */
export const ANNUAL_MONTHS_BILLED = 10;

export const CYCLE_LABEL: Record<BillingCycle, string> = { monthly: 'Mensuelle', annual: 'Annuelle' };
export const CYCLE_UNIT: Record<BillingCycle, string> = { monthly: 'mois', annual: 'an' };

/** Prix d'une période : le prix mensuel, ou dix fois ce prix pour une année. */
export const cyclePrice = (offer: Offer, cycle: BillingCycle): number => (offer.price || 0) * (cycle === 'annual' ? ANNUAL_MONTHS_BILLED : 1);

/** Le même jour, `n` mois plus tard (ramené au dernier jour du mois s'il n'existe pas : 31 → 30). */
export function addMonths(day: Day, n: number): Day {
  const [y, m, d] = day.split('-').map(Number);
  const total = y * 12 + (m - 1) + n;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(Math.min(d, last)).padStart(2, '0')}`;
}

/** L'échéance qui suit une échéance, selon la fréquence. */
export const dueAfter = (day: Day, cycle: BillingCycle): Day => addMonths(day, cycle === 'annual' ? 12 : 1);

const receiptId = (day: Day, index: number) => `ABO-${day.replace(/-/g, '')}-${String(index + 1).padStart(3, '0')}`;

/**
 * L'abonnement à jour au `today` : chaque échéance passée (jour même compris) devient une transaction,
 * au prix et avec le moyen de paiement en vigueur. Rien après la fin d'une formule résiliée.
 */
export function settle(sub: Subscription, today: Day): Subscription {
  const offer = offerById(sub.offerId);
  const cycle = sub.cycle || 'monthly';
  const method = sub.method || PAYMENT_METHODS[0];
  if (!offer || !offer.price) return { ...sub, cycle, method };
  const payments = [...(sub.payments || [])];
  let due = sub.nextDue || sub.since;
  for (let guard = 0; due <= today && (!sub.endsOn || due < sub.endsOn) && guard < 600; guard++) {
    payments.push({ id: receiptId(due, payments.length), day: due, offerId: offer.id, amount: cyclePrice(offer, cycle), method, cycle });
    due = dueAfter(due, cycle);
  }
  return { ...sub, cycle, method, payments, nextDue: due };
}

/** La formule est-elle encore active ? Une formule résiliée l'est jusqu'à la veille de sa fin. */
export const isActive = (sub: Subscription, today: Day): boolean => !sub.endsOn || today < sub.endsOn;

/**
 * Souscrire ou changer de formule : effet immédiat, une nouvelle période commence aujourd'hui (payée
 * aujourd'hui). L'historique des paiements et le réglage de la carte publicitaire sont conservés.
 */
export function subscribe(prev: Subscription | undefined, offerId: string, cycle: BillingCycle, method: string, today: Day): Subscription {
  const history = prev ? settle(prev, today).payments || [] : [];
  return settle({ offerId, since: today, cycle, method, payments: history, nextDue: today, showAds: prev?.showAds }, today);
}

/** Nouvelle fréquence : la période en cours garde la sienne, la suivante commence à la prochaine échéance. */
export const changeCycle = (sub: Subscription, cycle: BillingCycle, today: Day): Subscription => ({ ...settle(sub, today), cycle });

/** Nouveau moyen de paiement : pour les échéances à venir ; les reçus passés gardent le leur. */
export const changeMethod = (sub: Subscription, method: string, today: Day): Subscription => ({ ...settle(sub, today), method });

/** Résilier : active jusqu'à la prochaine échéance, qui n'est pas prélevée. */
export function cancel(sub: Subscription, today: Day): Subscription {
  const current = settle(sub, today);
  return { ...current, cancelledOn: today, endsOn: current.nextDue };
}

/** Une ligne de l'historique des transactions (formule ou contenu acheté). */
export interface Transaction {
  id: string;
  day: Day;
  label: string;
  detail?: string;
  amount: number;
  method: string;
}

/** Le reçu d'une transaction, en page HTML autonome (à ouvrir ou imprimer). */
export function receiptHtml(
  t: Transaction,
  billedTo: { name: string; address?: string; taxId?: string },
  dateLabel: string,
  amountLabel: string
): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const rows: [string, string][] = [
    ['Reçu n°', t.id],
    ['Date', dateLabel],
    ['Facturé à', billedTo.name],
    ...(billedTo.address ? ([['Adresse', billedTo.address]] as [string, string][]) : []),
    ...(billedTo.taxId ? ([['NIF', billedTo.taxId]] as [string, string][]) : []),
    ['Désignation', t.detail ? `${t.label} · ${t.detail}` : t.label],
    ['Moyen de paiement', t.method],
    ['Montant', amountLabel]
  ];
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>Reçu ${esc(t.id)} · SAVOIR+</title>
<style>body{font:15px/1.5 system-ui,sans-serif;color:#1d1d1f;max-width:560px;margin:48px auto;padding:0 16px}h1{font-size:20px;margin:0 0 4px}p{color:#666;margin:0 0 24px}table{width:100%;border-collapse:collapse}td{padding:10px 0;border-bottom:1px solid #e5e5e5;vertical-align:top}td:first-child{color:#666;width:40%}small{display:block;margin-top:24px;color:#666}</style>
</head><body>
<h1>SAVOIR+ · Reçu</h1><p>Merci pour votre paiement.</p>
<table>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>
<small>Démonstration : paiement simulé, aucun argent n'a été débité.</small>
</body></html>`;
}
