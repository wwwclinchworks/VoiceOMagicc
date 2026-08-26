import crypto from 'node:crypto';

const COOKIE = 'vom_admin';
const TTL = 12 * 60 * 60 * 1000;
const WRITE_WINDOW = 60 * 1000;
const WRITE_LIMIT = 10;
const MAX_BODY_BYTES = 50 * 1024;
const attempts = new Map();
const REPO = process.env.CMS_GITHUB_REPO || 'wwwclinchworks/VoiceOMagicc';
const BRANCH = process.env.CMS_GITHUB_BRANCH || 'main';
const PATH = process.env.CMS_GITHUB_PATH || 'data/knowledge.json';

function json(res, status, body) { res.status(status).json(body); }
function clean(value, max) { return String(value ?? '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max); }
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
  if (!origin) return false;
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  return origin === `${proto}://${req.headers.host}`;
}
function clientIp(req) {
  return String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim().slice(0, 128);
}
function allowWindow(map, ip, windowMs, limit) {
  const now = Date.now();
  const current = map.get(ip) || { n: 0, at: now };
  if (now - current.at >= windowMs) { current.n = 0; current.at = now; }
  current.n += 1;
  map.set(ip, current);
  return current.n <= limit;
}
function sign(payload) {
  const secret = process.env.CMS_SESSION_SECRET;
  if (!secret) throw new Error('CMS session secret is not configured.');
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}
function validCookie(req) {
  const header = req.headers.cookie || '';
  const match = header.split(';').map((x) => x.trim()).find((x) => x.startsWith(`${COOKIE}=`));
  if (!match || !process.env.CMS_SESSION_SECRET) return false;
  const raw = match.slice(COOKIE.length + 1);
  const [payload, signature] = raw.split('.');
  if (!payload || !signature) return false;
  try {
    const expected = sign(payload);
    if (signature.length !== expected.length) return false;
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return Number.isFinite(data.iat) && Date.now() - data.iat < TTL;
  } catch { return false; }
}
function https(value) {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}
function normalizeHighlight(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Object.assign(new Error('Invalid highlight.'), { status: 400 });
  const imageUrl = clean(value.imageUrl, 2000);
  const title = clean(value.title, 160);
  const description = clean(value.description, 1000);
  const published = value.published !== false;
  if (imageUrl && !https(imageUrl)) throw Object.assign(new Error('Highlight image URL must use HTTPS.'), { status: 400 });
  if (!imageUrl && published) throw Object.assign(new Error('A published highlight needs an image URL.'), { status: 400 });
  return { imageUrl, title, description, published };
}
function normalizeHighlights(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    highlight1: normalizeHighlight(source.highlight1 || {}),
    highlight2: normalizeHighlight(source.highlight2 || {})
  };
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
      'User-Agent': 'Voice-O-Magic-CMS/1.0',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000)
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!response.ok) throw Object.assign(new Error('CMS storage request failed.'), { status: response.status >= 500 ? 503 : 502 });
  return data;
}
async function readFile() {
  const data = await github('GET', `/repos/${REPO}/contents/${PATH}?ref=${encodeURIComponent(BRANCH)}`);
  if (!data?.content || !data?.sha) throw Object.assign(new Error('CMS content is unavailable.'), { status: 503 });
  try {
    return { sha: data.sha, data: JSON.parse(Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8')) };
  } catch { throw Object.assign(new Error('CMS content is invalid.'), { status: 503 }); }
}
async function writeFile(data, sha) {
  const content = Buffer.from(JSON.stringify(data, null, 2) + '\n').toString('base64');
  return github('PUT', `/repos/${REPO}/contents/${PATH}`, {
    message: 'cms: update weekly highlights',
    content,
    sha,
    branch: BRANCH
  });
}

export default async function handler(req, res) {
  securityHeaders(res);
  try {
    if (req.method !== 'PUT') return json(res, 405, { error: 'Method not allowed.' });
    const length = Number.parseInt(String(req.headers['content-length'] || ''), 10);
    if (Number.isFinite(length) && length > MAX_BODY_BYTES) return json(res, 413, { error: 'Request body is too large.' });
    if (!originOk(req)) return json(res, 403, { error: 'Invalid request origin.' });
    if (!validCookie(req)) return json(res, 401, { error: 'Unauthorized' });
    if (!allowWindow(attempts, clientIp(req), WRITE_WINDOW, WRITE_LIMIT)) return json(res, 429, { error: 'Too many highlight updates. Try again shortly.' });

    const weeklyHighlights = normalizeHighlights(req.body?.weeklyHighlights);
    const file = await readFile();
    const next = file.data && typeof file.data === 'object' ? file.data : {};
    next.cms = next.cms && typeof next.cms === 'object' ? next.cms : {};
    next.cms.weeklyHighlights = weeklyHighlights;
    await writeFile(next, file.sha);
    return json(res, 200, { ok: true, weeklyHighlights });
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 500;
    return json(res, status, { error: status >= 500 ? 'Unable to update weekly highlights.' : (error.message || 'Request failed.') });
  }
}
