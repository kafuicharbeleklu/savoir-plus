/**
 * Le texte d'un module, mis en page comme un chapitre qui se lit d'un trait : une ouverture (bandeau,
 * objectifs), puis les parties à la suite. Chaque partie a son titre, son cours en sous-parties, un
 * exemple avec sa figure légendée, la question que se pose l'élève (encadré « ? »), son résumé et le
 * réflexe à garder (encadré « i »). Une partie sans contenu rédigé (créée dans le Studio) garde le
 * même cadre, avec son seul paragraphe.
 */
import React from 'react';
import { Mail, MessageSquare } from 'lucide-react';
import type { LessonArt, LessonFigure, StudyLesson } from '../content';
import { ArtBadge, FlowFigure, LessonBanner, SplitFigure } from './LessonArt';
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
  if (figure.kind === 'flow') return <FlowFigure figure={figure} />;
  if (figure.kind === 'split') return <SplitFigure figure={figure} />;

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

/** L'ouverture du module : le bandeau illustré, puis ce que l'on saura faire à la fin. */
export function ModuleOpening({ art, goals }: { art?: LessonArt; goals?: string[] }) {
  return (
    <>
      {art && <LessonBanner art={art} />}
      {goals && goals.length > 0 && (
        <Aside kind="info" label="Objectifs du module">
          <p>À la fin de ce module, vous saurez :</p>
          <List items={goals} />
        </Aside>
      )}
    </>
  );
}

/**
 * Une partie du module. Ses blocs sont posés à plat dans la colonne de lecture (pas d'enveloppe) :
 * le titre de la partie sert d'ancre au sommaire.
 */
export function LessonPart({
  lesson,
  index,
  practice,
  headingRef
}: {
  lesson: StudyLesson;
  index: number;
  /** L'exercice, si c'est dans cette partie qu'il se place. */
  practice?: React.ReactNode;
  headingRef?: (el: HTMLHeadingElement | null) => void;
}) {
  const rich = lesson.rich;
  return (
    <>
      <h2 id={`partie-${index + 1}`} ref={headingRef} className="rd-part-title" tabIndex={-1}>
        {rich && <ArtBadge art={rich.art} />}
        <span>{lesson.title}</span>
      </h2>
      <p>{lesson.intro}</p>

      {rich ? (
        <>
          <p>
            <RichText text={rich.scene} />
          </p>

          {rich.sections.map((section) => (
            <React.Fragment key={section.title}>
              <h3>{section.title}</h3>
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

          <h3>{rich.example.title}</h3>
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
          <h3>À vous de jouer</h3>
          <div className="rd-practice rd-wide">{practice}</div>
        </>
      )}

      <h3>En résumé</h3>
      <List items={lesson.points} />

      <Aside kind="info" label="Réflexe à garder">
        <p>
          <strong>Le réflexe à garder.</strong> {lesson.tip}
        </p>
      </Aside>
    </>
  );
}
