import fs from 'node:fs';

const failures = [];
const api = fs.readFileSync('api/chat.js', 'utf8');
const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const headers = JSON.stringify(config.headers || []);

if (api.includes('process.env.CMS_ADMIN_PASSWORD)')) failures.push('Legacy plaintext admin password comparison remains.');
for (const marker of ['CMS_ADMIN_PASSWORD_HASH', 'crypto.scryptSync', 'crypto.timingSafeEqual', 'SameSite=Strict', 'if (!origin) return false', 'function publicSnapshot']) {
  if (!api.includes(marker)) failures.push(`Missing hardening control: ${marker}`);
}
for (const header of ['Content-Security-Policy', 'Strict-Transport-Security', 'X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy', 'X-DNS-Prefetch-Control']) {
  if (!headers.includes(header)) failures.push(`Missing security header: ${header}`);
}
if (!headers.includes('max-age=31536000')) failures.push('HSTS max-age is below one year.');

if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}
console.log('Security hardening regression checks passed.');
