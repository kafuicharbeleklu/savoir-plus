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
  // Les outils de l'établissement, pour ses classes : la page ouvre sur la vue d'ensemble.
  assert.match(home, /Espace encadrant Vue d’ensemble Planification Emploi du temps Classes 3/);
  assert.doesNotMatch(home, /Faire vérifier mon identité/);
  assert.match(home, /Avancement du trimestre \d+ % Attendu à ce jour : \d+ %/);
  assert.match(home, /Quiz réussis \d+ %/);
  assert.match(home, /Questions à revoir \d+/);
  assert.match(home, /Classes Le trait marque l’attendu à ce jour/);
  assert.match(home, /Élèves à accompagner/);
  // La planification de ses classes, en lecture : l'établissement la tient.
  const planning = text(renderToStaticMarkup(<TeachingPage {...props('kossi', school, 'planning')} />));
  assert.match(planning, /tenue par l’établissement/);
  assert.doesNotMatch(planning, /Ajouter une période/);
  // L'emploi du temps est une grille.
  const grid = text(renderToStaticMarkup(<TeachingPage {...props('kossi', school, 'timetable')} />));
  assert.match(grid, /Lundi Mardi Mercredi Jeudi Vendredi/);
  // Chaque cours dit sa classe et sa salle.
  assert.match(grid, /Informatique 10 h – 12 h Terminale D · Salle informatique/);
  // Ses classes.
  const list = text(renderToStaticMarkup(<TeachingPage {...props('kossi', school, 'classes')} />));
  assert.match(list, /Mes classes/);
  assert.match(list, /Terminale D Les Palmiers · 10 élèves · 3 modules/);
  assert.match(list, /Initiation aux réseaux Centre Horizon · 3 élèves · 2 modules/);

  const oneClass = text(renderToStaticMarkup(<TeachingPage {...props('kossi', school, 'cl-tle-d')} />));
  assert.match(oneClass, /Terminale D Les Palmiers · Lycée · niveau « encadré »/);
  assert.match(oneClass, /Carte de la classe/);
  assert.match(oneClass, /Protéger ses comptes/);
  assert.match(oneClass, /Questions les moins réussies/);
  assert.match(oneClass, /Question \d · à reprendre/, 'une question sous le seuil est signalée');
  assert.match(oneClass, /Elom Dogbé/);
  assert.match(oneClass, /Préparer la fiche avec l’IA/);
  assert.match(oneClass, /Aucune réponse individuelle n’est montrée/);
  // Une classe qui n'est pas la sienne : l'adresse ne l'ouvre pas, il retombe sur l'accueil de l'espace.
  assert.match(text(renderToStaticMarkup(<TeachingPage {...props('kossi', school, 'cl-cm2')} />)), /Vue d’ensemble/);
});

test('espace encadrant : sans identité vérifiée ni rattachement validé, aucune classe', () => {
  const school = initialSchoolState(TODAY);
  const withPersona = { ...props('kossi', school), user: { ...person('kossi'), id: 'ama', name: 'Ama Dossou' } };
  const pending = text(renderToStaticMarkup(<TeachingPage {...withPersona} />));
  // L'action de rattachement se trouve au titre de la section qu'elle concerne.
  assert.match(pending, /Mes classes Demander un rattachement Aucune classe pour le moment/);
  assert.match(pending, /Les Palmiers Français · expression écrite · demandé le 15 nov\. En attente de l’établissement/);
  // L'établissement valide : la classe apparaît.
  const validated = setMembershipStatus(school, 'mb-ama-palmiers', 'active');
  const active = text(renderToStaticMarkup(<TeachingPage {...withPersona} school={validated} selectedId="classes" />));
  assert.match(active, /Troisième A Les Palmiers · 8 élèves · 1 module/);
  assert.doesNotMatch(active, /Aucune classe pour le moment/);
});

test('espace famille : enfants, page des codes ; fiche d’un enfant', () => {
  const school = initialSchoolState(TODAY);
  const home = text(renderToStaticMarkup(<FamilyPage {...props('akouvi', school)} calendarOf={calendarOf} />));
  assert.match(home, /Espace famille/);
  // Une carte par enfant : qui il est, le titre et la phrase de sa lettre, trois repères ; la carte entière ouvre son suivi.
  assert.match(home, /Elom Dogbé Terminale D · Les Palmiers Une semaine régulière, une séance à rattraper Elom a 1 séance de révision en retard avant « Composition · Mathématiques » \(dans 13 jours\)\./);
  assert.match(home, /1 \/ 3 modules validés 3 jours de révision de suite J-13 Composition · Mathématiques/);
  assert.doesNotMatch(home, /Voir le suivi/, "la carte entière ouvre le suivi");
  // Ni codes ni achats sur la vue d'ensemble : les codes ont leur page (menu « … »), les achats sont dans la Bibliothèque.
  assert.doesNotMatch(home, /PAR-7K3Q-9M2X/);
  assert.doesNotMatch(home, /REC-DEMO-001/);
  assert.doesNotMatch(home, /Kokou Dogbé CM2/, 'Kokou n’est pas rattaché tant que le code n’est pas saisi');
  const codes = text(renderToStaticMarkup(<FamilyPage {...props('akouvi', school, 'codes')} calendarOf={calendarOf} />));
  assert.match(codes, /Codes de rattachement/);
  assert.match(codes, /Créer un code/);
  assert.match(codes, /PAR-7K3Q-9M2X Pour Kokou · valable jusqu’au 22 nov\. Valide/);

  const child = text(renderToStaticMarkup(<FamilyPage {...props('akouvi', school, 'elom')} calendarOf={calendarOf} onWrite={() => {}} />));
  assert.match(child, /Elom Dogbé Terminale D · Les Palmiers · 17 ans/);
  assert.match(child, /La lettre de la semaine · semaine du \d+ nov\. Une semaine régulière, une séance à rattraper Elom a révisé 3 jours de suite\. Elom a 1 séance de révision en retard/);
  assert.match(child, /Proposer la séance/);
  assert.match(child, /1 \/ 3 modules de sa classe validés/);
  assert.match(child, /3 jours de révision de suite/);
  assert.match(child, /J-13 Composition · Mathématiques/);
  assert.match(child, /à rattraper/);
  // Le plan de révision : une ligne par examen, avec les séances faites.
  assert.match(child, /Plan de révision/);
  assert.match(child, /Physique-chimie Composition, dans \d+ jours/);
  assert.match(child, /Révisions · 3 \/ 11/);
  // Sa semaine réunit cours et révisions, jour par jour.
  assert.match(child, /La semaine d’Elom Cours et révisions Lun\. \d+/);
  assert.match(child, /7 h Mathématiques/);
  assert.match(child, /Tenir un budget simple Gestion · 1 500 FCFA Acquis pour Elom/);
  // Akouvi a la formule Famille : les contenus payants de ses enfants sont inclus.
  assert.match(child, /Préparer une réunion utile Communication · 1 000 FCFA Inclus dans la formule Famille/);
  // Sans formule : le contenu s'achète, et le plan de révision et l'emploi du temps renvoient à la formule Famille.
  const free = text(
    renderToStaticMarkup(<FamilyPage {...props('akouvi', school, 'elom')} ext={{ ...ext, subscriptions: {} }} calendarOf={calendarOf} />)
  );
  assert.match(free, /Préparer une réunion utile Communication · 1 000 FCFA Acheter/);
  assert.match(free, /Avec la formule Famille, vous suivez le plan de révision et l’emploi du temps d’Elom\./);
  assert.doesNotMatch(free, /La semaine d’Elom/);
  // Le contenu d'un enseignant de son établissement lui est offert : rien à acheter.
  assert.match(child, /Sauvegarder ses fichiers : la règle 3-2-1 Numérique · 1 000 FCFA Offert par Les Palmiers/);
  assert.match(child, /aucun argent n’est débité/);
  // Un enfant qui n'est pas le sien : l'adresse n'ouvre rien, elle retombe sur l'accueil de l'espace.
  assert.match(text(renderToStaticMarkup(<FamilyPage {...props('akouvi', school, 'tle-01')} calendarOf={calendarOf} />)), /Mes enfants/);
});

test('espace établissement : demandes, classes et niveaux, une classe en détail', () => {
  const school = initialSchoolState(TODAY);
  const home = text(renderToStaticMarkup(<InstitutionPage {...props('palmiers', school)} />));
  // Plus d'en-tête de présentation : ni type, ni ville, ni statut quand l'établissement est vérifié.
  assert.doesNotMatch(home, /Complexe scolaire|Établissement vérifié|Vous validez qui rejoint/);
  assert.match(home, /Vue d’ensemble Planification Emploi du temps Classes 3 Bibliothèque \d+ Enseignants 1 Demandes 2 Avancement du trimestre/);
  // Formule Essentiel : la vue d'ensemble et la planification renvoient à la formule Pilotage ; l'espace s'ouvre sur les classes.
  const essential = { ...ext, subscriptions: { palmiers: { offerId: 'institution-essential', since: '2026-09-01' } } };
  const basic = text(renderToStaticMarkup(<InstitutionPage {...props('palmiers', school)} ext={essential} />));
  assert.match(basic, /Créer une classe Terminale D/);
  const lockedPlanning = text(renderToStaticMarkup(<InstitutionPage {...props('palmiers', school, 'planning')} ext={essential} />));
  assert.match(lockedPlanning, /La planification en diagramme de Gantt fait partie de la formule Pilotage \(35 000 F CFA par mois\)\. Voir les formules/);
  // « Créer une classe » se trouve dans la rubrique des classes.
  assert.match(text(renderToStaticMarkup(<InstitutionPage {...props('palmiers', school, 'classes')} />)), /Créer une classe Terminale D/);
  // La bibliothèque : les contenus de ses enseignants, gratuits pour ses élèves ; un module se donne à une classe.
  const library = text(renderToStaticMarkup(<InstitutionPage {...props('palmiers', school, 'library')} />));
  assert.match(library, /Ne tombez plus dans le piège Module · Kossi Agbo · Troisième A|Ne tombez plus dans le piège Module · Kossi Agbo/);
  assert.match(library, /Sauvegarder ses fichiers : la règle 3-2-1 Module · Kossi Agbo · Terminale D Offert à vos élèves/);
  assert.doesNotMatch(library, /Écrire un e-mail professionnel clair/, 'Ama Dossou n’est pas encore rattachée');
  assert.match(library, /gratuits pour les élèves de l’établissement/);
  // La vue d'ensemble : chiffres clés, avancement des classes face à l'attendu, élèves à accompagner.
  assert.match(home, /Demandes de rattachement 2 1 enseignant · 1 élève · Traiter/);
  assert.match(home, /Avancement du trimestre \d+ %/);
  assert.match(home, /Terminale D 10 élèves · Sauvegarder ses fichiers \d+ % (En avance|Dans les temps|En retard)/);
  assert.match(home, /Élèves à accompagner/);
  assert.match(home, /(Quiz à retenter|lus sur \d+ % attendus)/);
  assert.doesNotMatch(home, /classement/i, 'aucun classement d’élèves');

  // La planification : une ligne par classe, ses séquences, ses révisions, sa composition.
  const planning = text(renderToStaticMarkup(<InstitutionPage {...props('palmiers', school, 'planning')} />));
  assert.match(planning, /Ajouter une période/);
  assert.match(planning, /Terminale D 10 élèves/);
  assert.match(planning, /Sauvegarder ses fichiers/);
  assert.match(planning, /Composition du trimestre/);
  assert.match(planning, /Congés de Noël/);

  // L'emploi du temps est une grille.
  const timetable = text(renderToStaticMarkup(<InstitutionPage {...props('palmiers', school, 'timetable')} />));
  assert.match(timetable, /Lundi Mardi Mercredi Jeudi Vendredi Samedi/);

  // Les demandes ont leur rubrique, que l'adresse peut ouvrir directement.
  const requests = text(renderToStaticMarkup(<InstitutionPage {...props('palmiers', school, 'requests')} />));
  assert.match(requests, /Ama Dossou Enseignant · Français · expression écrite · Troisième A · demande du 15 nov\. Accepter/);
  assert.match(requests, /Sena Akakpo Élève · Terminale D · demande du 16 nov\. Accepter/);

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
  // Plus de mention de statut : la ligne en attente est en gris, la précision n'est lue qu'au survol et par les lecteurs d'écran.
  assert.match(queue, /Mawuena Kpodar — En attente Parent ou tuteur · Passeport · KYC-004 · demande du 16 nov\. Accepter/);
  assert.match(queue, /Yawo Amouzou — En attente Encadrant · Carte nationale d’identité · KYC-003 · demande du 15 nov\. Accepter/);
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
