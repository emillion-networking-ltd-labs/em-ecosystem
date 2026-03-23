import { apiClient } from "./api";
import type {
  AuthResponse,
  PasskeyResponse,
  PasskeyLoginOptionsResponse,
  PasskeyRegisterResult,
  MessageResponse,
} from "./types";

// Registration (authenticated)
export function passkeyRegisterOptions(): Promise<Record<string, unknown>> {
  return apiClient.post<Record<string, unknown>>(
    "/auth/passkeys/register/options",
    {},
  );
}

export function passkeyRegisterVerify(
  credential: Record<string, unknown>,
  name?: string,
): Promise<PasskeyRegisterResult> {
  return apiClient.post<PasskeyRegisterResult>(
    "/auth/passkeys/register/verify",
    { credential, name },
  );
}

// Login (public — no auth token needed)
export function passkeyLoginOptions(
  email?: string,
): Promise<PasskeyLoginOptionsResponse> {
  return apiClient.post<PasskeyLoginOptionsResponse>(
    "/auth/passkeys/login/options",
    email ? { email } : {},
  );
}

export function passkeyLoginVerify(
  challengeId: string,
  credential: Record<string, unknown>,
): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>("/auth/passkeys/login/verify", {
    challengeId,
    credential,
  });
}

// Management (authenticated)
export function listPasskeys(): Promise<PasskeyResponse[]> {
  return apiClient.get<PasskeyResponse[]>("/auth/passkeys");
}

export function renamePasskey(
  id: string,
  name: string,
): Promise<{ id: string; name: string }> {
  return apiClient.patch<{ id: string; name: string }>(`/auth/passkeys/${id}`, {
    name,
  });
}

export function deletePasskey(
  id: string,
  password?: string,
): Promise<MessageResponse> {
  return apiClient.deleteWithBody<MessageResponse>(`/auth/passkeys/${id}`, {
    password,
  });
}
