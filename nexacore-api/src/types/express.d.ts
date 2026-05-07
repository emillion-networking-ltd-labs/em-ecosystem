// Module augmentations for Express types.
//
// Pattern: this is the canonical Express+Passport+TypeScript augmentation
// documented in @types/passport and used by Auth0 / Microsoft TS-Node-Starter
// / NestJS official samples to give boundary code (guards, filters,
// throttlers) properly-typed access to req.user and our custom req.oauthAction
// without per-call casts or @typescript-eslint/no-unsafe-* directives.
//
// Two declarations:
//
//   1. Express.User — minimal id-only contract. Concrete authenticated routes
//      use AuthenticatedRequest from common/interfaces/authenticated-request
//      to narrow to SafeUser; this baseline allows pre-auth guards (e.g.
//      OAuthLinkGuard) to set req.user = { id } without satisfying the full
//      SafeUser shape.
//
//   2. Express.Request.oauthAction — set by OAuthLinkGuard before a Passport
//      OAuth strategy fires, then read by base-oauth-auth.guard and
//      oauth-callback.filter to branch state-store / redirect behaviour.
//
// Reference: NestJS docs "Authentication" + Passport types README.

import type { OAuthAction } from '../auth/stores/oauth-state.store';

declare global {
  namespace Express {
    interface User {
      id: string;
    }

    interface Request {
      oauthAction?: OAuthAction;
    }
  }
}

export {};
