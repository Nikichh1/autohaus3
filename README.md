# AutoHaus.bg

A cinematic, performance-obsessed website for **AutoHaus** — one of Bulgaria's largest premium car dealerships. Built to sit comfortably next to the brands it sells (Porsche, Mercedes-AMG, Bentley, Lamborghini…), drawing on the scroll choreography of [rivian.com](https://rivian.com), the cinematic dark staging of [koenigsegg.com](https://koenigsegg.com), and the editorial restraint of [porsche.com](https://porsche.com).

Bulgarian-first, dark-mode by default, motion-rich, and fully static.

---

## Tech stack

| Concern         | Choice                                            |
| --------------- | ------------------------------------------------- |
| Framework       | **Next.js 16** (App Router, Turbopack)            |
| Language        | **TypeScript** (strict)                           |
| Styling         | **Tailwind CSS v4** (CSS-first `@theme` tokens)   |
| Animation       | **Framer Motion**                                 |
| Smooth scroll   | **Lenis** (lerp-based momentum)                   |
| Icons           | **lucide-react** (+ inline brand glyphs)          |
| i18n            | **next-intl** (scaffolded — BG primary, EN stub)  |
| Fonts           | `next/font` — Manrope (display), Inter (body), Playfair Display (serif accents) with Cyrillic; Instrument Serif (italic model logotypes, Latin) |
| Package manager | **pnpm**                                          |

**Lighthouse (desktop, production):** Performance 98–99 · Accessibility 100 · Best Practices 100 · SEO 100 across every page.

---

## Getting started

```bash
pnpm install
pnpm dev          # http://localhost:3000

pnpm build        # production build
pnpm start        # serve the production build
pnpm lint         # eslint
```

> Native deps (`sharp`, `@swc/core`, etc.) are pre-approved in `pnpm-workspace.yaml`. If pnpm prompts about build scripts, run `pnpm approve-builds` or keep the existing `onlyBuiltDependencies` list.

### Smooth-scroll escape hatch

Append `?nosmooth` to any URL to disable Lenis (useful for testing, screen-capture tools, or debugging). `prefers-reduced-motion` disables it automatically.

---

## Project structure

```
app/
  layout.tsx              # root layout: fonts, metadata, Nav, Footer, SmoothScroll
  page.tsx                # homepage (composes the section components)
  globals.css             # Tailwind v4 + design tokens (@theme), base styles, Lenis hooks
  not-found.tsx           # branded 404
  error.tsx               # error boundary
  opengraph-image.tsx     # generated OG image (1200×630)
  sitemap.ts / robots.ts  # SEO
  avtomobili/
    page.tsx              # vehicle listing (server) -> <VehicleListing> (client)
    VehicleListing.tsx    # filter + sort state, URL-synced
    FilterSidebar.tsx
    [slug]/page.tsx       # vehicle detail (SSG via generateStaticParams)
  zastrahovki|lizing|serviz|auto-spa|kafe-bar/page.tsx   # service pages (shared template)
  kontakti/page.tsx       # contact
  za-nas|kariera|novini|politika-poveritelnost|...       # footer placeholder pages

components/
  layout/    Nav, Footer, MobileMenu, PlaceholderPage
  ui/        Button, Input, Select, Container, Section
  motion/    SmoothScroll, FadeIn, Reveal, MaskReveal, Parallax, PinnedScene, Stagger, StatCounter
  sections/  HomeHero, FeaturedVehicles, ServicesGrid, BrandStory, WhyAutoHaus, LatestArrivals, HomeFooterCTA
  vehicle/   VehicleCard, VehicleGallery, SpecHighlights, SpecTable, FinancingCalculator, VehicleInquiryForm, VehicleStickyBar, SimilarVehicles
  service/   ServiceHero, ServicePageTemplate
  contact/   ContactForm, MapEmbed
  icons/     brand.tsx (Facebook / Instagram / YouTube glyphs)

data/
  vehicles.ts             # typed Vehicle[] + helpers (getVehicleBySlug, getFeaturedVehicles, …)
  services.ts             # service content (hero, sections, offerings)

lib/
  utils.ts                # cn(), formatPriceEUR(), formatNumber(), slugify()
  labels.ts               # BG labels for enums (fuel, transmission, drivetrain)
  nav.ts                  # nav links + contactInfo
  motion.ts               # easing/duration tokens, stagger variants
  vehicle-filter.ts       # filter/sort logic + URL (de)serialization

types/index.ts            # Vehicle, Service, enums
i18n/request.ts           # next-intl request config (BG default)
messages/{bg,en}.json     # translation stubs
public/brand/             # logo.svg + home-bg.jpg
```

---

## Design system

Tokens live in **`app/globals.css`** inside the Tailwind v4 `@theme` block — there is no `tailwind.config.ts`. Dark mode is the default; a `.light` class on `<html>` swaps the same tokens to light values.

**Palette** (one warm metallic accent, monochrome otherwise):

| Token (dark)       | Value      | Utility examples           |
| ------------------ | ---------- | -------------------------- |
| `--color-base`     | `#0a0a0a`  | `bg-base`                  |
| `--color-surface`  | `#141414`  | `bg-surface`               |
| `--color-elevated` | `#1a1a1a`  | `bg-elevated`              |
| `--color-fg`       | `#fafafa`  | `text-fg`                  |
| `--color-fg-muted` | `#8a8a8a`  | `text-fg-muted`            |
| `--color-accent`   | `#c9a961`  | `text-accent`, `bg-accent` |

**Type scale:** `text-display-2xs … text-display-2xl` (each pairs line-height, tracking, and weight). Use `font-display` (Manrope) for headings, `font-serif` (Playfair italic) for pull quotes, `font-script` (Instrument Serif italic) for vehicle model logotypes on cards, `.eyebrow` for small labels.

### Light / dark section alternation

The page intentionally alternates moods as you scroll (Koenigsegg dark → Rivian/Porsche light). Dark is the default; add `class="light"` to any container and the design tokens **re-scope** to light values for that subtree (e.g. `<section className="light bg-base text-fg">` renders light). This is driven by the `:root.light, .light { … }` rule in `globals.css`.

### Signature elements

1. **Ghost pill button** (`components/ui/Button.tsx`) — rounded-full, 1px border, transparent, with a fill that **sweeps up on hover** and inverts the text color. `variant="ghost"` is the default and the primary button everywhere; `variant="solid"` is the filled secondary; `CircleArrow` is the Porsche-style circular arrow used inside cards.
2. **Full-bleed image bands** (`components/sections/ExperienceBands.tsx`) — equal-height / unequal-width images sitting flush edge-to-edge across the full viewport, plus full-bleed cinematic scenes — sections connect through imagery with no gaps.

### Motion language (`lib/motion.ts`)

- Entrances: `cubic-bezier(0.16, 1, 0.3, 1)` · movements: `cubic-bezier(0.7, 0, 0.3, 1)`
- Durations: micro 0.35s · content 0.7s · cinematic 1.2s
- Primitives: `FadeIn`, `Reveal` (masked slide-up), `MaskReveal` (scale-settle + fade), `Parallax`, `PinnedScene` (Rivian-style sticky storytelling), `Stagger`/`StaggerItem`, `StatCounter`. `BrandStory` (a standalone pinned chapter scene) ships as a component but isn't used on the homepage.
- All respect `prefers-reduced-motion` and animate only `transform` / `opacity`.

> **Two motion gotchas (both encountered & fixed here):**
> 1. Any `useTransform` bound to `style` must use an **input range within `[0,1]` and strictly increasing** — Framer maps those to Web-Animations keyframe offsets, which throw otherwise.
> 2. Use the **`whileInView` prop**, not the `useInView` hook with a ref on a `motion` element — the latter misfires. (And `clip-path` via `whileInView` proved flaky in framer-motion 12.x, so reveals use scale instead.)

### Homepage flow (reference mapping)

`Hero` (Koenigsegg dark + gold spotlight) → `FeaturedVehicles` (Rivian pinned horizontal showroom, light) → `ServicesGrid` (Porsche rounded card grid, café as wide feature) → `WhyAutoHaus` (Koenigsegg enormous-type moment, then black→white editorial + animated stats) → `ExperienceBands` (Rivian full-bleed filmstrip + scene) → `LatestArrivals` → `LocatorBanner` (Porsche split, uses the building photo) → `HomeFooterCTA` (Rivian color tiles + full-bleed footer hero).

---

## Adding a new vehicle

Append an object to the `vehicles` array in **`data/vehicles.ts`**:

```ts
{
  id: "v011",
  slug: "audi-r8-v10-performance-2023",   // becomes /avtomobili/<slug>
  brand: "Audi",
  model: "R8",
  variant: "V10 Performance",
  year: 2023,
  price: 199000,                          // EUR
  mileage: 11000,                         // km
  fuelType: "petrol",                     // petrol | diesel | hybrid | electric
  transmission: "automatic",              // manual | automatic
  drivetrain: "awd",                      // fwd | rwd | awd
  bodyType: "Купе",
  power: 620, torque: 580, engineCC: 5204,
  acceleration: 3.1, topSpeed: 331, doors: 2, seats: 2,
  exteriorColor: "Kemora Grey",
  interiorColor: "Black Fine Nappa",
  vin: "WUA…",                            // optional
  features: ["Carbon Ceramic спирачки", "B&O Sound", "…"],
  description: "…",                       // shown as the editorial pull quote
  images: [/* 3–5 image URLs */],
  featured: true,                         // show in the homepage showcase
}
```

The new vehicle is automatically:

- statically generated at `/avtomobili/<slug>` (via `generateStaticParams`),
- included in the listing, its filters, sort, brand counts, the contact "vehicle of interest" dropdown, and the sitemap,
- available to the "similar vehicles" recommender.

No other edits required.

---

## Swapping placeholder content for real data

Search the codebase for `TODO` — every placeholder is marked. The key ones:

1. **Contact details** — `lib/nav.ts` → `contactInfo` (phone, email, address, hours, socials) and `app/kontakti/page.tsx` → `departments`. Currently obvious placeholders (`+359 XXX XXX XXX`, `ул. ████████`).
2. **Photography** — all imagery is **real AutoHaus photos**, cinematically graded into `public/photos/*.webp`. Source originals live in `public/brand/`; the grade (contrast, deepened blacks, vignette) is applied by `scripts/process-photos.mjs` (`node scripts/process-photos.mjs`, uses `sharp`). To add/replace: drop a source in `public/brand/`, add a mapping entry in that script, re-run it, then reference `/photos/<name>.webp` in `data/vehicles.ts` / `data/services.ts` / the section components. No external image hosts are used.
3. **Service imagery & copy** — `data/services.ts`.
4. **Stats** — `components/sections/WhyAutoHaus.tsx` (`stats` array: years, cars sold, brands, satisfaction).
5. **Financing rate** — managed from the admin: **Настройки → Лизинг и финансиране** (annual rate, default down‑payment %, default term). Drives both the public `FinancingCalculator` and the indicative monthly payment shown on each vehicle page. Defaults live in `lib/settings/config.ts` (`financingSchema`); the calculator is indicative only.
6. **Forms** — `ContactForm` and `VehicleInquiryForm` currently show a success state on submit. Wire `handleSubmit` to a real endpoint (e.g. `POST /api/contact` or an email service).
7. **Legal pages** — `za-nas`, `kariera`, `novini`, `politika-poveritelnost`, `obshti-usloviya`, `bisquitki` are branded "in preparation" placeholders.
8. **Logo / hero** — real assets live in `public/brand/` (`logo.svg`, `home-bg.jpg`).

### Internationalization

`next-intl` is scaffolded (`i18n/request.ts`, `messages/bg.json`, `messages/en.json`) with Bulgarian as the default locale. UI strings are currently inline Bulgarian. To enable English, populate the message catalogs, wrap the layout in `NextIntlClientProvider`, and migrate strings to `useTranslations()` / `getTranslations()` incrementally.

---

## Deployment

This is a **dynamic Next.js app** (App Router) backed by **PostgreSQL** via Prisma,
with Better Auth and server actions. It needs a Node runtime and a database — it is
**not** a static export. Recommended host: **Vercel + Neon**.

### 1. Database (Neon)
1. Create a free Postgres database at [neon.tech](https://neon.tech).
2. From the **Connect** panel copy two connection strings (keep `?sslmode=require` on both):
   - **Pooled** (host contains `-pooler`) → `DATABASE_URL`
   - **Direct** (untick "Pooled connection") → `DIRECT_URL`

### 2. Environment variables
Copy `.env.example` → `.env` for local dev, and set the same keys in
**Vercel → Settings → Environment Variables** (Production + Preview):

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Pooled Neon string (app runtime) |
| `DIRECT_URL` | yes | Direct Neon string (migrations) |
| `BETTER_AUTH_SECRET` | yes | Generate with `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | rec. | Your production URL (stable auth cookies) |
| `NEXT_PUBLIC_APP_URL` | rec. | Same production URL |
| `R2_ACCOUNT_ID` | uploads | Cloudflare R2 — see below |
| `R2_ACCESS_KEY_ID` | uploads | Cloudflare R2 API token |
| `R2_SECRET_ACCESS_KEY` | uploads | Cloudflare R2 API token |
| `R2_BUCKET` | uploads | R2 bucket name |
| `R2_PUBLIC_URL` | uploads | R2 public URL (r2.dev or custom domain) |

### 3. Deploy to Vercel
1. Push the repo to GitHub and **Import** it in Vercel (framework auto-detected as
   Next.js; pnpm auto-detected from the lockfile).
2. Add the environment variables above.
3. Deploy. The build command in `vercel.json` runs
   `prisma generate && prisma migrate deploy && next build`, so the database schema
   is created/updated automatically on every deploy.

### 4. Create the first admin
After the first successful deploy (the tables now exist), run once from your machine
with `.env` pointing at the Neon database:
```bash
pnpm db:seed:admin
```
This creates/promotes a `super_admin`. Override credentials with `ADMIN_EMAIL` /
`ADMIN_PASSWORD`. **Change the password after the first login.**

> Update `metadataBase` in `app/layout.tsx` and the base URL in `sitemap.ts` /
> `robots.ts` if your production domain differs from `https://autohaus.bg`.

### File uploads (Cloudflare R2)
Admin image/audio uploads are handled by `lib/admin/storage.ts`, which has two
interchangeable drivers chosen automatically by the environment:

- **No `R2_*` env vars** → writes to `/public/uploads` (great for local dev).
- **`R2_*` env vars set** → uploads to a Cloudflare R2 bucket and serves from its
  public URL. **Required on Vercel**, whose filesystem is read-only and ephemeral.

R2's free tier is **10 GB storage with no egress fees**. One-time setup:

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **R2** → **Create bucket**
   (e.g. `autohaus`). _(R2 asks for a card to verify, but the free tier is $0.)_
2. Open the bucket → **Settings** → **Public access** → enable the **r2.dev**
   subdomain (or attach a custom domain). Copy that URL → `R2_PUBLIC_URL`.
3. **R2** → **Manage API Tokens** → **Create API Token** with *Object Read & Write*
   → copy the **Access Key ID** and **Secret Access Key**.
4. Your **Account ID** is shown on the R2 overview page.
5. Set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`,
   `R2_PUBLIC_URL` in Vercel → Settings → Environment Variables, then redeploy.

No app code changes are needed to switch drivers — only the env vars.

---

## Notes

- The public site is server-rendered and reads live inventory from the database; admin mutations call `revalidatePath()` so public pages refresh on demand.
- Accessibility is taken seriously: semantic landmarks, keyboard-navigable gallery/lightbox, labelled controls, WCAG-AA contrast, reduced-motion support.
- Critical design rules are baked in: monochrome + one accent, no gradient buttons, no glow/neon, no stock-photo clichés, Lucide icons only.
