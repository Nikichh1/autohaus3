# 03 · Roles & Permissions (RBAC)

A **permission‑based RBAC** model: roles are bundles of fine‑grained permissions. Code checks
**permissions**, never role names (so roles stay editable without code changes). Custom roles
can be created by the Super Admin in the UI.

## 1. Permission model

A permission is `resource.action[.scope]`:

- **resource** — `vehicle`, `media`, `cms`, `lead`, `user`, `role`, `settings`, `analytics`,
  `audit`, `finance`, `notification`, `service` (workshop), `rental`, `business_unit`.
- **action** — `view`, `create`, `update`, `delete`, `publish`, `archive`, `assign`,
  `export`, `approve`, `manage` (full control), plus resource‑specific ones
  (`vehicle.set_price`, `vehicle.feature`, `cms.edit_seo`, `lead.reassign`).
- **scope** — optional qualifier: `own` (only records they created/are assigned),
  `unit:<businessUnit>` (only their department), or `all`.

Example: `lead.update.own`, `vehicle.publish.all`, `cms.update.unit:cafe`.

### Storage (Prisma)

```
Permission(id, key UNIQUE)                       -- catalog, seeded
Role(id, name, description, isSystem, businessUnit?)
RolePermission(roleId, permissionId, scope)      -- M:N + scope
User(id, …, primaryRoleId)
UserRole(userId, roleId)                          -- a user may hold several roles
UserPermissionOverride(userId, permissionId, scope, effect: ALLOW|DENY)  -- per‑user grants/revokes
```

The **effective permission set** = union of all role permissions, then apply per‑user
overrides (DENY beats ALLOW). Computed once per session and cached (Redis, busted on any
role/override change or on the user's next request after a role change → forced re‑auth).

## 2. Enforcement (defense in depth)

1. **Middleware** — coarse gate: is there a valid session? Is the route in this user's allowed
   section? (cheap, every request).
2. **Server Action / Route Handler** — `await authorize(session, "vehicle.publish", resource)`
   as the first line of every mutation and every sensitive read. Throws `ForbiddenError` →
   403. This is the real security boundary.
3. **Service layer** — scope checks (`own`/`unit`) applied as Prisma `where` filters so a user
   physically cannot load rows they can't see (not just hidden in UI).
4. **UI** — `<Can permission="vehicle.delete">` gates buttons/menus; navigation is filtered to
   permitted sections. UI checks are **cosmetic only** — never the sole guard.
5. **Database** — optional Postgres Row‑Level Security as a final backstop for the most
   sensitive tables.

```ts
// lib/auth/authorize.ts  (server‑only)
export function authorize(session, permission: PermissionKey, resource?: Resource) {
  const set = getEffectivePermissions(session.userId);          // cached
  const grant = resolve(set, permission, resource);             // checks scope: own/unit/all
  if (!grant) throw new ForbiddenError(permission);
  return grant;                                                 // returns the matched scope
}
```

## 3. The ten roles

| Role | Purpose | Key powers | Hard limits |
|---|---|---|---|
| **Super Admin** | Platform owner / technical | Everything, incl. roles, integrations, audit, impersonation, backups | — (the only role that can edit roles & integrations) |
| **Owner** | Business owner, non‑technical | All business data: vehicles, CMS, CRM, analytics, finance, settings; approves publishing | Cannot edit RBAC, integrations, or delete audit logs |
| **Sales Manager** | Runs sales | Full vehicle lifecycle (incl. pricing, publish, feature), full CRM, assign leads to team, sales analytics, export | No CMS/branding, no user mgmt, no finance settings |
| **Inventory Manager** | Stock control | Create/edit/archive/duplicate vehicles, specs, VIN, status, internal notes, media on vehicles | Cannot set price beyond a cap / cannot publish without approval (config), no CRM, no CMS |
| **Marketing Manager** | Site & campaigns | Full CMS, SEO/OpenGraph/structured data, featured vehicles, media library, marketing analytics | No pricing edits, no CRM contact PII export, no user mgmt |
| **Customer Support** | Handles inquiries | Full CRM (leads, notes, reminders, comms history), read vehicles, reply to inquiries | No publishing, no pricing, no settings, no delete |
| **Photographer** | Visual content | Upload/sort/crop media, attach to vehicles, manage media folders/tags | Read‑only on everything else; cannot edit specs/price/publish |
| **Content Editor** | Copy | Edit CMS text/blocks, vehicle descriptions/features, FAQ, news; submit for approval | Cannot publish (needs approval), no pricing/CRM/settings |
| **Accountant** | Finance | View leads→sales, revenue, financing settings, export financial reports, invoices | Read‑only on inventory/CMS; no publishing; 2FA required |
| **Read‑only User** | Auditor / viewer | View dashboards, vehicles, CRM lists, analytics | No writes anywhere; no PII export |

Roles are **seeded as `isSystem` defaults**; the Super Admin can clone them into custom roles
and tune the permission matrix in the UI.

## 4. Permission matrix (defaults)

Legend: **✔** allow (all) · **○** scoped (own/unit) · **A** allow but requires approval to
publish · **—** none · **R** read‑only.

| Permission group | Super | Owner | Sales Mgr | Inv. Mgr | Mkt Mgr | Support | Photo | Content | Acct | Read‑only |
|---|---|---|---|---|---|---|---|---|---|---|
| vehicle.view | ✔ | ✔ | ✔ | ✔ | ✔ | R | R | R | R | R |
| vehicle.create / update | ✔ | ✔ | ✔ | ✔ | — | — | — | ○ desc | — | — |
| vehicle.set_price | ✔ | ✔ | ✔ | cap | — | — | — | — | — | — |
| vehicle.publish / unpublish | ✔ | ✔ | ✔ | A | ✔ | — | — | A | — | — |
| vehicle.feature | ✔ | ✔ | ✔ | — | ✔ | — | — | — | — | — |
| vehicle.archive / delete | ✔ | ✔ | ✔ | archive | — | — | — | — | — | — |
| vehicle.duplicate | ✔ | ✔ | ✔ | ✔ | — | — | — | — | — | — |
| vehicle.internal_notes | ✔ | ✔ | ✔ | ✔ | — | R | — | — | R | — |
| media.upload / manage | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | — | — | — |
| media.delete | ✔ | ✔ | ✔ | ✔ | ✔ | ○ own | — | — | — |
| cms.view | ✔ | ✔ | R | — | ✔ | — | — | ✔ | — | R |
| cms.update | ✔ | ✔ | — | — | ✔ | — | — | A | — | — |
| cms.publish | ✔ | ✔ | — | — | ✔ | — | — | — | — | — |
| cms.edit_seo | ✔ | ✔ | — | — | ✔ | — | — | ○ | — | — |
| lead.view | ✔ | ✔ | ✔ | — | R | ✔ | — | — | R | R |
| lead.create / update | ✔ | ✔ | ✔ | — | — | ✔ | — | — | — | — |
| lead.assign / reassign | ✔ | ✔ | ✔ | — | — | ○ | — | — | — | — |
| lead.export | ✔ | ✔ | ✔ | — | — | — | — | — | ✔ | — |
| analytics.view | ✔ | ✔ | ✔ sales | ✔ stock | ✔ mkt | R | — | — | ✔ fin | R |
| finance.view / export | ✔ | ✔ | R | — | — | — | — | — | ✔ | — |
| settings.branding | ✔ | ✔ | — | — | ✔ | — | — | — | — | — |
| settings.integrations | ✔ | — | — | — | — | — | — | — | — | — |
| settings.business (hours, contact, tax) | ✔ | ✔ | — | — | — | — | — | — | ○ tax | — |
| user.view | ✔ | ✔ | R team | — | — | — | — | — | — | — |
| user.manage (invite, role, suspend) | ✔ | ○ non‑admin | — | — | — | — | — | — | — | — |
| role.manage | ✔ | — | — | — | — | — | — | — | — | — |
| audit.view | ✔ | ✔ | — | — | — | — | — | — | R | — |
| approval.review | ✔ | ✔ | ✔ | — | ✔ | — | — | — | — | — |

> "cap" = can edit price within a configurable band; outside it requires Sales Manager/Owner
> approval. "A" = action allowed but routes to the **approval queue** before going live.

## 5. Approval workflow (maker‑checker)

Roles marked **A** create a **change request** instead of a live change. The diff lands in
**Pending Approvals** (dashboard widget). A reviewer with `approval.review` approves (applies +
publishes + audits) or rejects (with a comment, notifies the author). This lets junior staff
(Content Editor, Inventory Manager) work freely without risking the live site.

## 6. Changing the model safely

- Editing a role re‑computes effective permissions and **invalidates affected users' sessions'
  permission cache**; on their next request they get the new set (or are forced to re‑auth for
  sensitive downgrades).
- Removing a permission from a role never silently breaks a flow — the UI hides it and the
  action returns a clear 403 with the missing permission key.
- All RBAC changes are themselves audit‑logged (`role.update`, `user.role_change`,
  `permission.override`).
