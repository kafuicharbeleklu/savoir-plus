/**
 * Infobulles de l'application : elles remplacent les infobulles grises du navigateur.
 * Tout élément qui porte un attribut `title` (ou `data-tip`) en bénéficie, sans rien changer
 * dans les composants : au survol ou au focus clavier, le texte s'affiche dans une bulle sobre,
 * placée sous l'élément (ou au-dessus s'il n'y a pas la place).
 */

const SHOW_DELAY_MS = 350;
const GAP = 8;
const EDGE = 8;

export function installTooltips() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const flagged = window as unknown as { __savoirTooltips?: boolean };
  if (flagged.__savoirTooltips) return;
  flagged.__savoirTooltips = true;

  const bubble = document.createElement('div');
  bubble.className = 'ui-tooltip';
  bubble.setAttribute('role', 'tooltip');
  bubble.hidden = true;
  document.body.appendChild(bubble);

  let current: Element | null = null;
  let timer = 0;

  /** Reprend le texte de `title` : l'infobulle du navigateur ne doit pas s'afficher en double. */
  const adopt = (el: Element): string => {
    const native = el.getAttribute('title');
    if (native) {
      el.setAttribute('data-tip', native);
      el.removeAttribute('title');
      // Un bouton sans texte tirait son nom accessible de `title` : on le conserve.
      if (!el.getAttribute('aria-label') && !(el.textContent || '').trim()) el.setAttribute('aria-label', native);
    }
    return el.getAttribute('data-tip') || '';
  };

  const place = (el: Element) => {
    const box = el.getBoundingClientRect();
    const tip = bubble.getBoundingClientRect();
    let top = box.bottom + GAP;
    if (top + tip.height > window.innerHeight - EDGE) top = box.top - GAP - tip.height;
    let left = box.left + box.width / 2 - tip.width / 2;
    left = Math.max(EDGE, Math.min(left, window.innerWidth - EDGE - tip.width));
    bubble.style.top = `${Math.max(EDGE, top)}px`;
    bubble.style.left = `${left}px`;
  };

  const hide = () => {
    window.clearTimeout(timer);
    current = null;
    bubble.classList.remove('is-on');
    bubble.hidden = true;
  };

  const show = (el: Element) => {
    const text = adopt(el);
    // Texte entièrement visible dans l'élément : l'infobulle ne ferait que le répéter.
    if (!text || !el.isConnected || (el.textContent || '').trim() === text.trim() && !isTruncated(el)) return;
    current = el;
    bubble.textContent = text;
    bubble.hidden = false;
    place(el);
    bubble.classList.add('is-on');
  };

  const isTruncated = (el: Element) => {
    const node = el as HTMLElement;
    return node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1;
  };

  const targetOf = (event: Event): Element | null => {
    const start = event.target as Element | null;
    if (!start || typeof start.closest !== 'function') return null;
    return start.closest('[title], [data-tip]');
  };

  document.addEventListener('mouseover', (event) => {
    const el = targetOf(event);
    if (el === current) return;
    hide();
    if (!el) return;
    adopt(el);
    timer = window.setTimeout(() => show(el), SHOW_DELAY_MS);
  });

  document.addEventListener('mouseout', (event) => {
    const el = targetOf(event);
    if (!el) return;
    const next = (event as MouseEvent).relatedTarget as Node | null;
    if (next && el.contains(next)) return;
    hide();
  });

  document.addEventListener('focusin', (event) => {
    const el = targetOf(event);
    if (!el) return;
    adopt(el);
    // Au clavier seulement : un clic de souris ne doit pas faire apparaître la bulle.
    try {
      if (!(event.target as Element).matches(':focus-visible')) return;
    } catch {
      return;
    }
    hide();
    show(el);
  });

  document.addEventListener('focusout', hide);
  document.addEventListener('mousedown', hide, true);
  document.addEventListener('scroll', hide, true);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hide();
  });
  window.addEventListener('blur', hide);
}
