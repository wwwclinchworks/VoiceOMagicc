import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const failures = [];
const requiredFiles = ['adminadmin.html', 'js/admin.js', 'js/admin-weekly-sync.js', 'worker.js', 'worker-entry.js'];
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing required admin/production file: ${file}`);
}

function check(file, args) {
  const result = spawnSync(process.execPath, args, { encoding: 'utf8' });
  if (result.status !== 0) failures.push(`JavaScript syntax error: ${file}\n${result.stderr.trim()}`);
}

check('js/admin.js', ['--check', 'js/admin.js']);
check('js/admin-weekly-sync.js', ['--check', 'js/admin-weekly-sync.js']);
check('worker.js', ['--check', 'worker.js']);
check('worker-entry.js', ['--check', 'worker-entry.js']);

const admin = fs.readFileSync('adminadmin.html', 'utf8');
const script = fs.readFileSync('js/admin.js', 'utf8');
const weekly = fs.readFileSync('js/admin-weekly-sync.js', 'utf8');
const worker = fs.readFileSync('worker.js', 'utf8');
const entry = fs.readFileSync('worker-entry.js', 'utf8');

for (const marker of ['js/admin.js', 'css/style.css', 'css/components.css']) {
  if (!admin.includes(marker)) failures.push(`Admin bootstrap missing ${marker}`);
}
if (!admin.includes('js/admin-weekly-sync.js')) failures.push('Admin page must load the stable weekly sync client.');
if (admin.includes('js/weekly-highlights-admin.js')) failures.push('Retired duplicate Weekly Highlights admin client must not be loaded.');
for (const marker of ['mode=admin-data', 'status===401', '__vomAdminUnauthorized', 'data-admin-login', 'mode=admin-login', 'location.reload()']) {
  if (!admin.includes(marker)) failures.push(`Admin login bootstrap marker missing: ${marker}`);
}
for (const marker of ['loadCms', 'saveSection', 'saveAll', 'historySection', 'renderDashboard']) {
  if (!script.includes(`function ${marker}`)) failures.push(`Admin client flow missing: ${marker}`);
}
for (const marker of ["'Page Copy':'settings'", "'Featured Video':'featuredVideo'", "'Resources':'resources'", "'Speaker Toolkit':'toolkit'", "'Books':'books'"]) {
  if (!script.includes(marker)) failures.push(`Admin section mapping missing: ${marker}`);
}
if (!script.includes("document.body.replaceChildren()")) failures.push('Admin dashboard does not rebuild the page safely.');
if (!script.includes('renderDashboard()')) failures.push('Admin dashboard render path missing.');
if (!script.includes("toast('All CMS changes saved successfully.')")) failures.push('Admin save success feedback missing.');
if (!script.includes("toast(error.message||'Unable to save all changes.',true)")) failures.push('Admin save error feedback missing.');

for (const marker of ["const ENDPOINT = '/api/weekly-highlights'", "method: 'PUT'", "cache: 'no-store'", 'MutationObserver', 'data-weekly-highlights-admin-sync']) {
  if (!weekly.includes(marker)) failures.push(`Weekly admin sync control missing: ${marker}`);
}
if (!weekly.includes("Every published highlight needs a valid HTTPS image URL.")) failures.push('Weekly highlight validation missing.');

for (const marker of ["url.pathname === '/api/weekly-highlights'", "request.method !== 'PUT'", 'validCookie(request, env)', 'file.data.cms.weeklyHighlights = normalizeHighlights']) {
  if (!worker.includes(marker)) failures.push(`Worker Weekly Highlights control missing: ${marker}`);
}
for (const marker of ["url.pathname === '/resources'", "url.pathname === '/resources/'", "new URL('/resources.html', url.origin)", 'status: 301']) {
  if (!entry.includes(marker)) failures.push(`Canonical Resources routing control missing: ${marker}`);
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}
console.log('Admin console regression checks passed.');
