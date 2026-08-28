import fs from 'node:fs';

const failures = [];
const adminHtml = fs.readFileSync('adminadmin.html', 'utf8');
const client = fs.readFileSync('js/admin-weekly-sync.js', 'utf8');

for (const marker of [
  'js/admin.js',
  'js/admin-weekly-sync.js',
  "fetch('/api/chat?mode=admin-login'"
]) {
  if (!adminHtml.includes(marker)) failures.push(`Admin bootstrap missing: ${marker}`);
}

if (adminHtml.includes('js/weekly-highlights-admin.js')) failures.push('Obsolete Weekly Highlights Admin client is still loaded.');

for (const marker of [
  "const ENDPOINT = '/api/weekly-highlights'",
  'let current = null',
  'let dirty = false',
  'MutationObserver',
  'data-weekly-highlights-admin-sync',
  'data-weekly-sync-save',
  "method: 'PUT'",
  "cache: 'no-store'",
  'Every published highlight needs a valid HTTPS image URL.',
  'Save All Changes'
]) {
  if (!client.includes(marker)) failures.push(`Weekly Admin persistence control missing: ${marker}`);
}

if (!fs.existsSync('js/admin-weekly-sync.js')) failures.push('Stable Weekly Highlights Admin client is missing.');
if (fs.existsSync('js/weekly-highlights-admin.js')) failures.push('Duplicate Weekly Highlights Admin client must be removed.');

if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}
console.log('Weekly Highlights Admin persistence regression checks passed.');
