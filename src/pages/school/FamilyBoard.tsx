/**
 * Les outils de l'espace famille, pour chaque enfant : la lettre de la semaine (trois phrases au plus
 * et un geste pour le parent), les repères de la semaine, la préparation des compositions en
 * diagramme de Gantt et sa semaine, cours et révisions ensemble. Tout vient de son plan de
 * révision, de ses séances, de ses quiz et de son emploi du temps ; rien n'est transmis à l'école.
 */
import React, { useState } from 'react';
import { ofName } from '../../french';
import { ArrowRight, CalendarClock, CheckCircle2, ClipboardCheck, Flame, Send, Volume2 } from 'lucide-react';
import {
  SCHOOL_CALENDAR,
  addDays,
  countdownLabel,
  examStatusLabel,
  formatDayShort,
  planGauges,
  weekdayOf,
  type CalendarEvent,
  type Day,
  type RevisionPlan,
  type SessionLog
} from '../../calendar';
import { ganttWindow, mondayOf, weeklyLetter, type ChildSnapshot, type WeeklyLetter } from '../../planning';
import type { TimetableSlot } from '../../school';
import type { Profile } from '../../data';
import { GanttChart, GanttLegend, type GanttRow } from '../../components/PlanningTools';
import { EmptyState } from '../../components/ui';
import { PHOTOS } from '../../media';
import { clock, type ModuleFollowUp } from './shared';

export interface ChildCalendarData {
  events: CalendarEvent[];
  plan: RevisionPlan;
  log: SessionLog[];
}

const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const DAY_SHORT = ['Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.', 'Dim.'];

const duration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
};

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

/* ------------------------------------------------------------------ Lettre de la semaine */

function WeeklyLetterCard({
  letter,
  firstName,
  weekLabel,
  onWrite
}: {
  letter: WeeklyLetter;
  firstName: string;
  weekLabel: string;
  /** Ouvre la messagerie avec le mot proposé, que le parent relit avant de l'envoyer. */
  onWrite?: () => void;
}) {
  const [why, setWhy] = useState(false);
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  const speak = () => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const spoken = [letter.headline, letter.opening, letter.text, `Ce que vous pouvez faire : ${letter.action}`].filter(Boolean).join('. ');
    const utterance = new SpeechSynthesisUtterance(spoken);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.95;
    synth.speak(utterance);
  };
  return (
    <article className={`fm-letter${letter.tone === 'warn' ? ' is-warn' : ''}`} aria-label={`Lettre de la semaine pour ${firstName}`}>
      <div className="fm-letter-photo">
        <img src={PHOTOS.ecriture} alt="" loading="lazy" />
        <span>La lettre de la semaine · {weekLabel}</span>
      </div>
      <div className="fm-letter-body">
        <h2 className="fm-letter-title">{letter.headline}</h2>
        <div className="fm-letter-text">
          {letter.opening && <p>{letter.opening}</p>}
          <p>{letter.text}</p>
          <p>
            <b>Ce que vous pouvez faire.</b> {letter.action}
          </p>
        </div>
        <div className="fm-letter-actions">
          {onWrite && (
            <button type="button" className="primary ui-btn-sm" onClick={onWrite}>
              <Send size={15} aria-hidden="true" /> {letter.gesture}
            </button>
          )}
          {canSpeak && (
            <button type="button" className="li-text-link" onClick={speak}>
              <Volume2 size={15} aria-hidden="true" /> Écouter la lettre
            </button>
          )}
          <button type="button" className="li-text-link" aria-expanded={why} onClick={() => setWhy((v) => !v)}>
            Pourquoi ce résumé ?
          </button>
        </div>
        {why && (
          <p className="fm-letter-why">
            Rédigée à partir du plan de révision de {firstName}, de ses séances faites et de ses quiz sur SAVOIR+. Un seul sujet à la fois, le plus pressant
            d’abord : une information courte et régulière aide plus qu’un long bilan. Rien n’est transmis à l’école.
          </p>
        )}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ Repères ronds */

type MarkTone = 'off' | 'brand' | 'warm';

function Mark({ icon, tone, value, label }: { icon: React.ReactNode; tone: MarkTone; value: string; label: string }) {
  return (
    <li className={`fm-mark is-${tone}`}>
      <span className="fm-mark-icon" aria-hidden="true">
        {icon}
      </span>
      <b className="tabular-nums">{value}</b>
      <span>{label}</span>
    </li>
  );
}

function ChildMarks({ snapshot, weekDone, weekTotal }: { snapshot: ChildSnapshot; weekDone: number; weekTotal: number }) {
  const exam = snapshot.nextExam;
  return (
    <ul className="fm-marks" aria-label="Repères de la semaine">
      <Mark
        icon={<Flame size={17} />}
        tone={snapshot.streak > 0 ? 'warm' : 'off'}
        value={String(snapshot.streak)}
        label={snapshot.streak > 0 ? `${snapshot.streak > 1 ? 'jours' : 'jour'} de révision de suite` : 'pas de série en cours'}
      />
      <Mark
        icon={<ClipboardCheck size={17} />}
        tone={weekDone > 0 ? 'brand' : 'off'}
        value={String(weekDone)}
        label={weekTotal > 0 ? `${weekDone > 1 ? 'séances faites' : 'séance faite'} sur ${weekTotal} cette semaine` : 'séance prévue cette semaine'}
      />
      <Mark
        icon={<CalendarClock size={17} />}
        tone={!exam ? 'off' : exam.inDays <= 7 ? 'warm' : 'brand'}
        value={exam ? `J-${exam.inDays}` : '–'}
        label={exam ? exam.title : 'aucun examen à venir'}
      />
      <Mark
        icon={<CheckCircle2 size={17} />}
        tone={snapshot.validated > 0 ? 'brand' : 'off'}
        value={`${snapshot.validated} / ${snapshot.total}`}
        label="modules de sa classe validés"
      />
    </ul>
  );
}

/* ------------------------------------------------------------------ Révision de la semaine */

function WeekRevision({ log, today, firstName }: { log: SessionLog[]; today: Day; firstName: string }) {
  const monday = mondayOf(today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const minutes = days.map((d) => log.filter((e) => e.day === d).reduce((sum, e) => sum + e.minutes, 0));
  const total = minutes.reduce((a, b) => a + b, 0);
  const top = Math.max(60, ...minutes);
  return (
    <section className="pl-panel" aria-label={`Révision ${ofName(firstName)} cette semaine`}>
      <header className="pl-panel-head">
        <h2>Révision de la semaine</h2>
        <small>{total ? `${duration(total)} depuis lundi` : 'aucune séance faite'}</small>
      </header>
      <div className="fm-bars" role="img" aria-label={days.map((d, i) => `${DAY_SHORT[i]} ${minutes[i]} minutes`).join(', ')}>
        {days.map((d, i) => (
          <div key={d} className={`fm-bar${d === today ? ' is-today' : ''}${d > today ? ' is-future' : ''}`}>
            <span className="fm-bar-value tabular-nums">{minutes[i] ? minutes[i] : ''}</span>
            <span className="fm-bar-track">
              <i style={{ height: `${Math.round((minutes[i] / top) * 100)}%` }} />
            </span>
            <span className="fm-bar-day">{DAY_LETTERS[i]}</span>
          </div>
        ))}
      </div>
      <p className="fm-bars-note">En minutes, d’après les séances qu’il a cochées</p>
    </section>
  );
}

/* ------------------------------------------------------------------ Sa semaine : cours et révisions */

function ChildWeek({ slots, calendar, today }: { slots: TimetableSlot[]; calendar: ChildCalendarData; today: Day }) {
  const monday = mondayOf(today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const subjectOf = (examId: string) => calendar.plan.exams.find((x) => x.examId === examId)?.subject || 'Révision';
  return (
    <div className="fm-week" role="list">
      {days.map((d, i) => {
        const courses = slots.filter((s) => s.weekday === weekdayOf(d)).sort((a, b) => a.start.localeCompare(b.start));
        const done = calendar.log.filter((e) => e.day === d);
        const planned = d >= today ? calendar.plan.sessions.filter((s) => s.day === d) : [];
        const exams = calendar.plan.exams.filter((x) => x.examDay === d);
        const empty = courses.length + done.length + planned.length + exams.length === 0;
        return (
          <div key={d} className={`fm-day${d === today ? ' is-today' : ''}`} role="listitem" aria-label={`${DAY_SHORT[i]} ${formatDayShort(d)}`}>
            <div className="fm-day-head">
              <span>{DAY_SHORT[i]}</span>
              <b className="tabular-nums">{Number(d.slice(8))}</b>
            </div>
            {courses.map((c) => (
              <div key={c.id} className="fm-course">
                <span className="tabular-nums">{clock(c.start)}</span> {c.subject}
              </div>
            ))}
            {exams.map((x) => (
              <div key={x.examId} className="fm-sess is-exam">
                <b>{x.title}</b>Épreuve
              </div>
            ))}
            {done.map((e, k) => (
              <div key={`${e.examId}-${k}`} className="fm-sess is-done">
                <b>{subjectOf(e.examId)}</b>
                {duration(e.minutes)}, faite
              </div>
            ))}
            {planned.map((s) => (
              <div key={s.key} className={`fm-sess is-plan${s.catchUp ? ' is-catchup' : ''}`}>
                <b>{s.subject}</b>
                {duration(s.minutes)}
                {s.catchUp ? ', à rattraper' : d === today ? ', ce soir' : ''}
              </div>
            ))}
            {empty && <p className="fm-day-empty">{i === 6 ? 'Repos' : '—'}</p>}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ Carte d'un enfant (accueil) */

/**
 * Carte d'un enfant sur la vue d'ensemble : qui il est, le titre et la phrase de sa lettre, trois repères
 * en tuiles, puis « Voir le suivi ». Toutes les cartes ont la même taille (titre sur deux lignes, phrase
 * sur trois au plus), quel que soit le volume de la lettre.
 */
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
  const letter = weeklyLetter(snapshot);
  const exam = snapshot.nextExam;
  const firstName = name.split(' ')[0];
  return (
    <article className={`fm-kid${letter.tone === 'warn' ? ' is-warn' : ''}`} aria-label={name}>
      <header className="fm-kid-head">
        <span className="fm-head-initial" aria-hidden="true">
          {name.charAt(0)}
        </span>
        <span className="fm-kid-id">
          <b>{name}</b>
          <small>{classLine}</small>
        </span>
      </header>
      <div className="fm-kid-body">
        <p className="fm-kid-title">{letter.headline}</p>
        <p className="fm-kid-text">{letter.text}</p>
      </div>
      <ul className="fm-kid-facts tabular-nums" aria-label={`Repères ${ofName(firstName)}`}>
        <li>
          <b>
            {snapshot.validated} / {snapshot.total}
          </b>
          <span>modules validés</span>
        </li>
        <li>
          <b>{snapshot.streak}</b>
          <span>{snapshot.streak > 0 ? `${snapshot.streak > 1 ? 'jours' : 'jour'} de révision de suite` : 'pas de série en cours'}</span>
        </li>
        <li>
          <b>{exam ? `J-${exam.inDays}` : '–'}</b>
          <span>{exam ? exam.title : 'aucun examen à venir'}</span>
        </li>
      </ul>
      <button type="button" className="fm-kid-foot" onClick={onOpen}>
        Voir le suivi <ArrowRight size={16} aria-hidden="true" />
      </button>
    </article>
  );
}

/* ------------------------------------------------------------------ Tableau de bord d'un enfant */

export function ChildBoard({
  name,
  rows,
  calendar,
  slots,
  today,
  planIncluded = true,
  onUpgrade,
  onWrite
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
  /** Écrire à l'enfant, avec un mot déjà rédigé que le parent relit. */
  onWrite?: (draft: string) => void;
}) {
  const firstName = name.split(' ')[0];
  const snapshot = childSnapshot(name, rows, calendar, today);
  const letter = weeklyLetter(snapshot);
  const monday = mondayOf(today);
  const sunday = addDays(monday, 6);
  const weekDone = calendar.log.filter((e) => e.day >= monday && e.day <= sunday).length;
  const weekTotal = weekDone + calendar.plan.sessions.filter((s) => s.day >= today && s.day <= sunday).length;
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
    // La matière fait le titre de la ligne (« Mathématiques ») ; le type d'épreuve et l'échéance passent dessous.
    const kind = exam.subject && exam.title.includes('·') ? exam.title.split('·')[0].trim() : '';
    return {
      id: exam.examId,
      label: exam.subject || exam.title,
      sub: `${kind ? `${kind}, ` : ''}${countdownLabel(exam.daysLeft)}${flagged ? ` · ${examStatusLabel(exam).toLowerCase()}` : ''}`,
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
    <div className="pl-board fm-board">
      <div className="fm-top">
        <WeeklyLetterCard
          letter={letter}
          firstName={firstName}
          weekLabel={`semaine du ${formatDayShort(monday)}`}
          onWrite={onWrite ? () => onWrite(letter.draft) : undefined}
        />
        <div className="fm-side">
          <section className="pl-panel" aria-label="Repères de la semaine">
            <header className="pl-panel-head">
              <h2>Repères</h2>
              <small>cette semaine</small>
            </header>
            <ChildMarks snapshot={snapshot} weekDone={weekDone} weekTotal={weekTotal} />
          </section>
          <WeekRevision log={calendar.log} today={today} firstName={firstName} />
        </div>
      </div>

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
          <section className="pl-panel pl-panel-gantt" aria-label="Plan de révision">
            <header className="pl-panel-head">
              <h2>Plan de révision</h2>
              <small>Le remplissage montre les séances faites</small>
            </header>
            {ganttRows.length === 0 ? (
              <EmptyState title="Aucun examen dans son calendrier" text={`${firstName} n’a pas encore ajouté d’examen à préparer.`} />
            ) : (
              <div className="pl-gantt-embed">
                <GanttChart window={window} rows={ganttRows} today={today} shades={shades} label={`Plan de révision ${ofName(firstName)}`} />
                <GanttLegend
                  items={[
                    { tone: 'brand', label: 'Révisions (remplissage : séances faites)' },
                    { tone: 'warm', label: 'Épreuve' },
                    { tone: 'shade', label: 'Congés' },
                    { tone: 'today', label: 'Aujourd’hui' }
                  ]}
                />
              </div>
            )}
          </section>

          <section className="pl-panel" aria-label={`La semaine ${ofName(firstName)}`}>
            <header className="pl-panel-head">
              <h2>La semaine {ofName(firstName)}</h2>
              <small>Cours et révisions</small>
            </header>
            <ChildWeek slots={slots} calendar={calendar} today={today} />
            <p className="fm-legend">
              <span className="fm-key is-class" /> Cours <span className="fm-key is-done" /> Révision faite <span className="fm-key is-catchup" /> À rattraper{' '}
              <span className="fm-key is-plan" /> Prévue <span className="fm-key is-exam" /> Épreuve
            </p>
          </section>
        </>
      )}
    </div>
  );
}
