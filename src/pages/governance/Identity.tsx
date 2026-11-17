/**
 * Gouvernance — file « Identités » : demandes de vérification d'identité à accepter ou à refuser.
 * La vérification est SIMULÉE : la demande ne porte que le type de pièce, aucun fichier n'est conservé.
 * Chaque décision est tracée dans le journal d'audit ; elle fait suivre le statut du compte, et donc
 * l'intitulé d'un encadrant (indépendant, vérifié, enseignant).
 */
import React, { useState } from 'react';
import { formatDayShort, type Day } from '../../calendar';
import type { Profile } from '../../data';
import { govAccess } from '../../governance';
import {
  ACCOUNT_KIND_LABEL,
  IDENTITY_DOCUMENT_LABEL,
  accountOf,
  decideIdentity,
  educatorStanding,
  type IdentityRequest
} from '../../school';
import { SCHOOL_MEMBER_NAMES, schoolOf } from '../../seedSchool';
import { appendAuditLog } from '../../wireframeData';
import { ActionMenu, EmptyState, ListCard, ListRow, PageHeader, StatusDot, Tabs } from '../../components/ui';
import { GovShell, type GovProps } from './shared';

type Filter = 'pending' | 'done';

export function AdminIdentityView({ ext, updateExt, nav, user, setToast, people, today }: GovProps & { people: Profile[]; today: Day }) {
  const [filter, setFilter] = useState<Filter>('pending');
  const school = schoolOf(ext, today);
  const canAct = govAccess(ext.adminActiveRole, 'admin-identity') === 'act';
  const nameOf = (id: string) => people.find((p) => p.id === id)?.name || SCHOOL_MEMBER_NAMES[id] || 'Membre';

  const pending = school.identityRequests.filter((r) => r.status === 'pending');
  const done = school.identityRequests.filter((r) => r.status !== 'pending');
  const visible = filter === 'pending' ? pending : done;

  const decide = (request: IdentityRequest, decision: 'verified' | 'refused') => {
    const name = nameOf(request.userId);
    const next = decideIdentity(school, request.id, decision, decision === 'refused' ? 'Pièce illisible ou incomplète (démonstration).' : undefined);
    updateExt((prev) => ({
      ...prev,
      school: next,
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor: user.name,
        action: decision === 'verified' ? 'Identité vérifiée (simulation)' : 'Vérification d’identité refusée (simulation)',
        target: `${name} · ${request.id}`,
        scope: 'Identités',
        result: 'Succès',
        justification: `${IDENTITY_DOCUMENT_LABEL[request.document]} présentée ; aucun fichier conservé.`
      })
    }));
    if (decision === 'refused') {
      setToast(`Vérification de ${name} refusée`);
    } else if (accountOf(next, request.userId).kind === 'educator') {
      setToast(`${name} : identité vérifiée — ${educatorStanding(next, request.userId).label}`);
    } else {
      setToast(`${name} : identité vérifiée`);
    }
  };

  return (
    <GovShell section="admin-identity" ext={ext} updateExt={updateExt} nav={nav} setToast={setToast}>
      <PageHeader
        title="Identités"
        subtitle="Demandes de vérification d’identité. Démonstration : aucune pièce n’est reçue ni conservée, seule la décision est enregistrée."
      />
      <Tabs<Filter>
        label="Filtrer les demandes"
        value={filter}
        onChange={setFilter}
        items={[
          { id: 'pending', label: 'À traiter', count: pending.length },
          { id: 'done', label: 'Traitées', count: done.length }
        ]}
      />
      <ListCard label="Demandes de vérification d’identité">
        {visible.length === 0 ? (
          <EmptyState title={filter === 'pending' ? 'Aucune demande à traiter' : 'Aucune demande traitée'} />
        ) : (
          visible.map((request) => {
            const name = nameOf(request.userId);
            const account = accountOf(school, request.userId);
            return (
              <ListRow
                key={request.id}
                leading={<span className="sc-initial" aria-hidden="true">{name.charAt(0)}</span>}
                title={name}
                meta={`${ACCOUNT_KIND_LABEL[account.kind]} · ${IDENTITY_DOCUMENT_LABEL[request.document]} · ${request.id} · demande du ${formatDayShort(request.submittedOn)}`}
                trailing={
                  request.status === 'pending' ? (
                    canAct ? (
                      <>
                        <button type="button" className="li-text-link" onClick={() => decide(request, 'verified')}>
                          Accepter
                        </button>
                        <ActionMenu label={`Plus d’actions pour ${name}`} items={[{ label: 'Refuser la vérification', danger: true, onSelect: () => decide(request, 'refused') }]} />
                      </>
                    ) : (
                      <StatusDot tone="warn">En attente</StatusDot>
                    )
                  ) : (
                    <StatusDot tone={request.status === 'verified' ? 'info' : 'danger'}>{request.status === 'verified' ? 'Acceptée' : 'Refusée'}</StatusDot>
                  )
                }
              />
            );
          })
        )}
      </ListCard>
    </GovShell>
  );
}
