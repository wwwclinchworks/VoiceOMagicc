# Voice-O-Magic Production Handover

## Runtime

- Production runtime: Cloudflare Workers
- Worker entry: `worker.js`
- Static assets: repository root via Wrangler
- Production branch: `main`
- CMS source of truth: `data/knowledge.json` in GitHub

## Required Cloudflare Worker secrets

- `CMS_GITHUB_TOKEN`
- `CMS_SESSION_SECRET`
- `CMS_ADMIN_PASSWORD_HASH`
- `OPENROUTER_API_KEY`

Never commit these values to the repository.

## CMS smoke-test matrix

After every production deployment, verify:

1. Admin login succeeds with the configured administrator password.
2. Admin data loads and Version History is visible.
3. Page Copy can be changed, saved, reloaded, and reflected on the public page.
4. Featured Video can be changed, saved, reloaded, and reflected on Resources.
5. Resources can be added, edited, reordered, published/hidden, deleted, saved, and reflected on Resources.
6. Speaker Toolkit can be added, edited, published/hidden, deleted, saved, and reflected on Resources.
7. Books can be added, edited, published/hidden, deleted, saved, and reflected on Books.
8. Weekly Highlights supports exactly two slots; each published slot requires a valid HTTPS image URL.
9. Weekly Highlights image/title/description changes appear on Resources without requiring a content redeploy.
10. An unpublished highlight is absent from the public page.
11. Admin Save All and section-specific saves preserve unrelated CMS sections.
12. Version History contains the resulting CMS commit and restore remains functional.
13. Public pages continue to load if the CMS endpoint is temporarily unavailable because static HTML remains the fallback.
14. AI chat still responds when `OPENROUTER_API_KEY` is configured.

## Automated QA

Run the repository quality workflow and review the PR before merging. At minimum, the workflow must pass JavaScript syntax checks, JSON validation, local-reference checks, security checks, and the live-CMS regression checks.

## Deployment verification

The Cloudflare deployment must use the merged `main` commit. A successful GitHub merge alone is not considered a production verification. Confirm the deployed Worker revision and then perform the public Resources/Books/Admin smoke-test matrix above.
