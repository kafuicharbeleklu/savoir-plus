/**
 * Couvertures par sujet : une composition par contenu, jamais la même, dans le style des illustrations
 * du site (trait sombre, aplats pastel, arcs indigo et terre cuite, pointillés). Les couleurs passent par
 * les variables des illustrations (src/styles/art.css), pour suivre le thème clair comme le sombre.
 * Un contenu sans couverture garde l'illustration générique (fenêtre, fiche ou parcours).
 */
import React, { useId } from 'react';

type CoverKey = 'phish' | 'reseau' | 'sauv' | 'comptes' | 'email' | 'budget' | 'reunion' | 'clavier' | 'lien' | 'suites';

const COVERS: Record<CoverKey, { label: string; draw: (dots: string) => React.ReactNode }> = {
  phish: {
    label: 'enveloppe et hameçon',
    draw: (dots) => (
      <>
      <rect width="320" height="200" style={{ fill: 'var(--cover-lav)' }} />
      <circle cx="0" cy="200" r="72" fill="none" strokeWidth="9" style={{ stroke: 'var(--art-a)' }} />
      <circle cx="0" cy="200" r="53" fill="none" strokeWidth="9" style={{ stroke: 'var(--art-b)' }} />
      <rect x="240" y="22" width="50" height="34" fill={`url(#${dots})`} />
      <path d="M190 0v54" strokeWidth="3" style={{ stroke: 'var(--art-ink)' }} />
      <path d="M190 54v24a12 12 0 0 1-24 0v-7" fill="none" strokeWidth="4.5" strokeLinecap="round" style={{ stroke: 'var(--art-b)' }} />
      <g transform="rotate(-8 162 128)">
      <rect x="102" y="92" width="122" height="80" rx="6" strokeWidth="3" style={{ fill: 'var(--art-paper)', stroke: 'var(--art-ink)' }} />
      <path d="M102 98l61 40 61-40" fill="none" strokeWidth="3" strokeLinejoin="round" style={{ stroke: 'var(--art-ink)' }} />
      </g>
      <circle cx="238" cy="94" r="14" strokeWidth="3" style={{ fill: 'var(--art-b)', stroke: 'var(--art-ink)' }} />
      <path d="M238 87v8M238 101v.5" strokeWidth="3.2" strokeLinecap="round" style={{ stroke: 'var(--art-paper)' }} />
      <path d="M282 146l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" style={{ fill: 'var(--art-ink)' }} />
      </>
    )
  },
  reseau: {
    label: 'ordinateur, routeur et Internet',
    draw: (dots) => (
      <>
      <rect width="320" height="200" style={{ fill: 'var(--cover-sand)' }} />
      <circle cx="320" cy="0" r="66" fill="none" strokeWidth="9" style={{ stroke: 'var(--art-a)' }} />
      <circle cx="320" cy="0" r="47" fill="none" strokeWidth="9" style={{ stroke: 'var(--art-b)' }} />
      <rect x="22" y="148" width="50" height="32" fill={`url(#${dots})`} />
      <path d="M106 118h32M198 118h32" strokeWidth="3" strokeDasharray="2 7" strokeLinecap="round" style={{ stroke: 'var(--art-ink)' }} />
      <rect x="48" y="86" width="58" height="40" rx="4" strokeWidth="3" style={{ fill: 'var(--art-paper)', stroke: 'var(--art-ink)' }} />
      <path d="M40 133h74" strokeWidth="3" strokeLinecap="round" style={{ stroke: 'var(--art-ink)' }} />
      <path d="M154 100V82M182 100V82" strokeWidth="3" strokeLinecap="round" style={{ stroke: 'var(--art-ink)' }} />
      <rect x="140" y="100" width="58" height="36" rx="5" strokeWidth="3" style={{ fill: 'var(--art-a)', stroke: 'var(--art-ink)' }} />
      <circle cx="156" cy="118" r="3.2" style={{ fill: 'var(--art-paper)' }} />
      <circle cx="168" cy="118" r="3.2" style={{ fill: 'var(--art-paper)' }} />
      <circle cx="258" cy="118" r="27" strokeWidth="3" style={{ fill: 'var(--art-paper)', stroke: 'var(--art-ink)' }} />
      <ellipse cx="258" cy="118" rx="11" ry="27" fill="none" strokeWidth="2.5" style={{ stroke: 'var(--art-ink)' }} />
      <path d="M231 118h54" strokeWidth="2.5" style={{ stroke: 'var(--art-ink)' }} />
      <path d="M44 42l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" style={{ fill: 'var(--art-ink)' }} />
      </>
    )
  },
  sauv: {
    label: 'trois copies',
    draw: (dots) => (
      <>
      <rect width="320" height="200" style={{ fill: 'var(--cover-peach)' }} />
      <circle cx="0" cy="0" r="66" fill="none" strokeWidth="9" style={{ stroke: 'var(--art-a)' }} />
      <circle cx="0" cy="0" r="47" fill="none" strokeWidth="9" style={{ stroke: 'var(--art-b)' }} />
      <rect x="252" y="150" width="50" height="32" fill={`url(#${dots})`} />
      <path d="M72 56h42l16 16v76H72z" strokeWidth="3" strokeLinejoin="round" style={{ fill: 'var(--art-paper)', stroke: 'var(--art-ink)' }} />
      <path d="M84 90h34M84 104h34M84 118h22" strokeWidth="2.5" strokeLinecap="round" style={{ stroke: 'var(--art-ink)' }} />
      <rect x="150" y="68" width="60" height="34" rx="5" strokeWidth="3" style={{ fill: 'var(--art-paper)', stroke: 'var(--art-ink)' }} />
      <circle cx="196" cy="85" r="4" style={{ fill: 'var(--art-a)' }} />
      <rect x="150" y="112" width="60" height="34" rx="5" strokeWidth="3" style={{ fill: 'var(--art-a)', stroke: 'var(--art-ink)' }} />
      <circle cx="196" cy="129" r="4" style={{ fill: 'var(--art-paper)' }} />
      <path d="M232 122a15 15 0 0 1 3-30 22 22 0 0 1 42 5 14 14 0 0 1 2 25z" strokeWidth="3.2" strokeLinejoin="round" style={{ fill: 'var(--art-paper)', stroke: 'var(--art-b)' }} />
      <g fontFamily="Inter, system-ui, sans-serif" fontSize="17" fontWeight="700" textAnchor="middle" style={{ fill: 'var(--art-ink)' }}>
      <text x="101" y="176">
      3
      </text>
      <text x="180" y="176">
      2
      </text>
      <text x="256" y="148">
      1
      </text>
      </g>
      </>
    )
  },
  comptes: {
    label: 'cadenas et clé',
    draw: (dots) => (
      <>
      <rect width="320" height="200" style={{ fill: 'var(--cover-lav)' }} />
      <circle cx="320" cy="200" r="70" fill="none" strokeWidth="9" style={{ stroke: 'var(--art-b)' }} />
      <circle cx="320" cy="200" r="51" fill="none" strokeWidth="9" style={{ stroke: 'var(--art-a)' }} />
      <rect x="24" y="24" width="50" height="32" fill={`url(#${dots})`} />
      <rect x="54" y="130" width="124" height="32" rx="6" strokeWidth="3" style={{ fill: 'var(--art-paper)', stroke: 'var(--art-ink)' }} />
      <g style={{ fill: 'var(--art-ink)' }}>
      <circle cx="74" cy="146" r="4" />
      <circle cx="90" cy="146" r="4" />
      <circle cx="106" cy="146" r="4" />
      <circle cx="122" cy="146" r="4" />
      <circle cx="138" cy="146" r="4" />
      </g>
      <path d="M182 90V74a22 22 0 0 1 44 0v16" fill="none" strokeWidth="4.5" style={{ stroke: 'var(--art-ink)' }} />
      <rect x="168" y="88" width="72" height="58" rx="7" strokeWidth="3" style={{ fill: 'var(--art-a)', stroke: 'var(--art-ink)' }} />
      <circle cx="204" cy="111" r="7" style={{ fill: 'var(--art-paper)' }} />
      <path d="M204 115v13" strokeWidth="4" strokeLinecap="round" style={{ stroke: 'var(--art-paper)' }} />
      <circle cx="84" cy="74" r="14" strokeWidth="3" style={{ fill: 'var(--art-b)', stroke: 'var(--art-ink)' }} />
      <path d="M98 74h40M126 74v10M134 74v8" strokeWidth="3" strokeLinecap="round" style={{ stroke: 'var(--art-ink)' }} />
      <path d="M270 44l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" style={{ fill: 'var(--art-ink)' }} />
      </>
    )
  },
  email: {
    label: 'lettre et plume',
    draw: (dots) => (
      <>
      <rect width="320" height="200" style={{ fill: 'var(--cover-sand)' }} />
      <circle cx="0" cy="200" r="70" fill="none" strokeWidth="9" style={{ stroke: 'var(--art-b)' }} />
      <circle cx="0" cy="200" r="51" fill="none" strokeWidth="9" style={{ stroke: 'var(--art-a)' }} />
      <rect x="252" y="150" width="50" height="32" fill={`url(#${dots})`} />
      <rect x="96" y="38" width="114" height="134" rx="6" strokeWidth="3" style={{ fill: 'var(--art-paper)', stroke: 'var(--art-ink)' }} />
      <rect x="112" y="58" width="56" height="12" rx="2" style={{ fill: 'var(--art-a-soft)' }} />
      <path d="M114 64h50M114 88h78M114 102h78M114 116h62M114 140h42" strokeWidth="2.5" strokeLinecap="round" style={{ stroke: 'var(--art-ink)' }} />
      <circle cx="214" cy="50" r="17" strokeWidth="3" style={{ fill: 'var(--art-a)', stroke: 'var(--art-ink)' }} />
      <text x="214" y="57" fontFamily="Inter, system-ui, sans-serif" fontSize="18" fontWeight="700" textAnchor="middle" style={{ fill: 'var(--art-paper)' }}>
      @
      </text>
      <g transform="rotate(34 240 126)">
      <rect x="232" y="76" width="16" height="72" rx="3" strokeWidth="3" style={{ fill: 'var(--art-b)', stroke: 'var(--art-ink)' }} />
      <path d="M232 148l8 18 8-18" strokeWidth="3" strokeLinejoin="round" style={{ fill: 'var(--art-paper)', stroke: 'var(--art-ink)' }} />
      </g>
      </>
    )
  },
  budget: {
    label: 'carnet et pièces',
    draw: (dots) => (
      <>
      <rect width="320" height="200" style={{ fill: 'var(--cover-peach)' }} />
      <circle cx="320" cy="0" r="66" fill="none" strokeWidth="9" style={{ stroke: 'var(--art-b)' }} />
      <circle cx="320" cy="0" r="47" fill="none" strokeWidth="9" style={{ stroke: 'var(--art-a)' }} />
      <rect x="22" y="22" width="50" height="32" fill={`url(#${dots})`} />
      <rect x="66" y="52" width="116" height="120" rx="6" strokeWidth="3" style={{ fill: 'var(--art-paper)', stroke: 'var(--art-ink)' }} />
      <g style={{ fill: 'var(--art-ink)' }}>
      <circle cx="66" cy="74" r="3.5" />
      <circle cx="66" cy="98" r="3.5" />
      <circle cx="66" cy="122" r="3.5" />
      <circle cx="66" cy="146" r="3.5" />
      </g>
      <rect x="90" y="120" width="16" height="32" style={{ fill: 'var(--art-a)' }} />
      <rect x="114" y="102" width="16" height="50" style={{ fill: 'var(--art-a)' }} />
      <rect x="138" y="86" width="16" height="66" style={{ fill: 'var(--art-b)' }} />
      <path d="M86 152h76" strokeWidth="2.5" strokeLinecap="round" style={{ stroke: 'var(--art-ink)' }} />
      <circle cx="244" cy="116" r="22" strokeWidth="3" style={{ fill: 'var(--art-b)', stroke: 'var(--art-ink)' }} />
      <circle cx="218" cy="142" r="22" strokeWidth="3" style={{ fill: 'var(--art-paper)', stroke: 'var(--art-ink)' }} />
      <text x="218" y="149" fontFamily="Inter, system-ui, sans-serif" fontSize="18" fontWeight="700" textAnchor="middle" style={{ fill: 'var(--art-ink)' }}>
      F
      </text>
      <path d="M276 156l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" style={{ fill: 'var(--art-ink)' }} />
      </>
    )
  },
  reunion: {
    label: 'ordre du jour et horloge',
    draw: (dots) => (
      <>
      <rect width="320" height="200" style={{ fill: 'var(--cover-lav)' }} />
      <circle cx="320" cy="200" r="70" fill="none" strokeWidth="9" style={{ stroke: 'var(--art-a)' }} />
      <circle cx="320" cy="200" r="51" fill="none" strokeWidth="9" style={{ stroke: 'var(--art-b)' }} />
      <rect x="24" y="148" width="50" height="32" fill={`url(#${dots})`} />
      <rect x="88" y="44" width="106" height="134" rx="6" strokeWidth="3" style={{ fill: 'var(--art-paper)', stroke: 'var(--art-ink)' }} />
      <rect x="119" y="34" width="44" height="18" rx="4" strokeWidth="3" style={{ fill: 'var(--art-a)', stroke: 'var(--art-ink)' }} />
      <rect x="104" y="74" width="13" height="13" rx="2" strokeWidth="2" style={{ fill: 'var(--art-a)', stroke: 'var(--art-ink)' }} />
      <path d="M126 80h52" strokeWidth="2.5" strokeLinecap="round" style={{ stroke: 'var(--art-ink)' }} />
      <rect x="104" y="100" width="13" height="13" rx="2" strokeWidth="2" style={{ fill: 'var(--art-a)', stroke: 'var(--art-ink)' }} />
      <path d="M126 106h42" strokeWidth="2.5" strokeLinecap="round" style={{ stroke: 'var(--art-ink)' }} />
      <rect x="104" y="126" width="13" height="13" rx="2" strokeWidth="2" style={{ fill: 'var(--art-paper)', stroke: 'var(--art-ink)' }} />
      <path d="M126 132h48" strokeWidth="2.5" strokeLinecap="round" style={{ stroke: 'var(--art-ink)' }} />
      <circle cx="234" cy="120" r="29" strokeWidth="3" style={{ fill: 'var(--art-paper)', stroke: 'var(--art-ink)' }} />
      <path d="M234 101v19l13 8" fill="none" strokeWidth="3.6" strokeLinecap="round" style={{ stroke: 'var(--art-b)' }} />
      <path d="M44 40l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" style={{ fill: 'var(--art-ink)' }} />
      </>
    )
  },
  clavier: {
    label: 'clavier',
    draw: (dots) => (
      <>
      <rect width="320" height="200" style={{ fill: 'var(--cover-sand)' }} />
      <circle cx="0" cy="0" r="66" fill="none" strokeWidth="9" style={{ stroke: 'var(--art-b)' }} />
      <circle cx="0" cy="0" r="47" fill="none" strokeWidth="9" style={{ stroke: 'var(--art-a)' }} />
      <rect x="250" y="24" width="50" height="32" fill={`url(#${dots})`} />
      <rect x="54" y="68" width="212" height="96" rx="8" strokeWidth="3" style={{ fill: 'var(--art-paper)', stroke: 'var(--art-ink)' }} />
      <g fill="none" strokeWidth="2.2" style={{ stroke: 'var(--art-ink)' }}>
      <rect x="68" y="82" width="22" height="18" rx="3" />
      <rect x="96" y="82" width="22" height="18" rx="3" />
      <rect x="124" y="82" width="22" height="18" rx="3" />
      <rect x="152" y="82" width="22" height="18" rx="3" />
      <rect x="180" y="82" width="22" height="18" rx="3" />
      <rect x="208" y="82" width="22" height="18" rx="3" />
      <rect x="236" y="82" width="16" height="18" rx="3" />
      <rect x="74" y="108" width="22" height="18" rx="3" />
      <rect x="130" y="108" width="22" height="18" rx="3" />
      <rect x="158" y="108" width="22" height="18" rx="3" />
      <rect x="186" y="108" width="22" height="18" rx="3" />
      <rect x="214" y="108" width="36" height="18" rx="3" />
      <rect x="108" y="136" width="104" height="16" rx="3" />
      </g>
      <rect x="102" y="108" width="22" height="18" rx="3" strokeWidth="2.2" style={{ fill: 'var(--art-b)', stroke: 'var(--art-ink)' }} />
      <text x="113" y="122" fontFamily="Inter, system-ui, sans-serif" fontSize="12" fontWeight="700" textAnchor="middle" style={{ fill: 'var(--art-paper)' }}>
      A
      </text>
      <path d="M276 150l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" style={{ fill: 'var(--art-ink)' }} />
      </>
    )
  },
  lien: {
    label: 'lien et loupe',
    draw: (dots) => (
      <>
      <rect width="320" height="200" style={{ fill: 'var(--cover-peach)' }} />
      <circle cx="0" cy="200" r="70" fill="none" strokeWidth="9" style={{ stroke: 'var(--art-a)' }} />
      <circle cx="0" cy="200" r="51" fill="none" strokeWidth="9" style={{ stroke: 'var(--art-b)' }} />
      <rect x="252" y="22" width="50" height="32" fill={`url(#${dots})`} />
      <rect x="44" y="52" width="226" height="108" rx="8" strokeWidth="3" style={{ fill: 'var(--art-paper)', stroke: 'var(--art-ink)' }} />
      <path d="M44 76h226" strokeWidth="3" style={{ stroke: 'var(--art-ink)' }} />
      <g style={{ fill: 'var(--art-ink)' }}>
      <circle cx="58" cy="64" r="3" />
      <circle cx="70" cy="64" r="3" />
      <circle cx="82" cy="64" r="3" />
      </g>
      <path d="M66 104h118" strokeWidth="3.2" strokeLinecap="round" style={{ stroke: 'var(--art-a)' }} />
      <path d="M66 112h118" strokeWidth="1.6" style={{ stroke: 'var(--art-a)' }} />
      <path d="M66 134h76" strokeWidth="2.5" strokeLinecap="round" strokeOpacity=".35" style={{ stroke: 'var(--art-ink)' }} />
      <circle cx="212" cy="110" r="25" fillOpacity=".75" strokeWidth="3.5" style={{ fill: 'var(--art-a-soft)', stroke: 'var(--art-ink)' }} />
      <path d="M230 128l22 22" strokeWidth="6.5" strokeLinecap="round" style={{ stroke: 'var(--art-ink)' }} />
      </>
    )
  },
  suites: {
    label: 'suite qui double',
    draw: (dots) => (
      <>
      <rect width="320" height="200" style={{ fill: 'var(--cover-lav)' }} />
      <circle cx="320" cy="0" r="66" fill="none" strokeWidth="9" style={{ stroke: 'var(--art-a)' }} />
      <circle cx="320" cy="0" r="47" fill="none" strokeWidth="9" style={{ stroke: 'var(--art-b)' }} />
      <path d="M52 166h220M62 166V44" strokeWidth="3" strokeLinecap="round" style={{ stroke: 'var(--art-ink)' }} />
      <path d="M94 150Q176 136 254 56" fill="none" strokeWidth="2" strokeDasharray="3 6" style={{ stroke: 'var(--art-ink)' }} />
      <circle cx="94" cy="150" r="6" strokeWidth="2.5" style={{ fill: 'var(--art-a)', stroke: 'var(--art-ink)' }} />
      <circle cx="134" cy="140" r="8" strokeWidth="2.5" style={{ fill: 'var(--art-a)', stroke: 'var(--art-ink)' }} />
      <circle cx="174" cy="120" r="10" strokeWidth="2.5" style={{ fill: 'var(--art-a)', stroke: 'var(--art-ink)' }} />
      <circle cx="214" cy="92" r="12" strokeWidth="2.5" style={{ fill: 'var(--art-b)', stroke: 'var(--art-ink)' }} />
      <circle cx="254" cy="56" r="14" strokeWidth="2.5" style={{ fill: 'var(--art-b)', stroke: 'var(--art-ink)' }} />
      <text x="80" y="74" fontStyle="italic" fontSize="25" style={{ fontFamily: 'var(--font-editorial)', fill: 'var(--art-ink)' }}>
      2, 4, 8, 16…
      </text>
      </>
    )
  }
};

/** Le contenu du catalogue → sa couverture. */
const BY_ITEM: Record<string, CoverKey> = {
  phishing: 'phish',
  reseaux: 'reseau',
  comptes: 'comptes',
  'email-pro': 'email',
  budget: 'budget',
  sauvegarde: 'sauv',
  reunion: 'reunion',
  'memo-liens': 'lien'
};

/** Pour un contenu du Studio : le mot du titre qui désigne le sujet. */
const BY_WORD: [RegExp, CoverKey][] = [
  [/clavier/i, 'clavier'],
  [/suite|double|puissance/i, 'suites'],
  [/hame[cç]on|phishing|pi[eè]ge/i, 'phish'],
  [/sauvegard|3-2-1/i, 'sauv'],
  [/mot de passe|compte/i, 'comptes'],
  [/e-?mail|courriel/i, 'email'],
  [/budget|d[ée]pense/i, 'budget'],
  [/r[ée]union/i, 'reunion'],
  [/lien|url/i, 'lien'],
  [/r[ée]seau|wi-?fi|routeur/i, 'reseau']
];

export function coverFor(item: { id: string; title: string; type?: string }): CoverKey | null {
  if (BY_ITEM[item.id]) return BY_ITEM[item.id];
  if (item.type && item.type !== 'module') return null;
  return BY_WORD.find(([re]) => re.test(item.title))?.[1] || null;
}

export function SubjectCover({ cover, className = '' }: { cover: CoverKey; className?: string }) {
  const dots = `cv-dots-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const { label, draw } = COVERS[cover];
  return (
    <svg className={`subject-cover ${className}`.trim()} viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`Couverture : ${label}`}>
      <defs>
        <pattern id={dots} width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.7" style={{ fill: 'var(--art-ink)' }} fillOpacity=".38" />
        </pattern>
      </defs>
      {draw(dots)}
    </svg>
  );
}
