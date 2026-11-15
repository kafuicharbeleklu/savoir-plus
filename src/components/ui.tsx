/**
 * Composants d'interface communs (lot 1 de la refonte « sobre mais élégant »).
 * Règles : en-tête court, listes à lignes égales, statut = point + texte,
 * une action principale par écran, actions secondaires dans un menu « … »,
 * état vide partout, enregistrement automatique.
 */
import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDown, ArrowLeft, ArrowUp, ArrowUpDown, Award, Ban, BarChart3, BookOpen, Check, CheckCircle2, ChevronDown, Copy, Download, Eye, EyeOff, FileText, Flag, Layers, Link2, Minus, MoreHorizontal, Pencil, Search, Send, Settings, Sparkles, Trash2, Undo2, User, X } from 'lucide-react';

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

/** État d'une ligne de liste : normal, pas encore validé (gris) ou à corriger (rouge). */
export type RowState = 'ok' | 'muted' | 'alert';

/**
 * Titre d'une ligne selon son état. Aucune mention n'est affichée : un élément normal garde
 * son aspect, un élément pas encore validé est en gris, un élément qui demande une action est
 * en rouge. La précision (« À corriger », « Échec »…) reste lisible au survol et par les
 * lecteurs d'écran.
 */
export function RowTitle({ state, hint, children }: { state: RowState; hint?: string; children: React.ReactNode }) {
  if (state === 'ok') return <>{children}</>;
  return (
    <span className={state === 'alert' ? 'ui-alert-title' : 'ui-muted-title'} title={hint}>
      {children}
      {hint && <span className="sr-only"> — {hint}</span>}
    </span>
  );
}

/** Couleur de la pastille d'icône correspondant à l'état de la ligne. */
export const rowTileTone = (state: RowState): 'brand' | 'neutral' | 'danger' =>
  state === 'ok' ? 'brand' : state === 'alert' ? 'danger' : 'neutral';

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
export function IconTile({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'brand' | 'danger' }) {
  return <span className={`ui-icon-tile ${tone === 'brand' ? 'is-brand' : tone === 'danger' ? 'is-danger' : ''}`}>{children}</span>;
}

/**
 * Pastille d'icône avec repère d'état dans l'angle : ✓ publié ou validé, – en attente,
 * ✕ en échec ou à corriger. Le repère double la couleur, pour que l'état ne repose jamais
 * sur la couleur seule. `plain` garde le visuel fourni tel quel (une vignette d'image).
 */
export function StateTile({ state, plain = false, children }: { state: RowState; plain?: boolean; children: React.ReactNode }) {
  return (
    <span className={`ui-state-tile is-${state}`}>
      {plain ? children : <IconTile tone={rowTileTone(state)}>{children}</IconTile>}
      <i className="ui-state-badge" aria-hidden="true">
        {state === 'ok' ? <Check size={10} strokeWidth={3.5} /> : state === 'alert' ? <X size={10} strokeWidth={3.5} /> : <Minus size={10} strokeWidth={3.5} />}
      </i>
    </span>
  );
}

/* ------------------------------------------------------------------ Menu « … » */

export type ActionMenuItem = {
  label: string;
  onSelect: () => void;
  /** Icône de l'action ; à défaut, elle est déduite du libellé (Supprimer, Dupliquer, Signaler…). */
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  hidden?: boolean;
};

/** Icône usuelle d'une action d'après son libellé, pour que tous les menus se ressemblent. */
function menuIcon(label: string): React.ReactNode {
  const rules: [RegExp, React.ReactNode][] = [
    [/^voir|aperçu/i, <Eye size={20} aria-hidden="true" />],
    [/dépublier|masquer/i, <EyeOff size={20} aria-hidden="true" />],
    [/annuler/i, <Undo2 size={20} aria-hidden="true" />],
    [/corriger/i, <Pencil size={20} aria-hidden="true" />],
    [/supprimer|retirer/i, <Trash2 size={20} aria-hidden="true" />],
    [/signaler/i, <Flag size={20} aria-hidden="true" />],
    [/bloquer|révoquer|suspendre/i, <Ban size={20} aria-hidden="true" />],
    [/dupliquer/i, <Copy size={20} aria-hidden="true" />],
    [/copier/i, <Link2 size={20} aria-hidden="true" />],
    [/publier/i, <Send size={20} aria-hidden="true" />],
    [/statistiques/i, <BarChart3 size={20} aria-hidden="true" />],
    [/progression/i, <Award size={20} aria-hidden="true" />],
    [/profil/i, <User size={20} aria-hidden="true" />],
    [/visibilité|préférences|réglages/i, <Settings size={20} aria-hidden="true" />],
    [/résolu|clôturer|approuver|valider/i, <CheckCircle2 size={20} aria-hidden="true" />],
    [/monter/i, <ArrowUp size={20} aria-hidden="true" />],
    [/descendre/i, <ArrowDown size={20} aria-hidden="true" />],
    [/\bia\b/i, <Sparkles size={20} aria-hidden="true" />],
    [/^ressource/i, <FileText size={20} aria-hidden="true" />],
    [/^parcours/i, <Layers size={20} aria-hidden="true" />],
    [/^module/i, <BookOpen size={20} aria-hidden="true" />],
    [/modifier|renommer/i, <Pencil size={20} aria-hidden="true" />],
    [/exporter|télécharger/i, <Download size={20} aria-hidden="true" />]
  ];
  const match = rules.find(([pattern]) => pattern.test(label));
  return match ? match[1] : <span className="li-menu-spacer" aria-hidden="true" />;
}

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
  const [upward, setUpward] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
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
        ref.current?.querySelector<HTMLButtonElement>('button[aria-haspopup]')?.focus();
        return;
      }
      // Flèches, Début et Fin : parcourir les actions au clavier.
      const options = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') || []);
      if (options.length === 0) return;
      const index = options.indexOf(document.activeElement as HTMLButtonElement);
      const go = (next: number) => {
        e.preventDefault();
        options[(next + options.length) % options.length].focus();
      };
      if (e.key === 'ArrowDown') go(index + 1);
      else if (e.key === 'ArrowUp') go(index <= 0 ? options.length - 1 : index - 1);
      else if (e.key === 'Home') go(0);
      else if (e.key === 'End') go(options.length - 1);
      else if (e.key === 'Tab') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // À l'ouverture : le menu s'ouvre vers le haut s'il dépasserait le bas de la fenêtre.
  useLayoutEffect(() => {
    if (!open) {
      setUpward(false);
      return;
    }
    const list = listRef.current;
    const anchor = ref.current;
    if (!list || !anchor) return;
    const room = window.innerHeight - anchor.getBoundingClientRect().bottom;
    setUpward(room < list.offsetHeight + 16 && anchor.getBoundingClientRect().top > list.offsetHeight + 16);
  }, [open]);

  if (visible.length === 0) return null;
  const firstDanger = visible.findIndex((it) => it.danger);
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
        <div ref={listRef} className={`li-menu-list${upward ? ' is-up' : ''}`} role="menu">
          {visible.map((it, index) => (
            <React.Fragment key={it.label}>
              {index === firstDanger && index > 0 && <span className="li-menu-sep" role="separator" />}
              <button
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
                {it.icon || menuIcon(it.label)}
                <span>{it.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Tri des tableaux */

export type SortRule<K extends string> = { key: K; dir: 'asc' | 'desc' };

const compareValues = (a: string | number, b: string | number): number =>
  typeof a === 'number' && typeof b === 'number'
    ? a - b
    : String(a).localeCompare(String(b), 'fr', { numeric: true, sensitivity: 'base' });

/**
 * Tri d'un tableau par ses en-têtes. Un clic : croissant, puis décroissant, puis sans tri.
 * Maj + clic ajoute la colonne au tri (tri sur plusieurs colonnes). Les valeurs absentes
 * restent toujours en fin de liste.
 */
export function useTableSort<K extends string>(initial: SortRule<K>[] = []) {
  const [sort, setSort] = useState<SortRule<K>[]>(initial);

  const toggle = (key: K, additive: boolean) =>
    setSort((prev) => {
      const found = prev.find((rule) => rule.key === key);
      const nextDir: 'asc' | 'desc' | null = !found ? 'asc' : found.dir === 'asc' ? 'desc' : null;
      if (!additive) return nextDir ? [{ key, dir: nextDir }] : [];
      if (!found) return [...prev, { key, dir: 'asc' }];
      return nextDir ? prev.map((rule) => (rule.key === key ? { key, dir: nextDir } : rule)) : prev.filter((rule) => rule.key !== key);
    });

  function apply<T>(rows: T[], accessors: Record<K, (row: T) => string | number | null | undefined>): T[] {
    if (sort.length === 0) return rows;
    return [...rows].sort((a, b) => {
      for (const rule of sort) {
        const va = accessors[rule.key](a);
        const vb = accessors[rule.key](b);
        const emptyA = va === null || va === undefined || va === '';
        const emptyB = vb === null || vb === undefined || vb === '';
        if (emptyA || emptyB) {
          if (emptyA && emptyB) continue;
          return emptyA ? 1 : -1;
        }
        const order = compareValues(va as string | number, vb as string | number);
        if (order !== 0) return rule.dir === 'asc' ? order : -order;
      }
      return 0;
    });
  }

  return { sort, toggle, apply };
}

/**
 * En-tête de colonne triable : flèche double tant que la colonne n'est pas triée,
 * flèche simple dans le sens du tri ensuite. En tri sur plusieurs colonnes, seules les
 * colonnes suivantes portent leur rang (2, 3…) : la première n'affiche pas de « 1 ».
 */
export function SortTh<K extends string>({
  sortKey,
  sort,
  onSort,
  children,
  className
}: {
  sortKey: K;
  sort: SortRule<K>[];
  onSort: (key: K, additive: boolean) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const index = sort.findIndex((rule) => rule.key === sortKey);
  const rule = index >= 0 ? sort[index] : null;
  return (
    <th scope="col" className={className} aria-sort={rule ? (rule.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        className={`ui-sort${rule ? ' is-on' : ''}`}
        title={
          rule
            ? rule.dir === 'asc'
              ? 'Tri croissant — cliquer pour inverser'
              : 'Tri décroissant — cliquer pour retirer le tri'
            : 'Trier — Maj + clic pour trier sur plusieurs colonnes'
        }
        onClick={(e) => onSort(sortKey, e.shiftKey)}
      >
        <span>{children}</span>
        {rule ? (
          rule.dir === 'asc' ? (
            <ArrowUp size={14} aria-hidden="true" />
          ) : (
            <ArrowDown size={14} aria-hidden="true" />
          )
        ) : (
          <ArrowUpDown size={14} className="ui-sort-idle" aria-hidden="true" />
        )}
        {rule && index > 0 && <sup className="ui-sort-rank tabular-nums">{index + 1}</sup>}
      </button>
    </th>
  );
}

/* ------------------------------------------------------------------ Liste déroulante */

type SelectOption = { value: string; label: string; disabled?: boolean };

const textOf = (node: React.ReactNode): string => {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (React.isValidElement(node)) return textOf((node.props as { children?: React.ReactNode }).children);
  return '';
};

/** Lit les <option> passées en enfants, comme pour un <select> ordinaire. */
function collectOptions(children: React.ReactNode, out: SelectOption[] = []): SelectOption[] {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const props = child.props as { value?: unknown; disabled?: boolean; children?: React.ReactNode };
    if (child.type === 'option') {
      const label = textOf(props.children);
      out.push({ value: String(props.value ?? label), label, disabled: props.disabled });
    } else if (props.children) {
      collectOptions(props.children, out);
    }
  });
  return out;
}

/**
 * Liste déroulante de l'application. Elle s'emploie comme un <select> (mêmes <option>, même
 * onChange avec `event.target.value`) mais sa liste reprend la présentation des menus, au lieu
 * de celle du navigateur. Clavier : flèches, Début, Fin, Entrée, Échap, saisie de la première lettre.
 */
export function Select({
  value,
  onChange,
  children,
  disabled = false,
  className = '',
  id,
  title,
  'aria-label': ariaLabel
}: {
  value?: string | number;
  onChange?: (event: { target: { value: string }; currentTarget: { value: string } }) => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  id?: string;
  title?: string;
  'aria-label'?: string;
  required?: boolean;
}) {
  const options = collectOptions(children);
  const current = String(value ?? '');
  const selected = options.find((o) => o.value === current);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number; minWidth: number; maxHeight: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const close = (focusBack: boolean) => {
    setOpen(false);
    if (focusBack) btnRef.current?.focus();
  };

  const choose = (opt: SelectOption | undefined) => {
    if (!opt || opt.disabled) return;
    if (opt.value !== current) onChange?.({ target: { value: opt.value }, currentTarget: { value: opt.value } });
    close(true);
  };

  const openList = () => {
    const box = btnRef.current?.getBoundingClientRect();
    if (!box) return;
    const below = window.innerHeight - box.bottom - 12;
    const above = box.top - 12;
    const wanted = Math.min(320, options.length * 40 + 8);
    const up = below < Math.min(wanted, 200) && above > below;
    const minWidth = Math.max(box.width, 180);
    setPos({
      left: Math.max(8, Math.min(box.left, window.innerWidth - minWidth - 8)),
      minWidth,
      maxHeight: Math.max(120, Math.min(320, up ? above : below)),
      ...(up ? { bottom: window.innerHeight - box.top + 6 } : { top: box.bottom + 6 })
    });
    setActive(Math.max(0, options.findIndex((o) => o.value === current)));
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const node = e.target as Node;
      if (btnRef.current?.contains(node) || listRef.current?.contains(node)) return;
      setOpen(false);
    };
    const onScroll = (e: Event) => {
      if (listRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onResize = () => setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  // La liste reste dans la fenêtre, et l'option active reste visible.
  useLayoutEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (!list) return;
    const overflow = list.getBoundingClientRect().right - (window.innerWidth - 8);
    if (overflow > 0) setPos((p) => (p ? { ...p, left: Math.max(8, p.left - overflow) } : p));
    list.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const step = (from: number, delta: number) => {
    let index = from;
    for (let i = 0; i < options.length; i += 1) {
      index = (index + delta + options.length) % options.length;
      if (!options[index].disabled) return index;
    }
    return from;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close(true);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => step(i, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => step(i, -1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(step(-1, 1));
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(step(0, -1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(options[active]);
    } else if (e.key === 'Tab') {
      close(false);
    } else if (e.key.length === 1) {
      const letter = e.key.toLocaleLowerCase('fr');
      const order = [...options.keys()].map((k) => (active + 1 + k) % options.length);
      const found = order.find((k) => !options[k].disabled && options[k].label.toLocaleLowerCase('fr').startsWith(letter));
      if (found !== undefined) setActive(found);
    }
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        id={id}
        className={`ui-select ${className}`.trim()}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-label={ariaLabel}
        title={title}
        disabled={disabled}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={onKeyDown}
      >
        <span className="ui-select-value">{selected?.label ?? ''}</span>
        <ChevronDown size={16} className="ui-select-chevron" aria-hidden="true" />
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={listRef}
            id={listId}
            className="ui-select-list"
            role="listbox"
            aria-label={ariaLabel}
            style={{ left: pos.left, top: pos.top, bottom: pos.bottom, minWidth: pos.minWidth, maxHeight: pos.maxHeight }}
          >
            {options.map((opt, index) => (
              <div
                key={`${opt.value}-${index}`}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={opt.value === current}
                aria-disabled={opt.disabled || undefined}
                data-active={index === active}
                className={`ui-select-option${index === active ? ' is-active' : ''}${opt.value === current ? ' is-selected' : ''}`}
                onMouseEnter={() => setActive(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(opt)}
              >
                <span>{opt.label}</span>
                {opt.value === current && <Check size={16} aria-hidden="true" />}
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
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
