import fs from 'node:fs';

const worker = fs.readFileSync('worker.js', 'utf8');
const admin = fs.readFileSync('js/weekly-highlights-admin.js', 'utf8');
const client = fs.readFileSync('js/weekly-highlights.js', 'utf8');
const endpoint = fs.readFileSync('api/weekly-highlights.js', 'utf8');

const checks = [
  [endpoint.includes("if (req.method === 'GET')"), 'Weekly Highlights endpoint must support public GET.'],
  [endpoint.includes("if (req.method !== 'PUT')"), 'Weekly Highlights endpoint must keep PUT for admin writes.'],
  [endpoint.includes('validCookie(req)'), 'Weekly Highlights writes must require an admin session.'],
  [endpoint.includes('next.cms.weeklyHighlights = weeklyHighlights'), 'Weekly Highlights writes must persist to CMS.'],
  [admin.includes("const ENDPOINT = '/api/weekly-highlights'"), 'Admin highlight client must use the dedicated endpoint.'],
  [client.includes("const CMS_URL = '/api/chat?mode=public-cms'"), 'Public highlight client must retain the main live CMS endpoint for compatibility.'],
  [worker.includes('weeklyHighlights'), 'Cloudflare Worker must preserve weeklyHighlights.']
];

for (const [ok, message] of checks) if (!ok) throw new Error(message);
console.log('Weekly Highlights API contract checks passed.');
