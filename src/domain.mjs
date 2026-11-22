export const emptyProgress = () => ({ lessons: [], answers: [], submitted: false });
export function progressPercent(p) {
  return Math.round(((new Set(p.lessons).size + (p.submitted ? 1 : 0)) / 4) * 100);
}
export function xp(p) {
  return new Set(p.lessons).size * 25 + (p.submitted ? 75 : 0);
}
/** Marque une section lue. `lessonCount` : nombre de sections du module (3 par défaut, pour les anciens appels). */
export function completeLesson(p, index, lessonCount = 3) {
  if (!Number.isInteger(index) || index < 0 || index >= Math.max(1, lessonCount)) throw Error('Leçon invalide');
  return { ...p, lessons: [...new Set([...p.lessons, index])].sort((a, b) => a - b) };
}
export function score(answers) {
  return answers.reduce((n, a, i) => n + (a === [1, 2, 0][i] ? 1 : 0), 0);
}
export function pairId(a, b) {
  if (a === b) throw Error('Deux personnes distinctes sont nécessaires');
  return [a, b].sort().join('__');
}
export function canSend(r, uid) {
  return !!r && r.members.includes(uid) && r.status === 'accepted' && r.blockedBy.length === 0;
}

export function scoreAnswers(answers = [], correctIndices = [1, 2, 0]) {
  return correctIndices.reduce((total, expected, idx) => total + (answers[idx] === expected ? 1 : 0), 0);
}

/** Seuil de réussite du quiz : 2/3 bonnes réponses (arrondi supérieur de 66 %). */
export function quizPassThreshold(questionCount = 3) {
  return Math.max(1, Math.ceil(Math.max(1, questionCount) * 0.66));
}

/**
 * Quiz validé = réponses envoyées ET seuil atteint. Un quiz échoué ne valide pas le module
 * et ne rapporte pas les 75 XP. Sans corrigé (`correctIndices` absent), seul l'envoi compte (ancien comportement).
 */
export function isQuizPassed(p, correctIndices) {
  if (!p?.submitted) return false;
  if (!Array.isArray(correctIndices)) return true;
  return scoreAnswers(p.answers || [], correctIndices) >= quizPassThreshold(correctIndices.length);
}

export function moduleProgressPercent(p, lessonCount = 3, correctIndices) {
  const safeCount = Math.max(1, lessonCount);
  const doneLessons = new Set((p?.lessons || []).filter((i) => i >= 0 && i < safeCount)).size;
  return Math.round(((doneLessons + (isQuizPassed(p, correctIndices) ? 1 : 0)) / (safeCount + 1)) * 100);
}

/**
 * XP d'une section lue, selon le rang du niveau (1 Initiation … 5 Expert) : 20, 25, 30, 35, 40.
 * Un contenu plus exigeant rapporte plus ; un module plus long aussi, puisque chaque section compte.
 */
export function lessonXp(levelRank = 2) {
  return 15 + 5 * Math.min(5, Math.max(1, Math.round(levelRank) || 2));
}

/** XP du quiz réussi : trois sections du même niveau (60, 75, 90, 105, 120). */
export function quizXp(levelRank = 2) {
  return 3 * lessonXp(levelRank);
}

/** XP qu'un module peut rapporter : toutes ses sections, plus son quiz. */
export function moduleMaxXp(lessonCount = 3, levelRank = 2) {
  return Math.max(1, lessonCount) * lessonXp(levelRank) + quizXp(levelRank);
}

export function moduleXp(p, lessonCount = 3, correctIndices, levelRank = 2) {
  const safeCount = Math.max(1, lessonCount);
  const doneLessons = new Set((p?.lessons || []).filter((i) => i >= 0 && i < safeCount)).size;
  return doneLessons * lessonXp(levelRank) + (isQuizPassed(p, correctIndices) ? quizXp(levelRank) : 0);
}

export function canRequestContactByPolicy(recipientPolicy, recipientFollowsRequester, blocked = false) {
  if (blocked) return false;
  if (recipientPolicy === 'Personne') return false;
  if (recipientPolicy === 'Personnes que je suis') return !!recipientFollowsRequester;
  return true;
}
