# EM Ecosystem

Monorepo for the EM Ecosystem platform by EMillion Networking LTD.

## Repository Structure

```
em-ecosystem-code/
├── nexacore-api/                  # Backend — NestJS 11 API (@em-ecosystem/nexacore-api)
│   ├── src/                       # Application source code
│   │   ├── auth/                  # Authentication module (JWT, OAuth, Guards)
│   │   ├── users/                 # User management module
│   │   ├── common/                # Shared utilities (decorators, filters, interfaces)
│   │   ├── prisma/                # PrismaService (global database module)
│   │   ├── app.module.ts          # Root module
│   │   └── main.ts                # Bootstrap entry point
│   ├── prisma/                    # Database schema and migrations
│   ├── test/                      # E2E tests
│   ├── package.json               # @em-ecosystem/nexacore-api
│   └── ...                        # Config files (tsconfig, eslint, prettier, nest-cli)
│
├── nexacore-dashboard/            # Dashboard — Next.js 14 (App Router) (@em-ecosystem/nexacore-dashboard)
│   ├── src/
│   │   ├── app/                   # Pages and routing
│   │   ├── components/            # UI and domain components
│   │   ├── context/               # React Context providers
│   │   ├── hooks/                 # Custom hooks
│   │   └── lib/                   # ApiClient, types, constants
│   ├── public/                    # Static assets
│   ├── package.json               # @em-ecosystem/nexacore-dashboard
│   └── ...                        # Config files (tsconfig, tailwind, next, postcss)
│
└── nexacore-website/              # Public website (planned — not yet implemented)
    └── package.json               # @em-ecosystem/nexacore-website
```

## Tech Stack

### Backend (nexacore-api/)
- **Framework**: NestJS 11 (TypeScript 5.7)
- **ORM**: Prisma 7 (PostgreSQL)
- **Auth**: JWT (access 15min + refresh 7d), bcrypt, Passport.js (Google + GitHub OAuth)
- **Validation**: class-validator + class-transformer
- **Testing**: Jest (85% branch / 90% line coverage)

### Dashboard (nexacore-dashboard/)
- **Framework**: Next.js 14 (App Router, React 18)
- **Styling**: TailwindCSS with CSS variable theming
- **State**: React Context + useReducer (AuthContext, ThemeContext, ProjectContext)
- **API**: Singleton ApiClient with automatic token refresh

## Getting Started

### Backend

```bash
cd nexacore-api
npm install
cp .env.example .env          # Configure environment variables
npx prisma generate           # Generate Prisma client
npx prisma migrate dev        # Apply database migrations
npm run start:dev              # Start dev server (port 3000)
```

### Dashboard

```bash
cd nexacore-dashboard
npm install
npm run dev                    # Start dev server (port 3001)
```

### Environment Variables (nexacore-api/.env)

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/em_ecosystem
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
PORT=3000
FRONTEND_URL=http://localhost:3001

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
```

## Scripts

### Backend (run from `nexacore-api/`)

```bash
npm run start:dev         # Development server with hot reload
npm run build             # Production build
npm test                  # Run unit tests
npm run test:cov          # Run tests with coverage
npm run test:e2e          # Run E2E tests
npm run lint              # Lint code
npm run format            # Format code with Prettier
npx prisma generate       # Generate Prisma client
npx prisma migrate dev    # Create and apply migration
npx prisma studio         # Open Prisma Studio (database GUI)
```

### Dashboard (run from `nexacore-dashboard/`)

```bash
npm run dev               # Development server (port 3001)
npm run build             # Production build
npm run start             # Production server
npm run lint              # Lint code
```

## API Endpoints

### Auth

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/auth/csrf-token` | Get CSRF token | No |
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login with email/password | No |
| POST | `/auth/refresh` | Refresh token pair | No |
| POST | `/auth/logout` | Invalidate session | Yes |
| POST | `/auth/logout-all` | Revoke all sessions | Yes |
| GET | `/auth/me` | Get current user profile | Yes |
| GET | `/auth/admin` | Admin-only endpoint | Yes (Admin) |
| GET | `/auth/google` | Initiate Google OAuth | No |
| GET | `/auth/google/callback` | Google OAuth callback | No |
| GET | `/auth/github` | Initiate GitHub OAuth | No |
| GET | `/auth/github/callback` | GitHub OAuth callback | No |
| POST | `/auth/oauth/exchange` | Exchange OAuth code for tokens | No |
| POST | `/auth/link/code` | Generate OAuth link code | Yes |
| GET | `/auth/link/google` | Link Google to account | Yes |
| GET | `/auth/link/github` | Link GitHub to account | Yes |
| POST | `/auth/verify-email` | Verify email with token | No |
| POST | `/auth/verify-email-change` | Verify email change | No |
| POST | `/auth/resend-verification` | Resend verification (auth) | Yes |
| POST | `/auth/resend-verification-public` | Resend verification (public) | No |
| POST | `/auth/forgot-password` | Request password reset | No |
| POST | `/auth/reset-password` | Reset password with token | No |
| POST | `/auth/validate-reset-token` | Validate reset token | No |
| GET | `/auth/sessions` | List active sessions | Yes |
| DELETE | `/auth/sessions/:id` | Revoke session | Yes |
| POST | `/auth/trusted-devices` | Trust current device | Yes |
| GET | `/auth/trusted-devices` | List trusted devices | Yes |
| DELETE | `/auth/trusted-devices` | Revoke all devices | Yes |
| DELETE | `/auth/trusted-devices/:id` | Revoke device | Yes |
| POST | `/auth/mfa/setup` | Initialize MFA setup | Yes |
| POST | `/auth/mfa/verify-setup` | Verify and activate MFA | Yes |
| POST | `/auth/mfa/verify-login` | Verify MFA on login | No |
| DELETE | `/auth/mfa` | Disable MFA | Yes |
| POST | `/auth/mfa/recovery-codes` | Regenerate recovery codes | Yes |
| GET | `/auth/mfa/status` | Get MFA status | Yes |
| POST | `/auth/passkeys/register/options` | Get passkey registration options | Yes |
| POST | `/auth/passkeys/register/verify` | Complete passkey registration | Yes |
| POST | `/auth/passkeys/login/options` | Get passkey login options | No |
| POST | `/auth/passkeys/login/verify` | Complete passkey login | No |
| GET | `/auth/passkeys` | List passkeys | Yes |
| PATCH | `/auth/passkeys/:id` | Update passkey name | Yes |
| DELETE | `/auth/passkeys/:id` | Delete passkey | Yes |

## Development Standards

All development follows the standards defined in `docs/`:
- Backend: `docs/backend-standards.mdc`
- API Spec: `docs/api-spec.yml`
