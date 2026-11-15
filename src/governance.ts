/**
 * Gouvernance — moindre privilège : ce que chaque « vue » (rôle actif) peut voir et faire,
 * la structure du menu et les compteurs des files à traiter.
 */
import type { AccountStatus, AdminRoleName, ExtendedDemoState } from './wireframeData';

export type GovSection =
  | 'admin'
  | 'moderation'
  | 'admin-validation'
  | 'appeal'
  | 'admin-support'
  | 'admin-users'
  | 'admin-roles'
  | 'admin-contents'
  | 'admin-settings'
  | 'admin-audit';

export type GovAccess = 'act' | 'view' | 'none';

export const GOV_LABEL: Record<GovSection, string> = {
  admin: 'À traiter',
  moderation: 'Signalements',
  'admin-validation': 'Validations',
  appeal: 'Recours',
  'admin-support': 'Support',
  'admin-users': 'Utilisateurs',
  'admin-roles': 'Rôles',
  'admin-contents': 'Contenus restreints',
  'admin-settings': 'Réglages de la plateforme',
  'admin-audit': 'Journal d’audit'
};

export const GOV_NAV: { group: string; items: GovSection[] }[] = [
  { group: 'Files', items: ['moderation', 'admin-validation', 'appeal', 'admin-support'] },
  { group: 'Administration', items: ['admin-users', 'admin-roles', 'admin-contents', 'admin-settings'] },
  { group: 'Traçabilité', items: ['admin-audit'] }
];

export const ROLE_DESCRIPTION: Record<AdminRoleName, string> = {
  'Super administrateur': 'Toutes les rubriques ; seul à approuver les réglages critiques.',
  Administrateur: 'Toutes les rubriques ; propose les réglages sans les approuver.',
  'Responsable de modération': 'Signalements, validations, recours, rôles et statuts des comptes.',
  Modérateur: 'Signalements et contenus restreints ; consultation des comptes.',
  Support: 'Tickets de support ; consultation des comptes.',
  Auditeur: 'Lecture seule partout ; export du journal d’audit.'
};

/** a = agir, v = voir, - = aucun accès. Colonnes : SA, Admin, Resp. modération, Modérateur, Support, Auditeur. */
const MATRIX: Record<GovSection, string> = {
  admin: 'vvvvvv',
  moderation: 'aaaa-v',
  'admin-validation': 'aaa--v',
  appeal: 'aaa--v',
  'admin-support': 'aa--av',
  'admin-users': 'aaavvv',
  'admin-roles': 'aaa--v',
  'admin-contents': 'aaaa-v',
  'admin-settings': 'aa---v',
  'admin-audit': 'vvv--v'
};

const ROLE_ORDER: AdminRoleName[] = [
  'Super administrateur',
  'Administrateur',
  'Responsable de modération',
  'Modérateur',
  'Support',
  'Auditeur'
];

export function govAccess(role: AdminRoleName, section: GovSection): GovAccess {
  const code = MATRIX[section]?.[ROLE_ORDER.indexOf(role)];
  return code === 'a' ? 'act' : code === 'v' ? 'view' : 'none';
}

export const isGovSection = (page: string): page is GovSection => page in MATRIX;

/** Droits fins conservés des écrans d'origine. */
export const canSeeEmail = (role: AdminRoleName) => role === 'Super administrateur' || role === 'Administrateur' || role === 'Support';
export const canManageStatus = (role: AdminRoleName) =>
  role === 'Super administrateur' || role === 'Administrateur' || role === 'Responsable de modération';
export const canExceptionalAccess = (role: AdminRoleName) => role !== 'Support' && role !== 'Auditeur';
export const canExportAudit = (role: AdminRoleName) => role === 'Auditeur' || role === 'Super administrateur';
export const canApproveSettings = (role: AdminRoleName) => role === 'Super administrateur';

export const ACCOUNT_STATUS: Record<AccountStatus, { label: string; desc: string; tone: 'ok' | 'neutral' | 'warn' | 'danger' }> = {
  active: { label: 'Actif', desc: 'Compte vérifié, autorisé selon ses rôles.', tone: 'ok' },
  pending_verification: {
    label: 'Vérification en attente',
    desc: 'Adresse e-mail non confirmée : publication et messagerie bloquées.',
    tone: 'neutral'
  },
  restricted: { label: 'Restreint', desc: 'Certaines capacités sont limitées temporairement.', tone: 'warn' },
  suspended: {
    label: 'Suspendu',
    desc: 'Accès bloqué ; le membre peut consulter la décision et déposer un recours.',
    tone: 'danger'
  },
  deactivated: { label: 'Désactivé', desc: 'Compte mis en pause par son titulaire.', tone: 'neutral' },
  deletion_pending: { label: 'Suppression demandée', desc: 'Suppression ou anonymisation en attente.', tone: 'neutral' }
};

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

/** Nombre d'éléments en attente d'une action, par rubrique. */
export function govCounts(ext: ExtendedDemoState): Record<GovSection, number> {
  return {
    admin: 0,
    moderation: ext.dossiers.filter((d) => d.status !== 'Décision soumise').length,
    'admin-validation': ext.validationRequests.filter((v) => v.status === 'Soumise' || v.status === 'En examen').length,
    appeal: ext.appeal.submitted && (ext.appeal.status === 'Reçu' || ext.appeal.status === 'En examen') ? 1 : 0,
    'admin-support': ext.supportTickets.filter((t) => t.status === 'nouveau' || t.status === 'ouvert').length,
    'admin-users': 0,
    'admin-roles': ext.roleAssignments.filter((r) => r.status === 'En attente d’approbation').length,
    'admin-contents': ext.flaggedContents.filter((c) => c.visibility === 'Accessible' && c.reportCount > 0).length,
    'admin-settings': ext.platformSettings.pendingChanges.filter((c) => c.status === 'En attente d’approbation').length,
    'admin-audit': 0
  };
}

/** Lignes de la boîte « À traiter » pour une vue donnée : uniquement les files visibles, avec leur détail. */
export function govInbox(ext: ExtendedDemoState, role: AdminRoleName): { section: GovSection; count: number; detail: string }[] {
  const counts = govCounts(ext);
  const detail: Partial<Record<GovSection, string>> = {
    moderation: (() => {
      const unassigned = ext.dossiers.filter((d) => d.status !== 'Décision soumise' && !d.assignee).length;
      return `${plural(counts.moderation, 'dossier ouvert', 'dossiers ouverts')}${unassigned ? ` · ${plural(unassigned, 'non affecté', 'non affectés')}` : ''}`;
    })(),
    'admin-validation': plural(counts['admin-validation'], 'demande à examiner', 'demandes à examiner'),
    appeal: plural(counts.appeal, 'recours à examiner', 'recours à examiner'),
    'admin-support': (() => {
      const high = ext.supportTickets.filter((t) => (t.status === 'nouveau' || t.status === 'ouvert') && t.priority === 'Haute').length;
      return `${plural(counts['admin-support'], 'ticket à traiter', 'tickets à traiter')}${high ? ` · ${plural(high, 'prioritaire', 'prioritaires')}` : ''}`;
    })(),
    'admin-roles': plural(counts['admin-roles'], 'attribution en attente de seconde validation', 'attributions en attente de seconde validation'),
    'admin-contents': plural(counts['admin-contents'], 'contenu signalé encore accessible', 'contenus signalés encore accessibles'),
    'admin-settings': plural(counts['admin-settings'], 'changement à approuver', 'changements à approuver')
  };
  return (['moderation', 'admin-validation', 'appeal', 'admin-support', 'admin-roles', 'admin-contents', 'admin-settings'] as GovSection[])
    .filter((s) => govAccess(role, s) !== 'none')
    .map((section) => ({ section, count: counts[section], detail: counts[section] === 0 ? 'Rien à traiter' : detail[section] || '' }));
}

/** Sépare « 13 nov. 2026 · 10 h 12 » en jour et heure. */
export function splitTimestamp(ts: string): { day: string; time: string } {
  const [day, time = ''] = (ts || '').split(' · ');
  return { day: day || 'Date inconnue', time };
}
