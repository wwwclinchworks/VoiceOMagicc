import handler from './worker.js';

/**
 * Canonical public-page entry point.
 *
 * /resources and /resources/ are aliases only. The canonical public URL is
 * /resources.html. Redirect before the asset request so the browser never
 * renders or executes the extensionless route.
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/resources' || url.pathname === '/resources/') {
      const destination = new URL('/resources.html', url.origin);
      destination.search = url.search;
      return Response.redirect(destination.toString(), 301);
    }

    return handler.fetch(request, env, ctx);
  }
};
