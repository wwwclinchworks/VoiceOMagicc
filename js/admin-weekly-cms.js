(function(){
  'use strict';
  const SECTION_ID='vomWeeklyHighlightsAdmin';
  const API='/api/chat?mode=';
  let current={items:[]};
  let saving=false;
  const clone=v=>JSON.parse(JSON.stringify(v));
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n};
  const toast=(msg,bad=false)=>{document.querySelector('[data-weekly-fix-toast]')?.remove();const n=el('div','fixed right-5 bottom-5 z-[200] max-w-sm rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl',msg);n.dataset.weeklyFixToast='1';n.style.background=bad?'#b42318':'#111827';document.body.append(n);setTimeout(()=>n.remove(),3000)};
  const driveId=v=>{try{const u=new URL(v);if(u.protocol!=='https:'||!['drive.google.com','docs.google.com','drive.usercontent.google.com'].includes(u.hostname.toLowerCase()))return null;let id=u.searchParams.get('id')||'';id=id||u.pathname.match(/\/file\/d\/([A-Za-z0-9_-]{10,200})/i)?.[1]||'';id=id||u.pathname.match(/\/d\/([A-Za-z0-9_-]{10,200})/i)?.[1]||'';return /^[A-Za-z0-9_-]{10,200}$/.test(id)?id:null}catch{return null}};
  const thumb=v=>{const id=driveId(v);return id?`https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1200`:''};
  async function api(mode,options={}){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);try{const r=await fetch(API+mode,{cache:'no-store',signal:controller.signal,...options,headers:{...(options.headers||{})}});const b=await r.json().catch(()=>({}));if(!r.ok)throw new Error(b.error||'Request failed.');return b}finally{clearTimeout(timer)}}
  function render(){
    const root=document.querySelector('main'); const anchor=root?.querySelector('#saveAll'); if(!root||!anchor)return false;
    let section=document.getElementById(SECTION_ID);
    if(!section){
      section=el('section','material-card p-5');section.id=SECTION_ID;
      const header=el('div','flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4');
      const info=el('div');info.append(el('h2','text-xl md:text-2xl font-bold text-heading','📸 Weekly Highlights'),el('p','text-sm font-medium text-gold mt-1','Manage images shown on resources.html'),el('p','text-xs text-muted mt-2','Use HTTPS Google Drive/Docs share links. Published images appear immediately on the public page through the live CMS API.'));
      const saveBtn=el('button','btn-primary text-sm',saving?'Saving…':'Save Weekly Highlights');saveBtn.type='button';saveBtn.dataset.weeklySave='1';saveBtn.onclick=save;
      header.append(info,saveBtn);section.append(header);
      const add=el('button','btn-secondary text-sm mt-5','+ Add Image');add.type='button';add.onclick=()=>{current.items.push({id:globalThis.crypto?.randomUUID?crypto.randomUUID():`weekly-${Date.now()}`,driveUrl:'',imageUrl:'',title:'',description:'',order:current.items.length,published:true});render()};section.append(add);
      const list=el('div','grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5');list.dataset.weeklyList='1';section.append(list);
      const first=[...root.children].find(x=>x.querySelector?.('h2')?.textContent?.includes('Featured Video'))||root.children[1]; if(first)root.insertBefore(section,first);else root.append(section);
    }
    const list=section.querySelector('[data-weekly-list]'); if(!list)return false;
    list.replaceChildren(...current.items.map((item,index)=>{
      const card=el('article','rounded-2xl border border-theme p-5');
      card.append(el('h3','font-bold text-lg text-heading',`Highlight ${index+1}`));
      const input=document.createElement('input');input.className='md-input mt-3';input.type='url';input.placeholder='https://drive.google.com/file/d/.../view';input.value=item.driveUrl||'';input.oninput=()=>{item.driveUrl=input.value.trim();item.imageUrl=thumb(item.driveUrl)};card.append(el('label','block text-sm font-semibold text-sec mt-3','Google Drive image link'),input);
      const preview=el('div','mt-4 rounded-xl overflow-hidden border border-theme bg-surface-warm aspect-video');
      if(item.driveUrl&&item.imageUrl){const img=document.createElement('img');img.src=item.imageUrl;img.alt=item.title||`Highlight ${index+1}`;img.className='w-full h-full object-cover';img.loading='lazy';img.decoding='async';preview.append(img)}else preview.append(el('div','w-full h-full flex items-center justify-center text-sm text-muted','Add a valid Drive image link'));card.append(preview);
      const title=document.createElement('input');title.className='md-input mt-4';title.placeholder='Title (optional)';title.value=item.title||'';title.oninput=()=>item.title=title.value;card.append(title);
      const desc=document.createElement('textarea');desc.className='md-input mt-3';desc.rows=3;desc.placeholder='Description (optional)';desc.value=item.description||'';desc.oninput=()=>item.description=desc.value;card.append(desc);
      const row=el('div','flex items-center justify-between mt-4');const pub=el('label','inline-flex items-center gap-2 text-sm font-semibold text-sec');const cb=document.createElement('input');cb.type='checkbox';cb.checked=item.published===true;cb.onchange=()=>item.published=cb.checked;pub.append(cb,el('span','','Published'));const remove=el('button','btn-secondary text-sm','Remove');remove.type='button';remove.onclick=()=>{current.items.splice(index,1);current.items.forEach((x,i)=>x.order=i);render()};row.append(pub,remove);card.append(row);return card;
    }));
    const saveButton=section.querySelector('[data-weekly-save]'); if(saveButton){saveButton.disabled=saving;saveButton.textContent=saving?'Saving…':'Save Weekly Highlights';}
    return true;
  }
  async function load(){try{const data=await api('admin-data');const items=Array.isArray(data.cms?.weeklyHighlights?.items)?data.cms.weeklyHighlights.items:[data.cms?.weeklyHighlights?.highlight1,data.cms?.weeklyHighlights?.highlight2].filter(Boolean);current={items:items.map((x,i)=>({...x,order:Number.isInteger(x.order)?x.order:i,imageUrl:thumb(x.driveUrl)||x.imageUrl||''}))};}catch(e){toast(e.name==='AbortError'?'Weekly Highlights request timed out.':(e.message||'Weekly Highlights could not be loaded.'),true)}render()}
  async function save(){if(saving)return;saving=true;render();try{const latest=await api('admin-data');const cms=clone(latest.cms||{});current.items.forEach((x,i)=>{x.order=i;x.driveUrl=String(x.driveUrl||'').trim();x.imageUrl=thumb(x.driveUrl)||'';if(x.published&&!x.imageUrl)throw new Error(`Highlight ${i+1} needs a valid Google Drive image link.`)});cms.weeklyHighlights=clone(current);await api('admin-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cms})});toast('Weekly Highlights saved successfully.');}catch(e){toast(e.message||'Unable to save Weekly Highlights.',true)}finally{saving=false;render()}}
  function boot(){if(document.body.dataset.weeklyFixBooted)return;document.body.dataset.weeklyFixBooted='1';load();let attempts=0;const timer=setInterval(()=>{if(render()||++attempts>=60)clearInterval(timer)},100)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
