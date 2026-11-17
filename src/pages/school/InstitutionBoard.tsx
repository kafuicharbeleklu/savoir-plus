/**
 * Les outils de l'espace établissement : la vue d'ensemble (chiffres clés, avancement des classes,
 * élèves à accompagner, échéances), la planification en diagramme de Gantt et la grille d'emploi
 * du temps. Aucun classement d'élèves : on compare chaque classe à ce qui était prévu pour elle.
 */
import React, { useState } from 'react';
import { CalendarRange, Clock, GraduationCap, Inbox, Presentation, Users } from 'lucide-react';
import { SCHOOL_CALENDAR, formatRange, weekdayOf, type Day } from '../../calendar';
import {
  PACE_LABEL,
  PLAN_KIND_LABEL,
  expectedProgress,
  ganttWindow,
  paceOf,
  planProblem,
  planStatus,
  plansOfClass,
  weeklyHours,
  type Pace,
  type PlanItem,
  type PlanKind
} from '../../planning';
import { studentsOfClass, type Membership, type SchoolClass, type SchoolState, type TimetableSlot } from '../../school';
import { GanttChart, GanttLegend, KpiRow, KpiTile, TimetableGrid, type GanttBar } from '../../components/PlanningTools';
import { EmptyState, Modal, Select, StatusDot } from '../../components/ui';
import type { CatalogItem, ExtendedDemoState } from '../../wireframeData';
import type { Profile } from '../../data';
import { clock, followUp, memberName, moduleTitle, plural, weekdayLabel } from './shared';

interface BoardData {
  school: SchoolState;
  ext: ExtendedDemoState;
  catalog: CatalogItem[];
  people: Profile[];
  today: Day;
  classes: SchoolClass[];
}

const mean = (values: number[]) => (values.length ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length) : 0);

/** Où en est une classe : sa séquence en cours, l'avancement réel et celui qui était prévu aujourd'hui. */
function classStanding({ school, ext, catalog, today }: BoardData, schoolClass: SchoolClass) {
  const students = studentsOfClass(school, schoolClass.id);
  const current = plansOfClass(school.plans, schoolClass.id).find((p) => p.kind === 'sequence' && planStatus(p, today) === 'current');
  const overall = mean(students.flatMap((uid) => schoolClass.moduleIds.map((m) => followUp(ext, catalog, uid, m).percent)));
  if (!current?.moduleId || students.length === 0) {
    return { students, current, actual: schoolClass.moduleIds.length ? overall : null, expected: null as number | null, pace: null as Pace | null };
  }
  const actual = mean(students.map((uid) => followUp(ext, catalog, uid, current.moduleId as string).percent));
  const expected = expectedProgress(current, today);
  return { students, current, actual, expected, pace: paceOf(actual, expected) };
}

/** Barre d'avancement avec, en repère, l'avancement attendu à ce jour. */
function PaceBar({ actual, expected }: { actual: number | null; expected: number | null }) {
  if (actual === null) return <span className="pl-bar" />;
  return (
    <span className="pl-bar">
      <span className="pl-bar-track">
        <i style={{ width: `${actual}%` }} />
        {expected !== null && <em style={{ left: `${expected}%` }} title={`Attendu aujourd’hui : ${expected} %`} />}
      </span>
      <b className="tabular-nums">{actual} %</b>
    </span>
  );
}

/* ------------------------------------------------------------------ Vue d'ensemble */

export function InstitutionOverview({
  data,
  teachers,
  requests,
  onOpenClass,
  onOpenLearner,
  onShowRequests
}: {
  data: BoardData;
  teachers: Membership[];
  requests: Membership[];
  onOpenClass: (classId: string) => void;
  onOpenLearner: (userId: string) => void;
  onShowRequests: () => void;
}) {
  const { school, ext, catalog, people, today, classes } = data;
  const standings = classes.map((c) => ({ schoolClass: c, ...classStanding(data, c) }));
  const studentIds = new Set(standings.flatMap((s) => s.students));
  const classIds = new Set(classes.map((c) => c.id));
  const hours = weeklyHours(school.timetable.filter((s) => classIds.has(s.classId)));

  // Élèves à accompagner : un quiz à retenter, ou un net retard sur la séquence en cours.
  const flags = standings
    .flatMap(({ schoolClass, students, current, expected }) =>
      students.map((uid) => {
        const rows = schoolClass.moduleIds.map((m) => followUp(ext, catalog, uid, m));
        const failed = rows.find((r) => r.quiz === 'failed');
        const onCurrent = current?.moduleId ? followUp(ext, catalog, uid, current.moduleId) : null;
        const gap = onCurrent && expected !== null ? expected - onCurrent.percent : 0;
        if (failed) return { uid, className: schoolClass.name, weight: 2, reason: `Quiz à retenter : « ${failed.title} »` };
        if (onCurrent && gap >= 30) return { uid, className: schoolClass.name, weight: 1, reason: `En retard sur « ${onCurrent.title} » : ${onCurrent.percent} % lus, ${expected} % attendus` };
        return null;
      })
    )
    .filter((f): f is { uid: string; className: string; weight: number; reason: string } => f !== null)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);

  // Échéances : ce qui est en cours ou commence dans les deux semaines.
  const upcoming = school.plans
    .filter((p) => classIds.has(p.classId) && p.kind !== 'sequence' && planStatus(p, today) !== 'done' && p.start <= (ganttWindow(today, 0, 2).weeks[2] || p.start))
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 4);

  return (
    <div className="pl-board">
      <KpiRow label="Chiffres clés de l’établissement">
        <KpiTile label="Élèves" value={studentIds.size} hint={plural(classes.length, 'classe', 'classes')} icon={<GraduationCap size={15} aria-hidden="true" />} />
        <KpiTile label="Enseignants" value={teachers.length} hint="rattachés et actifs" icon={<Presentation size={15} aria-hidden="true" />} />
        <KpiTile label="Heures de cours" value={hours} hint="par semaine, toutes classes" icon={<Clock size={15} aria-hidden="true" />} />
        <KpiTile
          label="Demandes"
          value={requests.length}
          tone={requests.length ? 'warn' : 'plain'}
          hint={
            requests.length ? (
              <button type="button" className="rd-link" onClick={onShowRequests}>
                À traiter
              </button>
            ) : (
              'aucune en attente'
            )
          }
          icon={<Inbox size={15} aria-hidden="true" />}
        />
      </KpiRow>

      <div className="pl-split">
        <section className="pl-panel" aria-label="Avancement des classes">
          <header className="pl-panel-head">
            <h2>Avancement des classes</h2>
            <small>Le trait marque l’attendu à ce jour</small>
          </header>
          {standings.length === 0 ? (
            <EmptyState title="Aucune classe" text="Créez une classe pour suivre son avancement." />
          ) : (
            <ul className="pl-rows">
              {standings.map(({ schoolClass, students, current, actual, expected, pace }) => (
                <li key={schoolClass.id}>
                  <button type="button" className="pl-row" onClick={() => onOpenClass(schoolClass.id)}>
                    <span className="pl-row-title">
                      <b>{schoolClass.name}</b>
                      <small>
                        {plural(students.length, 'élève', 'élèves')} · {current ? current.title : 'aucune séquence en cours'}
                      </small>
                    </span>
                    <PaceBar actual={actual} expected={expected} />
                    {pace ? <StatusDot tone={pace === 'late' ? 'warn' : 'info'}>{PACE_LABEL[pace]}</StatusDot> : <span />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="pl-panel" aria-label="Échéances des deux prochaines semaines">
          <header className="pl-panel-head">
            <h2>Échéances</h2>
            <small>Deux prochaines semaines</small>
          </header>
          {upcoming.length === 0 ? (
            <p className="pl-panel-text">Ni révisions ni évaluation dans les deux semaines.</p>
          ) : (
            <ul className="pl-rows">
              {upcoming.map((p) => (
                <li key={p.id} className="pl-row is-plain">
                  <span className="pl-row-title">
                    <b>{p.title}</b>
                    <small>
                      {classes.find((c) => c.id === p.classId)?.name} · {formatRange(p.start, p.end)}
                    </small>
                  </span>
                  <StatusDot tone={p.kind === 'exam' ? 'warn' : 'neutral'}>{PLAN_KIND_LABEL[p.kind]}</StatusDot>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="pl-panel" aria-label="Élèves à accompagner">
        <header className="pl-panel-head">
          <h2>Élèves à accompagner</h2>
          <small>{flags.length ? 'Ouvrez le suivi pour décider quoi faire' : ''}</small>
        </header>
        {flags.length === 0 ? (
          <p className="pl-panel-text">Aucun élève en net retard, aucun quiz à retenter.</p>
        ) : (
          <ul className="pl-rows">
            {flags.map((f) => (
              <li key={f.uid}>
                <button type="button" className="pl-row is-reason" onClick={() => onOpenLearner(f.uid)}>
                  <span className="pl-row-title">
                    <b>{memberName(f.uid, people)}</b>
                    <small>{f.className}</small>
                  </span>
                  <span className="pl-row-title">
                    <small>{f.reason}</small>
                  </span>
                  <StatusDot tone="neutral">Voir le suivi</StatusDot>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ Planification */

const KINDS: PlanKind[] = ['sequence', 'revision', 'exam'];

export function InstitutionPlanning({
  data,
  saveSchool,
  setToast
}: {
  data: BoardData;
  saveSchool: (next: SchoolState) => void;
  setToast: (message: string) => void;
}) {
  const { school, ext, catalog, today, classes } = data;
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const window = ganttWindow(today, 3, 7);

  const progressOfPlan = (plan: PlanItem): number | undefined => {
    if (plan.kind !== 'sequence' || !plan.moduleId) return undefined;
    const students = studentsOfClass(school, plan.classId);
    return students.length ? mean(students.map((uid) => followUp(ext, catalog, uid, plan.moduleId as string).percent)) : undefined;
  };

  const rows = classes.map((c) => ({
    id: c.id,
    label: c.name,
    sub: plural(studentsOfClass(school, c.id).length, 'élève', 'élèves'),
    bars: plansOfClass(school.plans, c.id).map((p): GanttBar => {
      const progress = progressOfPlan(p);
      const status = planStatus(p, today);
      return {
        id: p.id,
        label: p.title,
        start: p.start,
        end: p.end,
        tone: p.kind === 'exam' ? 'warm' : p.kind === 'revision' ? 'soft' : status === 'done' ? 'done' : 'brand',
        progress,
        detail: `${PLAN_KIND_LABEL[p.kind].toLowerCase()}${progress !== undefined ? `, avancement ${progress} %` : ''}`
      };
    })
  }));

  const shades = SCHOOL_CALENDAR.entries.filter((e) => e.kind === 'break').map((e) => ({ start: e.start, end: e.end || e.start, label: e.title }));
  const open = school.plans.find((p) => p.id === openId);
  const openProgress = open ? progressOfPlan(open) : undefined;
  const openExpected = open && planStatus(open, today) === 'current' ? expectedProgress(open, today) : null;

  return (
    <div className="pl-board">
      <div className="pl-toolbar">
        <div>
          <h2>Planification du trimestre</h2>
          <p>Séquences de cours, révisions et évaluations de chaque classe. Le remplissage d’une barre montre l’avancement réel des élèves.</p>
        </div>
        <div className="pl-toolbar-actions">
          <button type="button" className="secondary ui-btn-sm" disabled={classes.length === 0} onClick={() => setAdding(true)}>
            <CalendarRange size={16} aria-hidden="true" /> Ajouter une période
          </button>
        </div>
      </div>

      {classes.length === 0 ? (
        <section className="pl-panel">
          <EmptyState title="Aucune classe à planifier" text="Créez une classe, puis ajoutez ses séquences et ses évaluations." />
        </section>
      ) : (
        <>
          <GanttChart window={window} rows={rows} today={today} shades={shades} label="Planification des classes" onBarClick={(id) => setOpenId(id)} />
          <GanttLegend
            items={[
              { tone: 'brand', label: 'Séquence en cours ou à venir' },
              { tone: 'done', label: 'Séquence terminée' },
              { tone: 'soft', label: 'Révisions' },
              { tone: 'warm', label: 'Évaluation' },
              { tone: 'shade', label: 'Congés' },
              { tone: 'today', label: 'Aujourd’hui' }
            ]}
          />
        </>
      )}

      {open && (
        <Modal
          open
          size="sm"
          title={open.title}
          onClose={() => setOpenId(null)}
          footer={
            <>
              <button
                type="button"
                className="secondary pl-danger"
                onClick={() => {
                  saveSchool({ ...school, plans: school.plans.filter((p) => p.id !== open.id) });
                  setOpenId(null);
                  setToast(`« ${open.title} » retirée de la planification`);
                }}
              >
                Supprimer la période
              </button>
              <button type="button" className="primary" onClick={() => setOpenId(null)}>
                Fermer
              </button>
            </>
          }
        >
          <dl className="rd-facts">
            <div>
              <dt>Classe</dt>
              <dd>{classes.find((c) => c.id === open.classId)?.name}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{PLAN_KIND_LABEL[open.kind]}</dd>
            </div>
            <div>
              <dt>Dates</dt>
              <dd>{formatRange(open.start, open.end)}</dd>
            </div>
            {open.moduleId && (
              <div>
                <dt>Module travaillé</dt>
                <dd>{moduleTitle(catalog, open.moduleId)}</dd>
              </div>
            )}
            {openProgress !== undefined && (
              <div>
                <dt>Avancement des élèves</dt>
                <dd>
                  {openProgress} %{openExpected !== null ? ` · ${openExpected} % attendus aujourd’hui (${PACE_LABEL[paceOf(openProgress, openExpected)].toLowerCase()})` : ''}
                </dd>
              </div>
            )}
          </dl>
        </Modal>
      )}

      {adding && (
        <PlanModal
          classes={classes}
          catalog={catalog}
          today={today}
          onClose={() => setAdding(false)}
          onSave={(plan) => {
            saveSchool({ ...school, plans: [...school.plans, plan] });
            setAdding(false);
            setToast(`« ${plan.title} » ajoutée à la planification`);
          }}
        />
      )}
    </div>
  );
}

function PlanModal({
  classes,
  catalog,
  today,
  onSave,
  onClose
}: {
  classes: SchoolClass[];
  catalog: CatalogItem[];
  today: Day;
  onSave: (plan: PlanItem) => void;
  onClose: () => void;
}) {
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [kind, setKind] = useState<PlanKind>('sequence');
  const [title, setTitle] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [start, setStart] = useState<Day>(today);
  const [end, setEnd] = useState<Day>(today);
  const [error, setError] = useState<string | null>(null);
  const modules = classes.find((c) => c.id === classId)?.moduleIds || [];

  const submit = () => {
    const linked = kind === 'sequence' && modules.includes(moduleId) ? moduleId : undefined;
    const finalTitle = title.trim() || (linked ? moduleTitle(catalog, linked) : '');
    const problem = planProblem({ title: finalTitle, start, end });
    if (problem) {
      setError(problem);
      return;
    }
    onSave({ id: `pl-${classId}-${start}-${Date.now().toString(36)}`, classId, kind, title: finalTitle, start, end, moduleId: linked });
  };

  return (
    <Modal
      open
      size="sm"
      title="Ajouter une période"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="secondary" onClick={onClose}>
            Annuler
          </button>
          <button type="button" className="primary" onClick={submit}>
            Ajouter
          </button>
        </>
      }
    >
      <div className="pl-form">
        <label>
          <span>Classe</span>
          <Select value={classId} onChange={(e) => setClassId(e.target.value)} aria-label="Classe">
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </label>
        <label>
          <span>Type</span>
          <Select value={kind} onChange={(e) => setKind(e.target.value as PlanKind)} aria-label="Type de période">
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {PLAN_KIND_LABEL[k]}
              </option>
            ))}
          </Select>
        </label>
        {kind === 'sequence' && modules.length > 0 && (
          <label>
            <span>Module travaillé (facultatif)</span>
            <Select value={moduleId} onChange={(e) => setModuleId(e.target.value)} aria-label="Module travaillé">
              <option value="">Aucun module lié</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {moduleTitle(catalog, m)}
                </option>
              ))}
            </Select>
          </label>
        )}
        <label>
          <span>Titre</span>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === 'exam' ? 'Composition du trimestre' : kind === 'revision' ? 'Révisions' : 'Titre de la séquence'} />
        </label>
        <div className="pl-form-pair">
          <label>
            <span>Début</span>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value as Day)} />
          </label>
          <label>
            <span>Fin</span>
            <input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value as Day)} />
          </label>
        </div>
        {error && (
          <p className="pl-form-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ Emploi du temps */

export function TimetablePanel({
  slots,
  people,
  today,
  label,
  onRemove
}: {
  slots: TimetableSlot[];
  people: Profile[];
  today: Day;
  label: string;
  /** Présent : un créneau peut être supprimé depuis sa fiche. */
  onRemove?: (slot: TimetableSlot) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = slots.find((s) => s.id === openId);
  const teacherOf = (slot: TimetableSlot) => (slot.teacherId ? memberName(slot.teacherId, people) : slot.teacherName || '');
  if (slots.length === 0) {
    return (
      <section className="pl-panel">
        <EmptyState title="Aucun créneau" text="Ajoutez les cours de la semaine pour remplir la grille." />
      </section>
    );
  }
  return (
    <>
      <TimetableGrid
        label={label}
        todayWeekday={weekdayOf(today)}
        slots={slots.map((s) => ({ id: s.id, weekday: s.weekday, start: s.start, end: s.end, subject: s.subject, detail: [teacherOf(s), s.room].filter(Boolean).join(' · ') || undefined }))}
        onSlotClick={(id) => setOpenId(id)}
      />
      {open && (
        <Modal
          open
          size="sm"
          title={open.subject}
          onClose={() => setOpenId(null)}
          footer={
            <>
              {onRemove && (
                <button
                  type="button"
                  className="secondary pl-danger"
                  onClick={() => {
                    onRemove(open);
                    setOpenId(null);
                  }}
                >
                  Supprimer le créneau
                </button>
              )}
              <button type="button" className="primary" onClick={() => setOpenId(null)}>
                Fermer
              </button>
            </>
          }
        >
          <dl className="rd-facts">
            <div>
              <dt>Jour</dt>
              <dd>{weekdayLabel(open.weekday)}</dd>
            </div>
            <div>
              <dt>Horaire</dt>
              <dd>
                {clock(open.start)} – {clock(open.end)}
              </dd>
            </div>
            {teacherOf(open) && (
              <div>
                <dt>Enseignant</dt>
                <dd>{teacherOf(open)}</dd>
              </div>
            )}
            {open.room && (
              <div>
                <dt>Salle</dt>
                <dd>{open.room}</dd>
              </div>
            )}
          </dl>
        </Modal>
      )}
    </>
  );
}
