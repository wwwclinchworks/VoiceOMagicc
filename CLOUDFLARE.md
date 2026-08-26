# Cloudflare Workers deployment

Voice-O-Magic now supports deployment as a Cloudflare Worker with Workers Static Assets. The Worker serves the existing static website and handles the backend routes that were previously provided by Vercel serverless functions.

## Required secrets

Add these as **Cloudflare Worker Secrets**. Do not commit their values:

- `CMS_ADMIN_PASSWORD_HASH`
- `CMS_SESSION_SECRET`
- `CMS_GITHUB_TOKEN`
- `OPENROUTER_API_KEY`

The CMS also accepts these optional non-secret variables:

- `CMS_GITHUB_REPO` — defaults to `wwwclinchworks/VoiceOMagicc`
- `CMS_GITHUB_BRANCH` — defaults to `main`
- `CMS_GITHUB_PATH` — defaults to `data/knowledge.json`

For the GitHub token, use a fine-grained token restricted to this repository with the minimum `Contents: Read and write` permission required by the CMS.

## Deployment

1. Create a Cloudflare Worker using this repository.
2. Deploy with Wrangler or connect the repository through Cloudflare's Workers build/deploy integration.
3. Add the four secrets above under **Settings → Variables and Secrets**.
4. Keep the Worker bound to the static assets directory configured in `wrangler.jsonc`.
5. Attach `voiceomagic.clinchworks.in` to the Worker after the deployment passes smoke tests.

The Worker exposes:

- `/api/chat`
- `/api/chat?mode=public-cms`
- `/api/chat?mode=admin-login`
- `/api/chat?mode=admin-data`
- `/api/chat?mode=admin-save`
- `/api/chat?mode=admin-restore`
- `/api/chat?mode=admin-logout`
- `/api/weekly-highlights`

## Verification

After deployment:

- `GET /api/chat?mode=public-cms` should return the public CMS document.
- `GET /api/chat?mode=admin-data` should return `401 Unauthorized` before login.
- `/adminadmin` should load the Admin UI.
- Admin login should create an HttpOnly, Secure, SameSite session cookie.
- CMS saves should update `data/knowledge.json` through the GitHub API.
- Weekly Highlights saves should update only the `weeklyHighlights` CMS section.
- The public Resources page should render only published highlights.

Do not remove the existing Vercel deployment until these checks pass on Cloudflare and the custom domain has been switched successfully.
