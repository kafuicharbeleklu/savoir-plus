/**
 * Gouvernance — files à traiter : boîte « À traiter », Signalements, Validations, Recours,
 * Support, Contenus restreints. Liste à lignes égales + détail ; seules les actions possibles
 * dans l'état courant sont proposées ; une décision soumise est verrouillée.
 */
import React, { useState } from 'react';
import { ChevronRight, ClipboardCheck, EyeOff, Flag, LifeBuoy, ScrollText } from 'lucide-react';
import {
  ACCOUNT_STATUS,
  GOV_LABEL,
  govAccess,
  govInbox,
  splitTimestamp,
  type GovSection
} from '../../governance';
import {
  appendAuditLog,
  formatNotificationTimestamp,
  type FlaggedContentRecord,
  type ModerationDossier,
  type SupportTicketRecord,
  type ValidationRequestRecord
} from '../../wireframeData';
import { ActionMenu, ConfirmDialog, EmptyState, ListCard, ListRow, PageHeader, RowTitle, Select, StateTile, StatusDot, type RowState, type StatusTone, Tabs, useIsNarrow } from '../../components/ui';
import { Block, Facts, GovShell, Split, type GovProps } from './shared';

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

/* ================================================================== À traiter */

export function AdminDashboardView({ ext, updateExt, nav, setToast }: GovProps) {
  const role = ext.adminActiveRole;
  const inbox = govInbox(ext, role);
  const total = inbox.reduce((acc, r) => acc + r.count, 0);
  const activeUsers = ext.adminUsers.filter((u) => u.status === 'active').length;
  const limited = ext.adminUsers.filter((u) => u.status === 'restricted' || u.status === 'suspended').length;
  const canSeeAudit = govAccess(role, 'admin-audit') !== 'none';
  const recent = ext.auditLogs.slice(0, 5);

  return (
    <GovShell section="admin" ext={ext} updateExt={updateExt} nav={nav} setToast={setToast}>
      <PageHeader
        title="À traiter"
        subtitle={total === 0 ? 'Tout est à jour pour cette vue.' : `${plural(total, 'élément attend', 'éléments attendent')} une action avec la vue « ${role} ».`}
      />

      <ListCard label="Files à traiter">
        {inbox.length === 0 ? (
          <EmptyState title="Aucune file pour cette vue" text="Changez de vue pour consulter d’autres rubriques." />
        ) : (
          inbox.map((row) => (
            <ListRow
              key={row.section}
              title={GOV_LABEL[row.section]}
              meta={row.detail}
              onClick={() => nav(row.section)}
              ariaLabel={`Ouvrir ${GOV_LABEL[row.section]}`}
              trailing={
                <>
                  {row.count > 0 && <em className="gv-count tabular-nums">{row.count}</em>}
                  <ChevronRight size={20} aria-hidden="true" className="gv-chevron" />
                </>
              }
            />
          ))
        )}
      </ListCard>

      <div className="ui-kpis tabular-nums">
        <div className="ui-kpi">
          <b>{activeUsers}</b>
          <span>{activeUsers > 1 ? 'comptes actifs' : 'compte actif'}</span>
        </div>
        <div className="ui-kpi">
          <b>{limited}</b>
          <span>{limited > 1 ? 'comptes restreints ou suspendus' : 'compte restreint ou suspendu'}</span>
        </div>
        <div className="ui-kpi">
          <b>{ext.auditLogs.length}</b>
          <span>entrées au journal d’audit</span>
        </div>
      </div>

      {canSeeAudit && (
        <>
          <div className="ui-section-title">
            <h2>Activité récente</h2>
            <button type="button" className="li-text-link" onClick={() => nav('admin-audit')}>
              Journal d’audit
            </button>
          </div>
          <ListCard label="Activité récente">
            {recent.length === 0 ? (
              <EmptyState title="Aucune activité enregistrée" />
            ) : (
              recent.map((l) => {
                const { day, time } = splitTimestamp(l.timestamp);
                return (
                  <ListRow
                    key={l.id}
                    leading={
                      <StateTile state={l.result === 'Succès' ? 'ok' : 'alert'}>
                        <ScrollText size={20} aria-hidden="true" />
                      </StateTile>
                    }
                    title={
                      <RowTitle state={l.result === 'Succès' ? 'ok' : 'alert'} hint={l.result === 'Succès' ? undefined : l.result}>
                        {`${l.action} · ${l.target}`}
                      </RowTitle>
                    }
                    meta={`${day}${time ? ` · ${time}` : ''} · ${l.actor}`}
                  />
                );
              })
            )}
          </ListCard>
        </>
      )}
    </GovShell>
  );
}

/* ================================================================== Signalements */

/**
 * État d'une ligne de file, comme dans le Studio : gris (–) tant que rien n'est décidé, rouge (✕) pour un refus,
 * un retrait ou une correction demandée, normal (✓) une fois réglé. La précision reste au survol.
 */
const DOSSIER_ROW: Record<ModerationDossier['status'], RowState> = {
  'À examiner': 'muted',
  'En examen': 'muted',
  'Précisions demandées': 'muted',
  'Décision soumise': 'ok'
};
const DOSSIER_TONE: Record<ModerationDossier['status'], StatusTone> = {
  'À examiner': 'warn',
  'En examen': 'info',
  'Précisions demandées': 'neutral',
  'Décision soumise': 'ok'
};
const MEASURES = [
  'Restriction d’envoi de messages',
  'Masquage du contenu',
  'Avertissement motivé',
  'Suspension temporaire',
  'Aucune violation constatée'
];

function DecisionForm({
  dossier,
  durations,
  disabledReason,
  onSubmit
}: {
  dossier: ModerationDossier;
  durations: string[];
  disabledReason: string;
  onSubmit: (d: Pick<ModerationDossier, 'decisionMeasure' | 'decisionDuration' | 'decisionRule' | 'internalReason' | 'publicMessage'>) => void;
}) {
  const [measure, setMeasure] = useState(dossier.decisionMeasure || MEASURES[0]);
  const [duration, setDuration] = useState(dossier.decisionDuration || durations[0] || 'Sans durée');
  const [rule, setRule] = useState(dossier.decisionRule || '');
  const [internalReason, setInternalReason] = useState(dossier.internalReason || '');
  const [publicMessage, setPublicMessage] = useState(dossier.publicMessage || '');
  const noSanction = measure === 'Aucune violation constatée';
  const complete = rule.trim() && internalReason.trim() && publicMessage.trim();
  return (
    <form
      className="gv-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (disabledReason || !complete) return;
        onSubmit({
          decisionMeasure: measure,
          decisionDuration: noSanction ? 'Sans durée' : duration,
          decisionRule: rule.trim(),
          internalReason: internalReason.trim(),
          publicMessage: publicMessage.trim()
        });
      }}
    >
      <div className="gv-form-row">
        <label className="ui-field">
          <span>Mesure</span>
          <Select value={measure} onChange={(e) => setMeasure(e.target.value)}>
            {MEASURES.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        </label>
        <label className="ui-field">
          <span>Durée</span>
          <Select value={noSanction ? 'Sans durée' : duration} disabled={noSanction} onChange={(e) => setDuration(e.target.value)}>
            {[...durations, 'Sans durée'].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </Select>
        </label>
      </div>
      <label className="ui-field">
        <span>Règle applicable</span>
        <input value={rule} maxLength={160} placeholder="Ex. Règle de respect des échanges (v1)" onChange={(e) => setRule(e.target.value)} />
      </label>
      <label className="ui-field">
        <span>Justification interne</span>
        <textarea rows={3} value={internalReason} maxLength={600} onChange={(e) => setInternalReason(e.target.value)} />
        <small>Invisible pour les membres.</small>
      </label>
      <label className="ui-field">
        <span>Message au membre concerné</span>
        <textarea rows={3} value={publicMessage} maxLength={600} onChange={(e) => setPublicMessage(e.target.value)} />
      </label>
      <div className="gv-actions">
        {disabledReason && <span className="gv-note">{disabledReason}</span>}
        <button type="submit" className="primary ui-btn-sm" disabled={Boolean(disabledReason) || !complete}>
          Soumettre la décision
        </button>
      </div>
    </form>
  );
}

export function ModerationView({ ext, updateExt, nav, user, setToast }: GovProps) {
  const narrow = useIsNarrow('(max-width: 900px)');
  const [filter, setFilter] = useState<'open' | 'all' | ModerationDossier['status']>('open');
  const [selectedId, setSelectedId] = useState(() => (narrow ? '' : ext.dossiers.find((d) => d.status !== 'Décision soumise')?.id || ext.dossiers[0]?.id || ''));
  const role = ext.adminActiveRole;
  const canAct = govAccess(role, 'moderation') === 'act';

  const visible = ext.dossiers.filter((d) => (filter === 'all' ? true : filter === 'open' ? d.status !== 'Décision soumise' : d.status === filter));
  const dossier = ext.dossiers.find((d) => d.id === selectedId);

  const patchDossier = (patch: Partial<ModerationDossier>, audit?: { action: string; justification: string }) => {
    if (!dossier) return;
    updateExt((prev) => ({
      ...prev,
      dossiers: prev.dossiers.map((d) => (d.id === dossier.id ? { ...d, ...patch } : d)),
      auditLogs: audit
        ? appendAuditLog(prev.auditLogs, {
            actor: `${user.name} (${role})`,
            action: audit.action,
            target: dossier.id,
            scope: 'Signalements',
            result: 'Succès',
            justification: audit.justification
          })
        : prev.auditLogs
    }));
  };

  const decided = dossier?.status === 'Décision soumise';
  const count = (s: ModerationDossier['status']) => ext.dossiers.filter((d) => d.status === s).length;

  return (
    <GovShell section="moderation" ext={ext} updateExt={updateExt} nav={nav} setToast={setToast}>
      <PageHeader title="Signalements" subtitle="Les déclarants ne voient ni les notes internes ni la mesure appliquée." />
      <Tabs
        label="Filtrer les dossiers"
        value={filter}
        onChange={setFilter}
        items={[
          { id: 'open', label: 'Ouverts', count: ext.dossiers.length - count('Décision soumise') },
          { id: 'À examiner', label: 'À examiner', count: count('À examiner') },
          { id: 'En examen', label: 'En examen', count: count('En examen') },
          { id: 'Décision soumise', label: 'Décidés', count: count('Décision soumise') },
          { id: 'all', label: 'Tous', count: ext.dossiers.length }
        ]}
      />
      <Split
        hasSelection={Boolean(dossier)}
        onBack={() => setSelectedId('')}
        backLabel="Signalements"
        list={
          <ListCard label="Dossiers de signalement">
            {visible.length === 0 ? (
              <EmptyState title="Aucun dossier ici" text="Aucun signalement ne correspond à ce filtre." />
            ) : (
              visible.map((d) => (
                <ListRow
                  key={d.id}
                  active={d.id === selectedId}
                  leading={
                    <StateTile state={DOSSIER_ROW[d.status]}>
                      <Flag size={20} aria-hidden="true" />
                    </StateTile>
                  }
                  title={
                    <RowTitle state={DOSSIER_ROW[d.status]} hint={DOSSIER_ROW[d.status] === 'ok' ? undefined : d.status}>
                      {`${d.id} · ${d.targetType}`}
                    </RowTitle>
                  }
                  meta={d.assignee ? d.assignee : 'Non affecté'}
                  onClick={() => setSelectedId(d.id)}
                  ariaLabel={`Ouvrir le dossier ${d.id}`}
                />
              ))
            )}
          </ListCard>
        }
        detail={
          dossier ? (
            <article className="gv-detail" key={dossier.id}>
              <header className="gv-detail-head">
                <div>
                  <h2>{dossier.id}</h2>
                  <p>{dossier.summary}</p>
                </div>
                <div className="gv-detail-actions">
                  <StatusDot tone={DOSSIER_TONE[dossier.status]}>{dossier.status}</StatusDot>
                  {canAct && !decided && !dossier.assignee && !dossier.conflictDeclared && (
                    <button
                      type="button"
                      className="primary ui-btn-sm"
                      onClick={() => {
                        patchDossier({ assignee: user.name, status: 'En examen' }, { action: 'Prise en charge du dossier', justification: 'Affectation à l’opérateur.' });
                        setToast(`Dossier ${dossier.id} pris en charge`);
                      }}
                    >
                      Prendre en charge
                    </button>
                  )}
                  {canAct && !decided && (
                    <ActionMenu
                      label="Autres actions sur le dossier"
                      items={[
                        {
                          label: dossier.conflictDeclared ? 'Lever le conflit d’intérêts' : 'Déclarer un conflit d’intérêts',
                          onSelect: () =>
                            patchDossier(
                              { conflictDeclared: !dossier.conflictDeclared, assignee: null },
                              {
                                action: dossier.conflictDeclared ? 'Conflit d’intérêts levé' : 'Conflit d’intérêts déclaré',
                                justification: dossier.conflictDeclared ? 'Dossier de nouveau affectable.' : 'Dossier à réaffecter à un autre opérateur.'
                              }
                            )
                        },
                        {
                          label: 'Libérer le dossier',
                          hidden: !dossier.assignee,
                          onSelect: () => patchDossier({ assignee: null, status: 'À examiner' }, { action: 'Dossier libéré', justification: 'Dossier remis dans la file.' })
                        }
                      ]}
                    />
                  )}
                </div>
              </header>

              <Block title="Contexte">
                <Facts
                  items={[
                    ['Élément signalé', dossier.targetType],
                    ['Affecté à', dossier.assignee || 'Personne'],
                    ['Conflit d’intérêts', dossier.conflictDeclared ? 'Déclaré' : 'Aucun']
                  ]}
                />
              </Block>
              <Block title="Preuves">
                <p className="gv-text">{dossier.evidence}</p>
                <p className="gv-note">Périmètre strict : chaque consultation des preuves est tracée.</p>
              </Block>
              <Block title="Faits établis">
                {canAct && !decided ? (
                  <textarea
                    className="gv-textarea"
                    rows={2}
                    aria-label="Faits établis"
                    placeholder="Consignez les faits vérifiés pendant l’examen."
                    value={dossier.facts}
                    onChange={(e) => patchDossier({ facts: e.target.value })}
                  />
                ) : (
                  <p className="gv-text">{dossier.facts || 'Aucun fait consigné.'}</p>
                )}
              </Block>
              <Block title="Décision">
                {decided ? (
                  <>
                    <Facts
                      items={[
                        ['Mesure', dossier.decisionMeasure || '—'],
                        ['Durée', dossier.decisionDuration || '—'],
                        ['Règle applicable', dossier.decisionRule || '—']
                      ]}
                    />
                    <p className="gv-text">
                      <b>Justification interne.</b> {dossier.internalReason || '—'}
                    </p>
                    <p className="gv-text">
                      <b>Message au membre.</b> {dossier.publicMessage || '—'}
                    </p>
                    {canAct && (
                      <div className="gv-actions">
                        <button
                          type="button"
                          className="secondary ui-btn-sm"
                          onClick={() => patchDossier({ status: 'En examen' }, { action: 'Dossier rouvert', justification: 'Décision à réexaminer.' })}
                        >
                          Rouvrir le dossier
                        </button>
                      </div>
                    )}
                  </>
                ) : dossier.conflictDeclared ? (
                  <p className="gv-text">Conflit d’intérêts déclaré : ce dossier doit être traité par un autre opérateur.</p>
                ) : canAct ? (
                  <DecisionForm
                    dossier={dossier}
                    durations={ext.platformSettings.sanctionDurations}
                    disabledReason={dossier.assignee ? '' : 'Prenez d’abord le dossier en charge.'}
                    onSubmit={(d) => {
                      patchDossier(
                        { ...d, status: 'Décision soumise' },
                        { action: `Décision soumise : ${d.decisionMeasure}`, justification: d.internalReason || 'Décision motivée.' }
                      );
                      setToast(`Décision enregistrée pour ${dossier.id}`);
                    }}
                  />
                ) : (
                  <p className="gv-text">Aucune décision pour l’instant.</p>
                )}
              </Block>
            </article>
          ) : (
            <div className="ui-list">
              <EmptyState title="Choisissez un dossier" text="Sélectionnez un signalement dans la liste pour l’examiner." />
            </div>
          )
        }
      />
    </GovShell>
  );
}

/* ================================================================== Validations */

const VALIDATION_ROW: Record<ValidationRequestRecord['status'], RowState> = {
  Soumise: 'muted',
  'En examen': 'muted',
  'À corriger': 'alert',
  Validée: 'ok',
  Refusée: 'alert'
};
const VALIDATION_TONE: Record<ValidationRequestRecord['status'], StatusTone> = {
  Soumise: 'warn',
  'En examen': 'info',
  'À corriger': 'neutral',
  Validée: 'ok',
  Refusée: 'danger'
};
const isPendingValidation = (v: ValidationRequestRecord) => v.status === 'Soumise' || v.status === 'En examen';

export function AdminValidationView({ ext, updateExt, nav, user, setToast }: GovProps) {
  const narrow = useIsNarrow('(max-width: 900px)');
  const [filter, setFilter] = useState<'pending' | 'fix' | 'done' | 'all'>('pending');
  const [selectedId, setSelectedId] = useState(() => (narrow ? '' : ext.validationRequests.find(isPendingValidation)?.id || ext.validationRequests[0]?.id || ''));
  const [note, setNote] = useState('');
  const role = ext.adminActiveRole;
  const canAct = govAccess(role, 'admin-validation') === 'act';

  const inFilter = (v: ValidationRequestRecord) =>
    filter === 'all' ? true : filter === 'pending' ? isPendingValidation(v) : filter === 'fix' ? v.status === 'À corriger' : v.status === 'Validée' || v.status === 'Refusée';
  const visible = ext.validationRequests.filter(inFilter);
  const req = ext.validationRequests.find((v) => v.id === selectedId);
  const ownContent = req?.author === user.name;
  const source = req ? ext.studioContents.find((c) => c.id === req.contentId) : undefined;

  const decide = (status: 'Validée' | 'À corriger' | 'Refusée') => {
    if (!req) return;
    if (ownContent) {
      updateExt((prev) => ({
        ...prev,
        auditLogs: appendAuditLog(prev.auditLogs, {
          actor: user.name,
          action: 'Auto-validation refusée',
          target: `${req.title} (${req.version})`,
          scope: 'Validations',
          result: 'Refusé',
          justification: 'Séparation auteur / validateur obligatoire.'
        })
      }));
      setToast('Refus : un auteur ne peut pas valider son propre contenu.');
      return;
    }
    const noteText = note.trim() || `Décision « ${status} » sur la ${req.version}.`;
    updateExt((prev) => ({
      ...prev,
      validationRequests: prev.validationRequests.map((v) => (v.id === req.id ? { ...v, status, decisionNote: noteText, validator: user.name } : v)),
      studioContents: prev.studioContents.map((c) =>
        c.id === req.contentId
          ? {
              ...c,
              reviewStatus: status === 'Validée' ? 'Validée' : status === 'À corriger' ? 'À corriger' : 'Non soumise',
              updatedAt: `Validation : ${status}`
            }
          : c
      ),
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor: `${user.name} (${role})`,
        action: `Validation → ${status}`,
        target: `${req.title} (${req.version})`,
        scope: `${req.level} · ${req.domain}`,
        result: 'Succès',
        justification: noteText
      })
    }));
    setNote('');
    setToast(`${req.id} : ${status.toLowerCase()}`);
  };

  const count = (f: typeof filter) =>
    ext.validationRequests.filter((v) =>
      f === 'all' ? true : f === 'pending' ? isPendingValidation(v) : f === 'fix' ? v.status === 'À corriger' : v.status === 'Validée' || v.status === 'Refusée'
    ).length;

  return (
    <GovShell section="admin-validation" ext={ext} updateExt={updateExt} nav={nav} setToast={setToast}>
      <PageHeader title="Validations" subtitle="Chaque validation pédagogique porte sur une version précise d’un contenu." />
      <Tabs
        label="Filtrer les demandes"
        value={filter}
        onChange={setFilter}
        items={[
          { id: 'pending', label: 'À examiner', count: count('pending') },
          { id: 'fix', label: 'À corriger', count: count('fix') },
          { id: 'done', label: 'Décidées', count: count('done') },
          { id: 'all', label: 'Toutes', count: count('all') }
        ]}
      />
      <Split
        hasSelection={Boolean(req)}
        onBack={() => setSelectedId('')}
        backLabel="Validations"
        list={
          <ListCard label="Demandes de validation">
            {visible.length === 0 ? (
              <EmptyState title="Aucune demande ici" text="Les contenus soumis depuis le Studio apparaissent dans cette file." />
            ) : (
              visible.map((v) => (
                <ListRow
                  key={v.id}
                  active={v.id === selectedId}
                  leading={
                    <StateTile state={VALIDATION_ROW[v.status]}>
                      <ClipboardCheck size={20} aria-hidden="true" />
                    </StateTile>
                  }
                  title={
                    <RowTitle state={VALIDATION_ROW[v.status]} hint={VALIDATION_ROW[v.status] === 'ok' ? undefined : v.status}>
                      {v.title}
                    </RowTitle>
                  }
                  meta={`${v.contentType} ${v.version} · ${v.author}`}
                  onClick={() => {
                    setSelectedId(v.id);
                    setNote('');
                  }}
                  ariaLabel={`Ouvrir la demande ${v.id}`}
                />
              ))
            )}
          </ListCard>
        }
        detail={
          req ? (
            <article className="gv-detail" key={req.id}>
              <header className="gv-detail-head">
                <div>
                  <h2>{req.title}</h2>
                  <p>
                    {req.id} · {req.contentType} · {req.version}
                  </p>
                </div>
                <div className="gv-detail-actions">
                  <StatusDot tone={VALIDATION_TONE[req.status]}>{req.status}</StatusDot>
                </div>
              </header>
              <Block title="Contexte">
                <Facts
                  items={[
                    ['Niveau demandé', req.level],
                    ['Auteur', req.author],
                    ['Domaine', req.domain],
                    ['Soumise', req.submittedAt],
                    ['Validateur', req.validator || 'À affecter']
                  ]}
                />
              </Block>
              {source && (
                <Block title="Contenu">
                  <p className="gv-text">
                    {plural(source.sections.length, 'section', 'sections')} · {plural((source.quiz || []).length, 'question de quiz', 'questions de quiz')}
                    {source.duration ? ` · ${source.duration}` : ''}
                  </p>
                  <p className="gv-note">Sources déclarées : {source.sources || 'non précisées'}.</p>
                </Block>
              )}
              <Block title="Décision">
                {isPendingValidation(req) ? (
                  canAct ? (
                    <>
                      {ownContent && <p className="gv-text">Vous êtes l’auteur de ce contenu : un autre validateur doit se prononcer.</p>}
                      <label className="ui-field">
                        <span>Observation jointe à la {req.version}</span>
                        <textarea rows={3} value={note} maxLength={600} disabled={ownContent} onChange={(e) => setNote(e.target.value)} />
                      </label>
                      <div className="gv-actions">
                        <button type="button" className="secondary ui-btn-sm danger" disabled={ownContent} onClick={() => decide('Refusée')}>
                          Refuser
                        </button>
                        <button type="button" className="secondary ui-btn-sm" disabled={ownContent} onClick={() => decide('À corriger')}>
                          Demander des corrections
                        </button>
                        <button type="button" className="primary ui-btn-sm" disabled={ownContent} onClick={() => decide('Validée')}>
                          Valider
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="gv-text">En attente d’un validateur.</p>
                  )
                ) : (
                  <>
                    <p className="gv-text">{req.decisionNote || 'Aucune observation.'}</p>
                    {req.status === 'À corriger' && <p className="gv-note">En attente d’une nouvelle soumission de l’auteur.</p>}
                  </>
                )}
              </Block>
            </article>
          ) : (
            <div className="ui-list">
              <EmptyState title="Choisissez une demande" text="Sélectionnez une demande dans la liste pour l’examiner." />
            </div>
          )
        }
      />
    </GovShell>
  );
}

/* ================================================================== Recours */

const APPEAL_MOTIF = 'Envois répétés non sollicités après demande de cessation.';
const APPEAL_TONE: Record<string, StatusTone> = { Reçu: 'warn', 'En examen': 'info', Accepté: 'ok', Rejeté: 'danger', Aucun: 'neutral' };

/** Recours : file d'examen pour la gouvernance ; formulaire de dépôt pour un membre. */
export function AppealView({ ext, updateExt, nav, user, caps, setToast }: GovProps) {
  const [text, setText] = useState(ext.appeal.explanation || '');
  const [decisionNote, setDecisionNote] = useState('');
  const isGov = Boolean(caps?.canModerate || caps?.canAdmin);
  const role = ext.adminActiveRole;
  const appeal = ext.appeal;
  const pending = appeal.submitted && (appeal.status === 'Reçu' || appeal.status === 'En examen');

  const submitAppeal = (explanation: string, actor: string) => {
    updateExt((prev) => ({
      ...prev,
      appeal: { submitted: true, explanation, status: 'Reçu', decisionNote: undefined },
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor,
        action: 'Recours déposé sur DEC-2026-001',
        target: 'DEC-2026-001',
        scope: 'Recours',
        result: 'Succès',
        justification: 'Recours transmis à un réviseur distinct du décideur initial.'
      })
    }));
  };

  /* ------------------------------------------------ côté membre : dépôt */
  if (!isGov) {
    return (
      <div className="gv-page gv-narrow">
        <PageHeader title="Recours" subtitle="Vous pouvez contester une décision : un réviseur distinct du décideur initial la réexamine." />
        <article className="gv-detail">
          <Block title="Décision DEC-2026-001">
            <p className="gv-text">Motif communiqué : {APPEAL_MOTIF}</p>
          </Block>
          <Block title={appeal.submitted ? 'Votre recours' : 'Déposer un recours'}>
            {appeal.submitted ? (
              <>
                <StatusDot tone={APPEAL_TONE[appeal.status]}>{appeal.status}</StatusDot>
                <p className="gv-text">{appeal.explanation}</p>
                {appeal.decisionNote && <p className="gv-text">Réponse du réviseur : {appeal.decisionNote}</p>}
              </>
            ) : (
              <form
                className="gv-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!text.trim()) return;
                  submitAppeal(text.trim(), user.name);
                  setToast('Votre recours a été transmis pour réexamen.');
                }}
              >
                <label className="ui-field">
                  <span>Vos observations</span>
                  <textarea rows={5} value={text} maxLength={1200} placeholder="Expliquez les faits ou apportez des précisions." onChange={(e) => setText(e.target.value)} />
                  <small>Déposer un recours ne lève pas la mesure avant son examen.</small>
                </label>
                <div className="gv-actions">
                  <button type="submit" className="primary ui-btn-sm" disabled={!text.trim()}>
                    Envoyer mon recours
                  </button>
                </div>
              </form>
            )}
          </Block>
        </article>
      </div>
    );
  }

  /* ------------------------------------------------ côté gouvernance : examen */
  const canAct = govAccess(role, 'appeal') === 'act';
  const decide = (accept: boolean) => {
    const note = decisionNote.trim() || (accept ? 'Mesure levée après réexamen ; accès rétablis.' : 'Mesure maintenue après vérification des preuves et des règles.');
    updateExt((prev) => ({
      ...prev,
      appeal: { ...prev.appeal, status: accept ? 'Accepté' : 'Rejeté', decisionNote: note },
      adminUsers: accept ? prev.adminUsers.map((u) => (u.status === 'suspended' ? { ...u, status: 'active' } : u)) : prev.adminUsers,
      notifications: [
        {
          id: `not-appeal-${Date.now()}`,
          category: 'Compte',
          kind: 'appeal-decision',
          params: { accepted: accept ? 'oui' : 'non' },
          actorId: user.id,
          actorName: user.name,
          actorInitials: user.initials,
          actorColor: user.color,
          title: accept ? 'Recours accepté — accès rétablis' : 'Décision sur votre recours',
          detail: note,
          date: formatNotificationTimestamp(),
          read: false,
          targetPage: 'appeal'
        },
        ...prev.notifications
      ],
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor: `${user.name} (${role})`,
        action: accept ? 'Recours accepté — mesure levée' : 'Recours rejeté — mesure maintenue',
        target: 'DEC-2026-001',
        scope: 'Recours',
        result: 'Succès',
        justification: note
      })
    }));
    setDecisionNote('');
    setToast(accept ? 'Recours accepté : accès rétablis' : 'Recours rejeté : décision enregistrée');
  };

  return (
    <GovShell section="appeal" ext={ext} updateExt={updateExt} nav={nav} setToast={setToast}>
      <PageHeader title="Recours" subtitle="Un recours est examiné par un réviseur distinct du décideur initial." />
      {!appeal.submitted ? (
        <div className="ui-list">
          <EmptyState
            title="Aucun recours à examiner"
            text="Les recours déposés par les membres apparaissent ici."
            action={
              canAct
                ? {
                    label: 'Simuler le dépôt d’un recours (démonstration)',
                    onClick: () => submitAppeal('Je conteste la mesure : les messages faisaient suite à une demande d’aide restée sans réponse.', 'Membre concerné (démonstration)')
                  }
                : undefined
            }
          />
        </div>
      ) : (
        <article className="gv-detail gv-detail-wide">
          <header className="gv-detail-head">
            <div>
              <h2>Décision DEC-2026-001</h2>
              <p>Restriction d’envoi de messages</p>
            </div>
            <div className="gv-detail-actions">
              <StatusDot tone={APPEAL_TONE[appeal.status]}>{appeal.status}</StatusDot>
            </div>
          </header>
          <Block title="Contexte">
            <p className="gv-text">Motif communiqué au membre : {APPEAL_MOTIF}</p>
          </Block>
          <Block title="Observations du membre">
            <p className="gv-text">{appeal.explanation}</p>
          </Block>
          <Block title="Décision">
            {pending ? (
              canAct ? (
                <>
                  <label className="ui-field">
                    <span>Justification communiquée au membre</span>
                    <textarea rows={3} value={decisionNote} maxLength={600} onChange={(e) => setDecisionNote(e.target.value)} />
                  </label>
                  <div className="gv-actions">
                    <button type="button" className="secondary ui-btn-sm danger" onClick={() => decide(false)}>
                      Maintenir la mesure
                    </button>
                    <button type="button" className="primary ui-btn-sm" onClick={() => decide(true)}>
                      Accepter le recours
                    </button>
                  </div>
                </>
              ) : (
                <p className="gv-text">En attente d’un réviseur.</p>
              )
            ) : (
              <>
                <p className="gv-text">{appeal.decisionNote || 'Décision enregistrée.'}</p>
                {canAct && (
                  <div className="gv-actions">
                    <button
                      type="button"
                      className="li-text-link"
                      onClick={() => updateExt((prev) => ({ ...prev, appeal: { submitted: false, explanation: '', status: 'Aucun', decisionNote: undefined } }))}
                    >
                      Réinitialiser ce recours (démonstration)
                    </button>
                  </div>
                )}
              </>
            )}
          </Block>
        </article>
      )}
    </GovShell>
  );
}

/* ================================================================== Support */

const TICKET_ROW: Record<SupportTicketRecord['status'], RowState> = {
  nouveau: 'muted',
  ouvert: 'muted',
  'en attente': 'muted',
  résolu: 'ok',
  fermé: 'ok'
};
const TICKET_TONE: Record<SupportTicketRecord['status'], StatusTone> = {
  nouveau: 'warn',
  ouvert: 'info',
  'en attente': 'neutral',
  résolu: 'ok',
  fermé: 'neutral'
};
const TICKET_LABEL: Record<SupportTicketRecord['status'], string> = {
  nouveau: 'Nouveau',
  ouvert: 'Ouvert',
  'en attente': 'En attente du membre',
  résolu: 'Résolu',
  fermé: 'Clôturé'
};

export function AdminSupportView({ ext, updateExt, nav, user, setToast }: GovProps) {
  const narrow = useIsNarrow('(max-width: 900px)');
  const isOpen = (t: SupportTicketRecord) => t.status === 'nouveau' || t.status === 'ouvert';
  const [filter, setFilter] = useState<'open' | 'waiting' | 'done' | 'all'>('open');
  const [selectedId, setSelectedId] = useState(() => (narrow ? '' : ext.supportTickets.find(isOpen)?.id || ext.supportTickets[0]?.id || ''));
  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState('');
  const role = ext.adminActiveRole;
  const canAct = govAccess(role, 'admin-support') === 'act';

  const inFilter = (t: SupportTicketRecord, f = filter) =>
    f === 'all' ? true : f === 'open' ? isOpen(t) : f === 'waiting' ? t.status === 'en attente' : t.status === 'résolu' || t.status === 'fermé';
  const visible = ext.supportTickets.filter((t) => inFilter(t));
  const ticket = ext.supportTickets.find((t) => t.id === selectedId);

  const save = (status: SupportTicketRecord['status'], label: string) => {
    if (!ticket) return;
    updateExt((prev) => ({
      ...prev,
      supportTickets: prev.supportTickets.map((t) =>
        t.id === ticket.id
          ? {
              ...t,
              status,
              assignee: t.assignee || user.name,
              publicReply: reply.trim() || t.publicReply,
              internalNote: internal.trim() || t.internalNote
            }
          : t
      ),
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor: `${user.name} (${role})`,
        action: `Ticket ${ticket.id} → ${TICKET_LABEL[status]}`,
        target: ticket.userName,
        scope: 'Support',
        result: 'Succès',
        justification: 'Traitement du ticket sans accès aux conversations privées.'
      })
    }));
    setReply('');
    setInternal('');
    setToast(`${ticket.id} : ${label}`);
  };

  return (
    <GovShell section="admin-support" ext={ext} updateExt={updateExt} nav={nav} setToast={setToast}>
      <PageHeader title="Support" subtitle="Le support voit le ticket et l’état du compte, jamais les conversations privées." />
      <Tabs
        label="Filtrer les tickets"
        value={filter}
        onChange={setFilter}
        items={[
          { id: 'open', label: 'À traiter', count: ext.supportTickets.filter((t) => inFilter(t, 'open')).length },
          { id: 'waiting', label: 'En attente', count: ext.supportTickets.filter((t) => inFilter(t, 'waiting')).length },
          { id: 'done', label: 'Résolus', count: ext.supportTickets.filter((t) => inFilter(t, 'done')).length },
          { id: 'all', label: 'Tous', count: ext.supportTickets.length }
        ]}
      />
      <Split
        hasSelection={Boolean(ticket)}
        onBack={() => setSelectedId('')}
        backLabel="Support"
        list={
          <ListCard label="Tickets de support">
            {visible.length === 0 ? (
              <EmptyState title="Aucun ticket ici" text="Aucun ticket ne correspond à ce filtre." />
            ) : (
              visible.map((t) => (
                <ListRow
                  key={t.id}
                  active={t.id === selectedId}
                  leading={
                    <StateTile state={TICKET_ROW[t.status]}>
                      <LifeBuoy size={20} aria-hidden="true" />
                    </StateTile>
                  }
                  title={
                    <RowTitle state={TICKET_ROW[t.status]} hint={TICKET_ROW[t.status] === 'ok' ? undefined : TICKET_LABEL[t.status]}>
                      {t.subject}
                    </RowTitle>
                  }
                  meta={`${t.userName}${t.priority === 'Haute' ? ' · Prioritaire' : ''}`}
                  onClick={() => {
                    setSelectedId(t.id);
                    setReply('');
                    setInternal('');
                  }}
                  ariaLabel={`Ouvrir le ticket ${t.id}`}
                />
              ))
            )}
          </ListCard>
        }
        detail={
          ticket ? (
            <article className="gv-detail" key={ticket.id}>
              <header className="gv-detail-head">
                <div>
                  <h2>{ticket.subject}</h2>
                  <p>
                    {ticket.id} · {ticket.category}
                  </p>
                </div>
                <div className="gv-detail-actions">
                  <StatusDot tone={TICKET_TONE[ticket.status]}>{TICKET_LABEL[ticket.status]}</StatusDot>
                  {canAct && ticket.status !== 'fermé' && (
                    <ActionMenu
                      label="Autres actions sur le ticket"
                      items={[
                        { label: 'Marquer résolu', hidden: ticket.status === 'résolu', onSelect: () => save('résolu', 'résolu') },
                        { label: 'Clôturer', onSelect: () => save('fermé', 'clôturé') }
                      ]}
                    />
                  )}
                </div>
              </header>
              <Block title="Contexte">
                <Facts
                  items={[
                    ['Membre', `${ticket.userName} · ${ACCOUNT_STATUS[ticket.userStatus].label}`],
                    ['Reçu', ticket.date],
                    ['Priorité', ticket.priority],
                    ['Pris en charge par', ticket.assignee || 'Personne']
                  ]}
                />
              </Block>
              <Block title="Demande">
                <p className="gv-text">{ticket.description}</p>
              </Block>
              {(ticket.publicReply || ticket.internalNote) && (
                <Block title="Historique">
                  {ticket.publicReply && <p className="gv-text">Dernière réponse au membre : {ticket.publicReply}</p>}
                  {ticket.internalNote && <p className="gv-note">Note interne : {ticket.internalNote}</p>}
                </Block>
              )}
              <Block title="Réponse">
                {ticket.status === 'fermé' ? (
                  <>
                    <p className="gv-text">Ticket clôturé.</p>
                    {canAct && (
                      <div className="gv-actions">
                        <button type="button" className="secondary ui-btn-sm" onClick={() => save('ouvert', 'rouvert')}>
                          Rouvrir
                        </button>
                      </div>
                    )}
                  </>
                ) : canAct ? (
                  <>
                    <label className="ui-field">
                      <span>Réponse au membre</span>
                      <textarea rows={3} value={reply} maxLength={800} placeholder="Réponse claire, sans jamais demander de mot de passe." onChange={(e) => setReply(e.target.value)} />
                    </label>
                    <label className="ui-field">
                      <span>Note interne</span>
                      <textarea rows={2} value={internal} maxLength={600} onChange={(e) => setInternal(e.target.value)} />
                      <small>Invisible pour le membre.</small>
                    </label>
                    <div className="gv-actions">
                      <button type="button" className="primary ui-btn-sm" disabled={!reply.trim()} onClick={() => save('en attente', 'réponse envoyée')}>
                        Envoyer la réponse
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="gv-text">Aucune réponse en cours.</p>
                )}
              </Block>
            </article>
          ) : (
            <div className="ui-list">
              <EmptyState title="Choisissez un ticket" text="Sélectionnez un ticket dans la liste pour y répondre." />
            </div>
          )
        }
      />
    </GovShell>
  );
}

/* ================================================================== Contenus restreints */

const VISIBILITY_ROW: Record<FlaggedContentRecord['visibility'], RowState> = {
  Accessible: 'muted',
  'Masqué temporairement': 'muted',
  'Modification demandée': 'alert',
  Retiré: 'alert'
};
const VISIBILITY: Record<FlaggedContentRecord['visibility'], { label: string; tone: StatusTone }> = {
  Accessible: { label: 'À examiner', tone: 'warn' },
  'Masqué temporairement': { label: 'Masqué', tone: 'info' },
  'Modification demandée': { label: 'Modification demandée', tone: 'info' },
  Retiré: { label: 'Retiré', tone: 'danger' }
};

export function AdminFlaggedContentsView({ ext, updateExt, nav, user, setToast }: GovProps) {
  const narrow = useIsNarrow('(max-width: 900px)');
  const [filter, setFilter] = useState<'all' | FlaggedContentRecord['visibility']>('all');
  const [selectedId, setSelectedId] = useState(() => (narrow ? '' : ext.flaggedContents[0]?.id || ''));
  const [confirmRemove, setConfirmRemove] = useState(false);
  const role = ext.adminActiveRole;
  const canAct = govAccess(role, 'admin-contents') === 'act';

  const visible = ext.flaggedContents.filter((c) => filter === 'all' || c.visibility === filter);
  const item = ext.flaggedContents.find((c) => c.id === selectedId);
  const count = (v: FlaggedContentRecord['visibility']) => ext.flaggedContents.filter((c) => c.visibility === v).length;

  const apply = (visibility: FlaggedContentRecord['visibility'], entry: string) => {
    if (!item) return;
    updateExt((prev) => ({
      ...prev,
      flaggedContents: prev.flaggedContents.map((c) =>
        c.id === item.id ? { ...c, visibility, lastActionAt: 'À l’instant', history: [...c.history, `${entry} (${user.name})`] } : c
      ),
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor: `${user.name} (${role})`,
        action: `Contenu → ${VISIBILITY[visibility].label === 'À examiner' ? 'Restauré' : VISIBILITY[visibility].label}`,
        target: `${item.title} (${item.version})`,
        scope: 'Contenus restreints',
        result: 'Succès',
        justification: entry
      })
    }));
    setToast(`${entry} · la version d’origine est conservée`);
  };

  return (
    <GovShell section="admin-contents" ext={ext} updateExt={updateExt} nav={nav} setToast={setToast}>
      <PageHeader title="Contenus restreints" subtitle="Masquer ou retirer un contenu ne modifie jamais le texte d’origine de son auteur." />
      <Tabs
        label="Filtrer les contenus"
        value={filter}
        onChange={setFilter}
        items={[
          { id: 'all', label: 'Tous', count: ext.flaggedContents.length },
          { id: 'Accessible', label: 'À examiner', count: count('Accessible') },
          { id: 'Masqué temporairement', label: 'Masqués', count: count('Masqué temporairement') },
          { id: 'Modification demandée', label: 'Modification demandée', count: count('Modification demandée') },
          { id: 'Retiré', label: 'Retirés', count: count('Retiré') }
        ]}
      />
      <Split
        hasSelection={Boolean(item)}
        onBack={() => setSelectedId('')}
        backLabel="Contenus restreints"
        list={
          <ListCard label="Contenus signalés">
            {visible.length === 0 ? (
              <EmptyState title="Aucun contenu ici" text="Aucun contenu signalé ne correspond à ce filtre." />
            ) : (
              visible.map((c) => (
                <ListRow
                  key={c.id}
                  active={c.id === selectedId}
                  leading={
                    <StateTile state={VISIBILITY_ROW[c.visibility]}>
                      <EyeOff size={20} aria-hidden="true" />
                    </StateTile>
                  }
                  title={
                    <RowTitle state={VISIBILITY_ROW[c.visibility]} hint={VISIBILITY_ROW[c.visibility] === 'ok' ? undefined : VISIBILITY[c.visibility].label}>
                      {c.title}
                    </RowTitle>
                  }
                  meta={`${c.type} · ${plural(c.reportCount, 'signalement', 'signalements')}`}
                  onClick={() => setSelectedId(c.id)}
                  ariaLabel={`Ouvrir ${c.title}`}
                />
              ))
            )}
          </ListCard>
        }
        detail={
          item ? (
            <article className="gv-detail" key={item.id}>
              <header className="gv-detail-head">
                <div>
                  <h2>{item.title}</h2>
                  <p>
                    {item.type} · {item.version} · {item.author}
                  </p>
                </div>
                <div className="gv-detail-actions">
                  <StatusDot tone={VISIBILITY[item.visibility].tone}>{VISIBILITY[item.visibility].label}</StatusDot>
                </div>
              </header>
              <Block title="Contexte">
                <Facts
                  items={[
                    ['Signalements', String(item.reportCount)],
                    ['Dernière action', item.lastActionAt]
                  ]}
                />
              </Block>
              <Block title="Historique">
                <ol className="gv-history">
                  {item.history.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ol>
              </Block>
              {canAct && (
                <Block title="Action">
                  <div className="gv-actions">
                    {item.visibility !== 'Retiré' && (
                      <button type="button" className="secondary ui-btn-sm danger" onClick={() => setConfirmRemove(true)}>
                        Retirer
                      </button>
                    )}
                    {(item.visibility === 'Accessible' || item.visibility === 'Masqué temporairement') && (
                      <button type="button" className="secondary ui-btn-sm" onClick={() => apply('Modification demandée', 'Modification demandée à l’auteur')}>
                        Demander une modification
                      </button>
                    )}
                    {item.visibility === 'Accessible' ? (
                      <button type="button" className="primary ui-btn-sm" onClick={() => apply('Masqué temporairement', 'Masqué pendant l’examen')}>
                        Masquer
                      </button>
                    ) : (
                      <button type="button" className="primary ui-btn-sm" onClick={() => apply('Accessible', 'Contenu restauré')}>
                        Restaurer
                      </button>
                    )}
                  </div>
                </Block>
              )}
            </article>
          ) : (
            <div className="ui-list">
              <EmptyState title="Choisissez un contenu" text="Sélectionnez un contenu dans la liste pour décider de sa visibilité." />
            </div>
          )
        }
      />
      <ConfirmDialog
        open={confirmRemove}
        title="Retirer ce contenu ?"
        text={`« ${item?.title} » ne sera plus accessible, y compris par lien direct. Vous pourrez le restaurer.`}
        confirmLabel="Retirer"
        danger
        onConfirm={() => {
          setConfirmRemove(false);
          apply('Retiré', 'Contenu retiré');
        }}
        onCancel={() => setConfirmRemove(false)}
      />
    </GovShell>
  );
}
