import { apiClient } from "./api";
import type { MessageResponse, LinkedProvider } from "./types";

export function unlinkOAuth(
  provider: string,
  password: string,
): Promise<MessageResponse> {
  return apiClient.deleteWithBody<MessageResponse>(
    `/users/me/oauth/${provider.toLowerCase()}`,
    { password },
  );
}

export function getLinkedProviders(): Promise<LinkedProvider[]> {
  return apiClient.get<LinkedProvider[]>("/users/me/oauth");
}

export function generateLinkCode(): Promise<{ code: string }> {
  return apiClient.post<{ code: string }>("/auth/link/code", {});
}
