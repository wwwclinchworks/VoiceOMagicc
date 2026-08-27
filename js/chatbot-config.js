/*
 * Voice-O-Magic AI configuration
 *
 * The OpenRouter secret is NOT stored in this browser file.
 * Put OPENROUTER_API_KEY in Cloudflare Worker Runtime Secrets.
 * The browser calls /api/chat, which securely reads the server-side variable.
 */
window.VOM_AI_CONFIG={MODEL:"openrouter/free",SITE_URL:window.location.origin,SITE_NAME:"Voice-O-Magic"};

/* Normalize extensionless public routes before main.js checks location.pathname. */
(function(){
  const aliases={
    '/resources':'/resources.html',
    '/resources/':'/resources.html',
    '/books':'/books.html',
    '/books/':'/books.html'
  };
  const target=aliases[window.location.pathname];
  if(target && window.history && window.history.replaceState){
    window.history.replaceState(window.history.state,'',target+window.location.search+window.location.hash);
  }
})();

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

/* Weekly Highlights is independent of main-content replacement and inserts before the footer. */
(function(){
  const shouldLoad=()=>location.pathname.endsWith('/resources.html');
  const loadWeeklyHighlights=()=>{
    if(!shouldLoad() || document.querySelector('script[data-vom-weekly-highlights]')) return;
    const script=document.createElement('script');
    script.src='/js/weekly-highlights.js';
    script.dataset.vomWeeklyHighlights='true';
    script.onerror=()=>{};
    document.head.appendChild(script);
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',loadWeeklyHighlights,{once:true});
  else loadWeeklyHighlights();
})();
