import React, { useState } from 'react';
import {
  ChevronRight,
  Check,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  Filter,
  Flag,
  Search,
  Target
} from 'lucide-react';
import {
  buildDynamicCatalog,
  CATALOG_ITEMS,
  initialExtendedState,
  type CatalogItem,
  type CatalogType,
  type DifficultyLevel,
  type ExtendedDemoState,
  type ReviewLevel
} from '../wireframeData';
import type { Profile, Progress, Relation } from '../data';
import { MODULES_CONTENT, builtInAnswerKey } from '../content';
import { isQuizPassed, moduleProgressPercent } from '../domain.mjs';
import { computeCatalogCardSteps } from '../personas';
import { DifficultyMeter, ProgressBar } from '../components/ProfileIdentityCard';
import { CatalogContentCard, ContentTypeMark, XpBadgeInline } from '../components/CatalogVisuals';

import { Select } from '../components/ui';
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
        return acc + moduleProgressPercent(p, count, builtInAnswerKey(pm.id));
      }, 0);
      return Math.round(total / item.pathModules.length);
    }
    if (item.type === 'module') {
      const p = resolveModProg(item.id, progress, ext, userId, getModuleProgress);
      const count = MODULES_CONTENT[item.id]?.lessons.length || 3;
      return moduleProgressPercent(p, count, builtInAnswerKey(item.id));
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
        <header className="page-header">
          <span className="eyebrow">Apprendre</span>
          <h1>Bibliothèque</h1>
          <p>Modules courts, fiches de révision et parcours pour progresser à votre rythme.</p>
        </header>

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
              <Select
                aria-label="Domaine"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              >
                {['Tous', 'Numérique', 'Communication', 'Gestion'].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>

            <div className={`catalog-filter-pill ${levelFilter !== 'Tous' ? 'is-filtered' : ''}`}>
              <span className="cf-label">Niveau</span>
              <span className="cf-sep" aria-hidden="true">–</span>
              <span className="cf-val">{levelFilter}</span>
              <ChevronDown size={14} className="cf-chevron" aria-hidden="true" />
              <Select
                aria-label="Niveau"
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as 'Tous' | DifficultyLevel)}
              >
                {['Tous', 'Débutant', 'Intermédiaire', 'Avancé'].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </Select>
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
              <Select
                aria-label="Revue du contenu"
                value={reviewFilter}
                onChange={(e) => setReviewFilter(e.target.value as 'Toutes' | ReviewLevel)}
              >
                {['Toutes', 'Communautaire', 'Pédagogique', 'Renforcée'].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
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
            {domain === 'Tous' ? 'Parcours conseillé' : `Adapté · ${domain}`}
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
          <span className="eyebrow">À commencer ({plannedItems.length})</span>
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
            {domain === 'Tous' ? 'Entraide récente' : `Discussions · ${domain}`}
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
            Accès membre autorisé · {item.version}.
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
  const pct = isInteractive ? moduleProgressPercent(modProg, studyLessons, builtInAnswerKey(item.id)) : 0;
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
                  ? isQuizPassed(modProg, builtInAnswerKey(item.id))
                  : modProg.lessons.includes(idx)
                : sec.status === 'Terminé';
              return (
                <div className={`wf-program-item ${done ? 'is-done' : 'is-todo'}`} key={sec.title}>
                  <div>
                    <b>{sec.title}</b>
                    <small>{sec.subtitle}</small>
                  </div>
                  {done && <Check size={18} className="wf-program-check" aria-label="Section terminée" />}
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
              <button type="button" className="wf-program-item is-link" key={pm.id} onClick={() => nav('module-detail', pm.id)}>
                <span>
                  <b>{pm.title}</b>
                  <small>
                    {pm.version} · {pm.note}
                  </small>
                </span>
                <ChevronRight size={18} aria-hidden="true" />
              </button>
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

export { ProgressionPage } from './ProgressionPage';

