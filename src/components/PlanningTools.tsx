/**
 * Outils de pilotage : diagramme de Gantt, grille d'emploi du temps, tuiles de chiffres clés.
 * Les calculs de position viennent de `planning.ts` ; ces composants ne font que dessiner.
 */
import React, { useLayoutEffect, useRef, useState } from 'react';
import { formatDayShort, formatRange, type Day } from '../calendar';
import { barGeometry, dayPosition, gridBounds, mondayOf, slotGeometry, type BarGeometry, type GanttWindow } from '../planning';

/** Largeur estimée d'un titre de barre (12 px, demi-gras), marges comprises. */
const labelWidth = (text: string) => text.length * 6.7 + 18;
/** Largeur estimée d'un titre posé au-dessus de sa barre (11 px). */
const topLabelWidth = (text: string) => text.length * 6.1;

export type LabelPlace = 'inside' | 'after' | 'above' | 'hidden';

/**
 * Où écrire le titre de chaque barre : dedans s'il tient ; sinon juste après, si la place est libre
 * jusqu'à la barre suivante ; sinon au-dessus, s'il tient avant le début de la barre suivante ;
 * sinon nulle part (l'infobulle et les lecteurs d'écran le donnent). Jamais de titre coupé par « … ».
 * Tant que la largeur n'est pas connue (rendu côté serveur, tests), le titre reste dans sa barre.
 */
export function placeLabels(bars: GanttBar[], window: GanttWindow, trackPx: number): { bar: GanttBar; at: BarGeometry; place: LabelPlace }[] {
  const placed = bars
    .map((bar) => ({ bar, at: barGeometry(bar.start, bar.end, window) }))
    .filter((p): p is { bar: GanttBar; at: BarGeometry } => p.at !== null)
    .sort((a, b) => a.at.left - b.at.left);
  return placed.map(({ bar, at }, i) => {
    const keep = (place: LabelPlace) => ({ bar, at, place });
    if (!trackPx) return keep('inside');
    const need = labelWidth(bar.label);
    if (need <= (at.width / 100) * trackPx) return keep('inside');
    const nextLeft = i + 1 < placed.length ? placed[i + 1].at.left : 100;
    const room = ((nextLeft - (at.left + at.width)) / 100) * trackPx;
    if (need - 6 <= room) return keep('after');
    const span = ((nextLeft - at.left) / 100) * trackPx;
    return keep(topLabelWidth(bar.label) <= span - 8 ? 'above' : 'hidden');
  });
}

/* ------------------------------------------------------------------ Chiffres clés */

export function KpiTile({
  label,
  value,
  unit,
  hint,
  tone = 'plain',
  icon,
  trend,
  meter
}: {
  label: string;
  value: React.ReactNode;
  /** Unité ou dénominateur, plus petit que le chiffre (« sur 24 »). */
  unit?: string;
  /** Ce qui met le chiffre en perspective : une unité, une échéance, un écart. */
  hint?: React.ReactNode;
  tone?: 'plain' | 'brand' | 'warn';
  icon?: React.ReactNode;
  /** Évolution sur les dernières semaines : une petite courbe à droite du chiffre. */
  trend?: React.ReactNode;
  /** Jauge sous le chiffre, avec le trait de l'attendu. */
  meter?: { value: number; expected: number | null; label: string };
}) {
  return (
    <div className={`pl-kpi is-${tone}${trend ? ' has-trend' : ''}`}>
      <span className="pl-kpi-label">
        {icon}
        {label}
      </span>
      <span className="pl-kpi-figure">
        <b className="pl-kpi-value">
          {value}
          {unit && <small>{unit}</small>}
        </b>
        {trend && <span className="pl-kpi-trend">{trend}</span>}
      </span>
      {meter && (
        <span className="pl-kpi-meter" role="img" aria-label={meter.label}>
          <i style={{ width: `${Math.max(0, Math.min(100, meter.value))}%` }} />
          {meter.expected !== null && <em style={{ left: `${Math.max(0, Math.min(100, meter.expected))}%` }} />}
        </span>
      )}
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
  // Largeur réelle de la frise : décide si un titre tient dans sa barre, juste après, ou pas du tout
  // (il reste alors dans l'infobulle et pour les lecteurs d'écran). Jamais de titre coupé par « … ».
  const weeksRef = useRef<HTMLDivElement>(null);
  const [trackPx, setTrackPx] = useState(0);
  useLayoutEffect(() => {
    const el = weeksRef.current;
    if (!el) return;
    const measure = () => setTrackPx(el.getBoundingClientRect().width);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="pl-gantt" role="group" aria-label={label}>
     <div className="pl-gantt-inner">
      <div className="pl-gantt-head">
        <span className="pl-gantt-corner" aria-hidden="true" />
        <div className="pl-gantt-weeks" aria-hidden="true" ref={weeksRef}>
          {/* La semaine en cours se repère dans l'en-tête ; le trait d'aujourd'hui traverse les lignes. */}
          {window.weeks.map((monday) => (
            <span key={monday} style={{ width: `${weekWidth}%` }} className={monday === mondayOf(today) ? 'is-now' : undefined}>
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
              {placeLabels(row.bars, window, trackPx).map(({ bar, at, place }) => {
                const spoken = `${bar.label}, ${formatRange(bar.start, bar.end)}${bar.detail ? `, ${bar.detail}` : ''}`;
                const classes = `pl-gantt-bar is-${bar.tone}${at.clippedStart ? ' is-cut-start' : ''}${at.clippedEnd ? ' is-cut-end' : ''}`;
                const inner = (
                  <>
                    {bar.progress !== undefined && <i className="pl-gantt-fill" style={{ width: `${Math.max(0, Math.min(100, bar.progress))}%` }} />}
                    {place === 'inside' && <span>{bar.label}</span>}
                  </>
                );
                const after =
                  place === 'after' ? (
                    <span className="pl-gantt-outlabel" style={{ left: `calc(${at.left + at.width}% + 6px)` }} aria-hidden="true">
                      {bar.label}
                    </span>
                  ) : place === 'above' ? (
                    <span className="pl-gantt-toplabel" style={{ left: `${at.left}%` }} aria-hidden="true">
                      {bar.label}
                    </span>
                  ) : null;
                return (
                  <React.Fragment key={bar.id}>
                    {onBarClick ? (
                      <button
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
                      <span className={classes} style={{ left: `${at.left}%`, width: `${at.width}%` }} title={spoken} role="img" aria-label={spoken}>
                        {inner}
                      </span>
                    )}
                    {after}
                  </React.Fragment>
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
