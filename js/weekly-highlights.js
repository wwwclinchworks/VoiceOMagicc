(function () {
  'use strict';
  if (!location.pathname.endsWith('/resources.html')) return;

  const CMS_URL = '/api/weekly-highlights';

  function create(tag, classes, text) {
    const node = document.createElement(tag);
    if (classes) node.className = classes;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function safeImageUrl(value) {
    try {
      const url = new URL(String(value || ''));
      return url.protocol === 'https:' ? url.toString() : null;
    } catch {
      return null;
    }
  }

  function render(highlights) {
    if (document.querySelector('[data-weekly-highlights]')) return;

    const items = [highlights?.highlight1, highlights?.highlight2]
      .filter(item => item && item.published === true && safeImageUrl(item.imageUrl));
    if (!items.length) return;

    const main = document.querySelector('main');
    if (!main) return;

    const section = create('section', 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 sm:mt-24');
    section.dataset.weeklyHighlights = 'true';

    const heading = create('div', 'text-center max-w-3xl mx-auto mb-10');
    heading.append(
      create('span', 'text-sm font-bold text-gold tracking-widest uppercase', 'Weekly Highlights'),
      create('div', 'gold-divider mx-auto mt-3 mb-5'),
      create('h2', 'font-display text-3xl sm:text-4xl font-bold text-heading', 'This Week at Voice-O-Magic'),
      create('p', 'text-sec text-base mt-4 leading-relaxed', 'Fresh highlights, moments, and updates from this week.')
    );
    section.append(heading);

    const grid = create('div', 'grid grid-cols-1 md:grid-cols-2 gap-6');
    items.forEach(item => {
      const card = create('article', 'material-card overflow-hidden group');
      const image = document.createElement('img');
      image.src = safeImageUrl(item.imageUrl);
      image.alt = String(item.title || 'Voice-O-Magic weekly highlight').slice(0, 160);
      image.loading = 'lazy';
      image.decoding = 'async';
      image.className = 'w-full aspect-[4/3] object-cover transition duration-300 group-hover:scale-[1.01]';
      image.addEventListener('error', () => card.remove(), { once: true });
      card.append(image);

      if (item.title || item.description) {
        const content = create('div', 'p-6');
        if (item.title) content.append(create('h3', 'font-bold text-xl text-heading', item.title));
        if (item.description) content.append(create('p', 'text-sm text-sec leading-relaxed mt-2', item.description));
        card.append(content);
      }
      grid.append(card);
    });
    section.append(grid);

    // Append to end of main so it appears after all other content
    main.appendChild(section);
  }

  async function load() {
    try {
      const response = await fetch(CMS_URL, { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      render(data?.weeklyHighlights);
    } catch {
      // Optional content; keep the Resources page usable.
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load, { once: true });
  else load();
})();
