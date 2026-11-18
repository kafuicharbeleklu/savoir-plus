/**
 * Éléments communs aux espaces famille, encadrant et établissement : propriétés des pages,
 * nom d'un membre, lecture d'une progression, fiche de suivi d'un apprenant, emploi du temps.
 */
import React from 'react';
import type { Day } from '../../calendar';
import { MODULES_CONTENT, builtInAnswerKey } from '../../content';
import type { Profile, Progress } from '../../data';
import { isQuizPassed, moduleProgressPercent, scoreAnswers } from '../../domain.mjs';
import { type SchoolState, type TimetableSlot } from '../../school';
import { SCHOOL_MEMBER_NAMES } from '../../seedSchool';
import type { CatalogItem, ExtendedDemoState } from '../../wireframeData';
import { EmptyState, IconTile, ListCard, ListRow, Modal, StatusDot } from '../../components/ui';
import { InlineMeter } from '../../components/Charts';
import { BookOpen } from 'lucide-react';

export interface SchoolPageProps {
  school: SchoolState;
  saveSchool: (next: SchoolState) => void;
  ext: ExtendedDemoState;
  user: Profile;
  people: Profile[];
  today: Day;
  catalog: CatalogItem[];
  /** Partie de l'adresse après le nom de la page (classe ou enfant ouvert). */
  selectedId: string;
  nav: (page: any, id?: string) => void;
  setToast: (message: string) => void;
}

export const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

const EMPTY: Progress = { lessons: [], answers: [], submitted: false };

/** Nom d'un membre : sa fiche s'il en a une, sinon le nom enregistré par l'établissement. */
/** Identifiant du membre auteur d'un contenu (le catalogue ne porte que son nom). */
export const authorIdOf = (people: Profile[], item: { author: string }): string | undefined => people.find((p) => p.name === item.author)?.id;

export const memberName = (id: string, people: Profile[]): string =>
  people.find((p) => p.id === id)?.name || SCHOOL_MEMBER_NAMES[id] || 'Membre';

export const progressOf = (ext: ExtendedDemoState, uid: string, moduleId: string): Progress =>
  ext.moduleProgress?.[uid]?.[moduleId] || EMPTY;

export const moduleTitle = (catalog: CatalogItem[], moduleId: string): string =>
  catalog.find((c) => c.id === moduleId)?.title || MODULES_CONTENT[moduleId]?.title || moduleId;

export interface ModuleFollowUp {
  moduleId: string;
  title: string;
  lessonsRead: number;
  lessonCount: number;
  percent: number;
  /** Quiz : pas encore envoyé, réussi, ou à retenter. */
  quiz: 'none' | 'passed' | 'failed';
  /** Note sur 100 quand le quiz a été envoyé. */
  score: number | null;
}

/** Ce qu'un apprenant a fait sur un module : sections lues, quiz, note. Jamais ses réponses une à une. */
export function followUp(ext: ExtendedDemoState, catalog: CatalogItem[], uid: string, moduleId: string): ModuleFollowUp {
  const progress = progressOf(ext, uid, moduleId);
  const content = MODULES_CONTENT[moduleId];
  const lessonCount = content?.lessons.length || 3;
  const key = builtInAnswerKey(moduleId);
  const passed = progress.submitted && isQuizPassed(progress, key);
  return {
    moduleId,
    title: moduleTitle(catalog, moduleId),
    lessonsRead: progress.lessons.length,
    lessonCount,
    percent: moduleProgressPercent(progress, lessonCount, key),
    quiz: !progress.submitted ? 'none' : passed ? 'passed' : 'failed',
    score: progress.submitted && key && key.length > 0 ? Math.round((scoreAnswers(progress.answers || [], key) / key.length) * 100) : null
  };
}

export const followUpSummary = (rows: ModuleFollowUp[]): string => {
  if (rows.length === 0) return 'Aucun module donné';
  const validated = rows.filter((r) => r.quiz === 'passed').length;
  return `${plural(validated, 'module validé', 'modules validés')} sur ${rows.length}`;
};

const quizLabel = (row: ModuleFollowUp) =>
  row.quiz === 'passed' ? `Quiz réussi · ${row.score} %` : row.quiz === 'failed' ? `Quiz à retenter · ${row.score} %` : 'Quiz pas encore envoyé';

/** Liste « un module, une ligne » du suivi d'un apprenant. */
export function FollowUpList({ rows, label }: { rows: ModuleFollowUp[]; label: string }) {
  return (
    <ListCard label={label}>
      {rows.length === 0 ? (
        <EmptyState title="Aucun module pour le moment" text="Les modules donnés à la classe apparaîtront ici." />
      ) : (
        rows.map((row) => (
          <ListRow
            key={row.moduleId}
            leading={
              <IconTile tone={row.quiz === 'passed' ? 'brand' : row.quiz === 'failed' ? 'danger' : 'neutral'}>
                <BookOpen size={20} aria-hidden="true" />
              </IconTile>
            }
            title={row.title}
            meta={`${plural(row.lessonsRead, 'section lue', 'sections lues')} sur ${row.lessonCount} · ${quizLabel(row)}`}
            trailing={<InlineMeter value={row.percent} />}
          />
        ))
      )}
    </ListCard>
  );
}

/** Fenêtre de suivi d'un apprenant : ses modules, sans aucune réponse individuelle. */
export function LearnerModal({
  name,
  subtitle,
  rows,
  onClose
}: {
  name: string;
  subtitle: string;
  rows: ModuleFollowUp[];
  onClose: () => void;
}) {
  return (
    <Modal open size="md" title={name} onClose={onClose}>
      <p className="sc-modal-sub">{subtitle}</p>
      <FollowUpList rows={rows} label={`Suivi de ${name}`} />
      <p className="sc-note">Vous voyez l’avancement et la note au quiz. Les réponses données question par question ne sont pas montrées.</p>
    </Modal>
  );
}

/* ------------------------------------------------------------------ Emploi du temps */

const WEEKDAY_LABEL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const WEEKDAY_SHORT = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];

/** Heure lisible : « 07:00 » → « 7 h », « 09:15 » → « 9 h 15 ». */
export const clock = (value: string): string => {
  const [h, m] = value.split(':').map(Number);
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
};

/** Emploi du temps de la semaine, un créneau par ligne, regroupé par jour. */
export function TimetableList({
  slots,
  school,
  showClass = false,
  trailing
}: {
  slots: TimetableSlot[];
  school: SchoolState;
  /** Affiche la classe (vue de l'enseignant ou de l'établissement). */
  showClass?: boolean;
  trailing?: (slot: TimetableSlot) => React.ReactNode;
}) {
  if (slots.length === 0) {
    return (
      <ListCard label="Emploi du temps">
        <EmptyState title="Aucun cours dans l’emploi du temps" text="Les créneaux saisis par l’établissement apparaîtront ici." />
      </ListCard>
    );
  }
  return (
    <ListCard label="Emploi du temps de la semaine">
      {slots.map((slot) => {
        const schoolClass = school.classes.find((c) => c.id === slot.classId);
        const details = [`${clock(slot.start)} – ${clock(slot.end)}`];
        if (showClass && schoolClass) details.push(schoolClass.name);
        if (!showClass && slot.teacherName) details.push(slot.teacherName);
        if (slot.room) details.push(slot.room);
        return (
          <ListRow
            key={slot.id}
            leading={
              <span className="cal-date-tile is-neutral sc-day-tile" aria-hidden="true">
                <b>{WEEKDAY_SHORT[slot.weekday]}</b>
              </span>
            }
            title={slot.subject}
            meta={details.join(' · ')}
            ariaLabel={`${WEEKDAY_LABEL[slot.weekday]}, ${slot.subject}, ${details.join(', ')}`}
            trailing={trailing?.(slot)}
          />
        );
      })}
    </ListCard>
  );
}

export const weekdayLabel = (weekday: number): string => WEEKDAY_LABEL[weekday] || '';

/** Point d'état de la vérification d'identité. */
export function IdentityDot({ status }: { status: 'none' | 'pending' | 'verified' | 'refused' }) {
  const tone = status === 'verified' ? 'info' : status === 'pending' ? 'warn' : status === 'refused' ? 'danger' : 'neutral';
  const label =
    status === 'verified' ? 'Identité vérifiée' : status === 'pending' ? 'Vérification en cours' : status === 'refused' ? 'Vérification refusée' : 'Identité non vérifiée';
  return <StatusDot tone={tone}>{label}</StatusDot>;
}
