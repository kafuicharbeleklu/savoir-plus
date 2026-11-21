import React, { useEffect } from 'react';
import {
  Award,
  Medal,
  Bell,
  BookOpen,
  Compass,
  Flag,
  Home,
  Layers,
  LogOut,
  Menu,
  MessageCircle,
  PenLine,
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
  onOpenComposer,
  onEnterVisitor,
  hideMessaging = false
}: {
  page: string;
  nav: (p: any, id?: string) => void;
  moreOpen: boolean;
  setMoreOpen: (v: boolean) => void;
  caps: RoleCapabilities;
  pendingCount: number;
  unreadNotifs: number;
  onOpenAuthModal: () => void;
  /** Ouvre la fenêtre de publication (accès mobile, le bloc de saisie n'étant pas affiché dans le fil). */
  onOpenComposer?: () => void;
  onEnterVisitor: () => void;
  /** Messagerie fermée par le parent d'un enfant de moins de 12 ans. */
  hideMessaging?: boolean;
}) {
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen, setMoreOpen]);

  // Comme la barre du haut : la Bibliothèque (ouverte depuis « Plus ») n'allume pas « Apprendre ».
  const isLearning = ['learning', 'progression', 'badges', 'skills'].includes(page);
  const isNetwork = page === 'relations' || page === 'member';
  const isMessages = page === 'messages';
  const isHomeOrCommunity = page === 'home' || page.startsWith('community');
  const isPlus = !isHomeOrCommunity && !isLearning && !isNetwork && !isMessages;

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
        <button className={isNetwork ? 'active' : ''} onClick={() => go('relations')}>
          <span className="top-icon">
            <Users size={20} />
            {pendingCount > 0 && <i className="tabular-nums">{pendingCount}</i>}
          </span>
          <span>Relations</span>
        </button>
        {!hideMessaging && (
          <button className={isMessages ? 'active' : ''} onClick={() => go('messages')}>
            <MessageCircle size={20} />
            <span>Messagerie</span>
          </button>
        )}
        <button
          className={moreOpen || isPlus ? 'active' : ''}
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen(!moreOpen)}
        >
          <span className="top-icon">
            <Menu size={20} />
            {unreadNotifs > 0 && <i className="tabular-nums">{unreadNotifs}</i>}
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
              {onOpenComposer && (
                <button
                  onClick={() => {
                    setMoreOpen(false);
                    onOpenComposer();
                  }}
                >
                  <PenLine size={18} /> Publier
                </button>
              )}
              <button onClick={() => go('profile')}>
                <User size={18} /> Mon profil
              </button>
              <button onClick={() => go('progression')}>
                <Award size={18} /> Progression
              </button>
              <button onClick={() => go('badges')}>
                <Medal size={18} /> Badges
              </button>
              <button onClick={() => go('catalog')}>
                <Compass size={18} /> Bibliothèque
              </button>
              <button onClick={() => go('notifications')}>
                <Bell size={18} /> Alertes {unreadNotifs > 0 ? `(${unreadNotifs})` : ''}
              </button>
              <button onClick={() => go('settings')}>
                <Settings size={18} /> Paramètres
              </button>
              <button onClick={() => go('report')}>
                <Flag size={18} /> Signaler un problème
              </button>

              {caps.canCreate && (
                <button className="sheet-role-btn" onClick={() => go('studio')}>
                  <Layers size={18} /> Studio
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
