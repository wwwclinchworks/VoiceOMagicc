(function(){
  'use strict';
  const SECTION_ID='vomWeeklyHighlightsAdmin';
  const clone=v=>JSON.parse(JSON.stringify(v));
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n};
  const api=async(mode,options={})=>{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);try{const r=await fetch('/api/chat?mode='+encodeURIComponent(mode),{cache:'no-store',signal:controller.signal,...options,headers:{...(options.headers||{})}});const body=await r.json().catch(()=>({}));if(!r.ok)throw new Error(body.error||'Request failed.');return body}finally{clearTimeout(timer)}};
  let state={items:[],saving:false};
  const driveId=v=>{try{const u=new URL(String(v||''));if(u.protocol!=='https:'||!['drive.google.com','docs.google.com'].includes(u.hostname.toLowerCase()))return null;let id=u.searchParams.get('id')||'';id=id||u.pathname.match(/\/file\/d\/([A-Za-z0-9_-]{10,200})/i)?.[1]||'';id=id||u.pathname.match(/\/d\/([A-Za-z0-9_-]{10,200})/i)?.[1]||'';return /^[A-Za-z0-9_-]{10,200}$/.test(id)?id:null}catch{return null}};
  const thumb=v=>{const id=driveId(v);return id?`https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1200`:''};
  const toast=(message,bad=false)=>{document.querySelector('[data-weekly-toast]')?.remove();const n=el('div','fixed right-5 bottom-5 z-[200] max-w-sm rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl',message);n.dataset.weeklyToast='1';n.style.background=bad?'#b42318':'#111827';document.body.append(n);setTimeout(()=>n.remove(),3000)};

  function inputField(label,value,onInput,placeholder=''){
    const wrap=el('label','block text-sm font-semibold text-sec');
    wrap.append(el('span','block mb-1.5',label));
    const input=document.createElement('input');
    input.className='md-input';input.type='url';input.value=value||'';input.placeholder=placeholder;
    input.addEventListener('input',()=>onInput(input.value));
    wrap.append(input);return wrap;
  }

  function render(){
    const root=document.querySelector('main');const anchor=document.getElementById('saveAll');if(!root||!anchor)return false;
    let section=document.getElementById(SECTION_ID);
    if(!section){
      section=el('section','material-card p-5');section.id=SECTION_ID;
      const header=el('div','flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4');
      const info=el('div','min-w-0');
      info.append(
        el('h2','text-xl md:text-2xl font-bold text-heading','📸 Weekly Highlights'),
        el('p','text-sm font-medium text-gold mt-1','Where this changes: weekly.html → Weekly Highlights'),
        el('p','text-xs text-muted mt-2','Manage any number of published highlight images. Paste a Google Drive/Docs share URL to replace an image, or use Add Highlight to create a new one.')
      );
      const save=el('button','btn-primary text-sm','Save Weekly Highlights');save.type='button';save.dataset.weeklySave='1';save.onclick=saveChanges;
      header.append(info,save);section.append(header);
      const add=el('button','btn-secondary text-sm mt-5','+ Add Highlight');add.type='button';add.dataset.weeklyAdd='1';add.onclick=()=>{
        state.items.push({id:globalThis.crypto?.randomUUID?crypto.randomUUID():`weekly-${Date.now()}`,driveUrl:'',imageUrl:'',title:'',description:'',order:state.items.length,published:true});
        render();
        const last=section.querySelector('[data-weekly-card]:last-child input'); if(last)last.focus();
      };section.append(add);
      const list=el('div','space-y-4 mt-5');list.dataset.weeklyList='1';section.append(list);root.append(section);
    }
    const list=section.querySelector('[data-weekly-list]');
    list.replaceChildren(...state.items.map((item,index)=>{
      const card=el('article','rounded-2xl border border-theme p-5');card.dataset.weeklyCard='1';
      const top=el('div','flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2');
      top.append(el('div','font-bold text-lg text-heading',`Highlight ${index+1}`));
      const replace=el('span','text-xs text-muted','Edit the URL below to change this image');top.append(replace);card.append(top);
      card.append(inputField('Google Drive / Docs image URL',item.driveUrl,v=>{item.driveUrl=v.trim();item.imageUrl=thumb(item.driveUrl);updatePreview(card,item,index)},'https://drive.google.com/file/d/.../view'));
      const preview=el('div','mt-4 rounded-xl overflow-hidden border border-theme bg-surface-warm aspect-video');preview.dataset.weeklyPreview='1';card.append(preview);updatePreview(card,item,index);
      const title=el('label','block text-sm font-semibold text-sec mt-4');title.append(el('span','block mb-1.5','Title (optional)'));const titleInput=document.createElement('input');titleInput.className='md-input';titleInput.type='text';titleInput.value=item.title||'';titleInput.placeholder='Weekly highlight title';titleInput.addEventListener('input',()=>item.title=titleInput.value);title.append(titleInput);card.append(title);
      const desc=el('label','block text-sm font-semibold text-sec mt-3');desc.append(el('span','block mb-1.5','Description (optional)'));const area=document.createElement('textarea');area.className='md-input';area.rows=3;area.value=item.description||'';area.placeholder='Short description';area.addEventListener('input',()=>item.description=area.value);desc.append(area);card.append(desc);
      const row=el('div','flex flex-wrap items-center justify-between gap-3 mt-4');
      const pub=el('label','inline-flex items-center gap-2 text-sm font-semibold text-sec');const cb=document.createElement('input');cb.type='checkbox';cb.checked=item.published===true;cb.onchange=()=>item.published=cb.checked;pub.append(cb,el('span','', 'Published'));
      const remove=el('button','btn-secondary text-sm','Remove Highlight');remove.type='button';remove.onclick=()=>{if(!confirm(`Remove Highlight ${index+1}?`))return;state.items.splice(index,1);state.items.forEach((x,i)=>x.order=i);render()};
      row.append(pub,remove);card.append(row);return card;
    }));
    const save=section.querySelector('[data-weekly-save]');if(save){save.disabled=state.saving;save.textContent=state.saving?'Saving…':'Save Weekly Highlights';}
    return true;
  }

  function updatePreview(card,item,index){
    const preview=card.querySelector('[data-weekly-preview]');if(!preview)return;
    preview.replaceChildren();
    if(!item.imageUrl){preview.append(el('div','w-full h-full flex items-center justify-center text-sm text-muted text-center px-4','Paste a Google Drive image link to preview it.'));return;}
    const img=document.createElement('img');img.src=item.imageUrl;img.alt=item.title||`Weekly Highlight ${index+1}`;img.loading='lazy';img.decoding='async';img.className='w-full h-full object-cover';
    img.onerror=()=>preview.replaceChildren(el('div','w-full h-full flex items-center justify-center text-sm text-red text-center px-4','Image could not be loaded. Check that the Google Drive file is shared for viewing.'));
    preview.append(img);
  }

  async function load(){
    try{
      const data=await api('admin-data');
      const items=Array.isArray(data.cms?.weeklyHighlights?.items)?data.cms.weeklyHighlights.items:[data.cms?.weeklyHighlights?.highlight1,data.cms?.weeklyHighlights?.highlight2].filter(Boolean);
      state.items=items.map((x,i)=>({...x,order:Number.isInteger(x.order)?x.order:i,imageUrl:thumb(x.driveUrl)||x.imageUrl||''}));
      render();
    }catch(e){toast(e.name==='AbortError'?'Weekly Highlights request timed out.':(e.message||'Weekly Highlights could not be loaded.'),true)}
  }

  async function saveChanges(){
    if(state.saving)return;
    state.saving=true;render();
    try{
      const latest=await api('admin-data');
      const cms=clone(latest.cms||{});
      state.items.forEach((x,i)=>{
        x.order=i;x.driveUrl=String(x.driveUrl||'').trim();x.imageUrl=thumb(x.driveUrl)||'';
        if(x.published&&!x.imageUrl)throw new Error(`Highlight ${i+1} needs a valid Google Drive image link.`);
      });
      cms.weeklyHighlights={items:clone(state.items)};
      await api('admin-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cms})});
      toast('Weekly Highlights saved successfully.');
    }catch(e){toast(e.name==='AbortError'?'Request timed out.':(e.message||'Unable to save Weekly Highlights.'),true)}
    finally{state.saving=false;render()}
  }

  window.VOMWeeklyAdmin={load,render};
})();
