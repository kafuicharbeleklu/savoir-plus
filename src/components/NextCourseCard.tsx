/**
 * Sous les rubriques de l'espace encadrant : le cours en cours ou le prochain, d'après l'emploi du temps.
 */
import React from 'react';
import { addDays, formatDayLong, type Day } from '../calendar';
import { clockLabel, type TimetableSlot } from '../school';

export function NextCourseCard({
  slot,
  day,
  today,
  live,
  className,
  onOpen
}: {
  slot: TimetableSlot;
  day: Day;
  today: Day;
  live: boolean;
  className: string;
  onOpen: () => void;
}) {
  const when = day === today ? 'Aujourd’hui' : day === addDays(today, 1) ? 'Demain' : formatDayLong(day);
  return (
    <section className="next-course" aria-label={live ? 'Cours en ce moment' : 'Prochain cours'}>
      <p className="next-course-kicker">{live ? 'Cours en ce moment' : 'Prochain cours'}</p>
      <p className="next-course-title">
        {className} · {slot.subject}
      </p>
      <p className="next-course-meta">
        {when}, {clockLabel(slot.start)} – {clockLabel(slot.end)}
        {slot.room ? ` · ${slot.room}` : ''}
      </p>
      <button type="button" className="li-text-link" onClick={onOpen}>
        Ouvrir la classe
      </button>
    </section>
  );
}
