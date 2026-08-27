(function () {
  'use strict';

  const RESOURCES_PATH = '/resources.html';
  const MAX_WAIT_MS = 12000;

  function isResourcesPage() {
    return location.pathname === RESOURCES_PATH;
  }

  function arrange() {
    if (!isResourcesPage()) return true;

    const main = document.querySelector('main');
    if (!main) return false;

    const container = Array.from(main.children).find((child) =>
      child.querySelector?.('h1') && child.classList.contains('max-w-7xl')
    );
    if (!container) return false;

    const children = Array.from(container.children);
    const intro = children[0];
    const video = children.find((child) => child.querySelector?.('#videoContainer'));
    const resourcesGrid = children.find((child) => {
      if (!child.classList.contains('grid')) return false;
      const cards = child.querySelectorAll('article');
      return cards.length > 0 && !child.matches('[data-weekly-highlights]');
    });
    const highlights = main.querySelector('[data-weekly-highlights]');

    // The Speaker Toolkit is no longer part of the public Resources page.
    // Keep only the known Resources-page content blocks: intro, highlights, video, resources.
    children.forEach((child) => {
      const isKnown = child === intro || child === video || child === resourcesGrid || child === highlights;
      if (!isKnown) child.remove();
    });

    if (!intro || !video || !resourcesGrid || !highlights) return false;

    // Required public order: Weekly Highlights → YouTube video → Resources.
    [intro, highlights, video, resourcesGrid].forEach((node) => container.appendChild(node));

    return true;
  }

  function boot() {
    if (!isResourcesPage()) return;

    const started = Date.now();
    const observer = new MutationObserver(() => {
      if (arrange() || Date.now() - started >= MAX_WAIT_MS) observer.disconnect();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    if (arrange()) observer.disconnect();
    window.setTimeout(() => observer.disconnect(), MAX_WAIT_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
