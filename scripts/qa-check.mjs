import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root=process.cwd();
const failures=[];
const warnings=[];
const skip=new Set(['.git','node_modules','.vercel']);
function walk(dir){const out=[];for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(skip.has(entry.name))continue;const full=path.join(dir,entry.name);if(entry.isDirectory())out.push(...walk(full));else out.push(full)}return out}
function rel(file){return path.relative(root,file).replaceAll(path.sep,'/')}
function checkNode(file,args){const r=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8'});if(r.status!==0)failures.push(`JavaScript syntax error: ${rel(file)}\n${r.stderr.trim()}`)}
function fail(x){failures.push(x)}

const files=walk(root);
for(const file of files.filter(f=>f.endsWith('.json'))){try{JSON.parse(fs.readFileSync(file,'utf8'))}catch(e){fail(`Invalid JSON: ${rel(file)} (${e.message})`)}}
for(const file of files.filter(f=>f.endsWith('.js'))){if(rel(file)==='api/chat.js')checkNode(file,['--input-type=module','--check']);else checkNode(file,['--check',file]);}
for(const file of files.filter(f=>f.endsWith('.html'))){const source=fs.readFileSync(file,'utf8');for(const ref of [...source.matchAll(/(?:href|src)\s*=\s*[\"']([^\"']+)[\"']/gi)].map(m=>m[1])){if(!ref||ref.startsWith('#')||/^[a-z]+:/i.test(ref)||ref.startsWith('//'))continue;const clean=ref.split('#')[0].split('?')[0];if(!clean)continue;const target=path.resolve(path.dirname(file),clean);if(!target.startsWith(root+path.sep))fail(`Reference escapes repository: ${rel(file)} -> ${ref}`);else if(!fs.existsSync(target))fail(`Broken local reference: ${rel(file)} -> ${ref}`)}}

const wrangler=fs.readFileSync(path.join(root,'wrangler.jsonc'),'utf8');
for(const marker of ['\"main\": \"./worker.js\"','\"/api/*\"','\"/adminadmin\"','\"/adminadmin.html\"'])if(!wrangler.includes(marker))fail(`Missing Cloudflare Wrangler setting: ${marker}`);
const apiSource=fs.readFileSync(path.join(root,'api/chat.js'),'utf8');
if(apiSource.includes('process.env.CMS_ADMIN_PASSWORD)'))fail('Plaintext CMS_ADMIN_PASSWORD environment authentication remains in API source.');
for(const marker of ["CMS_ADMIN_PASSWORD_HASH","function parsePasswordHash","crypto.scryptSync","crypto.timingSafeEqual","if (!origin) return false","function publicSnapshot","c.resources = c.resources.filter((item) => item.published)"])if(!apiSource.includes(marker))fail(`Missing security control in api/chat.js: ${marker}`);
for(const file of files.filter(f=>f.endsWith('.js'))){if(fs.readFileSync(file,'utf8').includes('innerHTML'))warnings.push(`Review innerHTML usage: ${rel(file)}`)}
console.log(`Scanned ${files.length} repository files.`);for(const w of warnings)console.log(`WARN: ${w}`);if(failures.length){for(const f of failures)console.error(`FAIL: ${f}`);process.exit(1)}console.log('Automated QA checks passed.');
