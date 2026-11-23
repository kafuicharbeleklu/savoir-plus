/**
 * Le texte d'un module, mis en page comme un chapitre qui se lit d'un trait : une ouverture (bandeau,
 * objectifs), puis les parties à la suite. Chaque partie a son titre, son cours en sous-parties, un
 * exemple avec sa figure légendée, la question que se pose l'élève (encadré « ? »), son résumé et le
 * réflexe à garder (encadré « i »). Une partie sans contenu rédigé (créée dans le Studio) garde le
 * même cadre, avec son seul paragraphe.
 */
import React from 'react';
import { Check, ClipboardCheck, Clock, Mail, MessageSquare, MousePointerClick } from 'lucide-react';
import type { LessonArt, LessonFigure, StudyLesson } from '../content';
import { ART_ICONS, ArtBadge, ArtScene, FlowFigure, SplitFigure, GeometryFigure, FractionFigure, ImageFigure } from './LessonArt';
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

export function FigureView({ figure }: { figure: LessonFigure }) {
  if (figure.kind === 'flow') return <FlowFigure figure={figure} />;
  if (figure.kind === 'split') return <SplitFigure figure={figure} />;
  if (figure.kind === 'geometry') return <GeometryFigure figure={figure} />;
  if (figure.kind === 'fraction') return <FractionFigure figure={figure} />;
  if (figure.kind === 'image') return <ImageFigure figure={figure} />;

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

  // Une colonne faite de nombres (montants, mesures, pourcentages) s'aligne à droite, chiffres en colonnes.
  // Un nombre a au plus une virgule : une adresse (192.168.1.24) ou une date n'en est pas un.
  const NUMERIC = /^[−–-]?\s?\d+(?:[\s\u00a0\u202f]\d{3})*(?:[.,]\d+)?\s?(%|F|F CFA|FCFA|XP|cm|mm|m|km|g|kg|N|L|mL|mol|h|min|s|°C)?$/;
  const plain = (cell: string) => cell.replace(/\*\*/g, '').trim();
  const numeric = figure.head.map((_, c) => figure.rows.length > 0 && figure.rows.every((row) => NUMERIC.test(plain(row[c] || ''))));
  return (
    // Sur petit écran, le tableau défile dans son cadre au lieu d'être coupé ou écrasé.
    <div className="rd-table-scroll" role="region" aria-label="Tableau" tabIndex={0}>
      <table className="rd-table">
        <thead>
          <tr>
            {figure.head.map((cell, c) => (
              <th key={c} scope="col" className={numeric[c] ? 'is-num' : undefined}>
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {figure.rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c} className={numeric[c] ? 'is-num' : undefined}>
                  <RichText text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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

/**
 * L'ouverture du module : un en-tête (titre, durées par type d'activité, illustration à côté), puis
 * la présentation du module et ce que l'on saura faire à la fin, en texte simple.
 */
export function ModuleOpening({
  title,
  domain,
  summary,
  goals,
  art,
  seed = '',
  minutes,
  questionCount,
  hasPractice = false,
  read = false
}: {
  title: string;
  domain?: string;
  summary?: string;
  goals?: string[];
  art?: LessonArt;
  seed?: string;
  minutes: number;
  questionCount: number;
  hasPractice?: boolean;
  /** Toutes les parties ont été déclarées lues. */
  read?: boolean;
}) {
  const Icon = art ? ART_ICONS[art] : null;
  return (
    <>
      <header className={`rd-hero rd-wide${Icon ? '' : ' is-plain'}`}>
        <div className="rd-hero-text">
          <p className="rd-hero-kicker">Module{domain ? ` · ${domain}` : ''}</p>
          <h1>{title}</h1>
          <ul className="rd-hero-meta tabular-nums">
            {minutes > 0 && (
              <li>
                <Clock size={16} aria-hidden="true" />
                {minutes} min de lecture
              </li>
            )}
            {hasPractice && (
              <li>
                <MousePointerClick size={16} aria-hidden="true" />1 exercice
              </li>
            )}
            {questionCount > 0 && (
              <li>
                <ClipboardCheck size={16} aria-hidden="true" />
                Quiz de {questionCount} question{questionCount > 1 ? 's' : ''}
              </li>
            )}
            {read && (
              <li className="is-done">
                <Check size={16} aria-hidden="true" />
                Lu
              </li>
            )}
          </ul>
        </div>
        {Icon && <ArtScene className="rd-hero-art" seed={seed} icon={<Icon size={20} strokeWidth={1.75} />} />}
      </header>

      {summary && <p>{summary}</p>}
      {goals && goals.length > 0 && (
        <>
          <p className="rd-goals-title">À la fin de ce module, vous saurez :</p>
          <List items={goals} />
        </>
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
  headingRef,
  practiceRef
}: {
  lesson: StudyLesson;
  index: number;
  /** L'exercice, si c'est dans cette partie qu'il se place. */
  practice?: React.ReactNode;
  headingRef?: (el: HTMLHeadingElement | null) => void;
  /** Le titre de l'exercice, pour que le sommaire puisse y mener. */
  practiceRef?: (el: HTMLHeadingElement | null) => void;
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

          {rich.sections.map((section, s) => (
            <React.Fragment key={s}>
              <h3>{section.title}</h3>
              {section.text.map((paragraph, i) => (
                <p key={i}>
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
          {rich.question.answer.map((paragraph, i) => (
            <p key={i}>
              <RichText text={paragraph} />
            </p>
          ))}
        </>
      ) : (
        <p>{lesson.body}</p>
      )}

      {practice && (
        <>
          <h3 id="exercice" ref={practiceRef} tabIndex={-1}>
            À vous de jouer
          </h3>
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
