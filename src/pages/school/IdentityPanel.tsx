/**
 * Vérification d'identité, côté membre. SIMULÉE : le membre choisit un type de pièce et un fichier
 * sur son appareil, mais le fichier n'est ni lu, ni envoyé, ni conservé — seul son nom s'affiche.
 * L'appareil photo n'est jamais ouvert. La demande part à la Gouvernance, qui l'accepte ou la refuse.
 */
import React, { useRef, useState } from 'react';
import { formatDayShort, type Day } from '../../calendar';
import {
  IDENTITY_DOCUMENT_LABEL,
  accountOf,
  submitIdentity,
  type IdentityDocument,
  type SchoolState
} from '../../school';
import { Select } from '../../components/ui';
import { IdentityDot } from './shared';

const DOCUMENTS = Object.keys(IDENTITY_DOCUMENT_LABEL) as IdentityDocument[];

const PURPOSE: Record<string, string> = {
  guardian: 'Elle est demandée avant de rattacher un enfant à votre compte et avant un premier achat pour lui. Elle établit aussi que vous êtes majeur.',
  educator: 'Elle est demandée pour devenir enseignant d’un établissement et pour suivre des apprenants mineurs.',
  institution: 'Elle établit que l’établissement est bien celui qu’il déclare être.',
  learner: 'Elle est facultative pour apprendre. Elle ajoute le badge de vérification à côté de votre nom.'
};

export function IdentityPanel({
  school,
  saveSchool,
  userId,
  today,
  setToast
}: {
  school: SchoolState;
  saveSchool: (next: SchoolState) => void;
  userId: string;
  today: Day;
  setToast: (message: string) => void;
}) {
  const account = accountOf(school, userId);
  const request = school.identityRequests.find((r) => r.userId === userId);
  const [document, setDocument] = useState<IdentityDocument>('cni');
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const canAsk = account.identity === 'none' || account.identity === 'refused';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName) return;
    saveSchool(submitIdentity(school, userId, document, today));
    setFileName('');
    setToast('Demande transmise à la Gouvernance (simulation)');
  };

  return (
    <div className="sc-identity">
      <IdentityDot status={account.identity} />
      <p className="st-text">{PURPOSE[account.kind] || PURPOSE.learner}</p>

      {account.identity === 'pending' && request && (
        <p className="st-text">
          Demande {request.id} déposée le {formatDayShort(request.submittedOn)} ({IDENTITY_DOCUMENT_LABEL[request.document].toLowerCase()}). La Gouvernance
          l’examine.
        </p>
      )}
      {account.identity === 'refused' && request?.note && <p className="sc-error">Motif du refus : {request.note}</p>}

      {canAsk && (
        <form className="cal-form" onSubmit={submit}>
          <label className="ui-field">
            <span>Pièce présentée</span>
            <Select value={document} onChange={(e) => setDocument(e.target.value as IdentityDocument)}>
              {DOCUMENTS.map((d) => (
                <option key={d} value={d}>
                  {IDENTITY_DOCUMENT_LABEL[d]}
                </option>
              ))}
            </Select>
          </label>
          <div className="ui-field">
            <span>Fichier de la pièce</span>
            <div className="sc-file">
              {/* Aucun attribut « capture » : le navigateur propose un fichier, jamais l'appareil photo. */}
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,application/pdf"
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
              />
              <button type="button" className="secondary ui-btn-sm" onClick={() => fileRef.current?.click()}>
                Choisir un fichier
              </button>
              <span className="sc-file-name">{fileName || 'Aucun fichier choisi'}</span>
            </div>
            <small>Image ou PDF. Démonstration : le fichier reste sur votre appareil, rien n’est envoyé ni conservé.</small>
          </div>
          <button type="submit" className="primary ui-btn-sm sc-submit" disabled={!fileName}>
            Envoyer la demande
          </button>
        </form>
      )}

      {account.identity === 'pending' && (
        <p className="st-note">Démonstration : ouvrez le compte de la Gouvernance, rubrique « Identités », pour accepter ou refuser cette demande.</p>
      )}
    </div>
  );
}
