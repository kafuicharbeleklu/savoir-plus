/**
 * Pages d'information du pied de page, sur le modèle des pages équivalentes de LinkedIn (relevées le
 * 18 novembre 2026) : chacune sort de l'application — un bandeau réduit au logo, ni colonne de gauche ni
 * barre de navigation — et a sa propre mise en page.
 * – À propos : grand titre clair sur un fond à motifs, puis vision, mission, publics, méthode, équipe.
 * – Accessibilité : titre et sous-titre avec une illustration, puis des encadrés à pictogramme.
 * – Centre d'aide : bandeau de couleur avec salutation et recherche ; raccourcis, sujets, articles
 *   suggérés, et « Autres moyens de vous aider » ; chaque article a sa page.
 * – Confidentialité et conditions : barre reliant les documents juridiques, grand titre sur bandeau
 *   clair, date d'entrée en vigueur, sections.
 * – Formules : voir src/pages/PricingPage.tsx.
 * Adresse : « #info/<rubrique>[/<article ou document>] ». Rien n'est annoncé que le site ne fasse pas.
 */
import React, { useState } from 'react';
import {
  Accessibility,
  ArrowLeft,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronRight,
  Compass,
  Hourglass,
  LifeBuoy,
  MessageCircle,
  Search,
  ShieldCheck,
  Target,
  Users,
  UserRound
} from 'lucide-react';
import type { FooterInfoTopic } from '../components/SidebarFooters';
import { ArtScene } from '../components/LessonArt';
import {
  HELP_ARTICLES,
  HELP_SHORTCUTS,
  HELP_TOPICS,
  LEGAL_DOCS,
  LEGAL_EFFECTIVE,
  searchHelp,
  type HelpArticle,
  type HelpTopicId,
  type InfoLink,
  type LegalDocId
} from '../infoContent';
import type { OfferAudience } from '../offers';
import { PricingPage, isPricingAudience } from './PricingPage';

const TOPICS: FooterInfoTopic[] = ['about', 'accessibility', 'help', 'privacy', 'hackathon', 'pricing'];
export const isInfoTopic = (id: string): id is FooterInfoTopic => (TOPICS as string[]).includes(id);

const TOPIC_ICON: Record<HelpTopicId, React.ReactNode> = {
  basics: <Compass size={22} aria-hidden="true" />,
  learning: <BookOpen size={22} aria-hidden="true" />,
  community: <MessageCircle size={22} aria-hidden="true" />,
  family: <Users size={22} aria-hidden="true" />,
  schools: <Building2 size={22} aria-hidden="true" />,
  account: <ShieldCheck size={22} aria-hidden="true" />
};

export interface InfoPageProps {
  /** « about », « help/valider-un-module », « privacy/terms »… */
  path: string;
  nav: (page: any, id?: string) => void;
  firstName: string;
  canPublish: boolean;
  learns: boolean;
  isGuardian: boolean;
  isLocal: boolean;
  onStartTour?: () => void;
  /** Le public des formules du compte qui regarde, et sa formule actuelle (page Formules). */
  viewerAudience?: OfferAudience;
  currentOfferId?: string;
}

export function InfoPage(props: InfoPageProps) {
  const [first = '', sub = ''] = (props.path || '').split('/');
  const topic: FooterInfoTopic = isInfoTopic(first) ? first : 'about';
  return (
    <div className="appeal-portal-shell ip-shell">
      <div className="shell-scroll-viewport">
        {topic === 'help' ? (
          <HelpCenter {...props} articleId={sub} />
        ) : (
          <>
            <InfoHeader nav={props.nav} label={topic === 'pricing' ? 'Formules' : undefined} />
            {topic === 'about' && <AboutPage {...props} />}
            {topic === 'pricing' && (
              <PricingPage
                audience={isPricingAudience(sub) ? sub : props.viewerAudience || 'learner'}
                nav={props.nav}
                viewerAudience={props.viewerAudience}
                currentOfferId={props.currentOfferId}
              />
            )}
            {topic === 'accessibility' && <AccessibilityPage {...props} />}
            {topic === 'privacy' && <LegalPage nav={props.nav} doc={(['privacy', 'terms', 'community', 'ads'] as string[]).includes(sub) ? (sub as LegalDocId) : 'privacy'} />}
            {topic === 'hackathon' && <HackathonPage {...props} />}
          </>
        )}
      </div>
    </div>
  );
}

/** Bandeau réduit au logo, comme sur les pages d'information de LinkedIn. */
function InfoHeader({ nav, label, inverted = false }: { nav: InfoPageProps['nav']; label?: string; inverted?: boolean }) {
  return (
    <header className={`ip-header${inverted ? ' is-inverted' : ''}`}>
      <div className="ip-header-inner">
        <button type="button" className="ip-logo" onClick={() => nav('home')} aria-label="SAVOIR+, retour à l’accueil">
          SAVOIR<span>+</span>
        </button>
        {label && <span className="ip-header-label">{label}</span>}
      </div>
    </header>
  );
}

/** Lien du texte vers un endroit du site. */
function Go({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className="ip-link" onClick={onClick}>
      {children}
    </button>
  );
}

const allowed = (link: Pick<InfoLink, 'only'>, p: InfoPageProps) =>
  !link.only ||
  (link.only === 'publish' && p.canPublish) ||
  (link.only === 'learner' && p.learns) ||
  (link.only === 'guardian' && p.isGuardian) ||
  (link.only === 'local' && p.isLocal) ||
  (link.only === 'tour' && Boolean(p.onStartTour));

const follow = (link: InfoLink, p: InfoPageProps) => (link.only === 'tour' ? p.onStartTour?.() : p.nav(link.page, link.id || ''));

/* ------------------------------------------------------------------ À propos */

function AboutPage(p: InfoPageProps) {
  return (
    <main className="ip-about">
      <section className="ip-about-hero">
        <span className="ip-mark" aria-hidden="true">
          S<span>+</span>
        </span>
        <h1>À propos de SAVOIR+</h1>
        <p>Apprendre à son rythme, progresser ensemble : des modules courts, une communauté qui s’entraide, et des espaces pour les familles, les encadrants et les établissements.</p>
      </section>

      <section className="ip-about-block">
        <h2>Vision</h2>
        <p>Que chacun puisse apprendre ce dont il a besoin, quand il en a besoin, avec l’aide des autres.</p>
      </section>
      <section className="ip-about-block">
        <h2>Mission</h2>
        <p>Rendre l’apprentissage guidé, vérifiable et partagé : des modules qui se valident par un quiz, et une entraide directe entre membres.</p>
      </section>

      <section className="ip-about-block">
        <h2>Pour qui</h2>
        <ul className="ip-audiences">
          <li>
            <span className="ip-pic">{<UserRound size={24} aria-hidden="true" />}</span>
            <b>Apprenants</b>
            <span>Modules, calendrier et plan de révision, entraide.</span>
          </li>
          <li>
            <span className="ip-pic">{<Users size={24} aria-hidden="true" />}</span>
            <b>Parents</b>
            <span>Le message de la semaine, le plan de révision, le verrouillage avant 12 ans.</span>
          </li>
          <li>
            <span className="ip-pic">{<BookOpen size={24} aria-hidden="true" />}</span>
            <b>Encadrants</b>
            <span>Leurs classes, ce qui bloque, et le studio pour créer des modules.</span>
          </li>
          <li>
            <span className="ip-pic">{<Building2 size={24} aria-hidden="true" />}</span>
            <b>Établissements</b>
            <span>L’avancement des classes, la planification du trimestre, leur bibliothèque.</span>
          </li>
        </ul>
      </section>

      <section className="ip-about-block">
        <h2>Notre méthode</h2>
        <p>Les choix d’interface s’appuient sur des études (lisibilité, explications des recommandations, contrôle parental) plutôt que sur le goût du moment.</p>
      </section>
      <section className="ip-about-block">
        <h2>L’équipe</h2>
        <p>
          SAVOIR+ est conçu par l’équipe Nexus pour le Hackathon CREATE WITH AI. <Go onClick={() => p.nav('info', 'hackathon')}>Le projet au hackathon</Go>
        </p>
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------ Accessibilité */

function AccessibilityPage(p: InfoPageProps) {
  return (
    <main className="ip-column ip-access">
      <section className="ip-access-hero">
        <div>
          <h1>Chacun doit pouvoir apprendre sur SAVOIR+</h1>
          <h2>Quels que soient vos besoins, nous voulons que le site vous soit utilisable.</h2>
        </div>
        <div className="ip-access-art">
          <ArtScene icon={<Accessibility size={24} strokeWidth={1.85} />} frame="sheet" seed="accessibilite" />
        </div>
      </section>
      <p className="ip-lead">Chaque membre apprend à sa façon : au clavier, avec un lecteur d’écran, avec moins d’animations, sur un petit écran.</p>

      <section className="ip-card">
        <span className="ip-pic">{<Target size={26} aria-hidden="true" />}</span>
        <div>
          <h2>Notre objectif</h2>
          <p>Les bonnes pratiques du référentiel WCAG 2.2, niveau AA, pour la conception et le développement du site.</p>
        </div>
      </section>
      <section className="ip-card">
        <span className="ip-pic">{<CheckCircle2 size={26} aria-hidden="true" />}</span>
        <div>
          <h2>Ce qui est en place</h2>
          <ul>
            <li>La navigation au clavier, avec un contour visible sur l’élément actif.</li>
            <li>Aucun état signalé par la couleur seule : un repère ✓, – ou ✕ l’accompagne, et la précision est lue par les lecteurs d’écran.</li>
            <li>Un texte de lecture en 18 px, avec des lignes d’environ 70 caractères.</li>
            <li>
              Les animations réduites sur demande. <Go onClick={() => p.nav('settings', 'account/motion')}>Réduire les animations</Go>
            </li>
            <li>Le film de la page de connexion est muet, décoratif, et ne se charge pas sur un petit écran.</li>
          </ul>
        </div>
      </section>
      <section className="ip-card">
        <span className="ip-pic">{<Hourglass size={26} aria-hidden="true" />}</span>
        <div>
          <h2>Ce qui reste à faire</h2>
          <p>L’affichage sur téléphone sera repris d’un seul tenant.</p>
        </div>
      </section>
      <section className="ip-card">
        <span className="ip-pic">{<MessageCircle size={26} aria-hidden="true" />}</span>
        <div>
          <h2>Un obstacle ?</h2>
          <p>
            Si un écran vous pose problème, dites-le-nous : il sera examiné comme un signalement. <Go onClick={() => p.nav('report')}>Signaler un problème</Go>
          </p>
        </div>
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------ Centre d'aide */

function HelpCenter(p: InfoPageProps & { articleId: string }) {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<HelpTopicId | null>(null);
  const articles = HELP_ARTICLES.filter((a) => allowed(a, p));
  const article = articles.find((a) => a.id === p.articleId);
  const results = query.trim() ? searchHelp(articles, query) : null;
  const listed = results || (topic ? articles.filter((a) => a.topic === topic) : articles.slice(0, 6));
  const listTitle = results
    ? `Résultats pour « ${query.trim()} »`
    : topic
      ? HELP_TOPICS.find((t) => t.id === topic)?.label || 'Articles'
      : 'Articles suggérés';
  const openArticle = (id: string) => {
    setQuery('');
    p.nav('info', `help/${id}`);
  };

  return (
    <>
      <div className="ip-help-band">
        <InfoHeader nav={p.nav} label="Aide" inverted />
        <div className="ip-help-hero">
          {!article && <h1>Bonjour {p.firstName}, nous sommes là pour vous aider.</h1>}
          <label className="ip-help-search">
            <span className="sr-only">Rechercher dans l’aide</span>
            <input
              type="search"
              placeholder="Comment pouvons-nous vous aider ?"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (article) p.nav('info', 'help');
              }}
            />
            <Search size={18} aria-hidden="true" />
          </label>
        </div>
      </div>

      <div className="ip-help-body">
        <main className="ip-help-main">
          {article ? (
            <HelpArticleView article={article} p={p} />
          ) : (
            <>
              {!results && !topic && (
                <section>
                  <h2>Raccourcis SAVOIR+</h2>
                  <ul className="ip-shortcuts">
                    {HELP_SHORTCUTS.filter((l) => allowed(l, p)).map((l) => (
                      <li key={l.label}>
                        <Go onClick={() => follow(l, p)}>{l.label}</Go>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {!results && (
                <section>
                  <div className="ip-help-head">
                    <h2>Sujets</h2>
                    {topic && <Go onClick={() => setTopic(null)}>Tous les sujets</Go>}
                  </div>
                  <ul className="ip-topics">
                    {HELP_TOPICS.map((t) => (
                      <li key={t.id}>
                        <button type="button" className={`ip-topic${topic === t.id ? ' is-on' : ''}`} aria-pressed={topic === t.id} onClick={() => setTopic(topic === t.id ? null : t.id)}>
                          {TOPIC_ICON[t.id]}
                          <span>{t.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section>
                <h2>{listTitle}</h2>
                {listed.length === 0 ? (
                  <p className="ip-muted">Aucun article ne correspond à votre recherche. Essayez avec d’autres mots.</p>
                ) : (
                  <ul className="ip-articles">
                    {listed.map((a) => (
                      <li key={a.id}>
                        <button type="button" className="ip-article-link" onClick={() => openArticle(a.id)}>
                          {a.title}
                        </button>
                        <small>{HELP_TOPICS.find((t) => t.id === a.topic)?.label}</small>
                        <p>{a.excerpt}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </main>

        <aside className="ip-help-aside" aria-label="Autres moyens de vous aider">
          <h2>Autres moyens de vous aider</h2>
          <ul>
            <li>
              <span className="ip-aside-icon">{<Users size={20} aria-hidden="true" />}</span>
              <div>
                <b>Règles de la communauté</b>
                <p>Ce qui garantit une entraide respectueuse et utile.</p>
                <Go onClick={() => p.nav('info', 'privacy/community')}>En savoir plus</Go>
              </div>
            </li>
            <li>
              <span className="ip-aside-icon">{<Accessibility size={20} aria-hidden="true" />}</span>
              <div>
                <b>Accessibilité</b>
                <p>Ce qui est en place, et ce qui reste à faire.</p>
                <Go onClick={() => p.nav('info', 'accessibility')}>En savoir plus</Go>
              </div>
            </li>
            <li>
              <span className="ip-aside-icon">{<LifeBuoy size={20} aria-hidden="true" />}</span>
              <div>
                <b>Signaler un problème</b>
                <p>Un contenu, un échange ou un écran qui ne va pas.</p>
                <Go onClick={() => p.nav('report')}>Faire un signalement</Go>
              </div>
            </li>
          </ul>
        </aside>
      </div>
    </>
  );
}

function HelpArticleView({ article, p }: { article: HelpArticle; p: InfoPageProps }) {
  const topic = HELP_TOPICS.find((t) => t.id === article.topic);
  const links = article.links.filter((l) => allowed(l, p));
  const related = HELP_ARTICLES.filter((a) => a.topic === article.topic && a.id !== article.id && allowed(a, p)).slice(0, 3);
  return (
    <article className="ip-article">
      <nav className="ip-crumbs" aria-label="Fil d’Ariane">
        <Go onClick={() => p.nav('info', 'help')}>Aide</Go>
        <ChevronRight size={14} aria-hidden="true" />
        <span>{topic?.label}</span>
      </nav>
      <h1>{article.title}</h1>
      {article.body.map((text) => (
        <p key={text.slice(0, 24)}>{text}</p>
      ))}
      {links.length > 0 && (
        <p className="ip-article-actions">
          {links.map((l) => (
            <Go key={l.label} onClick={() => follow(l, p)}>
              {l.label}
            </Go>
          ))}
        </p>
      )}
      {related.length > 0 && (
        <section className="ip-related">
          <h2>Articles liés</h2>
          <ul>
            {related.map((a) => (
              <li key={a.id}>
                <Go onClick={() => p.nav('info', `help/${a.id}`)}>{a.title}</Go>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="ip-back">
        <Go onClick={() => p.nav('info', 'help')}>
          <ArrowLeft size={14} aria-hidden="true" /> Retour à l’aide
        </Go>
      </p>
    </article>
  );
}

/* ------------------------------------------------------------------ Confidentialité et conditions */

function LegalPage({ doc, nav }: { doc: LegalDocId; nav: InfoPageProps['nav'] }) {
  const current = LEGAL_DOCS.find((d) => d.id === doc) || LEGAL_DOCS[0];
  return (
    <main className="ip-legal">
      <nav className="ip-legal-nav" aria-label="Documents juridiques">
        <div className="ip-legal-nav-inner">
          {LEGAL_DOCS.map((d) => (
            <button
              key={d.id}
              type="button"
              className={d.id === current.id ? 'is-current' : ''}
              aria-current={d.id === current.id ? 'page' : undefined}
              onClick={() => nav('info', d.id === 'privacy' ? 'privacy' : `privacy/${d.id}`)}
            >
              {d.title}
            </button>
          ))}
        </div>
      </nav>
      <section className="ip-legal-hero">
        <h1>{current.title}</h1>
      </section>
      <div className="ip-column ip-legal-body">
        <p className="ip-effective">{LEGAL_EFFECTIVE}</p>
        {current.sections.map((s) => (
          <section key={s.title}>
            <h2>{s.title}</h2>
            {s.text.map((t) => (
              <p key={t.slice(0, 24)}>{t}</p>
            ))}
          </section>
        ))}
        {current.id === 'privacy' && (
          <p className="ip-legal-actions">
            <Go onClick={() => nav('settings', 'visibility')}>Régler ma visibilité</Go>
            <Go onClick={() => nav('settings', 'data')}>Mes données de démonstration</Go>
          </p>
        )}
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ Hackathon */

function HackathonPage(p: InfoPageProps) {
  return (
    <main className="ip-about">
      <section className="ip-about-hero">
        <span className="ip-mark" aria-hidden="true">
          S<span>+</span>
        </span>
        <h1>SAVOIR+ au Hackathon CREATE WITH AI</h1>
        <p>Prototype présenté par l’équipe Nexus au Hackathon CREATE WITH AI et au Forum Femmes &amp; Intelligence Artificielle 2026. Présentation finale le 5 décembre 2026.</p>
      </section>
      <section className="ip-about-block">
        <h2>Ce qu’il démontre</h2>
        <p>L’apprentissage guidé, avec une progression vérifiable par quiz ; l’entraide directe entre membres ; des espaces pour les familles, les encadrants et les établissements.</p>
      </section>
      <section className="ip-about-block">
        <h2>Le rôle de l’IA</h2>
        <p>Dans le studio, l’IA propose des sections, un quiz et une fiche à partir de l’explication d’un encadrant ; l’encadrant relit et corrige avant d’enregistrer.</p>
      </section>
      <section className="ip-about-block">
        <p className="ip-about-actions">
          {p.isLocal && p.onStartTour && <Go onClick={p.onStartTour}>Lancer la visite guidée</Go>}
          <Go onClick={() => p.nav('catalog')}>Explorer la bibliothèque</Go>
        </p>
      </section>
    </main>
  );
}

