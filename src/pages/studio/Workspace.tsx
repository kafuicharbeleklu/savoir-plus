/**
 * Studio — espace de travail d'un contenu.
 * Remplace les anciens écrans Éditeur, Quiz, Parcours et Publication : un en-tête
 * (titre, statut, « Enregistré », Vérifications, Aperçu, Publier…) et des onglets.
 * Tout est enregistré automatiquement ; les apprenants ne voient que la version publiée.
 */
import React, { useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Check, Plus, Trash2, Upload, X } from 'lucide-react';
import { evaluateStudioReadiness, isStudioQuestionComplete } from '../../personas';
import {
  appendAuditLog,
  buildDynamicCatalog,
  hasUnpublishedChanges,
  nextStudioVersion,
  studioSnapshot,
  type StudioContent
} from '../../wireframeData';
import { ActionMenu, ConfirmDialog, EmptyState, IconTile, ListCard, ListRow, RadioList, RowTitle, SavedIndicator, Select, SidePanel, StateTile, StatusDot, Tabs } from '../../components/ui';
import {
  AUDIENCE_LABEL,
  Checklist,
  contentStatus,
  DOMAINS,
  importMediaFile,
  MEDIA_ACCEPT,
  mediaPreviews,
  mediaRowState,
  stripNumbering,
  StudioShell,
  TYPE_LABEL,
  TypeIcon,
  type StudioProps
} from './shared';

type WsTab = 'content' | 'modules' | 'quiz' | 'media' | 'settings';
type Panel = 'none' | 'checks' | 'publish' | 'preview' | 'attach' | 'add-module';
type Question = NonNullable<StudioContent['quiz']>[number];

const move = <T,>(list: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

function StudioWorkspace({
  ext,
  updateExt,
  nav,
  selectedId,
  setToast,
  user,
  initialTab,
  initialPublish = false
}: StudioProps & { initialTab: WsTab; initialPublish?: boolean }) {
  const content = ext.studioContents.find((c) => c.id === selectedId);
  const isPath = content?.type === 'path';
  const [tab, setTab] = useState<WsTab>(() => {
    if (isPath) return initialTab === 'quiz' || initialTab === 'media' ? 'modules' : initialTab;
    return initialTab === 'modules' ? 'content' : initialTab;
  });
  const [panel, setPanel] = useState<Panel>(initialPublish ? 'publish' : 'none');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [activeSec, setActiveSec] = useState(0);
  const [activeQ, setActiveQ] = useState(0);
  const [kpDraft, setKpDraft] = useState<{ id: string; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Section ou question à supprimer, en attente de confirmation.
  const [pendingRemoval, setPendingRemoval] = useState<{ kind: 'section' | 'question'; index: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!content) {
    return (
      <StudioShell active="studio" nav={nav}>
        <div className="ui-list">
          <EmptyState
            title="Choisissez un contenu"
            text="Ouvrez un contenu depuis la liste pour le modifier."
            action={{ label: 'Voir mes contenus', onClick: () => nav('studio') }}
          />
        </div>
      </StudioShell>
    );
  }

  /* ---------------------------------------------- enregistrement automatique */
  const patch = (fn: (c: StudioContent) => StudioContent) => {
    updateExt((prev) => ({
      ...prev,
      studioContents: prev.studioContents.map((c) => {
        if (c.id !== content.id) return c;
        // Première modification d'un contenu publié : on fige d'abord ce que voient les apprenants.
        const base = c.pubStatus === 'Publié' && !c.published ? { ...c, published: studioSnapshot(c) } : c;
        return { ...fn(base), updatedAtMs: Date.now(), updatedAt: 'Modifié à l’instant' };
      })
    }));
    setSavedAt(Date.now());
  };

  const status = contentStatus(content);
  const readiness = evaluateStudioReadiness(content, { media: ext.studioMedia, contents: ext.studioContents });
  const pending = hasUnpublishedChanges(content);
  const isPublished = content.pubStatus === 'Publié';
  const targetVersion = isPublished ? nextStudioVersion(content.published?.version || content.version) : content.version;
  const nothingToPublish = isPublished && !pending;
  const actor = user?.name || 'Créateur habilité';

  /* ---------------------------------------------- sections */
  const sections = content.sections;
  const secIndex = Math.min(activeSec, Math.max(0, sections.length - 1));
  const sec = sections[secIndex];
  const patchSection = (p: Partial<StudioContent['sections'][number]>) =>
    patch((c) => ({ ...c, sections: c.sections.map((s, i) => (i === secIndex ? { ...s, ...p } : s)) }));
  const addSection = () => {
    patch((c) => ({
      ...c,
      sections: [...c.sections, { id: `sec-${Date.now().toString(36)}`, title: 'Nouvelle section', body: '' }]
    }));
    setActiveSec(sections.length);
  };
  const removeSection = (i: number) => {
    patch((c) => ({ ...c, sections: c.sections.filter((_, j) => j !== i) }));
    setActiveSec(Math.max(0, Math.min(secIndex, sections.length - 2)));
  };
  const moveSection = (i: number, to: number) => {
    patch((c) => ({ ...c, sections: move(c.sections, i, to) }));
    if (i === secIndex) setActiveSec(Math.max(0, Math.min(sections.length - 1, to)));
  };

  /* ---------------------------------------------- quiz (propre au contenu) */
  const quiz = content.quiz || [];
  const qIndex = Math.min(activeQ, Math.max(0, quiz.length - 1));
  const question = quiz[qIndex];
  const patchQuiz = (fn: (q: Question[]) => Question[]) =>
    patch((c) => {
      const next = fn(c.quiz || []);
      return { ...c, quiz: next.length ? next : undefined };
    });
  const patchQuestion = (p: Partial<Question>) => patchQuiz((q) => q.map((x, i) => (i === qIndex ? { ...x, ...p } : x)));
  const addQuestion = () => {
    patchQuiz((q) => [...q, { prompt: '', options: ['', ''], correctIndex: 0, explanation: '' }]);
    setActiveQ(quiz.length);
  };
  const passMark = Math.max(1, Math.ceil(quiz.length * 0.66));

  /* ---------------------------------------------- médias joints */
  const attached = (content.mediaIds || [])
    .map((id) => ext.studioMedia.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));
  const attachable = ext.studioMedia.filter((m) => !(content.mediaIds || []).includes(m.id));
  const attach = (id: string) => patch((c) => ({ ...c, mediaIds: [...(c.mediaIds || []), id] }));
  const detach = (id: string) => patch((c) => ({ ...c, mediaIds: (c.mediaIds || []).filter((x) => x !== id) }));
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const id = importMediaFile(file, updateExt, user?.name);
    attach(id);
    setPanel('none');
    setToast(`« ${file.name} » ajouté et joint au contenu`);
  };

  /* ---------------------------------------------- modules d'un parcours */
  const catalogModules = buildDynamicCatalog(ext).filter((c) => c.type === 'module');
  const moduleIds = content.pathModuleIds || [];
  const pathModules = moduleIds
    .map((id) => catalogModules.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));
  const addableModules = catalogModules.filter((m) => !moduleIds.includes(m.id));
  const isCompatible = (id: string) => {
    const source = ext.studioContents.find((c) => c.id === id);
    return !(source && source.audience === 'Privé' && content.audience !== 'Privé');
  };

  /* ---------------------------------------------- publication et validation */
  const publishNow = () => {
    updateExt((prev) => ({
      ...prev,
      studioContents: prev.studioContents.map((c) => {
        if (c.id !== content.id) return c;
        const next: StudioContent = {
          ...c,
          pubStatus: 'Publié',
          version: targetVersion,
          // Une validation pédagogique porte sur une version précise : une nouvelle version repart de zéro.
          reviewStatus: isPublished ? 'Non soumise' : c.reviewStatus,
          updatedAtMs: Date.now(),
          updatedAt: `Publié · ${targetVersion}`
        };
        return { ...next, published: studioSnapshot(next) };
      }),
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor,
        action: `Publication ${targetVersion}`,
        target: content.title,
        scope: `Studio · ${AUDIENCE_LABEL[content.audience]}`,
        result: 'Succès',
        justification: 'Vérifications satisfaites (sans validation pédagogique automatique).'
      })
    }));
    setPanel('none');
    setToast(`Version ${targetVersion} publiée · visible par : ${AUDIENCE_LABEL[content.audience]}`);
  };

  const submitReview = () => {
    updateExt((prev) => {
      const exists = prev.validationRequests.some((v) => v.contentId === content.id && v.version === content.version);
      const contentType = content.type === 'module' ? 'Module' : content.type === 'path' ? 'Parcours' : 'Ressource';
      const validationRequests = exists
        ? prev.validationRequests.map((v) =>
            v.contentId === content.id && v.version === content.version
              ? { ...v, status: 'Soumise' as const, submittedAt: 'À l’instant' }
              : v
          )
        : [
            {
              id: `VAL-2026-${String(prev.validationRequests.length + 1).padStart(3, '0')}`,
              contentId: content.id,
              title: content.title,
              contentType: contentType as 'Module' | 'Parcours' | 'Ressource',
              author: content.authorName || user?.name || 'Kossi Agbo',
              domain: content.domain,
              version: content.version,
              level: 'Validation pédagogique' as const,
              validator: 'À affecter',
              submittedAt: 'À l’instant',
              status: 'Soumise' as const,
              decisionNote: ''
            },
            ...prev.validationRequests
          ];
      return {
        ...prev,
        studioContents: prev.studioContents.map((c) =>
          c.id === content.id ? { ...c, reviewStatus: 'En revue', updatedAtMs: Date.now(), updatedAt: 'Soumis à validation' } : c
        ),
        validationRequests,
        auditLogs: appendAuditLog(prev.auditLogs, {
          actor,
          action: 'Soumission à validation pédagogique',
          target: `${content.title} (${content.version})`,
          scope: `Studio · ${content.domain}`,
          result: 'Succès',
          justification: 'Demande transmise à la file de validation.'
        })
      };
    });
    setPanel('none');
    setToast('Contenu soumis à validation pédagogique');
  };

  const deleteContent = () => {
    updateExt((prev) => ({ ...prev, studioContents: prev.studioContents.filter((c) => c.id !== content.id) }));
    setToast(`« ${content.title || 'Contenu'} » supprimé`);
    nav('studio');
  };

  const goFix = (t: WsTab) => {
    setTab(t);
    setPanel('none');
  };

  const tabs: { id: WsTab; label: string; count?: number }[] = isPath
    ? [
        { id: 'modules', label: 'Modules', count: pathModules.length },
        { id: 'content', label: 'Présentation' },
        { id: 'settings', label: 'Réglages' }
      ]
    : [
        { id: 'content', label: 'Contenu', count: sections.length },
        { id: 'quiz', label: 'Quiz', count: quiz.length },
        { id: 'media', label: 'Médias', count: attached.length },
        { id: 'settings', label: 'Réglages' }
      ];

  const reviewLabel =
    content.reviewStatus === 'En revue'
      ? 'Validation en cours'
      : content.reviewStatus === 'Validée' && !pending
        ? 'Version validée'
        : 'Soumettre à validation';
  const canSubmitReview = readiness.canPublish && reviewLabel === 'Soumettre à validation';

  return (
    <StudioShell active="studio" nav={nav}>
      <header className="sx-ws-head">
        <button type="button" className="ui-back-link" onClick={() => nav('studio')}>
          <ArrowLeft size={16} aria-hidden="true" /> Contenus
        </button>
        <div className="sx-ws-title">
          <IconTile>
            <TypeIcon type={content.type} />
          </IconTile>
          <input
            className="sx-title-input"
            aria-label="Titre du contenu"
            placeholder="Titre du contenu"
            value={content.title}
            maxLength={120}
            onChange={(e) => patch((c) => ({ ...c, title: e.target.value }))}
          />
        </div>
        <div className="sx-ws-bar">
          <div className="sx-ws-meta">
            <span>
              {TYPE_LABEL[content.type]} · {content.published?.version || content.version}
              {pending ? ` · ${targetVersion} en préparation` : ''}
            </span>
            <StatusDot tone={status.tone}>{status.label}</StatusDot>
            <SavedIndicator at={savedAt} />
          </div>
          <div className="sx-ws-actions">
            <button type="button" className="secondary ui-btn-sm" onClick={() => setPanel('checks')}>
              Vérifications {readiness.okCount}/{readiness.checks.length}
            </button>
            <button type="button" className="secondary ui-btn-sm" onClick={() => setPanel('preview')}>
              Aperçu
            </button>
            <button type="button" className="primary ui-btn-sm" onClick={() => setPanel('publish')}>
              Publier…
            </button>
          </div>
        </div>
      </header>

      <Tabs items={tabs} value={tab} onChange={setTab} label="Parties du contenu" />

      {/* ------------------------------------------------ Contenu / Présentation */}
      {tab === 'content' && (
        <>
          <div className="sx-split">
            <aside className="sx-outline" aria-label="Plan des sections">
              <ol>
                {sections.map((s, i) => (
                  <li key={s.id} className={i === secIndex ? 'is-active' : ''}>
                    <button type="button" className="sx-outline-item" aria-current={i === secIndex ? 'true' : undefined} onClick={() => setActiveSec(i)}>
                      <span className="sx-outline-num tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                      <span className="sx-outline-label">{stripNumbering(s.title) || 'Sans titre'}</span>
                    </button>
                    <ActionMenu
                      label={`Actions sur la section ${i + 1}`}
                      items={[
                        { label: 'Monter', onSelect: () => moveSection(i, i - 1), disabled: i === 0 },
                        { label: 'Descendre', onSelect: () => moveSection(i, i + 1), disabled: i === sections.length - 1 },
                        { label: 'Supprimer', danger: true, onSelect: () => setPendingRemoval({ kind: 'section', index: i }), disabled: sections.length <= 1 }
                      ]}
                    />
                  </li>
                ))}
              </ol>
              <button type="button" className="li-text-link sx-add" onClick={addSection}>
                <Plus size={16} aria-hidden="true" /> Ajouter une section
              </button>
            </aside>

            <div className="sx-editor">
              {sec ? (
                <>
                  <label className="ui-field">
                    <span>Titre de la section</span>
                    <input value={sec.title} maxLength={120} onChange={(e) => patchSection({ title: e.target.value })} />
                  </label>
                  <label className="ui-field">
                    <span>Texte</span>
                    <textarea
                      rows={10}
                      value={sec.body}
                      placeholder="Expliquez la notion comme à un apprenant…"
                      onChange={(e) => patchSection({ body: e.target.value })}
                    />
                  </label>
                  {!isPath && (
                    <>
                      <label className="ui-field">
                        <span>Points clés</span>
                        <textarea
                          rows={3}
                          value={kpDraft?.id === sec.id ? kpDraft.text : (sec.keyPoints || []).join('\n')}
                          placeholder="Un point par ligne"
                          onChange={(e) => {
                            setKpDraft({ id: sec.id, text: e.target.value });
                            patchSection({
                              keyPoints: e.target.value
                                .split('\n')
                                .map((k) => k.trim())
                                .filter(Boolean)
                            });
                          }}
                        />
                        <small>Un point par ligne. Ils s’affichent en liste à la fin de la section.</small>
                      </label>
                      <label className="ui-field">
                        <span>Réflexe clé</span>
                        <input
                          value={sec.tip || ''}
                          maxLength={200}
                          placeholder="Le conseil à retenir en une phrase"
                          onChange={(e) => patchSection({ tip: e.target.value })}
                        />
                      </label>
                    </>
                  )}
                </>
              ) : (
                <EmptyState title="Aucune section" action={{ label: 'Ajouter une section', onClick: addSection }} />
              )}
            </div>
          </div>

          {!isPath && (content.steps?.length || 0) > 0 && (
            <section className="sx-card" aria-label="Fiche illustrée pas à pas">
              <h2>Fiche illustrée pas à pas</h2>
              <ol className="sx-steps">
                {content.steps!.map((st, i) => (
                  <li key={i}>
                    {st.imageUrl ? <img src={st.imageUrl} alt="" loading="lazy" /> : <span className="sx-step-noimg tabular-nums">{i + 1}</span>}
                    <input
                      aria-label={`Légende de l’étape ${i + 1}`}
                      value={st.caption}
                      maxLength={200}
                      onChange={(e) =>
                        patch((c) => ({ ...c, steps: (c.steps || []).map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)) }))
                      }
                    />
                    <button
                      type="button"
                      className="li-icon-btn"
                      aria-label={`Retirer l’étape ${i + 1}`}
                      title="Retirer l’étape"
                      onClick={() =>
                        patch((c) => {
                          const next = (c.steps || []).filter((_, j) => j !== i);
                          return { ...c, steps: next.length ? next : undefined };
                        })
                      }
                    >
                      <X size={18} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}

      {/* ------------------------------------------------ Quiz */}
      {tab === 'quiz' &&
        (quiz.length === 0 ? (
          <div className="ui-list">
            <EmptyState
              title="Aucune question"
              text={
                content.type === 'module'
                  ? 'Un module se termine par un quiz : ajoutez au moins une question à choix unique.'
                  : 'Le quiz est facultatif pour une ressource.'
              }
              action={{ label: 'Ajouter une question', onClick: addQuestion }}
            />
          </div>
        ) : (
          <div className="sx-split">
            <aside className="sx-outline" aria-label="Questions du quiz">
              <ol>
                {quiz.map((q, i) => (
                  <li key={i} className={i === qIndex ? 'is-active' : ''}>
                    <button type="button" className="sx-outline-item" aria-current={i === qIndex ? 'true' : undefined} onClick={() => setActiveQ(i)}>
                      <span className="sx-outline-num tabular-nums">Q{i + 1}</span>
                      <span className="sx-outline-label">{q.prompt || 'Question à rédiger'}</span>
                      {!isStudioQuestionComplete(q) && <i className="sx-outline-dot" title="À compléter" />}
                    </button>
                    <ActionMenu
                      label={`Actions sur la question ${i + 1}`}
                      items={[
                        { label: 'Monter', onSelect: () => (patchQuiz((x) => move(x, i, i - 1)), setActiveQ(Math.max(0, i - 1))), disabled: i === 0 },
                        {
                          label: 'Descendre',
                          onSelect: () => (patchQuiz((x) => move(x, i, i + 1)), setActiveQ(Math.min(quiz.length - 1, i + 1))),
                          disabled: i === quiz.length - 1
                        },
                        {
                          label: 'Supprimer',
                          danger: true,
                          onSelect: () => setPendingRemoval({ kind: 'question', index: i })
                        }
                      ]}
                    />
                  </li>
                ))}
              </ol>
              <button type="button" className="li-text-link sx-add" onClick={addQuestion}>
                <Plus size={16} aria-hidden="true" /> Ajouter une question
              </button>
              <p className="sx-note">
                Réussite à partir de {passMark} bonne{passMark > 1 ? 's' : ''} réponse{passMark > 1 ? 's' : ''} sur {quiz.length}.
              </p>
            </aside>

            <div className="sx-editor">
              <label className="ui-field">
                <span>Question</span>
                <textarea rows={2} value={question.prompt} maxLength={300} onChange={(e) => patchQuestion({ prompt: e.target.value })} />
              </label>
              <fieldset className="sx-options">
                <legend>Réponses — cochez la bonne</legend>
                {question.options.map((opt, oi) => (
                  <div key={oi} className="sx-option">
                    <input
                      type="radio"
                      name={`correct-${content.id}-${qIndex}`}
                      aria-label={`Réponse ${oi + 1} : bonne réponse`}
                      checked={question.correctIndex === oi}
                      onChange={() => patchQuestion({ correctIndex: oi })}
                    />
                    <input
                      aria-label={`Texte de la réponse ${oi + 1}`}
                      value={opt}
                      maxLength={160}
                      placeholder={`Réponse ${oi + 1}`}
                      onChange={(e) => patchQuestion({ options: question.options.map((o, j) => (j === oi ? e.target.value : o)) })}
                    />
                    <button
                      type="button"
                      className="li-icon-btn"
                      aria-label={`Retirer la réponse ${oi + 1}`}
                      title="Retirer la réponse"
                      disabled={question.options.length <= 2}
                      onClick={() =>
                        patchQuestion({
                          options: question.options.filter((_, j) => j !== oi),
                          correctIndex:
                            question.correctIndex === oi ? 0 : question.correctIndex > oi ? question.correctIndex - 1 : question.correctIndex
                        })
                      }
                    >
                      <X size={18} aria-hidden="true" />
                    </button>
                  </div>
                ))}
                {question.options.length < 5 && (
                  <button type="button" className="li-text-link sx-add" onClick={() => patchQuestion({ options: [...question.options, ''] })}>
                    <Plus size={16} aria-hidden="true" /> Ajouter une réponse
                  </button>
                )}
              </fieldset>
              <label className="ui-field">
                <span>Explication affichée après la correction</span>
                <textarea rows={3} value={question.explanation} maxLength={400} onChange={(e) => patchQuestion({ explanation: e.target.value })} />
              </label>
            </div>
          </div>
        ))}

      {/* ------------------------------------------------ Médias joints */}
      {tab === 'media' && (
        <>
          <div className="sx-tab-actions">
            <button type="button" className="secondary ui-btn-sm" onClick={() => setPanel('attach')}>
              <Plus size={16} aria-hidden="true" /> Joindre un média
            </button>
          </div>
          <ListCard label="Médias joints">
            {attached.length === 0 ? (
              <EmptyState title="Aucun média joint" text="Joignez une image, une vidéo ou un document de votre bibliothèque." />
            ) : (
              attached.map((m) => (
                <ListRow
                  key={m.id}
                  leading={
                    mediaPreviews.get(m.id) && m.kind === 'Image' ? (
                      <StateTile state={mediaRowState(m.state)} plain>
                        <img className="sx-thumb" src={mediaPreviews.get(m.id)} alt="" />
                      </StateTile>
                    ) : (
                      <StateTile state={mediaRowState(m.state)}>
                        <Upload size={20} aria-hidden="true" />
                      </StateTile>
                    )
                  }
                  title={
                    <RowTitle state={mediaRowState(m.state)} hint={m.state === 'Disponible' ? undefined : m.state}>
                      {m.filename}
                    </RowTitle>
                  }
                  meta={`${m.kind} · ${m.kind === 'Image' ? m.altText || 'Texte alternatif à renseigner' : m.rights || 'Droits à préciser'}`}
                  trailing={
                    <>
                      <button type="button" className="secondary ui-btn-sm" onClick={() => detach(m.id)}>
                        Retirer
                      </button>
                    </>
                  }
                />
              ))
            )}
          </ListCard>
          <p className="sx-note">
            Le texte alternatif et les droits se modifient dans{' '}
            <button type="button" className="li-text-link" onClick={() => nav('studio-media')}>
              Médias
            </button>
            .
          </p>
        </>
      )}

      {/* ------------------------------------------------ Modules d'un parcours */}
      {tab === 'modules' && (
        <>
          <div className="sx-tab-actions">
            <button type="button" className="secondary ui-btn-sm" onClick={() => setPanel('add-module')} disabled={addableModules.length === 0}>
              <Plus size={16} aria-hidden="true" /> Ajouter un module
            </button>
          </div>
          <ListCard label="Modules du parcours">
            {pathModules.length === 0 ? (
              <EmptyState title="Aucun module" text="Un parcours réunit au moins deux modules, dans l’ordre conseillé." />
            ) : (
              pathModules.map((m, i) => (
                <ListRow
                  key={m.id}
                  leading={<span className="sx-order tabular-nums">{String(i + 1).padStart(2, '0')}</span>}
                  title={
                    <RowTitle state={isCompatible(m.id) ? 'ok' : 'alert'} hint={isCompatible(m.id) ? undefined : 'Non accessible à cette audience'}>
                      {m.title}
                    </RowTitle>
                  }
                  meta={`${m.domain} · ${m.level} · ${m.duration} · ${m.version}`}
                  trailing={
                    <>
                      <button
                        type="button"
                        className="li-icon-btn"
                        aria-label={`Monter ${m.title}`}
                        disabled={i === 0}
                        onClick={() => patch((c) => ({ ...c, pathModuleIds: move(c.pathModuleIds || [], i, i - 1) }))}
                      >
                        <ArrowUp size={18} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="li-icon-btn"
                        aria-label={`Descendre ${m.title}`}
                        disabled={i === pathModules.length - 1}
                        onClick={() => patch((c) => ({ ...c, pathModuleIds: move(c.pathModuleIds || [], i, i + 1) }))}
                      >
                        <ArrowDown size={18} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="li-icon-btn"
                        aria-label={`Retirer ${m.title} du parcours`}
                        title="Retirer du parcours"
                        onClick={() => patch((c) => ({ ...c, pathModuleIds: (c.pathModuleIds || []).filter((x) => x !== m.id) }))}
                      >
                        <Trash2 size={18} aria-hidden="true" />
                      </button>
                    </>
                  }
                />
              ))
            )}
          </ListCard>
        </>
      )}

      {/* ------------------------------------------------ Réglages */}
      {tab === 'settings' && (
        <>
          <section className="sx-card sx-form" aria-label="Réglages du contenu">
            <div className="sx-form-row">
              <label className="ui-field">
                <span>Domaine</span>
                <Select value={content.domain} onChange={(e) => patch((c) => ({ ...c, domain: e.target.value as StudioContent['domain'] }))}>
                  {DOMAINS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="ui-field">
                <span>Durée estimée</span>
                <input value={content.duration} placeholder="Ex. 15 min" maxLength={30} onChange={(e) => patch((c) => ({ ...c, duration: e.target.value }))} />
              </label>
            </div>
            <label className="ui-field">
              <span>Sources et droits</span>
              <input
                value={content.sources === 'À préciser' ? '' : content.sources}
                placeholder="Ex. Support original · licence pédagogique interne"
                maxLength={240}
                onChange={(e) => patch((c) => ({ ...c, sources: e.target.value }))}
              />
              <small>D’où vient ce contenu et avec quels droits il est partagé.</small>
            </label>
            <div className="ui-field">
              <span>Audience</span>
              <RadioList
                name={`audience-${content.id}`}
                legend="Audience"
                value={content.audience}
                onChange={(v) => patch((c) => ({ ...c, audience: v }))}
                options={[
                  { value: 'Membres autorisés', label: 'Membres', hint: 'Tous les membres connectés.' },
                  { value: 'Privé', label: 'Moi uniquement', hint: 'Visible par vous seul, même une fois publié.' },
                  { value: 'Public', label: 'Public', hint: 'Visible aussi sans compte.' }
                ]}
              />
            </div>
          </section>
          <section className="sx-card sx-danger-zone" aria-label="Suppression">
            <div>
              <b>Supprimer ce contenu</b>
              <small>{isPublished ? 'Il disparaîtra aussi de la bibliothèque des apprenants.' : 'Le brouillon sera définitivement supprimé.'}</small>
            </div>
            <button type="button" className="secondary ui-btn-sm danger" onClick={() => setConfirmDelete(true)}>
              Supprimer
            </button>
          </section>
        </>
      )}

      {/* ------------------------------------------------ Panneaux */}
      <SidePanel open={panel === 'checks'} title="Vérifications" onClose={() => setPanel('none')}>
        <Checklist report={readiness} onFix={goFix} />
      </SidePanel>

      <SidePanel
        open={panel === 'publish'}
        title="Publier"
        onClose={() => setPanel('none')}
        footer={
          <>
            <button type="button" className="secondary ui-btn-sm" disabled={!canSubmitReview} onClick={submitReview}>
              {reviewLabel}
            </button>
            <button type="button" className="primary ui-btn-sm" disabled={!readiness.canPublish || nothingToPublish} onClick={publishNow}>
              {nothingToPublish ? `${content.version} en ligne` : `Publier la ${targetVersion}`}
            </button>
          </>
        }
      >
        <Checklist report={readiness} onFix={goFix} />
        <div className="ui-field">
          <span>Audience</span>
          <RadioList
            name={`publish-audience-${content.id}`}
            legend="Audience"
            value={content.audience}
            onChange={(v) => patch((c) => ({ ...c, audience: v }))}
            options={[
              { value: 'Membres autorisés', label: 'Membres' },
              { value: 'Privé', label: 'Moi uniquement' },
              { value: 'Public', label: 'Public' }
            ]}
          />
        </div>
        <p className="sx-note">
          {nothingToPublish
            ? `La ${content.version} est en ligne. Aucune modification à publier.`
            : !readiness.canPublish
              ? `${readiness.blockingCount} point${readiness.blockingCount > 1 ? 's' : ''} bloquant${readiness.blockingCount > 1 ? 's' : ''} à corriger avant de publier.`
              : `La ${targetVersion} sera visible par : ${AUDIENCE_LABEL[content.audience]}. Publier ne vaut pas validation pédagogique.`}
        </p>
      </SidePanel>

      <SidePanel open={panel === 'preview'} title="Aperçu apprenant" onClose={() => setPanel('none')} wide>
        <article className="sx-preview">
          <p className="sx-preview-meta">
            {TYPE_LABEL[content.type]} · {content.domain}
            {content.duration ? ` · ${content.duration}` : ''}
          </p>
          <h3>{content.title || 'Sans titre'}</h3>
          {isPath && pathModules.length > 0 && (
            <ol className="sx-preview-modules">
              {pathModules.map((m) => (
                <li key={m.id}>{m.title}</li>
              ))}
            </ol>
          )}
          {sections.map((s, i) => (
            <section key={s.id}>
              <h4>
                {isPath ? '' : `${String(i + 1).padStart(2, '0')} · `}
                {stripNumbering(s.title) || 'Sans titre'}
              </h4>
              <p>{s.body || 'Texte à rédiger.'}</p>
              {(s.keyPoints || []).length > 0 && (
                <ul>
                  {s.keyPoints!.map((k) => (
                    <li key={k}>{k}</li>
                  ))}
                </ul>
              )}
              {s.tip && <p className="sx-preview-tip">Réflexe : {s.tip}</p>}
            </section>
          ))}
          {(content.steps || []).length > 0 && (
            <section>
              <h4>Fiche pas à pas</h4>
              <ol className="sx-preview-steps">
                {content.steps!.map((st, i) => (
                  <li key={i}>
                    {st.imageUrl && <img src={st.imageUrl} alt="" loading="lazy" />}
                    <span>{st.caption}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
          {quiz.length > 0 && (
            <section>
              <h4>Quiz · {quiz.length} question{quiz.length > 1 ? 's' : ''}</h4>
              {quiz.map((q, i) => (
                <div key={i} className="sx-preview-q">
                  <b>
                    {i + 1}. {q.prompt || 'Question à rédiger'}
                  </b>
                  <ul>
                    {q.options.map((o, oi) => (
                      <li key={oi} className={oi === q.correctIndex ? 'is-correct' : ''}>
                        {oi === q.correctIndex && <Check size={14} aria-hidden="true" />} {o || '—'}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}
        </article>
      </SidePanel>

      <SidePanel
        open={panel === 'attach'}
        title="Joindre un média"
        onClose={() => setPanel('none')}
        footer={
          <button type="button" className="secondary ui-btn-sm" onClick={() => fileRef.current?.click()}>
            <Upload size={16} aria-hidden="true" /> Importer un fichier
          </button>
        }
      >
        <input ref={fileRef} type="file" accept={MEDIA_ACCEPT} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onFile} />
        <ListCard label="Bibliothèque de médias">
          {attachable.length === 0 ? (
            <EmptyState title="Bibliothèque vide" text="Importez un fichier pour le joindre à ce contenu." />
          ) : (
            attachable.map((m) => (
              <ListRow
                key={m.id}
                title={
                  <RowTitle state={mediaRowState(m.state)} hint={m.state === 'Disponible' ? undefined : m.state}>
                    {m.filename}
                  </RowTitle>
                }
                meta={m.kind}
                onClick={() => {
                  attach(m.id);
                  setPanel('none');
                }}
              />
            ))
          )}
        </ListCard>
      </SidePanel>

      <SidePanel open={panel === 'add-module'} title="Ajouter un module" onClose={() => setPanel('none')}>
        <ListCard label="Modules disponibles">
          {addableModules.length === 0 ? (
            <EmptyState title="Tous les modules sont déjà dans le parcours" />
          ) : (
            addableModules.map((m) => (
              <ListRow
                key={m.id}
                title={m.title}
                meta={`${m.domain} · ${m.level} · ${m.duration}`}
                onClick={() => {
                  patch((c) => ({ ...c, pathModuleIds: [...(c.pathModuleIds || []), m.id] }));
                  setPanel('none');
                }}
              />
            ))
          )}
        </ListCard>
      </SidePanel>

      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer ce contenu ?"
        text={
          isPublished
            ? `« ${content.title} » est publié : il disparaîtra de la bibliothèque des apprenants. Cette action est définitive.`
            : `« ${content.title || 'Ce brouillon'} » sera définitivement supprimé.`
        }
        confirmLabel="Supprimer"
        danger
        onConfirm={deleteContent}
        onCancel={() => setConfirmDelete(false)}
      />

      <ConfirmDialog
        open={Boolean(pendingRemoval)}
        title={pendingRemoval?.kind === 'question' ? 'Supprimer cette question ?' : 'Supprimer cette section ?'}
        text={
          pendingRemoval?.kind === 'question'
            ? 'La question et ses réponses seront retirées du quiz.'
            : 'La section et tout son contenu seront retirés du module.'
        }
        confirmLabel="Supprimer"
        danger
        onConfirm={() => {
          const target = pendingRemoval;
          setPendingRemoval(null);
          if (!target) return;
          if (target.kind === 'section') removeSection(target.index);
          else {
            patchQuiz((x) => x.filter((_, j) => j !== target.index));
            setActiveQ(Math.max(0, Math.min(qIndex, quiz.length - 2)));
          }
        }}
        onCancel={() => setPendingRemoval(null)}
      />
    </StudioShell>
  );
}

export const StudioEditorView = (p: StudioProps) => <StudioWorkspace key={p.selectedId} {...p} initialTab="content" />;
export const StudioQuizView = (p: StudioProps) => <StudioWorkspace key={p.selectedId} {...p} initialTab="quiz" />;
export const StudioPathView = (p: StudioProps) => <StudioWorkspace key={p.selectedId} {...p} initialTab="modules" />;
export const StudioPublishView = (p: StudioProps) => <StudioWorkspace key={p.selectedId} {...p} initialTab="content" initialPublish />;
