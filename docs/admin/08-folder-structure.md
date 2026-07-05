# 08 · Repository Structure

Extends the **existing** Next.js app (keeps the current public site under route groups). New
admin code is isolated in `app/(admin)` + `lib/`, sharing types with the public site.

```
autohaus/
├─ app/
│  ├─ (public)/                     # existing marketing site, moved into a route group
│  │  ├─ page.tsx  layout.tsx
│  │  ├─ avtomobili/ … pod-naem/ serviz/ …   # now read from DB via lib/data
│  │  └─ …
│  │
│  ├─ (admin)/
│  │  └─ admin/
│  │     ├─ layout.tsx              # admin shell: sidebar, topbar, ⌘K, providers
│  │     ├─ page.tsx                # dashboard
│  │     ├─ login/ reset/ verify/ accept-invite/   # auth screens (outside the gate)
│  │     ├─ vehicles/
│  │     │  ├─ page.tsx             # list (table/gallery/kanban)
│  │     │  ├─ new/page.tsx
│  │     │  └─ [id]/page.tsx        # tabbed editor
│  │     ├─ leads/  [id]/
│  │     ├─ content/ [page]/        # CMS
│  │     ├─ media/
│  │     ├─ analytics/
│  │     └─ settings/
│  │        ├─ branding/ contact/ hours/ tax/ financing/ integrations/
│  │        ├─ users/ roles/ sessions/ audit/ security/
│  │
│  └─ api/
│     ├─ auth/[...all]/route.ts     # Better Auth handler
│     ├─ leads/route.ts             # public lead capture (rate-limited)
│     ├─ media/presign · complete/  # direct-to-R2 uploads
│     ├─ webhooks/{resend,inngest,cloudinary}/route.ts
│     ├─ inngest/route.ts           # background jobs entry
│     ├─ notifications/sse/route.ts # realtime
│     └─ search/route.ts            # ⌘K / FTS
│
├─ lib/
│  ├─ auth/                         # better-auth config, authorize(), permission catalog, session helpers
│  ├─ db.ts                         # Prisma client singleton
│  ├─ repositories/                 # data access (Prisma only)
│  ├─ services/                     # business logic (framework-agnostic, unit-tested)
│  ├─ actions/                      # server actions: authz + validate + audit + revalidate
│  ├─ data/                         # cached read layer for the PUBLIC site
│  ├─ validation/                   # Zod schemas (shared client/server)
│  ├─ jobs/                         # Inngest function definitions
│  ├─ cache.ts ratelimit.ts         # Redis helpers
│  ├─ audit.ts                      # writeAuditLog()
│  ├─ email/                        # React Email templates + Resend
│  ├─ storage/                      # R2/Cloudinary clients, presign, image variants
│  ├─ analytics/                    # PostHog + first-party event capture
│  ├─ labels.ts nav.ts utils.ts motion.ts   # existing — reused
│  └─ rbac/                         # role/permission seed + effective-set resolver
│
├─ components/
│  ├─ (existing public components …)
│  └─ admin/
│     ├─ ui/                        # shadcn/ui primitives
│     ├─ layout/                    # Sidebar, Topbar, CommandPalette, NotificationBell
│     ├─ data-table/               # generic table (TanStack) + filters + bulk bar
│     ├─ vehicles/ leads/ cms/ media/ analytics/ settings/   # feature components
│     └─ providers/                 # QueryClient, Theme, Toaster, Session
│
├─ prisma/
│  ├─ schema.prisma                 # (see docs/admin/schema.prisma)
│  ├─ migrations/
│  └─ seed.ts                       # roles, permissions, super admin, migrate data/vehicles.ts
│
├─ emails/                          # React Email components
├─ types/index.ts                   # existing Vehicle/Service types — extended, shared
├─ tests/                           # vitest (unit) + playwright (e2e)
├─ middleware.ts                    # session gate + security headers + edge rate limit
└─ docs/admin/                      # this blueprint
```

**Migration note:** moving the current pages into `app/(public)/` is a no‑op for URLs (route
groups don't affect paths) but cleanly separates the two surfaces. The seed script imports the
existing `data/vehicles.ts` into Postgres so launch starts with real inventory.
