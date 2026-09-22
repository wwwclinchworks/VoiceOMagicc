import fs from 'node:fs';

const adminHtml = fs.readFileSync('adminadmin.html', 'utf8');
const adminJs = fs.readFileSync('js/admin.js', 'utf8');
const weekly = fs.readFileSync('js/admin-weekly-cms.js', 'utf8');

const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

expect(adminHtml.includes("admin-login"), 'Admin bootstrap must expose the admin-login flow.');
expect(adminHtml.includes("admin-data"), 'Admin bootstrap must check the current admin session.');
expect(adminHtml.includes("response.status===401"), 'Admin bootstrap must show the password gate on 401.');
expect(adminHtml.includes("credentials:'same-origin'"), 'Admin bootstrap must use same-origin credentials.');
expect(adminHtml.includes("loadScriptSource('/js/admin.js')"), 'Admin bootstrap must load admin.js after authentication.');
expect(adminHtml.includes("loadScriptSource('/js/admin-weekly-cms.js')"), 'Admin bootstrap must load Weekly Highlights after the dashboard exists.');
expect(!adminHtml.includes('source.replace('), 'Admin bootstrap must not rewrite application source at runtime.');
expect(!adminHtml.includes('setInterval'), 'Admin bootstrap must not poll for the dashboard.');

expect(adminJs.includes("'Page Copy':'settings'"), 'Admin client must map Page Copy.');
expect(adminJs.includes("'Featured Video':'featuredVideo'"), 'Admin client must map Featured Video.');
expect(adminJs.includes("'Speaker Toolkit':'toolkit'"), 'Admin client must map Speaker Toolkit.');
expect(adminJs.includes("'Resources':'resources'"), 'Admin client must map Resources.');
expect(adminJs.includes("'Books':'books'"), 'Admin client must map Books.');
expect(adminJs.includes("new CustomEvent('vom-admin-rendered')"), 'Admin must announce dashboard rerenders.');

expect(weekly.includes("window.addEventListener('vom-admin-rendered'"), 'Weekly Highlights must survive Admin dashboard rerenders.');

if (failures.length) {
  for (const failure of failures) console.error('FAIL:', failure);
  process.exit(1);
}
console.log('Admin authentication/bootstrap regression checks passed.');
