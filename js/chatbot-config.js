/*
 * Voice-O-Magic AI configuration
 *
 * The OpenRouter secret is NOT stored in this browser file.
 * Put OPENROUTER_API_KEY in Vercel Project Settings -> Environment Variables.
 * The browser calls /api/chat, which securely reads the server-side variable.
 */
window.VOM_AI_CONFIG={MODEL:"openrouter/free",SITE_URL:window.location.origin,SITE_NAME:"Voice-O-Magic"};

/* Keep the AI assistant synchronized with the shared light/dark theme. */
(function(){
  const root=document.documentElement;
  const emit=()=>document.dispatchEvent(new CustomEvent('vom-theme-changed',{detail:{dark:root.classList.contains('dark')}}));
  new MutationObserver(emit).observe(root,{attributes:true,attributeFilter:['class']});
})();

/* Add the dedicated Weekly Highlights page to the shared navigation. */
(function(){
  function addWeeklyLink(){
    const desktopNav=document.querySelector('nav[aria-label="Main Navigation"]');
    if(desktopNav && !desktopNav.querySelector('a[href="weekly.html"]')){
      const link=document.createElement('a');
      link.href='weekly.html';
      link.className='nav-btn px-4 py-2 rounded-full text-sm font-medium transition';
      link.textContent='Weekly';
      const testimonials=desktopNav.querySelector('a[href="testimonials.html"]');
      const resources=desktopNav.querySelector('a[href="resources.html"]');
      if(testimonials) testimonials.insertAdjacentElement('beforebegin',link);
      else if(resources) resources.insertAdjacentElement('afterend',link);
      else desktopNav.appendChild(link);
    }

    const mobileMenu=document.getElementById('mobileMenu');
    if(mobileMenu && !mobileMenu.querySelector('a[href="weekly.html"]')){
      const link=document.createElement('a');
      link.href='weekly.html';
      link.className='block w-full text-left px-4 py-3 rounded-lg text-sec hover:bg-gold-light hover:text-gold-hover font-medium transition';
      link.textContent='Weekly';
      const testimonials=mobileMenu.querySelector('a[href="testimonials.html"]');
      const resources=mobileMenu.querySelector('a[href="resources.html"]');
      if(testimonials) testimonials.insertAdjacentElement('beforebegin',link);
      else if(resources) resources.insertAdjacentElement('afterend',link);
      else mobileMenu.appendChild(link);
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',addWeeklyLink);
  else addWeeklyLink();
})();

/* Load the Weekly Highlights illustration helper only on the dedicated page. */
(function(){
  function loadWeeklyIllustrations(){
    if(!/\/weekly\.html(?:$|[?#])/i.test(window.location.pathname)) return;
    if(document.querySelector('script[data-vom-weekly-illustrations]')) return;
    const script=document.createElement('script');
    script.src='js/reicon-image-loading.js?v=20260828';
    script.async=true;
    script.dataset.vomWeeklyIllustrations='true';
    document.head.appendChild(script);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',loadWeeklyIllustrations,{once:true});
  else loadWeeklyIllustrations();
})();
