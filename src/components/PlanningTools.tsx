/**
 * Outils de pilotage : diagramme de Gantt, grille d'emploi du temps, tuiles de chiffres clés.
 * Les calculs de position viennent de `planning.ts` ; ces composants ne font que dessiner.
 */
import React from 'react';
import { formatDayShort, formatRange, type Day } from '../calendar';
import { barGeometry, dayPosition, gridBounds, slotGeometry, type GanttWindow } from '../planning';

/* ------------------------------------------------------------------ Chiffres clés */

export function KpiTile({
  label,
  value,
  hint,
  tone = 'plain',
  icon
}: {
  label: string;
  value: React.ReactNode;
  /** Ce qui met le chiffre en perspective : une unité, une échéance, un écart. */
  hint?: React.ReactNode;
  tone?: 'plain' | 'brand' | 'warn';
  icon?: React.ReactNode;
}) {
  return (
    <div className={`pl-kpi is-${tone}`}>
      <span className="pl-kpi-label">
        {icon}
        {label}
      </span>
      <b className="pl-kpi-value tabular-nums">{value}</b>
      {hint && <span className="pl-kpi-hint">{hint}</span>}
    </div>
  );
}

export function KpiRow({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <section className="pl-kpis" aria-label={label}>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ Diagramme de Gantt */

export interface GanttBar {
  id: string;
  label: string;
  start: Day;
  /** Dernier jour, inclus. */
  end: Day;
  /** Teinte : cours, révisions, évaluation, ou période terminée. */
  tone: 'brand' | 'soft' | 'warm' | 'done';
  /** Avancement réel, de 0 à 100 : il remplit la barre. */
  progress?: number;
  /** Ce que disent l'infobulle et les lecteurs d'écran, après le titre et les dates. */
  detail?: string;
}

export interface GanttRow {
  id: string;
  label: string;
  sub?: string;
  bars: GanttBar[];
}

export function GanttChart({
  window,
  rows,
  today,
  shades = [],
  onBarClick,
  label
}: {
  window: GanttWindow;
  rows: GanttRow[];
  today: Day;
  /** Périodes grisées sur toute la hauteur : congés, jours fériés. */
  shades?: { start: Day; end: Day; label: string }[];
  onBarClick?: (barId: string, rowId: string) => void;
  label: string;
}) {
  const todayAt = dayPosition(today, window);
  const weekWidth = 100 / window.weeks.length;
  return (
    <div className="pl-gantt" role="group" aria-label={label}>
     <div className="pl-gantt-inner">
      <div className="pl-gantt-head">
        <span className="pl-gantt-corner" aria-hidden="true" />
        <div className="pl-gantt-weeks" aria-hidden="true">
          {window.weeks.map((monday) => (
            <span key={monday} style={{ width: `${weekWidth}%` }}>
              {formatDayShort(monday)}
            </span>
          ))}
        </div>
      </div>

      <div className="pl-gantt-body">
        {/* Repères tracés sur toute la hauteur : semaines, congés, aujourd'hui. */}
        <div className="pl-gantt-overlay" aria-hidden="true">
          {window.weeks.map((monday, i) => (
            <i key={monday} className="pl-gantt-gridline" style={{ left: `${i * weekWidth}%` }} />
          ))}
          {shades.map((shade) => {
            const at = barGeometry(shade.start, shade.end, window);
            return at ? (
              <span key={shade.label + shade.start} className="pl-gantt-shade" style={{ left: `${at.left}%`, width: `${at.width}%` }}>
                <em>{shade.label}</em>
              </span>
            ) : null;
          })}
          {todayAt !== null && (
            <span className="pl-gantt-today" style={{ left: `${todayAt}%` }}>
              <em>Aujourd’hui</em>
            </span>
          )}
        </div>

        {rows.map((row) => (
          <div key={row.id} className="pl-gantt-row" role="group" aria-label={row.label}>
            <div className="pl-gantt-label">
              <b>{row.label}</b>
              {row.sub && <small>{row.sub}</small>}
            </div>
            <div className="pl-gantt-track">
              {row.bars.map((bar) => {
                const at = barGeometry(bar.start, bar.end, window);
                if (!at) return null;
                const spoken = `${bar.label}, ${formatRange(bar.start, bar.end)}${bar.detail ? `, ${bar.detail}` : ''}`;
                const classes = `pl-gantt-bar is-${bar.tone}${at.clippedStart ? ' is-cut-start' : ''}${at.clippedEnd ? ' is-cut-end' : ''}`;
                const inner = (
                  <>
                    {bar.progress !== undefined && <i className="pl-gantt-fill" style={{ width: `${Math.max(0, Math.min(100, bar.progress))}%` }} />}
                    <span>{bar.label}</span>
                  </>
                );
                return onBarClick ? (
                  <button
                    key={bar.id}
                    type="button"
                    className={classes}
                    style={{ left: `${at.left}%`, width: `${at.width}%` }}
                    title={spoken}
                    aria-label={spoken}
                    onClick={() => onBarClick(bar.id, row.id)}
                  >
                    {inner}
                  </button>
                ) : (
                  <span key={bar.id} className={classes} style={{ left: `${at.left}%`, width: `${at.width}%` }} title={spoken} role="img" aria-label={spoken}>
                    {inner}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
     </div>
    </div>
  );
}

export function GanttLegend({ items }: { items: { tone: GanttBar['tone'] | 'shade' | 'today'; label: string }[] }) {
  return (
    <ul className="pl-gantt-legend">
      {items.map((item) => (
        <li key={item.label}>
          <i className={`is-${item.tone}`} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ Grille d'emploi du temps */

export interface GridSlot {
  id: string;
  /** 1 = lundi … 6 = samedi. */
  weekday: number;
  start: string;
  end: string;
  subject: string;
  /** Deuxième ligne : enseignant, classe ou salle. */
  detail?: string;
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const clock = (value: string) => value.replace(/^0/, '').replace(':', ' h ').replace(/ h 00$/, ' h');

/** Teinte d'une matière : toujours la même pour un même nom, parmi quatre. */
const toneOf = (subject: string) => {
  let h = 0;
  for (let i = 0; i < subject.length; i += 1) h = (h * 31 + subject.charCodeAt(i)) >>> 0;
  return h % 4;
};

export function TimetableGrid({
  slots,
  todayWeekday,
  onSlotClick,
  label
}: {
  slots: GridSlot[];
  /** Jour à mettre en évidence (1 = lundi … 6 = samedi). */
  todayWeekday?: number;
  onSlotClick?: (slotId: string) => void;
  label: string;
}) {
  const bounds = gridBounds(slots);
  const hourHeight = 52;
  const height = ((bounds.end - bounds.start) / 60) * hourHeight;
  // Le samedi n'apparaît que s'il y a cours.
  const days = slots.some((s) => s.weekday === 6) ? DAYS : DAYS.slice(0, 5);
  return (
    <div className="pl-grid" role="group" aria-label={label} style={{ ['--pl-days' as string]: days.length }}>
      <div className="pl-grid-head">
        <span aria-hidden="true" />
        {days.map((day, i) => (
          <span key={day} className={todayWeekday === i + 1 ? 'is-today' : ''}>
            {day}
          </span>
        ))}
      </div>
      <div className="pl-grid-body" style={{ height }}>
        <div className="pl-grid-hours" aria-hidden="true">
          {bounds.hours.slice(0, -1).map((hour) => (
            <span key={hour} style={{ height: hourHeight }}>
              {hour} h
            </span>
          ))}
        </div>
        {days.map((day, i) => {
          const ofDay = slots.filter((s) => s.weekday === i + 1).sort((a, b) => a.start.localeCompare(b.start));
          return (
            <div key={day} className={`pl-grid-day${todayWeekday === i + 1 ? ' is-today' : ''}`} role="group" aria-label={day} style={{ backgroundSize: `100% ${hourHeight}px` }}>
              {ofDay.map((slot) => {
                const at = slotGeometry(slot, bounds);
                const spoken = `${slot.subject}, ${day.toLowerCase()} de ${clock(slot.start)} à ${clock(slot.end)}${slot.detail ? `, ${slot.detail}` : ''}`;
                const classes = `pl-grid-slot is-tone-${toneOf(slot.subject)}`;
                const style = { top: `${at.top}%`, height: `${at.height}%` };
                const inner = (
                  <>
                    <b>{slot.subject}</b>
                    <small>
                      {clock(slot.start)} – {clock(slot.end)}
                    </small>
                    {slot.detail && <small>{slot.detail}</small>}
                  </>
                );
                return onSlotClick ? (
                  <button key={slot.id} type="button" className={classes} style={style} title={spoken} aria-label={spoken} onClick={() => onSlotClick(slot.id)}>
                    {inner}
                  </button>
                ) : (
                  <div key={slot.id} className={classes} style={style} title={spoken}>
                    {inner}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
