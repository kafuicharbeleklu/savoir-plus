/**
 * Studio — « Créer avec l'IA ».
 * L'encadreur colle son explication ; l'IA propose des sections, un quiz et une fiche pas à pas.
 * L'auteur relit, décoche ce qu'il ne garde pas, puis crée un brouillon (jamais de publication automatique).
 */
import React, { useEffect, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
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
import { PageHeader, Select, StatusDot } from '../../components/ui';
import { DOMAINS, newStudioId, StudioShell, type StudioProps } from './shared';

const AI_EXAMPLE_SOURCE =
  'Pour protéger ses fichiers importants (photos, devoirs, mémoire), on applique la règle 3-2-1 : garder trois copies de ses données, sur deux supports différents, dont une copie hors de chez soi. ' +
  'Concrètement, on choisit d’abord les dossiers essentiels. On copie ces dossiers sur une clé USB ou un disque externe, au moins une fois par semaine. ' +
  'On active aussi une sauvegarde en ligne protégée par un mot de passe solide et la double authentification. ' +
  'On range le disque externe dans un endroit différent de l’ordinateur. ' +
  'Enfin, une fois par mois, on vérifie qu’on peut réellement ouvrir un fichier restauré : une sauvegarde jamais testée peut être inutilisable.';

type AiPhase = 'compose' | 'generating' | 'review';

/** Élément repliable de la proposition : case « garder », titre, puis champs de correction. */
function ReviewItem({
  kept,
  onToggle,
  label,
  title,
  open,
  onOpen,
  children
}: {
  kept: boolean;
  onToggle: () => void;
  label: string;
  title: string;
  open: boolean;
  onOpen: () => void;
  children: React.ReactNode;
}) {
  return (
    <li className={`sx-review-item ${kept ? '' : 'is-dropped'}`}>
      <div className="sx-review-row">
        <input type="checkbox" checked={kept} onChange={onToggle} aria-label={`Garder : ${label}`} />
        <button type="button" className="sx-review-title" aria-expanded={open} onClick={onOpen}>
          <span className="sx-review-label">{label}</span>
          <span className="sx-review-text">{title || 'À rédiger'}</span>
          {open ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
        </button>
      </div>
      {open && <div className="sx-review-body">{children}</div>}
    </li>
  );
}

export function StudioAiView({ updateExt, nav, setToast, user }: StudioProps) {
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [titleHint, setTitleHint] = useState('');
  const [domain, setDomain] = useState<StudioContent['domain']>('Numérique');
  const [source, setSource] = useState('');
  const [phase, setPhase] = useState<AiPhase>('compose');
  const [error, setError] = useState('');
  const [model, setModel] = useState('');
  const [proposal, setProposal] = useState<AiModuleProposal | null>(null);
  const [keepSections, setKeepSections] = useState<boolean[]>([]);
  const [keepQuestions, setKeepQuestions] = useState<boolean[]>([]);
  const [keepSteps, setKeepSteps] = useState<boolean[]>([]);
  const [images, setImages] = useState<(string | undefined)[]>([]);
  const [imgPhase, setImgPhase] = useState<'idle' | 'loading' | 'done'>('idle');
  const [imgError, setImgError] = useState('');
  const [imgSize, setImgSize] = useState<AiImageSize>(1024);
  const [openItem, setOpenItem] = useState('sec-0');

  useEffect(() => {
    let alive = true;
    aiStatus().then((s) => {
      if (alive) setStatus(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  const sourceLength = source.trim().length;
  const canGenerate = Boolean(status?.text) && sourceLength >= AI_SOURCE_MIN && sourceLength <= AI_SOURCE_MAX;

  const generate = async () => {
    setError('');
    setPhase('generating');
    try {
      const res = await generateModuleProposal(source.trim(), titleHint.trim());
      setModel(res.model);
      setProposal(res.module);
      setKeepSections(res.module.sections.map(() => true));
      setKeepQuestions(res.module.questions.map(() => true));
      setKeepSteps(res.module.steps.map(() => true));
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
  const toggle = (setter: React.Dispatch<React.SetStateAction<boolean[]>>, i: number) =>
    setter((prev) => prev.map((v, j) => (j === i ? !v : v)));
  const toggleOpen = (key: string) => setOpenItem((cur) => (cur === key ? '' : key));

  const createDraft = () => {
    if (!proposal) return;
    const sections = proposal.sections
      .filter((_, i) => keepSections[i])
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
      .filter((_, i) => keepQuestions[i])
      .map((q) => ({
        prompt: q.prompt.trim(),
        options: q.options.map((o) => o.trim()),
        correctIndex: q.correctIndex,
        explanation: q.explanation.trim()
      }));
    const steps = proposal.steps
      .map((s, i) => ({ caption: s.caption.trim(), imageUrl: images[i], keep: keepSteps[i] }))
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
  const keptSections = keepSections.filter(Boolean).length;
  const keptQuestions = keepQuestions.filter(Boolean).length;

  return (
    <StudioShell active="studio-ocr" nav={nav}>
      <PageHeader
        title="Proposition à relire"
        subtitle="Décochez ce que vous ne gardez pas et corrigez le texte. Rien n’est enregistré avant la création du brouillon."
        back={{ label: 'Modifier mon texte', onClick: () => setPhase('compose') }}
        actions={
          <button type="button" className="primary ui-btn-sm" onClick={createDraft}>
            Créer le brouillon
          </button>
        }
      />
      {error && (
        <p className="sx-inline-status" role="alert">
          <StatusDot tone="danger">{error}</StatusDot>
        </p>
      )}

      <section className="sx-card sx-form" aria-label="Titre et résumé">
        <label className="ui-field">
          <span>Titre du module</span>
          <input value={proposal.title} maxLength={120} onChange={(e) => setProposal({ ...proposal, title: e.target.value })} />
        </label>
        {proposal.summary && <p className="sx-note">{proposal.summary}</p>}
        <details className="sx-info">
          <summary>Votre texte source</summary>
          <p className="sx-source">{source}</p>
        </details>
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
              kept={keepSections[i]}
              onToggle={() => toggle(setKeepSections, i)}
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
              kept={keepQuestions[i]}
              onToggle={() => toggle(setKeepQuestions, i)}
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
              <li key={i} className={keepSteps[i] ? '' : 'is-dropped'}>
                <div className="sx-ai-step-visual">
                  {images[i] ? (
                    <img src={images[i]} alt="" loading="lazy" />
                  ) : (
                    <span className="tabular-nums">{imgPhase === 'loading' ? '…' : i + 1}</span>
                  )}
                </div>
                <textarea aria-label={`Légende de l’étape ${i + 1}`} rows={3} value={st.caption} maxLength={200} onChange={(e) => patchStep(i, e.target.value)} />
                <label className="sx-keep">
                  <input type="checkbox" checked={keepSteps[i]} onChange={() => toggle(setKeepSteps, i)} /> Garder l’étape {i + 1}
                </label>
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
        <button type="button" className="primary ui-btn-sm" onClick={createDraft}>
          Créer le brouillon
        </button>
      </div>
    </StudioShell>
  );
}
