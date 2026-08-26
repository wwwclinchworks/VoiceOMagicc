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

// Public pages must use the shared CMS renderer and the live-CMS bridge.
expect(resourcesHtml.includes('js/main.js'), 'resources.html must load main.js.');
expect(booksHtml.includes('js/main.js'), 'books.html must load main.js.');
expect(resourcesHtml.includes('js/chatbot-config.js'), 'resources.html must load chatbot-config.js.');
expect(booksHtml.includes('js/chatbot-config.js'), 'books.html must load chatbot-config.js.');
expect(chatbotConfig.includes("LIVE_CMS_ENDPOINT='/api/chat?mode=public-cms'"), 'chatbot-config.js must bridge CMS reads to the Worker public-cms endpoint.');
expect(chatbotConfig.includes("url.startsWith('/data/knowledge.json?')"), 'live CMS bridge must intercept the static knowledge.json fetch used by page rendering.');

// Weekly Highlights must be loaded deterministically after the live CMS renderer has replaced the static Resources page.
expect(chatbotConfig.includes("script.src='/js/weekly-highlights.js'"), 'Resources page must load Weekly Highlights client code.');
expect(chatbotConfig.includes("!document.getElementById('videoCover')"), 'Weekly Highlights loader must wait for the live CMS render.');
expect(chatbotConfig.includes("data-vom-weekly-highlights"), 'Weekly Highlights loader must avoid duplicate script injection.');

// Resource and book rendering must consume CMS-controlled fields.
expect(mainJs.includes('state.cms.featuredVideo'), 'Resources renderer must consume featuredVideo from CMS.');
expect(mainJs.includes('state.cms.resources'), 'Resources renderer must consume resources from CMS.');
expect(mainJs.includes('state.cms.toolkit'), 'Resources renderer must consume toolkit from CMS.');
expect(mainJs.includes('state.cms.books'), 'Books renderer must consume books from CMS.');
expect(mainJs.includes('item.coverImageUrl'), 'Books renderer must consume coverImageUrl from CMS.');
expect(mainJs.includes("fetch('/api/chat?mode=public-cms'"), 'Main CMS renderer must read from the live Worker public-cms endpoint.');

// Weekly Highlights must read the same live CMS source and be admin-wired.
expect(weeklyJs.includes("/api/chat?mode=public-cms"), 'Weekly Highlights client must read from the live Worker public-cms endpoint.');
expect(weeklyJs.includes('item.published === true'), 'Unpublished Weekly Highlights must stay hidden.');
expect(weeklyJs.includes("url.protocol === 'https:'"), 'Weekly Highlights must require HTTPS image URLs.');
expect(adminHtml.includes('js/weekly-highlights-admin.js'), 'Admin page must load Weekly Highlights controls.');
expect(weeklyAdminJs.includes("/api/weekly-highlights"), 'Admin Weekly Highlights must use the protected Worker endpoint.');

// Worker must expose the live public CMS endpoint and use the GitHub API safely.
expect(worker.includes("mode === 'public-cms'"), 'Worker must expose the public-cms mode.');
expect(worker.includes('publicSnapshot(file.data?.cms)'), 'Public CMS responses must use the published-content snapshot.');
expect(worker.includes("'User-Agent': 'Voice-O-Magic-CMS/1.0'"), 'GitHub API calls must include a User-Agent.');
expect(worker.includes('cms.weeklyHighlights = normalizeHighlights'), 'Worker CMS normalization must preserve Weekly Highlights.');

expect(knowledge.cms && knowledge.cms.featuredVideo, 'CMS data must contain featuredVideo.');
expect(Array.isArray(knowledge.cms?.resources), 'CMS data must contain resources.');
expect(Array.isArray(knowledge.cms?.toolkit), 'CMS data must contain toolkit.');
expect(Array.isArray(knowledge.cms?.books), 'CMS data must contain books.');
expect(knowledge.cms?.weeklyHighlights?.highlight1, 'CMS data must contain Weekly Highlight 1.');
expect(knowledge.cms?.weeklyHighlights?.highlight2, 'CMS data must contain Weekly Highlight 2.');

if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}

console.log('Live CMS rendering regression checks passed.');
