/**
 * Représentations chiffrées de l'application. Le format suit la donnée :
 * – des décomptes le long d'un parcours (étapes dans l'ordre) → un histogramme par étapes ;
 * – un total réparti en deux parts, dans une cellule de tableau → une barre fine à deux segments ;
 * – un simple pourcentage dans un tableau → une jauge fine à côté du chiffre.
 * Toutes les valeurs sont écrites : rien ne se lit à la couleur seule.
 */
import React from 'react';

const clampPct = (value: number) => Math.max(0, Math.min(100, value));

/* ------------------------------------------------------------------ carte */

export function ChartCard({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="ch-card" aria-label={title}>
      <header className="ch-card-head">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ histogramme par étapes */

export interface StepColumn {
  key: string;
  /** Libellé court sous la colonne (le groupe porte le nom : « Sections lues » 1, 2, 3). */
  tick: string;
  value: number;
  /** Phrase complète, lue par les lecteurs d'écran et affichée au survol. */
  tip: string;
  /** Étape à revoir : colonne en rouge. */
  weak?: boolean;
}

/**
 * Histogramme d'un parcours : une colonne par étape, dans l'ordre où l'apprenant les rencontre,
 * regroupées par nature. Toutes les colonnes comptent la même chose (des apprenants) sur la même
 * échelle, ce qui permet de les lire d'un seul regard.
 */
export function StepColumns({ groups, max }: { groups: { label: string; columns: StepColumn[] }[]; max: number }) {
  const scale = Math.max(1, max);
  return (
    <div className="ch-steps" role="list">
      {groups.map((group, index) => (
        <div className="ch-steps-group" key={group.label || index} style={{ flexGrow: group.columns.length }} role="presentation">
          <div className="ch-steps-plot" role="presentation">
            {group.columns.map((column) => (
              <div
                className={`ch-step${column.weak ? ' is-weak' : ''}`}
                key={column.key}
                role="listitem"
                tabIndex={0}
                title={column.tip}
                aria-label={column.tip}
              >
                <span className="ch-step-bar" aria-hidden="true">
                  <b className="tabular-nums">{column.value}</b>
                  <i style={{ '--ratio': Math.min(column.value, scale) / scale } as React.CSSProperties} />
                </span>
                <span className="ch-step-tick" aria-hidden="true">
                  {column.tick}
                </span>
              </div>
            ))}
          </div>
          {group.label && (
            <span className="ch-steps-label" aria-hidden="true">
              {group.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ cellules de tableau */

/** Pourcentage accompagné d'une jauge fine, pour comparer une colonne d'un coup d'œil. */
export function InlineMeter({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return <span className="ch-inline is-empty">—</span>;
  return (
    <span className="ch-inline">
      <span className="ch-inline-track" aria-hidden="true">
        <i style={{ width: `${clampPct(value)}%` }} />
      </span>
      <b className="tabular-nums">{value} %</b>
    </span>
  );
}

/** Total réparti en deux parts (acquis, en cours) : le chiffre, puis une barre fine à deux segments. */
export function SplitCount({
  main,
  soft,
  max,
  mainLabel,
  softLabel
}: {
  main: number;
  soft: number;
  /** Plus grand total de la colonne : les barres se comparent d'une ligne à l'autre. */
  max: number;
  mainLabel: string;
  softLabel: string;
}) {
  const total = main + soft;
  const scale = Math.max(1, max);
  return (
    <span className="ch-inline" title={`${main} ${mainLabel} · ${soft} ${softLabel}`}>
      <span className="ch-split" aria-hidden="true">
        {main > 0 && <i className="is-main" style={{ width: `${(main / scale) * 100}%` }} />}
        {soft > 0 && <i className="is-soft" style={{ width: `${(soft / scale) * 100}%` }} />}
      </span>
      <b className="tabular-nums">{total}</b>
      <span className="sr-only">
        {' '}
        dont {main} {mainLabel} et {soft} {softLabel}
      </span>
    </span>
  );
}
