/*
 * Voice-O-Magic AI configuration
 *
 * The OpenRouter secret is NOT stored in this browser file.
 * Put OPENROUTER_API_KEY in Vercel Project Settings -> Environment Variables.
 * The browser calls /api/chat, which securely reads the server-side variable.
 */
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

  const path=()=>window.location.pathname.toLowerCase();
  const isPage=(name)=>path().endsWith('/'+name) || path().endsWith(name);

  function makeLogo(src,alt,size=24){
    const img=document.createElement('img');
    img.src=src;
    img.alt=alt;
    img.width=size;
    img.height=size;
    img.loading='lazy';
    img.decoding='async';
    img.className='inline-block shrink-0 object-contain';
    return img;
  }

  function setTheme(dark){
    document.documentElement.classList.toggle('dark',dark);
    try{localStorage.setItem('vom-theme',dark?'dark':'light');}catch{}
    document.querySelectorAll('#themeToggleBtn,#themeToggleBtnMobile').forEach((btn)=>{
      const icon=document.createElement('i');
      icon.className=dark?'fa-solid fa-sun':'fa-solid fa-moon';
      btn.replaceChildren(icon);
      btn.title=dark?'Switch to light mode':'Switch to dark mode';
      btn.setAttribute('aria-label',btn.title);
    });
    document.dispatchEvent(new CustomEvent('vom-theme-changed',{detail:{dark}}));
  }

  window.toggleTheme=()=>setTheme(!document.documentElement.classList.contains('dark'));

  window.toggleMobileMenu=()=>{
    const menu=document.getElementById('mobileMenu');
    const button=document.getElementById('mobileMenuBtn');
    if(!menu)return;
    const willOpen=menu.classList.contains('hidden');
    menu.classList.toggle('hidden',!willOpen);
    if(button)button.setAttribute('aria-expanded',String(willOpen));
  };

  function setupNavigationAccessibility(){
    const menu=document.getElementById('mobileMenu');
    const button=document.getElementById('mobileMenuBtn');
    if(!menu||!button)return;
    button.setAttribute('aria-controls',menu.id||'mobileMenu');
    button.setAttribute('aria-expanded',String(!menu.classList.contains('hidden')));
  }

  function addWeeklyLink(){
    const desktopNav=document.querySelector('nav[aria-label="Main Navigation"]');
    if(desktopNav&&!desktopNav.querySelector('a[href="weekly.html"]')){
      const link=document.createElement('a');
      link.href='weekly.html';
      link.className='nav-btn px-4 py-2 rounded-full text-sm font-medium transition';
      link.textContent='Weekly';
      const testimonials=desktopNav.querySelector('a[href="testimonials.html"]');
      const resources=desktopNav.querySelector('a[href="resources.html"]');
      if(testimonials)testimonials.insertAdjacentElement('beforebegin',link);
      else if(resources)resources.insertAdjacentElement('afterend',link);
      else desktopNav.appendChild(link);
    }

    const mobileMenu=document.getElementById('mobileMenu');
    if(mobileMenu&&!mobileMenu.querySelector('a[href="weekly.html"]')){
      const link=document.createElement('a');
      link.href='weekly.html';
      link.className='block w-full text-left px-4 py-3 rounded-lg text-sec hover:bg-gold-light hover:text-gold-hover font-medium transition';
      link.textContent='Weekly';
      const testimonials=mobileMenu.querySelector('a[href="testimonials.html"]');
      const resources=mobileMenu.querySelector('a[href="resources.html"]');
      if(testimonials)testimonials.insertAdjacentElement('beforebegin',link);
      else if(resources)resources.insertAdjacentElement('afterend',link);
      else mobileMenu.appendChild(link);
    }
  }

  function replaceHeaderBrand(){
    const headerLogo=document.querySelector('header a[href="index.html"] img');
    if(headerLogo&&!headerLogo.dataset.vomBrandLogo){
      const replacement=makeLogo(REICON.lightbulb,'A lightbulb',180);
      replacement.dataset.vomBrandLogo='true';
      replacement.className='w-full h-full object-contain';
      headerLogo.replaceWith(replacement);
    }

    const menuButton=document.getElementById('mobileMenuBtn');
    if(menuButton&&!menuButton.querySelector('[data-vom-menu-logo]')){
      menuButton.querySelectorAll('i.fa-bars,.fa-bars').forEach((i)=>i.remove());
      const logo=makeLogo(REICON.dock,'Dock',180);
      logo.dataset.vomMenuLogo='true';
      logo.className='w-6 h-6 object-contain';
      menuButton.appendChild(logo);
    }
  }

  function replaceSocialIcons(){
    const mappings=[
      ['instagram','i.fa-instagram,.fa-instagram',REICON.instagram,'Instagram'],
      ['facebook','i.fa-facebook,.fa-facebook',REICON.facebook,'Facebook'],
      ['linkedin','i.fa-linkedin,.fa-linkedin',REICON.linkedin,'LinkedIn']
    ];

    mappings.forEach(([kind,selector,src,alt])=>{
      const domain=kind==='linkedin'?'linkedin':kind;
      document.querySelectorAll(`a[href*="${domain}.com/"]`).forEach((a)=>{
        if(a.querySelector(`img[data-vom-social="${kind}"]`))return;
        a.querySelectorAll(selector).forEach((i)=>i.remove());
        const logo=makeLogo(src,alt,24);
        logo.dataset.vomSocial=kind;
        a.insertBefore(logo,a.firstChild);
      });
    });
  }

  function replaceContactIcons(){
    if(!isPage('contact.html'))return;

    document.querySelectorAll('a[href*="wa.me/"]').forEach((a)=>{
      if(a.querySelector('[data-vom-contact="whatsapp"]'))return;
      a.querySelectorAll('.fa-whatsapp,.fa-brands.fa-whatsapp').forEach((i)=>i.remove());
      const icon=makeLogo(REICON.whatsapp,'Whatsapp',24);
      icon.dataset.vomContact='whatsapp';
      a.insertBefore(icon,a.firstChild);
    });

    const emailTexts=[...document.querySelectorAll('main *')].filter((node)=>node.childElementCount===0&&node.textContent?.trim()==='shalini@voiceomagic.com');
    emailTexts.forEach((node)=>{
      const parent=node.parentElement;
      if(!parent||parent.querySelector('[data-vom-contact="gmail"]'))return;
      const icon=makeLogo(REICON.gmail,'Gmail',24);
      icon.dataset.vomContact='gmail';
      parent.insertBefore(icon,node);
      parent.style.display='flex';
      parent.style.alignItems='center';
      parent.style.gap='.5rem';
    });

    const submit=document.querySelector('#inquiryForm button[type="submit"]');
    if(submit&&!submit.querySelector('[data-vom-submit-logo]')){
      submit.querySelectorAll('.fa-whatsapp,.fa-solid,.fa-brands').forEach((i)=>i.remove());
      const icon=makeLogo(REICON.send,'Send',180);
      icon.dataset.vomSubmitLogo='true';
      icon.className='w-6 h-6 object-contain';
      submit.insertBefore(icon,submit.firstChild);
    }
  }

  function replacePageIllustrations(){
    if(isPage('books.html')){
      document.querySelectorAll('main .material-card').forEach((card)=>{
        if(card.querySelector('[data-vom-page-art]'))return;
        const title=(card.querySelector('h3,h4')?.textContent||'').toLowerCase();
        if(!/(inspiration|school|published)/.test(title))return;
        const first=card.firstElementChild;
        if(!first)return;
        const img=makeLogo(REICON.cookbook,'Cookbook',180);
        img.dataset.vomPageArt='true';
        img.className='w-20 h-24 object-contain';
        first.replaceChildren(img);
      });
    }

    if(isPage('corporate.html')){
      [...document.querySelectorAll('main .material-card')]
        .filter((card)=>/Corporate Workshops|Executive Coaching/i.test(card.textContent||''))
        .slice(0,2)
        .forEach((card)=>{
          if(card.querySelector('[data-vom-page-art]'))return;
          const box=card.firstElementChild;
          if(!box)return;
          const img=makeLogo(REICON.toolbox,'A toolbox',180);
          img.dataset.vomPageArt='true';
          img.className='w-16 h-16 object-contain';
          box.replaceChildren(img);
        });
    }

    if(isPage('testimonials.html')){
      const cards=[...document.querySelectorAll('main article.material-card')];
      const feedback=cards.find((card)=>/Community Feedback/i.test(card.textContent||''));
      const learner=cards.find((card)=>/Learner Wins/i.test(card.textContent||''));
      [
        [feedback,REICON.response,'A response'],
        [learner,REICON.teacher,'Teacher']
      ].forEach(([card,src,alt])=>{
        if(!card||card.querySelector('[data-vom-page-art]'))return;
        const box=card.firstElementChild;
        if(!box)return;
        const img=makeLogo(src,alt,180);
        img.dataset.vomPageArt='true';
        img.className='w-16 h-16 object-contain rounded-xl';
        box.replaceChildren(img);
      });
    }
  }

  function addLinkedInProfile(){
    if(!isPage('testimonials.html')||document.querySelector('[data-vom-linkedin-profile]'))return;
    const main=document.querySelector('main');
    if(!main)return;
    const section=document.createElement('section');
    section.className='material-card p-5 sm:p-8 mt-10';
    section.dataset.vomLinkedinProfile='true';

    const row=document.createElement('div');
    row.className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4';

    const copy=document.createElement('div');
    copy.innerHTML='<span class="text-xs font-bold text-gold uppercase tracking-widest">Professional profile</span><h2 class="font-display text-2xl sm:text-3xl font-bold text-heading mt-1">Shalini Mukund on LinkedIn</h2><p class="text-sec text-sm mt-2">Connect with Shalini for professional updates, leadership insights, and communication work.</p>';

    const link=document.createElement('a');
    link.href='https://www.linkedin.com/in/shalini-mukund-3799661b9/';
    link.target='_blank';
    link.rel='noopener noreferrer';
    link.className='btn-secondary text-sm inline-flex items-center gap-2';
    link.append(makeLogo(REICON.linkedin,'LinkedIn',24),document.createTextNode('Open LinkedIn'));

    row.append(copy,link);
    section.append(row);
    main.append(section);
  }

  function decoratePdfDownloads(){
    if(!isPage('resources.html'))return;
    document.querySelectorAll('main a,main button').forEach((el)=>{
      const label=(el.textContent||'').toLowerCase();
      if(!/download|pdf/.test(label))return;
      if(el.querySelector('[data-vom-drive-logo]'))return;
      const logo=makeLogo(REICON.drive,'Google Drive 2026',24);
      logo.dataset.vomDriveLogo='true';
      logo.className='w-6 h-6 object-contain';
      el.insertBefore(logo,el.firstChild);
    });
  }

  function removeVerifiedBadge(){
    if(!isPage('index.html')&&window.location.pathname!=='/')return;
    document.querySelectorAll('.bg-green-light').forEach((el)=>{
      if(/verified/i.test(el.textContent||''))el.remove();
    });
    document.querySelectorAll('span,div').forEach((el)=>{
      if(el.children.length===0&&/^verified$/i.test((el.textContent||'').trim()))el.remove();
    });
  }

  function improveHomeImage(){
    if(!isPage('index.html')&&window.location.pathname!=='/')return;
    const image=document.querySelector('img[src="shalini-mukund.jpg"]');
    if(!image)return;
    image.style.width='100%';
    image.style.height='100%';
    image.style.maxWidth='100%';
    image.style.objectFit='cover';
    image.style.objectPosition='center center';
    image.style.display='block';
  }

  function standardFooter(){
    const footer=document.querySelector('footer');
    if(!footer||footer.dataset.vomStandardFooter==='true')return;
    footer.dataset.vomStandardFooter='true';
    footer.className='pt-14 pb-10 text-sm';
    footer.innerHTML=`
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div class="space-y-4 md:col-span-2 lg:col-span-1">
            <div class="flex items-center space-x-2.5">
              <div class="w-10 h-10 rounded-full border border-theme bg-theme flex items-center justify-center p-1 shadow-card">
                <img src="${REICON.lightbulb}" alt="A lightbulb" width="180" height="180" class="w-full h-full object-contain">
              </div>
              <span class="font-display font-bold text-heading text-lg">Voice-O-Magic</span>
            </div>
            <p class="leading-relaxed text-sec">Founded by Shalini Mukund. Empowering voice, confidence, and executive articulation.</p>
            <div class="flex flex-wrap gap-2.5 pt-1">
              <a href="https://www.instagram.com/mukundshalini/" target="_blank" rel="noopener noreferrer" class="w-10 h-10 rounded-full bg-theme border border-theme flex items-center justify-center hover:border-gold-muted transition" aria-label="Instagram"><img src="${REICON.instagram}" data-vom-social="instagram" alt="Instagram" width="24" height="24" /></a>
              <a href="https://www.facebook.com/shalini.mukund.9" target="_blank" rel="noopener noreferrer" class="w-10 h-10 rounded-full bg-theme border border-theme flex items-center justify-center hover:border-gold-muted transition" aria-label="Facebook"><img src="${REICON.facebook}" data-vom-social="facebook" alt="Facebook" width="24" height="24" /></a>
              <a href="https://www.linkedin.com/in/shalini-mukund-3799661b9/" target="_blank" rel="noopener noreferrer" class="w-10 h-10 rounded-full bg-theme border border-theme flex items-center justify-center hover:border-gold-muted transition" aria-label="LinkedIn"><img src="${REICON.linkedin}" data-vom-social="linkedin" alt="LinkedIn" width="24" height="24" /></a>
            </div>
          </div>
          <div><h4 class="font-bold text-heading mb-4 text-sm uppercase tracking-wider">Quick Links</h4><ul class="space-y-3 text-sec"><li><a href="about.html" class="hover:text-gold transition">About Founder</a></li><li><a href="keynotes.html" class="hover:text-gold transition">Keynotes</a></li><li><a href="academy.html" class="hover:text-gold transition">Youth Academy</a></li><li><a href="corporate.html" class="hover:text-gold transition">Corporate</a></li></ul></div>
          <div><h4 class="font-bold text-heading mb-4 text-sm uppercase tracking-wider">Explore</h4><ul class="space-y-3 text-sec"><li><a href="books.html" class="hover:text-gold transition">Books</a></li><li><a href="resources.html" class="hover:text-gold transition">Resources</a></li><li><a href="weekly.html" class="hover:text-gold transition">Weekly Highlights</a></li><li><a href="testimonials.html" class="hover:text-gold transition">Testimonials</a></li></ul></div>
          <div><h4 class="font-bold text-heading mb-4 text-sm uppercase tracking-wider">Official Profiles</h4><div class="space-y-3 text-sm text-sec"><a href="https://www.instagram.com/mukundshalini/" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 hover:text-gold transition"><img src="${REICON.instagram}" data-vom-social="instagram" alt="Instagram" width="24" height="24" /> @mukundshalini</a><a href="https://www.facebook.com/shalini.mukund.9" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 hover:text-gold transition"><img src="${REICON.facebook}" data-vom-social="facebook" alt="Facebook" width="24" height="24" /> Facebook</a><a href="https://www.linkedin.com/in/shalini-mukund-3799661b9/" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 hover:text-gold transition"><img src="${REICON.linkedin}" data-vom-social="linkedin" alt="LinkedIn" width="24" height="24" /> LinkedIn</a></div></div>
        </div>
        <div class="pt-8 border-t border-theme flex flex-col sm:flex-row justify-between items-center text-xs gap-4 text-muted"><div>&copy; 2026 Voice-O-Magic (Shalini Mukund). All Rights Reserved.</div><div class="flex space-x-6"><a href="#" class="hover:text-heading transition">Privacy Policy</a><a href="#" class="hover:text-heading transition">Terms of Service</a></div></div>
      </div>`;
  }

  function boot(){
    const saved=(()=>{try{return localStorage.getItem('vom-theme')}catch{return null}})();
    const prefersDark=window.matchMedia?window.matchMedia('(prefers-color-scheme: dark)').matches:false;
    setTheme(saved?saved==='dark':prefersDark);
    setupNavigationAccessibility();
    addWeeklyLink();
    replaceHeaderBrand();
    replaceSocialIcons();
    replaceContactIcons();
    replacePageIllustrations();
    addLinkedInProfile();
    decoratePdfDownloads();
    removeVerifiedBadge();
    improveHomeImage();
    standardFooter();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{
      boot();
      const observer=new MutationObserver(()=>boot());
      observer.observe(document.body,{childList:true,subtree:true});
    },{once:true});
  }else{
    boot();
    const observer=new MutationObserver(()=>boot());
    observer.observe(document.body,{childList:true,subtree:true});
  }
})();

/* deployment marker: 2026-08-28 ui reicon pass */
