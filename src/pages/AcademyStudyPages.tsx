import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  List,
  RotateCcw,
  ShieldCheck,
  X,
  XCircle
} from 'lucide-react';
import type { Progress } from '../data';
import { MODULES_CONTENT, type ModuleStudyContent } from '../content';
import { isQuizPassed, moduleProgressPercent, moduleXp, quizPassThreshold, scoreAnswers } from '../domain.mjs';
import { ModuleInteractiveLab } from '../components/PhishingInspectorLab';
import { ProgressBar } from '../components/ProfileIdentityCard';
import { computeGlobalLevel } from '../personas';

function StudyTopBar({
  title,
  sectionLabel,
  pct,
  onExit,
  showTocBtn,
  onToggleToc,
  tocOpen = false
}: {
  title: string;
  sectionLabel: string;
  pct: number;
  onExit: () => void;
  showTocBtn?: boolean;
  onToggleToc?: () => void;
  tocOpen?: boolean;
}) {
  return (
    <header className="study-topbar">
      <div className="study-topbar-left">
        <button className="secondary study-exit-btn" onClick={onExit} aria-label="Quitter l’étude">
          <ArrowLeft size={15} />
          <span>Quitter l’étude</span>
        </button>
        <div className="study-breadcrumb">
          <span className="study-module-name">{title}</span>
          <span aria-hidden="true">/</span>
          <b>{sectionLabel}</b>
        </div>
      </div>

      <div className="study-topbar-right">
        <div className="study-progress-inline tabular-nums">
          <span>Avancement</span>
          <ProgressBar value={pct} label="Avancement du module" tone="htb" />
          <b>{pct}%</b>
        </div>

        {showTocBtn && onToggleToc && (
          <button className="secondary study-toc-mobile-btn" onClick={onToggleToc} aria-expanded={tocOpen}>
            <List size={15} /> Sommaire
          </button>
        )}
      </div>
    </header>
  );
}

/** Fiche illustrée pas à pas d'un module (créé avec le Studio IA). */
function IllustratedSteps({
  steps,
  aiAssisted
}: {
  steps: { caption: string; imageUrl?: string }[];
  aiAssisted?: boolean;
}) {
  return (
    <section className="ai-fiche" aria-label="Fiche illustrée pas à pas">
      <div className="between ai-fiche-head">
        <span className="study-type-tag">Fiche pas à pas</span>
        {aiAssisted && (
          <span className="tiny muted">
            {steps.some((s) => s.imageUrl)
              ? 'Structurée et illustrée avec l’IA, relue par l’auteur'
              : 'Structurée avec l’IA, relue par l’auteur'}
          </span>
        )}
      </div>
      <ol className="ai-fiche-grid">
        {steps.map((s, i) => (
          <li key={`${i}-${s.caption}`} className="ai-fiche-step">
            <span className="ai-step-num tabular-nums" aria-hidden="true">
              {i + 1}
            </span>
            {s.imageUrl && <img src={s.imageUrl} alt="" loading="lazy" />}
            <p>{s.caption}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function AcademyReaderView({
  moduleContent = MODULES_CONTENT.phishing,
  progress,
  lessonIndex,
  setLessonIndex,
  busy,
  onCompleteLesson,
  onOpenQuizIntro,
  onExit
}: {
  moduleContent?: ModuleStudyContent;
  progress: Progress;
  lessonIndex: number;
  setLessonIndex: (i: number) => void;
  busy: boolean;
  onCompleteLesson: () => void;
  onOpenQuizIntro: () => void;
  onExit: () => void;
}) {
  const [tocOpen, setTocOpen] = useState(false);

  useEffect(() => {
    if (!tocOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTocOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tocOpen]);

  const lessonList = moduleContent.lessons;
  const safeIndex = Math.max(0, Math.min(lessonIndex, lessonList.length - 1));
  const current = lessonList[safeIndex] || lessonList[0];
  const answerKey = moduleContent.questions.map((q) => q.correctIndex);
  const pct = moduleProgressPercent(progress, lessonList.length, answerKey);
  const points = moduleXp(progress, lessonList.length, answerKey);
  const maxXp = lessonList.length * 25 + 75;
  const alreadyDone = progress.lessons.includes(safeIndex);

  return (
    <div className="study-shell">
      <StudyTopBar
        title={moduleContent.title}
        sectionLabel={`Section 0${safeIndex + 1} · ${current.title}`}
        pct={pct}
        onExit={onExit}
        showTocBtn
        tocOpen={tocOpen}
        onToggleToc={() => setTocOpen(!tocOpen)}
      />

      <div className="shell-scroll-viewport">
        <div className="study-workspace">
        <aside className={`study-toc-pane ${tocOpen ? 'open' : ''}`} aria-label="Sommaire du module">
          <div className="study-toc-head">
            <div className="study-toc-head-meta">
              <span className="eyebrow">Sommaire du module</span>
              <b className="tabular-nums">
                {points} / {maxXp} XP débloqués
              </b>
            </div>
            <button className="icon-btn study-toc-close" aria-label="Fermer le sommaire" onClick={() => setTocOpen(false)}>
              <X size={16} />
            </button>
          </div>

          <ProgressBar value={pct} label="Avancement global" tone="htb" />

          <div className="study-toc-list">
            {lessonList.map((item, idx) => {
              const done = progress.lessons.includes(idx);
              const active = idx === safeIndex;
              return (
                <button
                  key={item.title}
                  className={`study-toc-item ${active ? 'current' : ''} ${done ? 'done' : ''}`}
                  onClick={() => {
                    setLessonIndex(idx);
                    setTocOpen(false);
                  }}
                >
                  <span className="toc-index tabular-nums">{done ? <Check size={13} /> : `0${idx + 1}`}</span>
                  <div className="toc-text">
                    <b>{item.title}</b>
                    <small>
                      Théorie · {item.minutes} · +25 XP
                    </small>
                  </div>
                </button>
              );
            })}

            <button
              className="study-toc-item quiz-entry"
              onClick={() => {
                setTocOpen(false);
                onOpenQuizIntro();
              }}
            >
              <span className="toc-index tabular-nums">
                {isQuizPassed(progress, answerKey) ? <Check size={13} /> : `0${lessonList.length + 1}`}
              </span>
              <div className="toc-text">
                <b>Évaluation finale (Quiz)</b>
                <small>
                  <HelpCircle size={12} /> {moduleContent.questions.length} questions · +75 XP
                </small>
              </div>
            </button>
          </div>

          <p className="study-toc-note tiny muted">
            La lecture et la réussite au quiz sont enregistrées séparément. Vous pouvez revoir n’importe quelle section
            sans perdre vos acquis.
          </p>
        </aside>

        <article key={safeIndex} className="study-main-pane section-transition">
          <div className="study-section-meta">
            <span className="study-type-tag">
              <BookOpen size={13} /> Théorie & Atelier guidé
            </span>
            <span className="study-duration tabular-nums">
              <Clock size={13} /> {current.minutes}
            </span>
            {alreadyDone && (
              <span className="study-done-mark">
                <CheckCircle2 size={14} /> Lecture terminée
              </span>
            )}
          </div>

          <h1>{current.title}</h1>
          <p className="study-lead">{current.intro}</p>
          <p className="study-body">{current.body}</p>

          {moduleContent.steps?.length
            ? safeIndex === 0 && <IllustratedSteps steps={moduleContent.steps} aiAssisted={moduleContent.aiAssisted} />
            : (safeIndex === 0 || safeIndex === 1) && <ModuleInteractiveLab labType={moduleContent.labType} />}

          <div className="study-points-box">
            <h3>Points essentiels à retenir</h3>
            <ul className="study-points-list">
              {current.points.map((pt) => (
                <li key={pt}>
                  <CheckCircle2 size={16} />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="tip">
            <ShieldCheck size={18} />
            <div>
              <b>Réflexe clé</b>
              <p>{current.tip}</p>
            </div>
          </div>

          <div className="lesson-actions">
            {safeIndex > 0 ? (
              <button className="secondary" onClick={() => setLessonIndex(safeIndex - 1)}>
                <ArrowLeft size={15} /> Section précédente
              </button>
            ) : (
              <span />
            )}

            <button className="primary" disabled={busy} onClick={onCompleteLesson}>
              {alreadyDone
                ? safeIndex < lessonList.length - 1
                  ? 'Section suivante'
                  : 'Accéder au quiz final'
                : safeIndex < lessonList.length - 1
                  ? 'J’ai terminé cette lecture · Suivant (+25 XP)'
                  : 'J’ai terminé · Passer au quiz (+25 XP)'}
              <ArrowRight size={15} />
            </button>
          </div>
        </article>
        </div>
      </div>
    </div>
  );
}

export function AcademyQuizIntroView({
  moduleContent = MODULES_CONTENT.phishing,
  progress,
  onStartQuiz,
  onBackToReader,
  onExit
}: {
  moduleContent?: ModuleStudyContent;
  progress: Progress;
  onStartQuiz: () => void;
  onBackToReader: () => void;
  onExit: () => void;
}) {
  const pct = moduleProgressPercent(
    progress,
    moduleContent.lessons.length,
    moduleContent.questions.map((q) => q.correctIndex)
  );
  const qLen = moduleContent.questions.length;
  const passThreshold = quizPassThreshold(qLen);

  return (
    <div className="study-shell">
      <StudyTopBar
        title={moduleContent.title}
        sectionLabel="Consignes de l’évaluation"
        pct={pct}
        onExit={onExit}
      />
      <div className="shell-scroll-viewport">
        <div className="study-centered-pane">
        <div className="quiz-intro-card">
          <span className="eyebrow">Évaluation formative</span>
          <h1>{moduleContent.quizTitle}</h1>
          <p>
            Consultez ces consignes avant de démarrer. Le simple affichage de cette page ne consomme aucune tentative.
          </p>

          <div className="quiz-rules-grid">
            <div>
              <span>Format</span>
              <b>{qLen} questions · Choix unique</b>
            </div>
            <div>
              <span>Seuil conseillé</span>
              <b className="tabular-nums">
                {passThreshold} / {qLen} bonnes réponses
              </b>
            </div>
            <div>
              <span>Temps</span>
              <b>Sans limite de durée</b>
            </div>
            <div>
              <span>Correction</span>
              <b>Explications détaillées après envoi</b>
            </div>
          </div>

          <div className="quiz-intro-actions">
            <button className="secondary" onClick={onBackToReader}>
              <ArrowLeft size={15} /> Revenir aux leçons
            </button>
            <button className="primary" onClick={onStartQuiz}>
              {progress.submitted ? 'Faire une nouvelle tentative' : 'Commencer le quiz'}
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export function AcademyQuizView({
  moduleContent = MODULES_CONTENT.phishing,
  progress,
  answers,
  setAnswers,
  busy,
  onSubmit,
  onExit
}: {
  moduleContent?: ModuleStudyContent;
  progress: Progress;
  answers: number[];
  setAnswers: (a: number[]) => void;
  busy: boolean;
  onSubmit: () => void;
  onExit: () => void;
}) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const qList = moduleContent.questions;
  const qLen = qList.length;
  const answeredCount = answers.slice(0, qLen).filter((a) => a !== undefined && a !== null).length;
  const pct = moduleProgressPercent(
    progress,
    moduleContent.lessons.length,
    qList.map((q) => q.correctIndex)
  );

  return (
    <div className="study-shell">
      <StudyTopBar
        title={moduleContent.title}
        sectionLabel="Quiz de validation"
        pct={pct}
        onExit={onExit}
      />

      <div className="shell-scroll-viewport">
        <div className="study-centered-pane">
        <div className="quiz-wrap">
          <div className="quiz-label">
            <HelpCircle size={16} />
            <b>Répondez aux {qLen} questions puis vérifiez votre récapitulatif avant envoi.</b>
            <span className="quiz-count tabular-nums" aria-live="polite">
              {answeredCount} / {qLen} réponses sélectionnées
            </span>
          </div>

          {qList.map((q, qi) => (
            <fieldset key={q.text} className="question">
              <legend>
                <span className="tabular-nums">0{qi + 1}</span>
                <span>{q.text}</span>
              </legend>
              {q.answers.map((opt, oi) => {
                const chosen = answers[qi] === oi;
                return (
                  <label key={opt} className={chosen ? 'chosen' : ''}>
                    <input
                      type="radio"
                      name={`q-${qi}`}
                      checked={chosen}
                      onChange={() => {
                        const next = [...answers];
                        next[qi] = oi;
                        setAnswers(next);
                      }}
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </fieldset>
          ))}

          {!reviewOpen ? (
            <div className="quiz-submit-row">
              <button className="secondary" onClick={onExit}>
                Quitter et garder mes réponses
              </button>
              <button className="primary" onClick={() => setReviewOpen(true)}>
                Vérifier et envoyer mes réponses <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <div
              className={`quiz-confirm-box ${answeredCount < qLen ? 'has-missing' : ''}`}
              role="region"
              aria-label="Récapitulatif avant envoi"
            >
              <h3>Récapitulatif avant soumission définitive</h3>
              <p className="tabular-nums">
                Vous avez répondu à{' '}
                <b>
                  {answeredCount} question(s) sur {qLen}
                </b>
                .{' '}
                {answeredCount < qLen
                  ? 'Attention : les questions sans réponse vaudront 0 point.'
                  : 'Toutes les questions ont une réponse sélectionnée.'}
              </p>
              <div className="quiz-submit-row">
                <button className="secondary" onClick={() => setReviewOpen(false)}>
                  Continuer à répondre
                </button>
                <button className="primary" disabled={busy} onClick={onSubmit}>
                  Confirmer et envoyer
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

export function AcademyResultView({
  moduleContent = MODULES_CONTENT.phishing,
  progress,
  onRetryQuiz,
  onReviewLessons,
  onOpenLearning,
  onExit,
  totalXP,
  nextModule,
  onOpenNextModule
}: {
  moduleContent?: ModuleStudyContent;
  progress: Progress;
  onRetryQuiz: () => void;
  onReviewLessons: (sectionIdx: number) => void;
  onOpenLearning: () => void;
  onExit: () => void;
  totalXP: number;
  nextModule?: { id: string; title: string };
  onOpenNextModule?: (moduleId: string) => void;
}) {
  const qList = moduleContent.questions;
  const qLen = qList.length;
  const correctIndices = qList.map((q) => q.correctIndex);
  const s = scoreAnswers(progress.answers || [], correctIndices);
  const passThreshold = quizPassThreshold(qLen);
  const passed = isQuizPassed(progress, correctIndices);
  const lessonCount = moduleContent.lessons.length;
  const pct = moduleProgressPercent(progress, lessonCount, correctIndices);
  const missingLessons = moduleContent.lessons.map((_, i) => i).filter((i) => !progress.lessons.includes(i));
  const moduleValidated = passed && missingLessons.length === 0;

  // Récompense : les 75 XP du quiz ne sont acquis qu'au-dessus du seuil ; on signale la montée de niveau
  // lorsque ces XP font franchir un palier.
  const quizXp = passed ? 75 : 0;
  const lvl = computeGlobalLevel(totalXP);
  const levelUp = passed && computeGlobalLevel(Math.max(0, totalXP - quizXp)).level < lvl.level;

  const eyebrow = moduleValidated ? 'Module validé' : passed ? 'Quiz réussi' : 'Révision conseillée';
  const headline = passed ? 'Bravo, vos réflexes sont solides.' : 'Prenez le temps de revoir les points clés.';
  const lead = moduleValidated
    ? 'Résultat enregistré. Les explications ci-dessous vous aident à consolider chaque situation.'
    : passed
      ? `Quiz réussi. Terminez ${missingLessons.length > 1 ? 'les sections restantes' : 'la section restante'} pour valider le module.`
      : `Seuil de réussite : ${passThreshold} / ${qLen}. Revoyez les sections indiquées puis retentez le quiz, sans pénalité.`;

  return (
    <div className="study-shell">
      <StudyTopBar
        title={moduleContent.title}
        sectionLabel="Résultat & Correction"
        pct={pct}
        onExit={onExit}
      />

      <div className="shell-scroll-viewport">
        <div className="study-centered-pane">
        <div className="result-wrap">
          <div className="result-icon">
            <Award size={40} />
          </div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{headline}</h1>
          <p>{lead}</p>

          <div className="score-display tabular-nums" aria-label={`Score : ${s} sur ${qLen}`}>
            {s}
            <span> / {qLen}</span>
          </div>

          {passed && (
            <div className={`result-reward ${levelUp ? 'is-levelup' : ''}`} role="status">
              <div className="result-reward-head">
                <span className="result-xp-gain tabular-nums">+{quizXp} XP</span>
                <span className="result-level tabular-nums">
                  {levelUp ? (
                    <>
                      <Award size={16} /> Niveau {lvl.level} atteint !
                    </>
                  ) : (
                    <>Niveau {lvl.level}</>
                  )}
                </span>
              </div>
              <ProgressBar value={lvl.percent} label="Progression vers le niveau suivant" tone="htb" />
              <small className="tiny muted tabular-nums">
                {lvl.currentXp} / {lvl.targetXp} XP vers le niveau {lvl.level + 1} · {totalXP} XP au total · XP
                illustratifs (démo)
              </small>
            </div>
          )}

          <div className="result-review">
            {qList.map((q, qi) => {
              const userAns = (progress.answers || [])[qi];
              const ok = userAns === q.correctIndex;
              const chosenLabel = userAns !== undefined && userAns >= 0 ? q.answers[userAns] : undefined;
              return (
                <div key={q.text}>
                  <span className={ok ? 'correct' : 'incorrect'}>
                    {ok ? <Check size={14} /> : <XCircle size={14} />}
                    {ok ? 'Correct' : 'Incorrect'}
                  </span>
                  <div>
                    <b>
                      Question 0{qi + 1} · {q.text}
                    </b>
                    <p className="result-answer-line">
                      Votre réponse : {chosenLabel ?? 'aucune réponse'}
                      {!ok && (
                        <>
                          <br />
                          Bonne réponse : <b>{q.answers[q.correctIndex]}</b>
                        </>
                      )}
                    </p>
                    <p>{q.explanation}</p>
                    <button
                      className="text-link"
                      onClick={() => onReviewLessons(Math.min(lessonCount - 1, qi))}
                    >
                      <FileText size={13} /> Revoir la section associée
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="result-buttons">
            {passed && missingLessons.length > 0 ? (
              <button className="secondary" onClick={() => onReviewLessons(missingLessons[0])}>
                <BookOpen size={15} /> Terminer la section 0{missingLessons[0] + 1}
              </button>
            ) : (
              <button className={passed ? 'secondary' : 'primary'} onClick={onRetryQuiz}>
                <RotateCcw size={15} /> Nouvelle tentative
              </button>
            )}
            {passed && nextModule && onOpenNextModule ? (
              <button className="primary" onClick={() => onOpenNextModule(nextModule.id)}>
                Module suivant : {nextModule.title} <ArrowRight size={15} />
              </button>
            ) : (
              <button className={passed ? 'primary' : 'secondary'} onClick={onOpenLearning}>
                Retour à Mes apprentissages <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
