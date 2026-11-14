import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  Eye,
  FileCheck,
  FileText,
  History,
  KeyRound,
  LifeBuoy,
  Lock,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Users,
  XCircle
} from 'lucide-react';
import {
  appendAuditLog,
  type AccountStatus,
  type AdminRoleName,
  type ExtendedDemoState
} from '../wireframeData';
import type { Profile } from '../data';

import { Scale } from 'lucide-react';

interface AdminProps {
  ext: ExtendedDemoState;
  updateExt: (fn: (prev: ExtendedDemoState) => ExtendedDemoState) => void;
  nav: (page: any, id?: string) => void;
  activePage: string;
  user: Profile;
  setToast: (msg: string) => void;
}

const ADMIN_ROLES: AdminRoleName[] = [
  'Super administrateur',
  'Administrateur',
  'Responsable de modération',
  'Modérateur',
  'Support',
  'Auditeur'
];

const STATUS_LABELS: Record<AccountStatus, { label: string; desc: string; badge: 'ok' | 'warn' | '' }> = {
  active: { label: 'Actif', desc: 'Compte vérifié et autorisé selon ses capacités.', badge: 'ok' },
  pending_verification: {
    label: 'Vérification en attente',
    desc: 'Adresse non confirmée : publication et messagerie bloquées.',
    badge: ''
  },
  restricted: {
    label: 'Restreint',
    desc: 'Certaines capacités (ex. envoi de messages) sont limitées temporairement.',
    badge: 'warn'
  },
  suspended: {
    label: 'Suspendu',
    desc: 'Accès ordinaire bloqué ; accès limité garanti pour consulter la décision et déposer un recours.',
    badge: 'warn'
  },
  deactivated: {
    label: 'Désactivé',
    desc: 'Indisponibilité volontaire par le titulaire ; sanctions éventuelles maintenues.',
    badge: ''
  },
  deletion_pending: {
    label: 'Suppression demandée',
    desc: 'Demande de purge/anonymisation enregistrée en attente d’exécution.',
    badge: ''
  }
};

export function GovernanceShell({
  ext,
  updateExt,
  nav,
  activePage,
  setToast,
  children
}: {
  ext: ExtendedDemoState;
  updateExt: (fn: (prev: ExtendedDemoState) => ExtendedDemoState) => void;
  nav: (page: any, id?: string) => void;
  activePage: string;
  user?: Profile;
  setToast: (msg: string) => void;
  children?: React.ReactNode;
}) {
  const navItems = [
    { id: 'admin', label: 'Vue d’ensemble', icon: ShieldCheck },
    { id: 'admin-users', label: 'Utilisateurs', icon: Users },
    { id: 'admin-roles', label: 'Rôles & Permissions', icon: KeyRound },
    { id: 'moderation', label: 'File de modération', icon: ShieldAlert },
    { id: 'appeal', label: 'Recours', icon: Scale },
    { id: 'admin-contents', label: 'Contenus signalés', icon: FileText },
    { id: 'admin-validation', label: 'Validations', icon: FileCheck },
    { id: 'admin-audit', label: 'Audit', icon: History },
    { id: 'admin-support', label: 'Support', icon: LifeBuoy },
    { id: 'admin-settings', label: 'Paramètres', icon: Settings }
  ];

  return (
    <div className="workspace-main">
      <div className="workspace-mobile-nav" role="navigation" aria-label="Navigation administration et modération mobile">
        <select
          aria-label="Rôle administratif actif"
          value={ext.adminActiveRole}
          onChange={(e) => {
            const nextRole = e.target.value as AdminRoleName;
            updateExt((prev) => ({ ...prev, adminActiveRole: nextRole }));
            setToast(`Vue filtrée selon le rôle « ${nextRole} »`);
          }}
        >
          {ADMIN_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={activePage === item.id ? 'active' : ''}
            onClick={() => nav(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}

export const AdminConsoleNav = GovernanceShell;

export function AdminDashboardView({ ext, updateExt, nav, activePage, user, setToast }: AdminProps) {
  const role = ext.adminActiveRole;
  const activeUsers = ext.adminUsers.filter((u) => u.status === 'active').length;
  const pendingVerif = ext.adminUsers.filter((u) => u.status === 'pending_verification').length;
  const publishedCount = ext.studioContents.filter((c) => c.pubStatus === 'Publié').length;
  const flaggedCount = ext.flaggedContents.filter((c) => c.visibility !== 'Accessible').length;
  const openDossiers = ext.dossiers.filter((d) => d.status !== 'Décision soumise').length;
  const pendingAppeals = ext.appeal.submitted ? 1 : 0;
  const pendingValidations = ext.validationRequests.filter((v) => v.status !== 'Validée' && v.status !== 'Refusée').length;
  const pendingRoles = ext.roleAssignments.filter((r) => r.status === 'En attente d’approbation').length;
  const openTickets = ext.supportTickets.filter((t) => t.status !== 'fermé' && t.status !== 'résolu').length;

  return (
    <GovernanceShell ext={ext} updateExt={updateExt} nav={nav} activePage={activePage} user={user} setToast={setToast}>
      <div className="page-heading">
        <span className="eyebrow">TABLEAU DE BORD ADMINISTRATIF · RÔLE : {role.toUpperCase()}</span>
        <h1>Supervision et files de travail</h1>
        <p>
          Période de calcul : démonstration locale courante. Un rôle administratif ne donne pas un accès illimité aux
          conversations privées ou copies d’apprenants.
        </p>
      </div>

      <div className="wf-kpi-grid wf-mb">
        <div className="wf-kpi-card">
          <Users size={18} />
          <b className="tabular">{activeUsers}</b>
          <span>Utilisateurs actifs (statut actif)</span>
        </div>
        <div className="wf-kpi-card">
          <KeyRound size={18} />
          <b className="tabular">{pendingVerif}</b>
          <span>En attente de vérification e-mail</span>
        </div>
        <div className="wf-kpi-card">
          <FileText size={18} />
          <b className="tabular">{publishedCount}</b>
          <span>Contenus Studio publiés</span>
        </div>
        <div className="wf-kpi-card">
          <ShieldAlert size={18} />
          <b className="tabular">{openDossiers}</b>
          <span>Signalements à traiter</span>
        </div>
        <div className="wf-kpi-card">
          <FileCheck size={18} />
          <b className="tabular">{pendingValidations}</b>
          <span>Validations pédagogiques</span>
        </div>
        <div className="wf-kpi-card">
          <LifeBuoy size={18} />
          <b className="tabular">{openTickets}</b>
          <span>Tickets support ouverts</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-main wf-stack">
          <section className="wf-card">
            <div className="between wf-mb-sm">
              <h3>Files de travail nécessitant une action</h3>
              <span className="tiny muted">Filtrées selon vos capacités</span>
            </div>
            <div className="wf-program-list">
              <div
                className="wf-program-item is-clickable"
                role="button"
                tabIndex={0}
                onClick={() => nav('moderation')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    nav('moderation');
                  }
                }}
              >
                <div>
                  <b>Dossiers de modération ouverts ({openDossiers})</b>
                  <small>Dont {flaggedCount} contenus masqués ou retirés · Tri par priorité</small>
                </div>
              </div>
              <div
                className="wf-program-item is-clickable"
                role="button"
                tabIndex={0}
                onClick={() => nav('admin-validation')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    nav('admin-validation');
                  }
                }}
              >
                <div>
                  <b>Demandes de validation pédagogique ({pendingValidations})</b>
                  <small>Ressources, modules et quiz soumis par version (publications communautaires exclues)</small>
                </div>
              </div>
              <div
                className="wf-program-item is-clickable"
                role="button"
                tabIndex={0}
                onClick={() => nav('admin-roles')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    nav('admin-roles');
                  }
                }}
              >
                <div>
                  <b>Approbations de rôles sensibles en attente ({pendingRoles})</b>
                  <small>Double validation requise sans auto-approbation</small>
                </div>
              </div>
              <div
                className="wf-program-item is-clickable"
                role="button"
                tabIndex={0}
                onClick={() => nav('appeal')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    nav('appeal');
                  }
                }}
              >
                <div>
                  <b>Recours en attente ({pendingAppeals})</b>
                  <small>Examen par un réviseur distinct du décideur initial</small>
                </div>
              </div>
            </div>
          </section>

          <section className="wf-card">
            <div className="between wf-mb-sm">
              <h3>Activité administrative récente</h3>
              <button className="text-link" onClick={() => nav('admin-audit')}>
                Tous les journaux <ArrowRight size={14} />
              </button>
            </div>
            <div className="wf-program-list">
              {ext.auditLogs.slice(0, 4).map((log) => (
                <div className="wf-program-item" key={log.id}>
                  <div>
                    <b>
                      {log.action} · <span className="muted">{log.target}</span>
                    </b>
                    <small>
                      {log.actor} · {log.scope} · {log.timestamp}
                    </small>
                  </div>
                  <span className={`status-tag ${log.result === 'Succès' ? 'ok' : 'warn'}`}>{log.result}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="right-rail" aria-label="Périmètre du rôle actif">
          <section className="rail-card">
            <span className="eyebrow">MOINDRE PRIVILÈGE</span>
            <h3>Rôle : {role}</h3>
            <p className="tiny muted">
              {role === 'Super administrateur' &&
                'Gouvernance globale et propositions de paramètres. Les opérations sensibles restent soumises à double validation.'}
              {role === 'Administrateur' &&
                'Gestion des comptes et paramètres attribués. Aucun accès libre aux messages privés.'}
              {role === 'Responsable de modération' &&
                'Supervision des files, affectation des dossiers et demande de seconde revue.'}
              {role === 'Modérateur' &&
                'Traitement des signalements autorisés dans son périmètre et décisions motivées.'}
              {role === 'Support' &&
                'Accès limité au profil minimal, état du compte et tickets assignés. Aucune lecture libre des copies ou conversations.'}
              {role === 'Auditeur' &&
                'Lecture seule des journaux d’audit et contrôle des traces. Aucune modification autorisée.'}
            </p>
            <div className="rail-stat-list">
              <div className="rail-stat-row">
                <span>Messages privés</span>
                <b>Bloqués par défaut</b>
              </div>
              <div className="rail-stat-row">
                <span>Journalisation</span>
                <b>Active</b>
              </div>
            </div>
            <button className="secondary wf-full-btn" onClick={() => nav('admin-audit')}>
              <History size={15} /> Consulter l’audit
            </button>
          </section>

          <section className="rail-card">
            <span className="eyebrow">GOUVERNANCE & SÉPARATION</span>
            <h3>Points à approuver</h3>
            <div className="rail-quick-list">
              <button type="button" className="rail-quick-item" onClick={() => nav('admin-roles')}>
                <b>Habilitations ({pendingRoles})</b>
                <small>Double validation distincte du demandeur</small>
              </button>
              <button type="button" className="rail-quick-item" onClick={() => nav('admin-settings')}>
                <b>
                  Paramètres ({ext.platformSettings.pendingChanges.filter((c) => c.status === 'En attente d’approbation').length})
                </b>
                <small>Changements critiques en attente</small>
              </button>
              <button type="button" className="rail-quick-item" onClick={() => nav('admin-contents')}>
                <b>Contenus restreints ({flaggedCount})</b>
                <small>Historique de versions conservé</small>
              </button>
            </div>
          </section>
        </aside>
      </div>
    </GovernanceShell>
  );
}

export function AdminUsersView({ ext, updateExt, nav, activePage, user, setToast }: AdminProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');
  const [selectedId, setSelectedId] = useState(ext.adminUsers[0]?.id || 'usr-afi');
  const [justifInput, setJustifInput] = useState('');
  const [revealedIds, setRevealedIds] = useState<string[]>([]);

  const role = ext.adminActiveRole;
  const canSeeEmail = role === 'Super administrateur' || role === 'Administrateur' || role === 'Support';
  const canManageStatus = role === 'Super administrateur' || role === 'Administrateur' || role === 'Responsable de modération';

  const users = ext.adminUsers.filter((u) => {
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${u.name} ${canSeeEmail ? u.email : ''} ${u.id} ${u.institution}`.toLowerCase().includes(q);
  });

  const selected = ext.adminUsers.find((u) => u.id === selectedId) || users[0];

  const updateUserStatus = (userId: string, nextStatus: AccountStatus) => {
    if (!canManageStatus) {
      updateExt((prev) => ({
        ...prev,
        auditLogs: appendAuditLog(prev.auditLogs, {
          actor: role,
          action: `Changement statut refusé (${nextStatus})`,
          target: userId,
          scope: 'Gestion utilisateurs',
          result: 'Refusé',
          justification: `Le rôle ${role} n’est pas habilité à modifier le statut du compte.`
        })
      }));
      setToast(`Action refusée : le rôle ${role} est en accès limité.`);
      return;
    }
    updateExt((prev) => ({
      ...prev,
      adminUsers: prev.adminUsers.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u)),
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor: role,
        action: `Changement statut compte → ${nextStatus}`,
        target: selected?.name || userId,
        scope: 'Gestion utilisateurs',
        result: 'Succès',
        justification: 'Action administrative de démonstration.'
      })
    }));
    setToast(`Statut mis à jour : ${STATUS_LABELS[nextStatus].label}`);
  };

  const requestExceptionalAccess = () => {
    if (!selected || !justifInput.trim()) return;
    if (role === 'Support' || role === 'Auditeur') {
      updateExt((prev) => ({
        ...prev,
        auditLogs: appendAuditLog(prev.auditLogs, {
          actor: role,
          action: 'Accès exceptionnel refusé',
          target: selected.name,
          scope: 'Fiche utilisateur',
          result: 'Refusé',
          justification: justifInput.trim()
        })
      }));
      setToast(`Refus journalisé : le rôle ${role} ne dispose pas d’accès exceptionnel.`);
      return;
    }
    setRevealedIds((prev) => [...new Set([...prev, selected.id])]);
    updateExt((prev) => ({
      ...prev,
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor: role,
        action: 'Accès exceptionnel fiche sensible',
        target: selected.name,
        scope: 'Fiche utilisateur · Périmètre borné',
        result: 'Succès',
        justification: justifInput.trim()
      })
    }));
    setJustifInput('');
    setToast('Accès exceptionnel accordé et enregistré dans le journal d’audit');
  };

  return (
    <GovernanceShell ext={ext} updateExt={updateExt} nav={nav} activePage={activePage} user={user} setToast={setToast}>
      <div className="page-heading">
        <span className="eyebrow">GESTION DES UTILISATEURS & FICHE CONTRÔLÉE</span>
        <h1>Comptes et statuts de démonstration</h1>
        <p>
          Les données académiques, notes personnelles et conversations privées restent masquées par défaut. L’adresse
          e-mail n’est visible que pour les rôles autorisés.
        </p>
      </div>

      <div className="catalog-tabs-underline" role="tablist" aria-label="Filtrer par statut de compte">
        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === 'all'}
          className={statusFilter === 'all' ? 'selected' : ''}
          onClick={() => setStatusFilter('all')}
        >
          Tous ({ext.adminUsers.length})
        </button>
        {(Object.keys(STATUS_LABELS) as AccountStatus[]).map((st) => (
          <button
            key={st}
            type="button"
            role="tab"
            aria-selected={statusFilter === st}
            className={statusFilter === st ? 'selected' : ''}
            onClick={() => setStatusFilter(st)}
          >
            {STATUS_LABELS[st].label}
          </button>
        ))}
      </div>

      <div className="catalog-filter-bar">
        <div className="catalog-search-inline">
          <Search size={16} aria-hidden="true" />
          <input
            aria-label="Rechercher un utilisateur"
            placeholder="Nom, ID interne, établissement…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="wf-editor-split">
        <aside className="wf-card wf-stack-sm">
          <b>Comptes ({users.length})</b>
          {users.map((u) => (
            <button
              key={u.id}
              className={`wf-media-row ${selected?.id === u.id ? 'active-row' : ''}`}
              onClick={() => setSelectedId(u.id)}
            >
              <div>
                <b>{u.name}</b>
                <small className="muted">
                  {u.institution} · {u.roles[0]}
                </small>
              </div>
              <span className={`status-tag ${STATUS_LABELS[u.status].badge}`}>{STATUS_LABELS[u.status].label}</span>
            </button>
          ))}
        </aside>

        {selected && (
          <section className="wf-card wf-form-stack">
            <div className="between">
              <div>
                <span className="eyebrow">{selected.id}</span>
                <h2>{selected.name}</h2>
                <small className="muted">
                  Créé le {selected.createdAt} · Dernière activité : {selected.lastActivity}
                </small>
              </div>
              <span className={`status-tag ${STATUS_LABELS[selected.status].badge}`}>
                {STATUS_LABELS[selected.status].label}
              </span>
            </div>

            <div className="wf-evidence-box">
              <b>Sens du statut ({selected.status}) :</b>{' '}
              <span className="tiny muted">{STATUS_LABELS[selected.status].desc}</span>
            </div>

            <div className="wf-program-list">
              <div className="wf-program-item">
                <span>Adresse e-mail</span>
                <b>{canSeeEmail ? selected.email : 'Masquée pour ce rôle'}</b>
              </div>
              <div className="wf-program-item">
                <span>Rattachement & rôles</span>
                <b>
                  {selected.institution} · {selected.roles.join(', ')}
                </b>
              </div>
              <div className="wf-program-item">
                <span>Historique administratif</span>
                <b className="tabular">
                  {selected.sanctionsCount} sanction(s) · {selected.reportsCount} signalement(s) ·{' '}
                  {selected.openTicketsCount} ticket(s)
                </b>
              </div>
            </div>

            <label>
              Modifier le statut du compte (contrôlé côté serveur en production)
              <select
                value={selected.status}
                onChange={(e) => updateUserStatus(selected.id, e.target.value as AccountStatus)}
              >
                {(Object.keys(STATUS_LABELS) as AccountStatus[]).map((st) => (
                  <option key={st} value={st}>
                    {st} — {STATUS_LABELS[st].label}
                  </option>
                ))}
              </select>
            </label>

            <div className="wf-divider" />

            <div className="wf-stack-sm">
              <b>
                <Lock size={14} /> Données privées protégées (notes, copies, messages privés)
              </b>
              {revealedIds.includes(selected.id) ? (
                <div className="wf-evidence-box">
                  <b>Synthèse exceptionnelle consultée (tracée) :</b>
                  <p className="tiny muted wf-mt-sm">{selected.exceptionalNote}</p>
                </div>
              ) : (
                <div className="wf-form-stack">
                  <p className="tiny muted">
                    Accès fermé par défaut. Toute consultation exceptionnelle requiert un motif écrit et génère une
                    entrée immuable dans le journal d’audit.
                  </p>
                  <div className="wf-two-inputs">
                    <input
                      placeholder="Motif documenté d’accès exceptionnel…"
                      value={justifInput}
                      onChange={(e) => setJustifInput(e.target.value)}
                    />
                    <button
                      type="button"
                      className="secondary"
                      disabled={!justifInput.trim()}
                      onClick={requestExceptionalAccess}
                    >
                      <Eye size={14} /> Accès exceptionnel tracé
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </GovernanceShell>
  );
}

export function AdminRolesView({ ext, updateExt, nav, activePage, user, setToast }: AdminProps) {
  const [targetUserId, setTargetUserId] = useState(ext.adminUsers[0]?.id || 'usr-afi');
  const [roleChoice, setRoleChoice] = useState<AdminRoleName>('Modérateur');
  const [scope, setScope] = useState('Communauté · Numérique');
  const [justification, setJustification] = useState('');
  const [secondApprover, setSecondApprover] = useState('Responsable modération démo');

  const submitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) return;
    const target = ext.adminUsers.find((u) => u.id === targetUserId);
    const requester = ext.adminActiveRole;
    updateExt((prev) => ({
      ...prev,
      roleAssignments: [
        {
          id: `rol-${prev.roleAssignments.length + 1}`,
          targetUserId,
          targetName: target?.name || targetUserId,
          role: roleChoice,
          scope: scope.trim() || 'Périmètre pilote',
          requester,
          secondApprover: null,
          justification: justification.trim(),
          effectiveDate: 'En attente de validation',
          status: 'En attente d’approbation'
        },
        ...prev.roleAssignments
      ],
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor: requester,
        action: `Demande d’attribution ${roleChoice}`,
        target: target?.name || targetUserId,
        scope,
        result: 'Succès',
        justification: justification.trim()
      })
    }));
    setJustification('');
    setToast('Demande d’attribution soumise : une seconde approbation est requise.');
  };

  const approveAssignment = (id: string) => {
    const req = ext.roleAssignments.find((r) => r.id === id);
    if (!req) return;
    if (secondApprover === req.requester || secondApprover === req.targetName) {
      updateExt((prev) => ({
        ...prev,
        auditLogs: appendAuditLog(prev.auditLogs, {
          actor: secondApprover,
          action: 'Auto-approbation bloquée',
          target: req.targetName,
          scope: req.scope,
          result: 'Refusé',
          justification: 'Le second approbateur doit être distinct du demandeur et du bénéficiaire.'
        })
      }));
      setToast('Refus : le second approbateur doit être distinct du demandeur et du bénéficiaire.');
      return;
    }
    updateExt((prev) => ({
      ...prev,
      roleAssignments: prev.roleAssignments.map((r) =>
        r.id === id
          ? {
              ...r,
              secondApprover,
              effectiveDate: 'Aujourd’hui',
              status: 'Actif'
            }
          : r
      ),
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor: secondApprover,
        action: `Approbation rôle ${req.role}`,
        target: req.targetName,
        scope: req.scope,
        result: 'Succès',
        justification: `Double validation complétée (demandeur : ${req.requester}).`
      })
    }));
    setToast(`Rôle ${req.role} activé après double validation`);
  };

  const revokeAssignment = (id: string) => {
    const req = ext.roleAssignments.find((r) => r.id === id);
    if (!req) return;
    updateExt((prev) => ({
      ...prev,
      roleAssignments: prev.roleAssignments.map((r) => (r.id === id ? { ...r, status: 'Révoqué' } : r)),
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor: ext.adminActiveRole,
        action: `Révocation immédiate rôle ${req.role}`,
        target: req.targetName,
        scope: req.scope,
        result: 'Succès',
        justification: 'Révocation administrative avec conservation de l’historique.'
      })
    }));
    setToast(`Attribution révoquée immédiatement pour ${req.targetName}`);
  };

  return (
    <GovernanceShell ext={ext} updateExt={updateExt} nav={nav} activePage={activePage} user={user} setToast={setToast}>
      <div className="page-heading">
        <span className="eyebrow">GESTION DES RÔLES ET PERMISSIONS</span>
        <h1>Habilitations, périmètres et double validation</h1>
        <p>
          Refus par défaut. Un simple libellé de profil ne confère aucun privilège. Toute attribution sensible requiert
          un second approbateur distinct.
        </p>
      </div>

      <div className="wf-two-col">
        <section className="wf-card wf-stack">
          <div className="between">
            <h3>Attributions enregistrées</h3>
            <label className="wf-select-inline">
              Approbateur simulé
              <select value={secondApprover} onChange={(e) => setSecondApprover(e.target.value)}>
                <option value="Responsable modération démo">Responsable modération démo</option>
                <option value="Super admin démo">Super admin démo</option>
                <option value="Administrateur démo">Administrateur démo</option>
                <option value={ext.adminActiveRole}>{ext.adminActiveRole} (test auto-approbation)</option>
              </select>
            </label>
          </div>
          <div className="wf-program-list">
            {ext.roleAssignments.map((r) => (
              <div className="wf-program-item" key={r.id}>
                <div>
                  <b>
                    {r.targetName} — {r.role}
                  </b>
                  <small>
                    Périmètre : {r.scope} · Demandeur : {r.requester}
                    {r.secondApprover ? ` · Validé par : ${r.secondApprover}` : ' · En attente 2e validation'}
                  </small>
                  <small>Motif : {r.justification}</small>
                </div>
                <div className="wf-inline-actions">
                  <span
                    className={`status-tag ${
                      r.status === 'Actif' ? 'ok' : r.status === 'Révoqué' ? 'warn' : ''
                    }`}
                  >
                    {r.status}
                  </span>
                  {r.status === 'En attente d’approbation' && (
                    <button className="primary" onClick={() => approveAssignment(r.id)}>
                      Approuver (2e)
                    </button>
                  )}
                  {r.status === 'Actif' && (
                    <button className="secondary" onClick={() => revokeAssignment(r.id)}>
                      Révoquer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <form className="wf-side-card wf-form-stack" onSubmit={submitRequest}>
          <h3>Nouvelle demande d’attribution</h3>
          <label>
            Utilisateur concerné
            <select value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)}>
              {ext.adminUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Rôle administratif
            <select value={roleChoice} onChange={(e) => setRoleChoice(e.target.value as AdminRoleName)}>
              {ADMIN_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label>
            Périmètre d’intervention
            <input value={scope} onChange={(e) => setScope(e.target.value)} />
          </label>
          <label>
            Justification obligatoire
            <textarea
              rows={3}
              placeholder="Raison opérationnelle précise…"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
          </label>
          <button type="submit" className="primary" disabled={!justification.trim()}>
            <ShieldCheck size={15} /> Soumettre à double validation
          </button>
        </form>
      </div>
    </GovernanceShell>
  );
}

export function AdminFlaggedContentsView({ ext, updateExt, nav, activePage, user, setToast }: AdminProps) {
  const [typeFilter, setTypeFilter] = useState<'Tous' | 'Ressource' | 'Module' | 'Parcours' | 'Publication' | 'Commentaire'>('Tous');

  const items = ext.flaggedContents.filter((c) => (typeFilter === 'Tous' ? true : c.type === typeFilter));

  const applyContentAction = (
    id: string,
    visibility: 'Accessible' | 'Masqué temporairement' | 'Retiré' | 'Modification demandée',
    historyEntry: string
  ) => {
    const target = ext.flaggedContents.find((c) => c.id === id);
    updateExt((prev) => ({
      ...prev,
      flaggedContents: prev.flaggedContents.map((c) =>
        c.id === id
          ? {
              ...c,
              visibility,
              lastActionAt: 'À l’instant',
              history: [...c.history, historyEntry]
            }
          : c
      ),
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor: ext.adminActiveRole,
        action: `Contenu signalé → ${visibility}`,
        target: `${target?.title || id} (${target?.version || 'v1'})`,
        scope: 'Modération contenus',
        result: 'Succès',
        justification: historyEntry
      })
    }));
    setToast(`Action appliquée : ${visibility} (version originale conservée)`);
  };

  return (
    <GovernanceShell ext={ext} updateExt={updateExt} nav={nav} activePage={activePage} user={user} setToast={setToast}>
      <div className="page-heading">
        <span className="eyebrow">GESTION DES CONTENUS SIGNALÉS</span>
        <h1>Masquage, retrait et restauration traçable</h1>
        <p>
          Les actions de modération n’altèrent jamais silencieusement le texte original de l’auteur. Un retrait bloque
          aussi les liens directs et l’index de recherche.
        </p>
      </div>

      <div className="catalog-tabs-underline" role="tablist" aria-label="Filtrer les contenus signalés">
        {['Tous', 'Publication', 'Commentaire', 'Ressource', 'Module', 'Parcours'].map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={typeFilter === t}
            className={typeFilter === t ? 'selected' : ''}
            onClick={() => setTypeFilter(t as any)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="wf-stack">
        {items.map((item) => (
          <section className="wf-card" key={item.id}>
            <div className="between wf-mb-sm">
              <div>
                <div className="inline-meta">
                  <span>{item.type} · {item.version}</span>
                  <span>Auteur : {item.author}</span>
                  <span>{item.reportCount} signalement(s)</span>
                </div>
                <h3 className="wf-mt-sm">{item.title}</h3>
              </div>
              <span
                className={`status-tag ${
                  item.visibility === 'Accessible' ? 'ok' : 'warn'
                }`}
              >
                {item.visibility}
              </span>
            </div>

            <div className="wf-evidence-box wf-mb-sm">
              <b>Historique des versions & mesures ({item.lastActionAt}) :</b>
              <ul className="wf-history-list">
                {item.history.map((h, i) => (
                  <li key={i} className="tiny muted">
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            <div className="wf-inline-actions">
              <button
                className="secondary"
                onClick={() =>
                  applyContentAction(item.id, 'Masqué temporairement', 'Masquage temporaire pour examen')
                }
              >
                Masquer temporairement
              </button>
              <button
                className="secondary"
                onClick={() =>
                  applyContentAction(
                    item.id,
                    'Modification demandée',
                    'Demande de modification motivée envoyée à l’auteur'
                  )
                }
              >
                Demander modification
              </button>
              <button
                className="secondary danger"
                onClick={() =>
                  applyContentAction(item.id, 'Retiré', 'Retrait public et désindexation appliqués')
                }
              >
                Retirer (liens & fichiers)
              </button>
              {item.visibility !== 'Accessible' && (
                <button
                  className="primary"
                  onClick={() =>
                    applyContentAction(
                      item.id,
                      'Accessible',
                      'Restauration après vérification des droits et de la version'
                    )
                  }
                >
                  Restaurer
                </button>
              )}
            </div>
          </section>
        ))}
      </div>
    </GovernanceShell>
  );
}

export function AdminValidationView({ ext, updateExt, nav, activePage, user, setToast }: AdminProps) {
  const [levelFilter, setLevelFilter] = useState<'Tous' | 'Revue communautaire' | 'Validation pédagogique' | 'Validation renforcée'>('Tous');
  const [notes, setNotes] = useState<Record<string, string>>({});

  const items = ext.validationRequests.filter((v) => (levelFilter === 'Tous' ? true : v.level === levelFilter));

  const decideValidation = (id: string, status: 'Validée' | 'À corriger' | 'Refusée') => {
    const req = ext.validationRequests.find((v) => v.id === id);
    if (!req) return;
    if (req.author === user.name) {
      updateExt((prev) => ({
        ...prev,
        auditLogs: appendAuditLog(prev.auditLogs, {
          actor: user.name,
          action: 'Auto-validation pédagogique refusée',
          target: `${req.title} (${req.version})`,
          scope: 'Validation pédagogique',
          result: 'Refusé',
          justification: 'Séparation auteur / validateur obligatoire.'
        })
      }));
      setToast('Refus : un auteur ne peut pas valider pédagogiquement son propre contenu.');
      return;
    }
    const noteText = (notes[id] || req.decisionNote || `Décision ${status} sur la ${req.version}.`).trim();
    updateExt((prev) => ({
      ...prev,
      validationRequests: prev.validationRequests.map((v) =>
        v.id === id ? { ...v, status, decisionNote: noteText, validator: user.name } : v
      ),
      studioContents: prev.studioContents.map((c) =>
        c.id === req.contentId
          ? {
              ...c,
              reviewStatus: status === 'Validée' ? 'Validée' : status === 'À corriger' ? 'À corriger' : 'Non soumise',
              updatedAt: `Revue pédagogique : ${status}`
            }
          : c
      ),
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor: `${user.name} (${ext.adminActiveRole})`,
        action: `Validation → ${status}`,
        target: `${req.title} (${req.version})`,
        scope: `${req.level} · ${req.domain}`,
        result: 'Succès',
        justification: noteText
      })
    }));
    setToast(`Demande ${req.id} marquée « ${status} » pour la ${req.version}`);
  };

  return (
    <GovernanceShell ext={ext} updateExt={updateExt} nav={nav} activePage={activePage} user={user} setToast={setToast}>
      <div className="page-heading">
        <span className="eyebrow">DEMANDES DE VALIDATION PÉDAGOGIQUE</span>
        <h1>Revue par version et par niveau</h1>
        <p>
          Concerne ressources, cours, fiches, modules et quiz (publications communautaires exclues). L’IA peut signaler
          des points à relire mais ne délivre jamais seule une validation.
        </p>
      </div>

      <div className="catalog-tabs-underline" role="tablist" aria-label="Filtrer par niveau de validation">
        {['Tous', 'Revue communautaire', 'Validation pédagogique', 'Validation renforcée'].map((lvl) => (
          <button
            key={lvl}
            type="button"
            role="tab"
            aria-selected={levelFilter === lvl}
            className={levelFilter === lvl ? 'selected' : ''}
            onClick={() => setLevelFilter(lvl as any)}
          >
            {lvl}
          </button>
        ))}
      </div>

      <div className="wf-stack">
        {items.map((req) => {
          const isSameAuthor = req.author === user.name;
          return (
            <section className="wf-card wf-form-stack" key={req.id}>
              <div className="between">
                <div>
                  <div className="inline-meta">
                    <span>{req.id}</span>
                    <span>{req.level}</span>
                    <span>{req.contentType} · {req.version} · {req.domain}</span>
                  </div>
                  <h3 className="wf-mt-sm">{req.title}</h3>
                  <small className="muted">
                    Auteur : {req.author} · Soumis : {req.submittedAt} · Validateur affecté : {req.validator}
                  </small>
                </div>
                <span
                  className={`status-tag ${
                    req.status === 'Validée' ? 'ok' : req.status === 'À corriger' || req.status === 'Refusée' ? 'warn' : ''
                  }`}
                >
                  {req.status}
                </span>
              </div>

              {isSameAuthor && (
                <div className="wf-alert-warn">
                  <AlertTriangle size={16} />
                  <span>
                    Conflit auteur/validateur : votre compte actif ({user.name}) est l’auteur de ce contenu. Changez de
                    personnage démo (ex. Kossi Agbo) pour simuler une revue indépendante.
                  </span>
                </div>
              )}

              <label>
                Observation du validateur (rattachée à la {req.version})
                <input
                  placeholder="Précisez la portée examinée ou les corrections attendues…"
                  value={notes[req.id] ?? req.decisionNote}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [req.id]: e.target.value }))}
                />
              </label>

              <div className="wf-inline-actions">
                <button className="primary" onClick={() => decideValidation(req.id, 'Validée')}>
                  <CheckCircle2 size={15} /> Valider cette version
                </button>
                <button className="secondary" onClick={() => decideValidation(req.id, 'À corriger')}>
                  Demander corrections
                </button>
                <button className="secondary danger" onClick={() => decideValidation(req.id, 'Refusée')}>
                  <XCircle size={15} /> Refuser
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </GovernanceShell>
  );
}

export function AdminAuditView({ ext, updateExt, nav, activePage, user, setToast }: AdminProps) {
  const [actorFilter, setActorFilter] = useState('');
  const [resultFilter, setResultFilter] = useState<'Tous' | 'Succès' | 'Refusé'>('Tous');
  const [exportPreview, setExportPreview] = useState(false);

  const canExport = ext.adminActiveRole === 'Auditeur' || ext.adminActiveRole === 'Super administrateur';

  const logs = ext.auditLogs.filter((l) => {
    if (resultFilter !== 'Tous' && l.result !== resultFilter) return false;
    const q = actorFilter.trim().toLowerCase();
    if (!q) return true;
    return `${l.actor} ${l.action} ${l.target} ${l.scope}`.toLowerCase().includes(q);
  });

  const handleExport = () => {
    if (!canExport) {
      updateExt((prev) => ({
        ...prev,
        auditLogs: appendAuditLog(prev.auditLogs, {
          actor: ext.adminActiveRole,
          action: 'Export journaux refusé',
          target: 'Journaux d’audit',
          scope: 'Audit et traçabilité',
          result: 'Refusé',
          justification: 'Export réservé aux rôles Auditeur ou Super administrateur habilité.'
        })
      }));
      setToast('Export refusé : capacité réservée à Auditeur / Super administrateur.');
      return;
    }
    setExportPreview(!exportPreview);
    updateExt((prev) => ({
      ...prev,
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor: ext.adminActiveRole,
        action: 'Export contrôlé des journaux (aperçu)',
        target: `${logs.length} événements`,
        scope: 'Audit et traçabilité',
        result: 'Succès',
        justification: 'Consultation et export tracés sans secrets ni mots de passe.'
      })
    }));
    setToast('Export journalisé dans l’audit');
  };

  return (
    <GovernanceShell ext={ext} updateExt={updateExt} nav={nav} activePage={activePage} user={user} setToast={setToast}>
      <div className="between wf-mb-sm">
        <div className="page-heading wf-no-mb">
          <span className="eyebrow">JOURNAUX D’AUDIT · LECTURE SEULE & NON MODIFIABLES</span>
          <h1>Traçabilité des opérations sensibles</h1>
          <p>
            Aucun secret ni message privé en clair n’est stocké dans ces événements. Chaque consultation exceptionnelle ou
            exportation est elle-même journalisée.
          </p>
        </div>
        <button className="secondary" onClick={handleExport}>
          <Download size={15} /> Exporter (contrôlé)
        </button>
      </div>

      {exportPreview && (
        <div className="wf-evidence-box wf-mb">
          <b>Aperçu d’export contrôlé ({logs.length} entrées · sans secrets)</b>
          <p className="tiny muted wf-mt-sm">
            Format structuré prêt (ID requête, horodatage, acteur, action, objet, périmètre, résultat).
          </p>
        </div>
      )}

      <div className="catalog-tabs-underline" role="tablist" aria-label="Filtrer par résultat d’audit">
        {['Tous', 'Succès', 'Refusé'].map((r) => (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={resultFilter === r}
            className={resultFilter === r ? 'selected' : ''}
            onClick={() => setResultFilter(r as any)}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="catalog-filter-bar">
        <div className="catalog-search-inline">
          <Search size={16} aria-hidden="true" />
          <input
            aria-label="Filtrer les journaux"
            placeholder="Filtrer par acteur, action, objet ou périmètre…"
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
          />
        </div>
      </div>

      <section className="wf-card">
        <div className="wf-table-wrap">
          <table className="wf-table">
            <thead>
              <tr>
                <th>Horodatage / ID</th>
                <th>Acteur & Périmètre</th>
                <th>Action & Objet</th>
                <th>Justification</th>
                <th>Résultat</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="tabular">
                    <b>{l.id}</b>
                    <div className="tiny muted">{l.timestamp}</div>
                    <div className="tiny muted">{l.requestId}</div>
                  </td>
                  <td>
                    <b>{l.actor}</b>
                    <div className="tiny muted">{l.scope}</div>
                  </td>
                  <td>
                    <b>{l.action}</b>
                    <div className="tiny muted">{l.target}</div>
                  </td>
                  <td className="tiny muted">{l.justification}</td>
                  <td>
                    <span className={`status-tag ${l.result === 'Succès' ? 'ok' : 'warn'}`}>{l.result}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </GovernanceShell>
  );
}

export function AdminSupportView({ ext, updateExt, nav, activePage, user, setToast }: AdminProps) {
  const [statusFilter, setStatusFilter] = useState<'tous' | 'nouveau' | 'ouvert' | 'en attente' | 'résolu' | 'fermé'>('tous');
  const [selectedId, setSelectedId] = useState(ext.supportTickets[0]?.id || 'SUP-001');
  const [replyText, setReplyText] = useState('');
  const [internalText, setInternalText] = useState('');

  const tickets = ext.supportTickets.filter((t) => (statusFilter === 'tous' ? true : t.status === statusFilter));
  const ticket = ext.supportTickets.find((t) => t.id === selectedId) || tickets[0];

  const saveTicket = (nextStatus?: 'nouveau' | 'ouvert' | 'en attente' | 'résolu' | 'fermé') => {
    if (!ticket) return;
    const updatedStatus = nextStatus || ticket.status;
    updateExt((prev) => ({
      ...prev,
      supportTickets: prev.supportTickets.map((t) =>
        t.id === ticket.id
          ? {
              ...t,
              status: updatedStatus,
              publicReply: replyText.trim() || t.publicReply,
              internalNote: internalText.trim() || t.internalNote
            }
          : t
      ),
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor: ext.adminActiveRole,
        action: `Mise à jour ticket ${ticket.id} → ${updatedStatus}`,
        target: ticket.userName,
        scope: 'Support utilisateurs',
        result: 'Succès',
        justification: 'Traitement ticket sans accès aux conversations ou copies privées.'
      })
    }));
    setReplyText('');
    setInternalText('');
    setToast(`Ticket ${ticket.id} mis à jour (${updatedStatus})`);
  };

  return (
    <GovernanceShell ext={ext} updateExt={updateExt} nav={nav} activePage={activePage} user={user} setToast={setToast}>
      <div className="page-heading">
        <span className="eyebrow">GESTION DES TICKETS DE SUPPORT</span>
        <h1>Assistance limitée aux données nécessaires</h1>
        <p>
          Le support accède uniquement au profil minimal, à l’état du compte et au ticket. Les réponses internes
          demeurent strictement invisibles pour l’utilisateur.
        </p>
      </div>

      <div className="catalog-tabs-underline" role="tablist" aria-label="Filtrer par statut de ticket">
        {['tous', 'nouveau', 'ouvert', 'en attente', 'résolu', 'fermé'].map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={statusFilter === s}
            className={statusFilter === s ? 'selected' : ''}
            onClick={() => setStatusFilter(s as any)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="wf-editor-split">
        <aside className="wf-card wf-stack-sm">
          <b>Tickets ({tickets.length})</b>
          {tickets.map((t) => (
            <button
              key={t.id}
              className={`wf-media-row ${ticket?.id === t.id ? 'active-row' : ''}`}
              onClick={() => setSelectedId(t.id)}
            >
              <div>
                <b>
                  {t.id} · {t.userName}
                </b>
                <small className="muted">
                  {t.category} · {t.subject}
                </small>
              </div>
              <span className={`status-tag ${t.priority === 'Haute' ? 'warn' : ''}`}>{t.status}</span>
            </button>
          ))}
        </aside>

        {ticket && (
          <section className="wf-card wf-form-stack">
            <div className="between">
              <div>
                <span className="eyebrow">
                  {ticket.id} · {ticket.category}
                </span>
                <h3>{ticket.subject}</h3>
                <small className="muted">
                  Compte : {ticket.userName} (statut : {ticket.userStatus}) · {ticket.date}
                </small>
              </div>
              <span className="status-tag">{ticket.status}</span>
            </div>

            <div className="wf-evidence-box">
              <b>Demande de l’utilisateur</b>
              <p className="tiny muted wf-mt-sm">{ticket.description}</p>
            </div>

            {ticket.publicReply && (
              <div className="wf-evidence-box">
                <b>Dernière réponse transmise à l’utilisateur :</b>
                <p className="tiny wf-mt-sm">{ticket.publicReply}</p>
              </div>
            )}

            <label>
              Réponse publique à l’utilisateur
              <textarea
                rows={2}
                placeholder="Rédigez une réponse claire sans demander de mot de passe…"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
            </label>

            <label>
              Note interne d’équipe (invisible pour l’utilisateur)
              <textarea
                rows={2}
                placeholder={ticket.internalNote || 'Note technique interne…'}
                value={internalText}
                onChange={(e) => setInternalText(e.target.value)}
              />
            </label>

            <div className="wf-inline-actions">
              <button className="primary" onClick={() => saveTicket('en attente')}>
                Enregistrer réponse
              </button>
              <button className="secondary" onClick={() => saveTicket('résolu')}>
                Marquer résolu
              </button>
              <button className="secondary" onClick={() => saveTicket('fermé')}>
                Clôturer le ticket
              </button>
            </div>
          </section>
        )}
      </div>
    </GovernanceShell>
  );
}

export function AdminSettingsView({ ext, updateExt, nav, activePage, user, setToast }: AdminProps) {
  const [settingName, setSettingName] = useState('Durées de suspension autorisées');
  const [proposedValue, setProposedValue] = useState('24 heures, 7 jours, 30 jours (inchangé)');
  const [justification, setJustification] = useState('');

  const ps = ext.platformSettings;
  const isSuperAdmin = ext.adminActiveRole === 'Super administrateur';

  const submitChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) return;
    updateExt((prev) => ({
      ...prev,
      platformSettings: {
        ...prev.platformSettings,
        pendingChanges: [
          {
            id: `SET-00${prev.platformSettings.pendingChanges.length + 1}`,
            settingName,
            currentValue:
              settingName === 'Durées de suspension autorisées'
                ? prev.platformSettings.sanctionDurations.join(', ')
                : prev.platformSettings.validationRuleNote,
            proposedValue: proposedValue.trim(),
            justification: justification.trim(),
            requester: ext.adminActiveRole,
            approver: null,
            status: 'En attente d’approbation'
          },
          ...prev.platformSettings.pendingChanges
        ]
      },
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor: ext.adminActiveRole,
        action: 'Proposition changement paramètre',
        target: settingName,
        scope: 'Paramètres plateforme',
        result: 'Succès',
        justification: justification.trim()
      })
    }));
    setJustification('');
    setToast('Modification proposée : soumise à approbation');
  };

  const approveChange = (id: string) => {
    if (!isSuperAdmin) {
      setToast('Seul le rôle Super administrateur peut approuver un paramètre critique.');
      return;
    }
    const ch = ps.pendingChanges.find((x) => x.id === id);
    if (!ch) return;
    updateExt((prev) => ({
      ...prev,
      platformSettings: {
        ...prev.platformSettings,
        pendingChanges: prev.platformSettings.pendingChanges.map((x) =>
          x.id === id ? { ...x, status: 'Appliqué', approver: 'Super administrateur' } : x
        )
      },
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor: 'Super administrateur',
        action: `Paramètre appliqué : ${ch.settingName}`,
        target: `${ch.currentValue} → ${ch.proposedValue}`,
        scope: 'Paramètres plateforme',
        result: 'Succès',
        justification: ch.justification
      })
    }));
    setToast('Paramètre approuvé et appliqué');
  };

  return (
    <GovernanceShell ext={ext} updateExt={updateExt} nav={nav} activePage={activePage} user={user} setToast={setToast}>
      <div className="page-heading">
        <span className="eyebrow">PARAMÈTRES ADMINISTRATIFS</span>
        <h1>Taxonomies, règles de modération et contrôle des changements</h1>
        <p>
          Les paramètres critiques exigent une comparaison valeur actuelle / nouvelle valeur, une justification et une
          approbation habilitée.
        </p>
      </div>

      <div className="wf-two-col">
        <div className="wf-stack">
          <section className="wf-card">
            <h3>Référentiels configurés</h3>
            <div className="wf-program-list">
              <div className="wf-program-item">
                <div>
                  <b>Catégories de signalement</b>
                  <small>{ps.reportCategories.join(' · ')}</small>
                </div>
                <Sliders size={16} />
              </div>
              <div className="wf-program-item">
                <div>
                  <b>Durées de suspension retenues</b>
                  <small>{ps.sanctionDurations.join(' · ')}</small>
                </div>
                <Sliders size={16} />
              </div>
              <div className="wf-program-item">
                <div>
                  <b>Taxonomies pédagogiques actives</b>
                  <small>{ps.domains.join(' · ')}</small>
                </div>
                <Sliders size={16} />
              </div>
              <div className="wf-program-item">
                <div>
                  <b>Règle de validation pédagogique</b>
                  <small>{ps.validationRuleNote}</small>
                </div>
                <Settings size={16} />
              </div>
            </div>
          </section>

          <section className="wf-card">
            <h3>Changements soumis à contrôle</h3>
            <div className="wf-program-list">
              {ps.pendingChanges.map((ch) => (
                <div className="wf-program-item" key={ch.id}>
                  <div>
                    <b>{ch.settingName}</b>
                    <small>
                      Actuel : {ch.currentValue} → Proposé : {ch.proposedValue}
                    </small>
                    <small>
                      Demandeur : {ch.requester} · Motif : {ch.justification}
                    </small>
                  </div>
                  <div className="wf-inline-actions">
                    <span className={`status-tag ${ch.status === 'Appliqué' ? 'ok' : ''}`}>{ch.status}</span>
                    {ch.status === 'En attente d’approbation' && (
                      <button className="primary" onClick={() => approveChange(ch.id)}>
                        Approuver
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <form className="wf-side-card wf-form-stack" onSubmit={submitChange}>
          <h3>Proposer un changement critique</h3>
          <label>
            Paramètre visé
            <select value={settingName} onChange={(e) => setSettingName(e.target.value)}>
              <option>Durées de suspension autorisées</option>
              <option>Règle de validation pédagogique</option>
              <option>Seuil de priorité signalements</option>
            </select>
          </label>
          <label>
            Nouvelle valeur proposée
            <input value={proposedValue} onChange={(e) => setProposedValue(e.target.value)} />
          </label>
          <label>
            Justification obligatoire
            <textarea
              rows={3}
              placeholder="Impact attendu et raison du changement…"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
          </label>
          <button type="submit" className="primary" disabled={!justification.trim()}>
            Soumettre la proposition
          </button>
        </form>
      </div>
    </GovernanceShell>
  );
}
