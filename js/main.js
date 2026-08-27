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
    const card = create('article', 'material-card p-7 flex flex-col justify-between h-full group');
    const top = create('div', '');

    const iconBox = create('div', 'w-12 h-12 rounded-xl bg-red-light flex items-center justify-center mb-5');
    iconBox.innerHTML = '<i class="fa-solid fa-file-pdf text-xl text-red"></i>';
    top.append(iconBox);

    top.append(create('h3', 'font-bold text-heading mb-2', item.title));
    top.append(create('p', 'text-sm text-sec leading-relaxed mb-6', item.description || ''));

    const drive = safeUrl(item.driveUrl || '', ['drive.google.com', 'docs.google.com']);
    if (drive) {
      const link = create('a', 'btn-secondary w-full text-sm text-center', item.buttonText || 'Download PDF');
      link.href = drive;
      link.rel = 'noopener noreferrer';
      link.target = '_blank';
      card.append(top, link);
    } else {
      const button = create('button', 'btn-secondary w-full text-sm text-center', item.buttonText || 'Download PDF');
      button.type = 'button';
      button.addEventListener('click', () => window.openResourceModal(item.title));
      card.append(top, button);
    }
    return card;
  }

  function renderResources() {
    const main = document.querySelector('main');
    if (!main || !state.cms) return;

    const settings = state.cms.settings || {};
    const container = create('div', 'py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20');

    const intro = create('div', 'text-center max-w-3xl mx-auto');
    intro.append(create('span', 'text-sm font-bold text-gold tracking-widest uppercase', settings.resourcesLabel || 'Free Masterclass Vault'));
    intro.append(create('div', 'gold-divider mx-auto mt-3 mb-5'));
    intro.append(create('h1', 'font-display text-4xl sm:text-5xl font-bold text-heading', settings.resourcesHeading || 'Resource of the Week'));
    intro.append(create('p', 'text-sec text-base mt-6 leading-relaxed', settings.resourcesParagraph || ''));
    if (settings.resourcesExtraParagraph) intro.append(create('p', 'text-sec text-base mt-3 leading-relaxed', settings.resourcesExtraParagraph));
    container.append(intro);

    const video = state.cms.featuredVideo || {};
    const videoWrap = create('div', 'material-card max-w-4xl mx-auto p-1 sm:p-5 bg-surface-warm');
    const videoBox = create('div', 'relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-card group border border-theme');

    if (video.published && video.url) {
      try {
        const parsed = new URL(video.url);
        const id = parsed.pathname.split('/').pop();
        if (/^[A-Za-z0-9_-]{11}$/.test(id)) {
          const cover = create('div', 'absolute inset-0 z-20 cursor-pointer bg-cover bg-center');
          cover.style.backgroundImage = `url('https://img.youtube.com/vi/${id}/maxresdefault.jpg')`;
          cover.onclick = () => {
            cover.classList.add('hidden');
            const iframe = document.createElement('iframe');
            iframe.className = 'w-full h-full';
            iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
            iframe.title = clean(video.title) || 'Voice-O-Magic featured video';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.referrerPolicy = 'strict-origin-when-cross-origin';
            iframe.allowFullscreen = true;
            const container = videoBox.querySelector('#videoContainer') || videoBox;
            container.innerHTML = '';
            container.appendChild(iframe);
          };
          cover.innerHTML = '<div class="absolute inset-0 bg-black/25 hover:bg-black/15 transition flex items-center justify-center"><div class="w-16 h-16 bg-gold text-white rounded-full flex items-center justify-center shadow-gold-hover transform group-hover:scale-110 transition duration-300"><i class="fa-solid fa-play text-2xl ml-1"></i></div></div>';
          videoBox.append(cover);
        }
      } catch {}
    }
    const videoContainer = create('div', 'absolute inset-0 z-10 w-full h-full');
    videoContainer.id = 'videoContainer';
    videoBox.append(videoContainer);
    videoWrap.append(videoBox);

    const videoMeta = create('div', 'mt-6 px-4 pb-2');
    videoMeta.append(create('h4', 'font-bold text-heading text-lg', video.title || 'Featured Video'));
    videoMeta.append(create('p', 'text-sm text-sec mt-2 leading-relaxed', video.description || ''));
    videoWrap.append(videoMeta);
    container.append(videoWrap);

    const resources = Array.isArray(state.cms.resources) ? state.cms.resources : [];
    const grid = create('div', 'grid grid-cols-1 md:grid-cols-3 gap-6 pt-4');
    resources.filter(x => x && x.published).sort((a, b) => a.order - b.order).forEach(x => grid.append(resourceCard(x)));
    container.append(grid);

    const toolkitItems = Array.isArray(state.cms.toolkit) ? state.cms.toolkit : [];
    if (toolkitItems.filter(x => x && x.published).length > 0 || settings.toolkitHeading) {
      const toolkit = create('div', 'pt-4');
      toolkit.append(create('h2', 'font-display text-3xl font-bold text-heading', settings.toolkitHeading || 'Speaker Toolkit'));
      toolkit.append(create('p', 'text-sec text-base mt-3', settings.toolkitDescription || ''));
      const toolkitGrid = create('div', 'grid grid-cols-1 md:grid-cols-3 gap-6 mt-7');
      toolkitItems.filter(x => x && x.published).sort((a, b) => a.order - b.order).forEach(x => toolkitGrid.append(resourceCard(x)));
      toolkit.append(toolkitGrid);
      container.append(toolkit);
    }

    main.replaceChildren(container);
    showMaintenance();
  }

  function bookCard(item) {
    const card = create('article', 'material-card p-8 flex flex-col sm:flex-row gap-8 items-center sm:items-start bg-theme group');

    const imageUrl = safeUrl(item.coverImageUrl || '');
    const cover = create('div', 'w-32 h-48 bg-surface-warm border border-theme rounded-xl flex items-center justify-center p-5 text-center flex-shrink-0 shadow-card');
    if (imageUrl) {
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = item.title || 'Book cover';
      img.className = 'w-full h-full object-cover rounded-lg';
      img.loading = 'lazy';
      cover.innerHTML = '';
      cover.appendChild(img);
    } else {
      const titleLines = (item.bookHeading || item.title || 'Book').split(' ').slice(0, 4).join(' ');
      cover.innerHTML = `<div><h4 class="font-display font-bold text-heading text-sm leading-tight">${titleLines.replace(/ /g, '<br>')}</h4>${item.authors ? `<p class="text-[9px] text-muted mt-4 font-semibold uppercase tracking-wide">By ${item.authors}</p>` : ''}</div>`;
    }
    card.append(cover);

    const meta = create('div', 'text-center sm:text-left');
    if (item.categoryLabel) meta.append(create('span', 'text-[10px] text-muted font-bold uppercase tracking-widest', item.categoryLabel));
    meta.append(create('h3', 'font-bold text-xl text-heading mt-1.5 mb-3 group-hover:text-gold transition', item.bookHeading || item.title));
    meta.append(create('p', 'text-sm text-sec leading-relaxed mb-5', item.description));

    const destination = safeUrl(item.destinationUrl || '');
    if (destination) {
      const link = create('a', 'text-gold font-bold text-sm hover:text-gold-hover transition inline-flex items-center gap-1.5', item.buttonText || 'Learn More');
      link.href = destination;
      link.rel = 'noopener noreferrer';
      link.target = '_blank';
      link.innerHTML += ' <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>';
      meta.append(link);
    }
    card.append(meta);
    return card;
  }

  function renderBooks() {
    const main = document.querySelector('main');
    if (!main || !state.cms) return;

    const settings = state.cms.settings || {};
    const container = create('div', 'py-20 sm:py-28 bg-surface min-h-screen');
    const inner = create('div', 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20');
    const intro = create('div', 'text-center max-w-3xl mx-auto');
    intro.append(create('span', 'text-sm font-bold text-gold tracking-widest uppercase', settings.booksLabel || 'Intellectual Property'));
    intro.append(create('div', 'gold-divider mx-auto mt-3 mb-5'));
    intro.append(create('h1', 'font-display text-4xl sm:text-5xl font-bold text-heading', settings.booksHeading || 'Published Works'));
    intro.append(create('p', 'text-sec text-base mt-6 leading-relaxed', settings.booksParagraph || ''));
    inner.append(intro);

    const grid = create('div', 'grid grid-cols-1 md:grid-cols-2 gap-8');
    const books = Array.isArray(state.cms.books) ? state.cms.books : [];
    books.filter(x => x && x.published).sort((a, b) => a.order - b.order).forEach(x => grid.append(bookCard(x)));
    inner.append(grid);
    container.append(inner);

    main.replaceChildren(container);
    showMaintenance();
  }

  async function loadCms() {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), CMS_TIMEOUT_MS);
    try {
      const response = await fetch('/api/chat?mode=public-cms', { cache: 'no-store', signal: controller.signal });
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
