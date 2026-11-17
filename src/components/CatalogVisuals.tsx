import { ArtScene } from './LessonArt';
import React from 'react';
import {
  BookMarked,
  BookOpen,
  CalendarCheck,
  Clock,
  Compass,
  FileCheck2,
  FileText,
  HardDrive,
  KeyRound,
  Layers,
  Link2,
  ListChecks,
  LockKeyhole,
  Mail,
  Network,
  ShieldCheck,
  Table2,
  Wallet,
  Wrench
} from 'lucide-react';
import type { CatalogItem, CatalogType } from '../wireframeData';
import { DifficultyMeter, ProgressBar } from './ProfileIdentityCard';

export interface ContentTypeMeta {
  type: CatalogType;
  label: string;
  toneClass: string;
}

export function getContentTypeMeta(type: CatalogType): ContentTypeMeta {
  if (type === 'module') {
    return { type: 'module', label: 'Module', toneClass: 'type-module' };
  }
  if (type === 'path') {
    return { type: 'path', label: 'Parcours', toneClass: 'type-path' };
  }
  return { type: 'resource', label: 'Ressource', toneClass: 'type-resource' };
}

export function ContentTypeIcon({ type, size = 15 }: { type: CatalogType; size?: number }) {
  if (type === 'module') return <Layers size={size} strokeWidth={2.1} aria-hidden="true" />;
  if (type === 'path') return <Compass size={size} strokeWidth={2.1} aria-hidden="true" />;
  return <FileText size={size} strokeWidth={2.1} aria-hidden="true" />;
}

/**
 * Unboxed colored icon + label inspired by Hack The Box module/resource markers.
 */
export function ContentTypeMark({
  type,
  labelOverride,
  extra
}: {
  type: CatalogType;
  labelOverride?: string;
  extra?: string;
}) {
  const meta = getContentTypeMeta(type);
  return (
    <span className={`type-mark ${meta.toneClass}`}>
      <span className="type-mark-icon" aria-hidden="true">
        <ContentTypeIcon type={type} size={14} />
      </span>
      <span className="type-mark-label">{labelOverride || meta.label}</span>
      {extra ? <span className="type-mark-extra">· {extra}</span> : null}
    </span>
  );
}

/**
 * Crisp HTB-style mini XP square mark + tabular value (no pill capsule).
 */
export function XpBadgeInline({ amount, suffix }: { amount: number; suffix?: string }) {
  return (
    <span className="xp-mark-inline" title={`${amount} XP de démonstration`}>
      <span className="xp-mark-box" aria-hidden="true">
        XP
      </span>
      <span className="xp-mark-val tabular-nums">
        {amount}
        {suffix ? ` ${suffix}` : ''}
      </span>
    </span>
  );
}

export function BannerEmblem({ item, size = 28 }: { item: CatalogItem; size?: number }) {
  const id = item.id.toLowerCase();
  if (id.includes('phishing')) return <ShieldCheck size={size} strokeWidth={1.85} />;
  if (id.includes('reseau') && item.type === 'module') return <Network size={size} strokeWidth={1.85} />;
  if (id.includes('comptes')) return <LockKeyhole size={size} strokeWidth={1.85} />;
  if (id.includes('email')) return <Mail size={size} strokeWidth={1.85} />;
  if (id.includes('modele')) return <Table2 size={size} strokeWidth={1.85} />;
  if (id.includes('budget')) return <Wallet size={size} strokeWidth={1.85} />;
  if (id.includes('sauvegarde')) return <HardDrive size={size} strokeWidth={1.85} />;
  if (id.includes('checklist')) return <ListChecks size={size} strokeWidth={1.85} />;
  if (id.includes('reunion')) return <CalendarCheck size={size} strokeWidth={1.85} />;
  if (id.includes('glossaire')) return <BookMarked size={size} strokeWidth={1.85} />;
  if (id.includes('mots-de-passe')) return <KeyRound size={size} strokeWidth={1.85} />;
  if (id.includes('fiche')) return <FileCheck2 size={size} strokeWidth={1.85} />;
  if (id.includes('memo') || id.includes('lien')) return <Link2 size={size} strokeWidth={1.85} />;
  if (id.includes('support')) return <Wrench size={size} strokeWidth={1.85} />;
  if (item.type === 'path') return <Compass size={size} strokeWidth={1.85} />;
  if (item.type === 'resource') return <BookOpen size={size} strokeWidth={1.85} />;
  return <Layers size={size} strokeWidth={1.85} />;
}

export function ActiveLabAvatar({
  item,
  pct,
  onClick
}: {
  item: CatalogItem;
  pct: number;
  onClick: () => void;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const visualPct = clamped > 0 ? Math.max(12, clamped) : 0;
  const dashOffset = circumference - (visualPct / 100) * circumference;

  return (
    <button
      type="button"
      className="top-active-lab-btn"
      onClick={onClick}
      aria-label={`Lab en cours : ${item.title} (${clamped}%)`}
      title={`Reprendre : ${item.title} (${clamped}%)`}
    >
      <svg className="top-active-lab-ring" viewBox="0 0 38 38" aria-hidden="true">
        <circle className="top-active-lab-track" cx="19" cy="19" r={radius} />
        {visualPct > 0 && (
          <circle
            className="top-active-lab-arc"
            cx="19"
            cy="19"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        )}
      </svg>
      <span className={`top-active-lab-core ${domainToneClass(item.domain)}`} aria-hidden="true">
        <BannerEmblem item={item} size={15} />
      </span>
    </button>
  );
}

export function domainToneClass(domain: CatalogItem['domain']): string {
  if (domain === 'Communication') return 'tone-comm';
  if (domain === 'Gestion') return 'tone-gestion';
  return 'tone-num';
}

export function formatShortDuration(duration: string, item: CatalogItem): string {
  if (!duration || duration.toLowerCase().includes('non précisée')) {
    if (item.type === 'path' && item.moduleCount) return `${item.moduleCount} modules`;
    return 'À votre rythme';
  }
  return duration;
}

/**
 * La vignette d'un contenu : une illustration dans le style du site, dont l'objet dit le type
 * (une fenêtre pour un module, une feuille pour une fiche, des étapes pour un parcours) et dont la
 * variante dépend du contenu, pour que deux cartes voisines ne se ressemblent pas.
 */
export function CatalogCardBanner({ item, compact = false }: { item: CatalogItem; compact?: boolean }) {
  const frame = item.type === 'path' ? 'route' : item.type === 'resource' ? 'sheet' : 'window';
  return (
    <div className={`sober-card-banner type-${item.type} ${compact ? 'compact' : ''}`} aria-hidden="true">
      <ArtScene frame={frame} seed={item.id} icon={<BannerEmblem item={item} size={20} />} />
    </div>
  );
}

/**
 * Unified sober HTB-inspired card for Home, Explorer/Catalog, and Mes apprentissages.
 */
export function CatalogContentCard({
  item,
  pct = 0,
  doneSteps = 0,
  totalSteps = 0,
  authorId,
  onOpen,
  onOpenAuthor,
  footerActions,
  showAuthor = false,
  compactBanner = false
}: {
  item: CatalogItem;
  pct?: number;
  doneSteps?: number;
  totalSteps?: number;
  authorId?: string | null;
  onOpen: () => void;
  onOpenAuthor?: (memberId: string) => void;
  footerActions?: React.ReactNode;
  showAuthor?: boolean;
  compactBanner?: boolean;
}) {
  const showProgressRow = item.type !== 'resource' && pct > 0;
  const durationLabel = formatShortDuration(item.duration, item);

  return (
    <article className="sober-card is-clickable" onClick={onOpen}>
      <CatalogCardBanner item={item} compact={compactBanner} />

      <div className="sober-card-body">
        <div className="sober-type-row">
          <ContentTypeMark type={item.type} />
        </div>

        <h3 className="sober-card-title">
          <button
            type="button"
            className="sober-card-title-btn"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
          >
            {item.title}
          </button>
        </h3>

        <div className="sober-meta-line">
          {item.xpReward ? (
            <>
              <XpBadgeInline amount={item.xpReward} />
              <span aria-hidden="true">·</span>
            </>
          ) : (
            <>
              <span className="sober-format-label">
                {item.resourceFormat || (item.pathType ? item.pathType : 'Contenu')}
              </span>
              <span aria-hidden="true">·</span>
            </>
          )}
          <span>{item.domain}</span>
          {showAuthor && (
            <>
              <span aria-hidden="true">·</span>
              {authorId && onOpenAuthor ? (
                <button
                  type="button"
                  className="sober-author-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenAuthor(authorId);
                  }}
                >
                  {item.author}
                </button>
              ) : (
                <span>{item.author}</span>
              )}
            </>
          )}
        </div>
      </div>

      <div className="sober-card-footer">
        {showProgressRow ? (
          <div className="sober-footer-progress">
            <div className="sober-progress-bar-wrap">
              <ProgressBar value={pct} tone="htb" label={`Avancement ${item.title}`} />
            </div>
            <b className="sober-progress-pct tabular-nums">{pct}%</b>
            {totalSteps > 0 && (
              <span className="sober-step-ratio tabular-nums" title={`${doneSteps} sur ${totalSteps} terminées`}>
                <ListChecks size={13} aria-hidden="true" />
                {doneSteps}/{totalSteps}
              </span>
            )}
          </div>
        ) : (
          <div className="sober-footer-meta">
            <DifficultyMeter level={item.level} />
            <span className="sober-duration tabular-nums">
              <Clock size={13} aria-hidden="true" />
              {durationLabel}
            </span>
          </div>
        )}

        {footerActions ? (
          <div
            className="sober-card-actions"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {footerActions}
          </div>
        ) : null}
      </div>
    </article>
  );
}
