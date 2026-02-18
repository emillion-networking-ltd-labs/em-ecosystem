# EM Ecosystem - Backend API

NestJS backend for the EM Ecosystem platform.

## Tech Stack

- **Framework**: NestJS 11
- **ORM**: Prisma 7 (PostgreSQL)
- **Auth**: JWT (access + refresh tokens), bcrypt
- **Validation**: class-validator + class-transformer
- **Testing**: Jest with 90%+ coverage thresholds

## Project Setup

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/em_ecosystem
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
PORT=3000
FRONTEND_URL=http://localhost:3001
```

### Database

```bash
npx prisma generate
npx prisma migrate dev
```

## Running the App

```bash
# development
npm run start:dev

# production
npm run start:prod
```

## Testing

```bash
# unit tests
npm test

# test coverage
npm run test:cov
```

## API Endpoints

### Auth

| Method | Endpoint         | Description          | Auth |
|--------|------------------|----------------------|------|
| POST   | `/auth/register` | Register new user    | No   |
| POST   | `/auth/login`    | Login with email/pwd | No   |
| POST   | `/auth/refresh`  | Refresh token pair   | No   |
| POST   | `/auth/logout`   | Invalidate session   | Yes  |

#### POST /auth/register

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "StrongPass1!"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

**Response (201):**
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER",
    "provider": "LOCAL",
    "emailVerified": false
  }
}
```

#### POST /auth/login

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "StrongPass1!"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER",
    "provider": "LOCAL",
    "emailVerified": false
  }
}
```

**Brute Force Protection:**
- After 5 failed login attempts, the account is locked for 15 minutes
- Failed attempt counter resets on successful login
- Expired locks are automatically cleared on next login attempt

#### POST /auth/refresh

**Request Body:**
```json
{
  "refreshToken": "eyJhbG..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

#### POST /auth/logout

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

## Project Structure

```
src/
  auth/                    # Authentication module
    dto/                   # Data transfer objects
    guards/                # Auth guards (JwtAuthGuard)
    strategies/            # Passport strategies (JWT)
    __tests__/             # Unit tests
    auth.controller.ts     # Route handlers
    auth.service.ts        # Business logic
    auth.module.ts         # Module definition
  users/                   # Users module
    entities/              # User entity & types
    enums/                 # Role & Provider enums
    __tests__/             # Unit tests
    users.service.ts       # CRUD operations
    users.module.ts        # Module definition
  common/                  # Shared utilities
    filters/               # Exception filters
    interfaces/            # Shared interfaces
  prisma/                  # Prisma ORM integration
    prisma.service.ts      # PrismaClient wrapper
    prisma.module.ts       # Global module
  app.module.ts            # Root module
  main.ts                  # Bootstrap
prisma/
  schema.prisma            # Database schema
```

## Data Model

### User

| Field          | Type     | Description                |
|----------------|----------|----------------------------|
| id             | UUID     | Primary key                |
| email          | String   | Unique email               |
| passwordHash   | String?  | bcrypt hash (null for OAuth)|
| role           | Enum     | ADMIN, USER                |
| provider       | Enum     | LOCAL, GOOGLE, GITHUB      |
| providerId     | String?  | OAuth provider ID          |
| emailVerified  | Boolean  | Email verification status  |
| failedAttempts | Int      | Login attempt counter      |
| lockedUntil    | DateTime?| Account lock expiry        |
| refreshToken   | String?  | Hashed refresh token       |
| createdAt      | DateTime | Creation timestamp         |
| updatedAt      | DateTime | Last update timestamp      |
