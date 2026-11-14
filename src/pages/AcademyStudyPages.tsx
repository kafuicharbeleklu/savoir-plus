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
import { moduleProgressPercent, moduleXp, scoreAnswers } from '../domain.mjs';
import { ModuleInteractiveLab } from '../components/PhishingInspectorLab';
import { ProgressBar } from '../components/ProfileIdentityCard';

function StudyTopBar({
  title,
  sectionLabel,
  pct,
  onExit,
  showTocBtn,
  onToggleToc
}: {
  title: string;
  sectionLabel: string;
  pct: number;
  onExit: () => void;
  showTocBtn?: boolean;
  onToggleToc?: () => void;
}) {
  return (
    <header className="study-topbar">
      <div className="study-topbar-left">
        <button className="secondary study-exit-btn" onClick={onExit}>
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
          <button className="secondary study-toc-mobile-btn" onClick={onToggleToc} aria-expanded={false}>
            <List size={15} /> Sommaire
          </button>
        )}
      </div>
    </header>
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
  const pct = moduleProgressPercent(progress, lessonList.length);
  const points = moduleXp(progress, lessonList.length);
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
        onToggleToc={() => setTocOpen(!tocOpen)}
      />

      <div className="shell-scroll-viewport">
        <div className="study-workspace">
        <aside className={`study-toc-pane ${tocOpen ? 'open' : ''}`} aria-label="Sommaire du module">
          <div className="study-toc-head">
            <div className="study-toc-head-meta">
              <span className="eyebrow">SOMMAIRE DU MODULE</span>
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
                {progress.submitted ? <Check size={13} /> : `0${lessonList.length + 1}`}
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

        <article className="study-main-pane">
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

          {(safeIndex === 0 || safeIndex === 1) && <ModuleInteractiveLab labType={moduleContent.labType} />}

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
  const pct = moduleProgressPercent(progress, moduleContent.lessons.length);
  const qLen = moduleContent.questions.length;
  const passThreshold = Math.max(1, Math.ceil(qLen * 0.66));

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
          <span className="eyebrow">ÉVALUATION FORMATIVE</span>
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
  const pct = moduleProgressPercent(progress, moduleContent.lessons.length);

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
            <span className="tabular-nums">
              {answeredCount} / {qLen} réponses sélectionnées
            </span>
          </div>

          {qList.map((q, qi) => (
            <fieldset key={q.text} className="question">
              <legend>
                <span className="tabular-nums">0{qi + 1}</span>
                {q.text}
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
                    {chosen && <CheckCircle2 size={15} />}
                  </label>
                );
              })}
            </fieldset>
          ))}

          {!reviewOpen ? (
            <div className="quiz-submit-row">
              <button className="secondary" onClick={onExit}>
                Enregistrer et quitter
              </button>
              <button className="primary" onClick={() => setReviewOpen(true)}>
                Vérifier et envoyer mes réponses <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <div className="quiz-confirm-box" role="region" aria-label="Récapitulatif avant envoi">
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
  onExit
}: {
  moduleContent?: ModuleStudyContent;
  progress: Progress;
  onRetryQuiz: () => void;
  onReviewLessons: (sectionIdx: number) => void;
  onOpenLearning: () => void;
  onExit: () => void;
}) {
  const qList = moduleContent.questions;
  const qLen = qList.length;
  const correctIndices = qList.map((q) => q.correctIndex);
  const s = scoreAnswers(progress.answers || [], correctIndices);
  const passThreshold = Math.max(1, Math.ceil(qLen * 0.66));
  const passed = s >= passThreshold;
  const pct = moduleProgressPercent(progress, moduleContent.lessons.length);

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
          <span className="eyebrow">{passed ? 'MODULE VALIDÉ' : 'RÉVISION CONSEILLÉE'}</span>
          <h1>{passed ? 'Bravo, vos réflexes sont solides.' : 'Prenez le temps de revoir les points clés.'}</h1>
          <p>
            Résultat enregistré pour ce module. Vos explications détaillées ci-dessous vous aident à consolider chaque
            situation.
          </p>

          <div className="score-display tabular-nums">
            {s}
            <span>/ {qLen}</span>
          </div>

          <div className="result-review">
            {qList.map((q, qi) => {
              const userAns = (progress.answers || [])[qi];
              const ok = userAns === q.correctIndex;
              return (
                <div key={q.text}>
                  <span className={ok ? 'correct' : 'incorrect'}>
                    {ok ? <Check size={16} /> : <XCircle size={16} />}
                  </span>
                  <div>
                    <b>
                      Question 0{qi + 1} · {q.text}
                    </b>
                    <p>{q.explanation}</p>
                    <button
                      className="text-link"
                      onClick={() => onReviewLessons(Math.min(moduleContent.lessons.length - 1, qi))}
                    >
                      <FileText size={13} /> Revoir la section associée
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="result-buttons">
            <button className="secondary" onClick={onRetryQuiz}>
              <RotateCcw size={15} /> Nouvelle tentative
            </button>
            <button className="primary" onClick={onOpenLearning}>
              Retour à Mes apprentissages <ArrowRight size={15} />
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
