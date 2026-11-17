/**
 * Les illustrations des leçons, dans un seul style : un trait sombre de 2 px, des aplats pastel
 * (les deux teintes de la marque), des coins arrondis, une ombre portée décalée. Le bandeau ouvre
 * chaque leçon ; les schémas (chaîne, répartition) servent de figures dans le texte.
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

const ART_ICONS: Record<LessonArt, LucideIcon> = {
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

/** Bandeau d'ouverture d'une leçon : une fenêtre avec le pictogramme du sujet, sur un fond de formes. */
export function LessonBanner({ art }: { art: LessonArt }) {
  const Icon = ART_ICONS[art];
  return (
    <div className="rd-banner rd-wide" aria-hidden="true">
      <svg className="rd-banner-bg" viewBox="0 0 736 176" preserveAspectRatio="xMidYMid slice">
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
      </svg>
      <div className="rd-banner-window">
        <div className="rd-banner-dots">
          <i />
          <i />
          <i />
        </div>
        <div className="rd-banner-row">
          <span className="rd-banner-icon">
            <Icon size={30} strokeWidth={1.75} />
          </span>
          <span className="rd-banner-lines">
            <i />
            <i />
            <i />
          </span>
        </div>
      </div>
    </div>
  );
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
            {part.percent} %
          </span>
        ))}
      </div>
      <ul className="rd-split-legend">
        {figure.parts.map((part, i) => (
          <li key={part.label}>
            <i className={tones[i % tones.length]} aria-hidden="true" />
            <span>
              <b>
                {part.label} <span className="sr-only">: {part.percent} %</span>
              </b>
              <small>{part.note}</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
