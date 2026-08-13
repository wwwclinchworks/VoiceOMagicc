import crypto from 'node:crypto';

const COOKIE = 'vom_admin';
const TTL = 12 * 60 * 60 * 1000;
const attempts = new Map();
const REPO = process.env.CMS_GITHUB_REPO || 'wwwclinchworks/VoiceOMagicc';
const BRANCH = process.env.CMS_GITHUB_BRANCH || 'main';
const PATH = process.env.CMS_GITHUB_PATH || 'data/knowledge.json';
const DEFAULT_CMS = {
  settings: {
    resourcesLabel: 'Free Masterclass Vault', resourcesHeading: 'Resource of the Week',
    resourcesParagraph: "Watch this week's featured video and download instant guides, articulation checklists, and vocal warm-up frameworks.",
    resourcesExtraParagraph: '', toolkitHeading: 'Event Organizer Speaker Toolkit',
    toolkitDescription: "Download Shalini Mukund's Speaker One-Sheet, AV Technical Rider, and Press Kit.",
    booksLabel: 'Intellectual Property', booksHeading: 'Published Works',
    booksParagraph: 'Books authored by Shalini Mukund exploring human resilience, personal leadership, and practical parenting strategies.',
    maintenanceMode: false
  },
  featuredVideo: { url: 'https://www.youtube-nocookie.com/embed/KKNCiRWd_j0', title: 'What Is an AI Anyway?', description: 'A deep dive into communication, perception, and the evolving landscape of intelligence. Watch to glean insights on structured thought and presentation clarity.', published: true },
  resources: [], toolkit: [], books: [], history: [], audit: []
};

function json(res,status,body){res.status(status).json(body)}
function clean(v,max=5000){return String(v??'').replace(/[\u0000-\u001F\u007F]/g,'').trim().slice(0,max)}
function originOk(req){const o=req.headers.origin;if(!o)return true;const p=req.headers['x-forwarded-proto']||'https';return o===`${p}://${req.headers.host}`}
function clientIp(req){return String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim()}
function sign(payload){return crypto.createHmac('sha256',process.env.CMS_SESSION_SECRET).update(payload).digest('base64url')}
function makeCookie(){const p=Buffer.from(JSON.stringify({iat:Date.now(),n:crypto.randomUUID()})).toString('base64url');return `${p}.${sign(p)}`}
function validCookie(req){const header=req.headers.cookie||'';const match=header.split(';').map(x=>x.trim()).find(x=>x.startsWith(`${COOKIE}=`));if(!match||!process.env.CMS_SESSION_SECRET)return false;const raw=match.slice(COOKIE.length+1);const [p,sig]=raw.split('.');if(!p||!sig)return false;const expected=sign(p);if(sig.length!==expected.length)return false;try{if(!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return false;const data=JSON.parse(Buffer.from(p,'base64url').toString());return Number.isFinite(data.iat)&&Date.now()-data.iat<TTL}catch{return false}}
function cookie(res,value){res.setHeader('Set-Cookie',`${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${Math.floor(TTL/1000)}`)}
function clearCookie(res){res.setHeader('Set-Cookie',`${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`)}
function allowLogin(ip){const now=Date.now();const a=attempts.get(ip)||{n:0,at:now};if(now-a.at>15*60*1000){a.n=0;a.at=now}a.n+=1;attempts.set(ip,a);return a.n<=5}
function drive(url){try{const u=new URL(url);return u.protocol==='https:'&&(u.hostname==='drive.google.com'||u.hostname==='docs.google.com')}catch{return false}}
function https(url){try{return new URL(url).protocol==='https:'}catch{return false}}
function yt(value){try{const u=new URL(value);const h=u.hostname.toLowerCase();let id='';if(h==='youtu.be')id=u.pathname.slice(1).split('/')[0];else if(h==='youtube.com'||h==='www.youtube.com')id=u.searchParams.get('v')||u.pathname.split('/')[2]||'';else if(h==='youtube-nocookie.com'||h==='www.youtube-nocookie.com')id=u.pathname.split('/')[2]||'';return/^[A-Za-z0-9_-]{11}$/.test(id)?`https://www.youtube-nocookie.com/embed/${id}`:null}catch{return null}}
function uid(x){return/^[A-Za-z0-9_-]{8,80}$/.test(String(x||''))?String(x):crypto.randomUUID()}
function itemBase(x,isBook=false){const out={id:uid(x.id),title:clean(x.title,200),description:clean(x.description,1500),buttonText:clean(x.buttonText||(isBook?'Learn More':'Download PDF'),60),order:Number.isInteger(x.order)?x.order:0,published:x.published!==false};if(!out.title)throw Error('Every item needs a title.');if(isBook){out.bookHeading=clean(x.bookHeading,200);out.authors=clean(x.authors,240);out.categoryLabel=clean(x.categoryLabel,160);out.coverImageUrl=clean(x.coverImageUrl,1000);out.destinationUrl=clean(x.destinationUrl,2000);if(!out.authors)throw Error('Every book needs author names.');if(out.coverImageUrl&&!https(out.coverImageUrl))throw Error('Cover URL must use HTTPS.');if(out.destinationUrl&&!https(out.destinationUrl))throw Error('Book destination must use HTTPS.')}else{out.driveUrl=clean(x.driveUrl,2000);if(out.driveUrl&&!drive(out.driveUrl))throw Error('Drive URL must be a Google Drive/Docs HTTPS URL.')}return out}
function normalizeCms(input){const c={...DEFAULT_CMS,...(input||{})};c.settings={...DEFAULT_CMS.settings,...(input?.settings||{})};for(const [k,m] of Object.entries({resourcesLabel:120,resourcesHeading:200,resourcesParagraph:1500,resourcesExtraParagraph:1500,toolkitHeading:200,toolkitDescription:1500,booksLabel:120,booksHeading:200,booksParagraph:1500}))c.settings[k]=clean(c.settings[k],m);c.settings.maintenanceMode=Boolean(c.settings.maintenanceMode);c.featuredVideo={url:yt(c.featuredVideo?.url||DEFAULT_CMS.featuredVideo.url)||DEFAULT_CMS.featuredVideo.url,title:clean(c.featuredVideo?.title,160)||DEFAULT_CMS.featuredVideo.title,description:clean(c.featuredVideo?.description,1000),published:c.featuredVideo?.published!==false};c.resources=(Array.isArray(c.resources)?c.resources:[]).map(x=>itemBase(x,false));c.toolkit=(Array.isArray(c.toolkit)?c.toolkit:[]).map(x=>itemBase(x,false));c.books=(Array.isArray(c.books)?c.books:[]).map(x=>itemBase(x,true));c.history=Array.isArray(c.history)?c.history.slice(-50):[];c.audit=Array.isArray(c.audit)?c.audit.slice(-100):[];return c}
async function github(method,path,body){const token=process.env.CMS_GITHUB_TOKEN;if(!token)throw Error('CMS_GITHUB_TOKEN is not configured.');const r=await fetch(`https://api.github.com${path}`,{method,headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const t=await r.text();let b;try{b=t?JSON.parse(t):null}catch{b=t}if(!r.ok)throw Object.assign(new Error(b?.message||'GitHub request failed'),{status:r.status});return b}
async function readFile(){const d=await github('GET',`/repos/${REPO}/contents/${PATH}?ref=${encodeURIComponent(BRANCH)}`);return{sha:d.sha,data:JSON.parse(Buffer.from(d.content.replace(/\n/g,''),'base64').toString('utf8'))}}
async function writeFile(data,sha,message){const content=Buffer.from(JSON.stringify(data,null,2)+'\n').toString('base64');return github('PUT',`/repos/${REPO}/contents/${PATH}`,{message,content,sha,branch:BRANCH})}
function requireSession(req,res){if(!validCookie(req)){json(res,401,{error:'Unauthorized'});return false}return true}
function hardenAdminResponse(res){res.setHeader('Cache-Control','no-store, max-age=0');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','no-referrer')}

export default async function handler(req,res){
  const mode=req.query?.mode||'';
  try{
    if(mode){hardenAdminResponse(res)}
    if(mode==='admin-login'){
      if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
      if(!process.env.CMS_ADMIN_PASSWORD||!process.env.CMS_SESSION_SECRET||process.env.CMS_SESSION_SECRET.length<32)return json(res,500,{error:'CMS security variables are not configured correctly.'});
      const ip=clientIp(req);if(!allowLogin(ip))return json(res,429,{error:'Too many login attempts. Try again later.'});
      const password=clean(req.body?.password,500);if(!password)return json(res,400,{error:'Password is required.'});
      const a=Buffer.from(password),b=Buffer.from(process.env.CMS_ADMIN_PASSWORD);if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return json(res,401,{error:'Invalid password.'});
      cookie(res,makeCookie());return json(res,200,{ok:true});
    }
    if(mode==='admin-logout'){if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});clearCookie(res);return json(res,200,{ok:true})}
    if(mode==='admin-data'){if(!requireSession(req,res))return;const f=await readFile();return json(res,200,{cms:normalizeCms(f.data.cms)})}
    if(mode==='admin-save'){
      if(req.method!=='POST'||!requireSession(req,res)||!originOk(req))return;
      const next=normalizeCms(req.body?.cms),f=await readFile(),previous=normalizeCms(f.data.cms);next.history=[...(previous.history||[]),{id:crypto.randomUUID(),at:new Date().toISOString(),snapshot:previous}].slice(-50);next.audit=[...(previous.audit||[]),{at:new Date().toISOString(),action:'save'}].slice(-100);f.data.cms=next;await writeFile(f.data,f.sha,'cms: update Voice-O-Magic content');return json(res,200,{ok:true,cms:next});
    }
    if(mode==='admin-restore'){
      if(req.method!=='POST'||!requireSession(req,res)||!originOk(req))return;
      const f=await readFile(),current=normalizeCms(f.data.cms),version=current.history.find(x=>x.id===req.body?.versionId);if(!version)return json(res,404,{error:'Version not found.'});const restored=normalizeCms(version.snapshot);restored.history=current.history;restored.audit=[...(current.audit||[]),{at:new Date().toISOString(),action:'restore',versionId:version.id}].slice(-100);f.data.cms=restored;await writeFile(f.data,f.sha,'cms: restore content version');return json(res,200,{ok:true,cms:restored});
    }
    if(mode)return json(res,404,{error:'Unknown mode'});
    if(req.method!=='POST'){res.setHeader('Allow','POST');return json(res,405,{error:'Method not allowed'})}
    const apiKey=process.env.OPENROUTER_API_KEY;if(!apiKey)return json(res,500,{error:'OPENROUTER_API_KEY is not configured on Vercel.'});const body=req.body||{},messages=Array.isArray(body.messages)?body.messages:[];if(!messages.length)return json(res,400,{error:'Messages are required.'});if(messages.length>12)return json(res,400,{error:'Conversation is too long. Please start a new chat.'});const safeMessages=messages.filter(m=>m&&(m.role==='system'||m.role==='user'||m.role==='assistant')&&typeof m.content==='string').map(m=>({role:m.role,content:m.content.slice(0,6000)}));if(!safeMessages.length)return json(res,400,{error:'Valid messages are required.'});const proto=req.headers['x-forwarded-proto']||'https',host=req.headers.host||'voice-o-magicc.vercel.app';const response=await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','HTTP-Referer':`${proto}://${host}`,'X-Title':'Voice-O-Magic'},body:JSON.stringify({model:'openrouter/free',messages:safeMessages,temperature:0.3,max_tokens:300})});const text=await response.text();let data;try{data=JSON.parse(text)}catch{data={error:text.slice(0,500)}}if(!response.ok)return json(res,response.status,{error:data?.error?.message||data?.error||'OpenRouter request failed.'});return json(res,200,data)
  }catch(error){console.error('Voice-O-Magic API error:',error);return json(res,error.status||500,{error:error.message||'Request failed.'})}
}
