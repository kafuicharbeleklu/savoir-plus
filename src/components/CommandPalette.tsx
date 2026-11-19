/**
 * Fenêtre de commande : Ctrl K (⌘ K sur Mac) depuis n'importe quel écran. Une recherche, des entrées
 * groupées, le clavier pour tout (↑ ↓ choisir, Entrée ouvrir, Échap fermer). Construite comme une
 * liste de choix accessible : champ « combobox », liste « listbox », entrée active annoncée.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, Search } from 'lucide-react';
import { filterCommands, highlightRange, type Command } from '../commands';

function Label({ text, query }: { text: string; query: string }) {
  const range = query.trim() ? highlightRange(text, query) : null;
  if (!range) return <>{text}</>;
  return (
    <>
      {text.slice(0, range[0])}
      <mark>{text.slice(range[0], range[1])}</mark>
      {text.slice(range[1])}
    </>
  );
}

export function CommandPalette({ open, onClose, commands }: { open: boolean; onClose: () => void; commands: Command[] }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const groups = useMemo(() => filterCommands(commands, query), [commands, query]);
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  // À l'ouverture : champ vide, première entrée active, focus dans le champ ; à la fermeture, le focus revient.
  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    setQuery('');
    setActive(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(t);
      returnFocus.current?.focus?.();
    };
  }, [open]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  if (!open) return null;

  const run = (command: Command | undefined) => {
    if (!command) return;
    onClose();
    command.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (flat.length ? (i + 1) % flat.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (flat.length ? (i - 1 + flat.length) % flat.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(flat[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Tab') {
      // La fenêtre garde le focus : le champ est le seul élément à atteindre au clavier.
      e.preventDefault();
    }
  };

  let index = -1;
  const optionId = (i: number) => `cmdk-option-${i}`;

  return (
    <div className="cmdk-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cmdk" role="dialog" aria-modal="true" aria-label="Rechercher et agir" onKeyDown={onKeyDown}>
        <div className="cmdk-field">
          <Search size={18} aria-hidden="true" />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls="cmdk-list"
            aria-autocomplete="list"
            aria-activedescendant={flat.length ? optionId(active) : undefined}
            aria-label="Rechercher une page, un contenu, un membre ou une action"
            placeholder="Rechercher une page, un module, un membre, une action…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd>Échap</kbd>
        </div>
        <div className="cmdk-list" id="cmdk-list" role="listbox" aria-label="Résultats" ref={listRef}>
          {flat.length === 0 ? (
            <p className="cmdk-empty">Aucun résultat pour « {query} ».</p>
          ) : (
            groups.map((group) => (
              <div key={group.group} role="group" aria-label={group.group} className="cmdk-group">
                <p className="cmdk-group-label" aria-hidden="true">
                  {group.group}
                </p>
                {group.items.map((command) => {
                  index += 1;
                  const i = index;
                  const isActive = i === active;
                  return (
                    <div
                      key={command.id}
                      id={optionId(i)}
                      role="option"
                      aria-selected={isActive}
                      className={`cmdk-item${isActive ? ' is-active' : ''}`}
                      onMouseMove={() => !isActive && setActive(i)}
                      onClick={() => run(command)}
                    >
                      <span className="cmdk-item-label">
                        <Label text={command.label} query={query} />
                      </span>
                      {command.hint && <span className="cmdk-item-hint">{command.hint}</span>}
                      {isActive && <CornerDownLeft size={15} aria-hidden="true" className="cmdk-item-enter" />}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <footer className="cmdk-foot" aria-hidden="true">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> choisir
          </span>
          <span>
            <kbd>Entrée</kbd> ouvrir
          </span>
          <span>
            <kbd>Échap</kbd> fermer
          </span>
        </footer>
      </div>
    </div>
  );
}
