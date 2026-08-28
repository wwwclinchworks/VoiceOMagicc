import fs from 'node:fs';

const admin = fs.readFileSync('adminadmin.html', 'utf8');
const client = fs.readFileSync('js/admin.js', 'utf8');
const weekly = fs.readFileSync('js/admin-weekly-sync.js', 'utf8');
const worker = fs.readFileSync('worker.js', 'utf8');
const entry = fs.readFileSync('worker-entry.js', 'utf8');

const required = [
  [admin, 'js/admin.js', 'Admin must load admin.js.'],
  [admin, 'js/admin-weekly-sync.js', 'Admin must load weekly sync.'],
  [client, "'Page Copy':'settings'", 'Page Copy mapping missing.'],
  [client, "'Featured Video':'featuredVideo'", 'Featured Video mapping missing.'],
  [client, "'Resources':'resources'", 'Resources mapping missing.'],
  [client, "'Speaker Toolkit':'toolkit'", 'Speaker Toolkit mapping missing.'],
  [client, "'Books':'books'", 'Books mapping missing.'],
  [weekly, "const ENDPOINT = '/api/weekly-highlights'", 'Weekly endpoint missing.'],
  [weekly, 'data-weekly-highlights-admin-sync', 'Weekly admin mount missing.'],
  [weekly, 'MutationObserver', 'Weekly admin remount observer missing.'],
  [weekly, "method: 'PUT'", 'Weekly admin write method missing.'],
  [weekly, "cache: 'no-store'", 'Weekly admin cache bypass missing.'],
  [worker, "url.pathname === '/api/weekly-highlights'", 'Worker weekly endpoint missing.'],
  [worker, 'validCookie(request, env)', 'Worker admin session protection missing.'],
  [worker, 'function verifyAdminPassword', 'Worker admin password verification missing.'],
  [worker, 'crypto.scryptSync', 'scrypt password verification missing.'],
  [entry, "url.pathname === '/resources'", 'Canonical Resources routing missing.'],
  [entry, "url.pathname === '/resources/'", 'Trailing Resources routing missing.'],
  [entry, "new URL('/resources.html', url.origin)", 'Resources destination missing.']
];

const failures = [];
for (const [source, marker, message] of required) if (!source.includes(marker)) failures.push(message);
if (admin.includes('js/weekly-highlights-admin.js')) failures.push('Retired weekly admin client must not be loaded.');
if (admin.includes('source.replace(')) failures.push('Admin must not rewrite JavaScript source at runtime.');
if (fs.existsSync('api/chat.js') || fs.existsSync('api/weekly-highlights.js')) failures.push('Legacy Vercel API handlers must remain removed.');

if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}
console.log('Complete admin page contract passed.');
