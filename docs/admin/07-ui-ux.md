# 07 · UI / UX System

Target feel: **Linear / Vercel / Stripe** — fast, dense‑but‑calm, keyboard‑first, dark‑mode
native. Built on shadcn/ui + Radix + Tailwind v4, reusing the existing design tokens and
`framer-motion`.

## 1. Layout

```
┌────────────────────────────────────────────────────────────────────┐
│ Top bar:  ⌘K search   |  business‑unit switcher  |  bell  | avatar   │
├───────────┬────────────────────────────────────────────────────────┤
│ Sidebar   │  Page header: title · breadcrumbs · primary actions      │
│ (collaps- │ ───────────────────────────────────────────────────────│
│  ible,    │                                                          │
│  perm‑    │   Content (table / editor / dashboard)                   │
│  filtered)│                                                          │
│           │   Right drawer/sheet for detail & quick‑edit             │
└───────────┴────────────────────────────────────────────────────────┘
```

- **Sidebar** groups: Dashboard · Vehicles · Leads · Content · Media · Analytics · Settings.
  Items are filtered by permission (you never see a section you can't use). Collapsible to icons;
  remembers state.
- **Command‑first**: almost every action is reachable from the header and from ⌘K.
- **Responsive**: full experience on desktop/tablet; on mobile it collapses to a bottom‑nav +
  sheet pattern so staff can triage leads and update vehicle status on a phone.

## 2. Design tokens & theming

- Tailwind v4 CSS variables (extends the public site's `globals.css`): semantic tokens
  (`--background`, `--foreground`, `--card`, `--primary`, `--muted`, `--border`, `--ring`,
  status colors). **Branding settings write these variables**, so the Owner can re‑theme.
- **Dark mode** is first‑class (system/light/dark toggle, persisted). Both themes ship together.
- 8‑pt spacing grid, one type scale, consistent radius/elevation. Motion via `framer-motion`
  with a `prefers-reduced-motion` guard (reuses `lib/motion.ts`).

## 3. Tables (the workhorse)

Built on **TanStack Table + TanStack Virtual**:
- Column visibility/order/resize/pin, density toggle, sticky header, virtualized rows (10k+).
- Sort, multi‑filter, **faceted filters**, full‑text search, **saved views/segments** per user.
- **Row selection + bulk action bar** (sticky, shows count + actions, optimistic).
- Inline edit for safe fields (status, featured, price with confirm).
- Keyset pagination ("load more"/infinite) with `keepPreviousData` for zero‑flicker.
- Empty, loading (skeleton), and error states designed, not afterthoughts.

## 4. Command palette (⌘K / Ctrl‑K)

- Fuzzy search across **navigation**, **vehicles** (by brand/model/VIN), **leads**, **CMS
  pages**, **media**, **settings**, and **actions** ("Add vehicle", "Invite user", "Toggle dark
  mode", "Mark vehicle sold").
- Recent items, scoped sub‑menus, keyboard‑only operable. Backed by the FTS search endpoint.

## 5. Keyboard shortcuts

| Key | Action |
|---|---|
| `⌘K` | Command palette |
| `g` then `v / l / c / m / d` | Go to Vehicles / Leads / Content / Media / Dashboard |
| `c` | Create (context: new vehicle / lead) |
| `/` | Focus search |
| `j / k` | Move selection down/up in tables |
| `x` | Toggle row selection |
| `e` | Edit selected · `s` save · `Esc` close drawer |
| `?` | Shortcut cheat‑sheet |

## 6. Interaction patterns

- **Context menus** (right‑click rows) mirroring bulk actions.
- **Drawers/sheets** for quick view/edit without losing list context; full pages for deep edits.
- **Optimistic UI** everywhere with toast + undo (e.g. "Vehicle archived — Undo").
- **Autosave drafts** with a visible "Saved" indicator; unsaved‑changes guard on navigation.
- **Drag‑and‑drop**: vehicle gallery sort, media upload, kanban stage moves (dnd‑kit).
- **Inline validation** (Zod messages), confirmation dialogs for destructive/financial actions
  (with step‑up 2FA where required).
- **Toasts/notifications** (sonner), **skeletons** for loading, **blurhash** for images.

## 7. Accessibility & quality

- Radix primitives → focus management, ARIA, keyboard nav for free. WCAG 2.1 AA: contrast,
  focus rings, labels, `prefers-reduced-motion`, screen‑reader live regions for async results.
- i18n‑ready admin chrome (BG/EN). Consistent date/number/currency formatting (EUR, BG locale).
- Storybook for the component library; visual regression in CI.
