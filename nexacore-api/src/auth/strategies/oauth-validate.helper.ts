import { OAuthStateStore, OAuthStateData } from '../stores/oauth-state.store';
import { OAuthAuthService } from '../oauth-auth.service';
import { Provider } from '../../users/enums/provider.enum';
import { ErrorMessages } from '../../common/constants/error-messages';
import { extractRequestMeta } from '../../common/utils/request-meta';

export interface OAuthProfile {
  email: string;
  provider: Provider;
  providerId: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export async function validateOAuthCallback(
  oauthStateStore: OAuthStateStore,
  oauthAuthService: OAuthAuthService,
  req: {
    query: { state?: string };
    ip?: string;
    socket?: { remoteAddress?: string };
    headers?: Record<string, string | string[]>;
  },
  oauthProfile: OAuthProfile,
  done: (error: Error | null, user?: unknown) => void,
): Promise<void> {
  const state = req.query?.state;
  if (!state) {
    done(new Error(ErrorMessages.auth.AUTHENTICATION_FAILED), undefined);
    return;
  }

  const stateData: OAuthStateData | null =
    await oauthStateStore.validate(state);
  if (!stateData) {
    done(new Error(ErrorMessages.auth.AUTHENTICATION_FAILED), undefined);
    return;
  }

  const requestMeta = extractRequestMeta(req);

  try {
    if (stateData.action === 'link' && stateData.userId) {
      const result = await oauthAuthService.validateOAuthLink(
        stateData.userId,
        oauthProfile,
        requestMeta,
      );
      done(null, result);
    } else {
      const result = await oauthAuthService.validateOAuthUser(
        oauthProfile,
        requestMeta,
        requestMeta,
      );
      done(null, result);
    }
  } catch (err) {
    done(err as Error, undefined);
  }
}
