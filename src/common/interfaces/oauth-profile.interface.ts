import { Provider } from '../../users/enums/provider.enum';

export interface OAuthProfile {
  email: string;
  provider: Provider;
  providerId: string;
}
