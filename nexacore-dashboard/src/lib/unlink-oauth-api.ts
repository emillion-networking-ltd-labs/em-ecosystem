import { apiClient } from './api';
import type { MessageResponse } from './types';

export function unlinkOAuth(password: string): Promise<MessageResponse> {
  return apiClient.delete<MessageResponse>('/users/me/oauth', {
    body: JSON.stringify({ password }),
  });
}
