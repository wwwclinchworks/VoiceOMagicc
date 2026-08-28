import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const failures = [];
const requiredFiles = [
  'adminadmin.html',
  'js/admin.js',
  'js/weekly-highlights.js',
  'js/admin-weekly-sync.js',
  'worker.js',
  'worker-entry.js'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing required Admin/production file: ${file}`);
}

function checkNode(file) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) failures.push(`JavaScript syntax error: ${file}\n${result.stderr.trim()}`);
}

for (const file of ['js/admin.js', 'js/weekly-highlights.js', 'js/admin-weekly-sync.js', 'worker.js', 'worker-entry.js']) {
  if (fs.existsSync(file)) checkNode(file);
}

const admin = fs.readFileSync('adminadmin.html', 'utf8');
const client = fs.readFileSync('js/admin.js', 'utf8');
const weeklyAdmin = fs.readFileSync('js/admin-weekly-sync.js', 'utf8');
const worker = fs.readFileSync('worker.js', 'utf8');
const entry = fs.readFileSync('worker-entry.js', 'utf8');

for (const marker of ['js/admin.js', 'css/style.css', 'css/components.css', 'js/admin-weekly-sync.js']) {
  if (!admin.includes(marker)) failures.push(`Admin bootstrap missing: ${marker}`);
}
if (admin.includes('js/weekly-highlights-admin.js')) failures.push('Obsolete Weekly Highlights admin client must not be loaded.');
for (const marker of [
  "'Page Copy':'settings'",
  "'Featured Video':'featuredVideo'",
  "'Resources':'resources'",
  "'Speaker Toolkit':'toolkit'",
  "'Books':'books'",
  'loadCms', 'saveSection', 'saveAll', 'historySection', 'renderDashboard'
]) {
  if (!client.includes(marker)) failures.push(`Admin client control missing: ${marker}`);
}
for (const marker of [
  "const ENDPOINT = '/api/weekly-highlights'",
  'MutationObserver',
  'data-weekly-highlights-admin-sync',
  'data-weekly-sync-save',
  'saveAll',
  "method: 'PUT'",
  "cache: 'no-store'",
  'Every published highlight needs a valid HTTPS image URL.'
]) {
  if (!weeklyAdmin.includes(marker)) failures.push(`Weekly Highlights Admin control missing: ${marker}`);
}
for (const marker of [
  "mode === 'admin-login'",
  "mode === 'admin-data'",
  "mode === 'admin-save'",
  "mode === 'admin-restore'",
  "mode === 'admin-logout'",
  'function verifyAdminPassword',
  'crypto.scryptSync',
  'crypto.timingSafeEqual'
]) {
  if (!worker.includes(marker)) failures.push(`Worker Admin control missing: ${marker}`);
}
for (const marker of [
  "url.pathname === '/resources'",
  "url.pathname === '/resources/'",
  "new URL('/resources.html', url.origin)",
  'status: 301'
]) {
  if (!entry.includes(marker)) failures.push(`Canonical Resources control missing: ${marker}`);
}
if (fs.existsSync('api/chat.js') || fs.existsSync('api/weekly-highlights.js')) failures.push('Legacy Vercel API handlers must not exist.');

if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}
console.log('Cloudflare Admin console regression checks passed.');
