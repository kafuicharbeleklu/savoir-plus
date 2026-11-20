/**
 * Espace encadrant, avec les outils de l'établissement pour ses propres classes : vue d'ensemble
 * (avancement face à l'attendu, échéances, élèves à accompagner), planification en diagramme de Gantt
 * (en lecture : l'établissement la tient), emploi du temps en grille ; puis ses classes, ses demandes et
 * ses apprenants suivis. Pour chaque classe : où elle bute, question par question, en agrégé.
 */
import React, { useEffect, useState } from 'react';
import { CircleHelp, FileText, Users } from 'lucide-react';
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
import {
  MASTERY_LABELS,
  PASS_THRESHOLD,
  classMapRows,
  remediationSource,
  remediationTitle,
  weakQuestions,
  type MasteryLevel,
  type WeakQuestion
} from '../../classMap';
import { setAiPrefill } from '../../aiPrefill';
import type { StudioContent } from '../../wireframeData';
import { DOMAINS } from '../studio/shared';
import { formatDayShort } from '../../calendar';
import { planStatus, plansOfClass } from '../../planning';
import { InlineMeter } from '../../components/Charts';
import { EmptyState, IconTile, ListCard, ListRow, Modal, PageHeader, Select, StatusDot, Tabs } from '../../components/ui';
import { KpiRow, KpiTile } from '../../components/PlanningTools';
import { ClassesOverview, InstitutionPlanning, TimetablePanel, TrendKpis, boardMeasures, useWeekRecord } from './InstitutionBoard';
import { weekSeries } from '../../trends';
import {
  IdentityDot,
  LearnerModal,
  followUp,
  followUpSummary,
  memberName,
  moduleTitle,
  plural,
  progressOf,
  type SchoolPageProps
} from './shared';

const started = (p: Progress) => p.lessons.length > 0 || p.submitted;

type TabId = 'overview' | 'planning' | 'timetable' | 'classes';
const TAB_IDS: TabId[] = ['overview', 'planning', 'timetable', 'classes'];

/** Question la moins réussie d'un module, si elle l'est par moins de 60 % des élèves (seuil de la carte de classe). */
const weakestQuestion = (stat: ModuleStat) => {
  const answered = stat.questions.filter((q) => q.correctRate !== null);
  if (stat.submitted === 0 || answered.length === 0) return null;
  const weakest = answered.reduce((low, q) => ((q.correctRate as number) < (low.correctRate as number) ? q : low));
  return (weakest.correctRate as number) < PASS_THRESHOLD ? weakest : null;
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
  // Vue d'ensemble de ses classes ; la semaine en cours s'ajoute à ses relevés (courbes des chiffres clés).
  const board = { school, ext, catalog, people, today, classes };
  const overview = boardMeasures(board);
  useWeekRecord(school, saveSchool, user.id, overview.measures, today);

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
    // La carte : une ligne par élève, une colonne par module, les élèves à accompagner en premier.
    const map = classMapRows(
      students.map((uid) => ({ uid, name: memberName(uid, people), rows: openClass.moduleIds.map((id) => followUp(ext, catalog, uid, id)) }))
    );
    const active = map.filter((row) => row.cells.some((cell) => cell.level > 0)).length;
    const pairs = students.length * openClass.moduleIds.length;
    const validatedPairs = map.reduce((sum, row) => sum + row.validated, 0);
    const questions = weakQuestions(stats.map((x) => x.stat), Infinity);
    const belowThreshold = questions.filter((q) => q.correctRate < PASS_THRESHOLD);
    const focus = belowThreshold[0] || null;
    const shortTitle = (id: string) => moduleTitle(catalog, id);
    // Où en sont les séquences de la classe : la dernière terminée, celle en cours, la prochaine évaluation.
    const plans = plansOfClass(school.plans, openClass.id);
    const lastDone = plans.filter((p) => p.kind === 'sequence' && planStatus(p, today) === 'done').pop();
    const running = plans.find((p) => p.kind === 'sequence' && planStatus(p, today) === 'current');
    const nextExam = plans.find((p) => p.kind === 'exam' && planStatus(p, today) !== 'done');
    const sequenceLine = [
      lastDone ? `Séquence « ${lastDone.title} » terminée` : '',
      running ? `« ${running.title} » en cours` : '',
      nextExam ? `${nextExam.title.charAt(0).toLowerCase()}${nextExam.title.slice(1)} le ${formatDayShort(nextExam.start)}` : ''
    ]
      .filter(Boolean)
      .join(' · ');

    const prepareFiche = (q: WeakQuestion) => {
      const domain = catalog.find((c) => c.id === q.moduleId)?.domain as StudioContent['domain'] | undefined;
      setAiPrefill({
        title: remediationTitle(q.moduleTitle, q.index),
        domain: domain && DOMAINS.includes(domain) ? domain : 'Numérique',
        source: remediationSource(q.moduleId, q.index, q.correctRate),
        origin: `Pour ${openClass.name} : la question ${q.index + 1} de « ${q.moduleTitle} » est réussie par ${q.correctRate} % de la classe. Le texte ci-dessous reprend votre module ; complétez-le si besoin.`
      });
      nav('studio-ocr');
    };

    return (
      <div className="sc-page">
        <PageHeader
          back={{ label: 'Espace encadrant', onClick: () => nav('teaching') }}
          title={openClass.name}
          subtitle={`${institution?.name || 'Établissement'} · ${openClass.level} · niveau « ${RESTRICTION_LABEL[openClass.restriction].toLowerCase()} »`}
        />
        {sequenceLine && <p className="cm-context">{sequenceLine}</p>}

        <KpiRow label={`Chiffres clés de ${openClass.name}`}>
          <KpiTile label="Élèves actifs" value={active} unit={`sur ${students.length}`} hint="au moins une section lue" />
          <KpiTile
            label="Modules validés"
            value={validatedPairs}
            unit={`sur ${pairs}`}
            hint={`${plural(openClass.moduleIds.length, 'module', 'modules')} par élève`}
            meter={pairs > 0 ? { value: Math.round((validatedPairs / pairs) * 100), expected: null, label: 'Part des modules validés' } : undefined}
          />
          <KpiTile label="Quiz réussis" value={submitted > 0 ? Math.round((validated / submitted) * 100) : '—'} unit={submitted > 0 ? '%' : undefined} hint={`${validated} sur ${plural(submitted, 'quiz envoyé', 'quiz envoyés')}`} />
          <KpiTile
            label="Questions à reprendre"
            value={belowThreshold.length}
            unit={`sur ${questions.length}`}
            tone={belowThreshold.length > 0 ? 'warn' : 'plain'}
            hint={`réussies par moins de ${PASS_THRESHOLD} % de la classe`}
          />
        </KpiRow>

        <div className="cm-layout">
          <section className="pl-panel cm-map-card" aria-label="Carte de la classe">
            <header className="cm-head">
              <div>
                <h2>Carte de la classe</h2>
                <p>Chaque élève sur chaque module, les élèves à accompagner en premier.</p>
              </div>
            </header>
            {students.length === 0 || openClass.moduleIds.length === 0 ? (
              <EmptyState
                title={students.length === 0 ? 'Aucun élève dans cette classe' : 'Aucun module donné à cette classe'}
                text={students.length === 0 ? undefined : 'L’établissement choisit les modules de la classe.'}
              />
            ) : (
              <div className="cm-scroll">
                <table className="cm-map">
                  <caption className="sr-only">Niveau de chaque élève sur chaque module de {openClass.name}</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="cm-name">
                        Élève
                      </th>
                      {openClass.moduleIds.map((id) => (
                        <th key={id} scope="col" className="cm-module">
                          <button type="button" onClick={() => setModuleOpen(id)} title={`Détail de « ${shortTitle(id)} »`}>
                            {shortTitle(id)}
                          </button>
                        </th>
                      ))}
                      <th scope="col" className="cm-end">
                        Validés
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {map.map((row) => (
                      <tr key={row.uid}>
                        <th scope="row" className="cm-name">
                          <button type="button" onClick={() => setLearnerId(row.uid)}>
                            <span className="cm-initial" aria-hidden="true">
                              {row.name.charAt(0)}
                            </span>
                            <span className="cm-name-text">
                              <b>{row.name}</b>
                            </span>
                          </button>
                        </th>
                        {row.cells.map((cell) => (
                          <td key={cell.moduleId}>
                            <span
                              className={`cm-cell is-l${cell.level}`}
                              role="img"
                              aria-label={`${shortTitle(cell.moduleId)} : ${MASTERY_LABELS[cell.level]}, ${cell.detail}`}
                              title={`${row.name} · ${shortTitle(cell.moduleId)}\n${MASTERY_LABELS[cell.level]} · ${cell.detail}`}
                            />
                          </td>
                        ))}
                        <td className="cm-end">
                          <b className="tabular-nums">
                            {row.validated}/{row.cells.length}
                            <span className="sr-only"> {row.validated > 1 ? 'modules validés' : 'module validé'}</span>
                          </b>
                          {row.toRetake > 0 && <small className="cm-retake">{plural(row.toRetake, 'quiz à retenter', 'quiz à retenter')}</small>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <footer className="cm-foot">
              <p className="cm-legend" aria-label="Légende">
                {([0, 1, 2, 3, 4] as MasteryLevel[]).map((level) => (
                  <span key={level}>
                    <i className={`cm-cell is-l${level}`} aria-hidden="true" /> {MASTERY_LABELS[level]}
                  </span>
                ))}
              </p>
              <p className="cm-rule">Acquis : quiz réussi · Maîtrisé : sans faute</p>
            </footer>
          </section>

          <div className="cm-side">
            <section className="pl-panel cm-questions" aria-label="Questions les moins réussies">
              <header className="cm-head">
                <div>
                  <h2>Questions les moins réussies</h2>
                  <p>Part de bonnes réponses, seuil à {PASS_THRESHOLD} %</p>
                </div>
              </header>
              {questions.length === 0 ? (
                <p className="cm-empty">Aucun quiz envoyé pour le moment.</p>
              ) : (
                <ol className="cm-qlist">
                  {questions.slice(0, 4).map((q) => {
                    const low = q.correctRate < PASS_THRESHOLD;
                    return (
                      <li key={`${q.moduleId}-${q.index}`}>
                        <button type="button" onClick={() => setModuleOpen(q.moduleId)}>
                          <span className="cm-q-top">
                            <b className="cm-q-text">{q.text}</b>
                            <b className={`cm-q-rate tabular-nums${low ? ' is-low' : ''}`}>{q.correctRate} %</b>
                          </span>
                          <small>
                            {q.moduleTitle} · {q.label}
                            {low ? ' · à reprendre' : ''}
                          </small>
                          <span className="cm-q-meter" aria-hidden="true">
                            <i className={low ? 'is-low' : undefined} style={{ width: `${q.correctRate}%` }} />
                            <em style={{ left: `${PASS_THRESHOLD}%` }} />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>

            <section className="pl-panel cm-fiche" aria-label="Fiche de rattrapage">
              <p className="cm-fiche-kicker">
                <FileText size={15} aria-hidden="true" /> Fiche de rattrapage
              </p>
              {focus ? (
                <>
                  <h2 className="cm-fiche-title">{focus.text}</h2>
                  <p className="cm-fiche-meta">
                    {focus.moduleTitle} · {focus.label}
                  </p>
                  <p className="cm-fiche-text">
                    Réussie par {focus.correctRate} % de la classe. L’IA prépare une fiche courte à partir de votre module : quelques sections, un quiz
                    d’entraînement et une fiche pas à pas.
                  </p>
                  <button type="button" className="primary" onClick={() => prepareFiche(focus)}>
                    Préparer la fiche avec l’IA
                  </button>
                  <p className="cm-fiche-note">Vous relisez chaque bloc dans le Studio. Rien n’est publié ni envoyé sans vous.</p>
                </>
              ) : (
                <p className="cm-fiche-text">
                  {questions.length === 0
                    ? 'Dès que la classe enverra ses quiz, la question la moins réussie apparaîtra ici.'
                    : `Toutes les questions sont réussies par au moins ${PASS_THRESHOLD} % de la classe : pas de rattrapage à prévoir.`}
                </p>
              )}
            </section>
          </div>
        </div>
        <p className="sc-note">La carte montre l’avancement et la note au quiz de chaque élève. Les questions sont des totaux de la classe. Aucune réponse individuelle n’est montrée.</p>

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
                    <li key={question.label} className={(question.correctRate ?? 100) < PASS_THRESHOLD ? 'is-weak' : ''}>
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
  const series = weekSeries(school.snapshots, user.id, overview.measures, today);
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
          board={overview}
          series={series}
          emptyText="Une classe vous est confiée quand un établissement valide votre rattachement."
          onOpenClass={(id) => nav('teaching', id)}
          onOpenPlanning={() => nav('teaching', 'planning')}
          onOpenLearner={(uid) => {
            const schoolClass = classes.find((c) => studentsOfClass(school, c.id).includes(uid));
            if (schoolClass) setClassLearner({ uid, classId: schoolClass.id });
          }}
          kpis={
            <KpiRow label="Chiffres clés de vos classes">
              <TrendKpis board={overview} series={series} />
              <KpiTile
                label="Questions à revoir"
                value={weakCount}
                tone={weakCount > 0 ? 'warn' : 'plain'}
                hint={weakCount > 0 ? 'réussies par moins de 60 % de la classe' : 'aucune'}
                icon={<CircleHelp size={15} aria-hidden="true" />}
              />
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
