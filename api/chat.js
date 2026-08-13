import crypto from 'node:crypto';

const COOKIE = 'vom_admin';
const TTL = 12 * 60 * 60 * 1000;
const LOGIN_WINDOW = 15 * 60 * 1000;
const LOGIN_LIMIT = 5;
const CHAT_WINDOW = 60 * 1000;
const CHAT_LIMIT = 20;
const MAX_BODY_BYTES = 200 * 1024;
const attempts = new Map();
const chatAttempts = new Map();
const REPO = process.env.CMS_GITHUB_REPO || 'wwwclinchworks/VoiceOMagicc';
const BRANCH = process.env.CMS_GITHUB_BRANCH || 'main';
const PATH = process.env.CMS_GITHUB_PATH || 'data/knowledge.json';
const DEFAULT_CMS = {
  settings: {
    resourcesLabel: 'Free Masterclass Vault', resourcesHeading: 'Resource of the Week',
    resourcesParagraph: "Watch this week's featured video and download instant guides, articulation checklists, and vocal warm-up frameworks.",
    resourcesExtraParagraph: '', toolkitHeading: 'Event Organizer Speaker Toolkit',
    toolkitDescription: "Download Shalini Mukund's Speaker One-Sheet, AV Technical Rider, and Press Kit.",
    booksLabel: 'Intellectual Property', booksHeading: 'Published Works',
    booksParagraph: 'Books authored by Shalini Mukund exploring human resilience, personal leadership, and practical parenting strategies.',
    maintenanceMode: false
  },
  featuredVideo: { url: 'https://www.youtube-nocookie.com/embed/KKNCiRWd_j0', title: 'What Is an AI Anyway?', description: 'A deep dive into communication, perception, and the evolving landscape of intelligence. Watch to glean insights on structured thought and presentation clarity.', published: true },
  resources: [], toolkit: [], books: []
};

function json(res, status, body) { res.status(status).json(body); }

function clean(v, max = 5000) {
  return String(v ?? '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max);
}

function securityHeaders(res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
}

function originOk(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  return origin === `${proto}://${req.headers.host}`;
}

function clientIp(req) {
  return String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .split(',')[0].trim().slice(0, 128);
}

function bodyTooLarge(req) {
  const length = Number.parseInt(String(req.headers['content-length'] || ''), 10);
  return Number.isFinite(length) && length > MAX_BODY_BYTES;
}

function allowWindow(map, ip, windowMs, limit) {
  const now = Date.now();
  const current = map.get(ip) || { n: 0, at: now };
  if (now - current.at >= windowMs) {
    current.n = 0;
    current.at = now;
  }
  current.n += 1;
  map.set(ip, current);
  return current.n <= limit;
}

function sign(payload) {
  return crypto.createHmac('sha256', process.env.CMS_SESSION_SECRET).update(payload).digest('base64url');
}

function makeCookie() {
  const payload = Buffer.from(JSON.stringify({ iat: Date.now(), n: crypto.randomUUID() })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function validCookie(req) {
  const header = req.headers.cookie || '';
  const match = header.split(';').map((x) => x.trim()).find((x) => x.startsWith(`${COOKIE}=`));
  if (!match || !process.env.CMS_SESSION_SECRET) return false;
  const raw = match.slice(COOKIE.length + 1);
  const [payload, signature] = raw.split('.');
  if (!payload || !signature) return false;
  const expected = sign(payload);
  if (signature.length !== expected.length) return false;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return Number.isFinite(data.iat) && Date.now() - data.iat < TTL;
  } catch {
    return false;
  }
}

function cookie(res, value) {
  res.setHeader('Set-Cookie', `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${Math.floor(TTL / 1000)}`);
}

function clearCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
}

function drive(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && (u.hostname === 'drive.google.com' || u.hostname === 'docs.google.com');
  } catch { return false; }
}

function https(url) {
  try { return new URL(url).protocol === 'https:'; } catch { return false; }
}

function yt(value) {
  try {
    const u = new URL(value);
    const host = u.hostname.toLowerCase();
    let id = '';
    if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
    else if (host === 'youtube.com' || host === 'www.youtube.com') id = u.searchParams.get('v') || u.pathname.split('/')[2] || '';
    else if (host === 'youtube-nocookie.com' || host === 'www.youtube-nocookie.com') id = u.pathname.split('/')[2] || '';
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch { return null; }
}

function uid(x) {
  return /^[A-Za-z0-9_-]{8,80}$/.test(String(x || '')) ? String(x) : crypto.randomUUID();
}

function itemBase(x, isBook = false) {
  if (!x || typeof x !== 'object' || Array.isArray(x)) throw Object.assign(new Error('Invalid CMS item.'), { status: 400 });
  const out = {
    id: uid(x.id),
    title: clean(x.title, 200),
    description: clean(x.description, 1500),
    buttonText: clean(x.buttonText || (isBook ? 'Learn More' : 'Download PDF'), 60),
    order: Number.isInteger(x.order) ? x.order : 0,
    published: x.published !== false
  };
  if (!out.title) throw Object.assign(new Error('Every item needs a title.'), { status: 400 });
  if (isBook) {
    out.bookHeading = clean(x.bookHeading, 200);
    out.authors = clean(x.authors, 240);
    out.categoryLabel = clean(x.categoryLabel, 160);
    out.coverImageUrl = clean(x.coverImageUrl, 1000);
    out.destinationUrl = clean(x.destinationUrl, 2000);
    if (!out.authors) throw Object.assign(new Error('Every book needs author names.'), { status: 400 });
    if (out.coverImageUrl && !https(out.coverImageUrl)) throw Object.assign(new Error('Cover URL must use HTTPS.'), { status: 400 });
    if (out.destinationUrl && !https(out.destinationUrl)) throw Object.assign(new Error('Book destination must use HTTPS.'), { status: 400 });
  } else {
    out.driveUrl = clean(x.driveUrl, 2000);
    if (out.driveUrl && !drive(out.driveUrl)) throw Object.assign(new Error('Drive URL must be a Google Drive/Docs HTTPS URL.'), { status: 400 });
  }
  return out;
}

function normalizeCms(input) {
  const c = { ...DEFAULT_CMS, ...(input && typeof input === 'object' ? input : {}) };
  c.settings = { ...DEFAULT_CMS.settings, ...(input?.settings || {}) };
  for (const [key, max] of Object.entries({
    resourcesLabel: 120, resourcesHeading: 200, resourcesParagraph: 1500, resourcesExtraParagraph: 1500,
    toolkitHeading: 200, toolkitDescription: 1500, booksLabel: 120, booksHeading: 200, booksParagraph: 1500
  })) c.settings[key] = clean(c.settings[key], max);
  c.settings.maintenanceMode = Boolean(c.settings.maintenanceMode);
  c.featuredVideo = {
    url: yt(c.featuredVideo?.url || DEFAULT_CMS.featuredVideo.url) || DEFAULT_CMS.featuredVideo.url,
    title: clean(c.featuredVideo?.title, 160) || DEFAULT_CMS.featuredVideo.title,
    description: clean(c.featuredVideo?.description, 1000),
    published: c.featuredVideo?.published !== false
  };
  c.resources = (Array.isArray(c.resources) ? c.resources : []).map((x) => itemBase(x, false));
  c.toolkit = (Array.isArray(c.toolkit) ? c.toolkit : []).map((x) => itemBase(x, false));
  c.books = (Array.isArray(c.books) ? c.books : []).map((x) => itemBase(x, true));
  return c;
}

function editableSnapshot(cms) {
  const c = normalizeCms(cms);
  return { settings: c.settings, featuredVideo: c.featuredVideo, resources: c.resources, toolkit: c.toolkit, books: c.books };
}

async function github(method, path, body) {
  const token = process.env.CMS_GITHUB_TOKEN;
  if (!token) throw Object.assign(new Error('CMS service unavailable.'), { status: 503 });
  const response = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000)
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!response.ok) {
    const error = new Error('CMS storage request failed.');
    error.status = response.status === 404 ? 404 : response.status >= 500 ? 503 : 502;
    throw error;
  }
  return data;
}

async function readFile(ref = BRANCH) {
  const d = await github('GET', `/repos/${REPO}/contents/${PATH}?ref=${encodeURIComponent(ref)}`);
  if (!d?.content || !d?.sha) throw Object.assign(new Error('CMS content is unavailable.'), { status: 503 });
  try {
    return { sha: d.sha, data: JSON.parse(Buffer.from(d.content.replace(/\n/g, ''), 'base64').toString('utf8')) };
  } catch {
    throw Object.assign(new Error('CMS content is invalid.'), { status: 503 });
  }
}

async function writeFile(data, sha, message) {
  const content = Buffer.from(JSON.stringify(data, null, 2) + '\n').toString('base64');
  return github('PUT', `/repos/${REPO}/contents/${PATH}`, { message, content, sha, branch: BRANCH });
}

async function listVersions() {
  const commits = await github('GET', `/repos/${REPO}/commits?path=${encodeURIComponent(PATH)}&sha=${encodeURIComponent(BRANCH)}&per_page=30`);
  if (!Array.isArray(commits)) return [];
  return commits.map((commit) => ({
    id: commit.sha,
    at: commit.commit?.author?.date || commit.commit?.committer?.date || null,
    message: clean(commit.commit?.message || 'CMS update', 160)
  }));
}

function requireSession(req, res) {
  if (!validCookie(req)) {
    json(res, 401, { error: 'Unauthorized' });
    return false;
  }
  return true;
}

async function publicCms(res) {
  const file = await readFile();
  const cms = editableSnapshot(file.data.cms);
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.setHeader('X-Robots-Tag', 'index, follow');
  return json(res, 200, { cms });
}

export default async function handler(req, res) {
  const mode = req.query?.mode || '';
  securityHeaders(res);

  try {
    if (bodyTooLarge(req)) return json(res, 413, { error: 'Request body is too large.' });

    if (mode === 'public-cms') {
      if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
      return await publicCms(res);
    }

    if (mode === 'admin-login') {
      if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
      if (!process.env.CMS_ADMIN_PASSWORD || !process.env.CMS_SESSION_SECRET || process.env.CMS_SESSION_SECRET.length < 32) {
        return json(res, 503, { error: 'Admin authentication is temporarily unavailable.' });
      }
      const ip = clientIp(req);
      if (!allowWindow(attempts, ip, LOGIN_WINDOW, LOGIN_LIMIT)) return json(res, 429, { error: 'Too many login attempts. Try again later.' });
      const password = clean(req.body?.password, 500);
      if (!password) return json(res, 400, { error: 'Password is required.' });
      const a = Buffer.from(password);
      const b = Buffer.from(process.env.CMS_ADMIN_PASSWORD);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return json(res, 401, { error: 'Invalid password.' });
      cookie(res, makeCookie());
      return json(res, 200, { ok: true });
    }

    if (mode === 'admin-logout') {
      if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
      clearCookie(res);
      return json(res, 200, { ok: true });
    }

    if (mode === 'admin-data') {
      if (req.method !== 'GET' || !requireSession(req, res)) return;
      const file = await readFile();
      const [versions, cms] = await Promise.all([listVersions(), Promise.resolve(normalizeCms(file.data.cms))]);
      return json(res, 200, { cms, versions });
    }

    if (mode === 'admin-save') {
      if (req.method !== 'POST' || !requireSession(req, res) || !originOk(req)) return;
      if (!req.body?.cms || typeof req.body.cms !== 'object') return json(res, 400, { error: 'CMS payload is required.' });
      const next = normalizeCms(req.body.cms);
      const file = await readFile();
      file.data.cms = next;
      await writeFile(file.data, file.sha, 'cms: update Voice-O-Magic content');
      return json(res, 200, { ok: true, cms: next });
    }

    if (mode === 'admin-restore') {
      if (req.method !== 'POST' || !requireSession(req, res) || !originOk(req)) return;
      const versionId = String(req.body?.versionId || '');
      if (!/^[a-f0-9]{40}$/i.test(versionId)) return json(res, 400, { error: 'Invalid version.' });
      const [current, version] = await Promise.all([readFile(), readFile(versionId)]);
      const restored = normalizeCms(version.data.cms);
      current.data.cms = restored;
      await writeFile(current.data, current.sha, 'cms: restore Voice-O-Magic content version');
      return json(res, 200, { ok: true, cms: restored });
    }

    if (mode) return json(res, 404, { error: 'Unknown mode' });

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return json(res, 405, { error: 'Method not allowed' });
    }

    const ip = clientIp(req);
    if (!allowWindow(chatAttempts, ip, CHAT_WINDOW, CHAT_LIMIT)) return json(res, 429, { error: 'Too many AI requests. Please try again shortly.' });

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return json(res, 503, { error: 'AI service is temporarily unavailable.' });

    const body = req.body || {};
    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (!messages.length) return json(res, 400, { error: 'Messages are required.' });
    if (messages.length > 12) return json(res, 400, { error: 'Conversation is too long. Please start a new chat.' });

    const safeMessages = messages
      .filter((message) => message && (message.role === 'system' || message.role === 'user' || message.role === 'assistant') && typeof message.content === 'string')
      .map((message) => ({ role: message.role, content: message.content.slice(0, 6000) }));
    if (!safeMessages.length) return json(res, 400, { error: 'Valid messages are required.' });

    const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
    const host = req.headers.host || 'voice-o-magicc-71yc.vercel.app';
    let response;
    try {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': `${proto}://${host}`,
          'X-Title': 'Voice-O-Magic'
        },
        body: JSON.stringify({ model: 'openrouter/free', messages: safeMessages, temperature: 0.3, max_tokens: 300 }),
        signal: AbortSignal.timeout(15000)
      });
    } catch {
      return json(res, 502, { error: 'AI service is temporarily unavailable.' });
    }

    if (!response.ok) {
      if (response.status === 429) return json(res, 429, { error: 'AI service is busy. Please try again shortly.' });
      return json(res, 502, { error: 'AI service is temporarily unavailable.' });
    }

    const data = await response.json().catch(() => null);
    const answer = data?.choices?.[0]?.message?.content;
    if (!answer || typeof answer !== 'string') return json(res, 502, { error: 'AI service returned an invalid response.' });
    return json(res, 200, data);
  } catch (error) {
    console.error('Voice-O-Magic API error:', error);
    const status = Number.isInteger(error?.status) && error.status >= 400 && error.status < 500 ? error.status : 500;
    return json(res, status, { error: status === 500 ? 'Request failed.' : (error.message || 'Request failed.') });
  }
}
