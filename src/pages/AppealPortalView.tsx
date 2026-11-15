import React, { useState } from 'react';
import { CheckCircle2, Lock, LogOut, Scale, ShieldAlert } from 'lucide-react';
import type { Profile } from '../data';
import type { RoleCapabilities } from '../personas';
import { appendAuditLog, type ExtendedDemoState } from '../wireframeData';

export function AppealPortalView({
  user,
  caps,
  ext,
  updateExt,
  onExitToVisitor,
  setToast
}: {
  user: Profile;
  caps: RoleCapabilities;
  ext: ExtendedDemoState;
  updateExt: (fn: (prev: ExtendedDemoState) => ExtendedDemoState) => void;
  onExitToVisitor: () => void;
  setToast: (msg: string) => void;
}) {
  const [explanation, setExplanation] = useState(ext.appeal.explanation || '');

  const submitAppeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!explanation.trim()) return;
    updateExt((prev) => ({
      ...prev,
      appeal: {
        submitted: true,
        explanation: explanation.trim(),
        status: 'Reçu'
      },
      auditLogs: appendAuditLog(prev.auditLogs, {
        actor: user.name,
        action: 'Recours déposé sur DEC-2026-001',
        target: 'DEC-2026-001',
        scope: 'Recours',
        result: 'Succès',
        justification: 'Recours transmis à un réviseur distinct du décideur initial.'
      })
    }));
    setToast('Votre recours a été transmis pour réexamen indépendant.');
  };

  return (
    <div className="appeal-portal-shell">
      <header className="visitor-topbar">
        <div className="brand">
          SAVOIR<span className="brand-plus">+</span>
        </div>
        <button className="secondary" onClick={onExitToVisitor}>
          <LogOut size={15} /> Quitter la session
        </button>
      </header>

      <div className="shell-scroll-viewport">
        <main className="appeal-portal-main">
        <div className="appeal-banner">
          <ShieldAlert size={22} />
          <div>
            <span className="eyebrow">SESSION LIMITÉE · CONFORMITÉ RECOURS</span>
            <h1>Accès ordinaire temporairement suspendu</h1>
            <p>
              Compte concerné : <b>{user.name}</b> ({caps.accountStatus}). Conformément à la gouvernance SAVOIR+, vous
              conservez l’accès à la lecture de la décision et au dépôt de votre recours sans réouvrir les espaces
              communautaires ou de messagerie.
            </p>
          </div>
        </div>

        <section className="appeal-card">
          <h2>Décision enregistrée</h2>
          <div className="appeal-meta">
            <div>
              <span>Mesure</span>
              <b>Suspension temporaire des interactions</b>
            </div>
            <div>
              <span>Durée prévue</span>
              <b>7 jours</b>
            </div>
            <div>
              <span>État du recours</span>
              <b>
                <span
                  className={`status-tag ${
                    ext.appeal.status === 'Accepté'
                      ? 'ok'
                      : ext.appeal.status === 'Rejeté'
                        ? 'warn'
                        : ''
                  }`}
                >
                  {ext.appeal.status}
                </span>
              </b>
            </div>
          </div>
          {ext.appeal.decisionNote && (
            <div className="wf-evidence-box wf-mt-sm">
              <b>Décision motivée du réviseur :</b>
              <p className="tiny muted wf-mt-sm">{ext.appeal.decisionNote}</p>
            </div>
          )}
          <p className="tiny muted wf-mt-sm">
            Votre recours est examiné par une personne habilitée distincte du décideur initial et de son approbateur.
          </p>
        </section>

        <section className="appeal-card">
          <h2>
            <Scale size={18} /> Déposer ou suivre mon recours
          </h2>
          {ext.appeal.submitted ? (
            <div className="tip">
              <CheckCircle2 size={18} />
              <div>
                <b>Recours enregistré · Statut : {ext.appeal.status}</b>
                <p>Observations transmises : « {ext.appeal.explanation} »</p>
                {ext.appeal.decisionNote && (
                  <p className="tiny muted wf-mt-sm">Réponse du réviseur : {ext.appeal.decisionNote}</p>
                )}
              </div>
            </div>
          ) : (
            <form className="visitor-form" onSubmit={submitAppeal}>
              <label>
                Vos observations et éléments de contexte
                <textarea
                  required
                  rows={4}
                  placeholder="Expliquez pourquoi vous contestez la mesure ou apportez des précisions…"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                />
              </label>
              <button type="submit" className="primary" disabled={!explanation.trim()}>
                <Lock size={14} /> Envoyer mon recours
              </button>
            </form>
          )}
        </section>
      </main>
      </div>
    </div>
  );
}
