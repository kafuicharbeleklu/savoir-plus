/**
 * Écran de pause d'un enfant de moins de 12 ans dont le parent a verrouillé SAVOIR+ (pause, plage
 * horaire, temps du jour). L'enfant voit pourquoi, quand SAVOIR+ rouvre et quelles sont ses règles ;
 * quand le temps du jour est écoulé, il peut en demander à son parent. Ni compte à rebours ni
 * avertissement : voir les fondements dans src/deviceLock.ts.
 */
import React from 'react';
import { Hourglass, LogOut, Moon, Pause } from 'lucide-react';
import type { Profile } from '../../data';
import { ArtScene } from '../../components/LessonArt';
import { formatMinutes, rulesSummary, type LockState } from '../../deviceLock';
import type { DeviceRules, TimeRequest } from '../../school';

export function DeviceLockScreen({
  user,
  lock,
  rules,
  request,
  onRequest,
  onExit,
  onSwitchAccount
}: {
  user: Profile;
  lock: LockState;
  rules: DeviceRules;
  /** Dernière demande de temps du jour. */
  request?: TimeRequest;
  onRequest: () => void;
  onExit: () => void;
  onSwitchAccount: () => void;
}) {
  const firstName = user.name.split(' ')[0];
  const content =
    lock.reason === 'manual'
      ? {
          icon: <Pause size={26} strokeWidth={1.85} />,
          title: 'SAVOIR+ est en pause',
          text: 'Ton parent a mis SAVOIR+ en pause. Si tu en as besoin, parlez-en ensemble.'
        }
      : lock.reason === 'hours'
        ? {
            icon: <Moon size={26} strokeWidth={1.85} />,
            title: 'Ce n’est pas l’heure de SAVOIR+',
            text: `SAVOIR+ rouvre ${lock.reopens}.`
          }
        : {
            icon: <Hourglass size={26} strokeWidth={1.85} />,
            title: 'Ta séance du jour est terminée',
            text: `Tu as utilisé tes ${formatMinutes(lock.limit)} d’aujourd’hui. SAVOIR+ rouvre ${lock.reopens}.`
          };

  return (
    <div className="appeal-portal-shell">
      <header className="visitor-topbar">
        <div className="brand">
          SAVOIR<span className="brand-plus">+</span>
        </div>
        <button className="secondary" onClick={onExit}>
          <LogOut size={15} /> Quitter la session
        </button>
      </header>

      <div className="shell-scroll-viewport">
        <main className="sc-gate">
          <section className="sc-gate-card sc-lock-card" aria-live="polite">
            <div className="sc-lock-art">
              <ArtScene icon={content.icon} frame="sheet" seed={`lock-${lock.reason}`} />
            </div>
            <h1>{content.title}</h1>
            <p>{content.text}</p>
            <p className="sc-lock-rules">
              <b>Tes règles, {firstName} :</b> {rulesSummary(rules)}.
            </p>
            {lock.reason === 'limit' &&
              (request?.status === 'pending' ? (
                <p className="sc-lock-answer">Demande envoyée à {request.at}. Ton parent va te répondre.</p>
              ) : (
                <>
                  {request?.status === 'declined' && <p className="sc-lock-answer">Ton parent a répondu non pour aujourd’hui.</p>}
                  {request?.status !== 'declined' && (
                    <button type="button" className="primary" onClick={onRequest}>
                      Demander plus de temps
                    </button>
                  )}
                </>
              ))}
          </section>

          <p className="sc-demo-note">
            Démonstration : le verrouillage se règle dans l’espace famille du parent.{' '}
            <button type="button" className="li-text-link" onClick={onSwitchAccount}>
              Changer de compte
            </button>
          </p>
        </main>
      </div>
    </div>
  );
}
