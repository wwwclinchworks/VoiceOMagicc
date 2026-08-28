# Admin production handover matrix

## Authentication

- Open `/adminadmin.html` in a fresh private window.
- Login with the configured administrator password.
- Confirm a successful login creates the secure `vom_admin` session cookie.
- Confirm an incorrect password is rejected and repeated failures are rate-limited.
- Log out and confirm the session is invalidated.

## CMS sections

Verify each section can load, edit, save, reload, and preserve unrelated sections:

1. Page Copy
2. Featured Video
3. Resources
4. Speaker Toolkit
5. Books
6. Weekly Highlights
7. Version History / Restore

## Weekly Highlights

- Exactly two slots are shown.
- Image preview does not steal input focus while typing.
- A published slot without a valid HTTPS URL is rejected.
- A non-HTTPS URL is rejected.
- Save succeeds and reload returns the saved values.
- Save All Changes also persists changed Weekly Highlights.
- Dashboard refreshes do not remove the Weekly Highlights controls.
- Unpublished slots remain hidden on public pages.

## Production routing

- `/resources` permanently redirects to `/resources.html`.
- `/resources/` permanently redirects to `/resources.html`.
- `/resources.html` is the only canonical public Resources document.
- HTML and CMS API responses are not served from a stale cache.

## Deployment source of truth

- GitHub `main` is the only source of production code.
- Cloudflare Worker `voiceomagicc` is the production runtime.
- Do not use the Cloudflare dashboard editor for permanent source modifications.
