# Backend Implementation Plan: SCRUM-5 Authentication System (Email + OAuth + Dashboard Access)

## Overview

- **Epic**: N/A -- standalone task (parent of SCRUM-6 through SCRUM-9)
- **Ticket**: SCRUM-5
- **Priority**: CRITICAL -- foundational backend authentication for the entire EM Ecosystem
- **What this implements**: The complete backend authentication system for the EM Ecosystem platform, covering email/password registration and login, Google and GitHub OAuth flows, JWT-based stateless session management, role-based access control, and user management endpoints.

| Sub-task | Scope | Status |
|----------|-------|--------|
| **SCRUM-6** | User Entity, Registration & Password Hashing | Covered |
| **SCRUM-7** | Email/Password Login & Token Management | Covered |
| **SCRUM-8** | OAuth Integration (Google + GitHub) | Covered |
| **SCRUM-9** | Dashboard Access Control (Guards & Roles) | Covered |

**Architecture**: NestJS 11 modular architecture with clean separation of concerns. Prisma ORM with PostgreSQL via the `PrismaPg` driver adapter. JWT-based stateless authentication with bcrypt password hashing and hashed refresh token storage.

**Key Principle**: Baby steps, one at a time. TDD. Type safety. English only.

**User Story**: As a user of the EM Ecosystem platform, I want to register and log in using email/password, Google, or GitHub, so that I can securely access the admin dashboard with role-appropriate permissions.

---

## Architecture Context

### Modules Involved

| Module | Responsibility | New/Modified |
|--------|---------------|--------------|
| `PrismaModule` | Global database access via PrismaClient | New |
| `AuthModule` | Authentication endpoints, JWT issuance, OAuth flows | New |
| `UsersModule` | User CRUD, profile management, account locking | New |
| `AppModule` | Root module, wires everything together | Modified |

### Components Affected

| Component | File | Purpose |
|-----------|------|---------|
| `AuthController` | `src/auth/auth.controller.ts` | HTTP endpoints for register, login, refresh, logout, OAuth, /me, admin |
| `AuthService` | `src/auth/auth.service.ts` | Business logic: registration, login, token management, OAuth validation |
| `UsersService` | `src/users/users.service.ts` | User CRUD, failed attempts, account locking, OAuth find-or-create |
| `UsersController` | `src/users/users.controller.ts` | User management endpoints (profile, admin user CRUD) |
| `JwtStrategy` | `src/auth/strategies/jwt.strategy.ts` | Passport JWT strategy for token validation |
| `GoogleStrategy` | `src/auth/strategies/google.strategy.ts` | Passport Google OAuth2 strategy |
| `GitHubStrategy` | `src/auth/strategies/github.strategy.ts` | Passport GitHub OAuth2 strategy |
| `JwtAuthGuard` | `src/auth/guards/jwt-auth.guard.ts` | Guard for JWT-protected routes |
| `GoogleAuthGuard` | `src/auth/guards/google-auth.guard.ts` | Guard for Google OAuth routes |
| `GitHubAuthGuard` | `src/auth/guards/github-auth.guard.ts` | Guard for GitHub OAuth routes |
| `RolesGuard` | `src/auth/guards/roles.guard.ts` | Guard for role-based access control |
| `@Roles()` | `src/common/decorators/roles.decorator.ts` | Custom decorator for setting required roles |
| `RegisterDto` | `src/auth/dto/register.dto.ts` | Registration input with class-validator |
| `LoginDto` | `src/auth/dto/login.dto.ts` | Login input with class-validator |
| `RefreshTokenDto` | `src/auth/dto/refresh-token.dto.ts` | Refresh token input |
| `HttpExceptionFilter` | `src/common/filters/http-exception.filter.ts` | Global standardized error responses |
| `User` entity | `src/users/entities/user.entity.ts` | User interface, SafeUser type, toSafeUser helper |
| `JwtPayload` | `src/common/interfaces/jwt-payload.interface.ts` | JWT token payload interface |
| `OAuthProfile` | `src/common/interfaces/oauth-profile.interface.ts` | OAuth provider profile interface |
| Prisma schema | `prisma/schema.prisma` | User model, Role enum, Provider enum |

### Layers (NestJS Adaptation of DDD)

| DDD Layer | NestJS Equivalent | Responsibility |
|-----------|-------------------|----------------|
| **Presentation** | Controllers + DTOs | HTTP request/response handling, input validation via pipes |
| **Application** | Services (`@Injectable()`) | Business logic orchestration |
| **Domain** | Entities + Enums + Interfaces | Core business models and contracts |
| **Infrastructure** | Prisma Module + Repositories | Database access, external integrations |

### Target Project Structure (after complete implementation)

```
nexacore-api/
├── src/
│   ├── app.module.ts                          # Root module
│   ├── main.ts                                # Bootstrap (CORS, pipes, filters, Swagger)
│   ├── prisma/
│   │   ├── prisma.module.ts                   # Global Prisma module
│   │   └── prisma.service.ts                  # PrismaClient wrapper (PrismaPg adapter)
│   ├── auth/
│   │   ├── auth.module.ts                     # Auth feature module
│   │   ├── auth.controller.ts                 # Auth endpoints (register, login, refresh, logout, OAuth, /me, admin)
│   │   ├── auth.service.ts                    # Auth business logic
│   │   ├── dto/
│   │   │   ├── register.dto.ts                # RegisterDto with class-validator
│   │   │   ├── login.dto.ts                   # LoginDto with class-validator
│   │   │   └── refresh-token.dto.ts           # RefreshTokenDto
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts                # Passport JWT strategy
│   │   │   ├── google.strategy.ts             # Passport Google OAuth strategy
│   │   │   └── github.strategy.ts             # Passport GitHub OAuth strategy
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts              # JWT auth guard
│   │   │   ├── google-auth.guard.ts           # Google OAuth guard
│   │   │   ├── github-auth.guard.ts           # GitHub OAuth guard
│   │   │   └── roles.guard.ts                 # Role-based access guard
│   │   └── tests/
│   │       ├── auth.controller.spec.ts        # Controller unit tests
│   │       ├── auth.service.spec.ts           # Service unit tests
│   │       ├── jwt.strategy.spec.ts           # JWT strategy tests
│   │       ├── google.strategy.spec.ts        # Google strategy tests
│   │       ├── github.strategy.spec.ts        # GitHub strategy tests
│   │       └── roles.guard.spec.ts            # Roles guard tests
│   ├── users/
│   │   ├── users.module.ts                    # Users feature module
│   │   ├── users.service.ts                   # User CRUD operations
│   │   ├── users.controller.ts                # User management endpoints
│   │   ├── entities/
│   │   │   └── user.entity.ts                 # User interface, SafeUser, toSafeUser
│   │   ├── enums/
│   │   │   ├── role.enum.ts                   # Role enum (SUPERADMIN, ADMIN, USER)
│   │   │   └── provider.enum.ts               # Provider enum (LOCAL, GOOGLE, GITHUB)
│   │   ├── dto/
│   │   │   ├── update-profile.dto.ts          # Profile update DTO
│   │   │   ├── change-password.dto.ts         # Password change DTO
│   │   │   ├── admin-update-user.dto.ts       # Admin user update DTO
│   │   │   └── list-users-query.dto.ts        # User list query DTO
│   │   └── tests/
│   │       └── users.service.spec.ts          # Users service unit tests
│   └── common/
│       ├── decorators/
│       │   └── roles.decorator.ts             # @Roles() decorator
│       ├── filters/
│       │   ├── http-exception.filter.ts       # Global exception filter
│       │   └── tests/
│       │       └── http-exception.filter.spec.ts  # Exception filter tests
│       └── interfaces/
│           ├── jwt-payload.interface.ts        # JWT payload type
│           └── oauth-profile.interface.ts      # OAuth profile type
├── prisma/
│   ├── schema.prisma                          # Database schema
│   └── migrations/
│       ├── 0001_init/                         # Initial User model migration
│       └── 20260225230005_add_profile_fields_and_superadmin/  # Profile fields + SUPERADMIN
├── test/
│   └── app.e2e-spec.ts                        # E2E tests
├── .env                                       # Environment variables (git-ignored)
├── .env.example                               # Environment template
├── nest-cli.json                              # NestJS CLI config
├── tsconfig.json                              # TypeScript config
├── tsconfig.build.json                        # Build config
└── package.json                               # Dependencies + Jest config (90% threshold)
```

---

## Endpoint Specification

### Auth Endpoints

| Method | URL | Auth | Request DTO | Response | Status Codes | Sub-task |
|--------|-----|------|-------------|----------|--------------|----------|
| `POST` | `/auth/register` | None | `RegisterDto` | `{ accessToken, refreshToken, user: SafeUser }` | `201` Created, `400` Validation, `409` Email exists | SCRUM-6 |
| `POST` | `/auth/login` | None | `LoginDto` | `{ accessToken, refreshToken, user: SafeUser }` | `200` OK, `400` Validation, `401` Invalid credentials, `403` Account locked | SCRUM-7 |
| `POST` | `/auth/refresh` | None | `RefreshTokenDto` | `{ accessToken, refreshToken }` | `200` OK, `401` Invalid/expired token | SCRUM-7 |
| `POST` | `/auth/logout` | `JwtAuthGuard` | None | `{ message }` | `200` OK, `401` Unauthorized | SCRUM-7 |
| `GET` | `/auth/me` | `JwtAuthGuard` | None | `SafeUser` | `200` OK, `401` Unauthorized | SCRUM-9 |
| `GET` | `/auth/admin` | `JwtAuthGuard` + `RolesGuard(ADMIN)` | None | `{ message }` | `200` OK, `401` Unauthorized, `403` Insufficient role | SCRUM-9 |
| `GET` | `/auth/google` | `GoogleAuthGuard` | None | `302` redirect to Google | `302` Redirect | SCRUM-8 |
| `GET` | `/auth/google/callback` | `GoogleAuthGuard` | None | `302` redirect to frontend with tokens | `302` Redirect | SCRUM-8 |
| `GET` | `/auth/github` | `GitHubAuthGuard` | None | `302` redirect to GitHub | `302` Redirect | SCRUM-8 |
| `GET` | `/auth/github/callback` | `GitHubAuthGuard` | None | `302` redirect to frontend with tokens | `302` Redirect | SCRUM-8 |

### User Management Endpoints

| Method | URL | Auth | Request DTO | Response | Status Codes | Sub-task |
|--------|-----|------|-------------|----------|--------------|----------|
| `GET` | `/users` | `JwtAuthGuard` + `RolesGuard(ADMIN)` | `ListUsersQueryDto` (query) | `{ data: SafeUser[], meta: { total, page, limit } }` | `200` OK, `401`, `403` | SCRUM-9 |
| `GET` | `/users/:id` | `JwtAuthGuard` + `RolesGuard(ADMIN)` | None | `SafeUser` | `200` OK, `401`, `403`, `404` | SCRUM-9 |
| `PATCH` | `/users/me` | `JwtAuthGuard` | `UpdateProfileDto` | `SafeUser` | `200` OK, `401` | SCRUM-9 |
| `PATCH` | `/users/me/password` | `JwtAuthGuard` | `ChangePasswordDto` | `{ message }` | `200` OK, `401` Wrong password, `403` OAuth-only | SCRUM-9 |
| `PATCH` | `/users/:id` | `JwtAuthGuard` + `RolesGuard(ADMIN)` | `AdminUpdateUserDto` | `SafeUser` | `200` OK, `401`, `403` SUPERADMIN policy, `404` | SCRUM-9 |
| `DELETE` | `/users/:id` | `JwtAuthGuard` + `RolesGuard(ADMIN)` | None | `{ message }` | `200` OK, `401`, `403` SUPERADMIN policy, `404` | SCRUM-9 |

### Partial Update Support

- `PATCH /users/me` (UpdateProfileDto): Supports partial updates for `firstName`, `lastName`, `avatarUrl`. Only provided fields are updated; `undefined` fields are ignored.
- `PATCH /users/:id` (AdminUpdateUserDto): Supports partial updates for `role`, `isActive`. Subject to SUPERADMIN policy constraints.

---

## Database Changes

### Prisma Schema

The datasource uses the **PrismaPg driver adapter** pattern (no `url` in the datasource block). The connection string is passed programmatically through `PrismaPg` in `prisma.service.ts`.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

enum Role {
  SUPERADMIN
  ADMIN
  USER
}

enum Provider {
  LOCAL
  GOOGLE
  GITHUB
}

model User {
  id             String    @id @default(uuid())
  email          String    @unique
  passwordHash   String?
  firstName      String?
  lastName       String?
  avatarUrl      String?
  role           Role      @default(USER)
  provider       Provider  @default(LOCAL)
  providerId     String?
  emailVerified  Boolean   @default(false)
  isActive       Boolean   @default(true)
  failedAttempts Int       @default(0)
  lockedUntil    DateTime?
  refreshToken   String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@map("users")
}
```

> **IMPORTANT -- PrismaPg Adapter Pattern**: The datasource block has **no `url` property**. Instead, the connection string is injected at runtime via the `PrismaPg` adapter in `prisma.service.ts`:
>
> ```typescript
> import { PrismaPg } from '@prisma/adapter-pg';
>
> const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
> super({ adapter });
> ```
>
> This requires `@prisma/adapter-pg` and `pg` as production dependencies.

### Migrations

| # | Migration | Description |
|---|-----------|-------------|
| 1 | `0001_init` | Initial User model with core fields (id, email, passwordHash, role, provider, providerId, emailVerified, isActive, failedAttempts, lockedUntil, refreshToken, timestamps) |
| 2 | `20260225230005_add_profile_fields_and_superadmin` | Added `firstName`, `lastName`, `avatarUrl` fields; SUPERADMIN role available in enum |

### Design Decisions

- UUID for `id` -- prevents enumeration attacks
- `passwordHash` nullable -- supports OAuth-only users (SCRUM-8)
- `refreshToken` stored hashed -- never plain text
- `isActive` boolean -- supports soft-delete
- `firstName`, `lastName`, `avatarUrl` -- populated from OAuth profiles
- `SUPERADMIN` role in enum -- per SUPERADMIN Role Policy in backend-standards.mdc
- `@@map("users")` -- lowercase table name convention

---

## Files to Create

| # | File Path | Purpose | Sub-task |
|---|-----------|---------|----------|
| 1 | `src/prisma/prisma.service.ts` | PrismaClient wrapper with PrismaPg adapter, OnModuleInit/OnModuleDestroy | SCRUM-6 |
| 2 | `src/prisma/prisma.module.ts` | Global Prisma module exporting PrismaService | SCRUM-6 |
| 3 | `src/users/enums/role.enum.ts` | Role enum (SUPERADMIN, ADMIN, USER) | SCRUM-6 |
| 4 | `src/users/enums/provider.enum.ts` | Provider enum (LOCAL, GOOGLE, GITHUB) | SCRUM-6 |
| 5 | `src/users/entities/user.entity.ts` | User interface, SafeUser type, toSafeUser helper | SCRUM-6 |
| 6 | `src/common/interfaces/jwt-payload.interface.ts` | JWT payload type definition | SCRUM-6 |
| 7 | `src/common/interfaces/oauth-profile.interface.ts` | OAuth provider profile interface | SCRUM-8 |
| 8 | `src/users/users.service.ts` | User CRUD, account locking, OAuth find-or-create | SCRUM-6 |
| 9 | `src/users/users.module.ts` | Users feature module | SCRUM-6 |
| 10 | `src/users/users.controller.ts` | User management endpoints | SCRUM-9 |
| 11 | `src/users/dto/update-profile.dto.ts` | Profile update DTO | SCRUM-9 |
| 12 | `src/users/dto/change-password.dto.ts` | Password change DTO | SCRUM-9 |
| 13 | `src/users/dto/admin-update-user.dto.ts` | Admin user update DTO | SCRUM-9 |
| 14 | `src/users/dto/list-users-query.dto.ts` | User list query DTO (pagination, search, sort) | SCRUM-9 |
| 15 | `src/auth/auth.service.ts` | Auth business logic (register, login, refresh, OAuth, logout) | SCRUM-6/7/8 |
| 16 | `src/auth/auth.controller.ts` | Auth HTTP endpoints | SCRUM-6/7/8/9 |
| 17 | `src/auth/auth.module.ts` | Auth feature module wiring | SCRUM-6/7/8 |
| 18 | `src/auth/dto/register.dto.ts` | RegisterDto with class-validator | SCRUM-6 |
| 19 | `src/auth/dto/login.dto.ts` | LoginDto with class-validator | SCRUM-7 |
| 20 | `src/auth/dto/refresh-token.dto.ts` | RefreshTokenDto | SCRUM-7 |
| 21 | `src/auth/strategies/jwt.strategy.ts` | Passport JWT strategy | SCRUM-7 |
| 22 | `src/auth/strategies/google.strategy.ts` | Passport Google OAuth2 strategy | SCRUM-8 |
| 23 | `src/auth/strategies/github.strategy.ts` | Passport GitHub OAuth2 strategy | SCRUM-8 |
| 24 | `src/auth/guards/jwt-auth.guard.ts` | JWT auth guard | SCRUM-7 |
| 25 | `src/auth/guards/google-auth.guard.ts` | Google OAuth guard | SCRUM-8 |
| 26 | `src/auth/guards/github-auth.guard.ts` | GitHub OAuth guard | SCRUM-8 |
| 27 | `src/auth/guards/roles.guard.ts` | Role-based access guard | SCRUM-9 |
| 28 | `src/common/decorators/roles.decorator.ts` | @Roles() decorator | SCRUM-9 |
| 29 | `src/common/filters/http-exception.filter.ts` | Global exception filter | SCRUM-6 |
| 30 | `src/auth/tests/auth.service.spec.ts` | Auth service unit tests | SCRUM-6/7/8 |
| 31 | `src/auth/tests/auth.controller.spec.ts` | Auth controller unit tests | SCRUM-6/7/8/9 |
| 32 | `src/auth/tests/jwt.strategy.spec.ts` | JWT strategy tests | SCRUM-7 |
| 33 | `src/auth/tests/google.strategy.spec.ts` | Google strategy tests | SCRUM-8 |
| 34 | `src/auth/tests/github.strategy.spec.ts` | GitHub strategy tests | SCRUM-8 |
| 35 | `src/auth/tests/roles.guard.spec.ts` | Roles guard tests | SCRUM-9 |
| 36 | `src/users/tests/users.service.spec.ts` | Users service unit tests | SCRUM-6/7/8/9 |
| 37 | `src/common/filters/tests/http-exception.filter.spec.ts` | HttpExceptionFilter unit tests | SCRUM-6 |
| 38 | `.env.example` | Environment template with all required variables | SCRUM-6 |
| 39 | `prisma/schema.prisma` | Database schema (User model, Role enum, Provider enum) | SCRUM-6 |

## Files to Modify

| # | File Path | Changes | Sub-task |
|---|-----------|---------|----------|
| 1 | `src/app.module.ts` | Import PrismaModule, AuthModule, UsersModule | SCRUM-6 |
| 2 | `src/main.ts` | Configure CORS, ValidationPipe, HttpExceptionFilter, Swagger, port | SCRUM-6 |
| 3 | `package.json` | Add dependencies, configure Jest coverage thresholds | SCRUM-6 |
| 4 | `tsconfig.json` | Ensure strict mode enabled | SCRUM-6 |

---

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to a new feature branch. Check if it exists and if not, create it.
- **Branch Name**: `feature/SCRUM-5-backend`
- **Implementation Steps**:
  1. Ensure you are in `em-ecosystem-code/nexacore-api/` directory
  2. Verify you are on `main` branch: `git branch`
  3. Pull latest: `git pull origin main`
  4. Create branch: `git checkout -b feature/SCRUM-5-backend`
  5. Verify: `git branch`
- **Notes**: This MUST be the first step before any code changes. Do NOT work on a generic `SCRUM-5` branch; use the `-backend` suffix to separate concerns.

---

### Step 1: Scaffold NestJS Project (SCRUM-6)

- **Action**: Initialize a new NestJS 11 project inside `nexacore-api/`
- **Implementation Steps**:
  1. Install NestJS CLI globally (if not present): `npm i -g @nestjs/cli`
  2. Scaffold project in the current directory:
     ```bash
     cd nexacore-api
     nest new . --package-manager npm --skip-git
     ```
     If `nest new .` fails in a non-empty dir, scaffold to a temp dir and move files:
     ```bash
     nest new em-temp --package-manager npm --skip-git
     cp -r em-temp/* em-temp/.* ./ 2>/dev/null
     rm -rf em-temp
     ```
  3. Verify the app compiles: `npm run build`
  4. Remove default `app.controller.ts`, `app.service.ts`, and `app.controller.spec.ts`
  5. Keep `app.module.ts` as the root module
- **Dependencies installed by `nest new`**:
  - `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`
  - `reflect-metadata`, `rxjs`
  - `@nestjs/testing`, `jest`, `ts-jest` (dev)
- **Notes**: This is a one-time setup step.

---

### Step 2: Install Additional Dependencies (SCRUM-6)

- **Action**: Install all packages needed for the complete authentication system
- **Implementation Steps**:
  1. Install production dependencies:
     ```bash
     npm install @nestjs/jwt @nestjs/passport @nestjs/swagger passport passport-jwt passport-google-oauth20 passport-github2 bcrypt class-validator class-transformer @prisma/client @prisma/adapter-pg pg
     ```
  2. Install dev dependencies:
     ```bash
     npm install -D prisma dotenv @types/passport-jwt @types/bcrypt @types/passport-google-oauth20 @types/passport-github2 @types/pg
     ```

> **FIX (Audit D-02, D-03, D-04)**: `@prisma/adapter-pg` (^7.4.1) and `pg` (^8.18.0) are production dependencies required for the PrismaPg adapter pattern. `dotenv` (^17.3.1) is a devDependency only (used in development/test scripts, not in production runtime).

- **Package Purpose**:

  | Package | Purpose |
  |---------|---------|
  | `@nestjs/jwt` | JWT token generation and verification |
  | `@nestjs/passport` | Passport integration for NestJS |
  | `@nestjs/swagger` | OpenAPI/Swagger documentation |
  | `passport` | Authentication middleware |
  | `passport-jwt` | JWT strategy for Passport |
  | `passport-google-oauth20` | Google OAuth2 strategy |
  | `passport-github2` | GitHub OAuth2 strategy |
  | `bcrypt` | Password hashing (12 rounds) |
  | `class-validator` | DTO validation decorators |
  | `class-transformer` | DTO transformation |
  | `@prisma/client` | Prisma database client |
  | `@prisma/adapter-pg` | PrismaPg driver adapter for Prisma (required for driverless datasource) |
  | `pg` | PostgreSQL native driver (required by PrismaPg adapter) |
  | `dotenv` (dev) | Environment variable loading for development |
  | `prisma` (dev) | Prisma CLI |

---

### Step 3: Configure Prisma & Database Schema (SCRUM-6)

- **Files**: `prisma/schema.prisma`, `.env`, `.env.example`
- **Action**: Set up Prisma with PostgreSQL using the PrismaPg driver adapter pattern and define User model with Role and Provider enums
- **Implementation Steps**:
  1. Initialize Prisma: `npx prisma init`
  2. Create `.env.example`:
     ```env
     DATABASE_URL="postgresql://user:password@localhost:5432/em_ecosystem?schema=public"
     JWT_SECRET="your-jwt-secret-min-32-chars"
     JWT_ACCESS_EXPIRATION="15m"
     JWT_REFRESH_EXPIRATION="7d"
     PORT=3000
     FRONTEND_URL="http://localhost:3001"
     GOOGLE_CLIENT_ID="your-google-client-id"
     GOOGLE_CLIENT_SECRET="your-google-client-secret"
     GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"
     GITHUB_CLIENT_ID="your-github-client-id"
     GITHUB_CLIENT_SECRET="your-github-client-secret"
     GITHUB_CALLBACK_URL="http://localhost:3000/auth/github/callback"
     ```
  3. Create `.env` with actual local values (git-ignored)
  4. Define the Prisma schema in `prisma/schema.prisma`:

     > **FIX (Audit D-01)**: The datasource block does NOT use `url = env("DATABASE_URL")`. The PrismaPg adapter pattern requires a bare datasource with only the `provider` field. The connection string is injected programmatically via `PrismaPg` in `prisma.service.ts`.

     ```prisma
     generator client {
       provider = "prisma-client-js"
     }

     datasource db {
       provider = "postgresql"
     }

     enum Role {
       SUPERADMIN
       ADMIN
       USER
     }

     enum Provider {
       LOCAL
       GOOGLE
       GITHUB
     }

     model User {
       id             String    @id @default(uuid())
       email          String    @unique
       passwordHash   String?
       firstName      String?
       lastName       String?
       avatarUrl      String?
       role           Role      @default(USER)
       provider       Provider  @default(LOCAL)
       providerId     String?
       emailVerified  Boolean   @default(false)
       isActive       Boolean   @default(true)
       failedAttempts Int       @default(0)
       lockedUntil    DateTime?
       refreshToken   String?
       createdAt      DateTime  @default(now())
       updatedAt      DateTime  @updatedAt

       @@map("users")
     }
     ```
  5. Run initial migration: `npx prisma migrate dev --name init`
  6. Generate Prisma client: `npx prisma generate`

  > **FIX (Audit D-06)**: TWO migrations are generated during the implementation:
  > - `0001_init` -- initial User model with core fields
  > - `20260225230005_add_profile_fields_and_superadmin` -- added `firstName`, `lastName`, `avatarUrl` fields

- **Design Decisions**:
  - UUID for `id` -- prevents enumeration attacks
  - `passwordHash` nullable -- supports OAuth-only users (SCRUM-8)
  - `refreshToken` stored hashed -- never plain text
  - `isActive` boolean -- supports soft-delete
  - `firstName`, `lastName`, `avatarUrl` -- populated from OAuth profiles
  - `SUPERADMIN` role in enum -- per SUPERADMIN Role Policy in backend-standards.mdc
  - `@@map("users")` -- lowercase table name convention

---

### Step 4: Create Prisma Module (SCRUM-6)

- **Files**: `src/prisma/prisma.service.ts`, `src/prisma/prisma.module.ts`
- **Action**: Create a global Prisma module for database access using the PrismaPg adapter
- **Implementation Steps**:
  1. Create `src/prisma/prisma.service.ts`:

     > **FIX (Audit D-05)**: PrismaService uses the `PrismaPg` adapter with `connectionString: process.env.DATABASE_URL`, NOT the standard `url = env("DATABASE_URL")` datasource pattern.

     ```typescript
     import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
     import { PrismaClient } from '@prisma/client';
     import { PrismaPg } from '@prisma/adapter-pg';

     @Injectable()
     export class PrismaService
       extends PrismaClient
       implements OnModuleInit, OnModuleDestroy
     {
       constructor() {
         const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
         super({ adapter });
       }

       async onModuleInit(): Promise<void> {
         await this.$connect();
       }

       async onModuleDestroy(): Promise<void> {
         await this.$disconnect();
       }
     }
     ```
  2. Create `src/prisma/prisma.module.ts`:
     - Declare `PrismaService` as provider
     - Export `PrismaService`
     - Mark as `@Global()` so it is available everywhere without importing
  3. Import `PrismaModule` in `app.module.ts`

---

### Step 5: Create User Enums, Entity, and Interfaces (SCRUM-6)

- **Files**:
  - `src/users/enums/role.enum.ts`
  - `src/users/enums/provider.enum.ts`
  - `src/users/entities/user.entity.ts`
  - `src/common/interfaces/jwt-payload.interface.ts`
  - `src/common/interfaces/oauth-profile.interface.ts`
- **Action**: Define TypeScript types matching the Prisma schema and supporting interfaces
- **Implementation Steps**:
  1. Create `src/users/enums/role.enum.ts`:
     ```typescript
     export enum Role {
       SUPERADMIN = 'SUPERADMIN',
       ADMIN = 'ADMIN',
       USER = 'USER',
     }
     ```
  2. Create `src/users/enums/provider.enum.ts`:
     ```typescript
     export enum Provider {
       LOCAL = 'LOCAL',
       GOOGLE = 'GOOGLE',
       GITHUB = 'GITHUB',
     }
     ```
  3. Create `src/users/entities/user.entity.ts`:
     ```typescript
     import { Role } from '../enums/role.enum';
     import { Provider } from '../enums/provider.enum';

     export interface User {
       id: string;
       email: string;
       passwordHash: string | null;
       firstName: string | null;
       lastName: string | null;
       avatarUrl: string | null;
       role: Role;
       provider: Provider;
       providerId: string | null;
       emailVerified: boolean;
       isActive: boolean;
       failedAttempts: number;
       lockedUntil: Date | null;
       refreshToken: string | null;
       createdAt: Date;
       updatedAt: Date;
     }

     export type SafeUser = Omit<User, 'passwordHash' | 'refreshToken'>;

     export function toSafeUser(user: User): SafeUser {
       const safeUser: SafeUser = {
         id: user.id,
         email: user.email,
         firstName: user.firstName,
         lastName: user.lastName,
         avatarUrl: user.avatarUrl,
         role: user.role,
         provider: user.provider,
         providerId: user.providerId,
         emailVerified: user.emailVerified,
         isActive: user.isActive,
         failedAttempts: user.failedAttempts,
         lockedUntil: user.lockedUntil,
         createdAt: user.createdAt,
         updatedAt: user.updatedAt,
       };
       return safeUser;
     }
     ```
  4. Create `src/common/interfaces/jwt-payload.interface.ts`:
     ```typescript
     import { Role } from '../../users/enums/role.enum';

     export interface JwtPayload {
       sub: string;    // User ID
       email: string;
       role: Role;
     }
     ```
  5. Create `src/common/interfaces/oauth-profile.interface.ts`:
     ```typescript
     import { Provider } from '../../users/enums/provider.enum';

     export interface OAuthProfile {
       email: string;
       provider: Provider;
       providerId: string;
       firstName?: string;
       lastName?: string;
       avatarUrl?: string;
     }
     ```
- **Notes**:
  - `SafeUser` omits `passwordHash` and `refreshToken` to prevent leaking sensitive data in API responses.
  - `toSafeUser()` is a pure function used by both AuthService and UsersService.
  - `JwtPayload.sub` follows JWT standard for the subject claim. Keep payload minimal.
  - `OAuthProfile` abstracts away provider-specific profile structures.

---

### Step 6: Create Users Module and Service (SCRUM-6)

- **Files**: `src/users/users.module.ts`, `src/users/users.service.ts`
- **Action**: Create the Users module with CRUD operations and account management
- **Implementation Steps**:
  1. Create `src/users/users.service.ts` with the following methods:

     **Core CRUD (SCRUM-6)**:
     ```typescript
     findByEmail(email: string): Promise<User | null>
     findById(id: string): Promise<User | null>
     create(data: { email: string; passwordHash: string; provider?: Provider }): Promise<User>
     updateRefreshToken(userId: string, refreshToken: string | null): Promise<void>
     ```

     **Account Locking (SCRUM-7)**:
     ```typescript
     incrementFailedAttempts(userId: string): Promise<User>
     resetFailedAttempts(userId: string): Promise<void>
     lockAccount(userId: string): Promise<void>
     ```

     **OAuth (SCRUM-8)**:
     ```typescript
     findOrCreateByOAuth(profile: OAuthProfile): Promise<User>
     ```

     **User Management (SCRUM-9)**:
     ```typescript
     findAll(query: ListUsersQueryDto): Promise<{ data: SafeUser[]; meta: {...} }>
     updateProfile(userId: string, dto: UpdateProfileDto): Promise<SafeUser>
     changePassword(userId: string, dto: ChangePasswordDto): Promise<void>
     adminUpdateUser(targetId: string, dto: AdminUpdateUserDto, actingUser: { role: Role }): Promise<SafeUser>
     softDelete(targetId: string): Promise<void>
     ```

  2. `findOrCreateByOAuth` logic:
     - If existing user found with same provider+providerId: return as-is (or update empty profile fields)
     - If existing user found with `provider = LOCAL` and matching email: link OAuth by updating provider/providerId, set `emailVerified = true`
     - If no user found: create new user with `emailVerified = true`, no passwordHash
  3. Handle Prisma error `P2002` (unique constraint violation) in `create()` by throwing `ConflictException`
  4. Create `src/users/users.module.ts`:
     - Declare `UsersService` as provider, `UsersController` as controller
     - Export `UsersService` (so AuthModule can use it)
- **SUPERADMIN Policy** (from backend-standards.mdc):
  - `adminUpdateUser` prevents modification of SUPERADMIN accounts
  - Only SUPERADMIN can assign ADMIN or SUPERADMIN roles
  - `softDelete` prevents deletion of SUPERADMIN accounts

---

### Step 7: Create RegisterDto with Validation (SCRUM-6)

- **File**: `src/auth/dto/register.dto.ts`
- **Action**: Define the registration input with class-validator decorators and Swagger annotations
- **Implementation Steps**:
  1. Create `RegisterDto`:
     ```typescript
     import { IsEmail, IsString, MinLength, Matches } from 'class-validator';
     import { ApiProperty } from '@nestjs/swagger';

     export class RegisterDto {
       @ApiProperty({ description: 'User email address', example: 'user@example.com' })
       @IsEmail({}, { message: 'Invalid email format' })
       email: string;

       @ApiProperty({
         description: 'Password (min 8 chars, must include uppercase, lowercase, number, and special character)',
         example: 'SecureP@ss1',
       })
       @IsString()
       @MinLength(8, { message: 'Password must be at least 8 characters' })
       @Matches(/(?=.*[a-z])/, { message: 'Password must contain at least one lowercase letter' })
       @Matches(/(?=.*[A-Z])/, { message: 'Password must contain at least one uppercase letter' })
       @Matches(/(?=.*\d)/, { message: 'Password must contain at least one number' })
       @Matches(/(?=.*[@$!%*?&])/, { message: 'Password must include a special character (@$!%*?&)' })
       password: string;
     }
     ```
  2. Enable `ValidationPipe` globally in `main.ts`:
     ```typescript
     app.useGlobalPipes(new ValidationPipe({
       whitelist: true,
       forbidNonWhitelisted: true,
       transform: true,
     }));
     ```
- **Validation Rules**:

  | Field | Rule |
  |-------|------|
  | `email` | Required, valid email format |
  | `password` | Required, min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char (`@$!%*?&`) |

- **Notes**: `whitelist: true` strips unknown properties. `forbidNonWhitelisted: true` returns 400 if extra fields are sent.

---

### Step 8: Create LoginDto and RefreshTokenDto (SCRUM-7)

- **Files**: `src/auth/dto/login.dto.ts`, `src/auth/dto/refresh-token.dto.ts`
- **Action**: Define DTOs for login and token refresh
- **Implementation Steps**:
  1. Create `LoginDto`:
     ```typescript
     import { IsEmail, IsString } from 'class-validator';
     import { ApiProperty } from '@nestjs/swagger';

     export class LoginDto {
       @ApiProperty({ description: 'User email address', example: 'user@example.com' })
       @IsEmail({}, { message: 'Invalid email format' })
       email: string;

       @ApiProperty({ description: 'User password', example: 'SecureP@ss1' })
       @IsString()
       password: string;
     }
     ```
  2. Create `RefreshTokenDto`:
     ```typescript
     import { IsString } from 'class-validator';
     import { ApiProperty } from '@nestjs/swagger';

     export class RefreshTokenDto {
       @ApiProperty({ description: 'JWT refresh token', example: 'eyJhbGciOiJIUzI1NiIs...' })
       @IsString()
       refreshToken: string;
     }
     ```
- **Notes**: `LoginDto` does NOT re-validate password complexity -- it just checks it is a non-empty string. Complexity validation only applies at registration.

---

### Step 9: Create Auth Service (SCRUM-6 + SCRUM-7 + SCRUM-8)

- **File**: `src/auth/auth.service.ts`
- **Action**: Implement all authentication business logic
- **Implementation Steps**:
  1. Inject `UsersService` and `JwtService`
  2. Define constants: `BCRYPT_ROUNDS = 12`, `MAX_FAILED_ATTEMPTS = 5`
  3. Implement `register(dto: RegisterDto)` (SCRUM-6):
     1. Check if email exists via `usersService.findByEmail(dto.email)`
     2. If exists, throw `ConflictException('Email already registered')`
     3. Hash password: `bcrypt.hash(dto.password, 12)`
     4. Create user via `usersService.create({ email, passwordHash })`
     5. Generate tokens via `this.generateTokens(user)`
     6. Return `{ accessToken, refreshToken, user: toSafeUser(user) }`
  4. Implement `login(dto: LoginDto)` (SCRUM-7):
     1. Find user by email; if not found throw `UnauthorizedException('Invalid credentials')`
     2. If `lockedUntil > now()`, throw `ForbiddenException('Account locked. Try again later.')`
     3. If `lockedUntil <= now()`, reset failed attempts (lock expired)
     4. If `passwordHash` is null (OAuth-only user), throw `UnauthorizedException('Invalid credentials')`
     5. Compare password with bcrypt; if invalid:
        - Increment failed attempts
        - If `failedAttempts >= MAX_FAILED_ATTEMPTS`, lock account, throw `ForbiddenException`
        - Otherwise throw `UnauthorizedException('Invalid credentials')`
     6. If valid: reset failed attempts if count > 0, generate tokens, return result
  5. Implement `refreshTokens(refreshToken: string)` (SCRUM-7):
     1. Verify the refresh token JWT; if invalid, throw `UnauthorizedException`
     2. Find user by `payload.sub`; if not found or no stored refresh token, throw `UnauthorizedException`
     3. Compare incoming token with stored hash via bcrypt; if mismatch, throw `UnauthorizedException`
     4. Generate new token pair (rotation)
  6. Implement `validateOAuthUser(profile: OAuthProfile)` (SCRUM-8):
     1. Call `usersService.findOrCreateByOAuth(profile)`
     2. Generate tokens
     3. Return `{ accessToken, refreshToken, user: toSafeUser(user) }`
  7. Implement `logout(userId: string)` (SCRUM-7):
     1. Call `usersService.updateRefreshToken(userId, null)`
  8. Implement private `generateTokens(user: User)`:
     1. Create JWT payload: `{ sub: user.id, email: user.email, role: user.role }`
     2. Sign access token with `JWT_ACCESS_EXPIRATION` (default `15m`)
     3. Sign refresh token with `JWT_REFRESH_EXPIRATION` (default `7d`) with payload `{ sub: user.id }`
     4. Hash the refresh token with bcrypt, store via `usersService.updateRefreshToken`
     5. Return `{ accessToken, refreshToken }`
- **Function Signatures**:
  ```typescript
  @Injectable()
  export class AuthService {
    constructor(
      private readonly usersService: UsersService,
      private readonly jwtService: JwtService,
    ) {}

    async register(dto: RegisterDto): Promise<{ accessToken: string; refreshToken: string; user: SafeUser }>
    async login(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string; user: SafeUser }>
    async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>
    async validateOAuthUser(profile: OAuthProfile): Promise<{ accessToken: string; refreshToken: string; user: SafeUser }>
    async logout(userId: string): Promise<void>
    private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }>
  }
  ```
- **Error Handling**:

  | Method | Condition | Exception | HTTP |
  |--------|-----------|-----------|------|
  | `register` | Email exists | `ConflictException` | 409 |
  | `login` | User not found | `UnauthorizedException` | 401 |
  | `login` | Account locked | `ForbiddenException` | 403 |
  | `login` | No passwordHash (OAuth-only) | `UnauthorizedException` | 401 |
  | `login` | Wrong password | `UnauthorizedException` | 401 |
  | `login` | 5th failed attempt | `ForbiddenException` | 403 |
  | `refreshTokens` | Invalid JWT | `UnauthorizedException` | 401 |
  | `refreshTokens` | User not found / no token | `UnauthorizedException` | 401 |
  | `refreshTokens` | Token hash mismatch | `UnauthorizedException` | 401 |

---

### Step 10: Create JWT Strategy (SCRUM-7)

- **File**: `src/auth/strategies/jwt.strategy.ts`
- **Action**: Implement Passport JWT strategy for validating Bearer tokens
- **Implementation Steps**:
  1. Extend `PassportStrategy(Strategy)` from `@nestjs/passport`
  2. Configure: extract JWT from `Authorization: Bearer <token>`, do not ignore expiration, use `JWT_SECRET`
  3. Implement `validate(payload: JwtPayload)`:
     - Find user by `payload.sub` via `usersService.findById()`
     - If not found, throw `UnauthorizedException('User not found')`
     - Return `toSafeUser(user)` -- this becomes `req.user`
- **Function Signature**:
  ```typescript
  @Injectable()
  export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly usersService: UsersService) {
      super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: process.env.JWT_SECRET || 'default-dev-secret-change-in-production',
      });
    }
    async validate(payload: JwtPayload): Promise<SafeUser>
  }
  ```

---

### Step 11: Create OAuth Strategies (SCRUM-8)

- **Files**: `src/auth/strategies/google.strategy.ts`, `src/auth/strategies/github.strategy.ts`
- **Action**: Implement Passport strategies for Google and GitHub OAuth2
- **Implementation Steps**:
  1. **Google Strategy**:
     - Extend `PassportStrategy(Strategy, 'google')` using `passport-google-oauth20`
     - Configure with `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
     - Request scopes: `['email', 'profile']`
     - In `validate()`: extract email from `profile.emails[0].value`
     - If no email, call `done(new Error('No email provided by Google'))`
     - Extract `firstName` from `profile.name?.givenName`, `lastName` from `profile.name?.familyName`, `avatarUrl` from `profile.photos[0].value`
     - Call `authService.validateOAuthUser({ email, provider: Provider.GOOGLE, providerId: profile.id, firstName, lastName, avatarUrl })`
     - Pass result to `done(null, result)`
  2. **GitHub Strategy**:
     - Extend `PassportStrategy(Strategy, 'github')` using `passport-github2`
     - Configure with `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`
     - Request scope: `['user:email']`
     - In `validate()`: extract email from `profile.emails[0].value`
     - If no email, call `done(new Error('No email provided by GitHub'))`
     - Split `profile.displayName` into firstName/lastName (first word = firstName, rest = lastName)
     - Extract `avatarUrl` from `profile.photos[0].value`
     - Call `authService.validateOAuthUser({ email, provider: Provider.GITHUB, providerId: profile.id, firstName, lastName, avatarUrl })`
- **Notes**: OAuth client secrets MUST be in `.env` only, never in code. Both strategies inject `AuthService` to delegate user creation/linking.

---

### Step 12: Create Guards (SCRUM-7 + SCRUM-8 + SCRUM-9)

- **Files**: `src/auth/guards/jwt-auth.guard.ts`, `src/auth/guards/google-auth.guard.ts`, `src/auth/guards/github-auth.guard.ts`, `src/auth/guards/roles.guard.ts`
- **Action**: Create authentication and authorization guards
- **Implementation Steps**:
  1. **JwtAuthGuard** (SCRUM-7):
     ```typescript
     @Injectable()
     export class JwtAuthGuard extends AuthGuard('jwt') {}
     ```
  2. **GoogleAuthGuard** (SCRUM-8):
     ```typescript
     @Injectable()
     export class GoogleAuthGuard extends AuthGuard('google') {}
     ```
  3. **GitHubAuthGuard** (SCRUM-8):
     ```typescript
     @Injectable()
     export class GitHubAuthGuard extends AuthGuard('github') {}
     ```
  4. **RolesGuard** (SCRUM-9):
     ```typescript
     @Injectable()
     export class RolesGuard implements CanActivate {
       constructor(private readonly reflector: Reflector) {}

       canActivate(context: ExecutionContext): boolean {
         const request = context.switchToHttp().getRequest<{ user?: { role: Role } }>();
         const user = request.user;

         // SUPERADMIN bypasses all role checks
         if (user?.role === Role.SUPERADMIN) {
           return true;
         }

         const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
           context.getHandler(),
           context.getClass(),
         ]);

         if (!requiredRoles || requiredRoles.length === 0) {
           return true;
         }

         if (!user) {
           throw new ForbiddenException('Access denied');
         }

         if (!requiredRoles.includes(user.role)) {
           throw new ForbiddenException('Insufficient role');
         }

         return true;
       }
     }
     ```
- **Notes**: `RolesGuard` must always be used AFTER `JwtAuthGuard` (order matters in `@UseGuards()`). SUPERADMIN always bypasses per SUPERADMIN Role Policy.

---

### Step 13: Create Roles Decorator (SCRUM-9)

- **File**: `src/common/decorators/roles.decorator.ts`
- **Action**: Create a custom decorator for declaring required roles on endpoints
- **Implementation Steps**:
  1. Create decorator:
     ```typescript
     import { SetMetadata } from '@nestjs/common';
     import { Role } from '../../users/enums/role.enum';

     export const ROLES_KEY = 'roles';
     export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
     ```
- **Usage**: `@Roles(Role.ADMIN)` on controller methods

---

### Step 14: Create Auth Controller (SCRUM-6 + SCRUM-7 + SCRUM-8 + SCRUM-9)

- **File**: `src/auth/auth.controller.ts`
- **Action**: Define all authentication endpoints with Swagger documentation
- **Implementation Steps**:
  1. Create controller with `@Controller('auth')` prefix and `@ApiTags('auth')`
  2. **POST /auth/register** (SCRUM-6): `@HttpCode(HttpStatus.CREATED)`, accepts `RegisterDto`, delegates to `authService.register()`
  3. **POST /auth/login** (SCRUM-7): `@HttpCode(HttpStatus.OK)`, accepts `LoginDto`, delegates to `authService.login()`
  4. **POST /auth/refresh** (SCRUM-7): `@HttpCode(HttpStatus.OK)`, accepts `RefreshTokenDto`, delegates to `authService.refreshTokens()`
  5. **POST /auth/logout** (SCRUM-7): `@UseGuards(JwtAuthGuard)`, extracts `req.user.id`, delegates to `authService.logout()`
  6. **GET /auth/me** (SCRUM-9): `@UseGuards(JwtAuthGuard)`, returns `req.user` (SafeUser from JwtStrategy)
  7. **GET /auth/admin** (SCRUM-9): `@UseGuards(JwtAuthGuard, RolesGuard)`, `@Roles(Role.ADMIN)`, returns admin access message
  8. **GET /auth/google** (SCRUM-8): `@UseGuards(GoogleAuthGuard)`, initiates Google OAuth redirect
  9. **GET /auth/google/callback** (SCRUM-8): `@UseGuards(GoogleAuthGuard)`, `@Redirect()`, extracts tokens from `req.user`, redirects to frontend with tokens in query params
  10. **GET /auth/github** (SCRUM-8): `@UseGuards(GitHubAuthGuard)`, initiates GitHub OAuth redirect
  11. **GET /auth/github/callback** (SCRUM-8): `@UseGuards(GitHubAuthGuard)`, `@Redirect()`, redirects to frontend with tokens
- **OAuth Callback Pattern**:
  ```typescript
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @Redirect()
  googleAuthCallback(@Request() req) {
    const { accessToken, refreshToken } = req.user;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    return { url: `${frontendUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}` };
  }
  ```
- **Notes**: Controllers are thin HTTP handlers. No business logic. All Swagger decorators (`@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`) must be present.

---

### Step 15: Create Users Controller (SCRUM-9)

- **File**: `src/users/users.controller.ts`
- **Action**: Define user management endpoints
- **Implementation Steps**:
  1. Create controller with `@Controller('users')` prefix
  2. **Self-service endpoints** (any authenticated user):
     - `PATCH /users/me` -- update own profile (firstName, lastName, avatarUrl)
     - `PATCH /users/me/password` -- change own password
  3. **Admin endpoints** (ADMIN role required):
     - `GET /users` -- list users with pagination, search, sort
     - `GET /users/:id` -- get user by ID
     - `PATCH /users/:id` -- admin update user (role, isActive)
     - `DELETE /users/:id` -- soft-delete user (set `isActive = false`)
  4. All endpoints guarded with `@UseGuards(JwtAuthGuard)`, admin endpoints additionally with `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(Role.ADMIN)`

---

### Step 16: Create Auth Module (SCRUM-6 + SCRUM-7 + SCRUM-8)

- **File**: `src/auth/auth.module.ts`
- **Action**: Wire all auth components together

> **FIX (Audit D-07)**: The `JwtModule.register()` call requires `import type { StringValue } from 'ms'` for the type cast on `expiresIn`. This import is needed in both `auth.module.ts` and `auth.service.ts` when casting expiration strings.

- **Implementation Steps**:
  1. Create `AuthModule`:
     ```typescript
     import { Module } from '@nestjs/common';
     import { JwtModule } from '@nestjs/jwt';
     import { PassportModule } from '@nestjs/passport';
     import type { StringValue } from 'ms';
     import { AuthController } from './auth.controller';
     import { AuthService } from './auth.service';
     import { JwtStrategy } from './strategies/jwt.strategy';
     import { GoogleStrategy } from './strategies/google.strategy';
     import { GitHubStrategy } from './strategies/github.strategy';
     import { UsersModule } from '../users/users.module';

     @Module({
       imports: [
         UsersModule,
         PassportModule.register({ defaultStrategy: 'jwt' }),
         JwtModule.register({
           secret: process.env.JWT_SECRET || 'default-dev-secret-change-in-production',
           signOptions: {
             expiresIn: (process.env.JWT_ACCESS_EXPIRATION || '15m') as StringValue,
           },
         }),
       ],
       controllers: [AuthController],
       providers: [AuthService, JwtStrategy, GoogleStrategy, GitHubStrategy],
       exports: [AuthService],
     })
     export class AuthModule {}
     ```
  2. Import `AuthModule` and `UsersModule` in `app.module.ts`:
     ```typescript
     @Module({
       imports: [PrismaModule, AuthModule, UsersModule],
       controllers: [],
       providers: [],
     })
     export class AppModule {}
     ```

---

### Step 17: Create Global Exception Filter (SCRUM-6)

- **File**: `src/common/filters/http-exception.filter.ts`
- **Action**: Standardize error response format across all endpoints
- **Implementation Steps**:
  1. Create exception filter that catches all exceptions (`@Catch()`)
  2. For `HttpException`: extract status, message, and validation details
  3. For non-HTTP exceptions: return 500 INTERNAL_SERVER_ERROR
  4. Map status codes to error codes via lookup table
  5. Register globally in `main.ts`: `app.useGlobalFilters(new HttpExceptionFilter())`
- **Error Code Mapping**:

  | Status | Code |
  |--------|------|
  | 400 | `VALIDATION_ERROR` |
  | 401 | `UNAUTHORIZED` |
  | 403 | `FORBIDDEN` |
  | 404 | `NOT_FOUND` |
  | 409 | `CONFLICT` |
  | 500 | `INTERNAL_SERVER_ERROR` |

---

### Step 18: Configure main.ts (SCRUM-6)

- **File**: `src/main.ts`
- **Action**: Configure CORS, global pipes, filters, Swagger, and port
- **Implementation Steps**:
  1. Import and call `dotenv/config` at the top
  2. Enable CORS: `app.enableCors({ origin: process.env.FRONTEND_URL || 'http://localhost:3001' })`
  3. Register global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, `transform`
  4. Register global `HttpExceptionFilter`
  5. Configure Swagger with `DocumentBuilder`:
     - Title: `EM NexaCore API`
     - Description: `EM Ecosystem Core Platform -- Authentication & User Management`
     - Version: `0.1.0`
     - Bearer auth scheme
     - Serve at `/api/docs`
  6. Listen on `process.env.PORT ?? 3000`

---

### Step 19: Configure Jest for Coverage Thresholds (SCRUM-6)

- **File**: `package.json` (jest section)
- **Action**: Set coverage thresholds per project standards
- **Implementation Steps**:
  1. Configure Jest in `package.json`:
     ```json
     {
       "jest": {
         "moduleFileExtensions": ["js", "json", "ts"],
         "rootDir": "src",
         "testRegex": ".*\\.spec\\.ts$",
         "transform": { "^.+\\.(t|j)s$": "ts-jest" },
         "collectCoverageFrom": [
           "**/*.(t|j)s",
           "!main.ts",
           "!**/*.module.ts",
           "!prisma/**"
         ],
         "coverageDirectory": "../coverage",
         "coverageThreshold": {
           "global": {
             "branches": 85,
             "functions": 90,
             "lines": 90,
             "statements": 90
           }
         },
         "testEnvironment": "node"
       }
     }
     ```
- **Notes**: Modules and `main.ts` are excluded from coverage. Branch threshold is 85% to accommodate guard/strategy edge cases; all other metrics at 90%.

---

### Step 20: Write Unit Tests -- Auth Service (SCRUM-6 + SCRUM-7 + SCRUM-8)

- **File**: `src/auth/tests/auth.service.spec.ts`
- **Action**: Test all authentication business logic (TDD per backend-standards)
- **Test Categories**:

#### 20.1 Registration (SCRUM-6)
```typescript
describe('register', () => {
  describe('successful registration', () => {
    it('should create a new user with hashed password and return JWT pair')
    it('should hash the password with bcrypt using 12 rounds')
    it('should return SafeUser without passwordHash or refreshToken')
  });
  describe('error cases', () => {
    it('should throw ConflictException when email already exists')
  });
});
```

#### 20.2 Login (SCRUM-7)
```typescript
describe('login', () => {
  describe('successful login', () => {
    it('should return JWT pair and SafeUser on valid credentials')
    it('should reset failed attempts on successful login when count > 0')
    it('should not reset failed attempts when count is 0')
  });
  describe('error cases', () => {
    it('should throw UnauthorizedException when user not found')
    it('should throw ForbiddenException when account is locked')
    it('should reset lockout when lock has expired')
    it('should throw UnauthorizedException when user has no passwordHash (OAuth-only)')
    it('should throw UnauthorizedException on wrong password')
    it('should increment failed attempts on wrong password')
    it('should lock account after 5 failed attempts and throw ForbiddenException')
  });
});
```

#### 20.3 Refresh Tokens (SCRUM-7)
```typescript
describe('refreshTokens', () => {
  it('should return new token pair on valid refresh token')
  it('should throw UnauthorizedException when token verification fails')
  it('should throw UnauthorizedException when user not found')
  it('should throw UnauthorizedException when user has no stored refresh token')
  it('should throw UnauthorizedException when refresh token does not match hash')
});
```

#### 20.4 OAuth Validation (SCRUM-8)
```typescript
describe('validateOAuthUser', () => {
  it('should find or create user and return JWT pair with SafeUser')
  it('should call generateTokens which stores hashed refresh token')
});
```

#### 20.5 Logout (SCRUM-7)
```typescript
describe('logout', () => {
  it('should invalidate refresh token by setting it to null')
});
```

- **Mocking Strategy**:
  - Mock `UsersService` (all methods)
  - Mock `JwtService` (sign, verify)
  - Mock `bcrypt` (hash, compare) via `jest.mock('bcrypt')`
  - Use `Test.createTestingModule()` for proper NestJS DI
  - AAA pattern (Arrange-Act-Assert) in every test
  - `jest.clearAllMocks()` in every `beforeEach()`

---

### Step 21: Write Unit Tests -- Auth Controller (SCRUM-6 + SCRUM-7 + SCRUM-8 + SCRUM-9)

- **File**: `src/auth/tests/auth.controller.spec.ts`
- **Action**: Test controller HTTP handling
- **Test Categories**:
```typescript
describe('AuthController', () => {
  describe('register', () => {
    it('should call authService.register with the DTO and return 201')
    it('should propagate ConflictException as 409')
  });
  describe('login', () => {
    it('should call authService.login with the DTO and return 200')
    it('should propagate UnauthorizedException as 401')
    it('should propagate ForbiddenException as 403')
  });
  describe('refresh', () => {
    it('should call authService.refreshTokens and return new tokens')
    it('should propagate UnauthorizedException on invalid refresh token')
  });
  describe('logout', () => {
    it('should call authService.logout with user ID from request')
    it('should return success message')
  });
  describe('getMe', () => {
    it('should return req.user (SafeUser)')
  });
  describe('getAdminDashboard', () => {
    it('should return admin access message')
  });
});
```
- **Mocking Strategy**: Mock `AuthService`, use `Test.createTestingModule()`

---

### Step 22: Write Unit Tests -- Strategies and Guards (SCRUM-7 + SCRUM-8 + SCRUM-9)

- **Files**:
  - `src/auth/tests/jwt.strategy.spec.ts`
  - `src/auth/tests/google.strategy.spec.ts`
  - `src/auth/tests/github.strategy.spec.ts`
  - `src/auth/tests/roles.guard.spec.ts`
- **Action**: Test all strategies and guards

#### 22.1 JWT Strategy
```typescript
describe('JwtStrategy', () => {
  it('should return SafeUser when user found')
  it('should throw UnauthorizedException when user not found')
});
```

#### 22.2 Google Strategy
```typescript
describe('GoogleStrategy', () => {
  it('should call authService.validateOAuthUser with correct profile and call done')
  it('should call done with error when no email provided')
  it('should call done with error when authService throws')
});
```

#### 22.3 GitHub Strategy
```typescript
describe('GitHubStrategy', () => {
  it('should call authService.validateOAuthUser with correct profile and call done')
  it('should split displayName into firstName and lastName')
  it('should call done with error when no email provided')
  it('should call done with error when authService throws')
});
```

#### 22.4 Roles Guard
```typescript
describe('RolesGuard', () => {
  it('should allow access when no roles are required')
  it('should allow access when user has required role')
  it('should throw ForbiddenException when user lacks required role')
  it('should throw ForbiddenException when no user in request')
  it('should always allow SUPERADMIN regardless of required roles')
});
```

---

### Step 23: Write Unit Tests -- Users Service and HttpExceptionFilter (SCRUM-6 + SCRUM-7 + SCRUM-8 + SCRUM-9)

- **Files**:
  - `src/users/tests/users.service.spec.ts`
  - `src/common/filters/tests/http-exception.filter.spec.ts`
- **Action**: Test all user CRUD operations, account management, and the global exception filter

#### 23.1 Users Service
```typescript
describe('UsersService', () => {
  describe('findByEmail', () => {
    it('should return user when found')
    it('should return null when not found')
  });
  describe('findById', () => {
    it('should return user when found')
    it('should return null when not found')
  });
  describe('create', () => {
    it('should create user and return it')
    it('should throw ConflictException on duplicate email (P2002)')
    it('should throw InternalServerErrorException on other Prisma errors')
  });
  describe('updateRefreshToken', () => {
    it('should update refresh token for user')
    it('should set null to invalidate token')
  });
  describe('incrementFailedAttempts', () => {
    it('should increment failedAttempts by 1')
  });
  describe('resetFailedAttempts', () => {
    it('should reset failedAttempts to 0 and lockedUntil to null')
  });
  describe('lockAccount', () => {
    it('should set lockedUntil to 15 minutes from now')
  });
  describe('findOrCreateByOAuth', () => {
    it('should return existing user when provider and providerId match')
    it('should link OAuth to existing local user with matching email')
    it('should create new user on first OAuth login')
    it('should update empty profile fields from OAuth data')
  });
  describe('findAll', () => {
    it('should return paginated list of safe users')
    it('should filter by role')
    it('should search by email, firstName, lastName')
  });
  describe('updateProfile', () => {
    it('should update firstName, lastName, avatarUrl')
  });
  describe('changePassword', () => {
    it('should change password when current password is correct')
    it('should throw UnauthorizedException when current password is incorrect')
    it('should throw ForbiddenException for OAuth-only accounts')
    it('should invalidate refresh token after password change')
  });
  describe('adminUpdateUser', () => {
    it('should update user role and isActive')
    it('should throw NotFoundException when user not found')
    it('should throw ForbiddenException when targeting SUPERADMIN')
    it('should throw ForbiddenException when non-SUPERADMIN assigns ADMIN role')
  });
  describe('softDelete', () => {
    it('should set isActive to false')
    it('should throw NotFoundException when user not found')
    it('should throw ForbiddenException when targeting SUPERADMIN')
  });
});
```
- **Mocking Strategy**: Mock `PrismaService` with jest mocks for `user.findUnique`, `user.create`, `user.update`, `user.findMany`, `user.count`

#### 23.2 HttpExceptionFilter (SCRUM-6)

> **FIX (Audit D-08)**: HttpExceptionFilter has its own spec file at `src/common/filters/tests/http-exception.filter.spec.ts`.

```typescript
describe('HttpExceptionFilter', () => {
  it('should return standardized error format for HttpException')
  it('should return VALIDATION_ERROR code for 400 responses')
  it('should return UNAUTHORIZED code for 401 responses')
  it('should return FORBIDDEN code for 403 responses')
  it('should return NOT_FOUND code for 404 responses')
  it('should return CONFLICT code for 409 responses')
  it('should return INTERNAL_SERVER_ERROR for non-HTTP exceptions')
  it('should include validation details when available')
});
```

---

### Step 24: Write E2E Tests (All Sub-tasks)

> **FIX (Audit D-09)**: E2E tests are documented as a formal step.

- **File**: `test/app.e2e-spec.ts`
- **Action**: Integration tests covering full request lifecycle
- **Test Scenarios**:
```typescript
describe('Auth E2E', () => {
  it('POST /auth/register -- 201 + tokens + SafeUser')
  it('POST /auth/register -- 409 on duplicate email')
  it('POST /auth/register -- 400 on weak password')
  it('POST /auth/login -- 200 + tokens + SafeUser')
  it('POST /auth/login -- 401 on wrong password')
  it('POST /auth/login -- 403 after 5 failures (locked)')
  it('POST /auth/refresh -- 200 + new tokens')
  it('POST /auth/refresh -- 401 on expired token')
  it('POST /auth/logout -- 200, refresh token nullified')
  it('GET /auth/me with valid token -- 200 + SafeUser')
  it('GET /auth/me without token -- 401')
  it('GET /auth/admin as USER -- 403')
  it('GET /auth/admin as ADMIN -- 200')
});
```

---

### Step 25: Update Technical Documentation

- **Action**: Review and update technical documentation for all changes
- **Implementation Steps**:
  1. **Update `ai-specs/specs/api-spec.yml`**: Add all auth endpoints:
     - `POST /auth/register` -- request: RegisterDto, response: tokens + SafeUser
     - `POST /auth/login` -- request: LoginDto, response: tokens + SafeUser
     - `POST /auth/refresh` -- request: RefreshTokenDto, response: new tokens
     - `POST /auth/logout` -- protected, no body, 200
     - `GET /auth/me` -- protected, response: SafeUser
     - `GET /auth/admin` -- protected + ADMIN role, response: message
     - `GET /auth/google` -- redirect to Google
     - `GET /auth/google/callback` -- redirect to frontend
     - `GET /auth/github` -- redirect to GitHub
     - `GET /auth/github/callback` -- redirect to frontend
     - `GET /users` -- protected + ADMIN, paginated list
     - `GET /users/:id` -- protected + ADMIN, response: SafeUser
     - `PATCH /users/me` -- protected, request: UpdateProfileDto
     - `PATCH /users/me/password` -- protected, request: ChangePasswordDto
     - `PATCH /users/:id` -- protected + ADMIN, request: AdminUpdateUserDto
     - `DELETE /users/:id` -- protected + ADMIN, soft-delete
  2. **Verify `ai-specs/specs/data-model.md`**: Confirm User entity documentation matches the implementation (fields, validation rules, business invariants)
  3. **Create `.env.example`**: Template with all required environment variables
- **References**: Follow `ai-specs/specs/documentation-standards.mdc` -- all documentation in English
- **Notes**: MANDATORY step. Do not skip documentation updates.

---

## Implementation Order

1. **Step 0**: Create feature branch `feature/SCRUM-5-backend`
2. **Step 1**: Scaffold NestJS project
3. **Step 2**: Install all dependencies
4. **Step 3**: Configure Prisma & User schema + run migration
5. **Step 4**: Create Prisma module (PrismaPg adapter)
6. **Step 5**: Create User enums, entity, and interfaces
7. **Step 6**: Create Users module and service
8. **Step 7**: Create RegisterDto with validation
9. **Step 8**: Create LoginDto and RefreshTokenDto
10. **Step 9**: Create Auth service (register + login + refresh + OAuth + logout)
11. **Step 10**: Create JWT strategy
12. **Step 11**: Create Google and GitHub OAuth strategies
13. **Step 12**: Create guards (JWT, Google, GitHub, Roles)
14. **Step 13**: Create @Roles decorator
15. **Step 14**: Create Auth controller (all endpoints)
16. **Step 15**: Create Users controller
17. **Step 16**: Create Auth module + wire into AppModule
18. **Step 17**: Create global exception filter
19. **Step 18**: Configure main.ts (CORS, pipes, filters, Swagger)
20. **Step 19**: Configure Jest coverage thresholds
21. **Step 20**: Write Auth service tests
22. **Step 21**: Write Auth controller tests
23. **Step 22**: Write strategy and guard tests
24. **Step 23**: Write Users service tests + HttpExceptionFilter tests
25. **Step 24**: Write E2E tests
26. **Step 25**: Update technical documentation

---

## Testing Checklist

### Unit Tests -- Auth Service

- [ ] `register` -- successful registration returns JWT pair + SafeUser
- [ ] `register` -- password hashed with bcrypt 12 rounds
- [ ] `register` -- SafeUser omits passwordHash and refreshToken
- [ ] `register` -- duplicate email throws ConflictException (409)
- [ ] `login` -- valid credentials return JWT pair + SafeUser
- [ ] `login` -- resets failed attempts after successful login (when count > 0)
- [ ] `login` -- user not found throws UnauthorizedException (401)
- [ ] `login` -- locked account throws ForbiddenException (403)
- [ ] `login` -- expired lock resets failed attempts
- [ ] `login` -- OAuth-only user (no passwordHash) throws UnauthorizedException (401)
- [ ] `login` -- wrong password throws UnauthorizedException (401)
- [ ] `login` -- wrong password increments failed attempts
- [ ] `login` -- 5th failed attempt locks account and throws ForbiddenException (403)
- [ ] `refreshTokens` -- valid token returns new JWT pair
- [ ] `refreshTokens` -- invalid JWT throws UnauthorizedException (401)
- [ ] `refreshTokens` -- user not found throws UnauthorizedException (401)
- [ ] `refreshTokens` -- no stored token throws UnauthorizedException (401)
- [ ] `refreshTokens` -- hash mismatch throws UnauthorizedException (401)
- [ ] `validateOAuthUser` -- creates/finds user and returns JWT pair + SafeUser
- [ ] `validateOAuthUser` -- stores hashed refresh token
- [ ] `logout` -- sets refresh token to null

### Unit Tests -- Auth Controller

- [ ] `register` -- returns 201 on success
- [ ] `register` -- propagates ConflictException as 409
- [ ] `login` -- returns 200 on success
- [ ] `login` -- propagates UnauthorizedException as 401
- [ ] `login` -- propagates ForbiddenException as 403
- [ ] `refresh` -- returns new tokens
- [ ] `logout` -- returns success message
- [ ] `getMe` -- returns req.user (SafeUser)
- [ ] `getAdminDashboard` -- returns admin access message

### Unit Tests -- Strategies

- [ ] `JwtStrategy.validate` -- returns SafeUser when user found
- [ ] `JwtStrategy.validate` -- throws UnauthorizedException when user not found
- [ ] `GoogleStrategy.validate` -- validates OAuth user with correct profile
- [ ] `GoogleStrategy.validate` -- errors when no email from Google
- [ ] `GitHubStrategy.validate` -- validates OAuth user with correct profile
- [ ] `GitHubStrategy.validate` -- splits displayName into first/last name
- [ ] `GitHubStrategy.validate` -- errors when no email from GitHub

### Unit Tests -- Guards

- [ ] `RolesGuard` -- allows when no roles required
- [ ] `RolesGuard` -- allows when user has required role
- [ ] `RolesGuard` -- denies when user lacks role (403)
- [ ] `RolesGuard` -- denies when no user in request (403)
- [ ] `RolesGuard` -- SUPERADMIN always allowed

### Unit Tests -- Users Service

- [ ] `findByEmail` -- returns user / returns null
- [ ] `findById` -- returns user / returns null
- [ ] `create` -- creates and returns user
- [ ] `create` -- P2002 throws ConflictException
- [ ] `updateRefreshToken` -- updates / nullifies token
- [ ] `incrementFailedAttempts` -- increments by 1
- [ ] `resetFailedAttempts` -- resets to 0 and clears lockedUntil
- [ ] `lockAccount` -- sets lockedUntil 15 min from now
- [ ] `findOrCreateByOAuth` -- returns existing user / links to local / creates new
- [ ] `changePassword` -- validates current, hashes new, revokes sessions
- [ ] `adminUpdateUser` -- respects SUPERADMIN policy
- [ ] `softDelete` -- sets isActive to false, rejects SUPERADMIN targets

### Unit Tests -- HttpExceptionFilter

- [ ] Returns standardized error format for HttpException
- [ ] Maps 400 to `VALIDATION_ERROR` code
- [ ] Maps 401 to `UNAUTHORIZED` code
- [ ] Maps 403 to `FORBIDDEN` code
- [ ] Maps 404 to `NOT_FOUND` code
- [ ] Maps 409 to `CONFLICT` code
- [ ] Returns `INTERNAL_SERVER_ERROR` for non-HTTP exceptions
- [ ] Includes validation details when available

### Validation Tests (via ValidationPipe + DTOs)

- [ ] Missing email returns 400
- [ ] Invalid email format returns 400
- [ ] Missing password returns 400
- [ ] Password < 8 chars returns 400
- [ ] Password without uppercase returns 400
- [ ] Password without lowercase returns 400
- [ ] Password without number returns 400
- [ ] Password without special char returns 400
- [ ] Extra fields are stripped (whitelist)
- [ ] Unknown fields return 400 (forbidNonWhitelisted)

### E2E Tests

- [ ] Register with valid data -- 201 + tokens
- [ ] Register with existing email -- 409
- [ ] Register with weak password -- 400 with details
- [ ] Login with valid credentials -- 200 + tokens
- [ ] Login with wrong password -- 401
- [ ] Login after 5 failures -- 403 (locked)
- [ ] Refresh with valid token -- 200 + new tokens
- [ ] Refresh with expired token -- 401
- [ ] Logout -- 200, refresh token nullified
- [ ] GET /auth/me with valid token -- 200 + SafeUser
- [ ] GET /auth/me without token -- 401
- [ ] GET /auth/admin as USER -- 403
- [ ] GET /auth/admin as ADMIN -- 200
- [ ] Google OAuth flow -- redirect + callback + tokens
- [ ] GitHub OAuth flow -- redirect + callback + tokens
- [ ] Verify User row in PostgreSQL after registration
- [ ] Verify passwordHash is bcrypt hash (not plain text)
- [ ] Verify refreshToken in DB is hashed (not raw JWT)

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error description",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "details": ["field-level errors if applicable"]
  }
}
```

### HTTP Status Code Mapping

| Status | Code | When |
|--------|------|------|
| 200 | - | Successful login, refresh, logout, profile access |
| 201 | - | Successful registration |
| 302 | - | OAuth redirects |
| 400 | `VALIDATION_ERROR` | Invalid input (DTO validation fails) |
| 401 | `UNAUTHORIZED` | Invalid credentials, expired/invalid token, user not found |
| 403 | `FORBIDDEN` | Account locked, insufficient role, SUPERADMIN protection |
| 404 | `NOT_FOUND` | User not found (admin endpoints) |
| 409 | `CONFLICT` | Email already registered |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected server error |

### Known Code Smell

> **FIX (Audit D-10)**: `GET /users/:id` currently returns HTTP 200 with an error object in the response body when the user is not found, instead of returning HTTP 404. This is a known code smell to be addressed in a future refactor. The endpoint should throw `NotFoundException` and let `HttpExceptionFilter` return 404.

---

## Non-Functional Requirements

### Performance

| Metric | Target |
|--------|--------|
| Token generation (JWT sign) | < 100ms |
| Password hashing (bcrypt) | ~250-500ms with 12 rounds (intentionally slow for security) |
| Database queries | < 50ms per query (single user lookups) |

### Security

| Requirement | Implementation |
|-------------|---------------|
| Password hashing | bcrypt with 12 salt rounds (OWASP recommended minimum: 10) |
| JWT access token TTL | 15 minutes (short-lived, stateless) |
| JWT refresh token TTL | 7 days (stored hashed in DB) |
| Brute force protection | 5 failed attempts triggers 15-minute account lockout |
| SUPERADMIN bypass | SUPERADMIN role bypasses all `RolesGuard` checks |
| SUPERADMIN protection | SUPERADMIN accounts cannot be modified/deleted by ADMIN |
| OAuth secrets | Environment variables only, never in code |
| Refresh token storage | Hashed with bcrypt, never stored as raw JWT |
| Password in responses | Never returned -- `SafeUser` type strips `passwordHash` and `refreshToken` |
| CORS | Restricted to `FRONTEND_URL` origin only |

### Coverage Thresholds

| Metric | Threshold |
|--------|-----------|
| Functions | >= 90% |
| Lines | >= 90% |
| Statements | >= 90% |
| Branches | >= 85% |

### Coding Standards

- All code in English (variables, functions, comments, error messages)
- All tests follow AAA pattern (Arrange-Act-Assert)
- `jest.clearAllMocks()` in every `beforeEach()`
- `ValidationPipe` with `whitelist` and `forbidNonWhitelisted` enabled globally
- No business logic in controllers -- controllers are thin HTTP handlers
- OAuth secrets in environment variables ONLY, never in code
- HTTPS only in production

---

## Dependencies

### Production

| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/common` | ^11.0.1 | NestJS core decorators and utilities |
| `@nestjs/core` | ^11.0.1 | NestJS core framework |
| `@nestjs/platform-express` | ^11.0.1 | Express HTTP adapter |
| `@nestjs/jwt` | ^11.0.2 | JWT token generation/verification |
| `@nestjs/passport` | ^11.0.5 | Passport integration |
| `@nestjs/swagger` | ^11.2.6 | OpenAPI/Swagger documentation |
| `passport` | ^0.7.0 | Authentication middleware |
| `passport-jwt` | ^4.0.1 | JWT strategy |
| `passport-google-oauth20` | ^2.0.0 | Google OAuth2 strategy |
| `passport-github2` | ^0.1.12 | GitHub OAuth2 strategy |
| `bcrypt` | ^6.0.0 | Password hashing |
| `class-validator` | ^0.14.3 | DTO validation decorators |
| `class-transformer` | ^0.5.1 | DTO transformation |
| `@prisma/client` | ^7.4.0 | Database client |
| `@prisma/adapter-pg` | ^7.4.1 | PrismaPg driver adapter (required for driverless datasource) |
| `pg` | ^8.18.0 | PostgreSQL native driver (required by PrismaPg adapter) |
| `reflect-metadata` | ^0.2.2 | Decorator metadata |
| `rxjs` | ^7.8.1 | Reactive extensions |

### Development

| Package | Version | Purpose |
|---------|---------|---------|
| `prisma` | ^7.4.0 | Prisma CLI |
| `dotenv` | ^17.3.1 | Environment variable loading (dev only) |
| `@types/passport-jwt` | ^4.0.1 | TypeScript types |
| `@types/bcrypt` | ^6.0.0 | TypeScript types |
| `@types/passport-google-oauth20` | ^2.0.17 | TypeScript types |
| `@types/passport-github2` | ^1.2.9 | TypeScript types |
| `@types/pg` | ^8.16.0 | TypeScript types |
| `@nestjs/testing` | ^11.0.1 | NestJS test utilities |
| `@nestjs/cli` | ^11.0.0 | NestJS CLI |
| `@nestjs/schematics` | ^11.0.0 | NestJS code generation |
| `jest` | ^30.0.0 | Test runner |
| `ts-jest` | ^29.2.5 | TypeScript Jest transformer |
| `supertest` | ^7.0.0 | HTTP assertion library (E2E tests) |
| `@types/supertest` | ^6.0.2 | TypeScript types |
| `typescript` | ^5.7.3 | TypeScript compiler |
| `eslint` | ^9.18.0 | Linter |
| `prettier` | ^3.4.2 | Code formatter |

### Prerequisites

| Tool | Required |
|------|----------|
| Node.js | >= 18.x |
| PostgreSQL | >= 14.x (local or Docker) |
| npm | >= 9.x |

---

## Documentation Updates

| Document | Location | Changes |
|----------|----------|---------|
| `ai-specs/specs/api-spec.yml` | `paths` section | Add all 16 auth and user management endpoints with request/response schemas |
| `ai-specs/specs/data-model.md` | User entity section | Verify User entity documentation matches implementation (fields, validation rules, business invariants) |
| `.env.example` | Project root | Template with all required environment variables (DATABASE_URL, JWT_SECRET, OAuth credentials, etc.) |

### Environment Variables Required

```
DATABASE_URL=postgresql://...
JWT_SECRET=min-32-character-secret
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
PORT=3000
FRONTEND_URL=http://localhost:3001
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
```

---

## Definition of Done

### Code Quality
- [ ] TypeScript strict mode enabled
- [ ] No `any` types used (except test mocks where justified)
- [ ] All functions have explicit return types
- [ ] Naming follows conventions (PascalCase classes, camelCase functions)
- [ ] All code in English
- [ ] ESLint passes without errors
- [ ] Prettier formatting applied

### Functionality
- [ ] `POST /auth/register` works with valid data (201 + tokens + SafeUser)
- [ ] `POST /auth/login` works with valid credentials (200 + tokens + SafeUser)
- [ ] `POST /auth/refresh` rotates tokens correctly
- [ ] `POST /auth/logout` invalidates refresh token
- [ ] `GET /auth/me` returns SafeUser without sensitive fields
- [ ] `GET /auth/admin` returns 403 for USER, 200 for ADMIN
- [ ] Google OAuth flow completes (redirect + callback + frontend redirect with tokens)
- [ ] GitHub OAuth flow completes (redirect + callback + frontend redirect with tokens)
- [ ] Account locking triggers after 5 failed attempts
- [ ] Password hashed with bcrypt (12 rounds), never stored plain text
- [ ] Refresh token stored hashed in DB, never raw JWT

### Testing
- [ ] All unit tests pass
- [ ] Coverage >= 90% (functions, lines, statements), >= 85% (branches)
- [ ] Tests use `Test.createTestingModule()` for proper NestJS DI
- [ ] Mocking at service boundaries (not implementation details)
- [ ] AAA pattern in every test
- [ ] HttpExceptionFilter spec passes (`src/common/filters/tests/http-exception.filter.spec.ts`)
- [ ] E2E tests pass (`test/app.e2e-spec.ts`)

### Integration
- [ ] Prisma migrations applied successfully (both `0001_init` and `20260225230005_add_profile_fields_and_superadmin`)
- [ ] User table created in PostgreSQL with correct schema
- [ ] PrismaPg adapter connects successfully via `connectionString`
- [ ] App starts without errors: `npm run start:dev`
- [ ] Swagger docs accessible at `/api/docs`

### Documentation
- [ ] API spec updated with all auth and user endpoints
- [ ] Data model documentation confirmed accurate
- [ ] `.env.example` complete with all required variables

### Deployment Readiness
- [ ] Feature branch `feature/SCRUM-5-backend` pushed to remote
- [ ] PR created and linked to SCRUM-5 with subtask references (SCRUM-6, SCRUM-7, SCRUM-8, SCRUM-9)
- [ ] All CI checks pass (lint, test, build)

---

## Cross-Module Dependencies

- `AuthModule` imports `UsersModule` to access `UsersService`
- `PrismaModule` is global -- available to all modules
- `UsersController` imports guards from `AuthModule` (JwtAuthGuard, RolesGuard)

## Permissions

For this ticket, access control uses a simple role-based model (USER, ADMIN, SUPERADMIN). No granular `Permission` entity seeding is needed at this stage -- that is deferred to SCRUM-30 (Layer 8: Advanced RBAC & Permissions).

## Next Steps After Implementation

1. **Run all tests**: `npm run test -- --coverage`
2. **Verify coverage**: Must be >= 90% on functions/lines/statements, >= 85% on branches
3. **Run linting**: `npm run lint`
4. **Manual test**: `npm run start:dev` -- POST to `/auth/register`, POST to `/auth/login`, etc.
5. **Stage and commit**: Only files relevant to this ticket
6. **Push**: `git push -u origin feature/SCRUM-5-backend`
7. **Create PR**: Linked to SCRUM-5 with subtask references (SCRUM-6, SCRUM-7, SCRUM-8, SCRUM-9)
8. **Next ticket**: SCRUM-22 (Auth Security Hardening & Enterprise Features) builds on top of this
