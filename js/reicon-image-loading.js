(function () {
  'use strict';

  // ReIcon illustrations chosen from the People → Profession collection.
  const LOADING_ILLUSTRATION = 'https://cdn.reicon.dev/consultant-presenting.svg';
  const EMPTY_ILLUSTRATION = 'https://cdn.reicon.dev/teacher.svg';

  const IMAGE_SELECTORS = [
    '#weeklyGallery img'
  ];

  function findWeeklyLoader(frame) {
    return frame.querySelector('.weekly-loader, [data-reicon-loader]');
  }

  function setLoaderIllustration(loader, src) {
    if (!loader) return;
    let icon = loader.querySelector('img');
    if (!icon) {
      icon = document.createElement('img');
      icon.alt = '';
      icon.width = 180;
      icon.height = 180;
      icon.decoding = 'async';
      icon.loading = 'eager';
      icon.style.cssText = 'width:110px;height:110px;max-width:32%;max-height:32%;object-fit:contain;opacity:1';
      loader.appendChild(icon);
    }
    icon.src = src;
  }

  function createLoader(frame, src) {
    const loader = document.createElement('div');
    loader.className = 'weekly-loader';
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
    setLoaderIllustration(loader, src);
    frame.appendChild(loader);
    return loader;
  }

  function prepareImage(img) {
    if (!img || img.dataset.reiconLoadingPrepared === 'true') return;
    img.dataset.reiconLoadingPrepared = 'true';

    const frame = img.closest('.weekly-frame') || img.parentElement;
    if (!frame) return;

    if (window.getComputedStyle(frame).position === 'static') {
      frame.style.position = 'relative';
    }

    const existingLoader = findWeeklyLoader(frame);
    const loader = existingLoader || createLoader(frame, LOADING_ILLUSTRATION);
    setLoaderIllustration(loader, LOADING_ILLUSTRATION);

    const finish = () => {
      if (!loader.isConnected) return;
      loader.style.opacity = '0';
      loader.style.pointerEvents = 'none';
      window.setTimeout(() => loader.remove(), 220);
    };

    const failed = () => {
      // Keep the illustration visible briefly on failures instead of flashing a broken image state.
      setLoaderIllustration(loader, EMPTY_ILLUSTRATION);
      loader.style.opacity = '1';
      loader.style.pointerEvents = 'none';
    };

    if (img.complete && img.naturalWidth > 0) {
      finish();
    } else {
      img.addEventListener('load', finish, { once: true });
      img.addEventListener('error', failed, { once: true });
    }
  }

  function prepareAdminLoader(root) {
    root.querySelectorAll?.('[data-drive-loader] img').forEach((icon) => {
      icon.src = LOADING_ILLUSTRATION;
      icon.alt = '';
    });
  }

  function scan(root = document) {
    IMAGE_SELECTORS.forEach((selector) => {
      root.querySelectorAll?.(selector).forEach(prepareImage);
    });
    prepareAdminLoader(root);
    if (root instanceof HTMLImageElement) prepareImage(root);
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
