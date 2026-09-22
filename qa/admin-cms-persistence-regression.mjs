import fs from 'node:fs';

const resources = fs.readFileSync('resources.html', 'utf8');
const admin = fs.readFileSync('js/admin.js', 'utf8');
const api = fs.readFileSync('api/chat.js', 'utf8');
const weekly = fs.readFileSync('weekly.html', 'utf8');
const books = fs.readFileSync('books.html', 'utf8');

const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

expect(resources.includes('cms.weeklyHighlights?.items'), 'Resources page must consume Weekly Highlights from live CMS.');
expect(resources.includes('slice(0,2)'), 'Resources page must show at most two Weekly Highlights.');
expect(resources.includes('Weekly Highlights'), 'Resources page must render the Weekly Highlights section.');
expect(resources.includes("fetch('/api/chat?mode=public-cms'"), 'Resources page must read live public CMS data.');

expect(books.includes('<script src="js/main.js"></script>'), 'Books page must use the shared CMS renderer.');
expect(weekly.includes("fetch('/api/chat?mode=public-cms'"), 'Weekly page must read live public CMS data.');

expect(admin.includes("Array.isArray(result.versions)?result.versions"), 'Admin restore must use versions returned by the API.');
expect(!admin.includes('await loadVersions()'), 'Admin restore must not call the removed loadVersions helper.');
expect(admin.includes('response.commitSha'), 'Admin section saves must surface the persisted GitHub commit.');
expect(api.includes('commitSha: commit?.commit?.sha || null'), 'Admin save/restore API must return the GitHub commit SHA.');
expect(api.includes("const commit = await writeFile"), 'CMS writes must wait for the GitHub write response.');

if (failures.length) {
  for (const failure of failures) console.error('FAIL:', failure);
  process.exit(1);
}
console.log('Admin CMS persistence/public-rendering regression checks passed.');
