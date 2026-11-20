import { createClient } from '@supabase/supabase-js';
import config from './supabase-public.json';
import { pairId, canSend, emptyProgress } from './domain.mjs';
import { SCHOOL_PERSONAS } from './seedSchool';

export type Profile = {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  bio: string;
};

export type Progress = {
  lessons: number[];
  answers: number[];
  submitted: boolean;
};

export type Relation = {
  id: string;
  members: string[];
  requester: string;
  recipient: string;
  status: 'pending' | 'accepted' | 'declined';
  blockedBy: string[];
};

/** Ce qu'un message peut porter en plus du texte (démonstration locale : rangé dans le navigateur). */
export type MessageAttachment =
  | { kind: 'image'; name: string; dataUrl: string }
  | { kind: 'file'; name: string; size: number; type: string; dataUrl: string }
  | { kind: 'gif'; id: string };

export type Message = {
  id: string;
  author: string;
  text: string;
  createdAt: number;
  attachment?: MessageAttachment;
};

export type Snapshot = {
  profiles: Profile[];
  progress: Progress;
  relations: Relation[];
};

export const profiles: Profile[] = [
  {
    id: 'afi',
    name: 'Afi Mensah',
    role: 'Apprenante · Cybersécurité & Numérique',
    initials: 'AM',
    color: 'peach',
    bio: 'J’apprends à mieux comprendre le numérique, sécuriser mes usages et partager mes découvertes avec la communauté.'
  },
  {
    id: 'kossi',
    name: 'Kossi Agbo',
    role: 'Créateur & Mentor · Réseaux & Sécurité',
    initials: 'KA',
    color: 'lavender',
    bio: 'Formateur et créateur de modules pratiques. Toujours partant pour concevoir des parcours clairs et aider les apprenants.'
  },
  {
    id: 'nadege',
    name: 'Nadège Koffi',
    role: 'Modération & Gouvernance · SAVOIR+',
    initials: 'NK',
    color: 'mint',
    bio: 'Responsable de la qualité pédagogique, du suivi des signalements et de la gouvernance de la plateforme.'
  },
  // Élève, enfant de moins de 12 ans, parent et établissement : voir seedSchool.ts
  ...SCHOOL_PERSONAS
];

const KEY = 'savoir-demo-v1';

type LocalState = {
  progress: Record<string, Progress>;
  relations: Relation[];
  messages: Record<string, Message[]>;
  names: Record<string, string>;
};

const initial = (): LocalState => ({
  progress: {
    afi: { lessons: [0], answers: [], submitted: false },
    kossi: emptyProgress(),
    nadege: emptyProgress()
  },
  relations: [],
  messages: {},
  names: {}
});

function read(): LocalState {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null') || initial();
  } catch {
    return initial();
  }
}

function write(s: LocalState) {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event('savoir-change'));
}

export function resetDemo() {
  localStorage.removeItem('savoir-extended-v1');
  write(initial());
}

const env = (import.meta as any).env;
export const cloudConfigured = !!((env.VITE_SUPABASE_URL || config.url) && (env.VITE_SUPABASE_PUBLISHABLE_KEY || config.publishableKey));
const db = createClient(env.VITE_SUPABASE_URL || config.url, env.VITE_SUPABASE_PUBLISHABLE_KEY || config.publishableKey);

export const loginCloud = async (email: string, password: string) => {
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw error;
};

export const logoutCloud = async () => {
  const { error } = await db.auth.signOut();
  if (error) throw error;
};

/** Adresse e-mail du compte connecté (mode cloud) ; null hors session. */
export const currentCloudEmail = async (): Promise<string | null> => {
  const { data } = await db.auth.getUser();
  return data.user?.email ?? null;
};

/** Envoie un lien de réinitialisation du mot de passe (mode cloud). */
export const sendPasswordReset = async (email: string) => {
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
};

export const observeAuth = (fn: (id: string | null) => void) => {
  const { data } = db.auth.onAuthStateChange((_event: string, session: { user: { id: string } } | null) =>
    fn(session?.user.id || null)
  );
  return () => data.subscription.unsubscribe();
};

const checked = (r: any) => {
  if (r.error) throw r.error;
  return r.data;
};

const changed = () => window.dispatchEvent(new Event('cloud-change'));
const relationFrom = (r: any): Relation => ({ ...r, blockedBy: r.blocked_by });
const toInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'NM';

function watch(tables: string[], run: () => Promise<void>, fail: (s: string) => void) {
  let alive = true,
    running = false,
    again = false;
  const refresh = async () => {
    if (!alive) return;
    if (running) {
      again = true;
      return;
    }
    running = true;
    try {
      await run();
    } catch {
      if (alive) fail('Connexion Supabase indisponible. Vérifiez votre connexion et votre compte.');
    } finally {
      running = false;
      if (again) {
        again = false;
        void refresh();
      }
    }
  };
  let channel = db.channel(crypto.randomUUID());
  for (const table of tables) {
    channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => void refresh());
  }
  channel.subscribe();
  void refresh();
  const timer = window.setInterval(refresh, 5000);
  window.addEventListener('cloud-change', refresh);
  return () => {
    alive = false;
    clearInterval(timer);
    window.removeEventListener('cloud-change', refresh);
    void db.removeChannel(channel);
  };
}

export function observe(mode: string, uid: string, fn: (s: Snapshot) => void, fail: (s: string) => void) {
  if (mode === 'local') {
    const run = () => {
      const s = read();
      fn({
        profiles: profiles.map((p) => {
          const n = s.names[p.id] || p.name;
          return { ...p, name: n, initials: s.names[p.id] ? toInitials(n) : p.initials };
        }),
        progress: s.progress[uid] || emptyProgress(),
        relations: s.relations.filter((r) => r.members.includes(uid))
      });
    };
    run();
    window.addEventListener('savoir-change', run);
    window.addEventListener('storage', run);
    return () => {
      window.removeEventListener('savoir-change', run);
      window.removeEventListener('storage', run);
    };
  }
  let alive = true;
  const stop = watch(
    ['profiles', 'progress', 'relations'],
    async () => {
      checked(
        await db
          .from('profiles')
          .upsert({ id: uid, name: 'Nouveau membre', role: 'Apprendre ensemble', initials: 'NM', color: 'peach', bio: '' }, { onConflict: 'id', ignoreDuplicates: true })
      );
      const [a, b, c] = await Promise.all([
        db.from('profiles').select('*'),
        db.from('progress').select('lessons,answers,submitted').eq('user_id', uid).eq('module_id', 'phishing').maybeSingle(),
        db.from('relations').select('*')
      ]);
      const next = {
        profiles: checked(a),
        progress: checked(b) || emptyProgress(),
        relations: checked(c).map(relationFrom)
      };
      if (alive) fn(next);
    },
    fail
  );
  return () => {
    alive = false;
    stop();
  };
}

export async function saveProgress(mode: string, uid: string, p: Progress) {
  if (mode === 'local') {
    const s = read();
    s.progress[uid] = p;
    write(s);
  } else {
    checked(await db.from('progress').upsert({ user_id: uid, module_id: 'phishing', ...p }));
    changed();
  }
}

export async function saveName(mode: string, uid: string, name: string) {
  const initials = toInitials(name);
  if (mode === 'local') {
    const s = read();
    s.names[uid] = name;
    write(s);
  } else {
    checked(await db.from('profiles').update({ name, initials }).eq('id', uid));
    changed();
  }
}

export async function requestContact(mode: string, uid: string, other: string) {
  const id = pairId(uid, other);
  const relation: Relation = { id, members: [uid, other].sort(), requester: uid, recipient: other, status: 'pending', blockedBy: [] };
  if (mode === 'local') {
    const s = read();
    if (s.relations.some((r) => r.id === id)) throw Error('Une demande existe déjà pour cette personne.');
    s.relations.push(relation);
    write(s);
  } else {
    checked(await db.from('relations').insert({ id, members: relation.members, requester: uid, recipient: other, status: 'pending', blocked_by: [] }));
    changed();
  }
}

/**
 * Un parent ou tuteur écrit directement à son enfant (le lien est déjà établi par le code parental ou
 * par l'établissement) : la discussion s'ouvre sans demande, comme une relation acceptée. Un blocage
 * posé par l'un des deux est respecté. Démonstration seulement : la vie scolaire n'est pas dans Supabase.
 */
export function openFamilyThread(uid: string, other: string): string {
  const id = pairId(uid, other);
  const s = read();
  const existing = s.relations.find((r) => r.id === id);
  if (!existing) {
    s.relations.push({ id, members: [uid, other].sort(), requester: uid, recipient: other, status: 'accepted', blockedBy: [] });
    write(s);
  } else if (existing.status !== 'accepted' && existing.blockedBy.length === 0) {
    existing.status = 'accepted';
    write(s);
  }
  return id;
}

/**
 * Deux amis (ils se suivent l'un l'autre) : la discussion s'ouvre sans demande, comme entre parent et
 * enfant ; un blocage posé par l'un des deux est respecté. Démonstration locale seulement.
 */
export const openFriendThread = openFamilyThread;

export async function decideContact(mode: string, uid: string, r: Relation, status: 'accepted' | 'declined') {
  if (r.recipient !== uid || r.status !== 'pending' || r.blockedBy.length) throw Error('Cette demande ne peut pas être traitée.');
  if (mode === 'local') {
    const s = read();
    const target = s.relations.find((x) => x.id === r.id);
    if (!target || target.status !== 'pending') throw Error('La demande a changé.');
    target.status = status;
    write(s);
  } else {
    checked(await db.from('relations').update({ status }).eq('id', r.id));
    changed();
  }
}

export async function cancelContact(mode: string, uid: string, r: Relation) {
  if (r.requester !== uid || r.status !== 'pending') throw Error('Seul l’expéditeur peut annuler une demande en attente.');
  if (mode === 'local') {
    const s = read();
    s.relations = s.relations.filter((x) => x.id !== r.id);
    write(s);
  } else {
    checked(await db.from('relations').update({ status: 'declined' }).eq('id', r.id));
    changed();
  }
}

export async function toggleBlock(mode: string, uid: string, r: Relation) {
  const unblock = r.blockedBy.includes(uid);
  if (mode === 'local') {
    const s = read();
    const target = s.relations.find((x) => x.id === r.id)!;
    target.blockedBy = unblock ? target.blockedBy.filter((x) => x !== uid) : [...new Set([...target.blockedBy, uid])];
    if (unblock) target.status = 'declined';
    write(s);
  } else {
    checked(await db.rpc('toggle_relation_block', { relation_key: r.id }));
    changed();
  }
}

/** Date du dernier message d'une discussion (démonstration locale), 0 s'il n'y en a pas. */
export function latestMessageAt(relId: string): number {
  return (read().messages[relId] || []).reduce((latest, m) => Math.max(latest, m.createdAt), 0);
}

export function observeMessages(mode: string, id: string, fn: (s: Message[]) => void, fail: (s: string) => void) {
  if (mode === 'local') {
    const run = () => fn(read().messages[id] || []);
    run();
    window.addEventListener('savoir-change', run);
    window.addEventListener('storage', run);
    return () => {
      window.removeEventListener('savoir-change', run);
      window.removeEventListener('storage', run);
    };
  }
  let alive = true;
  const stop = watch(
    ['messages'],
    async () => {
      const rows = checked(await db.from('messages').select('*').eq('relation_id', id).order('created_at', { ascending: false }).limit(100));
      if (alive) fn(rows.reverse().map((m: any) => ({ id: m.id, author: m.author, text: m.text, createdAt: Date.parse(m.created_at) })));
    },
    fail
  );
  return () => {
    alive = false;
    stop();
  };
}

export async function sendMessage(mode: string, uid: string, r: Relation, text: string, id: string, attachment?: MessageAttachment) {
  if ((!text.trim() && !attachment) || text.length > 1000) throw Error('Écrivez un message de 1 à 1 000 caractères.');
  if (attachment && mode !== 'local') throw Error('Images, fichiers et GIF : disponibles en démonstration locale seulement.');
  if (mode === 'local') {
    const s = read();
    if (!canSend(s.relations.find((x) => x.id === r.id), uid)) throw Error('Discussion non autorisée.');
    s.messages[r.id] ||= [];
    if (!s.messages[r.id].some((m) => m.id === id))
      s.messages[r.id].push({ id, author: uid, text: text.trim(), createdAt: Date.now(), ...(attachment ? { attachment } : {}) });
    try {
      write(s);
    } catch (e) {
      // Le navigateur garde environ 5 Mo pour tout le site : une pièce jointe peut ne plus y tenir.
      if (attachment) throw Error('Pièce jointe trop lourde pour la mémoire de ce navigateur.');
      throw e;
    }
  } else {
    const result = await db.from('messages').insert({ id, relation_id: r.id, author: uid, text: text.trim() });
    if (result.error) {
      if (result.error.code !== '23505') throw result.error;
      const prior = checked(await db.from('messages').select('author,text,relation_id').eq('id', id).single());
      if (prior.author !== uid || prior.text !== text.trim() || prior.relation_id !== r.id) throw Error('Identifiant de message déjà utilisé.');
    }
    changed();
  }
}
