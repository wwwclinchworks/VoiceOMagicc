import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

const resourcesHtml = read('resources.html');
const booksHtml = read('books.html');
const mainJs = read('js/main.js');
const chatbotConfig = read('js/chatbot-config.js');
const weeklyJs = read('js/weekly-highlights.js');
const weeklyAdminJs = read('js/admin-weekly-sync.js');
const adminHtml = read('adminadmin.html');
const adminJs = read('js/admin.js');
const worker = read('worker.js');
const entry = read('worker-entry.js');
const wrangler = read('wrangler.jsonc');
const knowledge = JSON.parse(read('data/knowledge.json'));

expect(resourcesHtml.includes('js/main.js'), 'resources.html must load main.js.');
expect(booksHtml.includes('js/main.js'), 'books.html must load main.js.');
expect(resourcesHtml.includes('js/chatbot-config.js'), 'resources.html must load chatbot-config.js.');
expect(booksHtml.includes('js/chatbot-config.js'), 'books.html must load chatbot-config.js.');

expect(!chatbotConfig.includes("'/resources':'/resources.html'"), 'Resources must not use client-side route aliasing.');
expect(!chatbotConfig.includes("'/resources/':'/resources.html'"), 'Resources trailing slash must not use client-side route aliasing.');
expect(chatbotConfig.includes("script.src='/js/weekly-highlights.js'"), 'Resources page must load Weekly Highlights.');
expect(!chatbotConfig.includes("script.src='/js/resources-layout.js'"), 'Resources page must not load the retired layout controller.');
expect(chatbotConfig.includes("fetch('/api/chat?mode=public-cms'"), 'Homepage CMS synchronization must use the public CMS endpoint.');

expect(mainJs.includes('function renderResources()'), 'main.js must define the Resources renderer.');
expect(mainJs.includes('function renderBooks()'), 'main.js must define the Books renderer.');
expect(mainJs.includes('state.cms.featuredVideo'), 'Resources renderer must consume featuredVideo.');
expect(mainJs.includes('state.cms.resources'), 'Resources renderer must consume resources.');
expect(mainJs.includes('state.cms.books'), 'Books renderer must consume books.');
expect(mainJs.includes('item.coverImageUrl'), 'Books renderer must consume coverImageUrl.');
expect(mainJs.includes("fetch('/api/chat?mode=public-cms'"), 'Main CMS renderer must use public-cms.');

expect(weeklyJs.includes("const CMS_URL = '/api/chat?mode=public-cms'"), 'Public Weekly Highlights must read public CMS.');
expect(weeklyJs.includes('main.prepend(section)'), 'Weekly Highlights must mount at the top of Resources.');
expect(weeklyJs.includes('removePublicIntroAndToolkit'), 'Weekly Highlights runtime must remove legacy public blocks.');
expect(weeklyJs.includes('aspect-[4/3]'), 'Weekly Highlights must use fixed 4:3 frames.');
expect(!weeklyJs.includes('setInterval'), 'Weekly Highlights must not poll.');

expect(adminHtml.includes('js/admin-weekly-sync.js'), 'Admin page must load persistent Weekly Highlights controls.');
expect(!adminHtml.includes('js/weekly-highlights-admin.js'), 'Admin page must not load the retired duplicate Weekly Highlights client.');
expect(weeklyAdminJs.includes("const ENDPOINT = '/api/weekly-highlights'"), 'Admin Weekly Highlights must use protected endpoint.');
expect(weeklyAdminJs.includes("method: 'PUT'"), 'Admin Weekly Highlights must use PUT for writes.');
expect(weeklyAdminJs.includes("cache: 'no-store'"), 'Admin Weekly Highlights must bypass caching.');
expect(weeklyAdminJs.includes('MutationObserver'), 'Admin Weekly Highlights must survive dashboard rerenders.');

for (const marker of ["'Page Copy':'settings'", "'Featured Video':'featuredVideo'", "'Speaker Toolkit':'toolkit'", "'Books':'books'"]) {
  expect(adminJs.includes(marker), `Admin must map ${marker}.`);
}
expect(adminJs.includes("'Resources':'resources'"), 'Admin must map Resources.');

expect(worker.includes("mode === 'public-cms'"), 'Worker must expose public-cms.');
expect(worker.includes('publicSnapshot(file.data?.cms)'), 'Public CMS must use the published snapshot.');
expect(worker.includes('cms.weeklyHighlights = normalizeHighlights'), 'Worker must preserve Weekly Highlights.');
expect(worker.includes("'User-Agent': 'Voice-O-Magic-CMS/1.0'"), 'GitHub calls must include User-Agent.');
expect(worker.includes('crypto.scryptSync'), 'Admin password verification must use scrypt.');
expect(worker.includes('crypto.timingSafeEqual'), 'Secret comparisons must use timing-safe equality.');

expect(wrangler.includes('"main": "./worker-entry.js"'), 'Wrangler must deploy worker-entry.js.');
expect(wrangler.includes('"/api/*"'), 'Wrangler must run Worker first for APIs.');
expect(wrangler.includes('"/adminadmin"'), 'Wrangler must run Worker first for admin route.');
expect(wrangler.includes('"/adminadmin.html"'), 'Wrangler must run Worker first for admin HTML.');

expect(entry.includes("url.pathname === '/resources'"), 'Worker entry must recognize /resources.');
expect(entry.includes("url.pathname === '/resources/'"), 'Worker entry must recognize /resources/.');
expect(entry.includes("new URL('/resources.html', url.origin)"), 'Worker entry must redirect Resources.');
expect(entry.includes('status: 301'), 'Resources redirect must be permanent.');
expect(entry.includes("'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate'"), 'Canonical redirect must not be cached.');
expect(entry.includes("headers.set('Cache-Control', 'no-store, no-cache, max-age=0, must-revalidate')"), 'HTML must not be cached.');

const highlights = knowledge.cms?.weeklyHighlights;
expect(highlights?.highlight1, 'CMS must contain Weekly Highlight 1.');
expect(highlights?.highlight2, 'CMS must contain Weekly Highlight 2.');
expect(/^https:\/\//.test(highlights?.highlight1?.imageUrl || ''), 'Highlight 1 must use HTTPS.');
expect(/^https:\/\//.test(highlights?.highlight2?.imageUrl || ''), 'Highlight 2 must use HTTPS.');
expect(!knowledge.cms?.books?.some((book) => book?.title === 'Test'), 'Accidental Test book must be absent.');

if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}
console.log('Live CMS rendering regression checks passed.');
