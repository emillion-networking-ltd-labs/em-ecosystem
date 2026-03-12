import { createOAuthAuthGuard } from './base-oauth-auth.guard';

export const GitHubAuthGuard = createOAuthAuthGuard('github');
