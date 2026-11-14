export const emptyProgress = () => ({ lessons: [], answers: [], submitted: false });
export function progressPercent(p) {
  return Math.round(((new Set(p.lessons).size + (p.submitted ? 1 : 0)) / 4) * 100);
}
export function xp(p) {
  return new Set(p.lessons).size * 25 + (p.submitted ? 75 : 0);
}
export function completeLesson(p, index) {
  if (![0, 1, 2].includes(index)) throw Error('Leçon invalide');
  return { ...p, lessons: [...new Set([...p.lessons, index])].sort() };
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

export function moduleProgressPercent(p, lessonCount = 3) {
  const safeCount = Math.max(1, lessonCount);
  const doneLessons = new Set((p?.lessons || []).filter((i) => i >= 0 && i < safeCount)).size;
  return Math.round(((doneLessons + (p?.submitted ? 1 : 0)) / (safeCount + 1)) * 100);
}

export function moduleXp(p, lessonCount = 3) {
  const safeCount = Math.max(1, lessonCount);
  const doneLessons = new Set((p?.lessons || []).filter((i) => i >= 0 && i < safeCount)).size;
  return doneLessons * 25 + (p?.submitted ? 75 : 0);
}

export function canRequestContactByPolicy(recipientPolicy, recipientFollowsRequester, blocked = false) {
  if (blocked) return false;
  if (recipientPolicy === 'Personne') return false;
  if (recipientPolicy === 'Personnes que je suis') return !!recipientFollowsRequester;
  return true;
}
