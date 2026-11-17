import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  buildRevisionPlan,
  demoCalendarState,
  emptyCalendarState,
  resolveEvents,
  type CalendarUserState,
  type Day
} from '../src/calendar';
import { CalendarCard } from '../src/components/CalendarMonth';
import { CalendarPage } from '../src/pages/CalendarPage';

const TODAY: Day = '2026-11-17';
const MODULES = {
  phishing: { title: 'Ne tombez plus dans le piège', state: 'started' as const },
  comptes: { title: 'Sécuriser ses comptes', state: 'new' as const },
  reseaux: { title: 'Comprendre les réseaux', state: 'started' as const }
};

const viewOf = (state: CalendarUserState) => {
  const events = resolveEvents(state);
  const plan = buildRevisionPlan({ events, settings: state.settings, log: state.log, today: TODAY, modules: MODULES });
  return { events, plan };
};

const page = (state: CalendarUserState, initialTarget?: string) => {
  const { events, plan } = viewOf(state);
  return renderToStaticMarkup(
    <CalendarPage
      state={state}
      events={events}
      plan={plan}
      today={TODAY}
      initialTarget={initialTarget}
      moduleOptions={[{ id: 'reseaux', title: 'Comprendre les réseaux' }]}
      onChange={() => {}}
      onOpenModule={() => {}}
      setToast={() => {}}
    />
  );
};

/** Texte visible, sans balises. */
const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

test('carte Calendrier de l’accueil : mois en cours, séance du jour, prochain examen, état du plan', () => {
  const state = demoCalendarState('afi', TODAY);
  const { events, plan } = viewOf(state);
  const html = renderToStaticMarkup(<CalendarCard today={TODAY} events={events} plan={plan} log={state.log} onOpen={() => {}} />);
  const visible = text(html);
  assert.match(visible, /Calendrier/);
  assert.match(visible, /Novembre 2026/);
  assert.match(visible, /Ouvrir le calendrier/);
  // Quatre repères ronds : le chiffre est dans la pastille, l'explication dans son nom accessible.
  const gauges = [...html.matchAll(/class="cal-gauge is-(\w+) is-(\w+)" aria-label="([^"]+)"[^>]*>.*?<b[^>]*>([^<]*)<\/b>/g)].map((m) => ({
    kind: m[1],
    tone: m[2],
    label: m[3],
    value: m[4]
  }));
  assert.deepEqual(gauges, [
    { kind: 'flame', tone: 'warm', label: 'Série : 2 jours de suite avec une séance faite', value: '2' },
    { kind: 'pad', tone: 'brand', label: 'Aujourd’hui : 1 séance à faire', value: '1' },
    { kind: 'page', tone: 'brand', label: 'Prochain examen dans 10 jours : Évaluation · Sécurité numérique', value: '10' },
    { kind: 'alert', tone: 'danger', label: '1 séance en retard, replacée dans le plan', value: '1' }
  ]);
  // Plus de lignes « libellé : valeur » dans la carte.
  assert.doesNotMatch(html, /rail-stat-row/);
  // 42 jours affichés (six semaines en novembre 2026), un seul marqué « aujourd'hui ».
  assert.equal((html.match(/class="cal-day[ "]/g) || []).length, 42);
  assert.equal((html.match(/aria-current="date"/g) || []).length, 1);
  assert.match(html, /aria-label="Mardi 17 novembre[^"]*"/);
  // Le jour de l'examen porte son titre pour les lecteurs d'écran.
  assert.match(html, /aria-label="Vendredi 27 novembre : Évaluation · Sécurité numérique"/);
});

test('carte Calendrier : sans examen ni séance, les quatre repères sont gris', () => {
  const state = emptyCalendarState();
  const { events, plan } = viewOf(state);
  const html = renderToStaticMarkup(<CalendarCard today={TODAY} events={events} plan={plan} log={state.log} onOpen={() => {}} />);
  assert.equal((html.match(/class="cal-gauge is-\w+ is-off"/g) || []).length, 4);
  assert.match(html, /aria-label="Série : aucune séance faite hier ni aujourd’hui"/);
  assert.match(html, /aria-label="Aujourd’hui : aucune séance prévue"/);
  assert.match(html, /aria-label="Aucun examen à venir"/);
  assert.match(html, /aria-label="Aucune séance en retard"/);
});

test('page Calendrier · agenda : mois, journée choisie, dates à venir et source du calendrier scolaire', () => {
  const visible = text(page(demoCalendarState('afi', TODAY)));
  assert.match(visible, /Ajouter une date/);
  assert.match(visible, /Agenda/);
  assert.match(visible, /Plan de révision/);
  assert.match(visible, /Novembre 2026/);
  assert.match(visible, /Aujourd’hui · mardi 17 novembre/);
  assert.match(visible, /Dates à venir/);
  assert.match(visible, /Évaluation · Sécurité numérique/);
  assert.match(visible, /Examen · dans 10 jours · 2 \/ 8 séances/);
  assert.match(visible, /Calendrier scolaire 2026-2027 \(Togo\)/);
  assert.match(visible, /Mes réglages/);
  assert.match(visible, /En semaine 45 min/);
  assert.match(visible, /Le week-end 1 h 30/);

  // Un jour de congé ouvert par l'adresse : la journée choisie affiche le congé.
  const christmas = text(page(demoCalendarState('afi', TODAY), '2026-12-25'));
  assert.match(christmas, /Décembre 2026/);
  assert.match(christmas, /Vendredi 25 décembre/);
  assert.match(christmas, /Congés de Noël/);
  assert.match(christmas, /Congés · 24 déc\. – 3 janv\. · 11 jours/);
});

test('page Calendrier · plan : chiffres clés, examens, séances expliquées', () => {
  const visible = text(page(demoCalendarState('afi', TODAY), 'plan'));
  assert.match(visible, /Séances à venir/);
  assert.match(visible, /Faites ces 7 derniers jours/);
  assert.match(visible, /Dans 10 jours Prochain examen/);
  assert.match(visible, /Évaluation · Réseaux informatiques/);
  // Une séance sur un module nomme le module à suivre.
  assert.match(visible, /Réseaux informatiques · Module « Comprendre les réseaux »/);
  assert.match(visible, /séance 1 sur 11/);
  assert.match(visible, /Tout afficher \(\d+\)/);

  // Sans examen : un état vide qui explique quoi faire, pas un tableau de zéros.
  const empty = text(page(emptyCalendarState(), 'plan'));
  assert.match(empty, /Aucun examen à préparer/);
  assert.match(empty, /Ajouter un examen/);
  assert.doesNotMatch(empty, /Séances à venir/);
});
