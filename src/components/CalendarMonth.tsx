/**
 * Affichage du calendrier : grille d'un mois, vignette de date, et carte de la colonne de droite
 * de l'accueil. Aucune logique ici : tout vient de `src/calendar.ts`.
 */
import React from 'react';
import { AlertTriangle, ArrowRight, CalendarClock, ClipboardList, Flame } from 'lucide-react';
import {
  buildMonthGrid,
  countdownLabel,
  eventCovers,
  formatDayLong,
  formatMonthShort,
  formatMonthTitle,
  marksForDay,
  nextExam,
  planGauges,
  type CalendarEvent,
  type Day,
  type ExamPlan,
  type PlanGauges,
  type PlannedSession,
  type RevisionPlan,
  type SessionLog
} from '../calendar';
import type { StatusTone } from './ui';

const WEEKDAYS: { short: string; initial: string; full: string }[] = [
  { short: 'Lun', initial: 'L', full: 'Lundi' },
  { short: 'Mar', initial: 'M', full: 'Mardi' },
  { short: 'Mer', initial: 'M', full: 'Mercredi' },
  { short: 'Jeu', initial: 'J', full: 'Jeudi' },
  { short: 'Ven', initial: 'V', full: 'Vendredi' },
  { short: 'Sam', initial: 'S', full: 'Samedi' },
  { short: 'Dim', initial: 'D', full: 'Dimanche' }
];

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

/** Ce qu'un jour contient, en une phrase (infobulle et lecteurs d'écran). */
function describeDay(day: Day, events: CalendarEvent[], planned: number, done: number): string {
  const parts = events.filter((e) => eventCovers(e, day)).map((e) => e.title);
  if (done > 0) parts.push(plural(done, 'séance faite', 'séances faites'));
  if (planned > 0) parts.push(plural(planned, 'séance prévue', 'séances prévues'));
  return parts.join(' · ');
}

/** Couleur du point d'état d'un examen dans le plan. */
export const examStatusTone = (status: ExamPlan['status']): StatusTone =>
  status === 'overload' || status === 'late' ? 'danger' : status === 'past' ? 'neutral' : 'info';

/** Grille d'un mois, du lundi au dimanche. Chaque jour est un bouton rond ; son aspect dit ce qu'il contient. */
export function MonthGrid({
  year,
  month,
  today,
  selected,
  events,
  sessions,
  log,
  onSelect,
  compact = false
}: {
  year: number;
  month: number;
  today: Day;
  selected?: Day;
  events: CalendarEvent[];
  sessions: PlannedSession[];
  log: SessionLog[];
  onSelect: (day: Day) => void;
  compact?: boolean;
}) {
  const weeks = buildMonthGrid(year, month);
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  return (
    <div className={`cal-grid${compact ? ' is-compact' : ''}`} role="group" aria-label={formatMonthTitle(year, month)}>
      {/* Les jours de la semaine ne sont pas lus : le nom de chaque bouton donne déjà le jour complet. */}
      <div className="cal-grid-head" aria-hidden="true">
        {WEEKDAYS.map((w) => (
          <span key={w.full}>{compact ? w.initial : w.short}</span>
        ))}
      </div>
      {weeks.map((week) => (
        <div key={week[0]} className="cal-grid-week">
          {week.map((day) => {
            const marks = marksForDay(day, events, sessions, log);
            const detail = describeDay(day, events, marks.planned, marks.done);
            // Un seul état visible par jour, du plus important au plus discret.
            const state =
              day === today
                ? 'is-today'
                : marks.exam
                  ? 'is-exam'
                  : marks.done > 0
                    ? 'is-done'
                    : marks.planned > 0
                      ? 'is-planned'
                      : marks.marker
                        ? 'is-marker'
                        : '';
            const classes = [
              'cal-day',
              day.startsWith(monthKey) ? '' : 'is-outside',
              marks.break ? 'is-break' : '',
              day === selected ? 'is-selected' : '',
              state
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <button
                key={day}
                type="button"
                className={classes}
                aria-label={detail ? `${formatDayLong(day)} : ${detail}` : formatDayLong(day)}
                aria-current={day === today ? 'date' : undefined}
                aria-pressed={selected ? day === selected : undefined}
                data-tip={detail || undefined}
                onClick={() => onSelect(day)}
              >
                <span className="cal-day-disc tabular-nums">{Number(day.slice(8))}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** Légende de la grille : les mêmes ronds, en petit. */
export function MonthLegend() {
  const items = [
    { state: 'is-planned', label: 'Séance prévue' },
    { state: 'is-done', label: 'Séance faite' },
    { state: 'is-exam', label: 'Examen' },
    { state: 'is-break', label: 'Congés' }
  ];
  return (
    <ul className="cal-legend" aria-label="Légende du calendrier">
      {items.map((item) => (
        <li key={item.label}>
          <i className={`cal-legend-disc ${item.state}`} aria-hidden="true" /> {item.label}
        </li>
      ))}
    </ul>
  );
}

/** Vignette de date : le jour en grand, le mois dessous. */
export function DateTile({ day, tone = 'neutral' }: { day: Day; tone?: 'neutral' | 'brand' | 'warm' }) {
  return (
    <span className={`cal-date-tile is-${tone}`} aria-hidden="true">
      <b className="tabular-nums">{Number(day.slice(8))}</b>
      <small>{formatMonthShort(day)}</small>
    </span>
  );
}

/* ------------------------------------------------------------------ Repères ronds */

type GaugeKind = 'flame' | 'pad' | 'page' | 'alert';
type GaugeTone = 'off' | 'brand' | 'warm' | 'danger';

const GAUGE_ICON: Record<GaugeKind, React.ReactNode> = {
  flame: <Flame size={18} aria-hidden="true" />,
  pad: <ClipboardList size={18} aria-hidden="true" />,
  page: <CalendarClock size={18} aria-hidden="true" />,
  alert: <AlertTriangle size={18} aria-hidden="true" />
};

function Gauge({
  kind,
  tone,
  value,
  label,
  onClick
}: {
  kind: GaugeKind;
  tone: GaugeTone;
  value: string;
  /** Ce que dit le repère, en toutes lettres : infobulle et lecteurs d'écran. */
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`cal-gauge is-${kind} is-${tone}`} aria-label={label} data-tip={label} onClick={onClick}>
      <span className="cal-gauge-icon">{GAUGE_ICON[kind]}</span>
      <b className="tabular-nums" aria-hidden="true">
        {value}
      </b>
    </button>
  );
}

/**
 * Les quatre repères du plan : une icône dans un petit rond, le nombre à côté (il peut ainsi
 * grandir sans déborder). Le rond est gris tant qu'il n'y a rien à signaler.
 */
export function PlanGaugeRow({ gauges, onOpenPlan, onOpenExam }: { gauges: PlanGauges; onOpenPlan: () => void; onOpenExam: () => void }) {
  const { streak, doneToday, todo, examDays, examTitle, late, unplaced } = gauges;
  const alerts = late + unplaced;
  return (
    <div className="cal-gauges" role="group" aria-label="Repères du plan de révision">
      <Gauge
        kind="flame"
        tone={streak > 0 ? 'warm' : 'off'}
        value={String(streak)}
        label={
          streak > 0
            ? `Série : ${plural(streak, 'jour', 'jours')} de suite avec une séance faite`
            : 'Série : aucune séance faite hier ni aujourd’hui'
        }
        onClick={onOpenPlan}
      />
      <Gauge
        kind="pad"
        tone={todo > 0 ? 'brand' : 'off'}
        value={String(todo)}
        label={
          todo > 0
            ? `Aujourd’hui : ${plural(todo, 'séance à faire', 'séances à faire')}`
            : doneToday > 0
              ? `Aujourd’hui : ${plural(doneToday, 'séance faite', 'séances faites')}, plus rien à faire`
              : 'Aujourd’hui : aucune séance prévue'
        }
        onClick={onOpenPlan}
      />
      <Gauge
        kind="page"
        tone={examDays === null ? 'off' : examDays <= 7 ? 'warm' : 'brand'}
        value={examDays === null ? '–' : String(examDays)}
        label={examDays === null ? 'Aucun examen à venir' : `Prochain examen ${countdownLabel(examDays)} : ${examTitle}`}
        onClick={onOpenExam}
      />
      <Gauge
        kind="alert"
        tone={alerts > 0 ? 'danger' : 'off'}
        value={String(alerts)}
        label={
          unplaced > 0
            ? `${plural(unplaced, 'séance ne tient', 'séances ne tiennent')} pas avant l’examen`
            : late > 0
              ? `${plural(late, 'séance en retard, replacée', 'séances en retard, replacées')} dans le plan`
              : 'Aucune séance en retard'
        }
        onClick={onOpenPlan}
      />
    </div>
  );
}

/** Carte « Calendrier » de l'accueil : le mois en cours, quatre repères ronds, un lien vers la page. */
export function CalendarCard({
  today,
  events,
  plan,
  log,
  onOpen
}: {
  today: Day;
  events: CalendarEvent[];
  plan: RevisionPlan;
  log: SessionLog[];
  /** Ouvre la page Calendrier : sur un jour, sur le plan de révision, ou sur aujourd'hui. */
  onOpen: (target?: Day | 'plan') => void;
}) {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7)) - 1;
  const upcoming = nextExam(events, today);

  return (
    <section className="rail-card cal-card" aria-label="Calendrier">
      <div className="cal-card-head">
        <h2 className="discover-feed-title">Calendrier</h2>
        <span className="cal-card-month">{formatMonthTitle(year, month)}</span>
      </div>
      <MonthGrid
        compact
        year={year}
        month={month}
        today={today}
        events={events}
        sessions={plan.sessions}
        log={log}
        onSelect={(day) => onOpen(day)}
      />
      <PlanGaugeRow
        gauges={planGauges(plan, events, log, today)}
        onOpenPlan={() => onOpen('plan')}
        onOpenExam={() => onOpen(upcoming ? upcoming.start : undefined)}
      />
      <button type="button" className="rail-card-foot" onClick={() => onOpen()}>
        Ouvrir le calendrier <ArrowRight size={16} aria-hidden="true" />
      </button>
    </section>
  );
}
