/**
 * Gouvernance — éléments communs : cadre d'une rubrique (accès selon la vue), menu de la colonne,
 * vue partagée liste | détail, blocs et faits.
 */
import React from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  EyeOff,
  Flag,
  Inbox,
  KeyRound,
  LifeBuoy,
  Scale,
  ScrollText,
  Sliders,
  Users
} from 'lucide-react';
import type { Profile } from '../../data';
import {
  GOV_LABEL,
  GOV_NAV,
  govAccess,
  govCounts,
  ROLE_DESCRIPTION,
  type GovSection
} from '../../governance';
import type { RoleCapabilities } from '../../personas';
import { ADMIN_ROLES, type AdminRoleName, type ExtendedDemoState } from '../../wireframeData';
import { EmptyState, Select } from '../../components/ui';

export interface GovProps {
  ext: ExtendedDemoState;
  updateExt: (fn: (prev: ExtendedDemoState) => ExtendedDemoState) => void;
  nav: (page: any, id?: string) => void;
  user: Profile;
  setToast: (msg: string) => void;
  caps?: RoleCapabilities;
}

const ICONS: Record<GovSection, React.ReactNode> = {
  admin: <Inbox size={16} aria-hidden="true" />,
  moderation: <Flag size={16} aria-hidden="true" />,
  'admin-validation': <CheckCircle2 size={16} aria-hidden="true" />,
  'admin-identity': <BadgeCheck size={16} aria-hidden="true" />,
  appeal: <Scale size={16} aria-hidden="true" />,
  'admin-support': <LifeBuoy size={16} aria-hidden="true" />,
  'admin-users': <Users size={16} aria-hidden="true" />,
  'admin-roles': <KeyRound size={16} aria-hidden="true" />,
  'admin-contents': <EyeOff size={16} aria-hidden="true" />,
  'admin-settings': <Sliders size={16} aria-hidden="true" />,
  'admin-audit': <ScrollText size={16} aria-hidden="true" />
};

const visibleSections = (role: AdminRoleName): GovSection[] =>
  (['admin', ...GOV_NAV.flatMap((g) => g.items)] as GovSection[]).filter((s) => govAccess(role, s) !== 'none');

function RoleSelect({
  ext,
  updateExt,
  setToast
}: Pick<GovProps, 'ext' | 'updateExt' | 'setToast'>) {
  return (
    <Select
      aria-label="Vue de gouvernance"
      title={ROLE_DESCRIPTION[ext.adminActiveRole]}
      value={ext.adminActiveRole}
      onChange={(e) => {
        const next = e.target.value as AdminRoleName;
        updateExt((prev) => ({ ...prev, adminActiveRole: next }));
        setToast(`Vue : ${next}`);
      }}
    >
      {ADMIN_ROLES.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </Select>
  );
}

/** Menu de la colonne de gauche : vue active, puis rubriques visibles regroupées, avec compteurs. */
export function GovernanceRail({
  ext,
  updateExt,
  nav,
  page,
  setToast
}: Pick<GovProps, 'ext' | 'updateExt' | 'nav' | 'setToast'> & { page: string }) {
  const role = ext.adminActiveRole;
  const counts = govCounts(ext);
  const item = (s: GovSection, count?: number) => (
    <button key={s} type="button" className={`rail-nav-btn gv-rail-btn ${page === s ? 'active' : ''}`} aria-current={page === s ? 'page' : undefined} onClick={() => nav(s)}>
      <span>
        {ICONS[s]} {GOV_LABEL[s]}
      </span>
      {Boolean(count) && <em className="gv-count tabular-nums">{count}</em>}
    </button>
  );
  return (
    <nav className="rail-nav-card gv-rail" aria-label="Gouvernance">
      <span className="left-rail-section-label">Gouvernance</span>
      <label className="gv-view">
        <span>Vue</span>
        <RoleSelect ext={ext} updateExt={updateExt} setToast={setToast} />
      </label>
      <p className="gv-view-desc">{ROLE_DESCRIPTION[role]}</p>
      {item('admin')}
      {GOV_NAV.map((group) => {
        const items = group.items.filter((s) => govAccess(role, s) !== 'none');
        if (items.length === 0) return null;
        return (
          <React.Fragment key={group.group}>
            <span className="gv-rail-group">{group.group}</span>
            {items.map((s) => item(s, counts[s]))}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

/** Cadre d'une rubrique : sélecteurs sur petit écran, garde d'accès, mention « lecture seule ». */
export function GovShell({
  section,
  ext,
  updateExt,
  nav,
  setToast,
  children
}: Pick<GovProps, 'ext' | 'updateExt' | 'nav' | 'setToast'> & { section: GovSection; children: React.ReactNode }) {
  const role = ext.adminActiveRole;
  const access = govAccess(role, section);
  const sections = visibleSections(role);
  return (
    <div className="gv-page">
      <div className="gv-mobile-nav">
        <label>
          <span>Rubrique</span>
          <Select value={sections.includes(section) ? section : 'admin'} onChange={(e) => nav(e.target.value)}>
            {sections.map((s) => (
              <option key={s} value={s}>
                {GOV_LABEL[s]}
              </option>
            ))}
          </Select>
        </label>
        <label>
          <span>Vue</span>
          <RoleSelect ext={ext} updateExt={updateExt} setToast={setToast} />
        </label>
      </div>
      {access === 'none' ? (
        <div className="ui-list">
          <EmptyState
            title="Rubrique non accessible"
            text={`La vue « ${role} » ne donne pas accès à « ${GOV_LABEL[section]} ».`}
            action={{ label: 'Revenir à « À traiter »', onClick: () => nav('admin') }}
          />
        </div>
      ) : (
        <>
          {children}
          {access === 'view' && section !== 'admin' && section !== 'admin-audit' && (
            <p className="gv-note">Lecture seule avec la vue « {role} ».</p>
          )}
        </>
      )}
    </div>
  );
}

/** Vue partagée : liste à gauche, détail à droite ; sur petit écran, l'un ou l'autre avec un retour. */
export function Split({
  list,
  detail,
  hasSelection,
  onBack,
  backLabel
}: {
  list: React.ReactNode;
  detail: React.ReactNode;
  hasSelection: boolean;
  onBack: () => void;
  backLabel: string;
}) {
  return (
    <div className={`gv-split ${hasSelection ? 'has-selection' : ''}`}>
      <div className="gv-split-list">{list}</div>
      <div className="gv-split-detail">
        {hasSelection && (
          <button type="button" className="ui-back-link gv-split-back" onClick={onBack}>
            <ArrowLeft size={16} aria-hidden="true" /> {backLabel}
          </button>
        )}
        {detail}
      </div>
    </div>
  );
}

export function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="gv-block" aria-label={title}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export function Facts({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="ui-facts gv-facts">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export const normalize = (v: string) =>
  v
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
