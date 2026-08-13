(function () {
  'use strict';

  const state = { cms: null };
  const WHATSAPP_PHONE = '919902148227';
  const CMS_TIMEOUT_MS = 8000;
  let lastModalTrigger = null;

  function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch { return null; }
  }

  function storageSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch { /* Storage may be unavailable. */ }
  }

  function setTheme(dark) {
    document.documentElement.classList.toggle('dark', dark);
    storageSet('vom-theme', dark ? 'dark' : 'light');
    document.querySelectorAll('#themeToggleBtn, #themeToggleBtnMobile').forEach((btn) => {
      const icon = document.createElement('i');
      icon.className = dark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
      btn.replaceChildren(icon);
      btn.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
      btn.setAttribute('aria-label', btn.title);
    });
  }

  window.toggleTheme = () => setTheme(!document.documentElement.classList.contains('dark'));

  window.toggleMobileMenu = () => {
    const menu = document.getElementById('mobileMenu');
    const button = document.getElementById('mobileMenuBtn');
    if (!menu) return;
    const willOpen = menu.classList.contains('hidden');
    menu.classList.toggle('hidden', !willOpen);
    if (button) button.setAttribute('aria-expanded', String(willOpen));
  };

  function setupNavigationAccessibility() {
    const menu = document.getElementById('mobileMenu');
    const button = document.getElementById('mobileMenuBtn');
    if (!menu || !button) return;
    if (!menu.id) menu.id = 'mobileMenu';
    button.setAttribute('aria-controls', menu.id);
    button.setAttribute('aria-expanded', String(!menu.classList.contains('hidden')));
  }

  function ensureSharedComponentsStyles() {
    if (document.querySelector('link[data-vom-components]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/components.css';
    link.dataset.vomComponents = 'true';
    document.head.appendChild(link);
  }

  function openModal(modal, focusSelector) {
    if (!modal) return;
    lastModalTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    const focusTarget = focusSelector ? modal.querySelector(focusSelector) : null;
    if (focusTarget instanceof HTMLElement) window.setTimeout(() => focusTarget.focus(), 0);
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    modal.removeAttribute('role');
    modal.removeAttribute('aria-modal');
    if (lastModalTrigger instanceof HTMLElement && document.contains(lastModalTrigger)) {
      lastModalTrigger.focus({ preventScroll: true });
    }
    lastModalTrigger = null;
  }

  window.closeVideoModal = () => {
    const frame = document.getElementById('videoIframe');
    if (frame) frame.src = '';
    closeModal('videoModal');
  };

  window.openVideoModal = (url) => {
    const modal = document.getElementById('videoModal');
    const frame = document.getElementById('videoIframe');
    if (frame && typeof url === 'string' && /^https:\/\/(?:www\.)?(?:youtube\.com|youtube-nocookie\.com)\//i.test(url)) {
      frame.src = url;
      openModal(modal, 'button[aria-label^="Close"]');
    }
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
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.allowFullscreen = true;
      container.appendChild(iframe);
    }
  };

  window.closeResourceModal = () => closeModal('resourceModal');

  window.openResourceModal = (title) => {
    const modal = document.getElementById('resourceModal');
    const label = document.getElementById('modalResourceTitle');
    if (label && title) label.textContent = title;
    openModal(modal, 'button[aria-label^="Close"]');
  };

  window.handleFormSubmit = (event) => {
    if (event) event.preventDefault();
    const form = event?.target;
    if (!(form instanceof HTMLFormElement)) return false;
    if (!form.checkValidity()) {
      form.reportValidity();
      return false;
    }

    const value = (id) => document.getElementById(id)?.value?.trim() || '';
    const name = value('formName');
    const email = value('formEmail');
    const phone = value('formPhone');
    const organization = value('formOrg');
    const message = value('formMsg');
    const inquiryType = form.querySelector('input[name="inquiry_type"]:checked')?.value || 'general';
    const lines = [
      'Hello Voice-O-Magic,',
      '',
      `Inquiry: ${inquiryType}`,
      `Name: ${name}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : '',
      organization ? `Organization / Child age: ${organization}` : '',
      `Message: ${message}`
    ].filter(Boolean);

    window.open(
      `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(lines.join('\n'))}`,
      '_blank',
      'noopener,noreferrer'
    );
    return false;
  };

  window.handleResourceSubmit = (event) => {
    if (event) event.preventDefault();
    const form = event?.target;
    if (!(form instanceof HTMLFormElement)) return false;
    if (!form.checkValidity()) {
      form.reportValidity();
      return false;
    }

    const pending = window.__VOM_PENDING_DOWNLOAD_URL;
    if (typeof pending === 'string' && /^https:\/\//.test(pending)) {
      window.location.href = pending;
      return false;
    }

    const name = document.getElementById('resourceName')?.value?.trim() || '';
    const email = document.getElementById('resourceEmail')?.value?.trim() || '';
    const resource = document.getElementById('modalResourceTitle')?.textContent?.trim() || 'the requested resource';
    const message = `Hello Voice-O-Magic,\n\nI'd like to request: ${resource}\nName: ${name}\nEmail: ${email}`;
    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    form.reset();
    closeModal('resourceModal');
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
    const settings = state.cms.settings || {};
    const intro = create('section', 'py-20 sm:py-28');
    intro.append(create('span', 'text-sm font-bold text-gold tracking-widest uppercase', settings.resourcesLabel || 'Free Resources'));
    intro.append(create('h1', 'font-display text-4xl sm:text-5xl font-bold text-heading mt-3', settings.resourcesHeading || 'Resources'));
    intro.append(create('p', 'text-sec text-base mt-5 leading-relaxed', settings.resourcesParagraph || ''));
    if (settings.resourcesExtraParagraph) intro.append(create('p', 'text-sec text-base mt-3 leading-relaxed', settings.resourcesExtraParagraph));
    main.append(intro);

    const video = state.cms.featuredVideo || {};
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
    videoBox.append(videoArea, create('h3', 'font-bold text-heading text-xl mt-5', video.title || 'Featured Video'), create('p', 'text-sec text-sm mt-2 leading-relaxed', video.description || ''));
    main.append(videoBox);

    const resources = Array.isArray(state.cms.resources) ? state.cms.resources : [];
    const grid = create('div', 'grid grid-cols-1 md:grid-cols-3 gap-6 mt-12');
    resources.filter((x) => x && x.published).sort((a,b) => a.order - b.order).forEach((x) => grid.append(resourceCard(x)));
    main.append(grid);

    const toolkit = create('section', 'mt-16');
    toolkit.append(create('h2', 'font-display text-3xl font-bold text-heading', settings.toolkitHeading || 'Speaker Toolkit'));
    toolkit.append(create('p', 'text-sec text-base mt-3', settings.toolkitDescription || ''));
    const toolkitGrid = create('div', 'grid grid-cols-1 md:grid-cols-3 gap-6 mt-7');
    const toolkitItems = Array.isArray(state.cms.toolkit) ? state.cms.toolkit : [];
    toolkitItems.filter((x) => x && x.published).sort((a,b) => a.order - b.order).forEach((x) => toolkitGrid.append(resourceCard(x)));
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
      image.alt = item.title || 'Book cover';
      image.loading = 'lazy';
      image.decoding = 'async';
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
    const settings = state.cms.settings || {};
    const section = create('section', 'py-20 sm:py-28');
    section.append(create('span', 'text-sm font-bold text-gold tracking-widest uppercase', settings.booksLabel || 'Published Works'));
    section.append(create('h1', 'font-display text-4xl sm:text-5xl font-bold text-heading mt-3', settings.booksHeading || 'Published Works'));
    section.append(create('p', 'text-sec text-base mt-5 leading-relaxed', settings.booksParagraph || ''));
    const grid = create('div', 'grid grid-cols-1 md:grid-cols-2 gap-8 mt-12');
    const books = Array.isArray(state.cms.books) ? state.cms.books : [];
    books.filter((x) => x && x.published).sort((a,b) => a.order - b.order).forEach((x) => grid.append(bookCard(x)));
    section.append(grid);
    main.append(section);
    showMaintenance();
  }

  async function loadCms() {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), CMS_TIMEOUT_MS);
    try {
      const response = await fetch(`/data/knowledge.json?cms=${Date.now()}`, { cache: 'no-store', signal: controller.signal });
      if (!response.ok) return;
      const data = await response.json();
      if (!data || typeof data.cms !== 'object' || !data.cms) return;
      state.cms = data.cms;
      if (location.pathname.endsWith('/resources.html')) renderResources();
      else if (location.pathname.endsWith('/books.html')) renderBooks();
    } catch {
      // Static page content remains available if the CMS source is unavailable.
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function adminLoginScreen() {
    document.body.innerHTML = '';
    document.title = 'Private Control Center | Voice-O-Magic';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex,nofollow,noarchive,nosnippet';
    document.head.append(meta);
    const shell = create('div', 'min-h-screen flex items-center justify-center p-6 bg-theme');
    const card = create('div', 'material-card p-8 w-full max-w-md');
    card.append(create('div', 'text-sm font-semibold text-gold uppercase tracking-widest', 'Private Control Center'), create('h1', 'font-display text-3xl font-bold text-heading mt-2', 'Voice-O-Magic Admin'), create('p', 'text-sec text-sm mt-2', 'Authorized administrator access only.'));
    const form = create('form', 'space-y-4 mt-7');
    const label = create('label', 'block text-sm font-medium text-sec');
    label.append(create('span', '', 'Administrator password'));
    const password = document.createElement('input');
    password.type = 'password'; password.name = 'password'; password.autocomplete = 'current-password'; password.required = true; password.className = 'md-input mt-1.5';
    label.append(password);
    const note = create('p', 'text-sm text-red'); note.hidden = true;
    const button = create('button', 'btn-primary w-full', 'Sign in'); button.type = 'submit';
    form.append(label, note, button);
    form.addEventListener('submit', async (event) => {
      event.preventDefault(); note.hidden = true; button.disabled = true; button.textContent = 'Signing in…';
      try {
        const response = await fetch('/api/chat?mode=admin-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: password.value }) });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'Login failed.');
        window.location.reload();
      } catch (error) {
        note.textContent = error.message || 'Login failed.'; note.hidden = false; button.disabled = false; button.textContent = 'Sign in';
      }
    });
    card.append(form); shell.append(card); document.body.append(shell);
  }

  function start() {
    ensureSharedComponentsStyles();
    setupNavigationAccessibility();
    const saved = storageGet('vom-theme');
    const prefersDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
    setTheme(saved ? saved === 'dark' : prefersDark);
    updateRequestedAcademyCopy();
    addTestimonialsNavigation();
    if (new URLSearchParams(location.search).get('admin') === '1') {
      const meta = document.createElement('meta'); meta.name = 'robots'; meta.content = 'noindex,nofollow,noarchive,nosnippet'; document.head.append(meta);
      adminLoginScreen(); return;
    }
    loadCms();
  }

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const video = document.getElementById('videoModal');
    const resource = document.getElementById('resourceModal');
    if (video && !video.classList.contains('hidden')) window.closeVideoModal();
    else if (resource && !resource.classList.contains('hidden')) window.closeResourceModal();
  });

  document.addEventListener('DOMContentLoaded', start);
})();
