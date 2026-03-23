import { apiClient } from "./api";
import type {
  PaginatedResponse,
  SecurityEvent,
  SessionResponse,
  MessageResponse,
} from "./types";

export function getSecurityActivity(
  page = 1,
  limit = 20,
): Promise<PaginatedResponse<SecurityEvent>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  return apiClient.get<PaginatedResponse<SecurityEvent>>(
    `/users/me/security-activity?${params}`,
  );
}

export function getActiveSessions(): Promise<SessionResponse[]> {
  return apiClient.get<SessionResponse[]>("/auth/sessions");
}

export function revokeSession(sessionId: string): Promise<MessageResponse> {
  return apiClient.delete<MessageResponse>(`/auth/sessions/${sessionId}`);
}

export function revokeAllSessions(): Promise<MessageResponse> {
  return apiClient.post<MessageResponse>("/auth/logout-all", {});
}
