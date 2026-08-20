import fs from 'node:fs';

const failures = [];
const api = fs.readFileSync('api/chat.js', 'utf8');
const vercel = fs.readFileSync('vercel.json', 'utf8');
const admin = fs.readFileSync('adminadmin.html', 'utf8');

for (const marker of ['CMS_ADMIN_PASSWORD_HASH', 'crypto.scryptSync', 'crypto.timingSafeEqual', 'SameSite=Strict', 'if (!origin) return false', 'function publicSnapshot']) {
  if (!api.includes(marker)) failures.push(`Missing API security control: ${marker}`);
}
for (const marker of ['Content-Security-Policy', 'Strict-Transport-Security', 'X-DNS-Prefetch-Control']) {
  if (!vercel.includes(marker)) failures.push(`Missing deployment security header: ${marker}`);
}
for (const marker of ['js/admin.js', 'css/style.css', 'css/components.css']) {
  if (!admin.includes(marker)) failures.push(`Admin bootstrap missing: ${marker}`);
}
if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}
console.log('Security smoke checks passed.');
