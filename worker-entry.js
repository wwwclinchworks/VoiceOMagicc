import handler from './worker.js';

function noStoreHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store, no-cache, max-age=0, must-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');
  return headers;
}

function stripDraftHighlights(payload) {
  const cms = payload?.cms;
  const highlights = cms?.weeklyHighlights;
  if (!cms || !highlights) return payload;

  const cleanSlot = (slot) => slot?.published === true
    ? {
      imageUrl: slot.imageUrl || '',
      title: slot.title || '',
      description: slot.description || '',
      published: true
    }
    : {
      imageUrl: '',
      title: '',
      description: '',
      published: false
    };

  return {
    ...payload,
    cms: {
      ...cms,
      weeklyHighlights: {
        highlight1: cleanSlot(highlights.highlight1),
        highlight2: cleanSlot(highlights.highlight2)
      }
    }
  };
}

/**
 * Single production entrypoint for the site.
 *
 * /resources and /resources/ are aliases only. The canonical public URL is
 * /resources.html. The redirect happens before the asset request so the
 * browser never renders the extensionless route.
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/resources' || url.pathname === '/resources/') {
      const destination = new URL('/resources.html', url.origin);
      destination.search = url.search;
      return new Response(null, {
        status: 301,
        headers: {
          Location: destination.toString(),
          'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0'
        }
      });
    }

    const isPublicCms = url.pathname === '/api/chat' &&
      url.searchParams.get('mode') === 'public-cms' &&
      request.method === 'GET';

    const response = await handler.fetch(request, env, ctx);

    if (isPublicCms && response.ok) {
      try {
        const payload = await response.clone().json();
        return new Response(JSON.stringify(stripDraftHighlights(payload)), {
          status: response.status,
          statusText: response.statusText,
          headers: noStoreHeaders(response)
        });
      } catch {
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: noStoreHeaders(response)
        });
      }
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('text/html')) return response;

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: noStoreHeaders(response)
    });
  }
};
