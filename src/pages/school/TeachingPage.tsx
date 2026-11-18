/**
 * Espace encadrant, avec les outils de l'établissement pour ses propres classes : vue d'ensemble
 * (avancement face à l'attendu, échéances, élèves à accompagner), planification en diagramme de Gantt
 * (en lecture : l'établissement la tient), emploi du temps en grille ; puis ses classes, ses demandes et
 * ses apprenants suivis. Pour chaque classe : où elle bute, question par question, en agrégé.
 */
import React, { useEffect, useState } from 'react';
import { CircleHelp, Clock, GraduationCap, UserCheck, Users } from 'lucide-react';
import type { Progress } from '../../data';
import {
  accountOf,
  classesOfTeacher,
  institutionOf,
  requestMembership,
  slotsFor,
  studentsOfClass,
  RESTRICTION_LABEL,
  type SchoolClass
} from '../../school';
import { computeModuleStat, type ModuleStat } from '../../studioStats';
import { formatDayShort } from '../../calendar';
import { InlineMeter } from '../../components/Charts';
import { EmptyState, IconTile, ListCard, ListRow, Modal, PageHeader, RowTitle, Select, StatusDot, Tabs } from '../../components/ui';
import { KpiRow, KpiTile } from '../../components/PlanningTools';
import { weeklyHours } from '../../planning';
import { ClassesOverview, InstitutionPlanning, TimetablePanel } from './InstitutionBoard';
import {
  IdentityDot,
  LearnerModal,
  followUp,
  followUpSummary,
  memberName,
  plural,
  progressOf,
  type SchoolPageProps
} from './shared';

const started = (p: Progress) => p.lessons.length > 0 || p.submitted;

type TabId = 'overview' | 'planning' | 'timetable' | 'classes';
const TAB_IDS: TabId[] = ['overview', 'planning', 'timetable', 'classes'];

/** Question la moins réussie d'un module, si elle l'est par moins de 60 % des élèves. */
const weakestQuestion = (stat: ModuleStat) => {
  const answered = stat.questions.filter((q) => q.correctRate !== null);
  if (stat.submitted === 0 || answered.length === 0) return null;
  const weakest = answered.reduce((low, q) => ((q.correctRate as number) < (low.correctRate as number) ? q : low));
  return (weakest.correctRate as number) < 60 ? weakest : null;
};

export function TeachingPage({ school, saveSchool, ext, user, people, today, catalog, selectedId, nav, setToast }: SchoolPageProps) {
  const [learnerId, setLearnerId] = useState<string | null>(null);
  const [moduleOpen, setModuleOpen] = useState<string | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);

  const account = accountOf(school, user.id);
  const classes = classesOfTeacher(school, user.id);
  const openClass = classes.find((c) => c.id === selectedId);
  const mentored = school.mentorships.filter((m) => m.educatorId === user.id && m.status === 'active').map((m) => m.learnerId);
  const pending = school.memberships.filter((m) => m.userId === user.id && m.role === 'teacher' && m.status === 'pending');
  // Rubriques : l'adresse peut en ouvrir une (« teaching/planning ») ; sans classe, l'espace s'ouvre sur les classes.
  const [tab, setTab] = useState<TabId>((TAB_IDS as string[]).includes(selectedId) ? (selectedId as TabId) : classes.length ? 'overview' : 'classes');
  useEffect(() => {
    if ((TAB_IDS as string[]).includes(selectedId)) setTab(selectedId as TabId);
  }, [selectedId]);
  // Élève ouvert depuis la vue d'ensemble : son suivi sur les modules de sa classe.
  const [classLearner, setClassLearner] = useState<{ uid: string; classId: string } | null>(null);

  const statFor = (schoolClass: SchoolClass, moduleId: string): ModuleStat | null => {
    const item = catalog.find((c) => c.id === moduleId);
    if (!item) return null;
    const learners = studentsOfClass(school, schoolClass.id)
      .map((uid) => progressOf(ext, uid, moduleId))
      .filter(started);
    return computeModuleStat(item, learners);
  };

  const learnerModal = (uid: string, moduleIds: string[], subtitle: string) => (
    <LearnerModal
      name={memberName(uid, people)}
      subtitle={subtitle}
      rows={moduleIds.map((id) => followUp(ext, catalog, uid, id))}
      onClose={() => setLearnerId(null)}
    />
  );

  /* ---------------------------------------------------------------- Une classe */
  if (openClass) {
    const institution = institutionOf(school, openClass.institutionId);
    const students = studentsOfClass(school, openClass.id);
    const stats = openClass.moduleIds.map((id) => ({ id, stat: statFor(openClass, id) })).filter((x): x is { id: string; stat: ModuleStat } => Boolean(x.stat));
    const submitted = stats.reduce((sum, x) => sum + x.stat.submitted, 0);
    const validated = stats.reduce((sum, x) => sum + x.stat.validated, 0);
    const opened = stats.find((x) => x.id === moduleOpen);

    return (
      <div className="sc-page">
        <PageHeader
          back={{ label: 'Espace encadrant', onClick: () => nav('teaching') }}
          title={openClass.name}
          subtitle={`${institution?.name || 'Établissement'} · ${openClass.level} · niveau « ${RESTRICTION_LABEL[openClass.restriction].toLowerCase()} »`}
        />

        <div className="ui-kpis tabular-nums">
          <div className="ui-kpi">
            <b>{students.length}</b>
            <span>{students.length > 1 ? 'Élèves' : 'Élève'}</span>
          </div>
          <div className="ui-kpi">
            <b>{openClass.moduleIds.length}</b>
            <span>{openClass.moduleIds.length > 1 ? 'Modules donnés' : 'Module donné'}</span>
          </div>
          <div className="ui-kpi">
            <b>{submitted > 0 ? `${Math.round((validated / submitted) * 100)} %` : '—'}</b>
            <span>Quiz réussis</span>
          </div>
        </div>

        <div className="ui-section-title">
          <h2>Où la classe bute</h2>
        </div>
        <ListCard label="Modules de la classe">
          {stats.length === 0 ? (
            <EmptyState title="Aucun module donné à cette classe" text="L’établissement choisit les modules de la classe." />
          ) : (
            stats.map(({ id, stat }) => {
              const weak = weakestQuestion(stat);
              return (
                <ListRow
                  key={id}
                  leading={<IconTile tone={weak ? 'danger' : 'brand'}>{<Users size={20} aria-hidden="true" />}</IconTile>}
                  title={
                    <RowTitle state={weak ? 'alert' : 'ok'} hint={weak ? `${weak.label} réussie par ${weak.correctRate} % des élèves` : undefined}>
                      {stat.title}
                    </RowTitle>
                  }
                  meta={`${plural(stat.learners, 'élève a commencé', 'élèves ont commencé')} · ${plural(stat.submitted, 'quiz envoyé', 'quiz envoyés')}`}
                  onClick={() => setModuleOpen(id)}
                  trailing={weak ? <StatusDot tone="danger">{`${weak.label} : ${weak.correctRate} %`}</StatusDot> : undefined}
                />
              );
            })
          )}
        </ListCard>

        <div className="ui-section-title">
          <h2>Élèves</h2>
        </div>
        <ListCard label={`Élèves de ${openClass.name}`}>
          {students.length === 0 ? (
            <EmptyState title="Aucun élève dans cette classe" />
          ) : (
            students.map((uid) => {
              const rows = openClass.moduleIds.map((id) => followUp(ext, catalog, uid, id));
              const failed = rows.some((r) => r.quiz === 'failed');
              return (
                <ListRow
                  key={uid}
                  leading={<span className="sc-initial" aria-hidden="true">{memberName(uid, people).charAt(0)}</span>}
                  title={<RowTitle state={failed ? 'alert' : 'ok'} hint={failed ? 'Un quiz à retenter' : undefined}>{memberName(uid, people)}</RowTitle>}
                  meta={followUpSummary(rows)}
                  onClick={() => setLearnerId(uid)}
                />
              );
            })
          )}
        </ListCard>
        <p className="sc-note">Les chiffres de la classe sont des totaux. Aucune réponse individuelle n’est montrée.</p>

        {opened && (
          <Modal open size="md" title={opened.stat.title} onClose={() => setModuleOpen(null)}>
            <p className="sc-modal-sub">
              {plural(opened.stat.learners, 'élève a commencé', 'élèves ont commencé')} sur {students.length} ·{' '}
              {plural(opened.stat.submitted, 'quiz envoyé', 'quiz envoyés')}
            </p>
            <div className="cal-form-section sc-first">
              <h3>Sections lues</h3>
              <ul className="sc-meters">
                {opened.stat.steps.slice(0, -1).map((step) => (
                  <li key={step.label}>
                    <span>{step.detail || step.label}</span>
                    <InlineMeter value={step.rate} />
                  </li>
                ))}
              </ul>
            </div>
            <div className="cal-form-section">
              <h3>Bonnes réponses par question</h3>
              {opened.stat.submitted === 0 ? (
                <p className="sc-note">Aucun quiz envoyé pour le moment.</p>
              ) : (
                <ul className="sc-meters">
                  {opened.stat.questions.map((question) => (
                    <li key={question.label} className={(question.correctRate ?? 100) < 60 ? 'is-weak' : ''}>
                      <span>{question.text}</span>
                      <InlineMeter value={question.correctRate} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Modal>
        )}

        {learnerId && learnerModal(learnerId, openClass.moduleIds, `${openClass.name} · ${institution?.name || ''}`)}
      </div>
    );
  }

  /* ---------------------------------------------------------------- Accueil de l'espace */
  const board = { school, ext, catalog, people, today, classes };
  const studentCount = new Set(classes.flatMap((c) => studentsOfClass(school, c.id))).size;
  const hours = weeklyHours(slotsFor(school, user.id));
  const weakCount = classes.reduce(
    (sum, c) =>
      sum +
      c.moduleIds.filter((id) => {
        const stat = statFor(c, id);
        return stat ? Boolean(weakestQuestion(stat)) : false;
      }).length,
    0
  );
  const joinable = school.institutions.filter(
    (i) => !school.memberships.some((m) => m.userId === user.id && m.institutionId === i.id && m.role === 'teacher' && (m.status === 'active' || m.status === 'pending'))
  );

  return (
    <div className="sc-page">
      <PageHeader title="Espace encadrant" />

      {/* Le bandeau n'apparaît que s'il y a quelque chose à faire. */}
      {account.identity !== 'verified' && (
        <section className="sc-status" aria-label="Votre statut">
          <IdentityDot status={account.identity} />
          <p>Sans identité vérifiée, vous restez encadreur indépendant et ne recevez pas de classe.</p>
          <button type="button" className="li-text-link" onClick={() => nav('settings', 'account/verification')}>
            Faire vérifier mon identité
          </button>
        </section>
      )}

      <Tabs<TabId>
        label="Rubriques de l’espace encadrant"
        value={tab}
        onChange={(id) => {
          setTab(id);
          nav('teaching', id === 'overview' ? '' : id);
        }}
        items={[
          { id: 'overview', label: 'Vue d’ensemble' },
          { id: 'planning', label: 'Planification' },
          { id: 'timetable', label: 'Emploi du temps' },
          { id: 'classes', label: 'Classes', count: classes.length }
        ]}
      />

      {tab === 'overview' && (
        <ClassesOverview
          data={board}
          emptyText="Une classe vous est confiée quand un établissement valide votre rattachement."
          onOpenClass={(id) => nav('teaching', id)}
          onOpenLearner={(uid) => {
            const schoolClass = classes.find((c) => studentsOfClass(school, c.id).includes(uid));
            if (schoolClass) setClassLearner({ uid, classId: schoolClass.id });
          }}
          kpis={
            <KpiRow label="Chiffres clés de vos classes">
              <KpiTile label="Élèves" value={studentCount} hint={plural(classes.length, 'classe', 'classes')} icon={<GraduationCap size={15} aria-hidden="true" />} />
              <KpiTile label="Heures de cours" value={hours} hint="par semaine" icon={<Clock size={15} aria-hidden="true" />} />
              <KpiTile
                label="Questions à revoir"
                value={weakCount}
                tone={weakCount > 0 ? 'warn' : 'plain'}
                hint={weakCount > 0 ? 'réussies par moins de 60 %' : 'aucune'}
                icon={<CircleHelp size={15} aria-hidden="true" />}
              />
              <KpiTile label="Apprenants suivis" value={mentored.length} hint="en accompagnement" icon={<UserCheck size={15} aria-hidden="true" />} />
            </KpiRow>
          }
        />
      )}

      {tab === 'planning' && <InstitutionPlanning data={board} saveSchool={saveSchool} setToast={setToast} readOnly />}

      {tab === 'timetable' && <TimetablePanel
          slots={slotsFor(school, user.id)}
          people={people}
          today={today}
          label="Vos cours de la semaine"
          classNameOf={(id) => school.classes.find((c) => c.id === id)?.name || ''}
        />}

      {tab === 'classes' && (
        <>
          <div className="ui-section-title">
            <h2>Mes classes</h2>
            {joinable.length > 0 && (
              <button type="button" className="li-text-link" onClick={() => setJoinOpen(true)}>
                Demander un rattachement
              </button>
            )}
          </div>
          <ListCard label="Mes classes">
            {classes.length === 0 ? (
              <EmptyState
                title="Aucune classe pour le moment"
                text="Une classe vous est confiée quand un établissement valide votre rattachement et que votre identité est vérifiée."
              />
            ) : (
              classes.map((c) => {
                const count = studentsOfClass(school, c.id).length;
                const weak = c.moduleIds.some((id) => {
                  const stat = statFor(c, id);
                  return stat ? Boolean(weakestQuestion(stat)) : false;
                });
                return (
                  <ListRow
                    key={c.id}
                    leading={<IconTile tone="brand">{<Users size={20} aria-hidden="true" />}</IconTile>}
                    title={c.name}
                    meta={`${institutionOf(school, c.institutionId)?.name || ''} · ${plural(count, 'élève', 'élèves')} · ${plural(c.moduleIds.length, 'module', 'modules')}`}
                    onClick={() => nav('teaching', c.id)}
                    trailing={weak ? <StatusDot tone="danger">Une question à revoir</StatusDot> : undefined}
                  />
                );
              })
            )}
          </ListCard>

          {pending.length > 0 && (
            <>
              <div className="ui-section-title">
                <h2>Demandes en attente</h2>
              </div>
              <ListCard label="Demandes de rattachement en attente">
                {pending.map((m) => (
                  <ListRow
                    key={m.id}
                    leading={<IconTile>{<Users size={20} aria-hidden="true" />}</IconTile>}
                    title={institutionOf(school, m.institutionId)?.name || 'Établissement'}
                    meta={`${m.subject || 'Enseignement'} · demandé le ${formatDayShort(m.requestedOn)}`}
                    trailing={<StatusDot tone="warn">En attente de l’établissement</StatusDot>}
                  />
                ))}
              </ListCard>
        </>
      )}

      {mentored.length > 0 && (
        <>
          <div className="ui-section-title">
            <h2>Apprenants suivis</h2>
          </div>
          <ListCard label="Apprenants qui ont accepté votre suivi">
            {mentored.map((uid) => {
              const moduleIds = Object.keys(ext.moduleProgress?.[uid] || {});
              return (
                <ListRow
                  key={uid}
                  leading={<span className="sc-initial" aria-hidden="true">{memberName(uid, people).charAt(0)}</span>}
                  title={memberName(uid, people)}
                  meta={followUpSummary(moduleIds.map((id) => followUp(ext, catalog, uid, id)))}
                  onClick={() => setLearnerId(uid)}
                />
              );
            })}
          </ListCard>
        </>
      )}

        </>
      )}

      {learnerId && learnerModal(learnerId, Object.keys(ext.moduleProgress?.[learnerId] || {}), 'Suivi accepté par l’apprenant')}
      {classLearner &&
        (() => {
          const schoolClass = classes.find((c) => c.id === classLearner.classId);
          return schoolClass ? (
            <LearnerModal
              name={memberName(classLearner.uid, people)}
              subtitle={`${schoolClass.name} · ${institutionOf(school, schoolClass.institutionId)?.name || ''}`}
              rows={schoolClass.moduleIds.map((id) => followUp(ext, catalog, classLearner.uid, id))}
              onClose={() => setClassLearner(null)}
            />
          ) : null;
        })()}

      {joinOpen && (
        <JoinModal
          institutions={joinable.map((i) => ({ id: i.id, name: i.name }))}
          classesOf={(institutionId) => school.classes.filter((c) => c.institutionId === institutionId).map((c) => ({ id: c.id, name: c.name }))}
          onClose={() => setJoinOpen(false)}
          onSubmit={(institutionId, classId, subject) => {
            saveSchool(
              requestMembership(school, { institutionId, userId: user.id, role: 'teacher', classIds: classId ? [classId] : [], subject, requestedBy: 'member' }, today)
            );
            setJoinOpen(false);
            setToast(`Demande envoyée à ${institutionOf(school, institutionId)?.name || 'l’établissement'}`);
          }}
        />
      )}
    </div>
  );
}

function JoinModal({
  institutions,
  classesOf,
  onSubmit,
  onClose
}: {
  institutions: { id: string; name: string }[];
  classesOf: (institutionId: string) => { id: string; name: string }[];
  onSubmit: (institutionId: string, classId: string, subject: string) => void;
  onClose: () => void;
}) {
  const [institutionId, setInstitutionId] = useState(institutions[0]?.id || '');
  const [classId, setClassId] = useState('');
  const [subject, setSubject] = useState('');
  const classes = classesOf(institutionId);
  return (
    <Modal
      open
      size="sm"
      title="Demander un rattachement"
      onClose={onClose}
      footer={
        <button type="button" className="primary ui-btn-sm" disabled={!institutionId || !subject.trim()} onClick={() => onSubmit(institutionId, classId, subject.trim())}>
          Envoyer la demande
        </button>
      }
    >
      <div className="cal-form">
        <label className="ui-field">
          <span>Établissement</span>
          <Select
            value={institutionId}
            onChange={(e) => {
              setInstitutionId(e.target.value);
              setClassId('');
            }}
          >
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="ui-field">
          <span>Classe (facultatif)</span>
          <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">À définir avec l’établissement</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="ui-field">
          <span>Matière enseignée</span>
          <input value={subject} maxLength={60} placeholder="Ex. Mathématiques" onChange={(e) => setSubject(e.target.value)} />
        </label>
        <p className="cal-form-note">L’établissement valide ou refuse la demande. Une fois validée, et votre identité vérifiée, vous devenez enseignant de cet établissement.</p>
      </div>
    </Modal>
  );
}
