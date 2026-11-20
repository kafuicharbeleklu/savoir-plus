/**
 * Carte « Aujourd'hui » de l'accueil d'un apprenant : la journée (séances prévues), le module à
 * reprendre avec sa prochaine étape et le chemin parcouru en segments, une seule action principale,
 * puis les quatre repères ronds du plan de révision. L'illustration du module reste en fond de la
 * carte, nette, fondue sous le texte (le flou la rendait grise).
 * Pourquoi d'abord la séance du jour : des séances espacées et des quiz font retenir (Cepeda et al.,
 * 2006 ; Roediger et Karpicke, 2006) ; voir le chemin restant fait accélérer (Kivetz et al., 2006).
 */
import React from 'react';
import { Play } from 'lucide-react';
import { formatDayLong, type Day, type PlanGauges, type PlannedSession } from '../calendar';
import type { CatalogItem } from '../wireframeData';
import { CatalogCardBanner } from './CatalogVisuals';
import { PlanGaugeRow } from './CalendarMonth';

export interface TodayStep {
  label: string;
  done: boolean;
  kind: 'section' | 'quiz';
}

/** Ce qu'il reste à faire, en clair : « il reste 2 sections et le quiz », « il reste le quiz ». */
export function remainingLabel(steps: TodayStep[]): string {
  const sections = steps.filter((s) => s.kind === 'section' && !s.done).length;
  const quiz = steps.some((s) => s.kind === 'quiz' && !s.done);
  if (!sections && !quiz) return 'module terminé';
  const parts = [sections ? `${sections} section${sections > 1 ? 's' : ''}` : '', quiz ? 'le quiz' : ''].filter(Boolean);
  return `il reste ${parts.join(' et ')}`;
}

export function TodayCard({
  today,
  item,
  steps,
  next,
  verb,
  sessionsToday,
  gauges,
  onResume,
  onOpenPlan,
  onOpenExam
}: {
  today: Day;
  item: CatalogItem;
  /** Les sections du module puis son quiz, dans l'ordre. */
  steps: TodayStep[];
  /** La prochaine étape, en clair (« Quiz final · 3 questions · 75 XP »). */
  next: string;
  /** Commencer, Reprendre, Terminer, Revoir. */
  verb: 'Commencer' | 'Reprendre' | 'Terminer' | 'Revoir';
  sessionsToday: PlannedSession[];
  gauges: PlanGauges;
  onResume: () => void;
  onOpenPlan: () => void;
  onOpenExam: () => void;
}) {
  const done = steps.filter((s) => s.done).length;
  const sessions = sessionsToday.length
    ? `${sessionsToday.length} séance${sessionsToday.length > 1 ? 's' : ''} prévue${sessionsToday.length > 1 ? 's' : ''} aujourd’hui`
    : gauges.doneToday > 0
      ? 'séance du jour faite'
      : 'aucune séance prévue aujourd’hui';
  const titleVerb = verb === 'Terminer' ? 'Terminez' : verb === 'Commencer' ? 'Commencez' : verb === 'Revoir' ? 'Revoyez' : 'Reprenez';
  return (
    <article className="today-card" aria-label="Aujourd’hui">
      <div className="today-main">
        <div className="today-art" aria-hidden="true">
          <CatalogCardBanner item={item} />
        </div>
        <div className="today-body">
          <p className="today-kicker">
            {formatDayLong(today)} · {sessions}
          </p>
          <h2 className="today-title">
            {titleVerb} « {item.title} »
          </h2>
          <p className="today-next">{next}</p>
          <div className="today-steps" role="img" aria-label={`${done} étape${done > 1 ? 's' : ''} sur ${steps.length}`}>
            {steps.map((s, i) => (
              <i key={i} className={s.done ? 'is-done' : undefined} title={s.label} />
            ))}
          </div>
          <p className="today-steps-label">
            {done} étape{done > 1 ? 's' : ''} sur {steps.length} · {remainingLabel(steps)}
          </p>
          <div className="today-actions">
            <button type="button" className="primary" onClick={onResume}>
              <Play size={15} aria-hidden="true" /> {verb}
            </button>
          </div>
        </div>
      </div>
      <div className="today-gauges">
        <PlanGaugeRow gauges={gauges} onOpenPlan={onOpenPlan} onOpenExam={onOpenExam} />
      </div>
    </article>
  );
}
