/**
 * Les outils de l'espace établissement : la vue d'ensemble (chiffres clés, avancement des classes,
 * élèves à accompagner, échéances), la planification en diagramme de Gantt et la grille d'emploi
 * du temps. Aucun classement d'élèves : on compare chaque classe à ce qui était prévu pour elle.
 */
import React, { useEffect, useState } from 'react';
import { CalendarRange, CircleCheck, Inbox, LifeBuoy, TrendingUp } from 'lucide-react';
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
  type PlanItem,
  type PlanKind
} from '../../planning';
import { studentsOfClass, type Membership, type SchoolClass, type SchoolState, type TimetableSlot } from '../../school';
import { recordWeek, weekDelta, weekSeries, type WeekMeasures, type WeekSnapshot } from '../../trends';
import { Sparkline } from '../../components/Sparkline';
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

/** Où en est une classe sur sa séquence en cours : l'avancement réel et celui qui était prévu aujourd'hui. */
function classStanding({ school, ext, catalog, today }: BoardData, schoolClass: SchoolClass) {
  const students = studentsOfClass(school, schoolClass.id);
  const current = plansOfClass(school.plans, schoolClass.id).find((p) => p.kind === 'sequence' && planStatus(p, today) === 'current');
  if (!current?.moduleId || students.length === 0) return { students, current, expected: null as number | null };
  return { students, current, expected: expectedProgress(current, today) };
}

/**
 * Avancement du trimestre d'une classe : la part moyenne de ses modules déjà faite par ses élèves,
 * face à ce que la planification attendait à ce jour (un module pas encore planifié compte 0).
 */
function termStanding(data: BoardData, schoolClass: SchoolClass) {
  const { school, ext, catalog, today } = data;
  const students = studentsOfClass(school, schoolClass.id);
  const modules = schoolClass.moduleIds;
  const rows = students.flatMap((uid) => modules.map((m) => followUp(ext, catalog, uid, m)));
  const sequences = plansOfClass(school.plans, schoolClass.id).filter((p) => p.kind === 'sequence');
  const planned = modules.some((m) => sequences.some((p) => p.moduleId === m));
  const actual = rows.length ? mean(rows.map((r) => r.percent)) : null;
  const expected = planned
    ? mean(
        modules.map((m) => {
          const plan = sequences.find((p) => p.moduleId === m);
          return plan ? expectedProgress(plan, today) : 0;
        })
      )
    : null;
  const submitted = rows.filter((r) => r.quiz !== 'none');
  const current = sequences.find((p) => planStatus(p, today) === 'current');
  return {
    students,
    current,
    actual,
    expected,
    pace: actual !== null && expected !== null ? paceOf(actual, expected) : null,
    submitted: submitted.length,
    passed: submitted.filter((r) => r.quiz === 'passed').length
  };
}

export interface StudentFlag {
  uid: string;
  classId: string;
  className: string;
  kind: 'quiz' | 'late';
  reason: string;
}

/** Élèves à accompagner : un quiz à retenter, ou un net retard sur la séquence en cours. */
function studentFlags(data: BoardData): StudentFlag[] {
  const { ext, catalog, classes } = data;
  return classes
    .flatMap((schoolClass) => {
      const { students, current, expected } = classStanding(data, schoolClass);
      return students.map((uid): StudentFlag | null => {
        const failed = schoolClass.moduleIds.map((m) => followUp(ext, catalog, uid, m)).find((r) => r.quiz === 'failed');
        if (failed) return { uid, classId: schoolClass.id, className: schoolClass.name, kind: 'quiz', reason: `Quiz à retenter · ${failed.title}` };
        const onCurrent = current?.moduleId ? followUp(ext, catalog, uid, current.moduleId) : null;
        if (onCurrent && expected !== null && expected - onCurrent.percent >= 30) {
          return { uid, classId: schoolClass.id, className: schoolClass.name, kind: 'late', reason: `${onCurrent.percent} % lus sur ${expected} % attendus · ${onCurrent.title}` };
        }
        return null;
      });
    })
    .filter((f): f is StudentFlag => f !== null)
    .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'quiz' ? -1 : 1));
}

/** Tout ce que montre une vue d'ensemble, et les mesures de la semaine qu'elle enregistre. */
export function boardMeasures(data: BoardData) {
  const terms = data.classes.map((schoolClass) => ({ schoolClass, ...termStanding(data, schoolClass) }));
  const flags = studentFlags(data);
  const withActual = terms.filter((t) => t.actual !== null);
  const withExpected = terms.filter((t) => t.expected !== null);
  const submitted = terms.reduce((sum, t) => sum + t.submitted, 0);
  const passed = terms.reduce((sum, t) => sum + t.passed, 0);
  const measures: WeekMeasures = {
    progress: mean(withActual.map((t) => t.actual as number)),
    expected: withExpected.length ? mean(withExpected.map((t) => t.expected as number)) : null,
    flagged: flags.length,
    quizRate: submitted ? Math.round((passed / submitted) * 100) : null,
    classGaps: Object.fromEntries(
      terms.filter((t) => t.actual !== null && t.expected !== null).map((t) => [t.schoolClass.id, (t.actual as number) - (t.expected as number)])
    )
  };
  return { terms, flags, measures, submitted, passed };
}

export type BoardMeasures = ReturnType<typeof boardMeasures>;

/**
 * Relevé de la semaine : la semaine en cours s'enregistre (ou se met à jour) quand le tableau de bord
 * s'affiche ; les semaines suivantes s'ajoutent ainsi à la courbe.
 */
export function useWeekRecord(
  school: SchoolState,
  saveSchool: ((next: SchoolState) => void) | undefined,
  scope: string,
  measures: WeekMeasures,
  today: Day
) {
  const key = JSON.stringify(measures);
  useEffect(() => {
    if (!saveSchool) return;
    const next = recordWeek(school.snapshots, scope, measures, today);
    if (next) saveSchool({ ...school, snapshots: next });
    // Les mesures sont comparées par leur contenu : un nouvel objet identique ne réécrit rien.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, scope, today]);
}

/** Les quatre chiffres clés partagés : avancement du trimestre, élèves à accompagner, quiz réussis. */
export function TrendKpis({ board, series }: { board: BoardMeasures; series: WeekSnapshot[] }) {
  const { measures, flags, submitted, passed } = board;
  const late = flags.filter((f) => f.kind === 'late').length;
  const quiz = flags.filter((f) => f.kind === 'quiz').length;
  const progressDelta = weekDelta(series, (s) => s.progress);
  const weeks = series.length;
  return (
    <>
      <KpiTile
        label="Avancement du trimestre"
        value={`${measures.progress} %`}
        icon={<TrendingUp size={15} aria-hidden="true" />}
        meter={{
          value: measures.progress,
          expected: measures.expected,
          label: `Avancement ${measures.progress} %${measures.expected !== null ? `, attendu ${measures.expected} %` : ''}`
        }}
        hint={
          measures.expected !== null
            ? `Attendu à ce jour : ${measures.expected} %${progressDelta !== null ? ` · ${signed(progressDelta)} pts en une semaine` : ''}`
            : 'Aucune séquence planifiée'
        }
        trend={
          <Sparkline
            values={series.map((s) => s.progress)}
            label={`Avancement du trimestre sur ${weeks} semaines : de ${series[0].progress} % à ${measures.progress} %`}
          />
        }
      />
      <KpiTile
        label="Élèves à accompagner"
        value={measures.flagged}
        tone={measures.flagged > 0 ? 'warn' : 'plain'}
        icon={<LifeBuoy size={15} aria-hidden="true" />}
        hint={measures.flagged > 0 ? [late && plural(late, 'en retard', 'en retard'), quiz && plural(quiz, 'quiz à retenter', 'quiz à retenter')].filter(Boolean).join(' · ') : 'Personne en net retard'}
        trend={
          <Sparkline
            tone="warm"
            values={series.map((s) => s.flagged)}
            label={`Élèves à accompagner sur ${weeks} semaines : de ${series[0].flagged} à ${measures.flagged}`}
          />
        }
      />
      <KpiTile
        label="Quiz réussis"
        value={measures.quizRate !== null ? `${measures.quizRate} %` : '—'}
        icon={<CircleCheck size={15} aria-hidden="true" />}
        hint={submitted ? `${passed} sur ${plural(submitted, 'quiz rendu', 'quiz rendus')}` : 'Aucun quiz rendu'}
        trend={
          measures.quizRate !== null ? (
            <Sparkline values={series.map((s) => s.quizRate)} label={`Quiz réussis sur ${weeks} semaines, jusqu’à ${measures.quizRate} %`} />
          ) : undefined
        }
      />
    </>
  );
}

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

/* ------------------------------------------------------------------ Vue d'ensemble */

export function InstitutionOverview({
  data,
  institutionId,
  teachers,
  requests,
  saveSchool,
  onOpenClass,
  onOpenLearner,
  onShowRequests,
  onOpenPlanning
}: {
  data: BoardData;
  institutionId: string;
  teachers: Membership[];
  requests: Membership[];
  saveSchool?: (next: SchoolState) => void;
  onOpenClass: (classId: string) => void;
  onOpenLearner: (userId: string) => void;
  onShowRequests: () => void;
  onOpenPlanning: () => void;
}) {
  const board = boardMeasures(data);
  useWeekRecord(data.school, saveSchool, institutionId, board.measures, data.today);
  const series = weekSeries(data.school.snapshots, institutionId, board.measures, data.today);
  const teacherRequests = requests.filter((m) => m.role === 'teacher').length;
  const studentRequests = requests.length - teacherRequests;
  return (
    <ClassesOverview
      data={data}
      board={board}
      series={series}
      onOpenClass={onOpenClass}
      onOpenLearner={onOpenLearner}
      onOpenPlanning={onOpenPlanning}
      kpis={
        <KpiRow label="Chiffres clés de l’établissement">
          <TrendKpis board={board} series={series} />
          <KpiTile
            label="Demandes de rattachement"
            value={requests.length}
            icon={<Inbox size={15} aria-hidden="true" />}
            hint={
              requests.length ? (
                <>
                  {[teacherRequests && plural(teacherRequests, 'enseignant', 'enseignants'), studentRequests && plural(studentRequests, 'élève', 'élèves')]
                    .filter(Boolean)
                    .join(' · ')}{' '}
                  ·{' '}
                  <button type="button" className="rd-link" onClick={onShowRequests}>
                    Traiter
                  </button>
                </>
              ) : (
                `${plural(teachers.length, 'enseignant rattaché', 'enseignants rattachés')}, aucune demande`
              )
            }
          />
        </KpiRow>
      }
    />
  );
}

/**
 * La vue d'ensemble d'un établissement (toutes ses classes) ou d'un encadrant (les siennes) :
 * chiffres clés, classes face à l'attendu, élèves à accompagner, planification du trimestre.
 * Aucun classement d'élèves : chaque classe est comparée à ce qui était prévu pour elle.
 */
export function ClassesOverview({
  data,
  board,
  series,
  kpis,
  onOpenClass,
  onOpenLearner,
  onOpenPlanning,
  emptyText = 'Créez une classe pour suivre son avancement.'
}: {
  data: BoardData;
  board: BoardMeasures;
  series: WeekSnapshot[];
  /** Rangée de chiffres clés propre à celui qui regarde. */
  kpis: React.ReactNode;
  onOpenClass: (classId: string) => void;
  onOpenLearner: (userId: string) => void;
  onOpenPlanning: () => void;
  emptyText?: string;
}) {
  const { people, classes } = data;
  const { terms, flags } = board;
  // Une seule échelle pour toutes les petites courbes d'écart : les classes se comparent d'un coup d'œil.
  const gaps = series.flatMap((s) => Object.values(s.classGaps));
  const gapDomain: [number, number] = [Math.min(-10, ...gaps), Math.max(10, ...gaps)];
  const shown = flags.slice(0, 6);

  return (
    <div className="pl-board">
      {kpis}

      <div className="pl-split is-wide">
        <section className="pl-panel" aria-label="Classes">
          <header className="pl-panel-head">
            <h2>Classes</h2>
            <small>Le trait marque l’attendu à ce jour</small>
          </header>
          {terms.length === 0 ? (
            <EmptyState title="Aucune classe" text={emptyText} />
          ) : (
            <div className="pl-table-wrap">
              <table className="pl-table">
                <thead>
                  <tr>
                    <th scope="col">Classe</th>
                    <th scope="col">Avancement du trimestre</th>
                    <th scope="col" className="num">
                      Quiz réussis
                    </th>
                    <th scope="col" className="num">
                      À suivre
                    </th>
                    <th scope="col" className="num">
                      {series.length} semaines
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {terms.map(({ schoolClass, students, current, actual, expected, pace, submitted, passed }) => {
                    const followed = flags.filter((f) => f.classId === schoolClass.id).length;
                    const gapSeries = series.map((s) => (s.classGaps[schoolClass.id] ?? null));
                    return (
                      <tr key={schoolClass.id}>
                        <td>
                          <button type="button" className="pl-table-link" onClick={() => onOpenClass(schoolClass.id)}>
                            <b>{schoolClass.name}</b>
                            <small>
                              {plural(students.length, 'élève', 'élèves')} · {current ? current.title : 'aucune séquence en cours'}
                            </small>
                          </button>
                        </td>
                        <td>
                          {actual === null ? (
                            <span className="pl-muted">Aucun module donné</span>
                          ) : (
                            <span className="pl-pace">
                              <PaceBar actual={actual} expected={expected} />
                              {pace ? <StatusDot tone={pace === 'late' ? 'warn' : pace === 'ahead' ? 'info' : 'neutral'}>{PACE_LABEL[pace]}</StatusDot> : <span className="pl-muted">Pas encore planifié</span>}
                            </span>
                          )}
                        </td>
                        <td className="num tabular-nums">{submitted ? `${Math.round((passed / submitted) * 100)} %` : <span className="pl-muted">À venir</span>}</td>
                        <td className={`num tabular-nums${followed ? ' is-warn' : ''}`}>{followed}</td>
                        <td className="num">
                          <Sparkline
                            values={gapSeries}
                            width={64}
                            height={22}
                            domain={gapDomain}
                            reference={0}
                            tone={pace === 'late' ? 'warm' : 'brand'}
                            label={`Écart à l’attendu de ${schoolClass.name}, semaine par semaine`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="pl-panel" aria-label="Élèves à accompagner">
          <header className="pl-panel-head">
            <h2>À accompagner</h2>
            <small>{flags.length ? plural(flags.length, 'élève', 'élèves') : ''}</small>
          </header>
          {flags.length === 0 ? (
            <p className="pl-panel-text">Aucun élève en net retard, aucun quiz à retenter.</p>
          ) : (
            <ul className="pl-follow">
              {shown.map((f) => {
                const name = memberName(f.uid, people);
                return (
                  <li key={f.uid}>
                    <span className="pl-follow-initial" aria-hidden="true">
                      {name.charAt(0)}
                    </span>
                    <span className="pl-follow-text">
                      <b>
                        {name} <span>· {f.className}</span>
                      </b>
                      <small>{f.reason}</small>
                    </span>
                    <button type="button" className="li-text-link" onClick={() => onOpenLearner(f.uid)} aria-label={`Voir le suivi de ${name}`}>
                      Voir le suivi
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {flags.length > shown.length && <p className="pl-panel-text">Et {plural(flags.length - shown.length, 'autre élève', 'autres élèves')}.</p>}
        </section>
      </div>

      {classes.length > 0 && (
        <section className="pl-panel pl-panel-gantt" aria-label="Planification du trimestre">
          <header className="pl-panel-head">
            <h2>Planification du trimestre</h2>
            <button type="button" className="li-text-link" onClick={onOpenPlanning}>
              Ouvrir la planification
            </button>
          </header>
          <PlanningGantt data={data} />
        </section>
      )}
    </div>
  );
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

/** Lignes du diagramme de Gantt : les périodes de chaque classe, remplies de l'avancement réel. */
function planningRows(data: BoardData) {
  const { school, ext, catalog, today, classes } = data;
  const progressOfPlan = (plan: PlanItem): number | undefined => {
    if (plan.kind !== 'sequence' || !plan.moduleId) return undefined;
    const students = studentsOfClass(school, plan.classId);
    return students.length ? mean(students.map((uid) => followUp(ext, catalog, uid, plan.moduleId as string).percent)) : undefined;
  };
  return {
    progressOfPlan,
    rows: classes.map((c) => ({
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
    }))
  };
}

const breaksOf = () => SCHOOL_CALENDAR.entries.filter((e) => e.kind === 'break').map((e) => ({ start: e.start, end: e.end || e.start, label: e.title }));

const PLANNING_LEGEND: { tone: GanttBar['tone'] | 'shade' | 'today'; label: string }[] = [
  { tone: 'brand', label: 'Séquence en cours ou à venir' },
  { tone: 'done', label: 'Séquence terminée' },
  { tone: 'soft', label: 'Révisions' },
  { tone: 'warm', label: 'Évaluation' },
  { tone: 'shade', label: 'Congés' },
  { tone: 'today', label: 'Aujourd’hui' }
];

/** Le diagramme du trimestre en lecture seule, tel qu'il paraît dans la vue d'ensemble. */
function PlanningGantt({ data }: { data: BoardData }) {
  const { rows } = planningRows(data);
  return (
    <div className="pl-gantt-embed">
      <GanttChart window={ganttWindow(data.today, 3, 7)} rows={rows} today={data.today} shades={breaksOf()} label="Planification des classes" />
      <GanttLegend items={PLANNING_LEGEND} />
    </div>
  );
}

/* ------------------------------------------------------------------ Planification */

const KINDS: PlanKind[] = ['sequence', 'revision', 'exam'];

export function InstitutionPlanning({
  data,
  saveSchool,
  setToast,
  readOnly = false
}: {
  data: BoardData;
  saveSchool: (next: SchoolState) => void;
  setToast: (message: string) => void;
  /** Encadrant : il lit la planification de ses classes, l'établissement la tient. */
  readOnly?: boolean;
}) {
  const { school, catalog, today, classes } = data;
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const window = ganttWindow(today, 3, 7);

  const { rows, progressOfPlan } = planningRows(data);
  const shades = breaksOf();
  const open = school.plans.find((p) => p.id === openId);
  const openProgress = open ? progressOfPlan(open) : undefined;
  const openExpected = open && planStatus(open, today) === 'current' ? expectedProgress(open, today) : null;

  return (
    <div className="pl-board">
      {/* Rubrique de premier niveau : pas de titre ni de phrase d'introduction, l'action au bout de la ligne. */}
      {!readOnly && (
        <div className="pl-toolbar is-actions-only">
          <div className="pl-toolbar-actions">
            <button type="button" className="secondary ui-btn-sm" disabled={classes.length === 0} onClick={() => setAdding(true)}>
              <CalendarRange size={16} aria-hidden="true" /> Ajouter une période
            </button>
          </div>
        </div>
      )}

      {classes.length === 0 ? (
        <section className="pl-panel">
          <EmptyState
            title="Aucune classe à planifier"
            text={readOnly ? 'La planification apparaît quand un établissement vous confie une classe.' : 'Créez une classe, puis ajoutez ses séquences et ses évaluations.'}
          />
        </section>
      ) : (
        <>
          <GanttChart window={window} rows={rows} today={today} shades={shades} label="Planification des classes" onBarClick={(id) => setOpenId(id)} />
          <GanttLegend items={PLANNING_LEGEND} />
          {readOnly && <p className="pl-readonly-note">La planification est tenue par l’établissement : vous la consultez.</p>}
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
              {!readOnly && (
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
              )}
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
  onRemove,
  classNameOf
}: {
  slots: TimetableSlot[];
  people: Profile[];
  today: Day;
  label: string;
  /** Grille d'un enseignant : chaque cours dit sa classe plutôt que le nom de l'enseignant. */
  classNameOf?: (classId: string) => string;
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
        slots={slots.map((s) => ({ id: s.id, weekday: s.weekday, start: s.start, end: s.end, subject: s.subject, detail: [classNameOf ? classNameOf(s.classId) : teacherOf(s), s.room].filter(Boolean).join(' · ') || undefined }))}
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
