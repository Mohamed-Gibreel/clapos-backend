# NestJS Base Template

A production-ready NestJS backend template with multi-tenant architecture, JWT authentication with tenant-scoped secrets, role-based access control, and full CI/CD infrastructure.

## What's Included

- **Multi-Tenant Architecture** - Request-scoped tenant isolation via middleware and scoped repositories
- **Project Hierarchy** - Tenant -> Project organizational structure
- **JWT Authentication** - Passport.js with tenant-scoped secret derivation (HMAC-SHA256)
- **RBAC** - Role-based access control with SuperAdmin, Admin, and User roles
- **Result Type Pattern** - Type-safe error handling without exceptions
- **TypeORM + PostgreSQL** - Database with migrations, soft deletes, and base entity
- **BullMQ + Redis** - Queue infrastructure ready for background jobs
- **Swagger** - Auto-generated API documentation at `/`
- **Docker** - Multi-stage builds for app and migration containers
- **Ansible** - Playbooks for server bootstrap and deployment
- **Jenkins** - CI/CD pipeline with branch-based image tagging

## Quick Start

1. **Clone and install**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database and Redis connection details
   ```

3. **Start infrastructure**
   ```bash
   npm run compose:dev:up   # Starts PostgreSQL + Redis via Docker
   ```

4. **Generate and run migrations**
   ```bash
   npm run migration:generate
   npm run migration:run
   ```

5. **Start development server**
   ```bash
   npm run start:dev
   ```

6. **Open Swagger** at `http://localhost:3000`

## Default Credentials

On first startup, the seed service creates:
- **Tenant**: `SuperAdmins`
- **User**: `user@example.com` / `string` (SuperAdmin role)

## Adding a New Domain Module

Follow the feature module pattern:

```
src/<feature>/
├── <feature>.module.ts      # NestJS module
├── <feature>.service.ts     # Business logic (return Result<T, E>)
├── <feature>.controller.ts  # REST endpoints
├── entities/
│   └── <feature>.entity.ts  # TypeORM entity (extend BaseEntity)
└── dto/
    ├── create-<feature>.dto.ts
    └── update-<feature>.dto.ts
```

1. Create the module structure above
2. Extend `BaseEntity` for your entity
3. Return `Result<T, E>` from service methods
4. Use `@TenantRepository(Entity)` for tenant-isolated data
5. Register your module in `src/app.module.ts`
6. Generate a migration: `npm run migration:generate`

## Infrastructure Placeholders

Infrastructure files contain `PLACEHOLDER_*` values that need to be configured for your environment:

| Placeholder | File(s) | Description |
|-------------|---------|-------------|
| `PLACEHOLDER_REGISTRY_URL` | `Jenkinsfile`, `ansible/group_vars/*.yaml` | Docker registry URL |
| `PLACEHOLDER_IMAGE_NAME` | `Jenkinsfile`, `ansible/group_vars/*.yaml` | Docker image name |
| `PLACEHOLDER_REPO_URL` | `Jenkinsfile` | Git repository URL |
| `PLACEHOLDER_CREDENTIALS_ID` | `Jenkinsfile` | Jenkins credentials ID |
| `PLACEHOLDER_SSH_HOST` | `ansible/inventory.yml` | Server SSH hostname |
| `PLACEHOLDER_SSH_KEY_PATH` | `ansible/deploy.yml` | Path to SSH private key |
| `PLACEHOLDER_USER` | `ansible/bootstrap.yml` | Remote SSH user for bootstrap |
| `PLACEHOLDER_DOMAIN` | `ansible/.env`, `ansible/group_vars/*.yaml` | Application domain |
| `PLACEHOLDER_SECRET` | `ansible/.env`, `ansible/group_vars/*.yaml` | JWT master secret |

## Commands

```bash
# Development
npm run start:dev          # Start with hot reload (includes Docker Compose)
npm run build              # Compile TypeScript

# Testing
npm run test               # Unit tests
npm run test:e2e           # E2E tests
npm run test:cov           # Coverage report

# Database
npm run migration:generate # Generate migration from entity changes
npm run migration:run      # Apply pending migrations
npm run migration:revert   # Revert last migration

# Docker
npm run compose:dev:up     # Start dev environment (PostgreSQL, Redis)
npm run compose:dev:down   # Stop dev environment
```

## Environment Variables

See `.env.example` for the full list:
- `POSTGRES_HOST`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`
- `REDIS_HOST`, `REDIS_PORT`
- `MASTER_SECRET` - Base key for deriving tenant-specific JWT secrets
