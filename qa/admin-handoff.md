# Admin handoff smoke test

1. Open `/adminadmin.html` in a private window.
2. Confirm login works with the configured administrator password.
3. Confirm the dashboard loads Page Copy, Featured Video, Resources, Speaker Toolkit, Books, Weekly Highlights, and Version History.
4. Change each section independently, save it, reload Admin, and confirm the change persisted.
5. Change Weekly Highlights, confirm both previews remain stable while typing, then use Save Weekly Highlights.
6. Change Weekly Highlights and another CMS section, use Save All Changes, reload, and confirm both changes persisted.
7. Rebuild/refresh the dashboard through another save and confirm Weekly Highlights remains present.
8. Restore an older version and confirm the restored CMS appears in Admin and on public pages.
9. Log out and confirm Admin data is unavailable without a new login.
10. Confirm `/resources` redirects to `/resources.html` and the public page reflects published CMS data.
