/**
 * Préférences — fidèle à LinkedIn « Préférences et confidentialité ».
 * Colonne de catégories à gauche ; à droite des groupes de lignes
 * (libellé · valeur actuelle · →). Un clic ouvre une sous-page (« ← Retour »),
 * rien ne se déplie sur place ; les choix sont enregistrés automatiquement.
 * Adresse : #settings/<section>[/<réglage>].
 */
import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Bell, Eye, Lock, Monitor, ShieldCheck, User } from 'lucide-react';
import type { ExtendedDemoState } from '../wireframeData';
import { playSound } from '../sounds';
import type { Profile, Relation } from '../data';
import { currentCloudEmail, sendPasswordReset } from '../data';
import { resolveProfileVerified, type RoleCapabilities } from '../personas';
import { Avatar } from '../components/ProfileIdentityCard';
import { ConfirmDialog, EmptyState, RadioList, SavedIndicator, StatusDot, Toggle, useIsNarrow } from '../components/ui';
import { todayDay, type Day } from '../calendar';
import { IDENTITY_LABEL, accountOf, ageBandOf, type SchoolState } from '../school';
import { paidSubscription, type Subscription } from '../offers';
import { IdentityPanel } from './school/IdentityPanel';

type SectionId = 'account' | 'security' | 'visibility' | 'data' | 'notifications';

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: 'account', label: 'Préférences du compte', icon: <User size={20} aria-hidden="true" /> },
  { id: 'security', label: 'Connexion et sécurité', icon: <Lock size={20} aria-hidden="true" /> },
  { id: 'visibility', label: 'Visibilité', icon: <Eye size={20} aria-hidden="true" /> },
  { id: 'data', label: 'Confidentialité des données', icon: <ShieldCheck size={20} aria-hidden="true" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={20} aria-hidden="true" /> }
];

const LEGACY: Record<string, SectionId> = { prefs: 'account', privacy: 'visibility', security: 'security' };

/** Lit « section/réglage » (et les anciens identifiants prefs / privacy / security). */
export function parseSettingsPath(raw: string): { section: SectionId | null; detail: string | null } {
  const [first = '', second = ''] = (raw || '').split('/');
  const section = (LEGACY[first] || (SECTIONS.some((s) => s.id === first) ? first : null)) as SectionId | null;
  return { section, detail: section && second ? second : null };
}

const THEME_LABEL: Record<string, string> = { Système: 'Paramètres de l’appareil', Clair: 'Clair', Sombre: 'Sombre' };
const VIS_LABEL: Record<string, string> = { Membres: 'Membres connectés', Public: 'Public', 'Moi uniquement': 'Moi uniquement' };
const CONTACT_LABEL: Record<string, string> = {
  'Personnes que je suis': 'Personnes que vous suivez',
  'Membres autorisés': 'Tous les membres',
  Personne: 'Personne'
};

export interface SettingsViewProps {
  ext: ExtendedDemoState;
  updateExt: (fn: (prev: ExtendedDemoState) => ExtendedDemoState) => void;
  nav: (page: any, id?: string) => void;
  user: Profile;
  caps?: RoleCapabilities;
  relations: Relation[];
  people: Profile[];
  onUnblock: (r: Relation) => void;
  setToast: (msg: string) => void;
  /** Identifiant de route après #settings/ (section et réglage). */
  path: string;
  /** Mode cloud (Supabase) ou démonstration locale. */
  mode: 'local' | 'cloud';
  /** Remet la démonstration locale dans son état de départ. */
  onResetDemo?: () => void;
  /** Profils et vie scolaire (démonstration locale) : sert à la vérification d'identité simulée. */
  school?: SchoolState;
  saveSchool?: (next: SchoolState) => void;
  today?: Day;
}

/* ------------------------------------------------------------------ briques */

function Row({ label, value, onClick }: { label: string; value?: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" className="st-row" onClick={onClick}>
      <span className="st-row-label">{label}</span>
      <span className="st-row-value">{value}</span>
      <ArrowRight size={20} aria-hidden="true" className="st-row-arrow" />
    </button>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="st-card" aria-label={title}>
      <h2>{title}</h2>
      <div className="st-rows">{children}</div>
    </section>
  );
}

function Detail({
  title,
  description,
  onBack,
  savedAt,
  children
}: {
  title: string;
  description?: React.ReactNode;
  onBack: () => void;
  savedAt?: number | null;
  children: React.ReactNode;
}) {
  return (
    <section className="st-card st-detail" aria-label={title}>
      <button type="button" className="ui-back-link" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" /> Retour
      </button>
      <div className="st-detail-head">
        <h2>{title}</h2>
        <SavedIndicator at={savedAt} />
      </div>
      {description && <p className="st-detail-desc">{description}</p>}
      <div className="st-detail-body">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ page */

export function SettingsView({
  ext,
  updateExt,
  nav,
  user,
  caps,
  relations,
  people,
  onUnblock,
  setToast,
  path,
  mode,
  onResetDemo,
  school,
  saveSchool,
  today
}: SettingsViewProps) {
  const narrow = useIsNarrow();
  const [confirmReset, setConfirmReset] = useState(false);
  const canReset = mode === 'local' && Boolean(onResetDemo);
  const parsed = parseSettingsPath(path);
  const section: SectionId | null = parsed.section || (narrow ? null : 'account');
  const detail = parsed.detail;
  const [savedAt, setSavedAt] = useState<number | null>(null);
  // Formule : le choix en cours (la formule actuelle, ou celle choisie dans la fenêtre des offres), le moyen de paiement.
  const [cloudEmail, setCloudEmail] = useState<string | null>(null);

  useEffect(() => setSavedAt(null), [section, detail]);
  useEffect(() => {
    if (mode !== 'cloud') return;
    currentCloudEmail()
      .then(setCloudEmail)
      .catch(() => setCloudEmail(null));
  }, [mode]);

  const go = (s: SectionId | null, d?: string) => nav('settings', s ? (d ? `${s}/${d}` : s) : '');
  const back = () => go(section);

  const details = ext.profileDetails[user.id] || ext.profileDetails.afi;
  const isVerified = resolveProfileVerified(user.id, ext.adminUsers, details?.verified);
  const email =
    mode === 'cloud'
      ? cloudEmail
      : ext.adminUsers.find((u) => u.id === user.id || u.id === `usr-${user.id}`)?.email || null;
  const blocked = relations.filter((r) => r.blockedBy.includes(user.id));
  const theme = ext.appPrefs.theme;
  const exportAt = ext.appPrefs.dataExportRequestedAt;

  const saved = () => setSavedAt(Date.now());
  const patchPrefs = (patch: Partial<ExtendedDemoState['appPrefs']>) => {
    updateExt((prev) => ({ ...prev, appPrefs: { ...prev.appPrefs, ...patch } }));
    saved();
  };
  // Formule payante du membre : la publicité y devient facultative. Un mineur ne souscrit pas (ses parents, si).
  const paidPlan = paidSubscription(ext.subscriptions, user.id);
  const adult = !school || ageBandOf(accountOf(school, user.id), today || todayDay()) === 'adult';
  const patchSubscription = (patch: Partial<Subscription>) => {
    updateExt((prev) => {
      const current = prev.subscriptions?.[user.id];
      return current ? { ...prev, subscriptions: { ...prev.subscriptions, [user.id]: { ...current, ...patch } } } : prev;
    });
    saved();
  };
  const patchDetails = (patch: Partial<typeof details>) => {
    updateExt((prev) => ({
      ...prev,
      profileDetails: {
        ...prev.profileDetails,
        [user.id]: { ...(prev.profileDetails[user.id] || prev.profileDetails.afi), ...patch }
      }
    }));
    saved();
  };
  const patchNotif = (key: 'learning' | 'social' | 'community', value: boolean) => {
    updateExt((prev) => ({ ...prev, notifPrefs: { ...prev.notifPrefs, [key]: value } }));
    saved();
  };
  const onOff = (v: boolean) => (v ? 'Activé' : 'Désactivé');
  const notifOn = (v: boolean) => (v ? 'Activées' : 'Désactivées');
  const notif = ext.notifPrefs as { learning: boolean; social: boolean; community: boolean };

  /* -------------------------------------------------- contenu de la colonne droite */
  const renderDetail = (): React.ReactNode => {
    switch (`${section}/${detail}`) {
      case 'account/profile':
        return (
          <Detail title="Nom, lieu et titre" description="Ces informations apparaissent sur votre profil et à côté de vos publications." onBack={back}>
            <dl className="st-facts">
              <div><dt>Nom</dt><dd>{user.name}</dd></div>
              <div><dt>Titre</dt><dd>{details?.tagline || user.role}</dd></div>
              <div><dt>Lieu</dt><dd>{details?.location || 'Non renseigné'}</dd></div>
            </dl>
            <button type="button" className="secondary ui-btn-sm" onClick={() => nav('profile')}>
              Modifier mon profil
            </button>
          </Detail>
        );
      case 'account/interests':
        return (
          <Detail title="Centres d’intérêt" description="Ils servent uniquement à vous suggérer des ressources et des questions d’entraide." onBack={back}>
            <p className="st-text">{details?.interests || 'Aucun centre d’intérêt renseigné.'}</p>
            <button type="button" className="secondary ui-btn-sm" onClick={() => nav('profile')}>
              Modifier mon profil
            </button>
          </Detail>
        );
      case 'account/verification':
        // Démonstration locale : la vérification d'identité est simulée de bout en bout.
        if (school && saveSchool && today) {
          return (
            <Detail title="Vérification d’identité" description={`Rôle sur SAVOIR+ : ${caps?.roleLabel || 'Membre'}.`} onBack={back}>
              <IdentityPanel school={school} saveSchool={saveSchool} userId={user.id} today={today} setToast={setToast} />
            </Detail>
          );
        }
        return (
          <Detail title="Vérification" onBack={back}>
            <StatusDot tone={isVerified ? 'ok' : 'neutral'}>{isVerified ? 'Compte vérifié' : 'Compte non vérifié'}</StatusDot>
            <p className="st-text">
              {isVerified
                ? 'Le badge de vérification apparaît à côté de votre nom.'
                : 'La vérification d’identité n’est pas encore activée pour votre compte.'}{' '}
              Rôle sur SAVOIR+ : {caps?.roleLabel || 'Membre'}.
            </p>
          </Detail>
        );
      case 'account/theme':
        return (
          <Detail title="Mode sombre" description="Choisissez l’apparence de SAVOIR+ sur cet appareil." onBack={back} savedAt={savedAt}>
            <RadioList
              name="theme"
              legend="Apparence"
              value={theme}
              onChange={(v) => patchPrefs({ theme: v })}
              options={[
                { value: 'Système', label: 'Paramètres de l’appareil', hint: 'Suit le réglage clair ou sombre de votre système.' },
                { value: 'Clair', label: 'Clair' },
                { value: 'Sombre', label: 'Sombre' }
              ]}
            />
          </Detail>
        );
      case 'account/sound':
        return (
          <Detail
            title="Effets sonores"
            description="De courts sons confirment certaines actions : message envoyé ou reçu, publication ou repartage, abonnement ou demande envoyée, demande acceptée, suppression, nouvelle alerte, erreur."
            onBack={back}
            savedAt={savedAt}
          >
            <Toggle
              label="Effets sonores"
              checked={ext.appPrefs.soundEffects !== false}
              onChange={(v) => {
                patchPrefs({ soundEffects: v });
                // À l'activation, un son d'exemple (le réglage est appliqué juste après).
                if (v) window.setTimeout(() => playSound('msgSent'), 60);
              }}
            />
          </Detail>
        );
      case 'account/motion':
        return (
          <Detail title="Réduire les animations" description="Limite les transitions et les effets de mouvement de l’interface." onBack={back} savedAt={savedAt}>
            <Toggle label="Réduire les animations" checked={ext.appPrefs.reducedMotion} onChange={(v) => patchPrefs({ reducedMotion: v })} />
          </Detail>
        );
      case 'account/ads':
        if (!paidPlan) return null;
        return (
          <Detail
            title="Carte publicitaire"
            description={`Votre formule ${paidPlan.offer.name} rend la publicité facultative : affichez ou masquez la carte de la colonne de droite.`}
            onBack={back}
            savedAt={savedAt}
          >
            <Toggle label="Afficher la carte publicitaire" checked={paidPlan.subscription.showAds !== false} onChange={(v) => patchSubscription({ showAds: v })} />
          </Detail>
        );
      case 'account/language':
        return (
          <Detail title="Langue" description="Langue de l’interface de SAVOIR+." onBack={back}>
            <RadioList name="language" legend="Langue" value="Français" onChange={() => {}} options={[{ value: 'Français', label: 'Français' }]} />
            <p className="st-note">D’autres langues seront proposées ultérieurement.</p>
          </Detail>
        );
      case 'security/email':
        return (
          <Detail title="Adresse e-mail" description="Elle sert à vous connecter et à recevoir les alertes importantes. Les autres membres ne la voient jamais." onBack={back}>
            <dl className="st-facts">
              <div><dt>Adresse principale</dt><dd>{email || 'Non renseignée'}</dd></div>
            </dl>
          </Detail>
        );
      case 'security/password':
        return (
          <Detail title="Changer le mot de passe" description="Recevez un lien sécurisé pour choisir un nouveau mot de passe. Toutes vos sessions seront fermées." onBack={back}>
            <button
              type="button"
              className="primary ui-btn-sm"
              onClick={async () => {
                if (mode !== 'cloud' || !email) {
                  setToast('Démonstration : aucun e-mail n’est envoyé.');
                  return;
                }
                try {
                  await sendPasswordReset(email);
                  setToast('Lien de réinitialisation envoyé à votre adresse e-mail.');
                } catch {
                  setToast('Envoi impossible pour le moment. Réessayez plus tard.');
                }
              }}
            >
              Envoyer le lien
            </button>
          </Detail>
        );
      case 'security/sessions': {
        const others = ext.sessions.filter((s) => !s.current);
        return (
          <Detail title="Sessions actives" description="Appareils actuellement connectés à votre compte." onBack={back}>
            <div className="st-list">
              {ext.sessions.map((s) => (
                <div className="st-list-row" key={s.id}>
                  <Monitor size={20} aria-hidden="true" />
                  <span className="st-list-text">
                    <b>{s.label}</b>
                    <small>{s.lastSeen}</small>
                  </span>
                  {s.current ? (
                    <StatusDot tone="ok">Cette session</StatusDot>
                  ) : (
                    <button
                      type="button"
                      className="secondary ui-btn-sm"
                      onClick={() => {
                        updateExt((prev) => ({ ...prev, sessions: prev.sessions.filter((x) => x.id !== s.id) }));
                        setToast('Session déconnectée');
                      }}
                    >
                      Déconnecter
                    </button>
                  )}
                </div>
              ))}
            </div>
            {others.length > 1 && (
              <button
                type="button"
                className="li-text-link"
                onClick={() => {
                  updateExt((prev) => ({ ...prev, sessions: prev.sessions.filter((x) => x.current) }));
                  setToast('Autres sessions déconnectées');
                }}
              >
                Déconnecter toutes les autres sessions
              </button>
            )}
          </Detail>
        );
      }
      case 'visibility/profile':
        return (
          <Detail title="Qui peut voir votre profil" onBack={back} savedAt={savedAt}>
            <RadioList
              name="profile-visibility"
              legend="Visibilité du profil"
              value={details?.profileVisibility || 'Membres'}
              onChange={(v) => patchDetails({ profileVisibility: v })}
              options={[
                { value: 'Membres', label: 'Membres connectés', hint: 'Les membres de SAVOIR+ voient votre profil.' },
                { value: 'Public', label: 'Public', hint: 'Toute personne disposant du lien peut le voir.' },
                { value: 'Moi uniquement', label: 'Moi uniquement' }
              ]}
            />
          </Detail>
        );
      case 'visibility/xp':
        return (
          <Detail title="Visibilité du niveau et des XP" description="Votre progression reste toujours visible pour vous." onBack={back} savedAt={savedAt}>
            <RadioList
              name="xp-visibility"
              legend="Visibilité de la progression"
              value={details?.xpVisibility || 'Moi uniquement'}
              onChange={(v) => patchDetails({ xpVisibility: v })}
              options={[
                { value: 'Membres', label: 'Membres connectés' },
                { value: 'Moi uniquement', label: 'Moi uniquement' }
              ]}
            />
          </Detail>
        );
      case 'visibility/contact':
        return (
          <Detail title="Qui peut vous demander une discussion" description="Une discussion privée ne s’ouvre qu’une fois la demande acceptée." onBack={back} savedAt={savedAt}>
            <RadioList
              name="contact-policy"
              legend="Demandes de discussion"
              value={details?.contactPolicy || 'Membres autorisés'}
              onChange={(v) => patchDetails({ contactPolicy: v })}
              options={[
                { value: 'Personnes que je suis', label: 'Personnes que vous suivez', hint: 'Recommandé' },
                { value: 'Membres autorisés', label: 'Tous les membres' },
                { value: 'Personne', label: 'Personne' }
              ]}
            />
          </Detail>
        );
      case 'visibility/blocked':
        return (
          <Detail title="Personnes bloquées" description="Une personne bloquée ne peut plus vous écrire. Débloquer ne rouvre pas la discussion." onBack={back}>
            {blocked.length === 0 ? (
              <EmptyState title="Aucune personne bloquée" />
            ) : (
              <div className="st-list">
                {blocked.map((r) => {
                  const other = people.find((p) => p.id === r.members.find((id) => id !== user.id));
                  return (
                    <div className="st-list-row" key={r.id}>
                      {other ? <Avatar person={other} small /> : null}
                      <span className="st-list-text">
                        <b>{other?.name || 'Membre'}</b>
                      </span>
                      <button type="button" className="secondary ui-btn-sm" onClick={() => onUnblock(r)}>
                        Débloquer
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Detail>
        );
      case 'data/usage':
        return (
          <Detail title="Comment SAVOIR+ utilise vos données" onBack={back}>
            <ul className="st-bullets">
              <li>Votre progression sert à reprendre là où vous vous êtes arrêté et à calculer vos XP.</li>
              <li>Vos centres d’intérêt servent uniquement aux suggestions de ressources et d’entraide.</li>
              <li>Vos messages privés ne sont lisibles que par les participants à la discussion.</li>
              <li>Aucune donnée personnelle n’est utilisée à des fins publicitaires.</li>
            </ul>
          </Detail>
        );
      case 'data/export':
        return (
          <Detail title="Télécharger vos données" description="L’archive contient votre profil, votre progression et vos publications, sans secrets ni notes internes de modération." onBack={back}>
            {exportAt ? (
              <StatusDot tone="info">Demande enregistrée le {new Date(exportAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</StatusDot>
            ) : (
              <button
                type="button"
                className="primary ui-btn-sm"
                onClick={() => {
                  patchPrefs({ dataExportRequestedAt: Date.now() });
                  setToast('Demande d’archive enregistrée');
                }}
              >
                Demander l’archive
              </button>
            )}
            {mode !== 'cloud' && <p className="st-note">Démonstration : aucune archive n’est générée.</p>}
          </Detail>
        );
      case 'data/reset':
        if (!canReset) return null;
        return (
          <Detail
            title="Réinitialiser la démonstration"
            description="Tout ce qui a été fait sur cet appareil est effacé : progression, publications, calendrier, classes et réglages. Les sept personnages reviennent à leur état de départ."
            onBack={back}
          >
            <button type="button" className="secondary ui-btn-sm danger" onClick={() => setConfirmReset(true)}>
              Réinitialiser
            </button>
            <ConfirmDialog
              open={confirmReset}
              danger
              title="Réinitialiser la démonstration ?"
              text="Cette action efface les données de démonstration enregistrées sur cet appareil. Elle ne peut pas être annulée."
              confirmLabel="Réinitialiser"
              onCancel={() => setConfirmReset(false)}
              onConfirm={() => {
                setConfirmReset(false);
                onResetDemo?.();
                back();
              }}
            />
          </Detail>
        );
      case 'notifications/learning':
      case 'notifications/social':
      case 'notifications/community': {
        const key = detail as 'learning' | 'social' | 'community';
        const meta = {
          learning: { title: 'Apprentissage et reprises', desc: 'Reprises de module, résultats de quiz et validations de vos contenus.' },
          social: { title: 'Relations et messages', desc: 'Demandes de discussion, nouveaux abonnés et messages.' },
          community: { title: 'Réponses de la communauté', desc: 'Réponses et solutions à vos questions d’entraide.' }
        }[key];
        return (
          <Detail title={meta.title} description={meta.desc} onBack={back} savedAt={savedAt}>
            <Toggle label="Recevoir ces alertes" checked={Boolean(notif[key])} onChange={(v) => patchNotif(key, v)} />
          </Detail>
        );
      }
      default:
        return null;
    }
  };

  const renderSection = (s: SectionId): React.ReactNode => {
    switch (s) {
      case 'account':
        return (
          <>
            <Group title="Informations du profil">
              <Row label="Nom, lieu et titre" value={details?.location || user.name} onClick={() => go(s, 'profile')} />
              <Row label="Centres d’intérêt" value={details?.interests} onClick={() => go(s, 'interests')} />
              <Row
                label="Vérification d’identité"
                value={school ? IDENTITY_LABEL[accountOf(school, user.id).identity] : isVerified ? 'Compte vérifié' : 'Non vérifié'}
                onClick={() => go(s, 'verification')}
              />
            </Group>
            <Group title="Affichage">
              <Row label="Mode sombre" value={THEME_LABEL[theme] || theme} onClick={() => go(s, 'theme')} />
              <Row label="Réduire les animations" value={onOff(ext.appPrefs.reducedMotion)} onClick={() => go(s, 'motion')} />
            </Group>
            <Group title="Préférences générales">
              <Row label="Langue" value="Français" onClick={() => go(s, 'language')} />
              <Row label="Effets sonores" value={onOff(ext.appPrefs.soundEffects !== false)} onClick={() => go(s, 'sound')} />
            </Group>
            {/* La formule se gère depuis le menu Vous › Ma formule ; ici, seulement la carte publicitaire, qui ne se
                règle qu'avec une formule payante. */}
            {adult && paidPlan && (
              <Group title="Abonnement">
                <Row label="Carte publicitaire" value={paidPlan.subscription.showAds === false ? 'Masquée' : 'Affichée'} onClick={() => go(s, 'ads')} />
              </Group>
            )}
          </>
        );
      case 'security':
        return (
          <Group title="Accès au compte">
            <Row label="Adresse e-mail" value={email || 'Non renseignée'} onClick={() => go(s, 'email')} />
            <Row label="Changer le mot de passe" onClick={() => go(s, 'password')} />
            <Row
              label="Sessions actives"
              value={`${ext.sessions.length} session${ext.sessions.length > 1 ? 's' : ''}`}
              onClick={() => go(s, 'sessions')}
            />
          </Group>
        );
      case 'visibility':
        return (
          <>
            <Group title="Visibilité de votre profil et de votre progression">
              <Row label="Qui peut voir votre profil" value={VIS_LABEL[details?.profileVisibility || 'Membres']} onClick={() => go(s, 'profile')} />
              <Row label="Visibilité du niveau et des XP" value={VIS_LABEL[details?.xpVisibility || 'Moi uniquement']} onClick={() => go(s, 'xp')} />
            </Group>
            <Group title="Qui peut vous contacter">
              <Row
                label="Qui peut vous demander une discussion"
                value={CONTACT_LABEL[details?.contactPolicy || 'Membres autorisés']}
                onClick={() => go(s, 'contact')}
              />
              <Row label="Personnes bloquées" value={String(blocked.length)} onClick={() => go(s, 'blocked')} />
            </Group>
          </>
        );
      case 'data':
        return (
          <Group title="Utilisation de vos données">
            <Row label="Comment SAVOIR+ utilise vos données" onClick={() => go(s, 'usage')} />
            <Row label="Télécharger vos données" value={exportAt ? 'Demandé' : undefined} onClick={() => go(s, 'export')} />
            {canReset && <Row label="Réinitialiser la démonstration" onClick={() => go(s, 'reset')} />}
          </Group>
        );
      case 'notifications':
        return (
          <>
            <Group title="Notifications que vous recevez">
              <Row label="Apprentissage et reprises" value={notifOn(notif.learning)} onClick={() => go(s, 'learning')} />
              <Row label="Relations et messages" value={notifOn(notif.social)} onClick={() => go(s, 'social')} />
              <Row label="Réponses de la communauté" value={notifOn(notif.community)} onClick={() => go(s, 'community')} />
            </Group>
            <p className="st-note st-note-out">Les alertes liées à votre compte et à sa sécurité sont toujours envoyées.</p>
          </>
        );
    }
  };

  const sidebar = (
    <aside className="st-sidebar" aria-label="Catégories de préférences">
      <div className="st-sidebar-head">
        <Avatar person={user} small />
        <h1>Préférences</h1>
      </div>
      <nav className="st-nav">
        {SECTIONS.map((it) => (
          <button
            key={it.id}
            type="button"
            className={`st-nav-item ${section === it.id ? 'is-active' : ''}`}
            aria-current={section === it.id ? 'page' : undefined}
            onClick={() => go(it.id)}
          >
            {it.icon}
            <span>{it.label}</span>
            {narrow && <ArrowRight size={18} aria-hidden="true" className="st-row-arrow" />}
          </button>
        ))}
      </nav>
    </aside>
  );

  // Petit écran : pile (catégories → section → réglage), comme l'application LinkedIn.
  if (narrow && !section) return <div className="st-page">{sidebar}</div>;

  const sectionLabel = SECTIONS.find((x) => x.id === section)?.label || '';
  return (
    <div className="st-page">
      {!narrow && sidebar}
      <div className="st-main">
        {narrow && !detail && (
          <div className="st-mobile-head">
            <button type="button" className="ui-back-link" onClick={() => go(null)}>
              <ArrowLeft size={16} aria-hidden="true" /> Préférences
            </button>
            <h1>{sectionLabel}</h1>
          </div>
        )}
        {detail ? renderDetail() || renderSection(section!) : renderSection(section!)}
      </div>
    </div>
  );
}
