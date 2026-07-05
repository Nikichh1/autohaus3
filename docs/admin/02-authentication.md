# 02 · Authentication & Sessions

Implemented with **Better Auth** (self‑hosted, data in our Postgres). Every capability below
maps to a Better Auth core feature or first‑party plugin, so this is configuration + UI, not
cryptography we hand‑roll.

## 1. Where it lives & how staff reach it

- The admin is at **`/admin`**. The public site links to it only from a discreet footer/owner
  area; staff bookmark it. It is **not** indexed (`robots`, `X‑Robots‑Tag: noindex`).
- Unauthenticated requests to any `/admin/**` route are redirected by **middleware** to
  `/admin/login?next=<path>`. After login the user returns to `next`.
- Optionally hardened behind a vanity path or Cloudflare Access / IP allowlist for the owner.

```
middleware.ts
  match /admin/:path*  (except /admin/login, /admin/reset, /admin/verify)
  → read session cookie → validate → if none: redirect to /admin/login
  → attach { userId, role } to request headers for downstream RSC
```

## 2. Login page (`/admin/login`)

- Email + password. Passwords hashed with **scrypt/argon2** (Better Auth default), never stored
  reversibly.
- Optional **passkey / WebAuthn** sign‑in (Better Auth passkey plugin) — phishing‑resistant,
  ideal for the Owner/Super Admin.
- Generic error copy ("Invalid email or password") — never reveal whether the email exists.
- **Rate limited**: 5 attempts / 15 min / IP+email, then exponential backoff + optional CAPTCHA
  (hCaptcha). Failed attempts recorded in `LoginAttempt` (see security doc).
- On success: if 2FA enabled → step to TOTP challenge; else create session.

## 3. Password reset

- "Forgot password" → enter email → **always** show the same "if an account exists, we sent a
  link" message (no account enumeration).
- A single‑use, 60‑minute, hashed token (`PasswordResetToken`) emailed via Resend.
- Reset page enforces password policy (≥12 chars, zxcvbn strength ≥3, breach check via
  HaveIBeenPwned k‑anonymity API). On success: invalidate **all** sessions + all reset tokens,
  email a "your password was changed" notice, write audit log.

## 4. Email verification

- New staff are **invited** by an admin (no public signup). Invite creates a user in
  `status=invited` with a single‑use invite token (72h).
- Accepting the invite verifies the email, sets the password (or registers a passkey), and
  activates the account. Unverified accounts cannot sign in.
- Email‑change flows require verifying the new address before it becomes active.

## 5. Two‑factor authentication (2FA)

- **TOTP** (Google Authenticator/1Password/Authy) via Better Auth twoFactor plugin: enrollment
  shows a QR + secret, confirmed by entering a live code.
- **10 single‑use recovery codes** generated at enrollment (shown once, stored hashed).
- **Step‑up auth**: re‑prompt for 2FA before high‑risk actions (deleting vehicles in bulk,
  changing roles, editing billing/settings, exporting CRM) even within a valid session.
- 2FA can be **required by role policy** — e.g. Super Admin, Owner, Accountant must have it;
  enforced at login and surfaced as a setup nag until completed.
- WebAuthn passkeys count as a second factor (and can be the primary factor).

## 6. Session management

- **Server‑side sessions** (Better Auth): opaque session id in a cookie that is
  `HttpOnly; Secure; SameSite=Lax; Path=/`. No JWT in the browser → instant server‑side
  revocation.
- Defaults: **rolling 7‑day** session, **30‑day absolute** max; idle timeout 2h for
  privileged roles. Sliding refresh on activity.
- A **Sessions** screen in account settings lists every active session: device, browser, OS,
  IP, approximate location (GeoIP), last‑seen, "this device" marker. Each is individually
  revocable; "Sign out everywhere" nukes all but the current.
- Admins can view & revoke **other users'** sessions, force‑logout, and **impersonate**
  (Better Auth admin plugin) — impersonation is fully audit‑logged and time‑boxed.
- Session records persist in Postgres so they survive deploys and can be queried for the
  security dashboard (login history, concurrent sessions).

## 7. Remember device / trusted devices

- "Remember this device for 30 days" on the 2FA step sets a separate, signed **device token**
  (`TrustedDevice` row: device fingerprint hash, label, expiry). On that device, 2FA is skipped
  for the trust window (login still required).
- Trusted devices are listed and individually revocable; a password reset or role change clears
  all trust tokens. A new untrusted device triggers a "new sign‑in" email alert.

## 8. Logout

- Clears the session cookie and **deletes the server session row** (true logout, not just
  client‑side cookie drop). "Sign out everywhere" iterates all sessions for the user.
- Logout is also triggered server‑side on: password change, role downgrade, account
  suspension/ban, or admin force‑logout.

## 9. Account lifecycle & states

`invited → active → (suspended | locked) → deactivated`

- **Locked**: too many failed logins → temporary lock + email; auto‑unlock after cooldown or
  admin unlock.
- **Suspended/Banned**: admin action; sessions killed immediately, login refused.
- **Deactivated**: soft‑delete; user retained for audit‑log attribution but cannot authenticate.
  Hard deletion only via a separate GDPR erase flow that anonymizes references.

## 10. Auth-related audit events

Every event below writes to `AuditLog` and (where relevant) `LoginAttempt`:
sign‑in success/failure, 2FA enroll/disable, recovery‑code use, password reset request/complete,
session revoke, device trust grant/revoke, impersonation start/stop, role change, lock/unlock,
invite sent/accepted, email change.
