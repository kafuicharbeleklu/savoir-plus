import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  KeyRound,
  Layers,
  Lock,
  Mail,
  ShieldCheck,
  Users
} from 'lucide-react';

type AuthTab = 'login' | 'signup' | 'verify' | 'reset' | 'onboarding';

const DEMO_PERSONAS: {
  id: 'afi' | 'kossi' | 'nadege';
  initials: string;
  name: string;
  role: string;
  preview: string;
  tone: string;
}[] = [
  {
    id: 'afi',
    initials: 'AM',
    name: 'Afi Mensah',
    role: 'Apprenante',
    preview: 'Suivre un module, gagner des XP et demander de l’aide à un membre.',
    tone: 'peach'
  },
  {
    id: 'kossi',
    initials: 'KA',
    name: 'Kossi Agbo',
    role: 'Créateur & mentor',
    preview: 'Créer un module avec le Studio IA et répondre aux apprenants.',
    tone: 'lavender'
  },
  {
    id: 'nadege',
    initials: 'NK',
    name: 'Nadège Koffi',
    role: 'Modération',
    preview: 'Superviser la plateforme et ses signalements (aperçu).',
    tone: 'mint'
  }
];

export function VisitorAuthView({
  cloudConfigured,
  busy,
  error,
  onSelectPersona,
  onLoginCloud,
  onCompleteOnboarding,
  setToast
}: {
  cloudConfigured: boolean;
  busy: boolean;
  error: string;
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

  const finishOnboarding = (nameToUse: string, interestsToUse: string) => {
    if (onCompleteOnboarding) {
      onCompleteOnboarding(nameToUse, interestsToUse);
    } else {
      onSelectPersona('afi');
    }
  };

  const openAuth = (tab: AuthTab) => {
    setAuthTab(tab);
    document.getElementById('landing-auth')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const isPrimaryTab = authTab === 'login' || authTab === 'signup';

  return (
    <div className="visitor-shell landing">
      <header className="visitor-topbar landing-topbar">
        <div className="brand">
          SAVOIR<span className="brand-plus">+</span>
        </div>
        <div className="visitor-top-actions">
          <button className="secondary" onClick={() => openAuth('login')}>
            Se connecter
          </button>
          <button className="primary" onClick={() => openAuth('signup')}>
            Créer un compte
          </button>
        </div>
      </header>

      <div className="shell-scroll-viewport">
        <main className="landing-grid">
          <section className="landing-hero" aria-labelledby="landing-title">
            <span className="eyebrow">Plateforme d’apprentissage et d’entraide</span>
            <h1 id="landing-title">
              Apprendre à son rythme.
              <br />
              Progresser ensemble.
            </h1>
            <p className="landing-lead">
              Des modules courts et pratiques, un quiz corrigé, des XP pour garder l’élan, et des membres à qui demander
              de l’aide quand on bloque. Les encadreurs transforment leurs explications en modules illustrés grâce au
              Studio IA.
            </p>

            <div className="landing-cta">
              <button className="primary landing-cta-main" onClick={() => onSelectPersona('afi')}>
                Essayer la démo <ArrowRight size={16} />
              </button>
              <button className="secondary" onClick={() => onSelectPersona('kossi')}>
                Je suis encadreur
              </button>
            </div>

            <ul className="landing-values">
              <li>
                <span className="landing-value-icon" aria-hidden="true">
                  <BookOpen size={18} />
                </span>
                <div>
                  <b>Apprendre en pratiquant</b>
                  <p>Sections courtes, atelier interactif et quiz corrigé : on comprend en faisant.</p>
                </div>
              </li>
              <li>
                <span className="landing-value-icon" aria-hidden="true">
                  <Users size={18} />
                </span>
                <div>
                  <b>Ne plus bloquer seul</b>
                  <p>Invitez un membre et discutez après son accord, dans un cadre respectueux.</p>
                </div>
              </li>
              <li>
                <span className="landing-value-icon" aria-hidden="true">
                  <Layers size={18} />
                </span>
                <div>
                  <b>Transmettre avec l’IA</b>
                  <p>Collez votre explication : l’IA propose module, quiz et fiche illustrée, que vous relisez.</p>
                </div>
              </li>
            </ul>

            <section className="landing-personas" aria-labelledby="landing-personas-title">
              <div className="landing-personas-head">
                <h2 id="landing-personas-title">Explorer avec un personnage de démonstration</h2>
                <small className="muted">Personnages fictifs · données conservées dans votre navigateur</small>
              </div>
              <div className="landing-persona-list">
                {DEMO_PERSONAS.map((p) => (
                  <button key={p.id} type="button" className="landing-persona" onClick={() => onSelectPersona(p.id)}>
                    <span className={`landing-persona-avatar tone-${p.tone}`} aria-hidden="true">
                      {p.initials}
                    </span>
                    <span className="landing-persona-text">
                      <b>{p.name}</b>
                      <span className="landing-persona-role">{p.role}</span>
                      <span className="landing-persona-preview">{p.preview}</span>
                    </span>
                    <ChevronRight size={18} className="landing-persona-chevron" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </section>
          </section>

          <section id="landing-auth" className="landing-auth" aria-label="Connexion et inscription">
            {isPrimaryTab && (
              <div className="landing-segmented" role="tablist" aria-label="Choisir entre connexion et inscription">
                <button
                  type="button"
                  role="tab"
                  aria-selected={authTab === 'login'}
                  className={authTab === 'login' ? 'selected' : ''}
                  onClick={() => setAuthTab('login')}
                >
                  Connexion
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={authTab === 'signup'}
                  className={authTab === 'signup' ? 'selected' : ''}
                  onClick={() => setAuthTab('signup')}
                >
                  Inscription
                </button>
              </div>
            )}

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
                    setToast('Connexion indisponible : utilisez un personnage de démonstration.');
                    return;
                  }
                  onLoginCloud(email, password);
                }}
              >
                <div className="landing-form-head">
                  <h2>Se connecter</h2>
                  <p className="muted">Avec votre compte SAVOIR+.</p>
                </div>
                <label>
                  Adresse e-mail
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="nom@exemple.test"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label>
                  <span className="landing-label-row">
                    Mot de passe
                    <button type="button" className="text-link" onClick={() => setAuthTab('reset')}>
                      Mot de passe oublié ?
                    </button>
                  </span>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                {error && (
                  <p className="modal-error" role="alert">
                    {error}
                  </p>
                )}
                <button type="submit" className="primary landing-submit" disabled={busy}>
                  {busy ? 'Connexion…' : 'Se connecter'}
                </button>
                <div className="landing-divider">
                  <span>ou</span>
                </div>
                <button type="button" className="secondary landing-submit" onClick={() => onSelectPersona('afi')}>
                  Explorer sans compte
                </button>
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
                <label>
                  Adresse e-mail
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="prenom.nom@exemple.test"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                  />
                </label>
                <label>
                  Mot de passe
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    aria-describedby="signup-password-hint"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />
                  <small id="signup-password-hint" className="muted landing-hint">
                    12 caractères ou plus recommandés.
                  </small>
                </label>
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
                <label>
                  Nom d’affichage (facultatif)
                  <input placeholder="Ex. Kofi A." value={signupName} onChange={(e) => setSignupName(e.target.value)} />
                </label>
                <label>
                  Centres d’intérêt
                  <input
                    placeholder="Ex. Cybersécurité, Réseaux, Entraide"
                    value={signupInterests}
                    onChange={(e) => setSignupInterests(e.target.value)}
                  />
                </label>
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
                <label>
                  Adresse e-mail du compte
                  <input type="email" required autoComplete="email" placeholder="nom@exemple.test" />
                </label>
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

            <p className="landing-security">
              <ShieldCheck size={14} aria-hidden="true" />
              <span>
                Compte connecté : droits et confidentialité contrôlés côté serveur. Démo : tout reste dans votre
                navigateur.
              </span>
            </p>
          </section>
        </main>

        <footer className="landing-footer">
          <span>SAVOIR+ · par Nexus</span>
          <span>Hackathon CREATE WITH AI · Forum Femmes &amp; IA 2026</span>
        </footer>
      </div>
    </div>
  );
}
