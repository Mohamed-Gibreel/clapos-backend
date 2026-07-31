# Architectural Patterns

This document describes the architectural patterns and design conventions used throughout the codebase.

## Multi-Tenant Architecture

The system implements request-scoped multi-tenancy using middleware and context services.

### Tenant/Project Context Services
- **Pattern**: REQUEST-scoped services store tenant/project IDs extracted from headers
- **Implementation**: `src/tenant/tenant-context.service.ts`, `src/project/project-context.service.ts`
- **Header**: `x-tenant-id` extracted in `src/tenant/tenant.middleware.ts`
- **Registration**: Middleware registered in `src/app.module.ts`

### Scoped Repositories
- **Pattern**: Dynamic modules create tenant/project-filtered repositories
- **Implementation**: `src/tenant/tenant-aware.module.ts`, `src/project/project-aware.module.ts`
- **Usage**: `@TenantRepository(Entity)` decorator injects scoped repository
- **Example**: `src/project/project.service.ts`

## Result Type Pattern

All service methods return `Result<T, Error>` instead of throwing exceptions.

### Implementation
- **Definition**: `src/utils/result.ts` - Generic factory with discriminated union
- **Success**: `Result.success(value)`
- **Error**: `Result.error({ error: string[], errorCode: HttpStatus })`

### Usage Examples
- `src/auth/auth.service.ts` - Login with validation errors
- `src/role/role.service.ts` - CRUD operations
- `src/tenant/tenant.service.ts` - Entity operations

### Response Transformation
- **Interceptor**: `src/utils/interceptors/response_interceptor.ts`
- **DTO**: `src/utils/interceptors/api_response.dto.ts`
- Transforms Result -> `{ data?, error?, detail? }` format

## Authentication & Authorization

### JWT with Tenant-Scoped Secrets
- **Pattern**: JWT tokens signed with secrets derived from master key + tenant ID
- **Secret derivation**: `src/utils/get-tenant-secret.ts` (HMAC-SHA256)
- **Strategy**: `src/utils/strategies/jwt.strategy.ts` - Dynamic secret lookup
- **Token creation**: `src/auth/auth.service.ts`

### Guard System
- **JWT Guard**: `src/utils/guards/jwt-auth.guard.ts` - Respects `@Public()` decorator
- **Role Guard**: `src/utils/guards/role.guard.ts` - Checks `@Role()` decorator
- **Registration**: `src/app.module.ts` as APP_GUARD

### Decorators
- `@Public()` - Mark endpoint as unauthenticated
- `@Role([Roles.Admin])` - Require specific roles

## Entity Design

### Base Entity
- **Definition**: `src/utils/entities/base.entity.ts`
- **Fields**: UUID `id`, `createdAt`, `updatedAt`, `deletedAt` (soft delete)
- **All entities extend BaseEntity**

### Entity Relationships
- OneToMany/ManyToOne with explicit JoinColumn
- Example: `src/tenant/entities/tenant.entity.ts`
- Lazy loading via `relations: []` parameter in queries

## DTO Validation

### Pattern
- DTOs use class-validator decorators
- Validated via `convertToInstance()` before business logic

### Implementation
- **Validator**: `src/utils/dto-validator.ts`
- **DTO Example**: `src/user/dto/create-user.dto.ts`
- **Usage**: `src/tenant/tenant.service.ts`

## Module Organization

### Feature Module Structure
Each domain follows consistent structure:
```
src/<feature>/
├── <feature>.module.ts      # NestJS module
├── <feature>.service.ts     # Business logic
├── <feature>.controller.ts  # REST endpoints
├── entities/
│   └── <feature>.entity.ts  # TypeORM entity
└── dto/
    ├── create-<feature>.dto.ts
    └── update-<feature>.dto.ts
```

### Dynamic Modules
- `TenantEntityModule.forFeature(entities)` - Tenant-scoped entities
- `ProjectEntityModule.forFeature(entities)` - Project-scoped entities

### Circular Dependencies
- Use `forwardRef(() => Module)` in imports
- Example: `src/user/user.service.ts`, `src/role/role.module.ts`

## Queue-Based Processing

### BullMQ Integration
- **Configuration**: `src/app.module.ts` - BullModule.forRootAsync with Redis connection
- **Pattern**: Register queues with `BullModule.registerQueue({ name: QUEUE_NAME })`

### Processor Pattern
- Extend `WorkerHost` class
- Use `@Processor(QUEUE_NAME)` decorator
- Implement `process(job: Job)` method

## Error Handling

### Service Layer
- Return `Result.error()` with explicit `HttpStatus` codes
- Common codes: `BAD_REQUEST` (validation), `NOT_FOUND` (missing entity), `UNPROCESSABLE_ENTITY` (DB failure)

### Controller Layer
- Global exception filter: `src/utils/filters/http-exception.filter.ts`
- Debug details included in development mode only

## Configuration Management

### Environment Variables
- Keys defined in `src/utils/constants.ts`
- Accessed via `ConfigService.get(KEY)`
- App configuration: `src/app.module.ts`

## Key Conventions

1. **Return Result<T, E>** from services - never throw exceptions
2. **Use @TenantRepository** for tenant-isolated entities
3. **Include HttpStatus codes** in all error responses
4. **Validate DTOs** at service entry with `convertToInstance`
5. **Use @Public()** on unauthenticated endpoints
6. **Extend BaseEntity** for all entities
7. **Pass EntityManager** for transactional operations
8. **Use relations: []** for explicit eager loading
