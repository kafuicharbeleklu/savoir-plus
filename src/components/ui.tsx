/**
 * Composants d'interface communs (lot 1 de la refonte « sobre mais élégant »).
 * Règles : en-tête court, listes à lignes égales, statut = point + texte,
 * une action principale par écran, actions secondaires dans un menu « … »,
 * état vide partout, enregistrement automatique.
 */
import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, MoreHorizontal, Search, X } from 'lucide-react';

/* ------------------------------------------------------------------ En-tête */

export function PageHeader({
  title,
  subtitle,
  actions,
  back
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { label: string; onClick: () => void };
}) {
  return (
    <header className="ui-page-header">
      {back && (
        <button type="button" className="ui-back-link" onClick={back.onClick}>
          <ArrowLeft size={16} aria-hidden="true" /> {back.label}
        </button>
      )}
      <div className="ui-page-header-row">
        <div className="ui-page-header-text">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions && <div className="ui-page-header-actions">{actions}</div>}
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ Statut */

export type StatusTone = 'ok' | 'neutral' | 'warn' | 'danger' | 'info';

export function StatusDot({ tone = 'neutral', children }: { tone?: StatusTone; children: React.ReactNode }) {
  return (
    <span className={`ui-status ui-status-${tone}`}>
      <i aria-hidden="true" />
      {children}
    </span>
  );
}

/**
 * Mention de statut réservée aux alertes. Un état normal ne s'annonce pas (la ligne s'affiche
 * normalement) et un état pas encore atteint s'affiche en gris : seul ce qui demande une action
 * garde un point de couleur et un libellé.
 */
export function AlertStatus({ tone, children }: { tone: StatusTone; children: React.ReactNode }) {
  if (tone !== 'warn' && tone !== 'danger') return null;
  return <StatusDot tone={tone}>{children}</StatusDot>;
}

/* ------------------------------------------------------------------ Listes */

/** Carte contenant une liste ; toutes les lignes ont la même hauteur. */
export function ListCard({
  children,
  label,
  className = ''
}: {
  children: React.ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <div className={`ui-list ${className}`} role="list" aria-label={label}>
      {children}
    </div>
  );
}

/**
 * Ligne de liste : [visuel] titre / méta (une ligne chacun, coupés par « … ») [à droite].
 * Si onClick est fourni, toute la ligne est cliquable (les éléments de droite restent indépendants).
 */
export function ListRow({
  leading,
  title,
  meta,
  trailing,
  onClick,
  active = false,
  ariaLabel
}: {
  leading?: React.ReactNode;
  title: React.ReactNode;
  meta?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  ariaLabel?: string;
}) {
  return (
    <div role="listitem" className={`ui-row ${onClick ? 'is-clickable' : ''} ${active ? 'is-active' : ''}`}>
      {onClick ? (
        <button type="button" className="ui-row-main" onClick={onClick} aria-label={ariaLabel} aria-current={active ? 'true' : undefined}>
          {leading && <span className="ui-row-leading">{leading}</span>}
          <span className="ui-row-text">
            <span className="ui-row-title">{title}</span>
            {meta && <span className="ui-row-meta">{meta}</span>}
          </span>
        </button>
      ) : (
        <div className="ui-row-main">
          {leading && <span className="ui-row-leading">{leading}</span>}
          <span className="ui-row-text">
            <span className="ui-row-title">{title}</span>
            {meta && <span className="ui-row-meta">{meta}</span>}
          </span>
        </div>
      )}
      {trailing && <div className="ui-row-trailing">{trailing}</div>}
    </div>
  );
}

/** Pastille d'icône carrée (type de contenu, file…) pour le visuel d'une ligne. */
export function IconTile({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'brand' }) {
  return <span className={`ui-icon-tile ${tone === 'brand' ? 'is-brand' : ''}`}>{children}</span>;
}

/* ------------------------------------------------------------------ Menu « … » */

export type ActionMenuItem = {
  label: string;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
  hidden?: boolean;
};

export function ActionMenu({
  items,
  label = 'Plus d’actions',
  trigger,
  triggerClassName = 'secondary ui-btn-sm'
}: {
  items: ActionMenuItem[];
  label?: string;
  /** Contenu du bouton (par défaut « … »). */
  trigger?: React.ReactNode;
  /** Classes du bouton quand `trigger` est fourni. */
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const visible = items.filter((i) => !i.hidden);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  if (visible.length === 0) return null;
  return (
    <div className="li-menu" ref={ref}>
      <button
        type="button"
        className={trigger ? triggerClassName : 'li-icon-btn'}
        aria-label={trigger ? undefined : label}
        title={trigger ? undefined : label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        {trigger || <MoreHorizontal size={20} aria-hidden="true" />}
      </button>
      {open && (
        <div className="li-menu-list" role="menu">
          {visible.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              className={it.danger ? 'is-danger' : ''}
              disabled={it.disabled}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                it.onSelect();
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Onglets */

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label
}: {
  items: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div className="ui-tabs" role="tablist" aria-label={label}>
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          className={value === t.id ? 'is-selected' : ''}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {typeof t.count === 'number' && <span className="ui-tab-count tabular-nums">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Recherche */

export function SearchField({
  value,
  onChange,
  placeholder,
  label
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <label className="li-search ui-search">
      <Search size={16} aria-hidden="true" />
      <input type="search" placeholder={placeholder} aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

/* ------------------------------------------------------------------ État vide */

export function EmptyState({
  title,
  text,
  action
}: {
  title: string;
  text?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="ui-empty">
      <b>{title}</b>
      {text && <p>{text}</p>}
      {action && (
        <button type="button" className="li-text-link" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Interrupteur */

export function Toggle({
  checked,
  onChange,
  label,
  description
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  const id = useId();
  return (
    <div className="ui-toggle-row">
      <span className="ui-toggle-text">
        <label htmlFor={id}>{label}</label>
        {description && <small>{description}</small>}
      </span>
      <span className="ui-toggle-state">{checked ? 'Activé' : 'Désactivé'}</span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        className={`ui-switch ${checked ? 'is-on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <i aria-hidden="true" />
      </button>
    </div>
  );
}

/** Liste de choix exclusifs (boutons radio) façon LinkedIn. */
export function RadioList<T extends string>({
  name,
  value,
  options,
  onChange,
  legend
}: {
  name: string;
  value: T;
  options: { value: T; label: string; hint?: string }[];
  onChange: (v: T) => void;
  legend: string;
}) {
  return (
    <fieldset className="ui-radio-list">
      <legend className="sr-only">{legend}</legend>
      {options.map((o) => (
        <label key={o.value} className={`ui-radio ${value === o.value ? 'is-checked' : ''}`}>
          <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
          <span>
            {o.label}
            {o.hint && <small>{o.hint}</small>}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

/* ------------------------------------------------------------------ Enregistré */

export function SavedIndicator({ at }: { at?: number | null }) {
  if (!at) return null;
  const time = new Date(at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return (
    <span className="ui-saved" role="status">
      Enregistré · {time}
    </span>
  );
}

/* ------------------------------------------------------------------ Panneau latéral */

/**
 * Fenêtre centrée, sur le modèle de LinkedIn : titre et fermeture en tête, corps défilant,
 * actions en pied. `flush` retire les marges du corps (aperçu d'image, éditeur).
 */
export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  size = 'md',
  flush = false
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  flush?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="ui-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className={`ui-modal is-${size}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
        <header className="ui-modal-head">
          <h2>{title}</h2>
          <button type="button" className="ui-modal-close" aria-label="Fermer" onClick={onClose}>
            <X size={24} aria-hidden="true" />
          </button>
        </header>
        <div className={`ui-modal-body${flush ? ' is-flush' : ''}`}>{children}</div>
        {footer && <footer className="ui-modal-foot">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}

export function SidePanel({
  open,
  title,
  onClose,
  children,
  footer,
  wide = false
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  // Rendu dans <body> : un ancêtre animé (transform) deviendrait sinon le repère du panneau fixe.
  return createPortal(
    <div className="ui-panel-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        className={`ui-panel ${wide ? 'is-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <header className="ui-panel-head">
          <h2>{title}</h2>
          <button type="button" className="li-icon-btn" aria-label="Fermer" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="ui-panel-body">{children}</div>
        {footer && <footer className="ui-panel-foot">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}

/* ------------------------------------------------------------------ Petits utilitaires */

/** Vrai sur petit écran (≤ 768 px), mis à jour au redimensionnement. */
export function useIsNarrow(query = '(max-width: 768px)') {
  const get = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false);
  const [narrow, setNarrow] = useState(get);
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(query);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, [query]);
  return narrow;
}

/* ------------------------------------------------------------------ Confirmation */

/** Petite fenêtre de confirmation (actions irréversibles). */
export function ConfirmDialog({
  open,
  title,
  text,
  confirmLabel,
  danger = false,
  onConfirm,
  onCancel
}: {
  open: boolean;
  title: string;
  text?: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [open, onCancel]);
  if (!open) return null;
  return createPortal(
    <div className="ui-dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div ref={ref} className="ui-dialog" role="alertdialog" aria-modal="true" aria-label={title} tabIndex={-1}>
        <h2>{title}</h2>
        {text && <p>{text}</p>}
        <div className="ui-dialog-actions">
          <button type="button" className="secondary ui-btn-sm" onClick={onCancel}>
            Annuler
          </button>
          <button type="button" className={`primary ui-btn-sm ${danger ? 'is-danger' : ''}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
