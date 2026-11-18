/**
 * Bulle de la visite guidée (src/demoTour.ts) : elle attend que la page de l'étape ait affiché
 * l'élément à montrer, puis l'éclaire et l'explique. « Suivant », « Précédent », « Quitter la visite ».
 */
import React, { useEffect, useState } from 'react';
import { CoachMark } from './CoachMark';
import type { TourStep } from '../demoTour';

export function DemoTour({
  step,
  index,
  total,
  personaName,
  onNext,
  onPrev,
  onClose
}: {
  step: TourStep;
  index: number;
  total: number;
  personaName: string;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  // La page de l'étape se construit après le changement de personnage : on cherche l'élément
  // pendant trois secondes au plus, puis on se rabat sur le contenu principal.
  useEffect(() => {
    setTarget(null);
    let tries = 0;
    let frame = 0;
    const look = () => {
      const found = document.querySelector<HTMLElement>(step.target);
      if (found) {
        setTarget(found);
        return;
      }
      tries += 1;
      if (tries > 180) {
        setTarget(document.querySelector<HTMLElement>('.dashboard-main, .sc-page, main') || document.body);
        return;
      }
      frame = window.requestAnimationFrame(look);
    };
    frame = window.requestAnimationFrame(look);
    return () => window.cancelAnimationFrame(frame);
  }, [step.id, step.target]);

  const last = index === total - 1;
  return (
    <CoachMark
      key={step.id}
      target={target}
      title={step.title}
      actionLabel={last ? 'Terminer' : 'Suivant'}
      onAction={onNext}
      dismissLabel={last ? 'Fermer' : 'Quitter la visite'}
      onClose={onClose}
    >
      <p className="tour-step tabular-nums">
        {index + 1} / {total}
        {step.role !== 'Fin' && ` · ${step.role} : ${personaName}`}
      </p>
      <p>{step.text}</p>
      {index > 0 && (
        <button type="button" className="li-text-link tour-prev" onClick={onPrev}>
          Précédent
        </button>
      )}
    </CoachMark>
  );
}
