import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

const main = read('js/main.js');
const admin = read('js/admin.js');
const adminHtml = read('adminadmin.html');
const weekly = read('js/weekly-highlights.js');
const config = read('js/chatbot-config.js');
const redirects = read('_redirects');
const wrangler = read('wrangler.jsonc');
const entry = read('worker-entry.js');
const knowledge = JSON.parse(read('data/knowledge.json'));

expect(main.includes('function resourceCard(item)'), 'main.js must define resourceCard.');
expect(main.includes('function renderResources()'), 'main.js must define renderResources.');
expect(main.includes('function bookCard(item)'), 'main.js must define bookCard.');
expect(main.includes('function renderBooks()'), 'main.js must define renderBooks.');
expect(main.includes('state.cms.featuredVideo'), 'main.js must consume featuredVideo.');
expect(main.includes('state.cms.resources'), 'main.js must consume resources.');
expect(main.includes('state.cms.toolkit'), 'main.js must consume toolkit.');
expect(main.includes('state.cms.books'), 'main.js must consume books.');
expect(main.includes('item.coverImageUrl'), 'main.js must consume coverImageUrl.');
expect(main.includes("fetch('/api/chat?mode=public-cms'"), 'main.js must use live public-cms.');
expect(main.includes('bg-red-light'), 'resourceCard must use the PDF icon styling.');
expect(main.includes('videoContainer'), 'featured video must use the dedicated video container.');

expect(admin.includes("'Page Copy':'settings'"), 'admin.js must map Page Copy.');
expect(admin.includes("'Featured Video':'featuredVideo'"), 'admin.js must map Featured Video.');
expect(admin.includes("'Speaker Toolkit':'toolkit'"), 'admin.js must map Speaker Toolkit.');
expect(adminHtml.includes("fetch('js/admin.js'"), 'admin page must load admin.js directly.');
expect(!adminHtml.includes('source.replace('), 'admin page must not patch admin.js source at runtime.');

expect(weekly.includes("const CMS_URL = '/api/weekly-highlights'"), 'Weekly Highlights must use its dedicated endpoint.');
expect(weekly.includes('main.appendChild(section)'), 'Weekly Highlights must insert inside main.');
expect(weekly.includes('aspect-[4/3]'), 'Weekly Highlights must use fixed 4:3 frames.');
expect(!weekly.includes('setInterval'), 'Weekly Highlights must not use polling.');
expect(!config.includes("'/resources':'/resources.html'"), 'Resources must not use client-side route aliasing.');
expect(!config.includes("'/resources/':'/resources.html'"), 'Resources trailing slash must not use client-side route aliasing.');
expect(!config.includes("history.replaceState(window.history.state,'',target"), 'Resources must not rewrite the browser URL after load.');
expect(config.includes("'/books':'/books.html'"), 'Books route alias must exist.');
expect(redirects.includes('/resources /resources.html 301'), 'Resources must retain the asset redirect rule.');
expect(redirects.includes('/resources/ /resources.html 301'), 'Resources trailing slash must retain the asset redirect rule.');

expect(wrangler.includes('"main": "./worker-entry.js"'), 'Wrangler must deploy the canonical Worker entrypoint.');
expect(wrangler.includes('"/adminadmin"'), 'Wrangler must route /adminadmin through the Worker.');
expect(wrangler.includes('"/adminadmin.html"'), 'Wrangler must route /adminadmin.html through the Worker.');
expect(wrangler.includes('"/api/*"'), 'Wrangler must route API requests through the Worker.');

expect(entry.includes("url.pathname === '/resources'"), 'Worker entry must recognize /resources.');
expect(entry.includes("url.pathname === '/resources/'"), 'Worker entry must recognize /resources/.');
expect(entry.includes("new URL('/resources.html', url.origin)"), 'Worker entry must redirect Resources to /resources.html.');
expect(entry.includes('Response.redirect(destination.toString(), 301)'), 'Resources redirect must be a permanent 301 redirect.');
expect(entry.includes("return handler.fetch(request, env, ctx)"), 'Worker entry must delegate all non-Resources requests to worker.js.');

const highlights = knowledge.cms?.weeklyHighlights;
expect(highlights?.highlight1?.published === true, 'Highlight 1 must be published.');
expect(highlights?.highlight2?.published === true, 'Highlight 2 must be published.');
expect(/^https:\/\//.test(highlights?.highlight1?.imageUrl || ''), 'Highlight 1 must use HTTPS.');
expect(/^https:\/\//.test(highlights?.highlight2?.imageUrl || ''), 'Highlight 2 must use HTTPS.');
expect(!knowledge.cms?.books?.some((book) => book?.title === 'Test'), 'Stray Test book must be removed.');

if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}

console.log('Production source contract checks passed.');
