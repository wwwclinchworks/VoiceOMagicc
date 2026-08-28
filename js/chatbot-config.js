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

/* Keep the homepage featured video synchronized with the CMS without exposing secrets. */
(function(){
  const isHome=location.pathname==='/' || location.pathname.endsWith('/index.html');
  if(!isHome) return;

  async function loadFeaturedVideo(){
    try{
      const response=await fetch('/api/chat?mode=public-cms',{cache:'no-store'});
      if(!response.ok) return;
      const data=await response.json();
      const video=data?.cms?.featuredVideo;
      if(!video?.published || typeof video.url!=='string') return;
      window.__VOM_FEATURED_VIDEO={url:video.url,title:video.title||'Voice-O-Magic featured video'};

      const previous=window.playNativeVideo;
      window.playNativeVideo=()=>{
        const cover=document.getElementById('videoCover');
        const container=document.getElementById('videoContainer');
        if(cover) cover.classList.add('hidden');
        if(!container || container.firstChild) return;
        const iframe=document.createElement('iframe');
        iframe.className='w-full h-full';
        iframe.src=video.url+(video.url.includes('?')?'&':'?')+'autoplay=1';
        iframe.title=window.__VOM_FEATURED_VIDEO.title;
        iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.referrerPolicy='strict-origin-when-cross-origin';
        iframe.allowFullscreen=true;
        container.appendChild(iframe);
        if(typeof previous==='function') window.__VOM_DEFAULT_PLAY_NATIVE_VIDEO=previous;
      };
    }catch{}
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',loadFeaturedVideo,{once:true});
  else loadFeaturedVideo();
})();

/* Load Weekly Highlights on the canonical Resources page only. The module also removes legacy public intro/toolkit blocks. */
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

/* Home profile card: keep the portrait compact and mobile-friendly. */
(function(){
  const isHome=location.pathname==='/' || location.pathname.endsWith('/index.html');
  if(!isHome) return;
  const style=document.createElement('style');
  style.dataset.vomHomeUi='true';
  style.textContent=`
    @media (max-width: 600px) {
      .material-card:has(img[alt="Shalini Mukund"]) {
        max-width: 19rem !important;
      }
      div:has(> img[alt="Shalini Mukund"]) {
        aspect-ratio: 4 / 3 !important;
        max-height: 360px;
      }
      img[alt="Shalini Mukund"] {
        object-position: center top !important;
      }
    }
  `;
  document.head.appendChild(style);
})();
