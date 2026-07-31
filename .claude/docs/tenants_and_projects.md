# Tenants & Projects — Structure and Mechanics

## Overview

The system uses a two-level isolation hierarchy:

```
Tenant
├── Users   (belong to a tenant)
└── Projects
    └── Project-scoped entities (belong to a tenant AND a project)
```

Every HTTP request carries the tenant context in a header. Some requests also carry a project context. All data queries are automatically filtered to the resolved scope.

---

## 1. Data Model

### Tenant (`src/tenant/entities/tenant.entity.ts`)

| Field       | Type     | Notes                        |
|-------------|----------|------------------------------|
| `id`        | UUID     | PK, auto-generated           |
| `name`      | string   | Display name                 |
| `users`     | User[]   | One-to-many                  |
| `projects`  | Project[]| One-to-many                  |
| `createdAt` | Date     | Auto (BaseEntity)            |
| `updatedAt` | Date     | Auto (BaseEntity)            |
| `deletedAt` | Date?    | Soft delete (BaseEntity)     |

### Project (`src/project/entities/project.entity.ts`)

| Field       | Type     | Notes                                      |
|-------------|----------|--------------------------------------------|
| `id`        | UUID     | PK, auto-generated                         |
| `name`      | string   | Display name                               |
| `tenant`    | Tenant   | Many-to-one FK; composite unique with name |
| `createdAt` | Date     | Auto (BaseEntity)                          |
| `updatedAt` | Date     | Auto (BaseEntity)                          |
| `deletedAt` | Date?    | Soft delete (BaseEntity)                   |

A database-level `UNIQUE('name', 'tenant')` constraint prevents duplicate project names within the same tenant.

### User (`src/user/entities/user.entity.ts`)

Users belong directly to a tenant (not a project). They carry a role (`SuperAdmin`, `Admin`, `User`) that determines what operations they may perform.

---

## 2. Request Context Flow

### Tenant context — every request

```
HTTP Request
  └── Header: x-tenant-id: <uuid>
        └── TenantMiddleware (src/tenant/tenant.middleware.ts)
              └── TenantContextService.setTenantId()   [REQUEST-scoped]
                    └── Available anywhere via injection
```

`TenantMiddleware` is applied globally in `AppModule` to all routes **except** `POST /auth/login`. If the header is absent the middleware throws `401 Unauthorized`.

### Project context — opt-in per module

```
HTTP Request
  └── Header: x-project-id: <uuid>
        └── ProjectMiddleware (src/project/project.middleware.ts)
              └── ProjectContextService.setProjectId()  [REQUEST-scoped]
                    └── Available anywhere via injection
```

`ProjectMiddleware` is not registered globally. Each feature module that needs project-level isolation must register it explicitly.

### Context services

Both `TenantContextService` and `ProjectContextService` are declared with `Scope.REQUEST`, so a fresh instance exists for every HTTP request — there is no cross-request leakage.

---

## 3. Tenant-Scoped JWT Secrets

JWT tokens are signed with a secret derived from the tenant ID, not a global application secret.

```
MASTER_SECRET (env var)
    + tenantId
    ──HMAC-SHA256──▶ tenantSecret
```

Implementation: `src/utils/get-tenant-secret.ts`

**At login** (`AuthService.login`): the token is signed with `deriveTenantSecret(user.tenant.id)`.

**On every authenticated request** (`JwtStrategy`): the `secretOrKeyProvider` reads `x-tenant-id` from the request header and re-derives the same secret to validate the token. A token issued for tenant A is cryptographically invalid when presented with tenant B's header.

---

## 4. Scoped Repositories

### Tenant-scoped repository

`TenantAwareModule.forEntities(entities)` (`src/tenant/tenant-aware.module.ts`) creates a request-scoped repository extension for each entity. The extension overrides `find` and `findOne` to inject a `tenant: { id }` filter automatically:

```ts
// Every find/findOne transparently adds:
options.where = { ...options.where, tenant: { id: tenantId } };
```

Additional helpers:
- `saveWithTenant(entity)` — attaches the current tenant ID before saving.
- `softDeleteWithTenant(id)` — soft-deletes only within the current tenant.

Providers are registered as `TenantRepository_<EntityName>` and injected via the `@TenantRepository(Entity)` decorator (`src/utils/decorators/tenant-repository.decorator.ts`).

### Project-scoped repository

`ProjectAwareModule.forEntities(entities)` (`src/project/project-aware.module.ts`) does the same for project-level entities, but the filter is double-nested:

```ts
options.where = {
  ...options.where,
  project: {
    id: projectId,
    tenant: { id: tenantId },
  },
};
```

This means a project-scoped query is always validated against *both* the project **and** the tenant — a project ID from a different tenant cannot be used to leak data.

Providers are registered as `ProjectRepository_<EntityName>` and injected via `@ProjectRepository(Entity)`.

---

## 5. Module Wiring

### TenantEntityModule / ProjectEntityModule

These are convenience wrapper modules that bundle TypeORM registration with the scoped repository factory in a single call:

```ts
// For a tenant-scoped entity:
TenantEntityModule.forFeature([MyEntity])

// For a project-scoped entity:
ProjectEntityModule.forFeature([MyEntity])
```

Calling `forFeature` is equivalent to:
1. `TypeOrmModule.forFeature([MyEntity])` — registers the base TypeORM repository.
2. `TenantAwareModule.forEntities([MyEntity])` (or `ProjectAwareModule`) — registers the scoped repository.

### Example: ProjectModule

`ProjectModule` (`src/project/project.module.ts`) imports `TenantEntityModule.forFeature([Project])` because projects are tenant-scoped. `ProjectService` then injects via `@TenantRepository(Project)` to get the automatically filtered repository.

---

## 6. API Endpoints & Access Control

### Tenant API — `/tenant`

| Method   | Path          | Role Required | Description          |
|----------|---------------|---------------|----------------------|
| `POST`   | `/tenant`     | SuperAdmin    | Create a tenant      |
| `GET`    | `/tenant`     | SuperAdmin    | List all tenants     |
| `GET`    | `/tenant/:id` | SuperAdmin    | Get one tenant       |
| `PATCH`  | `/tenant/:id` | SuperAdmin    | Update a tenant      |
| `DELETE` | `/tenant/:id` | SuperAdmin    | Delete a tenant      |

All endpoints require the `x-tenant-id` header (enforced by middleware) and a valid JWT (`SuperAdmin` role).

### Project API — `/project`

| Method   | Path           | Role Required | Description          |
|----------|----------------|---------------|----------------------|
| `POST`   | `/project`     | Admin         | Create a project     |
| `GET`    | `/project`     | Admin         | List projects        |
| `GET`    | `/project/:id` | Admin         | Get one project      |
| `PATCH`  | `/project/:id` | Admin         | Update a project     |
| `DELETE` | `/project/:id` | Admin         | Delete a project     |

Projects are created by supplying `{ name, tenantId }` in the body. The service looks up the tenant and associates it. Duplicate project names per tenant are rejected at the DB level (409 Conflict).

---

## 7. Adding a New Tenant-Scoped Entity

1. Create the entity extending `BaseEntity`. Add a `ManyToOne` relation to `Tenant`.
2. In the feature module, import `TenantEntityModule.forFeature([MyEntity])`.
3. In the service, inject with `@TenantRepository(MyEntity) private repo: Repository<MyEntity>`.
4. Call `repo.find(...)` / `repo.findOne(...)` — tenant filtering is automatic.
5. Use `repo.saveWithTenant(dto)` to persist with the tenant attached.

## 8. Adding a New Project-Scoped Entity

1. Create the entity extending `BaseEntity`. Add a `ManyToOne` relation to `Project`.
2. In the feature module, import `ProjectEntityModule.forFeature([MyEntity])`.
3. Register `ProjectMiddleware` for the routes that need it.
4. In the service, inject with `@ProjectRepository(MyEntity) private repo: Repository<MyEntity>`.
5. Call `repo.find(...)` / `repo.findOne(...)` — both tenant and project filtering are automatic.
