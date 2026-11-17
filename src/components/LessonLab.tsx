/**
 * L'exercice d'un module : une scène à inspecter (un e-mail, un écran de réglages…). L'élève clique
 * sur ce qu'il veut examiner ; chaque indice trouvé reçoit un numéro et s'explique sous la scène.
 * Tout est fictif : rien n'est saisi ni envoyé.
 */
import React, { useState } from 'react';
import { Check } from 'lucide-react';

type LabType = 'phishing' | 'reseaux' | 'comptes' | 'generic';

interface Clue {
  id: string;
  title: string;
  detail: string;
}

interface PanelRow {
  clue: string;
  label: string;
  value: string;
}

interface LabSpec {
  prompt: string;
  done: string;
  clues: Clue[];
  /** Les labs autres que l'e-mail montrent un écran de réglages, ligne par ligne. */
  panel?: { title: string; rows: PanelRow[] };
}

const LABS: Record<LabType, LabSpec> = {
  phishing: {
    prompt: 'Quatre indices trahissent ce message. Cliquez sur ce qui vous paraît suspect.',
    done: 'Les quatre indices sont trouvés : ce message ne mérite ni clic ni réponse.',
    clues: [
      {
        id: 'sender',
        title: 'L’adresse de l’expéditeur',
        detail: 'Le nom affiché dit « Service Sécurité », mais l’adresse se termine par « securite-client.test » : ce n’est pas le domaine de la banque.'
      },
      {
        id: 'urgency',
        title: 'La pression',
        detail: '« ACTION URGENTE » et « dans 24 heures » : le message veut une réaction avant toute vérification.'
      },
      {
        id: 'ask',
        title: 'La demande sensible',
        detail: 'Aucune banque ne demande vos identifiants ni le code de votre carte par e-mail.'
      },
      {
        id: 'link',
        title: 'La destination du bouton',
        detail: 'Le bouton mène à « verif-24h.exemple-tiers.test » : un domaine sans rapport avec la banque.'
      }
    ]
  },
  reseaux: {
    prompt: 'Sur ce poste, les sites ne s’ouvrent plus. Examinez chaque ligne pour trouver où est la panne.',
    done: 'Diagnostic posé : le réseau local fonctionne, c’est le DNS qui ne répond pas.',
    panel: {
      title: 'État du réseau — poste 12',
      rows: [
        { clue: 'ip', label: 'Adresse IP', value: '192.168.10.24 /24' },
        { clue: 'gw', label: 'Passerelle', value: '192.168.10.1 — répond en 2 ms' },
        { clue: 'dns', label: 'Serveur DNS', value: '192.168.99.53 — aucune réponse' }
      ]
    },
    clues: [
      {
        id: 'ip',
        title: 'L’adresse et le masque',
        detail: 'Avec le masque /24, tous les postes de 192.168.10.1 à 192.168.10.254 sont voisins : ils se parlent directement.'
      },
      {
        id: 'gw',
        title: 'La passerelle',
        detail: 'Elle appartient au même réseau et elle répond : le réseau local fonctionne, la sortie vers Internet est ouverte.'
      },
      {
        id: 'dns',
        title: 'Le DNS',
        detail: 'La passerelle répond, pas le DNS : la connexion est bonne, c’est la traduction des noms qui est en panne.'
      }
    ]
  },
  comptes: {
    prompt: 'Ce compte a trois failles. Examinez chaque ligne pour les trouver.',
    done: 'Trois failles, trois corrections : un mot de passe unique, un second facteur, une session révoquée.',
    panel: {
      title: 'Sécurité du compte',
      rows: [
        { clue: 'pwd', label: 'Mot de passe', value: 'Le même que sur un ancien forum' },
        { clue: 'mfa', label: 'Double authentification', value: 'Désactivée' },
        { clue: 'session', label: 'Appareils connectés', value: 'Ce téléphone · un navigateur inconnu, il y a 3 jours' }
      ]
    },
    clues: [
      {
        id: 'pwd',
        title: 'Un mot de passe réutilisé',
        detail: 'Si le forum subit une fuite, ce mot de passe sera essayé sur la messagerie. Un service, un mot de passe.'
      },
      {
        id: 'mfa',
        title: 'Pas de second facteur',
        detail: 'Sans second facteur, un mot de passe volé suffit pour entrer. À activer en priorité sur la messagerie.'
      },
      {
        id: 'session',
        title: 'Une session inconnue',
        detail: 'Un appareil que l’on ne reconnaît pas se révoque tout de suite, puis on change le mot de passe.'
      }
    ]
  },
  generic: {
    prompt: 'Trois points à vérifier avant le quiz. Passez-les en revue un à un.',
    done: 'Vous êtes prêt pour le quiz.',
    panel: {
      title: 'Avant le quiz',
      rows: [
        { clue: 'goal', label: 'L’essentiel', value: 'Je peux redire la règle principale avec mes mots' },
        { clue: 'check', label: 'Le piège', value: 'Je connais l’erreur la plus fréquente' },
        { clue: 'action', label: 'Le geste', value: 'Je sais ce que je ferai différemment' }
      ]
    },
    clues: [
      { id: 'goal', title: 'La règle', detail: 'Si vous pouvez l’expliquer à quelqu’un en une phrase, vous la tenez.' },
      { id: 'check', title: 'L’erreur fréquente', detail: 'C’est souvent elle que le quiz vient chercher : relisez la question posée dans chaque section.' },
      { id: 'action', title: 'Le passage à l’action', detail: 'Une notion sert quand elle change un geste. Choisissez-en un à appliquer cette semaine.' }
    ]
  }
};

export function ModuleInteractiveLab({ labType = 'phishing' }: { labType?: LabType }) {
  // Les indices, dans l'ordre où l'élève les trouve : cet ordre donne leur numéro.
  const [order, setOrder] = useState<string[]>([]);
  const lab = LABS[labType];
  const total = lab.clues.length;
  const numberOf = (id: string) => order.indexOf(id) + 1;
  const inspect = (id: string) => setOrder((prev) => (prev.includes(id) ? prev : [...prev, id]));

  /** Une zone cliquable de la scène ; une fois trouvée, elle porte son numéro. */
  const zone = (id: string, className: string, children: React.ReactNode) => {
    const n = numberOf(id);
    const badge = n > 0 && (
      <span className="rd-lab-num tabular-nums">
        <span className="sr-only">Indice </span>
        {n}
      </span>
    );
    const classes = `rd-lab-zone ${className}${n ? ' is-found' : ''}`;
    // Une zone prise dans une phrase doit pouvoir passer à la ligne avec elle : un <button> ne le peut pas.
    if (className === 'is-inline') {
      return (
        <span
          role="button"
          tabIndex={0}
          className={classes}
          aria-pressed={n > 0}
          onClick={() => inspect(id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inspect(id);
            }
          }}
        >
          {children}
          {badge}
        </span>
      );
    }
    return (
      <button type="button" className={classes} aria-pressed={n > 0} onClick={() => inspect(id)}>
        {children}
        {badge}
      </button>
    );
  };

  return (
    <section className={`rd-lab${lab.panel ? ' is-review' : ''}`} aria-label="Exercice">
      <div className="rd-lab-head">
        <p>{lab.prompt}</p>
        <span className="rd-lab-count tabular-nums" role="status">
          {order.length} sur {total}
        </span>
      </div>

      {lab.panel ? (
        <div className="rd-lab-scene is-panel">
          <p className="rd-lab-panel-title">{lab.panel.title}</p>
          {lab.panel.rows.map((row) => (
            <React.Fragment key={row.clue}>
              {zone(
                row.clue,
                'is-row',
                <>
                  <span className="rd-lab-row-label">{row.label}</span>
                  <span className="rd-lab-row-value">{row.value}</span>
                </>
              )}
            </React.Fragment>
          ))}
        </div>
      ) : (
        <div className="rd-lab-scene is-mail">
          {zone(
            'sender',
            'is-sender',
            <>
              <span className="rd-lab-avatar" aria-hidden="true">
                SS
              </span>
              <span className="rd-lab-from">
                <b>Service Sécurité</b>
                <small>alerte@banque-exemple.securite-client.test</small>
              </span>
            </>
          )}
          {zone('urgency', 'is-subject', <span>ACTION URGENTE : votre compte sera bloqué dans 24 heures</span>)}
          <div className="rd-lab-mail-body">
            <p>Cher client,</p>
            <p>
              Une activité inhabituelle a été détectée sur votre compte.{' '}
              {zone('ask', 'is-inline', <span>Confirmez immédiatement vos identifiants et le code de votre carte</span>)} pour éviter la fermeture
              définitive de votre accès.
            </p>
            {zone(
              'link',
              'is-cta',
              <>
                <span className="rd-lab-cta">Confirmer mon compte</span>
                <small>Ce bouton mène à : verif-24h.exemple-tiers.test/login</small>
              </>
            )}
          </div>
        </div>
      )}

      <p className="rd-lab-foot">{lab.panel ? 'Écran fictif, pour s’exercer.' : 'Message fictif, pour s’exercer : rien n’est envoyé.'}</p>

      {order.length > 0 && (
        <ol className="rd-lab-findings" aria-label="Indices trouvés">
          {order.map((id, i) => {
            const clue = lab.clues.find((c) => c.id === id);
            if (!clue) return null;
            return (
              <li key={id}>
                <span className="rd-lab-num tabular-nums" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <b>{clue.title}</b>
                  <p>{clue.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {order.length === total && (
        <p className="rd-lab-done" role="status">
          <Check size={18} aria-hidden="true" />
          {lab.done}
        </p>
      )}
    </section>
  );
}
