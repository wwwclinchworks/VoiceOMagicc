import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

const main = read('js/main.js');
const admin = read('js/admin.js');
const adminHtml = read('adminadmin.html');
const weekly = read('js/weekly-highlights.js');
const weeklyAdmin = read('js/admin-weekly-sync.js');
const config = read('js/chatbot-config.js');
const assetsIgnore = read('.assetsignore');
const wrangler = read('wrangler.jsonc');
const entry = read('worker-entry.js');
const knowledge = JSON.parse(read('data/knowledge.json'));

expect(main.includes('function resourceCard(item)'), 'main.js must define resourceCard.');
expect(main.includes('function renderResources()'), 'main.js must define renderResources.');
expect(main.includes('function bookCard(item)'), 'main.js must define bookCard.');
expect(main.includes('function renderBooks()'), 'main.js must define renderBooks.');
expect(main.includes('state.cms.featuredVideo'), 'main.js must consume featuredVideo.');
expect(main.includes('state.cms.resources'), 'main.js must consume resources.');
expect(main.includes('state.cms.toolkit'), 'main.js must retain toolkit CMS compatibility.');
expect(main.includes('state.cms.books'), 'main.js must consume books.');
expect(main.includes('item.coverImageUrl'), 'main.js must consume coverImageUrl.');
expect(main.includes("fetch('/api/chat?mode=public-cms'"), 'main.js must use live public-cms.');
expect(main.includes('videoContainer'), 'main.js must use a dedicated video container.');

for (const marker of ["'Page Copy':'settings'", "'Featured Video':'featuredVideo'", "'Resources':'resources'", "'Speaker Toolkit':'toolkit'", "'Books':'books'"]) {
  expect(admin.includes(marker), `Admin section mapping missing: ${marker}`);
}
expect(adminHtml.includes("fetch('js/admin.js'"), 'Admin page must load admin.js.');
expect(adminHtml.includes('js/admin-weekly-sync.js'), 'Admin page must load stable Weekly Highlights sync.');
expect(!adminHtml.includes('js/weekly-highlights-admin.js'), 'Admin page must not load obsolete Weekly Highlights client.');
expect(!adminHtml.includes('source.replace('), 'Admin page must not patch JS source at runtime.');

for (const marker of ["const ENDPOINT = '/api/weekly-highlights'", 'MutationObserver', 'data-weekly-highlights-admin-sync', 'data-weekly-sync-save', 'saveAll', "method: 'PUT'", "cache: 'no-store'"]) {
  expect(weeklyAdmin.includes(marker), `Weekly Admin control missing: ${marker}`);
}
expect(weeklyAdmin.includes('Every published highlight needs a valid HTTPS image URL.'), 'Weekly Admin HTTPS validation is required.');

expect(weekly.includes("const CMS_URL = '/api/chat?mode=public-cms'"), 'Public Weekly Highlights must use public-cms.');
expect(weekly.includes('main.prepend(section)'), 'Weekly Highlights must mount before Resources.');
expect(weekly.includes('aspect-[4/3]'), 'Weekly Highlights must use fixed 4:3 frames.');
expect(!weekly.includes('setInterval'), 'Weekly Highlights must not poll.');

expect(!config.includes("'/resources':'/resources.html'"), 'Resources must not use client-side route aliasing.');
expect(!config.includes("'/resources/':'/resources.html'"), 'Resources trailing slash must not use client-side route aliasing.');
expect(config.includes("'/books':'/books.html'"), 'Books route alias must remain available.');
expect(config.includes("fetch('/api/chat?mode=public-cms'"), 'Homepage CMS sync must use public-cms.');
expect(!config.includes("script.src='/js/resources-layout.js'"), 'Resources must not load a separate layout controller.');

expect(wrangler.includes('"main": "./worker-entry.js"'), 'Wrangler must deploy worker-entry.js.');
expect(wrangler.includes('"/api/*"'), 'Wrangler must route API requests through the Worker.');
expect(wrangler.includes('"/adminadmin"'), 'Wrangler must route /adminadmin through the Worker.');
expect(wrangler.includes('"/adminadmin.html"'), 'Wrangler must route /adminadmin.html through the Worker.');

expect(entry.includes("url.pathname === '/resources'"), 'Worker entry must recognize /resources.');
expect(entry.includes("url.pathname === '/resources/'"), 'Worker entry must recognize /resources/.');
expect(entry.includes("new URL('/resources.html', url.origin)"), 'Worker entry must redirect Resources to /resources.html.');
expect(entry.includes('status: 301'), 'Resources redirect must be permanent.');
expect(entry.includes("'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate'"), 'Canonical redirect must not be cached.');
expect(entry.includes("headers.set('Cache-Control', 'no-store, no-cache, max-age=0, must-revalidate')"), 'HTML responses must not be cached.');
expect(entry.includes('handler.fetch(request, env, ctx)'), 'Worker entry must delegate non-Resources requests.');

for (const marker of ['worker.js', 'worker-entry.js', 'api/', '.wrangler/', 'tmp/']) {
  expect(assetsIgnore.includes(marker), `.assetsignore must exclude ${marker}.`);
}

expect(!fs.existsSync('api/chat.js'), 'Legacy Vercel chat API must be removed.');
expect(!fs.existsSync('api/weekly-highlights.js'), 'Legacy Vercel Weekly Highlights API must be removed.');
expect(!fs.existsSync('_redirects'), 'Redundant static redirect file must be removed.');
expect(!fs.existsSync('js/resources-layout.js'), 'Redundant Resources layout controller must be removed.');

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
console.log('Production source contract checks passed.');
