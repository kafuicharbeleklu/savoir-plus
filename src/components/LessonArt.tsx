/**
 * Les illustrations du site, dans un seul style : un trait sombre de 2 px, des aplats pastel (les
 * deux teintes de la marque), des coins arrondis, une ombre portée décalée (voir `styles/art.css`).
 * `ArtScene` sert de vignette aux contenus et de bandeau aux modules ; les schémas (chaîne,
 * répartition) servent de figures dans le texte des leçons.
 */
import React from 'react';
import {
  CalendarCheck,
  ClipboardList,
  Cloud,
  FileCheck,
  Globe,
  HardDrive,
  History,
  KeyRound,
  Laptop,
  ListChecks,
  Mail,
  MonitorSmartphone,
  Network,
  PieChart,
  Route,
  Router,
  Search,
  Send,
  Server,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  TabletSmartphone,
  Users,
  Wallet,
  type LucideIcon
} from 'lucide-react';
import type { LessonArt, LessonFlowFigure, LessonSplitFigure } from '../content';

export const ART_ICONS: Record<LessonArt, LucideIcon> = {
  alert: ShieldAlert,
  search: Search,
  shield: ShieldCheck,
  devices: MonitorSmartphone,
  laptop: Laptop,
  switch: Network,
  router: Router,
  globe: Globe,
  server: Server,
  route: Route,
  key: KeyRound,
  phone: Smartphone,
  sessions: TabletSmartphone,
  mail: Mail,
  list: ListChecks,
  send: Send,
  wallet: Wallet,
  chart: PieChart,
  calendar: CalendarCheck,
  drive: HardDrive,
  cloud: Cloud,
  restore: History,
  people: Users,
  agenda: ClipboardList,
  done: FileCheck
};

const SPARK = 'M0 -9C1.2 -3 3 -1.2 9 0C3 1.2 1.2 3 0 9C-1.2 3 -3 1.2 -9 0C-3 -1.2 -1.2 -3 0 -9Z';

/** Un nombre stable tiré d'un texte : il choisit la variante d'une scène, toujours la même pour un même contenu. */
export function artSeed(text: string): number {
  let h = 7;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

const dots = (x: number, y: number) => (
  <g className="art-dot">
    {[0, 1, 2, 3].map((cx) => [0, 1, 2].map((cy) => <circle key={`${cx}-${cy}`} cx={x + cx * 12} cy={y + cy * 12} r="2" />))}
  </g>
);

/** Les fonds d'une vignette (320 × 200) : trois compositions des mêmes formes. */
function CardBackdrop({ layout }: { layout: number }) {
  if (layout === 1) {
    return (
      <>
        <circle className="art-fill-a" cx="286" cy="176" r="76" />
        <circle className="art-ring art-ring-1" cx="-6" cy="-24" r="62" />
        <circle className="art-ring art-ring-2" cx="-6" cy="-24" r="76" />
        <circle className="art-ring art-ring-4" cx="-6" cy="-24" r="90" />
        <circle className="art-line-b" cx="268" cy="36" r="15" />
        {dots(22, 150)}
        <path className="art-spark" d={SPARK} transform="translate(92 34) scale(0.8)" />
      </>
    );
  }
  if (layout === 2) {
    return (
      <>
        <circle className="art-fill-a" cx="30" cy="150" r="64" />
        <circle className="art-fill-b" cx="296" cy="30" r="52" />
        <circle className="art-ring art-ring-2" cx="160" cy="262" r="74" />
        <circle className="art-ring art-ring-3" cx="160" cy="262" r="88" />
        {dots(246, 142)}
        <path className="art-spark" d={SPARK} transform="translate(60 40) scale(0.8)" />
        <path className="art-spark" d={SPARK} transform="translate(258 96) scale(0.5)" />
      </>
    );
  }
  return (
    <>
      <circle className="art-fill-a" cx="34" cy="26" r="72" />
      <circle className="art-line-b" cx="58" cy="170" r="15" />
      <circle className="art-ring art-ring-1" cx="326" cy="226" r="62" />
      <circle className="art-ring art-ring-2" cx="326" cy="226" r="76" />
      <circle className="art-ring art-ring-3" cx="326" cy="226" r="90" />
      {dots(232, 22)}
      <path className="art-spark" d={SPARK} transform="translate(250 84) scale(0.8)" />
    </>
  );
}

/** Le fond d'un bandeau (736 × 176). */
function WideBackdrop() {
  return (
    <>
      <circle className="art-fill-a" cx="64" cy="34" r="92" />
      <circle className="art-line-b" cx="150" cy="148" r="24" />
      <g className="art-dot">
        {[0, 1, 2, 3].map((x) => [0, 1, 2].map((y) => <circle key={`${x}-${y}`} cx={196 + x * 14} cy={30 + y * 14} r="2.2" />))}
      </g>
      <circle className="art-ring art-ring-1" cx="700" cy="236" r="112" />
      <circle className="art-ring art-ring-2" cx="700" cy="236" r="132" />
      <circle className="art-ring art-ring-3" cx="700" cy="236" r="152" />
      <circle className="art-ring art-ring-4" cx="700" cy="236" r="172" />
      <path className="art-spark" d={SPARK} transform="translate(536 40)" />
      <path className="art-spark" d={SPARK} transform="translate(236 136) scale(0.6)" />
    </>
  );
}

export type ArtFrame = 'window' | 'sheet' | 'route';

/**
 * Une illustration : un fond de formes et, au centre, un objet qui porte le pictogramme du sujet
 * (une fenêtre pour un module, une feuille pour une fiche, des étapes pour un parcours).
 * `seed` fixe la variante : composition du fond, sens, teinte qui mène.
 */
export function ArtScene({
  icon,
  frame = 'window',
  seed = '',
  wide = false,
  className = ''
}: {
  icon: React.ReactNode;
  frame?: ArtFrame;
  seed?: string;
  /** Grand format (bandeau) : objet plus grand, fond étiré. */
  wide?: boolean;
  className?: string;
}) {
  const h = artSeed(seed);
  const classes = ['art-scene', wide ? 'is-wide' : '', !wide && h % 2 === 1 ? 'is-flip' : '', (h >> 1) % 2 === 1 ? 'is-b' : '', className].filter(Boolean).join(' ');
  const lines = (
    <span className="art-lines">
      <i />
      <i />
      <i />
    </span>
  );
  return (
    <div className={classes} aria-hidden="true">
      <svg className="art-scene-bg" viewBox={wide ? '0 0 736 176' : '0 0 320 200'} preserveAspectRatio="xMidYMid slice">
        {wide ? <WideBackdrop /> : <CardBackdrop layout={(h >> 2) % 3} />}
      </svg>
      {frame === 'window' && (
        <div className="art-window">
          <div className="art-window-bar">
            <i />
            <i />
            <i />
          </div>
          <div className="art-window-row">
            <span className="art-icon">{icon}</span>
            {lines}
          </div>
        </div>
      )}
      {frame === 'sheet' && (
        <div className="art-sheet">
          <span className="art-icon">{icon}</span>
          {lines}
        </div>
      )}
      {frame === 'route' && (
        <div className="art-route">
          <i />
          <b />
          <span className="art-icon">{icon}</span>
          <b />
          <i />
        </div>
      )}
    </div>
  );
}

/** Bandeau d'ouverture d'un module : la scène en grand format, avec le pictogramme du sujet. */
export function LessonBanner({ art, seed = '' }: { art: LessonArt; seed?: string }) {
  const Icon = ART_ICONS[art];
  return <ArtScene wide seed={seed} className="rd-banner rd-wide" icon={<Icon size={26} strokeWidth={1.75} />} />;
}

/** Pastille illustrée : le pictogramme d'une partie, à côté de son titre. */
export function ArtBadge({ art }: { art: LessonArt }) {
  const Icon = ART_ICONS[art];
  return (
    <span className="rd-art-badge" aria-hidden="true">
      <Icon size={22} strokeWidth={1.75} />
    </span>
  );
}

/** Schéma en chaîne : des éléments reliés par des flèches nommées. */
export function FlowFigure({ figure }: { figure: LessonFlowFigure }) {
  return (
    <ol className="rd-flow">
      {figure.nodes.map((node, i) => {
        const Icon = ART_ICONS[node.art];
        const link = figure.links[i];
        return (
          <React.Fragment key={node.label}>
            <li className="rd-flow-node">
              <span className="rd-flow-icon" aria-hidden="true">
                <Icon size={24} strokeWidth={1.75} />
              </span>
              <b>{node.label}</b>
              {node.sub && <small>{node.sub}</small>}
            </li>
            {i < figure.nodes.length - 1 && (
              <li className="rd-flow-link">
                {link ? <span className="rd-flow-pill">{link}</span> : <span className="sr-only">puis</span>}
              </li>
            )}
          </React.Fragment>
        );
      })}
    </ol>
  );
}

/** Répartition : une barre découpée en parts, et sa légende. */
export function SplitFigure({ figure }: { figure: LessonSplitFigure }) {
  const tones = ['is-a', 'is-b', 'is-c', 'is-d'];
  return (
    <div className="rd-split">
      <div className="rd-split-bar" aria-hidden="true">
        {figure.parts.map((part, i) => (
          <span key={part.label} className={tones[i % tones.length]} style={{ flexGrow: part.percent }}>
            {part.percent.toLocaleString('fr-FR')} %
          </span>
        ))}
      </div>
      <ul className="rd-split-legend">
        {figure.parts.map((part, i) => (
          <li key={part.label}>
            <i className={tones[i % tones.length]} aria-hidden="true" />
            <span>
              <b>
                {part.label} <span className="sr-only">: {part.percent.toLocaleString('fr-FR')} %</span>
              </b>
              <small>{part.note}</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
