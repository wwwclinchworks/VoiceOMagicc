# Security configuration

The admin login requires `CMS_ADMIN_PASSWORD_HASH` and `CMS_SESSION_SECRET` in the deployment environment.

Generate the password hash locally without storing the plaintext password in the repository:

```bash
node scripts/generate-admin-password-hash.mjs
```

Set the generated `CMS_ADMIN_PASSWORD_HASH` value in the production environment and keep it out of source control.

`CMS_SESSION_SECRET` must contain at least 32 random characters and should also remain an environment secret.
