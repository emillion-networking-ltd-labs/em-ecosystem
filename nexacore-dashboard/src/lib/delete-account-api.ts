import { apiClient } from "./api";
import type { MessageResponse } from "./types";

export function deleteAccount(password?: string): Promise<MessageResponse> {
  const options: RequestInit = password
    ? { body: JSON.stringify({ password }) }
    : {};
  return apiClient.delete<MessageResponse>("/users/me", options);
}
