# 01 · Architecture, Data Flow & Performance

## 1. Rendering & request model

The admin lives at **`/admin`** in the same Next.js app as the public site. Two surfaces,
one deployment, shared types.

- **Public site** — Server Components, statically rendered where possible, **ISR** with
  on‑demand revalidation. Reads through a cached data layer (`lib/data/*`). Never touches
  auth. This preserves the current "feels static" performance.
- **Admin app** — a route group `app/(admin)/admin/**`. Page shells are Server Components
  (fast first paint, data fetched on the server with the caller's permissions); the
  interactive parts (tables, editors, drag‑drop, command palette) are **client islands**
  hydrated with TanStack Query.

### Mutation path (the important one)

```
Client form (RHF + Zod)
   │  optimistic update (TanStack Query)
   ▼
Server Action  ──►  authorize(user, "vehicle.update", resource)
   │                 validate(input, ZodSchema)        ← same schema as client
   │                 prisma.$transaction([...])         ← DB write
   │                 writeAuditLog(actor, action, diff)
   │                 revalidateTag(`vehicle:${id}`)     ← public ISR refresh
   │                 inngest.send("vehicle.updated")    ← async side effects
   ▼
return typed result → reconcile cache
```

Every write goes through this spine: **authorize → validate → transact → audit → revalidate →
emit event**. No mutation skips authorization or audit. Server Actions are the default;
Route Handlers (`app/api/**`) are used only for webhooks, file presign, SSE, and third‑party
callbacks.

## 2. Data flow & layering

```
app/(admin)/**            ← UI (RSC pages + client islands)
   │
lib/actions/**            ← Server Actions: authz + validation + audit + revalidate
   │
lib/services/**           ← Business logic (framework‑agnostic, unit‑testable)
   │                         e.g. vehicleService.publish(), leadService.assign()
lib/repositories/** (Prisma) ← Data access only; no business rules
   │
PostgreSQL
```

Rules:
- UI never calls Prisma directly. Actions never embed business rules. Services never read
  `headers()`/`cookies()`. This keeps logic testable and the boundary auditable.
- The **public** site reads via `lib/data/*` (cache‑wrapped repository reads), which is a
  separate, read‑only, permission‑free path.

## 3. Caching strategy (four layers)

| Layer | Tool | Used for | Invalidation |
|---|---|---|---|
| Browser/CDN | Vercel Edge + `Cache-Control` | Public pages, immutable images | Versioned asset URLs; ISR tags |
| Next Data Cache | `unstable_cache` / `fetch` tags | Public reads of vehicles/CMS/settings | `revalidateTag("vehicle:ID")`, `revalidateTag("cms:home")` on write |
| App cache | **Redis (Upstash)** | Dashboard aggregates, hot lists, rate counters, lead counts | TTL (60–300s) + explicit bust on write |
| Per‑request | React `cache()` | De‑dupe identical reads within one render | Automatic per request |

**Tagging convention:** every cacheable read is tagged by entity (`vehicle:{id}`,
`vehicles:list`, `cms:{page}:{locale}`, `settings:branding`). Writes call `revalidateTag`
for exactly the tags they affect, so publishing one car never busts the whole catalog cache.

The admin itself is **never statically cached** — it always reflects live DB state for the
acting user.

## 4. Uploads (how files actually move)

Direct‑to‑storage presigned uploads — bytes never pass through the Next server (avoids
serverless body limits and keeps the app responsive).

```
1. Client requests upload  → POST /api/media/presign
                              authz("media.upload") + validate(mime, size)
                              returns { url, fields, assetId } (R2 presigned POST)
2. Browser PUTs file directly → Cloudflare R2  (shows real progress bar)
3. Browser confirms          → POST /api/media/complete { assetId, key, w, h }
                              creates MediaAsset row (status=processing)
4. Inngest job               → generate derivatives (WebP/AVIF, widths), extract EXIF,
                              perceptual hash (dedupe), blurhash placeholder
                              → update MediaAsset(status=ready, variants)
5. UI                        → polls/subscribes; thumbnail swaps in when ready
```

Constraints enforced server‑side: allowed MIME types, max size per role, per‑vehicle photo
caps (configurable, default "unlimited"), and virus scan hook for documents. Videos go to
R2 too; 360° image sets are stored as an ordered frame group referencing one `MediaAsset` each.

## 5. Image optimization (reconciled with the existing pipeline)

The current site pre‑generates width variants with `sharp` and serves them through
`image-loader.ts`. Two supported modes:

- **Managed (recommended): Cloudinary.** Originals stored once; transformations
  (`/w_828,f_auto,q_auto/…`) produce WebP/AVIF, crops, and focal‑point art‑direction on the
  fly via URL. This natively satisfies the brief's *auto‑WebP*, *cropping*, and **"replace
  images without breaking URLs"** (re‑upload to same public_id; CDN purges; URL is stable).
- **Self‑hosted:** keep `sharp`, run it inside the Inngest job at upload time to emit the
  same width ladder used today (`640/828/1080/1920/2560`), store variants in R2, keep the
  custom `image-loader.ts` pointing at them. "Replace without breaking URLs" is achieved by
  addressing assets via a stable `mediaId` slug and swapping the underlying object + cache‑busting query.

Either way the public `<Image>` usage and `deviceSizes`/`qualities` config stay intact.

## 6. Pagination

- **Admin tables: keyset (cursor) pagination**, not OFFSET. Cursor = `(sortKey, id)`.
  Stable under inserts, fast at any depth, plays with infinite scroll and "load more".
  ```ts
  // cursor encodes the last row's sort value + id
  where: { OR: [{ createdAt: { lt: cursor.createdAt } },
                { createdAt: cursor.createdAt, id: { lt: cursor.id } }] }
  orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  take: pageSize + 1   // +1 to know if there's a next page
  ```
- Total counts (for "1–25 of 1,240") come from a **cached approximate count** (Redis, TTL),
  refreshed async — exact counts over large filtered sets are expensive and rarely need to be exact.
- Public listings use ISR pages with cursor‑based "load more".

## 7. Search

| Scope | v1 (ship first) | At scale |
|---|---|---|
| Inventory filter (brand/model/price/year/fuel…) | Prisma `where` on indexed columns | same |
| Free‑text (VIN, title, description, notes) | Postgres **FTS** (`tsvector` column, GIN index) + **`pg_trgm`** for fuzzy/typo | **Typesense/Meilisearch** synced via Inngest for instant, typo‑tolerant, cross‑entity |
| Command palette (⌘K) | Server search endpoint hitting FTS across vehicles, leads, pages, media, settings | Search engine multi‑index |

A generated `searchVector tsvector` column on `Vehicle` (brand, model, variant, VIN,
description, features) with a GIN index gives sub‑10ms search over thousands of rows. Filters
combine with search in one query. Saved filters/segments are persisted per user.

## 8. Performance budget & techniques

- **Admin TTI < 1.5s** on the dashboard; table interactions < 100ms perceived (optimistic UI).
- **Server‑side data fetching with the user's permissions** so the first paint is correct and
  unfiltered data never reaches the client.
- **Streaming + Suspense**: dashboard cards stream independently; a slow analytics widget
  never blocks the table.
- **TanStack Query**: `staleTime` tuned per resource, background refetch, optimistic mutations
  with rollback, `keepPreviousData` for snappy pagination/filtering.
- **Virtualized tables** (TanStack Virtual) for 10k‑row grids — render only visible rows.
- **Code‑split heavy editors** (rich text, image cropper, chart libs) with `next/dynamic`.
- **DB**: composite indexes for every common filter+sort; `EXPLAIN ANALYZE` in CI on slow
  queries; connection pooling via Prisma Accelerate / PgBouncer for serverless.
- **N+1 guard**: repositories use explicit `include`/`select`; a dev‑time Prisma logger flags
  query fan‑out.

## 9. Multi‑tenancy / multi‑business

AutoHaus runs several business lines (cars, rental, service, café, etc.). Model these as a
`BusinessUnit` enum/table so permissions, content, and analytics can be scoped (e.g. a Café
content editor can't touch vehicle pricing). The schema includes `businessUnit` on the
entities where it matters (CMS pages, staff assignments, settings). This is **not** full
SaaS multi‑tenant isolation — it's one company with departments — so a shared DB with scoped
rows (not separate schemas) is correct.

## 10. Internationalization

Content is BG‑first with EN as a second locale. The CMS stores **per‑locale** content
(`ContentBlock` keyed by `(key, locale)`); vehicle free‑text fields (description, features)
are translatable; enums/specs are locale‑independent and rendered through a label map
(mirroring today's `lib/labels.ts`). URLs keep the existing Bulgarian slugs; an optional
`/en` segment can be added later without schema change.
