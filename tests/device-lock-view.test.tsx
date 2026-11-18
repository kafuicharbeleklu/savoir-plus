import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { demoCalendarState, resolveEvents, buildRevisionPlan } from '../src/calendar';
import type { Profile } from '../src/data';
import { addUsage, defaultRules, lockState, requestOfDay, requestTime, setRules } from '../src/deviceLock';
import { resolveCommunityDirectory } from '../src/personas';
import { redeemGuardianCode } from '../src/school';
import { SCHOOL_PERSONAS, initialSchoolState } from '../src/seedSchool';
import { buildDynamicCatalog, initialExtendedState } from '../src/wireframeData';
import { DeviceLockPanel, TimeRequestBanner } from '../src/pages/school/DeviceLockPanel';
import { DeviceLockScreen } from '../src/pages/school/DeviceLockScreen';
import { FamilyPage } from '../src/pages/school/FamilyPage';

const TODAY = '2026-11-17';
const at = (hh: number, mm = 0) => new Date(2026, 10, 17, hh, mm);
const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const kokou = SCHOOL_PERSONAS.find((p) => p.id === 'kokou')!;
const opened = () => {
  const result = redeemGuardianCode(initialSchoolState(TODAY), 'PAR-7K3Q-9M2X', 'kokou', TODAY);
  return result.ok ? result.school : initialSchoolState(TODAY);
};
const rules = { ...defaultRules('kokou'), weekdayMinutes: 45, weekendMinutes: 90, weekdayFrom: '16:00', weekdayTo: '20:00' };
const screen = (school: ReturnType<typeof opened>, now: Date) =>
  text(
    renderToStaticMarkup(
      <DeviceLockScreen
        user={kokou}
        lock={lockState(school, 'kokou', now)}
        rules={rules}
        request={requestOfDay(school, 'kokou', TODAY)}
        onRequest={() => {}}
        onExit={() => {}}
        onSwitchAccount={() => {}}
      />
    )
  );

test('écran de pause : pourquoi, quand cela rouvre, ses règles ; une demande de temps', () => {
  let school = setRules(opened(), rules);
  const early = screen(school, at(8));
  assert.match(early, /Ce n’est pas l’heure de SAVOIR\+ SAVOIR\+ rouvre à 16 h\./);
  assert.match(early, /Tes règles, Kokou : 45 min en semaine, 1 h 30 le week-end ; de 16 h à 20 h en semaine, toute la journée le week-end\./);
  assert.doesNotMatch(early, /Demander plus de temps/, 'hors plage, pas de négociation : la routine');

  school = addUsage(school, 'kokou', TODAY, 45);
  const done = screen(school, at(17));
  assert.match(done, /Ta séance du jour est terminée Tu as utilisé tes 45 min d’aujourd’hui\. SAVOIR\+ rouvre demain à 16 h\./);
  assert.match(done, /Demander plus de temps/);
  school = requestTime(school, 'kokou', at(17, 2));
  assert.match(screen(school, at(17, 3)), /Demande envoyée à 17 h 02\. Ton parent va te répondre\./);

  school = setRules(school, { ...rules, lockedNow: true });
  assert.match(screen(school, at(17, 4)), /SAVOIR\+ est en pause Ton parent a mis SAVOIR\+ en pause\. Si tu en as besoin, parlez-en ensemble\./);
});

test('espace famille : le verrouillage d’un enfant de moins de 12 ans se règle sur sa fiche', () => {
  let school = setRules(opened(), rules);
  school = addUsage(school, 'kokou', TODAY, 45);
  school = requestTime(school, 'kokou', at(17, 2));
  const panel = text(
    renderToStaticMarkup(
      <DeviceLockPanel school={school} saveSchool={() => {}} childId="kokou" firstName="Kokou" now={at(17, 5)} setToast={() => {}} />
    )
  );
  assert.match(panel, /Verrouillage Temps du jour écoulé 45 min sur SAVOIR\+ aujourd’hui, sur 45 min Mettre en pause/);
  // La demande en attente : un bandeau en haut de la fiche, là où mène l'alerte du parent.
  const banner = text(
    renderToStaticMarkup(<TimeRequestBanner school={school} saveSchool={() => {}} childId="kokou" firstName="Kokou" now={at(17, 5)} setToast={() => {}} />)
  );
  assert.match(banner, /Kokou demande plus de temps · demande de 17 h 02, son temps du jour est écoulé\. Accorder 15 min Accorder 30 min Refuser/);
  assert.equal(renderToStaticMarkup(<TimeRequestBanner school={opened()} saveSchool={() => {}} childId="kokou" firstName="Kokou" now={at(17, 5)} setToast={() => {}} />), '');
  assert.match(panel, /Temps par jour En semaine : 45 min · Le week-end : 1 h 30/);
  assert.match(panel, /Plage horaire En semaine : de 16 h à 20 h · Le week-end : toute la journée/);
  assert.match(panel, /Ce qui reste ouvert Modules et bibliothèque, fil d’entraide, messagerie/);
  assert.match(panel, /pas au reste du téléphone ou de la tablette/);

  // La fiche de Kokou porte ce réglage ; celle d'Elom (17 ans) non.
  const ext = initialExtendedState();
  const base = (id: string, name: string): Profile => ({ id, name, role: '', initials: name.slice(0, 2), color: 'peach', bio: '' });
  const people = resolveCommunityDirectory([base('afi', 'Afi Mensah'), base('kossi', 'Kossi Agbo'), base('nadege', 'Nadège Koffi'), ...SCHOOL_PERSONAS], ext);
  const calendarOf = (uid: string) => {
    const state = demoCalendarState(uid, TODAY);
    const events = resolveEvents(state);
    return { events, plan: buildRevisionPlan({ events, settings: state.settings, log: state.log, today: TODAY }), log: state.log };
  };
  const page = (childId: string) =>
    text(
      renderToStaticMarkup(
        <FamilyPage
          school={school}
          saveSchool={() => {}}
          ext={ext}
          user={SCHOOL_PERSONAS.find((p) => p.id === 'akouvi')!}
          people={people}
          today={TODAY}
          catalog={buildDynamicCatalog(ext)}
          selectedId={childId}
          nav={() => {}}
          setToast={() => {}}
          calendarOf={calendarOf}
        />
      )
    );
  assert.match(page('kokou'), /Verrouillage/);
  assert.doesNotMatch(page('elom'), /Verrouillage/);
});
