// WARNING: AUTH DOMAIN — changes require Jira ticket + owner approval (see workflow-standards.mdc §15 Auth Change-Control)

import { createOAuthAuthGuard } from './base-oauth-auth.guard';

export const GitHubAuthGuard = createOAuthAuthGuard('github');
