(function () {
  'use strict';
  if (location.pathname !== '/resources.html') return;

  const CMS_URL = '/api/chat?mode=public-cms';
  let latestHighlights = null;
  let observer = null;

  function create(tag, classes, text) {
    const node = document.createElement(tag);
    if (classes) node.className = classes;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function safeImageUrl(value) {
    try {
      const url = new URL(String(value || ''), location.origin);
      return url.protocol === 'https:' ? url.toString() : null;
    } catch {
      return null;
    }
  }

  function buildSection(highlights) {
    const items = [highlights?.highlight1, highlights?.highlight2]
      .filter(item => item && item.published === true && safeImageUrl(item.imageUrl));
    if (!items.length) return null;

    const section = create('section', 'w-full px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-10 sm:pb-12');
    section.dataset.weeklyHighlights = 'true';

    const inner = create('div', 'max-w-7xl mx-auto');
    const heading = create('div', 'text-center max-w-3xl mx-auto mb-7 sm:mb-8');
    heading.append(
      create('span', 'text-sm font-bold text-gold tracking-widest uppercase', 'Weekly Highlights'),
      create('div', 'gold-divider mx-auto mt-2 mb-4'),
      create('h2', 'font-display text-3xl sm:text-4xl font-bold text-heading', 'This Week at Voice-O-Magic'),
      create('p', 'text-sec text-base mt-3 leading-relaxed', 'Fresh highlights, moments, and updates from this week.')
    );
    inner.append(heading);

    const grid = create('div', 'grid grid-cols-1 md:grid-cols-2 gap-6');
    items.forEach((item, index) => {
      const card = create('article', 'material-card overflow-hidden group');
      const image = document.createElement('img');
      image.src = safeImageUrl(item.imageUrl);
      image.alt = String(item.title || `Weekly highlight ${index + 1}`).slice(0, 160);
      image.loading = index === 0 ? 'eager' : 'lazy';
      image.decoding = 'async';
      image.className = 'block w-full aspect-[4/3] object-cover transition duration-300 group-hover:scale-[1.01]';
      image.addEventListener('error', () => {
        card.remove();
        if (!grid.querySelector('article')) section.remove();
      }, { once: true });
      card.append(image);

      if (item.title || item.description) {
        const content = create('div', 'p-5 sm:p-6');
        if (item.title) content.append(create('h3', 'font-bold text-xl text-heading', item.title));
        if (item.description) content.append(create('p', 'text-sm text-sec leading-relaxed mt-2', item.description));
        card.append(content);
      }
      grid.append(card);
    });

    inner.append(grid);
    section.append(inner);
    return section;
  }

  function mount() {
    const main = document.querySelector('main');
    if (!main || !latestHighlights) return;

    const existing = main.querySelector('[data-weekly-highlights]');
    if (existing) return;
    if (!main.children.length) return;

    const section = buildSection(latestHighlights);
    if (section) main.prepend(section);
  }

  async function load() {
    try {
      const response = await fetch(CMS_URL, { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      latestHighlights = data?.cms?.weeklyHighlights || null;
      mount();

      const main = document.querySelector('main');
      if (!main || observer) return;
      observer = new MutationObserver(() => mount());
      observer.observe(main, { childList: true });
    } catch {
      // Optional content; keep the Resources page usable.
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load, { once: true });
  } else {
    load();
  }
})();
