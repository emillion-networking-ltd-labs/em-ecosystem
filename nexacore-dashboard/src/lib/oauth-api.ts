import { apiClient } from "./api";
import type { MessageResponse } from "./types";

export function unlinkOAuth(
  provider: string,
  password: string,
): Promise<MessageResponse> {
  return apiClient.deleteWithBody<MessageResponse>(
    `/users/me/oauth/${provider.toLowerCase()}`,
    { password },
  );
}

export function generateLinkCode(): Promise<{ code: string }> {
  return apiClient.post<{ code: string }>("/auth/link/code", {});
}
