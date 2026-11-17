/**
 * Le texte d'une leçon, mis en page comme un chapitre : une colonne, des titres francs, des listes,
 * une figure légendée et de rares encadrés à pastille (« i » pour ce qu'il faut savoir, « ? » pour la
 * question que se pose l'élève). Une leçon sans contenu rédigé (créée dans le Studio) garde le même
 * cadre, avec son seul paragraphe.
 */
import React from 'react';
import { Mail, MessageSquare } from 'lucide-react';
import type { LessonFigure, StudyLesson } from '../content';
import { FlowFigure, LessonBanner, SplitFigure } from './LessonArt';
import { RichText } from './RichText';

/** Encadré à pastille : « i » (à savoir) ou « ? » (la question de l'élève). */
function Aside({ kind, label, children }: { kind: 'info' | 'question'; label: string; children: React.ReactNode }) {
  return (
    <aside className={`rd-aside rd-wide is-${kind}`} aria-label={label}>
      <span className="rd-aside-badge" aria-hidden="true">
        {kind === 'info' ? 'i' : '?'}
      </span>
      {children}
    </aside>
  );
}

function FigureView({ figure }: { figure: LessonFigure }) {
  if (figure.kind === 'message') {
    return (
      <div className={`rd-msg is-${figure.channel}`}>
        <div className="rd-msg-head">
          <span className="rd-msg-icon" aria-hidden="true">
            {figure.channel === 'sms' ? <MessageSquare size={16} /> : <Mail size={16} />}
          </span>
          <span className="rd-msg-from">
            <b>{figure.from}</b>
            <small>{figure.channel === 'sms' ? 'SMS' : 'E-mail'}</small>
          </span>
        </div>
        {figure.details && (
          <dl className="rd-msg-details">
            {figure.details.map((detail) => (
              <div key={detail.label}>
                <dt>{detail.label}</dt>
                <dd>
                  <RichText text={detail.value} />
                </dd>
              </div>
            ))}
          </dl>
        )}
        <div className="rd-msg-body">
          {figure.body.map((line) => (
            <p key={line}>
              <RichText text={line} />
            </p>
          ))}
        </div>
      </div>
    );
  }

  if (figure.kind === 'flow') return <FlowFigure figure={figure} />;
  if (figure.kind === 'split') return <SplitFigure figure={figure} />;

  if (figure.kind === 'timeline') {
    return (
      <ol className="rd-timeline">
        {figure.steps.map((step) => (
          <li key={step}>
            <RichText text={step} />
          </li>
        ))}
      </ol>
    );
  }

  return (
    <table className="rd-table">
      <thead>
        <tr>
          {figure.head.map((cell) => (
            <th key={cell} scope="col">
              {cell}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {figure.rows.map((row, r) => (
          <tr key={r}>
            {row.map((cell, c) => (
              <td key={c}>
                <RichText text={cell} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function List({ items, ordered }: { items: string[]; ordered?: boolean }) {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag>
      {items.map((item) => (
        <li key={item}>
          <RichText text={item} />
        </li>
      ))}
    </Tag>
  );
}

export function LessonArticle({
  lesson,
  meta,
  practice
}: {
  lesson: StudyLesson;
  /** Ligne de repère sous le titre : « Section 1 sur 3 · 3 min de lecture ». */
  meta: React.ReactNode;
  /** L'exercice de la section, s'il y en a un. */
  practice: React.ReactNode;
}) {
  const rich = lesson.rich;
  return (
    <>
      <h1>{lesson.title}</h1>
      {meta}

      <div className="rd-chapter-body">
        {rich && <LessonBanner art={rich.art} />}
        <p className="rd-chapter-lead">{lesson.intro}</p>

        {rich ? (
          <>
            <p>
              <RichText text={rich.scene} />
            </p>

            <Aside kind="info" label="Objectifs de la section">
              <p>À la fin de cette section, vous saurez :</p>
              <List items={rich.goals} />
            </Aside>

            {rich.sections.map((section) => (
              <React.Fragment key={section.title}>
                <h2>{section.title}</h2>
                {section.text.map((paragraph) => (
                  <p key={paragraph}>
                    <RichText text={paragraph} />
                  </p>
                ))}
                {section.items && <List items={section.items} ordered={section.ordered} />}
                {section.after && (
                  <p>
                    <RichText text={section.after} />
                  </p>
                )}
              </React.Fragment>
            ))}

            <h2>{rich.example.title}</h2>
            {rich.example.intro && (
              <p>
                <RichText text={rich.example.intro} />
              </p>
            )}
            <figure className={`rd-figure rd-wide is-${rich.example.figure.kind}`}>
              <div className="rd-figure-stage">
                <FigureView figure={rich.example.figure} />
              </div>
              <figcaption>{rich.example.caption}</figcaption>
            </figure>
            <p>Ce qu’il faut y voir :</p>
            <List items={rich.example.notes} ordered />

            <Aside kind="question" label="Question">
              <p>
                <RichText text={rich.question.ask} />
              </p>
            </Aside>
            {rich.question.answer.map((paragraph) => (
              <p key={paragraph}>
                <RichText text={paragraph} />
              </p>
            ))}
          </>
        ) : (
          <p>{lesson.body}</p>
        )}

        {practice && (
          <>
            <h2>À vous de jouer</h2>
            <div className="rd-practice rd-wide">{practice}</div>
          </>
        )}

        <h2>En résumé</h2>
        <List items={lesson.points} />

        <Aside kind="info" label="Réflexe à garder">
          <p>
            <strong>Le réflexe à garder.</strong> {lesson.tip}
          </p>
        </Aside>
      </div>
    </>
  );
}
