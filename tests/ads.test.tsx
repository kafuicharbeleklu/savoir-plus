/**
 * Publicité et offres : classement des annonces, durée et passages selon la formule et le rang,
 * tirage du défilement, parts de temps d'affichage ; offres en francs CFA ; rendu de la carte.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AD_PLANS, activeCampaigns, airtimeShares, buildRotation, demoCampaigns, rankCampaigns, slotOf, type AdCampaign } from '../src/ads';
import { addDays } from '../src/calendar';
import { OFFERS, contentIncluded, familyTools, formatCfa, institutionSteering, offersFor, paidSubscription, plansFor, priceLabel } from '../src/offers';
import { SponsoredCard } from '../src/components/SponsoredCard';

const TODAY = '2026-11-17';
const campaigns = demoCampaigns(TODAY, addDays);

test('seules les annonces payées et en cours entrent dans la liste, classées par montant réglé', () => {
  const active = activeCampaigns(campaigns, TODAY);
  assert.deepEqual(active.map((c) => c.id).sort(), ['ad-horizon', 'ad-kossi', 'ad-palmiers']);
  assert.deepEqual(rankCampaigns(active).map((c) => c.id), ['ad-palmiers', 'ad-kossi', 'ad-horizon']);
  // Une campagne finie ou pas encore commencée ne passe pas.
  assert.equal(activeCampaigns(campaigns, addDays(TODAY, 30)).length, 0);
  assert.equal(activeCampaigns(campaigns, addDays(TODAY, -10)).length, 0);
  // À montant égal, la plus ancienne passe devant.
  const tie: AdCampaign[] = [
    { ...campaigns[1], id: 'b', start: '2026-11-10', paid: 9000 },
    { ...campaigns[1], id: 'a', start: '2026-11-05', paid: 9000 }
  ];
  assert.deepEqual(rankCampaigns(tie).map((c) => c.id), ['a', 'b']);
});

test('la durée et le nombre de passages suivent la formule ; le premier de la liste a un bonus', () => {
  const [first, second, third] = rankCampaigns(activeCampaigns(campaigns, TODAY));
  assert.deepEqual(slotOf(first, 0), { seconds: AD_PLANS.spotlight.seconds + 3, passes: AD_PLANS.spotlight.passes + 1 });
  assert.deepEqual(slotOf(second, 1), { seconds: AD_PLANS.priority.seconds, passes: AD_PLANS.priority.passes });
  assert.deepEqual(slotOf(third, 2), { seconds: AD_PLANS.visibility.seconds, passes: AD_PLANS.visibility.passes });
  // Une formule plus chère donne plus de temps et plus de passages.
  assert.ok(AD_PLANS.visibility.pricePerWeek < AD_PLANS.priority.pricePerWeek && AD_PLANS.priority.pricePerWeek < AD_PLANS.spotlight.pricePerWeek);
  assert.ok(AD_PLANS.visibility.seconds < AD_PLANS.priority.seconds && AD_PLANS.priority.seconds < AD_PLANS.spotlight.seconds);
  assert.ok(AD_PLANS.visibility.passes < AD_PLANS.priority.passes && AD_PLANS.priority.passes < AD_PLANS.spotlight.passes);
});

test('un tour de défilement : chaque annonce a ses passages, l’ordre est tiré au sort, sans répétition immédiate', () => {
  const rotation = buildRotation(campaigns, TODAY, 42);
  const count = (id: string) => rotation.filter((s) => s.campaign.id === id).length;
  assert.equal(count('ad-palmiers'), 4);
  assert.equal(count('ad-kossi'), 2);
  assert.equal(count('ad-horizon'), 1);
  assert.equal(count('ad-house'), 0, 'l’annonce de la plateforme ne passe pas quand il y a des annonceurs');
  // Même graine, même tirage ; une autre graine peut donner un autre ordre.
  assert.deepEqual(buildRotation(campaigns, TODAY, 42).map((s) => s.campaign.id), rotation.map((s) => s.campaign.id));
  const orders = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((seed) => buildRotation(campaigns, TODAY, seed).map((s) => s.campaign.id).join(',')));
  assert.ok(orders.size > 1, 'l’ordre dépend du tirage');
  // Une même annonce ne se suit pas elle-même quand une autre peut s'intercaler.
  for (let seed = 1; seed <= 50; seed += 1) {
    const order = buildRotation(campaigns, TODAY, seed).map((s) => s.campaign.id);
    const repeats = order.filter((id, i) => i > 0 && order[i - 1] === id).length;
    assert.ok(repeats <= 1, `graine ${seed} : ${order.join(' ')}`);
  }
  // Qui paie plus est plus longtemps à l'écran.
  const shares = airtimeShares(rotation);
  assert.deepEqual(shares.map((s) => s.id), ['ad-palmiers', 'ad-kossi', 'ad-horizon']);
  assert.ok(shares[0].share > 60 && shares[2].share < 15);
  assert.ok(Math.abs(shares.reduce((sum, s) => sum + s.share, 0) - 100) <= 2);
});

test('sans annonceur, la carte montre l’annonce de la plateforme', () => {
  const rotation = buildRotation(campaigns, addDays(TODAY, 60), 7);
  assert.deepEqual(rotation.map((s) => s.campaign.id), ['ad-house']);
  assert.deepEqual(buildRotation([], TODAY, 7), []);
});

test('les offres sont en francs CFA, une conseillée par public, l’établissement payant', () => {
  assert.equal(formatCfa(1500), '1 500 F CFA');
  assert.equal(formatCfa(35000), '35 000 F CFA');
  for (const audience of ['learner', 'family', 'educator', 'institution', 'advertiser'] as const) {
    const offers = offersFor(audience);
    assert.ok(offers.length >= 1, audience);
    assert.equal(offers.filter((o) => o.recommended).length, 1, `${audience} : une offre conseillée`);
    for (const offer of offers) assert.ok(offer.features.length >= 3, offer.id);
  }
  // Apprendre reste gratuit ; aucune offre d'établissement ne l'est.
  assert.equal(priceLabel(offersFor('learner')[0]), 'Gratuit');
  assert.ok(offersFor('institution').every((o) => o.price === null || o.price > 0));
  assert.equal(priceLabel(offersFor('institution')[1]), '35 000 F CFA / mois');
  assert.equal(priceLabel(offersFor('institution')[2]), 'Sur devis');
  // Les formules publicitaires reprennent les prix du moteur de défilement.
  assert.deepEqual(offersFor('advertiser').map((o) => o.price), [5000, 12000, 25000]);
  assert.equal(new Set(OFFERS.map((o) => o.id)).size, OFFERS.length);
});

test('la carte publicitaire porte la mention « Publicité » ; obligatoire avec l’offre gratuite, un abonné peut la mettre en pause', () => {
  const html = renderToStaticMarkup(
    <SponsoredCard campaigns={campaigns} today={TODAY} seed={42} canOpen={(id) => id !== 'inst-horizon'} onOpenAdvertiser={() => undefined} onOpenOffers={() => undefined} />
  );
  assert.match(html, /<section class="ad-card" aria-label="Publicité">/);
  assert.match(html, /Publicité · /);
  assert.match(html, /class="art-scene/);
  // Offre gratuite : ni pause, ni « Pourquoi cette annonce ? ».
  assert.doesNotMatch(html, /Pourquoi cette annonce/);
  assert.doesNotMatch(html, /ad-card-pause/);
  const subscriber = renderToStaticMarkup(
    <SponsoredCard campaigns={campaigns} today={TODAY} seed={42} canOpen={() => true} onOpenAdvertiser={() => undefined} onOpenOffers={() => undefined} canPause />
  );
  assert.match(subscriber, /Mettre le défilement des annonces en pause/);
  assert.doesNotMatch(subscriber, /Pourquoi cette annonce/);
  // Un annonceur sans fiche n'a pas de bouton qui ne mènerait nulle part.
  const lone = renderToStaticMarkup(
    <SponsoredCard campaigns={campaigns.filter((c) => c.id === 'ad-horizon')} today={TODAY} seed={1} canOpen={() => false} onOpenAdvertiser={() => undefined} onOpenOffers={() => undefined} />
  );
  assert.match(lone, /Institut Horizon/);
  assert.ok(!lone.includes('ad-card-cta'));
  assert.ok(!lone.includes('ad-card-pause'), 'une seule annonce : rien à mettre en pause');
  assert.ok(
    !renderToStaticMarkup(
      <SponsoredCard campaigns={campaigns.filter((c) => c.id === 'ad-horizon')} today={TODAY} seed={1} canOpen={() => false} onOpenAdvertiser={() => undefined} onOpenOffers={() => undefined} canPause />
    ).includes('ad-card-pause'),
    'même abonné : une seule annonce ne défile pas'
  );
  // Rien à diffuser : pas de carte.
  assert.equal(renderToStaticMarkup(<SponsoredCard campaigns={[]} today={TODAY} seed={1} canOpen={() => false} onOpenAdvertiser={() => undefined} onOpenOffers={() => undefined} />), '');
});

test('formule payante : la publicité devient facultative ; avec l’offre gratuite, elle est obligatoire', () => {
  assert.equal(paidSubscription(undefined, 'afi'), null);
  assert.equal(paidSubscription({ afi: { offerId: 'learner-free', since: '2026-11-01' } }, 'afi'), null, 'offre gratuite');
  assert.equal(paidSubscription({ ec: { offerId: 'ad-priority', since: '2026-11-01' } }, 'ec'), null, 'une formule d’annonceur n’en dispense pas');
  assert.equal(paidSubscription({ kossi: { offerId: 'educator-pro', since: '2026-10-01' } }, 'kossi')?.offer.name, 'Encadrant Pro');
  assert.equal(paidSubscription({ kossi: { offerId: 'educator-pro', since: '2026-10-01' } }, 'afi'), null, 'la formule est celle du membre');
});

test('formules : choix par public, contenus inclus, outils réservés', () => {
  // Un apprenant choisit entre Découverte et Apprenant+ ; un parent entre gratuit et Famille ; un établissement paie toujours.
  assert.deepEqual(plansFor('learner').map((p) => p.id), ['learner-free', 'learner-plus']);
  assert.deepEqual(plansFor('family').map((p) => [p.id, p.price]), [['free', 0], ['family', 2500]]);
  assert.deepEqual(plansFor('institution').map((p) => p.id), ['institution-essential', 'institution-steering', 'institution-network']);
  assert.deepEqual(plansFor('advertiser'), []);

  const subs = {
    afi: { offerId: 'learner-plus', since: '2026-11-18' },
    akouvi: { offerId: 'family', since: '2026-09-15' },
    palmiers: { offerId: 'institution-essential', since: '2026-09-01' }
  };
  // Contenus payants : Apprenant+, ou la formule Famille d'un parent.
  assert.equal(contentIncluded(subs, 'afi'), true);
  assert.equal(contentIncluded(subs, 'elom', ['akouvi']), true);
  assert.equal(contentIncluded(subs, 'nadege'), false);
  // Plan de révision et emploi du temps des enfants : formule Famille.
  assert.equal(familyTools(subs, 'akouvi'), true);
  assert.equal(familyTools({}, 'akouvi'), false);
  // Vue d'ensemble et Gantt : Pilotage ou Réseau, pas Essentiel.
  assert.equal(institutionSteering(subs, 'palmiers'), false);
  assert.equal(institutionSteering({ palmiers: { offerId: 'institution-steering', since: '' } }, 'palmiers'), true);
});
