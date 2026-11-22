/**
 * Page Calendrier : l'agenda (mois, journée choisie, dates à venir) et le plan de révision
 * (examens, séances, calcul expliqué). Le plan est recalculé à chaque changement par l'appelant.
 */
import React, { useState } from 'react';
import { ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, ClipboardCheck, Feather, PenLine } from 'lucide-react';
import {
  BREAK_MODE_LABEL,
  DIFFICULTY_LABEL,
  GOAL_LABEL,
  LEVEL_LABEL,
  NATIONAL_EXAMS,
  SCHOOL_CALENDAR,
  SESSION_KIND_LABEL,
  countdownLabel,
  diffDays,
  editSchoolEvent,
  eventCovers,
  eventEnd,
  examStatusLabel,
  explainLoad,
  formatDayLong,
  formatMonthTitle,
  formatRange,
  isValidDay,
  logSession,
  removeEvent,
  sessionTaskLabel,
  unlogSession,
  upsertUserEvent,
  type CalendarEvent,
  type CalendarEventKind,
  type CalendarUserState,
  type Day,
  type ExamPlan,
  type ExamSettings,
  type NationalExamCode,
  type PlanSettings,
  type PlannedSession,
  type RevisionPlan,
  type SessionKind
} from '../calendar';
import { DateTile, MonthGrid, MonthLegend, examStatusTone } from '../components/CalendarMonth';
import { ProgressBar } from '../components/ProfileIdentityCard';
import {
  ActionMenu,
  EmptyState,
  IconTile,
  ListCard,
  ListRow,
  Modal,
  PageHeader,
  RowTitle,
  Select,
  StateTile,
  StatusDot,
  Tabs,
  Toggle
} from '../components/ui';

type TabId = 'agenda' | 'plan' | 'timetable';

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

/** « 45 min », « 1 h », « 1 h 30 ». */
const formatMinutes = (minutes: number): string => {
  if (minutes <= 0) return 'Aucune';
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return rest ? `${Math.floor(minutes / 60)} h ${rest}` : `${minutes / 60} h`;
};

const KIND_LABEL: Record<CalendarEventKind, string> = { exam: 'Examen', break: 'Congés', marker: 'Repère' };
const WEEKDAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const DAILY_MINUTES = [0, 30, 45, 60, 90, 120];
const SESSION_MINUTES = [30, 45, 60];

const sessionIcon = (kind: SessionKind) =>
  kind === 'module' ? (
    <BookOpen size={20} aria-hidden="true" />
  ) : kind === 'test' ? (
    <ClipboardCheck size={20} aria-hidden="true" />
  ) : kind === 'light' ? (
    <Feather size={20} aria-hidden="true" />
  ) : (
    <PenLine size={20} aria-hidden="true" />
  );

/** Ligne d'information d'une date : nature, échéance, durée. */
function eventMeta(event: CalendarEvent, today: Day, plan?: ExamPlan): string {
  const parts: string[] = [KIND_LABEL[event.kind]];
  const end = eventEnd(event);
  if (end > event.start) parts.push(formatRange(event.start, end));
  if (event.kind === 'break') parts.push(plural(diffDays(event.start, end) + 1, 'jour', 'jours'));
  else if (end >= today) parts.push(event.start <= today ? 'en cours' : countdownLabel(diffDays(today, event.start)));
  if (plan && plan.status !== 'past') parts.push(`${plan.done} / ${plan.total} séances`);
  return parts.join(' · ');
}

/* ------------------------------------------------------------------ Fenêtre : ajouter ou modifier une date */

type Draft = {
  id?: string;
  source: 'user' | 'school';
  kind: CalendarEventKind;
  title: string;
  start: string;
  end: string;
  note: string;
  subject: string;
  difficulty: string;
  level: string;
  goal: ExamSettings['goal'];
  moduleId: string;
  createdOn?: Day;
};

const draftFrom = (event: CalendarEvent | null, day: Day): Draft =>
  event
    ? {
        id: event.id,
        source: event.source,
        kind: event.kind,
        title: event.title,
        start: event.start,
        end: event.end || '',
        note: event.note || '',
        subject: event.exam?.subject || '',
        difficulty: String(event.exam?.difficulty ?? 2),
        level: String(event.exam?.level ?? 2),
        goal: event.exam?.goal ?? 'pass',
        moduleId: event.exam?.moduleIds?.[0] || '',
        createdOn: event.createdOn
      }
    : { source: 'user', kind: 'exam', title: '', start: day, end: '', note: '', subject: '', difficulty: '2', level: '2', goal: 'pass', moduleId: '' };

function EventModal({
  event,
  defaultDay,
  today,
  moduleOptions,
  onSave,
  onClose
}: {
  /** Date à modifier, ou `null` pour en ajouter une. */
  event: CalendarEvent | null;
  defaultDay: Day;
  today: Day;
  moduleOptions: { id: string; title: string }[];
  onSave: (draft: Draft) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => draftFrom(event, defaultDay));
  const [tried, setTried] = useState(false);
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const fromSchool = draft.source === 'school';
  // Un examen du calendrier scolaire est un repère : ses matières s'ajoutent comme examens du membre.
  const withPlan = draft.kind === 'exam' && !fromSchool;

  const titleMissing = !draft.title.trim();
  const startInvalid = !isValidDay(draft.start);
  const endInvalid = Boolean(draft.end) && (!isValidDay(draft.end) || draft.end < draft.start);
  const invalid = titleMissing || startInvalid || endInvalid;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!invalid) onSave(draft);
  };

  return (
    <Modal
      open
      size="md"
      title={event ? (fromSchool ? 'Corriger une date du calendrier scolaire' : 'Modifier la date') : 'Ajouter une date'}
      onClose={onClose}
      footer={
        <button type="submit" form="cal-event-form" className="primary ui-btn-sm">
          Enregistrer
        </button>
      }
    >
      <form id="cal-event-form" className="cal-form" onSubmit={submit} noValidate>
        {fromSchool ? (
          <p className="cal-form-note">
            {draft.title} — corrigez les dates si votre établissement en annonce d’autres. Le reste du calendrier scolaire ne change pas.
          </p>
        ) : (
          <>
            <label className="ui-field">
              <span>Type</span>
              <Select value={draft.kind} onChange={(e) => set({ kind: e.target.value as CalendarEventKind })}>
                <option value="exam">Examen</option>
                <option value="break">Congé ou vacances</option>
                <option value="marker">Repère (date limite, rappel)</option>
              </Select>
            </label>
            <label className="ui-field">
              <span>Titre</span>
              <input
                value={draft.title}
                maxLength={80}
                placeholder={draft.kind === 'exam' ? 'Ex. Composition de mathématiques' : draft.kind === 'break' ? 'Ex. Congés de fin d’année' : 'Ex. Dépôt du dossier'}
                aria-invalid={tried && titleMissing}
                onChange={(e) => set({ title: e.target.value })}
              />
              {tried && titleMissing && <small className="cal-form-error">Donnez un titre à cette date.</small>}
            </label>
          </>
        )}

        <div className="cal-form-row">
          <label className="ui-field">
            <span>{draft.kind === 'break' ? 'Premier jour' : 'Date'}</span>
            <input type="date" value={draft.start} aria-invalid={tried && startInvalid} onChange={(e) => set({ start: e.target.value })} />
            {tried && startInvalid && <small className="cal-form-error">Indiquez une date.</small>}
          </label>
          <label className="ui-field">
            <span>{draft.kind === 'break' ? 'Dernier jour' : 'Dernier jour (facultatif)'}</span>
            <input type="date" value={draft.end} min={draft.start || undefined} aria-invalid={tried && endInvalid} onChange={(e) => set({ end: e.target.value })} />
            {tried && endInvalid && <small className="cal-form-error">Le dernier jour doit suivre le premier.</small>}
          </label>
        </div>

        {withPlan && (
          <>
            <label className="ui-field">
              <span>Matière</span>
              <input value={draft.subject} maxLength={60} placeholder="Ex. Mathématiques" onChange={(e) => set({ subject: e.target.value })} />
              <small>Elle sert à nommer les séances de révision. Sans matière, le titre est repris.</small>
            </label>
            <div className="cal-form-row is-three">
              <label className="ui-field">
                <span>Difficulté de l’examen</span>
                <Select value={draft.difficulty} onChange={(e) => set({ difficulty: e.target.value })}>
                  {([1, 2, 3] as const).map((n) => (
                    <option key={n} value={n}>
                      {DIFFICULTY_LABEL[n]}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="ui-field">
                <span>Mon niveau</span>
                <Select value={draft.level} onChange={(e) => set({ level: e.target.value })}>
                  {([1, 2, 3] as const).map((n) => (
                    <option key={n} value={n}>
                      {LEVEL_LABEL[n]}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="ui-field">
                <span>Mon objectif</span>
                <Select value={draft.goal} onChange={(e) => set({ goal: e.target.value as ExamSettings['goal'] })}>
                  <option value="pass">{GOAL_LABEL.pass}</option>
                  <option value="high">{GOAL_LABEL.high}</option>
                </Select>
              </label>
            </div>
            {moduleOptions.length > 0 && (
              <label className="ui-field">
                <span>Module SAVOIR+ lié (facultatif)</span>
                <Select value={draft.moduleId} onChange={(e) => set({ moduleId: e.target.value })}>
                  <option value="">Aucun</option>
                  {moduleOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </Select>
                <small>Le plan commence par ce module, et ajoute une séance si son quiz n’est pas réussi.</small>
              </label>
            )}
            {isValidDay(draft.start) && draft.start <= today && (
              <p className="cal-form-note">Cette date est aujourd’hui ou passée : aucune séance ne sera proposée.</p>
            )}
          </>
        )}

        {!fromSchool && (
          <label className="ui-field">
            <span>Note (facultatif)</span>
            <input value={draft.note} maxLength={140} onChange={(e) => set({ note: e.target.value })} />
          </label>
        )}
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ Fenêtre : rythme et calendrier scolaire */

function RhythmModal({
  state,
  onSave,
  onClose
}: {
  state: CalendarUserState;
  onSave: (settings: PlanSettings, showSchool: boolean, nationalExam: NationalExamCode | null) => void;
  onClose: () => void;
}) {
  const [settings, setSettings] = useState<PlanSettings>(state.settings);
  const [showSchool, setShowSchool] = useState(state.showSchool);
  const [nationalExam, setNationalExam] = useState<NationalExamCode | ''>(state.nationalExam || '');
  const set = (patch: Partial<PlanSettings>) => setSettings((s) => ({ ...s, ...patch }));
  const tooShort = Math.max(settings.weekdayMinutes, settings.weekendMinutes) < settings.sessionMinutes;

  return (
    <Modal
      open
      size="md"
      title="Mes réglages"
      onClose={onClose}
      footer={
        <button type="button" className="primary ui-btn-sm" onClick={() => onSave(settings, showSchool, nationalExam || null)}>
          Enregistrer
        </button>
      }
    >
      <div className="cal-form">
        <div className="cal-form-row is-three">
          <label className="ui-field">
            <span>En semaine</span>
            <Select value={settings.weekdayMinutes} onChange={(e) => set({ weekdayMinutes: Number(e.target.value) })}>
              {DAILY_MINUTES.map((m) => (
                <option key={m} value={m}>
                  {formatMinutes(m)}
                </option>
              ))}
            </Select>
          </label>
          <label className="ui-field">
            <span>Le week-end</span>
            <Select value={settings.weekendMinutes} onChange={(e) => set({ weekendMinutes: Number(e.target.value) })}>
              {DAILY_MINUTES.map((m) => (
                <option key={m} value={m}>
                  {formatMinutes(m)}
                </option>
              ))}
            </Select>
          </label>
          <label className="ui-field">
            <span>Une séance</span>
            <Select value={settings.sessionMinutes} onChange={(e) => set({ sessionMinutes: Number(e.target.value) })}>
              {SESSION_MINUTES.map((m) => (
                <option key={m} value={m}>
                  {formatMinutes(m)}
                </option>
              ))}
            </Select>
          </label>
        </div>
        {tooShort && (
          <p className="cal-form-error">Aucune journée n’est assez longue pour une séance : le plan resterait vide.</p>
        )}
        <div className="cal-form-row">
          <label className="ui-field">
            <span>Jour de repos</span>
            <Select value={settings.restDay === null ? '' : settings.restDay} onChange={(e) => set({ restDay: e.target.value === '' ? null : Number(e.target.value) })}>
              <option value="">Aucun</option>
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <option key={d} value={d}>
                  {WEEKDAY_NAMES[d]}
                </option>
              ))}
            </Select>
          </label>
          <label className="ui-field">
            <span>Pendant les congés</span>
            <Select value={settings.breakMode} onChange={(e) => set({ breakMode: e.target.value as PlanSettings['breakMode'] })}>
              <option value="rest">{BREAK_MODE_LABEL.rest} : aucune séance</option>
              <option value="normal">{BREAK_MODE_LABEL.normal}</option>
              <option value="boost">{BREAK_MODE_LABEL.boost} : chaque jour comme un week-end</option>
            </Select>
          </label>
        </div>

        <div className="cal-form-section">
          <h3>Calendrier scolaire</h3>
          <Toggle
            checked={showSchool}
            onChange={setShowSchool}
            label="Afficher les congés et vacances scolaires"
            description={SCHOOL_CALENDAR.label}
          />
          <label className="ui-field">
            <span>Examen national préparé</span>
            <Select value={nationalExam} disabled={!showSchool} onChange={(e) => setNationalExam(e.target.value as NationalExamCode | '')}>
              <option value="">Aucun</option>
              {NATIONAL_EXAMS.map((x) => (
                <option key={x.code} value={x.code}>
                  {x.label}
                </option>
              ))}
            </Select>
            <small>Ses dates et la clôture des inscriptions s’ajoutent au calendrier. Ajoutez ensuite chaque matière comme un examen pour obtenir un plan.</small>
          </label>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ Page */

export function CalendarPage({
  state,
  events,
  plan,
  today,
  initialTarget,
  moduleOptions,
  onChange,
  onOpenModule,
  setToast,
  timetable
}: {
  state: CalendarUserState;
  events: CalendarEvent[];
  plan: RevisionPlan;
  today: Day;
  /** Jour à ouvrir (AAAA-MM-JJ), « plan », « timetable » ou « new » (nouvelle date), venu de l'adresse. */
  initialTarget?: string;
  moduleOptions: { id: string; title: string }[];
  onChange: (next: CalendarUserState) => void;
  onOpenModule: (moduleId: string) => void;
  setToast: (message: string) => void;
  /** Emploi du temps de l'élève ou de l'enseignant ; absent s'il n'a pas de classe. */
  timetable?: React.ReactNode;
}) {
  const startDay = initialTarget && isValidDay(initialTarget) ? initialTarget : today;
  const [tab, setTab] = useState<TabId>(
    initialTarget === 'plan' ? 'plan' : initialTarget === 'timetable' && timetable ? 'timetable' : 'agenda'
  );
  const [selected, setSelected] = useState<Day>(startDay);
  const [cursor, setCursor] = useState({ year: Number(startDay.slice(0, 4)), month: Number(startDay.slice(5, 7)) - 1 });
  // « new » dans l'adresse : le formulaire d'une nouvelle date s'ouvre.
  const [editing, setEditing] = useState<{ event: CalendarEvent | null } | null>(initialTarget === 'new' ? { event: null } : null);
  const [rhythmOpen, setRhythmOpen] = useState(false);
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [examId, setExamId] = useState<string | null>(null);
  const [allDates, setAllDates] = useState(false);
  const [allSessions, setAllSessions] = useState(false);

  const planOf = (id: string) => plan.exams.find((e) => e.examId === id);
  const subjectOf = (id: string) => planOf(id)?.subject || events.find((e) => e.id === id)?.title || 'Révision';

  const goToDay = (day: Day) => {
    setSelected(day);
    setCursor({ year: Number(day.slice(0, 4)), month: Number(day.slice(5, 7)) - 1 });
  };
  const shiftMonth = (delta: number) =>
    setCursor((c) => {
      const index = c.year * 12 + c.month + delta;
      return { year: Math.floor(index / 12), month: ((index % 12) + 12) % 12 };
    });

  const markDone = (session: PlannedSession) => {
    onChange(logSession(state, session, today));
    setSessionKey(null);
    setToast(`Séance « ${session.subject} » notée comme faite`);
  };

  const saveEvent = (draft: Draft) => {
    const end = draft.end && draft.end > draft.start ? draft.end : undefined;
    if (draft.source === 'school' && draft.id) {
      onChange(editSchoolEvent(state, draft.id, draft.start, end));
      setToast('Date du calendrier scolaire corrigée');
    } else {
      const title = draft.title.trim();
      const next: CalendarEvent = {
        id: draft.id || `date-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        kind: draft.kind,
        title,
        start: draft.start,
        end,
        source: 'user',
        note: draft.note.trim() || undefined,
        createdOn: draft.createdOn || today,
        exam:
          draft.kind === 'exam'
            ? {
                subject: draft.subject.trim() || title,
                difficulty: Number(draft.difficulty) as ExamSettings['difficulty'],
                level: Number(draft.level) as ExamSettings['level'],
                goal: draft.goal,
                moduleIds: draft.moduleId ? [draft.moduleId] : undefined
              }
            : undefined
      };
      onChange(upsertUserEvent(state, next));
      setToast(draft.id ? 'Date mise à jour' : 'Date ajoutée au calendrier');
    }
    setEditing(null);
    goToDay(draft.start);
  };

  const remove = (event: CalendarEvent) => {
    onChange(removeEvent(state, event));
    setExamId(null);
    setToast(event.source === 'school' ? 'Date retirée de votre calendrier' : 'Date supprimée');
  };

  const eventMenu = (event: CalendarEvent) => (
    <ActionMenu
      label={`Plus d’actions pour ${event.title}`}
      items={[
        { label: 'Modifier', onSelect: () => setEditing({ event }), hidden: !event.exam },
        { label: event.source === 'school' ? 'Retirer du calendrier' : 'Supprimer', danger: true, onSelect: () => remove(event) }
      ]}
    />
  );

  const eventRow = (event: CalendarEvent) => {
    const examPlan = planOf(event.id);
    const flagged = examPlan && (examPlan.status === 'late' || examPlan.status === 'overload');
    return (
      <ListRow
        key={event.id}
        leading={<DateTile day={event.start} tone={event.kind === 'exam' ? 'warm' : 'neutral'} />}
        title={
          <RowTitle state={flagged ? 'alert' : 'ok'} hint={flagged && examPlan ? examStatusLabel(examPlan) : undefined}>
            {event.title}
          </RowTitle>
        }
        meta={eventMeta(event, today, examPlan)}
        ariaLabel={`${event.title}, ${eventMeta(event, today, examPlan)}`}
        onClick={() => (event.exam ? setExamId(event.id) : setEditing({ event }))}
        trailing={
          <>
            {event.certainty === 'to-confirm' && <StatusDot tone="warn">À confirmer</StatusDot>}
            {event.certainty === 'edited' && <StatusDot tone="info">Corrigée par vous</StatusDot>}
            {eventMenu(event)}
          </>
        }
      />
    );
  };

  const sessionRow = (session: PlannedSession, withDate: boolean) => (
    <ListRow
      key={session.key}
      leading={withDate ? <DateTile day={session.day} tone="brand" /> : <IconTile tone={session.catchUp ? 'danger' : 'brand'}>{sessionIcon(session.kind)}</IconTile>}
      title={
        <RowTitle state={session.catchUp ? 'alert' : 'ok'} hint={session.catchUp ? 'Séance de rattrapage' : undefined}>
          {session.subject} · {sessionTaskLabel(session)}
        </RowTitle>
      }
      meta={`${formatMinutes(session.minutes)} · séance ${session.ordinal} sur ${session.total}`}
      ariaLabel={`${session.subject}, ${sessionTaskLabel(session)}, ${formatDayLong(session.day)} : pourquoi cette séance ?`}
      onClick={() => setSessionKey(session.key)}
      trailing={
        <button
          type="button"
          className="li-icon-btn"
          title="Marquer comme faite"
          aria-label={`Marquer la séance « ${session.subject} » comme faite`}
          onClick={() => markDone(session)}
        >
          <Check size={20} aria-hidden="true" />
        </button>
      }
    />
  );

  /* -- Journée choisie */
  const dayEvents = events.filter((e) => eventCovers(e, selected));
  const daySessions = plan.sessions.filter((s) => s.day === selected);
  const dayDone = state.log.map((entry, index) => ({ entry, index })).filter(({ entry }) => entry.day === selected);
  const dayIsEmpty = dayEvents.length + daySessions.length + dayDone.length === 0;

  /* -- Dates à venir */
  const upcoming = events.filter((e) => eventEnd(e) >= today);
  const shownDates = allDates ? upcoming : upcoming.slice(0, 5);

  /* -- Plan */
  const activeExams = plan.exams.filter((e) => e.status !== 'past');
  const remaining = plan.sessions.length;
  const lastWeek = state.log.filter((entry) => diffDays(entry.day, today) >= 0 && diffDays(entry.day, today) < 7).length;
  const nextUp = activeExams[0];
  const shownSessions = allSessions ? plan.sessions : plan.sessions.slice(0, 7);

  const openSession = sessionKey ? plan.sessions.find((s) => s.key === sessionKey) : undefined;
  const openExamEvent = examId ? events.find((e) => e.id === examId) : undefined;
  const openExamPlan = examId ? planOf(examId) : undefined;

  return (
    <div className="dashboard-grid cal-page">
      <div className="dashboard-main">
        <PageHeader title="Calendrier" />

        <Tabs<TabId>
          label="Vues du calendrier"
          value={tab}
          onChange={setTab}
          trailing={
            <button type="button" className="primary ui-btn-sm" onClick={() => setEditing({ event: null })}>
              Ajouter une date
            </button>
          }
          items={[
            { id: 'agenda', label: 'Agenda' },
            { id: 'plan', label: 'Plan de révision', count: remaining > 0 ? remaining : undefined },
            ...(timetable ? [{ id: 'timetable' as const, label: 'Emploi du temps' }] : [])
          ]}
        />

        {tab === 'agenda' && (
          <>
            <section className="cal-month" aria-label="Mois affiché">
              <div className="cal-month-head">
                <h2>{formatMonthTitle(cursor.year, cursor.month)}</h2>
                <div className="cal-month-nav">
                  {(selected !== today || `${cursor.year}-${cursor.month}` !== `${Number(today.slice(0, 4))}-${Number(today.slice(5, 7)) - 1}`) && (
                    <button type="button" className="li-text-link" onClick={() => goToDay(today)}>
                      Aujourd’hui
                    </button>
                  )}
                  <button type="button" className="li-icon-btn" title="Mois précédent" aria-label="Mois précédent" onClick={() => shiftMonth(-1)}>
                    <ChevronLeft size={20} aria-hidden="true" />
                  </button>
                  <button type="button" className="li-icon-btn" title="Mois suivant" aria-label="Mois suivant" onClick={() => shiftMonth(1)}>
                    <ChevronRight size={20} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <MonthGrid
                year={cursor.year}
                month={cursor.month}
                today={today}
                selected={selected}
                events={events}
                sessions={plan.sessions}
                log={state.log}
                onSelect={goToDay}
              />
              <MonthLegend />
            </section>

            <div className="ui-section-title">
              <h2>{selected === today ? `Aujourd’hui · ${formatDayLong(selected).toLocaleLowerCase('fr')}` : formatDayLong(selected)}</h2>
            </div>
            <ListCard label={`Programme du ${formatDayLong(selected).toLocaleLowerCase('fr')}`}>
              {dayIsEmpty && (
                <EmptyState
                  title="Rien de prévu ce jour-là"
                  text="Ajoutez un examen, un congé ou un rappel : le plan de révision en tiendra compte."
                />
              )}
              {dayDone.map(({ entry, index }) => (
                <ListRow
                  key={`done-${index}`}
                  leading={<StateTile state="ok">{sessionIcon(entry.kind)}</StateTile>}
                  title={`${subjectOf(entry.examId)} · ${SESSION_KIND_LABEL[entry.kind]}`}
                  meta={`${formatMinutes(entry.minutes)} · séance faite`}
                  trailing={
                    <ActionMenu
                      label="Plus d’actions pour cette séance"
                      items={[
                        {
                          label: 'Annuler : la séance n’a pas été faite',
                          onSelect: () => {
                            onChange(unlogSession(state, entry.examId, entry.day));
                            setToast('Séance remise dans le plan');
                          }
                        }
                      ]}
                    />
                  }
                />
              ))}
              {daySessions.map((s) => sessionRow(s, false))}
              {dayEvents.map(eventRow)}
            </ListCard>

            <div className="ui-section-title">
              <h2>Dates à venir</h2>
              {upcoming.length > 5 && (
                <button type="button" className="li-text-link" onClick={() => setAllDates((v) => !v)}>
                  {allDates ? 'Réduire' : `Tout afficher (${upcoming.length})`}
                </button>
              )}
            </div>
            <ListCard label="Dates à venir">
              {upcoming.length === 0 ? (
                <EmptyState title="Aucune date à venir" text="Les examens et congés que vous ajoutez apparaissent ici." />
              ) : (
                shownDates.map(eventRow)
              )}
            </ListCard>
            {state.showSchool && <p className="cal-source">{SCHOOL_CALENDAR.label}. {SCHOOL_CALENDAR.source}</p>}
          </>
        )}

        {tab === 'timetable' && timetable && (
          <>
            {timetable}
            <p className="cal-source">
              Le plan de révision tient compte de cet emploi du temps : les jours de six heures de cours ou plus, il prévoit moitié moins de séances.
            </p>
          </>
        )}

        {tab === 'plan' &&
          (activeExams.length === 0 ? (
            <ListCard>
              <EmptyState
                title="Aucun examen à préparer"
                text="Ajoutez un examen avec sa difficulté, votre niveau et votre objectif : le plan répartit les séances jusqu’à la veille et se réajuste quand vous en manquez une."
                action={{ label: 'Ajouter un examen', onClick: () => setEditing({ event: null }) }}
              />
            </ListCard>
          ) : (
            <>
              <div className="ui-kpis tabular-nums">
                <div className="ui-kpi">
                  <b>{remaining}</b>
                  <span>{remaining > 1 ? 'Séances à venir' : 'Séance à venir'}</span>
                </div>
                <div className="ui-kpi">
                  <b>{lastWeek}</b>
                  <span>{lastWeek > 1 ? 'Faites ces 7 derniers jours' : 'Faite ces 7 derniers jours'}</span>
                </div>
                <div className="ui-kpi">
                  <b>{nextUp ? capitalizeFirst(countdownLabel(nextUp.daysLeft)) : '—'}</b>
                  <span>Prochain examen</span>
                </div>
              </div>

              <div className="ui-section-title">
                <h2>Examens</h2>
              </div>
              <ListCard label="Examens du plan">
                {activeExams.map((examPlan) => {
                  const event = events.find((e) => e.id === examPlan.examId);
                  return event ? eventRow(event) : null;
                })}
              </ListCard>

              <div className="ui-section-title">
                <h2>Séances</h2>
                {plan.sessions.length > 7 && (
                  <button type="button" className="li-text-link" onClick={() => setAllSessions((v) => !v)}>
                    {allSessions ? 'Réduire' : `Tout afficher (${plan.sessions.length})`}
                  </button>
                )}
              </div>
              <ListCard label="Séances de révision à venir">
                {plan.sessions.length === 0 ? (
                  <EmptyState title="Aucune séance à placer" text="Toutes les séances sont faites, ou les examens sont trop proches pour en ajouter." />
                ) : (
                  shownSessions.map((s) => sessionRow(s, true))
                )}
              </ListCard>
              <p className="cal-source">
                Le plan est calculé sur votre appareil, à partir de ce que vous avez saisi. Ouvrez une séance pour savoir pourquoi elle est là.
              </p>
            </>
          ))}
      </div>

      <aside className="right-rail" aria-label="Réglages du calendrier">
        <section className="rail-card">
          <h2 className="discover-feed-title">Mes réglages</h2>
          <div className="rail-stat-list is-settings">
            <div className="rail-stat-row">
              <span>En semaine</span>
              <b>{formatMinutes(state.settings.weekdayMinutes)}</b>
            </div>
            <div className="rail-stat-row">
              <span>Le week-end</span>
              <b>{formatMinutes(state.settings.weekendMinutes)}</b>
            </div>
            <div className="rail-stat-row">
              <span>Une séance</span>
              <b>{formatMinutes(state.settings.sessionMinutes)}</b>
            </div>
            <div className="rail-stat-row">
              <span>Jour de repos</span>
              <b>{state.settings.restDay === null ? 'Aucun' : WEEKDAY_NAMES[state.settings.restDay]}</b>
            </div>
            <div className="rail-stat-row">
              <span>Pendant les congés</span>
              <b>{BREAK_MODE_LABEL[state.settings.breakMode]}</b>
            </div>
            <div className="rail-stat-row">
              <span>Calendrier scolaire</span>
              <b>{state.showSchool ? 'Affiché' : 'Masqué'}</b>
            </div>
            <div className="rail-stat-row">
              <span>Examen national</span>
              <b>{NATIONAL_EXAMS.find((x) => x.code === state.nationalExam)?.label || 'Aucun'}</b>
            </div>
          </div>
          <button type="button" className="rail-card-foot" onClick={() => setRhythmOpen(true)}>
            Modifier mes réglages <ArrowRight size={16} aria-hidden="true" />
          </button>
        </section>
      </aside>

      {editing && (
        <EventModal
          event={editing.event}
          defaultDay={selected >= today ? selected : today}
          today={today}
          moduleOptions={moduleOptions}
          onSave={saveEvent}
          onClose={() => setEditing(null)}
        />
      )}

      {rhythmOpen && (
        <RhythmModal
          state={state}
          onClose={() => setRhythmOpen(false)}
          onSave={(settings, showSchool, nationalExam) => {
            onChange({ ...state, settings, showSchool, nationalExam });
            setRhythmOpen(false);
            setToast('Réglages enregistrés : le plan est recalculé');
          }}
        />
      )}

      {openSession && (
        <Modal
          open
          size="sm"
          title="Pourquoi cette séance ?"
          onClose={() => setSessionKey(null)}
          footer={
            <>
              {openSession.moduleId && (
                <button type="button" className="li-text-link" onClick={() => onOpenModule(openSession.moduleId!)}>
                  Ouvrir le module
                </button>
              )}
              <button type="button" className="primary ui-btn-sm" onClick={() => markDone(openSession)}>
                Marquer comme faite
              </button>
            </>
          }
        >
          <div className="cal-detail-head">
            <IconTile tone="brand">{sessionIcon(openSession.kind)}</IconTile>
            <div>
              <b>
                {openSession.subject} · {sessionTaskLabel(openSession)}
              </b>
              <span>
                {formatDayLong(openSession.day)} · {formatMinutes(openSession.minutes)}
              </span>
            </div>
          </div>
          <ul className="cal-reasons">
            {openSession.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </Modal>
      )}

      {openExamEvent && openExamEvent.exam && openExamPlan && (
        <Modal
          open
          size="sm"
          title={openExamEvent.title}
          onClose={() => setExamId(null)}
          footer={
            <>
              <button type="button" className="li-text-link" onClick={() => remove(openExamEvent)}>
                Supprimer
              </button>
              <button
                type="button"
                className="primary ui-btn-sm"
                onClick={() => {
                  setExamId(null);
                  setEditing({ event: openExamEvent });
                }}
              >
                Modifier
              </button>
            </>
          }
        >
          <dl className="ui-facts">
            <div>
              <dt>Date</dt>
              <dd>
                {formatDayLong(openExamEvent.start)} · {countdownLabel(openExamPlan.daysLeft)}
              </dd>
            </div>
            <div>
              <dt>Avancement</dt>
              <dd className="cal-progress">
                <span className="tabular-nums">
                  {plural(openExamPlan.done, 'séance faite', 'séances faites')} sur {openExamPlan.total}
                </span>
                <ProgressBar value={Math.round((openExamPlan.done / Math.max(1, openExamPlan.total)) * 100)} label="Avancement du plan" tone="htb" />
              </dd>
            </div>
            <div>
              <dt>État</dt>
              <dd>
                <StatusDot tone={examStatusTone(openExamPlan.status)}>{examStatusLabel(openExamPlan)}</StatusDot>
              </dd>
            </div>
          </dl>
          {openExamPlan.status === 'overload' && (
            <p className="cal-form-error">
              Pour que tout tienne, augmentez votre temps de révision dans « Mes réglages » ou revoyez l’objectif de cet examen.
            </p>
          )}
          <div className="cal-form-section">
            <h3>Le calcul</h3>
            <ul className="cal-reasons">
              {explainLoad(openExamEvent.exam, openExamPlan.load).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </Modal>
      )}
    </div>
  );
}

const capitalizeFirst = (text: string) => text.charAt(0).toLocaleUpperCase('fr') + text.slice(1);
