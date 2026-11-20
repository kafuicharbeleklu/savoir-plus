import React, { useEffect, useRef, useState } from 'react';
import { CoachMark } from '../components/CoachMark';
import { LandingVideo } from '../components/LandingVideo';
import { markExploreTourSeen, readExploreTourSeen, shouldShowExploreTour } from '../tour';
import { ArrowLeft, ArrowRight, CheckCircle2, Compass, KeyRound, Lock, Mail } from 'lucide-react';

type AuthTab = 'login' | 'signup' | 'verify' | 'reset' | 'onboarding';

/** Champ de mot de passe : libellé relié au champ, action à droite du libellé, bouton Afficher / Masquer. */
function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  minLength,
  hint,
  action
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  minLength?: number;
  hint?: string;
  action?: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="lf-field">
      <div className="lf-label-row">
        <label htmlFor={id}>{label}</label>
        {action}
      </div>
      <div className="lf-password">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          aria-describedby={hint ? `${id}-hint` : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="lf-reveal"
          aria-pressed={visible}
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? 'Masquer' : 'Afficher'}
        </button>
      </div>
      {hint && (
        <small id={`${id}-hint`} className="muted landing-hint">
          {hint}
        </small>
      )}
    </div>
  );
}

export function VisitorAuthView({
  cloudConfigured,
  busy,
  error,
  tourReady = true,
  onSelectPersona,
  onLoginCloud,
  onCompleteOnboarding,
  setToast
}: {
  cloudConfigured: boolean;
  busy: boolean;
  error: string;
  /** Faux tant que l'écran de lancement couvre la page : la visite guidée attend. */
  tourReady?: boolean;
  onSelectPersona: (id: 'afi' | 'kossi' | 'nadege') => void;
  onLoginCloud: (email: string, password: string) => void;
  onCompleteOnboarding?: (displayName: string, interests: string) => void;
  setToast: (msg: string) => void;
}) {
  const [authTab, setAuthTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupInterests, setSignupInterests] = useState('Cybersécurité, Réseaux, Entraide');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [signupSent, setSignupSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Visite guidée : au premier chargement, une bulle montre « Explorer sans compte » au testeur.
  const exploreRef = useRef<HTMLButtonElement>(null);
  const [tourOpen, setTourOpen] = useState(false);
  useEffect(() => {
    if (!tourReady) return;
    if (!shouldShowExploreTour(window.location.search, readExploreTourSeen())) return;
    // Court délai : la page se pose avant que la bulle n'apparaisse.
    const timer = window.setTimeout(() => {
      markExploreTourSeen();
      setTourOpen(true);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [tourReady]);

  const finishOnboarding = (nameToUse: string, interestsToUse: string) => {
    if (onCompleteOnboarding) {
      onCompleteOnboarding(nameToUse, interestsToUse);
    } else {
      onSelectPersona('afi');
    }
  };

  const isPrimaryTab = authTab === 'login' || authTab === 'signup';

  return (
    <div className="visitor-shell landing">
      <header className="visitor-topbar landing-topbar">
        <div className="brand">
          SAVOIR<span className="brand-plus">+</span>
        </div>
      </header>

      <div className="shell-scroll-viewport">
        <main className="lg-grid">
          <div className={`lg-left is-${authTab}`}>
            <section className="lg-intro" aria-labelledby="landing-title">
              <h1 id="landing-title">
                Apprendre à son rythme.
                <br />
                Progresser ensemble.
              </h1>
              <p className="lg-lead">
                Des modules courts, un quiz corrigé et des membres pour vous aider quand vous bloquez.
              </p>
            </section>

          <section id="landing-auth" className="landing-auth" aria-label="Connexion et inscription">
            {!isPrimaryTab && authTab !== 'onboarding' && (
              <button type="button" className="text-link landing-back" onClick={() => setAuthTab('login')}>
                <ArrowLeft size={15} /> Retour à la connexion
              </button>
            )}

            {authTab === 'login' && (
              <form
                className="landing-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!cloudConfigured) {
                    setToast('Connexion indisponible pour le moment : utilisez « Explorer sans compte ».');
                    return;
                  }
                  onLoginCloud(email, password);
                }}
              >
                <div className="landing-form-head sr-only">
                  <h2>Se connecter</h2>
                </div>
                <div className="lf-field">
                  <label htmlFor="login-email">Adresse e-mail</label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="nom@exemple.test"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <PasswordField
                  id="login-password"
                  label="Mot de passe"
                  value={password}
                  onChange={setPassword}
                  autoComplete="current-password"
                  action={
                    <button type="button" className="text-link" onClick={() => setAuthTab('reset')}>
                      Mot de passe oublié ?
                    </button>
                  }
                />
                {error && (
                  <p className="modal-error" role="alert">
                    {error}
                  </p>
                )}
                <button type="submit" className="primary landing-submit" disabled={busy}>
                  {busy ? 'Connexion…' : 'Se connecter'}
                </button>
                <p className="lf-switch">
                  Nouveau sur SAVOIR+ ?{' '}
                  <button type="button" className="text-link" onClick={() => setAuthTab('signup')}>
                    Créer un compte
                  </button>
                </p>
              </form>
            )}

            {authTab === 'signup' && (
              <form
                className="landing-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!acceptedTerms || !signupEmail.trim()) return;
                  setSignupSent(true);
                  setEmailVerified(false);
                  setToast('Demande d’inscription enregistrée : vérifiez votre adresse e-mail.');
                  setAuthTab('verify');
                }}
              >
                <div className="landing-form-head">
                  <h2>Créer un compte</h2>
                  <p className="muted">La vérification de l’adresse e-mail est requise avant de publier ou d’échanger.</p>
                </div>
                <div className="lf-field">
                  <label htmlFor="signup-email">Adresse e-mail</label>
                  <input
                    id="signup-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="prenom.nom@exemple.test"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                  />
                </div>
                <PasswordField
                  id="signup-password"
                  label="Mot de passe"
                  value={signupPassword}
                  onChange={setSignupPassword}
                  autoComplete="new-password"
                  minLength={8}
                  hint="8 caractères au minimum ; 12 ou plus recommandés."
                />
                <label className="check-inline landing-check">
                  <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
                  <span>J’accepte les conditions d’utilisation et la politique de confidentialité.</span>
                </label>
                <button
                  type="submit"
                  className="primary landing-submit"
                  disabled={!acceptedTerms || !signupEmail.trim()}
                >
                  Créer mon compte
                </button>
                {signupSent && (
                  <div className="tip">
                    <CheckCircle2 size={16} />
                    <p>
                      Un lien de confirmation a été préparé pour <b>{signupEmail}</b>.
                    </p>
                  </div>
                )}
                <p className="lf-switch">
                  Déjà membre ?{' '}
                  <button type="button" className="text-link" onClick={() => setAuthTab('login')}>
                    Se connecter
                  </button>
                </p>
              </form>
            )}

            {authTab === 'verify' && (
              <div className="landing-form">
                <div className="landing-form-head">
                  <span className="landing-step">Étape 2 sur 3</span>
                  <h2>Vérifiez votre adresse</h2>
                  <p className="muted">
                    Le lien de confirmation est valable pour une durée limitée ; un nouvel envoi annule les précédents.
                  </p>
                </div>
                <div className="tip">
                  <Mail size={16} />
                  <p>
                    {signupEmail
                      ? `En attente de confirmation pour ${signupEmail}.`
                      : 'En attente de confirmation : demandez un nouvel envoi si besoin.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="primary landing-submit"
                  onClick={() => {
                    setEmailVerified(true);
                    setToast('Adresse e-mail confirmée : complétez votre profil.');
                    setAuthTab('onboarding');
                  }}
                >
                  <CheckCircle2 size={15} /> J’ai confirmé mon adresse (démo)
                </button>
                <button
                  type="button"
                  className="secondary landing-submit"
                  onClick={() => setToast('Nouveau lien envoyé (démo) ; les anciens liens sont annulés.')}
                >
                  Renvoyer le lien
                </button>
              </div>
            )}

            {authTab === 'onboarding' && (
              <form
                className="landing-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  finishOnboarding(signupName.trim() || 'Nouveau membre', signupInterests.trim());
                }}
              >
                <div className="landing-form-head">
                  <span className="landing-step">Étape 3 sur 3</span>
                  <h2>Bienvenue sur SAVOIR+</h2>
                  <p className="muted">
                    {emailVerified
                      ? 'Adresse vérifiée. Choisissez votre nom d’affichage et vos centres d’intérêt.'
                      : 'Personnalisez votre profil avant d’entrer dans votre espace.'}
                  </p>
                </div>
                <div className="lf-field">
                  <label htmlFor="onboarding-name">Nom d’affichage (facultatif)</label>
                  <input
                    id="onboarding-name"
                    placeholder="Ex. Kofi A."
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                  />
                </div>
                <div className="lf-field">
                  <label htmlFor="onboarding-interests">Centres d’intérêt</label>
                  <input
                    id="onboarding-interests"
                    placeholder="Ex. Cybersécurité, Réseaux, Entraide"
                    value={signupInterests}
                    onChange={(e) => setSignupInterests(e.target.value)}
                  />
                </div>
                <button type="submit" className="primary landing-submit">
                  Accéder à mon espace <ArrowRight size={15} />
                </button>
                <button
                  type="button"
                  className="secondary landing-submit"
                  onClick={() => finishOnboarding('Membre SAVOIR+', signupInterests.trim())}
                >
                  Compléter plus tard
                </button>
              </form>
            )}

            {authTab === 'reset' && (
              <form
                className="landing-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  setResetSent(true);
                  setToast('Si un compte correspond, un lien de réinitialisation a été envoyé.');
                }}
              >
                <div className="landing-form-head">
                  <h2>Mot de passe oublié</h2>
                  <p className="muted">
                    Par sécurité, la réponse est la même qu’un compte existe ou non. Une réinitialisation ferme toutes les
                    sessions ouvertes.
                  </p>
                </div>
                <div className="lf-field">
                  <label htmlFor="reset-email">Adresse e-mail du compte</label>
                  <input id="reset-email" type="email" required autoComplete="email" placeholder="nom@exemple.test" />
                </div>
                <button type="submit" className="primary landing-submit">
                  <KeyRound size={15} /> Envoyer le lien
                </button>
                {resetSent && (
                  <div className="tip">
                    <Lock size={16} />
                    <p>Si un compte vérifié correspond à cette adresse, un lien temporaire vient d’être envoyé.</p>
                  </div>
                )}
              </form>
            )}

          </section>

          {isPrimaryTab && (
            <button ref={exploreRef} type="button" className="lf-explore" onClick={() => onSelectPersona('afi')}>
              <Compass size={16} aria-hidden="true" /> Explorer sans compte
            </button>
          )}

          </div>

          <aside className="lg-right">
            <LandingVideo />
          </aside>
        </main>

        <footer className="landing-footer">
          <span>SAVOIR+ · par Nexus</span>
          <span>Hackathon CREATE WITH AI · Forum Femmes &amp; IA 2026</span>
        </footer>
      </div>

      {tourOpen && authTab === 'login' && (
        <CoachMark
          target={exploreRef.current}
          title="Vous testez SAVOIR+ ?"
          actionLabel="Explorer sans compte"
          onAction={() => {
            setTourOpen(false);
            onSelectPersona('afi');
          }}
          onClose={() => setTourOpen(false)}
        >
          Pas besoin de créer un compte : ce lien ouvre la plateforme avec un profil de démonstration.
        </CoachMark>
      )}
    </div>
  );
}
