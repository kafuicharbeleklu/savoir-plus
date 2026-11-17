import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildRevisionPlan, demoCalendarState, resolveEvents, type Day } from '../src/calendar';
import type { Profile } from '../src/data';
import { resolveCommunityDirectory } from '../src/personas';
import { setMembershipStatus, submitIdentity, type SchoolState } from '../src/school';
import { SCHOOL_PERSONAS, initialSchoolState } from '../src/seedSchool';
import { buildDynamicCatalog, initialExtendedState } from '../src/wireframeData';
import { FamilyPage } from '../src/pages/school/FamilyPage';
import { GuardianGate } from '../src/pages/school/GuardianGate';
import { IdentityPanel } from '../src/pages/school/IdentityPanel';
import { InstitutionPage } from '../src/pages/school/InstitutionPage';
import { TeachingPage } from '../src/pages/school/TeachingPage';
import { AdminIdentityView } from '../src/pages/governance/Identity';

const TODAY: Day = '2026-11-17';
// Les trois personnages d'origine (src/data.ts ne se charge que dans le navigateur) et les quatre nouveaux.
const base = (id: string, name: string, role: string): Profile => ({ id, name, role, initials: name.slice(0, 2).toUpperCase(), color: 'peach', bio: '' });
const profiles: Profile[] = [
  base('afi', 'Afi Mensah', 'Apprenante'),
  base('kossi', 'Kossi Agbo', 'Créateur & Mentor'),
  base('nadege', 'Nadège Koffi', 'Modération & Gouvernance'),
  ...SCHOOL_PERSONAS
];
const ext = initialExtendedState();
const people = resolveCommunityDirectory(profiles, ext);
const catalog = buildDynamicCatalog(ext);
const person = (id: string) => profiles.find((p) => p.id === id)!;
const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

const props = (uid: string, school: SchoolState, selectedId = '') => ({
  school,
  saveSchool: () => {},
  ext,
  user: person(uid),
  people,
  today: TODAY,
  catalog,
  selectedId,
  nav: () => {},
  setToast: () => {}
});

const calendarOf = (uid: string) => {
  const state = demoCalendarState(uid, TODAY);
  const events = resolveEvents(state);
  return { events, plan: buildRevisionPlan({ events, settings: state.settings, log: state.log, today: TODAY }), log: state.log };
};

test('écran d’attente du code parental : un seul champ, aucune autre porte', () => {
  const html = renderToStaticMarkup(
    <GuardianGate user={person('kokou')} school={initialSchoolState(TODAY)} today={TODAY} onActivated={() => {}} onExit={() => {}} onSwitchAccount={() => {}} />
  );
  const visible = text(html);
  assert.match(visible, /Bonjour Kokou, il te manque un code/);
  assert.match(visible, /Avant 12 ans/);
  assert.equal((html.match(/<input/g) || []).length, 1);
  assert.match(visible, /Ouvrir mon compte/);
});

test('espace encadrant : intitulé, classes, questions à revoir, cours de la semaine', () => {
  const school = initialSchoolState(TODAY);
  const home = text(renderToStaticMarkup(<TeachingPage {...props('kossi', school)} />));
  assert.match(home, /Espace encadrant Enseignant · 2 établissements/);
  assert.match(home, /Identité vérifiée/);
  assert.match(home, /Terminale D Les Palmiers · 10 élèves · 3 modules/);
  assert.match(home, /Initiation aux réseaux Centre Horizon · 3 élèves · 2 modules/);
  assert.match(home, /Mes cours de la semaine/);
  assert.match(home, /Informatique 10 h – 12 h · Terminale D · Salle informatique/);

  const oneClass = text(renderToStaticMarkup(<TeachingPage {...props('kossi', school, 'cl-tle-d')} />));
  assert.match(oneClass, /Terminale D Les Palmiers · Lycée · niveau « encadré »/);
  assert.match(oneClass, /Où la classe bute/);
  assert.match(oneClass, /Protéger ses comptes/);
  assert.match(oneClass, /Question 2 : \d+ %/, 'la question la moins réussie est signalée');
  assert.match(oneClass, /Elom Dogbé 1 module validé sur 3/);
  assert.match(oneClass, /Aucune réponse individuelle n’est montrée/);
  // Une classe qui n'est pas la sienne : l'adresse ne l'ouvre pas, il retombe sur l'accueil de l'espace.
  assert.match(text(renderToStaticMarkup(<TeachingPage {...props('kossi', school, 'cl-cm2')} />)), /Mes classes/);
});

test('espace encadrant : sans identité vérifiée ni rattachement validé, aucune classe', () => {
  const school = initialSchoolState(TODAY);
  const withPersona = { ...props('kossi', school), user: { ...person('kossi'), id: 'ama', name: 'Ama Dossou' } };
  const pending = text(renderToStaticMarkup(<TeachingPage {...withPersona} />));
  assert.match(pending, /Encadreur indépendant vérifié/);
  assert.match(pending, /Aucune classe pour le moment/);
  assert.match(pending, /Les Palmiers Français · expression écrite · demandé le 15 nov\. En attente de l’établissement/);
  // L'établissement valide : la classe apparaît.
  const validated = setMembershipStatus(school, 'mb-ama-palmiers', 'active');
  const active = text(renderToStaticMarkup(<TeachingPage {...withPersona} school={validated} />));
  assert.match(active, /Enseignant · Les Palmiers/);
  assert.match(active, /Troisième A Les Palmiers · 8 élèves · 1 module/);
});

test('espace famille : enfants, code en attente, achats ; fiche d’un enfant', () => {
  const school = initialSchoolState(TODAY);
  const home = text(renderToStaticMarkup(<FamilyPage {...props('akouvi', school)} calendarOf={calendarOf} />));
  assert.match(home, /Espace famille/);
  assert.match(home, /Créer un code/);
  assert.match(home, /Elom Dogbé Terminale D · Les Palmiers · 1 module validé sur 3/);
  assert.match(home, /Révisions en retard/);
  assert.match(home, /PAR-7K3Q-9M2X Pour Kokou · valable jusqu’au 22 nov\. Valide/);
  assert.match(home, /Tenir un budget simple 1 500 FCFA · pour Elom Dogbé · 11 nov\. · reçu REC-DEMO-001 Simulé/);
  assert.doesNotMatch(home, /Kokou Dogbé CM2/, 'Kokou n’est pas rattaché tant que le code n’est pas saisi');

  const child = text(renderToStaticMarkup(<FamilyPage {...props('akouvi', school, 'elom')} calendarOf={calendarOf} />));
  assert.match(child, /Elom Dogbé Terminale D · Les Palmiers · 17 ans/);
  assert.match(child, /1 \/ 3 Modules validés/);
  assert.match(child, /3 Jours de révision de suite/);
  assert.match(child, /Composition · Physique-chimie/);
  assert.match(child, /Mathématiques 7 h – 9 h · M\. Amétépé · Salle 12/);
  assert.match(child, /Tenir un budget simple Gestion · 1 500 FCFA Acquis pour Elom/);
  assert.match(child, /Préparer une réunion utile Communication · 1 000 FCFA Acheter/);
  assert.match(child, /aucun argent n’est débité/);
  // Un enfant qui n'est pas le sien : l'adresse n'ouvre rien, elle retombe sur l'accueil de l'espace.
  assert.match(text(renderToStaticMarkup(<FamilyPage {...props('akouvi', school, 'tle-01')} calendarOf={calendarOf} />)), /Mes enfants/);
});

test('espace établissement : demandes, classes et niveaux, une classe en détail', () => {
  const school = initialSchoolState(TODAY);
  const home = text(renderToStaticMarkup(<InstitutionPage {...props('palmiers', school)} />));
  assert.match(home, /Les Palmiers Complexe scolaire \(démonstration\) · Lomé/);
  assert.match(home, /Établissement vérifié/);
  assert.match(home, /Demandes 2 Classes 3 Enseignants 1 Emploi du temps/);
  assert.match(home, /Ama Dossou Enseignant · Français · expression écrite · Troisième A · demande du 15 nov\. Accepter/);
  assert.match(home, /Sena Akakpo Élève · Terminale D · demande du 16 nov\. Accepter/);

  const oneClass = text(renderToStaticMarkup(<InstitutionPage {...props('palmiers', school, 'cl-tle-d')} />));
  assert.match(oneClass, /Terminale D Lycée · 2026-2027 · niveau « encadré »/);
  assert.match(oneClass, /Avancement par module/);
  assert.match(oneClass, /Protéger ses comptes \d+ élèves? (a|ont) validé sur 10/);
  assert.match(oneClass, /pas ce qu’ils font ailleurs sur SAVOIR\+/);
  // La classe d'un autre établissement ne s'ouvre pas.
  assert.match(text(renderToStaticMarkup(<InstitutionPage {...props('palmiers', school, 'cl-reseaux')} />)), /Demandes 2/);
});

test('vérification d’identité : demande simulée côté membre, file côté Gouvernance', () => {
  const school = initialSchoolState(TODAY);
  const panel = (uid: string, state: SchoolState) =>
    renderToStaticMarkup(<IdentityPanel school={state} saveSchool={() => {}} userId={uid} today={TODAY} setToast={() => {}} />);

  const none = panel('afi', school);
  assert.match(text(none), /Identité non vérifiée/);
  assert.match(text(none), /Choisir un fichier Aucun fichier choisi/);
  assert.match(text(none), /rien n’est envoyé ni conservé/);
  assert.match(none, /type="file"/);
  assert.doesNotMatch(none, /capture=/, 'l’appareil photo n’est jamais demandé');

  const pending = text(panel('afi', submitIdentity(school, 'afi', 'passeport', TODAY)));
  assert.match(pending, /Vérification en cours/);
  assert.match(pending, /Demande KYC-005 déposée le 17 nov\. \(passeport\)/);
  assert.doesNotMatch(pending, /Choisir un fichier/);

  assert.match(text(panel('akouvi', school)), /Identité vérifiée/);
  assert.match(text(panel('akouvi', school)), /avant de rattacher un enfant/);

  const queue = text(
    renderToStaticMarkup(
      <AdminIdentityView ext={{ ...ext, school }} updateExt={() => {}} nav={() => {}} user={person('nadege')} setToast={() => {}} people={people} today={TODAY} />
    )
  );
  assert.match(queue, /Identités/);
  assert.match(queue, /À traiter 2 Traitées 2/);
  assert.match(queue, /Mawuena Kpodar Parent ou tuteur · Passeport · KYC-004 · demande du 16 nov\. Accepter/);
  assert.match(queue, /Yawo Amouzou Encadrant · Carte nationale d’identité · KYC-003 · demande du 15 nov\. Accepter/);
  // Vue « Auditeur » : lecture seule, aucune décision possible.
  const audit = text(
    renderToStaticMarkup(
      <AdminIdentityView
        ext={{ ...ext, school, adminActiveRole: 'Auditeur' }}
        updateExt={() => {}}
        nav={() => {}}
        user={person('nadege')}
        setToast={() => {}}
        people={people}
        today={TODAY}
      />
    )
  );
  assert.doesNotMatch(audit, /Accepter/);
  assert.match(audit, /En attente/);
});
