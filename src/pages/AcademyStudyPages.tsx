/**
 * Lecteur d'un module : chaque section sur sa page, puis le quiz final sur la sienne, puis le résultat.
 * Toutes gardent l'interface du cours : une barre fine en haut (titre, section en cours, avancement), le
 * sommaire à gauche, la colonne de lecture.
 */
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Award, Check, List, MousePointerClick, RotateCcw, X } from 'lucide-react';
import type { Progress } from '../data';
import { MODULES_CONTENT, type ModuleStudyContent } from '../content';
import { isQuizPassed, moduleProgressPercent, moduleXp, quizPassThreshold, scoreAnswers } from '../domain.mjs';
import { ModuleInteractiveLab } from '../components/LessonLab';
import { LessonPart, ModuleOpening } from '../components/LessonArticle';
import { ArtBadge } from '../components/LessonArt';
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
  /** Où l'on se trouve : la partie en cours de lecture, « Quiz final », « Résultat ». */
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

/**
 * Où se trouve l'exercice : dans la partie qui donne de quoi le réussir (après l'adresse et le lien pour
 * le phishing), à la fin pour les autres modules. Un contenu du Studio a sa fiche illustrée à la place.
 */
function labPlacement(moduleContent: ModuleStudyContent) {
  const last = moduleContent.lessons.length - 1;
  return {
    hasLab: !moduleContent.steps?.length,
    labPart: moduleContent.labType === 'phishing' ? Math.min(1, last) : last
  };
}

/**
 * Le sommaire : sur grand écran, il est déroulé d'office dans une colonne ; sur écran étroit, c'est un
 * panneau que l'on ouvre et qui se referme dès qu'on a choisi (ou avec Échap).
 */
function useOutline() {
  const isWide = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 961px)').matches;
  const [open, setOpen] = useState(isWide);
  const closeIfNarrow = () => {
    if (!isWide()) setOpen(false);
  };

  useEffect(() => {
    if (!open || isWide()) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return { open, setOpen, closeIfNarrow };
}
type OutlineState = ReturnType<typeof useOutline>;

/** Le sommaire du module : ses parties, l'exercice et le quiz final, avec ce qui est fait. */
function ModuleOutline({
  moduleContent,
  progress,
  outline,
  current,
  onPickPart,
  onPickPractice,
  onPickQuiz
}: {
  moduleContent: ModuleStudyContent;
  progress: Progress;
  outline: OutlineState;
  /** La partie en cours (son numéro), ou le quiz final (et son résultat). */
  current: number | 'quiz';
  onPickPart: (index: number) => void;
  onPickPractice: () => void;
  onPickQuiz: () => void;
}) {
  const lessons = moduleContent.lessons;
  const answerKey = moduleContent.questions.map((q) => q.correctIndex);
  const points = moduleXp(progress, lessons.length, answerKey);
  const maxXp = lessons.length * 25 + 75;
  const quizPassed = isQuizPassed(progress, answerKey);
  const { hasLab, labPart } = labPlacement(moduleContent);
  const onQuiz = current === 'quiz';

  return (
    <aside className={`rd-outline${outline.open ? ' is-open' : ''}`} aria-label="Sommaire du module" inert={!outline.open}>
      <div className="rd-outline-card">
        <header className="rd-outline-head">
          <h2>Sommaire</h2>
          <span className="tabular-nums">
            {points} / {maxXp} XP
          </span>
          <button type="button" className="rd-top-btn rd-outline-close" title="Replier le sommaire" aria-label="Replier le sommaire" onClick={() => outline.setOpen(false)}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <ol className="rd-steps">
          {lessons.map((lesson, i) => {
            const isDone = progress.lessons.includes(i);
            const isCurrent = !onQuiz && i === current;
            return (
              <React.Fragment key={lesson.title}>
              <li className={`rd-step${isDone ? ' is-done' : ''}${isCurrent ? ' is-current' : ''}`}>
                <button type="button" aria-current={isCurrent ? 'location' : undefined} onClick={() => onPickPart(i)}>
                  <span className="rd-step-mark tabular-nums" aria-hidden="true">
                    {isDone ? <Check size={14} /> : i + 1}
                  </span>
                  <span className="rd-step-text">
                    <b>{lesson.title}</b>
                    <small>
                      Lecture · {lesson.minutes}
                      {isDone && <span className="sr-only"> — lue</span>}
                    </small>
                  </span>
                </button>
              </li>
              {hasLab && i === labPart && (
                <li className="rd-step is-sub">
                  <button type="button" onClick={onPickPractice}>
                    <span className="rd-step-mark" aria-hidden="true">
                      <MousePointerClick size={13} />
                    </span>
                    <span className="rd-step-text">
                      <b>À vous de jouer</b>
                      <small>Exercice</small>
                    </span>
                  </button>
                </li>
              )}
              </React.Fragment>
            );
          })}
          <li className={`rd-step${quizPassed ? ' is-done' : ''}${onQuiz ? ' is-current' : ''}`}>
            <button type="button" aria-current={onQuiz ? 'location' : undefined} onClick={onPickQuiz}>
              <span className="rd-step-mark tabular-nums" aria-hidden="true">
                {quizPassed ? <Check size={14} /> : lessons.length + 1}
              </span>
              <span className="rd-step-text">
                <b>Quiz final</b>
                <small>
                  Quiz · {moduleContent.questions.length} questions
                  {quizPassed && <span className="sr-only"> — réussi</span>}
                </small>
              </span>
            </button>
          </li>
        </ol>
      </div>
    </aside>
  );
}

/**
 * Le cadre commun aux pages du cours — les sections, le quiz, le résultat : la barre du haut, le sommaire
 * à gauche, la colonne de lecture. Passer de l'une à l'autre ne change pas d'interface.
 */
function ChapterFrame({
  title,
  step,
  pct,
  onExit,
  outline,
  sommaire,
  viewportRef,
  articleKey,
  footer,
  children
}: {
  title: string;
  step: string;
  pct: number;
  onExit: () => void;
  outline: OutlineState;
  sommaire: React.ReactNode;
  viewportRef?: React.Ref<HTMLDivElement>;
  articleKey?: string;
  /** La navigation du bas de page (section précédente, suite). */
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { open, setOpen } = outline;
  return (
    <div className="rd-shell is-chapter">
      <ReaderTopBar title={title} step={step} pct={pct} onExit={onExit} outlineOpen={open} onToggleOutline={() => setOpen(!open)} />

      <div className="shell-scroll-viewport" ref={viewportRef}>
        <div className={`rd-chapter${open ? ' has-outline' : ''}`}>
          <div className="rd-chapter-side">
            <button type="button" className="rd-toc-btn" aria-expanded={open} title="Sommaire" aria-label="Sommaire du module" onClick={() => setOpen(true)}>
              <List size={20} aria-hidden="true" />
            </button>
          </div>

          {sommaire}

          <article key={articleKey} className="rd-article rd-chapter-main">
            <div className="rd-chapter-body">{children}</div>
            {footer}
          </article>
        </div>
      </div>

      {open && <button type="button" className="rd-scrim" aria-label="Fermer le sommaire" onClick={() => setOpen(false)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ lecture */

/** Respecter le réglage « réduire les animations » du système. */
const calmMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Une section du cours, sur sa page : son titre, son texte, son exemple, sa question et son résumé, et
 * l'exercice dans la section qui donne de quoi le réussir. La première section s'ouvre par l'en-tête du
 * module et ses objectifs. En bas, le bouton note la section lue (+25 XP) et mène à la suivante, puis au
 * quiz final, qui a sa page. Passer par le sommaire n'enregistre rien.
 */
export function AcademyReaderView({
  moduleContent = MODULES_CONTENT.phishing,
  summary,
  domain,
  progress,
  lessonIndex,
  anchor = 'top',
  busy,
  onGoToPart,
  onCompletePart,
  onOpenQuiz,
  onExit
}: {
  moduleContent?: ModuleStudyContent;
  /** La présentation du module et son domaine, tels que la bibliothèque les donne. */
  summary?: string;
  domain?: string;
  progress: Progress;
  /** La section affichée. */
  lessonIndex: number;
  /** Où arriver sur la page : en haut, ou sur l'exercice de la section. */
  anchor?: 'top' | 'practice';
  busy: boolean;
  /** Ouvrir une autre section, en haut de sa page ou sur son exercice. */
  onGoToPart: (index: number, anchor?: 'practice') => void;
  /** Noter la section lue, puis ouvrir la suivante, ou le quiz après la dernière. */
  onCompletePart: () => void;
  onOpenQuiz: () => void;
  onExit: () => void;
}) {
  const outline = useOutline();
  const viewportRef = useRef<HTMLDivElement>(null);
  const practiceEl = useRef<HTMLHeadingElement | null>(null);

  const lessons = moduleContent.lessons;
  const last = lessons.length - 1;
  const index = Math.max(0, Math.min(lessonIndex, last));
  const lesson = lessons[index];
  const answerKey = moduleContent.questions.map((q) => q.correctIndex);
  const pct = moduleProgressPercent(progress, lessons.length, answerKey);
  const unread = lessons.filter((_, i) => !progress.lessons.includes(i)).length;
  const minutes = lessons.reduce((sum, l) => sum + (parseInt(l.minutes, 10) || 0), 0);
  const done = progress.lessons.includes(index);
  const nextLabel = index < last ? (done ? 'Section suivante' : 'Terminer et continuer') : done ? 'Passer au quiz' : 'Terminer et passer au quiz';
  const nextHint = [index < last ? lessons[index + 1].title : 'Quiz final', done ? '' : '+25 XP'].filter(Boolean).join(' · ');

  const scrollToTop = (behavior: ScrollBehavior = 'auto') => viewportRef.current?.scrollTo({ top: 0, behavior: calmMotion() ? 'auto' : behavior });
  const scrollToHeading = (heading: HTMLElement | null, behavior: ScrollBehavior = 'smooth') => {
    const viewport = viewportRef.current;
    if (!viewport || !heading) return;
    const top = heading.getBoundingClientRect().top - viewport.getBoundingClientRect().top + viewport.scrollTop - 24;
    viewport.scrollTo({ top, behavior: calmMotion() ? 'auto' : behavior });
  };

  // À l'ouverture d'une section : en haut de sa page, ou sur son exercice.
  useEffect(() => {
    const frame = requestAnimationFrame(() => (anchor === 'practice' && practiceEl.current ? scrollToHeading(practiceEl.current, 'auto') : scrollToTop()));
    return () => cancelAnimationFrame(frame);
  }, [index, anchor, moduleContent.id]);

  // L'exercice n'apparaît qu'une fois, dans la section qui donne de quoi le réussir.
  const { hasLab, labPart } = labPlacement(moduleContent);
  const practice = moduleContent.steps?.length ? (
    index === 0 ? (
      <IllustratedSteps steps={moduleContent.steps} aiAssisted={moduleContent.aiAssisted} />
    ) : null
  ) : index === labPart ? (
    <ModuleInteractiveLab labType={moduleContent.labType} />
  ) : null;

  return (
    <ChapterFrame
      title={moduleContent.title}
      step={lesson?.title || ''}
      pct={pct}
      onExit={onExit}
      outline={outline}
      viewportRef={viewportRef}
      articleKey={`${moduleContent.id}-${index}`}
      sommaire={
        <ModuleOutline
          moduleContent={moduleContent}
          progress={progress}
          outline={outline}
          current={index}
          onPickPart={(i) => {
            outline.closeIfNarrow();
            if (i === index) scrollToTop('smooth');
            else onGoToPart(i);
          }}
          onPickPractice={() => {
            outline.closeIfNarrow();
            if (index === labPart) scrollToHeading(practiceEl.current);
            else onGoToPart(labPart, 'practice');
          }}
          onPickQuiz={onOpenQuiz}
        />
      }
      footer={
        <footer className="rd-nav">
          {index > 0 ? <BackLink label="Section précédente" title={lessons[index - 1].title} onClick={() => onGoToPart(index - 1)} /> : <span />}
          <div className="rd-nav-next">
            <small>{nextHint}</small>
            <button type="button" className="primary" disabled={busy} onClick={onCompletePart}>
              {nextLabel} <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </footer>
      }
    >
      {index === 0 && (
        <ModuleOpening
          title={moduleContent.title}
          domain={domain}
          summary={summary}
          goals={moduleContent.goals}
          art={lessons[0]?.rich?.art}
          seed={moduleContent.id}
          minutes={minutes}
          questionCount={moduleContent.questions.length}
          hasPractice={hasLab}
          read={unread === 0}
        />
      )}
      {lesson && (
        <LessonPart
          lesson={lesson}
          index={index}
          practice={practice}
          practiceRef={(el) => {
            practiceEl.current = el;
          }}
        />
      )}
    </ChapterFrame>
  );
}

/* ------------------------------------------------------------------ quiz */

/** Les questions du quiz final, puis une confirmation avant l'envoi. */
function QuizBlock({
  moduleContent,
  answers,
  setAnswers,
  busy,
  onSubmit
}: {
  moduleContent: ModuleStudyContent;
  answers: number[];
  setAnswers: (a: number[]) => void;
  busy: boolean;
  onSubmit: () => void;
}) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const qList = moduleContent.questions;
  const qLen = qList.length;
  const answeredCount = answers.slice(0, qLen).filter((a) => a !== undefined && a !== null && a >= 0).length;
  const missing = qLen - answeredCount;

  return (
    <>
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
          <span className="rd-quiz-count tabular-nums" aria-live="polite">
            {answeredCount} / {qLen} réponses
          </span>
          <button type="button" className="primary" onClick={() => setReviewOpen(true)}>
            Vérifier et envoyer <ArrowRight size={16} aria-hidden="true" />
          </button>
        </footer>
      ) : (
        <section className={`rd-card rd-confirm${missing > 0 ? ' has-missing' : ''}`} role="region" aria-label="Récapitulatif avant envoi">
          <h3>Envoyer vos réponses ?</h3>
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
    </>
  );
}

/**
 * Le quiz final, sur sa page, dans le cadre du cours : la même barre du haut, le même sommaire (le quiz y
 * est la partie en cours), la même colonne de lecture. Les consignes tiennent en deux phrases ; les
 * questions suivent, puis la confirmation d'envoi.
 */
export function AcademyQuizView({
  moduleContent = MODULES_CONTENT.phishing,
  progress,
  answers,
  setAnswers,
  busy,
  onSubmitQuiz,
  onOpenResult,
  onGoToPart,
  onExit
}: {
  moduleContent?: ModuleStudyContent;
  progress: Progress;
  answers: number[];
  setAnswers: (a: number[]) => void;
  busy: boolean;
  onSubmitQuiz: () => void;
  /** Rouvrir la correction du dernier envoi. */
  onOpenResult: () => void;
  /** Revenir à une section du cours, en haut de sa page ou sur son exercice. */
  onGoToPart: (index: number, anchor?: 'practice') => void;
  onExit: () => void;
}) {
  const outline = useOutline();
  const viewportRef = useRef<HTMLDivElement>(null);
  const qLen = moduleContent.questions.length;
  const answerKey = moduleContent.questions.map((q) => q.correctIndex);
  const pct = moduleProgressPercent(progress, moduleContent.lessons.length, answerKey);
  const passThreshold = quizPassThreshold(qLen);
  const lastScore = progress.submitted ? scoreAnswers(progress.answers || [], answerKey) : null;
  const { labPart } = labPlacement(moduleContent);

  return (
    <ChapterFrame
      title={moduleContent.title}
      step="Quiz final"
      pct={pct}
      onExit={onExit}
      outline={outline}
      viewportRef={viewportRef}
      articleKey={`${moduleContent.id}-quiz`}
      sommaire={
        <ModuleOutline
          moduleContent={moduleContent}
          progress={progress}
          outline={outline}
          current="quiz"
          onPickPart={(i) => onGoToPart(i)}
          onPickPractice={() => onGoToPart(labPart, 'practice')}
          onPickQuiz={() => {
            outline.closeIfNarrow();
            viewportRef.current?.scrollTo({ top: 0, behavior: calmMotion() ? 'auto' : 'smooth' });
          }}
        />
      }
    >
      <h1 className="rd-part-title">
        <ArtBadge art="done" />
        <span>Quiz final</span>
      </h1>
      <p>
        {moduleContent.quizTitle} : {qLen} questions à choix unique, sans limite de temps. Il faut {passThreshold} bonnes réponses sur {qLen} pour valider le
        module. La correction détaillée s’affiche après l’envoi.
      </p>
      {lastScore !== null && (
        <p className="rd-quiz-last tabular-nums">
          Dernier envoi : {lastScore} / {qLen}. Un nouvel envoi remplace ce résultat.{' '}
          <button type="button" className="rd-link" onClick={onOpenResult}>
            Revoir ma correction
          </button>
        </p>
      )}
      <QuizBlock moduleContent={moduleContent} answers={answers} setAnswers={setAnswers} busy={busy} onSubmit={onSubmitQuiz} />
    </ChapterFrame>
  );
}

/* ------------------------------------------------------------------ résultat */

/**
 * Le résultat du quiz : un écran à part, mais dans le cadre du cours — la même barre du haut, le même
 * sommaire (le quiz final y est la partie en cours), la même colonne de lecture. La correction reprend les
 * cartes du quiz : la réponse donnée et la bonne réponse y sont marquées (✓ / ✕), avec l'explication.
 */
export function AcademyResultView({
  moduleContent = MODULES_CONTENT.phishing,
  progress,
  onRetryQuiz,
  onOpenQuiz,
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
  /** Revenir à la page du quiz (depuis le sommaire). */
  onOpenQuiz?: () => void;
  /** Revenir à une section du cours, en haut de sa page ou sur son exercice. */
  onReviewLessons: (sectionIdx: number, anchor?: 'practice') => void;
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
  const outline = useOutline();
  const { labPart } = labPlacement(moduleContent);

  return (
    <ChapterFrame
      title={moduleContent.title}
      step="Résultat du quiz"
      pct={pct}
      onExit={onExit}
      outline={outline}
      articleKey={moduleContent.id}
      sommaire={
        <ModuleOutline
          moduleContent={moduleContent}
          progress={progress}
          outline={outline}
          current="quiz"
          onPickPart={(i) => onReviewLessons(i)}
          onPickPractice={() => onReviewLessons(labPart, 'practice')}
          onPickQuiz={onOpenQuiz || onRetryQuiz}
        />
      }
    >
      <h1 className="rd-part-title">
        <ArtBadge art="done" />
        <span>Résultat du quiz</span>
      </h1>
      <div className={`rd-result${passed ? '' : ' is-low'}`}>
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
          <p className="rd-result-kicker">{overline}</p>
          <p className="rd-result-headline">{headline}</p>
          <p className="rd-result-lead">{lead}</p>
        </div>
      </div>

      {passed && (
        <div className="rd-reward" role="status">
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
        </div>
      )}

      <h2 className="rd-part-title">
        <ArtBadge art="list" />
        <span>Correction</span>
      </h2>
      {qList.map((q, qi) => {
        const userAnswer = (progress.answers || [])[qi];
        const answered = userAnswer !== undefined && userAnswer !== null && userAnswer >= 0;
        const ok = userAnswer === q.correctIndex;
        return (
          <section key={q.text} className="rd-card rd-question-card rd-correction" aria-labelledby={`correction-${qi}`}>
            <p className="rd-overline tabular-nums">
              Question {qi + 1} sur {qLen}
              {!answered && ' · sans réponse'}
              <span className="sr-only">{ok ? ' — bonne réponse' : ' — réponse à revoir'}</span>
            </p>
            <h3 id={`correction-${qi}`} className="rd-question-text">
              {q.text}
            </h3>
            <ul className="rd-options">
              {q.answers.map((option, oi) => {
                const right = oi === q.correctIndex;
                const chosen = answered && oi === userAnswer;
                return (
                  <li key={option} className={`rd-option is-static${right ? ' is-right' : chosen ? ' is-wrong' : ''}`}>
                    <span className="rd-option-mark" aria-hidden="true">
                      {right ? <Check size={12} strokeWidth={3} /> : chosen ? <X size={12} strokeWidth={3} /> : null}
                    </span>
                    <span>{option}</span>
                    {(chosen || right) && <small>{chosen ? 'Votre réponse' : 'Bonne réponse'}</small>}
                  </li>
                );
              })}
            </ul>
            <p className="rd-correction-why">{q.explanation}</p>
            <button type="button" className="rd-link" onClick={() => onReviewLessons(Math.min(lessonCount - 1, qi))}>
              Revoir la section associée
            </button>
          </section>
        );
      })}

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
    </ChapterFrame>
  );
}
