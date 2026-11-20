/**
 * Studio — « Créer avec l'IA ».
 * L'encadreur colle son explication ; l'IA propose des sections, un quiz et une fiche pas à pas.
 * L'auteur relit chaque bloc, son texte à côté, le garde ou le retire, puis crée un brouillon :
 * le bouton ne s'active qu'une fois chaque bloc relu (jamais de publication automatique).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, ChevronDown, ChevronUp, CornerDownRight } from 'lucide-react';
import {
  AI_SOURCE_MAX,
  AI_SOURCE_MIN,
  aiStatus,
  generateModuleProposal,
  illustrateSteps,
  type AiImageSize,
  type AiModuleProposal,
  type AiStatus
} from '../../ai';
import { appendAuditLog, type StudioContent } from '../../wireframeData';
import { clearAiPrefill, peekAiPrefill } from '../../aiPrefill';
import { pendingCount, relatedSentences, sentenceKey, splitSource, type BlockDecision } from '../../aiReview';
import { PageHeader, Select, StatusDot } from '../../components/ui';
import { DOMAINS, newStudioId, StudioShell, type StudioProps } from './shared';

const AI_EXAMPLE_SOURCE =
  'Pour protéger ses fichiers importants (photos, devoirs, mémoire), on applique la règle 3-2-1 : garder trois copies de ses données, sur deux supports différents, dont une copie hors de chez soi. ' +
  'Concrètement, on choisit d’abord les dossiers essentiels. On copie ces dossiers sur une clé USB ou un disque externe, au moins une fois par semaine. ' +
  'On active aussi une sauvegarde en ligne protégée par un mot de passe solide et la double authentification. ' +
  'On range le disque externe dans un endroit différent de l’ordinateur. ' +
  'Enfin, une fois par mois, on vérifie qu’on peut réellement ouvrir un fichier restauré : une sauvegarde jamais testée peut être inutilisable.';

type AiPhase = 'compose' | 'generating' | 'review';

/** Les trois temps de la création : votre texte, la relecture, le brouillon. */
function AiStepper({ step }: { step: 1 | 2 }) {
  const steps = ['Votre texte', 'Relecture', 'Brouillon'];
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

/** Bloc de la proposition : titre repliable, état de relecture, décision, puis champs de correction. */
function ReviewItem({
  decision,
  onDecide,
  label,
  title,
  open,
  onOpen,
  children
}: {
  decision: BlockDecision;
  onDecide: (keep: boolean) => void;
  label: string;
  title: string;
  open: boolean;
  onOpen: () => void;
  children: React.ReactNode;
}) {
  return (
    <li className={`sx-review-item${decision === false ? ' is-dropped' : ''}${decision === null ? ' is-pending' : ''}${open ? ' is-open' : ''}`}>
      <div className="sx-review-row">
        <button type="button" className="sx-review-title" aria-expanded={open} onClick={onOpen}>
          <span className="sx-review-label">
            {label}
            {decision === null && <em className="sx-review-state">À relire</em>}
          </span>
          <span className="sx-review-text">{title || 'À rédiger'}</span>
          {open ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
        </button>
        <Decide value={decision} onChange={onDecide} label={label} />
      </div>
      {open && <div className="sx-review-body">{children}</div>}
    </li>
  );
}

export function StudioAiView({ updateExt, nav, setToast, user }: StudioProps) {
  const [status, setStatus] = useState<AiStatus | null>(null);
  // Texte préparé ailleurs (fiche de rattrapage d'une classe) : repris une fois, à l'ouverture.
  const [prefill] = useState(() => peekAiPrefill());
  const [titleHint, setTitleHint] = useState(prefill?.title || '');
  const [domain, setDomain] = useState<StudioContent['domain']>(prefill?.domain || 'Numérique');
  const [source, setSource] = useState(prefill?.source || '');
  const [phase, setPhase] = useState<AiPhase>('compose');
  const [error, setError] = useState('');
  const [model, setModel] = useState('');
  const [proposal, setProposal] = useState<AiModuleProposal | null>(null);
  const [keepSections, setKeepSections] = useState<BlockDecision[]>([]);
  const [keepQuestions, setKeepQuestions] = useState<BlockDecision[]>([]);
  const [keepSteps, setKeepSteps] = useState<BlockDecision[]>([]);
  const [images, setImages] = useState<(string | undefined)[]>([]);
  const [imgPhase, setImgPhase] = useState<'idle' | 'loading' | 'done'>('idle');
  const [imgError, setImgError] = useState('');
  const [imgSize, setImgSize] = useState<AiImageSize>(1024);
  const [openItem, setOpenItem] = useState('sec-0');

  useEffect(() => {
    clearAiPrefill();
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
  const canGenerate = Boolean(status?.text) && sourceLength >= AI_SOURCE_MIN && sourceLength <= AI_SOURCE_MAX;

  const generate = async () => {
    setError('');
    setPhase('generating');
    try {
      const res = await generateModuleProposal(source.trim(), titleHint.trim());
      setModel(res.model);
      setProposal(res.module);
      setKeepSections(res.module.sections.map(() => null));
      setKeepQuestions(res.module.questions.map(() => null));
      setKeepSteps(res.module.steps.map(() => null));
      setImages([]);
      setImgPhase('idle');
      setImgError('');
      setOpenItem('sec-0');
      setPhase('review');
    } catch (e: any) {
      setError(e?.message || 'La génération a échoué.');
      setPhase('compose');
    }
  };

  const illustrate = async () => {
    if (!proposal) return;
    setImgError('');
    setImgPhase('loading');
    try {
      const res = await illustrateSteps(
        proposal.steps.map((s) => s.illustrationPrompt),
        imgSize
      );
      setImages(proposal.steps.map((_, i) => res[i]?.url));
      const failures = proposal.steps.map((_, i) => res[i]).filter((r) => !r?.url);
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

  const patchSection = (i: number, patch: Partial<AiModuleProposal['sections'][number]>) =>
    setProposal((p) => p && { ...p, sections: p.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const patchQuestion = (i: number, patch: Partial<AiModuleProposal['questions'][number]>) =>
    setProposal((p) => p && { ...p, questions: p.questions.map((q, j) => (j === i ? { ...q, ...patch } : q)) });
  const patchStep = (i: number, caption: string) =>
    setProposal((p) => p && { ...p, steps: p.steps.map((s, j) => (j === i ? { ...s, caption } : s)) });
  const decide = (setter: React.Dispatch<React.SetStateAction<BlockDecision[]>>, i: number, keep: boolean) =>
    setter((prev) => prev.map((v, j) => (j === i ? keep : v)));
  const toggleOpen = (key: string) => setOpenItem((cur) => (cur === key ? '' : key));

  const createDraft = () => {
    if (!proposal) return;
    if (pendingCount(keepSections, keepQuestions, keepSteps) > 0) return;
    const sections = proposal.sections
      .filter((_, i) => keepSections[i] === true)
      .map((s, i) => ({
        id: `sec-${i + 1}`,
        title: s.title.trim() || `Section ${i + 1}`,
        body: s.body.trim(),
        keyPoints: s.keyPoints.map((k) => k.trim()).filter(Boolean),
        tip: s.tip.trim()
      }));
    if (sections.length === 0) {
      setError('Gardez au moins une section pour créer le brouillon.');
      return;
    }
    const quiz = proposal.questions
      .filter((_, i) => keepQuestions[i] === true)
      .map((q) => ({
        prompt: q.prompt.trim(),
        options: q.options.map((o) => o.trim()),
        correctIndex: q.correctIndex,
        explanation: q.explanation.trim()
      }));
    const steps = proposal.steps
      .map((s, i) => ({ caption: s.caption.trim(), imageUrl: images[i], keep: keepSteps[i] === true }))
      .filter((s) => s.keep && s.caption)
      .map(({ caption, imageUrl }) => ({ caption, imageUrl }));
    const author = user?.name || 'l’encadreur';
    const id = newStudioId('st-ai');
    const item: StudioContent = {
      id,
      type: 'module',
      title: proposal.title.trim() || titleHint.trim() || 'Module sans titre',
      domain,
      version: 'v1',
      pubStatus: 'Brouillon',
      reviewStatus: 'Non soumise',
      audience: 'Membres autorisés',
      duration: `${Math.max(5, sections.length * 3 + 4)} min`,
      sources: `Explication de ${author} · structuration assistée par IA${steps.some((s) => s.imageUrl) ? ' · illustrations générées par IA' : ''}`,
      updatedAt: 'Brouillon créé avec l’IA',
      updatedAtMs: Date.now(),
      authorName: user?.name,
      sections,
      quiz: quiz.length ? quiz : undefined,
      steps: steps.length ? steps : undefined,
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
        justification: `Proposition (${model || 'modèle de texte'}) relue par l’auteur ; aucune publication automatique.`
      })
    }));
    setToast('Brouillon créé : relisez-le, puis publiez-le quand il est prêt.');
    nav('studio-editor', id);
  };

  /* ---------------------------------------------------------------- saisie */
  if (phase !== 'review' || !proposal) {
    const missing = AI_SOURCE_MIN - sourceLength;
    return (
      <StudioShell active="studio-ocr" nav={nav}>
        <PageHeader
          title="Créer avec l’IA"
          subtitle="Collez votre explication : l’IA propose des sections, un quiz et une fiche pas à pas, que vous relisez avant d’enregistrer."
        />
        <AiStepper step={1} />
        {prefill && (
          <p className="sx-origin">
            <CornerDownRight size={16} aria-hidden="true" />
            <span>{prefill.origin}</span>
          </p>
        )}
        {status && !status.text && (
          <p className="sx-inline-status">
            <StatusDot tone="warn">Service indisponible pour le moment</StatusDot>
            <button type="button" className="li-text-link" onClick={() => nav('studio')}>
              Créer un contenu à la main
            </button>
          </p>
        )}

        <section className="sx-card sx-form" aria-label="Votre explication">
          <div className="sx-form-row">
            <label className="ui-field">
              <span>Titre (facultatif)</span>
              <input value={titleHint} maxLength={120} placeholder="Ex. Sauvegarder ses fichiers importants" onChange={(e) => setTitleHint(e.target.value)} />
            </label>
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
          </div>
          <label className="ui-field">
            <span>Votre explication</span>
            <textarea
              rows={11}
              maxLength={AI_SOURCE_MAX}
              value={source}
              placeholder="Expliquez la notion comme à un apprenant : étapes, règles, erreurs à éviter…"
              onChange={(e) => setSource(e.target.value)}
            />
            <small className="sx-counter tabular-nums">
              <span>{sourceLength > 0 && missing > 0 ? `Encore ${missing} caractère${missing > 1 ? 's' : ''} au minimum.` : ''}</span>
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
              Seul ce texte est envoyé au modèle de texte (Google Gemini). N’y mettez pas de données personnelles ; les instructions qu’il
              contiendrait sont ignorées. Les illustrations, facultatives, sont générées par un modèle d’image (FLUX.2).
            </p>
          </details>
          <div className="sx-form-actions">
            <button type="button" className="secondary ui-btn-sm" onClick={() => setSource(AI_EXAMPLE_SOURCE)} disabled={phase === 'generating'}>
              Utiliser un exemple
            </button>
            <button type="button" className="primary ui-btn-sm" onClick={generate} disabled={!canGenerate || phase === 'generating'}>
              {phase === 'generating' ? 'Structuration en cours… (jusqu’à une minute)' : 'Générer la proposition'}
            </button>
          </div>
        </section>
      </StudioShell>
    );
  }

  /* ---------------------------------------------------------------- relecture */
  const keptSections = keepSections.filter((d) => d === true).length;
  const keptQuestions = keepQuestions.filter((d) => d === true).length;
  const pending = pendingCount(keepSections, keepQuestions, keepSteps);
  const totalBlocks = keepSections.length + keepQuestions.length + keepSteps.length;
  const ready = pending === 0;
  // Le bloc ouvert, en texte : sert à surligner les phrases proches dans le texte source.
  const openText = (() => {
    const [kind, idx] = openItem.split('-');
    const i = Number(idx);
    if (kind === 'sec') {
      const sec = proposal.sections[i];
      return sec ? `${sec.title} ${sec.body} ${sec.keyPoints.join(' ')} ${sec.tip}` : '';
    }
    if (kind === 'q') {
      const q = proposal.questions[i];
      return q ? `${q.prompt} ${q.options[q.correctIndex] || ''} ${q.explanation}` : '';
    }
    return '';
  })();
  const related = relatedSentences(paragraphs, openText);
  const createButton = (
    <button type="button" className="primary ui-btn-sm" onClick={createDraft} disabled={!ready} title={ready ? undefined : 'Gardez ou retirez chaque bloc avant de créer le brouillon'}>
      Créer le brouillon
    </button>
  );

  return (
    <StudioShell active="studio-ocr" nav={nav}>
      <PageHeader
        title="Proposition à relire"
        subtitle="Gardez ou retirez chaque bloc, corrigez le texte au besoin. Rien n’est enregistré avant la création du brouillon."
        back={{ label: 'Modifier mon texte', onClick: () => setPhase('compose') }}
        actions={createButton}
      />
      <AiStepper step={2} />
      <div className="sx-review-bar" role="status">
        <span className="sx-review-count tabular-nums">
          <b>{totalBlocks - pending}</b> bloc{totalBlocks - pending > 1 ? 's' : ''} relu{totalBlocks - pending > 1 ? 's' : ''} sur {totalBlocks}
        </span>
        <span className="sx-review-meter" aria-hidden="true">
          <i style={{ width: `${totalBlocks ? Math.round(((totalBlocks - pending) / totalBlocks) * 100) : 0}%` }} />
        </span>
        <span className="sx-review-hint">
          {ready ? 'Chaque bloc est relu : vous pouvez créer le brouillon.' : 'Le brouillon se crée une fois chaque bloc gardé ou retiré.'}
        </span>
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
          <section className="sx-card sx-form" aria-label="Titre et résumé">
            <label className="ui-field">
              <span>Titre du module</span>
              <input value={proposal.title} maxLength={120} onChange={(e) => setProposal({ ...proposal, title: e.target.value })} />
            </label>
            {proposal.summary && <p className="sx-note">{proposal.summary}</p>}
          </section>

          {proposal.gaps.length > 0 && (
            <section className="sx-card" aria-label="Points à compléter">
              <h2>Points que votre texte ne précise pas</h2>
              <ul className="sx-gaps">
                {proposal.gaps.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
              <p className="sx-note">L’IA les signale au lieu de les inventer : complétez-les dans le brouillon si besoin.</p>
            </section>
          )}

          <section className="sx-card" aria-label="Sections proposées">
            <h2>
              Sections <span className="sx-count tabular-nums">{keptSections} gardées sur {proposal.sections.length}</span>
            </h2>
            <ul className="sx-review">
              {proposal.sections.map((s, i) => (
                <ReviewItem
                  key={i}
                  decision={keepSections[i] ?? null}
                  onDecide={(keep) => decide(setKeepSections, i, keep)}
                  label={`Section ${i + 1}`}
                  title={s.title}
                  open={openItem === `sec-${i}`}
                  onOpen={() => toggleOpen(`sec-${i}`)}
                >
                  <label className="ui-field">
                    <span>Titre</span>
                    <input value={s.title} maxLength={120} onChange={(e) => patchSection(i, { title: e.target.value })} />
                  </label>
                  <label className="ui-field">
                    <span>Texte</span>
                    <textarea rows={5} value={s.body} onChange={(e) => patchSection(i, { body: e.target.value })} />
                  </label>
                  <label className="ui-field">
                    <span>Points clés</span>
                    <textarea rows={3} value={s.keyPoints.join('\n')} onChange={(e) => patchSection(i, { keyPoints: e.target.value.split('\n') })} />
                    <small>Un point par ligne.</small>
                  </label>
                  <label className="ui-field">
                    <span>Réflexe clé</span>
                    <input value={s.tip} maxLength={200} onChange={(e) => patchSection(i, { tip: e.target.value })} />
                  </label>
                </ReviewItem>
              ))}
            </ul>
          </section>

          <section className="sx-card" aria-label="Questions proposées">
            <h2>
              Quiz <span className="sx-count tabular-nums">{keptQuestions} gardées sur {proposal.questions.length}</span>
            </h2>
            <ul className="sx-review">
              {proposal.questions.map((q, i) => (
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

          {proposal.steps.length > 0 && (
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
                {proposal.steps.map((st, i) => (
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
            <button type="button" className="secondary ui-btn-sm" onClick={() => setPhase('compose')}>
              <ArrowLeft size={16} aria-hidden="true" /> Modifier mon texte
            </button>
            {createButton}
          </div>
        </div>
      </div>
    </StudioShell>
  );
}
