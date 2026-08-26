import fs from 'node:fs';

const chat = fs.readFileSync('api/chat.js', 'utf8');
const worker = fs.readFileSync('worker.js', 'utf8');
const admin = fs.readFileSync('js/weekly-highlights-admin.js', 'utf8');
const client = fs.readFileSync('js/weekly-highlights.js', 'utf8');

const checks = [
  [chat.includes('weeklyHighlights'), 'Vercel/API CMS must preserve weeklyHighlights.'],
  [chat.includes('function normalizeHighlight'), 'Vercel/API CMS must validate weekly highlight records.'],
  [worker.includes('weeklyHighlights'), 'Cloudflare Worker must preserve weeklyHighlights.'],
  [admin.includes("'/api/weekly-highlights'"), 'Admin highlight client must use the highlight write endpoint.'],
  [client.includes("'/api/chat?mode=public-cms'"), 'Public highlight client must use the live CMS endpoint.']
];

for (const [ok, message] of checks) if (!ok) throw new Error(message);
console.log('Weekly Highlights API contract checks passed.');
