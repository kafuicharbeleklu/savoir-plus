import React, { useEffect } from 'react';
import {
  Award,
  Bell,
  BookOpen,
  Compass,
  Flag,
  Home,
  Layers,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  ShieldCheck,
  User,
  Users,
  X
} from 'lucide-react';
import type { RoleCapabilities } from '../personas';

export function MobileNav({
  page,
  nav,
  moreOpen,
  setMoreOpen,
  caps,
  pendingCount,
  unreadNotifs,
  onOpenAuthModal,
  onEnterVisitor
}: {
  page: string;
  nav: (p: any, id?: string) => void;
  moreOpen: boolean;
  setMoreOpen: (v: boolean) => void;
  caps: RoleCapabilities;
  pendingCount: number;
  unreadNotifs: number;
  onOpenAuthModal: () => void;
  onEnterVisitor: () => void;
}) {
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen, setMoreOpen]);

  const isLearning = page === 'learning' || page === 'progression';
  const isResources = ['catalog', 'resource-detail', 'module-detail', 'path-detail'].includes(page);
  const isHomeOrCommunity = page === 'home' || page === 'community';
  const isPlus = !isHomeOrCommunity && !isLearning && !isResources;

  const go = (target: string) => {
    setMoreOpen(false);
    nav(target);
  };

  return (
    <>
      <nav className="mobile-bottom-nav" aria-label="Navigation mobile principale">
        <button className={isHomeOrCommunity ? 'active' : ''} onClick={() => go('home')}>
          <Home size={20} />
          <span>Accueil</span>
        </button>
        <button className={isLearning ? 'active' : ''} onClick={() => go('learning')}>
          <BookOpen size={20} />
          <span>Apprendre</span>
        </button>
        <button className={isResources ? 'active' : ''} onClick={() => go('catalog')}>
          <Compass size={20} />
          <span>Ressources</span>
        </button>
        <button
          className={moreOpen || isPlus ? 'active' : ''}
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen(!moreOpen)}
        >
          <span className="top-icon">
            <Menu size={20} />
            {(pendingCount > 0 || unreadNotifs > 0) && (
              <i className="tabular-nums">{pendingCount + unreadNotifs}</i>
            )}
          </span>
          <span>Plus</span>
        </button>
      </nav>

      {moreOpen && (
        <div
          className="mobile-sheet-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Menu complémentaire"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMoreOpen(false);
          }}
        >
          <div className="mobile-sheet">
            <div className="mobile-sheet-head">
              <b>Espaces & Compte</b>
              <button aria-label="Fermer le menu" onClick={() => setMoreOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="mobile-sheet-grid">
              <button onClick={() => go('profile')}>
                <User size={18} /> Mon profil
              </button>
              <button onClick={() => go('progression')}>
                <Award size={18} /> Progression
              </button>
              <button onClick={() => go('relations')}>
                <Users size={18} /> Relations {pendingCount > 0 ? `(${pendingCount})` : ''}
              </button>
              <button onClick={() => go('messages')}>
                <MessageCircle size={18} /> Messagerie
              </button>
              <button onClick={() => go('notifications')}>
                <Bell size={18} /> Alertes {unreadNotifs > 0 ? `(${unreadNotifs})` : ''}
              </button>
              <button onClick={() => go('settings')}>
                <Settings size={18} /> Paramètres
              </button>
              <button onClick={() => go('report')}>
                <Flag size={18} /> Aide & suivi
              </button>

              {caps.canCreate && (
                <button className="sheet-role-btn" onClick={() => go('studio')}>
                  <Layers size={18} /> Studio Créateur
                </button>
              )}

              {(caps.canModerate || caps.canAdmin) && (
                <button className="sheet-role-btn" onClick={() => go('admin')}>
                  <ShieldCheck size={18} /> Gouvernance
                </button>
              )}
            </div>

            <div className="mobile-sheet-actions">
              <button
                className="secondary"
                onClick={() => {
                  setMoreOpen(false);
                  onOpenAuthModal();
                }}
              >
                <Users size={16} /> Changer de compte
              </button>
              <button
                className="text-link"
                onClick={() => {
                  setMoreOpen(false);
                  onEnterVisitor();
                }}
              >
                <LogOut size={15} /> Quitter vers l’accueil visiteur
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
