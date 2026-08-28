# Cloudflare Workers deployment

Voice-O-Magic is deployed as a Cloudflare Worker with Workers Static Assets. The Worker serves the static website and owns the production API, CMS, authentication, and canonical routing.

## Production source of truth

- GitHub repository: `wwwclinchworks/VoiceOMagicc`
- Production branch: `main`
- Worker entrypoint: `worker-entry.js`
- Worker implementation: `worker.js`
- Static assets: repository root, excluding runtime-only files through `.assetsignore`
- CMS source of truth: `data/knowledge.json`
- Canonical Resources URL: `/resources.html`

Permanent production source changes must be made in GitHub and deployed through the connected Cloudflare build. Do not use the Cloudflare dashboard editor for permanent source changes on the Git-managed Worker.

## Required secrets

Add these as **Cloudflare Worker Secrets**. Never commit their values:

- `CMS_ADMIN_PASSWORD_HASH`
- `CMS_SESSION_SECRET`
- `CMS_GITHUB_TOKEN`
- `OPENROUTER_API_KEY`

The CMS also accepts these optional non-secret variables:

- `CMS_GITHUB_REPO` — defaults to `wwwclinchworks/VoiceOMagicc`
- `CMS_GITHUB_BRANCH` — defaults to `main`
- `CMS_GITHUB_PATH` — defaults to `data/knowledge.json`

For the GitHub token, use a fine-grained token restricted to this repository with the minimum `Contents: Read and write` permission required by the CMS.

## Runtime routes

- `/api/chat`
- `/api/chat?mode=public-cms`
- `/api/chat?mode=admin-login`
- `/api/chat?mode=admin-data`
- `/api/chat?mode=admin-save`
- `/api/chat?mode=admin-restore`
- `/api/chat?mode=admin-logout`
- `/api/weekly-highlights` — protected admin endpoint
- `/resources` → permanent redirect to `/resources.html`
- `/resources/` → permanent redirect to `/resources.html`

## CMS behavior

Public pages read live CMS data through `/api/chat?mode=public-cms` with no-store semantics. The public client filters unpublished items before rendering. Weekly Highlights uses the public CMS snapshot for public rendering and the protected `/api/weekly-highlights` endpoint for admin editing.

HTML responses are served with no-store/no-cache headers so CMS changes are not delayed by an HTML CDN/browser cache. Static JS, CSS, images, and fonts remain cacheable as ordinary assets.

## Verification

After every production deployment:

1. Confirm the active Cloudflare deployment corresponds to the merged `main` commit.
2. `GET /api/chat?mode=public-cms` returns JSON with `cms`.
3. `/resources` resolves directly to `/resources.html` through the Worker redirect.
4. `/resources.html` renders the current published Weekly Highlights, Featured Video, and Resources.
5. Admin login succeeds and creates the secure session cookie.
6. Page Copy, Featured Video, Resources, Speaker Toolkit, Books, and Weekly Highlights can be saved and reloaded without overwriting unrelated sections.
7. Version History loads and restore creates a new CMS commit.
8. Unpublished content remains hidden from public responses and pages.
9. Mobile and desktop layouts render without horizontal overflow or broken image frames.
10. AI chat responds when `OPENROUTER_API_KEY` is configured.

The repository no longer depends on the legacy Vercel `api/` runtime for production.
