(function(){
'use strict';

const state={cms:null,dirty:false,versions:[]};
const esc=s=>String(s??'');
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};

async function api(mode,opt={}){
  const r=await fetch('/api/chat?mode='+encodeURIComponent(mode),{cache:'no-store',...opt,headers:{...(opt.headers||{})}});
  const body=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(body.error||'Request failed');
  return body;
}
async function loadAdminData(){const d=await api('admin-data');state.cms=d.cms;state.versions=Array.isArray(d.versions)?d.versions:[];return d}
function toast(message,bad=false){
  const t=el('div','fixed right-5 bottom-5 z-[100] max-w-md rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl',message);
  t.style.background=bad?'#b42318':'#111827';document.body.append(t);setTimeout(()=>t.remove(),3200);
}
function markDirty(){state.dirty=true;const b=document.getElementById('saveAll');if(b){b.textContent='Save All Changes • Unsaved';b.disabled=false}}
function markClean(){state.dirty=false;const b=document.getElementById('saveAll');if(b)b.textContent='Save All Changes'}
function uid(){return globalThis.crypto?.randomUUID?crypto.randomUUID():'item-'+Date.now()+'-'+Math.random().toString(36).slice(2)}

function login(){
  document.body.innerHTML='';
  document.title='Private Admin | Voice-O-Magic';
  const shell=el('main','min-h-screen flex items-center justify-center p-6 bg-theme');
  const card=el('section','material-card w-full max-w-md p-8');
  card.append(el('div','text-xs font-bold uppercase tracking-[0.18em] text-gold','Private Control Center'),el('h1','font-display text-3xl font-bold mt-2 text-heading','Voice-O-Magic Admin'),el('p','text-sm text-sec mt-2','Authorized administrator access only.'));
  const form=el('form','space-y-4 mt-7');
  const label=el('label','block');label.append(el('span','block text-sm font-semibold mb-1.5 text-sec','Administrator password'));
  const input=document.createElement('input');input.type='password';input.autocomplete='current-password';input.required=true;input.className='md-input';label.append(input);
  const error=el('p','text-sm text-red');error.hidden=true;
  const btn=el('button','btn-primary w-full','Sign in');btn.type='submit';
  form.append(label,error,btn);form.addEventListener('submit',async e=>{
    e.preventDefault();error.hidden=true;btn.disabled=true;btn.textContent='Signing in…';
    try{await api('admin-login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:input.value})});await loadAdminData();state.dirty=false;renderDashboard();}
    catch(err){error.textContent=err.message||'Login failed.';error.hidden=false;btn.disabled=false;btn.textContent='Sign in'}
  });
  card.append(form);shell.append(card);document.body.append(shell);
}

function textField(label,name,value,type='text',onInput){
  const w=el('label','block');w.append(el('span','block text-sm font-semibold mb-1.5 text-sec',label));
  const i=document.createElement(type==='textarea'?'textarea':'input');
  i.name=name;i.value=esc(value);i.className='md-input';
  if(type==='textarea'){i.rows=4;i.classList.add('resize-y')}
  if(onInput)i.addEventListener('input',()=>{onInput(i.value);markDirty()});
  w.append(i);return w;
}
function checkbox(label,checked,onChange){const w=el('label','inline-flex items-center gap-2 text-sm font-semibold cursor-pointer text-sec');const i=document.createElement('input');i.type='checkbox';i.checked=Boolean(checked);i.addEventListener('change',()=>{onChange(i.checked);markDirty()});w.append(i,el('span','',label));return w}
function primaryButton(text){const b=el('button','btn-primary',text);b.type='button';return b}
function secondaryButton(text){const b=el('button','btn-secondary',text);b.type='button';return b}

function sectionMeta(key){return {resources:{title:'Resources',singular:'Resource',icon:'📄'},toolkit:{title:'Speaker Toolkit',singular:'Toolkit Item',icon:'🎤'},books:{title:'Books',singular:'Book',icon:'📚'}}[key]}
function blankItem(key){
  const base={id:uid(),title:'',description:'',buttonText:key==='books'?'Learn More':'Download',order:state.cms[key].length,published:true};
  if(key==='books')Object.assign(base,{bookHeading:'',authors:'',categoryLabel:'',coverImageUrl:'',destinationUrl:''});
  else base.driveUrl='';
  return base;
}
function duplicateItem(key,item){const clone=JSON.parse(JSON.stringify(item));clone.id=uid();clone.title=clone.title?clone.title+' (Copy)':'New '+sectionMeta(key).singular;clone.order=state.cms[key].length;state.cms[key].push(clone);markDirty();renderLists();}
function moveItem(key,index,dir){const list=state.cms[key];const target=index+dir;if(target<0||target>=list.length)return;const a=list[index],b=list[target];[a.order,b.order]=[b.order,a.order];markDirty();renderLists()}
function togglePublish(key,item){item.published=!item.published;markDirty();renderLists()}
function deleteItem(key,item){if(!confirm('Delete this item? This is not saved until you click Save All Changes.'))return;state.cms[key]=state.cms[key].filter(x=>x!==item);state.cms[key].forEach((x,i)=>x.order=i);markDirty();renderLists()}

function openEditor(key,item){
  const meta=sectionMeta(key);const overlay=el('div','fixed inset-0 z-[90] bg-black/50 p-4 md:p-8 overflow-y-auto');
  const modal=el('section','max-w-3xl mx-auto rounded-2xl bg-surface shadow-2xl');
  const head=el('div','flex items-center justify-between gap-4 p-5 border-b border-theme');
  head.append(el('div','font-bold text-heading',''+meta.icon+'  '+(item.title||'New '+meta.singular)), (()=>{const b=secondaryButton('Close');b.onclick=()=>overlay.remove();return b})());modal.append(head);
  const body=el('div','p-5 space-y-4');
  body.append(textField('Title','title',item.title,'text',v=>item.title=v));
  if(key==='books'){
    body.append(textField('Book heading','bookHeading',item.bookHeading,'text',v=>item.bookHeading=v));
    body.append(textField('Author name(s)','authors',item.authors,'text',v=>item.authors=v));
    body.append(textField('Category / label','categoryLabel',item.categoryLabel,'text',v=>item.categoryLabel=v));
    body.append(textField('Description','description',item.description,'textarea',v=>item.description=v));
    body.append(textField('Cover image HTTPS URL','coverImageUrl',item.coverImageUrl,'text',v=>item.coverImageUrl=v));
    body.append(textField('Destination HTTPS URL','destinationUrl',item.destinationUrl,'text',v=>item.destinationUrl=v));
    body.append(textField('Button text','buttonText',item.buttonText,'text',v=>item.buttonText=v));
  }else{
    body.append(textField('Description','description',item.description,'textarea',v=>item.description=v));
    body.append(textField('Google Drive / Docs HTTPS URL','driveUrl',item.driveUrl,'text',v=>item.driveUrl=v));
    body.append(textField('Button text','buttonText',item.buttonText,'text',v=>item.buttonText=v));
  }
  body.append(textField('Display order','order',item.order,'number',v=>{item.order=Number(v)||0}));
  body.append(checkbox('Published',item.published,v=>item.published=v));
  const actions=el('div','flex flex-wrap justify-end gap-2 p-5 border-t border-theme');
  const save=primaryButton('Done');save.onclick=()=>{markDirty();overlay.remove();renderLists()};actions.append(save);modal.append(body,actions);overlay.append(modal);overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});document.body.append(overlay);
}

function itemCard(key,item,index){
  const meta=sectionMeta(key);const card=el('article','material-card p-4');
  const top=el('div','flex flex-col md:flex-row md:items-start justify-between gap-3');
  const summary=el('div','min-w-0');summary.append(el('div','font-bold text-lg truncate text-heading',item.title||'Untitled '+meta.singular),el('div','text-sm text-sec mt-1',item.description||'No description yet.'));
  const status=el('span','inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold '+(item.published?'bg-green-100 text-green-700':'bg-gray-100 text-gray-600'),item.published?'Published':'Hidden');summary.append(status);top.append(summary);
  const buttons=el('div','flex flex-wrap gap-2 justify-end');
  const edit=secondaryButton('Edit');edit.onclick=()=>openEditor(key,item);
  const duplicate=secondaryButton('Duplicate');duplicate.onclick=()=>duplicateItem(key,item);
  const toggle=secondaryButton(item.published?'Hide':'Publish');toggle.onclick=()=>togglePublish(key,item);
  const up=secondaryButton('↑');up.title='Move up';up.disabled=index===0;up.onclick=()=>moveItem(key,index,-1);
  const down=secondaryButton('↓');down.title='Move down';down.disabled=index===state.cms[key].length-1;down.onclick=()=>moveItem(key,index,1);
  const del=secondaryButton('Delete');del.classList.add('text-red');del.onclick=()=>deleteItem(key,item);
  buttons.append(edit,duplicate,toggle,up,down,del);top.append(buttons);card.append(top);return card;
}

function renderLists(){
  Object.entries(sectionRefs).forEach(([key,ref])=>{
    const list=ref.list;list.replaceChildren();
    const items=[...state.cms[key]].sort((a,b)=>a.order-b.order);
    if(!items.length){const empty=el('div','rounded-xl border border-dashed border-theme p-8 text-center text-muted','No items yet. Use Add '+sectionMeta(key).singular+' below.');list.append(empty)}
    items.forEach((item,i)=>list.append(itemCard(key,item,i)));
  });
}
const sectionRefs={};
function buildSection(root,key){
  const meta=sectionMeta(key);const sec=el('section','material-card p-5');
  const head=el('div','flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between');
  head.append(el('div','font-bold text-heading',''+meta.icon+'  '+meta.title));
  const addTop=primaryButton('+ Add '+meta.singular);addTop.onclick=()=>openEditor(key,blankItem(key));head.append(addTop);sec.append(head);
  const list=el('div','space-y-3 mt-5');sec.append(list);
  const addBottom=secondaryButton('+ Add Another '+meta.singular);addBottom.classList.add('w-full','mt-4');addBottom.onclick=()=>openEditor(key,blankItem(key));sec.append(addBottom);
  sectionRefs[key]={list};root.append(sec);
}

function renderPageSettings(root){
  const sec=el('section','material-card p-5');sec.append(el('h2','text-2xl font-bold text-heading','Page Content'));
  const grid=el('div','grid md:grid-cols-2 gap-4 mt-5');const s=state.cms.settings;
  [['Resources label','resourcesLabel'],['Resources heading','resourcesHeading'],['Resources paragraph','resourcesParagraph','textarea'],['Extra paragraph','resourcesExtraParagraph','textarea'],['Toolkit heading','toolkitHeading'],['Toolkit description','toolkitDescription','textarea'],['Books label','booksLabel'],['Books heading','booksHeading'],['Books paragraph','booksParagraph','textarea']].forEach(([l,k,t])=>grid.append(textField(l,k,s[k],t||'text',v=>s[k]=v)));
  grid.append(checkbox('Maintenance mode',s.maintenanceMode,v=>s.maintenanceMode=v));sec.append(grid);root.append(sec);
}
function renderVideo(root){
  const sec=el('section','material-card p-5');sec.append(el('h2','text-2xl font-bold text-heading','Featured YouTube Video'));const v=state.cms.featuredVideo;const grid=el('div','grid md:grid-cols-2 gap-4 mt-5');
  grid.append(textField('YouTube URL','url',v.url,'text',x=>v.url=x),textField('Video title','title',v.title,'text',x=>v.title=x),textField('Description','description',v.description,'textarea',x=>v.description=x),checkbox('Published',v.published,x=>v.published=x));sec.append(grid);root.append(sec);
}
function renderHistory(root){
  const sec=el('section','material-card p-5');sec.append(el('h2','text-2xl font-bold text-heading','Version History'));
  const rows=Array.isArray(state.versions)?state.versions:[];
  if(!rows.length)sec.append(el('p','text-sm text-muted mt-3','No CMS versions found in Git history.'));
  rows.forEach((v,index)=>{
    const row=el('div','flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-theme p-3 mt-3');
    const when=v.at?new Date(v.at).toLocaleString():'Unknown time';
    row.append(el('div','min-w-0',el('span','block text-sm text-heading font-semibold',when).parentElement));
    const text=row.querySelector('div');
    text.append(el('span','block text-xs text-muted mt-1 truncate',v.message||'CMS update'));
    const b=secondaryButton(index===0?'Current':'Restore');
    b.disabled=index===0;
    b.onclick=async()=>{
      if(!confirm('Restore this version? The current content will remain available in Git history.'))return;
      try{
        b.disabled=true;b.textContent='Restoring…';
        const d=await api('admin-restore',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({versionId:v.id})});
        state.cms=d.cms;state.dirty=false;await loadAdminData();renderDashboard();toast('Version restored.');
      }catch(e){b.disabled=false;b.textContent='Restore';toast(e.message,true)}
    };
    row.append(b);sec.append(row);
  });
  root.append(sec);
}

function renderDashboard(){
  document.body.innerHTML='';document.title='Voice-O-Magic Admin';
  const root=el('main','max-w-7xl mx-auto p-5 md:p-8 space-y-6');
  const header=el('header','rounded-2xl bg-[#111827] text-white p-5 md:p-6 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center');
  const title=el('div','');title.append(el('div','text-xs font-bold uppercase tracking-[0.18em] text-[#d7bd62]','Private Control Center'),el('h1','text-2xl md:text-3xl font-bold mt-1','Voice-O-Magic CMS'),el('p','text-sm text-gray-300 mt-1','Edit public content without touching the website code.'));header.append(title);
  const actions=el('div','flex flex-wrap gap-2');const save=primaryButton('Save All Changes');save.id='saveAll';const logout=secondaryButton('Logout');actions.append(save,logout);header.append(actions);root.append(header);
  const info=el('div','flex flex-wrap gap-3 text-sm');info.append(el('div','rounded-full bg-white border border-gray-200 px-3 py-1.5','Changes stay local until saved.'));if(state.dirty)info.append(el('div','rounded-full bg-amber-100 text-amber-800 px-3 py-1.5 font-semibold','Unsaved changes'));root.append(info);
  const content=el('div','space-y-6');renderPageSettings(content);renderVideo(content);buildSection(content,'resources');buildSection(content,'toolkit');buildSection(content,'books');renderHistory(content);root.append(content);document.body.append(root);
  renderLists();
  save.onclick=async()=>{try{save.disabled=true;save.textContent='Saving…';const d=await api('admin-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cms:state.cms})});state.cms=d.cms;await loadAdminData();markClean();renderDashboard();toast('All changes saved successfully.')}catch(e){save.disabled=false;save.textContent='Save All Changes';toast(e.message,true)}};
  logout.onclick=async()=>{try{await api('admin-logout',{method:'POST'})}finally{login()}};
}

(async()=>{try{await loadAdminData();renderDashboard()}catch(e){login()}})();

})();
