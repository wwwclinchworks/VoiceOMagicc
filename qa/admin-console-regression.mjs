import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const failures = [];
const requiredFiles = ['adminadmin.html', 'js/admin.js', 'js/admin-weekly-cms.js', 'api/chat.js'];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing required admin file: ${file}`);
}

function check(file, args) {
  const result = spawnSync(process.execPath, args, { encoding: 'utf8' });
  if (result.status !== 0) failures.push(`JavaScript syntax error: ${file}\n${result.stderr.trim()}`);
}

check('js/admin.js', ['--check', 'js/admin.js']);
check('js/admin-weekly-cms.js', ['--check', 'js/admin-weekly-cms.js']);
check('api/chat.js', ['--input-type=module', '--check']);

const admin = fs.readFileSync('adminadmin.html', 'utf8');
const script = fs.readFileSync('js/admin.js', 'utf8');
const weekly = fs.readFileSync('js/admin-weekly-cms.js', 'utf8');
const api = fs.readFileSync('api/chat.js', 'utf8');

for (const marker of ['js/admin.js', 'css/style.css', 'css/components.css']) {
  if (!admin.includes(marker)) failures.push(`Admin bootstrap missing ${marker}`);
}

for (const marker of ['admin-data', 'response.status===401', 'admin-login', "credentials:'same-origin'", "loadScriptSource('/js/admin.js')", "loadScriptSource('/js/admin-weekly-cms.js')"]) {
  if (!admin.includes(marker)) failures.push(`Admin bootstrap marker missing: ${marker}`);
}

for (const marker of ['admin-login', 'admin-data', 'admin-save', 'admin-restore', 'admin-logout']) {
  if (!api.includes(`mode===\'${marker}\'`)) failures.push(`Admin API mode missing: ${marker}`);
}

for (const marker of ['loadCms', 'saveSection', 'saveAll', 'historySection', 'renderDashboard']) {
  if (!script.includes(`function ${marker}`)) failures.push(`Admin client flow missing: ${marker}`);
}

if (!script.includes("window.dispatchEvent(new CustomEvent('vom-admin-rendered'))")) failures.push('Admin render lifecycle event missing.');
if (!weekly.includes("window.addEventListener('vom-admin-rendered'")) failures.push('Weekly Highlights lifecycle listener missing.');
if (!api.includes("res.setHeader('Cache-Control', 'no-store, no-cache, max-age=0, must-revalidate')")) failures.push('Public CMS cache-busting is missing.');
if (!script.includes("toast(result.commitSha?('All CMS changes saved to GitHub • '+result.commitSha.slice(0,7))")) failures.push('Save All GitHub commit feedback missing.');

if (failures.length) {
  for (const failure of failures) console.error('FAIL:', failure);
  process.exit(1);
}

console.log('Admin console regression checks passed.');
