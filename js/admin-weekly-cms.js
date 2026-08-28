(function () {
  'use strict';

  const ADMIN_DATA = '/api/chat?mode=admin-data';
  const ADMIN_SAVE = '/api/chat?mode=admin-save';
  const SECTION_ID = 'vomWeeklyHighlightsAdmin';
  const REICON_LOADER = 'https://cdn.reicon.dev/consultant-presenting.svg';

  const defaults = () => ({
    highlight1: { driveUrl: '', imageUrl: '', title: '', description: '', published: false },
    highlight2: { driveUrl: '', imageUrl: '', title: '', description: '', published: false }
  });

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const node = (tag, classes, text) => {
    const el = document.createElement(tag);
    if (classes) el.className = classes;
    if (text !== undefined) el.textContent = text;
    return el;
  };

  function driveFileId(value) {
    const raw = String(value || '').trim();
    if (!raw) return null;
    try {
      const url = new URL(raw);
      if (url.protocol !== 'https:') return null;
      const host = url.hostname.toLowerCase();
      const allowed = ['drive.google.com', 'www.drive.google.com', 'docs.google.com', 'drive.usercontent.google.com'];
      if (!allowed.includes(host)) return null;

      let id = url.searchParams.get('id') || '';
      if (!id) {
        const match = url.pathname.match(/\/file\/d\/([A-Za-z0-9_-]{10,})/i);
        if (match) id = match[1];
      }
      if (!id) {
        const match = url.pathname.match(/\/d\/([A-Za-z0-9_-]{10,})/i);
        if (match) id = match[1];
      }
      return /^[A-Za-z0-9_-]{10,200}$/.test(id) ? id : null;
    } catch {
      return null;
    }
  }

  function normalizeDriveUrl(value) {
    const id = driveFileId(value);
    return id ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w2000` : null;
  }

  function toast(message, bad = false) {
    const existing = document.querySelector('[data-weekly-toast]');
    if (existing) existing.remove();
    const item = node('div', 'fixed right-5 bottom-5 z-[150] max-w-sm rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl', message);
    item.dataset.weeklyToast = 'true';
    item.style.background = bad ? '#b42318' : '#111827';
    document.body.append(item);
    window.setTimeout(() => item.remove(), 3500);
  }

  function validPublishedItem(item) {
    if (!item.published) return true;
    return Boolean(item.driveUrl && normalizeDriveUrl(item.driveUrl));
  }

  function field(label, value, type, help, onInput) {
    const wrap = node('label', 'block');
    wrap.append(node('span', 'block text-sm font-semibold mb-1.5 text-sec', label));
    if (help) wrap.append(node('span', 'block text-xs text-muted mb-1.5', help));
    const input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
    input.className = 'md-input';
    if (type === 'textarea') input.rows = 3;
    else input.type = type;
    input.value = String(value || '');
    input.addEventListener('input', () => onInput(input.value, input));
    wrap.append(input);
    return wrap;
  }

  function driveLoader() {
    const loader = node('div', 'absolute inset-0 z-10 flex items-center justify-center bg-surface-warm');
    loader.dataset.driveLoader = 'true';
    const img = document.createElement('img');
    img.src = REICON_LOADER;
    img.alt = 'Loading image';
    img.width = 180;
    img.height = 180;
    img.loading = 'eager';
    img.decoding = 'async';
    img.className = 'w-[110px] h-[110px] max-w-[32%] max-h-[32%] object-contain';
    loader.append(img);
    return loader;
  }

  function makeSlot(title, item, index) {
    const card = node('article', 'rounded-2xl border border-theme p-5 bg-theme/60');
    card.dataset.slot = String(index);

    const heading = node('h3', 'font-bold text-lg text-heading', title);
    card.append(heading);

    const preview = node('div', 'mt-4 relative rounded-xl border border-theme overflow-hidden bg-surface-warm min-h-[180px] flex items-center justify-center');
    preview.style.aspectRatio = '16 / 9';
    preview.append(node('p', 'p-5 text-sm text-muted text-center', 'Paste a Google Drive image link to preview the image.'));

    const refreshPreview = () => {
      preview.replaceChildren();

      if (!item.driveUrl) {
        const empty = node('div', 'w-full h-full min-h-[180px] flex flex-col items-center justify-center p-5 text-center');
        const art = document.createElement('img');
        art.src = 'https://cdn.reicon.dev/teacher.svg';
        art.alt = '';
        art.width = 180;
        art.height = 180;
        art.loading = 'eager';
        art.decoding = 'async';
        art.className = 'w-[90px] h-[90px] object-contain mb-2';
        empty.append(art, node('p', 'text-sm text-muted', 'Paste a Google Drive image link to preview the image.'));
        preview.append(empty);
        return;
      }

      const imageUrl = normalizeDriveUrl(item.driveUrl);
      if (!imageUrl) {
        preview.append(node('p', 'p-5 text-sm text-red text-center', 'Invalid Google Drive link. Use a Drive file share link.'));
        return;
      }

      const loader = driveLoader();
      preview.append(loader);

      const image = document.createElement('img');
      image.src = imageUrl;
      image.alt = item.title || title;
      image.loading = 'eager';
      image.decoding = 'async';
      image.className = 'absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-200';

      image.addEventListener('load', () => {
        image.classList.remove('opacity-0');
        image.classList.add('opacity-100');
        loader.remove();
      }, { once: true });

      image.addEventListener('error', () => {
        loader.remove();
        const errorState = node('div', 'w-full h-full min-h-[180px] flex flex-col items-center justify-center p-5 text-center');
        const art = document.createElement('img');
        art.src = 'https://cdn.reicon.dev/coach-whistle.svg';
        art.alt = '';
        art.width = 180;
        art.height = 180;
        art.loading = 'eager';
        art.decoding = 'async';
        art.className = 'w-[75px] h-[75px] object-contain mb-2';
        errorState.append(art, node('p', 'text-sm text-red', 'The image could not be loaded. Set Drive sharing to Anyone with the link → Viewer.'));
        preview.replaceChildren(errorState);
      }, { once: true });

      preview.append(image);
    };

    card.append(field('Google Drive image link', item.driveUrl, 'url', 'Paste the copied Google Drive sharing URL. It will be filtered and converted to an image URL.', (value) => {
      item.driveUrl = value.trim();
      item.imageUrl = normalizeDriveUrl(item.driveUrl) || '';
      refreshPreview();
      markDirty();
    }));

    card.append(preview);

    const details = node('div', 'mt-4 space-y-4');
    details.append(
      field('Title (optional)', item.title, 'text', '', (value) => { item.title = value; markDirty(); }),
      field('Description (optional)', item.description, 'textarea', '', (value) => { item.description = value; markDirty(); })
    );

    const published = node('label', 'inline-flex items-center gap-2 text-sm font-semibold text-sec cursor-pointer');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = item.published === true;
    checkbox.addEventListener('change', () => { item.published = checkbox.checked; markDirty(); });
    published.append(checkbox, node('span', '', 'Published'));
    details.append(published);

    card.append(details);
    return card;
  }

  let current = defaults();
  let dirty = false;
  let saving = false;

  function markDirty() {
    dirty = true;
    const button = document.querySelector('[data-weekly-admin-save]');
    if (button) button.textContent = 'Save Weekly Highlights • Unsaved';
    const all = document.querySelector('#saveAll');
    if (all) all.textContent = 'Save All Changes • Unsaved';
  }

  function markClean() {
    dirty = false;
    const button = document.querySelector('[data-weekly-admin-save]');
    if (button) button.textContent = 'Save Weekly Highlights';
  }

  async function adminData() {
    const response = await fetch(ADMIN_DATA, { cache: 'no-store' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'Unable to read CMS data.');
    return body;
  }

  async function save() {
    if (saving) return;
    saving = true;
    const button = document.querySelector('[data-weekly-admin-save]');
    if (button) {
      button.disabled = true;
      button.textContent = 'Saving…';
    }

    try {
      for (const item of [current.highlight1, current.highlight2]) {
        if (item.driveUrl && !normalizeDriveUrl(item.driveUrl)) {
          throw new Error('Each Drive link must be a valid Google Drive image sharing URL.');
        }
        if (!validPublishedItem(item)) {
          throw new Error('Every published highlight needs a valid Google Drive image link.');
        }
        item.imageUrl = normalizeDriveUrl(item.driveUrl) || '';
      }

      const latest = await adminData();
      const cms = clone(latest.cms || {});
      cms.weeklyHighlights = clone(current);

      const response = await fetch(ADMIN_SAVE, {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cms })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Unable to save Weekly Highlights.');

      current = clone(body.cms?.weeklyHighlights || current);
      markClean();
      toast('Weekly Highlights saved successfully.');
    } catch (error) {
      toast(error.message || 'Unable to save Weekly Highlights.', true);
    } finally {
      saving = false;
      if (button) {
        button.disabled = false;
        button.textContent = dirty ? 'Save Weekly Highlights • Unsaved' : 'Save Weekly Highlights';
      }
    }
  }

  function render() {
    const dashboard = document.querySelector('main');
    if (!dashboard || !dashboard.querySelector('#saveAll')) return;

    let section = document.getElementById(SECTION_ID);
    if (!section) {
      section = node('section', 'material-card p-5');
      section.id = SECTION_ID;

      const header = node('div', 'flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4');
      const info = node('div', 'min-w-0');
      info.append(
        node('h2', 'text-xl md:text-2xl font-bold text-heading', '📸 Weekly Highlights'),
        node('p', 'text-sm font-medium text-gold mt-1', 'Where this changes: weekly.html → Weekly Highlights'),
        node('p', 'text-xs text-muted mt-2', 'Paste Google Drive image links directly. The admin filters the link, extracts the file ID, previews the image, and publishes only valid links.')
      );

      const saveButton = node('button', 'btn-primary text-sm', 'Save Weekly Highlights');
      saveButton.type = 'button';
      saveButton.dataset.weeklyAdminSave = 'true';
      saveButton.addEventListener('click', save);
      header.append(info, saveButton);
      section.append(header);

      const sharing = node('div', 'mt-4 rounded-xl border border-gold-muted bg-gold-light p-3 text-sm text-sec');
      sharing.append(node('strong', 'text-heading', 'Drive sharing: '), document.createTextNode('set the image file to “Anyone with the link” → Viewer so the public page can load it.'));
      section.append(sharing);

      const grid = node('div', 'grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5');
      grid.append(makeSlot('Highlight 1', current.highlight1, 1), makeSlot('Highlight 2', current.highlight2, 2));
      section.append(grid);

      const children = Array.from(dashboard.children);
      const anchor = children.find((child) => child.querySelector?.('h2')?.textContent?.includes('Featured Video')) || children[1] || null;
      if (anchor) dashboard.insertBefore(section, anchor);
      else dashboard.append(section);
    }
  }

  async function load() {
    try {
      const result = await adminData();
      const incoming = result.cms?.weeklyHighlights;
      if (incoming && typeof incoming === 'object') {
        current = {
          highlight1: { ...defaults().highlight1, ...(incoming.highlight1 || {}) },
          highlight2: { ...defaults().highlight2, ...(incoming.highlight2 || {}) }
        };
      }
    } catch (error) {
      toast(error.message || 'Weekly Highlights could not be loaded.', true);
    }
    render();
  }

  function boot() {
    if (document.body.dataset.weeklyAdminBooted === 'true') return;
    document.body.dataset.weeklyAdminBooted = 'true';

    const observer = new MutationObserver(() => render());
    observer.observe(document.body, { childList: true, subtree: true });
    load();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
