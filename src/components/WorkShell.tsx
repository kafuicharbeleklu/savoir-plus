/**
 * Coque « espace de travail » : une barre latérale (identité de l'espace, rubriques) et un plan de
 * travail en pleine largeur. Elle sert aux espaces établissement, encadrant, famille, Studio et
 * gouvernance, comme LinkedIn quitte son fil pour ses outils professionnels. Le réseau (accueil,
 * relations, messagerie) garde ses trois colonnes ; le lecteur de cours garde la sienne.
 */
import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

export interface WorkNavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  /** Pastille à la place de l'icône (initiale d'un enfant, par exemple). */
  avatar?: React.ReactNode;
  /** Seconde ligne, coupée par « … » si elle est trop longue. */
  meta?: React.ReactNode;
  count?: number;
  /** Le compteur signale quelque chose à traiter. */
  urgent?: boolean;
  active?: boolean;
  onSelect: () => void;
}

export interface WorkNavGroup {
  label?: string;
  items: WorkNavItem[];
}

export interface WorkSpaceLink {
  id: string;
  label: string;
  onSelect: () => void;
}

export function WorkShell({
  space,
  label,
  mark,
  title,
  subtitle,
  spaces = [],
  currentSpace,
  groups,
  extra,
  footer,
  children
}: {
  /** Espace affiché : sert aux règles propres à chaque espace (onglets remplacés par la barre latérale). */
  space: string;
  /** Nom de la navigation pour les lecteurs d'écran. */
  label: string;
  mark: React.ReactNode;
  title: string;
  subtitle?: string;
  /** Les autres espaces de la personne : le sélecteur n'apparaît que s'il y en a plus d'un. */
  spaces?: WorkSpaceLink[];
  currentSpace?: string;
  groups: WorkNavGroup[];
  /** Contenu propre à l'espace, sous l'identité (sélecteur de vue de la gouvernance). */
  extra?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canSwitch = spaces.length > 1;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const identity = (
    <>
      <span className="work-space-mark" aria-hidden="true">
        {mark}
      </span>
      <span className="work-space-text">
        <b>{title}</b>
        {subtitle && <small>{subtitle}</small>}
      </span>
    </>
  );

  return (
    <div className="work-shell">
      <aside className="work-side" aria-label={label}>
        <div className="work-space" ref={wrapRef}>
          {canSwitch ? (
            <button
              type="button"
              className="work-space-btn"
              aria-haspopup="menu"
              aria-expanded={open}
              aria-controls={menuId}
              onClick={() => setOpen((v) => !v)}
            >
              {identity}
              <ChevronsUpDown size={16} aria-hidden="true" className="work-space-chevron" />
            </button>
          ) : (
            <div className="work-space-btn is-static">{identity}</div>
          )}
          {canSwitch && open && (
            <div className="work-space-menu" id={menuId} role="menu" aria-label="Changer d’espace">
              {spaces.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="menuitem"
                  className={s.id === currentSpace ? 'is-current' : ''}
                  onClick={() => {
                    setOpen(false);
                    s.onSelect();
                  }}
                >
                  <span>{s.label}</span>
                  {s.id === currentSpace && <Check size={15} aria-hidden="true" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {extra}

        <nav className="work-nav" aria-label={label}>
          {groups.map((group, index) => (
            <div className="work-nav-group" key={group.label || index}>
              {group.label && <span className="work-nav-label">{group.label}</span>}
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`work-nav-item${item.active ? ' is-active' : ''}${item.meta ? ' has-meta' : ''}`}
                  aria-current={item.active ? 'page' : undefined}
                  onClick={item.onSelect}
                >
                  {item.avatar || item.icon}
                  <span className="work-nav-text">
                    <span className="work-nav-name">{item.label}</span>
                    {item.meta && <small>{item.meta}</small>}
                  </span>
                  {item.count !== undefined && item.count > 0 && (
                    <em className={`work-nav-count tabular-nums${item.urgent ? ' is-urgent' : ''}`}>{item.count}</em>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {footer && <div className="work-side-foot">{footer}</div>}
      </aside>
      <main className="work-canvas" data-space={space}>
        {children}
      </main>
    </div>
  );
}
