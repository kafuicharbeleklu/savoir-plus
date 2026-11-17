/**
 * Bulle de visite guidée : la page s'assombrit, l'élément montré reste clair et une bulle
 * l'explique. Une action principale (celle de l'élément montré) et un lien pour fermer.
 * – Échap ou un clic hors de la bulle ferme ; un clic sur l'élément montré déclenche l'action.
 * – La bulle se place sous l'élément si elle y tient, sinon au-dessus, et suit la fenêtre.
 */
import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { computeCoachLayout, type CoachLayout } from '../tour';

export function CoachMark({
  target,
  title,
  children,
  actionLabel,
  onAction,
  dismissLabel = 'Compris',
  onClose
}: {
  /** Élément à montrer. */
  target: HTMLElement | null;
  title: string;
  children: React.ReactNode;
  actionLabel: string;
  onAction: () => void;
  dismissLabel?: string;
  onClose: () => void;
}) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [layout, setLayout] = useState<CoachLayout | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Position : mesurée avant l'affichage, puis à chaque redimensionnement ou défilement.
  useLayoutEffect(() => {
    if (!target) return;
    const update = () => {
      const bubble = bubbleRef.current;
      if (!bubble) return;
      const rect = target.getBoundingClientRect();
      setLayout(
        computeCoachLayout(
          { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
          { width: bubble.offsetWidth, height: bubble.offsetHeight },
          { width: window.innerWidth, height: window.innerHeight }
        )
      );
    };
    // Sur un petit écran, l'élément peut être sous la ligne de flottaison.
    target.scrollIntoView({ block: 'center' });
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [target]);

  // Clavier : la bulle prend le focus, Échap ferme, le focus revient ensuite où il était.
  const hasTarget = Boolean(target);
  useEffect(() => {
    if (!hasTarget) return;
    const previous = document.activeElement as HTMLElement | null;
    bubbleRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [hasTarget]);

  if (!target) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const spot = layout?.spot;
    const onTarget =
      spot !== undefined &&
      e.clientX >= spot.left &&
      e.clientX <= spot.left + spot.width &&
      e.clientY >= spot.top &&
      e.clientY <= spot.top + spot.height;
    if (onTarget) onAction();
    else onClose();
  };

  const bubbleStyle: React.CSSProperties = layout
    ? ({ top: layout.top, left: layout.left, '--tour-arrow-x': `${layout.arrowX}px` } as React.CSSProperties)
    : { top: 0, left: 0, visibility: 'hidden' };

  // Rendu dans <body>, comme les fenêtres : aucun ancêtre ne peut décaler les éléments fixes.
  return createPortal(
    <div className="tour-backdrop" onClick={handleBackdropClick}>
      {layout && (
        <div
          className="tour-spot"
          aria-hidden="true"
          style={{
            top: layout.spot.top,
            left: layout.spot.left,
            width: layout.spot.width,
            height: layout.spot.height
          }}
        />
      )}
      <div
        ref={bubbleRef}
        className={`tour-bubble is-${layout?.placement ?? 'below'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={bubbleStyle}
      >
        <h2 id={titleId}>{title}</h2>
        <p>{children}</p>
        <div className="tour-actions">
          <button type="button" className="tour-skip" onClick={onClose}>
            {dismissLabel}
          </button>
          <button type="button" className="primary ui-btn-sm" onClick={onAction}>
            {actionLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
