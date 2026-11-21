/**
 * Effets sonores de l'interface, sur le modèle de LinkedIn : de courts sons confirment certaines actions
 * (message envoyé ou reçu, publication réussie, abonnement ou demande envoyée, demande acceptée,
 * suppression, nouvelle alerte, erreur avec bandeau rouge). Réglage « Effets sonores » dans Préférences › Préférences générales, activé par
 * défaut comme chez LinkedIn. Aucun son pour un signalement (LinkedIn n'en a pas).
 *
 * Les sons sont synthétisés dans le navigateur (Web Audio) : aucun fichier, aucun son emprunté.
 */
export type SoundName = 'msgSent' | 'msgReceived' | 'connect' | 'accepted' | 'postSuccess' | 'deleted' | 'fail' | 'notification';

type Note = { f: number; t: number; d: number; type?: OscillatorType; g?: number };

const SOUNDS: Record<SoundName, Note[]> = {
  // Envoi : une note qui monte, brève.
  msgSent: [
    { f: 880, t: 0, d: 0.09 },
    { f: 1318.5, t: 0.06, d: 0.16 }
  ],
  // Réception : deux notes douces qui descendent.
  msgReceived: [
    { f: 1174.7, t: 0, d: 0.14 },
    { f: 880, t: 0.1, d: 0.22 }
  ],
  // Suivre, demander à discuter : un pincement clair.
  connect: [
    { f: 987.8, t: 0, d: 0.12, type: 'triangle' },
    { f: 1480, t: 0.07, d: 0.18 }
  ],
  // Demande acceptée : un petit accord qui monte.
  accepted: [
    { f: 784, t: 0, d: 0.14 },
    { f: 987.8, t: 0.09, d: 0.14 },
    { f: 1174.7, t: 0.18, d: 0.28 }
  ],
  // Publication réussie : un arpège.
  postSuccess: [
    { f: 659.3, t: 0, d: 0.12 },
    { f: 784, t: 0.08, d: 0.12 },
    { f: 987.8, t: 0.16, d: 0.12 },
    { f: 1318.5, t: 0.24, d: 0.32 }
  ],
  // Suppression : deux notes graves qui descendent.
  deleted: [
    { f: 523.3, t: 0, d: 0.1, type: 'triangle' },
    { f: 392, t: 0.07, d: 0.2, type: 'triangle' }
  ],
  // Nouvelle alerte : une clochette légère.
  notification: [
    { f: 1568, t: 0, d: 0.2, g: 0.05 },
    { f: 2093, t: 0.02, d: 0.16, g: 0.025 },
    { f: 1046.5, t: 0.13, d: 0.34, g: 0.05 }
  ],
  // Erreur : plus grave encore.
  fail: [
    { f: 311.1, t: 0, d: 0.14, type: 'triangle' },
    { f: 233.1, t: 0.11, d: 0.26, type: 'triangle' }
  ]
};

let enabled = true;
let context: AudioContext | null = null;

/** Suit le réglage « Effets sonores » (activé par défaut). */
export function setSoundEffects(on: boolean) {
  enabled = on;
}

export function playSound(name: SoundName) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    context ||= new Ctx();
    const ctx = context;
    if (ctx.state === 'suspended') void ctx.resume();
    const start = ctx.currentTime + 0.01;
    for (const n of SOUNDS[name]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = n.type || 'sine';
      osc.frequency.setValueAtTime(n.f, start + n.t);
      // Attaque brève, puis extinction douce : un son net, jamais criard.
      const peak = n.g ?? 0.07;
      gain.gain.setValueAtTime(0.0001, start + n.t);
      gain.gain.exponentialRampToValueAtTime(peak, start + n.t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + n.t + n.d);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start + n.t);
      osc.stop(start + n.t + n.d + 0.02);
    }
  } catch {
    // Pas de son possible (navigateur, autorisations) : l'action reste confirmée à l'écran.
  }
}
