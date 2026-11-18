/**
 * Pages d'information du pied de page (À propos, Accessibilité, Centre d'aide, Confidentialité et
 * conditions, Hackathon) : de vraies pages, à l'adresse « #info/<rubrique> », et non plus des fenêtres
 * superposées. Chaque lien mène à l'endroit qu'il nomme ; rien n'est annoncé que le site ne fasse pas.
 */
import React from 'react';
import type { FooterInfoTopic } from '../components/SidebarFooters';
import { Tabs } from '../components/ui';

const TOPICS: { id: FooterInfoTopic; label: string }[] = [
  { id: 'about', label: 'À propos' },
  { id: 'accessibility', label: 'Accessibilité' },
  { id: 'help', label: 'Centre d’aide' },
  { id: 'privacy', label: 'Confidentialité et conditions' },
  { id: 'hackathon', label: 'Hackathon' }
];

export const isInfoTopic = (id: string): id is FooterInfoTopic => TOPICS.some((t) => t.id === id);

/** Lien vers un endroit du site, dans le texte. */
function Go({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className="li-text-link info-go" onClick={onClick}>
      {children}
    </button>
  );
}

export function InfoPage({
  topic,
  nav,
  canPublish,
  isGuardian,
  isLocal,
  onStartTour
}: {
  topic: string;
  nav: (page: any, id?: string) => void;
  canPublish: boolean;
  isGuardian: boolean;
  /** Démonstration locale : visite guidée et réinitialisation possibles. */
  isLocal: boolean;
  onStartTour?: () => void;
}) {
  const current: FooterInfoTopic = isInfoTopic(topic) ? topic : 'about';
  const title = TOPICS.find((t) => t.id === current)?.label || 'À propos';

  return (
    <div className="dashboard-grid is-single info-page">
      <div className="dashboard-main">
        <h1 className="sr-only">{title}</h1>
        <Tabs<FooterInfoTopic> label="Pages d’information" value={current} onChange={(id) => nav('info', id)} items={TOPICS} />

        <article className="wf-card info-article">
          {current === 'about' && (
            <>
              <section>
                <h2>Ce qu’est SAVOIR+</h2>
                <p>
                  Une plateforme d’apprentissage et d’entraide : des modules courts qui se terminent par un quiz, une communauté qui
                  répond aux questions, et des espaces pour les familles, les encadrants et les établissements.
                </p>
              </section>
              <section>
                <h2>Pour qui</h2>
                <ul>
                  <li>
                    <b>Apprenants</b> : modules, calendrier et plan de révision, entraide.
                  </li>
                  <li>
                    <b>Parents</b> : le message de la semaine pour chaque enfant, son plan de révision, et le verrouillage de SAVOIR+ avant
                    12 ans.
                  </li>
                  <li>
                    <b>Encadrants</b> : leurs classes, ce qui bloque, et le studio pour créer des modules.
                  </li>
                  <li>
                    <b>Établissements</b> : l’avancement des classes, la planification du trimestre, la bibliothèque de leurs
                    enseignants.
                  </li>
                </ul>
              </section>
              <section>
                <h2>Comment nous le concevons</h2>
                <p>
                  Les choix d’interface s’appuient sur des études (lisibilité, explications des recommandations, contrôle parental)
                  plutôt que sur le goût du moment ; elles sont citées dans la documentation du projet.
                </p>
              </section>
              <section>
                <h2>L’équipe</h2>
                <p>
                  SAVOIR+ est conçu par l’équipe Nexus pour le Hackathon CREATE WITH AI.{' '}
                  <Go onClick={() => nav('info', 'hackathon')}>Le projet au hackathon</Go>
                </p>
              </section>
            </>
          )}

          {current === 'accessibility' && (
            <>
              <section>
                <h2>Notre objectif</h2>
                <p>Les bonnes pratiques du référentiel WCAG 2.2, niveau AA.</p>
              </section>
              <section>
                <h2>Ce qui est en place</h2>
                <ul>
                  <li>La navigation au clavier, avec un contour visible sur l’élément actif.</li>
                  <li>
                    Aucun état signalé par la couleur seule : un repère ✓, – ou ✕ accompagne la couleur, et la précision est lue par les
                    lecteurs d’écran.
                  </li>
                  <li>Un texte de lecture en 18 px, avec des lignes d’environ 70 caractères.</li>
                  <li>
                    Les animations réduites sur demande. <Go onClick={() => nav('settings', 'account/motion')}>Réduire les animations</Go>
                  </li>
                  <li>Le film de la page de connexion est muet, décoratif, et ne se charge pas sur un petit écran.</li>
                </ul>
              </section>
              <section>
                <h2>Ce qui reste à faire</h2>
                <p>L’affichage sur téléphone sera repris d’un seul tenant.</p>
              </section>
              <section>
                <h2>Un obstacle ?</h2>
                <p>
                  Décrivez-le-nous : il sera examiné comme un signalement. <Go onClick={() => nav('report')}>Signaler un problème</Go>
                </p>
              </section>
            </>
          )}

          {current === 'help' && (
            <>
              <section className="info-qa">
                <h2>Reprendre un module</h2>
                <p>
                  L’anneau de la barre du haut, ou la carte « Reprise » de l’accueil, vous ramène où vous vous êtes arrêté : à la lecture,
                  ou au quiz quand toutes les parties sont lues. <Go onClick={() => nav('learning')}>Mes apprentissages</Go>
                </p>
              </section>
              {canPublish && (
                <section className="info-qa">
                  <h2>Poser une question à la communauté</h2>
                  <p>
                    Une question claire, son domaine, et ce que vous avez déjà essayé. <Go onClick={() => nav('community-compose')}>Poser une question</Go>
                  </p>
                </section>
              )}
              <section className="info-qa">
                <h2>Choisir ou changer de formule</h2>
                <p>
                  Dans Paramètres, rubrique Abonnement. Démonstration : le paiement est simulé, aucun argent n’est débité.{' '}
                  <Go onClick={() => nav('settings', 'account/plan')}>Ma formule</Go>
                </p>
              </section>
              <section className="info-qa">
                <h2>Le compte d’un enfant de moins de 12 ans</h2>
                <p>
                  Il s’ouvre avec un code créé par un parent dont l’identité est vérifiée ; le code vaut sept jours et n’ouvre qu’un
                  compte. Le parent règle ensuite le verrouillage de SAVOIR+ sur la fiche de l’enfant.
                  {isGuardian && (
                    <>
                      {' '}
                      <Go onClick={() => nav('family')}>Espace famille</Go>
                    </>
                  )}
                </p>
              </section>
              <section className="info-qa">
                <h2>Signaler un contenu ou un échange</h2>
                <p>
                  Votre identité reste confidentielle vis-à-vis de la personne signalée. <Go onClick={() => nav('report')}>Faire un signalement</Go>
                </p>
              </section>
              {isLocal && (
                <section className="info-qa">
                  <h2>Découvrir la démonstration</h2>
                  <p>
                    La visite guidée montre l’essentiel en quatre rôles : apprenante, parent, établissement, encadrant. Pour repartir de
                    zéro, Paramètres permet de réinitialiser la démonstration.{' '}
                    {onStartTour && <Go onClick={onStartTour}>Lancer la visite guidée</Go>}
                  </p>
                </section>
              )}
            </>
          )}

          {current === 'privacy' && (
            <>
              <section>
                <h2>Ce qui reste privé</h2>
                <p>
                  Votre progression, vos résultats de quiz et vos messages privés ne sont pas publiés sur votre profil. Vous choisissez
                  qui voit votre profil et votre progression, et qui peut vous écrire.{' '}
                  <Go onClick={() => nav('settings', 'visibility')}>Visibilité</Go>
                </p>
              </section>
              <section>
                <h2>Vos données de démonstration</h2>
                <p>
                  Elles restent dans votre navigateur ; vous pouvez les télécharger ou les effacer.{' '}
                  <Go onClick={() => nav('settings', 'data')}>Confidentialité des données</Go>
                </p>
              </section>
              <section>
                <h2>Ce qui est simulé</h2>
                <p>
                  Les paiements, la vérification d’identité (aucune pièce n’est reçue ni conservée) et les comptes de mineurs sont simulés,
                  avec une mention à l’écran. La caméra n’est jamais utilisée.
                </p>
              </section>
              <section>
                <h2>Les mineurs</h2>
                <p>
                  Aucune publicité avant 12 ans ; le compte s’ouvre avec le code d’un parent, qui peut ensuite verrouiller SAVOIR+ selon son
                  besoin. Le parent suit l’avancement des modules de la classe de son enfant et son temps passé ; il ne voit pas ses
                  messages privés.
                </p>
              </section>
              <section>
                <h2>La publicité</h2>
                <p>
                  Avec l’offre gratuite, une carte publicitaire est affichée ; une formule payante permet de la masquer. Aucune annonce n’est
                  choisie d’après ce que vous faites sur le site.
                </p>
              </section>
              <section>
                <h2>Conditions d’utilisation</h2>
                <p>
                  Respecter les autres membres, ne pas publier de coordonnées ni d’informations personnelles. Les signalements sont
                  examinés par l’équipe de modération, et une décision peut être contestée par un recours.
                </p>
              </section>
            </>
          )}

          {current === 'hackathon' && (
            <>
              <section>
                <h2>Le projet</h2>
                <p>
                  Prototype présenté par l’équipe Nexus au Hackathon CREATE WITH AI et au Forum Femmes &amp; Intelligence Artificielle
                  2026. Présentation finale le 5 décembre 2026.
                </p>
              </section>
              <section>
                <h2>Ce qu’il démontre</h2>
                <ul>
                  <li>L’apprentissage guidé, avec une progression vérifiable par quiz.</li>
                  <li>L’entraide directe entre membres.</li>
                  <li>Des espaces pour les familles, les encadrants et les établissements.</li>
                </ul>
              </section>
              <section>
                <h2>Le rôle de l’IA</h2>
                <p>
                  Dans le studio, l’IA propose des sections, un quiz et une fiche à partir de l’explication d’un encadrant ; l’encadrant
                  relit et corrige avant d’enregistrer.
                </p>
              </section>
              <section>
                <p>
                  {isLocal && onStartTour && (
                    <>
                      <Go onClick={onStartTour}>Lancer la visite guidée</Go>
                      {' · '}
                    </>
                  )}
                  <Go onClick={() => nav('catalog')}>Explorer la bibliothèque</Go>
                </p>
              </section>
            </>
          )}
        </article>
      </div>
    </div>
  );
}
