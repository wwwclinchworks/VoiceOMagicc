import handler from './worker.js';

function withNoStore(response) {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store, no-cache, max-age=0, must-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const prettyRoutes = {
      '/about': '/about.html',
      '/keynotes': '/keynotes.html',
      '/academy': '/academy.html',
      '/corporate': '/corporate.html',
      '/books': '/books.html',
      '/resources': '/resources.html',
      '/contact': '/contact.html',
      '/testimonials': '/testimonials.html',
      '/weekly': '/weekly.html',
      '/admin': '/adminadmin.html'
    };
    if (prettyRoutes[url.pathname]) {
      const destination = new URL(prettyRoutes[url.pathname], url.origin);
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
    const response = await handler.fetch(request, env, ctx);
    const type = response.headers.get('content-type') || '';
    return type.toLowerCase().includes('text/html') ? withNoStore(response) : response;
  }
};
