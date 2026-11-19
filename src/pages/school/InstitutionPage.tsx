/**
 * Espace établissement : vue d'ensemble chiffrée, planification en diagramme de Gantt, grille
 * d'emploi du temps, classes et leur niveau de restriction, bibliothèque, enseignants, demandes.
 * Centré sur l'apprentissage : ni appel, ni notes, ni bulletins. Un établissement n'est pas une
 * personne : il n'a ni XP, ni progression, ni fil ; cet espace est son accueil.
 */
import React, { useEffect, useState } from 'react';
import { BookOpen, FileText, Layers, Users } from 'lucide-react';
import { formatDayShort } from '../../calendar';
import {
  RESTRICTION_DETAIL,
  RESTRICTION_LABEL,
  accountOf,
  addClass,
  educatorStanding,
  institutionOf,
  libraryOf,
  priceOf,
  setClassRestriction,
  setMembershipStatus,
  slotConflict,
  studentsOfClass,
  toggleClassModule,
  type Membership,
  type RestrictionLevel,
  type SchoolClass,
  type TimetableSlot
} from '../../school';
import { InlineMeter } from '../../components/Charts';
import {
  ActionMenu,
  EmptyState,
  IconTile,
  ListCard,
  ListRow,
  Modal,
  PageHeader,
  RadioList,
  Select,
  StatusDot,
  Tabs
} from '../../components/ui';
import { InstitutionOverview, InstitutionPlanning, TimetablePanel } from './InstitutionBoard';
import { institutionSteering } from '../../offers';
import { ofName } from '../../french';
import { LearnerModal, authorIdOf, clock, followUp, followUpSummary, memberName, moduleTitle, plural, weekdayLabel, type SchoolPageProps } from './shared';

type TabId = 'overview' | 'planning' | 'timetable' | 'classes' | 'library' | 'teachers' | 'requests';
const TAB_IDS: TabId[] = ['overview', 'planning', 'timetable', 'classes', 'library', 'teachers', 'requests'];
const TYPE_LABEL: Record<string, string> = { module: 'Module', resource: 'Ressource', path: 'Parcours' };

const LEVELS: RestrictionLevel[] = [1, 2, 3];
const HOURS = ['07:00', '08:00', '09:00', '09:15', '10:00', '11:00', '11:15', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '18:30', '19:00', '20:00', '20:30'];

export function InstitutionPage({ school, saveSchool, ext, user, people, today, catalog, selectedId, nav, setToast }: SchoolPageProps) {
  const institution = institutionOf(school, accountOf(school, user.id).institutionId);
  // L'adresse peut ouvrir une rubrique directement : « institution/requests », « institution/planning »…
  // Formule Pilotage (ou Réseau) : vue d'ensemble et planification en diagramme de Gantt. Sinon, l'espace s'ouvre sur les classes.
  const steering = institutionSteering(ext.subscriptions, user.id);
  const [tab, setTab] = useState<TabId>((TAB_IDS as string[]).includes(selectedId) ? (selectedId as TabId) : steering ? 'overview' : 'classes');
  const [classOpen, setClassOpen] = useState(false);
  const [levelFor, setLevelFor] = useState<SchoolClass | null>(null);
  const [learnerId, setLearnerId] = useState<string | null>(null);
  const [slotOpen, setSlotOpen] = useState(false);
  const [timetableClass, setTimetableClass] = useState('');
  // Un lien vers une rubrique (barre de gauche, profil) l'ouvre aussi quand la page est déjà affichée.
  useEffect(() => {
    if ((TAB_IDS as string[]).includes(selectedId)) setTab(selectedId as TabId);
  }, [selectedId]);

  if (!institution) {
    return (
      <ListCard>
        <EmptyState title="Aucun établissement rattaché à ce compte" />
      </ListCard>
    );
  }

  const classes = school.classes.filter((c) => c.institutionId === institution.id);
  const members = school.memberships.filter((m) => m.institutionId === institution.id);
  const requests = members.filter((m) => m.status === 'pending');
  const teachers = members.filter((m) => m.role === 'teacher' && m.status === 'active');
  const className = (id: string) => classes.find((c) => c.id === id)?.name || 'Classe';
  const openClass = classes.find((c) => c.id === selectedId);
  const library = libraryOf(school, institution.id, catalog, (item) => authorIdOf(people, item));

  const decide = (m: Membership, status: 'active' | 'declined') => {
    const next = setMembershipStatus(school, m.id, status);
    saveSchool(next);
    const name = memberName(m.userId, people);
    if (status === 'declined') {
      setToast(`Demande ${ofName(name)} refusée`);
    } else if (m.role === 'teacher') {
      const standing = educatorStanding(next, m.userId);
      setToast(
        standing.status === 'teacher'
          ? `${name} devient « ${standing.label} »`
          : `Rattachement validé. ${name} deviendra enseignant une fois son identité vérifiée.`
      );
    } else {
      setToast(`${name} rejoint ${m.classIds.map(className).join(', ')}`);
    }
  };

  /* ---------------------------------------------------------------- Une classe */
  if (openClass) {
    const students = studentsOfClass(school, openClass.id);
    return (
      <div className="sc-page">
        <PageHeader
          back={{ label: institution.name, onClick: () => nav('institution') }}
          title={openClass.name}
          subtitle={`${openClass.level} · ${openClass.year} · niveau « ${RESTRICTION_LABEL[openClass.restriction].toLowerCase()} »`}
        />
        <div className="ui-section-title">
          <h2>Avancement par module</h2>
        </div>
        <ListCard label="Avancement de la classe par module">
          {openClass.moduleIds.length === 0 ? (
            <EmptyState title="Aucun module donné à cette classe" />
          ) : (
            openClass.moduleIds.map((moduleId) => {
              const rows = students.map((uid) => followUp(ext, catalog, uid, moduleId));
              const average = rows.length ? Math.round(rows.reduce((sum, r) => sum + r.percent, 0) / rows.length) : 0;
              const validated = rows.filter((r) => r.quiz === 'passed').length;
              return (
                <ListRow
                  key={moduleId}
                  leading={<IconTile tone="brand">{<Users size={20} aria-hidden="true" />}</IconTile>}
                  title={moduleTitle(catalog, moduleId)}
                  meta={`${plural(validated, 'élève a validé', 'élèves ont validé')} sur ${students.length}`}
                  trailing={<InlineMeter value={average} />}
                />
              );
            })
          )}
        </ListCard>
        <div className="ui-section-title">
          <h2>Élèves</h2>
        </div>
        <ListCard label={`Élèves de ${openClass.name}`}>
          {students.length === 0 ? (
            <EmptyState title="Aucun élève dans cette classe" />
          ) : (
            students.map((uid) => (
              <ListRow
                key={uid}
                leading={<span className="sc-initial" aria-hidden="true">{memberName(uid, people).charAt(0)}</span>}
                title={memberName(uid, people)}
                meta={followUpSummary(openClass.moduleIds.map((id) => followUp(ext, catalog, uid, id)))}
                onClick={() => setLearnerId(uid)}
              />
            ))
          )}
        </ListCard>
        <p className="sc-note">Vous voyez l’activité de vos élèves sur les modules de leurs classes, pas ce qu’ils font ailleurs sur SAVOIR+.</p>
        {learnerId && (
          <LearnerModal
            name={memberName(learnerId, people)}
            subtitle={`${openClass.name} · ${institution.name}`}
            rows={openClass.moduleIds.map((id) => followUp(ext, catalog, learnerId, id))}
            onClose={() => setLearnerId(null)}
          />
        )}
      </div>
    );
  }

  /* ---------------------------------------------------------------- Accueil de l'espace */
  const shownClassId = timetableClass || classes[0]?.id || '';
  const slots = school.timetable.filter((s) => s.classId === shownClassId).sort((a, b) => a.weekday - b.weekday || a.start.localeCompare(b.start));

  return (
    <div className="sc-page">
      <PageHeader title={institution.name} />

      {/* Rien à dire quand tout est en ordre : le bandeau n'apparaît que tant que la vérification est en cours. */}
      {!institution.verified && (
        <section className="sc-status" aria-label="Statut de l’établissement">
          <StatusDot tone="warn">Vérification en cours</StatusDot>
          <p>Vos classes et vos rattachements seront visibles des membres une fois l’établissement vérifié.</p>
        </section>
      )}

      <Tabs<TabId>
        label="Rubriques de l’établissement"
        value={tab}
        onChange={(id) => {
          setTab(id);
          nav('institution', id === 'overview' ? '' : id);
        }}
        items={[
          { id: 'overview', label: 'Vue d’ensemble' },
          { id: 'planning', label: 'Planification' },
          { id: 'timetable', label: 'Emploi du temps' },
          { id: 'classes', label: 'Classes', count: classes.length },
          { id: 'library', label: 'Bibliothèque', count: library.length },
          { id: 'teachers', label: 'Enseignants', count: teachers.length },
          { id: 'requests', label: 'Demandes', count: requests.length || undefined }
        ]}
      />

      {(tab === 'overview' || tab === 'planning') && !steering && (
        <ListCard label="Réservé à la formule Pilotage">
          <EmptyState
            title={tab === 'overview' ? 'Vue d’ensemble' : 'Planification du trimestre'}
            text={
              tab === 'overview'
                ? 'La vue d’ensemble et les élèves à accompagner font partie de la formule Pilotage (35 000 F CFA par mois).'
                : 'La planification en diagramme de Gantt fait partie de la formule Pilotage (35 000 F CFA par mois).'
            }
            action={{ label: 'Voir les formules', onClick: () => nav('info', 'pricing/institution') }}
          />
        </ListCard>
      )}

      {tab === 'overview' && steering && (
        <InstitutionOverview
          data={{ school, ext, catalog, people, today, classes }}
          institutionId={institution.id}
          teachers={teachers}
          requests={requests}
          saveSchool={saveSchool}
          onOpenClass={(id) => nav('institution', id)}
          onOpenLearner={setLearnerId}
          onShowRequests={() => nav('institution', 'requests')}
          onOpenPlanning={() => nav('institution', 'planning')}
        />
      )}

      {tab === 'planning' && steering && <InstitutionPlanning data={{ school, ext, catalog, people, today, classes }} saveSchool={saveSchool} setToast={setToast} />}

      {tab === 'requests' && (
        <ListCard label="Demandes de rattachement">
          {requests.length === 0 ? (
            <EmptyState title="Aucune demande en attente" text="Les demandes des enseignants et des élèves qui veulent rejoindre l’établissement arrivent ici." />
          ) : (
            requests.map((m) => {
              const name = memberName(m.userId, people);
              const identity = accountOf(school, m.userId).identity;
              return (
                <ListRow
                  key={m.id}
                  leading={<span className="sc-initial" aria-hidden="true">{name.charAt(0)}</span>}
                  title={name}
                  meta={[
                    m.role === 'teacher' ? `Enseignant · ${m.subject || 'matière à préciser'}` : 'Élève',
                    m.classIds.map(className).join(', ') || 'classe à définir',
                    `demande du ${formatDayShort(m.requestedOn)}`
                  ].join(' · ')}
                  trailing={
                    <>
                      {m.role === 'teacher' && identity !== 'verified' && <StatusDot tone="warn">Identité non vérifiée</StatusDot>}
                      <button type="button" className="li-text-link" onClick={() => decide(m, 'active')}>
                        Accepter
                      </button>
                      <ActionMenu label={`Plus d’actions pour ${name}`} items={[{ label: 'Refuser la demande', danger: true, onSelect: () => decide(m, 'declined') }]} />
                    </>
                  }
                />
              );
            })
          )}
        </ListCard>
      )}

      {tab === 'classes' && (
        <>
          {/* L'action de la rubrique, au-dessus de sa liste (la ligne d'onglets est pleine). */}
          <div className="sc-tab-actions">
            <button type="button" className="primary ui-btn-sm" onClick={() => setClassOpen(true)}>
              Créer une classe
            </button>
          </div>
          <ListCard label="Classes de l’établissement">
            {classes.length === 0 ? (
              <EmptyState title="Aucune classe" text="Créez une classe pour y rattacher des élèves et des enseignants." />
            ) : (
              classes.map((c) => {
                const count = studentsOfClass(school, c.id).length;
                const teacherCount = teachers.filter((t) => t.classIds.includes(c.id)).length;
                return (
                  <ListRow
                    key={c.id}
                    leading={<IconTile tone="brand">{<Users size={20} aria-hidden="true" />}</IconTile>}
                    title={c.name}
                    meta={`${c.level} · ${plural(count, 'élève', 'élèves')} · ${plural(teacherCount, 'enseignant', 'enseignants')} · niveau « ${RESTRICTION_LABEL[c.restriction].toLowerCase()} »`}
                    onClick={() => nav('institution', c.id)}
                    trailing={<ActionMenu label={`Plus d’actions pour ${c.name}`} items={[{ label: 'Modifier le niveau de restriction', onSelect: () => setLevelFor(c) }]} />}
                  />
                );
              })
            )}
          </ListCard>
        </>
      )}

      {tab === 'library' && (
        <>
          <ListCard label="Bibliothèque de l’établissement">
            {library.length === 0 ? (
              <EmptyState
                title="Aucun contenu pour le moment"
                text="Les contenus que vos enseignants publient sur SAVOIR+ s’ajoutent ici, gratuits pour vos élèves."
              />
            ) : (
              library.map((item) => {
                const using = classes.filter((c) => c.moduleIds.includes(item.id));
                const paid = priceOf(school, item.id) > 0;
                return (
                  <ListRow
                    key={item.id}
                    leading={
                      <IconTile tone="brand">
                        {item.type === 'path' ? (
                          <Layers size={20} aria-hidden="true" />
                        ) : item.type === 'resource' ? (
                          <FileText size={20} aria-hidden="true" />
                        ) : (
                          <BookOpen size={20} aria-hidden="true" />
                        )}
                      </IconTile>
                    }
                    title={item.title}
                    meta={[TYPE_LABEL[item.type] || 'Contenu', item.author, using.length ? using.map((c) => c.name).join(', ') : 'aucune classe'].join(' · ')}
                    onClick={() => nav(item.type === 'resource' ? 'resource-detail' : item.type === 'path' ? 'path-detail' : 'module-detail', item.id)}
                    trailing={
                      <>
                        {paid && <StatusDot tone="info">Offert à vos élèves</StatusDot>}
                        <ActionMenu
                          label={`Plus d’actions pour ${item.title}`}
                          items={[
                            // Un module se donne à une classe ; son avancement apparaît alors dans le suivi.
                            ...(item.type === 'module'
                              ? classes.map((c) => ({
                                  label: c.moduleIds.includes(item.id) ? `Retirer de ${c.name}` : `Donner à ${c.name}`,
                                  onSelect: () => {
                                    const given = !c.moduleIds.includes(item.id);
                                    saveSchool(toggleClassModule(school, c.id, item.id));
                                    setToast(given ? `« ${item.title} » donné à ${c.name}` : `« ${item.title} » retiré de ${c.name}`);
                                  }
                                }))
                              : []),
                            { label: 'Ouvrir le contenu', onSelect: () => nav(item.type === 'resource' ? 'resource-detail' : item.type === 'path' ? 'path-detail' : 'module-detail', item.id) }
                          ]}
                        />
                      </>
                    }
                  />
                );
              })
            )}
          </ListCard>
          {library.length > 0 && <p className="sc-note">Publiés par vos enseignants, ces contenus sont gratuits pour les élèves de l’établissement.</p>}
        </>
      )}

      {tab === 'teachers' && (
        <>
          <ListCard label="Enseignants de l’établissement">
            {teachers.length === 0 ? (
              <EmptyState title="Aucun enseignant rattaché" />
            ) : (
              teachers.map((m) => {
                const name = memberName(m.userId, people);
                const verified = accountOf(school, m.userId).identity === 'verified';
                return (
                  <ListRow
                    key={m.id}
                    leading={<span className="sc-initial" aria-hidden="true">{name.charAt(0)}</span>}
                    title={name}
                    meta={`${m.subject || 'Enseignement'} · ${m.classIds.map(className).join(', ') || 'aucune classe'}`}
                    trailing={
                      <>
                        {!verified && <StatusDot tone="warn">Identité non vérifiée</StatusDot>}
                        <ActionMenu
                          label={`Plus d’actions pour ${name}`}
                          items={[
                            {
                              label: 'Mettre fin au rattachement',
                              danger: true,
                              onSelect: () => {
                                const next = setMembershipStatus(school, m.id, 'ended');
                                saveSchool(next);
                                setToast(`${name} n’est plus rattaché : il redevient « ${educatorStanding(next, m.userId).label} »`);
                              }
                            }
                          ]}
                        />
                      </>
                    }
                  />
                );
              })
            )}
          </ListCard>
          <p className="sc-note">Pour un enseignant, vous voyez ses classes et sa matière. Aucun classement individuel n’est établi.</p>
        </>
      )}

      {tab === 'timetable' && (
        <>
          <div className="ui-toolbar sc-toolbar">
            <label className="ui-field sc-inline-field">
              <span className="sr-only">Classe</span>
              <Select aria-label="Classe affichée" value={shownClassId} onChange={(e) => setTimetableClass(e.target.value)}>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </label>
            <button type="button" className="li-text-link" onClick={() => setSlotOpen(true)}>
              Ajouter un créneau
            </button>
          </div>
          <TimetablePanel
            slots={slots}
            people={people}
            today={today}
            label={`Emploi du temps de ${className(shownClassId)}`}
            onRemove={(slot) => {
              saveSchool({ ...school, timetable: school.timetable.filter((s) => s.id !== slot.id) });
              setToast('Créneau supprimé');
            }}
          />
        </>
      )}

      {learnerId && (
        <LearnerModal
          name={memberName(learnerId, people)}
          subtitle={`${classes.filter((c) => studentsOfClass(school, c.id).includes(learnerId)).map((c) => c.name).join(', ')} · ${institution.name}`}
          rows={[...new Set(classes.filter((c) => studentsOfClass(school, c.id).includes(learnerId)).flatMap((c) => c.moduleIds))].map((id) => followUp(ext, catalog, learnerId, id))}
          onClose={() => setLearnerId(null)}
        />
      )}

      {classOpen && (
        <ClassModal
          onClose={() => setClassOpen(false)}
          onSave={(name, level, restriction) => {
            saveSchool(addClass(school, { institutionId: institution.id, name, level, year: '2026-2027', restriction }));
            setClassOpen(false);
            setTab('classes');
            setToast(`Classe « ${name} » créée`);
          }}
        />
      )}

      {levelFor && (
        <LevelModal
          schoolClass={levelFor}
          onClose={() => setLevelFor(null)}
          onSave={(restriction) => {
            saveSchool(setClassRestriction(school, levelFor.id, restriction));
            setLevelFor(null);
            setToast(`${levelFor.name} : niveau « ${RESTRICTION_LABEL[restriction].toLowerCase()} »`);
          }}
        />
      )}

      {slotOpen && shownClassId && (
        <SlotModal
          className={className(shownClassId)}
          teachers={teachers.filter((t) => t.classIds.includes(shownClassId)).map((t) => ({ id: t.userId, name: memberName(t.userId, people) }))}
          conflictOf={(candidate) => slotConflict(school.timetable, { ...candidate, classId: shownClassId })}
          describe={(slot) => `« ${slot.subject} », ${weekdayLabel(slot.weekday).toLowerCase()} de ${clock(slot.start)} à ${clock(slot.end)} (${className(slot.classId)})`}
          onClose={() => setSlotOpen(false)}
          onSave={(candidate) => {
            const slot: TimetableSlot = { ...candidate, classId: shownClassId, id: `${shownClassId}-${candidate.weekday}-${candidate.start.replace(':', '')}-${Date.now().toString(36)}` };
            saveSchool({ ...school, timetable: [...school.timetable, slot] });
            setSlotOpen(false);
            setToast('Créneau ajouté à l’emploi du temps');
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Fenêtres */

function LevelChoice({ value, onChange }: { value: RestrictionLevel; onChange: (v: RestrictionLevel) => void }) {
  return (
    <RadioList
      name="sc-restriction"
      legend="Niveau de restriction"
      value={String(value)}
      onChange={(v) => onChange(Number(v) as RestrictionLevel)}
      options={LEVELS.map((level) => ({ value: String(level), label: RESTRICTION_LABEL[level], hint: RESTRICTION_DETAIL[level] }))}
    />
  );
}

function ClassModal({ onSave, onClose }: { onSave: (name: string, level: string, restriction: RestrictionLevel) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState('Lycée');
  const [restriction, setRestriction] = useState<RestrictionLevel>(2);
  return (
    <Modal
      open
      size="md"
      title="Créer une classe"
      onClose={onClose}
      footer={
        <button type="button" className="primary ui-btn-sm" disabled={!name.trim()} onClick={() => onSave(name.trim(), level, restriction)}>
          Créer la classe
        </button>
      }
    >
      <div className="cal-form">
        <div className="cal-form-row">
          <label className="ui-field">
            <span>Nom de la classe</span>
            <input value={name} maxLength={40} placeholder="Ex. Première C" autoFocus onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="ui-field">
            <span>Cycle</span>
            <Select value={level} onChange={(e) => setLevel(e.target.value)}>
              {['Primaire', 'Collège', 'Lycée', 'Supérieur', 'Cours du soir'].map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </label>
        </div>
        <div className="cal-form-section">
          <h3>Ce que les élèves peuvent faire</h3>
          <LevelChoice value={restriction} onChange={setRestriction} />
          <p className="cal-form-note">Si un élève appartient à plusieurs classes, le niveau le plus strict s’applique. Un mineur est au moins « encadré ».</p>
        </div>
      </div>
    </Modal>
  );
}

function LevelModal({ schoolClass, onSave, onClose }: { schoolClass: SchoolClass; onSave: (restriction: RestrictionLevel) => void; onClose: () => void }) {
  const [restriction, setRestriction] = useState<RestrictionLevel>(schoolClass.restriction);
  return (
    <Modal
      open
      size="md"
      title={`Niveau de restriction · ${schoolClass.name}`}
      onClose={onClose}
      footer={
        <button type="button" className="primary ui-btn-sm" onClick={() => onSave(restriction)}>
          Enregistrer
        </button>
      }
    >
      <LevelChoice value={restriction} onChange={setRestriction} />
      <p className="cal-form-note">Si un élève appartient à plusieurs classes, le niveau le plus strict s’applique. Un mineur est au moins « encadré ».</p>
    </Modal>
  );
}

type SlotDraft = Omit<TimetableSlot, 'id' | 'classId'>;

function SlotModal({
  className,
  teachers,
  conflictOf,
  describe,
  onSave,
  onClose
}: {
  className: string;
  teachers: { id: string; name: string }[];
  conflictOf: (candidate: SlotDraft) => TimetableSlot | undefined;
  describe: (slot: TimetableSlot) => string;
  onSave: (candidate: SlotDraft) => void;
  onClose: () => void;
}) {
  const [weekday, setWeekday] = useState(1);
  const [start, setStart] = useState('07:00');
  const [end, setEnd] = useState('09:00');
  const [subject, setSubject] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [room, setRoom] = useState('');
  const [tried, setTried] = useState(false);

  const draft: SlotDraft = {
    weekday,
    start,
    end,
    subject: subject.trim(),
    teacherId: teacherId || undefined,
    teacherName: teacherId ? teachers.find((t) => t.id === teacherId)?.name : teacherName.trim() || undefined,
    room: room.trim() || undefined
  };
  const badHours = end <= start;
  const conflict = !badHours ? conflictOf(draft) : undefined;
  const invalid = !draft.subject || badHours || Boolean(conflict);

  return (
    <Modal
      open
      size="md"
      title={`Ajouter un créneau · ${className}`}
      onClose={onClose}
      footer={
        <button
          type="button"
          className="primary ui-btn-sm"
          onClick={() => {
            setTried(true);
            if (!invalid) onSave(draft);
          }}
        >
          Ajouter
        </button>
      }
    >
      <div className="cal-form">
        <div className="cal-form-row is-three">
          <label className="ui-field">
            <span>Jour</span>
            <Select value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6].map((d) => (
                <option key={d} value={d}>
                  {weekdayLabel(d)}
                </option>
              ))}
            </Select>
          </label>
          <label className="ui-field">
            <span>Début</span>
            <Select value={start} onChange={(e) => setStart(e.target.value)}>
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {clock(h)}
                </option>
              ))}
            </Select>
          </label>
          <label className="ui-field">
            <span>Fin</span>
            <Select value={end} onChange={(e) => setEnd(e.target.value)}>
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {clock(h)}
                </option>
              ))}
            </Select>
          </label>
        </div>
        {badHours && <p className="cal-form-error">L’heure de fin doit suivre l’heure de début.</p>}
        {conflict && (
          <p className="cal-form-error" role="alert">
            Créneau refusé : il chevauche {describe(conflict)}
            {conflict.teacherId && conflict.teacherId === draft.teacherId ? ', assuré par le même enseignant' : ''}. Choisissez un autre horaire.
          </p>
        )}
        <label className="ui-field">
          <span>Matière</span>
          <input value={subject} maxLength={50} aria-invalid={tried && !draft.subject} onChange={(e) => setSubject(e.target.value)} />
          {tried && !draft.subject && <small className="cal-form-error">Indiquez la matière.</small>}
        </label>
        <div className="cal-form-row">
          <label className="ui-field">
            <span>Enseignant</span>
            <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              <option value="">Sans compte SAVOIR+</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </label>
          {teacherId ? (
            <label className="ui-field">
              <span>Salle (facultatif)</span>
              <input value={room} maxLength={30} onChange={(e) => setRoom(e.target.value)} />
            </label>
          ) : (
            <label className="ui-field">
              <span>Nom de l’enseignant (facultatif)</span>
              <input value={teacherName} maxLength={40} placeholder="Ex. Mme Tossou" onChange={(e) => setTeacherName(e.target.value)} />
            </label>
          )}
        </div>
        {!teacherId && (
          <label className="ui-field">
            <span>Salle (facultatif)</span>
            <input value={room} maxLength={30} onChange={(e) => setRoom(e.target.value)} />
          </label>
        )}
      </div>
    </Modal>
  );
}
