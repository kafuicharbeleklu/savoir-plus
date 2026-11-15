/**
 * Studio — Statistiques et Profil créateur.
 * Les chiffres viennent des progressions réellement enregistrées dans la démonstration.
 */
import React, { useMemo, useState } from 'react';
import type { Progress } from '../../data';
import { buildDynamicCatalog, type CatalogType } from '../../wireframeData';
import { computeCreatorStats, hasQuestionGap, hasStepLoss, moduleInsights } from '../../studioStats';
import { Avatar } from '../../components/ProfileIdentityCard';
import { ChartCard, InlineMeter, SplitCount, StepColumns } from '../../components/Charts';
import { EmptyState, ListCard, ListRow, PageHeader, Select, SortTh, StateTile, useTableSort } from '../../components/ui';
import { StudioShell, TYPE_LABEL, TypeIcon, type StudioProps } from './shared';

const detailRoute = (type: CatalogType) => (type === 'resource' ? 'resource-detail' : type === 'path' ? 'path-detail' : 'module-detail');

/** Progression principale des personnages de démonstration (module phishing), enregistrée à part. */
function readLocalMainProgress(): Record<string, Progress> {
  try {
    const raw = JSON.parse(localStorage.getItem('savoir-demo-v1') || 'null');
    return (raw && raw.progress) || {};
  } catch {
    return {};
  }
}

type StatColumn = 'title' | 'learners' | 'completion' | 'passRate' | 'avgScore';

export function StudioStatsView({ ext, nav, user }: StudioProps) {
  const [pickedId, setPickedId] = useState('');
  const { sort, toggle, apply } = useTableSort<StatColumn>([{ key: 'learners', dir: 'desc' }]);

  const authored = user ? buildDynamicCatalog(ext).filter((c) => c.author === user.name) : [];
  const modules = authored.filter((c) => c.type === 'module' && c.interactive);
  const untracked = authored.length - modules.length;

  // Toutes les progressions connues : celles des membres, et la progression principale des personnages.
  const progressByUser = useMemo(() => {
    const merged: Record<string, Record<string, Progress | undefined>> = {};
    for (const [uid, main] of Object.entries(readLocalMainProgress())) merged[uid] = { phishing: main };
    for (const [uid, byModule] of Object.entries(ext.moduleProgress || {})) merged[uid] = { ...(merged[uid] || {}), ...byModule };
    return merged;
  }, [ext.moduleProgress]);

  const stats = computeCreatorStats({ modules, progressByUser, excludeUserId: user?.id });
  const maxLearners = Math.max(1, ...stats.modules.map((s) => s.learners));
  const rows = apply(stats.modules, {
    title: (s) => s.title,
    learners: (s) => s.learners,
    completion: (s) => s.completion,
    passRate: (s) => s.passRate,
    avgScore: (s) => s.avgScore
  });
  const selected = stats.modules.find((s) => s.id === pickedId) || [...stats.modules].sort((a, b) => b.learners - a.learners)[0];
  const insights = selected ? moduleInsights(selected) : [];
  const showSteps = Boolean(selected && hasStepLoss(selected));
  const showQuestions = Boolean(selected && hasQuestionGap(selected));
  const show = (value: number | null | undefined, suffix = '') => (value === null || value === undefined ? '—' : `${value}${suffix}`);

  return (
    <StudioShell active="studio-stats" nav={nav}>
      <PageHeader title="Statistiques" subtitle="Ce que les apprenants font de vos modules publiés." />

      {/* Les chiffres d'ensemble : des nombres, pas un graphique. */}
      <div className="ui-kpis tabular-nums">
        <div className="ui-kpi">
          <b>{stats.totals.learners}</b>
          <span>{stats.totals.learners > 1 ? 'apprenants' : 'apprenant'}</span>
        </div>
        <div className="ui-kpi">
          <b>{show(stats.totals.completion, ' %')}</b>
          <span>achèvement moyen</span>
        </div>
        <div className="ui-kpi">
          <b>{show(stats.totals.passRate, ' %')}</b>
          <span>réussite au quiz</span>
        </div>
        <div className="ui-kpi">
          <b>{show(stats.totals.avgScore, ' %')}</b>
          <span>score moyen au quiz</span>
        </div>
      </div>

      {/* Comparer les modules : un tableau, avec une jauge fine dans chaque colonne. */}
      <div className="sx-stats-pick">
        <h2>Vos modules</h2>
        <ul className="ch-legend" aria-label="Légende de la colonne Apprenants">
          <li>
            <i className="ch-swatch" aria-hidden="true" /> module validé
          </li>
          <li>
            <i className="ch-swatch is-soft" aria-hidden="true" /> en cours
          </li>
        </ul>
      </div>
      <div className="ui-list sx-table-wrap">
        {stats.modules.length === 0 ? (
          <EmptyState
            title="Aucun module publié"
            text="Les statistiques apparaissent dès qu’un module est publié et suivi par un apprenant."
            action={{ label: 'Voir mes contenus', onClick: () => nav('studio') }}
          />
        ) : (
          <table className="sx-table sx-stats-table tabular-nums">
            <thead>
              <tr>
                <SortTh sortKey="title" sort={sort} onSort={toggle}>
                  Module
                </SortTh>
                <SortTh sortKey="learners" sort={sort} onSort={toggle} className="is-num">
                  Apprenants
                </SortTh>
                <SortTh sortKey="completion" sort={sort} onSort={toggle} className="is-num">
                  Achèvement
                </SortTh>
                <SortTh sortKey="passRate" sort={sort} onSort={toggle} className="is-num">
                  Réussite au quiz
                </SortTh>
                <SortTh sortKey="avgScore" sort={sort} onSort={toggle} className="is-num">
                  Score moyen
                </SortTh>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className={selected?.id === s.id ? 'is-active' : ''}>
                  <th scope="row">
                    <button
                      type="button"
                      className="sx-table-link"
                      aria-pressed={selected?.id === s.id}
                      title="Afficher le détail de ce module"
                      onClick={() => setPickedId(s.id)}
                    >
                      {s.title}
                    </button>
                    <small>{s.domain}</small>
                  </th>
                  <td className="is-num">
                    <SplitCount main={s.validated} soft={s.inProgress} max={maxLearners} mainLabel="module validé" softLabel="en cours" />
                  </td>
                  <td className="is-num">
                    <InlineMeter value={s.completion} />
                  </td>
                  <td className="is-num">{show(s.passRate, ' %')}</td>
                  <td className="is-num">{show(s.avgScore, ' %')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Le détail d'un module : où en sont les apprenants, et quelles questions posent problème. */}
      {selected && (
        <>
          <div className="sx-stats-pick">
            <h2>Détail du module</h2>
            <label className="sx-inline-select">
              <span className="sr-only">Module étudié</span>
              <Select aria-label="Module étudié" value={selected.id} onChange={(e) => setPickedId(e.target.value)}>
                {stats.modules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          {selected.learners === 0 ? (
            <div className="sx-card">
              <EmptyState title="Aucun apprenant sur ce module" text="Le détail apparaîtra dès qu’un membre le commencera." />
            </div>
          ) : (
            <>
              <ul className="sx-insights">
                {insights.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              {(showSteps || showQuestions) && (
                <ChartCard
                  title="Parcours du module"
                  subtitle={`Nombre d’apprenants à chaque étape, sur ${selected.learners} ${selected.learners > 1 ? 'inscrits' : 'inscrit'}.`}
                >
                  <StepColumns
                    max={selected.learners}
                    groups={[
                      {
                        label: 'Sections lues',
                        columns: selected.steps.slice(0, -1).map((step, index) => ({
                          key: `section-${index}`,
                          tick: String(index + 1),
                          value: step.count,
                          weak: (step.rate ?? 100) < 50,
                          tip: `${step.label}${step.detail ? ` · ${step.detail}` : ''} — lue par ${step.count} sur ${selected.learners}`
                        }))
                      },
                      {
                        label: 'Questions réussies',
                        columns: selected.questions.map((q, index) => ({
                          key: `question-${index}`,
                          tick: String(index + 1),
                          value: q.correct,
                          weak: (q.correctRate ?? 100) < 50,
                          tip: `${q.label} · ${q.text} — ${q.correct} ${q.correct > 1 ? 'bonnes réponses' : 'bonne réponse'} sur ${selected.submitted} quiz ${selected.submitted > 1 ? 'envoyés' : 'envoyé'}`
                        }))
                      },
                      {
                        label: '',
                        columns: [
                          {
                            key: 'validated',
                            tick: 'Module validé',
                            value: selected.validated,
                            tip: `Module validé par ${selected.validated} sur ${selected.learners}`
                          }
                        ]
                      }
                    ]}
                  />
                </ChartCard>
              )}
            </>
          )}
        </>
      )}

      <p className="sx-note">
        Chiffres calculés à partir des progressions enregistrées sur cet appareil ; aucune réponse individuelle n’est affichée.
        {untracked > 0 ? ` Vos ${untracked} ressources et parcours n’ont pas de suivi par apprenant.` : ''}
      </p>
    </StudioShell>
  );
}

export function StudioCreatorProfileView({ ext, nav, user }: StudioProps) {
  const [memberView, setMemberView] = useState(false);
  if (!user) return null;

  const details = ext.profileDetails[user.id];
  const authored = buildDynamicCatalog(ext).filter((c) => c.author === user.name);
  const mine = ext.studioContents.filter((c) => (c.authorName || 'Kossi Agbo') === user.name);
  const drafts = mine.filter((c) => c.pubStatus !== 'Publié').length;
  const inReview = mine.filter((c) => c.reviewStatus === 'En revue').length;

  return (
    <StudioShell active="studio-profile" nav={nav}>
      <PageHeader
        title="Profil créateur"
        subtitle={memberView ? 'Aperçu : ce que voient les autres membres.' : 'Vos contenus publiés, tels que les membres les trouvent.'}
        actions={
          <>
            <button type="button" className="secondary ui-btn-sm" aria-pressed={memberView} onClick={() => setMemberView((v) => !v)}>
              {memberView ? 'Revenir à ma vue' : 'Aperçu membre'}
            </button>
            <button type="button" className="secondary ui-btn-sm" onClick={() => nav('profile')}>
              Voir mon profil
            </button>
          </>
        }
      />

      <section className="sx-card sx-creator" aria-label="Identité du créateur">
        <Avatar person={user} />
        <div className="sx-creator-text">
          <b>{user.name}</b>
          <span>{details?.tagline || user.role}</span>
          {details?.bio && <p>{details.bio}</p>}
        </div>
      </section>

      <div className="ui-kpis tabular-nums">
        <div className="ui-kpi">
          <b>{authored.length}</b>
          <span>{authored.length > 1 ? 'contenus publiés' : 'contenu publié'}</span>
        </div>
        {!memberView && (
          <>
            <div className="ui-kpi">
              <b>{drafts}</b>
              <span>{drafts > 1 ? 'brouillons' : 'brouillon'}</span>
            </div>
            <div className="ui-kpi">
              <b>{inReview}</b>
              <span>en revue</span>
            </div>
          </>
        )}
      </div>

      <ListCard label="Contenus publiés">
        {authored.length === 0 ? (
          <EmptyState
            title="Aucun contenu publié"
            text="Vos contenus apparaîtront ici dès leur publication."
            action={memberView ? undefined : { label: 'Voir mes contenus', onClick: () => nav('studio') }}
          />
        ) : (
          authored.map((c) => {
            // Un contenu validé s'affiche normalement ; un contenu pas encore validé s'affiche en gris.
            const validated = c.review === 'Pédagogique';
            return (
              <ListRow
                key={c.id}
                leading={
                  <StateTile state={validated ? 'ok' : 'muted'}>
                    <TypeIcon type={c.type} />
                  </StateTile>
                }
                title={validated ? c.title : <span className="ui-muted-title">{c.title}</span>}
                meta={[TYPE_LABEL[c.type], c.domain, /non précisée/i.test(c.duration) ? '' : c.duration, c.version.replace(/^Version\s+/i, 'v')].filter(Boolean).join(' · ')}
                onClick={() => nav(detailRoute(c.type), c.id)}
                ariaLabel={`Ouvrir ${c.title}${validated ? '' : ' (pas encore validé)'}`}
              />
            );
          })
        )}
      </ListCard>
    </StudioShell>
  );
}
