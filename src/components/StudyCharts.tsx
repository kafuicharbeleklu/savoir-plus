/**
 * Progression d'un membre sur son profil, d'après le profil HackTheBox (« Machines Completed »,
 * « Difficulty Completion ») et les règles de visualisation du projet :
 * - trois tuiles de compteurs (« 2 / 7 Modules validés »…) ;
 * - « Séances de révision » : courbe en aire des minutes révisées par semaine sur huit semaines, tirée du
 *   journal daté du calendrier (une seule série : pas de légende ; ligne verticale qui suit le pointeur,
 *   bulle d'information, clavier ; tableau pour les lecteurs d'écran) ;
 * - « Complétion par niveau » : des anneaux concentriques comme sur HackTheBox, un par niveau, de
 *   l'extérieur (Débutant) vers l'intérieur ; la légende donne chaque valeur en toutes lettres.
 */
import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, CheckCircle2, Layers } from 'lucide-react';
import type { SessionLog } from '../calendar';
import { addDays, todayDay } from '../calendar';
import type { MemberStats } from '../memberStats';

const WEEKS = 8;
const LEVELS = ['Débutant', 'Intermédiaire', 'Avancé'] as const;
const dayShort = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const label = (day: string) => dayShort.format(new Date(`${day}T12:00:00`));

/** Minutes et séances par semaine glissante, la plus récente à droite. */
function weeklyBuckets(log: SessionLog[], today: string) {
  return Array.from({ length: WEEKS }, (_, i) => {
    const end = addDays(today, -7 * (WEEKS - 1 - i));
    const start = addDays(end, -6);
    const inWeek = log.filter((s) => s.day >= start && s.day <= end);
    return { start, end, minutes: inWeek.reduce((acc, s) => acc + s.minutes, 0), sessions: inWeek.length };
  });
}

/** Une graduation ronde au-dessus du maximum (30, 60, 90, 120, 180, 240…). */
function niceMax(max: number) {
  const steps = [30, 60, 90, 120, 180, 240, 300, 360, 480, 600, 900, 1200];
  return steps.find((s) => s >= max) || Math.ceil(max / 600) * 600;
}

function RevisionChart({ log, onOpenCalendar }: { log: SessionLog[]; onOpenCalendar?: () => void }) {
  const data = weeklyBuckets(log, todayDay());
  const [active, setActive] = useState<number | null>(null);
  const hasData = data.some((d) => d.minutes > 0);
  // Le graphique se dessine à la largeur réelle de son cadre : les étiquettes gardent leur taille.
  const plotRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);
  useEffect(() => {
    const el = plotRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(260, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasData]);

  const W = width;
  const H = 210;
  const pad = { left: 40, right: 14, top: 14, bottom: 28 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;
  const max = niceMax(Math.max(...data.map((d) => d.minutes), 1));
  const x = (i: number) => pad.left + (i * plotW) / (data.length - 1);
  const y = (v: number) => pad.top + plotH - (v / max) * plotH;
  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.minutes).toFixed(1)}`).join(' ');
  const area = `${line} L${x(data.length - 1).toFixed(1)},${(pad.top + plotH).toFixed(1)} L${x(0).toFixed(1)},${(pad.top + plotH).toFixed(1)} Z`;
  const ticks = [0, max / 2, max];

  const pick = (clientX: number, rect: DOMRect) => {
    const px = ((clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - pad.left) / plotW) * (data.length - 1));
    setActive(Math.max(0, Math.min(data.length - 1, i)));
  };

  if (!hasData) {
    return (
      <div className="sc-empty">
        <p>Aucune séance de révision sur les huit dernières semaines.</p>
        {onOpenCalendar && (
          <button type="button" className="li-text-link" onClick={onOpenCalendar}>
            Ouvrir le calendrier
          </button>
        )}
      </div>
    );
  }

  const a = active === null ? null : data[active];
  return (
    <div className="sc-area">
      <div
        ref={plotRef}
        className="sc-plot"
        tabIndex={0}
        role="group"
        aria-label="Minutes de révision par semaine, huit dernières semaines. Flèches gauche et droite pour parcourir."
        onFocus={() => setActive((v) => (v === null ? data.length - 1 : v))}
        onBlur={() => setActive(null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setActive((v) => Math.max(0, (v ?? data.length - 1) - 1));
          if (e.key === 'ArrowRight') setActive((v) => Math.min(data.length - 1, (v ?? 0) + 1));
        }}
        onPointerMove={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerLeave={() => setActive(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="sc-svg" aria-hidden="true">
          {ticks.map((t) => (
            <g key={t}>
              <line className="sc-grid" x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} />
              <text className="sc-axis" x={pad.left - 8} y={y(t) + 4} textAnchor="end">
                {Math.round(t)}
              </text>
            </g>
          ))}
          {[0, Math.floor((data.length - 1) / 2), data.length - 1].map((i) => (
            <text key={i} className="sc-axis" x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}>
              {label(data[i].end)}
            </text>
          ))}
          <path className="sc-fill" d={area} />
          <path className="sc-line" d={line} />
          {active !== null && <line className="sc-cross" x1={x(active)} x2={x(active)} y1={pad.top} y2={pad.top + plotH} />}
          {data.map((d, i) => (
            <circle key={d.end} className={`sc-dot${i === active ? ' is-active' : ''}`} cx={x(i)} cy={y(d.minutes)} r={i === active ? 5 : 4} />
          ))}
          {/* Valeur directe : la dernière semaine seulement. */}
          <text className="sc-end" x={x(data.length - 1) - 8} y={y(data[data.length - 1].minutes) - 10} textAnchor="end">
            {data[data.length - 1].minutes} min
          </text>
        </svg>
        {a && (
          <div
            className={`sc-tip${active === 0 ? ' is-start' : active === data.length - 1 ? ' is-end' : ''}`}
            style={{ left: `${(x(active!) / W) * 100}%` }}
            role="status"
          >
            <b className="tabular-nums">{a.minutes} min</b>
            <span>
              {a.sessions} séance{a.sessions > 1 ? 's' : ''} · du {label(a.start)} au {label(a.end)}
            </span>
          </div>
        )}
      </div>
      {/* Les mêmes valeurs, en tableau, pour les lecteurs d'écran. */}
      <table className="sr-only">
        <caption>Minutes de révision par semaine</caption>
        <thead>
          <tr>
            <th scope="col">Semaine</th>
            <th scope="col">Minutes</th>
            <th scope="col">Séances</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.end}>
              <th scope="row">
                du {label(d.start)} au {label(d.end)}
              </th>
              <td>{d.minutes}</td>
              <td>{d.sessions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * « Complétion par niveau », fidèle à « Difficulty Completion » de HackTheBox : des bandes concentriques,
 * le niveau le plus facile au centre et le plus difficile à l'extérieur ; sur chaque bande, un arc fin qui
 * part de midi (vert, ambre, rouge), avec un point de départ même à 0 % ; un point au centre. Pas de
 * légende ni de chiffre : la bulle nomme le niveau au survol ou au clavier (flèches), et la liste
 * masquée donne toutes les valeurs aux lecteurs d'écran.
 */
function LevelRings({ levels }: { levels: { lvl: string; done: number; total: number }[] }) {
  const [active, setActive] = useState<number | null>(null);
  // De l'extérieur vers l'intérieur : le plus difficile d'abord.
  const rings = [...levels].reverse();
  const size = 200;
  const c = size / 2;
  const band = 20;
  const gap = 4;
  const tone = (lvl: string) => (lvl === 'Débutant' ? 'easy' : lvl === 'Intermédiaire' ? 'medium' : 'hard');
  const shown = active === null ? null : rings[active];
  return (
    <div className="sc-rings">
      <div
        className="sc-rings-plot"
        tabIndex={0}
        role="group"
        aria-label="Complétion par niveau. Flèches haut et bas pour parcourir les anneaux."
        onFocus={() => setActive((v) => (v === null ? rings.length - 1 : v))}
        onBlur={() => setActive(null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') setActive((v) => Math.max(0, (v ?? rings.length) - 1));
          if (e.key === 'ArrowDown' || e.key === 'ArrowRight') setActive((v) => Math.min(rings.length - 1, (v ?? -1) + 1));
        }}
      >
        <svg viewBox={`0 0 ${size} ${size}`} className="sc-rings-svg" aria-hidden="true">
          {rings.map((l, i) => {
            const r = c - band / 2 - 2 - i * (band + gap);
            const circ = 2 * Math.PI * r;
            const pct = l.total ? l.done / l.total : 0;
            return (
              <g
                key={l.lvl}
                className={`sc-ring is-${tone(l.lvl)}${active !== null && active !== i ? ' is-dim' : ''}`}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
              >
                <circle className="sc-ring-track" cx={c} cy={c} r={r} strokeWidth={band} />
                <circle
                  className="sc-ring-fill"
                  cx={c}
                  cy={c}
                  r={r}
                  strokeWidth={5}
                  strokeDasharray={`${Math.max(0.01, pct * circ).toFixed(2)} ${circ.toFixed(2)}`}
                  transform={`rotate(-90 ${c} ${c})`}
                />
                {/* Zone de survol : toute la bande. */}
                <circle className="sc-ring-hit" cx={c} cy={c} r={r} strokeWidth={band + gap} />
              </g>
            );
          })}
          <circle className="sc-ring-core" cx={c} cy={c} r={9} />
        </svg>
        {shown && (
          <div className="sc-tip sc-rings-tip" role="status">
            <b className="tabular-nums">
              {shown.done} / {shown.total}
            </b>
            <span>{shown.lvl} · modules validés</span>
          </div>
        )}
      </div>
      <ul className="sr-only">
        {levels.map((l) => (
          <li key={l.lvl}>
            {l.lvl} : {l.done} module{l.done > 1 ? 's' : ''} validé{l.done > 1 ? 's' : ''} sur {l.total}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StudyCharts({ stats, log, onOpenCalendar }: { stats: MemberStats; log: SessionLog[]; onOpenCalendar?: () => void }) {
  const modulesTotal = stats.moduleMetrics.length;
  const lessonsTotal = stats.moduleMetrics.reduce((acc, m) => acc + m.lessonCount, 0);
  const allSkills = Array.from(new Set(stats.moduleMetrics.flatMap((m) => m.mod.skills || [])));
  const validatedSkills = stats.skills.filter((s) => s.validated).length;
  const tiles = [
    { icon: <BookOpen size={20} aria-hidden="true" />, value: stats.passedQuizzes.length, total: modulesTotal, label: 'Modules validés' },
    { icon: <Layers size={20} aria-hidden="true" />, value: Math.min(stats.completedLessonsCount, lessonsTotal), total: lessonsTotal, label: 'Sections lues' },
    { icon: <CheckCircle2 size={20} aria-hidden="true" />, value: validatedSkills, total: allSkills.length, label: 'Compétences validées' }
  ];
  const levels = LEVELS.map((lvl) => {
    const mods = stats.moduleMetrics.filter((m) => m.mod.level === lvl);
    return { lvl, total: mods.length, done: mods.filter((m) => m.passed).length };
  });

  return (
    <div className="sc">
      <ul className="sc-tiles">
        {tiles.map((t) => (
          <li key={t.label} className="sc-tile">
            <span className="sc-tile-icon">{t.icon}</span>
            <span className="sc-tile-text">
              <b className="tabular-nums">
                {t.value}
                <span> / {t.total}</span>
              </b>
              <small>{t.label}</small>
            </span>
          </li>
        ))}
      </ul>
      <div className="sc-panels">
        <section className="sc-panel" aria-labelledby="sc-rev-title">
          <h3 id="sc-rev-title">Séances de révision</h3>
          <p className="sc-sub">Minutes par semaine · 8 dernières semaines</p>
          <RevisionChart log={log} onOpenCalendar={onOpenCalendar} />
        </section>
        <section className="sc-panel" aria-labelledby="sc-lvl-title">
          <h3 id="sc-lvl-title">Complétion par niveau</h3>
          <p className="sc-sub">Débutant au centre · Avancé à l’extérieur</p>
          <LevelRings levels={levels} />
        </section>
      </div>
    </div>
  );
}
