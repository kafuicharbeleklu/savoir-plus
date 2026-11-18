/**
 * Accueil personnalisé : « Recommandé pour vous » et ordre du fil d'entraide, propres à chaque profil.
 *
 * Ce qui compte, dans l'ordre : ce que l'école a donné (modules de la classe, ou de celle d'un enfant),
 * ce qui est commencé, les personnes liées (enseignants, camarades, enfants), les comptes suivis, puis
 * les centres d'intérêt déclarés. Un contenu déjà validé ou écrit par le membre n'est pas proposé.
 *
 * Fondements, relevés le 18 novembre 2026 :
 * – chaque recommandation porte une raison courte et personnelle : les explications personnalisées
 *   renforcent davantage la confiance que les explications génériques, mais le détail ajoute de
 *   l'effort (Guesmi et al., RecSys 2021) — une seule ligne, donc ;
 * – une place reste à un domaine que le membre ne suit pas encore, pour ne pas l'enfermer dans ses goûts.
 */
import {
  childrenOf,
  classesOfStudent,
  guardiansOf,
  learnersOf,
  studentsOfClass,
  type SchoolState
} from './school';
import type { CatalogItem, CommunityPost } from './wireframeData';

export type ViewerKind = 'learner' | 'educator' | 'guardian' | 'institution';
type Domain = CatalogItem['domain'];

/** Ce que l'accueil sait du membre qui le lit. */
export interface Viewer {
  id: string;
  kind: ViewerKind;
  /** Centres d'intérêt déclarés sur le profil, tels qu'écrits. */
  interests: string[];
  /** Contenus donnés par l'école : identifiant → raison (« Donné à Terminale D », « Classe d'Elom »). */
  assigned: Record<string, string>;
  /** Personnes liées par l'école ou la famille : identifiant → lien, à lire après le nom (« enseigne dans votre classe »). */
  related: Record<string, string>;
  following: string[];
  /** Modules validés, et modules commencés mais pas validés. */
  done: string[];
  started: string[];
}

/** Mots qui rattachent un centre d'intérêt à un domaine de la bibliothèque. */
const DOMAIN_WORDS: Record<Domain, string[]> = {
  Numérique: ['numerique', 'cybersecurite', 'securite', 'reseau', 'informatique', 'internet', 'systeme', 'bureautique', 'sciences', 'technologie'],
  Communication: ['communication', 'entraide', 'partage', 'pedagogie', 'enseignement', 'redaction', 'ecriture', 'reunion', 'revision', 'expression'],
  Gestion: ['gestion', 'budget', 'comptabilite', 'entrepreneuriat', 'entreprise', 'finance', 'organisation']
};

/** Minuscules sans accents, pour comparer des mots écrits librement. */
export const fold = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** « Numérique, Entraide » → ['Numérique', 'Entraide']. */
export const parseInterests = (raw: string | undefined): string[] =>
  (raw || '')
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

/** Le premier centre d'intérêt qui relève d'un domaine, ou rien. */
function interestFor(domain: Domain, interests: string[]): string | undefined {
  return interests.find((interest) => {
    const word = fold(interest);
    return DOMAIN_WORDS[domain].some((w) => word.includes(w) || w.includes(word));
  });
}

const firstName = (name: string) => name.split(' ')[0];
/** « de Kokou », « d’Elom » : élision devant une voyelle ou un h. */
const ofName = (name: string) => (/^[aeiouyhàâéèêëîïôûü]/i.test(name) ? `d’${name}` : `de ${name}`);

/**
 * Construit le lecteur de l'accueil à partir du profil, de la vie scolaire et de l'avancement.
 * `moduleState` dit d'un contenu s'il est validé, commencé ou neuf.
 */
export function viewerOf(input: {
  uid: string;
  kind: ViewerKind;
  interests: string | undefined;
  following: string[];
  school: SchoolState;
  nameOf: (id: string) => string;
  contentIds: string[];
  moduleState: (id: string) => 'done' | 'started' | 'new';
}): Viewer {
  const { uid, kind, school, nameOf } = input;
  const assigned: Record<string, string> = {};
  const related: Record<string, string> = {};
  const give = (ids: string[], reason: string) => ids.forEach((id) => (assigned[id] ||= reason));
  const relate = (id: string, link: string) => {
    if (id !== uid) related[id] ||= link;
  };
  const teachersOf = (classIds: string[]) =>
    school.memberships.filter((m) => m.role === 'teacher' && m.status === 'active' && m.classIds.some((c) => classIds.includes(c))).map((m) => m.userId);

  if (kind === 'guardian') {
    for (const child of childrenOf(school, uid)) {
      const childName = firstName(nameOf(child));
      relate(child, 'est votre enfant');
      const classes = classesOfStudent(school, child);
      classes.forEach((c) => give(c.moduleIds, `Classe ${ofName(childName)}`));
      teachersOf(classes.map((c) => c.id)).forEach((t) => relate(t, `enseigne à ${childName}`));
    }
  } else {
    const classes = classesOfStudent(school, uid);
    classes.forEach((c) => give(c.moduleIds, `Donné à ${c.name}`));
    teachersOf(classes.map((c) => c.id)).forEach((t) => relate(t, 'enseigne dans votre classe'));
    classes.forEach((c) => studentsOfClass(school, c.id).forEach((s) => relate(s, 'est dans votre classe')));
    guardiansOf(school, uid).forEach((g) => relate(g, 'est votre parent'));
    school.mentorships
      .filter((m) => m.status === 'active' && m.learnerId === uid)
      .forEach((m) => relate(m.educatorId, 'vous accompagne'));
    if (kind === 'educator') learnersOf(school, uid).forEach((l) => relate(l, 'suit vos cours'));
  }

  const done: string[] = [];
  const started: string[] = [];
  for (const id of input.contentIds) {
    const state = input.moduleState(id);
    if (state === 'done') done.push(id);
    else if (state === 'started') started.push(id);
  }
  return { id: uid, kind, interests: parseInterests(input.interests), assigned, related, following: input.following, done, started };
}

/* ------------------------------------------------------------------ Recommandé pour vous */

export interface Recommendation {
  item: CatalogItem;
  /** Une ligne, montrée sur la carte : pourquoi ce contenu. */
  reason: string;
  score: number;
}

export function recommend(
  items: CatalogItem[],
  viewer: Viewer,
  options: { authorIdOf: (item: CatalogItem) => string | undefined; limit?: number }
): Recommendation[] {
  const limit = options.limit ?? 8;
  const order = new Map(items.map((item, i) => [item.id, i]));
  const interestWords = viewer.interests.map(fold).filter((w) => w.length > 3);

  const scored = items
    .filter((item) => !viewer.done.includes(item.id) && options.authorIdOf(item) !== viewer.id)
    .map((item): Recommendation => {
      const author = options.authorIdOf(item);
      const reasons: [number, string][] = [];
      if (viewer.assigned[item.id]) reasons.push([60, viewer.assigned[item.id]]);
      if (viewer.started.includes(item.id)) reasons.push([30, 'Commencé, à terminer']);
      if (author && viewer.related[author]) reasons.push([25, `${item.author} ${viewer.related[author]}`]);
      if (author && viewer.following.includes(author)) reasons.push([20, `De ${item.author}, que vous suivez`]);
      const interest = interestFor(item.domain, viewer.interests);
      if (interest) reasons.push([25, `Centre d’intérêt : ${interest}`]);
      // Mots d'un intérêt présents dans le titre, le résumé ou les compétences.
      const text = fold(`${item.title} ${item.summary} ${(item.skills || []).join(' ')}`);
      const hits = interestWords.filter((w) => text.includes(w)).length;
      let score = reasons.reduce((sum, [points]) => sum + points, 0) + Math.min(hits, 2) * 8;
      // Un débutant commence par des contenus débutants.
      if (viewer.done.length < 2) score += item.level === 'Débutant' ? 6 : item.level === 'Avancé' ? -6 : 0;
      const reason = reasons.length ? reasons.sort((a, b) => b[0] - a[0])[0][1] : item.level === 'Débutant' ? 'Pour bien commencer' : 'À découvrir';
      return { item, reason, score };
    })
    .sort((a, b) => b.score - a.score || (order.get(a.item.id) ?? 0) - (order.get(b.item.id) ?? 0));

  const top = scored.slice(0, limit);
  // Exploration : si tout relève des domaines déjà suivis, la dernière place va à un autre domaine.
  const followed = new Set((['Numérique', 'Communication', 'Gestion'] as Domain[]).filter((d) => interestFor(d, viewer.interests)));
  if (followed.size > 0 && top.length === limit && top.every((r) => followed.has(r.item.domain))) {
    const other = scored.slice(limit).find((r) => !followed.has(r.item.domain));
    if (other) top[limit - 1] = { ...other, reason: `Pour élargir : ${other.item.domain}` };
  }
  return top;
}

/* ------------------------------------------------------------------ Fil d'entraide */

export interface FeedEntry {
  post: CommunityPost;
  /** Ligne de contexte au-dessus de la publication, seulement pour un lien personnel. */
  context?: string;
  score: number;
}

/**
 * Ordre du fil pour ce membre. Les publications arrivent de la plus récente à la plus ancienne ;
 * la fraîcheur pèse, puis viennent les liens personnels et les centres d'intérêt.
 */
export function rankFeed(posts: CommunityPost[], viewer: Viewer): FeedEntry[] {
  const n = Math.max(posts.length, 1);
  return posts
    .map((post, index): FeedEntry => {
      let score = ((n - index) / n) * 30;
      let context: string | undefined;
      const link = viewer.related[post.authorId];
      if (post.authorId === viewer.id && index < 2) score += 60; // sa propre publication, tout juste parue
      if (link) {
        score += 45;
        context = `${post.authorName} ${link}`;
      }
      if (viewer.following.includes(post.authorId)) {
        score += 35;
        context ||= `Vous suivez ${post.authorName}`;
      }
      if (post.linkedItemId && (viewer.assigned[post.linkedItemId] || viewer.started.includes(post.linkedItemId))) {
        score += 30;
        context ||= viewer.kind === 'guardian' ? 'À propos d’un module de votre enfant' : 'À propos d’un module que vous suivez';
      }
      const interest = interestFor(post.domain, viewer.interests);
      // Un encadrant voit d'abord les questions sans réponse de son domaine : il peut y répondre.
      if (viewer.kind === 'educator' && interest && post.kind === 'question' && !post.solutionReplyId) {
        score += 35;
        context ||= `Une question sans réponse en ${post.domain}`;
      }
      if (interest) score += 20;
      return { post, context, score };
    })
    .sort((a, b) => b.score - a.score);
}
