import fs from 'node:fs';

const failures = [];
const api = fs.readFileSync('api/chat.js', 'utf8');
const worker = fs.readFileSync('worker.js', 'utf8');
const wrangler = fs.readFileSync('wrangler.jsonc', 'utf8');
const admin = fs.readFileSync('adminadmin.html', 'utf8');

for (const marker of ['CMS_ADMIN_PASSWORD_HASH', 'crypto.scryptSync', 'crypto.timingSafeEqual', 'SameSite=Strict', 'if (!origin) return false', 'function publicSnapshot']) {
  if (!api.includes(marker) && !worker.includes(marker)) failures.push(`Missing CMS security control: ${marker}`);
}
for (const marker of ['X-Content-Type-Options', 'Strict-Transport-Security', 'Content-Security-Policy', 'X-DNS-Prefetch-Control']) {
  if (!worker.includes(marker)) failures.push(`Missing Worker security header: ${marker}`);
}
for (const marker of ['"main": "./worker.js"', '"/api/*"', '"/adminadmin"', '"/adminadmin.html"']) {
  if (!wrangler.includes(marker)) failures.push(`Missing Cloudflare route/config control: ${marker}`);
}
for (const marker of ['js/admin.js', 'css/style.css', 'css/components.css']) {
  if (!admin.includes(marker)) failures.push(`Admin bootstrap missing: ${marker}`);
}
if (admin.includes('source.replace(')) failures.push('Admin HTML must not rewrite admin.js source at runtime.');
if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}
console.log('Security smoke checks passed.');
