import fs from 'node:fs';

const main = fs.readFileSync('js/main.js', 'utf8');
const worker = fs.readFileSync('worker.js', 'utf8');
const entry = fs.readFileSync('worker-entry.js', 'utf8');
const wrangler = fs.readFileSync('wrangler.jsonc', 'utf8');
const ignore = fs.readFileSync('.assetsignore', 'utf8');

const checks = [
  [main.includes("fetch('/api/chat?mode=public-cms'"), 'Public pages must read live CMS data.'],
  [main.includes('state.cms.weeklyHighlights?.items'), 'Resources must render CMS Weekly Highlights.'],
  [main.includes('slice(0, 2)'), 'Resources must render only two weekly highlight cards.'],
  [main.includes('aspect-[4/3]'), 'Weekly Highlights must use fixed 4:3 frames.'],
  [worker.includes("mode === 'public-cms'"), 'Worker must expose public-cms.'],
  [worker.includes('c.weeklyHighlights.items = c.weeklyHighlights.items.filter'), 'Public CMS must hide unpublished Weekly Highlights.'],
  [worker.includes('function driveImageUrl'), 'Worker must convert Google Drive image links.'],
  [worker.includes("mode === 'admin-login'"), 'Worker must support admin login.'],
  [worker.includes("mode === 'admin-data'"), 'Worker must support admin data.'],
  [worker.includes("mode === 'admin-save'"), 'Worker must support admin save.'],
  [entry.includes("url.pathname === '/resources'"), 'Canonical Resources redirect must exist.'],
  [entry.includes("new URL('/resources.html', url.origin)"), 'Resources redirect must target resources.html.'],
  [wrangler.includes('"main": "./worker-entry.js"'), 'Wrangler must use worker-entry.js.'],
  [ignore.includes('api/'), 'Legacy Vercel API must be excluded from Cloudflare assets.']
];
for (const [ok, message] of checks) if (!ok) throw new Error(message);
console.log('Production runtime/Resources regression checks passed.');
