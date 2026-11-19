/**
 * Petite courbe d'évolution (tuile de chiffre clé, ligne de tableau) : un trait de 2 px, un voile
 * de 10 %, le dernier point marqué. Une ligne de référence facultative (l'attendu, le zéro d'un écart).
 * Le texte qui l'accompagne porte les valeurs : la courbe ne fait que montrer la tendance.
 */
import React from 'react';
import { sparkPoints } from '../trends';

export function Sparkline({
  values,
  label,
  width = 84,
  height = 30,
  tone = 'brand',
  domain,
  reference
}: {
  values: (number | null)[];
  /** Ce que lisent les lecteurs d'écran : la mesure et son évolution. */
  label: string;
  width?: number;
  height?: number;
  tone?: 'brand' | 'warm';
  /** Échelle imposée, pour comparer plusieurs courbes entre elles. */
  domain?: [number, number];
  /** Valeur de référence tracée en filet (0 pour un écart à l'attendu). */
  reference?: number;
}) {
  const pad = 3;
  const points = sparkPoints(values, width, height, pad, domain);
  if (points.length < 2) return null;
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join('');
  const area = `${line}V${height}H${points[0].x}Z`;
  const last = points[points.length - 1];
  let referenceY: number | null = null;
  if (reference !== undefined) {
    const present = values.filter((v): v is number => v !== null);
    const lo = domain ? domain[0] : Math.min(...present);
    const hi = domain ? domain[1] : Math.max(...present);
    if (reference >= lo && reference <= hi && hi > lo) referenceY = Math.round((height - pad - ((reference - lo) / (hi - lo)) * (height - pad * 2)) * 10) / 10;
  }
  return (
    <svg className={`sparkline is-${tone}`} viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label={label}>
      {referenceY !== null && <path className="sparkline-ref" d={`M${pad} ${referenceY}H${width - pad}`} />}
      <path className="sparkline-area" d={area} />
      <path className="sparkline-line" d={line} />
      <circle className="sparkline-dot" cx={last.x} cy={last.y} r="3.5" />
    </svg>
  );
}
