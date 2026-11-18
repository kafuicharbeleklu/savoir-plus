/**
 * Les outils de l'espace famille : pour chaque enfant, le message de la semaine (une phrase sur ce
 * qui mérite attention, une sur ce que le parent peut faire), les chiffres clés, le plan de
 * révision en diagramme de Gantt et la grille d'emploi du temps.
 */
import React from 'react';
import { ofName } from '../../french';
import { ArrowRight, CalendarClock, CheckCircle2, Flame, Hourglass } from 'lucide-react';
import {
  SCHOOL_CALENDAR,
  addDays,
  countdownLabel,
  examStatusLabel,
  planGauges,
  type CalendarEvent,
  type Day,
  type RevisionPlan,
  type SessionLog
} from '../../calendar';
import { ganttWindow, weeklyNote, type ChildSnapshot, type WeeklyNote } from '../../planning';
import type { TimetableSlot } from '../../school';
import type { Profile } from '../../data';
import { GanttChart, GanttLegend, KpiRow, KpiTile, type GanttRow } from '../../components/PlanningTools';
import { EmptyState } from '../../components/ui';
import { TimetablePanel } from './InstitutionBoard';
import type { ModuleFollowUp } from './shared';

export interface ChildCalendarData {
  events: CalendarEvent[];
  plan: RevisionPlan;
  log: SessionLog[];
}

const capital = (text: string) => text.replace(/^./, (c) => c.toLocaleUpperCase('fr'));

/** Ce que l'on sait d'un enfant cette semaine, tiré de ses modules et de son plan de révision. */
export function childSnapshot(name: string, rows: ModuleFollowUp[], calendar: ChildCalendarData, today: Day): ChildSnapshot {
  const gauges = planGauges(calendar.plan, calendar.events, calendar.log, today);
  const started = rows.filter((r) => r.quiz !== 'passed' && r.percent > 0).sort((a, b) => a.percent - b.percent)[0];
  return {
    name,
    lateSessions: gauges.late,
    streak: gauges.streak,
    nextExam: gauges.examDays !== null && gauges.examTitle ? { title: gauges.examTitle, inDays: gauges.examDays } : undefined,
    readyForQuiz: rows.find((r) => r.lessonCount > 0 && r.lessonsRead >= r.lessonCount && r.quiz !== 'passed')?.title,
    slowest: started ? { title: started.title, percent: started.percent } : undefined,
    validated: rows.filter((r) => r.quiz === 'passed').length,
    total: rows.length
  };
}

export function WeeklyNoteCard({ note, firstName }: { note: WeeklyNote; firstName: string }) {
  return (
    <section className={`pl-note${note.tone === 'warn' ? ' is-warn' : ''}`} aria-label={`Message de la semaine pour ${firstName}`}>
      <p className="pl-note-kicker">Le message de la semaine</p>
      <p className="pl-note-text">{note.text}</p>
      <p className="pl-note-action">
        <b>Ce que vous pouvez faire.</b> {note.action}
      </p>
    </section>
  );
}

/** Carte de synthèse d'un enfant, sur l'accueil de l'espace famille. */
export function ChildCard({
  name,
  classLine,
  snapshot,
  onOpen
}: {
  name: string;
  classLine: string;
  snapshot: ChildSnapshot;
  onOpen: () => void;
}) {
  const note = weeklyNote(snapshot);
  return (
    <article className="pl-panel pl-child">
      <header className="pl-child-head">
        <span className="sc-initial" aria-hidden="true">
          {name.charAt(0)}
        </span>
        <span className="pl-row-title">
          <b>{name}</b>
          <small>{classLine}</small>
        </span>
        <button type="button" className="secondary ui-btn-sm" onClick={onOpen}>
          Voir le suivi <ArrowRight size={15} aria-hidden="true" />
        </button>
      </header>
      <div className={`pl-note${note.tone === 'warn' ? ' is-warn' : ''}`}>
        <p className="pl-note-text">{note.text}</p>
        <p className="pl-note-action">
          <b>Ce que vous pouvez faire.</b> {note.action}
        </p>
      </div>
      <dl className="pl-child-facts tabular-nums">
        <div>
          <dt>Modules validés</dt>
          <dd>
            {snapshot.validated} / {snapshot.total}
          </dd>
        </div>
        <div>
          <dt>Révision</dt>
          <dd>{snapshot.streak > 0 ? `${snapshot.streak} jour${snapshot.streak > 1 ? 's' : ''} de suite` : 'pas de série en cours'}</dd>
        </div>
        <div>
          <dt>Prochain examen</dt>
          <dd>{snapshot.nextExam ? capital(countdownLabel(snapshot.nextExam.inDays)) : 'aucun'}</dd>
        </div>
      </dl>
    </article>
  );
}

/** Le tableau de bord d'un enfant. */
export function ChildBoard({
  name,
  rows,
  calendar,
  slots,
  people,
  today,
  planIncluded = true,
  onUpgrade
}: {
  name: string;
  rows: ModuleFollowUp[];
  calendar: ChildCalendarData;
  slots: TimetableSlot[];
  people: Profile[];
  today: Day;
  /** Formule Famille : le plan de révision et l'emploi du temps de l'enfant. */
  planIncluded?: boolean;
  onUpgrade?: () => void;
}) {
  const firstName = name.split(' ')[0];
  const snapshot = childSnapshot(name, rows, calendar, today);
  const window = ganttWindow(today, 1, 6);
  const exams = calendar.plan.exams.filter((e) => e.status !== 'past');

  // Une ligne par examen : la période de révision (remplie selon les séances faites), puis le jour de l'épreuve.
  const ganttRows: GanttRow[] = exams.map((exam) => {
    const days = [
      ...calendar.plan.sessions.filter((s) => s.examId === exam.examId).map((s) => s.day),
      ...calendar.log.filter((entry) => entry.examId === exam.examId).map((entry) => entry.day)
    ].sort();
    const eve = addDays(exam.examDay, -1);
    const start = days[0] && days[0] <= eve ? days[0] : eve;
    const flagged = exam.status === 'late' || exam.status === 'overload';
    return {
      id: exam.examId,
      label: exam.title,
      sub: `${capital(countdownLabel(exam.daysLeft))}${flagged ? ` · ${examStatusLabel(exam).toLowerCase()}` : ''}`,
      bars: [
        {
          id: `${exam.examId}-rev`,
          label: `Révisions · ${exam.done} / ${exam.total}`,
          start,
          end: eve,
          tone: 'brand',
          progress: Math.round((exam.done / Math.max(1, exam.total)) * 100),
          detail: `${exam.done} séance${exam.done > 1 ? 's' : ''} faite${exam.done > 1 ? 's' : ''} sur ${exam.total}`
        },
        { id: `${exam.examId}-day`, label: 'Épreuve', start: exam.examDay, end: exam.examDay, tone: 'warm' }
      ]
    };
  });
  const shades = SCHOOL_CALENDAR.entries.filter((e) => e.kind === 'break').map((e) => ({ start: e.start, end: e.end || e.start, label: e.title }));

  return (
    <div className="pl-board">
      <WeeklyNoteCard note={weeklyNote(snapshot)} firstName={firstName} />

      <KpiRow label={`Chiffres clés ${ofName(firstName)}`}>
        <KpiTile label="Modules validés" value={`${snapshot.validated} / ${snapshot.total}`} hint="de sa classe" icon={<CheckCircle2 size={15} aria-hidden="true" />} />
        <KpiTile
          label="Révision"
          value={snapshot.streak}
          hint={snapshot.streak > 1 ? 'jours de suite' : 'jour de suite'}
          icon={<Flame size={15} aria-hidden="true" />}
        />
        <KpiTile
          label="Prochain examen"
          value={snapshot.nextExam ? `J-${snapshot.nextExam.inDays}` : '—'}
          hint={snapshot.nextExam ? snapshot.nextExam.title : 'aucun dans son calendrier'}
          icon={<CalendarClock size={15} aria-hidden="true" />}
        />
        <KpiTile
          label="Séances en retard"
          value={snapshot.lateSessions}
          tone={snapshot.lateSessions > 0 ? 'warn' : 'plain'}
          hint={snapshot.lateSessions > 0 ? 'déjà replacées dans son plan' : 'à jour'}
          icon={<Hourglass size={15} aria-hidden="true" />}
        />
      </KpiRow>

      {!planIncluded ? (
        <section className="pl-panel">
          <EmptyState
            title="Plan de révision et emploi du temps"
            text={`Avec la formule Famille, vous suivez le plan de révision et l’emploi du temps ${ofName(firstName)}.`}
            action={onUpgrade ? { label: 'Voir la formule Famille', onClick: onUpgrade } : undefined}
          />
        </section>
      ) : (
        <>
          <div className="pl-toolbar">
            <div>
              <h2>Plan de révision</h2>
              <p>Une ligne par examen : la période de révision se remplit à mesure que {firstName} fait ses séances.</p>
            </div>
          </div>
          {ganttRows.length === 0 ? (
            <section className="pl-panel">
              <EmptyState title="Aucun examen dans son calendrier" text={`${firstName} n’a pas encore ajouté d’examen à préparer.`} />
            </section>
          ) : (
            <>
              <GanttChart window={window} rows={ganttRows} today={today} shades={shades} label={`Plan de révision ${ofName(firstName)}`} />
              <GanttLegend
                items={[
                  { tone: 'brand', label: 'Révisions (remplissage : séances faites)' },
                  { tone: 'warm', label: 'Épreuve' },
                  { tone: 'shade', label: 'Congés' },
                  { tone: 'today', label: 'Aujourd’hui' }
                ]}
              />
            </>
          )}

          <div className="pl-toolbar">
            <div>
              <h2>Emploi du temps</h2>
              <p>Sa semaine de cours, telle que son établissement l’a saisie.</p>
            </div>
          </div>
          <TimetablePanel slots={slots} people={people} today={today} label={`Emploi du temps ${ofName(firstName)}`} />
        </>
      )}
    </div>
  );
}
