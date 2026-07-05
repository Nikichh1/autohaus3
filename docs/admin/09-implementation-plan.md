# 09 · Implementation Plan

Sequenced so something usable ships early and risk is front‑loaded (auth + data layer first).
Estimates assume **2 engineers** (1 senior full‑stack, 1 mid) + part‑time design/QA. Solo, roughly
double the calendar time.

## Phase 0 — Foundations (½–1 week)
- Provision Postgres (Neon), Redis (Upstash), R2, Resend, Cloudinary, PostHog, Sentry; secrets in Vercel.
- Add Prisma, Better Auth, shadcn/ui, TanStack Query/Table, Zod, Inngest. Move public pages into
  `app/(public)/`. Set up CI (typecheck, lint, test, migrate‑check), Storybook.
- **Done when:** `prisma migrate dev` runs the schema; CI green; admin shell renders behind a stub gate.

## Phase 1 — Auth & RBAC (1–1.5 weeks)
- Better Auth: credentials + passkeys, email verify, password reset, **TOTP 2FA**, sessions,
  trusted devices, invites. Middleware gate + `authorize()`. Seed roles/permissions + super admin.
- Account screens: profile, sessions, 2FA setup, security activity. User/role management UI.
- **Done when:** an invited user with a role can log in, 2FA works, sessions are revocable, every
  auth event is audited, and `authorize()` blocks unpermitted actions (with tests).

## Phase 2 — Data layer & Vehicle Management (2–3 weeks) ← core value
- Migrate `data/vehicles.ts` → DB (seed). Public site reads via `lib/data` (ISR + tags).
- Vehicle list (table/gallery/kanban, filters, saved views, bulk actions), tabbed editor with
  autosave drafts, lifecycle (publish/reserve/sell/archive/duplicate/delete), FTS + keyset
  pagination, internal notes, history/audit timeline, approval queue.
- **Done when:** staff can do the full vehicle lifecycle with zero code, and the public site
  reflects changes within seconds of publish. **This phase alone justifies the project.**

## Phase 3 — Media Library (1.5–2 weeks)
- Presigned direct‑to‑R2 uploads, Inngest derivative/WebP/blurhash/dedupe pipeline, folders/tags/
  search, crop/focal‑point, drag‑drop gallery sorting on vehicles, replace‑in‑place, "used in".
- Import existing remote `autohaus.bg` images into the library.
- **Done when:** a Photographer can upload, organize, edit, and attach images; replacing an image
  never breaks a public URL.

## Phase 4 — CRM / Leads (1.5–2 weeks)
- Public form → `/api/leads` (rate‑limit + Turnstile) → DB + notify. Pipeline kanban + table,
  assignment, activity timeline, notes, reminders→calendar, email via Resend, convert‑to‑sold,
  exports. Lead analytics wiring.
- **Done when:** every inquiry appears instantly, is assignable/trackable end‑to‑end, and feeds
  conversion metrics.

## Phase 5 — CMS (2 weeks)
- `CmsPage/Block/Seo/Version` model, block editor (Tiptap), per‑locale BG/EN, SEO/OG/JSON‑LD
  panels, versioning + revert, scheduled publish, edit‑in‑place mode. Wire public pages to read
  blocks (home hero, footer, nav, about, contact, FAQ, services).
- **Done when:** the Owner can edit any homepage/footer/SEO text and publish without a deploy.

## Phase 6 — Analytics, Notifications, Settings (1.5–2 weeks)
- First‑party events (`VehicleView`, `SearchQuery`) + PostHog dashboards; `DailyMetric` nightly
  rollup; analytics UI (traffic, funnel, top vehicles, search terms, abandoned).
- Realtime notifications (in‑app/email/push) + preferences. All Settings groups + integration
  connectors with connection tests.
- **Done when:** dashboards are live, staff get real‑time alerts, and branding/contact/hours/tax
  are editable and reflected publicly.

## Phase 7 — Hardening & launch (1–1.5 weeks)
- Security pass (headers/CSP, rate limits, audit coverage, file scanning, RLS on sensitive tables),
  backups + restore drill, load test, a11y audit, Playwright e2e across roles, runbooks, training
  docs for staff. Penetration test.
- **Done when:** security checklist (doc 06) fully green, backups verified by a real restore, and
  staff are trained.

---

### Timeline summary

| Phase | Scope | Est. (2 eng) |
|---|---|---|
| 0 | Foundations | 0.5–1 wk |
| 1 | Auth & RBAC | 1–1.5 wk |
| 2 | Data layer + Vehicles | 2–3 wk |
| 3 | Media library | 1.5–2 wk |
| 4 | CRM / Leads | 1.5–2 wk |
| 5 | CMS | 2 wk |
| 6 | Analytics + Notifications + Settings | 1.5–2 wk |
| 7 | Hardening + launch | 1–1.5 wk |
| | **Total** | **~11–15 weeks** |

### Sequencing logic
1. **Auth/RBAC before features** — security can't be retrofitted.
2. **Vehicles before everything else** — it's the core value and unblocks the public‑site DB migration.
3. **Media before/with vehicles** — vehicles need images; the gallery sorter depends on it.
4. **CMS and Analytics later** — high value but not blocking day‑1 inventory operations.
5. **Hardening as a dedicated phase** — not "we'll secure it later".

### Definition of done (platform)
Non‑technical staff can manage 100% of vehicles, content, media, leads, and settings without a
developer; every change is permission‑checked and audited; the public site stays fast (ISR); and
the system passes the security checklist with verified backups.

### Team & ongoing
- Build: 1 senior + 1 mid engineer, ~3–4 months; part‑time product designer + QA.
- Run: ~€200–600/mo infra at this scale (Neon, Upstash, R2, Cloudinary, Resend, PostHog, Sentry,
  Vercel Pro) — far below the platform's value. Budget for monitoring + quarterly security review.
