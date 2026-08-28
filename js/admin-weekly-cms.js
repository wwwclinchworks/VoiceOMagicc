(function () {
  'use strict';

  const ADMIN_DATA = '/api/chat?mode=admin-data';
  const ADMIN_SAVE = '/api/chat?mode=admin-save';
  const SECTION_ID = 'vomWeeklyHighlightsAdmin';
  const MAX_ITEMS = 40;
  const REICON_LOADER = 'https://cdn.reicon.dev/consultant-presenting.svg';
  const REICON_EMPTY = 'https://cdn.reicon.dev/teacher.svg';
  const REICON_ERROR = 'https://cdn.reicon.dev/coach-whistle.svg';

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const node = (tag, classes, text) => {
    const el = document.createElement(tag);
    if (classes) el.className = classes;
    if (text !== undefined) el.textContent = text;
    return el;
  };

  function newItem() {
    return { id: crypto.randomUUID(), driveUrl: '', imageUrl: '', title: '', description: '', order: 0, published: false };
  }

  function defaults() { return { items: [] }; }

  function driveFileId(value) {
    try {
      const url = new URL(String(value || '').trim());
      if (url.protocol !== 'https:') return null;
      if (!['drive.google.com', 'www.drive.google.com', 'docs.google.com', 'drive.usercontent.google.com'].includes(url.hostname.toLowerCase())) return null;
      let id = url.searchParams.get('id') || '';
      if (!id) id = url.pathname.match(/\/file\/d\/([A-Za-z0-9_-]{10,200})/i)?.[1] || '';
      if (!id) id = url.pathname.match(/\/d\/([A-Za-z0-9_-]{10,200})/i)?.[1] || '';
      return /^[A-Za-z0-9_-]{10,200}$/.test(id) ? id : null;
    } catch { return null; }
  }

  function normalizeDriveUrl(value) {
    const id = driveFileId(value);
    return id ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w2000` : null;
  }

  function toast(message, bad = false) {
    document.querySelector('[data-weekly-toast]')?.remove();
    const item = node('div', 'fixed right-5 bottom-5 z-[150] max-w-sm rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl', message);
    item.dataset.weeklyToast = 'true';
    item.style.background = bad ? '#b42318' : '#111827';
    document.body.append(item);
    window.setTimeout(() => item.remove(), 3500);
  }

  function field(labelText, value, type, help, onInput) {
    const wrap = node('label', 'block');
    wrap.append(node('span', 'block text-sm font-semibold mb-1.5 text-sec', labelText));
    if (help) wrap.append(node('span', 'block text-xs text-muted mb-1.5', help));
    const input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
    input.className = 'md-input';
    if (type === 'textarea') input.rows = 3;
    else input.type = type;
    input.value = String(value || '');
    input.addEventListener('input', () => onInput(input.value));
    wrap.append(input);
    return wrap;
  }

  function preview(item, heading) {
    const wrap = node('div', 'mt-4');
    const frame = node('div', 'relative rounded-xl border border-theme overflow-hidden bg-surface-warm min-h-[170px]');
    frame.style.aspectRatio = '16 / 9';

    const setState = (src, text, textClass = 'text-muted') => {
      frame.replaceChildren();
      const state = node('div', 'absolute inset-0 flex flex-col items-center justify-center p-5 text-center');
      const img = document.createElement('img');
      img.src = src; img.alt = ''; img.width = 180; img.height = 180; img.loading = 'eager'; img.decoding = 'async';
      img.className = 'w-[78px] h-[78px] object-contain mb-2';
      state.append(img);
      if (text) state.append(node('p', `text-xs ${textClass}`, text));
      frame.append(state);
    };

    if (!item.driveUrl) { setState(REICON_EMPTY, 'Add a Google Drive image link.'); wrap.append(frame); return wrap; }
    const imageUrl = normalizeDriveUrl(item.driveUrl);
    if (!imageUrl) { setState(REICON_ERROR, 'Invalid Google Drive link.'); wrap.append(frame); return wrap; }

    const loader = node('div', 'absolute inset-0 z-10 flex items-center justify-center bg-surface-warm');
    const loaderImg = document.createElement('img');
    loaderImg.src = REICON_LOADER; loaderImg.alt = ''; loaderImg.width = 180; loaderImg.height = 180;
    loaderImg.className = 'w-[90px] h-[90px] max-w-[30%] object-contain';
    loader.append(loaderImg);

    const image = document.createElement('img');
    image.src = imageUrl; image.alt = item.title || heading; image.width = 1200; image.height = 675; image.loading = 'eager'; image.decoding = 'async';
    image.className = 'absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-200';
    image.addEventListener('load', () => { image.classList.remove('opacity-0'); image.classList.add('opacity-100'); loader.remove(); }, { once: true });
    image.addEventListener('error', () => setState(REICON_ERROR, 'Image could not be loaded. Set Drive sharing to Anyone with the link → Viewer.', 'text-red'), { once: true });
    frame.append(loader, image); wrap.append(frame); return wrap;
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

  function renderItem(item, index) {
    const card = node('article', 'rounded-2xl border border-theme p-5 bg-theme/60');
    const header = node('div', 'flex items-start justify-between gap-3');
    const heading = node('div');
    heading.append(node('h3', 'font-bold text-lg text-heading', `Highlight ${index + 1}`));
    heading.append(node('p', 'text-xs text-muted mt-1', 'Only HTTPS Google Drive/Docs share links are accepted.'));
    const remove = node('button', 'text-red text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-light transition', 'Remove');
    remove.type = 'button';
    remove.addEventListener('click', () => {
      current.items.splice(index, 1);
      current.items.forEach((x, i) => { x.order = i; });
      markDirty(); render();
    });
    header.append(heading, remove); card.append(header);

    const driveField = field('Google Drive image link', item.driveUrl, 'url', 'Google Drive → Share → Anyone with the link → Viewer.', (value) => {
      item.driveUrl = value.trim();
      item.imageUrl = normalizeDriveUrl(item.driveUrl) || '';
      markDirty();
    });
    driveField.querySelector('input')?.addEventListener('change', () => render(), { once: true });
    card.append(driveField);

    card.append(preview(item, `Highlight ${index + 1}`));
    const details = node('div', 'mt-4 space-y-4');
    details.append(
      field('Title (optional)', item.title, 'text', '', (value) => { item.title = value; markDirty(); }),
      field('Description (optional)', item.description, 'textarea', '', (value) => { item.description = value; markDirty(); })
    );
    const row = node('div', 'flex items-center justify-between gap-3');
    const published = node('label', 'inline-flex items-center gap-2 text-sm font-semibold text-sec cursor-pointer');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox'; checkbox.checked = item.published === true;
    checkbox.addEventListener('change', () => { item.published = checkbox.checked; markDirty(); });
    published.append(checkbox, node('span', '', 'Published'));
    row.append(published, node('span', 'text-xs text-muted', item.published ? 'Visible on public page' : 'Draft'));
    details.append(row); card.append(details); return card;
  }

  function render() {
    const dashboard = document.querySelector('main');
    if (!dashboard || !dashboard.querySelector('#saveAll')) return;
    let section = document.getElementById(SECTION_ID);
    if (!section) {
      section = node('section', 'material-card p-5'); section.id = SECTION_ID;
      const header = node('div', 'flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4');
      const info = node('div', 'min-w-0');
      info.append(
        node('h2', 'text-xl md:text-2xl font-bold text-heading', '📸 Weekly Highlights'),
        node('p', 'text-sm font-medium text-gold mt-1', 'Add as many images as needed (up to 40).'),
        node('p', 'text-xs text-muted mt-2', 'All images are stored as validated Google Drive links. Public output is derived server-side, and unpublished/draft images never appear on the public page.')
      );
      const save = node('button', 'btn-primary text-sm', 'Save Weekly Highlights'); save.type = 'button'; save.dataset.weeklyAdminSave = 'true'; save.addEventListener('click', saveAll); header.append(info, save); section.append(header);
      const sharing = node('div', 'mt-4 rounded-xl border border-gold-muted bg-gold-light p-3 text-sm text-sec'); sharing.append(node('strong', 'text-heading', 'Drive sharing: '), document.createTextNode('set each image to “Anyone with the link” → Viewer. No arbitrary image hosts are accepted.')); section.append(sharing);
      const add = node('button', 'mt-5 w-full min-h-[58px] border-2 border-dashed border-gold-muted rounded-xl text-gold font-bold hover:bg-gold-light transition', '＋ Add Image');
      add.type = 'button'; add.addEventListener('click', () => { if (current.items.length >= MAX_ITEMS) return toast(`Maximum ${MAX_ITEMS} weekly images reached.`, true); current.items.push({ ...newItem(), order: current.items.length }); markDirty(); render(); }); section.append(add);
      const grid = node('div', 'grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5'); grid.dataset.weeklyItems = 'true'; section.append(grid);
      const empty = node('div', 'mt-5 rounded-xl border border-theme p-6 text-center text-sm text-muted'); empty.dataset.weeklyEmpty = 'true'; section.append(empty);
      const children = Array.from(dashboard.children); const anchor = children.find((child) => child.querySelector?.('h2')?.textContent?.includes('Featured Video')) || children[1] || null;
      if (anchor) dashboard.insertBefore(section, anchor); else dashboard.append(section);
    }
    const grid = section.querySelector('[data-weekly-items]'); const empty = section.querySelector('[data-weekly-empty]');
    if (grid) { grid.replaceChildren(...current.items.map((item, index) => renderItem(item, index))); grid.classList.toggle('hidden', current.items.length === 0); }
    if (empty) { empty.textContent = current.items.length ? `${current.items.length} image${current.items.length === 1 ? '' : 's'} configured.` : 'No weekly images yet. Click “＋ Add Image” to create the first one.'; empty.classList.toggle('hidden', current.items.length > 0); }
  }

  async function adminData() { const response = await fetch(ADMIN_DATA, { cache: 'no-store' }); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error || 'Unable to read CMS data.'); return body; }

  async function saveAll() {
    if (saving) return; saving = true;
    const button = document.querySelector('[data-weekly-admin-save]'); if (button) { button.disabled = true; button.textContent = 'Saving…'; }
    try {
      if (current.items.length > MAX_ITEMS) throw new Error(`Maximum ${MAX_ITEMS} weekly images reached.`);
      current.items.forEach((item, index) => { item.order = index; item.driveUrl = String(item.driveUrl || '').trim(); item.imageUrl = normalizeDriveUrl(item.driveUrl) || ''; if (item.driveUrl && !item.imageUrl) throw new Error(`Highlight ${index + 1} has an invalid Google Drive URL.`); if (item.published && !item.imageUrl) throw new Error(`Highlight ${index + 1} must have a valid Drive image before publishing.`); });
      const latest = await adminData(); const cms = clone(latest.cms || {}); cms.weeklyHighlights = clone(current);
      const response = await fetch(ADMIN_SAVE, { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cms }) });
      const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error || 'Unable to save Weekly Highlights.');
      current = clone(body.cms?.weeklyHighlights || current); markClean(); toast('Weekly Highlights saved successfully.'); render();
    } catch (error) { toast(error.message || 'Unable to save Weekly Highlights.', true); }
    finally { saving = false; if (button) { button.disabled = false; button.textContent = dirty ? 'Save Weekly Highlights • Unsaved' : 'Save Weekly Highlights'; } }
  }

  async function load() {
    try {
      const result = await adminData(); const incoming = result.cms?.weeklyHighlights;
      const items = Array.isArray(incoming?.items) ? incoming.items : [incoming?.highlight1, incoming?.highlight2].filter(Boolean);
      current = { items: items.slice(0, MAX_ITEMS).map((item, index) => ({ ...newItem(), ...item, order: Number.isInteger(item?.order) ? item.order : index })) };
    } catch (error) { toast(error.message || 'Weekly Highlights could not be loaded.', true); }
    render();
  }

  function boot() {
    if (document.body.dataset.weeklyAdminBooted === 'true') return;
    document.body.dataset.weeklyAdminBooted = 'true';
    const observer = new MutationObserver(() => { if (document.getElementById(SECTION_ID)) render(); });
    observer.observe(document.body, { childList: true, subtree: true });
    load();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
