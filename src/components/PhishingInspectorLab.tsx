import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  ExternalLink,
  KeyRound,
  Lock,
  Mail,
  Network,
  Search,
  ShieldCheck
} from 'lucide-react';

interface Clue {
  id: string;
  label: string;
  detail: string;
}

const PHISHING_CLUES: Clue[] = [
  {
    id: 'sender',
    label: 'Expéditeur réel non officiel',
    detail:
      'Le nom affiché dit « Service Sécurité », mais le domaine réel est @banque-exemple.test (domaine tiers inconnu de votre banque).'
  },
  {
    id: 'urgency',
    label: 'Menace & urgence artificielle',
    detail:
      '« Fermeture sous 24 heures » vise à provoquer une réaction impulsive avant toute vérification par un canal indépendant.'
  },
  {
    id: 'link',
    label: 'Destination du bouton trompeuse',
    detail:
      'Le lien pointe vers http://verif-24h.exemple-tiers.test/login, hors du domaine officiel et sans garantie légitime.'
  }
];

const NETWORK_CLUES: Clue[] = [
  {
    id: 'ip',
    label: 'Masque /24 et plage locale identifiés',
    detail:
      'Avec 192.168.10.24 / 255.255.255.0, les hôtes 192.168.10.1 à .254 communiquent directement sur le même sous-réseau.'
  },
  {
    id: 'gw',
    label: 'Passerelle par défaut cohérente',
    detail:
      'La passerelle 192.168.10.1 appartient bien au même sous-réseau : sans elle, aucun paquet ne sort vers Internet.'
  },
  {
    id: 'dns',
    label: 'Résolution DNS défaillante isolée',
    detail:
      'Le ping vers 192.168.10.1 répond mais pas vers un nom de domaine : le lien physique est bon, seul le serveur DNS doit être vérifié.'
  }
];

const ACCOUNT_CLUES: Clue[] = [
  {
    id: 'pwd',
    label: 'Mot de passe réutilisé repéré',
    detail:
      'Le même mot de passe sert sur la messagerie principale et un forum tiers : si le forum fuit, la boîte mail tombe aussi.'
  },
  {
    id: 'mfa',
    label: 'Double authentification absente',
    detail:
      'Sans second facteur (application TOTP ou clé), un mot de passe volé suffit à ouvrir une session distante.'
  },
  {
    id: 'session',
    label: 'Session inconnue encore active',
    detail:
      'Un navigateur inconnu connecté il y a 3 jours reste autorisé : il faut révoquer la session puis renouveler le mot de passe.'
  }
];

const GENERIC_CLUES: Clue[] = [
  {
    id: 'goal',
    label: 'Objectif de la leçon reformulé',
    detail: 'Vous avez vérifié la règle principale et son champ d’application concret.'
  },
  {
    id: 'check',
    label: 'Point de vigilance identifié',
    detail: 'Vous avez repéré l’erreur la plus fréquente à éviter en situation réelle.'
  },
  {
    id: 'action',
    label: 'Réflexe pratique prêt à appliquer',
    detail: 'Vous savez quelle vérification effectuer avant de passer à l’évaluation.'
  }
];

export function PhishingInspectorLab() {
  const [found, setFound] = useState<Record<string, boolean>>({});
  const [activeClue, setActiveClue] = useState<Clue | null>(null);

  const inspect = (clue: Clue) => {
    setFound((prev) => ({ ...prev, [clue.id]: true }));
    setActiveClue(clue);
  };

  const count = Object.values(found).filter(Boolean).length;

  return (
    <section className="phishing-lab" aria-label="Atelier pratique d’inspection d’e-mail">
      <div className="phishing-lab-head">
        <div>
          <span className="eyebrow">Exercice interactif · inspection guidée</span>
          <h3>Repérez les 3 signaux suspects dans ce message fictif</h3>
        </div>
        <span className="lab-counter tabular-nums">
          <Search size={14} /> {count} / 3 indices vérifiés
        </span>
      </div>

      <div className="simulated-mail">
        <div className="simulated-mail-bar">
          <Mail size={15} />
          <span>Boîte de réception · Message simulé</span>
          <span className="tiny">Ne jamais saisir de vraies données</span>
        </div>

        <div className="simulated-mail-meta">
          <button
            type="button"
            className={`clue-hotspot ${found.sender ? 'inspected' : ''}`}
            onClick={() => inspect(PHISHING_CLUES[0])}
          >
            <span>
              <strong>De :</strong> Service Sécurité &lt;alerte@banque-exemple.test&gt;
            </span>
            <em>{found.sender ? <CheckCircle2 size={14} /> : <Eye size={14} />}</em>
          </button>

          <button
            type="button"
            className={`clue-hotspot ${found.urgency ? 'inspected' : ''}`}
            onClick={() => inspect(PHISHING_CLUES[1])}
          >
            <span>
              <strong>Objet :</strong> ACTION URGENTE : Votre compte sera bloqué dans 24 heures
            </span>
            <em>{found.urgency ? <CheckCircle2 size={14} /> : <Eye size={14} />}</em>
          </button>
        </div>

        <div className="simulated-mail-body">
          <p>
            Cher client, une activité inhabituelle a été détectée. Confirmez immédiatement vos identifiants et votre
            code de carte pour éviter la fermeture définitive de votre accès dès demain matin.
          </p>

          <button
            type="button"
            className={`clue-link-btn ${found.link ? 'inspected' : ''}`}
            onClick={() => inspect(PHISHING_CLUES[2])}
          >
            <Lock size={14} />
            <span>Confirmer mon compte maintenant</span>
            <ExternalLink size={13} />
            <small className="link-preview">Destination au survol : verif-24h.exemple-tiers.test/login</small>
          </button>
        </div>
      </div>

      {activeClue ? (
        <div className="clue-feedback" role="status">
          <AlertTriangle size={16} />
          <div>
            <b>{activeClue.label}</b>
            <p>{activeClue.detail}</p>
          </div>
        </div>
      ) : (
        <p className="tiny muted">
          Cliquez sur l’expéditeur, l’objet urgent ou le bouton d’action ci-dessus pour analyser chaque signal.
        </p>
      )}
    </section>
  );
}

export function ModuleInteractiveLab({
  labType = 'phishing'
}: {
  labType?: 'phishing' | 'reseaux' | 'comptes' | 'generic';
}) {
  const [found, setFound] = useState<Record<string, boolean>>({});
  const [activeClue, setActiveClue] = useState<Clue | null>(null);

  if (labType === 'phishing') {
    return <PhishingInspectorLab />;
  }

  const clues = labType === 'reseaux' ? NETWORK_CLUES : labType === 'comptes' ? ACCOUNT_CLUES : GENERIC_CLUES;
  const title =
    labType === 'reseaux'
      ? 'Diagnostiquez cette configuration IP locale simulée'
      : labType === 'comptes'
        ? 'Auditez les 3 failles de ce compte de démonstration'
        : 'Validez les 3 points de contrôle avant le quiz';

  const count = Object.values(found).filter(Boolean).length;
  const inspect = (clue: Clue) => {
    setFound((prev) => ({ ...prev, [clue.id]: true }));
    setActiveClue(clue);
  };

  const rows =
    labType === 'reseaux'
      ? [
          { clue: clues[0], text: 'Interface eth0 · IP : 192.168.10.24 · Masque : 255.255.255.0 (/24)' },
          { clue: clues[1], text: 'Passerelle par défaut : 192.168.10.1 (Ping : 2 ms OK)' },
          { clue: clues[2], text: 'Serveur DNS : 192.168.99.53 (Expiration du délai sur google.com)' }
        ]
      : labType === 'comptes'
        ? [
            { clue: clues[0], text: 'Messagerie principale : même mot de passe que Forum-Ancien (2021)' },
            { clue: clues[1], text: 'Authentification multifacteur (2FA) : Désactivée' },
            { clue: clues[2], text: 'Sessions actives : Appareil courant + Navigateur inconnu (il y a 3 j)' }
          ]
        : [
            { clue: clues[0], text: '1. Relire l’objectif pédagogique et les définitions clés' },
            { clue: clues[1], text: '2. Vérifier le cas pratique ou l’erreur fréquente' },
            { clue: clues[2], text: '3. Préparer la validation sur le quiz de fin de module' }
          ];

  return (
    <section className="phishing-lab" aria-label="Atelier pratique interactif">
      <div className="phishing-lab-head">
        <div>
          <span className="eyebrow">Atelier pratique · terminal guidé</span>
          <h3>{title}</h3>
        </div>
        <span className="lab-counter tabular-nums">
          {labType === 'reseaux' ? <Network size={14} /> : labType === 'comptes' ? <KeyRound size={14} /> : <ShieldCheck size={14} />}
          {' '}
          {count} / 3 vérifiés
        </span>
      </div>

      <div className="simulated-mail">
        <div className="simulated-mail-bar">
          <span>Console d’inspection · Environnement isolé</span>
          <span className="tiny">Cliquez sur chaque ligne pour l’analyser</span>
        </div>
        <div className="simulated-mail-meta">
          {rows.map(({ clue, text }) => (
            <button
              key={clue.id}
              type="button"
              className={`clue-hotspot ${found[clue.id] ? 'inspected' : ''}`}
              onClick={() => inspect(clue)}
            >
              <span>{text}</span>
              <em>{found[clue.id] ? <CheckCircle2 size={14} /> : <Eye size={14} />}</em>
            </button>
          ))}
        </div>
      </div>

      {activeClue ? (
        <div className="clue-feedback" role="status">
          <CheckCircle2 size={16} />
          <div>
            <b>{activeClue.label}</b>
            <p>{activeClue.detail}</p>
          </div>
        </div>
      ) : (
        <p className="tiny muted">Sélectionnez les 3 éléments ci-dessus pour afficher le diagnostic détaillé.</p>
      )}
    </section>
  );
}
