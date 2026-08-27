import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

const resourcesHtml = read('resources.html');
const booksHtml = read('books.html');
const mainJs = read('js/main.js');
const chatbotConfig = read('js/chatbot-config.js');
const weeklyJs = read('js/weekly-highlights.js');
const weeklyAdminJs = read('js/weekly-highlights-admin.js');
const adminHtml = read('adminadmin.html');
const worker = read('worker.js');
const knowledge = JSON.parse(read('data/knowledge.json'));

expect(resourcesHtml.includes('js/main.js'), 'resources.html must load main.js.');
expect(booksHtml.includes('js/main.js'), 'books.html must load main.js.');
expect(resourcesHtml.includes('js/chatbot-config.js'), 'resources.html must load chatbot-config.js.');
expect(booksHtml.includes('js/chatbot-config.js'), 'books.html must load chatbot-config.js.');
expect(chatbotConfig.includes("LIVE_CMS_ENDPOINT='/api/chat?mode=public-cms'"), 'chatbot-config.js must bridge live CMS reads.');
expect(chatbotConfig.includes("url.startsWith('/data/knowledge.json?')"), 'live CMS bridge must intercept static knowledge.json fetches.');

expect(chatbotConfig.includes("'/resources':'/resources.html'"), '/resources must normalize to /resources.html.');
expect(chatbotConfig.includes("'/resources/':'/resources.html'"), '/resources/ must normalize to /resources.html.');
expect(chatbotConfig.includes("'/books':'/books.html'"), '/books must normalize to /books.html.');
expect(chatbotConfig.includes("'/books/':'/books.html'"), '/books/ must normalize to /books.html.');
expect(chatbotConfig.includes('history.replaceState'), 'Route normalization must use history.replaceState.');

expect(chatbotConfig.includes("script.src='/js/weekly-highlights.js'"), 'Resources page must load Weekly Highlights.');
expect(!chatbotConfig.includes("!document.getElementById('videoCover')"), 'Loader must not depend on videoCover.');
expect(!chatbotConfig.includes('waitForLiveRender'), 'Loader must not poll for main-content rendering.');
expect(weeklyJs.includes("const CMS_URL = '/api/weekly-highlights'"), 'Weekly Highlights must use its dedicated live endpoint.');
expect(weeklyJs.includes("document.querySelector('footer')"), 'Weekly Highlights must render outside replaceable main content.');
expect(weeklyJs.includes('item.published === true'), 'Unpublished highlights must stay hidden.');
expect(weeklyJs.includes("url.protocol === 'https:'"), 'Highlight images must be HTTPS.');
expect(weeklyJs.includes('[data-weekly-highlights]'), 'Weekly Highlights must prevent duplicate rendering.');
expect(adminHtml.includes('js/weekly-highlights-admin.js'), 'Admin page must load Weekly Highlights controls.');
expect(weeklyAdminJs.includes('/api/weekly-highlights'), 'Admin Weekly Highlights must use the protected endpoint.');

expect(mainJs.includes('state.cms.featuredVideo'), 'Resources must consume featuredVideo from CMS.');
expect(mainJs.includes('state.cms.resources'), 'Resources must consume resources from CMS.');
expect(mainJs.includes('state.cms.toolkit'), 'Resources must consume toolkit from CMS.');
expect(mainJs.includes('state.cms.books'), 'Books must consume books from CMS.');
expect(mainJs.includes('item.coverImageUrl'), 'Books must consume coverImageUrl from CMS.');
expect(mainJs.includes("fetch('/api/chat?mode=public-cms'"), 'Main renderer must use public-cms.');

expect(worker.includes("mode === 'public-cms'"), 'Worker must expose public-cms.');
expect(worker.includes('publicSnapshot(file.data?.cms)'), 'Public CMS must use published snapshot.');
expect(worker.includes("'User-Agent': 'Voice-O-Magic-CMS/1.0'"), 'GitHub calls must include User-Agent.');
expect(worker.includes('cms.weeklyHighlights = normalizeHighlights'), 'Worker must preserve Weekly Highlights.');

const highlights = knowledge.cms?.weeklyHighlights;
expect(highlights && highlights.highlight1 && highlights.highlight2, 'CMS must contain both highlight slots.');
expect(highlights?.highlight1?.published === true, 'Highlight 1 must be published in the smoke-test fixture.');
expect(highlights?.highlight2?.published === true, 'Highlight 2 must be published in the smoke-test fixture.');
expect(/^https:\/\//.test(highlights?.highlight1?.imageUrl || ''), 'Highlight 1 must use HTTPS.');
expect(/^https:\/\//.test(highlights?.highlight2?.imageUrl || ''), 'Highlight 2 must use HTTPS.');

if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}

console.log('Live CMS rendering regression checks passed.');
