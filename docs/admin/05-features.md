# 05 · Feature Modules

Every module below is a route group under `app/(admin)/admin/`. Each lists its screens, the
key interactions, and the data/actions behind them.

---

## A. Dashboard — `/admin`

A streamed, role‑aware overview. Cards fetch in parallel via Suspense; each respects the
viewer's permissions (a Support agent sees their leads, the Owner sees everything).

**Top KPI row** (cards with sparkline + period‑over‑period delta):
- Total vehicles · Active (available) · Reserved · Sold (this month) · Draft/archived
- Website visitors (from PostHog/first‑party `DailyMetric`)
- Leads (new this week) · Conversion rate (leads → sold) · Revenue (closed deals)

**Body widgets:**
- **Recent activity** — live feed from `AuditLog` + `LeadActivity` (who did what, when).
- **Pending approvals** — `ChangeRequest` queue for reviewers; inline approve/reject.
- **Notifications** — unread bell feed; mark read, deep‑link.
- **Calendar** — reminders, test drives, follow‑ups (from `Reminder`), month/week/agenda views.
- **Sales funnel** — new → contacted → qualified → test‑drive → won.
- **Top‑viewed vehicles** (7/30 days) and **leads needing follow‑up** (SLA breaches highlighted).
- **Quick actions** — Add vehicle · New lead · Upload media · Edit homepage · Invite user
  (each gated by permission; also reachable via ⌘K).

Aggregates are read from Redis (TTL 60–300s) and recomputed by an Inngest cron so the
dashboard never runs heavy `COUNT`s on every load.

---

## B. Vehicle Management — `/admin/vehicles`

The flagship module. Mirrors and extends the existing `Vehicle` type.

### List view
- **Data table**: virtualized, keyset‑paginated, column show/hide, density toggle.
- Columns: thumbnail, brand/model/variant, year, price, status badge, featured ⭐, mileage,
  collection, leads count, views, updated. Sortable; inline status change.
- **Filters** (saved as segments): status, brand, model, price range, year, fuel, transmission,
  drivetrain, collection, business unit, has‑VIN, featured, rentable, date added.
- **Global + per‑column search** (FTS over brand/model/variant/VIN/description).
- **Bulk actions** (multi‑select): publish, unpublish, archive, delete, feature, set
  collection, assign price change, export CSV. Bulk ops are optimistic with rollback and
  one audit entry per record.
- **Views**: table ⇄ gallery (photo grid) ⇄ kanban by status.

### Editor — `/admin/vehicles/[id]` (tabbed, autosave drafts)
1. **Overview** — brand, model, variant, year, body, collection, status, featured toggle,
   business unit. Live slug with collision check.
2. **Specs** — fuel, transmission, drivetrain, power, torque, engineCC, acceleration, top
   speed, doors, seats, colors, mileage. Plus the open `specs` JSON for ad‑hoc fields.
3. **Pricing & Financing** — price / price‑on‑request, VAT‑deductible, currency, rental/day,
   financing terms (down payment, APR, months → drives the public `FinancingCalculator`),
   trade‑in eligible.
4. **Media** — drag‑and‑drop gallery sorter (`VehicleMedia.position`), set primary/hero,
   bulk upload, pick from Media Library, video URL, **360° set** (ordered frames), captions/alt.
5. **Documents** — registration, service history, inspection, invoice (private, role‑gated).
6. **Identity** — VIN (with checksum validation + decode), registration no., first
   registration date.
7. **Description** — rich text per locale (BG/EN), feature chips, auto‑generated SEO preview.
8. **Internal notes** — team‑only thread (`VehicleNote`), never public.
9. **History** — audit timeline for this vehicle (every field change, who/when, revert).

**Lifecycle actions** (permission‑gated, some via approval queue):
`Save draft · Publish / Unpublish · Feature · Reserve (with hold expiry) · Mark sold (captures
sale price → revenue) · Archive · Duplicate (clone all fields + media, new draft) · Delete
(soft, 30‑day trash, then purge)`.

**Draft mode**: new/edited vehicles stay `draft`; a live preview renders the public detail page
from draft data behind a token before publishing.

---

## C. CMS — `/admin/content`

Edit **every** word on the public site without code. Backed by `CmsPage`/`CmsBlock`/`CmsSeo`,
per locale, versioned.

- **Pages list**: Home, About (за‑нас), Contact (контакти), FAQ, Services (serviz, auto‑spa,
  zastrahovki, lizing, kafe‑bar…), News (novini), Careers (kariera), legal pages, plus
  **global** zones: navigation, footer, announcement bar.
- **Block editor**: each editable region on a page is a typed block —
  - `text`/`richtext` (titles, descriptions, paragraphs) with a Tiptap editor,
  - `cta` (button label + href + style),
  - `image` (pick from Media Library, alt text),
  - `list` (FAQ items, feature bullets),
  - `json` (structured sections like the service‑page `sections[]`).
- **Hero section editor** with live preview matching the real component.
- **Inline editing option**: a "Visit site as editor" mode overlays edit pencils on the live
  page (edit‑in‑place), powered by the same block API.
- **SEO panel per page**: meta title/description, canonical, **OpenGraph** (title/desc/image),
  **structured data (JSON‑LD)** templates (Organization, AutoDealer, Vehicle, FAQPage,
  BreadcrumbList), `noindex` toggle. Character counters + Google/social preview cards.
- **Localization**: side‑by‑side BG/EN editing; "missing translation" flags.
- **Versioning**: every save snapshots to `CmsVersion`; diff & one‑click revert; scheduled
  publish (`publishAt`).
- **Publish** busts the exact ISR tag (`cms:home:bg`) so the change is live in seconds.
- Content Editors submit changes to the **approval queue**; Marketing/Owner publish.

---

## D. Media Library — `/admin/media`

A professional DAM (digital asset manager).

- **Folders** (nested, `MediaFolder`) + **tags** + **search** (name, tag, alt, by uploader,
  by type, by linked vehicle).
- **Grid / list** views with hover preview, blurhash placeholders, lazy + virtualized.
- **Drag‑and‑drop upload** (multi‑file, folders), real progress bars (presigned direct‑to‑R2),
  paste‑from‑clipboard, import‑from‑URL (migrates the current `autohaus.bg` remote images).
- **Per‑asset**: rename, move, tag, alt/caption, see "used in" (which vehicles/pages reference
  it — prevents deleting in‑use assets), download original, view variants.
- **Image tools**: crop/rotate/focal‑point (Cloudinary or in‑app cropper), **auto WebP/AVIF**,
  responsive variant generation (matches existing `640/828/1080/1920/2560` ladder).
- **Replace‑in‑place**: re‑upload to the same `storageKey`/`publicId` → every reference updates
  and CDN cache busts, **URLs never break** (the brief's explicit requirement).
- **Dedupe**: perceptual hash warns on near‑duplicate uploads.
- **Bulk**: move, tag, delete (blocked if in use, or soft‑delete + warn).

---

## E. CRM / Leads — `/admin/leads`

Every website inquiry lands here automatically (the public `ContactForm`,
`VehicleInquiryForm`, phone/WhatsApp logged manually).

- **Pipeline (kanban)** by `LeadStatus`: New → Contacted → Qualified → Test drive →
  Negotiating → Won / Lost. Drag cards between stages (writes `status_change` activity).
- **Table view** with the same filters/saved‑segments pattern as vehicles; SLA highlighting
  (un‑actioned new leads turn red after N hours).
- **Lead detail**:
  - Contact (name/email/phone), source, UTM, linked vehicle, GDPR consent flag, lead score.
  - **Assignment** to a salesperson (`assigneeId`) — round‑robin or manual; reassignment logged.
  - **Notes** + **activity timeline** (`LeadActivity`: notes, calls, emails, meetings, status
    changes) — full **communication history**.
  - **Email** from within the app (Resend, threaded), **call logging**, **reminders** (`Reminder`
    → calendar + notification), templates.
  - Quick **convert → sold**: links the lead to the vehicle's `soldAt`/sale price (feeds revenue
    + conversion analytics).
- **Capture API**: public forms POST to `/api/leads` (rate‑limited, spam‑filtered, honeypot +
  Turnstile) → creates `Lead`, notifies assignee, auto‑responds to the customer.
- **Exports**: filtered CSV/XLSX (permission `lead.export`), GDPR data export per contact,
  scheduled report emails.

---

## F. Analytics — `/admin/analytics`

First‑party tables (`VehicleView`, `SearchQuery`, `DailyMetric`, `Lead`) + PostHog for depth.

- **Traffic**: visitors, pageviews, sources/referrers, devices, geography, trend charts with a
  date‑range picker and compare‑to‑previous.
- **Conversions**: lead rate, lead→sold rate, funnel visualization with stage drop‑off.
- **Inventory insight**: **top‑viewed vehicles**, views‑to‑lead ratio per vehicle, average days
  in stock, price‑vs‑interest, stale listings.
- **Search insight**: **top search terms**, zero‑result searches (demand you can't meet),
  filter usage.
- **Abandoned inquiries**: started‑but‑not‑submitted forms, leads gone cold.
- **Sales funnel** & revenue over time, by salesperson, by collection/business unit.
- **Filters** everywhere (date range, business unit, brand, source); export any chart's data;
  scheduled email digests (daily/weekly) to Owner/Managers.

---

## G. Notifications — cross‑cutting

- **In‑app**: bell with unread badge, dropdown feed, full page; real‑time via Pusher/SSE,
  toast for live events (new lead, approval needed, vehicle sold).
- **Email** (Resend): new‑lead alerts to assignees, approval requests, daily/weekly digests,
  reminder due, security alerts (new device, password change).
- **Push** (Web Push / VAPID, opt‑in PWA): high‑priority events (new lead, hot inquiry) to
  staff phones.
- **Per‑user preferences**: which event types, on which channels, quiet hours. Stored in
  `Setting`/user prefs; every notification fans out per the recipient's matrix.

---

## H. Settings — `/admin/settings`

Typed `Setting` groups, each its own screen; changes are audited and (for branding/contact)
revalidate the public site.

- **Branding**: logo (light/dark), favicon, brand colors (writes CSS variables consumed by the
  public theme), fonts, OG default image.
- **Contact**: company legal name, EIK/VAT (today's `Аутохаус България ЕООД` / `BG200771286`),
  address, phones, emails, map coordinates — the source for footer + contact page + JSON‑LD.
- **Opening hours** per business unit (cars vs Auto Spa/Café have different hours today).
- **Social**: Facebook/Instagram/YouTube links.
- **Localization**: enabled locales (bg/en), default locale, currency & formatting.
- **Tax & Financing**: VAT rate, price‑display rules, default financing terms (APR, term,
  down‑payment) powering the public calculator.
- **Integrations** (Super Admin only): Resend, Cloudinary/R2, PostHog, Pusher, Sentry,
  Google/Meta pixels, WhatsApp Business — API keys stored encrypted, never shown after save,
  connection test buttons.
- **Users & Roles**: invite users, assign roles, edit the permission matrix, custom roles,
  per‑user overrides, suspend/reactivate, view sessions, force logout.
