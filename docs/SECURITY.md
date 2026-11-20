# Security controls and verification

## Profile confidentiality

Anonymous visitors can submit a registration and retrieve public form definitions. Anonymous bootstrap contains no profiles. `/api/search`, `/api/member-options`, `/api/member-portraits/:id` and `/api/avatars/:key` require an active staff session before validating selectors or reading records/images. This applies to every group, including adults. API responses use `Cache-Control: no-store`.

Manager reads all groups, Admin edits profiles and approves pending submissions, and Dev administers staff accounts. The documented exception allowing staff intake to create an approved registration remains. Account roles are always read from the database, never from request payloads.

## Passwords and sessions

Production never creates a Dev account from the local bootstrap credential and refuses that credential. Existing rotated hashes are preserved. Provision a production Dev through an authenticated operator procedure; never add production credentials to source or client environment variables.

Login holds an account row lock through password verification and session insertion. Password changes/resets serialize against that lock and revoke all sessions. Session cookies are random, hashed in the database, expire after eight hours, and use HttpOnly/SameSite Strict plus Secure in production. No password/hash is returned by account APIs.

The browser clears private dialogs when the session changes or disappears, and clears management data immediately on a 401 response. Server checks remain authoritative.

## Request identity and storage

Only the server-selected Vercel runtime trusts the platform's `x-vercel-forwarded-for` header; it must be a valid IP address. Non-Vercel requests ignore forwarding headers and use the socket fallback. Do not enable broad Express `trust proxy`. Lookup quotas use staff account IDs, while registration/login quotas use the validated adapter identity. A new hosting topology requires a reviewed identity adapter.

Supabase uses the private `phat_hao` schema, RLS and revoked anon/authenticated access. R2 is accessed through the server, with random image keys and image decoding/reencoding before storage. Verify bucket public-domain settings and provider-account MFA separately; an authenticated S3 client does not prove that an optional public R2 domain is disabled.

## Regression checks

- `npm test`: role matrix, anonymous profile/portrait denial, production bootstrap restrictions, concurrent login/reset and login/password-change revocation, account-scoped quotas, forged forwarding-header rejection and existing data/schema behavior.
- `npm run typecheck` and `npm run build`: source compatibility and deployment trace exclusion of `.local`, environment files and tests.
- `npm audit`: dependency advisory check; zero reported advisories is time-specific, not proof of absence of vulnerabilities.
- Browser fixture: private profile dialogs disappear on anonymous bootstrap and 401 transitions; use dummy data and intercept API requests.

Next 16.4.6, body-parser 2.4.0 and qs 6.17.1 replace the previously flagged versions. Unused Next image optimization is disabled. See [Next advisory](https://github.com/advisories/GHSA-2464-fhr4-w9xw), [body-parser advisory](https://github.com/advisories/GHSA-27r3-jxmh-p828), and [Next cache advisory](https://github.com/advisories/GHSA-rhh4-g77r-r9qj).

Deployment checks must use status-only anonymous requests and owner-observed provider configuration. Do not expose real profiles, attempt real passwords or stress shared services. Keep local secrets/backups private and out of Git; generated analysis artifacts belong outside published source.
