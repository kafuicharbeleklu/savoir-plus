/**
 * Lecteur d'un module : sections, consignes du quiz, quiz, résultat.
 * Une barre fine en haut (titre, étape, avancement), une colonne de lecture,
 * et le sommaire en étapes à droite. Les quatre écrans partagent ce cadre.
 */
import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Award, Check, List, RotateCcw, X } from 'lucide-react';
import type { Progress } from '../data';
import { MODULES_CONTENT, type ModuleStudyContent } from '../content';
import { isQuizPassed, moduleProgressPercent, moduleXp, quizPassThreshold, scoreAnswers } from '../domain.mjs';
import { ModuleInteractiveLab } from '../components/PhishingInspectorLab';
import { ProgressBar } from '../components/ProfileIdentityCard';
import { computeGlobalLevel } from '../personas';

/* ------------------------------------------------------------------ cadre */

function ReaderTopBar({
  title,
  step,
  pct,
  onExit,
  outlineOpen,
  onToggleOutline
}: {
  title: string;
  /** Où l'on se trouve : « Section 1 sur 3 », « Quiz final », « Résultat ». */
  step: string;
  pct: number;
  onExit: () => void;
  outlineOpen?: boolean;
  onToggleOutline?: () => void;
}) {
  return (
    <header className="rd-top">
      <button type="button" className="rd-top-btn" onClick={onExit} title="Quitter le module" aria-label="Quitter le module">
        <X size={20} aria-hidden="true" />
      </button>
      <div className="rd-top-title">
        <b>{title}</b>
        <span>{step}</span>
      </div>
      <span className="rd-top-pct tabular-nums" aria-hidden="true">
        {pct} %
      </span>
      {onToggleOutline && (
        <button
          type="button"
          className="rd-top-btn rd-top-outline"
          onClick={onToggleOutline}
          aria-expanded={outlineOpen}
          title="Sommaire"
          aria-label="Sommaire du module"
        >
          <List size={20} aria-hidden="true" />
        </button>
      )}
      <span
        className="rd-top-progress"
        role="progressbar"
        aria-label="Avancement du module"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <i style={{ width: `${pct}%` }} />
      </span>
    </header>
  );
}

/** Lien de retour discret, à gauche du pied de page. */
function BackLink({ label, title, onClick }: { label: string; title?: string; onClick: () => void }) {
  return (
    <button type="button" className="rd-nav-prev" onClick={onClick}>
      <ArrowLeft size={18} aria-hidden="true" />
      <span>
        {title ? <small>{label}</small> : null}
        <b>{title || label}</b>
      </span>
    </button>
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
    <>
      <ol className="rd-fiche">
        {steps.map((s, i) => (
          <li key={`${i}-${s.caption}`}>
            <span className="rd-point-num tabular-nums" aria-hidden="true">
              {i + 1}
            </span>
            <div>
              {s.imageUrl && <img src={s.imageUrl} alt="" loading="lazy" />}
              <p>{s.caption}</p>
            </div>
          </li>
        ))}
      </ol>
      {aiAssisted && (
        <p className="rd-note">
          {steps.some((s) => s.imageUrl) ? 'Fiche structurée et illustrée avec l’IA, relue par l’auteur.' : 'Fiche structurée avec l’IA, relue par l’auteur.'}
        </p>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ sections */

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
  const [outlineOpen, setOutlineOpen] = useState(false);

  useEffect(() => {
    if (!outlineOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOutlineOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [outlineOpen]);

  const lessons = moduleContent.lessons;
  const last = lessons.length - 1;
  const index = Math.max(0, Math.min(lessonIndex, last));
  const current = lessons[index] || lessons[0];
  const answerKey = moduleContent.questions.map((q) => q.correctIndex);
  const pct = moduleProgressPercent(progress, lessons.length, answerKey);
  const points = moduleXp(progress, lessons.length, answerKey);
  const maxXp = lessons.length * 25 + 75;
  const done = progress.lessons.includes(index);
  const quizPassed = isQuizPassed(progress, answerKey);

  const practice = moduleContent.steps?.length ? (
    index === 0 ? (
      <IllustratedSteps steps={moduleContent.steps} aiAssisted={moduleContent.aiAssisted} />
    ) : null
  ) : index === 0 || index === 1 ? (
    <ModuleInteractiveLab labType={moduleContent.labType} />
  ) : null;

  const nextLabel = index < last ? (done ? 'Section suivante' : 'Terminer et continuer') : done ? 'Passer au quiz' : 'Terminer et passer au quiz';
  const nextHint = [index < last ? lessons[index + 1].title : 'Quiz final', done ? '' : '+25 XP'].filter(Boolean).join(' · ');

  return (
    <div className="rd-shell">
      <ReaderTopBar
        title={moduleContent.title}
        step={`Section ${index + 1} sur ${lessons.length}`}
        pct={pct}
        onExit={onExit}
        outlineOpen={outlineOpen}
        onToggleOutline={() => setOutlineOpen(!outlineOpen)}
      />

      <div className="shell-scroll-viewport">
        <div className="rd-layout">
          <article key={index} className="rd-card rd-article">
            <p className="rd-overline tabular-nums">
              Section {index + 1} sur {lessons.length} · {current.minutes} de lecture
              {done && (
                <span className="rd-done" title="Section terminée">
                  <Check size={14} aria-hidden="true" />
                  <span className="sr-only">Section terminée</span>
                </span>
              )}
            </p>
            <h1>{current.title}</h1>
            <p className="rd-lead">{current.intro}</p>
            <p className="rd-body">{current.body}</p>

            {practice && (
              <section className="rd-block" aria-label="Mise en pratique">
                <h2>Mise en pratique</h2>
                {practice}
              </section>
            )}

            <section className="rd-block" aria-label="À retenir">
              <h2>À retenir</h2>
              <ol className="rd-points">
                {current.points.map((point, i) => (
                  <li key={point}>
                    <span className="rd-point-num tabular-nums" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ol>
            </section>

            <blockquote className="rd-reflex">
              <span>Réflexe clé</span>
              <p>{current.tip}</p>
            </blockquote>

            <footer className="rd-nav">
              {index > 0 ? (
                <BackLink label="Précédent" title={lessons[index - 1].title} onClick={() => setLessonIndex(index - 1)} />
              ) : (
                <span />
              )}
              <div className="rd-nav-next">
                <small>{nextHint}</small>
                <button type="button" className="primary" disabled={busy} onClick={onCompleteLesson}>
                  {nextLabel} <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </footer>
          </article>

          {outlineOpen && <button type="button" className="rd-scrim" aria-label="Fermer le sommaire" onClick={() => setOutlineOpen(false)} />}
          <aside className={`rd-outline${outlineOpen ? ' is-open' : ''}`} aria-label="Sommaire du module">
            <div className="rd-card rd-outline-card">
              <header className="rd-outline-head">
                <h2>Sommaire</h2>
                <span className="tabular-nums">
                  {points} / {maxXp} XP
                </span>
                <button type="button" className="rd-top-btn rd-outline-close" aria-label="Fermer le sommaire" onClick={() => setOutlineOpen(false)}>
                  <X size={18} aria-hidden="true" />
                </button>
              </header>
              <ol className="rd-steps">
                {lessons.map((lesson, i) => {
                  const isDone = progress.lessons.includes(i);
                  const isCurrent = i === index;
                  return (
                    <li key={lesson.title} className={`rd-step${isDone ? ' is-done' : ''}${isCurrent ? ' is-current' : ''}`}>
                      <button
                        type="button"
                        aria-current={isCurrent ? 'step' : undefined}
                        onClick={() => {
                          setLessonIndex(i);
                          setOutlineOpen(false);
                        }}
                      >
                        <span className="rd-step-mark tabular-nums" aria-hidden="true">
                          {isDone ? <Check size={14} /> : i + 1}
                        </span>
                        <span className="rd-step-text">
                          <b>{lesson.title}</b>
                          <small>
                            {lesson.minutes}
                            {isDone && <span className="sr-only"> — terminée</span>}
                          </small>
                        </span>
                      </button>
                    </li>
                  );
                })}
                <li className={`rd-step${quizPassed ? ' is-done' : ''}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setOutlineOpen(false);
                      onOpenQuizIntro();
                    }}
                  >
                    <span className="rd-step-mark tabular-nums" aria-hidden="true">
                      {quizPassed ? <Check size={14} /> : lessons.length + 1}
                    </span>
                    <span className="rd-step-text">
                      <b>Quiz final</b>
                      <small>
                        {moduleContent.questions.length} questions
                        {quizPassed && <span className="sr-only"> — réussi</span>}
                      </small>
                    </span>
                  </button>
                </li>
              </ol>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ consignes du quiz */

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
    <div className="rd-shell">
      <ReaderTopBar title={moduleContent.title} step="Quiz final" pct={pct} onExit={onExit} />
      <div className="shell-scroll-viewport">
        <div className="rd-center">
          <section className="rd-card rd-article">
            <p className="rd-overline">Quiz final</p>
            <h1>{moduleContent.quizTitle}</h1>
            <p className="rd-lead">Prenez connaissance des consignes : ouvrir cette page ne consomme aucune tentative.</p>

            <dl className="rd-facts tabular-nums">
              <div>
                <dt>Format</dt>
                <dd>{qLen} questions à choix unique</dd>
              </div>
              <div>
                <dt>Seuil conseillé</dt>
                <dd>
                  {passThreshold} bonnes réponses sur {qLen}
                </dd>
              </div>
              <div>
                <dt>Durée</dt>
                <dd>Sans limite de temps</dd>
              </div>
              <div>
                <dt>Correction</dt>
                <dd>Explications détaillées après l’envoi</dd>
              </div>
            </dl>

            <footer className="rd-nav">
              <BackLink label="Revenir aux sections" onClick={onBackToReader} />
              <button type="button" className="primary" onClick={onStartQuiz}>
                {progress.submitted ? 'Nouvelle tentative' : 'Commencer le quiz'} <ArrowRight size={16} aria-hidden="true" />
              </button>
            </footer>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ quiz */

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
  const missing = qLen - answeredCount;
  const pct = moduleProgressPercent(
    progress,
    moduleContent.lessons.length,
    qList.map((q) => q.correctIndex)
  );

  return (
    <div className="rd-shell">
      <ReaderTopBar title={moduleContent.title} step="Quiz final" pct={pct} onExit={onExit} />

      <div className="shell-scroll-viewport">
        <div className="rd-center">
          <header className="rd-quiz-head">
            <div>
              <p className="rd-overline">Quiz final</p>
              <h1>{moduleContent.quizTitle}</h1>
            </div>
            <span className="rd-quiz-count tabular-nums" aria-live="polite">
              {answeredCount} / {qLen} réponses
            </span>
          </header>

          {qList.map((q, qi) => (
            <div className="rd-card rd-question-card" key={q.text}>
              <fieldset className="rd-question">
                <legend>
                  <span className="rd-overline tabular-nums">
                    Question {qi + 1} sur {qLen}
                  </span>
                  <span className="rd-question-text">{q.text}</span>
                </legend>
                <div className="rd-options">
                  {q.answers.map((option, oi) => {
                    const chosen = answers[qi] === oi;
                    return (
                      <label key={option} className={`rd-option${chosen ? ' is-chosen' : ''}`}>
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
                        <span className="rd-option-mark" aria-hidden="true" />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          ))}

          {!reviewOpen ? (
            <footer className="rd-nav is-bare">
              <BackLink label="Quitter et garder mes réponses" onClick={onExit} />
              <button type="button" className="primary" onClick={() => setReviewOpen(true)}>
                Vérifier et envoyer <ArrowRight size={16} aria-hidden="true" />
              </button>
            </footer>
          ) : (
            <section className={`rd-card rd-confirm${missing > 0 ? ' has-missing' : ''}`} role="region" aria-label="Récapitulatif avant envoi">
              <h2>Envoyer vos réponses ?</h2>
              <p className="tabular-nums">
                {missing > 0
                  ? `Vous avez répondu à ${answeredCount} question${answeredCount > 1 ? 's' : ''} sur ${qLen}. ${
                      missing > 1 ? `Les ${missing} questions sans réponse compteront` : 'La question sans réponse comptera'
                    } pour 0.`
                  : `Vous avez répondu aux ${qLen} questions.`}
              </p>
              <footer className="rd-nav is-bare">
                <BackLink label="Continuer à répondre" onClick={() => setReviewOpen(false)} />
                <button type="button" className="primary" disabled={busy} onClick={onSubmit}>
                  Confirmer et envoyer
                </button>
              </footer>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ résultat */

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
  const score = scoreAnswers(progress.answers || [], correctIndices);
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

  const overline = moduleValidated ? 'Module validé' : passed ? 'Quiz réussi' : 'Révision conseillée';
  const headline = passed ? 'Bravo, vos réflexes sont solides.' : 'Prenez le temps de revoir les points clés.';
  const lead = moduleValidated
    ? 'Résultat enregistré. La correction ci-dessous vous aide à consolider chaque situation.'
    : passed
      ? `Terminez ${missingLessons.length > 1 ? 'les sections restantes' : 'la section restante'} pour valider le module.`
      : `Seuil de réussite : ${passThreshold} sur ${qLen}. Revoyez les sections indiquées, puis retentez le quiz, sans pénalité.`;

  const ring = 2 * Math.PI * 42;

  return (
    <div className="rd-shell">
      <ReaderTopBar title={moduleContent.title} step="Résultat" pct={pct} onExit={onExit} />

      <div className="shell-scroll-viewport">
        <div className="rd-center">
          <section className="rd-card rd-result-head">
            <div className={`rd-score${passed ? '' : ' is-low'}`} role="img" aria-label={`Score : ${score} sur ${qLen}`}>
              <svg viewBox="0 0 96 96" aria-hidden="true">
                <circle className="rd-score-track" cx="48" cy="48" r="42" />
                <circle className="rd-score-value" cx="48" cy="48" r="42" strokeDasharray={`${(score / Math.max(1, qLen)) * ring} ${ring}`} />
              </svg>
              <b className="tabular-nums" aria-hidden="true">
                {score}
                <span>/{qLen}</span>
              </b>
            </div>
            <div className="rd-result-text">
              <p className="rd-overline">{overline}</p>
              <h1>{headline}</h1>
              <p>{lead}</p>
            </div>
          </section>

          {passed && (
            <section className="rd-card rd-reward" role="status">
              <div className="rd-reward-head tabular-nums">
                <b>+{quizXp} XP</b>
                <span>
                  {levelUp ? (
                    <>
                      <Award size={16} aria-hidden="true" /> Niveau {lvl.level} atteint
                    </>
                  ) : (
                    <>Niveau {lvl.level}</>
                  )}
                </span>
              </div>
              <ProgressBar value={lvl.percent} label="Progression vers le niveau suivant" tone="htb" />
              <small className="tabular-nums">
                {lvl.currentXp} / {lvl.targetXp} XP vers le niveau {lvl.level + 1} · {totalXP} XP au total · XP illustratifs (démonstration)
              </small>
            </section>
          )}

          <section className="rd-card rd-review" aria-label="Correction">
            <h2>Correction</h2>
            <ol>
              {qList.map((q, qi) => {
                const userAnswer = (progress.answers || [])[qi];
                const ok = userAnswer === q.correctIndex;
                const chosenLabel = userAnswer !== undefined && userAnswer >= 0 ? q.answers[userAnswer] : undefined;
                return (
                  <li key={q.text} className={ok ? 'is-ok' : 'is-wrong'}>
                    <span className="rd-review-mark" aria-hidden="true">
                      {ok ? <Check size={14} /> : <X size={14} />}
                    </span>
                    <div>
                      <p className="rd-overline tabular-nums">
                        Question {qi + 1}
                        <span className="sr-only">{ok ? ' — bonne réponse' : ' — réponse à revoir'}</span>
                      </p>
                      <h3>{q.text}</h3>
                      <p>
                        Votre réponse : <b>{chosenLabel ?? 'aucune réponse'}</b>
                      </p>
                      {!ok && (
                        <p>
                          Bonne réponse : <b>{q.answers[q.correctIndex]}</b>
                        </p>
                      )}
                      <p className="rd-review-why">{q.explanation}</p>
                      <button type="button" className="rd-link" onClick={() => onReviewLessons(Math.min(lessonCount - 1, qi))}>
                        Revoir la section associée
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <footer className="rd-nav is-bare">
            {passed && missingLessons.length > 0 ? (
              <button type="button" className="secondary" onClick={() => onReviewLessons(missingLessons[0])}>
                Terminer la section {missingLessons[0] + 1}
              </button>
            ) : (
              <button type="button" className={passed ? 'secondary' : 'primary'} onClick={onRetryQuiz}>
                <RotateCcw size={16} aria-hidden="true" /> Nouvelle tentative
              </button>
            )}
            {passed && nextModule && onOpenNextModule ? (
              <button type="button" className="primary" onClick={() => onOpenNextModule(nextModule.id)}>
                Module suivant : {nextModule.title} <ArrowRight size={16} aria-hidden="true" />
              </button>
            ) : (
              <button type="button" className={passed ? 'primary' : 'secondary'} onClick={onOpenLearning}>
                Mes apprentissages <ArrowRight size={16} aria-hidden="true" />
              </button>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
}
