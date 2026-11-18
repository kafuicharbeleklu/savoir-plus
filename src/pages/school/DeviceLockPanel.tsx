/**
 * Réglages du verrouillage d'un enfant de moins de 12 ans, dans l'espace famille : pause immédiate,
 * temps par jour, plage horaire, ce qui reste ouvert, et réponse aux demandes de temps. Le parent ne
 * voit que des minutes, jamais ce que l'enfant lit ou écrit (voir src/deviceLock.ts).
 */
import React, { useState } from 'react';
import { Clock, Hourglass, LayoutGrid, Lock, LockOpen } from 'lucide-react';
import { dayFromDate } from '../../calendar';
import {
  answerRequest,
  formatHour,
  formatMinutes,
  formatWindow,
  lockState,
  requestOfDay,
  rulesOf,
  setRules
} from '../../deviceLock';
import type { DeviceRules, SchoolState } from '../../school';
import { IconTile, ListCard, ListRow, Modal, Select, Toggle } from '../../components/ui';

const LIMITS = [0, 15, 30, 45, 60, 90, 120, 180];
const FROM_HOURS = ['00:00', '06:00', '07:00', '08:00', '09:00', '10:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
const TO_HOURS = ['12:00', '14:00', '16:00', '17:00', '18:00', '19:00', '19:30', '20:00', '20:30', '21:00', '22:00', '24:00'];
const hourLabel = (hhmm: string) => (hhmm === '00:00' ? '0 h' : formatHour(hhmm));

type Editing = 'time' | 'hours' | 'areas' | null;

export function DeviceLockPanel({
  school,
  saveSchool,
  childId,
  firstName,
  now,
  setToast
}: {
  school: SchoolState;
  saveSchool: (next: SchoolState) => void;
  childId: string;
  firstName: string;
  now: Date;
  setToast: (message: string) => void;
}) {
  const rules = rulesOf(school, childId);
  const [editing, setEditing] = useState<Editing>(null);
  const [draft, setDraft] = useState<DeviceRules>(rules);
  const state = lockState(school, childId, now);

  const open = (what: Editing) => {
    setDraft(rules);
    setEditing(what);
  };
  const save = (next: DeviceRules, message: string) => {
    saveSchool(setRules(school, next));
    setEditing(null);
    setToast(message);
  };
  const usedLine = `${formatMinutes(state.used)} sur SAVOIR+ aujourd’hui${state.limit > 0 ? `, sur ${formatMinutes(state.limit)}` : ''}`;
  const status = rules.lockedNow
    ? { title: 'En pause', meta: `${firstName} voit un écran de pause jusqu’à ce que vous rouvriez.` }
    : state.reason === 'hours'
      ? { title: `Fermé, rouvre ${state.reopens}`, meta: usedLine }
      : state.reason === 'limit'
        ? { title: 'Temps du jour écoulé', meta: usedLine }
        : { title: 'Ouvert', meta: usedLine };
  const areas = ['Modules et bibliothèque', rules.allowFeed && 'fil d’entraide', rules.allowMessages && 'messagerie'].filter(Boolean).join(', ');

  return (
    <>
      <div className="ui-section-title">
        <h2>Verrouillage</h2>
      </div>
      <ListCard label={`Verrouillage de SAVOIR+ pour ${firstName}`}>
        <ListRow
          leading={<IconTile tone={rules.lockedNow || state.locked ? 'danger' : 'brand'}>{rules.lockedNow || state.locked ? <Lock size={20} aria-hidden="true" /> : <LockOpen size={20} aria-hidden="true" />}</IconTile>}
          title={status.title}
          meta={status.meta}
          trailing={
            <button
              type="button"
              className={rules.lockedNow ? 'secondary ui-btn-sm' : 'primary ui-btn-sm'}
              onClick={() =>
                save(
                  { ...rules, lockedNow: !rules.lockedNow },
                  rules.lockedNow ? `SAVOIR+ est rouvert pour ${firstName}` : `SAVOIR+ est en pause pour ${firstName}`
                )
              }
            >
              {rules.lockedNow ? 'Rouvrir' : 'Mettre en pause'}
            </button>
          }
        />
        <ListRow
          leading={<IconTile>{<Hourglass size={20} aria-hidden="true" />}</IconTile>}
          title="Temps par jour"
          meta={`En semaine : ${rules.weekdayMinutes ? formatMinutes(rules.weekdayMinutes) : 'sans limite'} · Le week-end : ${rules.weekendMinutes ? formatMinutes(rules.weekendMinutes) : 'sans limite'}`}
          onClick={() => open('time')}
        />
        <ListRow
          leading={<IconTile>{<Clock size={20} aria-hidden="true" />}</IconTile>}
          title="Plage horaire"
          meta={`En semaine : ${formatWindow(rules.weekdayFrom, rules.weekdayTo)} · Le week-end : ${formatWindow(rules.weekendFrom, rules.weekendTo)}`}
          onClick={() => open('hours')}
        />
        <ListRow
          leading={<IconTile>{<LayoutGrid size={20} aria-hidden="true" />}</IconTile>}
          title="Ce qui reste ouvert"
          meta={areas}
          onClick={() => open('areas')}
        />
      </ListCard>
      <p className="sc-note">
        S’applique à SAVOIR+ sur les appareils où son compte est ouvert, pas au reste du téléphone ou de la tablette : pour cela, utilisez aussi
        leur contrôle parental. {firstName} voit ses règles ; vous ne voyez que son temps, jamais ses lectures ni ses messages.
      </p>

      {editing === 'time' && (
        <Modal
          open
          size="sm"
          title="Temps par jour"
          onClose={() => setEditing(null)}
          footer={
            <button type="button" className="primary ui-btn-sm" onClick={() => save({ ...draft }, `Temps par jour enregistré pour ${firstName}`)}>
              Enregistrer
            </button>
          }
        >
          <div className="cal-form">
            {(
              [
                ['weekdayMinutes', 'En semaine'],
                ['weekendMinutes', 'Le week-end']
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="ui-field">
                <span>{label}</span>
                <Select value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: Number(e.target.value) })}>
                  {LIMITS.map((n) => (
                    <option key={n} value={n}>
                      {n ? formatMinutes(n) : 'Sans limite'}
                    </option>
                  ))}
                </Select>
              </label>
            ))}
            <p className="sc-note">Quand le temps est écoulé pendant une partie de module, {firstName} la termine avant la pause.</p>
          </div>
        </Modal>
      )}

      {editing === 'hours' && (
        <Modal
          open
          size="sm"
          title="Plage horaire"
          onClose={() => setEditing(null)}
          footer={
            <button
              type="button"
              className="primary ui-btn-sm"
              disabled={draft.weekdayFrom >= draft.weekdayTo || draft.weekendFrom >= draft.weekendTo}
              onClick={() => save({ ...draft }, `Plage horaire enregistrée pour ${firstName}`)}
            >
              Enregistrer
            </button>
          }
        >
          <div className="cal-form">
            {(
              [
                ['weekdayFrom', 'weekdayTo', 'En semaine'],
                ['weekendFrom', 'weekendTo', 'Le week-end']
              ] as const
            ).map(([fromKey, toKey, label]) => (
              <fieldset key={label} className="sc-lock-window">
                <legend>{label}</legend>
                <label className="ui-field">
                  <span>De</span>
                  <Select value={draft[fromKey]} onChange={(e) => setDraft({ ...draft, [fromKey]: e.target.value })}>
                    {FROM_HOURS.map((h) => (
                      <option key={h} value={h}>
                        {hourLabel(h)}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="ui-field">
                  <span>À</span>
                  <Select value={draft[toKey]} onChange={(e) => setDraft({ ...draft, [toKey]: e.target.value })}>
                    {TO_HOURS.map((h) => (
                      <option key={h} value={h}>
                        {hourLabel(h)}
                      </option>
                    ))}
                  </Select>
                </label>
              </fieldset>
            ))}
            <p className="sc-note">De 0 h à minuit : toute la journée. Hors de la plage, {firstName} voit l’heure à laquelle SAVOIR+ rouvre.</p>
          </div>
        </Modal>
      )}

      {editing === 'areas' && (
        <Modal
          open
          size="sm"
          title="Ce qui reste ouvert"
          onClose={() => setEditing(null)}
          footer={
            <button type="button" className="primary ui-btn-sm" onClick={() => save({ ...draft }, `Réglages enregistrés pour ${firstName}`)}>
              Enregistrer
            </button>
          }
        >
          <div className="cal-form">
            <p className="sc-note">Les modules et la bibliothèque restent toujours ouverts.</p>
            <Toggle
              checked={draft.allowFeed}
              onChange={(v) => setDraft({ ...draft, allowFeed: v })}
              label="Fil d’entraide"
              description="Lire les publications de la communauté."
            />
            <Toggle
              checked={draft.allowMessages}
              onChange={(v) => setDraft({ ...draft, allowMessages: v })}
              label="Messagerie"
              description="Échanger avec sa famille et son établissement."
            />
          </div>
        </Modal>
      )}
    </>
  );
}

/**
 * Demande de temps en attente : un bandeau en haut de la fiche de l'enfant, là où mène l'alerte du
 * parent. Il n'apparaît que s'il y a une réponse à donner.
 */
export function TimeRequestBanner({
  school,
  saveSchool,
  childId,
  firstName,
  now,
  setToast
}: {
  school: SchoolState;
  saveSchool: (next: SchoolState) => void;
  childId: string;
  firstName: string;
  now: Date;
  setToast: (message: string) => void;
}) {
  const request = requestOfDay(school, childId, dayFromDate(now));
  if (request?.status !== 'pending') return null;
  const answer = (minutes: number | null) => {
    saveSchool(answerRequest(school, request.id, minutes));
    setToast(minutes ? `${minutes} minutes accordées à ${firstName} pour aujourd’hui` : `Demande de ${firstName} refusée pour aujourd’hui`);
  };
  return (
    <section className="sc-status sc-request" aria-label={`Demande de temps de ${firstName}`}>
      <p>
        <b>{firstName} demande plus de temps</b> · demande de {request.at}, son temps du jour est écoulé.
      </p>
      <div className="sc-request-actions">
        <button type="button" className="primary ui-btn-sm" onClick={() => answer(15)}>
          Accorder 15 min
        </button>
        <button type="button" className="secondary ui-btn-sm" onClick={() => answer(30)}>
          Accorder 30 min
        </button>
        <button type="button" className="li-text-link" onClick={() => answer(null)}>
          Refuser
        </button>
      </div>
    </section>
  );
}
