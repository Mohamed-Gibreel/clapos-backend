# NestJS Base Template

Reusable multi-tenant NestJS backend template with JWT authentication, RBAC, tenant-scoped secrets, project-level isolation, and production-ready infrastructure (Docker, Ansible, Jenkins).

## Tech Stack

- **Framework**: NestJS (Node.js/TypeScript)
- **Database**: PostgreSQL with TypeORM
- **Cache/Queue**: Redis with BullMQ
- **Storage**: MinIO (S3-compatible) for media uploads
- **Auth**: JWT (Passport.js) with tenant-scoped secrets
- **Docs**: Swagger (available at `/`)
- **Infrastructure**: Docker, Ansible, Jenkins

## Project Structure

```
src/
├── auth/                    # JWT authentication, login
├── user/                    # User management with RBAC
├── tenant/                  # Multi-tenant isolation
├── project/                 # Projects within tenants
├── role/                    # Role-based access control
├── seed/                    # Database seeding (roles, superadmin)
├── config/                  # TypeORM configuration
├── database/migrations/     # TypeORM migrations
└── utils/
    ├── entities/base.entity.ts   # Base entity (UUID, timestamps, soft delete)
    ├── result.ts                 # Result<T,E> type for services
    ├── guards/                   # JWT and Role guards
    ├── strategies/               # Passport strategies
    ├── filters/                  # Exception filters
    ├── interceptors/             # Response transformation
    ├── decorators/               # Custom decorators (@Public, @Role, etc.)
    └── constants.ts              # Environment variable keys
```

## Essential Commands

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

Required variables (see `.env.example`):
- `POSTGRES_HOST`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`
- `REDIS_HOST`, `REDIS_PORT`
- `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET` - object storage for uploaded media
- `MASTER_SECRET` - Base key for tenant JWT secrets

## Key Entry Points

- **Application entry**: `src/main.ts`
- **Root module**: `src/app.module.ts`
- **TypeORM config**: `src/config/typeorm.config.ts`

## API Patterns

- All responses wrapped in `{ data?, error? }` format
- Services return `Result<T, Error>` - see `src/utils/result.ts`
- Tenant ID required in `x-tenant-id` header (except `/auth/login`)
- Endpoints protected by JWT + Role guards by default; use `@Public()` for exceptions

## Roles

Three roles seeded on startup: `SuperAdmin`, `Admin`, `User`. Defined in `src/utils/decorators/roles.decorator.ts`.

## Additional Documentation

When working on specific areas, consult these files:

| Topic | File |
|-------|------|
| Architectural patterns, conventions, Result type usage | `.claude/docs/architectural_patterns.md` |

## Infrastructure

- **Docker**: Multi-stage builds in `Dockerfile.app`, `Dockerfile.migration`
- **Ansible**: Playbooks in `ansible/` for bootstrap, deploy, SSH setup
- **Jenkins**: Pipeline in `Jenkinsfile` with branch-based tagging
- All infrastructure files use `PLACEHOLDER_*` values - configure for your environment
