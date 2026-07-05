# 06 · Security Model

Security is layered: network → auth → authorization → input → data → audit. No single control
is load‑bearing.

## 1. Audit & activity logging

- **`AuditLog`** captures every state change: actor (id + denormalized email so the record
  survives user deletion), action key, entity type/id, `before`/`after` JSON diff, IP, user
  agent, timestamp. Written inside the same transaction as the change → no change without a log.
- **`LeadActivity`** is the CRM‑level activity stream; **`CmsVersion`** is content history.
- Audit logs are **append‑only**: no UPDATE/DELETE grants on the table; retention via partition
  drop, not row deletion. Even Super Admin cannot edit them (only export/archive).
- **Audit viewer** (`/admin/settings/audit`): filter by actor, action, entity, date; export.

## 2. Login & access history

- **`LoginAttempt`** records every attempt (success/failure, reason, IP, UA). Powers:
  - failed‑login rate limiting + account lockout,
  - "recent sign‑in activity" on the user's account page,
  - a **security dashboard**: failed logins over time, new‑country sign‑ins, concurrent
    sessions, impossible‑travel flags.
- **`Session`** rows give live "who's logged in", device/IP/location, and one‑click revoke.
- **IP history** per user; optional **IP allowlist** for privileged roles; new‑device email alerts.

## 3. Rate limiting

- Centralized limiter on Redis (Upstash) sliding window:
  - Login: 5 / 15 min per IP+email, then backoff + CAPTCHA.
  - Password reset / invite: 3 / hour per email.
  - Public lead capture: 5 / min per IP + honeypot + Turnstile.
  - Mutating server actions: per‑user burst caps; presign endpoint capped per user.
  - Global per‑IP ceiling at the edge (middleware) to blunt scraping/DoS.
- Vercel/Cloudflare WAF in front for L7 DoS; Cloudflare Turnstile for bot defense on public forms.

## 4. CSRF

- Server Actions are same‑origin and Next validates the `Origin` header; the session cookie is
  `SameSite=Lax`. For any state‑changing **Route Handler**, require a double‑submit CSRF token
  (or the Origin/Referer check) — never rely on cookies alone for cross‑site‑capable endpoints.

## 5. XSS

- React escapes by default. **No `dangerouslySetInnerHTML`** except for CMS rich text, which is
  **sanitized server‑side** (`sanitize-html`/DOMPurify with a strict allowlist) on write *and*
  render. Tiptap output is stored as structured JSON, not raw HTML, eliminating most vectors.
- Strict **Content‑Security‑Policy** (nonce‑based, no `unsafe‑inline`), plus
  `X‑Content‑Type‑Options: nosniff`, `Referrer‑Policy`, `X‑Frame‑Options: DENY`,
  `Permissions‑Policy`, HSTS. Uploaded SVGs are sanitized or served from a separate origin.

## 6. SQL injection

- **Prisma** parameterizes all queries; no string‑built SQL. The rare `$queryRaw` uses tagged
  templates (parameterized) only. Inputs validated by **Zod** before reaching the DB. Postgres
  least‑privilege roles: the app role can't DROP/ALTER; migrations run as a separate role.

## 7. Input validation & file safety

- One **Zod** schema per entity validates on client and server (the server is authoritative).
- Uploads: MIME allowlist, magic‑byte sniff (not just extension), size caps per role, image
  re‑encoding strips metadata/embedded scripts, documents scanned (ClamAV/Cloud AV hook),
  served with `Content‑Disposition: attachment` + nosniff. Files live on a separate domain
  (R2/Cloudinary), not the app origin.

## 8. Secrets & data protection

- Secrets in Vercel env / a vault, never in the repo. Integration API keys encrypted at rest
  (AES‑GCM via a KMS‑held key), write‑only in the UI (masked after save).
- **2FA secrets** and recovery codes encrypted/hashed. Passwords argon2/scrypt.
- TLS everywhere; Postgres connections over TLS. PII (lead contact data) access is
  permission‑gated and export is logged. GDPR: consent capture, data export, and right‑to‑erase
  flow that anonymizes (not breaks) audit references.

## 9. Backups & recovery

- **Postgres**: managed PITR (Neon/Supabase) — continuous WAL, 7–30 day restore window; nightly
  logical `pg_dump` to R2 (separate account/region) with retention; **restore drills** quarterly.
- **Media**: R2 versioning + lifecycle rules; Cloudinary keeps originals.
- **Config/secrets**: documented, reproducible from IaC; env backed up in the vault.
- Documented **RPO ≤ 5 min / RTO ≤ 1 h**; runbook for restore.

## 10. Hardening checklist & governance

- Dependency scanning (Dependabot/`pnpm audit`), SAST in CI, secret scanning (gitleaks),
  Sentry for runtime anomalies.
- Least‑privilege everywhere; principle enforced in code review.
- Admin not indexed (`noindex`, robots), optionally IP/Access‑gated.
- Step‑up 2FA on destructive/financial actions; impersonation time‑boxed + logged.
- Periodic access review (who has which role), automatic deactivation of dormant accounts.
- Incident response runbook; security headers verified in CI (e.g. `@vercel/edge` + tests).
