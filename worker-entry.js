import handler from './worker.js';

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
      destination.hash = url.hash;
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

    const response = await handler.fetch(request, env, ctx);
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('text/html')) return response;

    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'no-store, no-cache, max-age=0, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
};
