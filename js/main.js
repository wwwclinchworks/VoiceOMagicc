(function () {
  'use strict';
  const state = { cms: null };

  function setTheme(dark) {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('vom-theme', dark ? 'dark' : 'light');
    document.querySelectorAll('#themeToggleBtn, #themeToggleBtnMobile').forEach((btn) => {
      btn.innerHTML = dark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
      btn.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    });
  }

  window.toggleTheme = () => setTheme(!document.documentElement.classList.contains('dark'));
  window.toggleMobileMenu = () => document.getElementById('mobileMenu')?.classList.toggle('hidden');

  function ensureSharedComponentsStyles() {
    if (document.querySelector('link[data-vom-components]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/components.css';
    link.dataset.vomComponents = 'true';
    document.head.appendChild(link);
  }

  window.closeVideoModal = () => {
    const modal = document.getElementById('videoModal');
    const frame = document.getElementById('videoIframe');
    if (frame) frame.src = '';
    if (modal) modal.classList.add('hidden');
  };

  window.openVideoModal = (url) => {
    const modal = document.getElementById('videoModal');
    const frame = document.getElementById('videoIframe');
    if (frame && typeof url === 'string' && /^https:\/\//.test(url)) frame.src = url;
    if (modal) modal.classList.remove('hidden');
  };

  window.playNativeVideo = () => {
    const cover = document.getElementById('videoCover');
    const container = document.getElementById('videoContainer');
    if (cover) cover.classList.add('hidden');
    if (container && !container.firstChild) {
      const iframe = document.createElement('iframe');
      iframe.className = 'w-full h-full';
      iframe.src = 'https://www.youtube-nocookie.com/embed/KKNCiRWd_j0?autoplay=1';
      iframe.title = 'Voice-O-Magic featured video';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      container.appendChild(iframe);
    }
  };

  window.closeResourceModal = () => document.getElementById('resourceModal')?.classList.add('hidden');
  window.openResourceModal = (title) => {
    const modal = document.getElementById('resourceModal');
    const label = document.getElementById('modalResourceTitle');
    if (label && title) label.textContent = title;
    if (modal) modal.classList.remove('hidden');
  };

  window.handleFormSubmit = (event) => {
    if (event) event.preventDefault();
    const form = event?.target;
    const data = form ? new FormData(form) : null;
    const name = data?.get('name') || '';
    const message = data?.get('message') || 'Hello, I would like to contact Voice-O-Magic.';
    const phone = '919999999999';
    window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent('Hello Voice-O-Magic,\n\n' + (name ? 'Name: ' + name + '\n' : '') + message), '_blank', 'noopener,noreferrer');
    return false;
  };

  window.handleResourceSubmit = (event) => {
    if (event) event.preventDefault();
    const form = event?.target;
    const pending = window.__VOM_PENDING_DOWNLOAD_URL;
    if (pending && /^https:\/\//.test(pending)) {
      window.location.href = pending;
    } else {
      const email = form ? new FormData(form).get('email') : '';
      window.alert(email ? 'Thank you. Your resource request has been recorded.' : 'Please enter your email.');
      if (form) form.reset();
    }
    return false;
  };

  window.downloadSpeakerKit = (url) => {
    if (typeof url === 'string' && /^https:\/\//.test(url)) {
      window.location.href = url;
      return;
    }
    window.openResourceModal('Speaker Toolkit');
  };

  function clean(value) { return String(value ?? '').trim(); }
  function safeUrl(value, hosts) {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:') return null;
      if (hosts && !hosts.includes(url.hostname.toLowerCase())) return null;
      return url.toString();
    } catch { return null; }
  }
  function create(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function updateRequestedAcademyCopy() {
    const replacements = [
      ['Youth Academy & Phonetics', 'Youth Academy & Confidence Skills'],
      ['Phonetics & Foundations', 'Foundations of Creating Content & Writing']
    ];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach((textNode) => {
      let value = textNode.nodeValue;
      replacements.forEach(([from, to]) => { value = value.split(from).join(to); });
      if (value !== textNode.nodeValue) textNode.nodeValue = value;
    });
  }

  function addTestimonialsNavigation() {
    const desktopNav = document.querySelector('nav[aria-label="Main Navigation"]');
    if (desktopNav && !desktopNav.querySelector('a[href="testimonials.html"]')) {
      const resourceLink = desktopNav.querySelector('a[href="resources.html"]');
      const link = document.createElement('a');
      link.href = 'testimonials.html';
      link.className = 'nav-btn px-4 py-2 rounded-full text-sm font-medium transition';
      link.textContent = 'Testimonials';
      if (resourceLink) resourceLink.insertAdjacentElement('afterend', link);
      else desktopNav.appendChild(link);
    }

    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu && !mobileMenu.querySelector('a[href="testimonials.html"]')) {
      const link = document.createElement('a');
      link.href = 'testimonials.html';
      link.className = 'block w-full text-left px-4 py-3 rounded-lg text-sec hover:bg-gold-light hover:text-gold-hover font-medium transition';
      link.textContent = 'Testimonials';
      const contact = mobileMenu.querySelector('a[href="contact.html"]');
      if (contact) contact.before(link); else mobileMenu.appendChild(link);
    }
  }

  function showMaintenance() {
    if (!state.cms?.settings?.maintenanceMode || document.querySelector('.cms-maintenance')) return;
    const bar = create('div', 'cms-maintenance', 'Site content is temporarily in maintenance mode.');
    document.body.appendChild(bar);
  }

  function resourceCard(item) {
    const card = create('article', 'material-card p-7 flex flex-col justify-between h-full');
    card.append(create('h3', 'font-bold text-heading', item.title));
    card.append(create('p', 'text-sm text-sec leading-relaxed mt-2 mb-6', item.description || ''));
    const drive = safeUrl(item.driveUrl || '', ['drive.google.com', 'docs.google.com']);
    if (drive) {
      const link = create('a', 'btn-secondary text-sm text-center', item.buttonText || 'Download');
      link.href = drive;
      link.rel = 'noopener noreferrer';
      link.target = '_self';
      card.append(link);
    } else {
      const button = create('button', 'btn-secondary text-sm text-center', item.buttonText || 'Download');
      button.type = 'button';
      button.addEventListener('click', () => window.openResourceModal(item.title));
      card.append(button);
    }
    return card;
  }

  function renderResources() {
    const main = document.querySelector('main');
    if (!main || !state.cms) return;
    main.replaceChildren();
    const intro = create('section', 'py-20 sm:py-28');
    intro.append(create('span', 'text-sm font-bold text-gold tracking-widest uppercase', state.cms.settings.resourcesLabel));
    intro.append(create('h1', 'font-display text-4xl sm:text-5xl font-bold text-heading mt-3', state.cms.settings.resourcesHeading));
    intro.append(create('p', 'text-sec text-base mt-5 leading-relaxed', state.cms.settings.resourcesParagraph));
    if (state.cms.settings.resourcesExtraParagraph) intro.append(create('p', 'text-sec text-base mt-3 leading-relaxed', state.cms.settings.resourcesExtraParagraph));
    main.append(intro);

    const video = state.cms.featuredVideo;
    const videoBox = create('section', 'material-card max-w-4xl mx-auto p-4');
    const videoArea = create('div', 'aspect-video bg-black rounded-xl overflow-hidden');
    if (video.published) {
      try {
        const parsed = new URL(video.url);
        const id = parsed.pathname.split('/').pop();
        if (/^[A-Za-z0-9_-]{11}$/.test(id)) {
          const iframe = create('iframe', 'w-full h-full');
          iframe.src = `https://www.youtube-nocookie.com/embed/${id}`;
          iframe.title = clean(video.title) || 'Voice-O-Magic featured video';
          iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
          iframe.referrerPolicy = 'strict-origin-when-cross-origin';
          iframe.allowFullscreen = true;
          videoArea.append(iframe);
        }
      } catch {}
    }
    videoBox.append(videoArea, create('h3', 'font-bold text-heading text-xl mt-5', video.title), create('p', 'text-sec text-sm mt-2 leading-relaxed', video.description));
    main.append(videoBox);

    const grid = create('div', 'grid grid-cols-1 md:grid-cols-3 gap-6 mt-12');
    [...state.cms.resources].filter((x) => x.published).sort((a,b) => a.order - b.order).forEach((x) => grid.append(resourceCard(x)));
    main.append(grid);

    const toolkit = create('section', 'mt-16');
    toolkit.append(create('h2', 'font-display text-3xl font-bold text-heading', state.cms.settings.toolkitHeading));
    toolkit.append(create('p', 'text-sec text-base mt-3', state.cms.settings.toolkitDescription));
    const toolkitGrid = create('div', 'grid grid-cols-1 md:grid-cols-3 gap-6 mt-7');
    [...state.cms.toolkit].filter((x) => x.published).sort((a,b) => a.order - b.order).forEach((x) => toolkitGrid.append(resourceCard(x)));
    toolkit.append(toolkitGrid);
    main.append(toolkit);
    showMaintenance();
  }

  function bookCard(item) {
    const card = create('article', 'material-card p-8 flex flex-col gap-4');
    const imageUrl = safeUrl(item.coverImageUrl || '');
    if (imageUrl) {
      const image = document.createElement('img');
      image.src = imageUrl;
      image.alt = item.title;
      image.loading = 'lazy';
      image.style.cssText = 'width:140px;height:190px;object-fit:cover;border-radius:12px';
      card.append(image);
    }
    if (item.categoryLabel) card.append(create('div', 'text-[10px] text-muted font-bold uppercase tracking-widest', item.categoryLabel));
    card.append(create('h3', 'font-bold text-xl text-heading', item.bookHeading || item.title));
    card.append(create('div', 'text-sm font-semibold text-gold', item.authors));
    card.append(create('p', 'text-sm text-sec leading-relaxed', item.description));
    const destination = safeUrl(item.destinationUrl || '');
    if (destination) {
      const link = create('a', 'text-gold font-bold text-sm', item.buttonText || 'Learn More');
      link.href = destination;
      link.rel = 'noopener noreferrer';
      link.target = '_self';
      card.append(link);
    }
    return card;
  }

  function renderBooks() {
    const main = document.querySelector('main');
    if (!main || !state.cms) return;
    main.replaceChildren();
    const section = create('section', 'py-20 sm:py-28');
    section.append(create('span', 'text-sm font-bold text-gold tracking-widest uppercase', state.cms.settings.booksLabel));
    section.append(create('h1', 'font-display text-4xl sm:text-5xl font-bold text-heading mt-3', state.cms.settings.booksHeading));
    section.append(create('p', 'text-sec text-base mt-5 leading-relaxed', state.cms.settings.booksParagraph));
    const grid = create('div', 'grid grid-cols-1 md:grid-cols-2 gap-8 mt-12');
    [...state.cms.books].filter((x) => x.published).sort((a,b) => a.order - b.order).forEach((x) => grid.append(bookCard(x)));
    section.append(grid);
    main.append(section);
    showMaintenance();
  }

  async function loadCms() {
    const response = await fetch(`/data/knowledge.json?cms=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    state.cms = data.cms || null;
    if (!state.cms) return;
    if (location.pathname.endsWith('/resources.html')) renderResources();
    else if (location.pathname.endsWith('/books.html')) renderBooks();
  }

  function adminLoginScreen() {
    document.body.innerHTML = '';
    document.title = 'Private Control Center | Voice-O-Magic';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex,nofollow,noarchive,nosnippet';
    document.head.append(meta);
    const shell = create('div', 'min-h-screen flex items-center justify-center p-6 bg-gray-50');
    const card = create('div', 'material-card p-8 w-full max-w-md');
    card.append(create('div', 'text-sm font-semibold text-gold uppercase tracking-widest', 'Private Control Center'), create('h1', 'font-display text-3xl font-bold text-heading mt-2', 'Voice-O-Magic Admin'), create('p', 'text-sec text-sm mt-2', 'Authorized administrator access only.'));
    const form = create('form', 'space-y-4 mt-7');
    const label = create('label', 'block text-sm font-medium text-sec');
    label.append(create('span', '', 'Administrator password'));
    const password = document.createElement('input');
    password.type = 'password'; password.name = 'password'; password.autocomplete = 'current-password'; password.required = true; password.className = 'w-full mt-1.5 border border-gray-300 rounded-lg p-3';
    label.append(password);
    const note = create('p', 'text-sm text-red-700'); note.hidden = true;
    const button = create('button', 'btn-primary w-full', 'Sign in'); button.type = 'submit';
    form.append(label, note, button);
    form.addEventListener('submit', async (event) => {
      event.preventDefault(); note.hidden = true; button.disabled = true; button.textContent = 'Signing in…';
      try {
        const response = await fetch('/api/chat?mode=admin-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: password.value }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Login failed.');
        window.location.reload();
      } catch (error) {
        note.textContent = error.message; note.hidden = false; button.disabled = false; button.textContent = 'Sign in';
      }
    });
    card.append(form); shell.append(card); document.body.append(shell);
  }

  function start() {
    ensureSharedComponentsStyles();
    const saved = localStorage.getItem('vom-theme');
    setTheme(saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches);
    updateRequestedAcademyCopy();
    addTestimonialsNavigation();
    if (new URLSearchParams(location.search).get('admin') === '1') {
      const meta = document.createElement('meta'); meta.name = 'robots'; meta.content = 'noindex,nofollow,noarchive,nosnippet'; document.head.append(meta);
      adminLoginScreen(); return;
    }
    loadCms().catch(() => {});
  }

  document.addEventListener('DOMContentLoaded', start);
})();
