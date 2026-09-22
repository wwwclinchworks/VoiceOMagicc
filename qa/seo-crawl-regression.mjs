import fs from 'node:fs';

const domain = 'https://voiceomagic.clinchworks.in';
const pages = [
  ['index.html', '/'],
  ['about.html', '/about.html'],
  ['keynotes.html', '/keynotes.html'],
  ['academy.html', '/academy.html'],
  ['corporate.html', '/corporate.html'],
  ['books.html', '/books.html'],
  ['resources.html', '/resources.html'],
  ['weekly.html', '/weekly.html'],
  ['testimonials.html', '/testimonials.html'],
  ['contact.html', '/contact.html']
];

const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const attr = (html, pattern) => (html.match(pattern) || [])[1] || '';

const robots = fs.readFileSync('robots.txt', 'utf8');
expect(robots.includes('User-agent: *'), 'robots.txt must define the wildcard crawler group.');
expect(robots.includes('Allow: /'), 'robots.txt must allow the public site.');
expect(robots.includes('Disallow: /adminadmin.html'), 'robots.txt must block the private admin page.');
expect(robots.includes('Disallow: /data/'), 'robots.txt must block raw CMS data files.');
expect(!robots.includes('Disallow: /api/'), 'robots.txt must not block the public CMS API used during crawler rendering.');
expect(robots.includes('Sitemap: https://voiceomagic.clinchworks.in/sitemap.xml'), 'robots.txt must advertise the canonical sitemap.');

const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
expect(sitemap.includes('<urlset'), 'sitemap.xml must be a URL set.');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
expect(sitemapUrls.length === pages.length, 'Sitemap must contain exactly the public page set.');
expect(new Set(sitemapUrls).size === sitemapUrls.length, 'Sitemap must not contain duplicate URLs.');
for (const [, path] of pages) expect(sitemapUrls.includes(domain + path), `Sitemap is missing ${domain + path}`);
expect(!sitemapUrls.some((url) => /admin|api|knowledge\.json/i.test(url)), 'Sitemap must not expose private or machine-readable endpoints.');

for (const [file, canonicalPath] of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const canonical = domain + canonicalPath;
  const title = attr(html, /<title>([^<]+)<\/title>/i);
  const description = attr(html, /<meta name="description" content="([^"]+)"/i);
  const canonicalCount = (html.match(/<link rel="canonical"/g) || []).length;
  const robotsCount = (html.match(/<meta name="robots"/g) || []).length;
  const jsonLdCount = (html.match(/application\/ld\+json/g) || []).length;
  const h1Count = (html.match(/<h1\b/gi) || []).length;

  expect(Boolean(title) && title.length >= 25 && title.length <= 70, `${file}: title length must be 25–70 characters.`);
  expect(Boolean(description) && description.length >= 80 && description.length <= 180, `${file}: meta description length must be 80–180 characters.`);
  expect(canonicalCount === 1, `${file}: must contain exactly one canonical link.`);
  expect(html.includes(`<link rel="canonical" href="${canonical}">`), `${file}: canonical URL is incorrect.`);
  expect(robotsCount === 1 && html.includes('content="index,follow'), `${file}: public robots meta must permit indexing and following.`);
  expect(!/content="[^"]*noindex/i.test(html), `${file}: public page must not contain noindex.`);
  expect(html.includes('og:title') && html.includes('og:description') && html.includes('og:url') && html.includes('og:image'), `${file}: Open Graph metadata is incomplete.`);
  expect(html.includes('twitter:card') && html.includes('twitter:title') && html.includes('twitter:description'), `${file}: Twitter metadata is incomplete.`);
  expect(jsonLdCount >= 1, `${file}: JSON-LD structured data is missing.`);
  expect(h1Count === 1, `${file}: expected exactly one H1 in source HTML.`);
  expect(html.includes('hreflang="en-IN"') && html.includes('hreflang="x-default"'), `${file}: hreflang signals are missing.`);
}

const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const vercelHeaders = vercel.headers || [];
const apiNoindex = vercelHeaders.find((x) => x.source === '/api/(.*)');
const dataNoindex = vercelHeaders.find((x) => x.source === '/data/(.*)');
expect(apiNoindex?.headers?.some((h) => h.key === 'X-Robots-Tag' && /noindex/i.test(h.value)), 'Vercel API routes must be non-indexable.');
expect(dataNoindex?.headers?.some((h) => h.key === 'X-Robots-Tag' && /noindex/i.test(h.value)), 'Vercel raw data routes must be non-indexable.');
expect(vercelHeaders.some((x) => x.source === '/adminadmin.html'), 'Vercel admin route must have a noindex header.');

const api = fs.readFileSync('api/chat.js', 'utf8');
expect(api.includes("res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive')"), 'Vercel API runtime must default to noindex.');
expect(api.includes("res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');\n  return json(res, 200, { cms });"), 'Public CMS API must be noindex rather than indexable JSON.');
const worker = fs.readFileSync('worker.js', 'utf8');
expect(worker.includes("headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')"), 'Cloudflare API runtime must default to noindex.');
const entry = fs.readFileSync('worker-entry.js', 'utf8');
for (const route of ['/about','/keynotes','/academy','/corporate','/books','/resources','/contact','/testimonials','/weekly','/admin']) {
  expect(entry.includes(`'${route}'`), `Cloudflare must normalize pretty route ${route}.`);
}

if (failures.length) {
  for (const failure of failures) console.error('FAIL:', failure);
  process.exit(1);
}
console.log('SEO crawl/indexing regression checks passed for all public pages.');
