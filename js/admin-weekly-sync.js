(function () {
  'use strict';

  const ENDPOINT = '/api/weekly-highlights';
  let current = null;
  let loaded = false;
  let dirty = false;
  let observer = null;
  let saving = false;

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const validHttps = (value) => { try { return new URL(value).protocol === 'https:'; } catch { return false; } };
  const node = (tag, classes, text) => { const el = document.createElement(tag); if (classes) el.className = classes; if (text !== undefined) el.textContent = text; return el; };

  function toast(message, bad = false) {
    const el = node('div', 'fixed right-5 bottom-5 z-[140] max-w-sm rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl', message);
    el.style.background = bad ? '#b42318' : '#111827';
    document.body.append(el);
    window.setTimeout(() => el.remove(), 3200);
  }

  function markDirty(value = true) {
    dirty = Boolean(value);
    const button = document.querySelector('[data-weekly-sync-save]');
    if (button) button.textContent = dirty ? 'Save Weekly Highlights • Unsaved' : 'Save Weekly Highlights';
  }

  function field(label, item, key, type, onInput) {
    const wrapper = node('label', 'block');
    wrapper.append(node('span', 'block text-sm font-semibold mb-1.5 text-sec', label));
    const input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
    input.className = 'md-input';
    if (type === 'textarea') input.rows = 3; else input.type = type;
    input.value = item[key] || '';
    input.addEventListener('input', () => onInput(input.value));
    wrapper.append(input);
    return wrapper;
  }

  function makeCard(slot, item) {
    const card = node('article', 'rounded-2xl border border-theme p-5 bg-theme/60');
    card.append(node('h3', 'font-bold text-lg text-heading', slot === 'highlight1' ? 'Highlight 1' : 'Highlight 2'));
    const preview = node('div', 'mt-3 rounded-xl border border-theme overflow-hidden bg-surface-warm min-h-[160px] flex items-center justify-center');

    const refreshPreview = () => {
      preview.replaceChildren();
      if (!item.imageUrl) {
        preview.append(node('p', 'p-5 text-sm text-muted text-center', 'Image preview will appear here.'));
        return;
      }
      if (!validHttps(item.imageUrl)) {
        preview.append(node('p', 'p-5 text-sm text-red text-center', 'Enter a valid HTTPS image URL to preview it.'));
        return;
      }
      const img = document.createElement('img');
      img.src = item.imageUrl;
      img.alt = item.title || (slot === 'highlight1' ? 'Weekly highlight 1' : 'Weekly highlight 2');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.className = 'w-full aspect-[4/3] object-cover';
      img.onerror = () => preview.replaceChildren(node('p', 'p-5 text-sm text-red text-center', 'Unable to load this image URL. Check the HTTPS URL.'));
      preview.append(img);
    };

    card.append(field('Image HTTPS URL', item, 'imageUrl', 'url', (value) => {
      item.imageUrl = value.trim();
      markDirty();
      refreshPreview();
    }), preview);

    const fields = node('div', 'mt-4 space-y-4');
    fields.append(
      field('Title (optional)', item, 'title', 'text', (value) => { item.title = value; markDirty(); }),
      field('Description (optional)', item, 'description', 'textarea', (value) => { item.description = value; markDirty(); })
    );
    card.append(fields);

    const publish = node('label', 'inline-flex items-center gap-2 text-sm font-semibold text-sec cursor-pointer mt-4');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = item.published === true;
    checkbox.addEventListener('change', () => { item.published = checkbox.checked; markDirty(); });
    publish.append(checkbox, node('span', '', 'Published'));
    card.append(publish);
    return card;
  }

  function renderSection() {
    const dashboard = document.querySelector('main');
    if (!dashboard || !dashboard.querySelector('#saveAll') || !loaded) return;

    let section = dashboard.querySelector('[data-weekly-highlights-admin-sync]');
    if (!section) {
      section = node('section', 'material-card p-5');
      section.dataset.weeklyHighlightsAdminSync = 'true';

      const header = node('div', 'flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4');
      const info = node('div', 'min-w-0');
      info.append(
        node('h2', 'text-xl md:text-2xl font-bold text-heading', '📸 Weekly Highlights'),
        node('p', 'text-sm font-medium text-gold mt-1', 'Where this changes: resources.html → Weekly Highlights'),
        node('p', 'text-xs text-muted mt-2', 'Manage exactly two weekly images. Published highlights are shown publicly.')
      );
      const saveButton = node('button', 'btn-primary text-sm', dirty ? 'Save Weekly Highlights • Unsaved' : 'Save Weekly Highlights');
      saveButton.type = 'button';
      saveButton.dataset.weeklySyncSave = 'true';
      saveButton.addEventListener('click', save);
      header.append(info, saveButton);
      section.append(header);

      const grid = node('div', 'grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5');
      grid.dataset.weeklySyncGrid = 'true';
      section.append(grid);

      const children = Array.from(dashboard.children);
      const anchor = children.find((child) => child.querySelector?.('h2')?.textContent?.includes('Featured Video'))
        || children.find((child) => child.querySelector?.('h2')?.textContent?.includes('Resources'));
      if (anchor) dashboard.insertBefore(section, anchor);
      else dashboard.insertBefore(section, dashboard.children[1] || null);
    }

    const grid = section.querySelector('[data-weekly-sync-grid]');
    if (grid && !grid.children.length) grid.append(makeCard('highlight1', current.highlight1), makeCard('highlight2', current.highlight2));
  }

  async function save() {
    if (saving || !current) return;
    saving = true;
    const button = document.querySelector('[data-weekly-sync-save]');
    if (button) { button.disabled = true; button.textContent = 'Saving…'; }
    try {
      for (const item of [current.highlight1, current.highlight2]) {
        if (item.published && !validHttps(item.imageUrl)) throw new Error('Every published highlight needs a valid HTTPS image URL.');
        if (item.imageUrl && !validHttps(item.imageUrl)) throw new Error('Image URLs must use HTTPS.');
      }
      const response = await fetch(ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weeklyHighlights: current }),
        cache: 'no-store'
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Unable to save Weekly Highlights.');
      current = clone(result.weeklyHighlights || current);
      dirty = false;
      renderSection();
      toast('Weekly Highlights saved successfully.');
    } catch (error) {
      toast(error.message || 'Unable to save Weekly Highlights.', true);
    } finally {
      saving = false;
      if (button) { button.disabled = false; button.textContent = dirty ? 'Save Weekly Highlights • Unsaved' : 'Save Weekly Highlights'; }
    }
  }

  function attachSaveAll() {
    const saveAll = document.querySelector('#saveAll');
    if (!saveAll || saveAll.dataset.weeklySyncAttached) return;
    saveAll.dataset.weeklySyncAttached = 'true';
    saveAll.addEventListener('click', () => {
      if (dirty) window.setTimeout(() => { save(); }, 0);
    });
  }

  async function load() {
    try {
      const response = await fetch(ENDPOINT, { cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Unable to load Weekly Highlights.');
      current = clone(result.weeklyHighlights || DEFAULTS);
    } catch (error) {
      current = clone(DEFAULTS);
      toast(error.message || 'Unable to load Weekly Highlights.', true);
    }
    loaded = true;
    mount();
  }

  function mount() {
    renderSection();
    attachSaveAll();
  }

  function boot() {
    if (observer) return;
    observer = new MutationObserver(() => mount());
    observer.observe(document.body, { childList: true, subtree: true });
    load();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
