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

/* Shared navigation + ReIcon design system. */
(function(){
  const REICON={
    instagram:'https://cdn.reicon.dev/logos/instagram/original.svg',
    facebook:'https://cdn.reicon.dev/logos/facebook/original.svg',
    linkedin:'https://cdn.reicon.dev/logos/linkedin/original.svg',
    cookbook:'https://cdn.reicon.dev/cookbook.svg',
    toolbox:'https://cdn.reicon.dev/toolbox.svg',
    response:'https://cdn.reicon.dev/response.svg',
    teacher:'https://cdn.reicon.dev/teacher.svg'
  };

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

  function makeLogo(src,alt,size=24){
    const img=document.createElement('img');
    img.src=src; img.alt=alt; img.width=size; img.height=size;
    img.loading='lazy'; img.decoding='async';
    img.className='inline-block shrink-0 object-contain';
    return img;
  }

  function hasReiconSocial(a, kind){
    return Boolean(a.querySelector(`img[data-vom-social="${kind}"], img[src*="cdn.reicon.dev/logos/${kind}/original.svg"]`));
  }

  function replaceSocialIcons(){
    document.querySelectorAll('a[href*="instagram.com/"]').forEach((a)=>{
      if(hasReiconSocial(a,'instagram')) return;
      a.querySelectorAll('i.fa-instagram,.fa-instagram').forEach((i)=>i.remove());
      const logo=makeLogo(REICON.instagram,'Instagram',24);
      logo.dataset.vomSocial='instagram';
      a.insertBefore(logo,a.firstChild);
    });
    document.querySelectorAll('a[href*="facebook.com/"]').forEach((a)=>{
      if(hasReiconSocial(a,'facebook')) return;
      a.querySelectorAll('i.fa-facebook,.fa-facebook').forEach((i)=>i.remove());
      const logo=makeLogo(REICON.facebook,'Facebook',24);
      logo.dataset.vomSocial='facebook';
      a.insertBefore(logo,a.firstChild);
    });
    document.querySelectorAll('a[href*="linkedin.com/"]').forEach((a)=>{
      if(hasReiconSocial(a,'linkedin')) return;
      a.querySelectorAll('i.fa-linkedin,.fa-linkedin').forEach((i)=>i.remove());
      const logo=makeLogo(REICON.linkedin,'LinkedIn',24);
      logo.dataset.vomSocial='linkedin';
      a.insertBefore(logo,a.firstChild);
    });
  }

  function replaceIconBox(card,src,alt){
    if(!card || card.querySelector('[data-vom-page-art]')) return;
    const box=card.firstElementChild;
    if(!box) return;
    const img=makeLogo(src,alt,180);
    img.dataset.vomPageArt='true';
    img.className='w-16 h-16 object-contain rounded-xl';
    box.replaceChildren(img);
  }

  function applyPageIllustrations(){
    const path=location.pathname.toLowerCase();
    if(path.endsWith('/books.html') || path.endsWith('books.html')){
      document.querySelectorAll('main .material-card').forEach((card)=>{
        const title=card.querySelector('h3,h4')?.textContent?.toLowerCase() || '';
        if(!/(inspiration|school|published)/.test(title)) return;
        if(card.querySelector('[data-vom-page-art]')) return;
        const img=makeLogo(REICON.cookbook,'Cookbook',180);
        img.dataset.vomPageArt='true';
        img.className='w-28 h-32 object-contain';
        const first=card.firstElementChild;
        if(first && first.querySelector('h4')) first.replaceChildren(img); else card.prepend(img);
      });
    }
    if(path.endsWith('/corporate.html') || path.endsWith('corporate.html')){
      const cards=[...document.querySelectorAll('main .material-card')].filter((card)=>/Corporate Workshops|Executive Coaching/i.test(card.textContent||''));
      cards.slice(0,2).forEach((card)=>replaceIconBox(card,REICON.toolbox,'A toolbox'));
    }
    if(path.endsWith('/testimonials.html') || path.endsWith('testimonials.html')){
      const cards=[...document.querySelectorAll('main article.material-card')];
      replaceIconBox(cards.find((card)=>/Community Feedback/i.test(card.textContent||'')),REICON.response,'A response');
      replaceIconBox(cards.find((card)=>/Learner Wins/i.test(card.textContent||'')),REICON.teacher,'Teacher');
      addLinkedInProfile();
    }
  }

  function addLinkedInProfile(){
    if(document.querySelector('[data-vom-linkedin-profile]')) return;
    const main=document.querySelector('main');
    if(!main) return;
    const section=document.createElement('section');
    section.className='material-card p-5 sm:p-8 mt-10';
    section.dataset.vomLinkedinProfile='true';
    const row=document.createElement('div');
    row.className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4';
    const copy=document.createElement('div');
    copy.innerHTML='<span class="text-xs font-bold text-gold uppercase tracking-widest">Professional profile</span><h2 class="font-display text-2xl sm:text-3xl font-bold text-heading mt-1">Shalini Mukund on LinkedIn</h2><p class="text-sec text-sm mt-2">Connect with Shalini for professional updates, leadership insights, and communication work.</p>';
    const link=document.createElement('a');
    link.href='https://www.linkedin.com/in/shalini-mukund-3799661b9/';
    link.target='_blank'; link.rel='noopener noreferrer';
    link.className='btn-secondary text-sm inline-flex items-center gap-2';
    link.append(makeLogo(REICON.linkedin,'LinkedIn',24),document.createTextNode('Open LinkedIn'));
    row.append(copy,link); section.append(row); main.append(section);
  }

  function standardFooter(){
    const footer=document.querySelector('footer');
    if(!footer || footer.dataset.vomStandardFooter==='true') return;
    footer.dataset.vomStandardFooter='true';
    footer.className='pt-14 pb-10 text-sm';
    footer.innerHTML=`
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div class="space-y-4 md:col-span-2 lg:col-span-1">
            <div class="flex items-center space-x-2.5"><div class="w-9 h-9 rounded-full border border-theme bg-theme flex items-center justify-center p-0.5 shadow-card"><img src="logo.png" alt="Voice-O-Magic logo" class="w-full h-full object-contain"></div><span class="font-display font-bold text-heading text-lg">Voice-O-Magic</span></div>
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

  function bootEnhancements(){ addWeeklyLink(); replaceSocialIcons(); applyPageIllustrations(); standardFooter(); }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{ bootEnhancements(); const observer=new MutationObserver(()=>bootEnhancements()); observer.observe(document.body,{childList:true,subtree:true}); },{once:true});
  } else {
    bootEnhancements(); const observer=new MutationObserver(()=>bootEnhancements()); observer.observe(document.body,{childList:true,subtree:true});
  }
})();
