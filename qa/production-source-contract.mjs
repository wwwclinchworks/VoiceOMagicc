import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

const main = read('js/main.js');
const admin = read('js/admin.js');
const adminHtml = read('adminadmin.html');
const weekly = read('js/weekly-highlights.js');
const config = read('js/chatbot-config.js');
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
expect(main.includes('videoContainer'), 'featured video must use a dedicated video container.');

expect(admin.includes("'Page Copy':'settings'"), 'admin.js must map Page Copy.');
expect(admin.includes("'Featured Video':'featuredVideo'"), 'admin.js must map Featured Video.');
expect(admin.includes("'Speaker Toolkit':'toolkit'"), 'admin.js must map Speaker Toolkit.');
expect(admin.includes("'Books':'books'"), 'admin.js must map Books.');
expect(adminHtml.includes("fetch('js/admin.js'"), 'admin page must load admin.js directly.');
expect(!adminHtml.includes('source.replace('), 'admin page must not patch admin.js at runtime.');

expect(weekly.includes("const CMS_URL = '/api/chat?mode=public-cms'"), 'Weekly Highlights must use the public CMS endpoint.');
expect(weekly.includes('main.prepend(section)'), 'Weekly Highlights must mount before rendered Resources content.');
expect(weekly.includes('removePublicIntroAndToolkit'), 'Resources cleanup must share the single Resources runtime.');
expect(weekly.includes('aspect-[4/3]'), 'Weekly Highlights must use fixed 4:3 frames.');
expect(weekly.includes('new MutationObserver'), 'Resources rendering must survive CMS main replacement.');
expect(!weekly.includes('setInterval'), 'Weekly Highlights must not poll the DOM.');

expect(!config.includes("'/resources':'/resources.html'"), 'Resources must not use client-side route aliasing.');
expect(!config.includes("'/resources/':'/resources.html'"), 'Resources trailing slash must not use client-side route aliasing.');
expect(config.includes("'/books':'/books.html'"), 'Books route alias must remain available.');
expect(config.includes("fetch('/api/chat?mode=public-cms'"), 'Homepage CMS sync must use the public CMS endpoint.');

expect(wrangler.includes('"main": "./worker-entry.js"'), 'Wrangler must deploy the canonical Worker entrypoint.');
expect(wrangler.includes('"/api/*"'), 'Wrangler must route API requests through the Worker.');
expect(wrangler.includes('"/adminadmin"'), 'Wrangler must route /adminadmin through the Worker.');
expect(wrangler.includes('"/adminadmin.html"'), 'Wrangler must route /adminadmin.html through the Worker.');

expect(entry.includes("url.pathname === '/resources'"), 'Worker entry must recognize /resources.');
expect(entry.includes("url.pathname === '/resources/'"), 'Worker entry must recognize /resources/.');
expect(entry.includes("new URL('/resources.html', url.origin)"), 'Worker entry must redirect Resources to /resources.html.');
expect(entry.includes("status: 301"), 'Resources redirect must be permanent.');
expect(entry.includes("'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate'"), 'Canonical redirect must not be cached.');
expect(entry.includes("headers.set('Cache-Control', 'no-store, no-cache, max-age=0, must-revalidate')"), 'HTML responses must not be cached.');
expect(entry.includes('handler.fetch(request, env, ctx)'), 'Worker entry must delegate non-canonical requests to worker.js.');

expect(fs.existsSync('js/resources-layout.js'), 'Legacy layout controller must be removed from the production tree.');

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
