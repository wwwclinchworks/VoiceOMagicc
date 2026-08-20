import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const failures=[];
const requiredFiles=['adminadmin.html','js/admin.js','api/chat.js'];
for(const file of requiredFiles){if(!fs.existsSync(file))failures.push(`Missing required admin file: ${file}`)}
function check(file,args){const result=spawnSync(process.execPath,args,{encoding:'utf8'});if(result.status!==0)failures.push(`JavaScript syntax error: ${file}\n${result.stderr.trim()}`)}
check('js/admin.js',['--check','js/admin.js']);
check('api/chat.js',['--input-type=module','--check']);
const admin=fs.readFileSync('adminadmin.html','utf8');
const script=fs.readFileSync('js/admin.js','utf8');
const api=fs.readFileSync('api/chat.js','utf8');
for(const marker of ['js/admin.js','css/style.css','css/components.css'])if(!admin.includes(marker))failures.push(`Admin bootstrap missing ${marker}`);
for(const marker of ['mode=admin-data','status===401','__vomAdminUnauthorized','data-admin-login','mode=admin-login','location.reload()'])if(!admin.includes(marker))failures.push(`Admin login bootstrap marker missing: ${marker}`);
for(const marker of ['admin-login','admin-data','admin-save','admin-restore','admin-logout'])if(!api.includes(`mode==='${marker}'`))failures.push(`Admin API mode missing: ${marker}`);
for(const marker of ['loadCms','saveSection','saveAll','historySection','renderDashboard','start'])if(!script.includes(`function ${marker}`)||!script.includes(`${marker}()`)&&marker==='start')failures.push(`Admin client flow missing: ${marker}`);
if(!script.includes("document.body.replaceChildren()"))failures.push('Admin dashboard does not rebuild the page safely.');
if(!script.includes("renderDashboard()"))failures.push('Admin dashboard render path missing.');
if(!script.includes("toast('All CMS changes saved successfully.')"))failures.push('Admin save success feedback missing.');
if(!script.includes("toast(error.message||'Unable to save all changes.',true)"))failures.push('Admin save error feedback missing.');
if(failures.length){for(const failure of failures)console.error('FAIL:',failure);process.exit(1)}
console.log('Admin console regression checks passed.');
