/**
 * Studio — éditeur d'une section et aperçu d'un module, au format des cours de la Bibliothèque.
 *
 * Le créateur remplit des blocs dans l'ordre où l'élève les lira : accroche, entrée en matière, cours en
 * parties, exemple illustré, question de l'élève, résumé. Chaque bloc dit ce qu'il attend et ce qui lui
 * manque ; une ligne de mesures compare le texte au niveau de langue de la classe visée.
 */
import React, { useRef, useState } from 'react';
import { Check, Plus, Trash2, Upload } from 'lucide-react';
import { FigureView, LessonPart, ModuleOpening } from '../../components/LessonArticle';
import { ConfirmDialog, Select, Toggle } from '../../components/ui';
import type { LessonFigure, StudyLesson } from '../../content';
import { readingBandOf } from '../../levels';
import { LANGUAGE_TARGETS } from '../../readability';
import {
  EMPTY_FIGURE,
  FIGURE_KINDS,
  GEOMETRY_TEMPLATES,
  figureFromText,
  figureToText,
  formatGoals,
  geometryTemplateOf,
  hasRichWork,
  isFigureReady,
  toRichSection,
  toSimpleSection,
  type FigureKind,
  type LessonBlock,
  type SectionReview,
  type SectionTodo,
  type StudioSection
} from '../../studioLesson';

const fr = (n: number) => n.toLocaleString('fr-FR');
const linesOf = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

/** Réduit une image choisie par le créateur (960 px de large au plus) pour qu'elle tienne dans le cours enregistré. */
async function imageToDataUrl(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    let out = '';
    for (const [maxWidth, quality] of [
      [960, 0.82],
      [960, 0.68],
      [720, 0.62]
    ]) {
      const scale = Math.min(1, maxWidth / image.naturalWidth);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas');
      // Un dessin à fond transparent garde un fond blanc.
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      out = canvas.toDataURL('image/jpeg', quality);
      if (out.length < 240_000) break;
    }
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ------------------------------------------------------------------ un bloc du déroulé */

function Block({ title, hint, todo, children }: { title: string; hint: string; todo: SectionTodo[]; children: React.ReactNode }) {
  const done = todo.length === 0;
  return (
    <section className="sx-block" aria-label={title}>
      <header className="sx-block-head">
        <h3>{title}</h3>
        {done ? (
          <span className="sx-block-state is-done">
            <Check size={14} aria-hidden="true" /> Prêt
          </span>
        ) : (
          <span className="sx-block-state">À finir</span>
        )}
      </header>
      <p className="sx-block-hint">{hint}</p>
      {children}
      {!done && (
        <ul className="sx-block-todo">
          {todo.map((item) => (
            <li key={item.text}>{item.text}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ la figure de l'exemple */

function FigureEditor({ figure, caption, onChange }: { figure: LessonFigure; caption: string; onChange: (figure: LessonFigure) => void }) {
  // La saisie est gardée telle que tapée ; une figure déjà écrite revient si l'on repasse à son type.
  const [draft, setDraft] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');
  const kept = useRef<Partial<Record<FigureKind, LessonFigure>>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const info = FIGURE_KINDS.find((k) => k.kind === figure.kind) || FIGURE_KINDS[0];
  const typed = figure.kind !== 'geometry' && figure.kind !== 'image' && figure.kind !== 'message';

  const setKind = (next: FigureKind) => {
    kept.current[figure.kind] = figure;
    setDraft(null);
    setImageError('');
    onChange(kept.current[next] || figureFromText(next, ''));
  };
  const onFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || figure.kind !== 'image') return;
    try {
      onChange({ ...figure, src: await imageToDataUrl(file) });
      setImageError('');
    } catch {
      setImageError('Cette image n’a pas pu être lue. Essayez un fichier JPEG ou PNG.');
    }
  };

  return (
    <>
      <div className="sx-form-row">
        <label className="ui-field">
          <span>Type de figure</span>
          <Select value={figure.kind} onChange={(e) => setKind(e.target.value as FigureKind)}>
            {FIGURE_KINDS.map((k) => (
              <option key={k.kind} value={k.kind}>
                {k.label}
              </option>
            ))}
          </Select>
        </label>
        {figure.kind === 'fraction' && (
          <label className="ui-field">
            <span>Forme</span>
            <Select value={figure.shape} onChange={(e) => onChange({ ...figure, shape: e.target.value === 'bar' ? 'bar' : 'disc' })}>
              <option value="disc">Disque</option>
              <option value="bar">Barre</option>
            </Select>
          </label>
        )}
        {figure.kind === 'geometry' && (
          <label className="ui-field">
            <span>Figure</span>
            <Select
              value={geometryTemplateOf(figure)}
              onChange={(e) => onChange(GEOMETRY_TEMPLATES.find((t) => t.id === e.target.value)?.figure || GEOMETRY_TEMPLATES[0].figure)}
            >
              {GEOMETRY_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </Select>
          </label>
        )}
      </div>

      {typed && (
        <label className="ui-field">
          <span>Contenu de la figure</span>
          <textarea
            rows={4}
            className="sx-figure-input"
            value={draft ?? figureToText(figure)}
            placeholder={info.sample}
            onChange={(e) => {
              setDraft(e.target.value);
              onChange(figureFromText(figure.kind, e.target.value, figure));
            }}
          />
          <small>{info.help}</small>
        </label>
      )}
      {figure.kind === 'geometry' && <p className="sx-note">{info.help}</p>}
      {figure.kind === 'image' && (
        <>
          <div className="sx-image-pick">
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onFile} />
            <button type="button" className="secondary ui-btn-sm" onClick={() => fileRef.current?.click()}>
              <Upload size={16} aria-hidden="true" /> {figure.src ? 'Changer d’image' : 'Choisir une image'}
            </button>
            <small>{imageError || info.help}</small>
          </div>
          <div className="sx-form-row">
            <label className="ui-field">
              <span>Description de l’image</span>
              <input value={figure.alt} maxLength={200} placeholder="Ce que montre l’image, en une phrase" onChange={(e) => onChange({ ...figure, alt: e.target.value })} />
            </label>
            <label className="ui-field">
              <span>Crédit</span>
              <input
                value={figure.credit || ''}
                maxLength={120}
                placeholder="Ex. Photo de l’auteur"
                onChange={(e) => onChange({ ...figure, credit: e.target.value || undefined })}
              />
            </label>
          </div>
        </>
      )}

      {isFigureReady(figure) && (
        <div className="sx-figure-preview rd-preview" aria-label="Aperçu de la figure">
          <figure className={`rd-figure is-${figure.kind}`}>
            <div className="rd-figure-stage">
              <FigureView figure={figure} />
            </div>
            {caption.trim() && <figcaption>{caption}</figcaption>}
          </figure>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ les mesures du texte */

/** Mots, longueur des phrases et durée de lecture d'une section, comparés au repère de la classe visée. */
export function SectionMeasure({ review, classLabel }: { review: SectionReview; classLabel?: string }) {
  if (review.words === 0) return null;
  const target = LANGUAGE_TARGETS[readingBandOf(classLabel)];
  return (
    <div className="sx-measure">
      <p className="sx-measure-stats tabular-nums">
        {review.words} mots · {fr(review.avgWords)} mots par phrase · environ {review.minutes} min de lecture
      </p>
      <p className="sx-note">
        Niveau visé : {target.label}. Phrases de {target.avgWords} mots en moyenne, {target.maxWords} au plus.
      </p>
      {(review.language.length > 0 || review.long) && (
        <ul className="sx-measure-list">
          {[...review.language, ...(review.long ? [review.long] : [])].map((advice) => (
            <li key={advice}>{advice}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ une section */

export function SectionEditor({
  section,
  review,
  classLabel,
  canRich,
  summary = true,
  onPatch,
  onReplace
}: {
  section: StudioSection;
  review: SectionReview;
  classLabel?: string;
  /** Le format complet vaut pour les modules ; une ressource reste une fiche de texte. */
  canRich: boolean;
  /** Points clés et réflexe : sans objet pour la présentation d'un parcours. */
  summary?: boolean;
  onPatch: (patch: Partial<StudioSection>) => void;
  /** Remplace toute la section (changement de format). */
  onReplace: (next: StudioSection) => void;
}) {
  const rich = canRich && section.format === 'rich';
  // Les listes saisies ligne par ligne sont gardées telles que tapées (une ligne vide en cours de frappe reste).
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [confirmSimple, setConfirmSimple] = useState(false);
  const [pendingPart, setPendingPart] = useState<number | null>(null);
  const linesField = (key: string, value: string[], apply: (lines: string[]) => void) => ({
    value: key in drafts ? drafts[key] : value.join('\n'),
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      setDrafts((d) => ({ ...d, [key]: text }));
      apply(linesOf(text));
    }
  });
  const todoOf = (block: LessonBlock) => review.todo.filter((item) => item.block === block);

  const parts = section.parts || [];
  const patchPart = (i: number, patch: Partial<(typeof parts)[number]>) => onPatch({ parts: parts.map((part, j) => (j === i ? { ...part, ...patch } : part)) });
  const removePart = (i: number) => {
    setDrafts({});
    onPatch({ parts: parts.filter((_, j) => j !== i) });
  };
  const example = section.example || { title: '', caption: '', notes: [], figure: EMPTY_FIGURE };
  const patchExample = (patch: Partial<typeof example>) => onPatch({ example: { ...example, ...patch } });
  const question = section.question || { ask: '', answer: '' };

  const setFormat = (on: boolean) => {
    if (on) onReplace(toRichSection(section));
    else if (hasRichWork(section)) setConfirmSimple(true);
    else onReplace(toSimpleSection(section));
    setDrafts({});
  };

  return (
    <>
      {canRich && (
        <Toggle
          checked={rich}
          onChange={setFormat}
          label="Format complet des cours"
          description="Entrée en matière, cours en parties, exemple illustré, question de l’élève, résumé : le déroulé des cours de la Bibliothèque."
        />
      )}
      <SectionMeasure review={review} classLabel={classLabel} />

      <label className="ui-field">
        <span>Titre de la section</span>
        <input value={section.title} maxLength={120} onChange={(e) => onPatch({ title: e.target.value })} />
      </label>

      {!rich ? (
        <>
          <label className="ui-field">
            <span>Texte</span>
            <textarea rows={10} value={section.body} placeholder="Expliquez la notion comme à un apprenant…" onChange={(e) => onPatch({ body: e.target.value })} />
          </label>
          {summary && (
            <>
              <label className="ui-field">
                <span>Points clés</span>
                <textarea rows={3} placeholder="Un point par ligne" {...linesField('points', section.keyPoints || [], (keyPoints) => onPatch({ keyPoints }))} />
                <small>Un point par ligne. Ils s’affichent en liste à la fin de la section.</small>
              </label>
              <label className="ui-field">
                <span>Réflexe clé</span>
                <input value={section.tip || ''} maxLength={200} placeholder="Le conseil à retenir en une phrase" onChange={(e) => onPatch({ tip: e.target.value })} />
              </label>
            </>
          )}
        </>
      ) : (
        <>
          <label className="ui-field">
            <span>En une phrase</span>
            <input value={section.body} maxLength={240} placeholder="Ce que l’élève va apprendre dans cette section" onChange={(e) => onPatch({ body: e.target.value })} />
            <small>Cette phrase ouvre la section, juste sous son titre.</small>
          </label>

          <Block title="Entrée en matière" hint="Avant toute définition, une situation de tous les jours, en deux ou trois phrases." todo={todoOf('scene')}>
            <label className="ui-field">
              <span className="sr-only">Entrée en matière</span>
              <textarea
                rows={3}
                value={section.scene || ''}
                placeholder="Hier, Kokou a partagé une orange avec sa sœur…"
                onChange={(e) => onPatch({ scene: e.target.value })}
              />
            </label>
          </Block>

          <Block title="Le cours" hint="De deux à quatre parties, une idée par partie. Entourez un mot important de deux étoiles pour le mettre en gras : **mot**." todo={todoOf('course')}>
            {parts.map((part, i) => (
              <div key={i} className="sx-part">
                <div className="sx-part-head">
                  <b className="tabular-nums">Partie {i + 1}</b>
                  {parts.length > 2 && (
                    <button
                      type="button"
                      className="li-icon-btn"
                      aria-label={`Retirer la partie ${i + 1}`}
                      title="Retirer la partie"
                      onClick={() => (part.title.trim() || part.text.trim() || (part.items || []).length ? setPendingPart(i) : removePart(i))}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>
                <label className="ui-field">
                  <span>Titre</span>
                  <input value={part.title} maxLength={100} onChange={(e) => patchPart(i, { title: e.target.value })} />
                </label>
                <label className="ui-field">
                  <span>Texte</span>
                  <textarea rows={5} value={part.text} placeholder="Un paragraphe par idée ; sautez une ligne entre deux paragraphes." onChange={(e) => patchPart(i, { text: e.target.value })} />
                </label>
                <label className="ui-field">
                  <span>Liste (facultatif)</span>
                  <textarea rows={2} placeholder="Un élément par ligne" {...linesField(`items-${i}`, part.items || [], (items) => patchPart(i, { items: items.length ? items : undefined }))} />
                </label>
              </div>
            ))}
            {parts.length < 4 && (
              <button type="button" className="li-text-link sx-add" onClick={() => onPatch({ parts: [...parts, { title: '', text: '' }] })}>
                <Plus size={16} aria-hidden="true" /> Ajouter une partie
              </button>
            )}
          </Block>

          <Block
            title="L’exemple illustré"
            hint="Un cas concret montré par une figure : tableau, schéma, fraction dessinée, figure de géométrie ou image. Une figure qui explique, pas une décoration."
            todo={todoOf('example')}
          >
            <label className="ui-field">
              <span>Titre de l’exemple</span>
              <input value={example.title} maxLength={100} placeholder="Ex. Le partage de l’orange" onChange={(e) => patchExample({ title: e.target.value })} />
            </label>
            <FigureEditor figure={example.figure} caption={example.caption} onChange={(figure) => patchExample({ figure })} />
            <label className="ui-field">
              <span>Légende</span>
              <input value={example.caption} maxLength={160} placeholder="Ce que montre la figure, en quelques mots" onChange={(e) => patchExample({ caption: e.target.value })} />
            </label>
            <label className="ui-field">
              <span>Ce qu’il faut y voir</span>
              <textarea rows={3} placeholder="Une remarque par ligne, de deux à quatre" {...linesField('notes', example.notes, (notes) => patchExample({ notes }))} />
            </label>
          </Block>

          <Block title="La question de l’élève" hint="La question qu’un élève poserait à ce moment du cours, puis votre réponse." todo={todoOf('question')}>
            <label className="ui-field">
              <span>Question</span>
              <input value={question.ask} maxLength={200} placeholder="Et si… ?" onChange={(e) => onPatch({ question: { ...question, ask: e.target.value } })} />
            </label>
            <label className="ui-field">
              <span>Réponse</span>
              <textarea rows={3} value={question.answer} onChange={(e) => onPatch({ question: { ...question, answer: e.target.value } })} />
            </label>
          </Block>

          <Block title="À retenir" hint="Le résumé de la section en quelques points, puis le réflexe à garder." todo={todoOf('summary')}>
            <label className="ui-field">
              <span>Points à retenir</span>
              <textarea rows={3} placeholder="Un point par ligne" {...linesField('points', section.keyPoints || [], (keyPoints) => onPatch({ keyPoints }))} />
            </label>
            <label className="ui-field">
              <span>Réflexe à garder</span>
              <input value={section.tip || ''} maxLength={200} placeholder="Le geste à refaire seul, en une phrase" onChange={(e) => onPatch({ tip: e.target.value })} />
            </label>
          </Block>
        </>
      )}

      <ConfirmDialog
        open={confirmSimple}
        title="Repasser au format simple ?"
        text="Les textes de la section sont gardés en un seul bloc. L’exemple illustré et la question de l’élève seront retirés."
        confirmLabel="Repasser au format simple"
        danger
        onConfirm={() => {
          setConfirmSimple(false);
          onReplace(toSimpleSection(section));
        }}
        onCancel={() => setConfirmSimple(false)}
      />
      <ConfirmDialog
        open={pendingPart !== null}
        title="Retirer cette partie ?"
        text="Son titre, son texte et sa liste seront retirés de la section."
        confirmLabel="Retirer"
        danger
        onConfirm={() => {
          if (pendingPart !== null) removePart(pendingPart);
          setPendingPart(null);
        }}
        onCancel={() => setPendingPart(null)}
      />
    </>
  );
}

/* ------------------------------------------------------------------ les objectifs du module */

export function GoalsEditor({ goals, onChange }: { goals: string[]; onChange: (goals: string[]) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const formatted = formatGoals(goals);
  return (
    <>
      <label className="ui-field">
        <span>Objectifs du module</span>
        <textarea
          rows={4}
          value={draft ?? goals.join('\n')}
          placeholder={'Reconnaître un message piégé\nVérifier l’adresse d’un expéditeur'}
          onChange={(e) => {
            setDraft(e.target.value);
            onChange(linesOf(e.target.value));
          }}
        />
        <small>
          De deux à quatre, un par ligne, en commençant par un verbe. Chaque ligne complète « À la fin de ce module, vous saurez ». La ponctuation se pose toute seule.
        </small>
      </label>
      {formatted.length > 0 && (
        <div className="sx-goals-preview">
          <p>À la fin de ce module, vous saurez :</p>
          <ul>
            {formatted.map((goal) => (
              <li key={goal}>{goal}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ l'aperçu du module */

/** Le module tel que l'apprenant le lira : le même rendu que le lecteur, à la taille de texte de la classe. */
export function LessonPreview({
  title,
  domain,
  goals,
  lessons,
  classLabel,
  minutes,
  questionCount
}: {
  title: string;
  domain: string;
  goals?: string[];
  lessons: StudyLesson[];
  classLabel?: string;
  minutes: number;
  questionCount: number;
}) {
  return (
    <div className="rd-preview sx-lesson-preview" data-band={readingBandOf(classLabel)}>
      <div className="rd-article rd-chapter-main">
        <div className="rd-chapter-body">
          <ModuleOpening title={title} domain={domain} goals={goals} art={lessons[0]?.rich?.art} seed={title} minutes={minutes} questionCount={questionCount} />
          {lessons.map((lesson, i) => (
            <LessonPart key={i} lesson={lesson} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
