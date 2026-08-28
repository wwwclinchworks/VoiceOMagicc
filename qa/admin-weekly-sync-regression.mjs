import fs from 'node:fs';

const failures = [];
const adminHtml = fs.readFileSync('adminadmin.html', 'utf8');
const weekly = fs.readFileSync('js/admin-weekly-sync.js', 'utf8');

for (const marker of [
  'js/admin-weekly-sync.js',
  "fetch('/api/chat?mode=admin-login'",
  "fetch('js/admin.js'"
]) {
  if (!adminHtml.includes(marker)) failures.push(`Admin bootstrap missing: ${marker}`);
}

for (const marker of [
  "const ENDPOINT = '/api/weekly-highlights'",
  'let weeklyDirty = false',
  'let observer = null',
  'new MutationObserver',
  'data-weekly-highlights-admin-sync',
  "method: 'PUT'",
  "cache: 'no-store'",
  'Every published highlight needs a valid HTTPS image URL.'
]) {
  if (!weekly.includes(marker)) failures.push(`Weekly admin sync missing: ${marker}`);
}

if (!weekly.includes('saveAll')) {
  failures.push('Weekly admin sync does not integrate with Save All Changes.');
}

if (!weekly.includes('data-weekly-sync-save')) {
  failures.push('Weekly admin sync save control is missing.');
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}
console.log('Weekly admin sync regression checks passed.');
