import { apiClient } from './api';
import type { MessageResponse } from './types';

export function requestEmailChange(newEmail: string, password: string): Promise<MessageResponse> {
  return apiClient.post<MessageResponse>('/users/me/email', { newEmail, password });
}
