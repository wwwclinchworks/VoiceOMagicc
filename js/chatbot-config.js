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

/* Public CMS content is read through the Cloudflare Worker so Admin changes are live without a redeploy. */
(function(){
  const script=document.createElement('script');
  script.src='js/cms-live-bridge.js';
  script.defer=false;
  document.head.appendChild(script);
})();

/* Weekly Highlights is loaded only on the Resources page. */
(function(){
  if(!location.pathname.endsWith('/resources.html'))return;
  const script=document.createElement('script');
  script.src='js/weekly-highlights.js';
  script.defer=true;
  document.head.appendChild(script);
})();
