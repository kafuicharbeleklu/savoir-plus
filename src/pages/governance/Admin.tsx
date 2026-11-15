/**
 * Gouvernance — administration : Utilisateurs, Rôles, Réglages de la plateforme, Journal d'audit.
 * Tableaux sobres, détail en panneau latéral, confirmations pour les actions sensibles ;
 * chaque refus lié à la vue active est inscrit au journal.
 */
import React, { useState } from 'react';
import { ArrowRight, Download, Plus } from 'lucide-react';
import {
  ACCOUNT_STATUS,
  canApproveSettings,
  canExceptionalAccess,
  canExportAudit,
  canManageStatus,
  canSeeEmail,
  govAccess,
  splitTimestamp
} from '../../governance';
import {
  ADMIN_ROLES,
  appendAuditLog,
  type AccountStatus,
  type AdminRoleName,
  type AuditLogEntry,
  type PlatformSettingChange,
  type PlatformSettingsState,
  type RoleAssignmentRecord
} from '../../wireframeData';
import { ActionMenu, ConfirmDialog, EmptyState, ListCard, ListRow, PageHeader, SearchField, Select, SidePanel, StatusDot, type StatusTone, Tabs } from '../../components/ui';
import { Block, Facts, GovShell, normalize, type GovProps } from './shared';

/* ================================================================== Utilisateurs */

export function AdminUsersView({ ext, updateExt, nav, user, setToast }: GovProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | AccountStatus>('all');
  const [openId, setOpenId] = useState('');
  const [reason, setReason] = useState('');
  const [revealed, setRevealed] = useState<string[]>([]);
  const [nextStatus, setNextStatus] = useState<AccountStatus | null>(null);
  const role = ext.adminActiveRole;
  const seeEmail = canSeeEmail(role);
  const manage = canManageStatus(role) && govAccess(role, 'admin-users') === 'act';

  const q = normalize(search);
  const users = ext.adminUsers.filter(
    (u) =>
      (filter === 'all' || u.status === filter) &&
      (!q || normalize(`${u.name} ${seeEmail ? u.email : ''} ${u.id} ${u.institution}`).includes(q))
  );
  const open = ext.adminUsers.find((u) => u.id === openId);
  const statuses = (Object.keys(ACCOUNT_STATUS) as AccountStatus[]).filter((s) => ext.adminUsers.some((u) => u.status === s));

  const applyStatus = () => {
    if (!open || !nextStatus) return;
    updateExt((prev) => ({
      ...prev,
      adminUsers: prev.adminUsers.map((u) => (u.id === open.id ? { ...u, status: nextStatus } : u)),
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor: `${user.name} (${role})`,
        action: `Statut du compte → ${ACCOUNT_STATUS[nextStatus].label}`,
        target: open.name,
        scope: 'Utilisateurs',
        result: 'Succès',
        justification: `Ancien statut : ${ACCOUNT_STATUS[open.status].label}.`
      })
    }));
    setToast(`${open.name} : ${ACCOUNT_STATUS[nextStatus].label.toLowerCase()}`);
    setNextStatus(null);
  };

  const requestAccess = () => {
    if (!open || !reason.trim()) return;
    const allowed = canExceptionalAccess(role);
    updateExt((prev) => ({
      ...prev,
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor: `${user.name} (${role})`,
        action: allowed ? 'Accès exceptionnel aux données privées' : 'Accès exceptionnel refusé',
        target: open.name,
        scope: 'Utilisateurs · périmètre borné',
        result: allowed ? 'Succès' : 'Refusé',
        justification: reason.trim()
      })
    }));
    if (allowed) setRevealed((prev) => [...new Set([...prev, open.id])]);
    setReason('');
    setToast(allowed ? 'Accès accordé et inscrit au journal d’audit' : `Refus inscrit au journal : la vue « ${role} » n’a pas cet accès.`);
  };

  return (
    <GovShell section="admin-users" ext={ext} updateExt={updateExt} nav={nav} setToast={setToast}>
      <PageHeader title="Utilisateurs" subtitle="Les notes, copies et conversations privées restent masquées par défaut." />
      <div className="ui-toolbar">
        <Tabs
          label="Filtrer par statut"
          value={filter}
          onChange={setFilter}
          items={[
            { id: 'all' as const, label: 'Tous', count: ext.adminUsers.length },
            ...statuses.map((s) => ({ id: s, label: ACCOUNT_STATUS[s].label, count: ext.adminUsers.filter((u) => u.status === s).length }))
          ]}
        />
        <SearchField value={search} onChange={setSearch} placeholder="Nom, établissement…" label="Rechercher un compte" />
      </div>

      <div className="ui-list gv-table-wrap">
        {users.length === 0 ? (
          <EmptyState title="Aucun compte ne correspond" text="Modifiez le filtre ou la recherche." />
        ) : (
          <table className="gv-table">
            <thead>
              <tr>
                <th scope="col" className="w-md">Nom</th>
                <th scope="col">Établissement</th>
                <th scope="col">Rôles</th>
                <th scope="col" className="w-lg">Statut</th>
                <th scope="col" className="w-md">Dernière activité</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={u.id === openId ? 'is-active' : ''}>
                  <th scope="row">
                    <button type="button" className="gv-table-link" onClick={() => setOpenId(u.id)}>
                      {u.name}
                    </button>
                  </th>
                  <td>{u.institution}</td>
                  <td>{u.roles.join(', ')}</td>
                  <td>
                    <StatusDot tone={ACCOUNT_STATUS[u.status].tone}>{ACCOUNT_STATUS[u.status].label}</StatusDot>
                  </td>
                  <td>{u.lastActivity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <SidePanel open={Boolean(open)} title={open?.name || 'Compte'} onClose={() => setOpenId('')}>
        {open && (
          <>
            <Block title="Compte">
              <Facts
                items={[
                  ['Statut', <StatusDot tone={ACCOUNT_STATUS[open.status].tone}>{ACCOUNT_STATUS[open.status].label}</StatusDot>],
                  ['Adresse e-mail', seeEmail ? open.email : 'Masquée avec cette vue'],
                  ['Établissement', open.institution],
                  ['Rôles', open.roles.join(', ')],
                  ['Créé le', open.createdAt],
                  ['Dernière activité', open.lastActivity],
                  ['Historique', `${open.sanctionsCount} sanction(s) · ${open.reportsCount} signalement(s) · ${open.openTicketsCount} ticket(s)`]
                ]}
              />
              <p className="gv-note">{ACCOUNT_STATUS[open.status].desc}</p>
            </Block>
            <Block title="Changer le statut">
              {manage ? (
                <div className="gv-inline">
                  {(Object.keys(ACCOUNT_STATUS) as AccountStatus[])
                    .filter((s) => s !== open.status)
                    .map((s) => (
                      <button key={s} type="button" className="secondary ui-btn-sm" onClick={() => setNextStatus(s)}>
                        {ACCOUNT_STATUS[s].label}
                      </button>
                    ))}
                </div>
              ) : (
                <p className="gv-text">La vue « {role} » ne permet pas de modifier le statut d’un compte.</p>
              )}
            </Block>
            <Block title="Données privées">
              {revealed.includes(open.id) ? (
                <p className="gv-text">{open.exceptionalNote || 'Aucune note particulière sur ce compte.'}</p>
              ) : (
                <>
                  <p className="gv-text">Notes, copies et messages privés sont fermés par défaut. Toute consultation exige un motif, inscrit au journal.</p>
                  <label className="ui-field">
                    <span>Motif de l’accès exceptionnel</span>
                    <input value={reason} maxLength={240} onChange={(e) => setReason(e.target.value)} />
                  </label>
                  <div className="gv-actions">
                    <button type="button" className="secondary ui-btn-sm" disabled={!reason.trim()} onClick={requestAccess}>
                      Demander l’accès
                    </button>
                  </div>
                </>
              )}
            </Block>
          </>
        )}
      </SidePanel>

      <ConfirmDialog
        open={Boolean(nextStatus && open)}
        title="Changer le statut du compte ?"
        text={nextStatus && open ? `${open.name} passera au statut « ${ACCOUNT_STATUS[nextStatus].label} ». ${ACCOUNT_STATUS[nextStatus].desc}` : ''}
        confirmLabel="Confirmer"
        danger={nextStatus === 'suspended' || nextStatus === 'restricted'}
        onConfirm={applyStatus}
        onCancel={() => setNextStatus(null)}
      />
    </GovShell>
  );
}

/* ================================================================== Rôles */

const ROLE_TONE: Record<RoleAssignmentRecord['status'], StatusTone> = {
  'En attente d’approbation': 'warn',
  Actif: 'ok',
  Révoqué: 'danger'
};
const ROLE_STATUS_LABEL: Record<RoleAssignmentRecord['status'], string> = {
  'En attente d’approbation': 'En attente',
  Actif: 'Actif',
  Révoqué: 'Révoqué'
};

export function AdminRolesView({ ext, updateExt, nav, user, setToast }: GovProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState(ext.adminUsers[0]?.id || '');
  const [roleChoice, setRoleChoice] = useState<AdminRoleName>('Modérateur');
  const [scope, setScope] = useState('Communauté · Numérique');
  const [justification, setJustification] = useState('');
  const [toRevoke, setToRevoke] = useState<RoleAssignmentRecord | null>(null);
  const role = ext.adminActiveRole;
  const canAct = govAccess(role, 'admin-roles') === 'act';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) return;
    const target = ext.adminUsers.find((u) => u.id === targetUserId);
    updateExt((prev) => ({
      ...prev,
      roleAssignments: [
        {
          id: `rol-${Date.now().toString(36)}`,
          targetUserId,
          targetName: target?.name || targetUserId,
          role: roleChoice,
          scope: scope.trim() || 'Périmètre pilote',
          requester: role,
          secondApprover: null,
          justification: justification.trim(),
          effectiveDate: 'En attente de validation',
          status: 'En attente d’approbation'
        },
        ...prev.roleAssignments
      ],
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor: `${user.name} (${role})`,
        action: `Demande d’attribution : ${roleChoice}`,
        target: target?.name || targetUserId,
        scope: scope.trim(),
        result: 'Succès',
        justification: justification.trim()
      })
    }));
    setJustification('');
    setFormOpen(false);
    setToast('Demande enregistrée : une seconde validation est requise.');
  };

  const approve = (req: RoleAssignmentRecord) => {
    // Double validation : l'approbateur ne peut être ni le demandeur ni le bénéficiaire.
    const selfApproval = req.requester === role || req.targetName === user.name;
    if (selfApproval) {
      updateExt((prev) => ({
        ...prev,
        auditLogs: appendAuditLog(prev.auditLogs, {
          actor: `${user.name} (${role})`,
          action: 'Auto-approbation refusée',
          target: req.targetName,
          scope: req.scope,
          result: 'Refusé',
          justification: 'Le second approbateur doit être distinct du demandeur et du bénéficiaire.'
        })
      }));
      setToast('Refus : changez de vue, l’approbateur doit être distinct du demandeur.');
      return;
    }
    updateExt((prev) => ({
      ...prev,
      roleAssignments: prev.roleAssignments.map((r) => (r.id === req.id ? { ...r, secondApprover: role, effectiveDate: 'Aujourd’hui', status: 'Actif' } : r)),
      adminUsers: prev.adminUsers.map((u) => (u.id === req.targetUserId && !u.roles.includes(req.role) ? { ...u, roles: [...u.roles, req.role] } : u)),
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor: `${user.name} (${role})`,
        action: `Rôle approuvé : ${req.role}`,
        target: req.targetName,
        scope: req.scope,
        result: 'Succès',
        justification: `Double validation (demandeur : ${req.requester}).`
      })
    }));
    setToast(`Rôle ${req.role} actif pour ${req.targetName}`);
  };

  const revoke = (req: RoleAssignmentRecord) => {
    updateExt((prev) => ({
      ...prev,
      roleAssignments: prev.roleAssignments.map((r) => (r.id === req.id ? { ...r, status: 'Révoqué' } : r)),
      adminUsers: prev.adminUsers.map((u) => (u.id === req.targetUserId ? { ...u, roles: u.roles.filter((x) => x !== req.role) } : u)),
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor: `${user.name} (${role})`,
        action: `Rôle révoqué : ${req.role}`,
        target: req.targetName,
        scope: req.scope,
        result: 'Succès',
        justification: 'Révocation avec conservation de l’historique.'
      })
    }));
    setToRevoke(null);
    setToast(`Rôle ${req.role} révoqué pour ${req.targetName}`);
  };

  return (
    <GovShell section="admin-roles" ext={ext} updateExt={updateExt} nav={nav} setToast={setToast}>
      <PageHeader
        title="Rôles"
        subtitle="Toute attribution exige une seconde validation, par une personne distincte du demandeur."
        actions={
          canAct ? (
            <button type="button" className="primary ui-btn-sm" onClick={() => setFormOpen(true)}>
              <Plus size={16} aria-hidden="true" /> Nouvelle attribution
            </button>
          ) : undefined
        }
      />
      <div className="ui-list gv-table-wrap">
        {ext.roleAssignments.length === 0 ? (
          <EmptyState title="Aucune attribution" text="Les rôles attribués aux membres apparaissent ici." />
        ) : (
          <table className="gv-table">
            <thead>
              <tr>
                <th scope="col" className="w-md">Membre</th>
                <th scope="col" className="w-md">Rôle</th>
                <th scope="col">Périmètre</th>
                <th scope="col">Validation</th>
                <th scope="col" className="w-sm">Statut</th>
                <th scope="col" className="w-sm">
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {ext.roleAssignments.map((r) => (
                <tr key={r.id}>
                  <th scope="row" title={r.justification}>
                    {r.targetName}
                  </th>
                  <td>{r.role}</td>
                  <td>{r.scope}</td>
                  <td title={`Demandé par ${r.requester}${r.secondApprover ? ` · approuvé par ${r.secondApprover}` : ''}`}>
                    {r.requester}
                    <small>{r.secondApprover ? `Approuvé par ${r.secondApprover}` : 'Seconde validation attendue'}</small>
                  </td>
                  <td>
                    <StatusDot tone={ROLE_TONE[r.status]}>{ROLE_STATUS_LABEL[r.status]}</StatusDot>
                  </td>
                  <td className="is-action">
                    {canAct && r.status === 'En attente d’approbation' && (
                      <button type="button" className="secondary ui-btn-sm" onClick={() => approve(r)}>
                        Approuver
                      </button>
                    )}
                    {canAct && r.status === 'Actif' && (
                      <ActionMenu label={`Actions sur le rôle de ${r.targetName}`} items={[{ label: 'Révoquer', danger: true, onSelect: () => setToRevoke(r) }]} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <SidePanel
        open={formOpen}
        title="Nouvelle attribution"
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <button type="button" className="secondary ui-btn-sm" onClick={() => setFormOpen(false)}>
              Annuler
            </button>
            <button type="submit" form="gv-role-form" className="primary ui-btn-sm" disabled={!justification.trim()}>
              Soumettre
            </button>
          </>
        }
      >
        <form id="gv-role-form" className="gv-form" onSubmit={submit}>
          <label className="ui-field">
            <span>Membre</span>
            <Select value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)}>
              {ext.adminUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="ui-field">
            <span>Rôle</span>
            <Select value={roleChoice} onChange={(e) => setRoleChoice(e.target.value as AdminRoleName)}>
              {ADMIN_ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
          </label>
          <label className="ui-field">
            <span>Périmètre</span>
            <input value={scope} maxLength={120} onChange={(e) => setScope(e.target.value)} />
          </label>
          <label className="ui-field">
            <span>Justification</span>
            <textarea rows={4} value={justification} maxLength={600} placeholder="Raison opérationnelle précise" onChange={(e) => setJustification(e.target.value)} />
            <small>La demande sera active après approbation par une autre vue que « {role} ».</small>
          </label>
        </form>
      </SidePanel>

      <ConfirmDialog
        open={Boolean(toRevoke)}
        title="Révoquer ce rôle ?"
        text={toRevoke ? `${toRevoke.targetName} perdra immédiatement le rôle « ${toRevoke.role} ». L’historique est conservé.` : ''}
        confirmLabel="Révoquer"
        danger
        onConfirm={() => toRevoke && revoke(toRevoke)}
        onCancel={() => setToRevoke(null)}
      />
    </GovShell>
  );
}

/* ================================================================== Réglages de la plateforme */

type SettingKey = 'reportCategories' | 'moderationReasons' | 'sanctionDurations' | 'domains' | 'validationRuleNote' | 'urgentReportThreshold';
type ListSettingKey = Exclude<SettingKey, 'validationRuleNote' | 'urgentReportThreshold'>;
const SETTINGS: { key: SettingKey; label: string }[] = [
  { key: 'reportCategories', label: 'Motifs de signalement' },
  { key: 'moderationReasons', label: 'Motifs de modération' },
  { key: 'sanctionDurations', label: 'Durées de sanction' },
  { key: 'domains', label: 'Domaines pédagogiques' },
  { key: 'validationRuleNote', label: 'Règle de validation pédagogique' },
  { key: 'urgentReportThreshold', label: 'Seuil d’alerte des signalements urgents' }
];
const LEGACY_KEY: Record<string, SettingKey> = {
  'Durées de suspension autorisées': 'sanctionDurations',
  'Règle de validation pédagogique': 'validationRuleNote',
  'Seuil d’alerte signalements urgents': 'urgentReportThreshold',
  'Seuil de priorité signalements': 'urgentReportThreshold'
};
const settingValue = (ps: PlatformSettingsState, key: SettingKey) => {
  const v = ps[key];
  return Array.isArray(v) ? v.join(', ') : v;
};

export function AdminSettingsView({ ext, updateExt, nav, user, setToast }: GovProps) {
  const [editing, setEditing] = useState<SettingKey | null>(null);
  const [proposed, setProposed] = useState('');
  const [justification, setJustification] = useState('');
  const role = ext.adminActiveRole;
  const canAct = govAccess(role, 'admin-settings') === 'act';
  const ps = ext.platformSettings;
  const pending = ps.pendingChanges.filter((c) => c.status === 'En attente d’approbation');
  const applied = ps.pendingChanges.filter((c) => c.status !== 'En attente d’approbation');
  const editingMeta = SETTINGS.find((s) => s.key === editing);

  const openProposal = (key: SettingKey) => {
    setEditing(key);
    setProposed(settingValue(ps, key));
    setJustification('');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editingMeta || !justification.trim() || !proposed.trim()) return;
    updateExt((prev) => {
      const change: PlatformSettingChange & { settingKey?: SettingKey } = {
        id: `SET-${String(prev.platformSettings.pendingChanges.length + 1).padStart(3, '0')}`,
        settingName: editingMeta.label,
        settingKey: editing,
        currentValue: settingValue(prev.platformSettings, editing),
        proposedValue: proposed.trim(),
        justification: justification.trim(),
        requester: role,
        approver: null,
        status: 'En attente d’approbation'
      };
      return {
        ...prev,
        platformSettings: { ...prev.platformSettings, pendingChanges: [change, ...prev.platformSettings.pendingChanges] },
        auditLogs: appendAuditLog(prev.auditLogs, {
          actor: `${user.name} (${role})`,
          action: 'Changement de réglage proposé',
          target: editingMeta.label,
          scope: 'Réglages de la plateforme',
          result: 'Succès',
          justification: justification.trim()
        })
      };
    });
    setEditing(null);
    setToast('Changement proposé : en attente d’approbation.');
  };

  const approve = (ch: PlatformSettingChange & { settingKey?: SettingKey }) => {
    const refused = !canApproveSettings(role) ? 'Seule la vue « Super administrateur » approuve un réglage critique.' : '';
    if (refused) {
      updateExt((prev) => ({
        ...prev,
        auditLogs: appendAuditLog(prev.auditLogs, {
          actor: `${user.name} (${role})`,
          action: 'Approbation de réglage refusée',
          target: ch.settingName,
          scope: 'Réglages de la plateforme',
          result: 'Refusé',
          justification: refused
        })
      }));
      setToast(`Refus : ${refused}`);
      return;
    }
    const key = ch.settingKey || LEGACY_KEY[ch.settingName];
    updateExt((prev) => {
      const settings = { ...prev.platformSettings };
      // L'approbation applique réellement la nouvelle valeur.
      if (key === 'validationRuleNote' || key === 'urgentReportThreshold') settings[key] = ch.proposedValue;
      else if (key) {
        settings[key as ListSettingKey] = ch.proposedValue
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean);
      }
      return {
        ...prev,
        platformSettings: {
          ...settings,
          pendingChanges: prev.platformSettings.pendingChanges.map((x) => (x.id === ch.id ? { ...x, status: 'Appliqué', approver: role } : x))
        },
        auditLogs: appendAuditLog(prev.auditLogs, {
          actor: `${user.name} (${role})`,
          action: `Réglage appliqué : ${ch.settingName}`,
          target: `${ch.currentValue} → ${ch.proposedValue}`,
          scope: 'Réglages de la plateforme',
          result: 'Succès',
          justification: ch.justification
        })
      };
    });
    setToast(`« ${ch.settingName} » mis à jour`);
  };

  return (
    <GovShell section="admin-settings" ext={ext} updateExt={updateExt} nav={nav} setToast={setToast}>
      <PageHeader title="Réglages de la plateforme" subtitle="Un réglage critique se propose, puis s’applique après approbation." />

      <section className="st-card" aria-label="Référentiels">
        <h2>Référentiels</h2>
        <div className="st-rows">
          {SETTINGS.map((s) =>
            canAct ? (
              <button key={s.key} type="button" className="st-row" onClick={() => openProposal(s.key)} aria-label={`Proposer un changement : ${s.label}`}>
                <span className="st-row-label">{s.label}</span>
                <span className="st-row-value">{settingValue(ps, s.key)}</span>
                <ArrowRight size={20} aria-hidden="true" className="st-row-arrow" />
              </button>
            ) : (
              <div key={s.key} className="st-row gv-static-row">
                <span className="st-row-label">{s.label}</span>
                <span className="st-row-value">{settingValue(ps, s.key)}</span>
              </div>
            )
          )}
        </div>
      </section>

      <div className="ui-section-title">
        <h2>Changements en attente</h2>
      </div>
      <ListCard label="Changements en attente">
        {pending.length === 0 ? (
          <EmptyState title="Aucun changement en attente" text={canAct ? 'Choisissez un réglage ci-dessus pour proposer un changement.' : undefined} />
        ) : (
          pending.map((ch) => (
            <ListRow
              key={ch.id}
              title={ch.settingName}
              meta={`${ch.currentValue} → ${ch.proposedValue} · proposé par ${ch.requester}`}
              trailing={
                <>
                  <StatusDot tone="warn">En attente</StatusDot>
                  {canAct && (
                    <button type="button" className="secondary ui-btn-sm" onClick={() => approve(ch)}>
                      Approuver
                    </button>
                  )}
                </>
              }
            />
          ))
        )}
      </ListCard>

      {applied.length > 0 && (
        <>
          <div className="ui-section-title">
            <h2>Changements appliqués</h2>
          </div>
          <ListCard label="Changements appliqués">
            {applied.map((ch) => (
              <ListRow
                key={ch.id}
                title={ch.settingName}
                meta={`${ch.currentValue} → ${ch.proposedValue} · approuvé par ${ch.approver || '—'}`}
                trailing={<StatusDot tone="ok">Appliqué</StatusDot>}
              />
            ))}
          </ListCard>
        </>
      )}

      <SidePanel
        open={Boolean(editing)}
        title="Proposer un changement"
        onClose={() => setEditing(null)}
        footer={
          <>
            <button type="button" className="secondary ui-btn-sm" onClick={() => setEditing(null)}>
              Annuler
            </button>
            <button type="submit" form="gv-setting-form" className="primary ui-btn-sm" disabled={!justification.trim() || !proposed.trim()}>
              Proposer
            </button>
          </>
        }
      >
        {editing && editingMeta && (
          <form id="gv-setting-form" className="gv-form" onSubmit={submit}>
            <Facts
              items={[
                ['Réglage', editingMeta.label],
                ['Valeur actuelle', settingValue(ps, editing)]
              ]}
            />
            <label className="ui-field">
              <span>Nouvelle valeur</span>
              <textarea rows={3} value={proposed} maxLength={600} onChange={(e) => setProposed(e.target.value)} />
              {editing !== 'validationRuleNote' && editing !== 'urgentReportThreshold' && <small>Séparez les valeurs par des virgules.</small>}
            </label>
            <label className="ui-field">
              <span>Justification</span>
              <textarea rows={3} value={justification} maxLength={600} placeholder="Impact attendu et raison du changement" onChange={(e) => setJustification(e.target.value)} />
            </label>
          </form>
        )}
      </SidePanel>
    </GovShell>
  );
}

/* ================================================================== Journal d'audit */

const csvCell = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;

export function AdminAuditView({ ext, updateExt, nav, user, setToast }: GovProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | AuditLogEntry['result']>('all');
  const role = ext.adminActiveRole;
  const exportAllowed = canExportAudit(role);

  const q = normalize(search);
  const logs = ext.auditLogs.filter(
    (l) => (filter === 'all' || l.result === filter) && (!q || normalize(`${l.actor} ${l.action} ${l.target} ${l.scope} ${l.justification}`).includes(q))
  );
  const days: { day: string; rows: AuditLogEntry[] }[] = [];
  for (const l of logs) {
    const { day } = splitTimestamp(l.timestamp);
    const last = days[days.length - 1];
    if (last && last.day === day) last.rows.push(l);
    else days.push({ day, rows: [l] });
  }

  const exportCsv = () => {
    const header = ['Identifiant', 'Horodatage', 'Acteur', 'Action', 'Objet', 'Périmètre', 'Résultat', 'Justification', 'Requête'];
    const lines = logs.map((l) => [l.id, l.timestamp, l.actor, l.action, l.target, l.scope, l.result, l.justification, l.requestId].map(csvCell).join(';'));
    const blob = new Blob([`﻿${header.map(csvCell).join(';')}\n${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-audit-savoir-plus-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    updateExt((prev) => ({
      ...prev,
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor: `${user.name} (${role})`,
        action: `Export du journal (${logs.length} entrées)`,
        target: 'Journal d’audit',
        scope: 'Traçabilité',
        result: 'Succès',
        justification: 'Export CSV des entrées filtrées, sans secret ni message privé.'
      })
    }));
    setToast(`${logs.length} entrées exportées`);
  };

  return (
    <GovShell section="admin-audit" ext={ext} updateExt={updateExt} nav={nav} setToast={setToast}>
      <PageHeader
        title="Journal d’audit"
        subtitle="Lecture seule. Aucun secret ni message privé n’y est enregistré."
        actions={
          exportAllowed ? (
            <button type="button" className="secondary ui-btn-sm" onClick={exportCsv} disabled={logs.length === 0}>
              <Download size={16} aria-hidden="true" /> Exporter en CSV
            </button>
          ) : undefined
        }
      />
      <div className="ui-toolbar">
        <Tabs
          label="Filtrer par résultat"
          value={filter}
          onChange={setFilter}
          items={[
            { id: 'all', label: 'Tous', count: ext.auditLogs.length },
            { id: 'Succès', label: 'Succès', count: ext.auditLogs.filter((l) => l.result === 'Succès').length },
            { id: 'Refusé', label: 'Refusés', count: ext.auditLogs.filter((l) => l.result === 'Refusé').length }
          ]}
        />
        <SearchField value={search} onChange={setSearch} placeholder="Acteur, action, objet…" label="Rechercher dans le journal" />
      </div>

      <div className="ui-list gv-table-wrap">
        {logs.length === 0 ? (
          <EmptyState title="Aucune entrée ne correspond" text="Modifiez le filtre ou la recherche." />
        ) : (
          <table className="gv-table gv-audit">
            <thead>
              <tr>
                <th scope="col" className="w-xs">Heure</th>
                <th scope="col">Acteur</th>
                <th scope="col">Action</th>
                <th scope="col">Objet</th>
                <th scope="col" className="w-sm">Résultat</th>
              </tr>
            </thead>
            {days.map((d) => (
              <tbody key={d.day}>
                <tr className="gv-day">
                  <th scope="rowgroup" colSpan={5}>
                    {d.day}
                  </th>
                </tr>
                {d.rows.map((l) => (
                  <tr key={l.id} title={l.justification}>
                    <td className="tabular-nums">{splitTimestamp(l.timestamp).time || '—'}</td>
                    <td>
                      {l.actor}
                      <small>{l.scope}</small>
                    </td>
                    <td>
                      {l.action}
                      <small>{l.justification}</small>
                    </td>
                    <td>{l.target}</td>
                    <td>
                      <StatusDot tone={l.result === 'Succès' ? 'ok' : 'danger'}>{l.result}</StatusDot>
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        )}
      </div>
      {!exportAllowed && <p className="gv-note">L’export est réservé aux vues « Auditeur » et « Super administrateur ».</p>}
    </GovShell>
  );
}
