import fs from 'node:fs';

const html=fs.readFileSync('adminadmin.html','utf8');
if(!html.includes("'Speaker_Toolkit':'toolkit'")) throw new Error('Expected legacy mapping marker is not present in source loader fixture.');
if(!html.includes("'Speaker Toolkit':'toolkit'")) throw new Error('Correct Speaker Toolkit mapping is missing.');
if(!html.includes("source=source.replace(")) throw new Error('Admin source correction bootstrap is missing.');
console.log('Admin section-key regression check passed.');
