import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BarChart2,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Eye,
  FileText,
  Image as ImageIcon,
  Layers,
  ListChecks,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  User
} from 'lucide-react';
import {
  buildDynamicCatalog,
  appendAuditLog,
  type CatalogType,
  type ExtendedDemoState,
  type StudioContent
} from '../wireframeData';
import type { Profile, Progress } from '../data';
import { MODULES_CONTENT } from '../content';
import { moduleProgressPercent } from '../domain.mjs';
import { evaluateStudioReadiness } from '../personas';
import { ContentTypeMark } from '../components/CatalogVisuals';

interface StudioProps {
  ext: ExtendedDemoState;
  updateExt: (fn: (prev: ExtendedDemoState) => ExtendedDemoState) => void;
  nav: (page: any, id?: string) => void;
  selectedId: string;
  setToast: (msg: string) => void;
  user?: Profile;
  progress?: Progress;
}

function StudioShell({
  active,
  nav,
  selectedId,
  stepOverride,
  onPublishStep,
  children
}: {
  active: string;
  nav: (page: any, id?: string) => void;
  user?: Profile;
  ext?: ExtendedDemoState;
  selectedId?: string;
  stepOverride?: number;
  onPublishStep?: () => void;
  children: React.ReactNode;
}) {
  const studioNav = [
    { id: 'studio', label: 'Mes contenus' },
    { id: 'studio-editor', label: 'Éditeur' },
    { id: 'studio-quiz', label: 'Quiz' },
    { id: 'studio-media', label: 'Médias' },
    { id: 'studio-path', label: 'Parcours' },
    { id: 'studio-ocr', label: 'Import & OCR' },
    { id: 'studio-publish', label: 'Publication' },
    { id: 'studio-stats', label: 'Statistiques' },
    { id: 'studio-profile', label: 'Profil créateur' }
  ];

  const showStepper = ['studio', 'studio-editor', 'studio-quiz', 'studio-media', 'studio-path', 'studio-publish'].includes(
    active
  );

  const currentStep =
    stepOverride ??
    (active === 'studio'
      ? 1
      : active === 'studio-editor' || active === 'studio-path'
        ? 2
        : active === 'studio-quiz' || active === 'studio-media'
          ? 3
          : active === 'studio-publish'
            ? 4
            : 1);

  const steps = [
    { num: 1, label: 'Type & Métadonnées', action: () => nav('studio', selectedId) },
    { num: 2, label: 'Édition', action: () => nav('studio-editor', selectedId) },
    { num: 3, label: 'Quiz & Médias', action: () => nav('studio-quiz', selectedId) },
    { num: 4, label: 'Aperçu & Contrôle', action: () => nav('studio-publish', selectedId) },
    {
      num: 5,
      label: 'Publier',
      action: () => {
        if (active === 'studio-publish' && onPublishStep) onPublishStep();
        else nav('studio-publish', selectedId);
      }
    }
  ];

  return (
    <div className="workspace-main">
      <div className="workspace-mobile-nav" role="navigation" aria-label="Navigation Knowledge Studio mobile">
        {studioNav.map((item) => (
          <button
            key={item.id}
            type="button"
            className={active === item.id ? 'active' : ''}
            onClick={() => nav(item.id, selectedId)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {showStepper && (
        <nav className="studio-stepper" aria-label="Parcours guidé de création">
          {steps.map((s) => (
            <button
              key={s.num}
              type="button"
              className={`studio-step-btn ${currentStep === s.num ? 'active' : ''}`}
              aria-current={currentStep === s.num ? 'step' : undefined}
              onClick={s.action}
            >
              <span className="studio-step-num">{s.num}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </nav>
      )}

      {children}
    </div>
  );
}

export function StudioHomeView({ ext, updateExt, nav, setToast, user }: StudioProps) {
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'fix'>('all');
  const [search, setSearch] = useState('');

  const createNew = (type: CatalogType) => {
    const id = `st-${Date.now()}`;
    const label = type === 'module' ? 'Nouveau module' : type === 'path' ? 'Nouveau parcours' : 'Nouvelle fiche';
    const item: StudioContent = {
      id,
      type,
      title: `${label} sans titre`,
      domain: 'Numérique',
      version: 'v1',
      pubStatus: 'Brouillon',
      reviewStatus: 'Non soumise',
      audience: 'Membres autorisés',
      duration: '10 min',
      sources: 'Support original',
      updatedAt: 'Brouillon créé à l’instant',
      sections: [{ id: 'sec-1', title: '01 Introduction', body: 'Rédigez le contenu de cette section…' }]
    };
    updateExt((prev) => ({ ...prev, studioContents: [item, ...prev.studioContents] }));
    setToast('Brouillon créé (non publié)');
    if (type === 'path') nav('studio-path', id);
    else nav('studio-editor', id);
  };

  const items = ext.studioContents.filter((c) => {
    if (filter === 'draft' && c.pubStatus !== 'Brouillon') return false;
    if (filter === 'published' && c.pubStatus !== 'Publié') return false;
    if (filter === 'fix' && c.reviewStatus !== 'À corriger') return false;
    if (search.trim() && !c.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <StudioShell active="studio" nav={nav} user={user} ext={ext}>
      <div className="page-heading">
        <span className="eyebrow">ESPACE CRÉATEUR · KNOWLEDGE STUDIO</span>
        <h1>Mes contenus pédagogiques</h1>
        <p>
          La création et la publication sont des capacités distinctes. Aucune publication n’est automatique lors de
          la création d’un brouillon.
        </p>
      </div>

      <section className="wf-card wf-mb">
        <h3>Créer un contenu</h3>
        <div className="wf-create-grid">
          <button className="wf-create-btn" onClick={() => createNew('resource')}>
            <FileText size={20} />
            <b>Ressource autonome</b>
            <span>Fiche, mémo ou document court</span>
          </button>
          <button className="wf-create-btn" onClick={() => createNew('module')}>
            <BookOpen size={20} />
            <b>Module structuré</b>
            <span>Sections, leçons et quiz</span>
          </button>
          <button className="wf-create-btn" onClick={() => createNew('path')}>
            <Layers size={20} />
            <b>Parcours</b>
            <span>Suite ordonnée de modules</span>
          </button>
        </div>
      </section>

      <div className="catalog-tabs-underline" role="tablist" aria-label="Filtrer par statut">
        {[
          { id: 'all', label: 'Tous' },
          { id: 'draft', label: 'Brouillons' },
          { id: 'published', label: 'Publiés' },
          { id: 'fix', label: 'À corriger' }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={filter === t.id}
            className={filter === t.id ? 'selected' : ''}
            onClick={() => setFilter(t.id as any)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="catalog-filter-bar">
        <div className="catalog-search-inline">
          <Search size={16} aria-hidden="true" />
          <input
            aria-label="Rechercher dans mes contenus"
            placeholder="Rechercher par titre…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="wf-stack">
        {items.map((item) => (
          <div className="wf-card wf-studio-row" key={item.id}>
            <div>
              <div className="wf-inline-actions">
                <ContentTypeMark type={item.type} extra={item.version} />
                <span className={`status-tag ${item.pubStatus === 'Publié' ? 'ok' : ''}`}>{item.pubStatus}</span>
                {item.reviewStatus === 'À corriger' ? (
                  <span className="status-tag warn">Revue : {item.reviewStatus}</span>
                ) : (
                  <span className="inline-meta">Revue : {item.reviewStatus}</span>
                )}
              </div>
              <h3>{item.title}</h3>
              <small className="muted">
                {item.domain} · {item.updatedAt}
              </small>
            </div>
            <div className="wf-inline-actions">
              <button className="secondary" onClick={() => nav('studio-editor', item.id)}>
                Éditer
              </button>
              <button className="primary" onClick={() => nav('studio-publish', item.id)}>
                Contrôler / Publier
              </button>
            </div>
          </div>
        ))}
      </div>
    </StudioShell>
  );
}


export function StudioEditorView({ ext, updateExt, nav, selectedId, setToast, user }: StudioProps) {
  const content = ext.studioContents.find((c) => c.id === selectedId) || ext.studioContents[0];
  const [secIdx, setSecIdx] = useState(0);
  const [saveState, setSaveState] = useState<'saved' | 'dirty'>('saved');

  if (!content) return null;
  const activeSection = content.sections[secIdx] || content.sections[0];

  const patchContent = (patch: Partial<StudioContent>) => {
    setSaveState('dirty');
    updateExt((prev) => ({
      ...prev,
      studioContents: prev.studioContents.map((c) =>
        c.id === content.id ? { ...c, ...patch, updatedAt: 'Enregistré à l’instant' } : c
      )
    }));
  };

  const moveSection = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= content.sections.length) return;
    const copy = [...content.sections];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    patchContent({ sections: copy });
    setSecIdx(target);
  };

  const addSection = () => {
    const next = [
      ...content.sections,
      {
        id: `s-${Date.now()}`,
        title: `0${content.sections.length + 1} Nouvelle section`,
        body: 'Contenu pédagogique à rédiger…'
      }
    ];
    patchContent({ sections: next });
    setSecIdx(next.length - 1);
  };

  const confirmSave = () => {
    setSaveState('saved');
    setToast('Brouillon sauvegardé (version locale confirmée)');
  };

  const readiness = evaluateStudioReadiness(content, ext.studioQuiz, ext.studioMedia);

  return (
    <StudioShell active="studio-editor" nav={nav} user={user} ext={ext} selectedId={content.id}>
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <div className="between wf-mb">
            <div>
              <span className="eyebrow">ÉDITEUR DE CONTENU</span>
              <h1>{content.title}</h1>
            </div>
            <div className="wf-inline-actions">
              <span className={`status-tag ${saveState === 'saved' ? 'ok' : 'warn'}`}>
                {saveState === 'saved' ? 'Enregistré' : 'Modifié localement'}
              </span>
              <button className="secondary" onClick={() => nav('studio-publish', content.id)}>
                <Eye size={15} /> Aperçu & Contrôle
              </button>
            </div>
          </div>

          <div className="wf-editor-split">
        <aside className="wf-card">
          <div className="between wf-mb-sm">
            <b>Structure</b>
            <button className="text-link" onClick={addSection}>
              <Plus size={14} /> Section
            </button>
          </div>
          <div className="wf-stack-sm">
            {content.sections.map((s, i) => (
              <div className={`wf-sec-item ${i === secIdx ? 'active' : ''}`} key={s.id}>
                <button className="wf-sec-btn" onClick={() => setSecIdx(i)}>
                  {s.title}
                </button>
                <div className="wf-reorder-btns">
                  <button
                    aria-label="Monter la section"
                    disabled={i === 0}
                    onClick={() => moveSection(i, -1)}
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    aria-label="Descendre la section"
                    disabled={i === content.sections.length - 1}
                    onClick={() => moveSection(i, 1)}
                  >
                    <ArrowDown size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="wf-divider" />
          <button className="secondary wf-full-btn" onClick={() => nav('studio-quiz')}>
            Éditer le quiz
          </button>
          <button className="secondary wf-full-btn wf-mt-sm" onClick={() => nav('studio-media')}>
            Insérer un média
          </button>
        </aside>

        <section className="wf-card wf-form-stack">
          <label>
            Titre du contenu
            <input value={content.title} onChange={(e) => patchContent({ title: e.target.value })} />
          </label>
          <div className="wf-two-inputs">
            <label>
              Domaine
              <select
                value={content.domain}
                onChange={(e) => patchContent({ domain: e.target.value as any })}
              >
                <option value="Numérique">Numérique</option>
                <option value="Communication">Communication</option>
                <option value="Gestion">Gestion</option>
              </select>
            </label>
            <label>
              Durée estimée
              <input
                placeholder="Ex. 15 min"
                value={content.duration}
                onChange={(e) => patchContent({ duration: e.target.value })}
              />
            </label>
          </div>

          <label>
            Sources et droits déclarés
            <input value={content.sources} onChange={(e) => patchContent({ sources: e.target.value })} />
          </label>

          {activeSection && (
            <>
              <div className="wf-divider" />
              <label>
                Titre de la section active
                <input
                  value={activeSection.title}
                  onChange={(e) =>
                    patchContent({
                      sections: content.sections.map((s, idx) =>
                        idx === secIdx ? { ...s, title: e.target.value } : s
                      )
                    })
                  }
                />
              </label>
              <label>
                Corps de la section
                <textarea
                  rows={7}
                  value={activeSection.body}
                  onChange={(e) =>
                    patchContent({
                      sections: content.sections.map((s, idx) =>
                        idx === secIdx ? { ...s, body: e.target.value } : s
                      )
                    })
                  }
                />
              </label>
            </>
          )}

          <div className="lesson-actions">
            <button className="secondary" onClick={confirmSave}>
              Confirmer la sauvegarde
            </button>
            <button className="primary" onClick={() => nav('studio-publish', content.id)}>
              Contrôler avant publication <ArrowRight size={15} />
            </button>
          </div>
        </section>
      </div>
        </div>

        <aside className="right-rail" aria-label="Liste de contrôle avant publication">
          <section className="rail-card studio-checklist-card">
            <span className="eyebrow">PRÉPARATION PUBLICATION</span>
            <h3>
              {readiness.canPublish
                ? 'Prêt pour contrôle final'
                : `${readiness.blockingCount} point(s) bloquant(s)`}
            </h3>
            {readiness.checks.map((ck) => (
              <div className="studio-check-row" key={ck.id}>
                <div>
                  <b>{ck.label}</b>
                  <div className="tiny muted">{ck.detail}</div>
                </div>
                {ck.ok ? (
                  <CheckCircle2 size={16} className="studio-check-icon-ok" aria-label="Conforme" />
                ) : (
                  <AlertTriangle size={16} className="studio-check-icon-warn" aria-label="À compléter" />
                )}
              </div>
            ))}
            <button className="secondary wf-full-btn" onClick={() => nav('studio-publish', content.id)}>
              <Eye size={15} /> Passer à l’aperçu
            </button>
          </section>

          <section className="rail-card">
            <span className="eyebrow">APERÇU SECTION</span>
            <h3>{activeSection?.title || 'Section'}</h3>
            <p className="tiny muted">
              {(activeSection?.body || '').slice(0, 140)}
              {(activeSection?.body || '').length > 140 ? '…' : ''}
            </p>
          </section>
        </aside>
      </div>
    </StudioShell>
  );
}

export function StudioQuizView({ ext, updateExt, nav, setToast, user }: StudioProps) {
  const qData = ext.studioQuiz;
  const [selectedQ, setSelectedQ] = useState(0);
  const currentQ = qData.questions[selectedQ] || qData.questions[0];

  const updateQuiz = (fn: (q: typeof qData) => typeof qData) => {
    updateExt((prev) => ({ ...prev, studioQuiz: fn(prev.studioQuiz) }));
  };

  const totalPoints = qData.questions.reduce((acc, q) => acc + q.points, 0);
  const thresholdError = qData.passingScore > totalPoints || qData.passingScore < 1;

  const addQuestion = () => {
    const newQ = {
      id: `sq-${Date.now()}`,
      prompt: 'Nouvelle question à choix unique',
      options: ['Option A', 'Option B'],
      correctIndex: 0,
      explanation: 'Explication pédagogique après soumission.',
      points: 1
    };
    updateQuiz((q) => ({ ...q, questions: [...q.questions, newQ] }));
    setSelectedQ(qData.questions.length);
  };

  return (
    <StudioShell active="studio-quiz" nav={nav} user={user} ext={ext}>
      <div className="between wf-mb">
        <div>
          <span className="eyebrow">ÉDITEUR DE QUIZ · CHOIX UNIQUE</span>
          <h1>{qData.title}</h1>
        </div>
        <button
          className="secondary"
          onClick={() =>
            setToast('Aperçu quiz : aucune tentative consommée et aucun XP attribué en mode test.')
          }
        >
          <Eye size={15} /> Tester en aperçu
        </button>
      </div>

      <div className="wf-editor-split">
        <aside className="wf-card">
          <div className="between wf-mb-sm">
            <b>Questions ({qData.questions.length})</b>
            <button className="text-link" onClick={addQuestion}>
              <Plus size={14} /> Ajouter
            </button>
          </div>
          <div className="wf-stack-sm">
            {qData.questions.map((q, idx) => (
              <button
                key={q.id}
                className={`wf-sec-btn ${idx === selectedQ ? 'active-row' : ''}`}
                onClick={() => setSelectedQ(idx)}
              >
                Q{idx + 1}. {q.prompt.slice(0, 32)}…
              </button>
            ))}
          </div>

          <div className="wf-divider" />
          <h4>Règles du quiz</h4>
          <div className="wf-form-stack tiny">
            <label>
              Tentatives autorisées
              <input
                type="number"
                min={1}
                max={10}
                value={qData.attemptsAllowed}
                onChange={(e) =>
                  updateQuiz((q) => ({ ...q, attemptsAllowed: Math.max(1, Number(e.target.value) || 1) }))
                }
              />
            </label>
            <label>
              Seuil de réussite (sur {totalPoints} pts)
              <input
                type="number"
                min={1}
                value={qData.passingScore}
                onChange={(e) => updateQuiz((q) => ({ ...q, passingScore: Number(e.target.value) || 1 }))}
              />
            </label>
            {thresholdError && (
              <p className="wf-error-text">Le seuil doit être compris entre 1 et {totalPoints}.</p>
            )}
          </div>
        </aside>

        {currentQ && (
          <section className="wf-card wf-form-stack">
            <label>
              Énoncé de la question (choix unique)
              <input
                value={currentQ.prompt}
                onChange={(e) =>
                  updateQuiz((q) => ({
                    ...q,
                    questions: q.questions.map((item, i) =>
                      i === selectedQ ? { ...item, prompt: e.target.value } : item
                    )
                  }))
                }
              />
            </label>

            <div>
              <b className="tiny">Options (sélectionnez l’unique bonne réponse)</b>
              <div className="wf-stack-sm wf-mt-sm">
                {currentQ.options.map((opt, oIdx) => (
                  <div className="wf-option-edit" key={oIdx}>
                    <input
                      type="radio"
                      name="correctOpt"
                      checked={currentQ.correctIndex === oIdx}
                      onChange={() =>
                        updateQuiz((q) => ({
                          ...q,
                          questions: q.questions.map((item, i) =>
                            i === selectedQ ? { ...item, correctIndex: oIdx } : item
                          )
                        }))
                      }
                    />
                    <input
                      value={opt}
                      onChange={(e) =>
                        updateQuiz((q) => ({
                          ...q,
                          questions: q.questions.map((item, i) =>
                            i === selectedQ
                              ? {
                                  ...item,
                                  options: item.options.map((o, j) => (j === oIdx ? e.target.value : o))
                                }
                              : item
                          )
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <label>
              Explication affichée après correction
              <textarea
                rows={3}
                value={currentQ.explanation}
                onChange={(e) =>
                  updateQuiz((q) => ({
                    ...q,
                    questions: q.questions.map((item, i) =>
                      i === selectedQ ? { ...item, explanation: e.target.value } : item
                    )
                  }))
                }
              />
            </label>

            <div className="lesson-actions">
              <span className="tiny muted">Barème : {currentQ.points} pt · Sans pénalité négative</span>
              <button
                className="primary"
                disabled={thresholdError}
                onClick={() => setToast('Configuration du quiz enregistrée')}
              >
                Enregistrer le quiz
              </button>
            </div>
          </section>
        )}
      </div>
    </StudioShell>
  );
}

export function StudioMediaView({ ext, updateExt, nav, setToast, user }: StudioProps) {
  const [selectedMedId, setSelectedMedId] = useState(ext.studioMedia[0]?.id || 'med-1');
  const current = ext.studioMedia.find((m) => m.id === selectedMedId) || ext.studioMedia[0];

  const simulateUpload = () => {
    const id = `med-${Date.now()}`;
    updateExt((prev) => ({
      ...prev,
      studioMedia: [
        {
          id,
          filename: 'nouveau-schema.png',
          kind: 'Image',
          state: 'Disponible',
          usage: 'Non utilisé',
          altText: 'Schéma explicatif importé',
          source: 'Création originale',
          rights: 'Usage pédagogique autorisé'
        },
        ...prev.studioMedia
      ]
    }));
    setSelectedMedId(id);
    setToast('Import de démonstration terminé (fichier prêt)');
  };

  const retryFailed = (id: string) => {
    updateExt((prev) => ({
      ...prev,
      studioMedia: prev.studioMedia.map((m) =>
        m.id === id ? { ...m, state: 'Disponible', usage: 'Prêt pour insertion' } : m
      )
    }));
    setToast('Contrôle du fichier réussi');
  };

  return (
    <StudioShell active="studio-media" nav={nav} user={user} ext={ext}>
      <div className="between wf-mb">
        <div>
          <span className="eyebrow">BIBLIOTHÈQUE MÉDIA</span>
          <h1>Fichiers et droits d’utilisation</h1>
        </div>
        <button className="primary" onClick={simulateUpload}>
          <Upload size={15} /> Simuler un import
        </button>
      </div>

      <div className="wf-editor-split">
        <div className="wf-card wf-stack-sm">
          {ext.studioMedia.map((m) => (
            <button
              key={m.id}
              className={`wf-media-row ${m.id === current?.id ? 'active-row' : ''}`}
              onClick={() => setSelectedMedId(m.id)}
            >
              <div>
                <b>{m.filename}</b>
                <small className="muted">
                  {m.kind} · {m.usage}
                </small>
              </div>
              <span
                className={`status-tag ${
                  m.state === 'Disponible' ? 'ok' : m.state === 'Échec' ? 'warn' : ''
                }`}
              >
                {m.state}
              </span>
            </button>
          ))}
        </div>

        {current && (
          <section className="wf-card wf-form-stack">
            <div className="between">
              <h3>{current.filename}</h3>
              <span
                className={`status-tag ${
                  current.state === 'Disponible' ? 'ok' : current.state === 'Échec' ? 'warn' : ''
                }`}
              >
                {current.state}
              </span>
            </div>
            <p className="tiny muted">Usage : {current.usage}</p>
            {current.state === 'Échec' ? (
              <div className="wf-alert-warn">
                <AlertTriangle size={16} />
                <div>
                  <b>Import interrompu :</b> ce média ne peut pas être inséré tant que le contrôle n’a pas
                  réussi.
                  <button className="text-link wf-mt-sm" onClick={() => retryFailed(current.id)}>
                    <RefreshCw size={14} /> Réessayer le contrôle
                  </button>
                </div>
              </div>
            ) : current.state === 'En traitement' ? (
              <p className="tiny muted">Traitement en cours : insertion bloquée tant que le média n’est pas disponible.</p>
            ) : (
              <>
                <label>
                  Texte alternatif (accessibilité)
                  <input
                    value={current.altText}
                    onChange={(e) =>
                      updateExt((prev) => ({
                        ...prev,
                        studioMedia: prev.studioMedia.map((x) =>
                          x.id === current.id ? { ...x, altText: e.target.value } : x
                        )
                      }))
                    }
                  />
                </label>
                <label>
                  Source et droits déclarés
                  <input
                    value={current.rights}
                    onChange={(e) =>
                      updateExt((prev) => ({
                        ...prev,
                        studioMedia: prev.studioMedia.map((x) =>
                          x.id === current.id ? { ...x, rights: e.target.value } : x
                        )
                      }))
                    }
                  />
                </label>
                <button
                  className="primary"
                  onClick={() => setToast(`${current.filename} inséré dans le brouillon actif`)}
                >
                  Insérer dans le brouillon
                </button>
              </>
            )}
          </section>
        )}
      </div>
    </StudioShell>
  );
}

export function StudioPathView({ ext, updateExt, nav, setToast, user }: StudioProps) {
  const modules = ext.studioPathModules;
  const hasBlockedModule = modules.some((m) => !m.accessible);

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= modules.length) return;
    const copy = [...modules];
    const [m] = copy.splice(idx, 1);
    copy.splice(target, 0, m);
    updateExt((prev) => ({ ...prev, studioPathModules: copy }));
  };

  const removeMod = (id: string) => {
    updateExt((prev) => ({
      ...prev,
      studioPathModules: prev.studioPathModules.filter((m) => m.id !== id)
    }));
    setToast('Module retiré du parcours (le module source n’est pas supprimé)');
  };

  return (
    <StudioShell active="studio-path" nav={nav} user={user} ext={ext}>
      <div className="page-heading">
        <span className="eyebrow">ASSEMBLAGE DE PARCOURS</span>
        <h1>Parcours : Fondamentaux IT (Brouillon)</h1>
        <p>
          Les modules sont référencés par version. L’ordre conseillé n’entraîne aucun verrouillage automatique.
        </p>
      </div>

      <section className="wf-card">
        <div className="wf-program-list">
          {modules.map((m, idx) => (
            <div className="wf-program-item" key={m.id}>
              <div>
                <b>
                  0{idx + 1} · {m.title} <small>({m.version})</small>
                </b>
                <small>
                  {m.accessible
                    ? 'Accessible pour l’audience Membres autorisés'
                    : 'Blocage : accès non compatible avec l’audience du parcours'}
                </small>
              </div>
              <div className="wf-inline-actions">
                <button className="icon-btn" disabled={idx === 0} onClick={() => move(idx, -1)}>
                  <ArrowUp size={15} />
                </button>
                <button
                  className="icon-btn"
                  disabled={idx === modules.length - 1}
                  onClick={() => move(idx, 1)}
                >
                  <ArrowDown size={15} />
                </button>
                <button className="icon-btn" onClick={() => removeMod(m.id)} aria-label="Retirer du parcours">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {hasBlockedModule && (
          <div className="wf-alert-warn wf-mt">
            <AlertTriangle size={17} />
            <div>
              <b>Publication bloquée :</b> un module inclus n’est pas accessible à l’audience prévue. Retirez-le
              ou modifiez l’audience.
            </div>
          </div>
        )}

        <div className="lesson-actions">
          <button
            className="secondary"
            onClick={() =>
              updateExt((prev) => ({
                ...prev,
                studioPathModules: prev.studioPathModules.map((m) => ({ ...m, accessible: true }))
              }))
            }
          >
            Vérifier les accès
          </button>
          <button
            className="primary"
            disabled={hasBlockedModule}
            onClick={() => setToast('Parcours prêt pour contrôle et publication')}
          >
            Continuer vers la publication <ArrowRight size={15} />
          </button>
        </div>
      </section>
    </StudioShell>
  );
}

export function StudioPublishView({ ext, updateExt, nav, selectedId, setToast, user }: StudioProps) {
  const content = ext.studioContents.find((c) => c.id === selectedId) || ext.studioContents[0];
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!content) return null;

  const readiness = evaluateStudioReadiness(content, ext.studioQuiz, ext.studioMedia);
  const missingTitle = !content.title.trim();
  const missingSources = !content.sources.trim() || content.sources === 'À préciser';
  const missingDuration = !content.duration.trim();
  const hasErrors = missingTitle || missingSources;

  const publishNow = () => {
    updateExt((prev) => ({
      ...prev,
      studioContents: prev.studioContents.map((c) =>
        c.id === content.id ? { ...c, pubStatus: 'Publié', updatedAt: `Publié · ${c.version}` } : c
      ),
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor: user?.name || 'Créateur habilité',
        action: `Publication ${content.version}`,
        target: content.title,
        scope: `Studio · ${content.audience}`,
        result: 'Succès',
        justification: 'Contrôles préalables satisfaits (sans validation pédagogique automatique).'
      })
    }));
    setConfirmOpen(false);
    setToast(`Version ${content.version} publiée pour « ${content.audience} »`);
  };

  const submitReview = () => {
    updateExt((prev) => {
      const exists = prev.validationRequests.some(
        (v) => v.contentId === content.id && v.version === content.version
      );
      const mappedType =
        content.type === 'module'
          ? 'Module'
          : content.type === 'path'
            ? 'Parcours'
            : 'Ressource';
      const nextRequests = exists
        ? prev.validationRequests.map((v) =>
            v.contentId === content.id && v.version === content.version
              ? { ...v, status: 'Soumise' as const, submittedAt: 'À l’instant' }
              : v
          )
        : [
            {
              id: `VAL-2026-00${prev.validationRequests.length + 1}`,
              contentId: content.id,
              title: content.title,
              contentType: mappedType as 'Module' | 'Parcours' | 'Ressource',
              author: user?.name || 'Kossi Agbo',
              domain: content.domain,
              version: content.version,
              level: 'Validation pédagogique' as const,
              validator: 'Validateur externe',
              submittedAt: 'À l’instant',
              status: 'Soumise' as const,
              decisionNote: ''
            },
            ...prev.validationRequests
          ];
      return {
        ...prev,
        studioContents: prev.studioContents.map((c) =>
          c.id === content.id ? { ...c, reviewStatus: 'En revue', updatedAt: 'Soumis à revue pédagogique' } : c
        ),
        validationRequests: nextRequests,
        auditLogs: appendAuditLog(prev.auditLogs, {
          actor: user?.name || 'Créateur habilité',
          action: 'Soumission validation pédagogique',
          target: `${content.title} (${content.version})`,
          scope: `Studio · ${content.domain}`,
          result: 'Succès',
          justification: 'Demande de revue transmise vers la file pédagogique.'
        })
      };
    });
    setToast('Demande de validation pédagogique enregistrée');
  };

  return (
    <StudioShell
      active="studio-publish"
      nav={nav}
      user={user}
      ext={ext}
      selectedId={content.id}
      stepOverride={confirmOpen || content.pubStatus === 'Publié' ? 5 : 4}
      onPublishStep={() => {
        if (!hasErrors) setConfirmOpen(true);
      }}
    >
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <div className="page-heading">
            <span className="eyebrow">APERÇU, CONTRÔLE & PUBLICATION</span>
            <h1>{content.title}</h1>
            <p>
              Publier un contenu ne délivre automatiquement aucune validation pédagogique officielle.
            </p>
          </div>

          <section className="studio-preview-box wf-mb" aria-label="Aperçu apprenant">
            <div className="between">
              <span className="eyebrow">APERÇU RENDU APPRENANT · {content.version}</span>
              <span className="inline-meta">
                <span>{content.domain}</span>
                <span aria-hidden="true">·</span>
                <span>{content.duration || 'Durée à préciser'}</span>
                <span aria-hidden="true">·</span>
                <span>{content.sections.length} section(s)</span>
              </span>
            </div>
            <h3>{content.title}</h3>
            <div className="wf-program-list">
              {content.sections.slice(0, 3).map((sec) => (
                <div className="wf-program-item" key={sec.id}>
                  <div>
                    <b>{sec.title}</b>
                    <small>{sec.body.slice(0, 95)}{sec.body.length > 95 ? '…' : ''}</small>
                  </div>
                </div>
              ))}
            </div>
            <div className="tiny muted">
              Mode Aperçu : aucune tentative consommée et aucun XP attribué.
            </div>
          </section>

          <section className="wf-card wf-form-stack">
            <h3>Contrôle avant publication</h3>
            <div className="wf-program-list">
              <div className="wf-program-item">
                <span>Titre, sections et structure du contenu</span>
                <span className={`status-tag ${missingTitle ? 'warn' : 'ok'}`}>
                  {missingTitle ? 'Erreur bloquante' : 'Conforme'}
                </span>
              </div>
              <div className="wf-program-item">
                <span>Sources et droits déclarés</span>
                <span className={`status-tag ${missingSources ? 'warn' : 'ok'}`}>
                  {missingSources ? 'À préciser' : 'Renseigné'}
                </span>
              </div>
              <div className="wf-program-item">
                <span>Durée estimée</span>
                <span className="inline-meta">
                  {missingDuration ? 'Facultatif (non renseignée)' : content.duration}
                </span>
              </div>
            </div>

            <label>
              Audience de publication
              <select
                value={content.audience}
                onChange={(e) =>
                  updateExt((prev) => ({
                    ...prev,
                    studioContents: prev.studioContents.map((c) =>
                      c.id === content.id ? { ...c, audience: e.target.value as any } : c
                    )
                  }))
                }
              >
                <option value="Membres autorisés">Membres connectés autorisés</option>
                <option value="Privé">Moi uniquement (Privé)</option>
                <option value="Public">Public (sous réserve validation)</option>
              </select>
            </label>

            {confirmOpen ? (
              <div className="wf-alert-warn">
                <CheckCircle2 size={18} />
                <div className="wf-stack-sm">
                  <b>Confirmer la publication ?</b>
                  <p className="tiny">
                    La version {content.version} deviendra accessible à l’audience « {content.audience} ».
                  </p>
                  <div className="wf-inline-actions">
                    <button className="primary" onClick={publishNow}>
                      Confirmer et publier
                    </button>
                    <button className="secondary" onClick={() => setConfirmOpen(false)}>
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="lesson-actions">
                <button className="secondary" onClick={() => nav('studio-editor', content.id)}>
                  <ArrowLeft size={15} /> Revenir à l’éditeur
                </button>
                <button className="secondary" onClick={submitReview}>
                  Soumettre à validation
                </button>
                {content.pubStatus === 'Publié' && (
                  <button
                    className="secondary"
                    onClick={() => {
                      const targetId =
                        content.id === 'st-2' ? 'reseaux' : content.id === 'st-1' ? 'fiche-reseau' : content.id;
                      const dest =
                        content.type === 'resource'
                          ? 'resource-detail'
                          : content.type === 'path'
                            ? 'path-detail'
                            : 'module-detail';
                      nav(dest, targetId);
                    }}
                  >
                    <Eye size={15} /> Voir dans Explorer
                  </button>
                )}
                <button className="primary" disabled={hasErrors} onClick={() => setConfirmOpen(true)}>
                  {content.pubStatus === 'Publié' ? `Republier ${content.version}` : `Publier la ${content.version}`}{' '}
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
          </section>
        </div>

        <aside className="right-rail" aria-label="Cycle des versions et contrôles">
          <section className="rail-card">
            <span className="eyebrow">CYCLE DES VERSIONS</span>
            <h3>{content.version} · {content.pubStatus}</h3>
            <div className="rail-stat-list">
              <div className="rail-stat-row">
                <span>Publication</span>
                <b>{content.pubStatus}</b>
              </div>
              <div className="rail-stat-row">
                <span>Revue pédagogique</span>
                <b>{content.reviewStatus}</b>
              </div>
            </div>
            <p className="tiny muted">
              Une version publiée n’est jamais écrasée silencieusement : toute mise à jour prépare un nouveau
              brouillon (v2, v3…).
            </p>
          </section>

          <section className="rail-card studio-checklist-card">
            <span className="eyebrow">CONTRÔLES ({readiness.okCount}/{readiness.checks.length})</span>
            <h3>Synthèse qualité</h3>
            {readiness.checks.map((ck) => (
              <div className="studio-check-row" key={ck.id}>
                <div>
                  <b>{ck.label}</b>
                  <div className="tiny muted">{ck.detail}</div>
                </div>
                {ck.ok ? (
                  <CheckCircle2 size={16} className="studio-check-icon-ok" aria-label="Conforme" />
                ) : (
                  <AlertTriangle size={16} className="studio-check-icon-warn" aria-label="À vérifier" />
                )}
              </div>
            ))}
          </section>
        </aside>
      </div>
    </StudioShell>
  );
}

export function StudioOcrView({ ext, updateExt, nav, setToast, user }: StudioProps) {
  const [step, setStep] = useState<'source' | 'ocr' | 'ai'>('source');
  const [pages, setPages] = useState('1 à 6');
  const page5Text = ext.ocrDraft.pagesCorrected[5] || '';

  const insertIntoDraft = () => {
    updateExt((prev) => ({
      ...prev,
      ocrDraft: { ...prev.ocrDraft, aiStructureAccepted: true }
    }));
    setToast('Proposition insérée dans un nouveau brouillon séparé (non publié)');
    nav('studio');
  };

  return (
    <StudioShell active="studio-ocr" nav={nav} user={user} ext={ext}>
      <div className="page-heading">
        <span className="eyebrow">KNOWLEDGE STUDIO · IMPORT, OCR & ASSISTANCE IA</span>
        <h1>Préparer une source, relire l’OCR et vérifier l’aide IA</h1>
        <p>
          Démonstration fidèle aux règles de contrôle humain : aucune génération automatique ne publie ni ne valide
          un contenu sans relecture.
        </p>
      </div>

      <div className="catalog-tabs-underline" role="tablist" aria-label="Étapes d’extraction OCR et IA">
        <button
          type="button"
          role="tab"
          aria-selected={step === 'source'}
          className={step === 'source' ? 'selected' : ''}
          onClick={() => setStep('source')}
        >
          1. Préparation de source
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={step === 'ocr'}
          className={step === 'ocr' ? 'selected' : ''}
          onClick={() => setStep('ocr')}
        >
          2. Relecture OCR côte à côte
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={step === 'ai'}
          className={step === 'ai' ? 'selected' : ''}
          onClick={() => setStep('ai')}
        >
          3. Proposition IA séparée
        </button>
      </div>

      {step === 'source' && (
        <section className="wf-card wf-form-stack">
          <h3>Source sélectionnée : bases-reseaux.pdf (6 pages)</h3>
          <p className="tiny muted">
            Pages 1 à 4 : texte natif exploitable · Pages 5 à 6 : images scannées (OCR requis).
          </p>
          <label>
            Pages à traiter
            <input value={pages} onChange={(e) => setPages(e.target.value)} />
          </label>
          <div className="lesson-actions">
            <span className="tiny muted">Traitement asynchrone simulé localement</span>
            <button className="primary" onClick={() => setStep('ocr')}>
              Lancer l’extraction et relire <ArrowRight size={15} />
            </button>
          </div>
        </section>
      )}

      {step === 'ocr' && (
        <section className="wf-card">
          <div className="between wf-mb">
            <h3>Relecture OCR · Page 5 / 6</h3>
            <span className="status-tag warn">Page 6 : échec d’OCR (exclue)</span>
          </div>
          <div className="wf-ocr-split">
            <div className="wf-ocr-source">
              <span className="eyebrow">IMAGE SOURCE (SIMULÉE)</span>
              <div className="wf-ocr-box">
                <p>
                  « Une adresse IP identifie une interface sur un réseau. Le routeur transmet les paquets entre des
                  réseaux distincts. »
                </p>
              </div>
              <small className="muted">Vérifiez les chiffres, noms propres et négations avant insertion.</small>
            </div>
            <div className="wf-form-stack">
              <label>
                Texte extrait éditable (page 5)
                <textarea
                  rows={5}
                  value={page5Text}
                  onChange={(e) =>
                    updateExt((prev) => ({
                      ...prev,
                      ocrDraft: {
                        ...prev.ocrDraft,
                        pagesCorrected: { ...prev.ocrDraft.pagesCorrected, 5: e.target.value }
                      }
                    }))
                  }
                />
              </label>
            </div>
          </div>
          <div className="lesson-actions">
            <button className="secondary" onClick={() => setStep('source')}>
              Changer les pages
            </button>
            <button className="primary" onClick={() => setStep('ai')}>
              Marquer page 5 relue & continuer <ArrowRight size={15} />
            </button>
          </div>
        </section>
      )}

      {step === 'ai' && (
        <section className="wf-card">
          <div className="between wf-mb">
            <h3>
              <Layers size={16} /> Proposition de structure (séparée du brouillon)
            </h3>
            <span className="inline-meta">Provenance : bases-reseaux.pdf (p. 1–5 relues)</span>
          </div>
          <div className="wf-program-list wf-mb">
            <div className="wf-program-item">
              <div>
                <b>Section 1 : Les équipements réseau</b>
                <small>Appuyée sur les pages 1 à 3 · Vérifiée</small>
              </div>
              <span className="status-tag ok">Sourcée</span>
            </div>
            <div className="wf-program-item">
              <div>
                <b>Section 2 : Rôle de l’adresse IP et du routeur</b>
                <small>Appuyée sur la page 5 relue par l’auteur</small>
              </div>
              <span className="status-tag ok">Sourcée</span>
            </div>
            <div className="wf-program-item">
              <div>
                <b>Section 3 : Synthèse proposée (hors extrait page 6)</b>
                <small>À vérifier par l’auteur (page 6 exclue de l’extraction)</small>
              </div>
              <span className="status-tag warn">À vérifier</span>
            </div>
          </div>
          <div className="lesson-actions">
            <button className="secondary" onClick={() => setStep('ocr')}>
              Revenir à la relecture OCR
            </button>
            <button className="primary" onClick={insertIntoDraft}>
              Insérer dans un nouveau brouillon <ArrowRight size={15} />
            </button>
          </div>
        </section>
      )}
    </StudioShell>
  );
}

export function StudioStatsView({ ext, nav, progress, user }: StudioProps) {
  const [period, setPeriod] = useState<'session' | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | CatalogType>('all');

  const learnerUids = ['afi', 'kossi', 'nadege'];

  const rows = ext.studioContents
    .filter((c) => (typeFilter === 'all' ? true : c.type === typeFilter))
    .map((c) => {
      const mappedCatalogId = c.id === 'st-2' ? 'reseaux' : c.id === 'st-1' ? 'fiche-reseau' : c.id;
      const lessonCount = (MODULES_CONTENT[mappedCatalogId]?.lessons.length || c.sections.length || 3);

      const trackedProgresses = learnerUids
        .map((uid) => {
          if (mappedCatalogId === 'phishing' && uid === 'afi' && progress) return progress;
          return ext.moduleProgress?.[uid]?.[mappedCatalogId];
        })
        .filter((p): p is Progress => !!p && (p.lessons.length > 0 || p.submitted));

      const startedCount = c.pubStatus === 'Publié' ? trackedProgresses.length : 0;
      const completionRate =
        c.pubStatus === 'Publié' && c.type === 'module' && trackedProgresses.length > 0
          ? Math.round(
              trackedProgresses.reduce((sum, p) => sum + moduleProgressPercent(p, lessonCount), 0) /
                trackedProgresses.length
            )
          : null;

      const submittedQuizzes = trackedProgresses.filter((p) => p.submitted);
      const quizInfo =
        c.type !== 'module'
          ? 'Non applicable'
          : c.pubStatus !== 'Publié'
            ? 'Brouillon'
            : submittedQuizzes.length > 0
              ? `${submittedQuizzes.length} tentative(s) soumise(s)`
              : 'Aucune tentative enregistrée';

      const communityMentions = ext.posts.filter(
        (p) =>
          p.domain === c.domain ||
          p.replies.some((r) => r.linkedModuleId === mappedCatalogId)
      ).length;

      return { content: c, startedCount, completionRate, quizInfo, communityMentions };
    });

  const publishedRows = rows.filter((r) => r.content.pubStatus === 'Publié');
  const totalStarted = rows.reduce((s, r) => s + r.startedCount, 0);
  const completedRates = rows.map((r) => r.completionRate).filter((x): x is number => x !== null);
  const avgCompletion = completedRates.length
    ? Math.round(completedRates.reduce((a, b) => a + b, 0) / completedRates.length)
    : 0;
  const validatedCount = ext.validationRequests.filter((v) => v.status === 'Validée').length;

  return (
    <StudioShell active="studio-stats" nav={nav} user={user} ext={ext}>
      <div className="between wf-mb-sm">
        <div className="page-heading wf-no-mb">
          <span className="eyebrow">ESPACE CRÉATEUR · STATISTIQUES DE CONTENU</span>
          <h1>Suivi réel de l’espace de démonstration</h1>
          <p>
            Compteurs calculés directement à partir des contenus publiés et des progressions enregistrées localement.
            Aucune donnée d’audience fictive n’est générée.
          </p>
        </div>
        <button className="secondary" onClick={() => nav('studio-profile')}>
          <User size={15} /> Profil créateur
        </button>
      </div>

      <div className="wf-alert-warn wf-mb">
        <AlertTriangle size={17} />
        <div>
          <b>Périmètre local :</b> ces chiffres reflètent uniquement l’activité réelle enregistrée dans cette session
          ({period === 'session' ? 'session active' : 'cumul local'}). Aucune réponse individuelle n’est exposée.
        </div>
      </div>

      <div className="catalog-tabs-underline" role="tablist" aria-label="Filtrer par type de contenu">
        {[
          { id: 'all', label: 'Tous types' },
          { id: 'module', label: 'Modules' },
          { id: 'resource', label: 'Ressources' },
          { id: 'path', label: 'Parcours' }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={typeFilter === t.id}
            className={typeFilter === t.id ? 'selected' : ''}
            onClick={() => setTypeFilter(t.id as any)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="catalog-filter-bar">
        <div className="catalog-filters-inline always-visible">
          <div className={`catalog-filter-pill ${period !== 'all' ? 'is-filtered' : ''}`}>
            <span className="cf-label">Périmètre</span>
            <span className="cf-sep" aria-hidden="true">–</span>
            <span className="cf-val">{period === 'all' ? 'Cumul démo' : 'Session courante'}</span>
            <ChevronDown size={14} className="cf-chevron" aria-hidden="true" />
            <select aria-label="Périmètre" value={period} onChange={(e) => setPeriod(e.target.value as any)}>
              <option value="all">Cumul de démonstration</option>
              <option value="session">Session courante</option>
            </select>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div>
          <BarChart2 />
          <b className="tabular">{publishedRows.length}</b>
          <span>Contenus publiés visibles</span>
        </div>
        <div>
          <BookOpen />
          <b className="tabular">{totalStarted}</b>
          <span>Apprenants actifs (comptes locaux)</span>
        </div>
        <div>
          <CheckCircle2 />
          <b className="tabular">{completedRates.length ? `${avgCompletion} %` : '—'}</b>
          <span>Achèvement moyen · {validatedCount} validation(s)</span>
        </div>
      </div>

      <section className="wf-card">
        <h3>Détail par contenu</h3>
        <div className="wf-table-wrap wf-mt-sm">
          <table className="wf-table">
            <thead>
              <tr>
                <th>Contenu</th>
                <th>Statut / Revue</th>
                <th className="num">Apprenants actifs</th>
                <th className="num">Achèvement</th>
                <th>Quiz & Entraide</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ content, startedCount, completionRate, quizInfo, communityMentions }) => (
                <tr key={content.id}>
                  <td>
                    <b>{content.title}</b>
                    <div className="tiny muted">
                      {content.type === 'module' ? 'Module' : content.type === 'path' ? 'Parcours' : 'Ressource'} ·{' '}
                      {content.version} · {content.domain}
                    </div>
                  </td>
                  <td>
                    <span className={`status-tag ${content.pubStatus === 'Publié' ? 'ok' : ''}`}>
                      {content.pubStatus}
                    </span>
                    <div className="tiny muted">Revue : {content.reviewStatus}</div>
                  </td>
                  <td className="num tabular">{content.pubStatus === 'Publié' ? startedCount : '— (brouillon)'}</td>
                  <td className="num tabular">{completionRate !== null ? `${completionRate} %` : '—'}</td>
                  <td className="tiny muted">
                    {quizInfo} · {communityMentions} fil(s) lié(s)
                  </td>
                  <td>
                    <button className="text-link" onClick={() => nav('studio-publish', content.id)}>
                      Gérer <ArrowRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </StudioShell>
  );
}

export function StudioCreatorProfileView({ ext, nav, user }: StudioProps) {
  const [previewMember, setPreviewMember] = useState(false);
  const displayName = user?.name || 'Kossi Agbo';
  const details = (user && ext.profileDetails[user.id]) || ext.profileDetails.kossi;
  const dynamicCatalog = buildDynamicCatalog(ext);
  const catalogAuthored = dynamicCatalog.filter(
    (c) => c.author === displayName || c.author === 'Kossi Davi'
  );
  const publishedStudio = ext.studioContents.filter(
    (c) =>
      c.pubStatus === 'Publié' &&
      c.id !== 'st-2' &&
      c.id !== 'st-1' &&
      !catalogAuthored.some((cat) => cat.id === c.id)
  );

  return (
    <StudioShell active="studio-profile" nav={nav} user={user} ext={ext}>
      <div className="wf-preview-banner">
        <span>
          {previewMember
            ? 'Aperçu public/membre du profil créateur : seuls les contenus publiés sont visibles.'
            : 'Vue propriétaire du profil créateur'}
        </span>
        <button className="secondary" onClick={() => setPreviewMember(!previewMember)}>
          <Eye size={14} /> {previewMember ? 'Revenir à ma vue' : 'Aperçu membre'}
        </button>
      </div>

      <div className="wf-two-col">
        <div className="wf-stack">
          <section className="wf-card">
            <div className="between wf-mb-sm">
              <div>
                <span className="eyebrow">PROFIL CRÉATEUR</span>
                <h1>{displayName}</h1>
                <p className="wf-muted-text">{details.tagline}</p>
              </div>
              <span className="inline-meta">
                <ShieldCheck size={14} aria-hidden="true" /> <b>Capacité créateur active</b>
              </span>
            </div>
            <p className="wf-muted-text">{details.bio}</p>
            <div className="wf-meta-chips wf-mt-sm">
              {details.interests
                .split(',')
                .map((x) => x.trim())
                .filter(Boolean)
                .map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
            </div>
            <div className="wf-divider" />
            <p className="tiny muted">
              <b>Gouvernance des rôles :</b> la capacité de création de contenus reste distincte d’un titre officiel
              d’enseignant vérifié. Chaque validation pédagogique porte sur une version précise.
            </p>
          </section>

          <section className="wf-card">
            <div className="between wf-mb-sm">
              <h3>Contenus publiés et accessibles</h3>
              <span className="tiny muted tabular">{publishedStudio.length + catalogAuthored.length} références</span>
            </div>
            <div className="wf-program-list">
              {publishedStudio.map((c) => (
                <div className="wf-program-item" key={c.id}>
                  <div>
                    <b>{c.title}</b>
                    <small>
                      Studio · {c.domain} · {c.version} · Revue : {c.reviewStatus}
                    </small>
                  </div>
                  {!previewMember ? (
                    <button className="secondary" onClick={() => nav('studio-editor', c.id)}>
                      Éditer
                    </button>
                  ) : (
                    <span className="status-tag ok">Publié</span>
                  )}
                </div>
              ))}
              {catalogAuthored.map((c) => {
                const targetPage = c.type === 'resource' ? 'resource-detail' : c.type === 'path' ? 'path-detail' : 'module-detail';
                return (
                  <div
                    className="wf-program-item is-clickable"
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => nav(targetPage, c.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        nav(targetPage, c.id);
                      }
                    }}
                  >
                    <div>
                      <b>{c.title}</b>
                      <small>
                        Explorer · {c.domain} · {c.version}
                      </small>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="wf-side-card">
          <span className="eyebrow">SYNTHÈSE CRÉATEUR</span>
          <h3>Domaines & suivi</h3>
          <div className="rail-stat-list">
            <div className="rail-stat-row">
              <span>Domaines actifs</span>
              <b>Numérique · Gestion</b>
            </div>
            <div className="rail-stat-row">
              <span>Brouillons privés</span>
              <b className="tabular">{ext.studioContents.filter((c) => c.pubStatus === 'Brouillon').length}</b>
            </div>
            <div className="rail-stat-row">
              <span>Demandes en revue pédagogique</span>
              <b className="tabular">{ext.validationRequests.filter((v) => v.status !== 'Validée').length}</b>
            </div>
          </div>
          {!previewMember && (
            <>
              <button className="secondary wf-full-btn" onClick={() => nav('studio-stats')}>
                <BarChart2 size={15} /> Statistiques
              </button>
              <button className="secondary wf-full-btn" onClick={() => nav('profile')}>
                <User size={15} /> Mon profil membre
              </button>
            </>
          )}
        </aside>
      </div>
    </StudioShell>
  );
}
