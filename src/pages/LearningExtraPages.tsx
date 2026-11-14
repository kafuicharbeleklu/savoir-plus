import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  Filter,
  Flag,
  GraduationCap,
  History,
  Lock,
  Plus,
  Search,
  ShieldCheck,
  Target
} from 'lucide-react';
import {
  buildDynamicCatalog,
  CATALOG_ITEMS,
  type CatalogItem,
  type CatalogType,
  type DifficultyLevel,
  type ExtendedDemoState,
  type ReviewLevel
} from '../wireframeData';
import type { Progress } from '../data';
import { MODULES_CONTENT } from '../content';
import { moduleProgressPercent, moduleXp, scoreAnswers } from '../domain.mjs';
import { computeCatalogCardSteps, computeGlobalLevel } from '../personas';
import { DifficultyMeter, ProgressBar } from '../components/ProfileIdentityCard';
import { CatalogContentCard, ContentTypeMark, XpBadgeInline } from '../components/CatalogVisuals';

const LESSON_COUNTS: Record<string, number> = Object.fromEntries(
  Object.entries(MODULES_CONTENT).map(([id, mod]) => [id, mod.lessons.length])
);

interface LearningExtraProps {
  ext: ExtendedDemoState;
  updateExt: (fn: (prev: ExtendedDemoState) => ExtendedDemoState) => void;
  nav: (page: any, id?: string) => void;
  openReader: (moduleId?: string, sectionIdx?: number) => void;
  openReport: (targetLabel: string) => void;
  progress: Progress;
  userId?: string;
  getModuleProgress?: (modId: string) => Progress;
  selectedItemId: string;
  query: string;
  setQuery: (q: string) => void;
  domain: string;
  setDomain: (d: string) => void;
  setToast: (msg: string) => void;
}

function resolveModProg(
  modId: string,
  progress: Progress,
  ext?: ExtendedDemoState,
  userId = 'afi',
  getModuleProgress?: (id: string) => Progress
): Progress {
  if (getModuleProgress) return getModuleProgress(modId);
  if (modId === 'phishing') return progress;
  return ext?.moduleProgress?.[userId]?.[modId] || { lessons: [], answers: [], submitted: false };
}

function resolveAuthorMemberId(authorName: string): string | null {
  const low = authorName.toLowerCase();
  if (low.includes('kossi')) return 'kossi';
  if (low.includes('afi')) return 'afi';
  if (low.includes('nadège') || low.includes('nadege')) return 'nadege';
  return null;
}

export function CatalogExtraView({
  ext,
  nav,
  query,
  setQuery,
  domain,
  setDomain,
  progress,
  userId = 'afi',
  getModuleProgress
}: Pick<LearningExtraProps, 'nav' | 'query' | 'setQuery' | 'domain' | 'setDomain' | 'progress' | 'userId' | 'getModuleProgress'> & {
  ext?: ExtendedDemoState;
}) {
  const [typeTab, setTypeTab] = useState<'all' | CatalogType>('all');
  const [levelFilter, setLevelFilter] = useState<'Tous' | DifficultyLevel>('Tous');
  const [reviewFilter, setReviewFilter] = useState<'Toutes' | ReviewLevel>('Toutes');
  const [mobileFilters, setMobileFilters] = useState(false);

  const catalog = ext ? buildDynamicCatalog(ext) : CATALOG_ITEMS;

  const q = query.trim().toLowerCase();
  const filtered = catalog
    .filter((item) => {
      if (typeTab !== 'all' && item.type !== typeTab) return false;
      if (domain !== 'Tous' && item.domain !== domain) return false;
      if (levelFilter !== 'Tous' && item.level !== levelFilter) return false;
      if (reviewFilter !== 'Toutes' && item.review !== reviewFilter) return false;
      if (!q) return true;
      return `${item.title} ${item.summary} ${item.domain} ${item.author}`.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (q) {
        const aMatch = a.title.toLowerCase().includes(q) ? 1 : 0;
        const bMatch = b.title.toLowerCase().includes(q) ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;
      }
      return a.interactive ? -1 : b.interactive ? 1 : 0;
    });

  const openDetail = (item: CatalogItem) => {
    if (item.type === 'resource') nav('resource-detail', item.id);
    else if (item.type === 'path') nav('path-detail', item.id);
    else nav('module-detail', item.id);
  };

  const resetFilters = () => {
    setDomain('Tous');
    setLevelFilter('Tous');
    setReviewFilter('Toutes');
    setTypeTab('all');
    if (q) setQuery('');
  };

  const getItemPercent = (item: CatalogItem) => {
    if (item.type === 'path' && item.pathModules?.length) {
      const total = item.pathModules.reduce((acc, pm) => {
        const p = resolveModProg(pm.id, progress, ext, userId, getModuleProgress);
        const count = MODULES_CONTENT[pm.id]?.lessons.length || 3;
        return acc + moduleProgressPercent(p, count);
      }, 0);
      return Math.round(total / item.pathModules.length);
    }
    if (item.type === 'module') {
      const p = resolveModProg(item.id, progress, ext, userId, getModuleProgress);
      const count = MODULES_CONTENT[item.id]?.lessons.length || 3;
      return moduleProgressPercent(p, count);
    }
    return 0;
  };

  const domainCounts = ['Tous', 'Numérique', 'Communication', 'Gestion'].map((d) => ({
    label: d,
    count: d === 'Tous' ? catalog.length : catalog.filter((i) => i.domain === d).length
  }));
  const recommendedItem =
    catalog.find((i) =>
      domain === 'Gestion'
        ? i.id === 'support-it'
        : domain === 'Communication'
          ? i.id === 'memo-liens'
          : i.id === 'fondamentaux-it'
    ) || catalog[0];
  const recommendedPct = getItemPercent(recommendedItem);

  const plannedItems = (ext?.plannedIds || [])
    .map((id) => catalog.find((c) => c.id === id))
    .filter((c): c is CatalogItem => Boolean(c));
  const domainPosts = (ext?.posts || []).filter((p) => domain === 'Tous' || p.domain === domain);

  const hasActiveFilters =
    domain !== 'Tous' || levelFilter !== 'Tous' || reviewFilter !== 'Toutes' || typeTab !== 'all' || Boolean(q);

  return (
    <div className="dashboard-grid">
      <div className="dashboard-main">
        <section className="catalog-hero" aria-label="Présentation de la bibliothèque">
          <div className="catalog-hero-copy">
            <span className="eyebrow">BIBLIOTHÈQUE PÉDAGOGIQUE</span>
            <h1>Votre prochaine découverte.</h1>
            <p>
              Des ressources autonomes, des modules structurés et des parcours complets à votre rythme.
            </p>
            <div className="catalog-hero-links">
              <button type="button" className="catalog-hero-link" onClick={() => openDetail(recommendedItem)}>
                <span>Découvrir « {recommendedItem.title} »</span>
                <ChevronRight size={15} aria-hidden="true" />
              </button>
              <button type="button" className="catalog-hero-link" onClick={() => nav('studio')}>
                <span>Proposer un contenu</span>
                <ChevronRight size={15} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="catalog-hero-visual" aria-hidden="true">
            <svg viewBox="0 0 280 200" className="catalog-hero-svg" fill="none">
              <defs>
                <radialGradient id="catalogHeroGlow" cx="55%" cy="50%" r="52%">
                  <stop offset="0%" stopColor="var(--accent-brand)" stopOpacity="0.34" />
                  <stop offset="55%" stopColor="var(--accent-warm)" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="var(--accent-brand)" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="catalogPortalRing" x1="40" y1="26" x2="240" y2="174" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="var(--accent-brand)" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="var(--accent-warm)" stopOpacity="0.75" />
                </linearGradient>
              </defs>
              <circle cx="150" cy="100" r="96" fill="url(#catalogHeroGlow)" />
              <polygon
                points="150,24 218,62 218,138 150,176 82,138 82,62"
                stroke="url(#catalogPortalRing)"
                strokeWidth="2"
                fill="var(--bg-surface)"
                fillOpacity="0.35"
              />
              <polygon
                points="150,42 200,71 200,129 150,158 100,129 100,71"
                stroke="var(--accent-brand)"
                strokeOpacity="0.5"
                strokeWidth="1.25"
                strokeDasharray="4 4"
              />
              <rect x="116" y="72" width="68" height="52" rx="8" fill="var(--bg-surface)" fillOpacity="0.9" stroke="var(--accent-brand)" strokeWidth="1.5" />
              <path d="M132 88H168M132 98H160M132 108H150" stroke="var(--accent-brand)" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="82" cy="62" r="5" fill="var(--accent-brand)" />
              <circle cx="218" cy="62" r="4" fill="var(--accent-warm)" />
              <circle cx="218" cy="138" r="5" fill="var(--accent-brand)" />
              <circle cx="82" cy="138" r="4" fill="var(--accent-warm)" />
              <path d="M44 46L78 60M222 140L252 154M52 154L78 140M222 60L248 44" stroke="var(--fg-muted)" strokeOpacity="0.35" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
        </section>

        <div className="catalog-tabs-underline" role="tablist" aria-label="Type de contenu">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'resource', label: 'Ressources' },
            { id: 'module', label: 'Modules' },
            { id: 'path', label: 'Parcours' }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={typeTab === t.id}
              className={typeTab === t.id ? 'selected' : ''}
              onClick={() => setTypeTab(t.id as 'all' | CatalogType)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="catalog-filter-bar">
          <button
            type="button"
            className="secondary wf-filter-toggle"
            onClick={() => setMobileFilters(!mobileFilters)}
            aria-expanded={mobileFilters}
          >
            <Filter size={15} /> Filtres
          </button>

          <div className={`catalog-filters-inline ${mobileFilters ? 'open' : ''}`}>
            <div className={`catalog-filter-pill ${domain !== 'Tous' ? 'is-filtered' : ''}`}>
              <span className="cf-label">Domaine</span>
              <span className="cf-sep" aria-hidden="true">–</span>
              <span className="cf-val">{domain}</span>
              <ChevronDown size={14} className="cf-chevron" aria-hidden="true" />
              <select
                aria-label="Domaine"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              >
                {['Tous', 'Numérique', 'Communication', 'Gestion'].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className={`catalog-filter-pill ${levelFilter !== 'Tous' ? 'is-filtered' : ''}`}>
              <span className="cf-label">Niveau</span>
              <span className="cf-sep" aria-hidden="true">–</span>
              <span className="cf-val">{levelFilter}</span>
              <ChevronDown size={14} className="cf-chevron" aria-hidden="true" />
              <select
                aria-label="Niveau"
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as 'Tous' | DifficultyLevel)}
              >
                {['Tous', 'Débutant', 'Intermédiaire', 'Avancé'].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className={`catalog-filter-pill ${reviewFilter !== 'Toutes' ? 'is-filtered' : ''}`}>
              {reviewFilter === 'Toutes' ? (
                <span className="cf-label">Revue du contenu</span>
              ) : (
                <>
                  <span className="cf-label">Revue</span>
                  <span className="cf-sep" aria-hidden="true">–</span>
                  <span className="cf-val">{reviewFilter}</span>
                </>
              )}
              <ChevronDown size={14} className="cf-chevron" aria-hidden="true" />
              <select
                aria-label="Revue du contenu"
                value={reviewFilter}
                onChange={(e) => setReviewFilter(e.target.value as 'Toutes' | ReviewLevel)}
              >
                {['Toutes', 'Communautaire', 'Pédagogique', 'Renforcée'].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="catalog-status-row">
          <p className="tiny muted" aria-live="polite">
            {filtered.length} {filtered.length > 1 ? 'contenus affichés' : 'contenu affiché'} · Accès autorisé
          </p>
          {hasActiveFilters && (
            <button type="button" className="text-link catalog-reset-btn" onClick={resetFilters}>
              Réinitialiser les filtres
            </button>
          )}
        </div>

        {filtered.length > 0 ? (
          <div className="course-grid catalog-grid wf-catalog-grid">
            {filtered.map((item) => {
              const stepInfo = computeCatalogCardSteps(
                item,
                (modId) => resolveModProg(modId, progress, ext, userId, getModuleProgress),
                LESSON_COUNTS
              );
              const authorId = resolveAuthorMemberId(item.author);

              return (
                <CatalogContentCard
                  key={item.id}
                  item={item}
                  pct={stepInfo.pct}
                  doneSteps={stepInfo.doneSteps}
                  totalSteps={stepInfo.totalSteps}
                  authorId={authorId}
                  showAuthor
                  onOpen={() => openDetail(item)}
                  onOpenAuthor={(memberId) => nav('member', memberId)}
                />
              );
            })}
          </div>
        ) : (
          <div className="empty">
            <Search size={36} />
            <h3>Aucun contenu pour ces critères.</h3>
            <p>
              {q
                ? 'Essayez de modifier votre recherche ou de retirer certains filtres.'
                : 'Retirez un filtre pour explorer davantage de ressources et modules.'}
            </p>
            <button type="button" className="secondary" onClick={resetFilters}>
              Effacer les filtres
            </button>
          </div>
        )}
      </div>

      <aside className="right-rail" aria-label="Repères bibliothèque">
        <section
          className="rail-card is-clickable"
          role="button"
          tabIndex={0}
          onClick={() => openDetail(recommendedItem)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openDetail(recommendedItem);
            }
          }}
        >
          <span className="eyebrow">
            {domain === 'Tous' ? 'PARCOURS CONSEILLÉ' : `ADAPTÉ · ${domain.toUpperCase()}`}
          </span>
          <h3>{recommendedItem.title}</h3>
          <p className="tiny muted">{recommendedItem.summary}</p>
          {recommendedItem.type !== 'resource' ? (
            <div className="rail-stat-row">
              <span>Avancement estimé</span>
              <b className="tabular">{recommendedPct}%</b>
            </div>
          ) : (
            <div className="rail-stat-row">
              <span>Format · Durée</span>
              <b>
                {recommendedItem.resourceFormat || 'Fiche'} · {recommendedItem.duration}
              </b>
            </div>
          )}
        </section>

        <section className="rail-card">
          <span className="eyebrow">FILTRER PAR DOMAINE</span>
          <h3>Explorer rapidement</h3>
          <div className="rail-quick-list">
            {domainCounts.map((dc) => (
              <button
                key={dc.label}
                type="button"
                className={`rail-filter-btn ${domain === dc.label ? 'active' : ''}`}
                onClick={() => setDomain(dc.label)}
              >
                <span>{dc.label}</span>
                <b className="tabular">{dc.count}</b>
              </button>
            ))}
          </div>
        </section>

        <section className="rail-card">
          <span className="eyebrow">À COMMENCER ({plannedItems.length})</span>
          <h3>Votre liste planifiée</h3>
          {plannedItems.length === 0 ? (
            <p className="tiny muted">Ajoutez un module depuis sa fiche pour le retrouver ici.</p>
          ) : (
            <div className="rail-quick-list">
              {plannedItems.slice(0, 3).map((pl) => (
                <button
                  key={pl.id}
                  type="button"
                  className="rail-quick-item"
                  onClick={() => openDetail(pl)}
                >
                  <b>{pl.title}</b>
                  <small>
                    {pl.domain} · {pl.duration}
                  </small>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rail-card">
          <span className="eyebrow">
            {domain === 'Tous' ? 'ENTRAIDE RÉCENTE' : `DISCUSSIONS · ${domain.toUpperCase()}`}
          </span>
          <h3>Questions des apprenants</h3>
          {domainPosts.length === 0 ? (
            <p className="tiny muted">Aucune question récente sur {domain.toLowerCase()} pour le moment.</p>
          ) : (
            <div className="rail-quick-list">
              {domainPosts.slice(0, 2).map((dp) => (
                <button
                  key={dp.id}
                  type="button"
                  className="rail-quick-item"
                  onClick={() => nav('community-thread', dp.id)}
                >
                  <b>{dp.title}</b>
                  <small>
                    {dp.authorName} · {dp.replies.length} réponse(s)
                  </small>
                </button>
              ))}
            </div>
          )}
          <button className="text-link" onClick={() => nav('community-compose')}>
            Poser une question <ArrowRight size={14} />
          </button>
        </section>
      </aside>
    </div>
  );
}

export function ResourceDetailView({
  ext,
  selectedItemId,
  nav,
  openReport
}: Pick<LearningExtraProps, 'selectedItemId' | 'nav' | 'openReport'> & { ext?: ExtendedDemoState }) {
  const catalog = ext ? buildDynamicCatalog(ext) : CATALOG_ITEMS;
  const item =
    catalog.find((c) => c.id === selectedItemId && c.type === 'resource') ||
    catalog.find((c) => c.type === 'resource')!;
  const authorId = resolveAuthorMemberId(item.author);

  return (
    <div className="wf-detail-wrap">
      <button className="back-link" onClick={() => nav('catalog')}>
        <ArrowLeft size={16} /> Retour à la bibliothèque
      </button>

      <div className="wf-two-col">
        <div className="wf-card">
          <ContentTypeMark
            type="resource"
            labelOverride="Ressource autonome"
            extra={item.resourceFormat || 'Fiche'}
          />
          <h1 className="wf-detail-title">{item.title}</h1>
          <p className="wf-lead">{item.summary}</p>
          <div className="htb-meta-line detail-meta-line">
            <DifficultyMeter level={item.level} />
            <span aria-hidden="true">·</span>
            <span>{item.domain}</span>
            <span aria-hidden="true">·</span>
            <span className="sober-inline-icon">
              <Clock size={13} aria-hidden="true" /> {item.duration}
            </span>
            <span aria-hidden="true">·</span>
            <span>{item.version}</span>
          </div>

          <div className="wf-divider" />
          <h3>À propos de cette ressource</h3>
          <p className="wf-muted-text">
            Auteur :{' '}
            {authorId ? (
              <button type="button" className="text-link" onClick={() => nav('member', authorId)}>
                <b>{item.author}</b>
              </button>
            ) : (
              <b>{item.author}</b>
            )}{' '}
            ({item.authorRole}). Consulter une ressource autonome ne valide aucun module et ne crée ni inscription ni
            pourcentage pédagogique.
          </p>

          <h3>Prérequis déclarés</h3>
          <p className="wf-muted-text">{item.prerequisites}</p>
        </div>

        <aside className="wf-side-card">
          <h3>Accès & conditions</h3>
          <p className="tiny muted">
            Accès membre autorisé · Version {item.version}.
          </p>
          <button className="primary wf-full-btn" onClick={() => nav('resource-read', item.id)}>
            Consulter la ressource <ArrowRight size={16} />
          </button>
          <button
            className="text-link wf-report-link"
            onClick={() => openReport(`Ressource : ${item.title} (${item.version})`)}
          >
            <Flag size={14} /> Signaler un problème
          </button>
        </aside>
      </div>
    </div>
  );
}

export function ResourceReadView({
  ext,
  selectedItemId,
  nav,
  openReport
}: Pick<LearningExtraProps, 'selectedItemId' | 'nav' | 'openReport'> & { ext?: ExtendedDemoState }) {
  const catalog = ext ? buildDynamicCatalog(ext) : CATALOG_ITEMS;
  const item =
    catalog.find((c) => c.id === selectedItemId && c.type === 'resource') ||
    catalog.find((c) => c.type === 'resource')!;

  return (
    <div className="wf-detail-wrap">
      <button className="back-link" onClick={() => nav('resource-detail', item.id)}>
        <ArrowLeft size={16} /> Retour à la fiche
      </button>

      <div className="wf-two-col">
        <article className="lesson-content">
          <div className="between">
            <ContentTypeMark type="resource" labelOverride="Consultation autonome" />
            <span className="muted tiny sober-inline-icon">
              <Clock size={14} /> {item.duration}
            </span>
          </div>
          <h2>{item.title}</h2>
          <p className="lead">{item.summary}</p>
          {(item.resourceBody || []).map((b) => (
            <section key={b.heading} className="wf-read-block">
              <h3>{b.heading}</h3>
              <p>{b.text}</p>
            </section>
          ))}
          {item.resourcePrompt && (
            <div className="tip">
              <Target size={20} />
              <p>
                <b>Auto-vérification facultative :</b> {item.resourcePrompt}
              </p>
            </div>
          )}
        </article>

        <aside className="wf-side-card">
          <h3>Informations</h3>
          <p className="tiny muted">
            Ressource consultée librement. Aucune progression ni attribution automatique de XP n’est déclenchée ici.
          </p>
          <button className="secondary wf-full-btn" onClick={() => nav('catalog')}>
            Explorer le module associé
          </button>
          <button
            className="text-link wf-report-link"
            onClick={() => openReport(`Ressource : ${item.title} (${item.version})`)}
          >
            <Flag size={14} /> Signaler un problème
          </button>
        </aside>
      </div>
    </div>
  );
}

export function ModuleDetailView({
  selectedItemId,
  ext,
  updateExt,
  nav,
  openReader,
  openReport,
  progress,
  userId = 'afi',
  getModuleProgress,
  setToast
}: LearningExtraProps) {
  const catalog = buildDynamicCatalog(ext);
  const item = catalog.find((c) => c.id === selectedItemId && c.type === 'module') || catalog[0];
  const isInteractive = !!item.interactive;
  const modProg = resolveModProg(item.id, progress, ext, userId, getModuleProgress);
  const studyLessons = MODULES_CONTENT[item.id]?.lessons.length || Math.max(1, (item.sections?.length || 4) - 1);
  const pct = isInteractive ? moduleProgressPercent(modProg, studyLessons) : 0;
  const isPlanned = ext.plannedIds.includes(item.id);
  const authorId = resolveAuthorMemberId(item.author);

  const togglePlanned = () => {
    updateExt((prev) => ({
      ...prev,
      plannedIds: prev.plannedIds.includes(item.id)
        ? prev.plannedIds.filter((x) => x !== item.id)
        : [...prev.plannedIds, item.id]
    }));
    setToast(isPlanned ? 'Retiré de « À commencer »' : 'Ajouté à « Mes apprentissages »');
  };

  return (
    <div className="wf-detail-wrap">
      <button className="back-link" onClick={() => nav('catalog')}>
        <ArrowLeft size={16} /> Retour à la bibliothèque
      </button>

      <div className="wf-two-col">
        <div className="wf-card">
          <ContentTypeMark type="module" labelOverride="Module" extra={item.version} />
          <h1 className="wf-detail-title">{item.title}</h1>
          <p className="wf-lead">{item.summary}</p>
          <div className="htb-meta-line detail-meta-line">
            {item.xpReward ? (
              <>
                <XpBadgeInline amount={item.xpReward} />
                <span aria-hidden="true">·</span>
              </>
            ) : null}
            <DifficultyMeter level={item.level} />
            <span aria-hidden="true">·</span>
            <span>{item.domain}</span>
            <span aria-hidden="true">·</span>
            <span className="sober-inline-icon">
              <Clock size={13} aria-hidden="true" /> {item.duration}
            </span>
          </div>

          <p className="tiny muted wf-mt-sm">
            Proposé par{' '}
            {authorId ? (
              <button type="button" className="text-link" onClick={() => nav('member', authorId)}>
                <b>{item.author}</b>
              </button>
            ) : (
              <b>{item.author}</b>
            )}
          </p>

          <div className="wf-divider" />
          <h3>Objectifs pédagogiques</h3>
          <ul className="lesson-points">
            {item.objectives.map((o) => (
              <li key={o}>
                <CheckCircle2 size={17} /> {o}
              </li>
            ))}
          </ul>

          <h3>Prérequis</h3>
          <p className="wf-muted-text">{item.prerequisites}</p>

          <h3>Programme du module</h3>
          <div className="wf-program-list">
            {(item.sections || []).map((sec, idx) => {
              const isQuizRow = idx === (item.sections?.length || 0) - 1 && sec.title.toLowerCase().includes('acquis');
              const done = isInteractive
                ? isQuizRow
                  ? modProg.submitted
                  : modProg.lessons.includes(idx)
                : sec.status === 'Terminé';
              return (
                <div className="wf-program-item" key={sec.title}>
                  <div>
                    <b>{sec.title}</b>
                    <small>{sec.subtitle}</small>
                  </div>
                  <span className={`status-tag ${done ? 'ok' : ''}`}>{done ? 'Terminé' : 'À commencer'}</span>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="wf-side-card">
          <h3>Votre suivi</h3>
          <div className="between tiny">
            <span>Avancement</span>
            <b className="tabular">{pct}%</b>
          </div>
          <ProgressBar value={pct} tone="htb" label="Avancement du module" />
          <p className="tiny muted">
            {isInteractive
              ? 'Module interactif complet avec sections guidées, atelier pratique, quiz et reprise sauvegardée.'
              : 'Module de démonstration.'}
          </p>

          <button className="primary wf-full-btn" onClick={() => openReader(item.id)}>
            {pct === 100 ? 'Revoir le module' : pct > 0 ? 'Continuer le module' : 'Commencer le module'}{' '}
            <ArrowRight size={16} />
          </button>

          <button className="secondary wf-full-btn" onClick={togglePlanned}>
            {isPlanned ? 'Ajouté · Retirer de ma liste' : 'Ajouter à mes apprentissages'}
          </button>

          <button
            className="text-link wf-report-link"
            onClick={() => openReport(`Module : ${item.title} (${item.version})`)}
          >
            <Flag size={14} /> Signaler un problème
          </button>
        </aside>
      </div>
    </div>
  );
}

export function PathDetailView({
  ext,
  selectedItemId,
  nav,
  openReport
}: Pick<LearningExtraProps, 'selectedItemId' | 'nav' | 'openReport'> & { ext?: ExtendedDemoState }) {
  const catalog = ext ? buildDynamicCatalog(ext) : CATALOG_ITEMS;
  const item = catalog.find((c) => c.id === selectedItemId && c.type === 'path') || catalog.find((c) => c.type === 'path')!;

  return (
    <div className="wf-detail-wrap">
      <button className="back-link" onClick={() => nav('catalog')}>
        <ArrowLeft size={16} /> Retour à la bibliothèque
      </button>

      <div className="wf-two-col">
        <div className="wf-card">
          <ContentTypeMark
            type="path"
            labelOverride={`Parcours ${item.pathType || ''}`.trim()}
            extra={item.version}
          />
          <h1 className="wf-detail-title">{item.title}</h1>
          <p className="wf-lead">{item.summary}</p>
          <div className="htb-meta-line detail-meta-line">
            <DifficultyMeter level={item.level} />
            <span aria-hidden="true">·</span>
            <span>{item.domain}</span>
            <span aria-hidden="true">·</span>
            <span>{item.moduleCount} modules</span>
            <span aria-hidden="true">·</span>
            <span className="sober-inline-icon">
              <Clock size={13} aria-hidden="true" /> {item.duration}
            </span>
          </div>

          <div className="wf-divider" />
          <h3>Compétences visées</h3>
          <ul className="lesson-points">
            {item.objectives.map((o) => (
              <li key={o}>
                <Compass size={17} /> {o}
              </li>
            ))}
          </ul>

          <h3>Modules du parcours</h3>
          <p className="tiny muted">{item.prerequisites}</p>
          <div className="wf-program-list">
            {(item.pathModules || []).map((pm) => (
              <div className="wf-program-item" key={pm.id}>
                <div>
                  <b>
                    {pm.title} <small>({pm.version})</small>
                  </b>
                  <small>{pm.note}</small>
                </div>
                <button className="secondary" onClick={() => nav('module-detail', pm.id)}>
                  Voir le module
                </button>
              </div>
            ))}
          </div>
        </div>

        <aside className="wf-side-card">
          <h3>Suivi du parcours</h3>
          <p className="tiny muted">
            La revue pédagogique reste propre à chaque module. Les acquis déjà obtenus sur un module sont réutilisés
            sans double comptage.
          </p>
          <button
            className="primary wf-full-btn"
            onClick={() => nav('module-detail', item.pathModules?.[0]?.id || 'phishing')}
          >
            Ouvrir le premier module <ArrowRight size={16} />
          </button>
          <button
            className="text-link wf-report-link"
            onClick={() => openReport(`Parcours : ${item.title} (${item.version})`)}
          >
            <Flag size={14} /> Signaler un problème
          </button>
        </aside>
      </div>
    </div>
  );
}

export function ProgressionPage({
  progress,
  nav,
  ext,
  userId = 'afi',
  getModuleProgress,
  openReader
}: Pick<LearningExtraProps, 'progress' | 'nav'> & {
  ext?: ExtendedDemoState;
  userId?: string;
  getModuleProgress?: (modId: string) => Progress;
  openReader?: (moduleId?: string, sectionIdx?: number) => void;
}) {
  const [tab, setTab] = useState<'overview' | 'history' | 'badges'>('overview');
  const catalog = ext ? buildDynamicCatalog(ext) : CATALOG_ITEMS;
  const playableModules = catalog.filter((c) => c.type === 'module' && c.interactive);

  const moduleMetrics = playableModules.map((mod) => {
    const modProg = resolveModProg(mod.id, progress, ext, userId, getModuleProgress);
    const study = MODULES_CONTENT[mod.id];
    const lessonCount = study ? study.lessons.length : 3;
    const correctIndices = study ? study.questions.map((q) => q.correctIndex) : [0, 0];
    const pctVal = moduleProgressPercent(modProg, lessonCount);
    const xpVal = moduleXp(modProg, lessonCount);
    const qLen = correctIndices.length;
    const passThreshold = Math.max(1, Math.ceil(qLen * 0.66));
    const qScore = scoreAnswers(modProg.answers || [], correctIndices);
    const passed = modProg.submitted && qScore >= passThreshold;
    return { mod, modProg, lessonCount, pctVal, xpVal, qScore, qLen, passed };
  });

  const points = moduleMetrics.reduce((acc, m) => acc + m.xpVal, 0);
  const lvl = computeGlobalLevel(points);
  const completedModules = moduleMetrics.filter((m) => m.pctVal === 100).length;
  const passedQuizzes = moduleMetrics.filter((m) => m.passed).length;
  const phishingMetric = moduleMetrics.find((m) => m.mod.id === 'phishing') || moduleMetrics[0];

  const userHelpedInCommunity = (ext?.posts || []).some(
    (p) => p.authorId === userId || p.replies.some((r) => r.authorId === userId)
  );
  const earnedBadgesCount =
    (completedModules > 0 ? 1 : 0) + (phishingMetric?.passed ? 1 : 0) + (userHelpedInCommunity ? 1 : 0);

  const domainPcts = (['Numérique', 'Communication', 'Gestion'] as const).map((dom) => {
    const domMods = moduleMetrics.filter((m) => m.mod.domain === dom);
    if (domMods.length === 0) return { label: dom, pctValue: 0 };
    const avg = Math.round(domMods.reduce((acc, m) => acc + m.pctVal, 0) / domMods.length);
    return { label: dom, pctValue: avg };
  });

  const resumeCandidate =
    moduleMetrics.find((m) => m.pctVal > 0 && m.pctVal < 100) ||
    moduleMetrics.find((m) => m.pctVal === 0) ||
    moduleMetrics[0];
  const nextLessonIdx = resumeCandidate
    ? Array.from({ length: resumeCandidate.lessonCount }, (_, i) => i).find(
        (i) => !resumeCandidate.modProg.lessons.includes(i)
      )
    : undefined;

  const historyRows: { key: string; title: string; subtitle: string; xpLabel: string }[] = [];
  for (const m of moduleMetrics) {
    for (const idx of m.modProg.lessons) {
      historyRows.push({
        key: `${m.mod.id}-l-${idx}`,
        title: `Leçon 0${idx + 1} terminée — ${m.mod.title}`,
        subtitle: 'Attribution unique par section complétée',
        xpLabel: '+25 XP de démo'
      });
    }
    if (m.modProg.submitted) {
      historyRows.push({
        key: `${m.mod.id}-quiz`,
        title: `Quiz soumis — ${m.mod.title} (${m.qScore} / ${m.qLen})`,
        subtitle: 'Évaluation indicative sans double attribution sur réessai',
        xpLabel: '+75 XP de démo'
      });
    }
  }

  const nextBadge = !phishingMetric?.passed
    ? {
        title: 'Vigilance phishing',
        hint: 'Obtenir au moins 2/3 au quiz cybersécurité.',
        cta: phishingMetric?.modProg.submitted ? 'Retenter le quiz' : 'Passer le quiz',
        onClick: () => (openReader ? openReader('phishing', 0) : nav('quiz-intro'))
      }
    : completedModules === 0
      ? {
          title: 'Premier module terminé',
          hint: 'Compléter toutes les leçons et le quiz d’un module.',
          cta: 'Terminer un module',
          onClick: () =>
            openReader && resumeCandidate ? openReader(resumeCandidate.mod.id, nextLessonIdx ?? 0) : nav('learning')
        }
      : {
          title: 'Esprit d’entraide',
          hint: 'Publier ou répondre depuis le fil d’accueil.',
          cta: 'Aller à l’accueil',
          onClick: () => nav('home')
        };

  return (
    <div className="dashboard-grid">
      <div className="dashboard-main">
        <div className="page-heading">
          <span className="eyebrow">PROGRESSION & RECONNAISSANCE</span>
          <h1>Ma progression</h1>
          <p>
            Les XP illustrent votre activité de démonstration. Ils restent distincts de la validation pédagogique et de
            votre rôle.
          </p>
        </div>

        <div className="catalog-tabs-underline" role="tablist" aria-label="Sections de progression">
          <button type="button" role="tab" aria-selected={tab === 'overview'} className={tab === 'overview' ? 'selected' : ''} onClick={() => setTab('overview')}>
            Vue d’ensemble
          </button>
          <button type="button" role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? 'selected' : ''} onClick={() => setTab('history')}>
            Historique ({historyRows.length})
          </button>
          <button type="button" role="tab" aria-selected={tab === 'badges'} className={tab === 'badges' ? 'selected' : ''} onClick={() => setTab('badges')}>
            Badges ({earnedBadgesCount}/3)
          </button>
        </div>

        {tab === 'overview' && (
          <>
            <section className="wf-card wf-mb">
              <div className="between">
                <div>
                  <span className="eyebrow">NIVEAU DE DÉMONSTRATION</span>
                  <h2>Niveau {lvl.level} · Apprenant actif</h2>
                </div>
                <span className="inline-meta tabular-nums">
                  <b>{lvl.currentXp} / {lvl.targetXp} XP</b>
                  <span aria-hidden="true">·</span>
                  <span>{points} XP cumulés</span>
                </span>
              </div>
              <div className="wf-my">
                <ProgressBar value={lvl.percent} label={`Expérience niveau ${lvl.level}`} tone="htb" />
              </div>
              <p className="tiny muted">
                Encore {Math.max(0, lvl.targetXp - lvl.currentXp)} XP avant le niveau {lvl.level + 1} (barème indicatif
                de démonstration).
              </p>
            </section>

            <div className="stats-grid">
              <div>
                <BookOpen />
                <b className="tabular">{completedModules}</b>
                <span>Module(s) terminé(s)</span>
              </div>
              <div>
                <GraduationCap />
                <b className="tabular">{passedQuizzes}</b>
                <span>Quiz réussi(s)</span>
              </div>
              <div>
                <Award />
                <b className="tabular">{earnedBadgesCount}</b>
                <span>Badge(s) obtenu(s)</span>
              </div>
            </div>

            <section className="wf-card wf-mb">
              <div className="between wf-mb-sm">
                <h3>Avancement par domaine</h3>
                <span className="tiny muted">Inspiré Academy · Calculé sur vos modules actifs</span>
              </div>
              <div className="htb-domain-bars">
                {domainPcts.map((d) => (
                  <div className="htb-domain-row" key={d.label}>
                    <div className="between tiny">
                      <b>{d.label}</b>
                      <span className="tabular">{d.pctValue}%</span>
                    </div>
                    <ProgressBar value={d.pctValue} label={`Avancement ${d.label}`} tone="htb" />
                  </div>
                ))}
              </div>
            </section>

            <section className="wf-card">
              <div className="between wf-mb-sm">
                <div>
                  <span className="eyebrow">PARCOURS ACTIF</span>
                  <h3>Fondamentaux IT</h3>
                </div>
                <button className="text-link" onClick={() => nav('path-detail', 'fondamentaux-it')}>
                  Voir le parcours <ArrowRight size={15} />
                </button>
              </div>
              <div className="wf-program-list">
                {(catalog.find((c) => c.id === 'fondamentaux-it')?.pathModules || []).map((pm) => {
                  const mProg = resolveModProg(pm.id, progress, ext, userId, getModuleProgress);
                  const mPct = moduleProgressPercent(mProg, MODULES_CONTENT[pm.id]?.lessons.length || 3);
                  const modStatus = mPct === 100 ? 'Terminé' : mPct > 0 ? 'En cours' : 'À commencer';
                  return (
                    <div
                      className="wf-program-item is-clickable"
                      key={pm.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => nav('module-detail', pm.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          nav('module-detail', pm.id);
                        }
                      }}
                    >
                      <div>
                        <b>{pm.title}</b>
                        <small>
                          {pm.note} · {mPct}%
                        </small>
                      </div>
                      <div className="wf-inline-actions">
                        <span className={`status-tag ${modStatus === 'Terminé' ? 'ok' : modStatus === 'En cours' ? 'warn' : ''}`}>{modStatus}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="tiny muted wf-mt-sm">
                La progression dans un module et les XP restent séparés. Refaire un quiz déjà validé n’ajoute pas de
                nouveaux XP.
              </p>
            </section>
          </>
        )}

        {tab === 'history' && (
          <section className="wf-card">
            <div className="between wf-mb">
              <h3>
                <History size={17} /> Journal des activités et mouvements XP
              </h3>
              <span className="tiny muted">Source confirmée</span>
            </div>
            {historyRows.length === 0 ? (
              <div className="empty">
                <History size={34} />
                <h3>Aucun mouvement enregistré</h3>
                <p>Terminez une leçon ou un quiz pour voir apparaître votre historique.</p>
                <button className="primary" onClick={() => nav('learning')}>
                  Commencer un module
                </button>
              </div>
            ) : (
              <div className="wf-program-list">
                {historyRows.map((row) => (
                  <div className="wf-program-item" key={row.key}>
                    <div>
                      <b>{row.title}</b>
                      <small>{row.subtitle}</small>
                    </div>
                    <span className="inline-meta tabular-nums"><b>{row.xpLabel}</b></span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'badges' && (
          <section className="wf-card">
            <div className="between wf-mb">
              <h3>
                <Award size={17} /> Mes réalisations
              </h3>
              <span className="tiny muted">
                <Lock size={13} /> Privés par défaut
              </span>
            </div>
            <div className="wf-badge-grid">
              <div className={`wf-achievement ${completedModules > 0 ? 'earned' : ''}`}>
                <Award size={26} />
                <h4>Premier module terminé</h4>
                <p>Terminer l’ensemble des leçons et le quiz d’un module.</p>
                <span>{completedModules > 0 ? 'Obtenu' : 'Verrouillé'}</span>
              </div>
              <div className={`wf-achievement ${phishingMetric?.passed ? 'earned' : ''}`}>
                <ShieldCheck size={26} />
                <h4>Vigilance phishing</h4>
                <p>Obtenir au moins 2/3 au quiz de cybersécurité.</p>
                <span>{phishingMetric?.passed ? 'Obtenu' : 'Verrouillé'}</span>
              </div>
              <div className={`wf-achievement ${userHelpedInCommunity ? 'earned' : ''}`}>
                <Plus size={26} />
                <h4>Esprit d’entraide</h4>
                <p>Contribuer dans l’espace Communauté par une question ou une réponse.</p>
                <span>{userHelpedInCommunity ? 'Obtenu' : 'Verrouillé'}</span>
              </div>
            </div>
            <p className="tiny muted wf-mt">
              Un badge reflète une étape accomplie dans la plateforme ; il ne constitue pas un diplôme ni une
              certification officielle.
            </p>
          </section>
        )}
      </div>

      <aside className="right-rail" aria-label="Repères progression">
        <section className="rail-card">
          <span className="eyebrow">PROCHAIN PALIER</span>
          <h3>Niveau {lvl.level + 1}</h3>
          <p className="tiny muted">
            Il vous reste <b className="tabular">{Math.max(0, lvl.targetXp - lvl.currentXp)} XP</b> pour atteindre ce
            palier de démonstration.
          </p>
          {resumeCandidate && (
            <div className="rail-stat-list">
              <div className="rail-stat-row">
                <span>
                  {nextLessonIdx !== undefined
                    ? `${resumeCandidate.mod.title} · Ch. 0${nextLessonIdx + 1}`
                    : `${resumeCandidate.mod.title} · Leçons`}
                </span>
                <b className="tabular">{nextLessonIdx !== undefined ? '+25 XP' : 'Acquis'}</b>
              </div>
              <div className="rail-stat-row">
                <span>{resumeCandidate.modProg.submitted ? 'Quiz validé' : 'Quiz final'}</span>
                <b className="tabular">{resumeCandidate.modProg.submitted ? 'Acquis' : '+75 XP'}</b>
              </div>
            </div>
          )}
          <button
            className="primary wf-full-btn"
            onClick={() => {
              if (resumeCandidate && openReader) {
                openReader(resumeCandidate.mod.id, nextLessonIdx ?? 0);
              } else {
                nav('catalog');
              }
            }}
          >
            {resumeCandidate && nextLessonIdx !== undefined
              ? `Reprendre chapitre 0${nextLessonIdx + 1}`
              : 'Explorer un autre module'}
            <ArrowRight size={15} />
          </button>
        </section>

        <section className="rail-card">
          <span className="eyebrow">PROCHAIN BADGE À DÉBLOQUER</span>
          <h3>{nextBadge.title}</h3>
          <p className="tiny muted">{nextBadge.hint}</p>
          <div className="rail-quick-list">
            <button type="button" className="secondary wf-full-btn" onClick={nextBadge.onClick}>
              {nextBadge.cta} <ArrowRight size={15} />
            </button>
            <button type="button" className="text-link" onClick={() => setTab('badges')}>
              Voir les réalisations ({earnedBadgesCount} / 3)
              <ArrowRight size={14} />
            </button>
          </div>
        </section>

        <section className="rail-card">
          <span className="eyebrow">DERNIÈRES ÉTAPES VALIDÉES</span>
          <h3>Journal récent</h3>
          {historyRows.length === 0 ? (
            <p className="tiny muted">Aucune étape validée pour l’instant.</p>
          ) : (
            <div className="rail-stat-list">
              {historyRows.slice(-3).map((row) => (
                <div className="rail-stat-row" key={row.key}>
                  <span>{row.title}</span>
                  <b className="tabular">{row.xpLabel}</b>
                </div>
              ))}
            </div>
          )}
          <button type="button" className="text-link" onClick={() => setTab('history')}>
            Historique complet <ArrowRight size={14} />
          </button>
        </section>
      </aside>
    </div>
  );
}
