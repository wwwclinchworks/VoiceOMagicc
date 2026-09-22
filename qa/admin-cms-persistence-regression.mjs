import fs from 'node:fs';

const resources = fs.readFileSync('resources.html', 'utf8');
const admin = fs.readFileSync('js/admin.js', 'utf8');
const api = fs.readFileSync('api/chat.js', 'utf8');
const weekly = fs.readFileSync('weekly.html', 'utf8');
const adminWeekly = fs.readFileSync('js/admin-weekly-cms.js', 'utf8');
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
expect(api.includes("res.setHeader('Cache-Control', 'no-store, no-cache, max-age=0, must-revalidate')"), 'Public CMS must not be edge-cached after an Admin save.');
expect(api.includes("res.setHeader('Pragma', 'no-cache')"), 'Public CMS must emit a no-cache pragma.');
expect(admin.includes("toast(result.commitSha?('All CMS changes saved to GitHub • '+result.commitSha.slice(0,7))"), 'Save All must surface the persisted GitHub commit.');
expect(admin.includes("const refreshed=await api('admin-data')"), 'Save All must refresh version history without turning a successful save into a failure.');
expect(adminWeekly.includes('result.commitSha?'), 'Weekly Highlights save must surface the persisted GitHub commit.');

if (failures.length) {
  for (const failure of failures) console.error('FAIL:', failure);
  process.exit(1);
}
console.log('Admin CMS persistence/public-rendering regression checks passed.');
