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
      child.classList.contains('max-w-7xl') && child.querySelector?.('#videoContainer')
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

    // Remove the public Resources intro copy requested by the client.
    // The corresponding Admin Page Copy fields remain available for compatibility.
    if (intro && intro !== video && intro !== resourcesGrid && intro !== highlights) {
      intro.remove();
    }

    // The Speaker Toolkit is intentionally not shown on the public Resources page.
    const refreshedChildren = Array.from(container.children);
    refreshedChildren.forEach((child) => {
      if (
        child.querySelector?.('h2')?.textContent?.trim() === 'Event Organizer Speaker Toolkit'
        || child.querySelector?.('h2')?.textContent?.trim() === 'Speaker Toolkit'
      ) {
        child.remove();
      }
    });

    if (!video || !resourcesGrid || !highlights) return false;

    // Required public order: Weekly Highlights → YouTube video → Resources.
    [highlights, video, resourcesGrid].forEach((node) => container.appendChild(node));

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
