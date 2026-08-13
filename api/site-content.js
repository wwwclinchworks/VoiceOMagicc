import crypto from 'node:crypto';

const COOKIE = 'vom_admin';
const TTL = 12 * 60 * 60 * 1000;
const WINDOW = 10 * 60 * 1000;
const WRITE_LIMIT = 30;
const MAX_BODY_BYTES = 80 * 1024;
const REPO = process.env.CMS_GITHUB_REPO || 'wwwclinchworks/VoiceOMagicc';
const BRANCH = process.env.CMS_GITHUB_BRANCH || 'main';
const PATH = 'data/site-content.json';
const writes = new Map();

const DEFAULT_SITE = {
  announcement: {
    badge: 'Verified Winner',
    supportingText: 'IIMB WSP Alumna • 22+ Yrs Leadership',
    message: 'Now Enrolling: Youth Public Speaking Cohorts & Keynote Bookings',
    ctaText: 'Inquire Now',
    ctaUrl: 'contact.html'
  },
  brand: { name: 'Voice-O-Magic', subtitle: 'Shalini Mukund' },
  home: {
    badge: 'Award-Winning Coach',
    headingLine1: 'Transform Your Voice.',
    headingAccent: 'Master the Stage.',
    headingLine3: 'Command the Room.',
    paragraph: 'Empowering young minds and high-performing leaders with world-class public speaking, creating well-defined content, executive presence, and transformative storytelling.',
    primaryCta: 'Book Shalini for Keynotes',
    secondaryCta: 'Explore Youth Academy',
    stats: [
      { value: '22+', label: 'Years Mastery' },
      { value: '3x', label: 'National Awards' },
      { value: '10k+', label: 'Lives Transformed' }
    ]
  },
  pages: {
    about: { label: 'The Founder', heading: 'About Shalini Mukund', paragraph: 'Educator, National Awardee, Certified Counselor, Storyteller, and Founder of Voice-O-Magic with over 22 years of transformational teaching across India.' },
    keynotes: { label: 'Signature Keynotes', heading: 'Stories That Move Rooms', paragraph: 'High-impact keynotes built around clarity, confidence, storytelling, leadership communication, and memorable audience connection.' },
    academy: { label: 'Youth Development', heading: 'Youth Academy', paragraph: 'A practical public-speaking and confidence journey designed to help young learners communicate clearly, think confidently, and own the stage.' },
    corporate: { label: 'Executive Communication', heading: 'Corporate Training', paragraph: 'Practical communication programs for leaders and teams who want stronger articulation, executive presence, storytelling, and influence.' },
    testimonials: { label: 'Client Voices', heading: 'Testimonials', paragraph: 'Real experiences from learners, families, leaders, and audiences who have experienced Voice-O-Magic.' },
    contact: { label: 'Start a Conversation', heading: 'Contact & Booking', paragraph: 'Tell us what you are looking for and we will help you choose the right keynote, academy program, or communication engagement.' }
  }
};

function json(res, status, body) { res.status(status).json(body); }
function clean(value, max) { return String(value ?? '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max); }
function headers(res, publicMode = false) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('X-Robots-Tag', publicMode ? 'index, follow' : 'noindex, nofollow');
  res.setHeader('Cache-Control', publicMode ? 'public, s-maxage=60, stale-while-revalidate=300' : 'no-store, max-age=0');
}
function originOk(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  return origin === `${proto}://${req.headers.host}`;
}
function tooLarge(req) {
  const length = Number.parseInt(String(req.headers['content-length'] || ''), 10);
  return Number.isFinite(length) && length > MAX_BODY_BYTES;
}
function allow(map, ip, limit) {
  const now = Date.now();
  const current = map.get(ip) || { n: 0, at: now };
  if (now - current.at >= WINDOW) { current.n = 0; current.at = now; }
  current.n += 1;
  map.set(ip, current);
  return current.n <= limit;
}
function clientIp(req) {
  return String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim().slice(0, 128);
}
function sign(payload) { return crypto.createHmac('sha256', process.env.CMS_SESSION_SECRET).update(payload).digest('base64url'); }
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
  } catch { return false; }
}
function requireSession(req, res) {
  if (!validCookie(req)) { json(res, 401, { error: 'Unauthorized' }); return false; }
  return true;
}
function safeLink(value) {
  const v = clean(value, 1000);
  if (!v) return '';
  if (/^https:\/\//i.test(v)) return v;
  if (/^(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_.-]+(?:#[A-Za-z0-9_.-]+)?$/.test(v)) return v;
  if (/^\/(?!\/)[A-Za-z0-9_./-]*(?:#[A-Za-z0-9_.-]+)?$/.test(v)) return v;
  throw Object.assign(new Error('CTA link must be an internal path or HTTPS URL.'), { status: 400 });
}
function textBlock(source, fallback) {
  return {
    label: clean(source?.label, 120) || fallback.label,
    heading: clean(source?.heading, 200) || fallback.heading,
    paragraph: clean(source?.paragraph, 1500) || fallback.paragraph
  };
}
function normalize(input) {
  const source = input && typeof input === 'object' ? input : {};
  const a = source.announcement || {};
  const b = source.brand || {};
  const h = source.home || {};
  const pages = source.pages || {};
  const site = {
    announcement: {
      badge: clean(a.badge, 80) || DEFAULT_SITE.announcement.badge,
      supportingText: clean(a.supportingText, 160) || DEFAULT_SITE.announcement.supportingText,
      message: clean(a.message, 220) || DEFAULT_SITE.announcement.message,
      ctaText: clean(a.ctaText, 80) || DEFAULT_SITE.announcement.ctaText,
      ctaUrl: safeLink(a.ctaUrl || DEFAULT_SITE.announcement.ctaUrl)
    },
    brand: {
      name: clean(b.name, 100) || DEFAULT_SITE.brand.name,
      subtitle: clean(b.subtitle, 100) || DEFAULT_SITE.brand.subtitle
    },
    home: {
      badge: clean(h.badge, 100) || DEFAULT_SITE.home.badge,
      headingLine1: clean(h.headingLine1, 120) || DEFAULT_SITE.home.headingLine1,
      headingAccent: clean(h.headingAccent, 120) || DEFAULT_SITE.home.headingAccent,
      headingLine3: clean(h.headingLine3, 120) || DEFAULT_SITE.home.headingLine3,
      paragraph: clean(h.paragraph, 1500) || DEFAULT_SITE.home.paragraph,
      primaryCta: clean(h.primaryCta, 100) || DEFAULT_SITE.home.primaryCta,
      secondaryCta: clean(h.secondaryCta, 100) || DEFAULT_SITE.home.secondaryCta,
      stats: Array.isArray(h.stats) ? h.stats.slice(0, 3).map((item, index) => ({
        value: clean(item?.value, 30) || DEFAULT_SITE.home.stats[index].value,
        label: clean(item?.label, 80) || DEFAULT_SITE.home.stats[index].label
      })) : DEFAULT_SITE.home.stats
    },
    pages: {}
  };
  for (const key of Object.keys(DEFAULT_SITE.pages)) site.pages[key] = textBlock(pages[key], DEFAULT_SITE.pages[key]);
  return site;
}
async function github(method, path, body) {
  const token = process.env.CMS_GITHUB_TOKEN;
  if (!token) throw Object.assign(new Error('CMS service unavailable.'), { status: 503 });
  const response = await fetch(`https://api.github.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000)
  });
  const text = await response.text();
  let data; try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!response.ok) throw Object.assign(new Error('CMS storage request failed.'), { status: response.status >= 500 ? 503 : 502 });
  return data;
}
async function readFile(ref = BRANCH) {
  const data = await github('GET', `/repos/${REPO}/contents/${PATH}?ref=${encodeURIComponent(ref)}`);
  if (!data?.content || !data?.sha) throw Object.assign(new Error('Site content is unavailable.'), { status: 503 });
  try { return { sha: data.sha, site: normalize(JSON.parse(Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8')).site) }; }
  catch { throw Object.assign(new Error('Site content is invalid.'), { status: 503 }); }
}
async function writeFile(site, sha) {
  const data = { site: normalize(site) };
  const content = Buffer.from(JSON.stringify(data, null, 2) + '\n').toString('base64');
  return github('PUT', `/repos/${REPO}/contents/${PATH}`, { message: 'cms: update site content', content, sha, branch: BRANCH });
}

export default async function handler(req, res) {
  const mode = String(req.query?.mode || 'public');
  const isPublic = mode === 'public';
  headers(res, isPublic);
  try {
    if (tooLarge(req)) return json(res, 413, { error: 'Request body is too large.' });
    if (isPublic) {
      if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
      const file = await readFile();
      return json(res, 200, { site: file.site });
    }
    if (mode !== 'admin-data' && mode !== 'admin-save') return json(res, 404, { error: 'Unknown mode' });
    if (!requireSession(req, res)) return;
    if (!originOk(req)) return json(res, 403, { error: 'Origin not allowed.' });
    if (mode === 'admin-data') {
      if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
      const file = await readFile();
      return json(res, 200, { site: file.site });
    }
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
    if (!allow(writes, clientIp(req), WRITE_LIMIT)) return json(res, 429, { error: 'Too many content saves. Try again shortly.' });
    if (!req.body?.site || typeof req.body.site !== 'object' || Array.isArray(req.body.site)) return json(res, 400, { error: 'Site content is required.' });
    const next = normalize(req.body.site);
    const file = await readFile();
    await writeFile(next, file.sha);
    return json(res, 200, { ok: true, site: next });
  } catch (error) {
    console.error('Voice-O-Magic site content API error:', error);
    const status = Number.isInteger(error?.status) ? error.status : 500;
    return json(res, status >= 400 && status < 500 ? status : 500, { error: status === 500 ? 'Request failed.' : (error.message || 'Request failed.') });
  }
}
