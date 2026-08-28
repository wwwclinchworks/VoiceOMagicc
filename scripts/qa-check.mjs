import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const failures = [];
const warnings = [];
const skip = new Set(['.git', 'node_modules', '.vercel']);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function rel(file) { return path.relative(root, file).replaceAll(path.sep, '/'); }
function fail(message) { failures.push(message); }
function checkNode(file) {
  const result = spawnSync(process.execPath, ['--check', file], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) fail(`JavaScript syntax error: ${rel(file)}\n${result.stderr.trim()}`);
}

const files = walk(root);

for (const file of files.filter((f) => f.endsWith('.json'))) {
  try { JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { fail(`Invalid JSON: ${rel(file)} (${error.message})`); }
}

for (const file of files.filter((f) => f.endsWith('.js'))) checkNode(file);

for (const file of files.filter((f) => f.endsWith('.html'))) {
  const source = fs.readFileSync(file, 'utf8');
  for (const ref of [...source.matchAll(/(?:href|src)\s*=\s*[\"']([^\"']+)[\"']/gi)].map((m) => m[1])) {
    if (!ref || ref.startsWith('#') || /^[a-z]+:/i.test(ref) || ref.startsWith('//')) continue;
    const target = path.resolve(path.dirname(file), ref.split('#')[0].split('?')[0]);
    if (!target.startsWith(root + path.sep)) fail(`Reference escapes repository: ${rel(file)} -> ${ref}`);
    else if (!fs.existsSync(target)) fail(`Broken local reference: ${rel(file)} -> ${ref}`);
  }
}

const wrangler = fs.readFileSync(path.join(root, 'wrangler.jsonc'), 'utf8');
for (const marker of ['"main": "./worker-entry.js"', '"/api/*"', '"/adminadmin"', '"/adminadmin.html"']) {
  if (!wrangler.includes(marker)) fail(`Missing Cloudflare Wrangler setting: ${marker}`);
}

const worker = fs.readFileSync(path.join(root, 'worker.js'), 'utf8');
for (const marker of [
  "mode === 'public-cms'",
  'function publicSnapshot',
  'cms.weeklyHighlights = normalizeHighlights',
  'function verifyAdminPassword',
  'crypto.scryptSync',
  'crypto.timingSafeEqual',
  "'User-Agent': 'Voice-O-Magic-CMS/1.0'"
]) {
  if (!worker.includes(marker)) fail(`Missing Worker control: ${marker}`);
}

const entry = fs.readFileSync(path.join(root, 'worker-entry.js'), 'utf8');
for (const marker of [
  "url.pathname === '/resources'",
  "url.pathname === '/resources/'",
  "new URL('/resources.html', url.origin)",
  "status: 301",
  "'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate'",
  "headers.set('Cache-Control', 'no-store, no-cache, max-age=0, must-revalidate')"
]) {
  if (!entry.includes(marker)) fail(`Missing canonical routing/cache control: ${marker}`);
}

if (fs.existsSync(path.join(root, 'js/resources-layout.js'))) {
  const resourcesLayout = fs.readFileSync(path.join(root, 'js/resources-layout.js'), 'utf8');
  if (resourcesLayout.includes('MutationObserver') || resourcesLayout.includes('setInterval')) {
    fail('If resources-layout.js exists, it must remain inert.');
  }
}

for (const file of files.filter((f) => f.endsWith('.js'))) {
  if (fs.readFileSync(file, 'utf8').includes('innerHTML')) warnings.push(`Review innerHTML usage: ${rel(file)}`);
}

if (files.some((file) => rel(file) === 'api/chat.js') || files.some((file) => rel(file) === 'api/weekly-highlights.js')) {
  fail('Legacy Vercel API files must not remain in the Cloudflare-only production repository.');
}

console.log(`Scanned ${files.length} repository files.`);
for (const warning of warnings) console.log(`WARN: ${warning}`);
if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}
console.log('Automated QA checks passed.');
