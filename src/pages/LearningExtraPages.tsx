import React, { useState } from 'react';
import {
  ChevronRight,
  Check,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
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
import { isQuizPassed, moduleProgressPercent, quizPassThreshold } from '../domain.mjs';
import { computeCatalogCardSteps, moduleBadge } from '../personas';
import { formatDayLong } from '../calendar';
import { PHOTOS } from '../media';
import { DifficultyMeter, ProgressBar } from '../components/ProfileIdentityCard';
import { CatalogCardBanner, CatalogContentCard, ContentTypeMark, XpBadgeInline } from '../components/CatalogVisuals';

import { ConfirmDialog, Select } from '../components/ui';
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
  /**
   * Contenu payant non acquis : renvoie le prix à afficher (absent pour un mineur, à qui on ne montre
   * pas de prix) et l'action d'achat s'il peut acheter lui-même. Renvoie `null` si l'accès est ouvert.
   */
  paywall?: (itemId: string) => { priceLabel: string | null; buyLabel?: string; onBuy?: () => void; planLabel?: string; onPlan?: () => void } | null;
  /** Ce que le module prépare : la prochaine séance du plan qui le travaille, l'évaluation à venir qui le couvre. */
  moduleAgenda?: (moduleId: string) => { sessionDay?: string; exam?: { title: string; day: string } } | null;
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
  getModuleProgress,
  purchasedIds = []
}: Pick<LearningExtraProps, 'nav' | 'query' | 'setQuery' | 'domain' | 'setDomain' | 'progress' | 'userId' | 'getModuleProgress'> & {
  ext?: ExtendedDemoState;
  /** Contenus achetés par ce compte (pour lui ou pour ses enfants) : un onglet « Achats » les regroupe. */
  purchasedIds?: string[];
}) {
  const [typeTab, setTypeTab] = useState<'all' | CatalogType | 'purchased'>('all');
  const [levelFilter, setLevelFilter] = useState<'Tous' | DifficultyLevel>('Tous');
  const [reviewFilter, setReviewFilter] = useState<'Toutes' | ReviewLevel>('Toutes');
  const [mobileFilters, setMobileFilters] = useState(false);

  const catalog = ext ? buildDynamicCatalog(ext) : CATALOG_ITEMS;

  const q = query.trim().toLowerCase();
  const filtered = catalog
    .filter((item) => {
      if (typeTab === 'purchased') {
        if (!purchasedIds.includes(item.id)) return false;
      } else if (typeTab !== 'all' && item.type !== typeTab) return false;
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

  const domainCounts = ['Tous', 'Numérique', 'Communication', 'Gestion', 'Scolaire'].map((d) => ({
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
    <div className="dashboard-grid is-single">
      <div className="dashboard-main">
        <h1 className="sr-only">Bibliothèque</h1>

        <div className="catalog-tabs-underline" role="tablist" aria-label="Type de contenu">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'resource', label: 'Ressources' },
            { id: 'module', label: 'Modules' },
            { id: 'path', label: 'Parcours' },
            ...(purchasedIds.length > 0 ? [{ id: 'purchased', label: 'Achats' }] : [])
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={typeTab === t.id}
              className={typeTab === t.id ? 'selected' : ''}
              onClick={() => setTypeTab(t.id as 'all' | CatalogType | 'purchased')}
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
                {['Tous', 'Numérique', 'Communication', 'Gestion', 'Scolaire'].map((d) => (
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
            <span>{item.classLabel ? `${item.domain} · ${item.classLabel}` : item.domain}</span>
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
  setToast,
  paywall,
  moduleAgenda
}: LearningExtraProps) {
  const catalog = buildDynamicCatalog(ext);
  const item = catalog.find((c) => c.id === selectedItemId && c.type === 'module') || catalog[0];
  const wall = paywall?.(item.id) || null;
  const isInteractive = !!item.interactive;
  const modProg = resolveModProg(item.id, progress, ext, userId, getModuleProgress);
  const content = MODULES_CONTENT[item.id];
  const studyLessons = content?.lessons.length || Math.max(1, (item.sections?.length || 4) - 1);
  const key = builtInAnswerKey(item.id);
  const pct = isInteractive ? moduleProgressPercent(modProg, studyLessons, key) : 0;
  const isPlanned = ext.plannedIds.includes(item.id);
  const authorId = resolveAuthorMemberId(item.author);
  const quizPassed = isInteractive && isQuizPassed(modProg, key);
  const questionCount = content?.questions.length || 0;
  const minutesOf = (text: string) => Number(/\d+/.exec(text)?.[0] || 0);

  // Le programme : les sections du module puis son quiz, chacune avec son statut écrit.
  const rows: { title: string; meta: string; done: boolean }[] = content
    ? [
        ...content.lessons.map((lesson, i) => ({
          title: lesson.title,
          meta: [lesson.label, lesson.minutes].filter(Boolean).join(' · '),
          done: isInteractive && modProg.lessons.includes(i)
        })),
        {
          title: 'Quiz final',
          meta: [
            `${questionCount} question${questionCount > 1 ? 's' : ''}`,
            questionCount ? `${quizPassThreshold(questionCount)} bonnes réponses pour valider` : '',
            modProg.submitted && !quizPassed ? 'à retenter' : ''
          ]
            .filter(Boolean)
            .join(' · '),
          done: quizPassed
        }
      ]
    : (item.sections || []).map((sec) => ({ title: sec.title.replace(/^\d+\s+/, ''), meta: sec.subtitle, done: sec.status === 'Terminé' }));
  const current = rows.findIndex((r) => !r.done);
  const readingLeft = content ? content.lessons.reduce((sum, lesson, i) => sum + (modProg.lessons.includes(i) ? 0 : minutesOf(lesson.minutes)), 0) : 0;
  const leftParts = [readingLeft ? `${readingLeft} min de lecture` : '', !quizPassed && questionCount ? `le quiz (${questionCount} questions)` : ''].filter(Boolean);
  const verb = pct === 100 ? 'Revoir le module' : pct === 0 ? 'Commencer le module' : current >= 0 && current === rows.length - 1 && content ? 'Reprendre au quiz final' : 'Reprendre le module';

  // Ce que le module prépare et débloque : la séance prévue, l'évaluation qu'il couvre, son badge.
  const agenda = moduleAgenda?.(item.id) || null;
  const badge = isInteractive ? moduleBadge(item.id) : null;
  const dayMonth = (day: string) => formatDayLong(day).replace(/^\S+\s/, '');
  // Le créateur : sa fiche (selon ce qu'il montre) et ses modules publiés.
  const authorDetails = authorId ? ext.profileDetails[authorId] : undefined;
  const authorBio = authorDetails && authorDetails.profileVisibility !== 'Moi uniquement' ? authorDetails.bio : '';
  const authorModules = catalog.filter((c) => c.type === 'module' && c.author === item.author).length;
  // Dans le même parcours : les autres modules, avec l'avancement de l'apprenant.
  const path = catalog.find((c) => c.type === 'path' && c.pathModules?.some((pm) => pm.id === item.id));
  const siblings = (path?.pathModules || [])
    .filter((pm) => pm.id !== item.id)
    .map((pm) => {
      const sibling = catalog.find((c) => c.id === pm.id);
      const siblingProgress = resolveModProg(pm.id, progress, ext, userId, getModuleProgress);
      const siblingPct = sibling?.interactive
        ? moduleProgressPercent(siblingProgress, MODULES_CONTENT[pm.id]?.lessons.length || 3, builtInAnswerKey(pm.id))
        : 0;
      return { id: pm.id, title: sibling?.title || pm.title.replace(/^\d+\s+/, ''), duration: sibling?.duration, pct: siblingPct };
    });

  const [confirmUnplan, setConfirmUnplan] = useState(false);
  const togglePlanned = () => {
    updateExt((prev) => ({
      ...prev,
      plannedIds: prev.plannedIds.includes(item.id) ? prev.plannedIds.filter((x) => x !== item.id) : [...prev.plannedIds, item.id]
    }));
    setToast(isPlanned ? 'Retiré de « À commencer »' : 'Ajouté à « Mes apprentissages »');
  };

  return (
    <div className="md-page">
      <section className="md-hero" aria-label={`Module ${item.title}`}>
        <div className="md-hero-text">
          <nav className="md-crumbs" aria-label="Fil d’Ariane">
            <button type="button" onClick={() => nav('catalog')}>
              Bibliothèque
            </button>
            <ChevronRight size={14} aria-hidden="true" />
            <span>{item.classLabel ? `${item.domain} · ${item.classLabel}` : item.domain}</span>
          </nav>
          <p className="md-type">
            Module · {item.level} · {item.version}
          </p>
          <h1 className="md-title">{item.title}</h1>
          <p className="md-lead">{item.summary}</p>
          <p className="md-author">
            <span className="md-author-initial" aria-hidden="true">
              {item.author.charAt(0)}
            </span>
            <span>
              {authorId ? (
                <button type="button" className="md-author-name" onClick={() => nav('member', authorId)}>
                  {item.author}
                </button>
              ) : (
                <b className="md-author-name">{item.author}</b>
              )}
              <small>{item.authorRole}</small>
            </span>
          </p>
          <ul className="md-facts">
            <li>
              <Clock size={15} aria-hidden="true" /> {item.duration}
            </li>
            <li>
              <BookOpen size={15} aria-hidden="true" /> {studyLessons} section{studyLessons > 1 ? 's' : ''}
            </li>
            {content && content.labType !== 'generic' && (
              <li>
                <Target size={15} aria-hidden="true" /> 1 exercice
              </li>
            )}
            {questionCount > 0 && (
              <li>
                <CheckCircle2 size={15} aria-hidden="true" /> Quiz de {questionCount} questions
              </li>
            )}
            {item.xpReward ? (
              <li>
                <XpBadgeInline amount={item.xpReward} />
              </li>
            ) : null}
          </ul>
          <div className="md-actions">
            {wall ? (
              <>
                {wall.onBuy && (
                  <button type="button" className="primary" onClick={wall.onBuy}>
                    {wall.buyLabel || 'Acheter'}
                  </button>
                )}
                {wall.onPlan && (
                  <button type="button" className="li-text-link" onClick={wall.onPlan}>
                    {wall.planLabel}
                  </button>
                )}
              </>
            ) : (
              <button type="button" className="primary" onClick={() => openReader(item.id)}>
                {verb} <ArrowRight size={16} aria-hidden="true" />
              </button>
            )}
            <button type="button" className="li-text-link" onClick={() => (isPlanned ? setConfirmUnplan(true) : togglePlanned())}>
              {isPlanned ? 'Retirer de mes apprentissages' : 'Ajouter à mes apprentissages'}
            </button>
            <ConfirmDialog
              open={confirmUnplan}
              title="Retirer ce module de vos apprentissages ?"
              text="Votre avancement est conservé : vous le retrouverez en ajoutant de nouveau le module."
              confirmLabel="Retirer"
              onConfirm={() => {
                setConfirmUnplan(false);
                togglePlanned();
              }}
              onCancel={() => setConfirmUnplan(false)}
            />
          </div>
          {wall && (
            <p className="md-wall-note">
              {wall.priceLabel
                ? `Contenu payant : ${wall.priceLabel}. Démonstration : aucun paiement réel.`
                : 'Contenu payant. Demande à ton parent ou tuteur de l’ajouter depuis son espace famille.'}
            </p>
          )}
        </div>
        <div className="md-hero-art" aria-hidden="true">
          <CatalogCardBanner item={item} />
        </div>
      </section>

      <div className="md-body">
        <div className="md-main">
          <section className="md-card" aria-label="Ce que vous saurez faire">
            <h2>Ce que vous saurez faire</h2>
            <ul className="md-goals">
              {item.objectives.map((o) => (
                <li key={o}>
                  <CheckCircle2 size={18} aria-hidden="true" /> {o}
                </li>
              ))}
            </ul>
          </section>

          <section className="md-card" aria-label="Programme du module">
            <header className="md-card-head">
              <h2>Programme</h2>
              <small>
                {rows.filter((r) => r.done).length} étape{rows.filter((r) => r.done).length > 1 ? 's' : ''} sur {rows.length}
              </small>
            </header>
            <ol className="md-program">
              {rows.map((row, i) => (
                <li key={row.title} className={row.done ? 'is-done' : i === current ? 'is-current' : ''}>
                  <span className="md-program-mark" aria-hidden="true">
                    {row.done ? <Check size={14} /> : String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="md-program-text">
                    <b>{row.title}</b>
                    <small>{row.meta}</small>
                  </span>
                  <span className={`md-program-state${row.done ? '' : i === current ? ' is-next' : ''}`}>
                    {row.done ? 'Terminé' : i === current ? 'À faire' : 'À venir'}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className="md-card" aria-label="Prérequis">
            <h2>Prérequis</h2>
            <p className="md-text">{item.prerequisites}</p>
          </section>
        </div>

        <aside className="md-side">
          <section className="md-card md-progress" aria-label="Votre avancement">
            <header className="md-card-head">
              <h2>Votre avancement</h2>
              <b className="md-pct">{pct} %</b>
            </header>
            <div className="md-steps" role="img" aria-label={`${rows.filter((r) => r.done).length} étapes sur ${rows.length}`}>
              {rows.map((r, i) => (
                <i key={i} className={r.done ? 'is-done' : undefined} />
              ))}
            </div>
            <p className="md-text">
              {pct === 100 ? 'Module terminé : vous pouvez le revoir quand vous voulez.' : leftParts.length ? `Il reste ${leftParts.join(' et ')}.` : 'Prêt à commencer.'}
            </p>
            {(agenda?.sessionDay || agenda?.exam || badge) && (
              <ul className="md-next">
                {agenda?.sessionDay && (
                  <li>
                    <CalendarDays size={16} aria-hidden="true" />
                    <span>
                      Prévu dans votre plan : <b>{formatDayLong(agenda.sessionDay).toLowerCase()}</b>
                    </span>
                  </li>
                )}
                {agenda?.exam && (
                  <li>
                    <Target size={16} aria-hidden="true" />
                    <span>
                      Prépare l’évaluation <b>{agenda.exam.title}</b> du {dayMonth(agenda.exam.day)}
                    </span>
                  </li>
                )}
                {badge && (
                  <li>
                    <Award size={16} aria-hidden="true" />
                    <span>
                      {quizPassed ? 'Badge obtenu' : 'Débloque le badge'} <b>{badge.title}</b>
                    </span>
                  </li>
                )}
              </ul>
            )}
            {agenda && (
              <button type="button" className="li-text-link md-plan-link" onClick={() => nav('calendar', 'plan')}>
                Voir le plan de révision
              </button>
            )}
          </section>

          {authorId && (
            <section className="md-card md-creator" aria-label="Le créateur du module">
              <div
                className="md-creator-cover"
                aria-hidden="true"
                style={{ backgroundImage: `url(${authorDetails?.coverDataUrl || PHOTOS.bibliotheque})` }}
              />
              <div className="md-creator-body">
                <span className="md-creator-avatar" aria-hidden="true">
                  {authorDetails?.photoDataUrl ? <img src={authorDetails.photoDataUrl} alt="" /> : item.author.charAt(0)}
                </span>
                <b className="md-creator-name">{item.author}</b>
                {authorDetails?.tagline && <small className="md-creator-tagline">{authorDetails.tagline}</small>}
                <p className="md-text">
                  {authorBio ? `${authorBio} ` : ''}
                  {authorModules} module{authorModules > 1 ? 's' : ''} publié{authorModules > 1 ? 's' : ''} sur SAVOIR+.
                </p>
                <button type="button" className="li-text-link" onClick={() => nav('member', authorId)}>
                  Voir le profil
                </button>
              </div>
            </section>
          )}

          {path && siblings.length > 0 && (
            <section className="md-card" aria-label="Dans le même parcours">
              <h2>Dans le même parcours</h2>
              <button type="button" className="li-text-link md-path-name" onClick={() => nav('path-detail', path.id)}>
                {path.title}
              </button>
              <ul className="md-siblings">
                {siblings.map((sibling) => (
                  <li key={sibling.id}>
                    <button type="button" onClick={() => nav('module-detail', sibling.id)}>
                      <b>{sibling.title}</b>
                      <small>
                        {[sibling.duration, sibling.pct === 100 ? 'validé' : sibling.pct > 0 ? `${sibling.pct} %` : 'à commencer'].filter(Boolean).join(' · ')}
                      </small>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <button type="button" className="li-text-link md-report" onClick={() => openReport(`Module : ${item.title} (${item.version})`)}>
            <Flag size={14} aria-hidden="true" /> Signaler un problème
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
            <span>{item.classLabel ? `${item.domain} · ${item.classLabel}` : item.domain}</span>
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

