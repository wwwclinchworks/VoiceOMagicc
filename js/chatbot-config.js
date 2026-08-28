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

/* Normalize only the Books extensionless aliases on the client. Resources has a server-side 301 redirect. */
(function(){
  const aliases={
    '/books':'/books.html',
    '/books/':'/books.html'
  };
  const target=aliases[window.location.pathname];
  if(target && window.history && window.history.replaceState){
    window.history.replaceState(window.history.state,'',target+window.location.search+window.location.hash);
  }
})();

/* Load Weekly Highlights on the canonical Resources page only. */
(function(){
  if(location.pathname !== '/resources.html') return;
  const loadWeeklyHighlights=()=>{
    if(document.querySelector('script[data-vom-weekly-highlights]')) return;
    const script=document.createElement('script');
    script.src='/js/weekly-highlights.js';
    script.dataset.vomWeeklyHighlights='true';
    script.onerror=()=>{};
    document.head.appendChild(script);
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',loadWeeklyHighlights,{once:true});
  else loadWeeklyHighlights();
})();
