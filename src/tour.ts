/**
 * Visite guidée de la page de connexion : au premier chargement, une bulle montre au testeur
 * le lien « Explorer sans compte ». Ce fichier ne contient que la logique (sans React),
 * pour pouvoir la tester.
 */

export const EXPLORE_TOUR_KEY = 'savoir-visite-explorer-v1';

/**
 * Faut-il montrer la visite ? Oui au premier chargement seulement.
 * `?tour=1` la force (pour la revoir), `?tour=0` la masque.
 */
export function shouldShowExploreTour(search: string, alreadySeen: boolean): boolean {
  const forced = new URLSearchParams(search || '').get('tour');
  if (forced === '1') return true;
  if (forced === '0') return false;
  return !alreadySeen;
}

export function readExploreTourSeen(): boolean {
  try {
    return window.localStorage.getItem(EXPLORE_TOUR_KEY) === '1';
  } catch {
    return false;
  }
}

export function markExploreTourSeen(): void {
  try {
    window.localStorage.setItem(EXPLORE_TOUR_KEY, '1');
  } catch {
    // Stockage indisponible (navigation privée stricte) : la visite reviendra au prochain chargement.
  }
}

type Box = { top: number; left: number; width: number; height: number };
type Size = { width: number; height: number };

export type CoachLayout = {
  /** Zone laissée claire autour de l'élément montré. */
  spot: Box;
  /** Position de la bulle dans la fenêtre. */
  top: number;
  left: number;
  placement: 'below' | 'above';
  /** Position horizontale de la pointe, mesurée depuis le bord gauche de la bulle. */
  arrowX: number;
};

const HALO = 6;
const GAP = 12;
const EDGE = 12;
const ARROW_INSET = 20;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

/**
 * Place la bulle sous l'élément montré si elle y tient, sinon au-dessus ;
 * elle reste toujours dans la fenêtre et sa pointe vise le centre de l'élément.
 */
export function computeCoachLayout(target: Box, bubble: Size, viewport: Size): CoachLayout {
  const spot: Box = {
    top: target.top - HALO,
    left: target.left - HALO,
    width: target.width + HALO * 2,
    height: target.height + HALO * 2
  };
  const roomBelow = viewport.height - (spot.top + spot.height) - GAP - EDGE;
  const roomAbove = spot.top - GAP - EDGE;
  const placement = roomBelow >= bubble.height || roomBelow >= roomAbove ? 'below' : 'above';
  const wantedTop = placement === 'below' ? spot.top + spot.height + GAP : spot.top - GAP - bubble.height;
  const top = clamp(wantedTop, EDGE, viewport.height - EDGE - bubble.height);
  const centre = target.left + target.width / 2;
  const left = clamp(centre - bubble.width / 2, EDGE, viewport.width - EDGE - bubble.width);
  const arrowX = clamp(centre - left, ARROW_INSET, bubble.width - ARROW_INSET);
  return { spot, top, left, placement, arrowX };
}
