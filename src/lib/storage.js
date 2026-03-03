// ── LocalStorage helpers ──────────────────────────────────────────────────────
const PREFIX = 'autotuber_';

export const store = {
  get: (key) => {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v ? JSON.parse(v) : null;
    } catch { return null; }
  },
  set: (key, value) => {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch {}
  },
  remove: (key) => {
    try { localStorage.removeItem(PREFIX + key); } catch {}
  },
};

// ── User helpers ──────────────────────────────────────────────────────────────
export function getUsers() { return store.get('users') || []; }
export function saveUsers(u) { store.set('users', u); }

export function createUser({ name, email, password }) {
  const users = getUsers();
  if (users.find(u => u.email === email)) throw new Error('Email already registered.');
  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    password, // plain for demo — in production use hashed
    plan: 'free',
    createdAt: new Date().toISOString(),
    services: { elKey: '', ytClientId: '', ytToken: null, ytChannel: null, igToken: '', igAccount: null },
    billing: { videosUsedThisMonth: 0, periodStart: new Date().toISOString() },
  };
  users.push(user);
  saveUsers(users);
  return user;
}

export function loginUser({ email, password }) {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) throw new Error('Invalid email or password.');
  return user;
}

export function updateUser(id, patch) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) throw new Error('User not found.');
  users[idx] = { ...users[idx], ...patch };
  saveUsers(users);
  return users[idx];
}

// ── Video helpers ─────────────────────────────────────────────────────────────
export function getVideos(userId) {
  const all = store.get('videos') || [];
  return all.filter(v => v.userId === userId);
}

export function getAllVideos() { return store.get('videos') || []; }

export function saveVideo(video) {
  const all = getAllVideos();
  const idx = all.findIndex(v => v.id === video.id);
  if (idx === -1) all.push(video);
  else all[idx] = video;
  store.set('videos', all);
  return video;
}

export function deleteVideo(id) {
  const all = getAllVideos().filter(v => v.id !== id);
  store.set('videos', all);
}

export function createDraftVideo({ userId, title, niche, hook, description, tags, thumbnailText, viewsPotential }) {
  const video = {
    id: crypto.randomUUID(),
    userId,
    title,
    niche,
    hook,
    description,
    tags: tags || [],
    thumbnailText: thumbnailText || '',
    viewsPotential: viewsPotential || 'High',
    fullScript: '',
    status: 'draft', // draft | rendering | published | failed
    videoStyle: 'gradient',
    voiceId: '21m00Tcm4TlvDq8ikWAM',
    platforms: [],
    renderUrl: null,
    ytVideoId: null,
    igMediaId: null,
    publishedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return saveVideo(video);
}

export function publishVideo(id) {
  const all = getAllVideos();
  const idx = all.findIndex(v => v.id === id);
  if (idx === -1) throw new Error('Video not found.');
  if (all[idx].status === 'published') throw new Error('Already published.');
  all[idx] = { ...all[idx], status: 'published', publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  store.set('videos', all);
  return all[idx];
}

// ── Session helpers ───────────────────────────────────────────────────────────
export function getSession() { return store.get('session'); }
export function setSession(userId) { store.set('session', { userId, at: new Date().toISOString() }); }
export function clearSession() { store.remove('session'); }
