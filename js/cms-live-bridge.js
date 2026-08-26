(function () {
  'use strict';

  const LIVE_CMS_ENDPOINT = '/api/chat?mode=public-cms';
  const originalFetch = window.fetch.bind(window);

  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (url.startsWith('/data/knowledge.json?')) {
      return originalFetch(LIVE_CMS_ENDPOINT, { ...(init || {}), cache: 'no-store' });
    }
    return originalFetch(input, init);
  };
})();
