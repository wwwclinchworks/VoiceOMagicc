/*
 * Voice-O-Magic AI configuration
 *
 * The OpenRouter secret is NOT stored in this browser file.
 * Put OPENROUTER_API_KEY in Cloudflare Worker Runtime Secrets.
 * The browser calls /api/chat, which securely reads the server-side variable.
 */
window.VOM_AI_CONFIG={MODEL:"openrouter/free",SITE_URL:window.location.origin,SITE_NAME:"Voice-O-Magic"};

/* Keep the AI assistant synchronized with the shared light/dark theme. */
(function(){
  const root=document.documentElement;
  const emit=()=>document.dispatchEvent(new CustomEvent('vom-theme-changed',{detail:{dark:root.classList.contains('dark')}}));
  new MutationObserver(emit).observe(root,{attributes:true,attributeFilter:['class']});
})();

/* Read live CMS content through the Cloudflare Worker so Admin changes do not require a redeploy. */
(function(){
  const LIVE_CMS_ENDPOINT='/api/chat?mode=public-cms';
  const originalFetch=window.fetch.bind(window);
  window.fetch=function(input,init){
    const url=typeof input==='string'?input:input?.url||'';
    if(url.startsWith('/data/knowledge.json?')){
      return originalFetch(LIVE_CMS_ENDPOINT,{...(init||{}),cache:'no-store'});
    }
    return originalFetch(input,init);
  };
})();

/* Weekly Highlights is loaded after the live Resources renderer has replaced the static fallback. */
(function(){
  if(!location.pathname.endsWith('/resources.html'))return;

  const loadWeeklyHighlights=()=>{
    if(document.querySelector('script[data-vom-weekly-highlights]'))return;
    const script=document.createElement('script');
    script.src='/js/weekly-highlights.js';
    script.dataset.vomWeeklyHighlights='true';
    script.onload=()=>window.dispatchEvent(new Event('vom-weekly-highlights-ready'));
    script.onerror=()=>{};
    document.head.appendChild(script);
  };

  const isLiveCmsRender=()=>{
    const main=document.querySelector('main');
    const first=main?.firstElementChild;
    // resources.html starts with a static <div>; renderResources() replaces it with a <section>.
    return Boolean(main && first && first.tagName === 'SECTION');
  };

  const start=()=>{
    if(isLiveCmsRender()){
      loadWeeklyHighlights();
      return true;
    }
    return false;
  };

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',start,{once:true});
  }else if(!start()){
    const main=document.querySelector('main');
    if(main){
      const observer=new MutationObserver(()=>{
        if(start())observer.disconnect();
      });
      observer.observe(main,{childList:true,subtree:false});
      window.setTimeout(()=>observer.disconnect(),15000);
    }
  }
})();
