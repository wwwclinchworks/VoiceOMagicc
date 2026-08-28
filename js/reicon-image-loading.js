(function () {
  'use strict';

  // Single ReIcon treatment for image loading/empty/error states.
  const APERTURE_ILLUSTRATION = 'https://cdn.reicon.dev/aperture.svg';
  const IMAGE_SELECTORS = ['#weeklyGallery img'];

  function ensureIcon(container, src = APERTURE_ILLUSTRATION) {
    if (!container) return null;
    let icon = container.querySelector('img[data-reicon-illustration]');
    if (!icon) {
      icon = document.createElement('img');
      icon.dataset.reiconIllustration = 'true';
      icon.alt = 'Aperture';
      icon.width = 180;
      icon.height = 180;
      icon.loading = 'eager';
      icon.decoding = 'async';
      icon.style.cssText = [
        'width:110px',
        'height:110px',
        'max-width:32%',
        'max-height:32%',
        'object-fit:contain',
        'opacity:1'
      ].join(';');
      container.appendChild(icon);
    }
    icon.src = src;
    icon.alt = 'Aperture';
    return icon;
  }

  function findLoader(frame) {
    return frame.querySelector('.weekly-loader, [data-reicon-loader]');
  }

  function createLoader(frame) {
    const loader = document.createElement('div');
    loader.className = 'weekly-loader';
    loader.dataset.reiconLoader = 'true';
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
    frame.appendChild(loader);
    return loader;
  }

  function finish(loader) {
    if (!loader || !loader.isConnected) return;
    loader.style.opacity = '0';
    loader.style.pointerEvents = 'none';
    window.setTimeout(() => loader.remove(), 220);
  }

  function bindWeeklyImage(img) {
    if (!img || img.dataset.reiconLoadingBound === 'true') return;
    img.dataset.reiconLoadingBound = 'true';

    const frame = img.closest('.weekly-frame') || img.parentElement;
    if (!frame) return;

    if (window.getComputedStyle(frame).position === 'static') {
      frame.style.position = 'relative';
    }

    const loader = findLoader(frame) || createLoader(frame);
    ensureIcon(loader);

    const onLoad = () => finish(loader);
    const onError = () => {
      ensureIcon(loader);
      loader.style.opacity = '1';
      loader.style.pointerEvents = 'none';
    };

    if (img.complete) {
      if (img.naturalWidth > 0) onLoad();
      else onError();
    } else {
      img.addEventListener('load', onLoad, { once: true });
      img.addEventListener('error', onError, { once: true });
    }
  }

  function styleExistingAdminLoaders(root) {
    root.querySelectorAll?.('[data-drive-loader]').forEach((loader) => {
      ensureIcon(loader);
    });
  }

  function scan(root = document) {
    IMAGE_SELECTORS.forEach((selector) => {
      root.querySelectorAll?.(selector).forEach(bindWeeklyImage);
    });
    styleExistingAdminLoaders(root);
    if (root instanceof HTMLImageElement) bindWeeklyImage(root);
  }

  function boot() {
    if (!document.body) return;
    scan(document);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const added of mutation.addedNodes) {
          if (added.nodeType === Node.ELEMENT_NODE) scan(added);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
