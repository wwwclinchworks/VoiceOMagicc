(function () {
  'use strict';

  const REICON_URL = 'https://cdn.reicon.dev/backup-action.svg';
  const SELECTORS = [
    '#weeklyGallery img',
    '[data-weekly-highlights-admin-sync] img'
  ];

  function eligible(img) {
    if (!img || img.dataset.reiconLoadingBound === 'true') return false;
    return SELECTORS.some((selector) => img.matches(selector));
  }

  function attach(img) {
    if (!eligible(img)) return;
    img.dataset.reiconLoadingBound = 'true';

    const frame = img.parentElement;
    if (!frame) return;

    const computed = window.getComputedStyle(frame);
    if (computed.position === 'static') frame.style.position = 'relative';

    const loader = document.createElement('div');
    loader.setAttribute('data-reicon-loader', 'true');
    loader.setAttribute('aria-hidden', 'true');
    loader.style.cssText = [
      'position:absolute',
      'inset:0',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'background:var(--surface-warm,#f8f6f0)',
      'z-index:5',
      'opacity:1',
      'transition:opacity .2s ease'
    ].join(';');

    const icon = document.createElement('img');
    icon.src = REICON_URL;
    icon.alt = '';
    icon.width = 180;
    icon.height = 180;
    icon.decoding = 'async';
    icon.style.cssText = 'width:110px;height:110px;max-width:30%;max-height:30%;object-fit:contain;opacity:1';

    loader.appendChild(icon);
    frame.appendChild(loader);

    const finish = () => {
      loader.style.opacity = '0';
      loader.style.pointerEvents = 'none';
      window.setTimeout(() => loader.remove(), 220);
    };

    if (img.complete && img.naturalWidth > 0) {
      finish();
    } else {
      img.addEventListener('load', finish, { once: true });
      img.addEventListener('error', finish, { once: true });
    }
  }

  function scan(root = document) {
    SELECTORS.forEach((selector) => {
      root.querySelectorAll?.(selector).forEach(attach);
    });
    if (root instanceof HTMLImageElement) attach(root);
  }

  function boot() {
    scan(document);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const added of mutation.addedNodes) {
          if (added.nodeType === Node.ELEMENT_NODE) scan(added);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
