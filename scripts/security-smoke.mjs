import fs from 'node:fs';

const failures = [];
const worker = fs.readFileSync('worker.js', 'utf8');
const entry = fs.readFileSync('worker-entry.js', 'utf8');
const wrangler = fs.readFileSync('wrangler.jsonc', 'utf8');
const admin = fs.readFileSync('adminadmin.html', 'utf8');

for (const marker of [
  'CMS_ADMIN_PASSWORD_HASH',
  'crypto.scryptSync',
  'crypto.timingSafeEqual',
  'SameSite=Strict',
  'function originOk',
  'function publicSnapshot',
  "'User-Agent': 'Voice-O-Magic-CMS/1.0'"
]) {
  if (!worker.includes(marker)) failures.push(`Missing Worker CMS security control: ${marker}`);
}

for (const marker of [
  'X-Content-Type-Options',
  'Strict-Transport-Security',
  'Content-Security-Policy',
  'X-DNS-Prefetch-Control'
]) {
  if (!worker.includes(marker)) failures.push(`Missing Worker security header: ${marker}`);
}

for (const marker of [
  '"main": "./worker-entry.js"',
  '"/api/*"',
  '"/adminadmin"',
  '"/adminadmin.html"'
]) {
  if (!wrangler.includes(marker)) failures.push(`Missing Cloudflare route/config control: ${marker}`);
}

for (const marker of [
  "url.pathname === '/resources'",
  "url.pathname === '/resources/'",
  "new URL('/resources.html', url.origin)",
  "'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate'",
  "headers.set('Cache-Control', 'no-store, no-cache, max-age=0, must-revalidate')"
]) {
  if (!entry.includes(marker)) failures.push(`Missing canonical production routing/cache control: ${marker}`);
}

for (const marker of ['js/admin.js', 'css/style.css', 'css/components.css']) {
  if (!admin.includes(marker)) failures.push(`Admin bootstrap missing: ${marker}`);
}
if (admin.includes('source.replace(')) failures.push('Admin HTML must not rewrite admin.js source at runtime.');
if (fs.existsSync('api/chat.js') || fs.existsSync('api/weekly-highlights.js')) {
  failures.push('Legacy Vercel API handlers must not remain in the Cloudflare-only production repository.');
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}
console.log('Security smoke checks passed.');
