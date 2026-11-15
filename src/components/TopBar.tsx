import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  BookOpen,
  ChevronDown,
  Home,
  Layers,
  LogOut,
  MessageCircle,
  MessagesSquare,
  Search,
  Settings,
  ShieldCheck,
  User,
  Users,
  X
} from 'lucide-react';
import type { Profile } from '../data';
import type { RoleCapabilities } from '../personas';
import type { CatalogItem, ExtendedDemoState } from '../wireframeData';
import { buildDynamicCatalog } from '../wireframeData';
import { ActiveLabAvatar } from './CatalogVisuals';
import { Avatar } from './ProfileIdentityCard';

export function TopBar({
  page,
  nav,
  user,
  caps,
  ext,
  people = [],
  activeLab,
  onOpenActiveLab,
  pendingCount,
  unreadNotifs,
  topQuery,
  setTopQuery,
  onOpenAuthModal,
  onEnterVisitor,
  onOpenMessaging
}: {
  page: string;
  nav: (p: any, id?: string) => void;
  user: Profile;
  caps: RoleCapabilities;
  ext: ExtendedDemoState;
  people?: Profile[];
  activeLab?: { item: CatalogItem; pct: number } | null;
  onOpenActiveLab?: (moduleId: string) => void;
  pendingCount: number;
  unreadNotifs: number;
  topQuery: string;
  setTopQuery: (q: string) => void;
  onOpenAuthModal: () => void;
  onEnterVisitor: () => void;
  onOpenMessaging: () => void;
}) {
  const [vousOpen, setVousOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const vousRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (vousOpen && vousRef.current && !vousRef.current.contains(e.target as Node)) setVousOpen(false);
      if (searchOpen && searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setVousOpen(false);
        setSearchOpen(false);
        setMobileSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [vousOpen, searchOpen]);

  const q = topQuery.trim().toLowerCase();
  const dynamicCatalog = buildDynamicCatalog(ext);
  const catalogHits = q
    ? dynamicCatalog.filter((c) => `${c.title} ${c.summary} ${c.domain}`.toLowerCase().includes(q)).slice(0, 3)
    : [];
  const postHits = q
    ? ext.posts.filter((p) => `${p.title} ${p.body}`.toLowerCase().includes(q)).slice(0, 2)
    : [];
  const memberHits = q
    ? people.filter((p) => p.id !== user.id && `${p.name} ${p.role}`.toLowerCase().includes(q)).slice(0, 2)
    : [];

  const isCatalogActive = ['catalog', 'resource-detail', 'module-detail', 'path-detail'].includes(page);
  const isHomeActive = page === 'home' || page.startsWith('community');
  const isNetworkActive = page === 'relations' || page === 'member';
  const isStudioActive = page.startsWith('studio');
  const isAdminActive = page.startsWith('admin') || page === 'moderation';

  return (
    // Préférences : barre réduite (logo + avatar), comme LinkedIn.
    <header className={`topbar ${page === 'settings' ? 'is-minimal' : ''}`} role="banner">
      <div className="topbar-inner">
        <div className="topbar-left">
          <button className="brand" onClick={() => nav('home')} aria-label="SAVOIR+, retour à l’accueil">
            SAVOIR<span className="brand-plus">+</span>
          </button>

          <div className="top-search-wrap" ref={searchRef}>
            <div className="top-searchbox">
              <Search size={15} aria-hidden="true" />
              <input
                aria-label="Recherche globale dans SAVOIR+"
                placeholder="Rechercher un module, une question, un membre…"
                value={topQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setTopQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchOpen(false);
                    if (!isCatalogActive) nav('catalog');
                  }
                }}
              />
              {topQuery && (
                <button
                  className="search-clear"
                  aria-label="Effacer la recherche"
                  onClick={() => setTopQuery('')}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {searchOpen && q.length > 0 && (
              <div className="top-search-results" role="region" aria-label="Résultats rapides">
                {catalogHits.length === 0 && postHits.length === 0 && memberHits.length === 0 ? (
                  <div className="top-search-empty">
                    <span>Aucun résultat direct pour « {topQuery} »</span>
                    <button
                      className="text-link"
                      onClick={() => {
                        setSearchOpen(false);
                        nav('catalog');
                      }}
                    >
                      Explorer tout le catalogue
                    </button>
                  </div>
                ) : (
                  <>
                    {catalogHits.map((c) => (
                      <button
                        key={c.id}
                        className="top-search-hit"
                        onClick={() => {
                          setSearchOpen(false);
                          nav(
                            c.type === 'resource' ? 'resource-detail' : c.type === 'path' ? 'path-detail' : 'module-detail',
                            c.id
                          );
                        }}
                      >
                        <BookOpen size={14} />
                        <div>
                          <b>{c.title}</b>
                          <small>
                            {c.type === 'module' ? 'Module' : c.type === 'path' ? 'Parcours' : 'Ressource'} · {c.domain}
                          </small>
                        </div>
                      </button>
                    ))}
                    {memberHits.map((m) => (
                      <button
                        key={m.id}
                        className="top-search-hit"
                        onClick={() => {
                          setSearchOpen(false);
                          nav('member', m.id);
                        }}
                      >
                        <User size={14} />
                        <div>
                          <b>{m.name}</b>
                          <small>Membre · {m.role}</small>
                        </div>
                      </button>
                    ))}
                    {postHits.map((p) => (
                      <button
                        key={p.id}
                        className="top-search-hit"
                        onClick={() => {
                          setSearchOpen(false);
                          nav('community-thread', p.id);
                        }}
                      >
                        <MessagesSquare size={14} />
                        <div>
                          <b>{p.title}</b>
                          <small>Fil d’entraide · {p.domain}</small>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {activeLab && (
            <ActiveLabAvatar
              item={activeLab.item}
              pct={activeLab.pct}
              onClick={() => {
                if (onOpenActiveLab) {
                  onOpenActiveLab(activeLab.item.id);
                } else {
                  nav('module-detail', activeLab.item.id);
                }
              }}
            />
          )}
        </div>

        <nav className="top-navigation" aria-label="Navigation principale">
          <button className={isHomeActive ? 'active' : ''} onClick={() => nav('home')}>
            <Home size={18} />
            <span>Accueil</span>
          </button>
          <button className={isNetworkActive ? 'active' : ''} onClick={() => nav('relations')}>
            <span className="top-icon">
              <Users size={18} />
              {pendingCount > 0 && <i className="tabular-nums">{pendingCount}</i>}
            </span>
            <span>Relations</span>
          </button>
          <button
            className={`topbar-action-btn ${page === 'messages' ? 'active' : ''}`}
            onClick={onOpenMessaging}
            aria-label="Messagerie"
          >
            <MessageCircle size={18} />
            <span>Messagerie</span>
          </button>
          <button
            className={`topbar-action-btn ${page === 'notifications' || page === 'report' ? 'active' : ''}`}
            onClick={() => nav('notifications')}
            aria-label={`Alertes${unreadNotifs > 0 ? ` (${unreadNotifs} non lues)` : ''}`}
          >
            <span className="top-icon">
              <Bell size={18} />
              {unreadNotifs > 0 && <i className="tabular-nums">{unreadNotifs}</i>}
            </span>
            <span>Alertes</span>
          </button>
        </nav>

        <div className="topbar-right">

          <button
            className="mobile-search-trigger"
            aria-label="Rechercher"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          >
            <Search size={18} />
          </button>

          <button
            className="mobile-quick-icon"
            aria-label="Alertes mobile"
            onClick={() => nav('notifications')}
          >
            <span className="top-icon">
              <Bell size={18} />
              {unreadNotifs > 0 && <i className="tabular-nums">{unreadNotifs}</i>}
            </span>
          </button>

          <div className="vous-wrap" ref={vousRef}>
            <button
              className={`vous-trigger ${page === 'profile' || isStudioActive || isAdminActive ? 'active' : ''}`}
              aria-expanded={vousOpen}
              aria-haspopup="menu"
              onClick={() => setVousOpen(!vousOpen)}
            >
              <Avatar person={user} small />
              <span className="vous-text">
                <b>Vous</b>
                <ChevronDown size={13} />
              </span>
            </button>

            {vousOpen && (
              <div className="vous-menu" role="menu" aria-label="Menu du compte">
                <div className="vous-header">
                  <Avatar person={user} small />
                  <div>
                    <b>{user.name}</b>
                    <small>{caps.roleLabel}</small>
                  </div>
                </div>

                <button
                  role="menuitem"
                  onClick={() => {
                    setVousOpen(false);
                    nav('profile');
                  }}
                >
                  <User size={15} /> Mon profil
                </button>

                {caps.canCreate && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      setVousOpen(false);
                      nav('studio');
                    }}
                  >
                    <Layers size={15} /> Studio
                  </button>
                )}

                {(caps.canModerate || caps.canAdmin) && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      setVousOpen(false);
                      nav('admin');
                    }}
                  >
                    <ShieldCheck size={15} /> Gouvernance
                  </button>
                )}

                <div className="vous-divider" />

                <button
                  role="menuitem"
                  onClick={() => {
                    setVousOpen(false);
                    nav('settings');
                  }}
                >
                  <Settings size={15} /> Paramètres & Confidentialité
                </button>

                <button
                  role="menuitem"
                  onClick={() => {
                    setVousOpen(false);
                    onOpenAuthModal();
                  }}
                >
                  <Users size={15} /> Changer de compte
                </button>

                <button
                  role="menuitem"
                  className="vous-visitor"
                  onClick={() => {
                    setVousOpen(false);
                    onEnterVisitor();
                  }}
                >
                  <LogOut size={15} /> Se déconnecter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileSearchOpen && (
        <div className="mobile-search-drawer">
          <div className="top-searchbox">
            <Search size={15} />
            <input
              autoFocus
              aria-label="Rechercher dans SAVOIR+"
              placeholder="Rechercher un module, parcours…"
              value={topQuery}
              onChange={(e) => setTopQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setMobileSearchOpen(false);
                  if (!isCatalogActive) nav('catalog');
                }
              }}
            />
            <button onClick={() => setMobileSearchOpen(false)} aria-label="Fermer la recherche">
              <X size={15} />
            </button>
          </div>
          {q.length > 0 && (catalogHits.length > 0 || postHits.length > 0) && (
            <div className="mobile-search-hits">
              {catalogHits.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setMobileSearchOpen(false);
                    nav(c.type === 'resource' ? 'resource-detail' : c.type === 'path' ? 'path-detail' : 'module-detail', c.id);
                  }}
                >
                  {c.title}
                </button>
              ))}
              {postHits.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setMobileSearchOpen(false);
                    nav('community-thread', p.id);
                  }}
                >
                  {p.title}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
