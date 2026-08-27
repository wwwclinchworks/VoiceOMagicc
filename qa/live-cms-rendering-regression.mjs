import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

const resourcesHtml = read('resources.html');
const booksHtml = read('books.html');
const mainJs = read('js/main.js');
const chatbotConfig = read('js/chatbot-config.js');
const resourcesLayout = read('js/resources-layout.js');
const weeklyJs = read('js/weekly-highlights.js');
const weeklyAdminJs = read('js/weekly-highlights-admin.js');
const adminHtml = read('adminadmin.html');
const adminJs = read('js/admin.js');
const worker = read('worker.js');
const wrangler = read('wrangler.jsonc');
const redirects = read('_redirects');
const knowledge = JSON.parse(read('data/knowledge.json'));

expect(resourcesHtml.includes('js/main.js'), 'resources.html must load main.js.');
expect(booksHtml.includes('js/main.js'), 'books.html must load main.js.');
expect(resourcesHtml.includes('js/chatbot-config.js'), 'resources.html must load chatbot-config.js.');
expect(booksHtml.includes('js/chatbot-config.js'), 'books.html must load chatbot-config.js.');

expect(redirects.includes('/resources /resources.html 301'), '/resources must 301 redirect to /resources.html at the asset layer.');
expect(redirects.includes('/resources/ /resources.html 301'), '/resources/ must 301 redirect to /resources.html at the asset layer.');
expect(!chatbotConfig.includes("'/resources':'/resources.html'"), 'Resources must not rely on client-side route normalization.');
expect(!chatbotConfig.includes("'/resources/':'/resources.html'"), 'Resources trailing slash must not rely on client-side normalization.');
expect(chatbotConfig.includes("'/books':'/books.html'"), '/books must normalize to /books.html.');
expect(chatbotConfig.includes("'/books/':'/books.html'"), '/books/ must normalize to /books.html.');
expect(chatbotConfig.includes('history.replaceState'), 'Books route normalization must remain available where needed.');
expect(chatbotConfig.includes("script.src='/js/weekly-highlights.js'"), 'Resources page must load Weekly Highlights.');
expect(chatbotConfig.includes("script.src='/js/resources-layout.js'"), 'Resources page must load the layout controller.');
expect(!chatbotConfig.includes('videoCover'), 'Weekly Highlights loader must not depend on videoCover.');

expect(mainJs.includes('state.cms.settings'), 'Resources/Books renderers must consume CMS settings.');
expect(mainJs.includes('state.cms.featuredVideo'), 'Resources renderer must consume featuredVideo.');
expect(mainJs.includes('state.cms.resources'), 'Resources renderer must consume resources.');
expect(mainJs.includes('state.cms.toolkit'), 'CMS renderer must still support toolkit data for admin/backward compatibility.');
expect(mainJs.includes('state.cms.books'), 'Books renderer must consume books.');
expect(mainJs.includes('item.coverImageUrl'), 'Books renderer must consume coverImageUrl.');
expect(mainJs.includes("fetch('/api/chat?mode=public-cms'"), 'Main CMS renderer must use public-cms.');
expect(mainJs.includes('bg-red-light'), 'Resource cards must include the requested PDF icon treatment.');
expect(mainJs.includes('videoContainer'), 'Featured video must keep a dedicated video container.');

expect(resourcesLayout.includes("const RESOURCES_PATH = '/resources.html'"), 'Resources layout must target the canonical Resources page.');
expect(resourcesLayout.includes('intro.remove()'), 'Resources layout must remove the public Resources intro block.');
expect(resourcesLayout.includes("'Event Organizer Speaker Toolkit'"), 'Resources layout must remove the legacy public Speaker Toolkit block.');
expect(resourcesLayout.includes("'Speaker Toolkit'"), 'Resources layout must remove the generic public Speaker Toolkit block.');
expect(resourcesLayout.includes("[highlights, video, resourcesGrid].forEach"), 'Resources layout must enforce Weekly Highlights → video → resources order.');
expect(!resourcesLayout.includes('setInterval'), 'Resources layout must not use polling loops.');

expect(weeklyJs.includes("const CMS_URL = '/api/weekly-highlights'"), 'Weekly Highlights must use the dedicated live endpoint.');
expect(weeklyJs.includes('main.appendChild(section)'), 'Weekly Highlights must insert into the Resources main element.');
expect(weeklyJs.includes('item.published === true'), 'Unpublished highlights must stay hidden.');
expect(weeklyJs.includes("url.protocol === 'https:'"), 'Highlight images must require HTTPS.');
expect(weeklyJs.includes('aspect-[4/3]'), 'Weekly Highlights must use fixed 4:3 image frames.');
expect(!weeklyJs.includes('setInterval'), 'Weekly Highlights must not poll the DOM.');
expect(adminHtml.includes('js/weekly-highlights-admin.js'), 'Admin page must load Weekly Highlights controls.');
expect(weeklyAdminJs.includes("/api/weekly-highlights"), 'Admin Weekly Highlights must use the protected endpoint.');

expect(adminJs.includes("'Page Copy':'settings'"), 'Admin must map Page Copy section key.');
expect(adminJs.includes("'Featured Video':'featuredVideo'"), 'Admin must map Featured Video section key.');
expect(adminJs.includes("'Speaker Toolkit':'toolkit'"), 'Admin must map Speaker Toolkit section key.');

expect(worker.includes("mode === 'public-cms'"), 'Worker must expose public-cms.');
expect(worker.includes('publicSnapshot(file.data?.cms)'), 'Public CMS must use the published snapshot.');
expect(worker.includes("'User-Agent': 'Voice-O-Magic-CMS/1.0'"), 'GitHub calls must include User-Agent.');
expect(worker.includes('cms.weeklyHighlights = normalizeHighlights'), 'Worker CMS normalization must preserve Weekly Highlights.');

expect(wrangler.includes('"main": "./worker.js"'), 'Wrangler must deploy worker.js.');
expect(wrangler.includes('"/api/*"'), 'Wrangler must run the Worker first for API routes.');
expect(wrangler.includes('"/adminadmin"'), 'Wrangler must run the Worker first for admin routes.');
expect(wrangler.includes('"/adminadmin.html"'), 'Wrangler must run the Worker first for admin HTML.');

expect(knowledge.cms && knowledge.cms.featuredVideo, 'CMS data must contain featuredVideo.');
expect(Array.isArray(knowledge.cms?.resources), 'CMS data must contain resources.');
expect(Array.isArray(knowledge.cms?.toolkit), 'CMS data must contain toolkit.');
expect(Array.isArray(knowledge.cms?.books), 'CMS data must contain books.');
const highlights = knowledge.cms?.weeklyHighlights;
expect(highlights?.highlight1, 'CMS data must contain Weekly Highlight 1.');
expect(highlights?.highlight2, 'CMS data must contain Weekly Highlight 2.');
expect(highlights?.highlight1?.published === true, 'Highlight 1 must be published in the smoke-test fixture.');
expect(highlights?.highlight2?.published === true, 'Highlight 2 must be published in the smoke-test fixture.');
expect(/^https:\/\//.test(highlights?.highlight1?.imageUrl || ''), 'Highlight 1 must use HTTPS.');
expect(/^https:\/\//.test(highlights?.highlight2?.imageUrl || ''), 'Highlight 2 must use HTTPS.');
expect(!knowledge.cms.books.some((book) => book?.title === 'Test'), 'CMS data must not contain the accidental Test book.');

if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}

console.log('Live CMS rendering regression checks passed.');
