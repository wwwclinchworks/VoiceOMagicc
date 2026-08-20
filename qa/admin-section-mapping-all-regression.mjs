const source = `const sectionKeys={Page_Copy:'settings','Page Copy':'settings',Featured_Video:'featuredVideo','Featured Video':'featuredVideo',Resources:'resources','Speaker_Toolkit':'toolkit','Speaker Toolkit':'toolkit',Books:'books'};`;

const expected = {
  'Page Copy': 'settings',
  'Featured Video': 'featuredVideo',
  'Resources': 'resources',
  'Speaker Toolkit': 'toolkit',
  'Books': 'books'
};

for (const [label, key] of Object.entries(expected)) {
  if (!source.includes(`'${label}'`)) throw new Error(`Missing mapping for ${label}`);
  if (!source.includes(`'${label}':'${key}'`)) throw new Error(`Incorrect mapping for ${label}`);
}

console.log('All CMS section label mappings are covered.');
