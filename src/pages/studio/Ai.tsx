/**
 * Studio — « Créer avec l'IA ».
 * Trois temps. L'encadreur colle son explication et dit pour qui il écrit. L'IA propose un plan (titre,
 * objectifs, sections) qu'il corrige. Elle rédige alors chaque section au format des cours ; il relit chaque
 * bloc, son texte à côté, le garde ou le retire, puis crée un brouillon. Rien n'est jamais publié par l'IA.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Check, ChevronDown, ChevronUp, CornerDownRight, Plus, Trash2 } from 'lucide-react';
import {
  AI_SOURCE_MAX,
  AI_SOURCE_MIN,
  aiStatus,
  illustrateSteps,
  proposePlan,
  writeQuiz,
  writeSection,
  type AiAudience,
  type AiImageSize,
  type AiPlanInput,
  type AiQuestion,
  type AiStatus,
  type AiStep
} from '../../ai';
import { audienceFor, isPlanReady, planRows, previewLesson, sectionFromAi, type PlanRow } from '../../aiLesson';
import { clearAiPrefill, peekAiPrefill } from '../../aiPrefill';
import { pendingCount, relatedSentences, sentenceKey, splitSource, type BlockDecision } from '../../aiReview';
import { LessonPart } from '../../components/LessonArticle';
import { ConfirmDialog, PageHeader, Select, StatusDot } from '../../components/ui';
import { CLASS_LADDER, DIFFICULTY_LEVELS, LEVEL_CRITERIA, readingBandOf, type DifficultyLevel } from '../../levels';
import { LANGUAGE_TARGETS } from '../../readability';
import { formatGoals, moduleMinutes, reviewSection, sectionCountAdvice, sectionText, type StudioSection } from '../../studioLesson';
import { appendAuditLog, type StudioContent } from '../../wireframeData';
import { GoalsEditor, SectionEditor, SectionMeasure } from './LessonEditor';
import { DOMAINS, newStudioId, StudioShell, type StudioProps } from './shared';

const AI_EXAMPLE_SOURCE =
  'Pour protéger ses fichiers importants (photos, devoirs, mémoire), on applique la règle 3-2-1 : garder trois copies de ses données, sur deux supports différents, dont une copie hors de chez soi. ' +
  'Concrètement, on choisit d’abord les dossiers essentiels. On copie ces dossiers sur une clé USB ou un disque externe, au moins une fois par semaine. ' +
  'On active aussi une sauvegarde en ligne protégée par un mot de passe solide et la double authentification. ' +
  'On range le disque externe dans un endroit différent de l’ordinateur. ' +
  'Enfin, une fois par mois, on vérifie qu’on peut réellement ouvrir un fichier restauré : une sauvegarde jamais testée peut être inutilisable.';

type AiPhase = 'compose' | 'plan' | 'review';
/** Une section en cours de rédaction, rédigée, ou qui n'a pas pu l'être. */
type SectionDraft = { status: 'writing' | 'ready' | 'error'; section?: StudioSection; error?: string; gaps?: string[] };
type QuizState = 'writing' | 'ready' | 'error';

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;

/** Les temps de la création : votre texte, le plan, la relecture, le brouillon. */
function AiStepper({ step }: { step: 1 | 2 | 3 }) {
  const steps = ['Votre texte', 'Plan', 'Relecture', 'Brouillon'];
  return (
    <ol className="sx-stepper" aria-label="Étapes">
      {steps.map((label, i) => {
        const n = i + 1;
        const state = n < step ? 'is-done' : n === step ? 'is-current' : '';
        return (
          <li key={label} className={state} aria-current={n === step ? 'step' : undefined}>
            <span className="sx-stepper-n" aria-hidden="true">
              {n < step ? <Check size={13} /> : n}
            </span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}

/** Garder ou retirer un bloc : deux boutons, aucun choix fait d'avance. */
function Decide({ value, onChange, label }: { value: BlockDecision; onChange: (keep: boolean) => void; label: string }) {
  return (
    <span className="sx-decide" role="group" aria-label={`Décision : ${label}`}>
      <button type="button" className={value === true ? 'is-on' : ''} aria-pressed={value === true} onClick={() => onChange(true)}>
        {value === true && <Check size={14} aria-hidden="true" />} Garder
      </button>
      <button type="button" className={value === false ? 'is-on is-drop' : ''} aria-pressed={value === false} onClick={() => onChange(false)}>
        Retirer
      </button>
    </span>
  );
}

/**
 * Bloc de la proposition : titre repliable, état de relecture, décision, puis contenu.
 * Sans `onOpen`, le bloc ne se replie pas (section en cours de rédaction ou non rédigée).
 */
function ReviewItem({
  decision,
  onDecide,
  label,
  title,
  state,
  busy = false,
  open,
  onOpen,
  actions,
  children
}: {
  decision: BlockDecision;
  onDecide?: (keep: boolean) => void;
  label: string;
  title: string;
  /** État affiché sous le libellé ; par défaut « À relire » tant que le bloc n'est ni gardé ni retiré. */
  state?: string;
  busy?: boolean;
  open: boolean;
  onOpen?: () => void;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const shown = state ?? (decision === null ? 'À relire' : '');
  const head = (
    <>
      <span className="sx-review-label">
        {label}
        {shown && <em className={`sx-review-state${busy ? ' is-busy' : ''}`}>{shown}</em>}
      </span>
      <span className="sx-review-text">{title || 'À rédiger'}</span>
    </>
  );
  return (
    <li className={`sx-review-item${decision === false ? ' is-dropped' : ''}${decision === null ? ' is-pending' : ''}${open ? ' is-open' : ''}`}>
      <div className="sx-review-row">
        {onOpen ? (
          <button type="button" className="sx-review-title" aria-expanded={open} onClick={onOpen}>
            {head}
            {open ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
          </button>
        ) : (
          <div className="sx-review-title is-static">{head}</div>
        )}
        {actions && <span className="sx-review-actions">{actions}</span>}
        {onDecide && <Decide value={decision} onChange={onDecide} label={label} />}
      </div>
      {open && children && <div className="sx-review-body">{children}</div>}
    </li>
  );
}

export function StudioAiView({ updateExt, nav, setToast, user }: StudioProps) {
  const [status, setStatus] = useState<AiStatus | null>(null);
  // Texte préparé ailleurs (fiche de rattrapage d'une classe) : repris une fois, à l'ouverture.
  const [prefill] = useState(() => peekAiPrefill());
  const [titleHint, setTitleHint] = useState(prefill?.title || '');
  const [domain, setDomain] = useState<StudioContent['domain']>(prefill?.domain || 'Numérique');
  const [classLabel, setClassLabel] = useState('');
  const [level, setLevel] = useState<DifficultyLevel>('Débutant');
  const [source, setSource] = useState(prefill?.source || '');
  const [phase, setPhase] = useState<AiPhase>('compose');
  const [planning, setPlanning] = useState(false);
  const [error, setError] = useState('');
  const [model, setModel] = useState('');
  // Le plan, corrigé par l'encadreur avant la rédaction.
  const [planTitle, setPlanTitle] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [planGaps, setPlanGaps] = useState<string[]>([]);
  // La rédaction : une section par appel, puis le quiz.
  const [drafts, setDrafts] = useState<SectionDraft[]>([]);
  const [quizState, setQuizState] = useState<QuizState>('writing');
  const [quizError, setQuizError] = useState('');
  const [questions, setQuestions] = useState<AiQuestion[]>([]);
  const [steps, setSteps] = useState<AiStep[]>([]);
  const [keepSections, setKeepSections] = useState<BlockDecision[]>([]);
  const [keepQuestions, setKeepQuestions] = useState<BlockDecision[]>([]);
  const [keepSteps, setKeepSteps] = useState<BlockDecision[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [images, setImages] = useState<(string | undefined)[]>([]);
  const [imgPhase, setImgPhase] = useState<'idle' | 'loading' | 'done'>('idle');
  const [imgError, setImgError] = useState('');
  const [imgSize, setImgSize] = useState<AiImageSize>(1024);
  const [openItem, setOpenItem] = useState('sec-0');
  const [confirmPlan, setConfirmPlan] = useState(false);
  // Ce qui est envoyé pendant une rédaction est figé à son lancement ; une rédaction abandonnée n'écrit plus rien.
  const run = useRef(0);
  const frozen = useRef<{ source: string; titleHint: string; audience: AiAudience; plan: AiPlanInput } | null>(null);

  useEffect(() => {
    clearAiPrefill();
    return () => {
      run.current += 1;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    aiStatus().then((s) => {
      if (alive) setStatus(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  const paragraphs = useMemo(() => splitSource(source), [source]);
  const sourceLength = source.trim().length;
  // La classe ne vaut que pour un cours scolaire ; ailleurs, le niveau choisi.
  const contentClass = domain === 'Scolaire' && classLabel ? classLabel : undefined;
  const audience = audienceFor(contentClass, level);
  const target = LANGUAGE_TARGETS[readingBandOf(contentClass)];
  const available = Boolean(status?.text && status.plan);
  const canPlan = available && sourceLength >= AI_SOURCE_MIN && sourceLength <= AI_SOURCE_MAX && (domain !== 'Scolaire' || Boolean(classLabel));

  /* ---------------------------------------------------------------- le plan */
  const askPlan = async () => {
    setError('');
    setPlanning(true);
    try {
      const res = await proposePlan(source.trim(), titleHint.trim(), audience);
      setModel(res.model);
      setPlanTitle(res.plan.title || titleHint.trim());
      setGoals(res.plan.goals);
      setRows(planRows(res.plan));
      setPlanGaps(res.plan.gaps);
      setPhase('plan');
    } catch (e: any) {
      setError(e?.message || 'Le plan n’a pas pu être proposé.');
    } finally {
      setPlanning(false);
    }
  };

  const patchRow = (id: string, patch: Partial<PlanRow>) => setRows((list) => list.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  const moveRow = (from: number, to: number) =>
    setRows((list) => {
      if (to < 0 || to >= list.length) return list;
      const next = [...list];
      const [row] = next.splice(from, 1);
      next.splice(to, 0, row);
      return next;
    });

  /* ---------------------------------------------------------------- la rédaction */
  const setDraft = (i: number, draft: SectionDraft) => setDrafts((list) => list.map((x, j) => (j === i ? draft : x)));

  /** Rédige une section ; un échec passager du service vaut un second essai avant de le signaler. */
  const writeOne = async (id: number, i: number) => {
    const sent = frozen.current;
    if (!sent) return;
    setDraft(i, { status: 'writing' });
    // Une section relancée redevient à relire, même si elle avait été retirée.
    setKeepSections((prev) => prev.map((v, j) => (j === i ? null : v)));
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const res = await writeSection(sent.source, sent.titleHint, sent.audience, sent.plan, i);
        if (run.current !== id) return;
        setDraft(i, { status: 'ready', section: sectionFromAi(res.section, `sec-${i + 1}`), gaps: res.gaps });
        setModel(res.model);
        return;
      } catch (e: any) {
        if (run.current !== id) return;
        if (attempt === 1) setDraft(i, { status: 'error', error: e?.message || 'La section n’a pas pu être rédigée.' });
      }
    }
  };

  /** Deux sections à la fois : le module s'écrit sous les yeux de l'encadreur, sans saturer le service. */
  const writeSections = async (id: number, indexes: number[]) => {
    let cursor = 0;
    const worker = async () => {
      while (cursor < indexes.length && run.current === id) {
        const i = indexes[cursor];
        cursor += 1;
        await writeOne(id, i);
      }
    };
    await Promise.all([worker(), worker()]);
  };

  const fetchQuiz = async (id: number) => {
    const sent = frozen.current;
    if (!sent) return;
    setQuizState('writing');
    setQuizError('');
    try {
      const res = await writeQuiz(sent.source, sent.titleHint, sent.audience, sent.plan);
      if (run.current !== id) return;
      setQuestions(res.questions);
      setSteps(res.steps);
      setKeepQuestions(res.questions.map(() => null));
      setKeepSteps(res.steps.map(() => null));
      setQuizState('ready');
    } catch (e: any) {
      if (run.current !== id) return;
      setQuizError(e?.message || 'Le quiz n’a pas pu être préparé.');
      setQuizState('error');
    }
  };

  const startWriting = () => {
    if (!isPlanReady(rows)) return;
    const plan: AiPlanInput = {
      title: planTitle.trim(),
      goals: formatGoals(goals).map((goal) => goal.replace(/\s*[;.]$/, '')),
      sections: rows.map((row) => ({ title: row.title.trim(), idea: row.idea.trim() }))
    };
    frozen.current = { source: source.trim(), titleHint: planTitle.trim() || titleHint.trim(), audience, plan };
    run.current += 1;
    const id = run.current;
    setError('');
    setDrafts(rows.map(() => ({ status: 'writing' })));
    setKeepSections(rows.map(() => null));
    setQuestions([]);
    setSteps([]);
    setKeepQuestions([]);
    setKeepSteps([]);
    setImages([]);
    setImgPhase('idle');
    setImgError('');
    setEditing(null);
    setOpenItem('sec-0');
    setPhase('review');
    void writeSections(
      id,
      rows.map((_, i) => i)
    );
    void fetchQuiz(id);
  };

  const backToPlan = () => {
    run.current += 1;
    setConfirmPlan(false);
    setPhase('plan');
  };

  const illustrate = async () => {
    if (steps.length === 0) return;
    setImgError('');
    setImgPhase('loading');
    try {
      const res = await illustrateSteps(
        steps.map((s) => s.illustrationPrompt),
        imgSize
      );
      setImages(steps.map((_, i) => res[i]?.url));
      const failures = steps.map((_, i) => res[i]).filter((r) => !r?.url);
      if (failures.length) {
        const reason = failures.find((r) => r?.error)?.error;
        setImgError(`${failures.length} illustration(s) indisponible(s)${reason ? ` : ${reason}` : '.'}`);
      }
      setImgPhase(res.some((r) => r?.url) ? 'done' : 'idle');
    } catch (e: any) {
      setImgError(e?.message || 'Illustrations indisponibles.');
      setImgPhase('idle');
    }
  };

  const patchDraftSection = (i: number, next: StudioSection) => setDrafts((list) => list.map((x, j) => (j === i ? { ...x, section: next } : x)));
  const patchQuestion = (i: number, patch: Partial<AiQuestion>) => setQuestions((list) => list.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  const patchStep = (i: number, caption: string) => setSteps((list) => list.map((s, j) => (j === i ? { ...s, caption } : s)));
  const decide = (setter: React.Dispatch<React.SetStateAction<BlockDecision[]>>, i: number, keep: boolean) =>
    setter((prev) => prev.map((v, j) => (j === i ? keep : v)));
  const toggleOpen = (key: string) => setOpenItem((cur) => (cur === key ? '' : key));

  /* ---------------------------------------------------------------- le brouillon */
  // Une section non rédigée attend d'être relancée ou retirée ; une section en cours de rédaction attend.
  const sectionDecisions: BlockDecision[] = drafts.map((draft, i) => (draft.status === 'ready' || keepSections[i] === false ? (keepSections[i] ?? null) : null));
  const pending = pendingCount(sectionDecisions, keepQuestions, keepSteps);
  const writing = drafts.filter((d) => d.status === 'writing').length;
  const ready = pending === 0 && quizState !== 'writing' && drafts.length > 0;

  const createDraft = () => {
    if (!ready) return;
    const sections = drafts
      .filter((draft, i) => draft.status === 'ready' && draft.section && keepSections[i] === true)
      .map((draft, i) => ({ ...draft.section!, id: `sec-${i + 1}`, title: draft.section!.title.trim() || `Section ${i + 1}` }));
    if (sections.length === 0) {
      setError('Gardez au moins une section pour créer le brouillon.');
      return;
    }
    const quiz = questions
      .filter((_, i) => keepQuestions[i] === true)
      .map((q) => ({
        prompt: q.prompt.trim(),
        options: q.options.map((o) => o.trim()),
        correctIndex: q.correctIndex,
        explanation: q.explanation.trim()
      }));
    const kept = steps
      .map((s, i) => ({ caption: s.caption.trim(), imageUrl: images[i], keep: keepSteps[i] === true }))
      .filter((s) => s.keep && s.caption)
      .map(({ caption, imageUrl }) => ({ caption, imageUrl }));
    const author = user?.name || 'l’encadreur';
    const id = newStudioId('st-ai');
    const item: StudioContent = {
      id,
      type: 'module',
      title: planTitle.trim() || titleHint.trim() || 'Module sans titre',
      domain,
      level: contentClass ? undefined : level,
      classLabel: contentClass,
      goals: goals.length ? goals : undefined,
      version: 'v1',
      pubStatus: 'Brouillon',
      reviewStatus: 'Non soumise',
      audience: 'Membres autorisés',
      duration: `${moduleMinutes(sections, quiz.length, contentClass)} min`,
      sources: `Explication de ${author} · structuration assistée par IA${kept.some((s) => s.imageUrl) ? ' · illustrations générées par IA' : ''}`,
      updatedAt: 'Brouillon créé avec l’IA',
      updatedAtMs: Date.now(),
      authorName: user?.name,
      sections,
      quiz: quiz.length ? quiz : undefined,
      steps: kept.length ? kept : undefined,
      aiAssisted: true
    };
    updateExt((prev) => ({
      ...prev,
      studioContents: [item, ...prev.studioContents],
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor: author,
        action: 'Brouillon créé avec l’IA',
        target: item.title,
        scope: 'Studio',
        result: 'Succès',
        justification: `Plan corrigé puis sections (${model || 'modèle de texte'}) relues par l’auteur ; aucune publication automatique.`
      })
    }));
    setToast('Brouillon créé : terminez-le dans l’éditeur, puis publiez-le quand il est prêt.');
    nav('studio-editor', id);
  };

  /* ---------------------------------------------------------------- 1. votre texte */
  if (phase === 'compose') {
    const missing = AI_SOURCE_MIN - sourceLength;
    return (
      <StudioShell active="studio-ocr" nav={nav}>
        <PageHeader
          title="Créer avec l’IA"
          subtitle="Collez votre explication et dites pour qui vous écrivez : l’IA propose un plan, puis rédige le module au format des cours. Vous relisez tout avant d’enregistrer."
        />
        <AiStepper step={1} />
        {prefill && (
          <p className="sx-origin">
            <CornerDownRight size={16} aria-hidden="true" />
            <span>{prefill.origin}</span>
          </p>
        )}
        {status && !available && (
          <p className="sx-inline-status">
            <StatusDot tone="warn">Service indisponible pour le moment</StatusDot>
            <button type="button" className="li-text-link" onClick={() => nav('studio')}>
              Créer un contenu à la main
            </button>
          </p>
        )}

        <div className="sx-ai-compose">
          <section className="sx-card sx-form" aria-label="Votre explication">
            <label className="ui-field">
              <span>Titre (facultatif)</span>
              <input value={titleHint} maxLength={120} placeholder="Ex. Sauvegarder ses fichiers importants" onChange={(e) => setTitleHint(e.target.value)} />
            </label>
            <div className="sx-form-row">
              <label className="ui-field">
                <span>Domaine</span>
                <Select value={domain} onChange={(e) => setDomain(e.target.value as StudioContent['domain'])}>
                  {DOMAINS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </label>
              {domain === 'Scolaire' ? (
                <label className="ui-field">
                  <span>Classe</span>
                  <Select value={classLabel} onChange={(e) => setClassLabel(e.target.value)}>
                    <option value="">Choisir une classe</option>
                    {CLASS_LADDER.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </Select>
                  <small>La classe règle la longueur des phrases, le nombre de sections et la taille du texte.</small>
                </label>
              ) : (
                <label className="ui-field">
                  <span>Niveau</span>
                  <Select value={level} onChange={(e) => setLevel(e.target.value as DifficultyLevel)}>
                    {DIFFICULTY_LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </Select>
                  <small>{LEVEL_CRITERIA[level].who}</small>
                </label>
              )}
            </div>
            <label className="ui-field">
              <span>Votre explication</span>
              <textarea
                rows={12}
                maxLength={AI_SOURCE_MAX}
                value={source}
                placeholder="Expliquez la notion comme à un apprenant : étapes, règles, exemples chiffrés, erreurs à éviter…"
                onChange={(e) => setSource(e.target.value)}
              />
              <small className="sx-counter tabular-nums">
                <span>{sourceLength > 0 && missing > 0 ? `Encore ${plural(missing, 'caractère')} au minimum.` : ''}</span>
                <span>
                  {sourceLength} / {AI_SOURCE_MAX}
                </span>
              </small>
            </label>
            {error && (
              <p className="sx-inline-status" role="alert">
                <StatusDot tone="danger">{error}</StatusDot>
              </p>
            )}
            <details className="sx-info">
              <summary>Confidentialité et modèles utilisés</summary>
              <p>
                Seuls ce texte, le niveau ou la classe choisis, puis le plan que vous validez sont envoyés au modèle de texte (Google Gemini). N’y mettez
                pas de données personnelles ; les instructions que le texte contiendrait sont ignorées. Les illustrations, facultatives, sont générées par
                un modèle d’image (FLUX.2).
              </p>
            </details>
            <div className="sx-form-actions">
              <button type="button" className="secondary ui-btn-sm" onClick={() => setSource(AI_EXAMPLE_SOURCE)} disabled={planning}>
                Utiliser un exemple
              </button>
              <button type="button" className="primary ui-btn-sm" onClick={askPlan} disabled={!canPlan || planning}>
                {planning ? 'Lecture de votre texte… (jusqu’à une minute)' : 'Proposer un plan'}
              </button>
            </div>
          </section>

          <aside className="sx-card sx-ai-brief" aria-label="Ce que l’IA prépare">
            <h2>Ce que l’IA prépare</h2>
            <ol>
              <li>
                <b>Un plan</b> : un titre, des objectifs et une ligne par section. Vous le corrigez avant toute rédaction.
              </li>
              <li>
                <b>Chaque section au format des cours</b> : entrée en matière, cours en parties, exemple illustré, question de l’élève, résumé.
              </li>
              <li>
                <b>Un quiz et une fiche pas à pas</b>, d’après le même plan.
              </li>
            </ol>
            <p className="sx-note">
              Elle n’ajoute rien à votre texte : ce qu’il ne dit pas est signalé, pas inventé. Elle ne publie rien : vous gardez ou retirez chaque bloc.
            </p>
            <p className="sx-note tabular-nums">
              Pour {contentClass ? `la classe de ${contentClass}` : `le niveau ${level}`} : des phrases de {target.avgWords} mots en moyenne, {target.maxWords} au
              plus, et {audience.maxSections} sections au plus.
            </p>
          </aside>
        </div>
      </StudioShell>
    );
  }

  /* ---------------------------------------------------------------- 2. le plan */
  if (phase === 'plan') {
    const advice = sectionCountAdvice(rows.length, contentClass);
    const goalCount = formatGoals(goals).length;
    return (
      <StudioShell active="studio-ocr" nav={nav}>
        <PageHeader
          title="Plan du module"
          subtitle="Renommez, déplacez, retirez ou ajoutez des sections. La rédaction suivra ce plan, et lui seul."
          back={{ label: 'Modifier mon texte', onClick: () => setPhase('compose') }}
          actions={
            <button type="button" className="primary ui-btn-sm" onClick={startWriting} disabled={!isPlanReady(rows) || planning}>
              Rédiger le module
            </button>
          }
        />
        <AiStepper step={2} />
        {error && (
          <p className="sx-inline-status" role="alert">
            <StatusDot tone="danger">{error}</StatusDot>
          </p>
        )}

        <section className="sx-card sx-form" aria-label="Titre et objectifs">
          <label className="ui-field">
            <span>Titre du module</span>
            <input value={planTitle} maxLength={120} onChange={(e) => setPlanTitle(e.target.value)} />
          </label>
          <GoalsEditor goals={goals} onChange={setGoals} />
          {(goalCount < 2 || goalCount > 4) && <p className="sx-note">Un module annonce de deux à quatre objectifs.</p>}
        </section>

        <section className="sx-card" aria-label="Sections du plan">
          <h2>
            Sections <span className="sx-count tabular-nums">{rows.length}</span>
          </h2>
          <ol className="sx-plan">
            {rows.map((row, i) => (
              <li key={row.id}>
                <span className="sx-plan-n tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                <div className="sx-plan-fields">
                  <input aria-label={`Titre de la section ${i + 1}`} value={row.title} maxLength={120} placeholder="Titre de la section" onChange={(e) => patchRow(row.id, { title: e.target.value })} />
                  <textarea
                    aria-label={`Idée de la section ${i + 1}`}
                    rows={2}
                    value={row.idea}
                    maxLength={240}
                    placeholder="L’idée à apprendre, en une phrase"
                    onChange={(e) => patchRow(row.id, { idea: e.target.value })}
                  />
                </div>
                <span className="sx-plan-actions">
                  <button type="button" className="li-icon-btn" aria-label={`Monter la section ${i + 1}`} title="Monter" disabled={i === 0} onClick={() => moveRow(i, i - 1)}>
                    <ArrowUp size={16} aria-hidden="true" />
                  </button>
                  <button type="button" className="li-icon-btn" aria-label={`Descendre la section ${i + 1}`} title="Descendre" disabled={i === rows.length - 1} onClick={() => moveRow(i, i + 1)}>
                    <ArrowDown size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="li-icon-btn"
                    aria-label={`Retirer la section ${i + 1} du plan`}
                    title="Retirer du plan"
                    disabled={rows.length <= 1}
                    onClick={() => setRows((list) => list.filter((x) => x.id !== row.id))}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </span>
              </li>
            ))}
          </ol>
          {rows.length < 8 && (
            <button type="button" className="li-text-link sx-add" onClick={() => setRows((list) => [...list, { id: `plan-new-${Date.now().toString(36)}`, title: '', idea: '' }])}>
              <Plus size={16} aria-hidden="true" /> Ajouter une section
            </button>
          )}
          {advice && <p className="sx-note">{advice}</p>}
        </section>

        {planGaps.length > 0 && (
          <section className="sx-card" aria-label="Points à compléter">
            <h2>Points que votre texte ne précise pas</h2>
            <ul className="sx-gaps">
              {planGaps.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
            <p className="sx-note">L’IA les signale au lieu de les inventer : complétez votre texte, ou ajoutez-les vous-même dans le brouillon.</p>
          </section>
        )}

        <div className="sx-form-actions">
          <button type="button" className="secondary ui-btn-sm" onClick={askPlan} disabled={planning}>
            {planning ? 'Nouveau plan en cours…' : 'Proposer un autre plan'}
          </button>
          <button type="button" className="primary ui-btn-sm" onClick={startWriting} disabled={!isPlanReady(rows) || planning}>
            Rédiger le module
          </button>
        </div>
      </StudioShell>
    );
  }

  /* ---------------------------------------------------------------- 3. la relecture */
  const keptSections = drafts.filter((d, i) => d.status === 'ready' && keepSections[i] === true).length;
  const keptQuestions = keepQuestions.filter((d) => d === true).length;
  const totalBlocks = drafts.length + keepQuestions.length + keepSteps.length;
  const doneBlocks = totalBlocks - pending;
  const band = readingBandOf(contentClass);
  const allGaps = [...new Set([...planGaps, ...drafts.flatMap((d) => d.gaps || [])])];
  // Le bloc ouvert, en texte : sert à surligner les phrases proches dans le texte source.
  const openText = (() => {
    const [kind, idx] = openItem.split('-');
    const i = Number(idx);
    if (kind === 'sec') {
      const sec = drafts[i]?.section;
      return sec ? `${sec.title} ${sectionText(sec)} ${(sec.keyPoints || []).join(' ')} ${sec.tip || ''}` : '';
    }
    if (kind === 'q') {
      const q = questions[i];
      return q ? `${q.prompt} ${q.options[q.correctIndex] || ''} ${q.explanation}` : '';
    }
    return '';
  })();
  const related = relatedSentences(paragraphs, openText);
  const hint =
    writing > 0
      ? `Rédaction en cours : ${drafts.length - writing} section${drafts.length - writing > 1 ? 's' : ''} sur ${drafts.length} prête${drafts.length - writing > 1 ? 's' : ''}. Vous pouvez déjà relire.`
      : quizState === 'writing'
        ? 'Les sections sont rédigées ; le quiz arrive.'
        : ready
          ? 'Chaque bloc est relu : vous pouvez créer le brouillon.'
          : 'Le brouillon se crée une fois chaque bloc gardé ou retiré.';
  const createButton = (
    <button type="button" className="primary ui-btn-sm" onClick={createDraft} disabled={!ready} title={ready ? undefined : 'Gardez ou retirez chaque bloc avant de créer le brouillon'}>
      Créer le brouillon
    </button>
  );

  return (
    <StudioShell active="studio-ocr" nav={nav}>
      <PageHeader
        title="Proposition à relire"
        subtitle="Lisez chaque section comme l’apprenant la lira, gardez-la ou retirez-la. Rien n’est enregistré avant la création du brouillon."
        back={{ label: 'Revoir le plan', onClick: () => setConfirmPlan(true) }}
        actions={createButton}
      />
      <AiStepper step={3} />
      <div className="sx-review-bar" role="status">
        <span className="sx-review-count tabular-nums">
          <b>{doneBlocks}</b> bloc{doneBlocks > 1 ? 's' : ''} relu{doneBlocks > 1 ? 's' : ''} sur {totalBlocks}
        </span>
        <span className="sx-review-meter" aria-hidden="true">
          <i style={{ width: `${totalBlocks ? Math.round((doneBlocks / totalBlocks) * 100) : 0}%` }} />
        </span>
        <span className="sx-review-hint">{hint}</span>
      </div>
      {error && (
        <p className="sx-inline-status" role="alert">
          <StatusDot tone="danger">{error}</StatusDot>
        </p>
      )}

      <div className="sx-review-layout">
        <aside className="sx-source-pane" aria-label="Votre texte">
          <header className="sx-source-head">
            <h2>Votre texte</h2>
            <small>{related.size > 0 ? 'Surlignées : les phrases les plus proches du bloc ouvert.' : 'Ouvrez un bloc : les phrases proches de votre texte seront surlignées.'}</small>
          </header>
          <div className="sx-source-text">
            {paragraphs.map((sentences, p) => (
              <p key={p}>
                {sentences.map((sentence, si) => (
                  <React.Fragment key={si}>
                    {related.has(sentenceKey(p, si)) ? <mark>{sentence}</mark> : sentence}{' '}
                  </React.Fragment>
                ))}
              </p>
            ))}
          </div>
        </aside>

        <div className="sx-review-main">
          <section className="sx-card sx-form" aria-label="Titre et objectifs">
            <label className="ui-field">
              <span>Titre du module</span>
              <input value={planTitle} maxLength={120} onChange={(e) => setPlanTitle(e.target.value)} />
            </label>
            {formatGoals(goals).length > 0 && (
              <div className="sx-goals-preview">
                <p>À la fin de ce module, vous saurez :</p>
                <ul>
                  {formatGoals(goals).map((goal) => (
                    <li key={goal}>{goal}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {allGaps.length > 0 && (
            <section className="sx-card" aria-label="Points à compléter">
              <h2>Points que votre texte ne précise pas</h2>
              <ul className="sx-gaps">
                {allGaps.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
              <p className="sx-note">L’IA les signale au lieu de les inventer : complétez-les dans le brouillon si besoin.</p>
            </section>
          )}

          <section className="sx-card" aria-label="Sections proposées">
            <h2>
              Sections{' '}
              <span className="sx-count tabular-nums">
                {keptSections} gardée{keptSections > 1 ? 's' : ''} sur {drafts.length}
              </span>
            </h2>
            <ul className="sx-review">
              {drafts.map((draft, i) => {
                const label = `Section ${i + 1}`;
                const planned = frozen.current?.plan.sections[i]?.title || '';
                if (draft.status === 'writing') {
                  return <ReviewItem key={i} decision={null} label={label} title={planned} state="Rédaction en cours…" busy open={false} />;
                }
                if (draft.status === 'error' || !draft.section) {
                  const dropped = keepSections[i] === false;
                  return (
                    <ReviewItem
                      key={i}
                      decision={dropped ? false : null}
                      label={label}
                      title={planned}
                      state={dropped ? '' : 'Non rédigée'}
                      open={!dropped}
                      actions={
                        <>
                          <button type="button" className="secondary ui-btn-sm" onClick={() => void writeOne(run.current, i)}>
                            Réessayer
                          </button>
                          {!dropped && (
                            <button type="button" className="secondary ui-btn-sm" onClick={() => decide(setKeepSections, i, false)}>
                              Retirer
                            </button>
                          )}
                        </>
                      }
                    >
                      <p className="sx-note">{draft.error || 'La section n’a pas pu être rédigée.'} Relancez-la, ou retirez-la pour créer le brouillon sans elle.</p>
                    </ReviewItem>
                  );
                }
                const section = draft.section;
                const review = reviewSection(section, i, contentClass);
                const toFinish = review.todo.filter((item) => item.required);
                const isEditing = editing === i;
                return (
                  <ReviewItem
                    key={i}
                    decision={keepSections[i] ?? null}
                    onDecide={(keep) => decide(setKeepSections, i, keep)}
                    label={label}
                    title={section.title}
                    open={openItem === `sec-${i}`}
                    onOpen={() => toggleOpen(`sec-${i}`)}
                  >
                    {isEditing ? (
                      <SectionEditor
                        section={section}
                        review={review}
                        classLabel={contentClass}
                        canRich
                        onPatch={(patch) => patchDraftSection(i, { ...section, ...patch })}
                        onReplace={(next) => patchDraftSection(i, next)}
                      />
                    ) : (
                      <>
                        <SectionMeasure review={review} classLabel={contentClass} />
                        {toFinish.length > 0 && (
                          <p className="sx-note">
                            À finir, ici ou dans le brouillon : {toFinish.map((item) => item.text).join(' ')}
                          </p>
                        )}
                        <div className="rd-preview sx-ai-lesson" data-band={band}>
                          <div className="rd-article rd-chapter-main">
                            <div className="rd-chapter-body">
                              <LessonPart lesson={previewLesson(section, i)} index={i} />
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    <div className="sx-form-actions">
                      <button type="button" className="li-text-link" onClick={() => setEditing(isEditing ? null : i)}>
                        {isEditing ? 'Revenir à la lecture' : 'Corriger le texte'}
                      </button>
                    </div>
                  </ReviewItem>
                );
              })}
            </ul>
          </section>

          <section className="sx-card" aria-label="Questions proposées">
            <h2>
              Quiz{' '}
              {quizState === 'ready' && (
                <span className="sx-count tabular-nums">
                  {keptQuestions} gardée{keptQuestions > 1 ? 's' : ''} sur {questions.length}
                </span>
              )}
            </h2>
            {quizState === 'writing' && <p className="sx-note">Préparation du quiz et de la fiche pas à pas…</p>}
            {quizState === 'error' && (
              <p className="sx-inline-status" role="alert">
                <StatusDot tone="warn">{quizError}</StatusDot>
                <button type="button" className="li-text-link" onClick={() => void fetchQuiz(run.current)}>
                  Réessayer
                </button>
              </p>
            )}
            {quizState === 'error' && <p className="sx-note">Sans quiz, le brouillon se crée quand même : vous écrirez les questions dans l’éditeur.</p>}
            <ul className="sx-review">
              {questions.map((q, i) => (
                <ReviewItem
                  key={i}
                  decision={keepQuestions[i] ?? null}
                  onDecide={(keep) => decide(setKeepQuestions, i, keep)}
                  label={`Question ${i + 1}`}
                  title={q.prompt}
                  open={openItem === `q-${i}`}
                  onOpen={() => toggleOpen(`q-${i}`)}
                >
                  <label className="ui-field">
                    <span>Question</span>
                    <input value={q.prompt} maxLength={300} onChange={(e) => patchQuestion(i, { prompt: e.target.value })} />
                  </label>
                  <fieldset className="sx-options">
                    <legend>Réponses — cochez la bonne</legend>
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="sx-option">
                        <input
                          type="radio"
                          name={`ai-correct-${i}`}
                          aria-label={`Réponse ${oi + 1} : bonne réponse`}
                          checked={q.correctIndex === oi}
                          onChange={() => patchQuestion(i, { correctIndex: oi })}
                        />
                        <input
                          aria-label={`Texte de la réponse ${oi + 1}`}
                          value={opt}
                          maxLength={160}
                          onChange={(e) => patchQuestion(i, { options: q.options.map((o, j) => (j === oi ? e.target.value : o)) })}
                        />
                      </div>
                    ))}
                  </fieldset>
                  <label className="ui-field">
                    <span>Explication</span>
                    <textarea rows={2} value={q.explanation} maxLength={400} onChange={(e) => patchQuestion(i, { explanation: e.target.value })} />
                  </label>
                </ReviewItem>
              ))}
            </ul>
          </section>

          {steps.length > 0 && (
            <section className="sx-card" aria-label="Fiche illustrée pas à pas">
              <div className="sx-card-head">
                <h2>Fiche pas à pas</h2>
                <div className="sx-card-head-actions">
                  <label className="sx-inline-select">
                    <span>Résolution</span>
                    <Select value={imgSize} onChange={(e) => setImgSize(Number(e.target.value) as AiImageSize)} disabled={imgPhase === 'loading'}>
                      <option value={1024}>Standard · 1024 px</option>
                      <option value={1536}>Haute · 1536 px</option>
                    </Select>
                  </label>
                  <button
                    type="button"
                    className="secondary ui-btn-sm"
                    onClick={illustrate}
                    disabled={!status?.images || imgPhase === 'loading'}
                    title={status?.images ? undefined : 'Illustrations indisponibles pour le moment'}
                  >
                    {imgPhase === 'loading' ? 'Illustration en cours…' : imgPhase === 'done' ? 'Régénérer les illustrations' : 'Générer les illustrations'}
                  </button>
                </div>
              </div>
              {imgError && (
                <p className="sx-inline-status" role="alert">
                  <StatusDot tone="warn">{imgError}</StatusDot>
                </p>
              )}
              <ol className="sx-ai-steps">
                {steps.map((st, i) => (
                  <li key={i} className={keepSteps[i] === false ? 'is-dropped' : keepSteps[i] == null ? 'is-pending' : ''}>
                    <div className="sx-ai-step-visual">
                      {images[i] ? <img src={images[i]} alt="" loading="lazy" /> : <span className="tabular-nums">{imgPhase === 'loading' ? '…' : i + 1}</span>}
                    </div>
                    <textarea aria-label={`Légende de l’étape ${i + 1}`} rows={3} value={st.caption} maxLength={200} onChange={(e) => patchStep(i, e.target.value)} />
                    <Decide value={keepSteps[i] ?? null} onChange={(keep) => decide(setKeepSteps, i, keep)} label={`Étape ${i + 1}`} />
                  </li>
                ))}
              </ol>
              <p className="sx-note">Vérifiez que chaque illustration correspond bien à son étape avant de la garder.</p>
            </section>
          )}

          <div className="sx-form-actions">
            <button type="button" className="secondary ui-btn-sm" onClick={() => setConfirmPlan(true)}>
              <ArrowLeft size={16} aria-hidden="true" /> Revoir le plan
            </button>
            {createButton}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmPlan}
        title="Revoir le plan ?"
        text="Les sections déjà rédigées et vos décisions seront abandonnées : le module sera réécrit d’après le plan corrigé."
        confirmLabel="Revoir le plan"
        danger
        onConfirm={backToPlan}
        onCancel={() => setConfirmPlan(false)}
      />
    </StudioShell>
  );
}
