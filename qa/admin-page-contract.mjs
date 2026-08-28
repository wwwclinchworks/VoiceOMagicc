import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const failures = [];
const requiredFiles = ['adminadmin.html', 'js/admin.js', 'js/weekly-highlights.js', 'js/weekly-highlights-admin.js', 'worker.js', 'worker-entry.js'];
for (const file of requiredFiles) if (!fs.existsSync(file)) failures.push(`Missing required file: ${file}`);

function checkNode(file) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) failures.push(`JavaScript syntax error: ${file}\n${result.stderr.trim()}`);
}

checkNode('js/admin.js');
checkNode('js/weekly-highlights.js');
checkNode('js/weekly-highlights-admin.js');
checkNode('worker.js');
checkNode('worker-entry.js');

const admin = fs.readFileSync('adminadmin.html', 'utf8');
const client = fs.readFileSync('js/admin.js', 'utf8');
const weeklyAdmin = fs.readFileSync('js/weekly-highlights-admin.js', 'utf8');
const worker = fs.readFileSync('worker.js', 'utf8');
const entry = fs.readFileSync('worker-entry.js', 'utf8');

for (const marker of ['js/admin.js', 'css/style.css', 'css/components.css']) if (!admin.includes(marker)) failures.push(`Admin bootstrap missing: ${marker}`);
if (!admin.includes('js/weekly-highlights-admin.js')) failures.push('Admin must load Weekly Highlights controls.');
for (const marker of ['loadCms', 'saveSection', 'saveAll', 'historySection', 'renderDashboard']) if (!client.includes(`function ${marker}`)) failures.push(`Admin flow missing: ${marker}`);
for (const marker of ["'Page Copy':'settings'", "'Featured Video':'featuredVideo'", "'Resources':'resources'", "'Speaker Toolkit':'toolkit'", "'Books':'books'"]) if (!client.includes(marker)) failures.push(`Admin mapping missing: ${marker}`);
for (const marker of ["const ENDPOINT = '/api/weekly-highlights'", "method: 'PUT'", "cache: 'no-store'", 'MutationObserver', 'data-weekly-highlights-admin']) if (!weeklyAdmin.includes(marker)) failures.push(`Weekly Highlights Admin control missing: ${marker}`);
for (const marker of ["mode === 'admin-login'", "mode === 'admin-data'", "mode === 'admin-save'", "mode === 'admin-restore'", "mode === 'admin-logout'"]) if (!worker.includes(marker)) failures.push(`Worker Admin mode missing: ${marker}`);
for (const marker of ["url.pathname === '/resources'", "url.pathname === '/resources/'", "new URL('/resources.html', url.origin)", 'status: 301']) if (!entry.includes(marker)) failures.push(`Resources routing missing: ${marker}`);
if (fs.existsSync('api/chat.js') || fs.existsSync('api/weekly-highlights.js')) failures.push('Legacy Vercel API handlers must not exist.');

if (failures.length) { for (const failure of failures) console.error(`FAIL: ${failure}`); process.exit(1); }
console.log('Complete Admin page contract passed.');
