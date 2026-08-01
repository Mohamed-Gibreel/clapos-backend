# ClaPos — Backend Specification

Backend to be built with **NestJS** (TypeScript). This document describes all features the Flutter POS app requires — present and future — so the backend can be designed to accommodate all phases from the start.

---

## Tech Stack Guidance

- **Framework:** NestJS with TypeScript — scaffold from `base-template` in this org
- **Database:** PostgreSQL, single database, shared schema (row-level tenant isolation via `tenantId` FK)
- **ORM:** TypeORM (already wired in base-template)
- **Auth:** JWT with per-tenant HMAC-derived secrets (already implemented in base-template)
- **API style:** REST (the Flutter app uses Dio with a base `API_URL`)
- **File storage:** S3-compatible (product/category images)
- **Background jobs:** BullMQ + Redis (already wired in base-template) — used for sync processing, report generation
- **Realtime (Phase 3):** WebSocket or SSE for table status updates

---

## Multi-Tenant Architecture

ClaPos is a multi-tenant SaaS POS. Each tenant is a restaurant/shop. Terminals (tablets) belong directly to a tenant — there is no intermediate Store/Location concept.

### Entity hierarchy

```
SuperAdmin (platform-level)
  │
  ├── Tenant  ← the restaurant/shop business  (x-tenant-id header)
  │     │
  │     ├── POS Terminal  ← the actual tablet device
  │     │     │
  │     │     └── Orders
  │     │
  │     ├── Products / Categories / Customers  (tenant-scoped)
  │     └── Users / Staff
  │
  └── Event  ← cross-tenant (e.g. "Food Festival 2024")
        │
        └── TerminalEvent  ← assignment of a terminal to an event
```

### How tenant context flows

Inherited from base-template, unchanged:

1. **`x-tenant-id` header** — read by `TenantMiddleware` on every request. Stored in request-scoped `TenantContextService`. The middleware validates the tenant exists in the DB.
2. **Tenant-scoped JWT secret** — each tenant's tokens are signed with `HMAC(MASTER_SECRET, tenantId)`. A token from Tenant A is cryptographically invalid for Tenant B.
3. **`TenantScopedRepository`** — every query automatically adds `WHERE tenantId = :currentTenantId`. No cross-tenant data leakage.

### Roles

| Role | Scope | Capabilities |
|---|---|---|
| `SuperAdmin` | Platform | Manage tenants, create events, assign terminals to events |
| `Owner` | Tenant | Full access within their tenant |
| `Manager` | Tenant | Manage products, customers, staff, discounts; void/refund orders |
| `Cashier` | Terminal | Take orders, process payments, create customers |

### Adaptations required from base-template

The following known gaps in the base-template must be fixed before building ClaPos features:

1. **`user.email` unique globally** → change to `UNIQUE(email, tenantId)` so two tenants can have staff with the same email
2. **Login is not tenant-scoped** → `POST /auth/login` must accept `x-tenant-id` and scope the user lookup to that tenant
3. **`TenantMiddleware` does not validate the tenant UUID** → add a DB lookup to confirm the tenant exists
4. **No bcrypt on passwords** → add bcrypt hashing before any user creation or login
5. **`UserService.getAll()` returns all users across all tenants** → switch to `TenantScopedRepository`

---

## Offline-First Design

The POS **must continue to function with no internet connection** — taking orders, processing payments, and creating customers. When connectivity is restored the device syncs its queued data to the server automatically.

This requirement shapes several backend decisions described throughout this document. The key principles are:

### 1. Client-generated UUIDs (idempotency)

The POS generates a UUID (`clientId`) for every order and customer it creates, regardless of connectivity. When the device syncs, it sends this `clientId` to the server. The server uses it as an idempotency key — if the same `clientId` arrives twice (e.g. network timeout caused a retry) the server returns the already-created record instead of duplicating it.

All `POST /orders` and `POST /customers` calls **must** include a `clientId`. The server stores it alongside its own `id`.

### 2. Catalog sync (read-only data pulled to device)

On startup and periodically, the POS downloads the full catalog: products, categories, variations, tax config, and feature flags. This is stored in local SQLite on the device.

The sync endpoint supports **incremental updates** via `?updatedAfter=<ISO timestamp>` so the device only fetches what changed. It also returns a list of deleted IDs so the device can purge stale records.

Products and categories use **soft-delete** (a `deletedAt` timestamp instead of hard removal) so that offline orders referencing those IDs remain valid and foreign key integrity is maintained.

### 3. Offline order queue

Orders created offline are stored locally in an `offline_order_queue` table on the device. They carry:
- The client-generated UUID
- The exact timestamp when the cashier completed the transaction (`clientCreatedAt`)
- Full order payload (items, variations, discount, payment)

When connectivity is restored, the POS calls `POST /sync/orders` with a batch of queued orders. The server processes them in order of `clientCreatedAt`, deduplicates by `clientId`, and returns a per-order result so the app knows which succeeded and which failed.

### 4. Conflict resolution rules

| Scenario | Server behaviour |
|---|---|
| Product deactivated/deleted while POS was offline | Accept the order. `OrderItem.productId` stays set (soft-delete keeps the row). Flag order with `hadOfflineConflict: true`. |
| Product price changed while POS was offline | Accept the order at the price snapshotted in `OrderItem.unitPrice` — do **not** re-price. Log the delta for the manager's audit trail. |
| `clientId` already exists (duplicate sync) | Return `200` with the existing order — do not create a duplicate. |
| Cashier account deactivated while offline | Accept the order — the user row still exists (soft or `isActive: false`). |
| Invalid product reference (product never existed) | Reject that order item, return error in sync result. |

### 5. Offline customer creation

Customers created offline follow the same `clientId` pattern. On sync, if a customer with the same phone number already exists server-side, the server can either merge (prefer server record) or return a conflict for the app to resolve. The simplest Phase 1 behaviour: create as a new record and flag the duplicate for manual review.

---

---

## Data Models

### User / Staff
```
User {
  id          UUID PK
  tenantId    UUID FK → Tenant
  name        string
  email       string
  password    bcrypt hashed string
  role        enum: owner | manager | cashier
  isActive    bool
  createdAt   timestamp
  deletedAt   timestamp?
  -- UNIQUE(email, tenantId)
}
```
A user logs in to start a shift. Role controls what they can do (e.g. only managers can apply discounts).

---

### POS Terminal
A physical tablet/device owned by a tenant (e.g. "Till 1", "Bar Counter").

```
PosTerminal {
  id            UUID PK
  tenantId      UUID FK → Tenant
  name          string            -- e.g. "Till 1", "Bar Counter"
  deviceToken   string unique     -- a secret token embedded in the app at setup time, used to identify the device
  isActive      bool default true
  lastSeenAt    timestamp?
  createdAt     timestamp
  deletedAt     timestamp?
}
```

The `deviceToken` is generated by the server when a terminal is registered and embedded into the Flutter app's `.env` at that location. It is sent alongside the cashier's JWT on every request so the server knows which terminal placed an order.

---

### Event
A competition, festival, or external venue where one or more terminals from one or more tenants operate. Events are cross-tenant — managed by `SuperAdmin`.

```
Event {
  id          UUID PK
  name        string          -- e.g. "Street Food Festival 2024"
  description string?
  location    string?
  startDate   date
  endDate     date
  isActive    bool default true
  createdAt   timestamp
  deletedAt   timestamp?
}
```

### TerminalEvent (junction)
Assigns a specific POS terminal to an event. A terminal can be assigned to at most one active event at a time. One event can have terminals from multiple tenants.

```
TerminalEvent {
  id          UUID PK
  terminalId  UUID FK → PosTerminal
  eventId     UUID FK → Event
  assignedBy  UUID FK → User
  assignedAt  timestamp
  -- UNIQUE(terminalId, eventId)
}
```

This is how event performance reporting works: `WHERE terminalId IN (SELECT terminalId FROM TerminalEvent WHERE eventId = ?)` filters all orders placed through terminals at that event.

---

### Category
```
Category {
  id        UUID PK
  name      string
  icon      string (asset name or S3 URL)
  sortOrder int
  isActive  bool
  deletedAt timestamp?   -- soft-delete (same reason as Product)
}
```

---

### Product (Catalog)
Products are managed from the admin back-office and synced to the POS.

```
Product {
  id            UUID PK
  name          string
  description   string?
  sku           string unique
  price         decimal(10,2)
  categoryId    UUID FK → Category
  imageUrl      string?
  status        enum: active | inactive | draft
  createdAt     timestamp
  updatedAt     timestamp
  deletedAt     timestamp?   -- soft-delete; NULL means not deleted
}
```
> **Soft-delete is required.** Hard-deleting a product would orphan `OrderItem.productId` references from orders created while the POS was offline. Always set `deletedAt` instead. Sync responses include `deletedProductIds[]` so devices can mark them locally.

**Product Variation Groups** (e.g. "Size", "Add-ons"):
```
VariationGroup {
  id          UUID PK
  productId   UUID FK → Product
  name        string          -- e.g. "Size"
  required    bool
  maxSelect   int             -- how many options can be chosen
  sortOrder   int
}
```

**Variation Options** (e.g. "Large +$0.50"):
```
VariationOption {
  id               UUID PK
  variationGroupId UUID FK → VariationGroup
  name             string       -- e.g. "Large"
  priceModifier    decimal(10,2) -- 0.00 if no extra charge
  sortOrder        int
}
```

---

### Customer
```
Customer {
  id          UUID PK
  clientId    UUID unique   -- UUID generated by the POS device; idempotency key for offline sync
  firstName   string
  lastName    string
  gender      enum: male | female | other
  phone       string?
  email       string?
  address     string?
  birthDate   date?
  isMember    bool default false
  createdAt   timestamp
  syncedAt    timestamp?    -- when this record was confirmed by the server (null if created online)
}
```
> **Note:** `memberType` (lifetime/monthly/annual) and `memberExpiryDate` are intentionally excluded from Phase 1. They will be added in Phase 3 when a loyalty/membership module is implemented.

---

### Order
```
Order {
  id                  UUID PK
  tenantId            UUID FK → Tenant
  terminalId          UUID FK → PosTerminal
  clientId            UUID unique     -- UUID generated by the POS device; idempotency key
  orderNumber         string unique   -- human-readable e.g. "PZ05329283"; generated server-side
  status              enum: open | in_progress | completed | cancelled
  orderType           enum: dine_in | take_away
  customerId          UUID? FK → Customer
  tableId             UUID? FK → Table  (Phase 3)
  cashierId           UUID FK → User
  subtotal            decimal(10,2)
  discountType        enum: percentage | amount | none   default: none
  discountValue       decimal(10,2)   default: 0
  tax                 decimal(10,2)
  total               decimal(10,2)
  paymentMethod       enum: cash | card
  amountPaid          decimal(10,2)
  change              decimal(10,2)
  notes               string?
  clientCreatedAt     timestamp       -- when the cashier completed the transaction (may differ from createdAt for offline orders)
  hadOfflineConflict  bool default false  -- true if synced with stale product/price data
  createdAt           timestamp       -- when the server persisted the record
  updatedAt           timestamp
}
```
`terminalId` is how event performance is queried: filter orders by terminals assigned to an event.

**Order Line Items:**
```
OrderItem {
  id          UUID PK
  orderId     UUID FK → Order
  productId   UUID? FK → Product   -- null if open/one-off item
  name        string               -- snapshot of name at time of sale
  unitPrice   decimal(10,2)        -- base price snapshot
  quantity    int
  subtotal    decimal(10,2)
  notes       string?
}
```

**Order Item Variations (snapshot):**
```
OrderItemVariation {
  id            UUID PK
  orderItemId   UUID FK → OrderItem
  groupName     string       -- e.g. "Size"
  optionName    string       -- e.g. "Large"
  priceModifier decimal(10,2)
}
```
> Price data is snapshotted at time of sale so historical orders are accurate even if product prices change.

---

### Tax Configuration (Phase 2)
```
TaxConfig {
  id        UUID PK
  name      string       -- e.g. "VAT"
  rate      decimal(5,4) -- e.g. 0.05 for 5%
  isActive  bool
}
```

---

### Discount (Phase 2+)
Phase 1: Only order-level percentage discount entered manually by cashier.
Phase 2+: Preset discount codes, per-item discounts, voucher validation.

```
Discount {
  id          UUID PK
  name        string
  type        enum: percentage | amount
  value       decimal(10,2)
  code        string? unique   -- voucher code
  isActive    bool
  expiresAt   timestamp?
  createdAt   timestamp
}
```

---

### Table (Phase 3)
```
Table {
  id        UUID PK
  name      string         -- e.g. "Table 4"
  shape     enum: circle | square | rectangle
  capacity  int
  status    enum: available | occupied | reserved
  posX      float          -- canvas position
  posY      float
  width     float
  height    float
  color     string         -- hex color
}
```

---

### Customer Membership (Phase 3)
```
Membership {
  id              UUID PK
  customerId      UUID FK → Customer unique
  type            enum: lifetime | monthly | annual
  startDate       date
  expiryDate      date?          -- null for lifetime
  isActive        bool
}
```

---

## API Endpoints

### Auth
```
POST   /auth/login              { email, password } → { accessToken, refreshToken, user }
POST   /auth/refresh            { refreshToken } → { accessToken }
GET    /auth/me                 → User profile
POST   /auth/logout
```

### POS Terminals
```
GET    /terminals               → PosTerminal[] for current tenant
POST   /terminals               (manager+) — registers a terminal, returns deviceToken
PATCH  /terminals/:id           (manager+)
DELETE /terminals/:id           (manager+)
```

### Events (SuperAdmin only)
```
GET    /events                  → Event[]
POST   /events                  (SuperAdmin)
PATCH  /events/:id              (SuperAdmin)
DELETE /events/:id              (SuperAdmin)
```

### Terminal–Event Assignments
```
GET    /events/:eventId/terminals         → TerminalEvent[] with terminal + tenant info
POST   /events/:eventId/terminals         (manager+) { terminalId } — assign terminal to event
DELETE /events/:eventId/terminals/:terminalId  (manager+) — remove assignment
GET    /terminals/:terminalId/events       → events this terminal is/was assigned to
```

### Categories
```
GET    /categories              → Category[]
POST   /categories              (manager+)
PATCH  /categories/:id          (manager+)
DELETE /categories/:id          (manager+)
```

### Products
```
GET    /products                → Product[] with variations (supports ?status=active for POS sync)
GET    /products/:id            → Product with variation groups + options
POST   /products                (manager+)
PATCH  /products/:id            (manager+)
DELETE /products/:id            (manager+)
```

### Orders
```
GET    /orders                  → paginated list; query: status, dateFrom, dateTo, orderType, paymentMethod, page, limit
GET    /orders/:id              → Order with items + variations
POST   /orders                  Create order (checkout)
PATCH  /orders/:id/status       { status } — move order through lifecycle
POST   /orders/:id/void         (manager+) Void a completed order
POST   /orders/:id/refund       (manager+) Issue refund
```

### Customers
```
GET    /customers               → paginated list; query: search, gender, isMember, page, limit
GET    /customers/:id           → Customer detail
POST   /customers               Create customer
PATCH  /customers/:id           Update customer
DELETE /customers/:id           (manager+)
```

### Reports
All report endpoints support optional `?terminalId=` filter for drill-down.
Add `?eventId=` to scope any report to a specific event (server joins via `TerminalEvent`).

```
GET    /reports/summary         ?from=&to=&terminalId=&eventId= → { totalOrders, totalRevenue, totalCustomers, newCustomers, ...deltas }
GET    /reports/sales           ?from=&to=&groupBy=day|week|month&eventId= → SalesData[]
GET    /reports/top-products    ?from=&to=&limit=10&eventId= → TopProduct[]
GET    /reports/product-status  → { active, inactive, draft }
GET    /reports/recent-orders   ?limit=5&terminalId= → Order[]
```

#### Event performance report
The event report is simply the standard summary filtered by `eventId`. The server resolves `eventId` → terminal IDs → orders automatically. The restaurant sees only their own terminals' data (tenant-scoped); a SuperAdmin can see all tenants at an event.

### Feature Flags (Phase 2)
```
GET    /feature-flags           → FeatureFlagData (server-driven flags for the POS)
```

### Tables (Phase 3)
```
GET    /tables                  → Table[]
POST   /tables                  (manager+)
PATCH  /tables/:id
PATCH  /tables/:id/status       { status: available | occupied }
DELETE /tables/:id              (manager+)
```

### Tax Config (Phase 2)
```
GET    /tax-config              → TaxConfig[]
POST   /tax-config              (manager+)
PATCH  /tax-config/:id          (manager+)
```

### Discounts / Vouchers (Phase 2+)
```
GET    /discounts               → Discount[]
POST   /discounts               (manager+)
PATCH  /discounts/:id           (manager+)
DELETE /discounts/:id           (manager+)
POST   /discounts/validate      { code } → Discount | 404
```

### Membership (Phase 3)
```
GET    /customers/:id/membership
POST   /customers/:id/membership
PATCH  /customers/:id/membership
```

### Sync (Offline Support)

#### Catalog sync — POS pulls read-only data
```
GET    /sync/catalog
```
Query params:
- `?updatedAfter=<ISO timestamp>` — incremental: only return records changed since this time. Omit for full sync (first launch).

Response shape:
```json
{
  "products": [...],
  "categories": [...],
  "deletedProductIds": ["uuid", "uuid"],
  "deletedCategoryIds": ["uuid"],
  "taxConfig": { ... },
  "featureFlags": { ... },
  "syncedAt": "2024-01-01T12:00:00Z"
}
```
The POS stores `syncedAt` and passes it as `updatedAfter` on the next sync.

#### Order sync — POS pushes offline-created orders
```
POST   /sync/orders
```
Request body:
```json
{
  "orders": [
    {
      "clientId": "uuid-generated-by-pos",
      "clientCreatedAt": "2024-01-01T10:00:00Z",
      "orderType": "dine_in",
      "customerId": "uuid-or-null",
      "discountType": "percentage",
      "discountValue": 10,
      "paymentMethod": "cash",
      "amountPaid": 25.00,
      "notes": null,
      "items": [
        {
          "productId": "uuid-or-null",
          "name": "Classic Crispyburger",
          "unitPrice": 4.75,
          "quantity": 2,
          "notes": null,
          "variations": [
            { "groupName": "Size", "optionName": "Large", "priceModifier": 0.50 }
          ]
        }
      ]
    }
  ]
}
```
Response body:
```json
{
  "results": [
    {
      "clientId": "uuid",
      "serverId": "uuid",
      "orderNumber": "PZ05329283",
      "status": "created"
    },
    {
      "clientId": "uuid",
      "serverId": "uuid",
      "orderNumber": "PZ05329284",
      "status": "already_exists"
    },
    {
      "clientId": "uuid",
      "serverId": null,
      "status": "failed",
      "error": "Invalid product reference"
    }
  ]
}
```
Orders are processed in `clientCreatedAt` order. The server always returns `200` for the batch — individual failures are reported per-item in `results`.

#### Customer sync — POS pushes offline-created customers
```
POST   /sync/customers
```
Request body:
```json
{
  "customers": [
    {
      "clientId": "uuid-generated-by-pos",
      "firstName": "Ahmed",
      "lastName": "Ali",
      "gender": "male",
      "phone": "+249912345678"
    }
  ]
}
```
Response body:
```json
{
  "results": [
    {
      "clientId": "uuid",
      "serverId": "uuid",
      "status": "created"
    },
    {
      "clientId": "uuid",
      "serverId": "uuid-of-existing",
      "status": "duplicate_phone",
      "message": "A customer with this phone already exists"
    }
  ]
}
```

---

## Authorization / Roles

| Role     | Capabilities |
|---|---|
| `owner`   | Full access |
| `manager` | Everything except owner settings; can void/refund orders, manage products/discounts |
| `cashier` | POS transactions only: browse products, create orders, apply pre-approved discounts, manage customers |

Implement role guards on NestJS routes using a `@Roles()` decorator + JWT guard.

---

## Phase Roadmap

### Phase 1 — Core Transaction Loop (MVP) ✅
These endpoints must exist before the app is usable as a POS:

**Base-template fixes (do first):**
- [x] Bcrypt on user passwords
- [x] Tenant-scoped login (`POST /auth/login` requires `x-tenant-id`)
- [x] `UNIQUE(email, tenantId)` on users
- [x] Validate tenant UUID in middleware against DB
- [x] `UserService` uses tenant-scoped repository

**ClaPos Phase 1:**
- [x] Tenant + POS Terminal setup (registration flow)
- [x] `GET /sync/catalog` (products + categories + variations — full and incremental)
- [x] `POST /orders` (online order creation with `clientId` idempotency)
- [x] `POST /orders/sync` (offline order batch upload)
- [x] `POST /sync/customers` (offline customer batch upload with duplicate-phone detection)
- [x] `POST /customers` (online customer creation)
- [x] `GET /orders` + `GET /orders/:id`
- [x] `GET /reports/summary`

### Phase 2 — Operations (partially done)
- [x] `PATCH /orders/:id/status`
- [x] `POST /orders/:id/void` + `POST /orders/:id/refund`
- [x] Full reports suite with `terminalId` filter (`/reports/sales`, `/reports/top-products`, `/reports/product-status`, `/reports/recent-orders`)
- [ ] Tax config endpoints
- [ ] Feature flags endpoint
- [ ] Discount/voucher endpoints
- [ ] `eventId` filter on reports

### Phase 3 — Growth Features
- [ ] Events + TerminalEvent assignments
- [ ] Event performance reporting (`?eventId=` filter on all reports)
- [ ] Table management endpoints
- [ ] Customer membership endpoints
- [ ] Real-time table status (WebSocket)
- [ ] Advanced discount types (per-item, member-only)
- [ ] Sales export (PDF/CSV generation)

---

## Business Logic Notes

### Order creation flow — online (`POST /orders`)
The standard online path. The `POST /orders` endpoint is also used directly when the device is online; the device still provides a `clientId`.

1. Check `clientId` — if an order with this `clientId` already exists, return it (idempotent)
2. Validate all non-null `productId`s reference existing (non-deleted) products
3. Re-calculate price server-side from current product prices — **never trust client totals for online orders**
4. Apply discount if `discountType != none`
5. Apply active tax rate
6. Snapshot product names and prices into `OrderItem` and `OrderItemVariation`
7. Generate a human-readable `orderNumber`
8. Return the created order

### Order creation flow — offline sync (`POST /sync/orders`)
Offline orders were priced at the time the cashier completed the transaction. The server:

1. Checks `clientId` — deduplicate, return existing if already synced
2. Accepts item prices **as submitted** (`OrderItem.unitPrice`) — do not re-price; the cashier and customer already transacted at those prices
3. If a product has since been deleted: accept the item (snapshot is already in the payload), `hadOfflineConflict = true`
4. If a product's price changed: accept at the submitted price, `hadOfflineConflict = true`
5. Generate `orderNumber`, persist, return result

> The distinction matters: online orders are re-priced server-side (security); offline orders trust the snapshot (the transaction already happened).

### Open / one-off items
When a cashier adds an item not in the catalog (`productId: null`):
- `OrderItem.name` = cashier-entered name
- `OrderItem.unitPrice` = cashier-entered price
- No variation data

### Catalog sync
The `GET /sync/catalog` endpoint is the single source of truth for device state:
- Called on first launch (full sync, no `updatedAfter`)
- Called on app resume / connectivity restored (incremental, pass stored `syncedAt` as `updatedAfter`)
- Products and categories use soft-delete — `deletedProductIds[]` and `deletedCategoryIds[]` in the response tell the device which local records to mark as deleted
- The device should refresh the catalog before allowing order creation when it detects it has been offline for an extended period

### Tax calculation
Tax is calculated on `(subtotal - discountValue)`. Round to nearest 0.25 to match current app behavior (or make this configurable in `TaxConfig`).

### Discount application
Phase 1: Only `discountType: percentage` is active in the UI.
- `discountValue` = percentage integer (e.g. `15` = 15%)
- Discount amount = `subtotal * (discountValue / 100)`

---

## Environment Variables

```
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
AWS_S3_BUCKET=...        # for product images
AWS_REGION=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```
