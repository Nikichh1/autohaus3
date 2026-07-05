# AutoHaus Admin — Production Architecture Blueprint

> Enterprise admin platform for the AutoHaus marketplace (Plovdiv). Designed to let
> non‑technical staff manage hundreds–thousands of vehicles, all website content,
> leads, media and settings without touching code.

This folder is the complete design. It is written to be handed directly to a developer
(or to Claude Code) and built phase by phase.

## Documents

| # | File | Contents |
|---|------|----------|
| 0 | `README.md` (this file) | Executive summary, stack & rationale, system map |
| 1 | `01-architecture.md` | Data flow, caching, uploads, image pipeline, pagination, search, performance |
| 2 | `02-authentication.md` | Login, password reset, email verification, 2FA, sessions, device trust, logout |
| 3 | `03-roles-permissions.md` | 10 roles, permission catalog, full matrix, storage & enforcement |
| 4 | `schema.prisma` | Complete, buildable Prisma schema (PostgreSQL) |
| 5 | `05-features.md` | Dashboard, Vehicles, CMS, Media, CRM, Analytics, Notifications, Settings |
| 6 | `06-security.md` | Audit logs, login history, rate limiting, CSRF/XSS/SQLi, backups, hardening |
| 7 | `07-ui-ux.md` | Design system, navigation, tables, command palette, shortcuts, dark mode, a11y |
| 8 | `08-folder-structure.md` | Exact repository layout |
| 9 | `09-implementation-plan.md` | 8 phases, milestones, effort, team, acceptance criteria |

## Context: what exists today

The current site (the "frontend prototype") is:

- **Next.js 16.2.6 (App Router) · React 19 · TypeScript 5 · Tailwind v4**
- `framer-motion`, `lenis` (smooth scroll), `lucide-react`
- **Static data** — inventory lives in `data/vehicles.ts`, services in `data/services.ts`,
  contact/nav in `lib/nav.ts`. There is **no database, no backend, no auth**.
- Bilingual reality: content is primarily **Bulgarian** (e.g. `bodyType: "Седан"`); the URL
  scheme is Bulgarian (`/avtomobili`, `/pod-naem`, `/serviz`, `/za-nas`…).
- **Multi-business**: cars (avtomobili), rental (pod‑naem), service (serviz), Auto Spa,
  café‑bar (kafe‑bar), biscuits (bisquitki), leasing (lizing), insurance (zastrahovki),
  careers (kariera), news (novini), contacts (kontakti).
- A bespoke **image pipeline** already exists (`scripts/gen-variants.mjs`, `sharp`,
  pre‑generated width variants, custom `image-loader.ts`). The media subsystem must respect this.

**Design consequence:** the admin is not a greenfield app bolted on — it replaces the static
`data/*.ts` files with a database the public site reads from, and adds a CMS layer over the
hardcoded copy. The public site keeps its current rendering model (Server Components, ISR).

## The stack (and why)

| Concern | Choice | Why this and not the alternative |
|---|---|---|
| Framework | **Next.js 16 App Router** (keep) | Already in use; Server Components + Server Actions give us colocated, type‑safe mutations and streaming. One deploy target for public site + admin. |
| Language | **TypeScript (strict)** | End‑to‑end types from DB → API → UI via Prisma + Zod. Non‑negotiable for a team. |
| DB | **PostgreSQL** (Neon or Supabase) | Relational integrity for vehicles↔media↔leads↔users; JSONB for flexible specs/CMS; full‑text + `pg_trgm` search; row‑level everything we need without a second store. Neon = serverless branching that matches Vercel previews. |
| ORM | **Prisma** | Type‑safe queries, migrations, studio for ops. Prisma MCP is available in this workspace. Schema is the single source of truth. |
| Auth | **Better Auth** | First‑class, self‑hosted plugins for exactly the asks: **2FA (TOTP)**, **organization/RBAC**, **admin (impersonation, ban)**, **device/session management**, **passkeys**, **rate‑limiting**. No per‑MAU pricing, data stays in our Postgres. Auth.js v5 is the fallback but 2FA/device‑trust/RBAC are roll‑your‑own there. |
| UI kit | **shadcn/ui + Radix + Tailwind v4** | Accessible primitives we own (copied in, not a dependency black box). Matches the Linear/Vercel aesthetic the brief targets. Works with the existing Tailwind v4 setup. |
| Client data | **TanStack Query** | For the interactive admin (tables, optimistic bulk actions, infinite scroll, background refetch). Server Components handle first paint; Query handles the live grid. |
| Forms + validation | **React Hook Form + Zod** | One Zod schema validates on client *and* server action *and* types the DB write. |
| File storage | **Cloudflare R2** (S3‑compatible) + presigned uploads | Zero egress fees (image‑heavy catalog), S3 API so portable. UploadThing is the faster‑to‑ship alternative for v1. |
| Image processing | **Cloudinary** (managed) *or* self‑hosted `sharp` worker | The brief demands auto‑WebP, cropping, and "replace without breaking URLs" — Cloudinary does all three natively via transformation URLs. Self‑hosted reuses the existing `sharp` pipeline if avoiding SaaS. |
| Cache / rate‑limit / realtime fan‑out | **Redis (Upstash)** | Session cache, rate‑limit counters, hot dashboard aggregates, pub/sub for notifications. Serverless‑friendly. |
| Background jobs | **Inngest** | Serverless‑native (works on Vercel) durable jobs: image derivatives, email sends, analytics rollups, reminder dispatch. Avoids a long‑running BullMQ worker. |
| Email | **Resend + React Email** | Transactional (verify, reset, lead alerts, digests) authored as React components. |
| Realtime notifications | **Pusher / Ably** (or Postgres `LISTEN/NOTIFY`→SSE) | In‑app toast + bell badge without managing socket infra. |
| Search (instant) | **Postgres FTS + `pg_trgm`** v1 → **Typesense/Meilisearch** at scale | Inventory volume (hundreds–thousands) fits Postgres comfortably; add a search engine only when typo‑tolerant instant search across all entities is needed. |
| Product analytics | **PostHog** + first‑party event tables | Funnels, retention, top‑viewed vehicles, session replay. Self‑hostable. |
| Errors / tracing | **Sentry** | Source‑mapped exceptions + performance for app and server actions. |
| Hosting | **Vercel** (keep) | Already deployed there; preview deploys per PR; edge middleware for auth gating. |

### Why a database replaces `data/*.ts`

Today a new car requires a developer to edit `data/vehicles.ts` and redeploy. The whole point
of this project is to remove that. After Phase 2, `data/vehicles.ts` becomes a **seed file**;
the public site reads vehicles from Postgres via a cached data layer, and the admin writes to it.
ISR + on‑demand revalidation keeps the public site as fast as the static version.

## System map

```
                          ┌────────────────────────────────────────────┐
                          │                 Vercel                     │
                          │                                            │
  Public visitor ───────▶ │  Public site (RSC, ISR)  ◀── revalidate ──┐│
                          │     reads via cached data layer           ││
                          │                                           ││
  Staff (browser) ──────▶ │  /admin  (RSC + Client islands)           ││
                          │     middleware: session + RBAC gate       ││
                          │     Server Actions / Route Handlers       ││
                          └───────────┬───────────────────────┬──────┘│
                                      │                       │       │
                       ┌──────────────▼──┐   ┌────────────────▼─────┐ │
                       │  PostgreSQL      │   │  Redis (Upstash)     │ │
                       │  (Neon) +Prisma  │   │  cache·ratelimit·pub │ │
                       └──────────────────┘   └──────────────────────┘ │
                                      │                                 │
        ┌────────────┬───────────────┼──────────────┬─────────────┐    │
        ▼            ▼               ▼              ▼             ▼     │
   Cloudflare R2  Cloudinary    Inngest         Resend        Pusher ──┘
   (originals)   (transforms)  (jobs/queues)   (email)      (realtime)
        │
        └─ PostHog (analytics) · Sentry (errors) — client + server SDKs
```

Start with `01-architecture.md`.
