/**
 * Écran d'attente d'un compte de moins de 12 ans : tant qu'un parent ou tuteur vérifié n'est pas
 * rattaché, l'enfant ne voit que cet écran et saisit le code que l'adulte a créé pour lui.
 */
import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import type { Day } from '../../calendar';
import type { Profile } from '../../data';
import { GUARDIAN_CODE_AGE, REDEEM_MESSAGE, redeemGuardianCode, type SchoolState } from '../../school';

export function GuardianGate({
  user,
  school,
  latestSchool,
  today,
  onActivated,
  onExit,
  onSwitchAccount
}: {
  user: Profile;
  school: SchoolState;
  /** L'état enregistré le plus récent (un autre onglet a pu utiliser le code entre-temps). */
  latestSchool?: () => SchoolState;
  today: Day;
  /** Le code est bon : l'état mis à jour porte le lien avec le parent ou tuteur. */
  onActivated: (next: SchoolState) => void;
  onExit: () => void;
  onSwitchAccount: () => void;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const firstName = user.name.split(' ')[0];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = redeemGuardianCode(latestSchool ? latestSchool() : school, code, user.id, today);
    if (result.ok === false) {
      setError(REDEEM_MESSAGE[result.reason]);
      return;
    }
    onActivated(result.school);
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
          <section className="sc-gate-card">
            <h1>Bonjour {firstName}, il te manque un code</h1>
            <p>
              Avant {GUARDIAN_CODE_AGE} ans, un compte SAVOIR+ s’ouvre avec l’accord d’un parent ou d’un tuteur. Demande-lui le code
              qu’il a créé pour toi, puis écris-le ici. Un code n’ouvre qu’un seul compte : le tien.
            </p>
            <form className="sc-gate-form" onSubmit={submit} noValidate>
              <label className="ui-field">
                <span>Code de ton parent ou tuteur</span>
                <input
                  value={code}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="PAR-XXXX-XXXX"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'sc-gate-error' : undefined}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError('');
                  }}
                />
                {error && (
                  <small id="sc-gate-error" className="sc-error" role="alert">
                    {error}
                  </small>
                )}
              </label>
              <button type="submit" className="primary" disabled={!code.trim()}>
                Ouvrir mon compte
              </button>
            </form>
          </section>

          <p className="sc-demo-note">
            Démonstration : le code de {firstName} se lit dans l’espace famille de son parent.{' '}
            <button type="button" className="li-text-link" onClick={onSwitchAccount}>
              Changer de compte
            </button>
          </p>
        </main>
      </div>
    </div>
  );
}
