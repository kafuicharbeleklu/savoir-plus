import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Cloud,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Users
} from 'lucide-react';

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
  const [authTab, setAuthTab] = useState<'login' | 'signup' | 'verify' | 'reset' | 'onboarding'>('login');
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

  return (
    <div className="visitor-shell">
      <header className="visitor-topbar">
        <div className="brand">
          SAVOIR<span className="brand-plus">+</span>
        </div>
        <div className="visitor-top-actions">
          <button className="secondary" onClick={() => setAuthTab('login')}>
            Se connecter
          </button>
          <button className="primary" onClick={() => setAuthTab('signup')}>
            Créer un compte
          </button>
        </div>
      </header>

      <div className="shell-scroll-viewport">
        <main className="visitor-grid">
        <section className="visitor-hero">
          <span className="eyebrow">PLATEFORME COLLABORATIVE D’APPRENTISSAGE & D’ENTRAIDE</span>
          <h1>Apprendre à son rythme, transmettre son savoir et progresser ensemble.</h1>
          <p className="visitor-lead">
            SAVOIR+ réunit la clarté d’un réseau d’entraide et la rigueur d’une académie pratique par sections, quiz et
            parcours vérifiés.
          </p>

          <div className="visitor-pillars">
            <div>
              <BookOpen size={18} />
              <div>
                <b>Parcours & Modules guidés</b>
                <span>Sections théoriques, ateliers interactifs et vérification des acquis.</span>
              </div>
            </div>
            <div>
              <Users size={18} />
              <div>
                <b>Entraide & Messagerie maîtrisée</b>
                <span>Questions communautaires, solutions choisies et demandes de contact acceptées.</span>
              </div>
            </div>
            <div>
              <Award size={18} />
              <div>
                <b>Progression & Studio créateur</b>
                <span>Suivi personnel clair, création ouverte aux contributeurs habilités et gouvernance tracée.</span>
              </div>
            </div>
          </div>

          <div className="visitor-demo-box">
            <span className="eyebrow">ACCÈS RAPIDE À LA DÉMONSTRATION</span>
            <h3>Explorer immédiatement selon un rôle</h3>
            <div className="visitor-demo-buttons">
              <button className="secondary" onClick={() => onSelectPersona('afi')}>
                <b>Afi Mensah</b>
                <small>Apprenante · Parcours & Communauté</small>
              </button>
              <button className="secondary" onClick={() => onSelectPersona('kossi')}>
                <b>Kossi Agbo</b>
                <small>Créateur & Mentor · Studio</small>
              </button>
              <button className="secondary" onClick={() => onSelectPersona('nadege')}>
                <b>Nadège Koffi</b>
                <small>Modération & Gouvernance</small>
              </button>
            </div>
          </div>
        </section>

        <section className="visitor-auth-card" aria-label="Authentification">
          <div className="tabs">
            <button className={authTab === 'login' ? 'selected' : ''} onClick={() => setAuthTab('login')}>
              Connexion
            </button>
            <button className={authTab === 'signup' ? 'selected' : ''} onClick={() => setAuthTab('signup')}>
              Inscription
            </button>
            <button className={authTab === 'verify' ? 'selected' : ''} onClick={() => setAuthTab('verify')}>
              Vérification
            </button>
            <button className={authTab === 'reset' ? 'selected' : ''} onClick={() => setAuthTab('reset')}>
              Récupération
            </button>
          </div>

          {authTab === 'login' && (
            <form
              className="visitor-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!cloudConfigured) {
                  setToast('Configurez Supabase ou utilisez un compte de démonstration ci-contre.');
                  return;
                }
                onLoginCloud(email, password);
              }}
            >
              <h2>Se connecter à SAVOIR+</h2>
              <p className="tiny muted">
                Accès synchronisé via Supabase Auth, ou test immédiat avec l’un des 3 profils de démonstration.
              </p>

              <label>
                Adresse e-mail
                <input
                  type="email"
                  required
                  placeholder="nom@exemple.test"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <label>
                Mot de passe
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              {error && <p className="modal-error">{error}</p>}

              <button type="submit" className="primary" disabled={busy}>
                <Cloud size={15} /> Connexion Supabase <ArrowRight size={15} />
              </button>

              <button type="button" className="text-link" onClick={() => setAuthTab('reset')}>
                Mot de passe oublié ?
              </button>
            </form>
          )}

          {authTab === 'signup' && (
            <form
              className="visitor-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!acceptedTerms || !signupEmail.trim()) return;
                setSignupSent(true);
                setEmailVerified(false);
                setToast('Demande d’inscription enregistrée — passez à la vérification e-mail.');
                setAuthTab('verify');
              }}
            >
              <h2>Créer un compte membre</h2>
              <p className="tiny muted">
                La vérification d’adresse e-mail est obligatoire avant toute publication ou messagerie.
              </p>

              <label>
                Adresse e-mail
                <input
                  type="email"
                  required
                  placeholder="prenom.nom@exemple.test"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
              </label>
              <label>
                Mot de passe (12 caractères minimum recommandés)
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••••••"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                />
              </label>
              <label className="check-inline">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                />
                <span>J’accepte les conditions d’utilisation et la politique de confidentialité.</span>
              </label>

              <button type="submit" className="primary" disabled={!acceptedTerms || !signupEmail.trim()}>
                Créer mon compte <ArrowRight size={15} />
              </button>

              {signupSent && (
                <div className="tip">
                  <CheckCircle2 size={16} />
                  <p>
                    Un lien de confirmation temporaire a été préparé pour <b>{signupEmail}</b>.
                  </p>
                </div>
              )}
            </form>
          )}

          {authTab === 'verify' && (
            <div className="visitor-form">
              <h2>Vérifier votre adresse e-mail</h2>
              <p className="tiny muted">
                Un lien de confirmation est valide pour une durée limitée. Tout nouvel envoi invalide automatiquement
                les liens précédents.
              </p>
              <div className="tip">
                <Mail size={16} />
                <p>
                  {signupEmail
                    ? `En attente de confirmation pour ${signupEmail}.`
                    : 'En attente de confirmation ? Demandez un nouvel envoi ou simulez la validation du lien ci-dessous.'}
                </p>
              </div>
              <button
                type="button"
                className="primary"
                onClick={() => {
                  setEmailVerified(true);
                  setToast('Adresse e-mail confirmée — complétez votre profil initial.');
                  setAuthTab('onboarding');
                }}
              >
                <CheckCircle2 size={15} /> Confirmer ce lien de vérification (simulation)
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setToast('Nouveau lien de vérification simulé envoyé ; les anciens liens sont annulés.')}
              >
                Renvoyer un lien de vérification
              </button>
            </div>
          )}

          {authTab === 'onboarding' && (
            <form
              className="visitor-form"
              onSubmit={(e) => {
                e.preventDefault();
                finishOnboarding(signupName.trim() || 'Nouveau membre', signupInterests.trim());
              }}
            >
              <span className="eyebrow">ÉTAPE 3/3 · PROFIL INITIAL</span>
              <h2>Bienvenue sur SAVOIR+</h2>
              <p className="tiny muted">
                {emailVerified
                  ? 'Votre adresse est vérifiée. Choisissez votre nom d’affichage et vos domaines d’intérêt.'
                  : 'Personnalisez votre profil avant d’entrer dans votre espace.'}
              </p>

              <label>
                Nom d’affichage (facultatif)
                <input
                  placeholder="Ex. Kofi A. ou Afi Mensah"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                />
              </label>

              <label>
                Centres d’intérêt
                <input
                  placeholder="Ex. Cybersécurité, Réseaux, Entraide"
                  value={signupInterests}
                  onChange={(e) => setSignupInterests(e.target.value)}
                />
              </label>

              <button type="submit" className="primary">
                Accéder à mon espace <ArrowRight size={15} />
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => finishOnboarding('Membre SAVOIR+', signupInterests.trim())}
              >
                Compléter plus tard
              </button>
            </form>
          )}

          {authTab === 'reset' && (
            <form
              className="visitor-form"
              onSubmit={(e) => {
                e.preventDefault();
                setResetSent(true);
                setToast('Procédure de récupération déclenchée (réponse neutre)');
              }}
            >
              <h2>Récupérer l’accès au compte</h2>
              <p className="tiny muted">
                Pour votre sécurité, la réponse reste identique qu’un compte corresponde ou non. Une réinitialisation
                révoque toutes les anciennes sessions.
              </p>
              <label>
                Adresse e-mail du compte
                <input type="email" required placeholder="nom@exemple.test" />
              </label>
              <button type="submit" className="primary">
                <KeyRound size={15} /> Envoyer les instructions
              </button>
              {resetSent && (
                <div className="tip">
                  <Lock size={16} />
                  <p>Si un compte vérifié correspond à cette adresse, un lien temporaire vient d’être généré.</p>
                </div>
              )}
            </form>
          )}

          <div className="visitor-security-note">
            <ShieldCheck size={15} />
            <span>Les droits réels et la confidentialité sont contrôlés côté serveur à chaque action.</span>
          </div>
        </section>
      </main>
      </div>
    </div>
  );
}
