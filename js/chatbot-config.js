/* Voice-O-Magic AI + lightweight ReIcon UI helpers. */
window.VOM_AI_CONFIG={MODEL:"openrouter/free",SITE_URL:window.location.origin,SITE_NAME:"Voice-O-Magic"};

(function(){
  'use strict';
  const REICON={
    instagram:'https://cdn.reicon.dev/logos/instagram/original.svg',
    facebook:'https://cdn.reicon.dev/logos/facebook/original.svg',
    linkedin:'https://cdn.reicon.dev/logos/linkedin/original.svg',
    whatsapp:'https://cdn.reicon.dev/logos/whatsapp/original.svg',
    gmail:'https://cdn.reicon.dev/logos/gmail/original.svg',
    drive:'https://cdn.reicon.dev/logos/google-drive-2026/original.svg',
    lightbulb:'https://cdn.reicon.dev/lightbulb.svg',
    dock:'https://cdn.reicon.dev/dock.svg',
    cookbook:'https://cdn.reicon.dev/cookbook.svg',
    toolbox:'https://cdn.reicon.dev/toolbox.svg',
    response:'https://cdn.reicon.dev/response.svg',
    teacher:'https://cdn.reicon.dev/teacher.svg',
    send:'https://cdn.reicon.dev/send.svg'
  };
  const page=()=>location.pathname.toLowerCase();
  const is=(name)=>page().endsWith('/'+name)||page().endsWith(name);
  const img=(src,alt,size=24)=>{const n=document.createElement('img');n.src=src;n.alt=alt;n.width=size;n.height=size;n.loading='lazy';n.decoding='async';n.className='inline-block shrink-0 object-contain';return n;};
  function theme(){
    const dark=document.documentElement.classList.contains('dark');
    document.querySelectorAll('#themeToggleBtn,#themeToggleBtnMobile').forEach(btn=>{
      if(!btn.querySelector('[data-vom-theme-logo]')){
        btn.querySelectorAll('.fa-moon,.fa-sun').forEach(x=>x.remove());
        const icon=img(REICON.lightbulb,'Theme',24);icon.dataset.vomThemeLogo='1';icon.className='w-6 h-6 object-contain';btn.replaceChildren(icon);
      }
      const icon=btn.querySelector('[data-vom-theme-logo]'); if(icon) icon.alt=dark?'Switch to light mode':'Switch to dark mode';
      btn.title=dark?'Switch to light mode':'Switch to dark mode';btn.setAttribute('aria-label',btn.title);
    });
  }
  window.toggleTheme=()=>{const dark=!document.documentElement.classList.contains('dark');document.documentElement.classList.toggle('dark',dark);try{localStorage.setItem('vom-theme',dark?'dark':'light')}catch{}theme();};
  function nav(){
    const mobile=document.getElementById('mobileMenu');const menuBtn=document.getElementById('mobileMenuBtn');
    if(mobile&&menuBtn){menuBtn.setAttribute('aria-controls',mobile.id||'mobileMenu');menuBtn.setAttribute('aria-expanded',String(!mobile.classList.contains('hidden')));}
    const desk=document.querySelector('nav[aria-label="Main Navigation"]');
    if(desk&&!desk.querySelector('a[href="weekly.html"]')){const r=desk.querySelector('a[href="resources.html"]');const a=document.createElement('a');a.href='weekly.html';a.className='nav-btn px-4 py-2 rounded-full text-sm font-medium transition';a.textContent='Weekly';r?r.insertAdjacentElement('afterend',a):desk.append(a);}
    if(mobile&&!mobile.querySelector('a[href="weekly.html"]')){const r=mobile.querySelector('a[href="resources.html"]');const a=document.createElement('a');a.href='weekly.html';a.className='block w-full text-left px-4 py-3 rounded-lg text-sec hover:bg-surface-warm font-medium transition';a.textContent='Weekly';r?r.insertAdjacentElement('afterend',a):mobile.append(a);}
  }
  function social(){
    [['instagram','instagram'],['facebook','facebook'],['linkedin','linkedin']].forEach(([kind,domain])=>document.querySelectorAll(`a[href*="${domain}.com/"]`).forEach(a=>{if(a.querySelector(`[data-vom-social="${kind}"]`))return;a.querySelectorAll(`.fa-${kind}`).forEach(x=>x.remove());const i=img(REICON[kind],kind,24);i.dataset.vomSocial=kind;a.insertBefore(i,a.firstChild);}));
  }
  function contact(){
    if(!is('contact.html'))return;
    document.querySelectorAll('a[href*="wa.me/"]').forEach(a=>{if(a.querySelector('[data-vom-contact="whatsapp"]'))return;a.querySelectorAll('.fa-whatsapp').forEach(x=>x.remove());const i=img(REICON.whatsapp,'WhatsApp',24);i.dataset.vomContact='whatsapp';a.insertBefore(i,a.firstChild);});
    const email=[...document.querySelectorAll('main *')].find(n=>n.childElementCount===0&&n.textContent?.trim()==='shalini@voiceomagic.com');
    if(email&&email.parentElement&&!email.parentElement.querySelector('[data-vom-contact="gmail"]')){const i=img(REICON.gmail,'Gmail',24);i.dataset.vomContact='gmail';email.parentElement.prepend(i);email.parentElement.style.cssText='display:flex;align-items:center;gap:.5rem';}
  }
  function art(){
    if(is('books.html')) document.querySelectorAll('main .material-card').forEach(c=>{if(c.querySelector('[data-vom-page-art]'))return;const t=c.textContent||'';if(!/Inspiration|Back to School|Published/i.test(t))return;const b=c.firstElementChild;if(!b)return;const i=img(REICON.cookbook,'Cookbook',96);i.dataset.vomPageArt='1';i.className='w-20 h-24 object-contain';b.replaceChildren(i);});
    if(is('corporate.html')) [...document.querySelectorAll('main .material-card')].filter(c=>/Corporate Workshops|Executive Coaching/i.test(c.textContent||'')).slice(0,2).forEach(c=>{if(c.querySelector('[data-vom-page-art]'))return;const b=c.firstElementChild;if(!b)return;const i=img(REICON.toolbox,'Toolbox',64);i.dataset.vomPageArt='1';i.className='w-16 h-16 object-contain';b.replaceChildren(i);});
    if(is('testimonials.html')) document.querySelectorAll('main article.material-card').forEach(c=>{const b=c.firstElementChild;if(!b||c.querySelector('[data-vom-page-art]'))return;const t=c.textContent||'';const src=/Community Feedback/i.test(t)?REICON.response:/Learner Wins/i.test(t)?REICON.teacher:null;if(!src)return;const i=img(src,'Illustration',64);i.dataset.vomPageArt='1';i.className='w-16 h-16 object-contain rounded-xl';b.replaceChildren(i);});
  }
  function footer(){
    const f=document.querySelector('footer');if(!f||f.dataset.vomFooter==='1')return;
    f.dataset.vomFooter='1';
    f.querySelectorAll('a[href*="instagram.com/"]').forEach(a=>{if(!a.querySelector('[data-vom-social="instagram"]')){a.querySelectorAll('.fa-instagram').forEach(x=>x.remove());const i=img(REICON.instagram,'Instagram',24);i.dataset.vomSocial='instagram';a.prepend(i);}});
    f.querySelectorAll('a[href*="facebook.com/"]').forEach(a=>{if(!a.querySelector('[data-vom-social="facebook"]')){a.querySelectorAll('.fa-facebook').forEach(x=>x.remove());const i=img(REICON.facebook,'Facebook',24);i.dataset.vomSocial='facebook';a.prepend(i);}});
    f.querySelectorAll('a[href*="linkedin.com/"]').forEach(a=>{if(!a.querySelector('[data-vom-social="linkedin"]')){a.querySelectorAll('.fa-linkedin').forEach(x=>x.remove());const i=img(REICON.linkedin,'LinkedIn',24);i.dataset.vomSocial='linkedin';a.prepend(i);}});
  }
  function run(){
    theme();nav();social();contact();art();footer();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{run();setTimeout(run,1200);},{once:true});
  else {run();setTimeout(run,1200);}
})();
