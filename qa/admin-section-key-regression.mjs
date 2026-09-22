import fs from 'node:fs';

const source=fs.readFileSync('js/admin.js','utf8');
const expected={
  'Page Copy':'settings',
  'Featured Video':'featuredVideo',
  'Resources':'resources',
  'Speaker Toolkit':'toolkit',
  'Books':'books'
};

for(const [label,key] of Object.entries(expected)){
  if(!source.includes(`'${label}':'${key}'`) && !source.includes(`${label}:'${key}'`)){
    throw new Error(`Missing CMS section mapping for ${label}`);
  }
}
if(source.includes('source=source.replace(')) throw new Error('Runtime admin source rewriting must remain removed.');
console.log('Admin section-key regression check passed.');
