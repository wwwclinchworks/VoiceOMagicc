(function () {
  'use strict';

  const RESOURCES_PATH = '/resources.html';
  const MAX_WAIT_MS = 12000;
  const POLL_MS = 100;

  function isResourcesPage() {
    return location.pathname === RESOURCES_PATH;
  }

  function moveSections() {
    if (!isResourcesPage()) return false;

    const main = document.querySelector('main');
    if (!main) return false;

    const container = Array.from(main.children).find((child) =>
      child.classList.contains('max-w-7xl') && child.querySelector('h1')
    );
    if (!container) return false;

    const children = Array.from(container.children);
    const intro = children[0];
    const video = children.find((child) => child.querySelector?.('#videoContainer'));
    const resourcesGrid = children.find((child) =>
      child.classList.contains('grid') && child.querySelector?.('article')
    );
    const toolkit = children.find((child) =>
      child.querySelector?.('h2')?.textContent?.trim() === 'Event Organizer Speaker Toolkit'
    );
    const highlights = main.querySelector('[data-weekly-highlights]');

    if (toolkit) toolkit.remove();

    if (highlights && highlights.parentElement !== container) {
      if (video) container.insertBefore(highlights, video);
      else if (resourcesGrid) container.insertBefore(highlights, resourcesGrid);
      else container.appendChild(highlights);
    }

    if (intro && highlights && video && resourcesGrid) {
      [intro, highlights, video, resourcesGrid].forEach((node) => container.appendChild(node));
      return true;
    }

    return Boolean(intro && video && resourcesGrid);
  }

  function boot() {
    if (!isResourcesPage()) return;

    const started = Date.now();
    const timer = window.setInterval(() => {
      if (moveSections() || Date.now() - started >= MAX_WAIT_MS) {
        window.clearInterval(timer);
      }
    }, POLL_MS);

    moveSections();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
