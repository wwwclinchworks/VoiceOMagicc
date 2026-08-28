import fs from 'node:fs';

const worker = fs.readFileSync('worker.js', 'utf8');
const admin = fs.readFileSync('js/admin-weekly-sync.js', 'utf8');
const client = fs.readFileSync('js/weekly-highlights.js', 'utf8');
const checks = [
  [worker.includes("url.pathname === '/api/weekly-highlights'"), 'Cloudflare Worker must expose the Weekly Highlights endpoint.'],
  [worker.includes("if (request.method === 'GET')"), 'Weekly Highlights Worker endpoint must support GET.'],
  [worker.includes("if (request.method !== 'PUT')"), 'Weekly Highlights Worker endpoint must support PUT.'],
  [worker.includes('validCookie(request, env)'), 'Weekly Highlights Worker endpoint must protect admin access with the session cookie.'],
  [worker.includes('file.data.cms.weeklyHighlights = normalizeHighlights'), 'Weekly Highlights writes must persist to CMS.'],
  [admin.includes("const ENDPOINT = '/api/weekly-highlights'"), 'Admin highlight client must use the protected endpoint.'],
  [admin.includes("method: 'PUT'"), 'Admin highlight client must use PUT for writes.'],
  [admin.includes("cache: 'no-store'"), 'Admin highlight client must bypass browser caching.'],
  [admin.includes('MutationObserver'), 'Admin highlight controls must survive dashboard rerenders.'],
  [client.includes("const CMS_URL = '/api/chat?mode=public-cms'"), 'Public highlight client must use public-cms rather than the protected admin endpoint.'],
  [client.includes('item.published === true'), 'Public highlight client must hide unpublished slots.'],
  [client.includes('aspect-[4/3]'), 'Public highlight client must keep fixed image frames.']
];

for (const [ok, message] of checks) if (!ok) throw new Error(message);
console.log('Weekly Highlights API contract checks passed.');
