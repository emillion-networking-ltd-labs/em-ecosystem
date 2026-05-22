// WARNING: AUTH DOMAIN — changes require Jira ticket + owner approval (see workflow-standards.mdc §15 Auth Change-Control)

/**
 * CreateAuthIntentDto — empty body for `POST /auth/v2/intents`.
 *
 * SCRUM-497 / AUTH v2 + Tenancy v1 Phase 2.2 (D-004).
 *
 * The request brings only request meta (IP + UA), extracted in the controller
 * from `req` directly. This DTO exists to satisfy the NestJS ValidationPipe
 * contract; fields may emerge in Phase 3/4 (e.g. invitation-token attached at
 * intent creation time).
 */
export class CreateAuthIntentDto {}
